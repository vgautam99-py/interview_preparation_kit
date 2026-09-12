import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/api';
import {
  Sparkles,
  Globe,
  Calendar,
  FileText,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  ArrowLeft,
  Check,
  Circle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateKitPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [seniorityLevel, setSeniorityLevel] = useState('Senior');
  const [daysAvailable, setDaysAvailable] = useState(5);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generation Screen & Polling State
  const [kitId, setKitId] = useState(null);
  const [generationStage, setGenerationStage] = useState(''); // pending | researching | generating | checking | finalizing | completed | failed
  const [kitMeta, setKitMeta] = useState({ company: '', role: '' });

  const navigate = useNavigate();

  // Status Polling Effect
  useEffect(() => {
    let interval = null;
    if (kitId && loading) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/kits/${kitId}/status`);
          const status = res.data.status;
          setGenerationStage(status);

          if (status === 'completed') {
            clearInterval(interval);
            setLoading(false);
            toast.success('Interview Prep Kit generated successfully!');
            navigate(`/kits/${kitId}`);
          } else if (status === 'failed') {
            clearInterval(interval);
            setLoading(false);
            const errMsg = res.data.errorMessage || "We couldn't retrieve enough information from the company website.";
            setError(errMsg);
          }
        } catch (e) {
          console.error('Status check error:', e);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [kitId, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (jobDescription.trim().length < 50) {
      const msg = 'Job description must be at least 50 characters long.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setGenerationStage('pending');

    const displayCompany = companyName || 'Target Company';
    const displayRole = roleTitle || 'Interview Prep Kit';

    setKitMeta({
      company: displayCompany,
      role: `${displayRole} (${seniorityLevel})`
    });

    try {
      const res = await api.post('/kits', {
        jobDescription,
        companyUrl,
        companyName,
        roleTitle,
        seniorityLevel,
        daysAvailable: Number(daysAvailable)
      });

      setKitId(res.data.kitId);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || 'Failed to initialize kit generation.';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  // Helper for checklist items in Generation Screen
  const getStepStatus = (stepStage) => {
    const stagesOrder = ['pending', 'researching', 'generating', 'checking', 'finalizing', 'completed'];
    const currentIndex = stagesOrder.indexOf(generationStage);
    const stepIndex = stagesOrder.indexOf(stepStage);

    if (currentIndex > stepIndex || generationStage === 'completed') {
      return 'done';
    } else if (currentIndex === stepIndex) {
      return 'active';
    }
    return 'pending';
  };

  // Calculate progress percentage for generation bar
  const getProgressPercentage = () => {
    switch (generationStage) {
      case 'pending': return 15;
      case 'researching': return 35;
      case 'generating': return 65;
      case 'checking': return 80;
      case 'finalizing': return 92;
      case 'completed': return 100;
      default: return 10;
    }
  };

  // Sample quick input filler
  const handleFillSample = () => {
    setCompanyName('ABC Technologies');
    setRoleTitle('MERN Full Stack Developer');
    setSeniorityLevel('Senior');
    setJobDescription(`Senior MERN Stack Developer at ABC Technologies
Responsibilities:
- Build robust and scalable web applications using React, Node.js, Express, and MongoDB
- Design RESTful APIs and integrate third-party services
- Optimize frontend performance and state management
- Write unit tests and maintain high code quality standards

Requirements:
- 4+ years of professional full-stack development experience
- Deep expertise in JavaScript, TypeScript, React Hooks, Node.js, and MongoDB
- Experience with Git, CI/CD, and Docker is a plus`);
    setCompanyUrl('https://example.com');
    setDaysAvailable(5);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 ml-0 transition-all duration-300">
        <Navbar title="Create Interview Kit" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto space-y-4 sm:space-y-6 box-border">
          {/* HEADER SECTION */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Interview Kit</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Turn a job description into a personalized interview preparation plan.
            </p>
          </div>

          {/* STATE 1: ERROR STATE VIEW */}
          {error && !loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6 animate-fadeIn">
              <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-xl font-extrabold text-slate-900">Couldn't complete the kit</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {error}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setError('');
                    setKitId(null);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>

                <button
                  onClick={() => navigate('/kits')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>
            </div>
          ) : null}

          {/* CREATE KIT FORM VIEW */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl border border-indigo-200 transition"
                >
                  + Fill Sample Input
                </button>
              </div>

              {/* COMPANY NAME & ROLE TITLE ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. ABC Technologies"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. MERN Full Stack Developer"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* SENIORITY LEVEL & DAYS UNTIL INTERVIEW ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Seniority Level
                  </label>
                  <select
                    value={seniorityLevel}
                    onChange={(e) => setSeniorityLevel(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="Junior">Junior (0-2 years)</option>
                    <option value="Mid-Level">Mid-Level (2-5 years)</option>
                    <option value="Senior">Senior (5+ years)</option>
                    <option value="Lead">Lead / Principal</option>
                    <option value="Executive">Executive / Director</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Days Until Interview
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={daysAvailable}
                      onChange={(e) => setDaysAvailable(Math.max(1, Math.min(30, Number(e.target.value))))}
                      className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-center"
                    />
                    <span className="text-xs font-bold text-slate-600">days</span>
                  </div>
                </div>
              </div>

              {/* FIELD: COMPANY WEBSITE */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Company Website
                </label>
                <input
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* FIELD: JOB DESCRIPTION */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Job Description
                </label>
                <textarea
                  required
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the complete job description here..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                <div className="text-right text-xs font-mono text-slate-400 font-semibold">
                  {jobDescription.length} characters
                </div>
              </div>

              {/* SUMMARY BOX: YOUR KIT WILL INCLUDE */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Your kit will include
                </h4>

                <div className="space-y-2 text-xs font-semibold text-slate-700 pl-1">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 font-bold" />
                    <span>Company brief</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 font-bold" />
                    <span>Role & requirements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 font-bold" />
                    <span>Interview questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 font-bold" />
                    <span>Flashcards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600 font-bold" />
                    <span>Day-by-day study schedule</span>
                  </div>
                </div>
              </div>

              {/* GENERATE BUTTON WITH LEFT-SIDE ROTATING SPINNER */}
              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md hover:shadow-indigo-600/30 transition flex items-center justify-center gap-2.5 mx-auto"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white flex-shrink-0" />
                      <span>Generating Interview Kit...</span>
                    </>
                  ) : (
                    <>
                      <span>✦ Generate Interview Kit →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
        </main>
      </div>
    </div>
  );
}

