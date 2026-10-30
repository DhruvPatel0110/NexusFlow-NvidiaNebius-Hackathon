import React from 'react';
import DashboardHeader from './DashboardHeader';
import KpiCards from './KpiCards';
import GlobalDisruptionMap from './GlobalDisruptionMap';
import TopCommoditiesPanel from './TopCommoditiesPanel';
import TopIndustriesPanel from './TopIndustriesPanel';
import LatestEventsPanel from './LatestEventsPanel';

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* 1. Header & Greeting */}
      <DashboardHeader />

      {/* 2. Four KPI Cards */}
      <KpiCards />

      {/* 3. Main Dashboard Grid matching reference image layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (approx 63% on desktop / 7.5 cols out of 12 or 7 vs 5) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 flex flex-col">
          {/* Global Disruption Map */}
          <GlobalDisruptionMap />

          {/* Side-by-side Top Commodities & Top Industries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <TopCommoditiesPanel />
            <TopIndustriesPanel />
          </div>
        </div>

        {/* Right Column: Latest Events Feed (approx 37% / 5 cols out of 12) */}
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <LatestEventsPanel />
        </div>
      </div>
    </div>
  );
}

