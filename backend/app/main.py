"""
NexusFlow — FastAPI Backend Intelligence Service

Core real-time supply-chain intelligence API for the Nebius x NVIDIA Global AI Hackathon.
Integrates:
  - Phase 1: Real-time dual-source ingestion & deterministic/semantic normalization
  - Phase 2A: Semantic embeddings (local 384-dim ONNX) & ChromaDB persistent vector memory
  - Phase 2B: Historical NetworkX MultiDiGraph for entity/relationship weighting
  - Phase 3: Vector-grounded RAG retrieval of historical parallel disruptions
  - Phase 4: NVIDIA Nemotron inference hosted on Nebius Token Factory for
             causality reasoning, downstream propagation, and explicit uncertainty boundaries
  - Phase 5: REST API endpoints for 3D Globe visualization, Master Graph, and intelligence dashboard
"""

import sys
import os
import asyncio
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field

# Ensure the backend directory is in sys.path
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware

import config
from database import MasterDB
from vector_store import VectorStore
from master_graph import MasterGraph
from embeddings import load_embedding_model, encode_query
from nebius_client import NebiusNemotronClient
from rag_service import RAGService
from ingestion import run_phase_1, relevance_monitor
from phase2 import run_phase2a, run_phase2b
from app.api.graph_api import router as graph_router
import app.api.graph_api as graph_api_module

# Optional legacy normalization imports
try:
    from app.services.normalization import (
        query_master_events,
        query_event_by_uid,
        get_pipeline_stats,
        init_database,
    )
except ImportError:
    query_master_events = None
    query_event_by_uid = None
    get_pipeline_stats = None
    init_database = None

logger = logging.getLogger("nexusflow.api")

app = FastAPI(
    title="NexusFlow Backend",
    description="Real-time AI Supply-Chain Intelligence Platform powered by NVIDIA Nemotron & Nebius Token Factory",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS Middleware — Allows React/Vite dashboard and 3D globe connections
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router)

# ---------------------------------------------------------------------------
# Global application state
# ---------------------------------------------------------------------------
app_state: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Pydantic Request Models
# ---------------------------------------------------------------------------

class RAGQueryRequest(BaseModel):
    query: str = Field(..., description="Query or disruption headline to analyze", example="Red Sea shipping disruption and crude oil impacts")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of historical parallels to retrieve")
    event_category: Optional[str] = Field(default=None, description="Optional category filter (geopolitical, logistics, weather, industrial, etc.)")
    current_event: Optional[Dict[str, Any]] = Field(default=None, description="Optional current event payload to analyze instead of raw query")


class PipelineRunRequest(BaseModel):
    keywords: Optional[List[str]] = Field(default=None, description="Optional keywords for NewsAPI query")


# ---------------------------------------------------------------------------
# Background Ingestion Pipeline
# ---------------------------------------------------------------------------

async def _run_startup_pipeline():
    """Background task: Run Phase 1 → Phase 2A → Phase 2B sequentially."""
    logger.info("Background pipeline task started (Phase 1 → Phase 2A → Phase 2B)...")

    # Phase 1 — Ingestion & Normalization
    try:
        await run_phase_1()
        logger.info("Phase 1 ingestion complete.")
    except Exception as e:
        logger.warning(f"Phase 1 ingestion background run encountered: {e}")

    # Phase 2A — Embeddings & ChromaDB storage
    try:
        await run_phase2a()
        logger.info("Phase 2A embedding complete.")
    except Exception as e:
        logger.warning(f"Phase 2A embedding background run encountered: {e}")

    # Phase 2B — Master Graph Construction
    try:
        master_graph = run_phase2b()
        if master_graph:
            app_state["master_graph"] = master_graph
            graph_api_module.master_graph_instance = master_graph
        logger.info("Phase 2B master graph update complete.")
    except Exception as e:
        logger.warning(f"Phase 2B master graph background run encountered: {e}")


# ---------------------------------------------------------------------------
# Startup & Shutdown Events
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    """
    On server startup:
    1. Initialize database schemas
    2. Load embedding model (local 384-dim ONNX)
    3. Initialize MasterGraph & VectorStore into app_state
    4. Initialize RAGService
    5. Trigger background pipeline (non-blocking)
    """
    logger.info("NexusFlow Backend starting up...")

    # Initialize legacy DB if available
    if init_database:
        try:
            init_database(fresh=False)
        except Exception as e:
            logger.debug(f"Legacy database initialization skipped: {e}")

    # Initialize MasterDB
    try:
        db = MasterDB()
        app_state["db"] = db
        logger.info("MasterDB initialized.")

        # Check if database has articles; if empty, auto-seed canonical dataset immediately
        try:
            cursor = db.conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM articles")
            count = cursor.fetchone()[0]
            if count == 0:
                logger.info("MasterDB is empty on startup. Auto-seeding canonical disruption dataset...")
                from seed_sample_articles import sample_articles
                for art in sample_articles:
                    db.insert_article(art)
                logger.info(f"Auto-seeded {len(sample_articles)} canonical disruption articles into MasterDB.")
            else:
                logger.info(f"MasterDB contains {count} existing articles.")
        except Exception as seed_err:
            logger.error(f"Failed to auto-seed articles: {seed_err}")
    except Exception as e:
        logger.error(f"Failed to initialize MasterDB: {e}")

    # Initialize Embedding model
    try:
        load_embedding_model()
        logger.info("Local ONNX embedding model loaded.")
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")

    # Initialize VectorStore
    try:
        vs = VectorStore()
        app_state["vector_store"] = vs
        logger.info(f"VectorStore loaded ({vs.count()} items).")
        if vs.count() == 0:
            logger.info("VectorStore is empty. Indexing canonical articles into ChromaDB...")
            try:
                await run_phase2a()
                logger.info(f"VectorStore now populated ({vs.count()} items).")
            except Exception as ve:
                logger.error(f"Auto-indexing VectorStore failed: {ve}")
    except Exception as e:
        logger.error(f"Failed to load VectorStore: {e}")

    # Initialize MasterGraph
    try:
        mg = MasterGraph()
        app_state["master_graph"] = mg
        graph_api_module.master_graph_instance = mg
        logger.info(f"MasterGraph loaded ({mg.graph.number_of_nodes()} nodes, {mg.graph.number_of_edges()} edges).")
        if mg.graph.number_of_nodes() == 0:
            logger.info("MasterGraph is empty. Constructing initial Master Graph...")
            try:
                mg = run_phase2b()
                if mg:
                    app_state["master_graph"] = mg
                    graph_api_module.master_graph_instance = mg
                    logger.info(f"MasterGraph now populated ({mg.graph.number_of_nodes()} nodes, {mg.graph.number_of_edges()} edges).")
            except Exception as ge:
                logger.error(f"Auto-constructing MasterGraph failed: {ge}")
    except Exception as e:
        logger.error(f"Failed to load MasterGraph: {e}")

    # Initialize Nebius Client & RAG Service
    try:
        nebius_client = NebiusNemotronClient()
        app_state["nebius_client"] = nebius_client
        app_state["rag_service"] = RAGService(
            db=app_state.get("db"),
            vector_store=app_state.get("vector_store"),
            master_graph=app_state.get("master_graph"),
            nebius_client=nebius_client,
        )
        logger.info("RAGService & NebiusNemotronClient initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize RAGService: {e}")

    # Start non-blocking background pipeline
    asyncio.create_task(_run_startup_pipeline())
    logger.info("NexusFlow Backend HTTP endpoints active at http://127.0.0.1:8000")


# ============================================================================
# Core Health & System Status
# ============================================================================

@app.get("/")
@app.get("/health")
async def health_check():
    """
    Health check endpoint returning system status and component readiness.
    """
    mg: Optional[MasterGraph] = app_state.get("master_graph")
    vs: Optional[VectorStore] = app_state.get("vector_store")
    nc: Optional[NebiusNemotronClient] = app_state.get("nebius_client")

    return {
        "status": "healthy",
        "service": "NexusFlow Backend",
        "version": "1.0.0",
        "hackathon": "Nebius x NVIDIA Global AI Hackathon",
        "track": "Best Apps and Agents",
        "nebius_integration": {
            "configured": nc.is_live if nc else False,
            "base_url": nc.base_url if nc else config.NEBIUS_BASE_URL,
            "model": nc.model if nc else config.NEBIUS_MODEL,
            "mode": "live_token_factory" if (nc and nc.is_live) else "fixture_demonstration_mode",
        },
        "components": {
            "master_db": "active",
            "vector_store_documents": vs.count() if vs else 0,
            "master_graph_nodes": mg.graph.number_of_nodes() if mg else 0,
            "master_graph_edges": mg.graph.number_of_edges() if mg else 0,
        },
    }


# ============================================================================
# Core Hackathon Feature: RAG Historical Retrieval & Nemotron Impact Analysis
# ============================================================================

@app.post("/api/rag/analyze")
async def analyze_supply_chain_impact(request: RAGQueryRequest):
    """
    Core RAG Supply-Chain Intelligence Endpoint.
    1. Embeds query/event into semantic space
    2. Retrieves top-k historical parallel disruptions from ChromaDB
    3. Reconstructs structured context from SQLite master.db
    4. Prompts NVIDIA Nemotron via Nebius Token Factory for evidence-backed downstream impact reasoning
    5. Computes graph highlighting for 3D globe visualization
    """
    rag_service: Optional[RAGService] = app_state.get("rag_service")
    if not rag_service:
        # Lazy initialize if needed
        rag_service = RAGService(
            db=app_state.get("db"),
            vector_store=app_state.get("vector_store"),
            master_graph=app_state.get("master_graph"),
            nebius_client=app_state.get("nebius_client"),
        )
        app_state["rag_service"] = rag_service

    try:
        response = await rag_service.query_intelligence_async(
            query=request.query,
            top_k=request.top_k,
            event_category=request.event_category,
            current_event_payload=request.current_event,
        )
        return response
    except Exception as e:
        logger.error(f"RAG impact analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"RAG analysis failed: {str(e)}")


@app.get("/api/query")
async def query_articles(
    query: str = Query(..., description="Semantic search query"),
    top_k: int = Query(default=10, ge=1, le=50),
    event_category: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
):
    """
    Search historical supply-chain disruption events by semantic similarity.
    Fast vector retrieval without LLM token generation latency.
    """
    rag_service: Optional[RAGService] = app_state.get("rag_service")
    if not rag_service:
        rag_service = RAGService(
            db=app_state.get("db"),
            vector_store=app_state.get("vector_store"),
            master_graph=app_state.get("master_graph"),
            nebius_client=app_state.get("nebius_client"),
        )
        app_state["rag_service"] = rag_service

    try:
        effective_category = category or event_category
        result = rag_service.retrieve_parallels(
            query=query,
            top_k=top_k,
            event_category=effective_category,
        )
        return {
            "query": query,
            "retrieved_count": result["retrieved_count"],
            "results": result["historical_parallels"],
            "highlighted_nodes": result.get("graph_highlight", {}).get("nodes", []),
            "highlighted_edges": result.get("graph_highlight", {}).get("edges", []),
        }
    except Exception as e:
        logger.error(f"Query endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Master Graph & 3D Globe Endpoints
# ============================================================================

@app.get("/api/master_graph")
@app.get("/api/graph/master")
def get_master_graph():
    """
    Return full master graph as node-link JSON.
    Called on initial frontend load and cached.
    """
    mg: Optional[MasterGraph] = app_state.get("master_graph")
    if not mg:
        mg = MasterGraph()
        app_state["master_graph"] = mg
    return mg.get_full_graph_json()


@app.get("/api/graph/stats")
def get_graph_stats():
    """Return graph statistics (node counts, edge counts, top entities)."""
    mg: Optional[MasterGraph] = app_state.get("master_graph")
    if not mg:
        raise HTTPException(status_code=503, detail="Master graph not ready")
    return mg.get_graph_stats()


@app.get("/api/master_graph/hotspots")
@app.get("/api/graph/hotspots")
def get_globe_hotspots():
    """
    Return disruption hotspots for 3D globe visualization.
    Each hotspot represents a region experiencing disruptions, with lat/long and intensity.
    """
    mg: Optional[MasterGraph] = app_state.get("master_graph")
    if not mg:
        mg = MasterGraph()
        app_state["master_graph"] = mg
        graph_api_module.master_graph_instance = mg
    try:
        return mg.get_hotspots_for_globe()
    except Exception as e:
        logger.error(f"Failed to generate hotspots: {e}")
        raise HTTPException(status_code=500, detail=f"Hotspots failed: {str(e)}")


@app.get("/api/master_graph/highlight/{entity_id}")
def get_entity_context(entity_id: str):
    """
    Return focused sub-graph around a specific entity (direct and 2nd-order neighbors).
    Used when user clicks on a globe hotspot or entity card.
    """
    mg: Optional[MasterGraph] = app_state.get("master_graph")
    if not mg:
        raise HTTPException(status_code=503, detail="Master graph not ready")
    try:
        entity_lower = entity_id.lower().strip()
        node_data = mg.get_node_data(entity_lower)
        if not node_data:
            # Try searching substring
            matches = [n for n in mg.graph.nodes if entity_lower in n]
            if matches:
                entity_lower = matches[0]
                node_data = mg.get_node_data(entity_lower)
            else:
                raise HTTPException(status_code=404, detail=f"Entity '{entity_id}' not found in graph")

        # Collect neighbors
        neighbors = []
        for successor in mg.graph.successors(entity_lower):
            edge_data = mg.graph.get_edge_data(entity_lower, successor)
            neighbors.append({
                "id": successor,
                "type": mg.graph.nodes[successor].get("type", "unknown"),
                "relationship": edge_data[0].get("relationship") if edge_data else "connected_to",
                "weight": edge_data[0].get("weight", 1) if edge_data else 1,
            })
        for predecessor in mg.graph.predecessors(entity_lower):
            edge_data = mg.graph.get_edge_data(predecessor, entity_lower)
            neighbors.append({
                "id": predecessor,
                "type": mg.graph.nodes[predecessor].get("type", "unknown"),
                "relationship": f"incoming_{edge_data[0].get('relationship')}" if edge_data else "incoming_connection",
                "weight": edge_data[0].get("weight", 1) if edge_data else 1,
            })

        return {
            "entity": {"id": entity_lower, **node_data},
            "neighbors": neighbors,
            "total_connections": len(neighbors),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Context retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/master_graph/search")
def search_graph_entities(query: str = Query(...), entity_type: Optional[str] = Query(default=None)):
    """Search for entities in the master graph."""
    mg: Optional[MasterGraph] = app_state.get("master_graph")
    if not mg:
        raise HTTPException(status_code=503, detail="Master graph not ready")

    q = query.lower().strip()
    results = []
    for node, data in mg.graph.nodes(data=True):
        if q in node:
            ntype = data.get("type", "unknown")
            if entity_type and ntype != entity_type:
                continue
            results.append({"id": node, **data})

    return {"query": query, "count": len(results), "results": results[:50]}


# ============================================================================
# Articles & Ingestion Endpoints
# ============================================================================

@app.get("/api/articles")
async def get_articles(
    relevant_only: bool = Query(default=True, description="Filter only supply-chain relevant articles"),
    min_score: float = Query(default=0.5, ge=0.0, le=1.0, description="Minimum relevance score threshold"),
    disruption_type: Optional[str] = Query(default=None, description="Filter by disruption type"),
    limit: int = Query(default=50, ge=1, le=500),
):
    """
    Get normalized articles with dynamic semantic filtering.
    """
    db: Optional[MasterDB] = app_state.get("db")
    if not db:
        db = MasterDB()
        app_state["db"] = db

    try:
        articles = db.fetch_articles_with_filter(
            relevant_only=relevant_only,
            min_score=min_score,
            disruption_type=disruption_type,
            limit=limit,
        )
        return articles
    except Exception as e:
        logger.error(f"Failed to fetch articles: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/monitoring/relevance")
def get_relevance_stats():
    """Return live dynamic relevance filtering metrics."""
    return relevance_monitor.report()


# ============================================================================
# Pipeline Triggers
# ============================================================================

@app.post("/api/phase1/run")
async def trigger_phase1():
    """Trigger Phase 1 ingestion & normalization."""
    try:
        await run_phase_1()
        return {"status": "success", "message": "Phase 1 ingestion complete"}
    except Exception as e:
        logger.error(f"Phase 1 failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/phase2a/run")
async def trigger_phase2a():
    """Trigger Phase 2A embedding & ChromaDB indexing."""
    try:
        await run_phase2a()
        return {"status": "success", "message": "Phase 2A embeddings complete"}
    except Exception as e:
        logger.error(f"Phase 2A failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/phase2b/run")
async def trigger_phase2b():
    """Trigger Phase 2B Master Graph update."""
    try:
        mg = run_phase2b()
        if mg:
            app_state["master_graph"] = mg
            graph_api_module.master_graph_instance = mg
        return {"status": "success", "message": "Phase 2B master graph complete"}
    except Exception as e:
        logger.error(f"Phase 2B failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pipeline/run")
async def run_full_pipeline():
    """Trigger full end-to-end pipeline (Phase 1 → 2A → 2B)."""
    try:
        await run_phase_1()
        await run_phase2a()
        mg = run_phase2b()
        if mg:
            app_state["master_graph"] = mg
            graph_api_module.master_graph_instance = mg
        return {
            "status": "success",
            "message": "Full NexusFlow intelligence pipeline completed successfully",
        }
    except Exception as e:
        logger.error(f"Full pipeline run failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Events & Legacy Compatibility
# ============================================================================

@app.get("/api/events")
async def get_events(
    limit: int = Query(default=50, ge=1, le=500),
    commodity: Optional[str] = Query(default=None),
):
    """Query consolidated master events."""
    if query_master_events:
        try:
            events = query_master_events(limit=limit, commodity_filter=commodity)
            return {"count": len(events), "events": events}
        except Exception:
            pass

    # Fallback to MasterDB articles
    db: Optional[MasterDB] = app_state.get("db")
    if not db:
        db = MasterDB()
    articles = db.fetch_articles_with_filter(relevant_only=True, limit=limit)
    return {"count": len(articles), "events": articles}


@app.get("/api/events/{event_uid}")
async def get_event_detail(event_uid: str):
    """Get single event detail."""
    if query_event_by_uid:
        try:
            ev = query_event_by_uid(event_uid)
            if ev:
                return ev
        except Exception:
            pass

    db: Optional[MasterDB] = app_state.get("db")
    if not db:
        db = MasterDB()
    art = db.get_article_by_id(event_uid)
    if not art:
        raise HTTPException(status_code=404, detail=f"Event '{event_uid}' not found")
    return art


@app.get("/api/stats")
async def get_stats():
    """Get overall pipeline and database statistics."""
    mg: Optional[MasterGraph] = app_state.get("master_graph")
    vs: Optional[VectorStore] = app_state.get("vector_store")
    db: Optional[MasterDB] = app_state.get("db")

    articles_count = 0
    if db:
        try:
            cursor = db.conn.cursor()
            cursor.execute("SELECT count(*) FROM articles")
            articles_count = cursor.fetchone()[0]
        except Exception:
            pass

    return {
        "articles_ingested": articles_count,
        "vectors_indexed": vs.count() if vs else 0,
        "graph_nodes": mg.graph.number_of_nodes() if mg else 0,
        "graph_edges": mg.graph.number_of_edges() if mg else 0,
        "monitoring": relevance_monitor.report(),
    }
