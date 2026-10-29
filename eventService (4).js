import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, isConfigured } from '../lib/firebase';
import { DEMO_EVENTS } from './demoSeedService';

const LOCAL_STORAGE_EVENTS_KEY = 'ecm_events_data';

function getStoredEvents() {
  const data = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
  if (data) {
    try { return JSON.parse(data); } catch (e) { }
  }
  return [...DEMO_EVENTS];
}

function saveStoredEvents(events) {
  localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(events));
}

/**
 * Fetch all events (with optional category, status, or search filter).
 */
export async function getEvents({ category, status, search, coordinatorUid } = {}) {
  let events = [];

  if (!isConfigured) {
    events = getStoredEvents();
  } else {
    try {
      let q = collection(db, 'events');
      const constraints = [];

      if (status && status !== 'all') {
        constraints.push(where('status', '==', status));
      }
      if (category && category !== 'all') {
        constraints.push(where('category', '==', category));
      }

      const querySnapshot = await getDocs(query(q, ...constraints));
      events = querySnapshot.docs.map(doc => ({ eventId: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('Firestore fetch failed, falling back to local events:', err.message);
      events = getStoredEvents();
    }
  }

  // Coordinator filter
  if (coordinatorUid) {
    events = events.filter(e => Array.isArray(e.coordinatorUids) && e.coordinatorUids.includes(coordinatorUid));
  }

  // In-memory text search
  if (search && search.trim()) {
    const qStr = search.toLowerCase();
    events = events.filter(e =>
      (e.title && e.title.toLowerCase().includes(qStr)) ||
      (e.venue && e.venue.toLowerCase().includes(qStr)) ||
      (e.category && e.category.toLowerCase().includes(qStr))
    );
  }

  return events;
}

/**
 * Get single event by ID.
 */
export async function getEventById(eventId) {
  if (!isConfigured) {
    const all = getStoredEvents();
    return all.find(e => e.eventId === eventId) || null;
  }

  try {
    const docSnap = await getDoc(doc(db, 'events', eventId));
    if (docSnap.exists()) {
      return { eventId: docSnap.id, ...docSnap.data() };
    }
  } catch (err) {
    console.warn('Error reading event from Firestore:', err);
  }
  return getStoredEvents().find(e => e.eventId === eventId) || null;
}

/**
 * Create a new event.
 */
export async function createEvent(eventData, creatorUid) {
  if (!isConfigured) {
    const newEvent = {
      eventId: 'evt_' + Date.now(),
      ...eventData,
      registeredCount: 0,
      createdBy: creatorUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const events = getStoredEvents();
    events.unshift(newEvent);
    saveStoredEvents(events);
    return newEvent;
  }

  const payload = {
    ...eventData,
    startAt: Timestamp.fromDate(new Date(eventData.startAt)),
    endAt: Timestamp.fromDate(new Date(eventData.endAt)),
    registrationDeadline: Timestamp.fromDate(new Date(eventData.registrationDeadline)),
    registeredCount: 0,
    createdBy: creatorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'events'), payload);
  return { eventId: docRef.id, ...payload };
}

/**
 * Update an existing event.
 */
export async function updateEvent(eventId, updateData) {
  if (!isConfigured) {
    const events = getStoredEvents();
    const index = events.findIndex(e => e.eventId === eventId);
    if (index !== -1) {
      events[index] = { ...events[index], ...updateData, updatedAt: new Date().toISOString() };
      saveStoredEvents(events);
      return events[index];
    }
    throw new Error('Event not found.');
  }

  const ref = doc(db, 'events', eventId);
  const payload = { ...updateData, updatedAt: serverTimestamp() };
  if (updateData.startAt) payload.startAt = Timestamp.fromDate(new Date(updateData.startAt));
  if (updateData.endAt) payload.endAt = Timestamp.fromDate(new Date(updateData.endAt));
  if (updateData.registrationDeadline) payload.registrationDeadline = Timestamp.fromDate(new Date(updateData.registrationDeadline));

  await updateDoc(ref, payload);
  return { eventId, ...updateData };
}

/**
 * Change event status (published, cancelled, archived).
 */
export async function setEventStatus(eventId, status) {
  return updateEvent(eventId, { status });
}
