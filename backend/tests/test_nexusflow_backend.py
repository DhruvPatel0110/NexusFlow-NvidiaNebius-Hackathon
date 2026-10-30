"""
NexusFlow — Comprehensive Backend Test Suite

Tests all required backend capabilities:
  1. Application startup & configuration integrity
  2. Health-check & metadata endpoints
  3. Dynamic relevance scoring & semantic filtering
  4. Vector similarity retrieval from ChromaDB
  5. RAG supply-chain impact reasoning (NVIDIA Nemotron / Nebius interface)
  6. Graph serialization & 3D Globe hotspot generation
  7. Entity highlighting & neighborhood traversal
  8. Missing-credential safety & secrets protection
"""

import sys
import os
import json
from pathlib import Path

# Add backend directory to path
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi.testclient import TestClient
from app.main import app, app_state
from nebius_client import NebiusNemotronClient
from rag_service import RAGService
from master_graph import MasterGraph
from vector_store import VectorStore
from database import MasterDB


def run_all_tests():
    print("=" * 60)
    print("RUNNING NEXUSFLOW BACKEND TEST SUITE")
    print("=" * 60)

    with TestClient(app) as client:
        # 1. Health and Root
        res = client.get("/health")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["status"] == "healthy"
        assert data["service"] == "NexusFlow Backend"
        assert data["hackathon"] == "Nebius x NVIDIA Global AI Hackathon"
        assert "nebius_integration" in data
        assert "components" in data
        assert data["components"]["vector_store_documents"] >= 4
        assert data["components"]["master_graph_nodes"] >= 30
        print("[PASS] test_01_health_and_root passed")

        # 2. Master Graph Endpoints
        res = client.get("/api/master_graph")
        assert res.status_code == 200
        graph_data = res.json()
        assert "nodes" in graph_data
        assert "links" in graph_data or "edges" in graph_data
        assert len(graph_data["nodes"]) >= 30

        res = client.get("/api/graph/stats")
        assert res.status_code == 200
        stats = res.json()
        assert stats["total_nodes"] >= 30
        assert stats["total_edges"] >= 15
        assert "nodes_by_type" in stats
        print("[PASS] test_02_master_graph_endpoints passed")

        # 3. Globe Hotspots
        res = client.get("/api/master_graph/hotspots")
        assert res.status_code == 200
        data = res.json()
        assert "hotspots" in data
        hotspots = data["hotspots"]
        assert len(hotspots) > 0
        first = hotspots[0]
        assert "id" in first
        assert "latitude" in first
        assert "longitude" in first
        assert "intensity" in first
        assert "color" in first
        assert "disruption_type" in first
        print("[PASS] test_03_globe_hotspots passed")

        # 4. Entity Context Highlight
        res = client.get("/api/master_graph/highlight/iran")
        assert res.status_code == 200
        data = res.json()
        assert "entity" in data
        assert data["entity"]["id"] == "iran"
        assert "neighbors" in data
        assert len(data["neighbors"]) > 0

        res = client.get("/api/master_graph/search?query=taiwan")
        assert res.status_code == 200
        data = res.json()
        assert data["count"] >= 1
        assert any("taiwan" in r["id"] for r in data["results"])
        print("[PASS] test_04_entity_context_highlight passed")

        # 5. Core RAG Analyze Endpoint
        payload = {
            "query": "Hormuz shipping alert causes crude oil tanker rerouting",
            "top_k": 3,
            "event_category": "geopolitical"
        }
        res = client.post("/api/rag/analyze", json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["query"] == payload["query"]
        assert "historical_parallels" in data
        assert len(data["historical_parallels"]) > 0

        impact = data["impact_analysis"]
        assert "event_summary" in impact
        assert "primary_affected_commodities" in impact
        assert "downstream_propagation_path" in impact
        assert len(impact["downstream_propagation_path"]) >= 3
        assert "evidence_backed_facts" in impact
        assert "explicit_uncertainties" in impact
        assert "risk_level" in impact
        assert "graph_highlight" in data
        assert "nodes" in data["graph_highlight"]
        assert "edges" in data["graph_highlight"]
        assert "model_metadata" in data
        print("[PASS] test_05_rag_analyze_endpoint passed")

        # 6. Query Search Endpoint
        res = client.get("/api/query?query=semiconductor+chip+drought&top_k=2")
        assert res.status_code == 200
        data = res.json()
        assert data["retrieved_count"] > 0
        assert len(data["results"]) > 0
        top_result = data["results"][0]
        assert "semiconductor" in top_result["title"].lower() or "drought" in top_result["title"].lower()
        print("[PASS] test_06_query_search_endpoint passed")

        # 7. Articles Endpoint with Dynamic Filtering
        res = client.get("/api/articles?relevant_only=true&limit=10")
        assert res.status_code == 200
        articles = res.json()
        assert len(articles) > 0
        for art in articles:
            assert art.get("is_relevant") is True

        res = client.get("/api/articles?disruption_type=geopolitical&limit=10")
        assert res.status_code == 200
        articles = res.json()
        assert len(articles) > 0
        for art in articles:
            dtype = (art.get("disruption_type") or art.get("event_category") or "").lower()
            assert "geopolitical" in dtype
        print("[PASS] test_07_articles_endpoint_with_dynamic_filtering passed")

        # 8. Relevance Monitoring Endpoint
        res = client.get("/api/monitoring/relevance")
        assert res.status_code == 200
        stats = res.json()
        assert "total_ingested" in stats
        assert "filtering_ratio" in stats
        print("[PASS] test_08_relevance_monitoring_endpoint passed")

        # 9. No Secrets Leaked
        endpoints = [
            "/health",
            "/api/stats",
            "/api/graph/stats",
            "/api/master_graph/hotspots",
        ]
        for ep in endpoints:
            res = client.get(ep)
            body = res.text
            assert "sk-" not in body
            assert "gsk_" not in body
            assert "password" not in body.lower()
            assert "secret" not in body.lower()
        print("[PASS] test_09_no_secrets_leaked passed")

        print("=" * 60)
        print("ALL 9 TEST SUITES PASSED PERFECTLY (100% SUCCESS)!")
        print("=" * 60)


if __name__ == "__main__":
    run_all_tests()

