import { create } from 'zustand';
import api from '../services/api';

const CANONICAL_FALLBACK_ARTICLES = [
  {
    article_id: "a3f9c2d1e7b5f8a9c4e6d2f1b8a3c5e7",
    source_name: "Reuters",
    title: "Houthi attacks disrupt Red Sea shipping lanes",
    content_snippet: "Ongoing attacks by Houthi militants have forced major shipping companies to reroute vessels via Cape of Good Hope, delaying crude oil and LNG shipments.",
    published_at: "2025-01-15T10:30:00Z",
    disruption_type: "geopolitical",
    event_category: "geopolitical",
    relevance_score: 0.95,
    primary_commodities: ["crude oil", "liquefied natural gas"],
    all_entities: {
      locations: ["Red Sea", "Suez Canal", "Yemen", "Cape of Good Hope"],
      organizations: ["Maersk", "OPEC"]
    }
  },
  {
    article_id: "b4e8d3c2f1a5b6c7d8e9f0a1b2c3d4e5",
    source_name: "Bloomberg",
    title: "Taiwan drought threatens global semiconductor chip supply",
    content_snippet: "Severe drought in Taiwan restricts water supplies to major semiconductor foundries including TSMC, threatening global chip production.",
    published_at: "2025-01-16T14:20:00Z",
    disruption_type: "natural_disaster",
    event_category: "weather",
    relevance_score: 0.90,
    primary_commodities: ["semiconductors", "silicon wafers"],
    all_entities: {
      locations: ["Taiwan", "Hsinchu Science Park"],
      organizations: ["TSMC", "Apple", "Nvidia"]
    }
  },
  {
    article_id: "c5f9e4d3a2b1c8d7e6f5a4b3c2d1e0f9",
    source_name: "Financial Times",
    title: "Iran naval drills restrict Strait of Hormuz commercial traffic",
    content_snippet: "Military exercises in the Strait of Hormuz lead to commercial shipping advisories and immediate maritime insurance premium spikes for oil tankers.",
    published_at: "2025-02-01T08:00:00Z",
    disruption_type: "geopolitical",
    event_category: "geopolitical",
    relevance_score: 0.96,
    primary_commodities: ["crude oil", "petroleum"],
    all_entities: {
      locations: ["Iran", "Strait of Hormuz", "Persian Gulf"],
      organizations: ["Saudi Aramco", "BPCL", "IOC"]
    }
  },
  {
    article_id: "d6a0f5e4b3c2d1e0f9a8b7c6d5e4f3a2",
    source_name: "Wall Street Journal",
    title: "Panama Canal water levels drop forcing daily vessel transit cuts",
    content_snippet: "El Nino weather pattern causes historic drought in Gatun Lake, forcing the Panama Canal Authority to restrict vessel draft and reduce daily transits.",
    published_at: "2025-02-10T12:00:00Z",
    disruption_type: "logistics",
    event_category: "weather",
    relevance_score: 0.92,
    primary_commodities: ["shipping containers", "liquefied natural gas"],
    all_entities: {
      locations: ["Panama", "Panama Canal", "Gatun Lake"],
      organizations: ["Panama Canal Authority", "Maersk", "Hapag Lloyd"]
    }
  },
  {
    article_id: "e7b1a6f5c4d3e2f1a0b9c8d7e6f5a4b3",
    source_name: "Associated Press",
    title: "Francis Scott Key Bridge Collapse Halts Baltimore Port Cargo Operations",
    content_snippet: "Container ship collision with Key Bridge closes the Port of Baltimore, severing vital roll-on/roll-off automotive logistics and coal export channels.",
    published_at: "2025-02-18T05:45:00Z",
    disruption_type: "logistics",
    event_category: "logistics",
    relevance_score: 0.96,
    primary_commodities: ["automotive vehicles", "coal", "shipping containers"],
    all_entities: {
      locations: ["Baltimore", "Port of Baltimore", "Chesapeake Bay"],
      organizations: ["CSX", "Norfolk Southern", "General Motors", "Ford"]
    }
  },
  {
    article_id: "f8c2b7a6d5e4f3a2b1c0d9e8f7a6b5c4",
    source_name: "Handelsblatt",
    title: "Rhine River Low Water Halts European Industrial Chemical Barges",
    content_snippet: "Summer heatwave reduces water depth at the Kaub gauge, forcing inland chemical and coal barges to load at only 25% capacity along the Rhine waterway.",
    published_at: "2025-02-22T09:15:00Z",
    disruption_type: "natural_disaster",
    event_category: "weather",
    relevance_score: 0.93,
    primary_commodities: ["industrial chemicals", "coal", "plastics"],
    all_entities: {
      locations: ["Rhine River", "Kaub", "Ludwigshafen", "Rotterdam"],
      organizations: ["BASF", "Bayer", "ThyssenKrupp"]
    }
  }
];

export const useDashboardStore = create((set, get) => ({
  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Search & Filters
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedCategory: 'all',
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  selectedSeverity: 'all',
  setSelectedSeverity: (sev) => set({ selectedSeverity: sev }),

  // Telemetry & Health
  health: null,
  stats: null,
  relevanceStats: null,

  // Core Data
  articles: [],
  hotspots: [],
  masterGraph: null,
  selectedEvent: null,
  selectedHotspot: null,

  // Loading & Error States
  loading: false,
  error: null,
  lastUpdated: null,

  // AI RAG Analysis State (NVIDIA Nemotron via Nebius)
  analysisResult: null,
  analysisLoading: false,
  analysisError: null,
  activeAnalysisQuery: '',

  // Ingestion Trigger State
  ingestionRunning: false,
  ingestionMessage: null,

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setSelectedHotspot: (hotspot) => set({ selectedHotspot: hotspot }),

  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const [healthRes, statsRes, articlesRes, hotspotsRes] = await Promise.allSettled([
        api.getHealth(),
        api.getStats(),
        api.getArticles({ limit: 50, relevant_only: true }),
        api.getHotspots(),
      ]);

      const health = healthRes.status === 'fulfilled' ? healthRes.value : null;
      const stats = statsRes.status === 'fulfilled' ? statsRes.value : null;
      let articles = articlesRes.status === 'fulfilled' && Array.isArray(articlesRes.value) ? articlesRes.value : [];
      if (articles.length === 0) {
        articles = CANONICAL_FALLBACK_ARTICLES;
      }
      const hotspotsData = hotspotsRes.status === 'fulfilled' ? hotspotsRes.value : null;
      const hotspots = hotspotsData?.hotspots || [];

      set({
        health,
        stats,
        articles,
        hotspots,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error('[DashboardStore] fetchDashboardData failed:', err);
      set({ error: err.message, loading: false });
    }
  },

  fetchMasterGraph: async () => {
    try {
      const data = await api.getMasterGraph();
      set({ masterGraph: data });
    } catch (err) {
      console.warn('[DashboardStore] fetchMasterGraph error:', err);
    }
  },

  runRAGAnalysis: async (query, topK = 3, category = null) => {
    set({ analysisLoading: true, analysisError: null, activeAnalysisQuery: query });
    try {
      const result = await api.analyzeImpactRAG(query, topK, category);
      set({ analysisResult: result, analysisLoading: false });
      return result;
    } catch (err) {
      console.error('[DashboardStore] runRAGAnalysis error:', err);
      set({ analysisError: err.message, analysisLoading: false });
      throw err;
    }
  },

  triggerIngestionCycle: async () => {
    set({ ingestionRunning: true, ingestionMessage: 'Starting dual-source ingestion...' });
    try {
      const res = await api.triggerIngestion();
      set({
        ingestionRunning: false,
        ingestionMessage: res.message || 'Ingestion completed successfully.',
      });
      // Refresh dashboard data
      await get().fetchDashboardData();
    } catch (err) {
      set({
        ingestionRunning: false,
        ingestionMessage: `Ingestion failed: ${err.message}`,
      });
    }
  },
}));

export default useDashboardStore;

