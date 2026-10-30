import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import useDashboardStore from '../state/dashboardStore';

export default function TopNavbar() {
  const searchQuery = useDashboardStore((state) => state.searchQuery);
  const setSearchQuery = useDashboardStore((state) => state.setSearchQuery);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('events');
    }
  };

  return (
    <header className="h-16 px-8 flex items-center justify-between gap-6 shrink-0 border-b border-[#D8CEBA]/60 bg-[#EDE8D0]">
      {/* Search Bar - Center aligned & matching reference image */}
      <div className="flex-1 max-w-2xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-[#594537] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, regions, commodities, or industries..."
            className="w-full bg-[#E4DEC4] text-[#17130F] placeholder-[#6E5848] text-sm pl-10 pr-4 py-2 rounded-xl border border-[#D0C6AA] focus:outline-none focus:ring-2 focus:ring-[#895129]/30 transition-all shadow-inner"
          />
        </form>
      </div>

      {/* Right Actions: Notifications & User Avatar */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Notification Bell */}
        <button
          title="Notifications"
          className="relative p-2 rounded-xl text-[#594537] hover:bg-[#E2DCBF] hover:text-[#17130F] transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#EDE8D0]" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#D8CEBA]">
          <div className="w-9 h-9 rounded-full bg-[#895129] text-white flex items-center justify-center font-bold text-sm shadow-sm border border-[#70401D]" title="User Profile">
            U
          </div>
        </div>
      </div>
    </header>
  );
}

