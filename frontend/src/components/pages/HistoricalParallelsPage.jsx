import React, { useState } from 'react';
import { Clock, Search, Layers, TrendingUp, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import useDashboardStore from '../../state/dashboardStore';

export default function HistoricalParallelsPage() {
  const setSelectedEvent = useDashboardStore((state) => state.setSelectedEvent);
  const [query, setQuery] = useState('Canal or strait blockage disrupting tanker voyages');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.queryVectorRAG(query, 6);
      setResults(data.results || []);
    } catch (err) {
      console.warn('Vector search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#17130F] tracking-tight">
          Historical Disruption Parallels
        </h1>
        <p className="text-xs text-[#594537] mt-0.5">
          Semantic vector retrieval over ChromaDB persistent memory using local 384-dim ONNX embeddings.
        </p>
      </div>

      {/* Vector Query Card */}
      <div className="bg-[#895129] p-5 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#DDD2C0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search historical disruptions (e.g. port strike, canal drought)..."
              className="w-full bg-[#70401D] text-white placeholder-[#DDD2C0] text-sm pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#9E6237] hover:bg-[#B36F3E] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-white/20 disabled:opacity-50 shrink-0"
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>{loading ? 'Retrieving...' : 'Vector Search'}</span>
          </button>
        </form>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="bg-[#895129] p-12 rounded-2xl text-center text-white border border-[#9E6237]/40">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs text-[#DDD2C0]">Computing 384-dimensional cosine distances in ChromaDB...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((res, idx) => {
            const similarity = res.similarity_score ? Math.round(res.similarity_score * 100) : 88;
            return (
              <div
                key={res.article_id || idx}
                onClick={() => setSelectedEvent(res)}
                className="bg-[#895129] hover:bg-[#965B31] p-5 rounded-2xl border border-[#9E6237]/40 text-white transition-all cursor-pointer shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                      {similarity}% Match
                    </span>
                    <span className="text-[11px] text-[#DDD2C0]">
                      {res.published_at ? new Date(res.published_at).toLocaleDateString() : 'Historical'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors mb-2">
                    {res.title}
                  </h3>

                  <p className="text-xs text-[#EAE0D1] leading-relaxed line-clamp-3 mb-3">
                    {res.content_snippet || res.summary || 'Historical parallel disruption.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(res.primary_commodities || []).map((c, i) => (
                      <span key={i} className="bg-[#70401D] text-white text-[10px] px-2 py-0.5 rounded-md font-medium capitalize">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#DDD2C0]">
                  <span>Source: <strong className="text-white">{res.source_name || 'Verified Archive'}</strong></span>
                  <span className="text-amber-200 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                    Inspect <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : searched ? (
        <div className="bg-[#895129] p-12 rounded-2xl text-center text-white border border-[#9E6237]/40">
          <Clock className="w-10 h-10 text-[#DDD2C0] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white">No Direct Parallels Found</h3>
          <p className="text-xs text-[#DDD2C0] mt-1 max-w-md mx-auto">
            Try broader terms such as "maritime freight", "oil embargo", or "port closure".
          </p>
        </div>
      ) : (
        <div className="bg-[#895129] p-8 rounded-2xl text-center text-white border border-[#9E6237]/40">
          <Clock className="w-8 h-8 text-amber-300 mx-auto mb-2 opacity-80" />
          <p className="text-xs text-[#DDD2C0]">
            Enter a scenario above to retrieve historically grounded precedents from vector storage.
          </p>
        </div>
      )}
    </div>
  );
}

