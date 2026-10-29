import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Calendar,
  QrCode,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  Compass,
  BookmarkCheck,
  History,
  User,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import ConfigBanner from '../common/ConfigBanner';
import Badge from '../common/Badge';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const role = user?.role || 'student';
  const collegeName = import.meta.env.VITE_COLLEGE_NAME || 'Apex Institute of Technology';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Role-specific navigation items
  const navItemsByRole = {
    admin: [
      { to: '/admin', label: 'System Overview', icon: BarChart3, end: true },
      { to: '/admin/events', label: 'Event Management', icon: Calendar },
      { to: '/admin/administrators', label: 'Administrators', icon: Shield },
      { to: '/admin/coordinators', label: 'Coordinators', icon: UserCheck },
      { to: '/admin/students', label: 'Student Records', icon: Users },
      { to: '/admin/reports', label: 'Analytics & Reports', icon: FileText },
      { to: '/admin/audit-logs', label: 'Security Audit Logs', icon: Shield }
    ],
    coordinator: [
      { to: '/coordinator', label: 'Coordinator Dashboard', icon: BarChart3, end: true },
      { to: '/coordinator/attendance', label: 'Live QR Attendance', icon: QrCode },
      { to: '/coordinator/reports', label: 'Event Reports', icon: FileText }
    ],
    student: [
      { to: '/student', label: 'Student Dashboard', icon: BarChart3, end: true },
      { to: '/student/browse', label: 'Browse Events', icon: Compass },
      { to: '/student/registrations', label: 'My Registrations', icon: BookmarkCheck },
      { to: '/student/scanner', label: 'Scan QR Attendance', icon: QrCode },
      { to: '/student/attendance', label: 'Verified Hours & History', icon: History },
      { to: '/student/profile', label: 'Student Profile', icon: User }
    ]
  };

  const currentNav = navItemsByRole[role] || navItemsByRole.student;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Configuration & Cloud Status Banner */}
      <ConfigBanner />

      {/* Main Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
                  Event Cloud Manager
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  {collegeName}
                </span>
              </div>
            </NavLink>
          </div>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs border border-primary-200">
                {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.fullName || user?.email?.split('@')[0]}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge size="sm" variant={role === 'admin' ? 'primary' : (role === 'coordinator' ? 'purple' : 'default')}>
                    {role}
                  </Badge>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.fullName || 'User'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  {user?.rollNumber && (
                    <p className="text-[11px] font-mono font-medium text-primary-600 mt-0.5">Roll: {user.rollNumber}</p>
                  )}
                </div>

                <div className="py-1">
                  <NavLink
                    to={role === 'admin' ? '/admin' : (role === 'coordinator' ? '/coordinator' : '/student')}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <BarChart3 className="w-4 h-4 text-slate-400" /> Dashboard
                  </NavLink>
                  {role === 'student' && (
                    <NavLink
                      to="/student/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-4 h-4 text-slate-400" /> Profile Settings
                    </NavLink>
                  )}
                  <NavLink
                    to="/"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" /> Public Portal
                  </NavLink>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <nav className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm sticky top-24">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {role} Navigation
            </div>

            {currentNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 border border-primary-200/60 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 max-w-full bg-white h-full p-4 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <span className="font-bold text-sm text-slate-800">Event Cloud Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <nav className="space-y-1 flex-1 overflow-y-auto">
                {currentNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold
                      ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Routed Page Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} {collegeName} • Event Cloud Manager • B.Tech CSE Major Project
          </p>
        </div>
      </footer>
    </div>
  );
}
