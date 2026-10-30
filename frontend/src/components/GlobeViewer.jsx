import React, { useEffect, useState, useRef } from 'react';
import GlobeGL from 'react-globe.gl';
import useDashboardStore from '../state/dashboardStore';

export function getHotspotTier(d) {
  if (d.color === 'red' || (d.intensity || 0) >= 0.7 || (d.article_count || 0) >= 7) {
    return 'severe';
  }
  if (d.color === 'orange' || (d.intensity || 0) >= 0.4 || (d.article_count || 0) >= 4) {
    return 'high';
  }
  if (d.color === 'yellow' || (d.intensity || 0) >= 0.2 || (d.article_count || 0) >= 2) {
    return 'medium';
  }
  return 'low';
}

export function getSeverityDotColor(d) {
  const tier = getHotspotTier(d);
  if (tier === 'severe') return '#EF4444'; // Red (Severe)
  if (tier === 'high') return '#F97316';   // Orange (High)
  if (tier === 'medium') return '#EAB308'; // Yellow (Medium)
  return '#FEF08A';                       // Cream / Pale Yellow (Low)
}

export function getSeverityRingColor(d) {
  const tier = getHotspotTier(d);
  if (tier === 'severe') return 'rgba(239, 68, 68, 0.85)';
  if (tier === 'high') return 'rgba(249, 115, 22, 0.85)';
  if (tier === 'medium') return 'rgba(234, 179, 8, 0.85)';
  return 'rgba(254, 240, 138, 0.75)';
}

export default function GlobeViewer({ height = 360, width = null, hotspots: propHotspots = null }) {
  const storeHotspots = useDashboardStore((state) => state.hotspots);
  const selectedHotspot = useDashboardStore((state) => state.selectedHotspot);
  const setSelectedHotspot = useDashboardStore((state) => state.setSelectedHotspot);

  const globeRef = useRef();
  const containerRef = useRef();
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHotspotClick = (hotspot) => {
    setSelectedHotspot(hotspot);
    if (globeRef.current && hotspot.latitude && hotspot.longitude) {
      globeRef.current.pointOfView(
        {
          lat: hotspot.latitude,
          lng: hotspot.longitude,
          altitude: 1.9,
        },
        1000
      );
    }
  };

  // Prioritize filtered hotspots prop if provided
  const effectiveHotspots = propHotspots !== null ? propHotspots : storeHotspots || [];

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden flex items-center justify-center bg-[#633718]">
      <GlobeGL
        ref={globeRef}
        width={width || containerWidth || 600}
        height={height}
        globeImageUrl="/assets/globe/earth-night.jpg"
        bumpImageUrl="/assets/globe/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        
        // 3D Spherical Hotspot Points (Matching Exact Severity Color)
        pointsData={effectiveHotspots}
        pointLat={(d) => d.latitude}
        pointLng={(d) => d.longitude}
        pointColor={(d) => getSeverityDotColor(d)}
        pointAltitude={0.018}
        pointRadius={(d) => 0.55 + (d.intensity || 0.5) * 0.45}
        pointResolution={24}
        onPointClick={(h) => h && handleHotspotClick(h)}

        // Hotspot Pulsing Rings (Matching Exact Severity Color)
        ringsData={effectiveHotspots}
        ringLat={(d) => d.latitude}
        ringLng={(d) => d.longitude}
        ringMaxRadius={(d) => (d.pulse_strength || 0.6) * 4}
        ringPropagationSpeed={() => 1.8}
        ringRepeatPeriod={() => 1800}
        ringColor={(d) => getSeverityRingColor(d)}
        onRingClick={(h) => h && handleHotspotClick(h)}
        
        // Hotspot Labels (Zero dot radius so no white dot is drawn)
        labelsData={effectiveHotspots}
        labelLat={(d) => d.latitude}
        labelLng={(d) => d.longitude}
        labelText={(d) => d.label || d.id?.toUpperCase()}
        labelSize={(d) => 0.7 + (d.intensity || 0.5) * 0.8}
        labelDotRadius={0}
        labelColor={() => 'rgba(255, 255, 255, 0.95)'}
        labelAltitude={0.025}
        labelResolution={2}
        onLabelClick={(h) => h && handleHotspotClick(h)}
        
        autoRotate={true}
        autoRotateSpeed={0.4}
        enablePointerInteraction={true}
      />

      {/* Selected Hotspot Floating Card */}
      {selectedHotspot && (
        <div className="absolute top-3 left-3 bg-[#70401D]/95 text-white p-3 rounded-xl border border-white/20 text-xs shadow-xl z-20 max-w-xs animate-in fade-in">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h4 className="font-bold text-sm text-white capitalize flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs"
                style={{ backgroundColor: getSeverityDotColor(selectedHotspot) }}
              />
              <span>{selectedHotspot.label || selectedHotspot.id}</span>
            </h4>
            <button
              onClick={() => setSelectedHotspot(null)}
              className="text-white/60 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-[11px] text-[#DDD2C0]">
            <div>Type: <strong className="text-white capitalize">{selectedHotspot.disruption_type || 'geopolitical'}</strong></div>
            <div>Articles: <strong className="text-white">{selectedHotspot.article_count || 1}</strong></div>
            <div>Intensity: <strong className="text-amber-300">{Math.round((selectedHotspot.intensity || 0.5) * 100)}%</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
