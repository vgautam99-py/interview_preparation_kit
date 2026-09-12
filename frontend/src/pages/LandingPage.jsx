import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { handleRazorpayCheckout } from '../lib/razorpay';
import api from '../lib/api';
import { plansData } from '../data/plans';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Layers,
  BookOpen,
  Calendar,
  CreditCard,
  Star,
  Users,
  Search,
  Globe,
  Cpu,
  Repeat,
  Check,
  Github,
  Twitter,
  Linkedin,
  Mail,
  HelpCircle,
  Award,
  ChevronDown,
  Building2,
  Briefcase,
  PhoneCall,
  Menu,
  X
} from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Jenkins',
    role: 'Senior Project Manager',
    company: 'Hired at Deloitte',
    avatar: 'S',
    color: 'bg-indigo-600',
    stars: 5,
    quote: 'ViperAI helped me extract complex logistics requirements and built a tailored 3-day schedule that got me the offer!'
  },
  {
    name: 'Alex Rivera',
    role: 'Financial Analyst',
    company: 'Hired at Goldman Sachs',
    avatar: 'A',
    color: 'bg-emerald-600',
    stars: 5,
    quote: 'The 100% requirement coverage check ensured I did not miss a single core requirement before my final interview round.'
  },
  {
    name: 'Priya Sharma',
    role: 'Full-Stack Developer',
    company: 'Hired at Meta',
    avatar: 'P',
    color: 'bg-amber-600',
    stars: 5,
    quote: 'Least-confident flashcard practice helped me drill complex system architecture concepts right before my final loop.'
  },
  {
    name: 'Michael Chen',
    role: 'Healthcare Administrator',
    company: 'Hired at Mayo Clinic',
    avatar: 'M',
    color: 'bg-purple-600',
    stars: 5,
    quote: 'I used ViperAI for a senior medical operations position. It generated scenario-based questions that matched the actual interview perfectly!'
  },
  {
    name: 'David Kim',
    role: 'Marketing Director',
    company: 'Hired at Nike',
    avatar: 'D',
    color: 'bg-rose-600',
    stars: 5,
    quote: 'The day-by-day integer prep schedule kept my 7-day preparation perfectly structured across brand strategy topics.'
  }
];

const faqsList = [
  {
    q: 'How does ViperAI support any job, field, or industry?',
    a: 'ViperAI uses LLM-powered semantic understanding combined with a deterministic coverage engine. You can input job descriptions for Tech, Finance, Healthcare, Marketing, Sales, Education, Operations, Legal, HR, or Executive roles.'
  },
  {
    q: 'What is included in the subscription preparation plans?',
    a: 'The Free plan offers up to 10 Prep Kits. The ₹199 Mid plan offers up to 25 Prep Kits with analytics. The ₹499 Pro plan provides up to 50 Prep Kits with 3x regeneration. The ₹999 Ultra Pro plan supports up to 100 Prep Kits for heavy prep.'
  },
  {
    q: 'How does the 100% Must-Have Requirement Coverage work?',
    a: 'Our engine extracts key requirement tags from the job description and verifies every requirement is covered by relevant interview questions. If any requirement is missing, a 2nd pass AI generation fills the gap.'
  },
  {
    q: 'Are my edited questions saved when I regenerate sections?',
    a: 'Yes! Builder State Preservation ensures that any question marked as pinned or edited by you remains unchanged while un-pinned generated content is refreshed.'
  }
];

export default function LandingPage() {
  const { user, setUser, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [paymentMsg, setPaymentMsg] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectPlanDirect = async (planId, planName) => {
    if (!user) {
      toast('Please register or log in to select a plan', { icon: '🔑' });
      navigate('/register');
      return;
    }
    setLoadingPlan(planId);
    const loadId = toast.loading(`Switching subscription to ${planName}...`);
    try {
      const res = await api.post('/payments/switch-plan', { plan: planId });
      if (res.data.user && setUser) {
        setUser(res.data.user);
      }
      await refreshUserData();
      toast.success(`Plan updated to ${planName}!`, { id: loadId });
      setPaymentMsg(`Active plan changed to ${planName} successfully!`);
    } catch (err) {
      toast.error('Failed to switch plan: ' + (err.response?.data?.error || err.message), { id: loadId });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRazorpayUpgrade = (planId, planName, amountNum) => {
    if (!user) {
      toast('Please register or log in to select a plan', { icon: '🔑' });
      navigate('/register');
      return;
    }

    if (amountNum === 0) {
      handleSelectPlanDirect(planId, planName);
      return;
    }

    setPaymentMsg(`Opening Razorpay Payment Modal for ${planName}...`);
    handleRazorpayCheckout({
      plan: planName,
      amount: amountNum,
      userDetails: { name: user?.name, email: user?.email },
      onSuccess: async (data) => {
        toast.success(`Payment verified! Upgraded to ${planName}.`);
        setPaymentMsg(`Payment successful! Upgraded to ${planName}.`);
        if (data?.user && setUser) {
          setUser(data.user);
        }
        await refreshUserData();
      },
      onError: (err) => {
        toast.error('Payment error: ' + err);
        setPaymentMsg('Payment error: ' + err);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-x-hidden w-full max-w-full box-border relative">
      {/* Header Navigation - Matching Image 1 (fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white shadow-md) */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-md h-16 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full box-border">
        {/* Left: Brand Logo */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white shadow-md text-base sm:text-lg flex-shrink-0">
            V
          </div>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">ViperAI</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <a href="#about" className="hover:text-indigo-600 transition">About Us</a>
          <a href="#features" className="hover:text-indigo-600 transition">Features</a>
          <a href="#plans" className="hover:text-indigo-600 transition">Pricing</a>
          <a href="#faqs" className="hover:text-indigo-600 transition">FAQs</a>
          <a href="#contact" className="hover:text-indigo-600 transition">Contact Us</a>
        </div>

        {/* Right User Bar for Desktop */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <Link
              to="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md transition text-xs font-bold flex items-center gap-1.5"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center space-x-3 text-xs font-bold">
              <Link to="/login" className="text-slate-600 hover:text-slate-900 transition px-3 py-2">
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md transition text-xs font-bold"
              >
                <span>Get Started Free</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Icon Button Only (Matching Image 1) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 flex items-center justify-center"
          title="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Spacer for Fixed Header */}
      <div className="h-16 sm:h-20"></div>

      {/* Mobile Drawer Menu (Clean, compact top-anchored overlay with zero empty gap) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-0 z-50 bg-white border-b border-slate-200 shadow-2xl p-6 animate-fadeIn font-sans max-h-screen overflow-y-auto">
          {/* Top Header Row Inside Drawer */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md">
                V
              </div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">ViperAI</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl transition"
              title="Close Menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Item List */}
          <nav className="space-y-1 text-sm font-semibold text-slate-700">
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-slate-100 hover:text-indigo-600 transition"
            >
              Home
            </a>

            <a
              href="#plans"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-slate-100 hover:text-indigo-600 transition"
            >
              Pricing & Plans
            </a>

            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-slate-100 hover:text-indigo-600 transition"
            >
              About Us
            </a>

            <a
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-slate-100 hover:text-indigo-600 transition"
            >
              FAQs
            </a>

            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 hover:text-indigo-600 transition"
            >
              Contact Us
            </a>
          </nav>

          {/* Bottom Action Area (Compactly aligned directly below links with zero gap) */}
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-2.5">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-md transition text-center text-sm flex items-center justify-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-md transition text-center text-sm block"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl transition text-center text-xs block"
                >
                  Create Free Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section (Matching Image 1 Typography, Background Grid & Accent Line) */}
      <section className="py-12 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative w-full overflow-hidden box-border bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:2rem_2rem]">
        <div className="text-center space-y-6 sm:space-y-9">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full border border-indigo-200 shadow-sm max-w-[92vw] mx-auto text-center whitespace-normal leading-relaxed">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>AI Prep Kits for Any Industry, Role, or Job</span>
          </div>

          {/* Headline: Generous line-height and vertical spacing between lines */}
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-snug sm:leading-tight">
              Ace Any Job Interview with
            </h1>
            <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-indigo-600 tracking-tight leading-snug sm:leading-tight pt-1">
              ViperAI Prep Kits
            </div>
            <div className="text-xl sm:text-3xl md:text-4xl font-extrabold text-sky-600 tracking-tight leading-snug sm:leading-normal pt-2">
              Structured AI Questions & Schedules
            </div>

            {/* Horizontal Blue Gradient Accent Bar Underneath Title */}
            <div className="w-full max-w-2xl h-1.5 bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-800 rounded-full mx-auto my-6 sm:my-8 shadow-sm" />
          </div>

          <p className="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto leading-loose sm:leading-relaxed px-4 py-2">
            Whether you are in Tech, Healthcare, Finance, Marketing, Sales, Education, Legal, or Management — turn any Job Description into structured questions, flashcards, and prep schedules.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-6 max-w-xs sm:max-w-none mx-auto">
            <Link
              to={user ? "/create" : "/register"}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-9 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2.5 text-xs sm:text-sm transition transform hover:scale-[1.02]"
            >
              <span>Create Your Prep Kit Free</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION (#about) */}
      <section id="about" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200 w-full">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">About ViperAI</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">Empowering Professionals Across Every Field</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              ViperAI automates requirement extraction and candidate preparedness tracking to ensure zero blind spots in your interview prep.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">1</span>
              <h3 className="font-bold text-slate-900 text-base">Input Ingestion</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste any Job Description + company website link + choose prep timeline (1-30 days).
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center shadow-md">2</span>
              <h3 className="font-bold text-slate-900 text-base">Crawl & Extract</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Crawl company context and extract structured role requirements with requirement IDs.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-bold text-lg flex items-center justify-center shadow-md">3</span>
              <h3 className="font-bold text-slate-900 text-base">100% Coverage Check</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Engine verifies all must-have requirements are mapped to questions, triggering 2nd-pass AI if needed.
              </p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
              <span className="w-10 h-10 rounded-2xl bg-purple-600 text-white font-bold text-lg flex items-center justify-center shadow-md">4</span>
              <h3 className="font-bold text-slate-900 text-base">Schedule & Practice</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Partition questions across days with integer minutes and drill flashcards with confidence tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION (#features) */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200 w-full">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Platform Features</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">Engineered For High-Stakes Prep</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Strict code vs. AI boundaries ensure deterministic precision and state preservation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">100% Requirement Coverage</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Code deterministically calculates uncovered requirement IDs and triggers a targeted 2nd pass AI generation until 100% of must-haves are covered.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Integer-Minute Schedules</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Questions are partitioned sequentially across N days with integer minute calculations based on question difficulty ratings.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Repeat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Builder State Preservation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Items marked as pinned or edited by the candidate survive section regeneration and are never overwritten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS SECTION (#plans) */}
      <section id="plans" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200 w-full">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Subscription Plans & Kit Limits
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">Simple, Transparent Preparation Pricing</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Choose the right plan to increase your AI prep kit limit. Instant upgrades and Razorpay checkout supported.
            </p>
          </div>

          {paymentMsg && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold text-center">
              {paymentMsg}
            </div>
          )}

          {/* 4 Subscription Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {plansData.map((plan) => {
              const currentPlan = (user?.subscription || 'free').toLowerCase();
              const isActive = Boolean(user) && (currentPlan === plan.id || (plan.id === 'ultra pro' && (currentPlan === 'ultra' || currentPlan === 'ultra pro')));
              const amountVal = Number(plan.price.replace('₹', ''));

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border space-y-6 flex flex-col justify-between relative shadow-sm transition hover:shadow-md ${plan.borderStyle}`}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      {plan.name}
                    </span>
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${plan.badgeStyle}`}>
                      {plan.badge}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="text-3xl font-extrabold text-slate-900">
                      {plan.price} <span className="text-xs font-normal text-slate-400">{plan.period}</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        ⚡ {plan.kits} Preparation Kits
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {plan.description}
                    </p>

                    <ul className="space-y-2.5 pt-2 text-xs text-slate-700 font-medium">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    {isActive ? (
                      <div className="w-full bg-emerald-50 text-emerald-700 font-bold py-3.5 rounded-2xl text-xs sm:text-sm text-center border border-emerald-200 flex items-center justify-center gap-1.5 shadow-xs">
                        <Check className="w-4 h-4 font-bold" /> Active Subscribed Plan
                      </div>
                    ) : !user ? (
                      <button
                        onClick={() => navigate('/register')}
                        className={`w-full font-extrabold px-3 py-3.5 rounded-2xl transition text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md ${plan.buttonColor}`}
                      >
                        <span>Select {plan.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ) : amountVal > 0 ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleRazorpayUpgrade(plan.id, plan.name, amountVal)}
                          className={`w-full font-extrabold px-4 py-3.5 rounded-2xl transition text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md ${plan.buttonColor}`}
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span className="truncate">Subscribe Plan ({plan.price})</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        <button
                          onClick={() => handleSelectPlanDirect(plan.id, plan.name)}
                          disabled={loadingPlan === plan.id}
                          className="w-full text-slate-500 hover:text-slate-800 font-bold py-1.5 text-[11px] transition text-center"
                        >
                          {loadingPlan === plan.id ? 'Switching...' : `Instant Switch →`}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlanDirect(plan.id, plan.name)}
                        disabled={loadingPlan === plan.id}
                        className={`w-full font-extrabold px-3 py-3.5 rounded-2xl transition text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md ${plan.buttonColor}`}
                      >
                        {loadingPlan === plan.id ? 'Switching...' : `Select ${plan.name}`}
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQS SECTION (#faqs) */}
      <section id="faqs" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200 w-full">
        <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Frequently Asked Questions</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">Got Questions? We Have Answers</h2>
          </div>

          <div className="space-y-4">
            {faqsList.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-extrabold text-slate-900 text-sm flex justify-between items-center gap-4 hover:bg-slate-50/80 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-indigo-600 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER & CONTACT SECTION (#contact) */}
      <footer id="contact" className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-extrabold text-lg">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs">V</div>
              <span>ViperAI</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Full-Stack AI Interview Preparation Platform for all roles, positions, and industries.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-white uppercase text-xs tracking-wider">Quick Links</h4>
            <ul className="space-y-2 font-medium">
              <li><a href="#about" className="hover:text-white transition">About Platform</a></li>
              <li><a href="#features" className="hover:text-white transition">Core Features</a></li>
              <li><a href="#plans" className="hover:text-white transition">Subscription Plans</a></li>
              <li><a href="#faqs" className="hover:text-white transition">FAQs</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-white uppercase text-xs tracking-wider">Support & Help</h4>
            <ul className="space-y-2 font-medium">
              <li><Link to="/help" className="hover:text-white transition">Help Desk & FAQs</Link></li>
              <li><Link to="/plans" className="hover:text-white transition">Upgrade Plan</Link></li>
              <li><a href="mailto:support@viperai.com" className="hover:text-white transition">support@viperai.com</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-white uppercase text-xs tracking-wider">Contact Us</h4>
            <p className="text-slate-400 leading-relaxed font-medium">
              ViperAI Technologies Inc.<br />
              Email: support@viperai.com<br />
              Location: San Francisco, CA & Remote
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} ViperAI. All rights reserved.</p>
          <div className="flex space-x-6 text-slate-400">
            <a href="#about" className="hover:text-white transition">Privacy Policy</a>
            <a href="#about" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
