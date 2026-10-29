import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Calendar } from 'lucide-react';
import { getEvents } from '../../services/eventService';
import { useAuth } from '../../app/providers';
import { DEMO_ATTENDANCE_RECORDS } from '../../services/demoSeedService';
import { exportToCSV } from '../../lib/csvExport';
import { exportEventAttendancePDF } from '../../lib/pdfExport';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function CoordinatorReportsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    getEvents({ coordinatorUid: user?.uid || 'demo_coord_01' }).then((data) => {
      setEvents(data);
      if (data.length > 0) setSelectedEventId(data[0].eventId);
    });
  }, [user]);

  const activeEvent = events.find(e => e.eventId === selectedEventId) || events[0];

  const handleExportCSV = () => {
    if (!activeEvent) return;
    const headers = ['Roll No.', 'Student Name', 'Department', 'Check-In', 'Check-Out', 'Verified Hours', 'Attendance %', 'Status'];
    const rows = DEMO_ATTENDANCE_RECORDS.map(r => [
      r.rollNumber,
      r.studentName,
      r.department,
      formatDateTime(r.checkInAt),
      formatDateTime(r.checkOutAt),
      r.verifiedHours,
      `${r.attendancePercentage}%`,
      r.status
    ]);
    exportToCSV(`${activeEvent.title.replace(/\s+/g, '_')}_Coordinator_Report`, headers, rows);
  };

  const handleExportPDF = () => {
    if (!activeEvent) return;
    exportEventAttendancePDF({
      event: activeEvent,
      summary: {
        totalRegistered: activeEvent.registeredCount || 85,
        totalCheckedIn: 82,
        totalCheckedOut: 78,
        totalIncomplete: 4,
        totalVerifiedHours: '342.50',
        averageAttendancePercentage: 92.4
      },
      attendanceList: DEMO_ATTENDANCE_RECORDS
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Event Attendance Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export attendance rosters and participation hours for your supervised events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={FileSpreadsheet} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button size="sm" variant="primary" icon={Download} onClick={handleExportPDF}>
            Download PDF Report
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 flex-shrink-0">
            <Calendar className="w-4 h-4 text-primary-600" /> Select Supervised Event:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
          >
            {events.map((e) => (
              <option key={e.eventId} value={e.eventId}>
                {e.title} ({e.venue})
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card title={`Attendance Summary: ${activeEvent?.title || 'Selected Event'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Verified Hours</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_ATTENDANCE_RECORDS.map((r) => (
                <tr key={r.recordId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-primary-700">{r.rollNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{r.studentName}</td>
                  <td className="py-3 px-4">{r.department}</td>
                  <td className="py-3 px-4">{formatDateTime(r.checkInAt)}</td>
                  <td className="py-3 px-4">{formatDateTime(r.checkOutAt)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{r.verifiedHours} hrs</td>
                  <td className="py-3 px-4 font-semibold text-emerald-600">{r.attendancePercentage}%</td>
                  <td className="py-3 px-4"><Badge>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
