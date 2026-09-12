import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/api';
import {
  Calendar,
  ChevronDown,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Check,
  ChevronRight,
  ChevronUp,
  Lock,
  Edit3,
  X,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

import DayQuestionDetailsModal from '../components/DayQuestionDetailsModal';

export default function SchedulePage() {
  const [searchParams] = useSearchParams();
  const [kits, setKits] = useState([]);
  const [selectedKitId, setSelectedKitId] = useState('');
  const [selectedKit, setSelectedKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);
  const [completedDays, setCompletedDays] = useState({});
  const [activeModalDay, setActiveModalDay] = useState(null);

  // Question Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kits');
      const fetchedKits = (res.data || []).filter(k => k.status === 'completed' && k.questions && k.questions.length > 0);
      setKits(fetchedKits);

      const urlKitId = searchParams.get('kitId');
      if (urlKitId) {
        const found = fetchedKits.find(k => (k.id || k._id) === urlKitId);
        if (found) {
          setSelectedKitId(urlKitId);
          setSelectedKit(found);
          if (found.schedule?.days) {
            const completedMap = {};
            found.schedule.days.forEach(d => {
              if (d.completed) completedMap[d.day] = true;
            });
            setCompletedDays(completedMap);
          }
        }
      } else {
        setSelectedKitId('');
        setSelectedKit(null);
        setCompletedDays({});
      }
    } catch (err) {
      console.error('Failed to fetch kits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKitChange = (e) => {
    const kitId = e.target.value;
    setSelectedKitId(kitId);
    const found = kits.find(k => (k.id || k._id) === kitId);
    setSelectedKit(found || null);
    setExpandedDay(null);

    if (found?.schedule?.days) {
      const completedMap = {};
      found.schedule.days.forEach(d => {
        if (d.completed) completedMap[d.day] = true;
      });
      setCompletedDays(completedMap);
    } else {
      setCompletedDays({});
    }
  };

  const toggleDayCompleted = async (dayNumber) => {
    const newCompleted = !completedDays[dayNumber];
    const updatedCompletedDays = {
      ...completedDays,
      [dayNumber]: newCompleted
    };
    setCompletedDays(updatedCompletedDays);

    if (newCompleted) {
      toast.success(`Day ${dayNumber} marked as completed! 🎉`);
    }

    // Persist day completion state to MongoDB Atlas
    if (selectedKit) {
      const kitId = selectedKit.id || selectedKit._id;
      const updatedDays = (selectedKit.schedule?.days || []).map(d => {
        if (d.day === dayNumber) {
          return { ...d, completed: newCompleted, completedAt: newCompleted ? new Date() : null };
        }
        return d;
      });

      try {
        const res = await api.put(`/kits/${kitId}`, {
          schedule: { ...selectedKit.schedule, days: updatedDays }
        });
        setSelectedKit(res.data);
      } catch (err) {
        console.error('Failed to persist day completion:', err);
      }
    }
  };

  // Open Question Edit Modal
  const handleOpenEditQuestion = (q) => {
    setEditingQuestion(q);
    setEditPrompt(q.prompt || '');
    setEditAnswer(q.answer_outline || '');
  };

  // Save Question Edits to MongoDB Atlas
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!selectedKit || !editingQuestion) return;
    const kitId = selectedKit.id || selectedKit._id;
    setSavingEdit(true);

    const updatedQuestions = selectedKit.questions.map(q => {
      if (q.id === editingQuestion.id) {
        return { ...q, prompt: editPrompt, answer_outline: editAnswer, state: 'edited' };
      }
      return q;
    });

    try {
      const res = await api.put(`/kits/${kitId}`, { questions: updatedQuestions });
      setSelectedKit(res.data);
      toast.success('Question and answer updated successfully in database!');
      setEditingQuestion(null);
    } catch (err) {
      console.error('Question update error:', err);
      toast.error('Failed to save question edits');
    } finally {
      setSavingEdit(false);
    }
  };

  const daysAvailable = selectedKit?.schedule?.days_available || 5;
  let daysList = selectedKit?.schedule?.days || [];

  if (daysList.length === 0 && selectedKit?.questions?.length > 0) {
    const totalQ = selectedKit.questions;
    const qPerDay = Math.ceil(totalQ.length / daysAvailable);
    daysList = Array.from({ length: daysAvailable }, (_, i) => ({
      day: i + 1,
      focus: i === 0 ? 'High-Priority Architecture & Must-Have Concepts' : (i === 1 ? 'Core Technical Deep Dives & System Design' : (i === 2 ? 'Advanced Data Engineering & API Integration' : `Focused Module Practice — Day ${i + 1}`)),
      question_ids: totalQ.slice(i * qPerDay, (i + 1) * qPerDay).map(q => q.id),
      minutes: 60,
      completed: false
    }));
  } else if (daysList.length === 0) {
    daysList = Array.from({ length: daysAvailable }, (_, i) => ({
      day: i + 1,
      focus: i === 0 ? 'High-Priority Architecture & Must-Have Concepts' : `Focused Module Practice — Day ${i + 1}`,
      question_ids: Array.from({ length: 10 }, (_, qIdx) => `Q-${i * 10 + qIdx + 1}`),
      minutes: 60,
      completed: false
    }));
  }

  // Calculate dynamic coverage pct starting at 0% and increasing as days are completed
  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const coveragePct = daysList.length > 0
    ? Math.min(100, Math.round((completedCount / daysList.length) * 100))
    : 0;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const todayMinutes = daysList[0]?.minutes || 60;
  const companyName = selectedKit?.source?.company || selectedKit?.company_brief?.company || 'Company Prep';
  const roleTitle = selectedKit?.source?.role || selectedKit?.role?.title || 'Prep Kit';
  const seniority = selectedKit?.role?.seniority || 'Senior';

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 ml-0 transition-all duration-300">
        <Navbar title="Study Schedule" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* HEADER SECTION */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Study Schedule</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Day-by-day 10-question study plan tailored for {companyName} • {roleTitle} ({seniority}).
            </p>
          </div>

          {/* SECTION 1: KIT SELECTOR DROPDOWN */}
          {kits.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Kit
              </label>
              <div className="relative">
                <select
                  value={selectedKitId}
                  onChange={handleKitChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer pr-10 shadow-inner"
                >
                  <option value="">Select company • role</option>
                  {kits.map(kit => {
                    const kitId = kit.id || kit._id;
                    const company = kit.source?.company || 'Company';
                    const role = kit.source?.role || kit.role?.title || 'Role';
                    const sen = kit.role?.seniority || 'Senior';
                    return (
                      <option key={kitId} value={kitId}>
                        {company} • {role} ({sen})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* SECTION 2: TOP 3 STAT BADGES */}
          {selectedKit && (
            <div className="grid grid-cols-3 gap-4">
              {/* Badge 1: Days remaining */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
                <div className="text-lg font-black text-slate-900">{daysAvailable - completedCount} Days</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">remaining</div>
              </div>

              {/* Badge 2: Minutes today */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
                <div className="text-lg font-black text-indigo-600">{todayMinutes} min</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">today</div>
              </div>

              {/* Badge 3: Coverage */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
                <div className="text-lg font-black text-emerald-600">{coveragePct}%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">coverage</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-slate-500 text-xs font-medium">Loading study schedule from database...</p>
            </div>
          ) : !selectedKit ? (
            /* DEFAULT STATE: SELECT COMPANY AND ROLE PROMPT */
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
                📅
              </div>
              <div className="space-y-1.5">
                <h4 className="text-slate-900 font-extrabold text-xl">Select Company & Role</h4>
                <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto font-medium">
                  Please select a company and role from the dropdown above to view your study schedule and practice plan.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SECTION 3: YOUR PREPARATION PLAN */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
                  Your Preparation Plan ({daysList.length} Days)
                </h3>

                <div className="space-y-4">
                  {daysList.map((dayItem, idx) => {
                    const dayNum = dayItem.day || idx + 1;
                    const isCompleted = !!completedDays[dayNum];
                    
                    // DAY LOCKING RULE: Day 1 unlocked by default; Day K locked if Day K-1 not completed
                    const isLocked = idx > 0 && !completedDays[daysList[idx - 1]?.day || idx];
                    const isToday = !isLocked && !isCompleted && (idx === 0 || completedDays[daysList[idx - 1]?.day]);
                    const isExpanded = expandedDay === dayNum || isToday;

                    // Get questions assigned to this day
                    const allQuestions = selectedKit.questions || [];
                    const numDays = selectedKit.schedule?.days_available || daysList.length || 5;
                    const qPerDay = Math.max(1, Math.ceil(allQuestions.length / numDays));

                    let assignedQs = allQuestions.filter(q => (dayItem.question_ids || []).includes(q.id));
                    if (assignedQs.length !== qPerDay && allQuestions.length > 0) {
                      assignedQs = allQuestions.slice(idx * qPerDay, (idx + 1) * qPerDay);
                    }
                    const assignedFcCount = Math.ceil((selectedKit.flashcards?.length || 50) / daysList.length);

                    /* STATE A: LOCKED DAY CARD */
                    if (isLocked) {
                      return (
                        <div key={dayNum} className="bg-slate-100/70 rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3 opacity-80 transition">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-400">
                              <Lock className="w-4 h-4" />
                              <span>DAY {dayNum} — LOCKED</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-400">
                              {assignedQs.length} Questions • {assignedFcCount} Flashcards
                            </span>
                          </div>

                          <h4 className="text-base font-extrabold text-slate-500">{dayItem.focus}</h4>

                          <p className="text-xs text-slate-500 font-medium">
                            Complete Day {dayNum - 1} to unlock Day {dayNum}'s scheduled questions and flashcards.
                          </p>
                        </div>
                      );
                    }

                    /* STATE B: COMPLETED DAY CARD */
                    if (isCompleted) {
                      return (
                        <div key={dayNum} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 transition">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>✓ DAY {dayNum}</span>
                            </div>
                            <button
                              onClick={() => toggleDayCompleted(dayNum)}
                              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline"
                            >
                              Mark Incomplete
                            </button>
                          </div>

                          <h4 className="text-lg font-black text-slate-900">{dayItem.focus}</h4>

                          {/* 100% Progress Bar */}
                          <div className="space-y-1">
                            <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden border border-emerald-200">
                              <div className="bg-emerald-600 h-full rounded-full w-full" />
                            </div>
                            <div className="text-right text-xs font-mono font-bold text-emerald-700">100%</div>
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1 border-t border-slate-100">
                            <span>{assignedQs.length} Questions • {assignedFcCount} Flashcards</span>
                            <button
                              onClick={() => setActiveModalDay({ dayItem, questions: assignedQs })}
                              className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 group text-xs"
                            >
                              <span>See more</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    /* STATE C: ACTIVE TODAY / UNLOCKED DAY CARD */
                    return (
                      <div key={dayNum} className="bg-white rounded-3xl border-2 border-indigo-500 p-6 shadow-md space-y-5 relative">
                        {/* Header badges */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {isToday ? 'TODAY' : `DAY ${dayNum}`}
                            </span>
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              DAY {dayNum}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 font-mono">
                            {dayItem.minutes || 60} minutes
                          </span>
                        </div>

                        {/* Focus Title */}
                        <h4 className="text-xl font-black text-slate-900">{dayItem.focus}</h4>

                        {/* Schedule Summary Bar */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                              Total Questions
                            </span>
                            <span className="text-sm font-extrabold text-slate-900">
                              {assignedQs.length} Questions ({seniority} level)
                            </span>
                          </div>

                          <button
                            onClick={() => setActiveModalDay({ dayItem, questions: assignedQs })}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 group"
                          >
                            <span>See more</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => toggleDayCompleted(dayNum)}
                            className="w-full sm:w-auto text-xs font-bold text-slate-600 hover:text-indigo-600 transition border border-slate-200 px-4 py-2.5 rounded-xl bg-slate-50"
                          >
                            Mark Day Complete
                          </button>

                          <button
                            onClick={() => setActiveModalDay({ dayItem, questions: assignedQs })}
                            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-md hover:shadow-indigo-600/30 flex items-center justify-center gap-2"
                          >
                            Start Today's Practice →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: COMPLETE MULTI-DAY OVERVIEW TIMELINE */}
              <div className="hidden sm:block bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
                  Your {daysAvailable}-Day Plan Overview
                </h3>

                {/* Desktop Horizontal Timeline Stepper */}
                <div className="hidden sm:block py-4">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 z-0" />

                    {daysList.map((dayItem, idx) => {
                      const dayNum = dayItem.day || idx + 1;
                      const isCompleted = !!completedDays[dayNum];
                      const isLocked = idx > 0 && !completedDays[daysList[idx - 1]?.day || idx];
                      const shortTopic = dayItem.focus.split(' ')[0] || `Day ${dayNum}`;

                      return (
                        <div key={dayNum} className="relative z-10 flex flex-col items-center text-center space-y-2 min-w-[70px]">
                          <span className="text-[11px] font-bold text-slate-600">Day {dayNum}</span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                            isCompleted
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : !isLocked
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                              : 'bg-slate-100 text-slate-400 border-slate-300'
                          }`}>
                            {isCompleted ? '✓' : isLocked ? <Lock className="w-3.5 h-3.5" /> : '○'}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700 max-w-[80px] truncate">
                            {shortTopic}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDIT QUESTION MODAL */}
          {editingQuestion && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleSaveQuestion} className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-600" /> Edit Question & Detailed Answer
                  </h3>
                  <button type="button" onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Interview Question Prompt</label>
                    <textarea
                      required
                      rows={2}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Answer Outline</label>
                    <textarea
                      required
                      rows={6}
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
                  >
                    {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* DAY QUESTIONS DETAILS MODAL */}
          <DayQuestionDetailsModal
            isOpen={!!activeModalDay}
            onClose={() => setActiveModalDay(null)}
            dayItem={activeModalDay?.dayItem}
            questions={activeModalDay?.questions || []}
            seniority={seniority}
            isCompleted={!!completedDays[activeModalDay?.dayItem?.day]}
            onToggleCompleted={(dayNum) => toggleDayCompleted(dayNum)}
            onEditQuestion={(q) => handleOpenEditQuestion(q)}
            onStartPractice={() => navigate('/flashcards')}
          />
        </main>
      </div>
    </div>
  );
}
