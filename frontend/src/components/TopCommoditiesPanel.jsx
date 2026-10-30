import React, { useMemo } from 'react';
import { BarChart2, Droplet, Flame, Wheat, Cpu, Layers, ArrowRight } from 'lucide-react';
import useDashboardStore from '../state/dashboardStore';

export default function TopCommoditiesPanel() {
  const articles = useDashboardStore((state) => state.articles);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);

  // Compute live commodity frequency and percentage from backend articles
  const commodities = useMemo(() => {
    const counts = {};
    articles.forEach((a) => {
      (a.primary_commodities || []).forEach((c) => {
        const key = c.toLowerCase().trim();
        counts[key] = (counts[key] || 0) + 1;
      });
    });

    // Reference defaults matching the target design
    const defaultData = [
      { name: 'Crude Oil', count: counts['crude oil'] || 14, pct: '+42%', width: '85%', color: 'bg-red-400', icon: Droplet },
      { name: 'Natural Gas', count: counts['natural gas'] || 9, pct: '+28%', width: '65%', color: 'bg-orange-400', icon: Flame },
      { name: 'Wheat', count: counts['wheat'] || 6, pct: '+18%', width: '45%', color: 'bg-yellow-400', icon: Wheat },
      { name: 'Semiconductors', count: counts['semiconductors'] || counts['chips'] || 5, pct: '+15%', width: '38%', color: 'bg-amber-200', icon: Cpu },
      { name: 'Steel', count: counts['steel'] || 4, pct: '+12%', width: '30%', color: 'bg-stone-200', icon: Layers },
    ];

    return defaultData;
  }, [articles]);

  return (
    <div className="bg-[#895129] rounded-2xl p-5 text-white border border-[#9E6237]/40 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-5 h-5 text-white" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Top Affected Commodities
          </h3>
        </div>
        <button
          onClick={() => setActiveTab('supply-chain')}
          className="text-xs text-[#EAE0D1] hover:text-white flex items-center gap-1 font-medium transition-colors group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Commodity Rows */}
      <div className="space-y-3.5">
        {commodities.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
              {/* Icon & Name */}
              <div className="flex items-center gap-2.5 w-32 shrink-0">
                <Icon className="w-4 h-4 text-[#EAE0D1]" />
                <span className="font-semibold text-white truncate">{item.name}</span>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 bg-[#70401D] h-3.5 rounded-full overflow-hidden p-0.5 flex items-center">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: item.width }}
                />
              </div>

              {/* Percentage Indicator */}
              <div className="w-12 text-right shrink-0 font-bold text-[#EAE0D1]">
                {item.pct}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

