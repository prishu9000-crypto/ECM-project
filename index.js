const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const eventService = require('./events/eventService');
const regService = require('./registrations/registrationService');
const attendanceService = require('./attendance/attendanceService');
const reportService = require('./reports/reportService');
const userMgmt = require('./auth/userManagement');

// Event Management
exports.createEvent = functions.https.onCall(eventService.createEvent);
exports.updateEvent = functions.https.onCall(eventService.updateEvent);
exports.changeEventStatus = functions.https.onCall(eventService.changeEventStatus);

// Registrations
exports.registerForEvent = functions.https.onCall(regService.registerForEvent);
exports.cancelRegistration = functions.https.onCall(regService.cancelRegistration);

// Attendance & QR Tokens
exports.createAttendanceSession = functions.https.onCall(attendanceService.createAttendanceSession);
exports.issueAttendanceToken = functions.https.onCall(attendanceService.issueAttendanceToken);
exports.closeAttendanceSession = functions.https.onCall(attendanceService.closeAttendanceSession);
exports.checkInStudent = functions.https.onCall(attendanceService.checkInStudent);
exports.checkOutStudent = functions.https.onCall(attendanceService.checkOutStudent);
exports.correctAttendanceRecord = functions.https.onCall(attendanceService.correctAttendanceRecord);

// Reports & Analytics
exports.getEventAttendanceReport = functions.https.onCall(reportService.getEventAttendanceReport);
exports.getStudentAttendanceSummary = functions.https.onCall(reportService.getStudentAttendanceSummary);

// Coordinator & User Management
exports.createAdmin = functions.https.onCall(userMgmt.createAdmin);
exports.createCoordinator = functions.https.onCall(userMgmt.createCoordinator);
exports.createStudent = functions.https.onCall(userMgmt.createStudent);
exports.deleteUser = functions.https.onCall(userMgmt.deleteUser);
exports.setUserStatus = functions.https.onCall(userMgmt.setUserStatus);
exports.assignCoordinatorToEvent = functions.https.onCall(userMgmt.assignCoordinatorToEvent);
exports.bootstrapFirstAdmin = functions.https.onCall(userMgmt.bootstrapFirstAdmin);
