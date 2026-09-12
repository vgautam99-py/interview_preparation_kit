import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Registration successful! Please log in with your credentials.');
      navigate('/login', { state: { message: 'Registration successful! Please log in with your credentials.' } });
    } catch (err) {
      const rawErr = err.response?.data?.error || err.response?.data?.message || err.message;
      const errMsg = typeof rawErr === 'string' ? rawErr : (typeof rawErr === 'object' ? (rawErr.message || JSON.stringify(rawErr)) : 'Registration failed.');
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-7 space-y-6 relative border border-slate-200">

        {/* Header with Inside Circular Back Button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <Link
            to="/"
            title="Back to ViperAI Landing Page"
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-slate-200 shadow-sm flex items-center justify-center transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
              V
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">ViperAI</span>
          </div>

          <div className="w-9 h-9"></div> {/* spacer */}
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900">Create Account</h2>
          <p className="text-[11px] text-slate-500">Sign up for your AI interview preparation platform</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-xs p-3 rounded-xl border border-rose-200 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 h-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs outline-none font-medium"
                placeholder="Jane Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 h-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs outline-none font-medium"
                placeholder="jane@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 h-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs outline-none font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-4 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold h-12 rounded-xl transition shadow-lg shadow-indigo-600/30 text-xs tracking-wide"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Already registered? </span>
          <Link to="/login" className="text-indigo-600 font-extrabold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
