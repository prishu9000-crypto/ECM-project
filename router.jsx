import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './providers';

// Layouts
import MainLayout from '../components/layout/MainLayout';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import ForgotPasswordPage from '../pages/public/ForgotPasswordPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminEventsPage from '../pages/admin/AdminEventsPage';
import AdminAdministratorsPage from '../pages/admin/AdminAdministratorsPage';
import AdminStudentsPage from '../pages/admin/AdminStudentsPage';
import AdminCoordinatorsPage from '../pages/admin/AdminCoordinatorsPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';

// Coordinator Pages
import CoordinatorDashboard from '../pages/coordinator/CoordinatorDashboard';
import CoordinatorAttendancePage from '../pages/coordinator/CoordinatorAttendancePage';
import CoordinatorReportsPage from '../pages/coordinator/CoordinatorReportsPage';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import BrowseEventsPage from '../pages/student/BrowseEventsPage';
import MyRegistrationsPage from '../pages/student/MyRegistrationsPage';
import StudentScannerPage from '../pages/student/StudentScannerPage';
import MyAttendancePage from '../pages/student/MyAttendancePage';
import ProfilePage from '../pages/student/ProfilePage';

// Error Pages
import AccessDeniedPage from '../pages/errors/AccessDeniedPage';
import NotFoundPage from '../pages/errors/NotFoundPage';

/**
 * Route guard component enforcing role requirements.
 */
function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role || 'student';
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  // Public Routes
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/access-denied', element: <AccessDeniedPage /> },

  // Administrator Protected Routes
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/admin', element: <AdminDashboard /> },
          { path: '/admin/events', element: <AdminEventsPage /> },
          { path: '/admin/administrators', element: <AdminAdministratorsPage /> },
          { path: '/admin/coordinators', element: <AdminCoordinatorsPage /> },
          { path: '/admin/students', element: <AdminStudentsPage /> },
          { path: '/admin/reports', element: <AdminReportsPage /> },
          { path: '/admin/audit-logs', element: <AdminAuditLogsPage /> },
        ]
      }
    ]
  },

  // Event Coordinator Protected Routes
  {
    element: <ProtectedRoute allowedRoles={['coordinator', 'admin']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/coordinator', element: <CoordinatorDashboard /> },
          { path: '/coordinator/attendance', element: <CoordinatorAttendancePage /> },
          { path: '/coordinator/reports', element: <CoordinatorReportsPage /> },
        ]
      }
    ]
  },

  // Student Protected Routes
  {
    element: <ProtectedRoute allowedRoles={['student', 'admin', 'coordinator']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/student', element: <StudentDashboard /> },
          { path: '/student/browse', element: <BrowseEventsPage /> },
          { path: '/student/registrations', element: <MyRegistrationsPage /> },
          { path: '/student/scanner', element: <StudentScannerPage /> },
          { path: '/student/attendance', element: <MyAttendancePage /> },
          { path: '/student/profile', element: <ProfilePage /> },
        ]
      }
    ]
  },

  // 404 Catch-All
  { path: '*', element: <NotFoundPage /> }
]);
