const admin = require('firebase-admin');
const { requireAdmin, requireAssignedCoordinator, getAuthenticatedUser } = require('../security/roles');

/**
 * Sanitizes fields to prevent CSV Injection / Formula Execution in Excel/Google Sheets.
 * If a field starts with =, +, -, @, \t, \r, prefix with a single quote.
 */
function sanitizeCSVField(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
}

/**
 * Aggregates event-wise attendance data.
 */
async function getEventAttendanceReport(data, context) {
  const { eventId } = data;
  if (!eventId) throw new Error('VALIDATION_ERROR: Missing eventId.');

  await requireAssignedCoordinator(context, eventId);
  const db = admin.firestore();

  const eventDoc = await db.collection('events').doc(eventId).get();
  if (!eventDoc.exists) throw new Error('NOT_FOUND: Event not found.');
  const event = eventDoc.data();

  const registrationsSnap = await db.collection('registrations')
    .where('eventId', '==', eventId)
    .where('registrationStatus', '==', 'confirmed')
    .get();

  const attendanceSnap = await db.collection('attendanceRecords')
    .where('eventId', '==', eventId)
    .get();

  const registeredStudents = registrationsSnap.docs.map(d => d.data());
  const records = attendanceSnap.docs.map(d => d.data());

  let totalDurationSeconds = 0;
  let checkedInCount = 0;
  let checkedOutCount = 0;
  let incompleteCount = 0;
  let totalPercent = 0;

  records.forEach(r => {
    if (r.status === 'checked-in') {
      checkedInCount++;
      incompleteCount++;
    } else if (r.status === 'checked-out') {
      checkedOutCount++;
      checkedInCount++;
      totalDurationSeconds += (r.verifiedDurationSeconds || 0);
      totalPercent += (r.attendancePercentage || 0);
    }
  });

  const avgPercent = checkedOutCount > 0 ? (totalPercent / checkedOutCount).toFixed(2) : 0;
  const totalVerifiedHours = (totalDurationSeconds / 3600).toFixed(2);

  return {
    success: true,
    eventSummary: {
      eventId,
      title: event.title,
      category: event.category,
      venue: event.venue,
      startAt: event.startAt ? event.startAt.toDate().toISOString() : null,
      endAt: event.endAt ? event.endAt.toDate().toISOString() : null,
      totalRegistered: registeredStudents.length,
      totalCheckedIn: checkedInCount,
      totalCheckedOut: checkedOutCount,
      totalIncomplete: incompleteCount,
      totalVerifiedHours,
      averageAttendancePercentage: Number(avgPercent)
    },
    attendanceRecords: records.map(r => ({
      studentUid: r.studentUid,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      rollNumber: r.rollNumber,
      department: r.department,
      status: r.status,
      checkInAt: r.checkInAt ? r.checkInAt.toDate().toISOString() : null,
      checkOutAt: r.checkOutAt ? r.checkOutAt.toDate().toISOString() : null,
      verifiedDurationSeconds: r.verifiedDurationSeconds || 0,
      verifiedHours: ((r.verifiedDurationSeconds || 0) / 3600).toFixed(2),
      attendancePercentage: r.attendancePercentage || 0
    }))
  };
}

/**
 * Generates student-wise attendance summary.
 * If requested by student, returns their own summary; if by admin, can query any student.
 */
async function getStudentAttendanceSummary(data, context) {
  const caller = await getAuthenticatedUser(context);
  let targetUid = data.studentUid;

  if (!targetUid || targetUid === caller.uid) {
    targetUid = caller.uid;
  } else {
    // Only admin can view another student's detailed report
    if (caller.role !== 'admin') {
      throw new Error('PERMISSION_DENIED: Cannot access another student private summary.');
    }
  }

  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(targetUid).get();
  const profile = userDoc.exists ? userDoc.data() : {};

  const registrationsSnap = await db.collection('registrations')
    .where('studentUid', '==', targetUid)
    .where('registrationStatus', '==', 'confirmed')
    .get();

  const attendanceSnap = await db.collection('attendanceRecords')
    .where('studentUid', '==', targetUid)
    .get();

  let totalDurationSeconds = 0;
  let attendedEventsCount = 0;

  const attendanceList = attendanceSnap.docs.map(doc => {
    const d = doc.data();
    if (d.status === 'checked-out') {
      attendedEventsCount++;
      totalDurationSeconds += (d.verifiedDurationSeconds || 0);
    }
    return {
      recordId: d.recordId,
      eventId: d.eventId,
      eventTitle: d.eventTitle || 'College Event',
      checkInAt: d.checkInAt ? d.checkInAt.toDate().toISOString() : null,
      checkOutAt: d.checkOutAt ? d.checkOutAt.toDate().toISOString() : null,
      durationHours: ((d.verifiedDurationSeconds || 0) / 3600).toFixed(2),
      attendancePercentage: d.attendancePercentage || 0,
      status: d.status
    };
  });

  return {
    success: true,
    student: {
      uid: targetUid,
      fullName: profile.fullName || 'Student',
      email: profile.email || '',
      rollNumber: profile.rollNumber || '',
      department: profile.department || '',
      academicYear: profile.academicYear || '',
      section: profile.section || '',
      registeredEventsCount: registrationsSnap.size,
      attendedEventsCount,
      totalVerifiedHours: (totalDurationSeconds / 3600).toFixed(2),
      totalDurationSeconds
    },
    attendanceHistory: attendanceList
  };
}

module.exports = {
  sanitizeCSVField,
  getEventAttendanceReport,
  getStudentAttendanceSummary
};
