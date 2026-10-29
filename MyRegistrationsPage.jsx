import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkCheck, Calendar, Clock, MapPin, QrCode, ArrowRight } from 'lucide-react';
import { getStudentRegistrations, cancelRegistration } from '../../services/registrationService';
import { getEvents } from '../../services/eventService';
import { useAuth } from '../../app/providers';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

export default function MyRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentUid = user?.uid || 'demo_student_01';
      const [regs, evts] = await Promise.all([
        getStudentRegistrations(studentUid),
        getEvents()
      ]);
      setRegistrations(regs);
      setEvents(evts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (eventId) => {
    await cancelRegistration(eventId, user?.uid || 'demo_student_01');
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Event Registrations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Confirmed registrations for upcoming campus events and workshops.
          </p>
        </div>

        <Link to="/student/scanner">
          <Button size="sm" variant="primary" icon={QrCode}>
            Open QR Scanner
          </Button>
        </Link>
      </div>

      {registrations.length === 0 ? (
        <EmptyState
          title="No Active Registrations"
          description="You have not registered for any upcoming events yet. Browse published events to register."
          actionLabel="Browse Events"
          onAction={() => window.location.href = '/student/browse'}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {registrations.map((reg) => {
            const event = events.find(e => e.eventId === reg.eventId);
            return (
              <Card key={reg.registrationId} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-primary-700 uppercase tracking-wider bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                      Confirmed Seat
                    </span>
                    <Badge variant="success">Registered</Badge>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{event?.title || reg.eventTitle || 'College Event'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{event?.venue || 'Campus Auditorium'}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(event?.startAt || reg.registeredAt)}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Registered on: {formatDateTime(reg.registeredAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link to="/student/scanner">
                    <Button size="xs" variant="primary" icon={QrCode}>
                      Scan QR at Event
                    </Button>
                  </Link>

                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => handleCancel(reg.eventId)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
