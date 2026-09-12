import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateKitPage from './pages/CreateKitPage';
import KitsListPage from './pages/KitsListPage';
import KitDetailPage from './pages/KitDetailPage';
import FlashcardsPage from './pages/FlashcardsPage';
import SchedulePage from './pages/SchedulePage';
import AnalysisPage from './pages/AnalysisPage';
import PlansPage from './pages/PlansPage';
import ProfilePage from './pages/ProfilePage';
import HelpSupportPage from './pages/HelpSupportPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '0.875rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            padding: '10px 14px',
            maxWidth: '85vw'
          }
        }}
      />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateKitPage /></ProtectedRoute>} />
          <Route path="/kits" element={<ProtectedRoute><KitsListPage /></ProtectedRoute>} />
          <Route path="/kits/:id" element={<ProtectedRoute><KitDetailPage /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
          <Route path="/practice" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
          <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><HelpSupportPage /></ProtectedRoute>} />

          {/* 404 Invalid URL Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

