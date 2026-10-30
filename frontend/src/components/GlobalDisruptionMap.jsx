import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Globe as GlobeIcon, ChevronDown, Plus, Minus, RotateCcw, Move, Check } from 'lucide-react';
import useDashboardStore from '../state/dashboardStore';
import worldTopology from '../data/worldBoundaries.json';
import * as topojson from 'topojson-client';
import GlobeViewer from './GlobeViewer';

// Convert lat/lng to Equirectangular SVG coordinates (800 x 420 viewBox)
function projectCoords(lat, lng, width = 800, height = 420) {
  const x = (lng + 180) * (width / 360);
  const y = (90 - lat) * (height / 180);
  return { x, y };
}

export default function GlobalDisruptionMap() {
  const hotspots = useDashboardStore((state) => state.hotspots);
  const selectedHotspot = useDashboardStore((state) => state.selectedHotspot);
  const setSelectedHotspot = useDashboardStore((state) => state.setSelectedHotspot);

  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [intensityFilter, setIntensityFilter] = useState('all'); // 'all' | 'severe' | 'high'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mapMode, setMapMode] = useState('2d'); // '2d' or '3d'
  
  // Interactive Pan & Zoom State for 2D Map
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPanRef = useRef({ x: 0, y: 0 });
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate SVG path strings from worldBoundaries.json
  const countryPaths = useMemo(() => {
    try {
      if (!worldTopology || !worldTopology.objects) return [];
      const countries = topojson.feature(worldTopology, worldTopology.objects.countries);
      
      const width = 800;
      const height = 420;

      return countries.features.map((feature, idx) => {
        const geom = feature.geometry;
        if (!geom) return null;

        const coordsToPath = (coords) => {
          return coords
            .map((ring) => {
              return ring
                .map(([lng, lat], i) => {
                  const pt = projectCoords(lat, lng, width, height);
                  return `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                })
                .join(' ') + ' Z';
            })
            .join(' ');
        };

        let pathString = '';
        if (geom.type === 'Polygon') {
          pathString = coordsToPath(geom.coordinates);
        } else if (geom.type === 'MultiPolygon') {
          pathString = geom.coordinates.map(coordsToPath).join(' ');
        }

        return {
          id: feature.id || idx,
          d: pathString,
        };
      }).filter(Boolean);
    } catch (e) {
      console.warn('Failed to parse world boundaries:', e);
      return [];
    }
  }, []);

  // Filter hotspots based on dropdown selection
  const filteredHotspots = useMemo(() => {
    if (!hotspots || hotspots.length === 0) return [];
    if (intensityFilter === 'severe') {
      return hotspots.filter(
        (h) => h.color === 'red' || (h.intensity || 0) >= 0.7 || h.article_count >= 7
      );
    }
    if (intensityFilter === 'high') {
      return hotspots.filter(
        (h) =>
          h.color === 'red' ||
          h.color === 'orange' ||
          (h.intensity || 0) >= 0.4 ||
          h.article_count >= 4
      );
    }
    return hotspots;
  }, [hotspots, intensityFilter]);

  // Mouse Drag / Pan Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startPanRef.current = { ...panOffset };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanOffset({
      x: startPanRef.current.x + dx,
      y: startPanRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel Zoom Handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomLevel((prev) => Math.min(Math.max(prev * zoomFactor, 0.8), 4.0));
  };

  // Touch Support
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPanRef.current = { ...panOffset };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPanOffset({
      x: startPanRef.current.x + dx,
      y: startPanRef.current.y + dy,
    });
  };

  // Zoom Button Controls
  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 0.8), 4.0));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Differentiate Click vs Drag on Hotspot
  const handleHotspotClick = (e, hotspot) => {
    e.stopPropagation();
    const dist = Math.hypot(
      e.clientX - dragStartRef.current.x,
      e.clientY - dragStartRef.current.y
    );
    if (dist < 6) {
      setSelectedHotspot(hotspot);
    }
  };

  const severeCount = useMemo(
    () => hotspots.filter((h) => h.color === 'red' || (h.intensity || 0) >= 0.7).length,
    [hotspots]
  );
  const highAndSevereCount = useMemo(
    () =>
      hotspots.filter(
        (h) => h.color === 'red' || h.color === 'orange' || (h.intensity || 0) >= 0.4
      ).length,
    [hotspots]
  );

  return (
    <div className="bg-[#895129] rounded-2xl p-5 text-white border border-[#9E6237]/40 shadow-xs flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#70401D] flex items-center justify-center shrink-0 border border-white/10">
            <GlobeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight leading-tight">
              Global Disruption Map
            </h2>
            <p className="text-xs text-[#E8DEC8] leading-tight mt-0.5">
              Live supply chain events and affected regions ({filteredHotspots.length} active)
            </p>
          </div>
        </div>

        {/* Right Controls: Mode Toggle & Intensity Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* 2D / 3D Toggle */}
          <div className="bg-[#70401D] p-0.5 rounded-lg flex items-center border border-white/10 text-xs">
            <button
              onClick={() => setMapMode('2d')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                mapMode === '2d'
                  ? 'bg-[#9E6237] text-white shadow-xs'
                  : 'text-[#DDD2C0] hover:text-white'
              }`}
            >
              2D Map
            </button>
            <button
              onClick={() => setMapMode('3d')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                mapMode === '3d'
                  ? 'bg-[#9E6237] text-white shadow-xs'
                  : 'text-[#DDD2C0] hover:text-white'
              }`}
            >
              3D Globe
            </button>
          </div>

          {/* Intensity Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-[#70401D] hover:bg-[#7D4721] px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-white transition-colors"
            >
              <span>
                {intensityFilter === 'all'
                  ? 'Disruption Intensity'
                  : intensityFilter === 'severe'
                  ? 'Severe Only'
                  : 'High & Severe'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-[#70401D] rounded-xl shadow-2xl border border-white/20 py-1.5 z-30 text-xs text-white">
                <button
                  onClick={() => {
                    setIntensityFilter('all');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between ${
                    intensityFilter === 'all' ? 'bg-[#9E6237] font-bold' : 'hover:bg-[#895129]'
                  }`}
                >
                  <span>All Intensities</span>
                  <span className="text-[10px] text-white/70">({hotspots.length})</span>
                </button>
                <button
                  onClick={() => {
                    setIntensityFilter('severe');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between ${
                    intensityFilter === 'severe' ? 'bg-[#9E6237] font-bold' : 'hover:bg-[#895129]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-xs" />
                    Severe Only
                  </span>
                  <span className="text-[10px] text-white/70">({severeCount})</span>
                </button>
                <button
                  onClick={() => {
                    setIntensityFilter('high');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between ${
                    intensityFilter === 'high' ? 'bg-[#9E6237] font-bold' : 'hover:bg-[#895129]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shadow-xs" />
                    High & Severe
                  </span>
                  <span className="text-[10px] text-white/70">({highAndSevereCount})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Viewport Area */}
      <div className="relative w-full h-[360px] bg-[#6E3E1C] rounded-xl border border-[#9E6237]/50 overflow-hidden flex items-center justify-center select-none">
        {mapMode === '3d' ? (
          /* Interactive 3D Globe with Filtered Hotspots */
          <div className="w-full h-full relative">
            <GlobeViewer height={360} hotspots={filteredHotspots} />
          </div>
        ) : (
          /* Fully Interactive 2D World Vector Map with Drag & Pan */
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className={`w-full h-full relative overflow-hidden flex items-center justify-center bg-[#633718] ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <svg
              viewBox="0 0 800 420"
              className="w-full h-full object-contain pointer-events-auto"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <defs>
                <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Ocean Grid Background */}
              <rect width="800" height="420" fill="#663A19" />
              <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
                {[70, 140, 210, 280, 350].map((y) => (
                  <line key={`h-${y}`} x1="0" y1={y} x2="800" y2={y} />
                ))}
                {[100, 200, 300, 400, 500, 600, 700].map((x) => (
                  <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="420" />
                ))}
              </g>

              {/* World Landmass Boundaries */}
              <g fill="#4A2A13" stroke="#834E26" strokeWidth="0.6" strokeLinejoin="round">
                {countryPaths.map((p) => (
                  <path
                    key={p.id}
                    d={p.d}
                    className="hover:fill-[#583318] transition-colors"
                  />
                ))}
              </g>

              {/* Filtered Geographic Hotspot Beacons */}
              {filteredHotspots.map((hotspot) => {
                const pt = projectCoords(hotspot.latitude, hotspot.longitude, 800, 420);
                const isHovered = hoveredHotspot?.id === hotspot.id;
                const isSelected = selectedHotspot?.id === hotspot.id;

                let ringColor = 'rgba(234, 179, 8, 0.4)';
                let dotColor = '#EAB308';
                let filterId = 'none';

                if (hotspot.color === 'red' || (hotspot.intensity || 0) >= 0.7) {
                  ringColor = 'rgba(239, 68, 68, 0.45)';
                  dotColor = '#EF4444';
                  filterId = 'url(#glow-red)';
                } else if (hotspot.color === 'orange' || (hotspot.intensity || 0) >= 0.4) {
                  ringColor = 'rgba(249, 115, 22, 0.45)';
                  dotColor = '#F97316';
                  filterId = 'url(#glow-orange)';
                } else if (hotspot.color === 'green' || (hotspot.intensity || 0) < 0.2) {
                  ringColor = 'rgba(253, 224, 71, 0.3)';
                  dotColor = '#FDE047';
                }

                return (
                  <g
                    key={hotspot.id}
                    className="cursor-pointer"
                    onClick={(e) => handleHotspotClick(e, hotspot)}
                    onMouseEnter={() => setHoveredHotspot(hotspot)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    {/* Animated Pulsing Outer Ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered || isSelected ? 18 : 12}
                      fill={ringColor}
                      className="beacon-ring pointer-events-none"
                    />

                    {/* Secondary Fixed Glow Ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered || isSelected ? 9 : 6}
                      fill={ringColor}
                      stroke={dotColor}
                      strokeWidth="1"
                      opacity="0.8"
                    />

                    {/* Center Core Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered || isSelected ? 4.5 : 3.5}
                      fill={dotColor}
                      filter={filterId}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Drag to Explore Indicator */}
            <div className="absolute top-3 left-3 bg-[#70401D]/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-[#DDD2C0] pointer-events-none flex items-center gap-1.5 shadow-xs">
              <Move className="w-3 h-3 text-amber-300" />
              <span>Drag to pan • Scroll to zoom</span>
            </div>

            {/* Hover Tooltip Popup */}
            {hoveredHotspot && (
              <div
                className="absolute z-20 pointer-events-none bg-[#70401D] text-white px-3 py-2 rounded-xl shadow-2xl border border-white/20 text-xs transition-opacity duration-200"
                style={{
                  top: '16px',
                  right: '16px',
                }}
              >
                <div className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hoveredHotspot.color === 'red'
                        ? 'bg-red-500'
                        : hoveredHotspot.color === 'orange'
                        ? 'bg-orange-500'
                        : 'bg-yellow-400'
                    }`}
                  />
                  {hoveredHotspot.label || hoveredHotspot.id.toUpperCase()}
                </div>
                <div className="text-[11px] text-[#DDD2C0] mt-0.5">
                  Type: <span className="text-white capitalize">{hoveredHotspot.disruption_type || 'geopolitical'}</span>
                </div>
                <div className="text-[11px] text-[#DDD2C0]">
                  Articles: <span className="text-white font-semibold">{hoveredHotspot.article_count || 1}</span>
                  <span className="mx-1.5">•</span>
                  Intensity: <span className="text-white font-semibold">{Math.round((hoveredHotspot.intensity || 0.5) * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom-Left Severity Legend matching reference image */}
        <div className="absolute bottom-3 left-3 bg-[#70401D]/90 backdrop-blur-xs px-3 py-2 rounded-xl border border-white/10 text-xs shadow-md z-10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs" />
            <span className="text-[11px] font-medium text-[#F4ECE1]">Severe</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs" />
            <span className="text-[11px] font-medium text-[#F4ECE1]">High</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-xs" />
            <span className="text-[11px] font-medium text-[#F4ECE1]">Medium</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-100 shadow-xs" />
            <span className="text-[11px] font-medium text-[#F4ECE1]">Low</span>
          </div>
        </div>

        {/* Bottom-Right Zoom & Navigation Controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
          <button
            onClick={() => handleZoom(0.3)}
            title="Zoom In"
            className="w-7 h-7 rounded-lg bg-[#70401D] hover:bg-[#895129] text-white flex items-center justify-center border border-white/10 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.3)}
            title="Zoom Out"
            className="w-7 h-7 rounded-lg bg-[#70401D] hover:bg-[#895129] text-white flex items-center justify-center border border-white/10 shadow-xs transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Pan & Zoom"
            className="w-7 h-7 rounded-lg bg-[#70401D] hover:bg-[#895129] text-white flex items-center justify-center border border-white/10 shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
