import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LandingPage } from '../pages/LandingPage';
import { ExploreComplaintsPage } from '../pages/ExploreComplaintsPage';
import { AboutPage } from '../pages/AboutPage';
import { TrackComplaintPage } from '../pages/TrackComplaintPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { MapPage } from '../pages/MapPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { CitizenDashboardPage } from '../pages/CitizenDashboardPage';
import { NewComplaintPage } from '../pages/NewComplaintPage';
import { ComplaintDetailPage } from '../pages/ComplaintDetailPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminComplaintsPage } from '../pages/AdminComplaintsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AdminComplaintDetailPage } from '../pages/AdminComplaintDetailPage';
import { AdminDuplicatesPage } from '../pages/AdminDuplicatesPage';
import { AdminDepartmentsPage } from '../pages/AdminDepartmentsPage';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-civic-700" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-civic-700" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/explore" element={<ExploreComplaintsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/track" element={<TrackComplaintPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/track/:id" element={<ComplaintDetailPage />} />
      <Route path="/citizen/complaints/:id" element={<ComplaintDetailPage />} />

      {/* Citizen Protected Routes */}
      <Route
        path="/citizen/dashboard"
        element={
          <ProtectedRoute>
            <CitizenDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/new"
        element={
          <ProtectedRoute>
            <NewComplaintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <AdminRoute>
            <AdminComplaintsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/complaints/:trackingId"
        element={
          <AdminRoute>
            <AdminComplaintDetailPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/duplicates"
        element={
          <AdminRoute>
            <AdminDuplicatesPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <AdminRoute>
            <AdminDepartmentsPage />
          </AdminRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
