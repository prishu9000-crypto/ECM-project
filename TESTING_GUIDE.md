# Automated & Manual Testing Guide

## 1. Automated Vitest Test Suite
The project includes automated unit and integration tests covering business rules, token security, and duration math.

To run the automated tests:
```bash
npm run test
```

Expected output:
```
✓ src/tests/attendanceBusinessLogic.test.js (15 tests)
  ✓ 1. Attendance Duration & Hours Verification Logic
    ✓ correctly calculates decimal hours from seconds
    ✓ handles zero and clamps negative durations to 0
    ✓ formats human readable duration strings
  ✓ 2. Attendance Percentage Formula & Constraints
    ✓ correctly computes attendance percentage: (verified / eligible) * 100
    ✓ never allows attendance percentage to exceed 100%
    ✓ returns 0 when eligible duration or verified duration is zero or negative
  ✓ 3. CSV Export Security & Formula Injection Sanitization
    ✓ sanitizes strings starting with =, +, -, @ to prevent Excel formula injection
    ✓ properly escapes internal double quotes in cell content
    ✓ handles null and undefined values safely
  ✓ 4. Input Validation & Registration Rules
    ✓ validates official college email domains
    ✓ validates student roll number patterns
    ✓ enforces event timing logic: end > start, deadline <= start
  ✓ 5. QR Attendance Token Generation & Validation
    ✓ generates a valid base64 encoded token with expiry
    ✓ rejects expired QR tokens with an informative error
    ✓ rejects corrupted or forged token strings
```

## 2. Manual End-to-End Workflow Testing

### Scenario 1: Quick 1-Click Role Exploration
1. Open [http://localhost:5173/login](http://localhost:5173/login).
2. Click **Admin** under "1-Click Academic Evaluation Roles".
3. Verify access to `/admin` dashboard with metrics, events, and reports.
4. Log out and click **Coordinator**.
5. Verify access to `/coordinator` with assigned events and the "Live QR Attendance" launcher.
6. Log out and click **Student**.
7. Verify access to `/student` with verified hours, registrations, and scanner.

### Scenario 2: Two-Device QR Code Attendance
1. In Window A (or laptop screen), sign in as **Coordinator**.
2. Navigate to **Live QR Attendance** &rarr; select an event &rarr; click **Start Attendance Session**.
3. A rotating QR code displays with a 60-second animated countdown. Click **Copy** if testing on a single desktop.
4. In Window B (or smartphone browser), sign in as **Student**.
5. Navigate to **Scan QR Attendance** &rarr; switch to **Manual / Test Token** tab &rarr; paste the token &rarr; click **Verify Attendance Token**.
6. Observe instant confirmation: *"Check-In Confirmed!"*.
7. In Window A, toggle to **Check-Out Mode**.
8. In Window B, scan/paste the check-out token.
9. Observe instant calculation: *"Checked out! Verified: X.XX hrs (XX%)"*.
10. Navigate to **Verified Hours & History** and click **Download Official Certificate (PDF)**.
