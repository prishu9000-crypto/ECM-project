# Attendance State Machine & Verification Workflow

## 1. The Verification Sequence

```mermaid
sequenceDiagram
    autonumber
    actor C as Faculty Coordinator
    actor S as Authenticated Student
    participant FE as Web App Frontend
    participant CF as Cloud Functions Backend
    participant DB as Cloud Firestore

    Note over C,DB: Phase 1: Attendance Session Activation
    C->>FE: Click "Start Attendance Session"
    FE->>CF: createAttendanceSession(eventId)
    CF->>DB: Verify Coordinator Assignment
    CF->>DB: Create session with status = "active"
    CF->>FE: Return Session ID + Signed QR Token
    FE->>FE: Render Canvas QR Code + 60s Countdown

    Note over S,DB: Phase 2: Student Check-In
    S->>FE: Open Scanner & Aim Camera at Coordinator Screen
    FE->>CF: checkInStudent(tokenString)
    CF->>CF: Verify Cryptographic Signature & Expiry (< 60s)
    CF->>DB: Verify Student Registration for Event
    CF->>DB: Transactionally write attendanceRecord (checkInAt = serverTimestamp)
    CF->>FE: Return Check-In Confirmation
    FE->>S: Display "Check-In Confirmed"

    Note over S,DB: Phase 3: Student Check-Out & Hours Calculation
    C->>FE: Toggle to "Check-Out QR Mode"
    FE->>CF: issueAttendanceToken(action = "check-out")
    CF->>FE: Return Fresh Check-Out QR Token
    S->>FE: Scan Check-Out QR Code
    FE->>CF: checkOutStudent(tokenString)
    CF->>DB: Fetch Check-In Timestamp
    CF->>CF: Compute Verified Duration = CheckOut - CheckIn
    CF->>CF: Compute Attendance Percentage = (Duration / EventDuration) * 100
    CF->>DB: Update attendanceRecord (status = "checked-out")
    CF->>FE: Return Verified Hours & Attendance Percentage
    FE->>S: Display Certificate Summary & Hours
```

## 2. Attendance Record State Machine
- `not_checked_in`: Student registered for the event; has not scanned active check-in token.
- `checked-in`: Student scanned valid check-in token; start timestamp captured.
- `checked-out`: Student scanned valid check-out token; verified duration calculated and attendance percentage locked.
- `incomplete`: Event concluded but student never scanned checkout. Incomplete records count zero verified duration unless an authorized administrative correction is applied.
- `rejected`: Scan rejected due to expired token, invalid signature, or unregistered student.
