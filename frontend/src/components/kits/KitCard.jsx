import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MoreVertical,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Copy,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function KitCard({ kit, onDelete, onRename, onDuplicate, onRetry, showProgress = true }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const isFailed = kit.status === 'failed';
  const isGenerating = kit.status && kit.status !== 'completed' && kit.status !== 'failed';

  const company = kit.source?.company || kit.company_brief?.company || 'Company Prep';
  const role = kit.source?.role || kit.role?.title || 'Prep Kit';
  const seniority = kit.role?.seniority || 'Senior';
  const days = kit.schedule?.days_available || (Array.isArray(kit.schedule?.days) ? kit.schedule.days.length : 5);
  const questionsCount = Array.isArray(kit.questions) && kit.questions.length > 0 ? kit.questions.length : (days * 10);
  const flashcardsCount = Array.isArray(kit.flashcards) && kit.flashcards.length > 0 ? kit.flashcards.length : (days * 10);

  // Calculate Coverage Percentage in sync with completed practice days (0% on creation)
  const scheduleDays = Array.isArray(kit.schedule?.days) ? kit.schedule.days : [];
  const totalDays = kit.schedule?.days_available || scheduleDays.length || 5;
  const completedDaysCount = scheduleDays.filter(d => d.completed).length;
  const coveragePct = totalDays > 0 ? Math.min(100, Math.round((completedDaysCount / totalDays) * 100)) : 0;

  // Relative updated timestamp string
  const getUpdatedText = () => {
    if (!kit.updatedAt && !kit.createdAt) return 'Updated today';
    const date = new Date(kit.updatedAt || kit.createdAt);
    const diffHours = Math.abs(new Date() - date) / 36e5;
    if (diffHours < 24) return 'Updated today';
    if (diffHours < 48) return 'Updated yesterday';
    const diffDays = Math.floor(diffHours / 24);
    return `Updated ${diffDays} days ago`;
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const kitId = kit.id || kit._id;

  if (isGenerating) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 font-sans">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{company}</span>
          </div>

          <h4 className="font-extrabold text-slate-900 text-base">{role}</h4>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-indigo-600 font-bold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating kit...</span>
            </div>

            <div className="space-y-1.5 pl-2 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Researching company
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Analyzing job description
              </div>
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating questions
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Circle className="w-3.5 h-3.5" /> Creating flashcards
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Circle className="w-3.5 h-3.5" /> Building schedule
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isFailed && showProgress) {
    return (
      <div className="bg-rose-50/50 rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 font-sans">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>{company}</span>
          </div>

          <h4 className="font-extrabold text-slate-900 text-base">{role}</h4>

          <div className="p-3 bg-rose-100/60 rounded-2xl border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold">Generation failed</span>
              <span className="text-[11px]">We couldn't complete this kit.</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onRetry && onRetry(kitId)}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry Generation
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between space-y-4 font-sans relative group w-full box-border">
      <div className="space-y-3">
        {/* Company Header */}
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="truncate max-w-[160px] sm:max-w-[220px]">{company}</span>
        </div>

        {/* Role & Seniority */}
        <div className="space-y-0.5">
          <h4 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-1">{role}</h4>
          <span className="text-xs text-slate-500 font-bold block">{seniority}</span>
        </div>

        {/* Coverage Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Coverage</span>
            <span className="font-extrabold text-slate-900">{coveragePct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
        </div>

        {/* Questions, Flashcards & Schedule Info */}
        <div className="text-xs text-slate-600 font-semibold space-y-1 pt-1">
          <div>
            {questionsCount} Questions • {flashcardsCount} Flashcards
          </div>
          <div className="text-slate-500 font-medium">
            {days}-Day Schedule
          </div>
        </div>

        {/* Updated Timestamp */}
        <div className="text-[11px] text-slate-400 font-medium pt-1">
          {getUpdatedText()}
        </div>
      </div>

      {/* Bottom Row: Open Kit → Button & Three-Dot Menu ⋮ */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        {/* Open Kit -> Button */}
        <button
          onClick={() => navigate(`/kits/${kitId}`)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-indigo-600/20 flex items-center gap-1.5"
        >
          Open Kit →
        </button>

        {/* Three-Dot Menu Button & Dropdown (Open, Rename, Duplicate, Delete) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="Kit Options"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-extrabold text-sm"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-8 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-2 text-xs font-semibold text-slate-700 space-y-0.5">
              {/* Option 1: Open */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  navigate(`/kits/${kitId}`);
                }}
                className="w-full px-4 py-2 text-left hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </button>

              {/* Option 2: Rename */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRename && onRename(kit);
                }}
                className="w-full px-4 py-2 text-left hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Rename
              </button>

              {/* Option 3: Duplicate */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDuplicate && onDuplicate(kit);
                }}
                className="w-full px-4 py-2 text-left hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              {/* Option 4: Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete && onDelete(kitId);
                }}
                className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

