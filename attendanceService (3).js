import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, isConfigured } from '../lib/firebase';
import { DEMO_ATTENDANCE_RECORDS } from './demoSeedService';

const LOCAL_STORAGE_ATTENDANCE_KEY = 'ecm_attendance_data';
const LOCAL_STORAGE_SESSIONS_KEY = 'ecm_sessions_data';

function getStoredAttendance() {
  const data = localStorage.getItem(LOCAL_STORAGE_ATTENDANCE_KEY);
  if (data) {
    try { return JSON.parse(data); } catch (e) { }
  }
  return [...DEMO_ATTENDANCE_RECORDS];
}

function saveStoredAttendance(records) {
  localStorage.setItem(LOCAL_STORAGE_ATTENDANCE_KEY, JSON.stringify(records));
}

function getStoredSessions() {
  const data = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
  if (data) {
    try { return JSON.parse(data); } catch (e) { }
  }
  return [];
}

function saveStoredSessions(sessions) {
  localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
}

/**
 * Creates a client-side encoded QR token payload.
 * In production Cloud Functions, HMAC/JWT is used.
 */
export function createEncodedToken({ eventId, sessionId, action = 'check-in', expirySeconds = 60 }) {
  const payload = {
    eventId,
    sessionId,
    action,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expirySeconds,
    nonce: Math.random().toString(36).substring(2, 10)
  };
  return btoa(JSON.stringify(payload));
}

/**
 * Decodes and validates a QR token.
 */
export function decodeAndValidateToken(tokenString) {
  try {
    let jsonString;
    // Check if format is jwt serialized.signature or plain base64
    if (tokenString.includes('.')) {
      const parts = tokenString.split('.');
      jsonString = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
    } else {
      jsonString = atob(tokenString);
    }
    const payload = JSON.parse(jsonString);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error(`QR Token expired ${now - payload.exp} seconds ago. Please refresh.`);
    }

    return payload;
  } catch (err) {
    if (err.message.includes('expired')) throw err;
    throw new Error('Invalid or corrupted QR attendance token.');
  }
}

/**
 * Start an attendance session for an event.
 */
export async function startAttendanceSession({ eventId, sessionTitle = 'General Session', coordinatorUid }) {
  const sessionId = 'sess_' + Date.now();
  const token = createEncodedToken({ eventId, sessionId, action: 'check-in', expirySeconds: 60 });

  if (!isConfigured) {
    const sessions = getStoredSessions();
    const newSession = {
      sessionId,
      eventId,
      sessionTitle,
      createdBy: coordinatorUid,
      sessionStatus: 'active',
      startedAt: new Date().toISOString(),
      closedAt: null
    };
    sessions.unshift(newSession);
    saveStoredSessions(sessions);
    return { sessionId, token, expiresInSeconds: 60 };
  }

  const sessionRef = doc(db, 'attendanceSessions', sessionId);
  await setDoc(sessionRef, {
    sessionId,
    eventId,
    sessionTitle,
    createdBy: coordinatorUid,
    sessionStatus: 'active',
    startedAt: serverTimestamp(),
    closedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return { sessionId, token, expiresInSeconds: 60 };
}

/**
 * Close an attendance session.
 */
export async function closeAttendanceSession(sessionId) {
  if (!isConfigured) {
    const sessions = getStoredSessions();
    const updated = sessions.map(s => s.sessionId === sessionId ? { ...s, sessionStatus: 'closed', closedAt: new Date().toISOString() } : s);
    saveStoredSessions(updated);
    return true;
  }

  await updateDoc(doc(db, 'attendanceSessions', sessionId), {
    sessionStatus: 'closed',
    closedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return true;
}

/**
 * Student Check-In using QR token.
 */
export async function processCheckIn({ tokenString, student }) {
  const decoded = decodeAndValidateToken(tokenString);
  const { eventId, sessionId } = decoded;

  if (!isConfigured) {
    const records = getStoredAttendance();
    const existing = records.find(r => r.eventId === eventId && r.attendanceSessionId === sessionId && r.studentUid === student.uid);

    if (existing) {
      if (existing.status === 'checked-in') {
        return { success: true, message: 'You are already checked in for this session!', record: existing };
      }
      if (existing.status === 'checked-out') {
        throw new Error('You have already completed check-out for this attendance session.');
      }
    }

    const newRecord = {
      recordId: `att_${Date.now()}`,
      eventId,
      eventTitle: decoded.eventTitle || 'College Event',
      attendanceSessionId: sessionId,
      studentUid: student.uid,
      studentName: student.fullName || 'Student',
      studentEmail: student.email,
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      checkInAt: new Date().toISOString(),
      checkOutAt: null,
      verifiedDurationSeconds: 0,
      verifiedHours: '0.00',
      attendancePercentage: 0,
      status: 'checked-in'
    };

    records.unshift(newRecord);
    saveStoredAttendance(records);
    return { success: true, message: 'Successfully checked in!', record: newRecord };
  }

  const recordId = `${eventId}_${sessionId}_${student.uid}`;
  const recordRef = doc(db, 'attendanceRecords', recordId);

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(recordRef);
    if (existing.exists()) {
      const data = existing.data();
      if (data.status === 'checked-in') {
        return; // Idempotent
      }
      if (data.status === 'checked-out') {
        throw new Error('You have already completed check-out for this attendance session.');
      }
    }

    transaction.set(recordRef, {
      recordId,
      eventId,
      attendanceSessionId: sessionId,
      studentUid: student.uid,
      studentName: student.fullName || 'Student',
      studentEmail: student.email,
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      checkInAt: serverTimestamp(),
      checkOutAt: null,
      verifiedDurationSeconds: 0,
      attendancePercentage: 0,
      status: 'checked-in',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  return { success: true, message: 'Check-in confirmed by Cloud Database!' };
}

/**
 * Student Check-Out using QR token or session ID.
 */
export async function processCheckOut({ tokenString, student, event }) {
  const decoded = decodeAndValidateToken(tokenString);
  const { eventId, sessionId } = decoded;

  if (!isConfigured) {
    const records = getStoredAttendance();
    const index = records.findIndex(r => r.eventId === eventId && r.attendanceSessionId === sessionId && r.studentUid === student.uid);

    if (index === -1) {
      throw new Error('No check-in record found. You must check in before checking out.');
    }

    const current = records[index];
    if (current.status === 'checked-out') {
      return { success: true, message: 'Already checked out!', record: current };
    }

    const checkInMs = new Date(current.checkInAt).getTime();
    const checkOutMs = Date.now();
    const durationSeconds = Math.max(0, Math.floor((checkOutMs - checkInMs) / 1000));

    // Calculate percentage based on 4 hours default or event duration
    const eventEligibleSecs = event ? Math.max(1, (new Date(event.endAt) - new Date(event.startAt)) / 1000) : 14400;
    const percentage = Number(Math.min(100, (durationSeconds / eventEligibleSecs) * 100).toFixed(2));

    records[index] = {
      ...current,
      checkOutAt: new Date(checkOutMs).toISOString(),
      verifiedDurationSeconds: durationSeconds,
      verifiedHours: (durationSeconds / 3600).toFixed(2),
      attendancePercentage: percentage,
      status: 'checked-out'
    };

    saveStoredAttendance(records);
    return {
      success: true,
      message: `Checked out! Verified: ${(durationSeconds / 3600).toFixed(2)} hrs (${percentage}% attendance)`,
      record: records[index]
    };
  }

  const recordId = `${eventId}_${sessionId}_${student.uid}`;
  const recordRef = doc(db, 'attendanceRecords', recordId);

  const checkOutMs = Date.now();
  let finalDuration = 0;
  let finalPercent = 0;

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(recordRef);
    if (!snap.exists()) {
      throw new Error('No check-in record found. You must check in before checking out.');
    }

    const current = snap.data();
    if (current.status === 'checked-out') {
      return;
    }

    const checkInMs = current.checkInAt ? current.checkInAt.toMillis() : checkOutMs;
    const durationSeconds = Math.max(0, Math.floor((checkOutMs - checkInMs) / 1000));
    finalDuration = durationSeconds;

    const eventSnap = await transaction.get(doc(db, 'events', eventId));
    let eligibleSecs = 14400;
    if (eventSnap.exists()) {
      const eData = eventSnap.data();
      if (eData.startAt && eData.endAt) {
        eligibleSecs = Math.max(1, Math.floor((eData.endAt.toMillis() - eData.startAt.toMillis()) / 1000));
      }
    }

    finalPercent = Number(Math.min(100, (durationSeconds / eligibleSecs) * 100).toFixed(2));

    transaction.update(recordRef, {
      checkOutAt: Timestamp.fromMillis(checkOutMs),
      verifiedDurationSeconds: durationSeconds,
      attendancePercentage: finalPercent,
      status: 'checked-out',
      updatedAt: serverTimestamp()
    });
  });

  return {
    success: true,
    message: `Checked out successfully! Verified: ${(finalDuration / 3600).toFixed(2)} hrs (${finalPercent}%)`
  };
}

/**
 * Get attendance records for a student.
 */
export async function getStudentAttendance(studentUid) {
  if (!isConfigured) {
    return getStoredAttendance().filter(r => r.studentUid === studentUid);
  }

  try {
    const q = query(
      collection(db, 'attendanceRecords'),
      where('studentUid', '==', studentUid)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ recordId: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Error fetching attendance records:', err);
    return getStoredAttendance().filter(r => r.studentUid === studentUid);
  }
}

/**
 * Get attendance records for an event.
 */
export async function getEventAttendance(eventId) {
  if (!isConfigured) {
    return getStoredAttendance().filter(r => r.eventId === eventId);
  }

  try {
    const q = query(
      collection(db, 'attendanceRecords'),
      where('eventId', '==', eventId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ recordId: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Error fetching event attendance records:', err);
    return getStoredAttendance().filter(r => r.eventId === eventId);
  }
}
