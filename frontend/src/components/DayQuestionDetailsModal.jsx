import React from 'react';
import { X, Clock, Edit3, CheckCircle2, ArrowRight, Sparkles, BookOpen, Layers } from 'lucide-react';

export default function DayQuestionDetailsModal({
  isOpen,
  onClose,
  dayItem,
  questions = [],
  seniority = 'Senior',
  isCompleted = false,
  onToggleCompleted,
  onEditQuestion,
  onStartPractice
}) {
  if (!isOpen || !dayItem) return null;

  const dayNum = dayItem.day || 1;
  const focusTitle = dayItem.focus || `Focused Module Practice — Day ${dayNum}`;
  const minutes = dayItem.minutes || 60;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                DAY {dayNum} SCHEDULE DETAILS
              </span>
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                {minutes} Mins
              </span>
              <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                {questions.length} Questions
              </span>
              {isCompleted && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Completed
                </span>
              )}
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 pt-1 leading-snug">
              {focusTitle}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Daily study module tailored for {seniority} level interview preparation.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition flex-shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY: QUESTION LIST */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Scheduled Questions for Day {dayNum} ({questions.length})
            </h4>
            <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">
              Level: {seniority}
            </span>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              No questions assigned to Day {dayNum}.
            </div>
          ) : (
            <div className="space-y-3.5">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id || qIdx}
                  className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          {q.id || `Q${qIdx + 1}`}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                          {q.category || 'Technical'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Difficulty: {q.difficulty}/3
                        </span>
                      </div>

                      <p className="text-sm font-extrabold text-slate-900 leading-snug pt-1">
                        {q.prompt}
                      </p>
                    </div>

                    {/* EDIT QUESTION BUTTON */}
                    {onEditQuestion && (
                      <button
                        onClick={() => onEditQuestion(q)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition flex-shrink-0"
                        title="Edit Question & Answer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* DETAILED ANSWER OUTLINE */}
                  {q.answer_outline && (
                    <div className="pt-2.5 border-t border-slate-200/70 text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100 shadow-2xs">
                      <span className="font-sans font-bold text-slate-600 text-[10px] uppercase block mb-1 tracking-wider">
                        Detailed Answer Outline:
                      </span>
                      {q.answer_outline}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto flex items-center gap-2">
            {onToggleCompleted && (
              <button
                onClick={() => onToggleCompleted(dayNum)}
                className={`w-full sm:w-auto text-xs font-bold px-4 py-2.5 rounded-xl border transition flex items-center justify-center gap-2 ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`} />
                {isCompleted ? 'Completed ✓ (Click to toggle)' : 'Mark Day Completed'}
              </button>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              Close
            </button>

            {onStartPractice && (
              <button
                onClick={() => {
                  onClose();
                  onStartPractice();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-2"
              >
                <span>Practice Flashcards</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
