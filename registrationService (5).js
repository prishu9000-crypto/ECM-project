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
  serverTimestamp
} from 'firebase/firestore';
import { db, isConfigured } from '../lib/firebase';
import { DEMO_REGISTRATIONS } from './demoSeedService';

const LOCAL_STORAGE_REG_KEY = 'ecm_registrations_data';

function getStoredRegistrations() {
  const data = localStorage.getItem(LOCAL_STORAGE_REG_KEY);
  if (data) {
    try { return JSON.parse(data); } catch (e) { }
  }
  return [...DEMO_REGISTRATIONS];
}

function saveStoredRegistrations(regs) {
  localStorage.setItem(LOCAL_STORAGE_REG_KEY, JSON.stringify(regs));
}

/**
 * Registers student for an event.
 */
export async function registerForEvent({ eventId, student, event }) {
  if (!isConfigured) {
    const regs = getStoredRegistrations();
    const existing = regs.find(r => r.eventId === eventId && r.studentUid === student.uid && r.registrationStatus === 'confirmed');
    if (existing) {
      throw new Error('You are already registered for this event.');
    }

    const newReg = {
      registrationId: `${eventId}_${student.uid}`,
      eventId,
      eventTitle: event?.title || 'College Event',
      studentUid: student.uid,
      studentName: student.fullName || 'Student',
      studentEmail: student.email,
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      registrationStatus: 'confirmed',
      registeredAt: new Date().toISOString()
    };
    regs.unshift(newReg);
    saveStoredRegistrations(regs);
    return newReg;
  }

  const regId = `${eventId}_${student.uid}`;
  const regRef = doc(db, 'registrations', regId);
  const eventRef = doc(db, 'events', eventId);

  await runTransaction(db, async (transaction) => {
    const eventDoc = await transaction.get(eventRef);
    if (!eventDoc.exists()) {
      throw new Error('Event does not exist.');
    }

    const eventData = eventDoc.data();
    if (eventData.status !== 'published') {
      throw new Error('Registrations are not open for this event.');
    }

    if (eventData.registrationDeadline && eventData.registrationDeadline.toMillis() < Date.now()) {
      throw new Error('Registration deadline has passed.');
    }

    if ((eventData.registeredCount || 0) >= eventData.maxParticipants) {
      throw new Error('Event capacity is full.');
    }

    const regDoc = await transaction.get(regRef);
    if (regDoc.exists() && regDoc.data().registrationStatus === 'confirmed') {
      throw new Error('You are already registered for this event.');
    }

    transaction.set(regRef, {
      registrationId: regId,
      eventId,
      studentUid: student.uid,
      studentName: student.fullName || 'Student',
      studentEmail: student.email,
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      registrationStatus: 'confirmed',
      registeredAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    transaction.update(eventRef, {
      registeredCount: (eventData.registeredCount || 0) + 1,
      updatedAt: serverTimestamp()
    });
  });

  return { registrationId: regId, eventId, studentUid: student.uid };
}

/**
 * Gets all event registrations for a given student.
 */
export async function getStudentRegistrations(studentUid) {
  if (!isConfigured) {
    return getStoredRegistrations().filter(r => r.studentUid === studentUid && r.registrationStatus === 'confirmed');
  }

  try {
    const q = query(
      collection(db, 'registrations'),
      where('studentUid', '==', studentUid),
      where('registrationStatus', '==', 'confirmed')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ registrationId: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Error fetching registrations:', err);
    return getStoredRegistrations().filter(r => r.studentUid === studentUid && r.registrationStatus === 'confirmed');
  }
}

/**
 * Gets all participants registered for an event.
 */
export async function getEventRegistrations(eventId) {
  if (!isConfigured) {
    return getStoredRegistrations().filter(r => r.eventId === eventId && r.registrationStatus === 'confirmed');
  }

  try {
    const q = query(
      collection(db, 'registrations'),
      where('eventId', '==', eventId),
      where('registrationStatus', '==', 'confirmed')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ registrationId: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Error fetching event participants:', err);
    return getStoredRegistrations().filter(r => r.eventId === eventId && r.registrationStatus === 'confirmed');
  }
}

/**
 * Cancels a student registration.
 */
export async function cancelRegistration(eventId, studentUid) {
  if (!isConfigured) {
    const regs = getStoredRegistrations();
    const updated = regs.map(r => {
      if (r.eventId === eventId && r.studentUid === studentUid) {
        return { ...r, registrationStatus: 'cancelled' };
      }
      return r;
    });
    saveStoredRegistrations(updated);
    return true;
  }

  const regId = `${eventId}_${studentUid}`;
  await updateDoc(doc(db, 'registrations', regId), {
    registrationStatus: 'cancelled',
    updatedAt: serverTimestamp()
  });
  return true;
}
