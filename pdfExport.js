import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTime } from './dateUtils';

const COLLEGE_NAME = import.meta.env.VITE_COLLEGE_NAME || 'Apex Institute of Technology';

/**
 * Generates an Event Attendance Report PDF.
 */
export function exportEventAttendancePDF({ event, summary, attendanceList }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // College & Platform Header
  doc.setFillColor(30, 27, 75); // Deep Indigo
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(COLLEGE_NAME, 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Event Cloud Manager • Verified Attendance & Participation Report', 14, 20);

  // Event Details Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Event: ${event.title || 'College Event'}`, 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Category: ${event.category || 'General'}`, 14, 45);
  doc.text(`Venue: ${event.venue || 'College Campus'}`, 14, 50);
  doc.text(`Timing: ${formatDateTime(event.startAt)} to ${formatDateTime(event.endAt)}`, 14, 55);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 45);

  // Summary Metrics Table
  autoTable(doc, {
    startY: 62,
    head: [['Total Registered', 'Checked-In', 'Checked-Out', 'Incomplete', 'Total Verified Hours', 'Avg Attendance %']],
    body: [[
      summary.totalRegistered ?? 0,
      summary.totalCheckedIn ?? 0,
      summary.totalCheckedOut ?? 0,
      summary.totalIncomplete ?? 0,
      `${summary.totalVerifiedHours ?? 0} hrs`,
      `${summary.averageAttendancePercentage ?? 0}%`
    ]],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, halign: 'center' },
    margin: { left: 14, right: 14 }
  });

  // Attendance Records Table
  const tableRows = (attendanceList || []).map((row, idx) => [
    idx + 1,
    row.studentName || 'Student',
    row.rollNumber || 'N/A',
    row.department || 'N/A',
    formatDateTime(row.checkInAt),
    formatDateTime(row.checkOutAt),
    `${row.verifiedHours || ((row.verifiedDurationSeconds || 0) / 3600).toFixed(2)} hrs`,
    `${row.attendancePercentage || 0}%`,
    row.status === 'checked-out' ? 'Completed' : (row.status === 'checked-in' ? 'Incomplete' : row.status)
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['#', 'Student Name', 'Roll No.', 'Dept', 'Check-In', 'Check-Out', 'Verified Hours', 'Attendance %', 'Status']],
    body: tableRows.length > 0 ? tableRows : [['-', 'No verified records found', '-', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbering
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()} • Official College Verification Document`,
        14,
        doc.internal.pageSize.height - 10
      );
    }
  });

  doc.save(`${(event.title || 'event').replace(/\s+/g, '_')}_Attendance_Report.pdf`);
}

/**
 * Generates an Official Participation Certificate / Student Attendance Summary PDF.
 */
export function exportStudentCertificatePDF({ student, records }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Border & Header
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1.5);
  doc.rect(8, 8, 194, 281);

  doc.setFillColor(30, 27, 75);
  doc.rect(10, 10, 190, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(COLLEGE_NAME, 105, 22, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL VERIFIED PARTICIPATION RECORD', 105, 30, { align: 'center' });

  // Student Info Block
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Student Name: ${student.fullName || 'Student'}`, 16, 48);
  doc.text(`Roll Number: ${student.rollNumber || 'N/A'}`, 16, 55);
  doc.text(`Department: ${student.department || 'N/A'}`, 16, 62);
  doc.text(`Academic Year: ${student.academicYear || 'N/A'} (Sec ${student.section || 'A'})`, 16, 69);

  doc.text(`Total Verified Hours: ${student.totalVerifiedHours || '0.00'} hrs`, 120, 48);
  doc.text(`Events Attended: ${student.attendedEventsCount || 0}`, 120, 55);
  doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 120, 62);

  // Participation Table
  const tableRows = (records || []).map((r, idx) => [
    idx + 1,
    r.eventTitle || 'College Event',
    formatDateTime(r.checkInAt),
    formatDateTime(r.checkOutAt),
    `${r.durationHours || ((r.verifiedDurationSeconds || 0) / 3600).toFixed(2)} hrs`,
    `${r.attendancePercentage || 0}%`,
    r.status === 'checked-out' ? 'Verified' : 'Pending'
  ]);

  autoTable(doc, {
    startY: 78,
    head: [['#', 'Event Title', 'Check-In', 'Check-Out', 'Hours', 'Attendance %', 'Status']],
    body: tableRows.length > 0 ? tableRows : [['-', 'No participation records yet', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 16, right: 16 }
  });

  // Verification & Signature Footer
  const finalY = doc.lastAutoTable.finalY + 25;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('This is an authorized, cryptographically logged record generated by Event Cloud Manager.', 16, finalY);

  doc.setLineWidth(0.5);
  doc.line(140, finalY + 20, 190, finalY + 20);
  doc.text('Dean of Student Affairs / HOD', 142, finalY + 25);

  doc.save(`${(student.rollNumber || 'student')}_Verified_Participation_Record.pdf`);
}
