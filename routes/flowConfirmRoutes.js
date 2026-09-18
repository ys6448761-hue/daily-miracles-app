'use strict';

/**
 * flowConfirmRoutes.js — FLOW Actual Use Confirmation
 *
 * POST /api/dt/flow/confirm
 *   Partner (Kenny) confirms that a Sowoni has actually begun their stay.
 *   Creates an immutable dt_flow_confirmations record.
 *
 * Authentication: partner_code + partner_pin (partner_configs PIN auth)
 * Authorization:  booking must belong to the requesting partner's resource
 * Actor:          PARTNER only — Sowoni self-confirmation is not accepted
 */

const router = require('express').Router();
const db     = require('../database/db');
const { verifyPartnerPin } = require('../services/partnerPinService');

// ─── POST /confirm ───────────────────────────────────────────────────────────
router.post('/confirm', async (req, res) => {
  const { booking_id, partner_code, partner_pin } = req.body ?? {};

  // ① Input validation
  if (!booking_id)    return res.status(400).json({ error: 'BAD_REQUEST', code: 'MISSING_BOOKING_ID' });
  if (!partner_code)  return res.status(400).json({ error: 'BAD_REQUEST', code: 'MISSING_PARTNER_CODE' });
  if (!partner_pin)   return res.status(400).json({ error: 'BAD_REQUEST', code: 'MISSING_PARTNER_PIN' });

  // ② Partner PIN authentication
  try {
    await verifyPartnerPin(db, partner_code, partner_pin);
  } catch (pinErr) {
    if (pinErr.code === 'PIN_RATE_LIMITED') {
      return res.status(429).json({ error: pinErr.message, code: 'PIN_RATE_LIMITED' });
    }
    if (pinErr.code === 'PARTNER_NOT_AUTHORIZED') {
      return res.status(403).json({ error: pinErr.message, code: 'PARTNER_NOT_AUTHORIZED' });
    }
    if (pinErr.code === 'WRONG_PIN') {
      return res.status(403).json({ error: pinErr.message, code: 'WRONG_PIN' });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }

  try {
    // ③ Booking lookup with full ownership chain
    //    booking → inventory → accommodation → partner → dt_partners.partner_code
    const bookingResult = await db.query(
      `SELECT
         b.id          AS booking_id,
         b.status      AS booking_status,
         b.sowon_id,
         b.quantity,
         inv.stay_date,
         acc.id        AS accommodation_id,
         acc.room_code,
         p.partner_code AS owner_partner_code
       FROM dt_flow_bookings b
       JOIN dt_flow_inventory inv ON inv.id = b.inventory_id
       JOIN dt_accommodations  acc ON acc.id = inv.accommodation_id
       JOIN dt_partners         p   ON p.id  = acc.partner_id
       WHERE b.id = $1`,
      [booking_id]
    );

    if (bookingResult.rowCount === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
    }

    const booking = bookingResult.rows[0];

    // ④ Booking state validation
    if (booking.booking_status === 'cancelled') {
      return res.status(409).json({ error: 'CONFLICT', code: 'BOOKING_CANCELLED' });
    }
    if (booking.booking_status !== 'confirmed') {
      return res.status(409).json({ error: 'CONFLICT', code: 'BOOKING_NOT_CONFIRMABLE' });
    }

    // ⑤ Partner-resource ownership: the requesting partner must own this accommodation
    if (booking.owner_partner_code !== partner_code) {
      return res.status(403).json({ error: 'FORBIDDEN', code: 'PARTNER_RESOURCE_MISMATCH' });
    }

    // ⑥ Idempotency: check for existing confirmation
    const existingResult = await db.query(
      `SELECT id, confirmed_by, confirmed_at
       FROM dt_flow_confirmations
       WHERE booking_id = $1`,
      [booking_id]
    );

    if (existingResult.rowCount > 0) {
      const existing = existingResult.rows[0];

      // Different partner trying to re-confirm → deny (ownership already established)
      if (existing.confirmed_by !== partner_code) {
        return res.status(403).json({ error: 'FORBIDDEN', code: 'PARTNER_RESOURCE_MISMATCH' });
      }

      // Same partner re-confirming → idempotent 200
      return res.status(200).json({
        ok:                 true,
        idempotent:         true,
        confirmation_id:    existing.id,
        booking_id,
        confirmed_by:       existing.confirmed_by,
        confirmed_at:       existing.confirmed_at,
        sowon_id:           booking.sowon_id,
        stay_date:          booking.stay_date,
        room_code:          booking.room_code,
      });
    }

    // ⑦ Insert immutable confirmation record
    //    confirmed_at is DB-generated (DEFAULT NOW()) — not from client
    const insertResult = await db.query(
      `INSERT INTO dt_flow_confirmations
         (booking_id, confirmed_by, confirmation_method)
       VALUES ($1, $2, 'partner_pin')
       RETURNING id, confirmed_at`,
      [booking_id, partner_code]
    );

    const confirmation = insertResult.rows[0];

    return res.status(201).json({
      ok:              true,
      idempotent:      false,
      confirmation_id: confirmation.id,
      booking_id,
      confirmed_by:    partner_code,
      confirmed_at:    confirmation.confirmed_at,
      sowon_id:        booking.sowon_id,
      stay_date:       booking.stay_date,
      room_code:       booking.room_code,
    });

  } catch (err) {
    // UNIQUE constraint violation = race condition on simultaneous requests
    // Treat as idempotent — re-fetch and return existing
    if (err.code === '23505') {
      try {
        const raceResult = await db.query(
          `SELECT c.id, c.confirmed_by, c.confirmed_at
           FROM dt_flow_confirmations c
           JOIN dt_flow_bookings b ON b.id = c.booking_id
           JOIN dt_flow_inventory inv ON inv.id = b.inventory_id
           JOIN dt_accommodations  acc ON acc.id = inv.accommodation_id
           JOIN dt_partners         p   ON p.id  = acc.partner_id
           WHERE c.booking_id = $1`,
          [booking_id]
        );
        if (raceResult.rowCount > 0) {
          const c = raceResult.rows[0];
          return res.status(200).json({
            ok:              true,
            idempotent:      true,
            confirmation_id: c.id,
            booking_id,
            confirmed_by:    c.confirmed_by,
            confirmed_at:    c.confirmed_at,
          });
        }
      } catch (_) {}
    }

    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
