import { create } from 'zustand';
import api from '../services/api';

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
      const articles = articlesRes.status === 'fulfilled' && Array.isArray(articlesRes.value) ? articlesRes.value : [];
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

