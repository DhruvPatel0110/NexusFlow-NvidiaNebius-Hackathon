/**
 * NexusFlow — Centralized API Client
 *
 * Connects frontend to the FastAPI intelligence service endpoints:
 *   - Real-time ingestion (/api/phase1/run)
 *   - Geographic disruption hotspots (/api/master_graph/hotspots)
 *   - NetworkX Master Graph (/api/master_graph)
 *   - Vector search & article ground-truth (/api/articles, /api/query)
 *   - NVIDIA Nemotron RAG reasoning on Nebius Token Factory (/api/rag/analyze)
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedErr = errText;
      try {
        const json = JSON.parse(errText);
        parsedErr = json.detail || json.message || errText;
      } catch (_) {}
      throw new Error(`API ${res.status}: ${parsedErr}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`[NexusFlow API] Error at ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // System Health & Stats
  getHealth: () => request('/health'),
  getStats: () => request('/api/stats'),
  getRelevanceMetrics: () => request('/api/monitoring/relevance'),

  // Disruption Articles & Historical Feed
  getArticles: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.offset) searchParams.append('offset', params.offset);
    if (params.relevant_only !== undefined) searchParams.append('relevant_only', params.relevant_only);
    if (params.disruption_type) searchParams.append('disruption_type', params.disruption_type);
    if (params.min_score) searchParams.append('min_score', params.min_score);
    const qs = searchParams.toString();
    return request(`/api/articles${qs ? `?${qs}` : ''}`);
  },

  // Geographic Disruption Hotspots (for 2D Map & 3D Globe)
  getHotspots: () => request('/api/master_graph/hotspots'),

  // Master Graph
  getMasterGraph: () => request('/api/master_graph'),
  getGraphStats: () => request('/api/graph/stats'),
  getEntityHighlight: (entityId) => request(`/api/master_graph/highlight/${encodeURIComponent(entityId)}`),
  searchEntities: (query) => request(`/api/master_graph/search?query=${encodeURIComponent(query)}`),

  // ChromaDB Vector Search (Phase 3)
  queryVectorRAG: (query, topK = 5, category = null) => {
    const searchParams = new URLSearchParams({ query, top_k: topK });
    if (category) searchParams.append('category', category);
    return request(`/api/query?${searchParams.toString()}`);
  },

  // NVIDIA Nemotron AI Impact Reasoning via Nebius Token Factory (Phase 4)
  analyzeImpactRAG: (query, topK = 3, category = null, currentEvent = null) => {
    return request('/api/rag/analyze', {
      method: 'POST',
      body: JSON.stringify({
        query,
        top_k: topK,
        event_category: category,
        current_event: currentEvent,
      }),
    });
  },

  // Ingestion Triggers (Phase 1)
  triggerIngestion: () => request('/api/phase1/run', { method: 'POST' }),
  triggerFullPipeline: () => request('/api/pipeline/run', { method: 'POST' }),
};

export default api;

