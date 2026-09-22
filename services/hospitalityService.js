'use strict';
/**
 * hospitalityService — Hospitality Layer V0.1 (PREVIEW only)
 *
 * State model: PREVIEW | AVAILABLE | REDEEMED
 * V0.1 supports PREVIEW only.
 * AVAILABLE requires server-confirmed payment linked to MY QUOTE/Journey/SOWON.
 * Payment linkage is BLOCKED_BY_PAYMENT_LINKAGE — not implemented in this release.
 *
 * Commerce boundary: guestCount 1–4 = INDIVIDUAL (eligible)
 *                    guestCount  5+ = GROUP (excluded)
 * Relationship type (couple/family/friends) is NOT the authority.
 *
 * Security:
 * - No redemption credential issued in PREVIEW
 * - Payment flag from client is NEVER trusted
 * - guestCount validated server-side from caller context (not client body)
 */

const db = require('../database/db');

const INDIVIDUAL_MAX_GUESTS = 4;

// ── Eligibility ───────────────────────────────────────────────────────────────

/**
 * Pure function — no DB, fully testable.
 * Returns { eligible: boolean, reason: string }
 */
function checkHospitalityEligibility({ guestCount }) {
  const count = parseInt(guestCount, 10);
  if (!Number.isFinite(count) || count < 1) {
    return { eligible: false, reason: 'INVALID_GUEST_COUNT' };
  }
  if (count > INDIVIDUAL_MAX_GUESTS) {
    return { eligible: false, reason: 'GROUP_EXCLUDED' };
  }
  return { eligible: true, reason: null };
}

// ── DB query ──────────────────────────────────────────────────────────────────

/**
 * Fetch active hospitality benefits for a city.
 * Returns empty array when no data exists — safe empty state.
 */
async function fetchActiveBenefits(city_code = 'yeosu') {
  const sql = `
    SELECT
      b.id            AS benefit_id,
      b.benefit_type,
      b.title,
      b.description,
      b.display_copy,
      b.location_hint,
      b.valid_from,
      b.valid_to,
      p.name          AS partner_name,
      p.category      AS partner_category,
      p.address       AS partner_address
    FROM dt_benefits b
    JOIN dt_partners p ON p.id = b.partner_id
    WHERE p.city_code  = $1
      AND b.is_active  = true
      AND p.is_active  = true
      AND (b.valid_to IS NULL OR b.valid_to >= CURRENT_DATE)
    ORDER BY b.created_at ASC
  `;
  try {
    const { rows } = await db.query(sql, [city_code]);
    return rows.map(r => ({
      benefit_id:   r.benefit_id,
      benefit_type: r.benefit_type,
      title:        r.title,
      description:  r.description,
      display_copy: r.display_copy,
      location_hint: r.location_hint,
      valid_from:   r.valid_from,
      valid_to:     r.valid_to,
      partner: {
        name:     r.partner_name,
        category: r.partner_category,
        address:  r.partner_address,
      },
      state:           'PREVIEW',
      payment_notice:  '결제 완료 후 이용 가능',
    }));
  } catch (err) {
    // DB not reachable (e.g. local SQLite without tables) → safe empty state
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[hospitalityService] fetchActiveBenefits failed:', err.message);
    }
    return [];
  }
}

// ── Main entrypoint ───────────────────────────────────────────────────────────

/**
 * Get hospitality preview for an individual Journey.
 * V0.1: state is always PREVIEW — AVAILABLE requires payment linkage (not yet built).
 *
 * @param {object} opts
 * @param {number} opts.guestCount  — from Commerce quote (server-verified, not client)
 * @param {string} [opts.city_code] — defaults to 'yeosu'
 * @returns {Promise<HospitalityResponse>}
 */
async function getHospitalityPreview({ guestCount, city_code = 'yeosu' }) {
  const eligibility = checkHospitalityEligibility({ guestCount });
  if (!eligibility.eligible) {
    return {
      eligible: false,
      reason: eligibility.reason,
      state: null,
      benefits: [],
      payment_gate: null,
    };
  }

  const benefits = await fetchActiveBenefits(city_code);

  return {
    eligible: true,
    reason: null,
    state: 'PREVIEW',
    payment_gate: 'BLOCKED_BY_PAYMENT_LINKAGE',
    payment_notice: '결제 완료 후 이용 가능',
    benefits,
  };
}

module.exports = {
  checkHospitalityEligibility,
  getHospitalityPreview,
  INDIVIDUAL_MAX_GUESTS,
};
