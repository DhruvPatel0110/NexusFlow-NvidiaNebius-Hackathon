import React, { useState } from 'react';
import {
  Brain,
  Search,
  Zap,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import useDashboardStore from '../../state/dashboardStore';

const PRESET_QUERIES = [
  'Red Sea maritime attacks causing shipping reroutes around Africa',
  'Panama Canal drought slashes daily vessel transits by 35%',
  'Strait of Hormuz military drills and crude tanker freight escalation',
  'Lithium refinery fire disrupts EV battery pack manufacturing',
];

export default function EventAnalysisPage() {
  const analysisResult = useDashboardStore((state) => state.analysisResult);
  const analysisLoading = useDashboardStore((state) => state.analysisLoading);
  const analysisError = useDashboardStore((state) => state.analysisError);
  const runRAGAnalysis = useDashboardStore((state) => state.runRAGAnalysis);

  const [inputQuery, setInputQuery] = useState(
    'Red Sea maritime attacks causing shipping reroutes around Africa'
  );

  const handleAnalyze = (e) => {
    e?.preventDefault();
    if (inputQuery.trim()) {
      runRAGAnalysis(inputQuery.trim(), 3);
    }
  };

  const impact = analysisResult?.impact_analysis;
  const metadata = analysisResult?.model_metadata;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#17130F] tracking-tight">
          AI Event Intelligence & RAG Reasoning
        </h1>
        <p className="text-xs text-[#594537] mt-0.5">
          Powered by NVIDIA Nemotron (120B Super) hosted on Nebius Token Factory with ChromaDB vector memory.
        </p>
      </div>

      {/* Query Bar Card */}
      <div className="bg-[#895129] p-5 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs">
        <form onSubmit={handleAnalyze} className="space-y-3">
          <label className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider block">
            Enter Supply Chain Scenario or Ingestion Event
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#DDD2C0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="e.g. Panama Canal water level restrictions impact on LNG tankers..."
                className="w-full bg-[#70401D] text-white placeholder-[#DDD2C0] text-sm pl-10 pr-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <button
              type="submit"
              disabled={analysisLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#9E6237] hover:bg-[#B36F3E] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 border border-white/20 hover:scale-105 disabled:opacity-50 shrink-0"
            >
              <Brain className={`w-4 h-4 text-amber-300 ${analysisLoading ? 'animate-spin' : ''}`} />
              <span>{analysisLoading ? 'Synthesizing...' : 'Run Nemotron RAG'}</span>
            </button>
          </div>
        </form>

        {/* Preset scenario pills */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-[#DDD2C0] font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Quick Scenarios:
          </span>
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputQuery(q);
                runRAGAnalysis(q, 3);
              }}
              className="bg-[#70401D] hover:bg-[#7D4721] text-white text-[11px] px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
            >
              {q.length > 40 ? q.slice(0, 40) + '...' : q}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Error Notification */}
      {analysisError && (
        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-red-200 text-xs">
          <strong>Analysis Error:</strong> {analysisError}
        </div>
      )}

      {/* Loading Skeleton */}
      {analysisLoading && (
        <div className="bg-[#895129] p-10 rounded-2xl text-center text-white border border-[#9E6237]/40 animate-pulse space-y-3">
          <Brain className="w-10 h-10 text-amber-300 mx-auto animate-bounce" />
          <h3 className="text-base font-bold text-white">
            Invoking NVIDIA Nemotron via Nebius Token Factory...
          </h3>
          <p className="text-xs text-[#DDD2C0] max-w-md mx-auto">
            Querying ChromaDB ONNX vector space for historical parallels and generating structured downstream causality paths.
          </p>
        </div>
      )}

      {/* Analysis Output View */}
      {!analysisLoading && impact && (
        <div className="space-y-6">
          {/* Metadata & Risk Banner */}
          <div className="bg-[#895129] p-5 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border ${
                  impact.risk_level === 'high'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                }`}
              >
                {impact.risk_level || 'HIGH'} RISK
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Intelligence Assessment Report
                </h3>
                <div className="text-[11px] text-[#DDD2C0] mt-0.5">
                  Model: <strong className="text-white">{metadata?.model_name || impact.model_used || 'nvidia/nemotron-3-super-120b-a12b'}</strong>
                  <span className="mx-2">•</span>
                  Mode: <span className="text-emerald-300 font-mono">Live Nebius Token Factory</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto text-xs bg-[#70401D] px-3 py-1.5 rounded-xl border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[#EAE0D1]">Epistemic Boundaries Enforced</span>
            </div>
          </div>

          {/* Event Summary */}
          <div className="bg-[#895129] p-5 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs">
            <h4 className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider mb-2">
              Contextual Synthesis
            </h4>
            <p className="text-sm text-white leading-relaxed bg-[#70401D] p-4 rounded-xl border border-white/10">
              {impact.event_summary}
            </p>
          </div>

          {/* Commodities & Downstream Propagation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Affected Commodities & Entities */}
            <div className="bg-[#895129] p-5 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider">
                Impacted Commodities & Nodes
              </h4>

              <div>
                <div className="text-xs text-[#DDD2C0] mb-1.5">Primary Commodities:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(impact.primary_affected_commodities || []).map((c, i) => (
                    <span key={i} className="bg-[#70401D] text-white text-xs px-2.5 py-1 rounded-md font-medium capitalize border border-white/10">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {impact.affected_entities && (
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                  {Object.entries(impact.affected_entities).map(([role, list]) => {
                    if (!list || list.length === 0) return null;
                    return (
                      <div key={role} className="flex justify-between items-start gap-2 bg-[#70401D] p-2 rounded-lg">
                        <span className="text-[#DDD2C0] capitalize font-medium">{role.replace('_', ' ')}:</span>
                        <span className="text-white font-semibold text-right">
                          {Array.isArray(list) ? list.join(', ') : String(list)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Downstream Propagation Path */}
            <div className="bg-[#895129] p-5 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs">
              <h4 className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-orange-300" />
                <span>Causal Downstream Propagation Chain</span>
              </h4>
              <div className="space-y-2">
                {(impact.downstream_propagation_path || []).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-[#70401D] p-3 rounded-xl border border-white/10 text-xs">
                    <span className="w-5 h-5 rounded-full bg-[#895129] text-white font-bold text-[10px] flex items-center justify-center shrink-0 border border-white/20 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-[#F0E6D8] leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Historical Parallels Retrieved via RAG */}
          {impact.historical_parallels_analysis?.length > 0 && (
            <div className="bg-[#895129] p-5 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs">
              <h4 className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Historical Precedents Retrieved via Vector RAG</span>
              </h4>
              <div className={`grid gap-4 ${impact.historical_parallels_analysis.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {impact.historical_parallels_analysis.map((p, idx) => (
                  <div key={idx} className="bg-[#70401D] p-5 rounded-xl border border-white/10 space-y-2.5 text-xs w-full shadow-xs">
                    <div className="font-bold text-white text-sm md:text-base leading-snug">
                      {p.parallel_title}
                    </div>
                    {p.mechanism_overlap && (
                      <div className="text-[#DDD2C0] leading-relaxed">
                        <strong className="text-amber-300 font-semibold">Mechanism Overlap:</strong> {p.mechanism_overlap}
                      </div>
                    )}
                    {p.key_differences && (
                      <div className="text-[#DDD2C0] leading-relaxed">
                        <strong className="text-stone-300 font-semibold">Key Differences:</strong> {p.key_differences}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strict Epistemic Grounding: Verified Facts vs Plausible Risks vs Uncertainties */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Verified Facts */}
            <div className="bg-[#895129] p-4 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Evidence-Backed Facts</span>
              </div>
              <ul className="space-y-2 text-xs text-[#EAE0D1]">
                {(impact.evidence_backed_facts || []).map((fact, idx) => (
                  <li key={idx} className="bg-[#70401D] p-2.5 rounded-lg border border-white/5 leading-relaxed">
                    • {fact}
                  </li>
                ))}
              </ul>
            </div>

            {/* Plausible Inferred Risks */}
            <div className="bg-[#895129] p-4 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider mb-2.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Plausible Inferred Risks</span>
              </div>
              <ul className="space-y-2 text-xs text-[#EAE0D1]">
                {(impact.plausible_inferred_risks || []).map((risk, idx) => (
                  <li key={idx} className="bg-[#70401D] p-2.5 rounded-lg border border-white/5 leading-relaxed">
                    • {risk}
                  </li>
                ))}
              </ul>
            </div>

            {/* Explicit Uncertainties */}
            <div className="bg-[#895129] p-4 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 uppercase tracking-wider mb-2.5">
                <HelpCircle className="w-4 h-4" />
                <span>Explicit Uncertainties</span>
              </div>
              <ul className="space-y-2 text-xs text-[#EAE0D1]">
                {(impact.explicit_uncertainties || []).map((unc, idx) => (
                  <li key={idx} className="bg-[#70401D] p-2.5 rounded-lg border border-white/5 leading-relaxed">
                    • {unc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

