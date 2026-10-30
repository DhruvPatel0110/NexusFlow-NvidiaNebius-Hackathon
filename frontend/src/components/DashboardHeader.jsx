import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import useDashboardStore from '../state/dashboardStore';

export default function DashboardHeader() {
  const health = useDashboardStore((state) => state.health);
  const [currentDateTime, setCurrentDateTime] = useState({
    date: 'Oct 30, 2026',
    time: '10:08 AM',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
      const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
      setCurrentDateTime({
        date: now.toLocaleDateString('en-US', optionsDate),
        time: now.toLocaleTimeString('en-US', optionsTime),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = health?.status === 'healthy';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Title & Greeting */}
      <div>
        <div className="text-xs font-semibold text-[#594537] tracking-wide mb-0.5">
          Good Morning, User
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#17130F] tracking-tight">
          Global Supply Chain at a Glance
        </h1>
        <p className="text-xs md:text-sm text-[#594537] mt-0.5">
          Real-time events. AI-powered analysis. Actionable intelligence.
        </p>
      </div>

      {/* Right Pills: Date & System Status */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Date / Time Card */}
        <div className="flex items-center gap-2.5 bg-[#E2DCBF] px-3.5 py-2 rounded-xl border border-[#D5CDAB] shadow-xs">
          <Calendar className="w-4 h-4 text-[#594537]" />
          <div className="text-left">
            <div className="text-xs font-bold text-[#17130F] leading-tight">
              {currentDateTime.date}
            </div>
            <div className="text-[10px] text-[#6E5848] font-medium leading-tight">
              {currentDateTime.time}
            </div>
          </div>
        </div>

        {/* System Status Pill */}
        <div className="flex items-center gap-2.5 bg-[#E0EED4] px-3.5 py-2 rounded-xl border border-[#C5DCB3] shadow-xs">
          <div className="relative flex items-center justify-center">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isOnline && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute animate-ping opacity-75" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-[#1F4922] leading-tight">
              {isOnline ? 'System Online' : 'Connecting...'}
            </div>
            <div className="text-[10px] text-[#3E6B41] font-medium leading-tight">
              {isOnline ? 'All services running' : 'Telemetry active'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

