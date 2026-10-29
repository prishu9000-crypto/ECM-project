const admin = require('firebase-admin');

/**
 * Writes an immutable audit log record to Cloud Firestore.
 * @param {object} params
 * @param {string} params.actorUid - UID of the user performing the action
 * @param {string} params.action - E.g. 'EVENT_CREATED', 'COORDINATOR_ASSIGNED', 'CHECK_IN', 'ATTENDANCE_CORRECTED'
 * @param {string} params.resourceType - E.g. 'event', 'attendanceRecord', 'user'
 * @param {string} params.resourceId - ID of the target resource
 * @param {string} params.outcome - 'SUCCESS' | 'FAILURE'
 * @param {object} [params.metadata] - Non-sensitive context details
 */
async function recordAuditLog({ actorUid, action, resourceType, resourceId, outcome = 'SUCCESS', metadata = {} }) {
  try {
    const db = admin.firestore();
    const logRef = db.collection('auditLogs').doc();

    await logRef.set({
      logId: logRef.id,
      actorUid: actorUid || 'SYSTEM',
      action,
      resourceType,
      resourceId,
      outcome,
      metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Audit log failure should not crash the main operation, but must be logged to Cloud Logging
  }
}

module.exports = {
  recordAuditLog
};
