import React from 'react';
import {
  Globe,
  LayoutDashboard,
  FileText,
  Share2,
  Brain,
  Clock,
  Database,
  Activity,
  ChevronRight,
} from 'lucide-react';
import useDashboardStore from '../state/dashboardStore';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'events', label: 'Live Events', icon: FileText },
  { id: 'map', label: 'Global Map', icon: Globe },
  { id: 'supply-chain', label: 'Supply Chain', icon: Share2 },
  { id: 'analysis', label: 'Event Analysis', icon: Brain },
  { id: 'historical', label: 'Historical Parallels', icon: Clock },
];

const SECONDARY_ITEMS = [
  { id: 'sources', label: 'Data Sources', icon: Database },
  { id: 'status', label: 'System Status', icon: Activity },
];

export default function Sidebar() {
  const activeTab = useDashboardStore((state) => state.activeTab);
  const setActiveTab = useDashboardStore((state) => state.setActiveTab);

  return (
    <aside className="w-64 bg-[#895129] text-white flex flex-col shrink-0 min-h-screen select-none border-r border-[#734320]/40">
      {/* Branding */}
      <div className="p-6 pb-5 flex items-center gap-3 border-b border-[#9E6237]/30">
        <div className="w-10 h-10 rounded-xl bg-[#70401D] flex items-center justify-center shrink-0 border border-white/10 shadow-sm">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight text-white leading-none">
            NexusFlow
          </div>
          <div className="text-[9px] tracking-widest uppercase text-[#E0D5C1] font-semibold mt-1">
            Supply Chain Intelligence
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left group ${
                isActive
                  ? 'bg-[#9E6237] text-white font-semibold shadow-sm'
                  : 'text-[#EFE7DA] hover:bg-[#965B31] hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-white scale-110' : 'text-[#E0D5C1] group-hover:text-white'
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}

        {/* Section Divider */}
        <div className="pt-4 pb-2 px-3">
          <div className="h-px bg-[#9E6237]/40 w-full" />
        </div>

        {/* Secondary Navigation */}
        {SECONDARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left group ${
                isActive
                  ? 'bg-[#9E6237] text-white font-semibold shadow-sm'
                  : 'text-[#EFE7DA] hover:bg-[#965B31] hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-white scale-110' : 'text-[#E0D5C1] group-hover:text-white'
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Hackathon Info */}
      <div className="p-4 border-t border-[#9E6237]/30 text-xs text-[#E0D5C1] space-y-1 bg-[#70401D]/40">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Nebius x NVIDIA
        </div>
        <div className="text-[10px] text-[#D8CBBA] leading-tight">
          Global AI Hackathon • 120B Nemotron
        </div>
      </div>
    </aside>
  );
}

