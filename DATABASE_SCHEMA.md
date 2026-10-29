# Cloud Firestore Database Schema

## 1. Collections Architecture

### A. `users` Collection
- **Document ID**: Firebase Authentication `uid`
- **Purpose**: Stores student, coordinator, and administrator profiles and metadata.
- **Fields**:
  - `uid` (`string`): Firebase Auth unique identifier.
  - `fullName` (`string`): Full legal/academic name.
  - `email` (`string`): Official college email address.
  - `normalizedEmail` (`string`): Lowercased trimmed email.
  - `role` (`string`): `'admin' | 'coordinator' | 'student'`. Protected against student self-promotion.
  - `rollNumber` (`string`, optional): Student university roll number (e.g. `21CS042`).
  - `normalizedRollNumber` (`string`, optional): Uppercased sanitized roll number.
  - `department` (`string`): Academic degree program.
  - `academicYear` (`string`): Year of study (e.g. `Final Year (4th)`).
  - `section` (`string`): Class section (`A`, `B`, etc.).
  - `accountStatus` (`string`): `'active' | 'suspended'`.
  - `createdAt` (`timestamp`): Registration timestamp.
  - `updatedAt` (`timestamp`): Last modified timestamp.

### B. `events` Collection
- **Document ID**: Auto-generated `eventId`
- **Purpose**: College workshops, hackathons, and cultural festivals.
- **Fields**:
  - `eventId` (`string`): Event identifier.
  - `title` (`string`): Title of the event.
  - `description` (`string`): Detailed description.
  - `category` (`string`): Category (e.g. `Technical Workshop`, `Hackathon`).
  - `venue` (`string`): Campus hall or laboratory.
  - `startAt` (`timestamp`): Event commencement timestamp.
  - `endAt` (`timestamp`): Event conclusion timestamp.
  - `registrationDeadline` (`timestamp`): Cut-off time for registrations.
  - `maxParticipants` (`number`): Capacity limit.
  - `registeredCount` (`number`): Transactionally maintained registration count.
  - `status` (`string`): `'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled' | 'archived'`.
  - `coordinatorUids` (`array<string>`): List of assigned coordinator UIDs.
  - `attendancePolicy` (`map`): Policy configuration:
    - `requireCheckout` (`boolean`): Whether departure scan is mandatory.
    - `minAttendancePercent` (`number`): Minimum % required for certificate credit.
  - `createdBy` (`string`): Admin UID.
  - `createdAt` (`timestamp`): Creation time.

### C. `registrations` Collection
- **Document ID**: Deterministic `${eventId}_${studentUid}`
- **Purpose**: Prevents duplicate registrations under concurrent requests.
- **Fields**:
  - `registrationId` (`string`): Deterministic ID.
  - `eventId` (`string`): Target event.
  - `studentUid` (`string`): Student UID.
  - `studentName` (`string`): Student display name snapshot.
  - `rollNumber` (`string`): Roll number snapshot.
  - `registrationStatus` (`string`): `'confirmed' | 'cancelled'`.
  - `registeredAt` (`timestamp`): Confirmation timestamp.

### D. `attendanceSessions` Collection
- **Document ID**: Auto-generated `sessionId`
- **Purpose**: Real-time session opened by an authorized coordinator for displaying QR tokens.
- **Fields**:
  - `sessionId` (`string`): Session ID.
  - `eventId` (`string`): Target event ID.
  - `sessionTitle` (`string`): Title of session.
  - `createdBy` (`string`): Coordinator UID.
  - `sessionStatus` (`string`): `'active' | 'closed'`.
  - `startedAt` (`timestamp`): Session launch time.
  - `closedAt` (`timestamp`, nullable): Session termination time.

### E. `attendanceRecords` Collection
- **Document ID**: Deterministic `${eventId}_${sessionId}_${studentUid}`
- **Purpose**: Immutable verified student entry and departure record.
- **Fields**:
  - `recordId` (`string`): Deterministic ID.
  - `eventId` (`string`): Associated event ID.
  - `attendanceSessionId` (`string`): Associated session ID.
  - `studentUid` (`string`): Student UID.
  - `studentName` (`string`): Student name.
  - `rollNumber` (`string`): University roll number.
  - `checkInAt` (`timestamp`): Server-validated arrival timestamp.
  - `checkOutAt` (`timestamp`, nullable): Server-validated departure timestamp.
  - `verifiedDurationSeconds` (`number`): Computed seconds.
  - `attendancePercentage` (`number`): Ratio of verified duration to eligible duration.
  - `status` (`string`): `'checked-in' | 'checked-out' | 'rejected'`.

### F. `auditLogs` Collection
- **Document ID**: Auto-generated `logId`
- **Purpose**: Security auditing and non-repudiation log.
- **Fields**:
  - `logId` (`string`): Audit record ID.
  - `actorUid` (`string`): Caller UID.
  - `action` (`string`): Action identifier.
  - `resourceType` (`string`): Target entity.
  - `resourceId` (`string`): Target document ID.
  - `outcome` (`string`): `'SUCCESS' | 'FAILURE'`.
  - `metadata` (`map`): Contextual data.
  - `timestamp` (`timestamp`): Server timestamp.
