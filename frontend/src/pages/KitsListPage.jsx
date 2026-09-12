import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import KitCard from '../components/kits/KitCard';
import api from '../lib/api';
import {
  FolderGit2,
  Search,
  Filter,
  Check,
  Edit2,
  Sparkles,
  ExternalLink,
  BookOpen,
  X,
  RefreshCw,
  PlusCircle,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function KitsListPage() {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState('All'); // All | In Progress | Completed | Recently Added
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal State for Kit Rename
  const [renamingKit, setRenamingKit] = useState(null);
  const [renameCompany, setRenameCompany] = useState('');
  const [renameRole, setRenameRole] = useState('');

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/kits');
      setKits(res.data || []);
    } catch (err) {
      console.error('Failed to load kits from DB:', err);
      toast.error('Could not fetch kits from server');
    } finally {
      setLoading(false);
    }
  };

  // Delete action: DELETE /api/kits/:id
  const handleDeleteKit = async (id) => {
    try {
      await api.delete(`/kits/${id}`);
      setKits(prev => prev.filter(k => (k.id || k._id) !== id));
      toast.success('Prep kit deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete kit');
    }
  };

  // Duplicate action: POST /api/kits/:id/duplicate
  const handleDuplicateKit = async (id) => {
    try {
      const res = await api.post(`/kits/${id}/duplicate`);
      setKits(prev => [res.data, ...prev]);
      toast.success('Kit duplicated successfully!');
    } catch (err) {
      console.error('Duplicate error:', err);
      toast.error('Failed to duplicate kit');
    }
  };

  // Open Rename Modal
  const handleOpenRename = (kit) => {
    setRenamingKit(kit);
    setRenameCompany(kit.source?.company || kit.company_brief?.company || '');
    setRenameRole(kit.source?.role || kit.role?.title || '');
  };

  // Save Rename: PUT /api/kits/:id
  const handleSaveRename = async (e) => {
    e.preventDefault();
    if (!renamingKit) return;
    const kitId = renamingKit.id || renamingKit._id;

    try {
      const res = await api.put(`/kits/${kitId}`, {
        source: { ...renamingKit.source, company: renameCompany, role: renameRole },
        role: { ...renamingKit.role, title: renameRole }
      });

      setKits(prev => prev.map(k => (k.id || k._id) === kitId ? res.data : k));
      toast.success('Kit renamed successfully!');
      setRenamingKit(null);
    } catch (err) {
      console.error('Rename error:', err);
      toast.error('Failed to rename kit');
    }
  };

  // Filter kits by search term & selected tab
  const filteredKits = kits.filter(kit => {
    const company = (kit.source?.company || kit.company_brief?.company || '').toLowerCase();
    const role = (kit.source?.role || kit.role?.title || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = company.includes(term) || role.includes(term);
    if (!matchesSearch) return false;

    if (tabFilter === 'Completed') {
      return (kit.schedule?.days || []).every(d => d.completed);
    } else if (tabFilter === 'In Progress') {
      return (kit.schedule?.days || []).some(d => d.completed) && !(kit.schedule?.days || []).every(d => d.completed);
    }
    return true;
  });

  // Kits to render for Recently Added tab vs All tab
  const displayKits = tabFilter === 'Recently Added' ? filteredKits.slice(0, 2) : filteredKits;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 ml-0 transition-all duration-300">
        <Navbar title="My Interview Kits" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Card: Title, Create Kit button, Search & Category Tabs */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <FolderGit2 className="w-6 h-6 text-indigo-600" />
                  My Interview Kits
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage all your interview preparation kits.
                </p>
              </div>

              <Link
                to="/create"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4 font-bold" /> + Create Kit
              </Link>
            </div>

            {/* Search Bar & Filter Icon Button */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px] max-w-lg">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search kits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 font-medium"
                />
              </div>

              {/* Filter Icon Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 shadow-sm ${
                  showFilters || tabFilter !== 'All'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                {tabFilter !== 'All' && (
                  <span className="bg-white text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full font-black ml-0.5">
                    {tabFilter}
                  </span>
                )}
              </button>
            </div>

            {/* Filter Options (Toggled by Filter Icon Button) */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-3 pb-1 border-t border-slate-100 animate-fadeIn">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filter options:
                </span>
                {['All', 'In Progress', 'Completed', 'Recently Added'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTabFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs transition ${
                      tabFilter === tab
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-semibold'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* Kits Count Label */}
            <div className="text-xs font-bold text-slate-500 pt-1">
              {displayKits.length} {displayKits.length === 1 ? 'kit' : 'kits'}
            </div>
          </div>

          {/* Grid of Kit Cards */}
          {loading ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-slate-500 text-xs font-medium">Loading interview kits from database...</p>
            </div>
          ) : filteredKits.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
                📚
              </div>
              <div className="space-y-1">
                <h4 className="text-slate-900 font-extrabold text-lg">No interview kits found</h4>
                <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto">
                  Create your first personalized interview preparation kit from a job description.
                </p>
              </div>

              <Link
                to="/create"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition"
              >
                <PlusCircle className="w-4 h-4" /> + Create Interview Kit
              </Link>
            </div>
          ) : tabFilter === 'All' && !searchTerm ? (
            /* SEPARATED SECTION VIEW: RECENT KITS & OLDER KITS */
            <div className="space-y-8">
              {/* 1. Recent Kits Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Recent Kits ({Math.min(2, filteredKits.length)})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredKits.slice(0, 2).map((kit) => (
                    <KitCard
                      key={kit.id || kit._id}
                      kit={kit}
                      showProgress={false}
                      onDelete={handleDeleteKit}
                      onRename={handleOpenRename}
                      onDuplicate={handleDuplicateKit}
                    />
                  ))}
                </div>
              </div>

              {/* 2. Older / All Saved Kits Section */}
              {filteredKits.length > 2 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-slate-500" />
                      Older Generated Kits ({filteredKits.length - 2})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredKits.slice(2).map((kit) => (
                      <KitCard
                        key={kit.id || kit._id}
                        kit={kit}
                        showProgress={false}
                        onDelete={handleDeleteKit}
                        onRename={handleOpenRename}
                        onDuplicate={handleDuplicateKit}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* UNIFIED FILTERED GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayKits.map((kit) => (
                <KitCard
                  key={kit.id || kit._id}
                  kit={kit}
                  showProgress={false}
                  onDelete={handleDeleteKit}
                  onRename={handleOpenRename}
                  onDuplicate={handleDuplicateKit}
                />
              ))}
            </div>
          )}

          {/* RENAME KIT MODAL */}
          {renamingKit && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleSaveRename} className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-indigo-600" /> Rename Interview Kit
                  </h3>
                  <button type="button" onClick={() => setRenamingKit(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={renameCompany}
                      onChange={(e) => setRenameCompany(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Role Title</label>
                    <input
                      type="text"
                      required
                      value={renameRole}
                      onChange={(e) => setRenameRole(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRenamingKit(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
