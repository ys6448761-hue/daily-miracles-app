'use strict';

/**
 * partnerPinService.js
 *
 * Shared PIN authentication for partner-confirmed operations.
 * Extracted from benefitCredentialRoutes.js manual-redeem logic.
 *
 * Policy (must not drift between callers):
 *   - SHA256(pin) comparison against partner_configs.pin_hash
 *   - Rate limit: 5 consecutive failures within 1 minute → 429
 *   - Failure recorded in partner_pin_attempts
 *   - Inactive partner treated as not found (403)
 */

const crypto = require('crypto');

const RATE_LIMIT_WINDOW   = "1 minute";
const RATE_LIMIT_MAX_FAIL = 5;

/**
 * Verify partner PIN against partner_configs.
 *
 * @param {object} db         - pg database client (query method)
 * @param {string} partnerCode
 * @param {string} partnerPin - plaintext PIN from request body
 *
 * @returns {Promise<{ id: string, partner_code: string, partner_name: string|null }>}
 *   Resolves with the matching partner_configs row on success.
 *
 * @throws {Error} with .code set to one of:
 *   PIN_RATE_LIMITED      — too many recent failures
 *   PARTNER_NOT_AUTHORIZED — unknown or inactive partner_code
 *   WRONG_PIN             — PIN does not match (failure already recorded)
 */
async function verifyPartnerPin(db, partnerCode, partnerPin) {
  // Rate-limit check
  const recentFails = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM partner_pin_attempts
     WHERE partner_code = $1
       AND failed_at > NOW() - INTERVAL '${RATE_LIMIT_WINDOW}'`,
    [partnerCode]
  );

  if (parseInt(recentFails.rows[0].cnt, 10) >= RATE_LIMIT_MAX_FAIL) {
    const err = new Error('PIN 시도 횟수 초과. 잠시 후 다시 시도해주세요.');
    err.code = 'PIN_RATE_LIMITED';
    throw err;
  }

  // Lookup partner
  const partnerRow = await db.query(
    `SELECT id, pin_hash, is_active, partner_name
     FROM partner_configs
     WHERE partner_code = $1`,
    [partnerCode]
  );

  if (partnerRow.rowCount === 0 || !partnerRow.rows[0].is_active) {
    const err = new Error('등록되지 않은 파트너 코드입니다');
    err.code = 'PARTNER_NOT_AUTHORIZED';
    throw err;
  }

  // Compare hash — same algorithm as benefitCredentialRoutes.js
  const pinHash = crypto.createHash('sha256').update(String(partnerPin)).digest('hex');

  if (partnerRow.rows[0].pin_hash !== pinHash) {
    // Record failure (fire-and-forget — do not surface DB errors to caller)
    db.query(
      `INSERT INTO partner_pin_attempts (partner_code) VALUES ($1)`,
      [partnerCode]
    ).catch(() => {});

    const err = new Error('PIN이 일치하지 않아요');
    err.code = 'WRONG_PIN';
    throw err;
  }

  return {
    id:           partnerRow.rows[0].id,
    partner_code: partnerCode,
    partner_name: partnerRow.rows[0].partner_name ?? null,
  };
}

module.exports = { verifyPartnerPin };
