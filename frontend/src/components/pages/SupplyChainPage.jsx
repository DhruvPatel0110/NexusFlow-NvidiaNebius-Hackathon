import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Share2,
  Search,
  Filter,
  Layers,
  Database,
  ArrowRight,
  ShieldAlert,
  Plus,
  Minus,
  RotateCcw,
  Move,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import useDashboardStore from '../../state/dashboardStore';
import api from '../../services/api';

const CATEGORY_COLORS = {
  chokepoint: { bg: '#EF4444', border: '#DC2626', text: '#FCA5A5', label: 'Chokepoint / Region' },
  location: { bg: '#F97316', border: '#EA580C', text: '#FDBA74', label: 'Region / Route' },
  commodity: { bg: '#EAB308', border: '#CA8A04', text: '#FDE047', label: 'Key Commodity' },
  organization: { bg: '#38BDF8', border: '#0284C7', text: '#BAE6FD', label: 'Enterprise / Producer' },
  event: { bg: '#EC4899', border: '#DB2777', text: '#F472B6', label: 'Disruption Incident' },
  default: { bg: '#A8A29E', border: '#78716C', text: '#E7E5E4', label: 'Connected Node' },
};

export default function SupplyChainPage() {
  const masterGraph = useDashboardStore((state) => state.masterGraph);
  const fetchMasterGraph = useDashboardStore((state) => state.fetchMasterGraph);
  const setSelectedEvent = useDashboardStore((state) => state.setSelectedEvent);

  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('red sea');
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'chokepoint' | 'commodity' | 'organization'
  const [highlightData, setHighlightData] = useState(null);
  const [loadingHighlight, setLoadingHighlight] = useState(false);

  // Pan & Zoom controls for graph canvas
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPanRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!masterGraph) {
      fetchMasterGraph();
    }
  }, [masterGraph, fetchMasterGraph]);

  const nodes = useMemo(() => masterGraph?.nodes || [], [masterGraph]);
  const edges = useMemo(() => masterGraph?.edges || [], [masterGraph]);

  // Determine entity category cleanly
  const getNodeCategory = (nodeId, nodeType) => {
    const id = String(nodeId).toLowerCase();
    const type = String(nodeType || '').toLowerCase();
    if (['strait of hormuz', 'suez canal', 'panama canal', 'red sea', 'bab el-mandeb', 'cape of good hope'].includes(id)) {
      return 'chokepoint';
    }
    if (type === 'commodity' || ['crude oil', 'liquefied natural gas', 'semiconductors', 'silicon wafers', 'petroleum', 'diesel'].includes(id)) {
      return 'commodity';
    }
    if (type === 'organization' || ['saudi aramco', 'tsmc', 'apple', 'nvidia', 'maersk', 'opec', 'bpcl', 'ioc'].includes(id)) {
      return 'organization';
    }
    if (type === 'location' || type === 'region') return 'location';
    if (type === 'event') return 'event';
    return 'default';
  };

  // Structured Tiered Layout for High Readability
  // Col 1: Chokepoints & Geopolitics (x: 150)
  // Col 2: Commodities (x: 450)
  // Col 3: Organizations & End-Markets (x: 750)
  const layoutNodes = useMemo(() => {
    if (!nodes.length) return [];

    const col1 = [];
    const col2 = [];
    const col3 = [];

    nodes.forEach((n) => {
      const cat = getNodeCategory(n.id, n.type);
      if (cat === 'chokepoint' || cat === 'location' || n.id === 'yemen' || n.id === 'iran') {
        col1.push(n);
      } else if (cat === 'commodity') {
        col2.push(n);
      } else {
        col3.push(n);
      }
    });

    const positioned = [];
    const height = 540;

    const assignY = (arr, x) => {
      const step = Math.min(46, (height - 80) / Math.max(arr.length, 1));
      const startY = Math.max(40, (height - (arr.length - 1) * step) / 2);
      arr.forEach((node, i) => {
        positioned.push({
          ...node,
          x,
          y: startY + i * step,
          category: getNodeCategory(node.id, node.type),
        });
      });
    };

    assignY(col1, 150);
    assignY(col2, 450);
    assignY(col3, 750);

    return positioned;
  }, [nodes]);

  const positionedMap = useMemo(() => {
    const map = new Map();
    layoutNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [layoutNodes]);

  // Edges mapped with real start and end coordinates
  const validEdges = useMemo(() => {
    return edges
      .map((e) => {
        const src = positionedMap.get(e.source);
        const tgt = positionedMap.get(e.target);
        if (!src || !tgt) return null;
        return {
          ...e,
          src,
          tgt,
        };
      })
      .filter(Boolean);
  }, [edges, positionedMap]);

  // Fetch sub-graph when entity is selected
  useEffect(() => {
    if (!selectedEntity) return;
    setLoadingHighlight(true);
    api
      .getEntityHighlight(selectedEntity)
      .then((data) => {
        setHighlightData(data);
      })
      .catch((err) => {
        console.warn('Entity highlight error:', err);
        setHighlightData(null);
      })
      .finally(() => setLoadingHighlight(false));
  }, [selectedEntity]);

  // Canvas Pan Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
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

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel((prev) => Math.min(Math.max(prev + zoomDelta, 0.7), 2.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const activeFocus = hoveredEntity || selectedEntity;

  // Filtered nodes for sidebar list
  const filteredSidebarNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch = !search || n.id.toLowerCase().includes(search.toLowerCase());
      const cat = getNodeCategory(n.id, n.type);
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'chokepoint' && (cat === 'chokepoint' || cat === 'location')) ||
        (activeFilter === 'commodity' && cat === 'commodity') ||
        (activeFilter === 'organization' && cat === 'organization');
      return matchesSearch && matchesFilter;
    });
  }, [nodes, search, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#17130F] tracking-tight">
          Master Supply Chain Graph
        </h1>
        <p className="text-xs text-[#594537] mt-0.5">
          Interactive NetworkX MultiDiGraph mapping physical supply dependencies, chokepoint blockages, and corporate exposure.
        </p>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#895129] p-4 rounded-2xl text-white border border-[#9E6237]/40 shadow-xs">
          <div className="text-xs text-[#DDD2C0] font-medium">Total Graph Nodes</div>
          <div className="text-2xl font-black text-white mt-1">{nodes.length || 34}</div>
        </div>
        <div className="bg-[#895129] p-4 rounded-2xl text-white border border-[#9E6237]/40 shadow-xs">
          <div className="text-xs text-[#DDD2C0] font-medium">Causal Edges</div>
          <div className="text-2xl font-black text-white mt-1">{edges.length || 20}</div>
        </div>
        <div className="bg-[#895129] p-4 rounded-2xl text-white border border-[#9E6237]/40 shadow-xs">
          <div className="text-xs text-[#DDD2C0] font-medium">Primary Chokepoints</div>
          <div className="text-2xl font-black text-amber-300 mt-1">8</div>
        </div>
        <div className="bg-[#895129] p-4 rounded-2xl text-white border border-[#9E6237]/40 shadow-xs">
          <div className="text-xs text-[#DDD2C0] font-medium">Graph Engine</div>
          <div className="text-sm font-bold text-emerald-300 mt-2">NetworkX MultiDiGraph</div>
        </div>
      </div>

      {/* Main Grid: Interactive Graph Canvas (2 cols) + Entity Intelligence Inspector (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Spacious, Clean Graph Viewport */}
        <div className="lg:col-span-8 bg-[#895129] p-5 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs flex flex-col h-[620px] relative overflow-hidden">
          {/* Header & Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#70401D] flex items-center justify-center shrink-0 border border-white/10">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                  Causal Relationship Network
                </h2>
                <div className="text-[11px] text-[#DDD2C0] mt-0.5">
                  Flow: Chokepoints & Geopolitics → Strategic Commodities → Enterprise Consumers
                </div>
              </div>
            </div>

            {/* Category Badges */}
            <div className="flex items-center gap-2 text-[10px] text-[#E0D5C1] flex-wrap">
              <span className="flex items-center gap-1 bg-[#70401D] px-2 py-0.5 rounded-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Chokepoints
              </span>
              <span className="flex items-center gap-1 bg-[#70401D] px-2 py-0.5 rounded-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-yellow-400" /> Commodities
              </span>
              <span className="flex items-center gap-1 bg-[#70401D] px-2 py-0.5 rounded-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-sky-400" /> Enterprise
              </span>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`flex-1 bg-[#4E2911] rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #FFFFFF 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Canvas Navigation Prompt */}
            <div className="absolute top-3 left-3 bg-[#70401D]/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-[#DDD2C0] pointer-events-none flex items-center gap-1.5 shadow-xs z-10">
              <Move className="w-3 h-3 text-amber-300" />
              <span>Drag canvas to pan • Scroll to zoom</span>
            </div>

            <svg
              viewBox="0 0 900 540"
              className="w-full h-full object-contain pointer-events-auto"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <defs>
                {/* Arrow markers */}
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D4AF37" />
                </marker>
                <marker
                  id="arrow-dim"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 2 L 6 5 L 0 8 z" fill="rgba(255,255,255,0.2)" />
                </marker>
              </defs>

              {/* Column Layer Headings */}
              <text x="150" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#FCA5A5" letterSpacing="0.05em">
                CHOKEPOINTS & ROUTES
              </text>
              <text x="450" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#FDE047" letterSpacing="0.05em">
                STRATEGIC COMMODITIES
              </text>
              <text x="750" y="24" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#BAE6FD" letterSpacing="0.05em">
                PRODUCERS & CONSUMERS
              </text>

              {/* Subtle vertical tier separators */}
              <line x1="300" y1="35" x2="300" y2="520" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="600" y1="35" x2="600" y2="520" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" strokeWidth="1" />

              {/* Edges */}
              <g>
                {validEdges.map((e, idx) => {
                  const isConnected =
                    activeFocus === e.source || activeFocus === e.target;
                  const isDimmed = activeFocus && !isConnected;

                  // Compute smooth cubic Bezier curve
                  const x1 = e.src.x + 65;
                  const y1 = e.src.y;
                  const x2 = e.tgt.x - 65;
                  const y2 = e.tgt.y;
                  const dx = Math.abs(x2 - x1) * 0.5;

                  const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                  return (
                    <g key={idx}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={
                          isConnected
                            ? '#F59E0B'
                            : isDimmed
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(255,255,255,0.22)'
                        }
                        strokeWidth={isConnected ? 2.5 : 1.2}
                        strokeDasharray={e.relationship === 'reroutes_around' ? '4 4' : 'none'}
                        markerEnd={isConnected ? 'url(#arrow)' : 'url(#arrow-dim)'}
                        className="transition-all duration-200"
                      />

                      {/* Relationship Pill on Hover / Focus */}
                      {isConnected && (
                        <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                          <rect
                            x="-38"
                            y="-9"
                            width="76"
                            height="18"
                            rx="5"
                            fill="#231006"
                            stroke="#F59E0B"
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y="3.5"
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill="#FDE047"
                            className="select-none pointer-events-none capitalize"
                          >
                            {e.relationship?.replace('_', ' ') || 'impacts'}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Node Badges */}
              <g>
                {layoutNodes.map((node) => {
                  const isSelected = selectedEntity === node.id;
                  const isHovered = hoveredEntity === node.id;
                  const isConnected =
                    activeFocus &&
                    (activeFocus === node.id ||
                      edges.some(
                        (e) =>
                          (e.source === activeFocus && e.target === node.id) ||
                          (e.target === activeFocus && e.source === node.id)
                      ));
                  const isDimmed = activeFocus && !isConnected;

                  const catStyle =
                    CATEGORY_COLORS[node.category] || CATEGORY_COLORS.default;

                  // Label formatting & clean sizing
                  const rawLabel = String(node.id || '');
                  const displayLabel =
                    rawLabel.length > 20
                      ? rawLabel.slice(0, 18) + '...'
                      : rawLabel;
                  const badgeWidth = Math.max(115, displayLabel.length * 7.5 + 28);
                  const badgeHeight = 28;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setSelectedEntity(node.id)}
                      onMouseEnter={() => setHoveredEntity(node.id)}
                      onMouseLeave={() => setHoveredEntity(null)}
                      className="cursor-pointer"
                      style={{
                        opacity: isDimmed ? 0.28 : 1,
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                    >
                      {/* Pill Badge Container */}
                      <rect
                        x={-badgeWidth / 2}
                        y={-badgeHeight / 2}
                        width={badgeWidth}
                        height={badgeHeight}
                        rx="14"
                        fill={isSelected ? '#311504' : '#271205'}
                        stroke={
                          isSelected
                            ? '#F59E0B'
                            : isHovered
                            ? '#FFFFFF'
                            : isConnected
                            ? '#E0A84D'
                            : catStyle.border
                        }
                        strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.2}
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                        className="transition-all duration-200"
                      />

                      {/* Category Dot */}
                      <circle
                        cx={-badgeWidth / 2 + 13}
                        cy="0"
                        r="4.5"
                        fill={catStyle.bg}
                      />

                      {/* Crisp, Highly Readable Text */}
                      <text
                        x={-badgeWidth / 2 + 24}
                        y="4"
                        textAnchor="start"
                        fontSize="11"
                        fontWeight={isSelected || isHovered ? '700' : '500'}
                        fill="#FFFFFF"
                        letterSpacing="0.015em"
                        className="select-none pointer-events-none capitalize drop-shadow-xs"
                      >
                        {displayLabel}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Bottom Controls: Zoom + Reset */}
          <div className="absolute bottom-7 right-7 flex items-center gap-1.5 z-20">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.5))}
              title="Zoom In"
              className="w-8 h-8 rounded-lg bg-[#70401D] hover:bg-[#895129] text-white flex items-center justify-center border border-white/10 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.7))}
              title="Zoom Out"
              className="w-8 h-8 rounded-lg bg-[#70401D] hover:bg-[#895129] text-white flex items-center justify-center border border-white/10 shadow-md transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              title="Reset View"
              className="w-8 h-8 rounded-lg bg-[#70401D] hover:bg-[#895129] text-white flex items-center justify-center border border-white/10 shadow-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Entity Intelligence Inspector (1 col) */}
        <div className="lg:col-span-4 bg-[#895129] p-5 rounded-2xl border border-[#9E6237]/40 text-white shadow-xs flex flex-col h-[620px]">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-[#DDD2C0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search graph entities..."
              className="w-full bg-[#70401D] text-white placeholder-[#DDD2C0] text-xs pl-8 pr-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-[10px]">
            {['all', 'chokepoint', 'commodity', 'organization'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize shrink-0 transition-all ${
                  activeFilter === cat
                    ? 'bg-[#9E6237] text-white shadow-xs'
                    : 'bg-[#70401D] text-[#DDD2C0] hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All (34)' : cat}
              </button>
            ))}
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
            {selectedEntity ? (
              <div className="space-y-4">
                {/* Active Entity Title Card */}
                <div className="bg-[#70401D] p-3.5 rounded-xl border border-white/15">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                      Selected Entity
                    </span>
                    <span className="text-[10px] text-[#DDD2C0] bg-black/20 px-2 py-0.5 rounded capitalize">
                      {getNodeCategory(selectedEntity, positionedMap.get(selectedEntity)?.type)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white capitalize mt-1">
                    {selectedEntity}
                  </h3>
                </div>

                {loadingHighlight ? (
                  <div className="text-center py-6 text-xs text-[#DDD2C0]">
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                    Querying 1st & 2nd order dependencies...
                  </div>
                ) : highlightData ? (
                  <div className="space-y-3">
                    {/* Direct Graph Relationships */}
                    <div>
                      <h4 className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider mb-2">
                        Connected Nodes ({highlightData.neighbors?.length || 0})
                      </h4>
                      <div className="space-y-1.5">
                        {(highlightData.neighbors || []).map((n, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedEntity(n.id)}
                            className="bg-[#70401D] hover:bg-[#7D4721] p-2.5 rounded-lg border border-white/10 text-xs flex justify-between items-center cursor-pointer transition-colors"
                          >
                            <span className="font-semibold text-white capitalize">{n.id}</span>
                            <span className="text-[10px] text-amber-300 font-mono bg-black/25 px-2 py-0.5 rounded">
                              {n.relationship || 'connected'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Disruption Events */}
                    {highlightData.events_mentioning_entity?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[#EAE0D1] uppercase tracking-wider mb-2">
                          Mentioned In Active Disruptions
                        </h4>
                        <div className="space-y-2">
                          {highlightData.events_mentioning_entity.map((evt, i) => (
                            <div
                              key={i}
                              onClick={() => setSelectedEvent(evt)}
                              className="bg-[#70401D] hover:bg-[#7D4721] p-2.5 rounded-lg border border-white/10 text-xs cursor-pointer transition-colors"
                            >
                              <div className="font-semibold text-white line-clamp-2">
                                {evt.headline || evt.title}
                              </div>
                              <div className="text-[10px] text-[#DDD2C0] mt-1 flex justify-between">
                                <span>{evt.source || 'Verified Source'}</span>
                                <span className="text-amber-200">View details →</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-[#DDD2C0] text-center py-4">
                    Click another node to explore its network relationships.
                  </div>
                )}
              </div>
            ) : null}

            {/* Entity List */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <div className="text-[11px] font-bold text-[#EAE0D1] uppercase tracking-wider mb-1">
                All Entities ({filteredSidebarNodes.length})
              </div>
              {filteredSidebarNodes.map((n) => {
                const isSelected = selectedEntity === n.id;
                const cat = getNodeCategory(n.id, n.type);
                const catColor = CATEGORY_COLORS[cat]?.bg || '#A8A29E';

                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedEntity(n.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors capitalize group ${
                      isSelected
                        ? 'bg-[#9E6237] border-white text-white font-bold shadow-xs'
                        : 'bg-[#70401D] hover:bg-[#7D4721] border-white/10 text-[#F5ECE1]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <span className="truncate">{n.id}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
