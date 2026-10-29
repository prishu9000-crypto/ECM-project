const crypto = require('crypto');

// Secret key for HMAC token signing (in production, loaded from environment secrets like process.env.QR_SIGNING_SECRET)
const QR_SIGNING_SECRET = process.env.QR_SIGNING_SECRET || 'event-cloud-manager-default-secure-hmac-key-2026';
const DEFAULT_EXPIRY_SECONDS = 60; // 60 seconds dynamic token rotation

/**
 * Creates a cryptographically signed attendance QR token.
 * Payload includes eventId, sessionId, nonce, expiresAt, and actionType ('check-in' | 'check-out').
 */
function generateQRToken({ eventId, sessionId, action = 'check-in', expirySeconds = DEFAULT_EXPIRY_SECONDS }) {
  const nonce = crypto.randomBytes(8).toString('hex');
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + expirySeconds;

  const payload = {
    eventId,
    sessionId,
    action,
    nonce,
    iat: issuedAt,
    exp: expiresAt
  };

  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', QR_SIGNING_SECRET)
    .update(serialized)
    .digest('base64url');

  return `${serialized}.${signature}`;
}

/**
 * Validates and decodes a signed QR token.
 * Throws an informative error if invalid or expired.
 */
function verifyQRToken(tokenString) {
  if (!tokenString || typeof tokenString !== 'string') {
    throw new Error('INVALID_TOKEN: Missing or invalid token format.');
  }

  const parts = tokenString.split('.');
  if (parts.length !== 2) {
    throw new Error('INVALID_TOKEN: Malformed token structure.');
  }

  const [serialized, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', QR_SIGNING_SECRET)
    .update(serialized)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('SECURITY_ERROR: QR token cryptographic signature mismatch or token forged.');
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8'));
  } catch (err) {
    throw new Error('INVALID_TOKEN: Unable to decode token payload.');
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (payload.exp < currentTimestamp) {
    throw new Error(`EXPIRED_TOKEN: QR code expired ${currentTimestamp - payload.exp} seconds ago. Please scan a freshly refreshed QR code.`);
  }

  return payload;
}

module.exports = {
  generateQRToken,
  verifyQRToken,
  DEFAULT_EXPIRY_SECONDS
};
