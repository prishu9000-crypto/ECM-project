# Security and Threat Model

## 1. Role-Based Access Control (RBAC)
Event Cloud Manager implements least-privilege authorization using a defense-in-depth model:
- **Authentication**: Firebase Authentication manages email/password identity, session persistence, and password reset tokens. Passwords are never stored in plain text or Firestore documents.
- **Custom Claims & Profile Roles**: Administrator and Coordinator roles are granted via Firebase Admin SDK custom claims (`token.role == 'admin'`, `token.role == 'coordinator'`) and backed by Firestore profile validation.
- **Rule Enforcement**: Students are prohibited from promoting themselves to coordinator/admin, updating roll numbers once registered, or writing directly to `attendanceRecords`.

## 2. Dynamic QR Token Cryptographic Security
To defeat the common vulnerability of students taking screenshots of static QR codes and messaging them to absent peers:
1. **Short Expiry Window**: QR tokens are issued with a 60-second time-to-live (`exp = iat + 60`).
2. **Cryptographic Signing**: Tokens are structured as `base64(payload).signature` using HMAC-SHA256 with a private backend secret key.
3. **Session Binding**: Tokens encode the `eventId`, `sessionId`, `action` (`check-in` or `check-out`), and a random cryptographic nonce.
4. **Idempotency**: Repeated scans for the same student within an active session will not produce duplicate records or alter initial arrival timestamps.

## 3. Server-Side Timestamps & Duration Calculation
The client browser's local system clock is never trusted for attendance calculations. Check-in and check-out timestamps are stamped using Firebase `serverTimestamp()` on Cloud Firestore, preventing clock-skew tampering.

## 4. CSV Formula Injection Defense
When generating CSV reports for Excel or Google Sheets, cell values are analyzed. If a string starts with `= `, `+`, `-`, or `@`, it is prepended with a single quote `'` and wrapped in escaped double quotes `""`, preventing malicious spreadsheet formula execution.

## 5. Physical Presence Limitations & Institutional Reality
While rotating dynamic QR codes severely constrain remote proxy marking, **a digital QR scan alone cannot mathematically guarantee physical presence without secondary human verification**. In real institutional settings, faculty coordinators perform spot-checks and proctor the scanning zone.
