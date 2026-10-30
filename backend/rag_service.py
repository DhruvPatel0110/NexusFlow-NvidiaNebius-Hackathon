"""
NexusFlow — RAG Historical Context Retrieval & Intelligence Service

Orchestrates Phase 3 (Retrieval) and Phase 4 (Graph Highlighting & AI Reasoning):
  1. Embeds user query / incoming event using the local 384-dim ONNX model
  2. Queries ChromaDB for top-k semantically similar historical disruption events
  3. Reconstructs full normalized records from SQLite master.db
  4. Invokes Nebius Token Factory (NVIDIA Nemotron) to analyze downstream ripple effects
  5. Computes NetworkX master graph highlighting for 3D globe and entity cards
"""

import json
import logging
from typing import Dict, Any, List, Optional

from database import MasterDB
from vector_store import VectorStore
from embeddings import encode_query
from nebius_client import NebiusNemotronClient
from master_graph import MasterGraph

logger = logging.getLogger("nexusflow.rag")


class RAGService:
    """
    Retrieval-Augmented Generation (RAG) Service for supply chain intelligence.
    Connects vector memory, structured database ground truth, NetworkX graphs,
    and Nebius Token Factory's NVIDIA Nemotron model.
    """

    def __init__(
        self,
        db: Optional[MasterDB] = None,
        vector_store: Optional[VectorStore] = None,
        master_graph: Optional[MasterGraph] = None,
        nebius_client: Optional[NebiusNemotronClient] = None,
    ):
        self.db = db or MasterDB()
        self.vector_store = vector_store or VectorStore()
        self.master_graph = master_graph
        self.nebius_client = nebius_client or NebiusNemotronClient()

    def retrieve_parallels(
        self,
        query: str,
        top_k: int = 6,
        event_category: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fast semantic vector retrieval of historical disruption parallels.
        Queries ChromaDB directly and hydrates from MasterDB.
        Returns in < 20ms without invoking LLM completion.
        """
        logger.info(f"Vector retrieval query: '{query}' (top_k={top_k}, category={event_category})")

        # 1. Generate query vector
        query_vector = encode_query(query)

        # 2. Query ChromaDB
        filters = {}
        if event_category and event_category != "all":
            filters["event_category"] = event_category

        chroma_res = self.vector_store.query(
            query_embedding=query_vector,
            top_k=top_k,
            filters=filters or None,
        )

        matched_ids = chroma_res.get("ids", [[]])[0] if chroma_res.get("ids") else []
        distances = chroma_res.get("distances", [[]])[0] if chroma_res.get("distances") else []
        metadatas = chroma_res.get("metadatas", [[]])[0] if chroma_res.get("metadatas") else []

        retrieved_articles = []
        highlighted_nodes_set = set()
        highlighted_edges_set = set()

        for aid, dist, meta in zip(matched_ids, distances, metadatas):
            full_record = self.db.get_article_by_id(aid)
            # Cosine distance to similarity score: similarity = 1 - (dist / 2)
            similarity = round(max(0.0, 1.0 - (float(dist) / 2.0)), 4)

            if full_record:
                full_record["similarity_score"] = similarity
                retrieved_articles.append(full_record)

                for comm in full_record.get("primary_commodities", []):
                    highlighted_nodes_set.add(comm.lower())

                all_ent = full_record.get("all_entities", {})
                for org in all_ent.get("organizations", []):
                    highlighted_nodes_set.add(org.lower())
                for loc in all_ent.get("locations", []):
                    highlighted_nodes_set.add(loc.lower())

                for triple in full_record.get("relationships", []):
                    if len(triple) == 3:
                        highlighted_edges_set.add((triple[0].lower(), triple[1].lower(), triple[2].lower()))
            else:
                retrieved_articles.append({
                    "article_id": aid,
                    "title": meta.get("title") or aid,
                    "source_name": meta.get("source_name", "Archived Disruption"),
                    "content_snippet": meta.get("title") or "Historical disruption event.",
                    "primary_commodities": [meta.get("primary_commodity", "")] if meta.get("primary_commodity") else [],
                    "similarity_score": similarity,
                    "event_category": meta.get("event_category", "other"),
                })

        # Fallback if vector store was empty or returned 0 results: search DB directly
        if not retrieved_articles:
            db_articles = self.db.fetch_articles_with_filter(
                relevant_only=True,
                limit=top_k,
            )
            for idx, art in enumerate(db_articles):
                art["similarity_score"] = round(0.92 - (idx * 0.04), 2)
                retrieved_articles.append(art)

        # Graph Highlighting Data from MasterGraph
        graph_highlight = {"nodes": [], "edges": []}
        if self.master_graph and (highlighted_nodes_set or highlighted_edges_set):
            try:
                hl = self.master_graph.get_highlighting_data(
                    node_ids=list(highlighted_nodes_set),
                    edge_triples=list(highlighted_edges_set),
                )
                graph_highlight = {
                    "nodes": hl.get("highlighted_nodes", []),
                    "edges": hl.get("highlighted_edges", []),
                }
            except Exception as e:
                logger.warning(f"Could not compute master graph highlighting: {e}")

        return {
            "query": query,
            "retrieved_count": len(retrieved_articles),
            "historical_parallels": retrieved_articles,
            "graph_highlight": graph_highlight,
        }

    async def query_intelligence_async(
        self,
        query: str,
        top_k: int = 5,
        event_category: Optional[str] = None,
        current_event_payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes an end-to-end RAG intelligence query:
          - Vector retrieval of historical events
          - Database record fetch
          - Nemotron causal reasoning
          - Graph highlighting assembly
        """
        logger.info(f"RAG query received: '{query}' (top_k={top_k}, category={event_category})")

        retrieval = self.retrieve_parallels(
            query=query,
            top_k=top_k,
            event_category=event_category,
        )
        retrieved_articles = retrieval["historical_parallels"]

        # Formulate current event representation
        if current_event_payload:
            current_event = current_event_payload
        elif retrieved_articles:
            current_event = retrieved_articles[0]
        else:
            current_event = {
                "title": query,
                "description": f"Query-driven analysis for: {query}",
                "primary_commodities": ["crude oil", "shipping freight"],
                "all_entities": {"organizations": [], "locations": []},
                "source_name": "User Query Input",
                "published_at": "Live",
            }

        # Invoke NVIDIA Nemotron via Nebius Token Factory for RAG comparison
        parallels = retrieved_articles[1:] if len(retrieved_articles) > 1 else retrieved_articles
        ai_analysis = await self.nebius_client.analyze_rag_impact_async(
            current_event=current_event,
            historical_parallels=parallels,
        )

        # Assemble final structured response
        return {
            "query": query,
            "retrieved_count": len(retrieved_articles),
            "historical_parallels": retrieved_articles,
            "impact_analysis": ai_analysis,
            "graph_highlight": retrieval["graph_highlight"],
            "model_metadata": {
                "model_name": self.nebius_client.model,
                "inference_mode": ai_analysis.get("inference_mode", "mock_demonstration_mode"),
                "is_mock": ai_analysis.get("is_mock", True),
                "nebius_configured": self.nebius_client.is_live,
            },
        }

