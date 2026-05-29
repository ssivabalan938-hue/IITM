import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Auth from './pages/Auth';
import PendingApproval from './pages/PendingApproval';
import CitizenDashboard from './pages/citizen/Dashboard';
import ReportIssue from './pages/citizen/ReportIssue';
import ComplaintTracker from './pages/citizen/ComplaintTracker';
import GovernmentDashboard from './pages/government/Dashboard';
import EngineerDashboard from './pages/engineer/EngineerDashboard';

// Helper component to guard authenticated routes
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'citizen' | 'government' }) {
  const token = localStorage.getItem('roadwatch_token');
  const storedUser = localStorage.getItem('roadwatch_user');

  if (!token || !storedUser) {
    return <Navigate to="/auth" replace />;
  }

  const user = JSON.parse(storedUser);

  if (allowedRole && user.role !== allowedRole) {
    // Role mismatch, redirect to correct landing page
    if (user.role === 'government' && user.govRole === 'ENGINEER') {
       return <Navigate to="/engineer/dashboard" replace />;
    }
    return <Navigate to={user.role === 'government' ? '/government' : '/citizen'} replace />;
  }
  
  if (allowedRole === 'government' && user.govRole === 'ENGINEER' && window.location.pathname.startsWith('/government')) {
    // Prevent engineers from accessing government admin routes
    return <Navigate to="/engineer/dashboard" replace />;
  }

  if (user.role === 'government' && user.approvalStatus === 'PENDING') {
    // Government official registered but not approved yet
    return <Navigate to="/government/pending" replace />;
  }

  return <>{children}</>;
}

// Separate guard for pending government accounts
function PendingGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('roadwatch_token');
  const storedUser = localStorage.getItem('roadwatch_user');

  if (!token || !storedUser) {
    return <Navigate to="/auth" replace />;
  }

  const user = JSON.parse(storedUser);
  if (user.role !== 'government') {
    return <Navigate to="/citizen" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth page */}
        <Route path="/auth" element={<Auth />} />

        {/* Citizen Portal (Protected) */}
        <Route path="/citizen" element={
          <ProtectedRoute allowedRole="citizen">
            <CitizenDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/citizen/report" element={
          <ProtectedRoute allowedRole="citizen">
            <ReportIssue />
          </ProtectedRoute>
        } />
        
        <Route path="/citizen/tracker" element={
          <ProtectedRoute allowedRole="citizen">
            <ComplaintTracker />
          </ProtectedRoute>
        } />

        {/* Government Portal (Protected) */}
        <Route path="/government" element={
          <ProtectedRoute allowedRole="government">
            <GovernmentDashboard />
          </ProtectedRoute>
        } />

        {/* Engineer Portal (Protected under Government umbrella but separated) */}
        <Route path="/engineer/dashboard" element={
          <ProtectedRoute allowedRole="government">
            <EngineerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/government/pending" element={
          <PendingGuard>
            <PendingApproval />
          </PendingGuard>
        } />

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
