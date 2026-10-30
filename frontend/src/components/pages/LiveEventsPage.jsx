import React, { useState, useMemo } from 'react';
import { FileText, Search, Filter, AlertTriangle, ArrowRight, Brain, Globe, Tag } from 'lucide-react';
import useDashboardStore from '../../state/dashboardStore';

export default function LiveEventsPage() {
  const articles = useDashboardStore((state) => state.articles);
  const setSelectedEvent = useDashboardStore((state) => state.setSelectedEvent);
  const runRAGAnalysis = useDashboardStore((state) => state.runRAGAnalysis);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const text = `${a.title} ${a.content_snippet || ''} ${a.source_name || ''}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());
      
      const type = (a.disruption_type || a.event_category || '').toLowerCase();
      const matchesType = selectedType === 'all' || type.includes(selectedType);

      const score = a.relevance_score || a.confidence || 0.8;
      let matchesSeverity = true;
      if (selectedSeverity === 'high') matchesSeverity = score >= 0.9;
      else if (selectedSeverity === 'medium') matchesSeverity = score >= 0.7 && score < 0.9;
      else if (selectedSeverity === 'low') matchesSeverity = score < 0.7;

      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [articles, search, selectedType, selectedSeverity]);

  const handleQuickAnalyze = (e, article) => {
    e.stopPropagation();
    const query = `${article.title}. ${article.content_snippet || ''}`;
    runRAGAnalysis(query, 3, article.event_category || article.disruption_type);
    setActiveTab('analysis');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#17130F] tracking-tight">
          Live Supply Chain Events
        </h1>
        <p className="text-xs text-[#594537] mt-0.5">
          Real-time dual-source news & RSS disruption feed filtered by NVIDIA Nemotron.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#895129] p-4 rounded-2xl border border-[#9E6237]/40 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#DDD2C0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by headline, source, or commodity..."
            className="w-full bg-[#70401D] text-white placeholder-[#DDD2C0] text-xs pl-9 pr-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#EAE0D1]">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#70401D] text-white text-xs px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none"
          >
            <option value="all">All Disruption Types</option>
            <option value="geopolitical">Geopolitical & Conflict</option>
            <option value="logistics">Logistics & Shipping</option>
            <option value="commodity">Commodity Crises</option>
            <option value="natural_disaster">Natural Disasters & Weather</option>
            <option value="industrial">Industrial Failures & Strikes</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-[#70401D] text-white text-xs px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity (≥90%)</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredArticles.length === 0 ? (
        <div className="bg-[#895129] p-12 rounded-2xl text-center text-white border border-[#9E6237]/40">
          <FileText className="w-10 h-10 text-[#DDD2C0] mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white">No Matching Events Found</h3>
          <p className="text-xs text-[#DDD2C0] mt-1 max-w-md mx-auto">
            Try adjusting your search keywords or resetting filters to view all incoming supply chain disruption events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((article) => {
            const score = article.relevance_score || article.confidence || 0.8;
            const isHigh = score >= 0.9;
            const isMedium = score >= 0.7 && score < 0.9;

            return (
              <div
                key={article.article_id}
                onClick={() => setSelectedEvent(article)}
                className="bg-[#895129] hover:bg-[#965B31] text-white p-5 rounded-2xl border border-[#9E6237]/40 transition-all cursor-pointer shadow-xs flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isHigh
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : isMedium
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-yellow-400/20 text-yellow-200 border border-yellow-400/30'
                        }`}
                      >
                        {article.disruption_type || 'Disruption'}
                      </span>
                      <span className="text-[11px] text-[#DDD2C0]">
                        Score: {Math.round(score * 100)}%
                      </span>
                    </div>
                    <span className="text-[11px] text-[#DDD2C0]">
                      {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-amber-200 transition-colors">
                    {article.title}
                  </h3>

                  {/* Summary Snippet */}
                  <p className="text-xs text-[#EAE0D1] leading-relaxed line-clamp-3 mb-4">
                    {article.content_snippet || 'Verified supply chain disruption.'}
                  </p>

                  {/* Commodities and Entities */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(article.primary_commodities || []).slice(0, 3).map((c, i) => (
                      <span key={i} className="bg-[#70401D] text-white text-[10px] px-2 py-0.5 rounded-md font-medium capitalize">
                        {c}
                      </span>
                    ))}
                    {(article.all_entities?.locations || []).slice(0, 2).map((loc, i) => (
                      <span key={i} className="bg-[#70401D] text-[#E0D5C1] text-[10px] px-2 py-0.5 rounded-md font-medium capitalize">
                        📍 {loc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#DDD2C0]">
                    Source: <strong className="text-white">{article.source_name || 'Verified News'}</strong>
                  </span>

                  <button
                    onClick={(e) => handleQuickAnalyze(e, article)}
                    className="flex items-center gap-1.5 bg-[#70401D] hover:bg-[#5D3315] text-white text-xs px-3 py-1.5 rounded-lg border border-white/15 transition-all font-semibold"
                  >
                    <Brain className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Reasoning</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

