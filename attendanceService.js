const admin = require('firebase-admin');
const { getAuthenticatedUser, requireAssignedCoordinator, requireAdmin } = require('../security/roles');
const { generateQRToken, verifyQRToken, DEFAULT_EXPIRY_SECONDS } = require('../security/tokens');
const { recordAuditLog } = require('../utils/auditLogger');

/**
 * Creates or activates an attendance session for an event.
 * Must be executed by an assigned coordinator or admin.
 */
async function createAttendanceSession(data, context) {
  const { eventId, sessionTitle = 'General Session' } = data;
  if (!eventId) {
    throw new Error('VALIDATION_ERROR: Missing eventId.');
  }

  const coordinator = await requireAssignedCoordinator(context, eventId);
  const db = admin.firestore();

  const sessionRef = db.collection('attendanceSessions').doc();
  const sessionData = {
    sessionId: sessionRef.id,
    eventId,
    sessionTitle,
    createdBy: coordinator.uid,
    sessionStatus: 'active', // 'active' | 'closed'
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    closedAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await sessionRef.set(sessionData);

  // Generate initial QR token
  const token = generateQRToken({
    eventId,
    sessionId: sessionRef.id,
    action: 'check-in',
    expirySeconds: DEFAULT_EXPIRY_SECONDS
  });

  await recordAuditLog({
    actorUid: coordinator.uid,
    action: 'ATTENDANCE_SESSION_STARTED',
    resourceType: 'attendanceSession',
    resourceId: sessionRef.id,
    outcome: 'SUCCESS',
    metadata: { eventId, sessionTitle }
  });

  return {
    success: true,
    sessionId: sessionRef.id,
    token,
    expiresInSeconds: DEFAULT_EXPIRY_SECONDS,
    message: 'Attendance session successfully started.'
  };
}

/**
 * Issues a refreshed short-lived QR token for an active session.
 */
async function issueAttendanceToken(data, context) {
  const { eventId, sessionId, action = 'check-in', expirySeconds = DEFAULT_EXPIRY_SECONDS } = data;
  if (!eventId || !sessionId) {
    throw new Error('VALIDATION_ERROR: Missing eventId or sessionId.');
  }

  const coordinator = await requireAssignedCoordinator(context, eventId);
  const db = admin.firestore();
  const sessionDoc = await db.collection('attendanceSessions').doc(sessionId).get();

  if (!sessionDoc.exists) {
    throw new Error('NOT_FOUND: Attendance session not found.');
  }

  if (sessionDoc.data().sessionStatus !== 'active') {
    throw new Error('INVALID_STATE: Attendance session is closed. New tokens cannot be issued.');
  }

  const token = generateQRToken({
    eventId,
    sessionId,
    action,
    expirySeconds: Math.min(Math.max(expirySeconds, 15), 300) // bounded between 15s and 5m
  });

  return {
    success: true,
    token,
    action,
    expiresInSeconds: expirySeconds,
    issuedAt: new Date().toISOString()
  };
}

/**
 * Closes an active attendance session.
 */
async function closeAttendanceSession(data, context) {
  const { eventId, sessionId } = data;
  const coordinator = await requireAssignedCoordinator(context, eventId);

  const db = admin.firestore();
  const sessionRef = db.collection('attendanceSessions').doc(sessionId);
  const snap = await sessionRef.get();

  if (!snap.exists) {
    throw new Error('NOT_FOUND: Attendance session not found.');
  }

  await sessionRef.update({
    sessionStatus: 'closed',
    closedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await recordAuditLog({
    actorUid: coordinator.uid,
    action: 'ATTENDANCE_SESSION_CLOSED',
    resourceType: 'attendanceSession',
    resourceId: sessionId,
    outcome: 'SUCCESS',
    metadata: { eventId }
  });

  return { success: true, sessionId, message: 'Attendance session closed.' };
}

/**
 * Validates token and processes student check-in.
 */
async function checkInStudent(data, context) {
  const student = await getAuthenticatedUser(context);
  const { tokenString } = data;

  if (!tokenString) {
    throw new Error('VALIDATION_ERROR: Missing QR token.');
  }

  // 1. Verify token signature and expiry
  const decoded = verifyQRToken(tokenString);
  const { eventId, sessionId } = decoded;

  const db = admin.firestore();

  // 2. Validate session status
  const sessionDoc = await db.collection('attendanceSessions').doc(sessionId).get();
  if (!sessionDoc.exists || sessionDoc.data().sessionStatus !== 'active') {
    throw new Error('CLOSED_SESSION: The attendance session for this event is closed or invalid.');
  }

  // 3. Validate event status
  const eventDoc = await db.collection('events').doc(eventId).get();
  if (!eventDoc.exists) {
    throw new Error('NOT_FOUND: Event does not exist.');
  }
  const event = eventDoc.data();
  if (event.status === 'cancelled' || event.status === 'archived') {
    throw new Error(`INVALID_EVENT: Event is ${event.status}. Attendance cannot be marked.`);
  }

  // 4. Validate registration
  const regId = `${eventId}_${student.uid}`;
  const regDoc = await db.collection('registrations').doc(regId).get();
  if (!regDoc.exists || regDoc.data().registrationStatus !== 'confirmed') {
    throw new Error('NOT_REGISTERED: You must be registered for this event before checking in.');
  }

  // 5. Check attendance record idempotency
  const recordId = `${eventId}_${sessionId}_${student.uid}`;
  const recordRef = db.collection('attendanceRecords').doc(recordId);

  const result = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(recordRef);

    if (existing.exists) {
      const existingData = existing.data();
      if (existingData.status === 'checked-in') {
        return {
          alreadyCheckedIn: true,
          checkInAt: existingData.checkInAt,
          message: 'Already checked in for this session.'
        };
      }
      if (existingData.status === 'checked-out') {
        throw new Error('ALREADY_COMPLETED: You have already checked out of this attendance session.');
      }
    }

    const serverNow = admin.firestore.FieldValue.serverTimestamp();
    const userProfile = (await transaction.get(db.collection('users').doc(student.uid))).data() || {};

    const newRecord = {
      recordId,
      eventId,
      eventTitle: event.title,
      attendanceSessionId: sessionId,
      studentUid: student.uid,
      studentName: userProfile.fullName || 'Student',
      studentEmail: userProfile.email || student.email,
      rollNumber: userProfile.rollNumber || '',
      department: userProfile.department || '',
      checkInAt: serverNow,
      checkOutAt: null,
      verifiedDurationSeconds: 0,
      attendancePercentage: 0,
      status: 'checked-in',
      createdAt: serverNow,
      updatedAt: serverNow
    };

    transaction.set(recordRef, newRecord);
    return { alreadyCheckedIn: false, record: newRecord };
  });

  await recordAuditLog({
    actorUid: student.uid,
    action: 'STUDENT_CHECK_IN',
    resourceType: 'attendanceRecord',
    resourceId: recordId,
    outcome: 'SUCCESS',
    metadata: { eventId, eventTitle: event.title }
  });

  return {
    success: true,
    recordId,
    status: 'checked-in',
    message: result.alreadyCheckedIn
      ? 'You were already checked in to this session.'
      : `Successfully checked in for ${event.title}!`
  };
}

/**
 * Validates token and processes student check-out, computing verified duration.
 */
async function checkOutStudent(data, context) {
  const student = await getAuthenticatedUser(context);
  const { tokenString } = data;

  if (!tokenString) {
    throw new Error('VALIDATION_ERROR: Missing QR token.');
  }

  // 1. Verify token signature and expiry
  const decoded = verifyQRToken(tokenString);
  const { eventId, sessionId } = decoded;

  const db = admin.firestore();
  const eventDoc = await db.collection('events').doc(eventId).get();
  if (!eventDoc.exists) {
    throw new Error('NOT_FOUND: Event not found.');
  }
  const event = eventDoc.data();

  const recordId = `${eventId}_${sessionId}_${student.uid}`;
  const recordRef = db.collection('attendanceRecords').doc(recordId);

  const checkoutTime = Date.now();

  const result = await db.runTransaction(async (transaction) => {
    const recordDoc = await transaction.get(recordRef);

    if (!recordDoc.exists) {
      throw new Error('NO_CHECK_IN: No check-in record found. You must check in before checking out.');
    }

    const currentRecord = recordDoc.data();
    if (currentRecord.status === 'checked-out') {
      return {
        alreadyCheckedOut: true,
        verifiedDurationSeconds: currentRecord.verifiedDurationSeconds,
        attendancePercentage: currentRecord.attendancePercentage,
        message: 'Already checked out.'
      };
    }

    if (currentRecord.status !== 'checked-in') {
      throw new Error(`INVALID_STATUS: Current attendance status is ${currentRecord.status}. Cannot check out.`);
    }

    const checkInMs = currentRecord.checkInAt ? currentRecord.checkInAt.toMillis() : checkoutTime;
    const durationSeconds = Math.max(0, Math.floor((checkoutTime - checkInMs) / 1000));

    // Calculate eligible event duration in seconds
    const eventStartMs = event.startAt ? event.startAt.toMillis() : checkInMs;
    const eventEndMs = event.endAt ? event.endAt.toMillis() : checkoutTime;
    const eligibleDurationSeconds = Math.max(1, Math.floor((eventEndMs - eventStartMs) / 1000));

    // Attendance percentage = (duration / eligible) * 100, capped at 100%
    const attendancePercentage = Number(Math.min(100, Math.max(0, (durationSeconds / eligibleDurationSeconds) * 100)).toFixed(2));

    const checkOutTimestamp = admin.firestore.Timestamp.fromMillis(checkoutTime);

    transaction.update(recordRef, {
      checkOutAt: checkOutTimestamp,
      verifiedDurationSeconds: durationSeconds,
      attendancePercentage,
      status: 'checked-out',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      alreadyCheckedOut: false,
      durationSeconds,
      attendancePercentage,
      durationHours: (durationSeconds / 3600).toFixed(2)
    };
  });

  await recordAuditLog({
    actorUid: student.uid,
    action: 'STUDENT_CHECK_OUT',
    resourceType: 'attendanceRecord',
    resourceId: recordId,
    outcome: 'SUCCESS',
    metadata: {
      eventId,
      durationSeconds: result.durationSeconds,
      attendancePercentage: result.attendancePercentage
    }
  });

  return {
    success: true,
    recordId,
    status: 'checked-out',
    durationSeconds: result.durationSeconds,
    durationHours: (result.durationSeconds / 3600).toFixed(2),
    attendancePercentage: result.attendancePercentage,
    message: `Checked out successfully! Verified participation: ${(result.durationSeconds / 3600).toFixed(2)} hours (${result.attendancePercentage}%).`
  };
}

/**
 * Administrative attendance record correction.
 */
async function correctAttendanceRecord(data, context) {
  const adminUser = await requireAdmin(context);
  const { recordId, verifiedDurationSeconds, status, reason } = data;

  if (!recordId || !reason) {
    throw new Error('VALIDATION_ERROR: Missing recordId or mandatory correction reason.');
  }

  const db = admin.firestore();
  const recordRef = db.collection('attendanceRecords').doc(recordId);
  const snap = await recordRef.get();

  if (!snap.exists) {
    throw new Error('NOT_FOUND: Attendance record not found.');
  }

  const previousData = snap.data();
  const updatePayload = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    correctionMetadata: {
      correctedBy: adminUser.uid,
      correctedAt: new Date().toISOString(),
      reason,
      previousDurationSeconds: previousData.verifiedDurationSeconds || 0,
      previousStatus: previousData.status
    }
  };

  if (typeof verifiedDurationSeconds === 'number') {
    updatePayload.verifiedDurationSeconds = Math.max(0, verifiedDurationSeconds);
  }

  if (status) {
    updatePayload.status = status;
  }

  await recordRef.update(updatePayload);

  await recordAuditLog({
    actorUid: adminUser.uid,
    action: 'ATTENDANCE_RECORD_CORRECTED',
    resourceType: 'attendanceRecord',
    resourceId,
    outcome: 'SUCCESS',
    metadata: { reason, previousData, updatePayload }
  });

  return { success: true, recordId, message: 'Attendance record corrected successfully.' };
}

module.exports = {
  createAttendanceSession,
  issueAttendanceToken,
  closeAttendanceSession,
  checkInStudent,
  checkOutStudent,
  correctAttendanceRecord
};
