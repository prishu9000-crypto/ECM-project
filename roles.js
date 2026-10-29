const admin = require('firebase-admin');

/**
 * Validates that the caller is authenticated and retrieves their user record.
 * @param {object} context - Cloud Function callable context
 * @returns {object} { uid, email, role }
 */
async function getAuthenticatedUser(context) {
  if (!context.auth) {
    throw new Error('UNAUTHENTICATED: Authentication required.');
  }

  const { uid, token } = context.auth;
  let role = token.role || (token.admin ? 'admin' : null);

  // If not present in token custom claims, fetch from Firestore 'users' collection
  if (!role) {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (userDoc.exists) {
      role = userDoc.data().role || 'student';
    } else {
      role = 'student';
    }
  }

  return { uid, email: token.email, role };
}

/**
 * Verifies that the caller has 'admin' role.
 */
async function requireAdmin(context) {
  const user = await getAuthenticatedUser(context);
  if (user.role !== 'admin') {
    throw new Error('PERMISSION_DENIED: Administrator access required.');
  }
  return user;
}

/**
 * Verifies that the caller has at least 'coordinator' role (or 'admin').
 */
async function requireCoordinator(context) {
  const user = await getAuthenticatedUser(context);
  if (user.role !== 'coordinator' && user.role !== 'admin') {
    throw new Error('PERMISSION_DENIED: Event Coordinator access required.');
  }
  return user;
}

/**
 * Verifies that the caller is an assigned coordinator for the specified event (or admin).
 */
async function requireAssignedCoordinator(context, eventId) {
  const user = await getAuthenticatedUser(context);
  if (user.role === 'admin') {
    return user;
  }

  if (user.role !== 'coordinator') {
    throw new Error('PERMISSION_DENIED: Coordinator permissions required.');
  }

  const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
  if (!eventDoc.exists) {
    throw new Error('NOT_FOUND: Event does not exist.');
  }

  const eventData = eventDoc.data();
  const coordinatorUids = eventData.coordinatorUids || [];

  if (!coordinatorUids.includes(user.uid)) {
    throw new Error('PERMISSION_DENIED: You are not assigned as a coordinator for this event.');
  }

  return user;
}

module.exports = {
  getAuthenticatedUser,
  requireAdmin,
  requireCoordinator,
  requireAssignedCoordinator
};
