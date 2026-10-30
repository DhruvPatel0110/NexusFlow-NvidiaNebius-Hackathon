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
    },
    {
        "article_id": "e7b1a6f5c4d3e2f1a0b9c8d7e6f5a4b3",
        "source_name": "Associated Press",
        "source_type": "rss",
        "title": "Francis Scott Key Bridge Collapse Halts Baltimore Port Cargo Operations",
        "content_snippet": "Container ship collision with Key Bridge closes the Port of Baltimore, severing vital roll-on/roll-off automotive logistics and coal export channels.",
        "url": "https://apnews.com/article/baltimore-key-bridge-collapse-shipping-2025",
        "published_at": "2025-02-18T05:45:00Z",
        "ingested_at": "2025-02-18T06:30:00Z",
        "is_relevant": True,
        "confidence": 0.95,
        "relevance_score": 0.96,
        "disruption_type": "logistics",
        "event_category": "logistics",
        "primary_commodities": ["automotive vehicles", "coal", "shipping containers"],
        "all_entities": {
            "organizations": ["csx", "norfolk southern", "general motors", "ford"],
            "locations": ["baltimore", "port of baltimore", "chesapeake bay"],
            "products_mentioned": ["cars", "coal", "containers"],
            "events_mentioned": ["bridge collapse", "channel closure"],
            "money_signals": ["$2 billion freight rerouting"],
            "percent_signals": ["100% harbor closure"],
            "entity_roles": {
                "port of baltimore": "logistics_node",
                "csx": "supplier",
                "general motors": "consumer",
                "ford": "consumer"
            }
        },
        "relationships": [
            ["bridge collapse", "disrupts", "port of baltimore"],
            ["port of baltimore", "routes_through", "chesapeake bay"],
            ["port of baltimore", "disrupts", "automotive vehicles"],
            ["csx", "depends_on", "port of baltimore"],
            ["general motors", "depends_on", "port of baltimore"]
        ],
        "economic_impact_chain": [
            "Container vessel Dali strikes Francis Scott Key Bridge causing structural collapse",
            "US Coast Guard suspends all commercial maritime vessel traffic in Baltimore Harbor",
            "Major US automotive manufacturers reroute 800,000 vehicle imports to Norfolk and New York",
            "East Coast railway freight corridors encounter yard congestion and intermodal delays",
            "US metallurgical coal export shipments halted, spiking European steelmaking costs"
        ]
    },
    {
        "article_id": "f8c2b7a6d5e4f3a2b1c0d9e8f7a6b5c4",
        "source_name": "Handelsblatt",
        "source_type": "rss",
        "title": "Rhine River Low Water Halts European Industrial Chemical Barges",
        "content_snippet": "Summer heatwave reduces water depth at the Kaub gauge, forcing inland chemical and coal barges to load at only 25% capacity along the Rhine waterway.",
        "url": "https://handelsblatt.com/rhine-river-drought-chemical-logistics-2025",
        "published_at": "2025-02-22T09:15:00Z",
        "ingested_at": "2025-02-22T10:00:00Z",
        "is_relevant": True,
        "confidence": 0.91,
        "relevance_score": 0.93,
        "disruption_type": "natural_disaster",
        "event_category": "weather",
        "primary_commodities": ["industrial chemicals", "coal", "plastics"],
        "all_entities": {
            "organizations": ["basf", "bayer", "thyssenkrupp"],
            "locations": ["rhine river", "kaub", "ludwigshafen", "rotterdam"],
            "products_mentioned": ["chemicals", "feedstock", "raw materials"],
            "events_mentioned": ["drought", "water level drop"],
            "money_signals": ["€500 million surcharge"],
            "percent_signals": ["75% payload cut"],
            "entity_roles": {
                "rhine river": "logistics_node",
                "kaub": "logistics_node",
                "basf": "consumer",
                "thyssenkrupp": "consumer"
            }
        },
        "relationships": [
            ["drought", "disrupts", "rhine river"],
            ["rhine river", "disrupts", "industrial chemicals"],
            ["basf", "depends_on", "rhine river"],
            ["thyssenkrupp", "depends_on", "rhine river"]
        ],
        "economic_impact_chain": [
            "Severe drought lowers Kaub chokepoint water depth below 40 centimeters",
            "Inland freight barges restricted to quarter cargo capacity to avoid grounding",
            "BASF and petrochemical majors declare force majeure on European specialty plastics",
            "Inland logistics freight surcharges rise over 350% across Germany and Netherlands",
            "Automotive manufacturing plants experience raw polymer component shortages"
        ]
    },
    {
        "article_id": "a9d3c8b7e6f5a4b3c2d1e0f9a8b7c6d5",
        "source_name": "Lloyds List",
        "source_type": "rss",
        "title": "German Port Workers 48-Hour Strike Shuts Hamburg and Bremerhaven Terminals",
        "content_snippet": "Ver.di trade union stages dockworker strike across key North Sea container hubs, halting container crane operations and backing up North European container flows.",
        "url": "https://lloydslist.com/german-port-worker-strike-2025",
        "published_at": "2025-02-25T11:00:00Z",
        "ingested_at": "2025-02-25T11:30:00Z",
        "is_relevant": True,
        "confidence": 0.89,
        "relevance_score": 0.91,
        "disruption_type": "industrial",
        "event_category": "industrial",
        "primary_commodities": ["containerized electronics", "machinery", "automotive parts"],
        "all_entities": {
            "organizations": ["ver.di union", "hapag lloyd", "hhla", "volkswagen"],
            "locations": ["hamburg", "bremerhaven", "north sea"],
            "products_mentioned": ["containers", "auto components"],
            "events_mentioned": ["dockworker strike", "crane shutdown"],
            "money_signals": ["€1.2 billion backlog"],
            "percent_signals": ["100% terminal halt"],
            "entity_roles": {
                "hamburg": "logistics_node",
                "bremerhaven": "logistics_node",
                "volkswagen": "consumer",
                "hapag lloyd": "logistics_node"
            }
        },
        "relationships": [
            ["dockworker strike", "disrupts", "hamburg"],
            ["hamburg", "disrupts", "containerized electronics"],
            ["volkswagen", "depends_on", "bremerhaven"],
            ["hapag lloyd", "depends_on", "hamburg"]
        ],
        "economic_impact_chain": [
            "Dockworkers initiate 48-hour total work stoppage at HHLA container terminals",
            "Over 45 mega-container vessels anchor offshore waiting for berths in North Sea",
            "German automotive manufacturing assembly lines curtail production shifts",
            "Container dwell times double to 12 days across regional logistics hubs",
            "European intra-continental freight rates spike 28% on road feeder reallocation"
        ]
    },
    {
        "article_id": "b0e4d9c8f7a6b5c4d3e2f1a0b9c8d7e6",
        "source_name": "Platts S&P Global",
        "source_type": "rss",
        "title": "Gulf of Mexico Hurricane Forces Shutdown of Offshore Oil and Gas Rigs",
        "content_snippet": "Category 4 hurricane in the US Gulf of Mexico prompts evacuation of 180 offshore platforms, curtailing 42% of crude output and shuttering Houston export channels.",
        "url": "https://spglobal.com/energy/gulf-hurricane-oil-gas-curtailment-2025",
        "published_at": "2025-02-28T16:00:00Z",
        "ingested_at": "2025-02-28T16:45:00Z",
        "is_relevant": True,
        "confidence": 0.93,
        "relevance_score": 0.95,
        "disruption_type": "natural_disaster",
        "event_category": "weather",
        "primary_commodities": ["crude oil", "natural gas", "gasoline"],
        "all_entities": {
            "organizations": ["chevron", "shell", "bsee", "valero"],
            "locations": ["gulf of mexico", "houston ship channel", "louisiana coast"],
            "products_mentioned": ["crude", "offshore gas", "refined fuels"],
            "events_mentioned": ["hurricane", "platform evacuation"],
            "money_signals": ["$96 per barrel"],
            "percent_signals": ["42% production shutdown"],
            "entity_roles": {
                "gulf of mexico": "logistics_node",
                "houston ship channel": "logistics_node",
                "chevron": "supplier",
                "valero": "consumer"
            }
        },
        "relationships": [
            ["hurricane", "disrupts", "gulf of mexico"],
            ["gulf of mexico", "disrupts", "crude oil"],
            ["chevron", "depends_on", "gulf of mexico"],
            ["valero", "depends_on", "crude oil"]
        ],
        "economic_impact_chain": [
            "Category 4 Hurricane sweeps through primary oil lease blocks in US Gulf",
            "BSEE reports shut-in of 850,000 barrels per day of domestic crude production",
            "Houston Ship Channel closes to deep-draft tanker navigation",
            "US Gulf Coast refinery runs drop 18% on crude feedstock interruption",
            "Wholesale gasoline futures surge 14% on immediate regional retail supply constraints"
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
