'use strict';

/**
 * ticketAuthService.js — HMAC-SHA256 Server-to-Server Auth
 *
 * Used by flowTicketRoutes to verify that requests originate from
 * ticket.6117.co.kr PHP server and have not been tampered with.
 *
 * Signature canonical form:
 *   timestamp\nnonce\nMETHOD\n/path\nfield1=val1&field2=val2&...
 *   (body fields sorted alphabetically, joined by &)
 *
 * Required env:
 *   FLOW_TICKET_SECRET  — shared HMAC secret (min 32 chars recommended)
 *
 * Headers sent by PHP:
 *   X-Ticket-Timestamp  — Unix epoch milliseconds (string)
 *   X-Ticket-Nonce      — random string, unique per request (min 16 chars)
 *   X-Ticket-Signature  — hex HMAC-SHA256
 */

const crypto = require('crypto');

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;  // ±5 minutes
const NONCE_TTL_MS           = 10 * 60 * 1000; // 10 minutes

// In-memory nonce store: Map<nonce, expiresAtMs>
// Acceptable for single-server MVP (Render single-instance).
// Replace with Redis for multi-instance deployments.
const _usedNonces = new Map();

// Housekeeping — remove expired nonces every 60s
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _usedNonces) {
    if (v < now) _usedNonces.delete(k);
  }
}, 60_000).unref();

/**
 * Build the canonical string that both PHP and Node sign/verify.
 *
 * @param {object} params
 * @param {string} params.timestamp - Unix epoch ms string
 * @param {string} params.nonce
 * @param {string} params.method    - HTTP method
 * @param {string} params.path      - request path (req.path)
 * @param {object} params.body      - parsed JSON body
 * @returns {string}
 */
function buildCanonical({ timestamp, nonce, method, path, body }) {
  const sorted = Object.keys(body || {})
    .sort()
    .map(k => `${k}=${body[k]}`)
    .join('&');
  return [timestamp, nonce, method.toUpperCase(), path, sorted].join('\n');
}

/**
 * Compute expected HMAC-SHA256 signature (hex).
 */
function computeSignature(secret, params) {
  const canonical = buildCanonical(params);
  return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
}

/**
 * Verify an incoming request from the ticket PHP server.
 *
 * @param {import('express').Request} req
 * @returns {{ valid: boolean, reason?: string }}
 */
function verify(req) {
  const secret = process.env.FLOW_TICKET_SECRET;
  if (!secret) {
    console.error('[ticketAuth] FLOW_TICKET_SECRET not configured');
    return { valid: false, reason: 'SERVER_CONFIG_ERROR' };
  }

  const timestamp = req.headers['x-ticket-timestamp'];
  const nonce     = req.headers['x-ticket-nonce'];
  const signature = req.headers['x-ticket-signature'];

  if (!timestamp || !nonce || !signature) {
    return { valid: false, reason: 'MISSING_AUTH_HEADERS' };
  }

  // Timestamp freshness check
  const tsMs = parseInt(timestamp, 10);
  if (isNaN(tsMs) || Math.abs(Date.now() - tsMs) > TIMESTAMP_TOLERANCE_MS) {
    return { valid: false, reason: 'TIMESTAMP_EXPIRED' };
  }

  // Nonce replay prevention
  if (_usedNonces.has(nonce)) {
    return { valid: false, reason: 'NONCE_REUSED' };
  }

  // Constant-time signature comparison
  const expected = computeSignature(secret, {
    timestamp,
    nonce,
    method: req.method,
    path:   req.path,
    body:   req.body,
  });

  // SHA256 hex is always exactly 64 lowercase hex characters
  if (!/^[0-9a-f]{64}$/i.test(signature)) {
    return { valid: false, reason: 'INVALID_SIGNATURE_FORMAT' };
  }

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected,  'hex');

  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  // Mark nonce as used
  _usedNonces.set(nonce, Date.now() + NONCE_TTL_MS);
  return { valid: true };
}

/**
 * Returns the nonce store size (for testing purposes only).
 * @internal
 */
function _nonceCount() { return _usedNonces.size; }

module.exports = { verify, computeSignature, buildCanonical, _nonceCount };
