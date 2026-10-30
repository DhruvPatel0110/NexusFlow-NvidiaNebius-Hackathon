import { create } from 'zustand';

export const useGlobeStore = create((set, get) => ({
  // Backend dynamic hotspots state
  hotspots: [],
  loading: false,
  error: null,
  lastFetch: null,
  maxIntensity: 0,

  // Globe navigation and drill-down state
  selectedRegion: null, // null | 'continent' | 'country' | 'event-pin'
  selectedRegionName: '',
  cameraPosition: { lat: 20, lng: 0, altitude: 2.5 },
  dashboardOpen: false,
  selectedEventId: null,

  // Phase 3: Pin drill-down state
  pinnedEventId: null, // the event whose ring has been replaced by a precise pin

  // ---------------------------------------------------------------------------
  // Hotspot actions
  // ---------------------------------------------------------------------------

  /**
   * Fetch hotspots from backend master graph API.
   * Tries relative '/api/master_graph/hotspots' first (Vite proxy),
   * falls back to 'http://localhost:8000/api/master_graph/hotspots'.
   */
  fetchHotspots: async () => {
    set({ loading: true, error: null });
    try {
      let response;
      try {
        response = await fetch('/api/master_graph/hotspots');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } catch (proxyErr) {
        response = await fetch('http://localhost:8000/api/master_graph/hotspots');
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      set({
        hotspots: data.hotspots || [],
        maxIntensity: data.max_intensity || 0,
        loading: false,
        lastFetch: new Date(),
      });
    } catch (err) {
      console.warn('[GlobeStore] fetchHotspots error:', err.message);
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  // Get hotspot by region ID
  getHotspotById: (id) => {
    const { hotspots } = get();
    if (!id) return undefined;
    return hotspots.find((h) => h.id === String(id).toLowerCase());
  },

  // Get hotspots by color ('red', 'orange', 'yellow', 'green')
  getHotspotsByColor: (color) => {
    const { hotspots } = get();
    return hotspots.filter((h) => h.color === color);
  },

  // Get high-intensity hotspots (red only)
  getHighSeverityHotspots: () => {
    const { hotspots } = get();
    return hotspots.filter((h) => h.color === 'red');
  },

  // ---------------------------------------------------------------------------
  // Region & Pin navigation actions
  // ---------------------------------------------------------------------------

  setSelectedEvent: (eventId) =>
    set(() => ({
      selectedEventId: eventId,
    })),

  /**
   * Phase 3: Transition a ring into a pin.
   * Sets pinnedEventId so the ring is hidden and a pin appears.
   * Also updates selectedRegion to 'event-pin' for UI breadcrumb tracking.
   */
  pinEvent: (eventId, eventName) =>
    set(() => ({
      pinnedEventId: eventId,
      selectedEventId: eventId,
      selectedRegion: 'event-pin',
      selectedRegionName: eventName || '',
    })),

  /**
   * Phase 3: Back out of pin view to the region/ring view.
   * Clears the pin but keeps the selectedEventId so the HUD stays focused.
   */
  unpinEvent: () =>
    set(() => ({
      pinnedEventId: null,
      selectedRegion: null,
      selectedRegionName: '',
    })),

  setSelectedRegion: (type, name, position = null) =>
    set((state) => ({
      selectedRegion: type,
      selectedRegionName: name || '',
      cameraPosition: position || state.cameraPosition,
    })),

  setCameraPosition: (lat, lng, altitude) =>
    set(() => ({
      cameraPosition: { lat, lng, altitude },
    })),

  setDashboardOpen: (isOpen) =>
    set(() => ({
      dashboardOpen: isOpen,
    })),

  resetToWorld: () =>
    set(() => ({
      selectedRegion: null,
      selectedRegionName: '',
      selectedEventId: null,
      pinnedEventId: null,
      cameraPosition: { lat: 20, lng: 0, altitude: 2.5 },
    })),
}));
