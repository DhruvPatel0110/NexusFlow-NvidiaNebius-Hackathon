"""
NexusFlow — Canonical Seed Dataset & Pipeline Initializer

Seeds realistic, structured supply-chain disruption articles into master.db
and runs Phase 2A (ChromaDB Vector Indexing) and Phase 2B (Master Graph Construction).
"""

import json
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from database import MasterDB
from phase2 import run_phase2a, run_phase2b

sample_articles = [
    {
        "article_id": "a3f9c2d1e7b5f8a9c4e6d2f1b8a3c5e7",
        "source_name": "Reuters",
        "source_type": "rss",
        "title": "Houthi attacks disrupt Red Sea shipping lanes",
        "content_snippet": "Ongoing attacks by Houthi militants have forced major shipping companies to reroute vessels via Cape of Good Hope, delaying crude oil and LNG shipments.",
        "url": "https://reuters.com/business/red-sea-disruption-2025",
        "published_at": "2025-01-15T10:30:00Z",
        "ingested_at": "2025-01-15T11:00:00Z",
        "is_relevant": True,
        "confidence": 0.91,
        "relevance_score": 0.95,
        "disruption_type": "geopolitical",
        "event_category": "geopolitical",
        "primary_commodities": ["crude oil", "liquefied natural gas"],
        "all_entities": {
            "organizations": ["maersk", "opec"],
            "locations": ["red sea", "suez canal", "yemen", "cape of good hope"],
            "products_mentioned": ["crude oil", "lng"],
            "events_mentioned": ["attacks"],
            "money_signals": ["$90 per barrel"],
            "percent_signals": ["12% increase"],
            "entity_roles": {
                "maersk": "logistics_node",
                "red sea": "logistics_node",
                "opec": "regulatory_body",
                "yemen": "disruption_cause",
                "suez canal": "logistics_node",
                "cape of good hope": "logistics_node"
            }
        },
        "relationships": [
            ["yemen", "disrupts", "red sea"],
            ["red sea", "routes_through", "suez canal"],
            ["suez canal", "disrupts", "crude oil"],
            ["maersk", "depends_on", "red sea"],
            ["maersk", "reroutes_around", "cape of good hope"],
            ["opec", "controls_price_of", "crude oil"]
        ],
        "economic_impact_chain": [
            "Houthi militant attacks on Red Sea shipping vessels",
            "Major shipping companies reroute via Cape of Good Hope",
            "Transit time increases by 10 to 14 days",
            "Crude oil delivery delays to European markets",
            "Crude oil spot price increases",
            "Fuel costs increase globally",
            "Logistics costs increase across all industries"
        ]
    },
    {
        "article_id": "b4e8d3c2f1a5b6c7d8e9f0a1b2c3d4e5",
        "source_name": "Bloomberg",
        "source_type": "rss",
        "title": "Taiwan drought threatens global semiconductor chip supply",
        "content_snippet": "Severe drought in Taiwan restricts water supplies to major semiconductor foundries including TSMC, threatening global chip production.",
        "url": "https://bloomberg.com/news/taiwan-semiconductor-drought-2025",
        "published_at": "2025-01-16T14:20:00Z",
        "ingested_at": "2025-01-16T15:00:00Z",
        "is_relevant": True,
        "confidence": 0.88,
        "relevance_score": 0.90,
        "disruption_type": "natural_disaster",
        "event_category": "weather",
        "primary_commodities": ["semiconductors", "silicon wafers"],
        "all_entities": {
            "organizations": ["tsmc", "apple", "nvidia"],
            "locations": ["taiwan", "hsinchu science park"],
            "products_mentioned": ["semiconductors", "chips"],
            "events_mentioned": ["drought", "water rationing"],
            "money_signals": ["$15 billion loss"],
            "percent_signals": ["15% reduction"],
            "entity_roles": {
                "tsmc": "supplier",
                "apple": "consumer",
                "nvidia": "consumer",
                "taiwan": "logistics_node"
            }
        },
        "relationships": [
            ["drought", "disrupts", "taiwan"],
            ["taiwan", "produces", "semiconductors"],
            ["tsmc", "supplies", "semiconductors"],
            ["apple", "depends_on", "semiconductors"],
            ["nvidia", "depends_on", "tsmc"]
        ],
        "economic_impact_chain": [
            "Severe drought in Taiwan reduces reservoir levels",
            "Government imposes water restrictions on Hsinchu Science Park",
            "TSMC slows semiconductor wafer fabrication",
            "Global chip shortage affects consumer electronics and automotive sectors",
            "Lead times for advanced microprocessors double"
        ]
    },
    {
        "article_id": "c5f9e4d3a2b1c8d7e6f5a4b3c2d1e0f9",
        "source_name": "Financial Times",
        "source_type": "rss",
        "title": "Iran naval drills restrict Strait of Hormuz commercial traffic",
        "content_snippet": "Military exercises in the Strait of Hormuz lead to commercial shipping advisories and immediate maritime insurance premium spikes for oil tankers.",
        "url": "https://ft.com/content/iran-hormuz-shipping-alert-2025",
        "published_at": "2025-02-01T08:00:00Z",
        "ingested_at": "2025-02-01T09:00:00Z",
        "is_relevant": True,
        "confidence": 0.94,
        "relevance_score": 0.96,
        "disruption_type": "geopolitical",
        "event_category": "geopolitical",
        "primary_commodities": ["crude oil", "petroleum"],
        "all_entities": {
            "organizations": ["saudi aramco", "bpcl", "ioc"],
            "locations": ["iran", "strait of hormuz", "persian gulf"],
            "products_mentioned": ["crude oil", "diesel"],
            "events_mentioned": ["naval drills", "blockade risk"],
            "money_signals": ["$94 per barrel"],
            "percent_signals": ["5% spike"],
            "entity_roles": {
                "iran": "disruption_cause",
                "strait of hormuz": "logistics_node",
                "saudi aramco": "supplier",
                "bpcl": "consumer",
                "ioc": "consumer"
            }
        },
        "relationships": [
            ["iran", "disrupts", "strait of hormuz"],
            ["strait of hormuz", "disrupts", "crude oil"],
            ["saudi aramco", "supplies", "crude oil"],
            ["bpcl", "depends_on", "crude oil"],
            ["ioc", "depends_on", "crude oil"]
        ],
        "economic_impact_chain": [
            "Iranian military forces initiate naval maneuvers near Strait of Hormuz",
            "War risk insurance premiums surge 300% for Persian Gulf tankers",
            "Tankers pause loading at Ras Tanura and Kuwait ports",
            "Asian refineries evaluate strategic petroleum reserve drawdowns",
            "Diesel and aviation fuel cracks widen on supply interruption fears"
        ]
    },
    {
        "article_id": "d6a0f5e4b3c2d1e0f9a8b7c6d5e4f3a2",
        "source_name": "Wall Street Journal",
        "source_type": "rss",
        "title": "Panama Canal water levels drop forcing daily vessel transit cuts",
        "content_snippet": "El Nino weather pattern causes historic drought in Gatun Lake, forcing the Panama Canal Authority to restrict vessel draft and reduce daily transits.",
        "url": "https://wsj.com/articles/panama-canal-drought-transit-cuts-2025",
        "published_at": "2025-02-10T12:00:00Z",
        "ingested_at": "2025-02-10T13:00:00Z",
        "is_relevant": True,
        "confidence": 0.89,
        "relevance_score": 0.92,
        "disruption_type": "logistics",
        "event_category": "weather",
        "primary_commodities": ["shipping containers", "liquefied natural gas"],
        "all_entities": {
            "organizations": ["panama canal authority", "maersk", "hapag lloyd"],
            "locations": ["panama", "panama canal", "gatun lake"],
            "products_mentioned": ["containers", "lng"],
            "events_mentioned": ["drought", "transit restriction"],
            "money_signals": ["$4 million auction slot"],
            "percent_signals": ["33% reduction"],
            "entity_roles": {
                "panama canal authority": "regulatory_body",
                "panama canal": "logistics_node",
                "gatun lake": "logistics_node",
                "maersk": "consumer",
                "hapag lloyd": "consumer"
            }
        },
        "relationships": [
            ["gatun lake", "disrupts", "panama canal"],
            ["panama canal authority", "regulates", "panama canal"],
            ["panama canal", "disrupts", "shipping containers"],
            ["maersk", "depends_on", "panama canal"]
        ],
        "economic_impact_chain": [
            "Extended drought lowers water volume in Gatun Lake",
            "Panama Canal Authority restricts daily vessel passages from 36 to 24",
            "Vessel backlog swells to over 130 ships waiting on both Pacific and Atlantic sides",
            "Carriers reroute via Suez Canal or Magellan Strait adding 15 days travel",
            "US East Coast container freight rates increase by 45%"
        ]
    }
]

def seed():
    print("=" * 60)
    print("NexusFlow: Seeding Canonical Supply Chain Disruption Dataset")
    print("=" * 60)
    db = MasterDB()
    for art in sample_articles:
        success = db.insert_article(art)
        print(f"  - [{art['disruption_type'].upper()}] '{art['title']}': inserted={success}")
    db.close()

    print("\nRunning Phase 2A (Local ONNX Embeddings & ChromaDB Persistence)...")
    import asyncio
    asyncio.run(run_phase2a())

    print("\nRunning Phase 2B (NetworkX Master Graph Construction)...")
    mg = run_phase2b()
    if mg:
        stats = mg.get_graph_stats()
        print("\n=== Master Graph Population Complete ===")
        print(f"Total Nodes: {stats['total_nodes']}")
        print(f"Total Edges: {stats['total_edges']}")
        print(f"Nodes by type: {stats['nodes_by_type']}")
        print(f"Top entities by weight: {stats['top_nodes_by_weight'][:6]}")
        hotspots = mg.get_hotspots_for_globe()
        print(f"Globe Hotspots: {len(hotspots.get('hotspots', []))} active disruption regions identified.")

if __name__ == "__main__":
    seed()
