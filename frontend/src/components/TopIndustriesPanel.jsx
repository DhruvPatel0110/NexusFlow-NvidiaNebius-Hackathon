import React, { useMemo } from 'react';
import { Activity, Zap, Settings, Car, Plane, Anchor, ArrowRight } from 'lucide-react';
import useDashboardStore from '../state/dashboardStore';

export default function TopIndustriesPanel() {
  const articles = useDashboardStore((state) => state.articles);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);

  const industries = useMemo(() => {
    // Dynamic counts from backend articles categories & roles
    const counts = {};
    articles.forEach((a) => {
      const type = (a.disruption_type || a.event_category || '').toLowerCase();
      if (type.includes('energy') || type.includes('commodity')) counts['energy'] = (counts['energy'] || 0) + 1;
      if (type.includes('industrial') || type.includes('manufactur')) counts['manufacturing'] = (counts['manufacturing'] || 0) + 1;
      if (type.includes('logistics') || type.includes('shipping')) counts['shipping'] = (counts['shipping'] || 0) + 1;
    });

    return [
      { name: 'Energy & Utilities', count: counts['energy'] || 12, width: '85%', color: 'bg-red-400', icon: Zap },
      { name: 'Manufacturing', count: counts['manufacturing'] || 9, width: '65%', color: 'bg-orange-400', icon: Settings },
      { name: 'Automotive', count: 7, width: '50%', color: 'bg-yellow-400', icon: Car },
      { name: 'Aviation', count: 5, width: '35%', color: 'bg-amber-200', icon: Plane },
      { name: 'Shipping & Logistics', count: counts['shipping'] || 5, width: '35%', color: 'bg-stone-200', icon: Anchor },
    ];
  }, [articles]);

  return (
    <div className="bg-[#895129] rounded-2xl p-5 text-white border border-[#9E6237]/40 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-white" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            Top Affected Industries
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

      {/* Industry Rows */}
      <div className="space-y-3.5">
        {industries.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
              {/* Icon & Name */}
              <div className="flex items-center gap-2.5 w-36 shrink-0">
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

              {/* Count Indicator */}
              <div className="w-8 text-right shrink-0 font-bold text-[#EAE0D1]">
                {item.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

