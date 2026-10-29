import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  QrCode,
  Award,
  Compass,
  BookmarkCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../app/providers';
import { getEvents } from '../../services/eventService';
import { getStudentAttendance } from '../../services/attendanceService';
import { getStudentRegistrations } from '../../services/registrationService';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const studentUid = user?.uid || 'demo_student_01';

    getEvents({ status: 'published' }).then(evts => setUpcomingEvents(evts.slice(0, 3)));
    getStudentAttendance(studentUid).then(recs => setAttendanceRecords(recs));
    getStudentRegistrations(studentUid).then(regs => setRegistrations(regs));
  }, [user]);

  // Aggregate verified hours
  const totalVerifiedHours = attendanceRecords
    .filter(r => r.status === 'checked-out')
    .reduce((sum, r) => sum + (parseFloat(r.verifiedHours) || 0), 0)
    .toFixed(2);

  const completedEventsCount = attendanceRecords.filter(r => r.status === 'checked-out').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-950 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-white/20 text-white uppercase tracking-wider">
              Enrolled Student Portal
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight mt-2">
              Welcome, {user?.fullName || 'Student'}!
            </h1>
            <p className="text-xs text-indigo-200 mt-1">
              Roll No: <span className="font-mono font-bold text-white">{user?.rollNumber || '21CS042'}</span> • {user?.department || 'Computer Science & Engineering'} • {user?.academicYear || 'Final Year'} (Sec {user?.section || 'A'})
            </p>
          </div>

          <Link to="/student/scanner">
            <Button size="md" variant="primary" icon={QrCode} className="bg-white text-primary-900 hover:bg-slate-100 border-none font-bold shadow-md">
              Scan Attendance QR
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Verified Hours</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{totalVerifiedHours} hrs</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Events Attended</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{completedEventsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Registered Events</p>
          <p className="text-xl font-extrabold text-primary-600 mt-1">{registrations.length || 4}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Avg Attendance Rate</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">94.5%</p>
        </div>
      </div>

      {/* Upcoming Published Events */}
      <Card
        title="Upcoming College Events"
        subtitle="Explore upcoming campus workshops, cultural events, and hackathons"
        headerAction={
          <Link to="/student/browse" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            Browse All Events <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="grid sm:grid-cols-3 gap-4">
          {upcomingEvents.map((evt) => (
            <div key={evt.eventId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary-700 uppercase tracking-wide bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                  {evt.category}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-2">{evt.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{evt.description}</p>
                <p className="text-[11px] font-medium text-slate-700 mt-3 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatDateTime(evt.startAt)}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{evt.venue}</span>
                <Link to="/student/browse">
                  <Button size="xs" variant="primary">Details & Register</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Attendance Activity */}
      <Card
        title="Recent Verified Attendance Activity"
        subtitle="Confirmed check-in and check-out logs"
        headerAction={
          <Link to="/student/attendance" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View Full History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Event Name</th>
                <th className="py-2.5 px-3">Check-In</th>
                <th className="py-2.5 px-3">Check-Out</th>
                <th className="py-2.5 px-3">Verified Duration</th>
                <th className="py-2.5 px-3">Attendance %</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceRecords.map((r) => (
                <tr key={r.recordId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-semibold text-slate-900">{r.eventTitle}</td>
                  <td className="py-3 px-3 text-slate-500">{formatDateTime(r.checkInAt)}</td>
                  <td className="py-3 px-3 text-slate-500">{formatDateTime(r.checkOutAt)}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{r.verifiedHours} hrs</td>
                  <td className="py-3 px-3 font-semibold text-emerald-600">{r.attendancePercentage}%</td>
                  <td className="py-3 px-3"><Badge>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
