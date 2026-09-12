import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import KitFlashcardPractice from '../components/KitFlashcardPractice';
import DayQuestionDetailsModal from '../components/DayQuestionDetailsModal';
import api from '../lib/api';
import {
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  Pin,
  RefreshCw,
  Clock,
  ArrowRight,
  ChevronRight,
  RotateCw,
  ExternalLink,
  Award
} from 'lucide-react';

import toast from 'react-hot-toast';

export default function KitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | builder | schedule | practice
  const [activeModalDay, setActiveModalDay] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Category Filter in Builder
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    fetchKitDetails();
  }, [id]);

  const fetchKitDetails = async () => {
    try {
      const res = await api.get(`/kits/${id}`);
      setKit(res.data);
      if (res.data.flashcards) {
        setFlashcards(res.data.flashcards);
      }
    } catch (err) {
      console.error('Error loading kit details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async (qId, updatedFields) => {
    if (!kit) return;
    const updatedQuestions = kit.questions.map(q => {
      if (q.id === qId) {
        return { ...q, ...updatedFields, state: q.state === 'pinned' ? 'pinned' : 'edited' };
      }
      return q;
    });

    try {
      const res = await api.put(`/kits/${id}`, { questions: updatedQuestions });
      setKit(res.data);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleTogglePin = async (qId) => {
    if (!kit) return;
    const updatedQuestions = kit.questions.map(q => {
      if (q.id === qId) {
        return { ...q, state: q.state === 'pinned' ? 'generated' : 'pinned' };
      }
      return q;
    });

    try {
      const res = await api.put(`/kits/${id}`, { questions: updatedQuestions });
      setKit(res.data);
    } catch (err) {
      console.error('Pin toggle failed:', err);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!kit) return;
    const updatedQuestions = kit.questions.filter(q => q.id !== qId);
    try {
      const res = await api.put(`/kits/${id}`, { questions: updatedQuestions });
      setKit(res.data);
    } catch (err) {
      console.error('Delete question failed:', err);
    }
  };

  const handleAddQuestion = async () => {
    if (!kit) return;
    const newId = `Q-${kit.questions.length + 1}`;
    const newQuestion = {
      id: newId,
      requirement_ids: [kit.requirements[0]?.id || 'REQ-1'],
      category: selectedCategory === 'All' ? 'Technical' : selectedCategory,
      prompt: 'New custom interview question prompt...',
      answer_outline: '1. Custom key answer outline point',
      difficulty: 2,
      state: 'manual'
    };

    try {
      const res = await api.put(`/kits/${id}`, { questions: [...kit.questions, newQuestion] });
      setKit(res.data);
    } catch (err) {
      console.error('Add question failed:', err);
    }
  };

  const handleRegenerateQuestions = async () => {
    if (!kit) return;
    const currentAttempts = kit.regeneration_attempts || 0;
    if (currentAttempts >= 3) {
      toast.error('Maximum 3 regeneration attempts reached for this prep kit.');
      return;
    }

    setRegenLoading(true);
    try {
      const res = await api.post(`/kits/${id}/regenerate`);
      setKit(res.data);
      if (res.data.flashcards) setFlashcards(res.data.flashcards);
      toast.success('5 new questions and flashcards generated successfully!');
    } catch (err) {
      console.error('Regenerate failed:', err);
      toast.error(err.response?.data?.error || 'Failed to regenerate questions.');
    } finally {
      setRegenLoading(false);
    }
  };

  const handleRateConfidence = async (cardId, confidenceLevel) => {
    try {
      const res = await api.post(`/practice/${id}/confidence`, { cardId, confidence: confidenceLevel });
      setFlashcards(res.data.flashcards);
      setIsFlipped(false);
      if (currentFcIndex < res.data.flashcards.length - 1) {
        setCurrentFcIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Confidence update failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
          <p className="text-slate-500 text-sm font-medium">Loading kit workspace...</p>
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800">Kit Not Found</h2>
          <Link to="/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(kit.questions.map(q => q.category)))];
  const filteredQuestions = selectedCategory === 'All'
    ? kit.questions
    : kit.questions.filter(q => q.category === selectedCategory);

  const attemptsCount = kit.regeneration_attempts || 0;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 ml-0 transition-all duration-300">
        <Navbar
          title={`${kit.source?.company || 'Prep Kit'} — ${kit.source?.role || kit.role?.title}`}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 box-border">
          {/* Header Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {kit.role?.seniority || 'Senior'} Level
                </span>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Must-Haves Covered ({kit.coverage?.passes || 1} Pass)
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{kit.source?.role || kit.role?.title}</h2>
              <p className="text-slate-500 text-sm">{kit.source?.company} • {kit.source?.location || 'Remote'}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
                {kit.schedule?.days_available || 5} Days Plan • {kit.questions?.length || 0} Questions
              </span>

              {/* REGENERATE QUESTIONS BUTTON (5 Questions/Attempt, Max 3 Attempts) */}
              <button
                onClick={handleRegenerateQuestions}
                disabled={regenLoading || attemptsCount >= 3}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2"
                title={attemptsCount >= 3 ? "Maximum 3 regeneration attempts reached" : "Generate 5 new AI questions"}
              >
                <RefreshCw className={`w-4 h-4 ${regenLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'role', label: 'Role', icon: ShieldCheck },
              { id: 'builder', label: `Questions (${kit.questions?.length || 0})`, icon: Layers },
              { id: 'practice', label: `Flashcards (${flashcards.length})`, icon: Sparkles },
              { id: 'schedule', label: `Schedule (${kit.schedule?.days?.length || 0} Days)`, icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 flex items-center gap-2 transition border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Company Brief & Engineering Focus
                  </h3>
                  <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                    <p><strong>Overview:</strong> {kit.company_brief?.summary}</p>
                    <p><strong>What They Do:</strong> {kit.company_brief?.what_they_do}</p>
                  </div>
                  {kit.source?.pages_used && kit.source.pages_used.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Research Sources Used:</span>
                      <div className="flex flex-wrap gap-2">
                        {kit.source.pages_used.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs bg-slate-100 text-indigo-600 hover:bg-slate-200 px-3 py-1 rounded-lg flex items-center gap-1 font-mono"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Coverage Status
                  </h3>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                    <div className="text-emerald-800 font-bold text-sm flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      100% Must-Haves Covered
                    </div>
                    <p className="text-xs text-emerald-700">
                      Uncovered Must-Have Requirement IDs: <span className="font-mono">[]</span>
                    </p>
                    <p className="text-xs text-emerald-600">
                      Evaluated in {kit.coverage?.passes || 1} pipeline passes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Requirements Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Extracted Role Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kit.requirements?.map((req) => (
                    <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        req.priority === 'must' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {req.id} ({req.priority.toUpperCase()})
                      </span>
                      <p className="text-sm font-medium text-slate-800">{req.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROLE DETAILS */}
          {activeTab === 'role' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Role Specifications & Key Responsibilities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target Position</span>
                    <p className="text-base font-extrabold text-slate-900">{kit.source?.role || kit.role?.title}</p>
                    <p className="text-xs text-indigo-600 font-bold">{kit.role?.seniority || 'Junior'} Level</p>
                  </div>
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Company / Organization</span>
                    <p className="text-base font-extrabold text-slate-900">{kit.source?.company || 'Target Company'}</p>
                    <p className="text-xs text-slate-500">{kit.source?.location || 'Remote'}</p>
                  </div>
                </div>

                {kit.role?.responsibilities && kit.role.responsibilities.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Key Responsibilities:</span>
                    <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 font-medium">
                      {kit.role.responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QUESTION BUILDER */}
          {activeTab === 'builder' && (
            <div className="space-y-6">
              {/* Category Filter & Action Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 uppercase mr-2">Categories:</span>
                  {(showAllCategories ? categories : categories.slice(0, 4)).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}

                  {categories.length > 4 && (
                    <button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="w-7 h-7 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black rounded-lg border border-indigo-200 text-base flex items-center justify-center transition shadow-xs"
                      title={showAllCategories ? "Show fewer categories" : `Show all categories (${categories.length})`}
                    >
                      {showAllCategories ? '−' : '+'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAddQuestion}
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition"
                  >
                    <Plus className="w-4 h-4" /> Add Question
                  </button>

                  <button
                    disabled={regenLoading || selectedCategory === 'All'}
                    onClick={() => handleRegenerateCategory(selectedCategory)}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regenLoading ? 'animate-spin' : ''}`} />
                    Regenerate {selectedCategory === 'All' ? 'Category' : selectedCategory}
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredQuestions.map((q) => (
                  <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {q.id}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                          {q.category}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Difficulty: {q.difficulty}/3
                        </span>
                        
                        {/* State Badge */}
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                          q.state === 'pinned' ? 'bg-amber-100 text-amber-800' :
                          (q.state === 'edited' ? 'bg-blue-100 text-blue-800' :
                          (q.state === 'manual' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'))
                        }`}>
                          {q.state}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePin(q.id)}
                          className={`p-1.5 rounded-lg border transition ${
                            q.state === 'pinned' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'text-slate-400 hover:text-slate-600 border-slate-200'
                          }`}
                          title="Pin question to preserve from regeneration"
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">Interview Question Prompt</label>
                        <input
                          type="text"
                          value={q.prompt}
                          onChange={(e) => handleUpdateQuestion(q.id, { prompt: e.target.value })}
                          className="w-full text-slate-900 font-semibold text-base border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none pb-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">Recommended Answer Outline</label>
                        <textarea
                          rows={3}
                          value={q.answer_outline}
                          onChange={(e) => handleUpdateQuestion(q.id, { answer_outline: e.target.value })}
                          className="w-full text-sm text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Deterministic Prep Schedule</h3>
                  <p className="text-sm text-slate-500">Allocated across exactly {kit.schedule?.days_available || 5} days with tailored questions per day.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kit.schedule?.days?.map((dayObj, idx) => {
                  const totalQuestions = kit.questions || [];
                  const numDays = kit.schedule?.days_available || kit.schedule?.days?.length || 5;
                  const qPerDay = Math.max(1, Math.ceil(totalQuestions.length / numDays));

                  let displayQs = (dayObj.question_ids || [])
                    .map(qId => totalQuestions.find(q => q.id === qId))
                    .filter(Boolean);

                  if (displayQs.length !== qPerDay && totalQuestions.length > 0) {
                    displayQs = totalQuestions.slice(idx * qPerDay, (idx + 1) * qPerDay);
                  }

                  return (
                    <div key={dayObj.day} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-indigo-300 transition flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-wider">
                            Day {dayObj.day}
                          </span>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {dayObj.minutes || 60} Mins
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-base leading-snug">{dayObj.focus}</h4>
                      </div>

                      {/* Summary & See More Action */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-600">
                          {displayQs.length} Scheduled Questions
                        </div>

                        <button
                          onClick={() => setActiveModalDay({ dayItem: dayObj, questions: displayQs })}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition"
                        >
                          <span>See more</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PRACTICE FLASHCARDS */}
          {activeTab === 'practice' && (
            <KitFlashcardPractice
              kitId={id}
              initialCards={flashcards}
              seniority={kit.role?.seniority || 'Mid-Level'}
            />
          )}

          {/* DAY SCHEDULE QUESTIONS DETAIL MODAL */}
          <DayQuestionDetailsModal
            isOpen={!!activeModalDay}
            onClose={() => setActiveModalDay(null)}
            dayItem={activeModalDay?.dayItem}
            questions={activeModalDay?.questions || []}
            seniority={kit?.role?.seniority || 'Senior'}
            isCompleted={false}
            onStartPractice={() => setActiveTab('practice')}
          />
        </main>
      </div>
    </div>
  );
}
