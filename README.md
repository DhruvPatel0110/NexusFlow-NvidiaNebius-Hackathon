# NexusFlow — Real-Time AI Supply Chain Disruption Intelligence

<div align="center">

![Nebius](https://img.shields.io/badge/Nebius_Token_Factory-Hosted_Inference-6366F1?style=for-the-badge&logo=cloud&logoColor=white)
![NVIDIA](https://img.shields.io/badge/NVIDIA_Nemotron-120B_Super_LLM-76B900?style=for-the-badge&logo=nvidia&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_RAG-FF4F00?style=for-the-badge&logo=databricks&logoColor=white)
![React](https://img.shields.io/badge/React_19-Vite_Tailwind-61DAFB?style=for-the-badge&logo=react&logoColor=black)

**Built for the Nebius x NVIDIA Global AI Hackathon**  
*Track: Best Apps and Agents*

*Autonomous supply-chain intelligence that ingests global disruption signals, normalizes unstructured reports, retrieves historical crisis parallels via Vector RAG, and leverages NVIDIA Nemotron to reason over downstream commodity propagation.*

</div>

---

## 📌 Executive Summary

Modern global supply chains are brittle, non-linear networks where a drought in Central America, a naval drone strike in the Red Sea, or a water quota in Taiwan can trigger factory halts and fuel spikes thousands of miles away. Analysts typically drown in unorganized news feeds, siloed telemetry, and false-positive noise.

**NexusFlow** transforms raw, chaotic news streams and maritime feeds into actionable, evidence-grounded supply-chain intelligence in real-time. Powered by **NVIDIA Nemotron** (`nvidia/nemotron-3-super-120b-a12b`) hosted on **Nebius Token Factory**, NexusFlow:

1. **Monitors & Ingests:** Dual-source ingestion spanning live global news feeds (NewsAPI) and specialized maritime/logistics RSS streams.
2. **Filters & Normalizes:** Dual-tier semantic filtering (heuristic + LLM-backed relevance grading) and SHA-256 deduplication to eliminate consumer noise.
3. **Retrieves Precedents (Vector RAG):** ChromaDB local ONNX embedding store indexing historical supply-chain shocks to surface mechanism overlaps and key differences.
4. **Maintains Causal Knowledge Graphs:** NetworkX `MultiDiGraph` accumulating entities, relationship triples, and dynamic time-decayed geographic hotspots.
5. **Reasons on Propagation:** NVIDIA Nemotron generates 1st- and 2nd-order downstream impact chains, distinguishing verified ground truth from plausible inferences.
6. **Delivers Warm Enterprise Visualization:** An executive dashboard designed with a strict, dignified palette (`#895129` panels on `#EDE8D0` canvas) featuring interactive 3D WebGL globe projections and 2D vector disruption maps.

---

## 🏛️ System Architecture

```
   ┌──────────────────────┐        ┌──────────────────────┐
   │       NewsAPI        │        │   Maritime / Cargo   │
   │  Global Crisis Feed  │        │       RSS Feeds      │
   └──────────┬───────────┘        └──────────┬───────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
        ┌───────────────────────────────────────────┐
        │  Phase 1: Ingestion & Normalization       │
        │  • Canonical URL SHA-256 Deduplication    │
        │  • spaCy Named Entity Recognition (NER)   │
        │  • Heuristic & Semantic Relevance Scorer  │
        └─────────────────────┬─────────────────────┘
                              │ Verified Disruption
                              ▼
        ┌───────────────────────────────────────────┐
        │  Phase 2A: Persistent Vector Store        │
        │  • ChromaDB Local ONNX Runtime            │
        │  • all-MiniLM-L6-v2 (384-dim Embeddings)  │
        │  • Semantic Cosine Similarity Search      │
        └─────────────────────┬─────────────────────┘
                              │ Contextual Precedents
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │  Phase 3: RAG Reasoning & Impact Synthesis             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Nebius Token Factory (Hosted NVIDIA Nemotron)   │  │
  │  │  Model: nvidia/nemotron-3-super-120b-a12b        │  │
  │  │  • Structural Event Understanding                │  │
  │  │  • Historical Mechanism Overlap & Contrast       │  │
  │  │  • 1st & 2nd Order Downstream Propagation Chains │  │
  │  │  • Plausibility vs. Evidence Grounding           │  │
  │  └──────────────────────────────────────────────────┘  │
  └───────────────────────────┬────────────────────────────┘
                              │ Structured Intelligence
                              ▼
        ┌───────────────────────────────────────────┐
        │  Phase 2B: Master Knowledge Graph         │
        │  • NetworkX Persistent MultiDiGraph       │
        │  • Entity Weight Accumulation             │
        │  • Dynamic 4-Tier Severity Hotspots       │
        └─────────────────────┬─────────────────────┘
                              │ Real-Time Intelligence API
                              ▼
        ┌───────────────────────────────────────────┐
        │  FastAPI Backend (REST API / Uvicorn)     │
        └─────────────────────┬─────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────────┐
        │  Warm Enterprise Executive Dashboard      │
        │  • React 19 + Vite + Tailwind CSS         │
        │  • Interactive 3D WebGL Night Globe       │
        │  • 2D Vector Map with Pan & Zoom Engine   │
        │  • 3-Tier Supply Chain Causal Flow        │
        └───────────────────────────────────────────┘
```

---

## ⚡ NVIDIA & Nebius Integration

### 1. Hosted Model: NVIDIA Nemotron 120B Super
NexusFlow integrates **`nvidia/nemotron-3-super-120b-a12b`**, NVIDIA's flagship open-source enterprise model, optimized for complex reasoning, instruction following, and structured JSON output.

### 2. High-Performance Inference: Nebius Token Factory
Inference is executed over **Nebius Token Factory** (`https://api.tokenfactory.nebius.com/v1`), delivering sub-second token generation latency, enterprise throughput, and strict reliability.

```python
# backend/nebius_client.py
client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1",
    api_key=settings.NEBIUS_API_KEY
)

response = client.chat.completions.create(
    model="nvidia/nemotron-3-super-120b-a12b",
    messages=[
        {"role": "system", "content": SYSTEM_SUPPLY_CHAIN_PROMPT},
        {"role": "user", "content": formatted_prompt}
    ],
    temperature=0.2,
    max_tokens=3500
)
```

### 3. Dual-Tier LLM Architecture
- **Semantic Relevance Filter:** Evaluates ambiguous incoming articles with low-latency prompt classification (is this a genuine physical supply chain disruption or consumer commentary?).
- **RAG Impact Reasoner:** Evaluates retrieved historical precedents against current disruption parameters, synthesizing evidence-grounded downstream impact reports.

---

## 📊 Qualitative Intelligence Scenarios (Ground Truth)

NexusFlow's master graph continuously correlates global chokepoint telemetry with corporate supply chains. Key canonical intelligence benchmarks include:

| Disruption Node | Severity Tier | Monitored Signal | Strategic Commodities | Downstream Propagations |
| :--- | :--- | :--- | :--- | :--- |
| **Iran / Hormuz** | 🔴 **Severe** (0.95) | Naval missile drills & tanker seizures | Crude Oil, Petroleum, LNG | Iranian oil export embargo $\rightarrow$ crude tanker freight rates $+42\%$ $\rightarrow$ refinery margin compression across BPCL, IOC, Sinopec. |
| **Red Sea** | 🔴 **Severe** (0.82) | Houthi drone strikes on commercial cargo | Containerized Freight, Crude, Electronics | Transit diversions via Cape of Good Hope ($+12$ to $+16$ days transit) $\rightarrow$ global container slot squeeze $\rightarrow$ EU auto plant delays. |
| **Panama Canal** | 🟠 **High** (0.58) | Drought-induced Gatun Lake level drop | Grain, Soybeans, LNG, Consumer Goods | Daily draft slots reduced from 36 to 24 vessels $\rightarrow$ demurrage surcharges $\rightarrow$ US Gulf Coast grain re-routed via Cape. |
| **Suez Canal** | 🟠 **High** (0.49) | Maritime transit congestion | Manufactured Goods, Fertilizer, Crude | Vessel queuing cascades into European gateway hub bottlenecks (Rotterdam, Antwerp, Hamburg). |
| **Taiwan** | 🟡 **Medium** (0.28) | Industrial drought & water rationing | 300mm Silicon Wafers, Sub-7nm ICs | Semiconductor fab water allocations reduced $\rightarrow$ wafer starts delayed $\rightarrow$ Apple, NVIDIA, and auto ECU lead times extended $+6$ weeks. |
| **Chile** | 🟢 **Low** (0.15) | Copper extraction labor strikes | Refined Copper Cathodes | Smelter feedstock delays causing spot cathode premiums in East Asian wire manufacturing. |

---

## 🎨 Enterprise Design System & Visual Rigor

In strict compliance with modern executive intelligence dashboards, NexusFlow abandons generic neon-blue futuristic tropes in favor of a warm, distinguished enterprise visual identity:

- **Canvas Background:** `#EDE8D0` (Subtle Warm Cream)
- **Primary Panels & Cards:** `#895129` (Rich Saddle Brown)
- **Primary Panel Text:** `#FFFFFF` (Clean High-Contrast White)
- **Executive Body Text:** `#17130F` (Deep Charcoal Umber)
- **Zero Glassmorphism:** Solid cards, subtle borders, crisp contrast, and zero transparent blurs.

### Severity Legend & Geospatial Hotspot Protocol

Both the **3D WebGL Night Globe** and **2D Vector Map** strictly adhere to the unified 4-tier severity protocol:

<div align="center">

| Tier | Hex Code | Visual Marker | Dynamic Intensity | Article Threshold |
| :---: | :---: | :---: | :---: | :---: |
| **Severe** | `#EF4444` | 🔴 Red Sphere & Pulsing Ripple | $\ge 0.70$ | $7+$ Articles |
| **High** | `#F97316` | 🟠 Orange Sphere & Pulsing Ripple | $0.40 - 0.69$ | $4 - 6$ Articles |
| **Medium** | `#EAB308` | 🟡 Yellow Sphere & Pulsing Ripple | $0.20 - 0.39$ | $2 - 3$ Articles |
| **Low** | `#FEF08A` | ⚪ Cream / Pale Yellow Sphere | $< 0.20$ | $1$ Article |

</div>

---

## 🖥️ Frontend Dashboard Views

The NexusFlow frontend is organized into 8 functional executive views:

1. **Executive Dashboard:** Top KPI metrics (Active Events, Regions Affected, Commodities Impacted, Industries at Risk), Interactive Disruption Map, Latest Disruption Feed, Top Commodities and Top Industries.
2. **Live Events:** Real-time stream of parsed, normalized, and scored events with entity badges, relevance confidence, and source links.
3. **Global Disruption Map:** Fullscreen geospatial intelligence console with 2D/3D mode toggling, dynamic intensity filters (*Severe Only*, *High & Severe*, *All*), and mouse drag-to-pan & wheel-zoom navigation.
4. **Supply Chain Causal Network:** A 3-tier directed graph (*Chokepoints $\rightarrow$ Strategic Commodities $\rightarrow$ Enterprise Consumers*) with interactive Bezier flow curves and causal edge weights.
5. **Event Analysis (Live Nemotron RAG):** On-demand deep reasoning console. Submit any current disruption query to execute real-time Vector RAG against ChromaDB and prompt NVIDIA Nemotron on Nebius Token Factory.
6. **Historical Parallels:** Vector-indexed case library of seminal past disruptions (2021 Suez blockage, 2022 Rhine low water levels, 2021 Texas winter storm, 2020 semiconductor chip shortage).
7. **Data Sources:** Live connector health telemetry monitoring NewsAPI and maritime RSS feeds with ping latency and ingestion status.
8. **System Status:** Operational health monitor showing API status, ChromaDB vector count, Master Graph node/edge volume, and Nebius Token Factory connection.

---

## 🔌 API Documentation

### Core Endpoints

#### 1. Real-Time Vector RAG Analysis
`POST /api/rag/analyze`

Executes semantic cosine retrieval over ChromaDB and synthesizes structured supply-chain intelligence via NVIDIA Nemotron on Nebius Token Factory.

**Request Body:**
```json
{
  "query": "Houthi naval missile strikes near Bab el-Mandeb forcing container vessels around Africa",
  "top_k": 3
}
```

**Response (Sample):**
```json
{
  "query": "Houthi naval missile strikes near Bab el-Mandeb forcing container vessels around Africa",
  "summary": "Maritime missile strikes near Bab el-Mandeb have severely disrupted container transit through the Red Sea and Suez Canal, forcing major carriers to reroute around the Cape of Good Hope, adding 10-14 transit days and inflating container spot rates.",
  "affected_entities": {
    "commodities": ["Crude Oil", "Liquefied Natural Gas", "Semiconductors", "Refined Fuels"],
    "industries": ["Maritime Shipping", "Energy & Utilities", "Automotive", "Consumer Retail"],
    "companies": ["Maersk", "Hapag-Lloyd", "BPCL", "Tesla"]
  },
  "propagation_chains": [
    {
      "step": 1,
      "description": "Carrier rerouting around Cape of Good Hope absorbs 8-10% of global vessel capacity."
    },
    {
      "step": 2,
      "description": "European port congestion intensifies at Rotterdam and Antwerp due to bunched arrivals."
    },
    {
      "step": 3,
      "description": "Automotive assembly lines in Germany face parts shortages for sub-assemblies."
    }
  ],
  "historical_precedents": [
    {
      "title": "2021 Suez Canal Ever Given Obstruction",
      "similarity_score": 0.89,
      "mechanism_overlap": "Complete blockage of the Asia-Europe maritime corridor leading to container bunching and spot freight surges.",
      "key_differences": "The Ever Given was an accidental physical grounding lasting 6 days, whereas the Red Sea crisis represents prolonged asymmetric security risks."
    }
  ],
  "actionable_recommendations": [
    "Secure air freight charters for high-value critical components (automotive ECUs, medical sensors).",
    "Buffer inventory thresholds at European distribution centers from 14 days to 30 days.",
    "Activate alternative intermodal rail corridors across Central Asia where available."
  ],
  "model_metadata": {
    "model_name": "nvidia/nemotron-3-super-120b-a12b",
    "inference_mode": "live_nebius_token_factory",
    "is_mock": false,
    "nebius_configured": true
  }
}
```

#### 2. Disruption Hotspots (Globe & 2D Map)
`GET /api/master_graph/hotspots`

Returns geographic coordinates, article counts, disruption types, and calibrated intensity tiers for all active hotspots.

#### 3. Master Supply Chain Graph
`GET /api/master_graph`

Returns the full NetworkX serialized MultiDiGraph including nodes, categorical types, relationship triples, and accumulated edge weights.

#### 4. Phase 1 Ingestion Trigger
`POST /api/phase1/run`

Triggers live ingestion from NewsAPI and RSS feed connectors, runs deduplication and spaCy NER extraction, and populates the SQLite ground truth database.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Python:** 3.10 to 3.14
- **Node.js:** 18+ and `npm`
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/DhruvPatel0110/NexusFlow-NvidiaNebius-Hackathon.git
cd NexusFlow-NvidiaNebius-Hackathon
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r req.txt

# Download spaCy NER model
python -m spacy download en_core_web_sm

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your credentials:
```env
# Required for live NVIDIA Nemotron inference:
NEBIUS_API_KEY="your-nebius-token-factory-key"
NEBIUS_BASE_URL="https://api.tokenfactory.nebius.com/v1"
ACTIVE_NEBIUS_MODEL="nvidia/nemotron-3-super-120b-a12b"

# Optional for live external news ingestion:
NEWS_API_KEY="your-news-api-key"
```

> **Note:** If `NEBIUS_API_KEY` is not provided, NexusFlow automatically operates in deterministic offline demonstration mode without crashing, serving grounded heuristic baselines.

### 3. Launch Backend Server
From the project root:
```bash
python run.py
```
*Backend runs at `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`).*

### 4. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Dashboard runs at `http://localhost:5173`.*

---

## 🧪 Testing & Verification

NexusFlow includes an automated integration test suite verifying all 9 core subsystems:

```bash
# Activate virtual environment in backend/
pytest tests/test_nexusflow_backend.py -v
```

### Verification Coverage:
- `test_database_initialization`: SQLite MasterDB schema and tables.
- `test_embeddings_generation`: 384-dimensional ONNX vector generation.
- `test_vector_store_cosine_search`: ChromaDB similarity querying.
- `test_spacy_ner_extraction`: Entity and role classification.
- `test_master_graph_accumulation`: MultiDiGraph edge weighting.
- `test_globe_hotspots_generation`: 4-tier geospatial intensity calibration.
- `test_nebius_client_live_inference`: NVIDIA Nemotron live invocation.
- `test_rag_pipeline_end_to_end`: Query $\rightarrow$ Context Retrieval $\rightarrow$ Nemotron Synthesis.
- `test_api_endpoints_health`: FastAPI endpoint contracts.

---

## 👥 Hackathon Team & Acknowledgements

- **Developer & Architect:** Dhruv Patel
- **Hackathon:** Nebius x NVIDIA Global AI Hackathon (2026)
- **Track:** Best Apps and Agents
- **Powered by:**
  - **Nebius Token Factory** for ultra-fast, hosted NVIDIA Nemotron inference.
  - **NVIDIA** for the open-source Nemotron-3 Super 120B reasoning model.
  - **FastAPI**, **NetworkX**, **ChromaDB**, and **React** for reliable open architecture.

---

<div align="center">
<strong>NexusFlow</strong> — <em>Turning Global Disruption Signals into Actionable Supply-Chain Intelligence.</em>
</div>