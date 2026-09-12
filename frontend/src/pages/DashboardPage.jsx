import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  PlusCircle,
  RefreshCw,
  Sparkles,
  Calendar,
  CheckSquare,
  ArrowRight,
  BookOpen,
  Target
} from 'lucide-react';
import KitCard from '../components/kits/KitCard';

import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      const res = await api.get('/kits');
      setKits(res.data);
    } catch (err) {
      console.error('Failed to load kits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKit = async (id) => {
    try {
      await api.delete(`/kits/${id}`);
      setKits(kits.filter(k => (k.id || k._id) !== id));
      toast.success('Prep kit deleted successfully!');
    } catch (err) {
      console.error('Failed to delete kit:', err);
      toast.error('Failed to delete kit');
    }
  };

  // Determine Greeting based on time of day
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = (user?.name && user.name !== 'Candidate')
    ? user.name.trim().split(' ')[0]
    : (user?.email ? user.email.split('@')[0] : 'Vikash');

  // Compute stats dynamically from MongoDB kits
  const kitsCount = kits.length;
  const avgCoverage = kitsCount > 0
    ? Math.round(kits.reduce((acc, k) => {
        const qCount = k.questions?.length || 0;
        const uncovCount = k.coverage?.uncovered_requirement_ids?.length || 0;
        const totalReq = qCount + uncovCount;
        const cov = totalReq > 0 ? Math.round((qCount / totalReq) * 100) : 100;
        return acc + cov;
      }, 0) / kitsCount)
    : 0;

  const totalQuestions = kitsCount > 0
    ? kits.reduce((acc, k) => acc + (k.questions?.length || 0), 0)
    : 0;

  const totalFlashcards = kitsCount > 0
    ? kits.reduce((acc, k) => acc + (k.flashcards?.length || 0), 0)
    : 0;

  const cardsNeedingReview = kitsCount > 0
    ? kits.reduce((acc, k) => {
        const unmastered = (k.flashcards || []).filter(fc => !fc.confidence || fc.confidence <= 2).length;
        return acc + unmastered;
      }, 0)
    : 0;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 ml-0 transition-all duration-300">
        <Navbar title="Dashboard" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 box-border">
          {/* 1. Header Greeting Section */}
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {greetingTime}, {displayName} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Continue preparing for your next interview.
            </p>
          </div>

          {/* 2. Three Stats Boxes Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1: Kits */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition">
              <span className="text-3xl font-black text-slate-900">{kitsCount} {kitsCount === 1 ? 'Kit' : 'Kits'}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Kits</span>
            </div>

            {/* Box 2: Coverage */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition">
              <span className="text-3xl font-black text-indigo-600">{avgCoverage}%</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Coverage</span>
            </div>

            {/* Box 3: Questions */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-1 hover:shadow-md transition">
              <span className="text-3xl font-black text-slate-900">{totalQuestions} Questions</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prepared Questions</span>
            </div>
          </div>

          {/* 3. Your Recent Kits Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900">Your Recent Kits</h2>
              <button
                onClick={fetchKits}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh List
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-xs font-medium">Loading interview kits...</p>
              </div>
            ) : kits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto font-extrabold text-xl">
                  📚
                </div>
                <h4 className="text-slate-900 font-extrabold text-base">No interview kits yet</h4>
                <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                  Create your first personalized interview preparation kit from a job description.
                </p>
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition"
                >
                  Generate Interview Kit
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {kits.slice(0, 2).map((kit) => (
                  <KitCard
                    key={kit.id || kit._id}
                    kit={kit}
                    showProgress={false}
                    onDelete={handleDeleteKit}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 4. Today's Preparation Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="text-xl font-extrabold text-slate-900">Today's Preparation</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Practice Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-600 font-extrabold text-sm">
                    <CheckSquare className="w-4 h-4" />
                    <span>Practice</span>
                  </div>
                  <div className="space-y-0.5 text-xs text-slate-600 font-semibold">
                    <p className="text-slate-900 font-bold text-sm">{totalFlashcards} {totalFlashcards === 1 ? 'flashcard' : 'flashcards'}</p>
                    <p className="text-amber-600 font-bold">{cardsNeedingReview} {cardsNeedingReview === 1 ? 'needs review' : 'need review'}</p>
                  </div>
                </div>

                <Link
                  to="/flashcards"
                  className="w-full bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  Start Practice <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Study Schedule Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-600 font-extrabold text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Study Schedule</span>
                  </div>
                  <div className="space-y-0.5 text-xs text-slate-600 font-semibold">
                    <p className="text-slate-900 font-bold text-sm">
                      {kits.length > 0 && kits[0].schedule?.days?.[0]?.focus ? kits[0].schedule.days[0].focus : 'Structured Prep Schedule'}
                    </p>
                    <p className="text-slate-500 font-medium">
                      {kits.length > 0 && kits[0].schedule?.days_available ? `${kits[0].schedule.days_available}-Day Plan` : 'Day-by-day plan'}
                    </p>
                  </div>
                </div>

                <Link
                  to="/kits"
                  className="w-full bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  View Schedule <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


