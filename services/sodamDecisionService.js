'use strict';

/**
 * sodamDecisionService.js — SODAM Eligibility Decision Service
 *
 * Answers: "이 소원이에게 지금 이 조건을 권하는 것이 좋은가?"
 * Decision types: OFFER / ALTERNATIVE / NO_OFFER
 *
 * Invariants:
 *   - Deterministic — NO AI calls
 *   - MUST NOT call createHold — decide only
 *   - Persistence failure for OFFER/ALTERNATIVE fails closed (no unrecorded OFFER)
 *   - preferred_room_type=null → NO_EXPLICIT_PREFERENCE (never infer from party_size)
 *   - Price labeled STATIC_CONFIG (quotePriceData.js snapshot, not live DB)
 *   - sowon_id must be server-resolved (from verified JWT) before calling this service
 */

const { v4: uuidv4 } = require('uuid');
const { getDayType } = require('./quoteEngine');
const { getKSTDateString } = require('../utils/kstDate');
const priceData = require('../config/quotePriceData');
const flowService = require('./flowInventoryService');

// Kenny Hotel defaults — used when partner_id/hotel_key not provided in decide()
const KENNY_PARTNER_ID = 'aa000001-0000-4000-8000-000000000001';
const KENNY_HOTEL_KEY  = 'kenny';

const PRICE_SOURCE = 'STATIC_CONFIG';
const PRICE_SOURCE_VERSION = priceData.meta.priceVersion; // 'v1.2_20260112'

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Query DB for rooms of the given partner compatible with party_size.
 * Ordered by room_code ASC — deterministic tie-break.
 */
async function getCompatibleRooms(party_size, db, partner_id) {
  const result = await db.query(
    `SELECT id, room_type, room_code, base_occupancy, max_occupancy
     FROM dt_accommodations
     WHERE partner_id = $1
       AND is_available = true
       AND max_occupancy >= $2
     ORDER BY room_code ASC`,
    [partner_id, party_size]
  );
  return result.rows;
}

/**
 * Look up static price for guestCount+dayType from the given hotel config key.
 * hotel_key matches quotePriceData.js regions.yeosu.hotels[hotel_key].
 * Returns { sell, list, day_type } or null if no price entry exists.
 */
function lookupPartnerPrice(party_size, stay_date, hotel_key) {
  const dayType = getDayType(stay_date);
  const pricing = priceData.regions.yeosu.hotels[hotel_key]?.pricing;
  if (!pricing) return null;
  const p = pricing[dayType]?.[party_size];
  if (!p) return null;
  return { sell: p.sell, list: p.list, day_type: dayType };
}

/**
 * @param {string} cutoff_date  Korean calendar date (YYYY-MM-DD) from dt_flow_inventory
 * @param {Date}   [now]        Injection point for deterministic testing; defaults to real now
 */
function isCutoffPassed(cutoff_date, now = new Date()) {
  if (!cutoff_date) return false;
  // "Passed" means the KST current date has moved beyond the cutoff date.
  // KST end-of-day (23:59:59.999 Asia/Seoul) = UTC 14:59:59.999 of the same date.
  //   - at UTC 14:59:59.999 → KST date = cutoff_date → NOT passed
  //   - at UTC 15:00:00.000 → KST date is next day → PASSED
  return getKSTDateString(now) > cutoff_date;
}

function canOffer(avail) {
  if (!avail || !avail.inventory_id) return false;
  if (avail.status !== 'open') return false;
  if (isCutoffPassed(avail.cutoff_date)) return false;
  return avail.available > 0;
}

function getReasonCode(avail) {
  if (!avail || !avail.inventory_id) return 'FLOW_ALLOCATION_ABSENT';
  if (avail.status !== 'open') return 'INVENTORY_CLOSED';
  if (isCutoffPassed(avail.cutoff_date)) return 'CUTOFF_PASSED';
  return 'FLOW_UNAVAILABLE';
}

async function evaluateRoom(room, stay_date, db) {
  const avail = await flowService.getAvailability(room.id, stay_date, db);
  if (!avail) return { inventory_id: null, available: 0, status: null, cutoff_date: null };
  return {
    inventory_id: avail.id,
    available: avail.available,
    status: avail.status,
    cutoff_date: avail.cutoff_date
  };
}

function buildCandidate(room, avail, price, stay_date) {
  return {
    accommodation_id: room.id,
    room_type: room.room_type,
    room_code: room.room_code,
    stay_date,
    available: avail.available,
    inventory_id: avail.inventory_id,
    price_sell: price.sell,
    price_list: price.list,
    day_type: price.day_type,
    price_source: PRICE_SOURCE,
    price_source_version: PRICE_SOURCE_VERSION
  };
}

/**
 * Persist decision to dt_sodam_decisions.
 * Throws on DB failure — caller must propagate (fail closed for OFFER/ALTERNATIVE).
 */
async function persistDecision(dec, db) {
  await db.query(
    `INSERT INTO dt_sodam_decisions
       (id, sowon_id, stay_date, party_size, decision_type, reason_codes,
        candidate, inventory_id, price_sell, price_source, price_source_version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      dec.decision_id,
      dec.sowon_id,
      dec.stay_date,
      dec.party_size,
      dec.decision_type,
      dec.reason_codes,
      dec.candidate ? JSON.stringify(dec.candidate) : null,
      dec.candidate?.inventory_id || null,
      dec.candidate?.price_sell || null,
      PRICE_SOURCE,
      PRICE_SOURCE_VERSION
    ]
  );
}

// ─── Main decision function ───────────────────────────────────────────────────

/**
 * Determine whether to OFFER, provide an ALTERNATIVE, or NO_OFFER accommodation.
 *
 * @param {Object} input
 * @param {string} input.sowon_id            VERIFIED — from req.sowon_id (JWT claim), never from body
 * @param {string} input.stay_date           USER_EXPLICIT
 * @param {number} input.party_size          USER_EXPLICIT
 * @param {string|null} [input.preferred_room_type]  USER_EXPLICIT or null
 *   null → NO_EXPLICIT_PREFERENCE; never infer preference from party_size
 * @param {string} [input.partner_id]        Partner UUID — defaults to KENNY_PARTNER_ID
 * @param {string} [input.hotel_key]         quotePriceData hotel key — defaults to 'kenny'
 * @param db  Injectable database client
 * @returns {Promise<Object>} Decision object
 * @throws On validation error (field: 'stay_date'|'party_size') or persistence failure
 */
async function decide(input, db) {
  const {
    sowon_id,
    stay_date,
    party_size,
    preferred_room_type = null,
    partner_id = KENNY_PARTNER_ID,
    hotel_key  = KENNY_HOTEL_KEY
  } = input;

  // Validation — throw typed errors so route can map to 400
  if (!stay_date || typeof stay_date !== 'string') {
    const err = new Error('VALIDATION_ERROR: stay_date required');
    err.code = 'VALIDATION_ERROR';
    err.field = 'stay_date';
    throw err;
  }
  if (party_size == null || typeof party_size !== 'number') {
    const err = new Error('VALIDATION_ERROR: party_size required');
    err.code = 'VALIDATION_ERROR';
    err.field = 'party_size';
    throw err;
  }
  if (party_size < 1 || !Number.isInteger(party_size)) {
    const err = new Error('VALIDATION_ERROR: party_size must be a positive integer');
    err.code = 'VALIDATION_ERROR';
    err.field = 'party_size';
    throw err;
  }

  const decision_id = uuidv4();
  const preference_basis = preferred_room_type ? 'USER_EXPLICIT' : 'NO_EXPLICIT_PREFERENCE';

  // Get compatible rooms from DB (never hardcoded)
  const compatibleRooms = await getCompatibleRooms(party_size, db, partner_id);

  if (!compatibleRooms.length) {
    const dec = {
      decision_id,
      decision_type: 'NO_OFFER',
      reason_codes: ['INVALID_PARTY_SIZE'],
      candidate: null,
      preference_basis,
      sowon_id,
      stay_date,
      party_size,
      created_at: new Date().toISOString()
    };
    await persistDecision(dec, db);
    return dec;
  }

  // ── EXPLICIT PREFERENCE PATH ─────────────────────────────────────────────
  if (preferred_room_type) {
    const prefRoom = compatibleRooms.find(r => r.room_type === preferred_room_type);

    if (!prefRoom) {
      // preferred type incompatible with party_size or doesn't exist
      const dec = {
        decision_id,
        decision_type: 'NO_OFFER',
        reason_codes: ['NO_COMPATIBLE_ROOM'],
        candidate: null,
        preference_basis: 'USER_EXPLICIT',
        sowon_id,
        stay_date,
        party_size,
        created_at: new Date().toISOString()
      };
      await persistDecision(dec, db);
      return dec;
    }

    const prefAvail = await evaluateRoom(prefRoom, stay_date, db);

    if (canOffer(prefAvail)) {
      const price = lookupPartnerPrice(party_size, stay_date, hotel_key);
      if (!price) {
        const dec = {
          decision_id,
          decision_type: 'NO_OFFER',
          reason_codes: ['PRICE_UNAVAILABLE'],
          candidate: null,
          preference_basis: 'USER_EXPLICIT',
          sowon_id,
          stay_date,
          party_size,
          created_at: new Date().toISOString()
        };
        await persistDecision(dec, db);
        return dec;
      }
      const candidate = buildCandidate(prefRoom, prefAvail, price, stay_date);
      const dec = {
        decision_id,
        decision_type: 'OFFER',
        reason_codes: ['FLOW_AVAILABLE'],
        candidate,
        preference_basis: 'USER_EXPLICIT',
        sowon_id,
        stay_date,
        party_size,
        created_at: new Date().toISOString()
      };
      await persistDecision(dec, db);
      return dec;
    }

    // Preferred not available — try alternatives
    const prefReasonCode = getReasonCode(prefAvail);
    const altRooms = compatibleRooms.filter(r => r.id !== prefRoom.id);

    for (const altRoom of altRooms) {
      const altAvail = await evaluateRoom(altRoom, stay_date, db);
      if (canOffer(altAvail)) {
        const price = lookupPartnerPrice(party_size, stay_date, hotel_key);
        if (!price) continue; // price keyed by guestCount; if null, skip this room too
        const candidate = buildCandidate(altRoom, altAvail, price, stay_date);
        const dec = {
          decision_id,
          decision_type: 'ALTERNATIVE',
          reason_codes: ['PREFERRED_UNAVAILABLE', prefReasonCode],
          candidate,
          preference_basis: 'USER_EXPLICIT',
          sowon_id,
          stay_date,
          party_size,
          created_at: new Date().toISOString()
        };
        await persistDecision(dec, db);
        return dec;
      }
    }

    // No alternative available
    const dec = {
      decision_id,
      decision_type: 'NO_OFFER',
      reason_codes: [prefReasonCode],
      candidate: null,
      preference_basis: 'USER_EXPLICIT',
      sowon_id,
      stay_date,
      party_size,
      created_at: new Date().toISOString()
    };
    await persistDecision(dec, db);
    return dec;
  }

  // ── NO EXPLICIT PREFERENCE PATH ──────────────────────────────────────────
  // Try rooms in deterministic order (room_code ASC); return OFFER on first available
  const reasonCodes = new Set();

  for (const room of compatibleRooms) {
    const avail = await evaluateRoom(room, stay_date, db);
    if (canOffer(avail)) {
      const price = lookupPartnerPrice(party_size, stay_date, hotel_key);
      if (!price) {
        // Price keyed by guestCount — won't improve for other rooms; fail now
        const dec = {
          decision_id,
          decision_type: 'NO_OFFER',
          reason_codes: ['PRICE_UNAVAILABLE'],
          candidate: null,
          preference_basis: 'NO_EXPLICIT_PREFERENCE',
          sowon_id,
          stay_date,
          party_size,
          created_at: new Date().toISOString()
        };
        await persistDecision(dec, db);
        return dec;
      }
      const candidate = buildCandidate(room, avail, price, stay_date);
      const dec = {
        decision_id,
        decision_type: 'OFFER',
        reason_codes: ['FLOW_AVAILABLE'],
        candidate,
        preference_basis: 'NO_EXPLICIT_PREFERENCE',
        sowon_id,
        stay_date,
        party_size,
        created_at: new Date().toISOString()
      };
      await persistDecision(dec, db);
      return dec;
    }
    reasonCodes.add(getReasonCode(avail));
  }

  // All rooms checked, none available
  const dec = {
    decision_id,
    decision_type: 'NO_OFFER',
    reason_codes: reasonCodes.size ? [...reasonCodes] : ['FLOW_UNAVAILABLE'],
    candidate: null,
    preference_basis: 'NO_EXPLICIT_PREFERENCE',
    sowon_id,
    stay_date,
    party_size,
    created_at: new Date().toISOString()
  };
  await persistDecision(dec, db);
  return dec;
}

module.exports = { decide };
