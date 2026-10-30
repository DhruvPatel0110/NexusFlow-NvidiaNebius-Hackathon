import { useEffect } from 'react';
import { useGlobeStore } from '../store/globeStore';

/**
 * Periodically refresh hotspots from backend.
 * Default: every 5 minutes.
 */
export function useHotspotsRefresh(intervalMs = 5 * 60 * 1000) {
  const fetchHotspots = useGlobeStore((state) => state.fetchHotspots);

  useEffect(() => {
    // Fetch on mount
    fetchHotspots();

    // Fetch periodically
    const timer = setInterval(() => {
      fetchHotspots();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, fetchHotspots]);
}

export default useHotspotsRefresh;
