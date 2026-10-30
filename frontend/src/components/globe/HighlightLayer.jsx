import React, { useMemo, useState } from 'react';
import { ShieldAlert, Activity, AlertTriangle, Radio, ChevronRight, Eye, MapPin } from 'lucide-react';
import { useGlobeStore } from '../../state/globeStore';

/**
 * TIER CONFIGURATION
 * Single source of truth for color, animation timing, and visual styling per severity tier.
 * Supports Red (Critical), Orange (Significant), Yellow (Developing), Green (Monitored).
 */
export const TIER_CONFIG = {
  // 🔴 Red Tier: Critical active disruption (7+ articles)
  'critical-active': {
    label: 'Critical Active',
    badgeText: 'CRITICAL',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    color: 'rgb(239, 68, 68)',
    hex: '#ef4444',
    fillColor: 'rgba(239, 68, 68, 0.42)',
    borderColor: 'rgba(239, 68, 68, 0.90)',
    borderWidth: '2.5px',
    glowColor: 'rgba(239, 68, 68, 0.75)',
    pulseClass: 'ring-fast-blink',
    isAnimated: true,
    description: 'Urgent active disruption (7+ articles). Rapid alert pulse.',
  },
  'red': {
    label: 'Critical Disruption',
    badgeText: 'CRITICAL',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    color: 'rgb(239, 68, 68)',
    hex: '#ef4444',
    fillColor: 'rgba(239, 68, 68, 0.42)',
    borderColor: 'rgba(239, 68, 68, 0.90)',
    borderWidth: '2.5px',
    glowColor: 'rgba(239, 68, 68, 0.75)',
    pulseClass: 'ring-fast-blink',
    isAnimated: true,
    description: 'Urgent active disruption (7+ articles). Rapid alert pulse.',
  },

  // 🟠 Orange Tier: Significant disruption (4-6 articles)
  'major': {
    label: 'Significant Impact',
    badgeText: 'SIGNIFICANT',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    color: 'rgb(249, 115, 22)',
    hex: '#f97316',
    fillColor: 'rgba(249, 115, 22, 0.38)',
    borderColor: 'rgba(249, 115, 22, 0.85)',
    borderWidth: '2.2px',
    glowColor: 'rgba(249, 115, 22, 0.65)',
    pulseClass: 'ring-steady-pulse',
    isAnimated: true,
    description: 'Significant disruption (4-6 articles). Steady orange pulse.',
  },
  'orange': {
    label: 'Significant Impact',
    badgeText: 'SIGNIFICANT',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    color: 'rgb(249, 115, 22)',
    hex: '#f97316',
    fillColor: 'rgba(249, 115, 22, 0.38)',
    borderColor: 'rgba(249, 115, 22, 0.85)',
    borderWidth: '2.2px',
    glowColor: 'rgba(249, 115, 22, 0.65)',
    pulseClass: 'ring-steady-pulse',
    isAnimated: true,
    description: 'Significant disruption (4-6 articles). Steady orange pulse.',
  },

  // 🟡 Yellow Tier: Developing disruption (2-3 articles)
  'developing': {
    label: 'Developing Issue',
    badgeText: 'DEVELOPING',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    color: 'rgb(234, 179, 8)',
    hex: '#eab308',
    fillColor: 'rgba(234, 179, 8, 0.34)',
    borderColor: 'rgba(234, 179, 8, 0.80)',
    borderWidth: '2px',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    pulseClass: 'ring-steady-pulse',
    isAnimated: true,
    description: 'Developing disruption (2-3 articles). Yellow pulse.',
  },
  'yellow': {
    label: 'Developing Issue',
    badgeText: 'DEVELOPING',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    color: 'rgb(234, 179, 8)',
    hex: '#eab308',
    fillColor: 'rgba(234, 179, 8, 0.34)',
    borderColor: 'rgba(234, 179, 8, 0.80)',
    borderWidth: '2px',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    pulseClass: 'ring-steady-pulse',
    isAnimated: true,
    description: 'Developing disruption (2-3 articles). Yellow pulse.',
  },
  'moderate': {
    label: 'Moderate Disruption',
    badgeText: 'DEVELOPING',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    color: 'rgb(234, 179, 8)',
    hex: '#eab308',
    fillColor: 'rgba(234, 179, 8, 0.34)',
    borderColor: 'rgba(234, 179, 8, 0.80)',
    borderWidth: '2px',
    glowColor: 'rgba(234, 179, 8, 0.55)',
    pulseClass: 'ring-steady-pulse',
    isAnimated: true,
    description: 'Developing regional situation.',
  },

  // 🟢 Green Tier: Monitored incident (1 article)
  'minor': {
    label: 'Monitored Incident',
    badgeText: 'MONITORED',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    color: 'rgb(34, 197, 94)',
    hex: '#22c55e',
    fillColor: 'rgba(34, 197, 94, 0.28)',
    borderColor: 'rgba(34, 197, 94, 0.75)',
    borderWidth: '1.5px',
    glowColor: 'rgba(34, 197, 94, 0.45)',
    pulseClass: 'ring-static',
    isAnimated: false,
    description: 'Minor monitored incident (1 article). Green perimeter.',
  },
  'green': {
    label: 'Monitored Incident',
    badgeText: 'MONITORED',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    color: 'rgb(34, 197, 94)',
    hex: '#22c55e',
    fillColor: 'rgba(34, 197, 94, 0.28)',
    borderColor: 'rgba(34, 197, 94, 0.75)',
    borderWidth: '1.5px',
    glowColor: 'rgba(34, 197, 94, 0.45)',
    pulseClass: 'ring-static',
    isAnimated: false,
    description: 'Minor monitored incident (1 article). Green perimeter.',
  },
};

/**
 * Injected CSS Keyframes for High-Performance GPU-accelerated Ring Animations
 */
export const HIGHLIGHT_KEYFRAME_STYLES = `
  @keyframes fastBlink {
    0%, 100% {
      opacity: 0.9;
      box-shadow: 0 0 16px rgba(239, 68, 68, 0.85), inset 0 0 10px rgba(239, 68, 68, 0.5);
      border-color: rgba(239, 68, 68, 0.95);
    }
    50% {
      opacity: 0.25;
      box-shadow: 0 0 4px rgba(239, 68, 68, 0.2), inset 0 0 2px rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.35);
    }
  }

  @keyframes steadyPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.92;
    }
    50% {
      transform: scale(1.16);
      opacity: 0.45;
    }
  }

  @keyframes radarDotPing {
    0% { transform: scale(0.7); opacity: 0.9; }
    50% { transform: scale(1.35); opacity: 1; }
    100% { transform: scale(0.7); opacity: 0.9; }
  }

  .ring-fast-blink {
    animation: fastBlink 0.65s linear infinite !important;
    will-change: opacity, box-shadow, border-color;
  }

  .ring-steady-pulse {
    animation: steadyPulse 2.2s ease-in-out infinite !important;
    will-change: transform, opacity;
  }

  .ring-core-ping {
    animation: radarDotPing 1.2s ease-in-out infinite !important;
  }

  .ring-static {
    animation: none !important;
    transform: scale(1) !important;
  }

  .ring-core-static {
    animation: none !important;
    transform: scale(1) !important;
  }

  .ring-marker-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    z-index: 100;
  }

  .ring-marker-container:hover .ring-tooltip {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  .ring-marker-container:hover .ring-body-circle {
    filter: brightness(1.25);
    box-shadow: 0 0 22px rgba(255, 255, 255, 0.5);
  }

  .ring-tooltip {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%) translateY(6px) scale(0.96);
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 120;
    white-space: nowrap;
  }
`;

/**
 * Creates an HTML/SVG DOM element for a ring marker on the 3D globe surface
 */
export function createRingElement(ring, onSelect = null) {
  const tierKey = ring.color || ring.tier || 'moderate';
  const tierConfig = TIER_CONFIG[tierKey] || TIER_CONFIG[ring.tier] || TIER_CONFIG['moderate'];
  const hex = ring.hex || tierConfig.hex;
  const borderColor = tierConfig.borderColor;
  const fillColor = tierConfig.fillColor;
  const glowColor = tierConfig.glowColor;
  const size = ring.ringSize || 60;

  // Root wrapper for CSS2D positioning
  const container = document.createElement('div');
  container.className = 'ring-marker-container';
  container.setAttribute('data-event-id', ring.eventId);
  container.setAttribute('data-tier', ring.tier);

  // Outer Animated Ring Circle
  const ringEl = document.createElement('div');
  ringEl.className = `ring-body-circle ${tierConfig.pulseClass}`;
  ringEl.style.width = `${size}px`;
  ringEl.style.height = `${size}px`;
  ringEl.style.borderRadius = '50%';
  ringEl.style.border = `${tierConfig.borderWidth} solid ${borderColor}`;
  ringEl.style.background = `radial-gradient(circle, ${fillColor} 0%, rgba(0,0,0,0.12) 75%, transparent 100%)`;
  ringEl.style.backdropFilter = 'blur(1px)';
  ringEl.style.display = 'flex';
  ringEl.style.alignItems = 'center';
  ringEl.style.justifyContent = 'center';
  ringEl.style.boxSizing = 'border-box';
  ringEl.style.boxShadow = `0 0 12px ${glowColor}`;
  ringEl.style.transition = 'filter 0.2s ease, box-shadow 0.2s ease';

  // Inner Centroid Radar Dot
  const coreDot = document.createElement('div');
  coreDot.className = tierConfig.isAnimated
    ? 'ring-core-dot ring-core-ping'
    : 'ring-core-dot ring-core-static';
  coreDot.style.width = '7px';
  coreDot.style.height = '7px';
  coreDot.style.borderRadius = '50%';
  coreDot.style.backgroundColor = hex;
  coreDot.style.boxShadow = `0 0 8px ${hex}, 0 0 16px ${hex}`;

  ringEl.appendChild(coreDot);
  container.appendChild(ringEl);

  // Hover Tooltip Box
  const tooltip = document.createElement('div');
  tooltip.className = 'ring-tooltip';
  tooltip.innerHTML = `
    <div style="
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(14px);
      padding: 9px 13px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.85), 0 0 16px ${glowColor};
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <span style="font-weight: 700; color: #f8fafc; font-size: 13px;">${ring.eventName}</span>
        <span style="
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 7px;
          border-radius: 4px;
          background: ${hex}28;
          color: ${hex};
          border: 1px solid ${hex}66;
        ">${tierConfig.badgeText}</span>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 2px;">
        <span>Article Volume: <b style="color: #cbd5e1;">${ring.article_count || 1} articles</b></span>
        <span>Intensity: <b style="color: ${hex}; font-weight: 700;">${Math.round((ring.intensity || 0.5) * 100)}%</b></span>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #94a3b8;">
        <span>Region: <b style="color: #cbd5e1;">${ring.country}</b></span>
        <span style="color: #38bdf8; font-weight: 600; font-size: 10px; margin-left: 8px;">CLICK TO PIN 📍</span>
      </div>
    </div>
  `;
  container.appendChild(tooltip);

  // Click handler (Triggers Phase 3 pin transition immediately)
  if (onSelect) {
    const handleSelect = (e) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect(ring);
    };
    container.addEventListener('click', handleSelect);
  }

  return container;
}

/**
 * Flattens array of events with multi-country coordinates into a flat list of ring markers
 */
export function flattenEventsToRings(events, pinnedEventId = null) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((event) => event.id !== pinnedEventId) // Phase 3: hide rings for the currently pinned event
    .flatMap((event) =>
      (event.coordinates || []).map((coord) => ({
        eventId: event.id,
        eventName: event.name,
        tier: event.tier,
        color: event.color,
        hex: event.hex,
        article_count: event.article_count || 1,
        intensity: event.intensity || 0.5,
        disruption_type: event.disruption_type || 'geopolitical',
        country: coord.country,
        lat: coord.lat,
        lng: coord.lng,
        ringSize: event.ringSize || 60,
        pulseBehavior: event.pulseBehavior || 'steady-pulse',
        _markerType: 'ring',
      }))
    );
}

/**
 * Custom React Hook to manage ring marker dataset and element creation
 */
export function useHighlightLayer(events, onSelectRing = null) {
  const pinnedEventId = useGlobeStore((state) => state.pinnedEventId);
  const ringMarkers = useMemo(
    () => flattenEventsToRings(events, pinnedEventId),
    [events, pinnedEventId]
  );

  const renderRingElement = useMemo(() => {
    return (ring) => createRingElement(ring, onSelectRing);
  }, [onSelectRing]);

  return {
    ringMarkers,
    createRingElement: renderRingElement,
  };
}

/**
 * HighlightLayer Component:
 * - Injects GPU CSS keyframe rules for pulsing animations
 * - Provides an interactive Disruption Zones Intelligence HUD / Legend with 4 color tiers
 * - Integrates with Zustand store for selectedEventId / pinnedEventId tracking
 */
export default function HighlightLayer({ events = [], globeRef, onSelectEvent }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedEventId = useGlobeStore((state) => state.selectedEventId);
  const setSelectedEvent = useGlobeStore((state) => state.setSelectedEvent);
  const pinnedEventId = useGlobeStore((state) => state.pinnedEventId);

  // Group events by the 4 disruption intensity tiers (Red, Orange, Yellow, Green)
  const tierSummary = useMemo(() => {
    return {
      critical: events.filter((e) => e.color === 'red' || e.tier === 'critical-active'),
      significant: events.filter((e) => e.color === 'orange' || e.tier === 'major'),
      developing: events.filter((e) => e.color === 'yellow' || e.tier === 'developing' || e.tier === 'moderate'),
      monitored: events.filter((e) => e.color === 'green' || e.tier === 'minor'),
    };
  }, [events]);

  // Click on event in HUD list -> drill down directly to the pin with zero latency
  const handleItemClick = (event) => {
    if (onSelectEvent) {
      onSelectEvent({ eventId: event.id, ...event });
    } else {
      setSelectedEvent(event.id);
      const targetCoords = event.pinCoordinates || (event.coordinates && event.coordinates[0]);
      if (targetCoords && globeRef && globeRef.current) {
        globeRef.current.pointOfView(
          { lat: targetCoords.lat, lng: targetCoords.lng, altitude: 0.8 },
          600
        );
      }
    }
  };

  return (
    <>
      {/* Injected CSS Animation Styles */}
      <style>{HIGHLIGHT_KEYFRAME_STYLES}</style>

      {/* TOP-RIGHT: Disruption Zones HUD & Legend */}
      <div className="absolute top-20 right-6 z-20 flex flex-col items-end gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden w-80 transition-all duration-300 pointer-events-auto">
          {/* Header */}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800/80 cursor-pointer transition-colors border-b border-slate-800"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Active Disruptions ({events.length})
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </div>
          </div>

          {/* 4-Tier Breakdown Pill Bar (Red, Orange, Yellow, Green) */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/50 border-b border-slate-800/70 text-center">
            {/* 🔴 Critical (7+ articles) */}
            <div className="flex flex-col items-center py-1.5 px-0.5 rounded-lg bg-red-950/30 border border-red-500/25">
              <span className="text-[9px] uppercase font-bold text-red-400">Critical</span>
              <span className="text-xs font-extrabold text-red-300">
                {tierSummary.critical.length}
              </span>
            </div>

            {/* 🟠 Significant (4-6 articles) */}
            <div className="flex flex-col items-center py-1.5 px-0.5 rounded-lg bg-orange-950/30 border border-orange-500/25">
              <span className="text-[9px] uppercase font-bold text-orange-400">Major</span>
              <span className="text-xs font-extrabold text-orange-300">
                {tierSummary.significant.length}
              </span>
            </div>

            {/* 🟡 Developing (2-3 articles) */}
            <div className="flex flex-col items-center py-1.5 px-0.5 rounded-lg bg-yellow-950/30 border border-yellow-500/25">
              <span className="text-[9px] uppercase font-bold text-yellow-400">Mid</span>
              <span className="text-xs font-extrabold text-yellow-300">
                {tierSummary.developing.length}
              </span>
            </div>

            {/* 🟢 Monitored (1 article) */}
            <div className="flex flex-col items-center py-1.5 px-0.5 rounded-lg bg-emerald-950/30 border border-emerald-500/25">
              <span className="text-[9px] uppercase font-bold text-emerald-400">Low</span>
              <span className="text-xs font-extrabold text-emerald-300">
                {tierSummary.monitored.length}
              </span>
            </div>
          </div>

          {/* Event List with Click-to-Pin & Color-Coded Dots */}
          {isExpanded && (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-slate-700">
              {events.map((event) => {
                const tierKey = event.color || event.tier || 'moderate';
                const config = TIER_CONFIG[tierKey] || TIER_CONFIG['moderate'];
                const hex = event.hex || config.hex;
                const isPinned = pinnedEventId === event.id;
                const isSelected = selectedEventId === event.id;

                return (
                  <div
                    key={event.id}
                    onClick={() => handleItemClick(event)}
                    className={`p-2.5 flex items-center justify-between hover:bg-slate-800/60 cursor-pointer transition-all ${
                      isPinned
                        ? 'bg-blue-950/60 border-l-2 border-sky-400'
                        : isSelected
                        ? 'bg-blue-900/30 border-l-2 border-blue-400'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        {isPinned ? (
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-sky-400 animate-bounce" />
                        ) : (
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: hex,
                              boxShadow: `0 0 8px ${hex}`,
                            }}
                          />
                        )}
                        <span className={`text-xs font-semibold truncate ${isPinned ? 'text-sky-200' : 'text-slate-200'}`}>
                          {event.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 pl-4.5 truncate">
                        {isPinned && event.pinCoordinates
                          ? `📍 ${event.pinCoordinates.label}`
                          : `${event.countries.join(', ')} • ${event.article_count || 1} articles`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isPinned ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider bg-sky-500/20 text-sky-300 border-sky-400/40">
                          PINNED
                        </span>
                      ) : (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider"
                          style={{
                            backgroundColor: `${hex}22`,
                            color: hex,
                            borderColor: `${hex}55`,
                          }}
                        >
                          {event.article_count ? `${event.article_count} ART` : config.badgeText}
                        </span>
                      )}
                      <Eye className={`w-3.5 h-3.5 transition-colors ${isPinned ? 'text-sky-400' : 'text-slate-500 hover:text-slate-200'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend Footer */}
          <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{events.length} Live Disruption Zones</span>
            </div>
            <span className="text-slate-500">Color by Article Vol</span>
          </div>
        </div>
      </div>
    </>
  );
}
