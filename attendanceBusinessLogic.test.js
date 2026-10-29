import { describe, it, expect } from 'vitest';
import {
  formatDurationHours,
  toDecimalHours,
  calculateAttendancePercentage
} from '../lib/dateUtils';
import { escapeCSVCell } from '../lib/csvExport';
import {
  validateCollegeEmail,
  validateRollNumber,
  validateEventInput
} from '../lib/validation';
import {
  createEncodedToken,
  decodeAndValidateToken
} from '../services/attendanceService';

describe('1. Attendance Duration & Hours Verification Logic', () => {
  it('correctly calculates decimal hours from seconds', () => {
    expect(toDecimalHours(3600)).toBe('1.00');
    expect(toDecimalHours(5400)).toBe('1.50');
    expect(toDecimalHours(7200)).toBe('2.00');
  });

  it('handles zero and clamps negative durations to 0', () => {
    expect(toDecimalHours(0)).toBe('0.00');
    expect(toDecimalHours(-500)).toBe('0.00');
    expect(formatDurationHours(-100)).toBe('0s');
  });

  it('formats human readable duration strings', () => {
    expect(formatDurationHours(3600)).toBe('1h 0m');
    expect(formatDurationHours(5400)).toBe('1h 30m');
    expect(formatDurationHours(45)).toBe('45s');
  });
});

describe('2. Attendance Percentage Formula & Constraints', () => {
  it('correctly computes attendance percentage: (verified / eligible) * 100', () => {
    // 5 hours verified out of 6 hours eligible = 83.33%
    const percent = calculateAttendancePercentage(18000, 21600);
    expect(percent).toBe(83.33);
  });

  it('never allows attendance percentage to exceed 100%', () => {
    // Student attended 8 hours for a 6 hour event
    const percent = calculateAttendancePercentage(28800, 21600);
    expect(percent).toBe(100);
  });

  it('returns 0 when eligible duration or verified duration is zero or negative', () => {
    expect(calculateAttendancePercentage(0, 3600)).toBe(0);
    expect(calculateAttendancePercentage(3600, 0)).toBe(0);
    expect(calculateAttendancePercentage(-100, 3600)).toBe(0);
  });
});

describe('3. CSV Export Security & Formula Injection Sanitization', () => {
  it('sanitizes strings starting with =, +, -, @ to prevent Excel formula injection', () => {
    expect(escapeCSVCell('=SUM(A1:A10)')).toBe(`"'=SUM(A1:A10)"`);
    expect(escapeCSVCell('+12345')).toBe(`"'+12345"`);
    expect(escapeCSVCell('-DANGEROUS')).toBe(`"'-DANGEROUS"`);
    expect(escapeCSVCell('@COMMAND')).toBe(`"'@COMMAND"`);
  });

  it('properly escapes internal double quotes in cell content', () => {
    expect(escapeCSVCell('Aditya "Ace" Verma')).toBe(`"Aditya ""Ace"" Verma"`);
  });

  it('handles null and undefined values safely', () => {
    expect(escapeCSVCell(null)).toBe('""');
    expect(escapeCSVCell(undefined)).toBe('""');
  });
});

describe('4. Input Validation & Registration Rules', () => {
  it('validates official college email domains', () => {
    expect(validateCollegeEmail('aditya@apex.edu.in', 'apex.edu.in').valid).toBe(true);
    expect(validateCollegeEmail('external@gmail.com', 'apex.edu.in').valid).toBe(false);
    expect(validateCollegeEmail('not-an-email', 'apex.edu.in').valid).toBe(false);
  });

  it('validates student roll number patterns', () => {
    expect(validateRollNumber('21CS042').valid).toBe(true);
    expect(validateRollNumber('CS-2024-001').valid).toBe(true);
    expect(validateRollNumber('').valid).toBe(false);
    expect(validateRollNumber('AB').valid).toBe(false); // too short
  });

  it('enforces event timing logic: end > start, deadline <= start', () => {
    const validEvent = {
      title: 'DevOps Workshop',
      venue: 'Lab 3',
      startAt: '2026-11-10T10:00',
      endAt: '2026-11-10T14:00',
      registrationDeadline: '2026-11-09T23:59',
      maxParticipants: 100
    };
    expect(validateEventInput(validEvent).valid).toBe(true);

    // Invalid: end before start
    const invalidEnd = {
      ...validEvent,
      endAt: '2026-11-10T09:00'
    };
    expect(validateEventInput(invalidEnd).valid).toBe(false);

    // Invalid: deadline after start
    const invalidDeadline = {
      ...validEvent,
      registrationDeadline: '2026-11-10T11:00'
    };
    expect(validateEventInput(invalidDeadline).valid).toBe(false);
  });
});

describe('5. QR Attendance Token Generation & Validation', () => {
  it('generates a valid base64 encoded token with expiry', () => {
    const token = createEncodedToken({
      eventId: 'evt_101',
      sessionId: 'sess_202',
      action: 'check-in',
      expirySeconds: 60
    });

    expect(typeof token).toBe('string');
    const decoded = decodeAndValidateToken(token);
    expect(decoded.eventId).toBe('evt_101');
    expect(decoded.sessionId).toBe('sess_202');
    expect(decoded.action).toBe('check-in');
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects expired QR tokens with an informative error', () => {
    // Manually create a token expired 10 seconds ago
    const expiredPayload = {
      eventId: 'evt_101',
      sessionId: 'sess_202',
      action: 'check-in',
      iat: Math.floor(Date.now() / 1000) - 70,
      exp: Math.floor(Date.now() / 1000) - 10
    };
    const expiredToken = btoa(JSON.stringify(expiredPayload));

    expect(() => decodeAndValidateToken(expiredToken)).toThrow(/expired/i);
  });

  it('rejects corrupted or forged token strings', () => {
    expect(() => decodeAndValidateToken('random-invalid-string-123')).toThrow();
  });
});
