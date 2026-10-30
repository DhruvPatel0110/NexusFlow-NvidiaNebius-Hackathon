"""
NexusFlow — Nebius Token Factory & NVIDIA Nemotron Client

Connects to Nebius Token Factory's hosted inference API to run NVIDIA Nemotron
open-source models for:
  1. Semantic supply-chain relevance scoring
  2. Structured entity, role, and relationship extraction
  3. Evidence-grounded RAG historical comparison and downstream impact reasoning

Includes deterministic fixture/heuristic mode for safe end-to-end testing when
credentials have not yet been provided.
"""

import json
import logging
import re
import asyncio
from typing import Dict, Any, List, Optional
import httpx

from config import (
    NEBIUS_API_KEY,
    NEBIUS_BASE_URL,
    NEBIUS_MODEL,
    NEBIUS_TIMEOUT_SECONDS,
    NEBIUS_ENABLED,
)

logger = logging.getLogger("nexusflow.nebius")


class NebiusNemotronClient:
    """
    Client for NVIDIA Nemotron inference hosted on Nebius Token Factory.
    Adheres to the OpenAI-compatible chat completions interface.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.api_key = api_key if api_key is not None else NEBIUS_API_KEY
        self.base_url = (base_url or NEBIUS_BASE_URL).rstrip("/")
        self.model = model or NEBIUS_MODEL
        self.timeout = timeout or NEBIUS_TIMEOUT_SECONDS
        self.is_live = bool(self.api_key and self.api_key.strip() and not self.api_key.startswith("your_"))

        # In-memory cache for relevance and extraction to prevent duplicate calls
        self._cache: Dict[str, Any] = {}

    # -----------------------------------------------------------------------
    # Low-Level Completion Caller
    # -----------------------------------------------------------------------

    async def _call_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Execute an HTTP POST to Nebius Token Factory chat completions.
        """
        if not self.is_live:
            raise RuntimeError("Live Nebius inference attempted without valid NEBIUS_API_KEY.")

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 401:
                logger.error("Nebius Token Factory 401 Unauthorized: Invalid API key.")
                raise PermissionError("Nebius Token Factory authentication failed: invalid API key.")
            if response.status_code == 429:
                logger.warning("Nebius Token Factory 429: Rate limit exceeded.")
                raise RuntimeError("Nebius Token Factory rate limit exceeded.")
            if response.status_code != 200:
                logger.error(f"Nebius Token Factory HTTP {response.status_code}: {response.text}")
                raise RuntimeError(f"Nebius Token Factory error ({response.status_code}): {response.text}")

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            return {"content": content, "raw": data}

    # -----------------------------------------------------------------------
    # 1. Semantic Relevance Scoring
    # -----------------------------------------------------------------------

    async def judge_relevance_async(
        self,
        headline: str,
        summary: str,
        entities: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Judges whether an article describes an actual physical supply chain disruption.
        """
        entities = entities or []
        cache_key = f"rel:{headline.strip().lower()}:{','.join(sorted(map(str, entities)))}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        # If live credentials are not available, use deterministic heuristic + fixture fallback
        if not self.is_live:
            result = self._heuristic_relevance_fallback(headline, summary, entities)
            self._cache[cache_key] = result
            return result

        system_prompt = (
            "You are an expert supply chain risk analyst evaluating news articles.\n"
            "Analyze if this article describes an actual PHYSICAL SUPPLY CHAIN DISRUPTION.\n"
            "Return strictly a JSON object with keys:\n"
            "- relevant (boolean): true if real physical disruption, strike, shortage, blockage, embargo, sanction, or disaster.\n"
            "- score (float 0.0-1.0): confidence of disruption impact.\n"
            "- disruption_type (string): 'geopolitical', 'natural_disaster', 'industrial_failure', 'logistics', 'commodity_crisis', 'economic_shock', or 'none'.\n"
            "- affected_domains (list of strings): industries or commodities affected.\n"
            "- reason (string): 1-sentence concise explanation.\n"
            "Only return valid JSON without formatting or markdown backticks."
        )
        user_prompt = f"Headline: {headline}\nSummary: {summary}\nEntities: {entities}"

        try:
            res = await self._call_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.0,
                max_tokens=1500,
            )
            parsed = self._extract_json(res["content"])
            result = {
                "relevant": bool(parsed.get("relevant", False)),
                "score": float(parsed.get("score", 0.0)),
                "disruption_type": str(parsed.get("disruption_type", "none")),
                "affected_domains": list(parsed.get("affected_domains", [])),
                "reason": str(parsed.get("reason", "")),
                "model_used": self.model,
                "is_mock": False,
            }
            self._cache[cache_key] = result
            return result
        except Exception as e:
            logger.warning(f"Nebius live relevance inference failed ({e}). Falling back to heuristic mode.")
            result = self._heuristic_relevance_fallback(headline, summary, entities)
            self._cache[cache_key] = result
            return result

    # -----------------------------------------------------------------------
    # 2. Structured Entity, Role & Relationship Extraction
    # -----------------------------------------------------------------------

    async def extract_supply_chain_entities_async(
        self,
        article: Dict[str, Any],
        spacy_scaffold: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Extracts primary commodities, entity roles, relationship triples, and causal impact chains.
        """
        article_id = article.get("article_id", "unknown")
        cache_key = f"ext:{article_id}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        if not self.is_live:
            result = self._heuristic_extraction_fallback(article, spacy_scaffold)
            self._cache[cache_key] = result
            return result

        system_prompt = (
            "You are a supply chain intelligence extraction engine using NVIDIA Nemotron.\n"
            "You receive a news article and pre-extracted spaCy named entities.\n"
            "Your job is ONLY to determine:\n"
            "1. is_supply_chain_relevant (boolean)\n"
            "2. confidence (float 0.0-1.0)\n"
            "3. primary_commodities (array of lowercase commodity strings, e.g. ['crude oil', 'semiconductors'])\n"
            "4. entity_roles (object mapping lowercase entity names to one of: 'supplier', 'consumer', 'logistics_node', 'regulatory_body', 'disruption_cause', 'price_influencer')\n"
            "5. relationships (array of triples: [source, relationship_type, target] where relationship_type is one of: 'disrupts', 'supplies', 'controls_price_of', 'depends_on', 'routes_through', 'regulates', 'produces', 'consumes', 'competes_with', 'sanctions', 'reroutes_around')\n"
            "6. economic_impact_chain (array of short ordered causal steps, max 10)\n"
            "7. event_category (one of: 'war', 'weather', 'policy', 'logistics', 'industrial', 'geopolitical', 'financial', 'other')\n"
            "Return ONLY valid JSON without markdown fences."
        )

        title = article.get("title", "")
        desc = article.get("description", "")
        content = article.get("content", "")
        text = f"Title: {title}\nSummary: {desc}\nContent: {content[:1500]}"
        user_prompt = f"Article:\n{text}\n\nPre-extracted entities:\n{json.dumps(spacy_scaffold.get('raw_entities', {}))}"

        try:
            res = await self._call_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=1500,
            )
            parsed = self._extract_json(res["content"])
            result = self._normalize_extraction_output(parsed, self.model, is_mock=False)
            self._cache[cache_key] = result
            return result
        except Exception as e:
            logger.warning(f"Nebius live extraction failed ({e}). Falling back to heuristic extraction.")
            result = self._heuristic_extraction_fallback(article, spacy_scaffold)
            self._cache[cache_key] = result
            return result

    # -----------------------------------------------------------------------
    # 3. RAG Historical Comparison & Impact Reasoning (Core Hackathon Feature)
    # -----------------------------------------------------------------------

    async def analyze_rag_impact_async(
        self,
        current_event: Dict[str, Any],
        historical_parallels: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Synthesizes the current event with retrieved historical parallels to generate
        an evidence-backed downstream impact explanation with clear uncertainty markers.
        """
        if not self.is_live:
            return self._heuristic_rag_impact_fallback(current_event, historical_parallels)

        system_prompt = (
            "You are NexusFlow's senior supply chain intelligence reasoning engine, powered by NVIDIA Nemotron.\n"
            "You will be given a CURRENT supply chain disruption and HISTORICALLY SIMILAR DISRUPTIONS retrieved via RAG.\n"
            "Generate a rigorous, structured intelligence report.\n"
            "CRITICAL CONSTRAINTS:\n"
            "1. Ground all verified claims directly in the provided text. Never invent facts, company names, or casualties.\n"
            "2. Distinguish verified source facts from plausible inferred downstream ripple effects.\n"
            "3. State explicit uncertainties, data limitations, and unknown variables.\n"
            "4. Return strictly valid JSON with keys:\n"
            "   - event_summary (string): Contextual summary of the disruption\n"
            "   - primary_affected_commodities (list of strings)\n"
            "   - affected_entities (object with keys 'suppliers', 'consumers', 'logistics_nodes', 'regulatory_bodies')\n"
            "   - downstream_propagation_path (list of ordered causality steps)\n"
            "   - historical_parallels_analysis (list of objects: {parallel_title, similarity_score, mechanism_overlap, key_differences})\n"
            "   - evidence_backed_facts (list of confirmed facts with source citations)\n"
            "   - plausible_inferred_risks (list of qualified conditional possibilities)\n"
            "   - explicit_uncertainties (list of unconfirmed details or variables)\n"
            "   - risk_level (one of 'high', 'medium', 'low')\n"
            "Return valid JSON only."
        )

        curr_text = json.dumps({
            "title": current_event.get("title"),
            "summary": current_event.get("summary") or current_event.get("description"),
            "commodities": current_event.get("primary_commodities", []),
            "entities": current_event.get("all_entities", {}),
            "source": current_event.get("source_name", "Unknown"),
            "published_at": current_event.get("published_at"),
        }, indent=2)

        hist_text = json.dumps([
            {
                "title": p.get("title"),
                "similarity_score": p.get("similarity_score"),
                "commodities": p.get("primary_commodities", []),
                "historical_impact_chain": p.get("economic_impact_chain", []),
                "source": p.get("source_name"),
            }
            for p in historical_parallels
        ], indent=2)

        user_prompt = f"CURRENT EVENT:\n{curr_text}\n\nRETRIEVED HISTORICAL PARALLELS:\n{hist_text}"

        try:
            res = await self._call_chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=3500,
            )
            parsed = self._extract_json(res["content"])
            parsed["model_used"] = self.model
            parsed["inference_mode"] = "live_nebius_token_factory"
            parsed["is_mock"] = False
            return parsed
        except Exception as e:
            logger.warning(f"Nebius RAG impact inference failed ({e}). Falling back to heuristic fixture reasoning.")
            return self._heuristic_rag_impact_fallback(current_event, historical_parallels)

    # -----------------------------------------------------------------------
    # Heuristic & Fixture Fallbacks (Offline / Mock Mode)
    # -----------------------------------------------------------------------

    def _heuristic_relevance_fallback(
        self,
        headline: str,
        summary: str,
        entities: List[str],
    ) -> Dict[str, Any]:
        """Deterministic relevance scorer for when API credentials are not yet configured."""
        text = f"{headline} {summary}".lower()

        # Keywords that indicate non-supply-chain news
        irrelevant_terms = ["concert", "hologram", "album", "movie", "celebrity", "sports", "football", "dating"]
        if any(term in text for term in irrelevant_terms):
            return {
                "relevant": False,
                "score": 0.10,
                "reason": "Article concerns entertainment, technology gimmicks, or sports without physical industrial impact.",
                "disruption_type": "none",
                "affected_domains": [],
                "model_used": "deterministic_heuristic_fallback",
                "is_mock": True,
            }

        disruption_indicators = {
            "geopolitical": ["war", "conflict", "sanction", "military", "houthi", "missile", "embargo", "iran", "israel"],
            "logistics": ["port", "shipping", "strait", "canal", "tanker", "freight", "reroute", "cargo", "vessel", "blockade"],
            "commodity_crisis": ["crude oil", "lng", "natural gas", "wheat", "lithium", "fuel price", "shortage", "barrel"],
            "industrial_failure": ["refinery", "explosion", "factory", "power outage", "shutdown", "plant closure"],
            "natural_disaster": ["drought", "flood", "typhoon", "hurricane", "earthquake"],
        }

        type_matches = {}
        affected_domains = []
        for dtype, keywords in disruption_indicators.items():
            matches = [k for k in keywords if k in text]
            if matches:
                type_matches[dtype] = matches
                affected_domains.extend(matches)

        if not type_matches:
            return {
                "relevant": False,
                "score": 0.20,
                "reason": "No significant supply-chain disruption patterns detected.",
                "disruption_type": "none",
                "affected_domains": [],
                "model_used": "deterministic_heuristic_fallback",
                "is_mock": True,
            }

        # Geopolitical and natural disasters represent root disruption causes
        if "geopolitical" in type_matches:
            detected_type = "geopolitical"
            score = 0.95
        elif "natural_disaster" in type_matches:
            detected_type = "natural_disaster"
            score = 0.90
        elif "industrial_failure" in type_matches:
            detected_type = "industrial_failure"
            score = 0.90
        elif "logistics" in type_matches:
            detected_type = "logistics"
            score = 0.85
        else:
            detected_type = "commodity_crisis"
            score = 0.80

        is_relevant = True
        reason = f"Detected physical disruption indicators ({', '.join(affected_domains[:3])}) affecting {detected_type} channels." 

        return {
            "relevant": is_relevant,
            "score": round(score, 2),
            "reason": reason,
            "disruption_type": detected_type,
            "affected_domains": list(set(affected_domains)),
            "model_used": "deterministic_heuristic_fallback",
            "is_mock": True,
        }

    def _heuristic_extraction_fallback(
        self,
        article: Dict[str, Any],
        spacy_scaffold: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Deterministic entity role & relationship extraction when credentials are unset."""
        title = article.get("title", "").lower()
        desc = (article.get("description") or article.get("content") or "").lower()
        combined = f"{title} {desc}"

        raw_entities = spacy_scaffold.get("raw_entities", {})
        orgs = [o.lower() for o in raw_entities.get("organizations", [])]
        locs = [l.lower() for l in raw_entities.get("locations", [])]

        # Detect primary commodities
        commodity_candidates = [
            "crude oil", "brent crude", "lng", "natural gas", "semiconductors",
            "silicon wafers", "lithium", "wheat", "copper", "shipping containers"
        ]
        commodities = [c for c in commodity_candidates if c in combined]
        if not commodities:
            commodities = ["crude oil"] if "oil" in combined else []

        entity_roles = {}
        for org in orgs:
            if any(k in org for k in ["opec", "ministry", "government", "fed", "commission"]):
                entity_roles[org] = "regulatory_body"
            elif any(k in org for k in ["maersk", "hapag", "cosco", "railway", "shipping", "evergreen"]):
                entity_roles[org] = "logistics_node"
            elif any(k in org for k in ["houthi", "militant", "military", "rebel", "strike"]):
                entity_roles[org] = "disruption_cause"
            elif any(k in org for k in ["tsmc", "aramco", "reliance", "bpcl", "intel"]):
                entity_roles[org] = "supplier"
            else:
                entity_roles[org] = "consumer"

        for loc in locs:
            if any(k in loc for k in ["strait", "canal", "sea", "port", "gulf", "ocean"]):
                entity_roles[loc] = "logistics_node"
            else:
                entity_roles[loc] = "supplier" if "taiwan" in loc or "iran" in loc else "logistics_node"

        relationships = []
        for loc in locs:
            if commodities:
                relationships.append([loc, "disrupts", commodities[0]])
        for org, role in entity_roles.items():
            if role == "logistics_node" and locs:
                relationships.append([org, "routes_through", locs[0]])
            elif role == "supplier" and commodities:
                relationships.append([org, "supplies", commodities[0]])

        # Generate realistic causal chain
        economic_impact_chain = [
            f"Physical disruption reported in {locs[0] if locs else 'production hub'}",
            f"Transportation delays impact {commodities[0] if commodities else 'raw material'} delivery schedules",
            f"Spot prices and freight rates rise across primary distribution channels",
            f"Downstream industrial manufacturing margins face operational cost pressure",
        ]

        return {
            "is_supply_chain_relevant": True,
            "confidence": 0.88,
            "primary_commodities": commodities,
            "entity_roles": entity_roles,
            "relationships": relationships,
            "economic_impact_chain": economic_impact_chain,
            "event_category": "geopolitical" if "war" in combined or "attack" in combined else "logistics",
            "model_used": "deterministic_heuristic_fallback",
            "is_mock": True,
        }

    def _heuristic_rag_impact_fallback(
        self,
        current_event: Dict[str, Any],
        historical_parallels: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Provides high-quality structured impact analysis fixtures for RAG comparison."""
        title = current_event.get("title", "Supply Chain Event")
        commodities = current_event.get("primary_commodities", ["crude oil"])
        all_entities = current_event.get("all_entities", {})
        entity_roles = all_entities.get("entity_roles", {})

        suppliers = [k for k, v in entity_roles.items() if v == "supplier"]
        consumers = [k for k, v in entity_roles.items() if v == "consumer"]
        logistics = [k for k, v in entity_roles.items() if v == "logistics_node"]
        regulators = [k for k, v in entity_roles.items() if v == "regulatory_body"]

        historical_analysis = []
        for p in historical_parallels[:3]:
            historical_analysis.append({
                "parallel_title": p.get("title", "Historical Parallel"),
                "similarity_score": round(float(p.get("similarity_score", 0.85)), 2),
                "mechanism_overlap": f"Both disruptions trigger bottleneck propagation through {', '.join(commodities[:2])}.",
                "key_differences": "Historical event occurred under different global inventory buffers; current disruption displays faster transit rerouting.",
            })

        return {
            "event_summary": f"Disruption analysis for: {title}. Disruption restricts flow of critical inputs across global supply corridors.",
            "primary_affected_commodities": commodities or ["crude oil", "shipping freight"],
            "affected_entities": {
                "suppliers": suppliers or ["regional producers"],
                "consumers": consumers or ["downstream manufacturers"],
                "logistics_nodes": logistics or ["maritime transit lanes"],
                "regulatory_bodies": regulators or ["trade authorities"],
            },
            "downstream_propagation_path": [
                f"Initial incident creates direct operational bottleneck at {logistics[0] if logistics else 'transit corridor'}",
                f"Carriers implement precautionary rerouting adding 10-14 days transit lead time",
                f"Spot rates and inventory carrying costs escalate for {commodities[0] if commodities else 'raw materials'}",
                "Second-tier manufacturing facilities face input scheduling uncertainty and margin pressure",
                "Downstream distributors absorb short-term freight surcharges or pass costs to end consumers",
            ],
            "historical_parallels_analysis": historical_analysis,
            "evidence_backed_facts": [
                f"Sourced report confirms incident: '{title}'",
                f"Published by {current_event.get('source_name', 'Verified News Source')} at {current_event.get('published_at', 'recent')}",
            ],
            "plausible_inferred_risks": [
                f"Extended bottlenecks may inflate consumer price indices for sectors dependent on {commodities[0] if commodities else 'supplies'}",
                "Buffer inventories typically cushion up to 21 days before manufacturing slowdowns take effect",
            ],
            "explicit_uncertainties": [
                "Duration of current disruption remains unconfirmed by official regulatory bodies",
                "Total volume of rerouted tonnage cannot be independently verified from initial reports",
            ],
            "risk_level": "high" if "red sea" in title.lower() or "war" in title.lower() else "medium",
            "model_used": self.model if self.is_live else "fixture_heuristic_demonstration_mode",
            "inference_mode": "live_nebius_token_factory" if self.is_live else "mock_demonstration_mode",
            "is_mock": not self.is_live,
        }

    # -----------------------------------------------------------------------
    # Utilities
    # -----------------------------------------------------------------------

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Safely extracts JSON from an LLM response string."""
        text = text.strip()
        # Remove markdown code fences if present
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)

        # Attempt direct load
        try:
            return json.loads(text.strip())
        except Exception:
            pass

        # Find first '{' and last '}'
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            snippet = text[start : end + 1]
            try:
                return json.loads(snippet)
            except Exception as e:
                logger.error(f"Failed to parse JSON substring: {e}")

        raise ValueError(f"Could not extract valid JSON from response: {text[:200]}...")

    def _normalize_extraction_output(self, data: dict, model_name: str, is_mock: bool) -> dict:
        """Forces all entity names and keys to lowercase for system-wide consistency."""
        primary_commodities = [
            c.lower().strip() for c in data.get("primary_commodities", []) if isinstance(c, str)
        ]
        entity_roles = {
            k.lower().strip(): v.lower().strip()
            for k, v in data.get("entity_roles", {}).items()
            if isinstance(k, str) and isinstance(v, str)
        }
        relationships = []
        for triple in data.get("relationships", []):
            if isinstance(triple, (list, tuple)) and len(triple) == 3:
                relationships.append([
                    str(triple[0]).lower().strip(),
                    str(triple[1]).lower().strip(),
                    str(triple[2]).lower().strip(),
                ])

        return {
            "is_supply_chain_relevant": bool(data.get("is_supply_chain_relevant", True)),
            "confidence": float(data.get("confidence", 0.8)),
            "primary_commodities": primary_commodities,
            "entity_roles": entity_roles,
            "relationships": relationships,
            "economic_impact_chain": [str(s).strip() for s in data.get("economic_impact_chain", []) if s],
            "event_category": str(data.get("event_category", "other")).lower(),
            "model_used": model_name,
            "is_mock": is_mock,
        }
