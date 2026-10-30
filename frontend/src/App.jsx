import React, { useEffect } from 'react';
import useDashboardStore from './state/dashboardStore';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import DashboardOverview from './components/DashboardOverview';
import LiveEventsPage from './components/pages/LiveEventsPage';
import GlobalMapPage from './components/pages/GlobalMapPage';
import SupplyChainPage from './components/pages/SupplyChainPage';
import EventAnalysisPage from './components/pages/EventAnalysisPage';
import HistoricalParallelsPage from './components/pages/HistoricalParallelsPage';
import DataSourcesPage from './components/pages/DataSourcesPage';
import SystemStatusPage from './components/pages/SystemStatusPage';
import EventDetailModal from './components/EventDetailModal';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData);

  // Initial data load from backend + automatic 60s background refresh
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Render appropriate view based on active tab
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'events':
        return <LiveEventsPage />;
      case 'map':
        return <GlobalMapPage />;
      case 'supply-chain':
        return <SupplyChainPage />;
      case 'analysis':
        return <EventAnalysisPage />;
      case 'historical':
        return <HistoricalParallelsPage />;
      case 'sources':
        return <DataSourcesPage />;
      case 'status':
        return <SystemStatusPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#EDE8D0] text-[#17130F]">
      {/* 1. Left Fixed Sidebar */}
      <Sidebar />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#EDE8D0]">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Scrollable View Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            <ErrorBoundary>
              {renderActiveTab()}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global Event Detail Modal */}
      <EventDetailModal />
    </div>
  );
}
