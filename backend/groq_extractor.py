"""
NexusFlow — Phase 1 Step 1.3: LLM Relationship Extraction

Calls NVIDIA Nemotron on Nebius Token Factory (with fallback to Groq or deterministic heuristics)
to extract supply-chain relevance, entity roles, relationship triples, and causal impact chains.
"""

import json
import asyncio
import logging

from config import NEBIUS_ENABLED, GROQ_API_KEY, GROQ_MODEL, FALLBACK_GROQ_MODEL
from nebius_client import NebiusNemotronClient

logger = logging.getLogger("nexusflow.extractor")

_nebius_client = NebiusNemotronClient()


async def extract_relationships_groq(
    article: dict, spacy_scaffold: dict, max_retries: int = 2
) -> dict | None:
    """
    Primary relationship extraction function for the ingestion pipeline.
    Uses NVIDIA Nemotron via Nebius Token Factory when configured,
    with graceful fallback to heuristic extraction or Groq.
    """
    article_id = article.get("article_id", "unknown")
    logger.info(f"Extracting relationships for article '{article_id}'...")

    try:
        # Use Nebius Token Factory client
        res = await _nebius_client.extract_supply_chain_entities_async(article, spacy_scaffold)
        return res
    except Exception as e:
        logger.warning(f"Nebius relationship extraction failed for '{article_id}': {e}. Trying fallback...")

    # Secondary fallback to Groq if key is present
    if GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            title = article.get("title") or ""
            desc = article.get("description") or ""
            text = f"{title}\n\n{desc}"[:1500]

            system_prompt = (
                "You are a supply chain intelligence extraction engine. Return valid JSON only with keys: "
                "is_supply_chain_relevant (bool), confidence (float), primary_commodities (list of lowercase strings), "
                "entity_roles (dict), relationships (list of [source, type, target]), economic_impact_chain (list of str), "
                "event_category (str)."
            )
            scaffold_json = json.dumps(spacy_scaffold.get("raw_entities", {}))
            user_msg = f"Article:\n{text}\n\nEntities:\n{scaffold_json}"

            loop = asyncio.get_event_loop()
            completion = await loop.run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg},
                    ],
                    temperature=0.1,
                    max_tokens=1000,
                )
            )
            raw = completion.choices[0].message.content.strip()
            parsed = json.loads(raw)
            return _nebius_client._normalize_extraction_output(parsed, model_name=GROQ_MODEL, is_mock=False)
        except Exception as e:
            logger.error(f"Groq fallback extraction failed for '{article_id}': {e}")

    # Final deterministic heuristic fallback
    return _nebius_client._heuristic_extraction_fallback(article, spacy_scaffold)
