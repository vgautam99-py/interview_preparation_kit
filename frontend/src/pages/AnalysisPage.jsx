import React from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';

export default function AnalysisPage() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <Navbar title="Detailed Analysis & Readiness Analytics" />

        <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
          <AnalyticsCharts />
        </main>
      </div>
    </div>
  );
}

