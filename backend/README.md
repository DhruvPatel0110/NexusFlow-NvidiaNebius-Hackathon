# NexusFlow — Backend Intelligence Architecture & Integration Guide

NexusFlow is a real-time, AI-powered supply-chain disruption intelligence engine built for the **Nebius x NVIDIA Global AI Hackathon** (Track: **Best Apps and Agents**).

NexusFlow continuously monitors global disruption signals, normalizes unstructured reports, indexes disruptions in a persistent vector database, retrieves relevant historical parallels via RAG, and leverages an **NVIDIA Nemotron** open-source LLM hosted on **Nebius Token Factory** to reason over plausible downstream supply-chain propagation, distinguishing verified source evidence from inferred impacts.

---

## 1. Backend Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── graph_api.py            # Master graph & globe hotspots endpoints
│   │   └── __init__.py
│   ├── config/
│   │   ├── rss_feeds.json          # Pre-configured high-value RSS feed registries
│   │   └── settings.py
│   ├── services/
│   │   ├── ingestion_orchestrator.py
│   │   ├── news_api_service.py
│   │   └── rss_feed_service.py
│   └── main.py                     # Primary FastAPI application & route registry
├── data/
│   ├── chroma_db/                  # Persistent ChromaDB vector storage (all-MiniLM-L6-v2)
│   ├── master.db                   # SQLite ground truth (articles, entities, relationships, chains)
│   ├── master_graph.json           # Serialized NetworkX MultiDiGraph (nodes, edges, weights)
│   └── validation_report.json      # Ingestion & filtering validation output
├── logs/
│   └── nexusflow.log               # Unified pipeline forensic log
├── monitoring/
│   └── relevance_monitor.py        # Real-time filtering ratio & distribution tracker
├── tests/
│   ├── test_nexusflow_backend.py   # Comprehensive 9-suite integration test
│   ├── test_globe_hotspots.py      # Globe 3D coordinates & disruption level test
│   ├── test_dynamic_filtering.py   # Semantic filtering & normalizer test
│   └── run_4_stage_validation.py   # 4-stage end-to-end pipeline validation
├── config.py                       # Centralized configuration & environment loader
├── database.py                     # SQLite MasterDB connection & schema manager
├── embeddings.py                   # Compound semantic string builder & local ONNX 384-dim encoder
├── entity_filter.py                # Generic entity exclusion & role validator
├── groq_extractor.py               # Extraction adapter with secondary fallback support
├── ingestion.py                    # Real-time dual-source ingestion & deduplication orchestrator
├── master_graph.py                 # NetworkX MultiDiGraph manager & globe hotspot generator
├── nebius_client.py                # Nebius Token Factory & NVIDIA Nemotron client
├── normalizer.py                   # Entity casing normalizer & record merger
├── phase2.py                       # Phase 2A (vector store) & 2B (graph) orchestrator
├── rag_service.py                  # RAG historical retrieval & Nemotron impact reasoning service
├── relevance_scorer.py             # Dynamic semantic supply-chain relevance scorer
├── seed_sample_articles.py         # Seed dataset populator & pipeline initializer
├── spacy_extractor.py              # Local spaCy NER pipeline (en_core_web_sm)
├── vector_store.py                 # Persistent ChromaDB cosine similarity interface
├── req.txt                         # Dependency specifications
└── .env.example                    # Environment variable template
```

---

## 2. Installation Instructions

### Prerequisites
- Python 3.10 to 3.14
- Git

### Virtual Environment Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r req.txt

# Download the spaCy model
python -m spacy download en_core_web_sm
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp .env.example .env
```

| Variable | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `NEBIUS_API_KEY` | Optional for test/mock, Required for live LLM | `""` | Nebius Token Factory API key. When omitted, the backend runs in fixture/heuristic demonstration mode without crashing. |
| `NEBIUS_BASE_URL` | No | `https://api.tokenfactory.nebius.ai/v1` | Nebius Token Factory OpenAI-compatible API base endpoint. |
| `NEBIUS_MODEL` | No | `nvidia/llama-3.1-nemotron-70b-instruct` | NVIDIA Nemotron model identifier deployed on Nebius Token Factory. |
| `NEWSAPI_KEY` | No | `""` | NewsAPI key. If omitted, the engine automatically ingests from 10 live public RSS feeds concurrently. |
| `DATABASE_PATH` | No | `data/master.db` | Local path for SQLite persistent ground truth database. |
| `CHROMA_PATH` | No | `data/chroma_db` | Local path for ChromaDB vector embeddings collection. |
| `GRAPH_PATH` | No | `data/master_graph.json` | Local path for NetworkX serialized master graph. |
| `LOG_LEVEL` | No | `INFO` | Console log verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |

---

## 4. Nebius Token Factory & NVIDIA Nemotron Integration

NexusFlow connects to Nebius Token Factory's hosted inference platform via `backend/nebius_client.py`.

### How It Works:
1. **Endpoint Compatibility**: Connects to Nebius Token Factory via OpenAI-compatible `/chat/completions` using asynchronous `httpx`.
2. **Model Responsibilities**:
   - **Semantic Filtering**: Evaluates incoming reports to distinguish physical trade disruptions from consumer noise or entertainment tech.
   - **Structured Extraction**: Extracts primary commodities, entity supply-chain roles (`supplier`, `consumer`, `logistics_node`, `regulatory_body`, `disruption_cause`), relationship triples, and causal impact steps.
   - **RAG Historical Synthesis**: Compares current events against historical parallels retrieved from ChromaDB, explaining mechanisms of propagation and explicitly stating uncertainties.
3. **Graceful Demonstration Mode**:
   When `NEBIUS_API_KEY` is not provided (or is a placeholder), `nebius_client.py` automatically activates an offline heuristic and fixture mode. Every response includes `is_mock: true` and `inference_mode: "mock_demonstration_mode"`, allowing judges and developers to test the entire application workflow end-to-end without credentials. When valid credentials are supplied, it seamlessly switches to live inference (`inference_mode: "live_nebius_token_factory"`).

---

## 5. Database & Vector Store Setup

Initialize and populate the databases with canonical supply-chain events:

```bash
python seed_sample_articles.py
```

This command:
1. Creates SQLite tables in `data/master.db` (`articles`, `entities`, `relationships`, `economic_chains`, `low_confidence_queue`, `failed_extractions`).
2. Populates initial disruption scenarios (Red Sea shipping, Taiwan drought, Hormuz naval alert, Panama Canal transit restrictions).
3. Encodes compound semantic strings with the local 384-dimensional ONNX model and populates ChromaDB at `data/chroma_db`.
4. Constructs the NetworkX MultiDiGraph and serializes it to `data/master_graph.json`.

---

## 6. Starting the Backend Server

Start the FastAPI application using Uvicorn:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be live at:
- **Base URL**: `http://127.0.0.1:8000`
- **Interactive OpenAPI Documentation (Swagger UI)**: `http://127.0.0.1:8000/docs`
- **Alternative Documentation (ReDoc)**: `http://127.0.0.1:8000/redoc`

---

## 7. Primary API Endpoints

### 7.1 System Health
- **`GET /health`** or **`GET /`**:
  Returns service health, Nebius Token Factory integration status, document count in vector memory, and master graph node/edge counts.

### 7.2 RAG Supply-Chain Intelligence (Core Feature)
- **`POST /api/rag/analyze`**:
  Accepts a disruption query or event object and returns a structured intelligence report:
  ```json
  {
    "query": "Hormuz shipping alert causes crude oil tanker rerouting",
    "top_k": 3,
    "event_category": "geopolitical"
  }
  ```
  **Response Output**:
  - `query`: Original query string
  - `retrieved_count`: Count of historical parallels found
  - `historical_parallels`: Retrieved historical events with similarity scores, sources, and prior causal chains
  - `impact_analysis`:
    - `event_summary`: Contextual explanation
    - `primary_affected_commodities`: List of affected commodities
    - `affected_entities`: Categorized by `suppliers`, `consumers`, `logistics_nodes`, `regulatory_bodies`
    - `downstream_propagation_path`: Step-by-step causal chain
    - `historical_parallels_analysis`: Specific mechanistic similarities and contextual differences
    - `evidence_backed_facts`: Verified facts grounded in source reports
    - `plausible_inferred_risks`: Qualified model hypotheses
    - `explicit_uncertainties`: Missing variables and unconfirmed data
    - `risk_level`: `high` / `medium` / `low`
  - `graph_highlight`: Sub-network nodes and edges for 3D Globe and dashboard rendering
  - `model_metadata`: Model identifier and live vs. mock inference indicator

- **`GET /api/query?query={text}&top_k=5`**:
  Semantic search over indexed disruption events.

### 7.3 Master Graph & 3D Interactive Globe
- **`GET /api/master_graph`** (or `/api/graph/master`):
  Full node-link JSON graph for frontend cache and visualization.
- **`GET /api/master_graph/hotspots`**:
  List of geographic disruption hotspots with latitude, longitude, disruption intensity (0.0 to 1.0), and color coding (`red`, `orange`, `yellow`, `green`) for 3D globe rendering.
- **`GET /api/master_graph/highlight/{entity_id}`**:
  Focused sub-graph centered on a specific entity (e.g. `iran`, `taiwan`, `maersk`, `panama canal`).
- **`GET /api/master_graph/search?query={entity_name}`**:
  Search entities by name or keyword.
- **`GET /api/graph/stats`**:
  Total node and edge counts, breakdown by entity type, and top weighted entities.

### 7.4 Ingestion & Pipeline Triggers
- **`GET /api/articles?relevant_only=true&min_score=0.5&disruption_type=geopolitical`**:
  Retrieve stored articles with dynamic multi-parameter filtering.
- **`GET /api/monitoring/relevance`**:
  Live metrics on filtering ratio and disruption breakdown.
- **`POST /api/phase1/run`**: Trigger real-time ingestion & normalization.
- **`POST /api/phase2a/run`**: Trigger vector embedding generation.
- **`POST /api/phase2b/run`**: Trigger master graph construction.
- **`POST /api/pipeline/run`**: Run full pipeline (Phase 1 → 2A → 2B).

---

## 8. Running Tests

Run the backend verification suite:

```bash
# 1. Comprehensive NexusFlow Backend Test Suite (All 9 endpoints & contracts)
python tests/test_nexusflow_backend.py

# 2. 3D Globe Hotspots & Master Graph Test
python tests/test_globe_hotspots.py

# 3. Dynamic Relevance Scoring & Normalizer Test
python tests/test_dynamic_filtering.py

# 4. 4-Stage Ingestion, Filtering, Graph Integrity & API Validation
python tests/run_4_stage_validation.py
```

---

## 9. Verification & Operational Status

### Features Verified & Functional (Zero Credentials Required):
1. **Real-time Dual-Source Ingestion**: Concurrent async polling of 10 live RSS feeds (BBC, Mint, CNBC, Al Jazeera, etc.) with deterministic SHA-256 URL deduplication.
2. **Deterministic Entity Extraction**: spaCy `en_core_web_sm` extracting ORG, GPE, LOC, PRODUCT, EVENT, MONEY, and PERCENT signals.
3. **Local ONNX Embeddings**: 384-dimensional dense semantic vectors using ChromaDB's ONNX runtime `all-MiniLM-L6-v2` locally with zero external API calls or GPU requirements.
4. **Persistent Vector Database**: Persistent ChromaDB storage (`supply_chain_articles`) at `data/chroma_db` with cosine distance space and skip logic for existing records.
5. **Historical NetworkX Master Graph**: Directed multi-graph accumulating entity weights, relationship occurrences, and computing 3D globe coordinates and intensity.
6. **RAG Context Retrieval**: Query embedding, similarity search, full-record reconstruction, and graph sub-network isolation.
7. **FastAPI Endpoints**: Full suite of REST endpoints with CORS enabled, input validation, and secrets protection.
8. **Fixture / Heuristic Fallback Engine**: Fully functional end-to-end demonstrations with realistic qualified impact reasoning when credentials are not yet supplied.

### Features Activated When Credentials Are Provided:
1. **Live Nebius Token Factory Inference**: Set `NEBIUS_API_KEY` in `.env` to execute live NVIDIA Nemotron model completions (`nvidia/llama-3.1-nemotron-70b-instruct`) for dynamic extraction, relevance scoring, and RAG impact reasoning.
2. **NewsAPI Live Headlining**: Set `NEWSAPI_KEY` in `.env` to query commercial business/tech headlines alongside the live public RSS feeds.

