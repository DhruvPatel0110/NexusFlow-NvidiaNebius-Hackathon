import React from 'react';
import { X, Globe, TrendingUp, AlertTriangle, Building, Tag, DollarSign, Brain, ExternalLink } from 'lucide-react';
import useDashboardStore from '../state/dashboardStore';

export default function EventDetailModal() {
  const selectedEvent = useDashboardStore((state) => state.selectedEvent);
  const setSelectedEvent = useDashboardStore((state) => state.setSelectedEvent);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);
  const runRAGAnalysis = useDashboardStore((state) => state.runRAGAnalysis);

  if (!selectedEvent) return null;

  const handleRunAnalysis = () => {
    const query = `${selectedEvent.title}. ${selectedEvent.content_snippet || ''}`;
    runRAGAnalysis(query, 3, selectedEvent.event_category || selectedEvent.disruption_type);
    setSelectedEvent(null);
    setActiveTab('analysis');
  };

  const entities = selectedEvent.all_entities || {};
  const locations = entities.locations || [];
  const organizations = entities.organizations || [];
  const products = entities.products_mentioned || selectedEvent.primary_commodities || [];
  const impactChain = selectedEvent.economic_impact_chain || [];
  const relationships = selectedEvent.relationships || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#895129] text-white w-full max-w-2xl rounded-2xl border border-[#A4673B] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 bg-[#754420]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {selectedEvent.disruption_type || 'Disruption'}
              </span>
              <span className="text-xs text-[#D8CBBA]">
                {selectedEvent.published_at ? new Date(selectedEvent.published_at).toLocaleDateString() : 'Recent'}
              </span>
              {selectedEvent.source_name && (
                <span className="text-xs text-amber-200 font-medium">
                  • {selectedEvent.source_name}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">
              {selectedEvent.title}
            </h2>
          </div>
          <button
            onClick={() => setSelectedEvent(null)}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 text-sm">
          {/* Summary */}
          <div>
            <h4 className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider mb-1.5">
              Event Summary
            </h4>
            <p className="text-white bg-[#70401D] p-3.5 rounded-xl border border-white/10 leading-relaxed">
              {selectedEvent.content_snippet || selectedEvent.description || 'Verified physical supply chain disruption report.'}
            </p>
          </div>

          {/* Primary Commodities & Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#70401D] p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold text-[#EAE0D1] mb-2">
                <Tag className="w-4 h-4 text-amber-300" />
                <span>Affected Commodities</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {products.length > 0 ? (
                  products.map((p, i) => (
                    <span key={i} className="bg-[#5D3315] text-white text-xs px-2.5 py-1 rounded-md font-medium capitalize">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#D8CBBA]">Not specified</span>
                )}
              </div>
            </div>

            <div className="bg-[#70401D] p-3 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold text-[#EAE0D1] mb-2">
                <Globe className="w-4 h-4 text-emerald-300" />
                <span>Geographic Nodes</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {locations.length > 0 ? (
                  locations.map((loc, i) => (
                    <span key={i} className="bg-[#5D3315] text-white text-xs px-2.5 py-1 rounded-md font-medium capitalize">
                      {loc}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#D8CBBA]">Global impact</span>
                )}
              </div>
            </div>
          </div>

          {/* Causal Economic Impact Chain */}
          {impactChain.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-orange-300" />
                <span>Downstream Economic Propagation Path</span>
              </h4>
              <div className="space-y-2 bg-[#70401D] p-3.5 rounded-xl border border-white/10">
                {impactChain.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#895129] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-white/20">
                      {idx + 1}
                    </span>
                    <span className="text-[#F0E6D8] leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Relationships Triples */}
          {relationships.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider mb-2">
                Supply Chain Relationship Triples
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {relationships.slice(0, 6).map((rel, idx) => (
                  <div key={idx} className="bg-[#70401D] px-3 py-2 rounded-lg border border-white/10 text-xs flex items-center gap-2">
                    <span className="font-semibold text-white capitalize">{rel[0]}</span>
                    <span className="text-[10px] text-amber-300 font-mono bg-black/20 px-1.5 py-0.5 rounded">
                      {rel[1]}
                    </span>
                    <span className="font-semibold text-white capitalize">{rel[2]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#754420] flex items-center justify-between gap-3">
          {selectedEvent.url ? (
            <a
              href={selectedEvent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#EAE0D1] hover:text-white flex items-center gap-1.5 font-medium transition-colors"
            >
              <span>Original Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedEvent(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#EAE0D1] hover:bg-white/10 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleRunAnalysis}
              className="flex items-center gap-2 bg-[#9E6237] hover:bg-[#B36F3E] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all border border-white/20 hover:scale-105"
            >
              <Brain className="w-4 h-4 text-amber-300" />
              <span>Analyze with NVIDIA Nemotron</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

