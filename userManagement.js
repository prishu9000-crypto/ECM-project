const admin = require('firebase-admin');
const { requireAdmin } = require('../security/roles');
const { recordAuditLog } = require('../utils/auditLogger');

/**
 * Creates a new administrator by an existing admin.
 */
async function createAdmin(data, context) {
  const adminCaller = await requireAdmin(context);
  const { email, password, fullName, department } = data;

  if (!email || !password || !fullName) {
    throw new Error('VALIDATION_ERROR: Email, password, and full name are required.');
  }

  // Create Firebase Auth user
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: fullName,
    emailVerified: true
  });

  // Assign admin custom claim
  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: 'admin',
    admin: true
  });

  const db = admin.firestore();
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    fullName,
    email,
    normalizedEmail: email.toLowerCase().trim(),
    role: 'admin',
    department: department || 'General Administration',
    accountStatus: 'active',
    createdBy: adminCaller.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await recordAuditLog({
    actorUid: adminCaller.uid,
    action: 'ADMINISTRATOR_CREATED',
    resourceType: 'user',
    resourceId: userRecord.uid,
    outcome: 'SUCCESS',
    metadata: { email, department }
  });

  return { success: true, uid: userRecord.uid, message: `Administrator ${fullName} created successfully.` };
}

/**
 * Invites / registers a coordinator by Admin. Sets custom claims and creates profile.
 */
async function createCoordinator(data, context) {
  const adminCaller = await requireAdmin(context);
  const { email, password, fullName, department } = data;

  if (!email || !password || !fullName) {
    throw new Error('VALIDATION_ERROR: Email, password, and full name are required.');
  }

  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: fullName,
    emailVerified: true
  });

  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: 'coordinator'
  });

  const db = admin.firestore();
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    fullName,
    email,
    normalizedEmail: email.toLowerCase().trim(),
    role: 'coordinator',
    department: department || 'General',
    accountStatus: 'active',
    createdBy: adminCaller.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await recordAuditLog({
    actorUid: adminCaller.uid,
    action: 'COORDINATOR_CREATED',
    resourceType: 'user',
    resourceId: userRecord.uid,
    outcome: 'SUCCESS',
    metadata: { email, department }
  });

  return { success: true, uid: userRecord.uid, message: `Coordinator ${fullName} created successfully.` };
}

/**
 * Creates a student record by an Administrator.
 */
async function createStudent(data, context) {
  const adminCaller = await requireAdmin(context);
  const { email, password, fullName, rollNumber, department, academicYear, section } = data;

  if (!email || !password || !fullName || !rollNumber) {
    throw new Error('VALIDATION_ERROR: Email, password, full name, and roll number are required.');
  }

  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: fullName,
    emailVerified: true
  });

  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: 'student'
  });

  const db = admin.firestore();
  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    fullName,
    email,
    normalizedEmail: email.toLowerCase().trim(),
    rollNumber: rollNumber.toUpperCase().trim(),
    normalizedRollNumber: rollNumber.toUpperCase().trim(),
    role: 'student',
    department: department || 'Computer Science & Engineering',
    academicYear: academicYear || 'Final Year (4th)',
    section: section || 'A',
    accountStatus: 'active',
    createdBy: adminCaller.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await recordAuditLog({
    actorUid: adminCaller.uid,
    action: 'STUDENT_CREATED_BY_ADMIN',
    resourceType: 'user',
    resourceId: userRecord.uid,
    outcome: 'SUCCESS',
    metadata: { email, rollNumber, department }
  });

  return { success: true, uid: userRecord.uid, message: `Student ${fullName} (${rollNumber}) created successfully.` };
}

/**
 * Removes / deletes a user permanently.
 */
async function deleteUser(data, context) {
  const adminCaller = await requireAdmin(context);
  const { targetUid } = data;

  if (!targetUid) {
    throw new Error('VALIDATION_ERROR: Target user UID is required.');
  }

  if (targetUid === adminCaller.uid) {
    throw new Error('SECURITY_ERROR: Cannot delete your own active administrator account.');
  }

  const db = admin.firestore();
  const targetDoc = await db.collection('users').doc(targetUid).get();
  const targetData = targetDoc.exists ? targetDoc.data() : {};

  // Delete from Firebase Auth if exists
  try {
    await admin.auth().deleteUser(targetUid);
  } catch (err) {
    console.warn(`Auth user delete skipped for ${targetUid}:`, err.message);
  }

  // Delete from Firestore
  await db.collection('users').doc(targetUid).delete();

  await recordAuditLog({
    actorUid: adminCaller.uid,
    action: 'USER_DELETED',
    resourceType: 'user',
    resourceId: targetUid,
    outcome: 'SUCCESS',
    metadata: { role: targetData.role, email: targetData.email, fullName: targetData.fullName }
  });

  return { success: true, targetUid, message: 'User permanently removed.' };
}

/**
 * Toggles or updates user status (active, suspended, inactive).
 */
async function setUserStatus(data, context) {
  const adminCaller = await requireAdmin(context);
  const { targetUid, status } = data;

  if (!targetUid || !status) {
    throw new Error('VALIDATION_ERROR: targetUid and status are required.');
  }

  if (targetUid === adminCaller.uid && status !== 'active') {
    throw new Error('SECURITY_ERROR: You cannot deactivate your own administrative account.');
  }

  const db = admin.firestore();
  await db.collection('users').doc(targetUid).update({
    accountStatus: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await recordAuditLog({
    actorUid: adminCaller.uid,
    action: 'USER_STATUS_UPDATED',
    resourceType: 'user',
    resourceId: targetUid,
    outcome: 'SUCCESS',
    metadata: { newStatus: status }
  });

  return { success: true, targetUid, status, message: `User status updated to ${status}.` };
}

/**
 * Assigns or unassigns coordinators to an event.
 */
async function assignCoordinatorToEvent(data, context) {
  const adminCaller = await requireAdmin(context);
  const { eventId, coordinatorUids } = data;

  if (!eventId || !Array.isArray(coordinatorUids)) {
    throw new Error('VALIDATION_ERROR: eventId and coordinatorUids array are required.');
  }

  const db = admin.firestore();
  const eventRef = db.collection('events').doc(eventId);

  await eventRef.update({
    coordinatorUids,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await recordAuditLog({
    actorUid: adminCaller.uid,
    action: 'COORDINATORS_ASSIGNED',
    resourceType: 'event',
    resourceId: eventId,
    outcome: 'SUCCESS',
    metadata: { assignedUids: coordinatorUids }
  });

  return { success: true, eventId, coordinatorUids, message: 'Coordinators updated successfully.' };
}

/**
 * Bootstrap First Administrator securely.
 */
async function bootstrapFirstAdmin(data, context) {
  const { email, password, fullName, setupToken } = data;

  const REQUIRED_SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN || 'INIT_ADMIN_ECM_2026';
  if (setupToken !== REQUIRED_SETUP_TOKEN) {
    throw new Error('SECURITY_ERROR: Invalid administrative bootstrap setup token.');
  }

  const db = admin.firestore();
  const adminQuery = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (!adminQuery.empty) {
    throw new Error('SECURITY_ERROR: Administrator already exists. Bootstrap is permanently disabled.');
  }

  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (e) {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName || 'System Administrator',
      emailVerified: true
    });
  }

  await admin.auth().setCustomUserClaims(userRecord.uid, {
    role: 'admin',
    admin: true
  });

  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    fullName: fullName || 'System Administrator',
    email,
    normalizedEmail: email.toLowerCase().trim(),
    role: 'admin',
    accountStatus: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, uid: userRecord.uid, message: 'Initial administrator successfully bootstrapped.' };
}

module.exports = {
  createAdmin,
  createCoordinator,
  createStudent,
  deleteUser,
  setUserStatus,
  assignCoordinatorToEvent,
  bootstrapFirstAdmin
};
