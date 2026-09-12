import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Menu, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ title = 'Dashboard', onMenuClick }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const navigate = useNavigate();

  // Full name of the user
  const fullName = (user?.name && user.name !== 'Candidate')
    ? user.name
    : (user?.email ? user.email.split('@')[0] : 'User');
  const firstInitial = fullName.trim().charAt(0).toUpperCase();

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/kits?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchIconClick = () => {
    if (!isMobileSearchOpen) {
      setIsMobileSearchOpen(true);
    } else {
      if (searchQuery.trim()) {
        handleSearchSubmit();
      } else {
        setIsMobileSearchOpen(false);
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm font-sans gap-2 w-full box-border relative">
      {/* Left Corner: Hamburger Button + Viper Logo & Name */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200 flex items-center justify-center"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Viper Logo & Name */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-extrabold text-white text-xs shadow-md shadow-indigo-600/30 flex-shrink-0">
            V
          </div>
          <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
            ViperAI
          </span>
        </Link>
      </div>

      {/* Long Gap (Flex-1) pushing search & profile towards the right */}
      <div className="flex-1 min-w-0" />

      {/* Search Bar & Profile Section */}
      <div className="flex items-center gap-2">
        {/* Desktop Search Input (Always visible on medium screens & above) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 max-w-md w-64 lg:w-80">
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or prep kits..."
              className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 font-medium placeholder-slate-400 transition"
            />
            <button
              type="submit"
              title="Search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition flex items-center justify-center rounded-lg"
            >
              <ArrowRight className="w-4 h-4 font-bold" />
            </button>
          </div>
        </form>

        {/* Mobile Expandable Search (Sliding Right-to-Left towards Logo) */}
        <div className="md:hidden flex items-center relative">
          {isMobileSearchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center animate-fadeIn">
              <div className="relative flex items-center">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-44 sm:w-56 pl-3 pr-8 py-1.5 bg-slate-50 border border-indigo-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium placeholder-slate-400 shadow-sm transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={handleSearchIconClick}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition flex items-center justify-center rounded-lg"
                  title={searchQuery.trim() ? "Execute Search" : "Close Search Bar"}
                >
                  <ArrowRight className="w-4 h-4 font-bold" />
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={handleSearchIconClick}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200 flex items-center justify-center"
              title="Open Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right User Profile Bar (Logout Button Removed) */}
        {user && (
          <div className="flex items-center border-l border-slate-200 pl-2 sm:pl-3">
            <Link to="/profile" className="flex items-center space-x-2 text-xs text-slate-700 font-semibold hover:text-indigo-600 transition">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-indigo-500 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md">
                  {firstInitial}
                </div>
              )}
              <div className="hidden md:block text-left">
                <span className="block leading-tight text-slate-900 font-bold">{fullName}</span>
                <span className="text-[10px] text-indigo-600 font-bold uppercase">{user.subscription || 'free'}</span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
