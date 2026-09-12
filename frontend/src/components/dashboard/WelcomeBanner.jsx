import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, PlusCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WelcomeBanner({ totalKits = 0 }) {
  const { user } = useAuth();
  // Extract user's registered name (never use "Candidate")
  const displayName = (user?.name && user.name !== 'Candidate')
    ? user.name.trim().split(' ')[0]
    : (user?.email ? user.email.split('@')[0] : 'User');
  const plan = (user?.subscription || 'free').toUpperCase();

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-indigo-500/20 font-sans">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            ViperAI Platform • {plan} Plan
          </span>
          <span className="bg-emerald-500/20 backdrop-blur-md text-emerald-100 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-300/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            100% Requirement Coverage
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Welcome back, {displayName}! 👋
        </h2>
        <p className="text-indigo-100 text-xs md:text-sm max-w-2xl leading-relaxed">
          You currently have <span className="text-white font-bold">{totalKits} interview prep kits</span> ready. Create custom prep kits for any industry, position, or job role.
        </p>
      </div>

      <Link
        to="/create"
        className="bg-white hover:bg-slate-100 text-indigo-700 font-bold px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-xs transition whitespace-nowrap"
      >
        Generate Interview Kit
      </Link>
    </div>
  );
}

