"""
NexusFlow — Configuration & Environment Settings

Loads configuration from .env, validates API endpoints, and defines constants
for the real-time ingestion, RAG retrieval, and NVIDIA Nemotron inference pipeline.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Path resolutions
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load .env from backend/ or project root
_env_loaded = False
for env_path in [BACKEND_DIR / ".env", PROJECT_ROOT / ".env"]:
    if env_path.exists():
        load_dotenv(env_path)
        _env_loaded = True
        break

# ---------------------------------------------------------------------------
# Nebius Token Factory & NVIDIA Nemotron Settings
# ---------------------------------------------------------------------------
NEBIUS_API_KEY: str = os.getenv("NEBIUS_API_KEY", "")
NEBIUS_BASE_URL: str = os.getenv(
    "NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1"
).rstrip("/")
NEBIUS_MODEL: str = os.getenv(
    "NEBIUS_MODEL", "nvidia/nemotron-3-super-120b-a12b"
)

# Request timeout for model inference (seconds)
NEBIUS_TIMEOUT_SECONDS: float = float(os.getenv("NEBIUS_TIMEOUT_SECONDS", "45.0"))

# Flag indicating whether live Nebius inference is active
NEBIUS_ENABLED: bool = bool(NEBIUS_API_KEY and NEBIUS_API_KEY.strip() and not NEBIUS_API_KEY.startswith("your_"))

# Legacy / Secondary fallback provider (Groq)
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
FALLBACK_GROQ_MODEL: str = os.getenv("FALLBACK_GROQ_MODEL", "llama-3.3-70b-versatile")

# NewsAPI Settings
NEWSAPI_KEY: str = os.getenv("NEWSAPI_KEY") or os.getenv("NEWS_API_KEY", "")
NEWSAPI_BASE_URL: str = "https://newsapi.org/v2/top-headlines"
NEWSAPI_CATEGORIES: list[str] = ["business", "technology", "science"]
NEWSAPI_PAGE_SIZE: int = 50

# ---------------------------------------------------------------------------
# Database & Storage Paths
# ---------------------------------------------------------------------------
def _resolve_data_path(env_val: str, default_subpath: str) -> str:
    val = (env_val or "").strip()
    if not val:
        return str((BACKEND_DIR / default_subpath).resolve())
    p = Path(val)
    if not p.is_absolute():
        return str((BACKEND_DIR / p).resolve())
    return str(p.resolve())

DATABASE_PATH: str = _resolve_data_path(os.getenv("DATABASE_PATH", ""), "data/master.db")
CHROMA_PATH: str = _resolve_data_path(os.getenv("CHROMA_PATH", ""), "data/chroma_db")
GRAPH_PATH: str = _resolve_data_path(os.getenv("GRAPH_PATH", ""), "data/master_graph.json")

# Ensure data and log directories exist
Path(DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
Path(CHROMA_PATH).mkdir(parents=True, exist_ok=True)
Path(GRAPH_PATH).parent.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_DIR = BACKEND_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "nexusflow.log"

_log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
_file_handler.setLevel(logging.DEBUG)
_file_handler.setFormatter(logging.Formatter(_log_format))

_console_handler = logging.StreamHandler()
_console_handler.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))
_console_handler.setFormatter(logging.Formatter(_log_format))

# Reset handlers to avoid duplicate log records
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)
root_logger.handlers.clear()
root_logger.addHandler(_file_handler)
root_logger.addHandler(_console_handler)

logger = logging.getLogger("nexusflow.config")

if not NEBIUS_ENABLED:
    logger.info(
        "INFO: NEBIUS_API_KEY is not configured or is a placeholder. "
        "NexusFlow will run using deterministic heuristic fallback & fixtures "
        "so the pipeline can be tested end-to-end without live credentials."
    )
else:
    logger.info(f"Nebius Token Factory configured with model '{NEBIUS_MODEL}' at '{NEBIUS_BASE_URL}'.")

if not NEWSAPI_KEY:
    logger.debug("NEWSAPI_KEY is not set — NewsAPI will be skipped, RSS feeds will be used.")

# ---------------------------------------------------------------------------
# RSS Feed Sources (High-credibility free sources)
# ---------------------------------------------------------------------------
RSS_FEEDS: list[dict] = [
    {"name": "BBC Business", "url": "https://feeds.bbci.co.uk/news/business/rss.xml"},
    {"name": "Economic Times", "url": "https://economictimes.indiatimes.com/rssfeedstopstories.cms"},
    {"name": "Financial Express", "url": "https://www.financialexpress.com/feed/"},
    {"name": "Mint Economy", "url": "https://www.livemint.com/rss/economy"},
    {"name": "CNBC World News", "url": "https://search.cnbc.com/rs/search/combinedrenderer/view.xml?partnerId=2000&keywords=business&target=all"},
    {"name": "Google News Business", "url": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB"},
    {"name": "Yahoo Finance", "url": "https://finance.yahoo.com/news/rssindex"},
    {"name": "MarketWatch Top Stories", "url": "https://feeds.content.dowjones.io/public/rss/mw_topstories"},
    {"name": "Al Jazeera Economy", "url": "https://www.aljazeera.com/xml/rss/all.xml"},
    {"name": "WSJ Markets", "url": "https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness"},
]

# ---------------------------------------------------------------------------
# spaCy Model
# ---------------------------------------------------------------------------
SPACY_MODEL: str = os.getenv("SPACY_MODEL", "en_core_web_sm")

SPACY_ENTITY_TYPES: set[str] = {
    "ORG", "GPE", "LOC", "PRODUCT", "EVENT", "NORP",
    "MONEY", "PERCENT", "QUANTITY",
}
