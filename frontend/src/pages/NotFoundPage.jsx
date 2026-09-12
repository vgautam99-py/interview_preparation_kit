import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  Home,
  LayoutDashboard,
  FolderGit2,
  PlusSquare,
  Search,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      {/* Decorative Gradient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/90 backdrop-blur-md w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 relative z-10 text-center space-y-8">
        
        {/* Header Badge & Brand Logo */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-slate-200 shadow-xs flex items-center justify-center transition"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
              V
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">ViperAI</span>
          </div>

          <div className="w-9 h-9" />
        </div>

        {/* 404 Visual Hero Element */}
        <div className="relative inline-block">
          <div className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 tracking-tighter select-none">
            404
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xs p-3 rounded-2xl shadow-lg border border-indigo-100 animate-bounce">
            <Compass className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2 max-w-sm mx-auto">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-slate-500 text-xs font-medium leading-relaxed">
            Oops! The page or resource you are looking for might have been moved, renamed, or doesn't exist.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {user ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          )}

          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs transition border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Page
          </button>
        </div>

        {/* Quick Links Suggestions */}
        {user && (
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or jump directly to:
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
              <Link
                to="/kits"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg border border-slate-200 font-semibold transition"
              >
                <FolderGit2 className="w-3.5 h-3.5" /> My Kits
              </Link>
              <Link
                to="/create"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg border border-slate-200 font-semibold transition"
              >
                <PlusSquare className="w-3.5 h-3.5" /> Create Kit
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
