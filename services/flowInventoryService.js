'use strict';

const { getKSTDateString } = require('../utils/kstDate');

/**
 * flowInventoryService.js — FLOW Kenny Availability MVP
 *
 * Invariants:
 *  - available = allocated_count − active_unexpired_holds − confirmed_bookings
 *  - available MUST NOT go below 0 — any negative state is an integrity error
 *  - sowon_id is server-resolved (from verified JWT claim) — never caller-supplied
 *  - SELECT FOR UPDATE on dt_flow_inventory ensures race-free hold creation
 */

// Hold TTL: server-configured, client cannot influence
const HOLD_TTL_MINUTES = parseInt(process.env.FLOW_HOLD_TTL_MINUTES, 10) || 30;

// ─────────────────────────────────────────────────────────────────────────────
// getAvailability
// Returns: { id, accommodation_id, stay_date, status, cutoff_date,
//            allocated_count, active_held, confirmed_booked, available }
// or null if no inventory row exists for this accommodation+date.
// ─────────────────────────────────────────────────────────────────────────────
async function getAvailability(accommodation_id, stay_date, db) {
  const result = await db.query(
    `SELECT
       fi.id,
       fi.accommodation_id,
       fi.stay_date,
       fi.allocated_count,
       fi.cutoff_date,
       fi.status,
       COALESCE(h.active_held, 0)::integer        AS active_held,
       COALESCE(b.confirmed_booked, 0)::integer   AS confirmed_booked,
       (fi.allocated_count
         - COALESCE(h.active_held, 0)
         - COALESCE(b.confirmed_booked, 0))::integer AS available
     FROM dt_flow_inventory fi
     LEFT JOIN (
       SELECT inventory_id, SUM(quantity) AS active_held
       FROM dt_flow_holds
       WHERE status = 'active' AND expires_at > NOW()
       GROUP BY inventory_id
     ) h ON h.inventory_id = fi.id
     LEFT JOIN (
       SELECT inventory_id, SUM(quantity) AS confirmed_booked
       FROM dt_flow_bookings
       WHERE status = 'confirmed'
       GROUP BY inventory_id
     ) b ON b.inventory_id = fi.id
     WHERE fi.accommodation_id = $1
       AND fi.stay_date = $2`,
    [accommodation_id, stay_date]
  );

  if (!result.rows.length) return null;

  const row = result.rows[0];
  if (row.available < 0) {
    throw new Error('INVENTORY_INTEGRITY_ERROR: available < 0');
  }
  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// createHold — atomic, uses SELECT FOR UPDATE to prevent race conditions
//
// Returns:
//   { success: true,  hold: {...} }
//   { success: false, reason: 'INVENTORY_NOT_FOUND'|'INVENTORY_CLOSED'|
//                              'CUTOFF_PASSED'|'INSUFFICIENT_AVAILABILITY',
//                     available? }
// ─────────────────────────────────────────────────────────────────────────────
async function createHold(inventory_id, sowon_id, quantity, db, sodam_decision_id = null) {
  quantity = quantity || 1;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the inventory row — prevents concurrent hold creation for same slot
    const invResult = await client.query(
      `SELECT id, allocated_count, status, cutoff_date, stay_date
       FROM dt_flow_inventory
       WHERE id = $1
       FOR UPDATE`,
      [inventory_id]
    );

    if (!invResult.rows.length) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'INVENTORY_NOT_FOUND' };
    }

    const inv = invResult.rows[0];

    if (inv.status !== 'open') {
      await client.query('ROLLBACK');
      return { success: false, reason: 'INVENTORY_CLOSED' };
    }

    if (inv.cutoff_date && getKSTDateString(new Date()) > inv.cutoff_date) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'CUTOFF_PASSED' };
    }

    // Count active holds within transaction (snapshot-consistent under FOR UPDATE)
    const holdsResult = await client.query(
      `SELECT COALESCE(SUM(quantity), 0)::integer AS active_held
       FROM dt_flow_holds
       WHERE inventory_id = $1 AND status = 'active' AND expires_at > NOW()`,
      [inventory_id]
    );

    const bookingsResult = await client.query(
      `SELECT COALESCE(SUM(quantity), 0)::integer AS confirmed_booked
       FROM dt_flow_bookings
       WHERE inventory_id = $1 AND status = 'confirmed'`,
      [inventory_id]
    );

    const activeHeld      = holdsResult.rows[0].active_held;
    const confirmedBooked = bookingsResult.rows[0].confirmed_booked;
    const available       = inv.allocated_count - activeHeld - confirmedBooked;

    if (available < quantity) {
      await client.query('ROLLBACK');
      return {
        success:   false,
        reason:    'INSUFFICIENT_AVAILABILITY',
        available: Math.max(0, available)
      };
    }

    const expiresAt = new Date(Date.now() + HOLD_TTL_MINUTES * 60 * 1000);
    const holdResult = await client.query(
      `INSERT INTO dt_flow_holds
         (inventory_id, sowon_id, quantity, status, expires_at, sodam_decision_id)
       VALUES ($1, $2, $3, 'active', $4, $5)
       RETURNING id, inventory_id, sowon_id, quantity, status, expires_at,
                 sodam_decision_id, created_at`,
      [inventory_id, sowon_id, quantity, expiresAt, sodam_decision_id || null]
    );

    await client.query('COMMIT');
    return { success: true, hold: holdResult.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// consumeHold — converts active hold into confirmed booking
//
// Returns:
//   { success: true,  booking: {...} }
//   { success: false, reason: 'HOLD_NOT_FOUND'|'HOLD_OWNERSHIP_MISMATCH'|
//                              'HOLD_NOT_ACTIVE'|'HOLD_EXPIRED' }
// ─────────────────────────────────────────────────────────────────────────────
async function consumeHold(hold_id, sowon_id, booking_details, db) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const holdResult = await client.query(
      `SELECT h.id, h.inventory_id, h.sowon_id, h.quantity, h.status, h.expires_at
       FROM dt_flow_holds h
       WHERE h.id = $1
       FOR UPDATE`,
      [hold_id]
    );

    if (!holdResult.rows.length) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'HOLD_NOT_FOUND' };
    }

    const hold = holdResult.rows[0];

    if (hold.sowon_id !== sowon_id) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'HOLD_OWNERSHIP_MISMATCH' };
    }

    if (hold.status !== 'active') {
      await client.query('ROLLBACK');
      return { success: false, reason: 'HOLD_NOT_ACTIVE' };
    }

    if (new Date(hold.expires_at) <= new Date()) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'HOLD_EXPIRED' };
    }

    const bookingResult = await client.query(
      `INSERT INTO dt_flow_bookings
         (inventory_id, hold_id, sowon_id, quantity, status, customer_name, phone)
       VALUES ($1, $2, $3, $4, 'confirmed', $5, $6)
       RETURNING id, inventory_id, hold_id, sowon_id, quantity, status, created_at`,
      [
        hold.inventory_id,
        hold_id,
        sowon_id,
        hold.quantity,
        booking_details?.customer_name || null,
        booking_details?.phone         || null
      ]
    );

    await client.query(
      `UPDATE dt_flow_holds
       SET status = 'consumed', updated_at = NOW()
       WHERE id = $1`,
      [hold_id]
    );

    await client.query('COMMIT');
    return { success: true, booking: bookingResult.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// releaseHold — explicit early release by the hold owner
//
// Returns: { success: true } | { success: false, reason }
// ─────────────────────────────────────────────────────────────────────────────
async function releaseHold(hold_id, sowon_id, db) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const holdResult = await client.query(
      `SELECT id, sowon_id, status
       FROM dt_flow_holds
       WHERE id = $1
       FOR UPDATE`,
      [hold_id]
    );

    if (!holdResult.rows.length) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'HOLD_NOT_FOUND' };
    }

    const hold = holdResult.rows[0];

    if (hold.sowon_id !== sowon_id) {
      await client.query('ROLLBACK');
      return { success: false, reason: 'HOLD_OWNERSHIP_MISMATCH' };
    }

    if (hold.status !== 'active') {
      await client.query('ROLLBACK');
      return { success: false, reason: 'HOLD_NOT_ACTIVE' };
    }

    await client.query(
      `UPDATE dt_flow_holds
       SET status = 'released', updated_at = NOW()
       WHERE id = $1`,
      [hold_id]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// releaseExpiredHolds — optional housekeeping job
// Marks all expired-active holds as released.
// Note: expired holds are ALREADY excluded from availability calculation
// (WHERE expires_at > NOW()), so this is administrative cleanup only.
// ─────────────────────────────────────────────────────────────────────────────
async function releaseExpiredHolds(db) {
  const result = await db.query(
    `UPDATE dt_flow_holds
     SET status = 'released', updated_at = NOW()
     WHERE status = 'active' AND expires_at <= NOW()
     RETURNING id`
  );
  return result.rows.length;
}

module.exports = {
  getAvailability,
  createHold,
  consumeHold,
  releaseHold,
  releaseExpiredHolds,
  HOLD_TTL_MINUTES
};
