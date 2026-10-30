import React, { useState } from 'react';
import { Globe, MapPin, AlertCircle, Layers, ArrowRight } from 'lucide-react';
import useDashboardStore from '../../state/dashboardStore';
import GlobalDisruptionMap from '../GlobalDisruptionMap';

export default function GlobalMapPage() {
  const hotspots = useDashboardStore((state) => state.hotspots);
  const selectedHotspot = useDashboardStore((state) => state.selectedHotspot);
  const setSelectedHotspot = useDashboardStore((state) => state.setSelectedHotspot);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#17130F] tracking-tight">
          Global Disruption Map & Hotspots
        </h1>
        <p className="text-xs text-[#594537] mt-0.5">
          Geographic supply-chain bottlenecks and chokepoints derived from the NetworkX Master Graph.
        </p>
      </div>

      {/* Main Map Component */}
      <GlobalDisruptionMap />

      {/* Hotspots Detailed Breakdown */}
      <div className="bg-[#895129] rounded-2xl p-6 text-white border border-[#9E6237]/40 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-amber-300" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Active Disruption Hotspots ({hotspots.length})
            </h2>
          </div>
          <span className="text-xs text-[#EAE0D1]">
            Click a hotspot to highlight details
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {hotspots.map((h) => {
            const isSelected = selectedHotspot?.id === h.id;
            let badgeBg = 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30';
            if (h.color === 'red' || (h.intensity || 0) >= 0.8) {
              badgeBg = 'bg-red-500/20 text-red-300 border-red-500/30';
            } else if (h.color === 'orange' || (h.intensity || 0) >= 0.5) {
              badgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
            }

            return (
              <div
                key={h.id}
                onClick={() => setSelectedHotspot(h)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#9E6237] border-white shadow-md'
                    : 'bg-[#70401D] hover:bg-[#7D4721] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white capitalize">
                    {h.label || h.id}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeBg}`}>
                    {h.color || 'Medium'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#DDD2C0]">
                  <div className="flex justify-between">
                    <span>Disruption Type:</span>
                    <strong className="text-white capitalize">{h.disruption_type || 'Geopolitical'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Coordinates:</span>
                    <span className="font-mono text-white/90">
                      {h.latitude?.toFixed(2)}°, {h.longitude?.toFixed(2)}°
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Linked Articles:</span>
                    <strong className="text-white">{h.article_count || 1}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Disruption Intensity:</span>
                    <strong className="text-amber-200">{Math.round((h.intensity || 0.5) * 100)}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

