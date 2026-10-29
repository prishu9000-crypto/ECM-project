import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  QrCode,
  ShieldCheck,
  Clock,
  FileSpreadsheet,
  Award,
  ArrowRight,
  Database,
  CheckCircle2,
  Users
} from 'lucide-react';
import Button from '../../components/common/Button';
import ConfigBanner from '../../components/common/ConfigBanner';

export default function LandingPage() {
  const collegeName = import.meta.env.VITE_COLLEGE_NAME || 'Apex Institute of Technology';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ConfigBanner />

      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm font-bold">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
                Event Cloud Manager
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                {collegeName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Student Registration</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            B.Tech CSE Capstone Project • Cloud Verified Event Management
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Seamless College Events with <span className="text-primary-600">Verified QR Attendance</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate paper rosters and attendance fraud. Manage university workshops, cultural fests, and hackathons with dynamic rotating QR check-in, verified participation hours, and instant PDF report generation.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="primary" icon={ArrowRight}>
                Register as Student
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Open Dashboard Demo
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-2xl font-bold text-slate-900">100%</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Cloud Verified Hours</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-2xl font-bold text-primary-600">60s</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Rotating QR Tokens</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-2xl font-bold text-emerald-600">Zero</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Duplicate Scans</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-2xl font-bold text-slate-900">PDF & CSV</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Instant Export</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">Platform Capabilities</h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">Engineered for Academic Excellence</p>
            <p className="text-sm text-slate-500 mt-3">
              Full-stack cloud architecture connecting students, faculty coordinators, and college administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Dynamic Rotating QR Codes</h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Attendance tokens rotate every 60 seconds with server-side HMAC validation, defeating static screenshots and buddy attendance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Verified Duration & Hours</h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Calculates true verified participation time by capturing validated check-in and check-out timestamps, producing accurate percentages.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Official Reports & Certificates</h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Generate official attendance certificates for students and comprehensive event summary reports for department heads and NAAC/NBA accreditation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works workflow */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-primary-600 uppercase tracking-widest">Attendance Lifecycle</h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">How Event Cloud Manager Works</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                01
              </span>
              <h4 className="font-bold text-sm text-slate-800">Event Publication</h4>
              <p className="text-xs text-slate-500 mt-2">
                Administrator publishes event with venue, schedule, and participant quota.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                02
              </span>
              <h4 className="font-bold text-sm text-slate-800">Student Registration</h4>
              <p className="text-xs text-slate-500 mt-2">
                Eligible students register online with unique roll number validation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                03
              </span>
              <h4 className="font-bold text-sm text-slate-800">Live QR Check-In</h4>
              <p className="text-xs text-slate-500 mt-2">
                Coordinator opens session; students scan rotating QR to check in on arrival.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center mb-4">
                04
              </span>
              <h4 className="font-bold text-sm text-slate-800">Check-Out & Hours</h4>
              <p className="text-xs text-slate-500 mt-2">
                At conclusion, students check out; system verifies duration and generates certificate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-400" />
            <span className="font-bold text-white text-sm">Event Cloud Manager</span>
          </div>
          <p className="text-xs text-slate-500">
            Designed & Developed as a B.Tech Computer Science & Engineering Final Project.
          </p>
        </div>
      </footer>
    </div>
  );
}
