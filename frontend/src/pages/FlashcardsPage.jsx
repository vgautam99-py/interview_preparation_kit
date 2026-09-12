import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/api';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  RefreshCw,
  PlusCircle,
  Eye,
  Target,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FlashcardsPage() {
  const [searchParams] = useSearchParams();
  const [kits, setKits] = useState([]);
  const [selectedKitId, setSelectedKitId] = useState('');
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedConfidence, setSelectedConfidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [confidenceHistory, setConfidenceHistory] = useState({});
  const [isWeakMode, setIsWeakMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchKits();
  }, []);

  // Fetch real kits from MongoDB
  const fetchKits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kits');
      const fetchedKits = res.data || [];
      setKits(fetchedKits);

      const urlKitId = searchParams.get('kitId');
      if (urlKitId) {
        setSelectedKitId(urlKitId);
        loadKitCards(urlKitId, false, fetchedKits);
      } else {
        setSelectedKitId('');
        setCards([]);
      }
    } catch (err) {
      console.error('Failed to fetch kits from MongoDB:', err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  // Load cards for selected kit (with weak mode sorting option)
  const loadKitCards = async (kitId, weakMode = false, availableKits = kits) => {
    if (!kitId) {
      setCards([]);
      return;
    }

    try {
      const endpoint = `/practice/${kitId}/flashcards${weakMode ? '?mode=weak' : ''}`;
      const res = await api.get(endpoint);
      let loadedCards = res.data?.flashcards || [];

      if (loadedCards.length === 0) {
        const targetKit = availableKits.find(k => (k.id || k._id) === kitId);
        loadedCards = targetKit?.flashcards || [];
      }

      if (weakMode) {
        // Sort lowest confidence first (0 or null -> 1 -> 2 -> 3 -> 4 -> 5)
        loadedCards = [...loadedCards].sort((a, b) => (a.confidence || 0) - (b.confidence || 0));
      }

      setCards(loadedCards);
    } catch (err) {
      console.error('Failed to load flashcards for kit:', err);
      const targetKit = availableKits.find(k => (k.id || k._id) === kitId);
      let loadedCards = targetKit?.flashcards || [];
      if (weakMode) {
        loadedCards = [...loadedCards].sort((a, b) => (a.confidence || 0) - (b.confidence || 0));
      }
      setCards(loadedCards);
    } finally {
      setCurrentIndex(0);
      setIsRevealed(false);
      setSelectedConfidence(null);
      setSessionCompleted(false);
      setConfidenceHistory({});
      setIsWeakMode(weakMode);
    }
  };

  const handleKitChange = (e) => {
    const kitId = e.target.value;
    setSelectedKitId(kitId);
    loadKitCards(kitId, false);
  };

  // Enable "Practice Weak Cards" mode
  const handlePracticeWeakCards = () => {
    if (!selectedKitId) return;
    toast.success('Practice Weak Cards mode activated! Prioritizing lowest confidence first.');
    loadKitCards(selectedKitId, true);
  };

  // Record confidence level 1 to 5 to MongoDB
  const handleSelectConfidence = async (level) => {
    setSelectedConfidence(level);

    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];

    // Track local session history
    setConfidenceHistory(prev => ({
      ...prev,
      [currentCard.id || currentIndex]: level
    }));

    // Update local card confidence
    const updatedCards = [...cards];
    updatedCards[currentIndex] = { ...currentCard, confidence: level, lastSeenAt: new Date() };
    setCards(updatedCards);

    // Save progress directly to MongoDB Atlas database
    if (selectedKitId && currentCard.id) {
      try {
        await api.post(`/practice/${selectedKitId}/confidence`, {
          cardId: currentCard.id,
          confidence: level
        });
      } catch (err) {
        console.error('Failed to save confidence to MongoDB:', err);
      }
    }
  };

  // Move to previous card in flow
  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsRevealed(false);
      setSelectedConfidence(null);
    }
  };

  // Move to next card in flow
  const handleNextCard = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
      setSelectedConfidence(null);
    } else {
      setSessionCompleted(true);
    }
  };

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;
  const selectedKit = kits.find(k => (k.id || k._id) === selectedKitId);
  const seniority = selectedKit?.role?.seniority || currentCard?.seniority || 'Senior';

  // Calculate statistics for Overview
  const confidentCount = cards.filter(c => c.confidence >= 4).length;
  const needReviewCount = cards.filter(c => !c.confidence || c.confidence <= 3).length;
  const overallConfidencePct = totalCards > 0
    ? Math.round((cards.reduce((acc, c) => acc + (c.confidence || 0), 0) / (totalCards * 5)) * 100)
    : 0;

  // Session summary stats
  const sessionReviewedCount = Object.keys(confidenceHistory).length;
  const sessionAvgScore = sessionReviewedCount > 0
    ? (Object.values(confidenceHistory).reduce((a, b) => a + b, 0) / sessionReviewedCount).toFixed(1)
    : (totalCards > 0 ? (cards.reduce((acc, c) => acc + (c.confidence || 0), 0) / totalCards).toFixed(1) : '0.0');
  const sessionStrongCount = Object.values(confidenceHistory).filter(c => c >= 4).length;
  const sessionReviewCount = Object.values(confidenceHistory).filter(c => c <= 3).length;

  const cleanFrontText = (text) => {
    if (!text) return '';
    return text.replace(/^(Q\d+\s*\([^)]+\):\s*)+/gi, '').trim();
  };

  // 5 Emoji Confidence Rating Options
  const CONFIDENCE_OPTIONS = [
    {
      level: 1,
      emoji: '😕',
      num: '1',
      label: 'Very weak',
      color: 'border-rose-200 bg-rose-50/60 text-rose-800 hover:bg-rose-100',
      active: 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
    },
    {
      level: 2,
      emoji: '😐',
      num: '2',
      label: 'Weak',
      color: 'border-orange-200 bg-orange-50/60 text-orange-800 hover:bg-orange-100',
      active: 'bg-orange-500 text-white border-orange-500 shadow-md ring-2 ring-orange-300'
    },
    {
      level: 3,
      emoji: '🙂',
      num: '3',
      label: 'Okay',
      color: 'border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100',
      active: 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300'
    },
    {
      level: 4,
      emoji: '😊',
      num: '4',
      label: 'Good',
      color: 'border-indigo-200 bg-indigo-50/60 text-indigo-800 hover:bg-indigo-100',
      active: 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
    },
    {
      level: 5,
      emoji: '🔥',
      num: '5',
      label: 'Strong',
      color: 'border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100',
      active: 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 ml-0 transition-all duration-300">
        <Navbar title="Practice" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto space-y-6">
          {/* HEADER SECTION */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Practice</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Test your knowledge and improve weak areas.
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
                    return (
                      <option key={kitId} value={kitId}>
                        {company} • {role}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* SECTION 6 & 7: PRACTICE OVERVIEW & STAT CARDS + WEAK CARDS BUTTON */}
          {selectedKitId && cards.length > 0 && !sessionCompleted && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* 3 Stat Cards */}
                <div className="grid grid-cols-3 gap-3 flex-1 min-w-[280px]">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-lg font-black text-slate-900">{totalCards}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Cards</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <div className="text-lg font-black text-emerald-600">{confidentCount}</div>
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">Confident</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                    <div className="text-lg font-black text-amber-600">{needReviewCount}</div>
                    <div className="text-[10px] font-bold text-amber-800 uppercase">Need Review</div>
                  </div>
                </div>

                {/* Practice Weak Cards Button */}
                <button
                  onClick={handlePracticeWeakCards}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm border ${
                    isWeakMode
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  Practice Weak Cards
                </button>
              </div>

              {/* Overall Confidence Bar */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Overall Confidence</span>
                  <span className="font-mono text-indigo-600">{overallConfidencePct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${overallConfidencePct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-slate-500 text-xs font-medium">Loading flashcards from database...</p>
            </div>
          ) : !selectedKitId ? (
            /* DEFAULT STATE: SELECT COMPANY AND ROLE PROMPT */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                🎴
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900">Select a Kit to Practice</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Choose an interview prep kit from the dropdown menu above to start testing your knowledge with flashcards.
                </p>
              </div>
            </div>
          ) : kits.length === 0 || cards.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                📚
              </div>
              <div className="space-y-1">
                <h4 className="text-slate-900 font-extrabold text-lg">No flashcards in database yet</h4>
                <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                  Create an interview prep kit to automatically extract requirements and generate practice flashcards in your database.
                </p>
              </div>

              <Link
                to="/create"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition"
              >
                Generate Interview Kit
              </Link>
            </div>
          ) : sessionCompleted ? (
            /* SECTION 5: PRACTICE SESSION SUMMARY SCREEN */
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6 animate-fadeIn max-w-lg mx-auto">
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Trophy className="w-8 h-8 text-indigo-600" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">🎉 Practice Session Complete</h2>
                <p className="text-xs text-slate-500">
                  Great job reviewing your flashcards! Here is your session breakdown:
                </p>
              </div>

              {/* 3 Stats Grid Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {sessionReviewedCount}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                    Cards Reviewed
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="text-3xl font-black text-indigo-600 font-mono">
                    {sessionAvgScore}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mt-1">
                    Avg Confidence
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="text-3xl font-black text-emerald-600 font-mono">
                    {sessionStrongCount}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-1">
                    Strong Cards
                  </div>
                </div>
              </div>

              {/* Summary message */}
              <p className="text-xs text-slate-600 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
                {sessionStrongCount >= totalCards * 0.7
                  ? '🌟 Excellent performance! You have mastered most concepts in this kit.'
                  : '💡 Good effort! Review your weak cards again to boost your confidence rating.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSessionCompleted(false);
                    setCurrentIndex(0);
                    setIsRevealed(false);
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Practice Again
                </button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* SECTION 2, 3, 4: ACTIVE FLASHCARD & CONFIDENCE RECORDING UI */
            <div className="space-y-6">
              {/* Centerpiece Flashcard Container */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 relative min-h-[320px] flex flex-col justify-between">
                {/* Top Header Row Inside Flashcard Box: Circled Previous Arrow, Flashcard X of Y, Circled Next Arrow */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <button
                    onClick={handlePrevCard}
                    disabled={currentIndex === 0}
                    title="Previous Flashcard"
                    className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-indigo-600 shadow-sm transition flex items-center justify-center shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5 font-bold" />
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider text-center">
                    Flashcard {currentIndex + 1} of {totalCards}
                  </span>

                  <button
                    onClick={handleNextCard}
                    title="Next Flashcard"
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center justify-center shrink-0 hover:shadow-indigo-600/30"
                  >
                    <ChevronRight className="w-5 h-5 font-bold" />
                  </button>
                </div>

                {/* Card Content Area */}
                {!isRevealed ? (
                  /* STATE A: BEFORE REVEALING */
                  <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-6">
                    <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-relaxed text-center max-w-xl">
                      Q{currentIndex + 1} ({seniority}): {cleanFrontText(currentCard?.front) || 'Question prompt'}
                    </h3>

                    {/* Reveal Answer Button */}
                    <button
                      onClick={() => setIsRevealed(true)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-md flex items-center gap-2 hover:shadow-indigo-600/30"
                    >
                      <Eye className="w-4 h-4" />
                      Reveal Answer
                    </button>
                  </div>
                ) : (
                  /* STATE B: AFTER REVEALING ANSWER */
                  <div className="flex-1 space-y-6 py-2 animate-fadeIn text-left">
                    {/* Question Box */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Question
                      </span>
                      <p className="text-base md:text-lg font-extrabold text-slate-900 leading-relaxed">
                        Q{currentIndex + 1} ({seniority}): {cleanFrontText(currentCard?.front)}
                      </p>
                    </div>

                    {/* Solid Divider Line */}
                    <div className="border-b border-slate-200 my-4" />

                    {/* Answer Box */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                        Answer
                      </span>
                      <p className="text-xs md:text-sm font-semibold text-slate-700 leading-relaxed bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 whitespace-pre-line">
                        {currentCard?.back || 'Answer explanation unavailable.'}
                      </p>
                    </div>

                    {/* Down Arrow Indicator as seen in Wireframe */}
                    <div className="flex justify-center pt-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shadow-inner">
                        ↓
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Indicator Line */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Progress</span>
                  <span className="font-mono text-slate-900">{currentIndex + 1} / {totalCards}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(((currentIndex + 1) / totalCards) * 100)}%` }}
                  />
                </div>
              </div>

              {/* CONFIDENCE RATING SECTION */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    After revealing the answer:
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                    How confident are you?
                  </h4>
                </div>

                {/* 5 Rating Emoji Option Buttons */}
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {CONFIDENCE_OPTIONS.map((opt) => {
                    const isSelected = (selectedConfidence === opt.level) || (currentCard?.confidence === opt.level && !selectedConfidence);
                    return (
                      <button
                        key={opt.level}
                        onClick={() => handleSelectConfidence(opt.level)}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition ${
                          isSelected ? opt.active : opt.color
                        }`}
                      >
                        <span className="hidden sm:block text-lg sm:text-xl">{opt.emoji}</span>
                        <span className="text-xs font-black">{opt.num}</span>
                        <span className="text-[10px] font-bold tracking-tight text-center leading-tight">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

