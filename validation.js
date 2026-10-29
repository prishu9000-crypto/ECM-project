/**
 * Validates college student email against configured domain.
 */
export function validateCollegeEmail(email, configuredDomain = import.meta.env.VITE_COLLEGE_EMAIL_DOMAIN) {
  if (!email || typeof email !== 'string') return { valid: false, message: 'Email address is required.' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'Please enter a valid email format.' };
  }

  // If a specific college domain is configured and not default wildcard
  if (configuredDomain && configuredDomain !== '*' && !email.toLowerCase().endsWith(`@${configuredDomain.toLowerCase()}`)) {
    return {
      valid: false,
      message: `Must be your official college email ending with @${configuredDomain}`
    };
  }

  return { valid: true };
}

/**
 * Validates student roll number format (e.g. 21CS045, CS-2024-001)
 */
export function validateRollNumber(rollNumber) {
  if (!rollNumber || typeof rollNumber !== 'string') {
    return { valid: false, message: 'Roll number is required.' };
  }

  const clean = rollNumber.trim().toUpperCase();
  if (clean.length < 3 || clean.length > 20) {
    return { valid: false, message: 'Roll number must be between 3 and 20 characters.' };
  }

  if (!/^[A-Z0-9\-_/]+$/.test(clean)) {
    return { valid: false, message: 'Roll number contains invalid special characters.' };
  }

  return { valid: true, normalized: clean };
}

/**
 * Validates password strength.
 */
export function validatePassword(password) {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters.' };
  }
  return { valid: true };
}

/**
 * Validates event creation and update fields.
 */
export function validateEventInput(event) {
  const errors = {};

  if (!event.title || event.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  }

  if (!event.venue || event.venue.trim().length < 2) {
    errors.venue = 'Venue is required.';
  }

  const startMs = new Date(event.startAt).getTime();
  const endMs = new Date(event.endAt).getTime();
  const deadlineMs = new Date(event.registrationDeadline).getTime();

  if (isNaN(startMs)) errors.startAt = 'Valid start date/time required.';
  if (isNaN(endMs)) errors.endAt = 'Valid end date/time required.';
  if (isNaN(deadlineMs)) errors.registrationDeadline = 'Valid registration deadline required.';

  if (startMs && endMs && endMs <= startMs) {
    errors.endAt = 'Event end time must be after the start time.';
  }

  if (deadlineMs && startMs && deadlineMs > startMs) {
    errors.registrationDeadline = 'Registration deadline cannot be after the event starts.';
  }

  const max = parseInt(event.maxParticipants, 10);
  if (isNaN(max) || max <= 0) {
    errors.maxParticipants = 'Participant capacity must be at least 1.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
