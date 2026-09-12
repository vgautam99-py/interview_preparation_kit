import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4">
        <div className="text-center space-y-3 bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-600 text-xs font-semibold">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and replace browser history entry
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
