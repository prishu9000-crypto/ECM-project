const admin = require('firebase-admin');
const { getAuthenticatedUser } = require('../security/roles');
const { recordAuditLog } = require('../utils/auditLogger');

/**
 * Registers an authenticated student for an event using a Firestore transaction.
 */
async function registerForEvent(data, context) {
  const user = await getAuthenticatedUser(context);
  const { eventId } = data;

  if (!eventId) {
    throw new Error('VALIDATION_ERROR: Missing eventId.');
  }

  const db = admin.firestore();
  const eventRef = db.collection('events').doc(eventId);
  const registrationId = `${eventId}_${user.uid}`;
  const regRef = db.collection('registrations').doc(registrationId);
  const userRef = db.collection('users').doc(user.uid);

  const result = await db.runTransaction(async (transaction) => {
    const eventDoc = await transaction.get(eventRef);
    if (!eventDoc.exists) {
      throw new Error('NOT_FOUND: Event does not exist.');
    }

    const event = eventDoc.data();
    if (event.status !== 'published') {
      throw new Error(`INVALID_STATE: Event is ${event.status}. Registrations are only allowed for published events.`);
    }

    const now = Date.now();
    const deadlineMs = event.registrationDeadline.toMillis();
    if (now > deadlineMs) {
      throw new Error('DEADLINE_PASSED: Registration for this event is closed.');
    }

    const regDoc = await transaction.get(regRef);
    if (regDoc.exists && regDoc.data().registrationStatus === 'confirmed') {
      throw new Error('ALREADY_REGISTERED: You are already registered for this event.');
    }

    const currentCount = event.registeredCount || 0;
    if (currentCount >= event.maxParticipants) {
      throw new Error('EVENT_FULL: This event has reached its maximum participant capacity.');
    }

    const userProfileDoc = await transaction.get(userRef);
    const userProfile = userProfileDoc.exists ? userProfileDoc.data() : {};

    // Create or reactivate registration
    transaction.set(regRef, {
      registrationId,
      eventId,
      studentUid: user.uid,
      studentName: userProfile.fullName || 'Student',
      studentEmail: userProfile.email || user.email,
      rollNumber: userProfile.rollNumber || '',
      department: userProfile.department || '',
      academicYear: userProfile.academicYear || '',
      section: userProfile.section || '',
      registrationStatus: 'confirmed',
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Increment registeredCount
    transaction.update(eventRef, {
      registeredCount: currentCount + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { registrationId, title: event.title };
  });

  await recordAuditLog({
    actorUid: user.uid,
    action: 'EVENT_REGISTRATION_CREATED',
    resourceType: 'registration',
    resourceId: result.registrationId,
    outcome: 'SUCCESS',
    metadata: { eventId, eventTitle: result.title }
  });

  return { success: true, registrationId: result.registrationId, message: `Successfully registered for ${result.title}.` };
}

/**
 * Cancels a student's registration for an event.
 */
async function cancelRegistration(data, context) {
  const user = await getAuthenticatedUser(context);
  const { eventId } = data;

  const db = admin.firestore();
  const eventRef = db.collection('events').doc(eventId);
  const registrationId = `${eventId}_${user.uid}`;
  const regRef = db.collection('registrations').doc(registrationId);

  await db.runTransaction(async (transaction) => {
    const regDoc = await transaction.get(regRef);
    if (!regDoc.exists || regDoc.data().registrationStatus === 'cancelled') {
      throw new Error('NOT_FOUND: Active registration not found.');
    }

    const eventDoc = await transaction.get(eventRef);
    const currentCount = (eventDoc.exists && eventDoc.data().registeredCount > 0)
      ? eventDoc.data().registeredCount - 1
      : 0;

    transaction.update(regRef, {
      registrationStatus: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (eventDoc.exists) {
      transaction.update(eventRef, {
        registeredCount: currentCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

  return { success: true, message: 'Registration cancelled.' };
}

module.exports = {
  registerForEvent,
  cancelRegistration
};
