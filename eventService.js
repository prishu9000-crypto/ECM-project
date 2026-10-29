const admin = require('firebase-admin');
const { requireAdmin, requireAssignedCoordinator } = require('../security/roles');
const { recordAuditLog } = require('../utils/auditLogger');

/**
 * Validates event timing and logic.
 */
function validateEventPayload(data) {
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    throw new Error('VALIDATION_ERROR: Event title must be at least 3 characters.');
  }

  const startAt = new Date(data.startAt).getTime();
  const endAt = new Date(data.endAt).getTime();
  const registrationDeadline = new Date(data.registrationDeadline).getTime();

  if (isNaN(startAt) || isNaN(endAt) || isNaN(registrationDeadline)) {
    throw new Error('VALIDATION_ERROR: Invalid date formats provided.');
  }

  if (endAt <= startAt) {
    throw new Error('VALIDATION_ERROR: Event end time must be after start time.');
  }

  if (registrationDeadline > startAt) {
    throw new Error('VALIDATION_ERROR: Registration deadline must not be after the event start time.');
  }

  const maxParticipants = parseInt(data.maxParticipants, 10);
  if (isNaN(maxParticipants) || maxParticipants <= 0) {
    throw new Error('VALIDATION_ERROR: Maximum participants must be a positive integer.');
  }

  return {
    ...data,
    maxParticipants,
    startAt: admin.firestore.Timestamp.fromDate(new Date(startAt)),
    endAt: admin.firestore.Timestamp.fromDate(new Date(endAt)),
    registrationDeadline: admin.firestore.Timestamp.fromDate(new Date(registrationDeadline)),
  };
}

/**
 * Creates a new event.
 */
async function createEvent(data, context) {
  const user = await requireAdmin(context);
  const validated = validateEventPayload(data);

  const db = admin.firestore();
  const eventRef = db.collection('events').doc();

  const eventDoc = {
    eventId: eventRef.id,
    title: validated.title.trim(),
    description: (validated.description || '').trim(),
    category: validated.category || 'Technical Workshop',
    venue: (validated.venue || '').trim(),
    startAt: validated.startAt,
    endAt: validated.endAt,
    registrationDeadline: validated.registrationDeadline,
    maxParticipants: validated.maxParticipants,
    registeredCount: 0,
    status: validated.status || 'published', // 'draft', 'published', 'ongoing', 'completed', 'cancelled', 'archived'
    coordinatorUids: Array.isArray(validated.coordinatorUids) ? validated.coordinatorUids : [],
    attendancePolicy: validated.attendancePolicy || {
      requireCheckout: true,
      minAttendancePercent: 75,
      allowLateCheckin: true
    },
    createdBy: user.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await eventRef.set(eventDoc);

  await recordAuditLog({
    actorUid: user.uid,
    action: 'EVENT_CREATED',
    resourceType: 'event',
    resourceId: eventRef.id,
    outcome: 'SUCCESS',
    metadata: { title: eventDoc.title, category: eventDoc.category }
  });

  return { success: true, eventId: eventRef.id, message: 'Event successfully created.' };
}

/**
 * Updates an existing event.
 */
async function updateEvent(data, context) {
  const { eventId, ...updateFields } = data;
  if (!eventId) {
    throw new Error('VALIDATION_ERROR: Missing eventId.');
  }

  const user = await requireAssignedCoordinator(context, eventId);
  const db = admin.firestore();
  const eventRef = db.collection('events').doc(eventId);
  const existing = await eventRef.get();

  if (!existing.exists) {
    throw new Error('NOT_FOUND: Event not found.');
  }

  const existingData = existing.data();
  if (existingData.status === 'archived') {
    throw new Error('INVALID_STATE: Archived events cannot be modified.');
  }

  const merged = { ...existingData, ...updateFields };
  const validated = validateEventPayload(merged);

  const payloadToUpdate = {
    title: validated.title,
    description: validated.description,
    category: validated.category,
    venue: validated.venue,
    startAt: validated.startAt,
    endAt: validated.endAt,
    registrationDeadline: validated.registrationDeadline,
    maxParticipants: validated.maxParticipants,
    status: validated.status,
    coordinatorUids: validated.coordinatorUids,
    attendancePolicy: validated.attendancePolicy,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await eventRef.update(payloadToUpdate);

  await recordAuditLog({
    actorUid: user.uid,
    action: 'EVENT_UPDATED',
    resourceType: 'event',
    resourceId: eventId,
    outcome: 'SUCCESS',
    metadata: { title: validated.title }
  });

  return { success: true, eventId, message: 'Event successfully updated.' };
}

/**
 * Soft cancels or archives an event.
 */
async function changeEventStatus({ eventId, status }, context) {
  const user = await requireAdmin(context);
  const allowedStatuses = ['draft', 'published', 'ongoing', 'completed', 'cancelled', 'archived'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('VALIDATION_ERROR: Invalid event status specified.');
  }

  const db = admin.firestore();
  const eventRef = db.collection('events').doc(eventId);
  const snap = await eventRef.get();
  if (!snap.exists) {
    throw new Error('NOT_FOUND: Event not found.');
  }

  await eventRef.update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await recordAuditLog({
    actorUid: user.uid,
    action: `EVENT_STATUS_${status.toUpperCase()}`,
    resourceType: 'event',
    resourceId: eventId,
    outcome: 'SUCCESS',
    metadata: { previousStatus: snap.data().status, newStatus: status }
  });

  return { success: true, eventId, status, message: `Event status updated to ${status}.` };
}

module.exports = {
  createEvent,
  updateEvent,
  changeEventStatus
};
