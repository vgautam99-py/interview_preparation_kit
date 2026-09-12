import React, { useState, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { User, Mail, ShieldCheck, CreditCard, LogOut, RefreshCw, Plus, Lock, Key, Calendar, Check, X, ArrowRight, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const defaultAvatars = [
  { id: 'hero_boy', label: '⚡ Hero Boy', icon: '👦', bg: 'bg-indigo-600' },
  { id: 'star_girl', label: '🌟 Star Girl', icon: '👧', bg: 'bg-rose-500' },
  { id: 'cyber_cat', label: '🐱 Cyber Cat', icon: '🐱', bg: 'bg-amber-500' },
  { id: 'robo_ai', label: '🤖 Robo AI', icon: '🤖', bg: 'bg-sky-500' },
  { id: 'astronaut', label: '🚀 Astronaut', icon: '🚀', bg: 'bg-purple-600' },
  { id: 'ninja', label: '🥷 Ninja Dev', icon: '🥷', bg: 'bg-emerald-600' }
];

export default function ProfilePage() {
  const { user, setUser, logout, refreshUserData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Payment History States & Filters
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL | THIS_MONTH | LAST_MONTH | LAST_30_DAYS | LAST_90_DAYS
  const [showPaymentFilterDropdown, setShowPaymentFilterDropdown] = useState(false);
  const [expandedPayments, setExpandedPayments] = useState({});

  const togglePaymentExpand = (idx) => {
    setExpandedPayments(prev => ({ ...prev, [idx]: !prev[idx] }));
  };
  
  // Profile Editor Fields
  const [name, setName] = useState(user?.name && user.name !== 'Candidate' ? user.name : '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState(user?.gender || 'unspecified');
  const [dob, setDob] = useState(user?.dob || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'hero_boy');
  const [profileMsg, setProfileMsg] = useState('');

  // Sync state when user object updates
  React.useEffect(() => {
    if (user) {
      if (user.name && user.name !== 'Candidate') setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.gender) setGender(user.gender);
      if (user.dob) setDob(user.dob);
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  // Account Security Modals/Forms State
  const [activeSecurityModal, setActiveSecurityModal] = useState(null); // 'email' | 'password' | null
  const [newEmailInput, setNewEmailInput] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    const loadId = toast.loading('Saving profile details...');
    try {
      const res = await api.put('/auth/profile', {
        name,
        email,
        gender,
        dob,
        avatar
      });
      if (res.data.user) {
        setUser(res.data.user);
      }
      toast.success('Profile details saved successfully!', { id: loadId });
      setProfileMsg('Profile details saved successfully in application and database!');
    } catch (err) {
      const errMsg = 'Failed to update profile: ' + (err.response?.data?.error || err.message);
      toast.error(errMsg, { id: loadId });
      setProfileMsg(errMsg);
    }
  };

  const handleAvatarSelect = async (avatarId) => {
    setAvatar(avatarId);
    setProfileMsg('');
    try {
      const res = await api.put('/auth/profile', { avatar: avatarId });
      if (res.data.user) {
        setUser(res.data.user);
      }
      toast.success('Avatar updated successfully!');
      setProfileMsg('Avatar updated and saved as profile picture!');
    } catch (err) {
      toast.error('Failed to update avatar.');
      console.error('Failed to update avatar:', err);
    }
  };

  const handleEmailChangeSubmit = async (e) => {
    e.preventDefault();
    setSecurityMsg('');
    if (!newEmailInput || !newEmailInput.includes('@')) {
      toast.error('Please enter a valid email address.');
      setSecurityMsg('Please enter a valid email address.');
      return;
    }
    setSecurityLoading(true);
    const loadId = toast.loading('Updating email...');
    try {
      const res = await api.put('/auth/profile', { email: newEmailInput });
      if (res.data.user) {
        setUser(res.data.user);
        setEmail(res.data.user.email);
      }
      toast.success('Email address updated successfully!', { id: loadId });
      setSecurityMsg('Email address updated successfully!');
      setTimeout(() => {
        setActiveSecurityModal(null);
        setSecurityMsg('');
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Email update failed.';
      toast.error(errMsg, { id: loadId });
      setSecurityMsg(errMsg);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setSecurityMsg('');
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      setSecurityMsg('New password must be at least 6 characters.');
      return;
    }

    setSecurityLoading(true);
    const loadId = toast.loading('Updating password...');
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success(res.data.message || 'Password changed successfully!', { id: loadId });
      setSecurityMsg(res.data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        setActiveSecurityModal(null);
        setSecurityMsg('');
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Password change failed.';
      toast.error(errMsg, { id: loadId });
      setSecurityMsg(errMsg);
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        const loadId = toast.loading('Uploading profile picture...');
        try {
          const res = await api.put('/auth/profile', { profilePicture: base64Image });
          if (res.data.user) {
            setUser(res.data.user);
          }
          toast.success('Profile picture uploaded successfully!', { id: loadId });
          setProfileMsg('Profile picture uploaded successfully!');
        } catch (err) {
          toast.error('Failed to upload profile picture.', { id: loadId });
          console.error('Failed to update profile picture:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const userSub = (user?.subscription || 'free').toLowerCase();
  const subInfo = {
    free: { label: 'Free Plan (10 Kits)', badge: 'FREE', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    mid: { label: 'Mid Plan (25 Kits)', badge: 'Popular', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    pro: { label: 'Pro Plan (50 Kits)', badge: 'VIP', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    ultra: { label: 'Ultra Pro Plan (100 Kits)', badge: 'Commercial', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    'ultra pro': { label: 'Ultra Pro Plan (100 Kits)', badge: 'Commercial', color: 'bg-purple-50 text-purple-700 border-purple-200' }
  }[userSub] || { label: 'Free Plan (10 Kits)', badge: 'FREE', color: 'bg-slate-100 text-slate-700 border-slate-300' };

  const displayName = (user?.name && user.name !== 'Candidate') ? user.name : (user?.email ? user.email.split('@')[0] : 'User');
  const firstInitial = displayName.trim().charAt(0).toUpperCase();

  const selectedAvatarObj = defaultAvatars.find(a => a.id === avatar);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 ml-0 transition-all duration-300">
        <Navbar title="Profile & Account Settings" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* User Avatar & Overview Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex items-center justify-start gap-6">
            {/* Profile Avatar with '+' Upload Button */}
            <div className="relative group shrink-0">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                />
              ) : selectedAvatarObj ? (
                <div className={`w-20 h-20 rounded-2xl ${selectedAvatarObj.bg} text-white font-extrabold text-3xl flex items-center justify-center shadow-md`}>
                  {selectedAvatarObj.icon}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md shadow-indigo-600/30">
                  {firstInitial}
                </div>
              )}

              {/* '+' Upload Button Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload profile picture"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center border-2 border-white shadow-md transition transform hover:scale-110"
              >
                <Plus className="w-4 h-4 font-bold" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* User Details Stack: Name, then Email below name, then Plan detail below email */}
            <div className="space-y-1.5 min-w-0">
              {/* 1. Name on single line (no break) */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 whitespace-nowrap truncate">
                {displayName}
              </h2>

              {/* 2. Mail ID below name */}
              <p className="text-slate-500 text-xs flex items-center gap-1.5 font-medium truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user?.email}</span>
              </p>

              {/* 3. Plan detail below mail ID */}
              <div className="pt-0.5">
                <span className={`inline-flex items-center text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${subInfo.color}`}>
                  {subInfo.badge} • {subInfo.label}
                </span>
              </div>
            </div>
          </div>

          {profileMsg && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs p-4 rounded-2xl font-bold">
              {profileMsg}
            </div>
          )}

          {/* Cartoon Avatars Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Choose Cartoon Avatar (If not uploading custom picture)
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {defaultAvatars.map(av => (
                <button
                  key={av.id}
                  onClick={() => handleAvatarSelect(av.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center space-y-2 transition ${
                    avatar === av.id
                      ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${av.bg} text-white text-2xl flex items-center justify-center shadow-sm`}>
                    {av.icon}
                  </div>
                  <span className="text-[11px] text-slate-800 font-bold">{av.label}</span>
                  {avatar === av.id && <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Details Form & Account Security Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form 1: Personal Details */}
            <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Personal Details
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  title="Use Change Email button in Security section below"
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 outline-none font-medium cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="unspecified">Unspecified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
              >
                Save Details
              </button>
            </form>

            {/* Request 10: Account Security & Protection - Clean section with ONLY action buttons */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Security & Protection
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Manage your security credentials. Click the buttons below to change your account email or update your password.
                </p>
              </div>

              {/* Action Buttons for Email Change & Password Change */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSecurityModal('email');
                    setSecurityMsg('');
                    setNewEmailInput(user?.email || '');
                  }}
                  className="w-full bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 font-bold py-3 rounded-2xl border border-slate-200 hover:border-indigo-200 transition text-xs flex items-center justify-between px-5 shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" /> Change Email
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSecurityModal('password');
                    setSecurityMsg('');
                    setCurrentPassword('');
                    setNewPassword('');
                  }}
                  className="w-full bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 font-bold py-3 rounded-2xl border border-slate-200 hover:border-indigo-200 transition text-xs flex items-center justify-between px-5 shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" /> Change Password
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[10px] text-slate-400 text-center font-medium">
                🔒 Protected by HttpOnly Cookie Authentication & Bcrypt Hashing
              </div>
            </div>
          </div>

          {/* Interactive Security Action Modal for Email or Password Change */}
          {activeSecurityModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    {activeSecurityModal === 'email' ? <Mail className="w-5 h-5 text-indigo-600" /> : <Lock className="w-5 h-5 text-emerald-600" />}
                    {activeSecurityModal === 'email' ? 'Change Account Email' : 'Update Security Password'}
                  </h3>
                  <button onClick={() => setActiveSecurityModal(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {securityMsg && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    securityMsg.toLowerCase().includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {securityMsg}
                  </div>
                )}

                {activeSecurityModal === 'email' ? (
                  <form onSubmit={handleEmailChangeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">New Email Address</label>
                      <input
                        type="email"
                        required
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={securityLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
                    >
                      {securityLoading ? 'Updating Email...' : 'Save New Email'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">New Password (Min 6 chars)</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={securityLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
                    >
                      {securityLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Razorpay Payment Transactions History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">Payment History</span>
              </h3>

              <div className="flex items-center gap-2 shrink-0">
                {/* Filter Button on Right Side */}
                <div className="relative z-30">
                  <button
                    type="button"
                    onClick={() => setShowPaymentFilterDropdown(!showPaymentFilterDropdown)}
                    className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                      paymentFilter !== 'ALL'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Filter payment options"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filter</span>
                    {paymentFilter !== 'ALL' && (
                      <span className="bg-white text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                        {paymentFilter === 'THIS_MONTH' ? 'Month' : paymentFilter === 'LAST_MONTH' ? 'Last' : paymentFilter === 'LAST_30_DAYS' ? '30d' : '90d'}
                      </span>
                    )}
                  </button>

                  {/* Filter Dropdown Menu Options Table */}
                  {showPaymentFilterDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 max-w-[calc(100vw-3rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 animate-fadeIn text-xs">
                      {[
                        { id: 'ALL', label: 'All Transactions' },
                        { id: 'THIS_MONTH', label: 'This Month' },
                        { id: 'LAST_MONTH', label: 'Last Month' },
                        { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
                        { id: 'LAST_90_DAYS', label: 'Last 90 Days' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setPaymentFilter(opt.id);
                            setShowPaymentFilterDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between font-semibold ${
                            paymentFilter === opt.id
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {paymentFilter === opt.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={refreshUserData}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold px-2 py-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {user?.paymentHistory && user.paymentHistory.length > 0 ? (
              (() => {
                const now = new Date();
                const filteredPayments = user.paymentHistory.filter(item => {
                  if (!item.date) return true;
                  const itemDate = new Date(item.date);
                  if (paymentFilter === 'THIS_MONTH') {
                    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                  }
                  if (paymentFilter === 'LAST_MONTH') {
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
                  }
                  if (paymentFilter === 'LAST_30_DAYS') {
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return itemDate >= thirtyDaysAgo;
                  }
                  if (paymentFilter === 'LAST_90_DAYS') {
                    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    return itemDate >= ninetyDaysAgo;
                  }
                  return true;
                });

                // Display 2 payments by default, 5 payments when "Show More" is clicked
                const displayedPayments = showAllPayments ? filteredPayments.slice(0, 5) : filteredPayments.slice(0, 2);

                if (filteredPayments.length === 0) {
                  return (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <p className="text-xs font-bold text-slate-700">No payment transactions found for this date filter</p>
                      <button
                        onClick={() => setPaymentFilter('ALL')}
                        className="text-xs text-indigo-600 hover:underline font-bold"
                      >
                        Reset Filter
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Desktop Table View (>= 768px) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                            <th className="pb-2">Order ID</th>
                            <th className="pb-2">Payment ID</th>
                            <th className="pb-2">Plan</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayedPayments.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-3 font-mono font-medium text-slate-700">{item.orderId}</td>
                              <td className="py-3 font-mono text-slate-500">{item.paymentId}</td>
                              <td className="py-3 font-semibold text-indigo-600">{item.plan || 'Pro'}</td>
                              <td className="py-3 font-bold text-slate-900">₹{item.amount}</td>
                              <td className="py-3 text-slate-500">{new Date(item.date).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View (< 768px) */}
                    <div className="block md:hidden space-y-3">
                      {displayedPayments.map((item, idx) => {
                        const isExpanded = !!expandedPayments[idx];
                        return (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 transition-all">
                            {/* Top summary row */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Order ID</span>
                                <span className="font-extrabold text-slate-900 text-sm">₹{item.amount}</span>
                              </div>
                              <div className="font-mono text-xs font-semibold text-slate-800 break-all">
                                {item.orderId}
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                <span className="font-medium text-slate-600">{new Date(item.date).toLocaleDateString()}</span>
                                <button
                                  type="button"
                                  onClick={() => togglePaymentExpand(idx)}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-100 transition shadow-sm"
                                >
                                  <span>{isExpanded ? 'Hide Details' : 'See Details'}</span>
                                  <ArrowRight className={`w-3.5 h-3.5 font-bold transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                              </div>
                            </div>

                            {/* Collapsible expanded detail panel */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-slate-200 text-xs space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-100 shadow-inner">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-slate-500 font-medium">Order ID:</span>
                                  <span className="font-mono font-semibold text-slate-800 break-all text-right max-w-[200px]">{item.orderId}</span>
                                </div>
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-slate-500 font-medium">Payment ID:</span>
                                  <span className="font-mono text-slate-700 break-all text-right max-w-[200px]">{item.paymentId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Plan:</span>
                                  <span className="font-bold text-indigo-600">{item.plan || 'Pro Plan'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Amount Paid:</span>
                                  <span className="font-bold text-slate-900">₹{item.amount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-medium">Date & Time:</span>
                                  <span className="text-slate-700 font-medium">{new Date(item.date).toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Show More (5 Payments) / Show Less Button */}
                    {filteredPayments.length > 2 && (
                      <div className="text-center pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowAllPayments(!showAllPayments)}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border border-slate-200 shadow-sm"
                        >
                          <span>
                            {showAllPayments
                              ? 'Show Less (2 Payments)'
                              : `Show More (${Math.min(5, filteredPayments.length)} Payments)`}
                          </span>
                          {showAllPayments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-medium text-slate-500">No payment transaction records found.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

