"""
NexusFlow — Phase 2.2: Embedding Generation

Responsible for:
  - Loading the embedding model (using ChromaDB ONNX all-MiniLM-L6-v2, with
    sentence-transformers fallback if available)
  - Constructing a compound semantic string per article that concentrates
    the supply-chain signal (title, commodities, entities, relationships,
    economic impact chain, event type, source)
  - Generating 384-dimensional float vectors for compound strings and search queries
  - Ensuring the exact same semantic vector space is used for both indexing and RAG retrieval
"""

import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Global model holder — loaded once, reused across articles and RAG queries
# ---------------------------------------------------------------------------

_model = None


class _OnnxEmbeddingWrapper:
    """Wrapper around ChromaDB's ONNX all-MiniLM-L6-v2 embedding function."""

    def __init__(self):
        from chromadb.utils import embedding_functions
        self._fn = embedding_functions.DefaultEmbeddingFunction()

    def encode(self, text: str) -> list[float]:
        if isinstance(text, list):
            res = self._fn(text)
            return [list(map(float, v)) for v in res]
        res = self._fn([text])
        return [float(x) for x in res[0]]


def load_embedding_model():
    """
    Load the embedding model into memory.
    Safe to call multiple times: re-uses the already-loaded global instance.
    Prefers ChromaDB's ONNX all-MiniLM-L6-v2 (local, zero external network).
    """
    global _model
    if _model is not None:
        logger.debug("Embedding model already loaded — reusing existing instance.")
        return

    # Try ChromaDB ONNX first
    try:
        logger.info("Initializing ChromaDB ONNX 'all-MiniLM-L6-v2' embedding model...")
        _model = _OnnxEmbeddingWrapper()
        # Warmup
        _ = _model.encode("NexusFlow supply chain intelligence initialization")
        logger.info("ChromaDB ONNX embedding model initialized successfully (dim=384).")
        return
    except Exception as e:
        logger.warning(f"ChromaDB ONNX embedding model initialization failed: {e}. Trying sentence-transformers...")

    # Fallback to sentence-transformers if installed
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformers model 'all-MiniLM-L6-v2'...")
        _st_model = SentenceTransformer("all-MiniLM-L6-v2")

        class _STWrapper:
            def __init__(self, m):
                self._m = m
            def encode(self, text):
                emb = self._m.encode(text)
                return emb.tolist()

        _model = _STWrapper(_st_model)
        logger.info("SentenceTransformer model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load any embedding model: {e}", exc_info=True)
        raise RuntimeError(f"Could not load any embedding model: {e}")


def _get_model():
    """Return the loaded model, initializing if not yet loaded."""
    global _model
    if _model is None:
        load_embedding_model()
    return _model


# ---------------------------------------------------------------------------
# Compound string construction
# ---------------------------------------------------------------------------

def _build_compound_string(article: dict) -> str:
    """
    Construct a dense supply-chain semantic string from a normalized article.
    Concentrates the signal into a single passage.
    """
    title: str = article.get("title") or ""
    source_name: str = article.get("source_name") or "unknown"
    event_category: str = article.get("event_category") or "unknown"

    # Commodities
    primary_commodities: list = article.get("primary_commodities") or []
    commodities_str = (
        ", ".join(str(c) for c in primary_commodities if c)
        if primary_commodities
        else "unknown"
    )

    # Entity roles
    all_entities: dict = article.get("all_entities") or {}
    entity_roles: dict = all_entities.get("entity_roles") or {}
    if entity_roles:
        entities_parts = [
            f"{name} ({role.replace('_', ' ')})"
            for name, role in entity_roles.items()
            if name and role
        ]
        entities_str = ", ".join(entities_parts) if entities_parts else "none"
    else:
        entities_str = "none"

    # Relationships
    relationships: list = article.get("relationships") or []
    if relationships:
        rel_parts = []
        for triple in relationships:
            if isinstance(triple, (list, tuple)) and len(triple) == 3:
                source, rel_type, target = triple
                rel_parts.append(f"{source} {rel_type} {target}")
        relationships_str = ", ".join(rel_parts) if rel_parts else "none"
    else:
        relationships_str = "none"

    # Economic impact chain
    economic_chain: list = article.get("economic_impact_chain") or []
    if economic_chain:
        steps = [str(s).strip() for s in economic_chain if s]
        impact_str = " causes ".join(steps)
    else:
        impact_str = "unknown"

    # Assemble compound string
    compound = (
        f"{title}.\n"
        f"Commodities affected: {commodities_str}.\n"
        f"Entities: {entities_str}.\n"
        f"Relationships: {relationships_str}.\n"
        f"Economic impact: {impact_str}.\n"
        f"Event type: {event_category}.\n"
        f"Source: {source_name}."
    )

    return compound.strip()


def _minimal_fallback_string(article: dict) -> str:
    """Minimal compound string for articles missing most structured fields."""
    title = article.get("title") or "unknown article"
    source = article.get("source_name") or "unknown source"
    return f"{title}. Source: {source}."


# ---------------------------------------------------------------------------
# Public Embedding API
# ---------------------------------------------------------------------------

def generate_embedding(article: dict) -> tuple[str, list[float]]:
    """
    Generate a 384-dimensional embedding for a single normalized article.

    Returns:
        Tuple of (compound_string: str, embedding_vector: list[float]).
    """
    model = _get_model()

    try:
        compound_string = _build_compound_string(article)
        if len(compound_string.strip()) < 20:
            compound_string = _minimal_fallback_string(article)
    except Exception as e:
        logger.warning(f"Compound string construction failed: {e}. Using minimal fallback.")
        compound_string = _minimal_fallback_string(article)

    try:
        embedding_vector = model.encode(compound_string)
        return compound_string, embedding_vector
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}", exc_info=True)
        raise


def encode_query(query: str) -> list[float]:
    """
    Generate a 384-dimensional embedding for a user search or RAG context query.
    Uses the exact same embedding model and parameter space as article vectors.
    """
    model = _get_model()
    if not query or not query.strip():
        query = "supply chain disruption"
    return model.encode(query.strip())
