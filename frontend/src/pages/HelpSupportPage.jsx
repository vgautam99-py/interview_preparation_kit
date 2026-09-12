import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { HelpCircle, Search, ChevronDown, ChevronUp, Sparkles, ShieldCheck, Mail, MessageSquare } from 'lucide-react';

const faqs = [
  {
    q: 'What is ViperAI and how does the AI Prep Engine work?',
    a: 'ViperAI is an end-to-end AI Interview Preparation Platform for all roles and industries. It extracts role requirements from job descriptions and company URLs, runs a 100% deterministic coverage check, allocates integer-minute daily study schedules, and generates flashcard practice decks.'
  },
  {
    q: 'How does the 100% Must-Have Requirement Coverage work?',
    a: 'Code deterministically extracts must-have requirement IDs (REQ-1, REQ-2, etc.). If any must-have requirement is unlinked after initial question generation, a targeted 2nd pass AI generation is executed until all must-have requirements are covered.'
  },
  {
    q: 'What is Builder State Preservation?',
    a: 'When you edit a question prompt, pin an item, or create a manual question, its state changes to "edited", "pinned", or "manual". When you regenerate a category or section, ViperAI guarantees that your edited and pinned items are preserved and never overwritten.'
  },
  {
    q: 'What are the Kit limits for Free, Pro, and Ultra plans?',
    a: 'Free Starter plan allows up to 10 Prep Kits. Pro Level (₹299) allows up to 25 Prep Kits. Ultra Level (₹499) allows up to 50 Prep Kits with priority AI execution.'
  },
  {
    q: 'How do the Red, Yellow, and Green readiness checkmarks work?',
    a: 'On the Kits page, each question set card features Red, Yellow, and Green readiness checkmark circles. Clicking a circle sets your preparedness rating (Red = Struggling, Yellow = Moderate, Green = Prepared) and updates your dashboard analytics charts.'
  },
  {
    q: 'How do the Beginner, Intermediate, and Fully flashcard boxes work?',
    a: 'On the Flashcards page, each flashcard card displays 3 level boxes: Beginner (Red), Intermediate (Yellow), and Fully (Green). Selecting a box displays a checkmark icon and updates your card understanding level in the database.'
  }
];

export default function HelpSupportPage() {
  const [openIdx, setOpenIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(searchTerm.toLowerCase()) || f.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 ml-0 transition-all duration-300">
        <Navbar title="Help & Support — FAQs" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-8">
          {/* Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">ViperAI Support & FAQ Center</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Find answers about AI extraction, coverage checks, schedule allocation, plan limits, and flashcards.
            </p>

            <div className="relative max-w-md mx-auto pt-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-5" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 font-medium"
              />
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-slate-900 hover:text-indigo-600 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="font-extrabold text-white text-sm">Still have questions?</h3>
              <p className="text-xs text-indigo-100">Our support team is available 24/7 to assist you.</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="mailto:support@viperai.com" className="px-4 py-2.5 bg-white hover:bg-slate-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md">
                <Mail className="w-4 h-4 text-indigo-600" /> Email Support
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

