import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { getEvents } from '../../services/eventService';
import { registerForEvent, getStudentRegistrations, cancelRegistration } from '../../services/registrationService';
import { useAuth } from '../../app/providers';
import { formatDateTime, isRegistrationClosed } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function BrowseEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const categories = [
    'Technical Workshop',
    'Hackathon',
    'College Cultural Fest',
    'NSS Community Service',
    'Career Guidance Seminar'
  ];

  useEffect(() => {
    loadData();
  }, [category]);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentUid = user?.uid || 'demo_student_01';
      const [allEvents, userRegs] = await Promise.all([
        getEvents({ category: category !== 'all' ? category : undefined, search }),
        getStudentRegistrations(studentUid)
      ]);
      setEvents(allEvents);
      setRegistrations(userRegs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isRegistered = (eventId) => {
    return registrations.some(r => r.eventId === eventId && r.registrationStatus === 'confirmed');
  };

  const handleRegister = async (event) => {
    setActionMessage(null);
    try {
      await registerForEvent({
        eventId: event.eventId,
        student: user || { uid: 'demo_student_01', fullName: 'Student', email: 'stu@apex.edu.in' },
        event
      });
      setActionMessage({ type: 'success', text: `Successfully registered for "${event.title}"!` });
      loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleCancelRegistration = async (eventId) => {
    setActionMessage(null);
    try {
      await cancelRegistration(eventId, user?.uid || 'demo_student_01');
      setActionMessage({ type: 'success', text: 'Registration cancelled.' });
      loadData();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Browse College Events</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore upcoming academic workshops, hackathons, and activities. Secure your verified attendance seat.
        </p>
      </div>

      {actionMessage && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by topic, venue, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">All Event Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      {/* Event Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {events.map((evt) => {
          const registered = isRegistered(evt.eventId);
          const deadlinePassed = isRegistrationClosed(evt.registrationDeadline);
          const isFull = (evt.registeredCount || 0) >= evt.maxParticipants;

          return (
            <Card key={evt.eventId} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-primary-700 uppercase tracking-wide bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
                    {evt.category}
                  </span>
                  <Badge>{evt.status}</Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900">{evt.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{evt.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Venue: <strong>{evt.venue}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Schedule: {formatDateTime(evt.startAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>
                      Seats: <strong>{evt.registeredCount || 0} / {evt.maxParticipants} filled</strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Registration Deadline: {formatDateTime(evt.registrationDeadline)}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                {registered ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> You Are Registered
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleCancelRegistration(evt.eventId)}
                    >
                      Cancel Registration
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={isFull || deadlinePassed ? 'outline' : 'primary'}
                    disabled={isFull || deadlinePassed || evt.status === 'cancelled' || evt.status === 'completed'}
                    onClick={() => handleRegister(evt)}
                    className="w-full"
                  >
                    {isFull
                      ? 'Event Full (Waitlist)'
                      : (deadlinePassed ? 'Registration Deadline Passed' : 'Register for Event')}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
