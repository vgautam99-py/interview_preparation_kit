import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Eye, Target, RefreshCw, Trophy, ArrowLeft, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KitFlashcardPractice({ kitId, initialCards = [], seniority = 'Mid-Level' }) {
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedConfidence, setSelectedConfidence] = useState(null);
  const [confidenceHistory, setConfidenceHistory] = useState({});
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isWeakMode, setIsWeakMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCards && initialCards.length > 0) {
      setCards(initialCards);
    } else if (kitId) {
      loadFlashcards(kitId, false);
    }
  }, [kitId, initialCards]);

  const loadFlashcards = async (id, weakMode = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/practice/${id}/flashcards${weakMode ? '?weakOnly=true' : ''}`);
      setCards(res.data || []);
      setCurrentIndex(0);
      setIsRevealed(false);
      setSelectedConfidence(null);
      setSessionCompleted(false);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
      toast.error('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeWeakCards = () => {
    const newWeakMode = !isWeakMode;
    setIsWeakMode(newWeakMode);
    loadFlashcards(kitId, newWeakMode);
  };

  const handleSelectConfidence = async (level) => {
    setSelectedConfidence(level);
    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];

    setConfidenceHistory(prev => ({
      ...prev,
      [currentCard.id || currentIndex]: level
    }));

    const updated = [...cards];
    updated[currentIndex] = { ...currentCard, confidence: level };
    setCards(updated);

    if (kitId && currentCard.id) {
      try {
        await api.post(`/practice/${kitId}/confidence`, {
          cardId: currentCard.id,
          confidence: level
        });
      } catch (e) {
        console.error('Failed to save confidence:', e);
      }
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsRevealed(false);
      setSelectedConfidence(null);
    }
  };

  const handleNextCard = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
      setSelectedConfidence(null);
    } else {
      setSessionCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
        <p className="text-slate-500 text-xs font-medium">Loading flashcards...</p>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 max-w-md mx-auto">
        <div className="text-3xl">🎴</div>
        <h4 className="text-slate-900 font-extrabold text-lg">No flashcards available</h4>
        <p className="text-slate-500 text-xs">No flashcards found for this preparation kit.</p>
      </div>
    );
  }

  const totalCards = cards.length;
  const confidentCount = cards.filter(c => (c.confidence || 0) >= 4).length;
  const needReviewCount = cards.filter(c => !c.confidence || c.confidence <= 3).length;
  const overallConfidencePct = totalCards > 0
    ? Math.round((cards.reduce((acc, c) => acc + (c.confidence || 0), 0) / (totalCards * 5)) * 100)
    : 0;

  const currentCard = cards[currentIndex];

  const cleanFrontText = (text) => {
    if (!text) return '';
    return text.replace(/^(Q\d+\s*\([^)]+\):\s*)+/gi, '').trim();
  };

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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* SECTION 1: STAT CARDS & WEAK CARDS BUTTON */}
      {!sessionCompleted && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 3 Stat Cards */}
            <div className="grid grid-cols-3 gap-3 flex-1 min-w-[280px]">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div className="text-lg font-black text-slate-900">{totalCards}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">TOTAL CARDS</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <div className="text-lg font-black text-emerald-600">{confidentCount}</div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase">CONFIDENT</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <div className="text-lg font-black text-amber-600">{needReviewCount}</div>
                <div className="text-[10px] font-bold text-amber-800 uppercase">NEED REVIEW</div>
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
              <span>Overall confidence</span>
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

      {sessionCompleted ? (
        /* SESSION COMPLETE STATE */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Trophy className="w-8 h-8 text-indigo-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">🎉 Practice Session Complete</h2>
            <div className="text-xs font-bold text-slate-600">
              {totalCards} / {totalCards} Cards Completed
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSessionCompleted(false);
                setCurrentIndex(0);
                setIsRevealed(false);
              }}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
            >
              Practice Again
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE FLASHCARD CONTAINER */
        <div className="space-y-6">
          {/* Main Flashcard Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 relative min-h-[300px] flex flex-col justify-between">
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

              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest text-center">
                FLASHCARD {currentIndex + 1} OF {totalCards}
              </span>

              <button
                onClick={handleNextCard}
                title="Next Flashcard"
                className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center justify-center shrink-0 hover:shadow-indigo-600/30"
              >
                <ChevronRight className="w-5 h-5 font-bold" />
              </button>
            </div>

            {/* Content Area */}
            {!isRevealed ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-6">
                <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-relaxed text-center max-w-xl">
                  Q{currentIndex + 1} ({seniority}): {cleanFrontText(currentCard?.front) || 'Question prompt'}
                </h3>

                <button
                  onClick={() => setIsRevealed(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-md flex items-center gap-2 hover:shadow-indigo-600/30"
                >
                  <Eye className="w-4 h-4" />
                  Reveal Answer
                </button>
              </div>
            ) : (
              <div className="flex-1 space-y-6 py-2 animate-fadeIn text-left">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Question
                  </span>
                  <p className="text-base md:text-lg font-extrabold text-slate-900 leading-relaxed">
                    Q{currentIndex + 1} ({seniority}): {cleanFrontText(currentCard?.front)}
                  </p>
                </div>

                <div className="border-b border-slate-200 my-4" />

                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                    Answer
                  </span>
                  <p className="text-xs md:text-sm font-semibold text-slate-700 leading-relaxed bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 whitespace-pre-line">
                    {currentCard?.back || 'Answer explanation unavailable.'}
                  </p>
                </div>


              </div>
            )}
          </div>

          {/* Progress Indicator Bar */}
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

          {/* Confidence Rating Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                AFTER REVEALING THE ANSWER:
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                How confident are you?
              </h4>
            </div>

            {/* 5 Rating Emoji Buttons */}
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
    </div>
  );
}
