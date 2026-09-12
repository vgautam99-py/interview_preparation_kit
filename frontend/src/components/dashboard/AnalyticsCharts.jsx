import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import { Filter, TrendingUp, TrendingDown, MoreVertical, ShieldCheck, BookOpen, Layers, Sparkles } from 'lucide-react';

const prepActivityData = [
  { name: 'Mon', Technical: 8, SystemDesign: 4, Behavioral: 3, Flashcards: 15 },
  { name: 'Tue', Technical: 6, SystemDesign: 3, Behavioral: 2, Flashcards: 12 },
  { name: 'Wed', Technical: 12, SystemDesign: 6, Behavioral: 4, Flashcards: 22 },
  { name: 'Thu', Technical: 7, SystemDesign: 4, Behavioral: 3, Flashcards: 14 },
  { name: 'Fri', Technical: 10, SystemDesign: 5, Behavioral: 3, Flashcards: 18 },
  { name: 'Sat', Technical: 5, SystemDesign: 2, Behavioral: 2, Flashcards: 10 },
  { name: 'Sun', Technical: 9, SystemDesign: 4, Behavioral: 3, Flashcards: 16 }
];

const riskSparkline = [
  { val: 15 }, { val: 12 }, { val: 8 }, { val: 5 }, { val: 2 }, { val: 0 }, { val: 0 }
];

const masterySparkline = [
  { val: 40 }, { val: 52 }, { val: 65 }, { val: 72 }, { val: 80 }, { val: 85 }, { val: 92 }
];

export default function AnalyticsCharts() {
  const [timeframe, setTimeframe] = useState('Monthly');
  const [activeCategory, setActiveCategory] = useState('Technical');

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Top Header & KPI Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Overview Prep Analytics</h3>
            <p className="text-xs text-slate-500">Interview preparation progress, must-have coverage, and practice mastery</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold text-slate-600">
              {['Weekly', 'Monthly', 'Yearly'].map(t => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    timeframe === t ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Total Kits Created
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-extrabold text-slate-900">12 Kits</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +15%
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Questions Prepared
              <Layers className="w-4 h-4 text-sky-600" />
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-extrabold text-slate-900">148 Prompts</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +24%
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Must-Have Coverage
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-extrabold text-slate-900">100% Covered</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                0 Gap
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center justify-between">
              Flashcards Mastered
              <Sparkles className="w-4 h-4 text-amber-500" />
            </span>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-extrabold text-slate-900">86 Cards</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +12.4%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Coverage Risk, Mastery Growth & Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Uncovered Must-Haves Risk Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900">Coverage Gap Risk</h4>
              <p className="text-xs text-slate-400">Uncovered must-have requirements</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-slate-900">0 Gaps</div>
            <p className="text-xs text-emerald-600 font-semibold">100% Must-haves covered in Pass 2</p>
          </div>

          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskSparkline}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#riskGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Practice Mastery Growth Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900">Practice Mastery Growth</h4>
              <p className="text-xs text-slate-400">High-confidence cards score</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-slate-900">85% Mastery</div>
            <p className="text-xs text-emerald-600 font-semibold">+5.2% confidence than last week</p>
          </div>

          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={masterySparkline}>
                <defs>
                  <linearGradient id="masteryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#masteryGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category & Topic Performance Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Category & Topic Focus</h4>
            <button className="text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-semibold text-slate-600">
            {['Technical', 'System Design', 'Behavioral'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 py-1.5 text-center rounded-lg transition ${
                  activeCategory === cat ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block">Questions Built</span>
              <span className="text-base font-bold text-slate-900 flex items-center gap-1">
                <span className="text-indigo-600">↑</span> 92
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Flashcards Mastered</span>
              <span className="text-base font-bold text-slate-900 flex items-center gap-1">
                <span className="text-emerald-600">↑</span> 124
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Avg Daily Prep Allocation</span>
              <span className="text-xl font-extrabold text-slate-900">45 Mins/Day</span>
            </div>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
              Integer Minutes
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Stacked Bar Chart: Prep Activity & Day-by-Day Analysis */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-900 text-lg">Day-by-Day Prep Activity & Category Analysis</h4>
            <p className="text-xs text-slate-400">Weekly breakdown of technical questions, system design, and flashcard practice</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-900"></span> Technical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-700"></span> System Design
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Behavioral
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-300"></span> Flashcard Reviews
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prepActivityData} barSize={28}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#ffffff', fontSize: '12px' }}
              />
              <Bar dataKey="Technical" stackId="a" fill="#1e1b4b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="SystemDesign" stackId="a" fill="#4338ca" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Behavioral" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Flashcards" stackId="a" fill="#a5b4fc" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
