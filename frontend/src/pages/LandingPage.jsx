import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { handleRazorpayCheckout } from '../lib/razorpay';
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
    q: 'What is included in the ₹299 Pro plan vs ₹499 Ultra plan?',
    a: 'The ₹299 Pro plan gives you up to 25 AI Prep Kits, full analytics dashboard, and flashcard practice loops. The ₹499 Ultra plan offers up to 50 AI Prep Kits, priority AI execution, and lifetime access.'
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
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUpgrade = (planName, amount) => {
    if (!user) {
      toast('Please register or log in to select a plan', { icon: '🔑' });
      navigate('/register');
      return;
    }

    toast.loading(`Opening Razorpay Checkout for ${planName}...`, { id: 'razorpay' });
    setPaymentMsg(`Opening Razorpay Payment Modal for ${planName}...`);
    handleRazorpayCheckout({
      plan: planName,
      amount,
      onSuccess: async (data) => {
        toast.success(`Payment verified! Upgraded to ${planName}.`, { id: 'razorpay' });
        setPaymentMsg(`Payment successful! Upgraded to ${planName}.`);
        if (data?.user && setUser) {
          setUser(data.user);
        }
        await refreshUserData();
        setTimeout(() => navigate('/dashboard'), 1500);
      },
      onError: (err) => {
        toast.error('Payment error: ' + err, { id: 'razorpay' });
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
      <section className="py-10 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 relative w-full overflow-hidden box-border bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:2rem_2rem]">
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full border border-indigo-200 shadow-sm max-w-[92vw] mx-auto text-center whitespace-normal leading-tight">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>AI Prep Kits for Any Industry, Role, or Job</span>
          </div>

          {/* Headline Matching Image 1: Bold Dark Top Title + Vibrant Blue Accent Title */}
          <div className="max-w-4xl mx-auto space-y-2">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Ace Any Job Interview with
            </h1>
            <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-indigo-600 tracking-tight leading-tight">
              ViperAI Prep Kits
            </div>
            <div className="text-xl sm:text-3xl md:text-4xl font-extrabold text-sky-600 tracking-tight pt-1">
              Structured AI Questions & Schedules
            </div>

            {/* Horizontal Blue Gradient Accent Bar Underneath Title (Matching Image 1 Divider Line) */}
            <div className="w-full max-w-2xl h-1.5 bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-800 rounded-full mx-auto my-4 sm:my-6 shadow-sm" />
          </div>

          <p className="text-slate-600 text-xs sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2">
            Whether you are in Tech, Healthcare, Finance, Marketing, Sales, Education, Legal, or Management — turn any Job Description into structured questions, flashcards, and prep schedules.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 pt-4 max-w-xs sm:max-w-none mx-auto">
            <Link
              to={user ? "/create" : "/register"}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition transform hover:scale-[1.02]"
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
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Subscription Tiers</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Choose the plan that fits your interview volume. Instant Razorpay upgrade supported.
            </p>
          </div>

          {paymentMsg && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold text-center">
              {paymentMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Plan 1: Free */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between hover:border-slate-300 transition">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-3 py-1 rounded-full uppercase">Starter</span>
                  <span className="text-xs font-bold text-slate-400">FREE</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Free Starter</h3>
                <div className="text-3xl font-black text-slate-900">₹0</div>
                <p className="text-xs text-slate-500">Up to 10 AI Prep Kits with standard features.</p>
                <ul className="space-y-2.5 text-xs font-semibold text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Max 10 Prep Kits</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Web Crawling & Research</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 100% Requirement Coverage</li>
                </ul>
              </div>
              <button
                onClick={() => handleUpgrade('Free Plan', 0)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition"
              >
                Current Plan / Free
              </button>
            </div>

            {/* Plan 2: Pro */}
            <div className="bg-white rounded-3xl border-2 border-indigo-600 p-6 sm:p-8 shadow-xl space-y-6 flex flex-col justify-between relative">
              <span className="absolute -top-3.5 right-6 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                Popular
              </span>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase">Pro Level</span>
                  <span className="text-xs font-bold text-indigo-600 font-mono">25 Kits</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Pro Prep</h3>
                <div className="text-3xl font-black text-indigo-600">₹299 <span className="text-xs text-slate-400 font-normal">/ lifetime</span></div>
                <p className="text-xs text-slate-500">Up to 25 AI Prep Kits for active candidates.</p>
                <ul className="space-y-2.5 text-xs font-semibold text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600" /> Max 25 Prep Kits</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600" /> Full Analytics Dashboard</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600" /> Flashcard Practice Loops</li>
                </ul>
              </div>
              <button
                onClick={() => handleUpgrade('Pro Plan', 299)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-indigo-600/30"
              >
                Upgrade to Pro (₹299)
              </button>
            </div>

            {/* Plan 3: Ultra */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between hover:border-slate-300 transition">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full uppercase">VIP Tier</span>
                  <span className="text-xs font-bold text-purple-600 font-mono">50 Kits</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">Ultra VIP</h3>
                <div className="text-3xl font-black text-slate-900">₹499 <span className="text-xs text-slate-400 font-normal">/ lifetime</span></div>
                <p className="text-xs text-slate-500">Up to 50 AI Prep Kits for high-volume prep.</p>
                <ul className="space-y-2.5 text-xs font-semibold text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600" /> Max 50 Prep Kits</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600" /> Priority AI Execution</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600" /> Builder State Preservation</li>
                </ul>
              </div>
              <button
                onClick={() => handleUpgrade('Ultra Plan', 499)}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
              >
                Upgrade to Ultra (₹499)
              </button>
            </div>
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
