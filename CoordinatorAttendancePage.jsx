import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Play,
  StopCircle,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { getEvents } from '../../services/eventService';
import {
  startAttendanceSession,
  closeAttendanceSession,
  createEncodedToken,
  getEventAttendance
} from '../../services/attendanceService';
import { useAuth } from '../../app/providers';
import { DEMO_ATTENDANCE_RECORDS } from '../../services/demoSeedService';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import QRDisplay from '../../components/qr/QRDisplay';

export default function CoordinatorAttendancePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');

  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentToken, setCurrentToken] = useState('');
  const [actionType, setActionType] = useState('check-in'); // 'check-in' | 'check-out'
  const [participants, setParticipants] = useState(DEMO_ATTENDANCE_RECORDS);

  useEffect(() => {
    getEvents({ coordinatorUid: user?.uid || 'demo_coord_01' }).then((data) => {
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].eventId);
      }
    });
  }, [user]);

  const activeEvent = events.find(e => e.eventId === selectedEventId) || events[0];

  const handleStartSession = async () => {
    if (!selectedEventId) return;

    try {
      const res = await startAttendanceSession({
        eventId: selectedEventId,
        sessionTitle: `${activeEvent?.title || 'Event'} Attendance`,
        coordinatorUid: user?.uid || 'coord'
      });

      setSessionId(res.sessionId);
      setCurrentToken(res.token);
      setIsSessionActive(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshToken = () => {
    if (!selectedEventId || !sessionId) return;
    const freshToken = createEncodedToken({
      eventId: selectedEventId,
      sessionId,
      action: actionType,
      expirySeconds: 60
    });
    setCurrentToken(freshToken);
  };

  const handleToggleAction = (action) => {
    setActionType(action);
    if (isSessionActive && sessionId) {
      const freshToken = createEncodedToken({
        eventId: selectedEventId,
        sessionId,
        action,
        expirySeconds: 60
      });
      setCurrentToken(freshToken);
    }
  };

  const handleCloseSession = async () => {
    if (sessionId) {
      await closeAttendanceSession(sessionId);
    }
    setIsSessionActive(false);
    setCurrentToken('');
    setSessionId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live QR Attendance Session</h1>
          <p className="text-xs text-slate-500 mt-1">
            Display dynamic rotating QR codes for students to mark verified check-in and check-out.
          </p>
        </div>

        {isSessionActive && (
          <Button size="sm" variant="danger" icon={StopCircle} onClick={handleCloseSession}>
            Close Attendance Session
          </Button>
        )}
      </div>

      {/* Target Event Selection */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-slate-700 block mb-1">Select Event:</label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                if (isSessionActive) handleCloseSession();
                setSelectedEventId(e.target.value);
              }}
              disabled={isSessionActive}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
            >
              {events.map((e) => (
                <option key={e.eventId} value={e.eventId}>
                  {e.title} ({e.venue})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto self-end">
            {!isSessionActive ? (
              <Button
                variant="primary"
                size="md"
                icon={Play}
                onClick={handleStartSession}
                disabled={!selectedEventId}
              >
                Start Attendance Session
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-700">SESSION LIVE</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* QR Code and Participant Roster Grid */}
      {isSessionActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Dynamic QR Code Box */}
          <div className="lg:col-span-5 space-y-4">
            {/* Mode Selector (Check-In vs Check-Out) */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 flex gap-2">
              <button
                onClick={() => handleToggleAction('check-in')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  actionType === 'check-in'
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                1. Check-In Mode
              </button>
              <button
                onClick={() => handleToggleAction('check-out')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  actionType === 'check-out'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                2. Check-Out Mode
              </button>
            </div>

            <QRDisplay
              token={currentToken}
              action={actionType}
              expirySeconds={60}
              onRefresh={handleRefreshToken}
              isSessionActive={isSessionActive}
            />

            <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary-600" /> Rotating Token Security
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tokens automatically expire every 60 seconds. Students must be within active scan range or possess the current rotating session token to record verified presence.
              </p>
            </div>
          </div>

          {/* Right: Live Participant Telemetry */}
          <div className="lg:col-span-7">
            <Card
              title="Live Attendee Roster"
              subtitle={`Verified participants for session ${sessionId}`}
              headerAction={
                <Badge variant="success" size="sm">
                  {participants.length} Active Records
                </Badge>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Roll No.</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Check-Out</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {participants.map((p) => (
                      <tr key={p.recordId} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-mono font-bold text-primary-700">{p.rollNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{p.studentName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{formatDateTime(p.checkInAt)}</td>
                        <td className="py-2.5 px-3 text-slate-500">{formatDateTime(p.checkOutAt)}</td>
                        <td className="py-2.5 px-3"><Badge>{p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-primary-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Active Attendance Session</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Select your assigned college event above and click "Start Attendance Session" to project the dynamic QR attendance screen for your students.
          </p>
          <Button size="md" variant="primary" icon={Play} onClick={handleStartSession} disabled={!selectedEventId}>
            Start Attendance Session
          </Button>
        </Card>
      )}
    </div>
  );
}
