"""
NexusFlow — Dynamic Relevance Scorer

Judges whether an incoming news report describes an actual physical supply chain
disruption. Uses NVIDIA Nemotron via Nebius Token Factory as the primary inference engine,
with seamless backward compatibility with Groq and deterministic heuristics.
"""

import json
import logging
import asyncio
from typing import Optional, List, Dict, Any

from config import NEBIUS_ENABLED, GROQ_API_KEY, GROQ_MODEL
from nebius_client import NebiusNemotronClient

logger = logging.getLogger("nexusflow.relevance_scorer")


class RelevanceScorer:
    """
    Judges if an article is actually about supply chain disruption.
    Powered by Nebius Token Factory (NVIDIA Nemotron).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        groq_api_key: Optional[str] = None,
    ):
        self.groq_api_key = groq_api_key or GROQ_API_KEY
        self.nebius_client = NebiusNemotronClient(api_key=api_key)
        self.cache: Dict[str, Dict[str, Any]] = self.nebius_client._cache

    def _build_cache_key(self, headline: str, entities: List[str]) -> str:
        entities_str = ",".join(sorted(str(e).strip().lower() for e in (entities or [])))
        return f"rel:{headline.strip().lower()}:{entities_str}"

    async def score_article_async(
        self,
        headline: str,
        summary: str,
        entities: Optional[List[str]] = None,
        max_retries: int = 2,
    ) -> Dict[str, Any]:
        """
        Asynchronously score an article using NVIDIA Nemotron via Nebius Token Factory.
        """
        entities = entities or []
        cache_key = self._build_cache_key(headline, entities)
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Check if Groq is explicitly configured or mocked (e.g. in legacy tests)
        if self.groq_api_key and not self.nebius_client.is_live:
            try:
                from groq import Groq
                client = Groq(api_key=self.groq_api_key)
                prompt = f"Headline: {headline}\nSummary: {summary}\nEntities: {entities}"
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: client.chat.completions.create(
                        model=GROQ_MODEL,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.1,
                    )
                )
                text = response.choices[0].message.content.strip()
                # Clean markdown
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                parsed = json.loads(text.strip())
                res = {
                    "relevant": bool(parsed.get("relevant", False)),
                    "score": float(parsed.get("score", 0.0)),
                    "reason": str(parsed.get("reason", "")),
                    "disruption_type": str(parsed.get("disruption_type", "none")),
                    "affected_domains": list(parsed.get("affected_domains", [])),
                }
                self.cache[cache_key] = res
                return res
            except Exception as e:
                logger.debug(f"Groq score failed or not active: {e}")

        # Primary route: Nebius Token Factory
        return await self.nebius_client.judge_relevance_async(
            headline=headline,
            summary=summary,
            entities=entities,
        )

    def score_article(
        self,
        headline: str,
        summary: str,
        entities: Optional[List[str]] = None,
        max_retries: int = 2,
    ) -> Dict[str, Any]:
        """
        Synchronously judge relevance of an article.
        """
        entities = entities or []
        cache_key = self._build_cache_key(headline, entities)
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Check if Groq is explicitly configured or mocked (e.g. in legacy unit tests)
        if self.groq_api_key and not self.nebius_client.is_live:
            try:
                from groq import Groq
                client = Groq(api_key=self.groq_api_key)
                prompt = f"Headline: {headline}\nSummary: {summary}\nEntities: {entities}"
                response = client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                )
                text = response.choices[0].message.content.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                parsed = json.loads(text.strip())
                res = {
                    "relevant": bool(parsed.get("relevant", False)),
                    "score": float(parsed.get("score", 0.0)),
                    "reason": str(parsed.get("reason", "")),
                    "disruption_type": str(parsed.get("disruption_type", "none")),
                    "affected_domains": list(parsed.get("affected_domains", [])),
                }
                self.cache[cache_key] = res
                return res
            except Exception as e:
                logger.debug(f"Sync Groq score failed or not active: {e}")

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(
                        asyncio.run,
                        self.score_article_async(headline, summary, entities, max_retries)
                    ).result()
            else:
                return loop.run_until_complete(
                    self.score_article_async(headline, summary, entities, max_retries)
                )
        except Exception:
            return asyncio.run(
                self.score_article_async(headline, summary, entities, max_retries)
            )

    def batch_score(self, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Score multiple articles in sequence."""
        results = []
        for item in articles:
            headline = item.get("headline") or item.get("title") or ""
            summary = item.get("summary") or item.get("description") or item.get("content") or ""
            entities = item.get("entities") or []
            relevance = self.score_article(headline, summary, entities)
            results.append({
                "article": item,
                "relevance": relevance,
            })
        return results

    def clear_cache(self):
        """Clear in-memory cache."""
        self.cache.clear()
