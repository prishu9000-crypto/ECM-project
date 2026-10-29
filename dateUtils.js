import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

/**
 * Format a Date, Firestore Timestamp, or ISO string to standard human readable format.
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  try {
    const date = dateInput.toDate ? dateInput.toDate() : (typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput));
    return format(date, 'MMM dd, yyyy • hh:mm a');
  } catch (e) {
    return String(dateInput);
  }
}

export function formatDateOnly(dateInput) {
  if (!dateInput) return '—';
  try {
    const date = dateInput.toDate ? dateInput.toDate() : (typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput));
    return format(date, 'MMM dd, yyyy');
  } catch (e) {
    return String(dateInput);
  }
}

export function formatTimeOnly(dateInput) {
  if (!dateInput) return '—';
  try {
    const date = dateInput.toDate ? dateInput.toDate() : (typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput));
    return format(date, 'hh:mm a');
  } catch (e) {
    return String(dateInput);
  }
}

export function formatRelative(dateInput) {
  if (!dateInput) return '—';
  try {
    const date = dateInput.toDate ? dateInput.toDate() : (typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput));
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    return 'recently';
  }
}

/**
 * Formats duration seconds into readable hours and minutes.
 * E.g. 7200 -> "2h 0m", 5400 -> "1h 30m"
 */
export function formatDurationHours(seconds = 0) {
  const totalSecs = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);

  if (hours === 0 && minutes === 0) {
    return `${totalSecs}s`;
  }
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Converts seconds to exact decimal hours string (e.g. 1.50 hrs)
 */
export function toDecimalHours(seconds = 0) {
  return (Math.max(0, seconds) / 3600).toFixed(2);
}

/**
 * Calculates percentage clamped between 0 and 100 with 2 decimals.
 */
export function calculateAttendancePercentage(verifiedDurationSeconds, eligibleDurationSeconds) {
  if (!eligibleDurationSeconds || eligibleDurationSeconds <= 0) return 0;
  if (!verifiedDurationSeconds || verifiedDurationSeconds <= 0) return 0;

  const percent = (verifiedDurationSeconds / eligibleDurationSeconds) * 100;
  return Number(Math.min(100, Math.max(0, percent)).toFixed(2));
}

/**
 * Checks if registration deadline has passed.
 */
export function isRegistrationClosed(deadlineDate) {
  if (!deadlineDate) return false;
  const date = deadlineDate.toDate ? deadlineDate.toDate() : new Date(deadlineDate);
  return isAfter(new Date(), date);
}
