import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, QrCode, Users, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { getEvents } from '../../services/eventService';
import { useAuth } from '../../app/providers';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [assignedEvents, setAssignedEvents] = useState([]);

  useEffect(() => {
    getEvents({ coordinatorUid: user?.uid || 'demo_coord_01' })
      .then((data) => setAssignedEvents(data))
      .catch((err) => console.error(err));
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coordinator Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {user?.fullName || 'Faculty Coordinator'}. Manage your assigned events and live QR check-in sessions.
          </p>
        </div>

        <Link to="/coordinator/attendance">
          <Button size="sm" variant="primary" icon={QrCode}>
            Launch Live Attendance QR
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Assigned Events</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{assignedEvents.length || 3}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Active QR Sessions</p>
          <p className="text-xl font-bold text-primary-600 mt-1">1</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Registered Students</p>
          <p className="text-xl font-bold text-slate-900 mt-1">249</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Verified Hours</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">94.5 hrs</p>
        </div>
      </div>

      <Card
        title="My Assigned College Events"
        subtitle="Events where you are designated as the supervising faculty coordinator"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Attendance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignedEvents.map((evt) => (
                <tr key={evt.eventId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800">{evt.title}</td>
                  <td className="py-3.5 px-4">{evt.venue}</td>
                  <td className="py-3.5 px-4">{formatDateTime(evt.startAt)}</td>
                  <td className="py-3.5 px-4 font-medium">
                    {evt.registeredCount || 0} / {evt.maxParticipants}
                  </td>
                  <td className="py-3.5 px-4"><Badge>{evt.status}</Badge></td>
                  <td className="py-3.5 px-4 text-right">
                    <Link to={`/coordinator/attendance?eventId=${evt.eventId}`}>
                      <Button size="xs" variant="primary" icon={QrCode}>
                        Start QR Session
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
