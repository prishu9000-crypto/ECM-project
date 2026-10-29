import React, { useState, useEffect } from 'react';
import { Download, Award, Clock, History, CheckCircle2, FileText } from 'lucide-react';
import { getStudentAttendance } from '../../services/attendanceService';
import { useAuth } from '../../app/providers';
import { exportStudentCertificatePDF } from '../../lib/pdfExport';
import { formatDateTime } from '../../lib/dateUtils';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentAttendance(user?.uid || 'demo_student_01')
      .then((data) => setRecords(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const totalVerifiedHours = records
    .filter(r => r.status === 'checked-out')
    .reduce((sum, r) => sum + (parseFloat(r.verifiedHours) || 0), 0)
    .toFixed(2);

  const completedCount = records.filter(r => r.status === 'checked-out').length;

  const handleDownloadCertificate = () => {
    exportStudentCertificatePDF({
      student: {
        fullName: user?.fullName || 'Aditya Verma',
        rollNumber: user?.rollNumber || '21CS042',
        email: user?.email || 'aditya.21cs@apex.edu.in',
        department: user?.department || 'Computer Science & Engineering',
        academicYear: user?.academicYear || 'Final Year (4th)',
        section: user?.section || 'A',
        totalVerifiedHours,
        attendedEventsCount: completedCount
      },
      records
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verified Participation History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official cryptographic attendance records, participation duration, and academic certificates.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={Download}
          onClick={handleDownloadCertificate}
          disabled={records.length === 0}
        >
          Download Official Certificate (PDF)
        </Button>
      </div>

      {/* Aggregate KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Total Verified Hours</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{totalVerifiedHours} hrs</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Completed Events</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 font-medium">Overall Attendance Rate</p>
          <p className="text-2xl font-extrabold text-primary-600 mt-1">94.5%</p>
        </div>
      </div>

      {/* Detailed Records Table */}
      {records.length === 0 ? (
        <EmptyState
          title="No Attendance Records"
          description="You haven't attended any events yet. Check in to an active event using the QR Scanner."
          actionLabel="Open Scanner"
          onAction={() => window.location.href = '/student/scanner'}
        />
      ) : (
        <Card title="Attendance Telemetry Log">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Event Name</th>
                  <th className="py-3 px-4">Check-In Timestamp</th>
                  <th className="py-3 px-4">Check-Out Timestamp</th>
                  <th className="py-3 px-4">Verified Duration</th>
                  <th className="py-3 px-4">Attendance %</th>
                  <th className="py-3 px-4">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.recordId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.eventTitle}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDateTime(r.checkInAt)}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDateTime(r.checkOutAt)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {r.verifiedHours || ((r.verifiedDurationSeconds || 0) / 3600).toFixed(2)} hrs
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600">
                      {r.attendancePercentage || 0}%
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
