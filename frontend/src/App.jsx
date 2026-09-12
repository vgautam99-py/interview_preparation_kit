import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create" element={<CreateKitPage />} />
          <Route path="/kits" element={<KitsListPage />} />
          <Route path="/kits/:id" element={<KitDetailPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/practice" element={<FlashcardsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/help" element={<HelpSupportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
