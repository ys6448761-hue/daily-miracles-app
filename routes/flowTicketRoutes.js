'use strict';

/**
 * flowTicketRoutes.js — Ticket Server-to-Server FLOW Integration
 *
 * Architecture V0.2 (confirmed):  Hold → Payment (PHP) → Book
 *
 * Routes:
 *   POST /api/dt/flow/ticket-hold  — pre-payment inventory hold
 *   POST /api/dt/flow/ticket-book  — post-payment booking confirm
 *
 * Auth: HMAC-SHA256 server-to-server (ticketAuthService)
 * Caller: ticket.6117.co.kr PHP server
 *
 * FLOW_TICKET_SOWON_ID — system UUID identifying holds owned by the ticket system.
 *   This is an ownership identifier, NOT an auth secret.
 *   Auth is performed entirely via HMAC signature in ticketAuthService.
 *
 * Payment verification note:
 *   ticket.6117.co.kr uses a separate NicePay merchant account.
 *   This server cannot independently verify NicePay transactions.
 *   PHP HMAC signature + ticket_order_id = payment proof contract for MVP.
 *   Full cross-merchant verification is a future enhancement.
 */

const express  = require('express');
const router   = express.Router();
const ticketAuth   = require('../services/ticketAuthService');
const flowService  = require('../services/flowInventoryService');
const { sendSensSMS } = require('../services/messageProvider');

// ─────────────────────────────────────────────────────────────────────────────
// Auth middleware — HMAC-SHA256 server-to-server
// ─────────────────────────────────────────────────────────────────────────────
function requireTicketAuth(req, res, next) {
  if (!process.env.FLOW_TICKET_SOWON_ID) {
    console.error('[flowTicket] FLOW_TICKET_SOWON_ID not configured');
    return res.status(503).json({ error: 'SERVER_CONFIG_ERROR' });
  }
  const result = ticketAuth.verify(req);
  if (!result.valid) {
    return res.status(401).json({ error: 'TICKET_AUTH_FAILED', reason: result.reason });
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /ticket-hold
// Body: { inventory_id: string, quantity?: number }
// Response: { success, hold_id, expires_at }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ticket-hold', requireTicketAuth, async (req, res) => {
  const { inventory_id, quantity } = req.body || {};

  if (!inventory_id) {
    return res.status(400).json({ error: 'MISSING_INVENTORY_ID' });
  }

  const qty = parseInt(quantity, 10) || 1;
  if (qty < 1 || qty > 100) {
    return res.status(400).json({ error: 'INVALID_QUANTITY' });
  }

  const db = req.app.locals.db;

  try {
    const result = await flowService.createHold(inventory_id, process.env.FLOW_TICKET_SOWON_ID, qty, db);

    if (!result.success) {
      const statusMap = {
        INVENTORY_NOT_FOUND:       404,
        INVENTORY_CLOSED:          409,
        CUTOFF_PASSED:             409,
        INSUFFICIENT_AVAILABILITY: 409,
      };
      return res.status(statusMap[result.reason] || 400).json({
        error:     result.reason,
        available: result.available,
      });
    }

    return res.status(201).json({
      success:    true,
      hold_id:    result.hold.id,
      expires_at: result.hold.expires_at,
    });
  } catch (err) {
    console.error('[flowTicket] ticket-hold error:', err.message);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /ticket-book
// Body: { hold_id, ticket_order_id, ticket_paid_at, customer_name?, phone? }
// Response: { success, booking_id, ticket_order_id }
//
// Idempotency: if ticket_order_id already has a confirmed booking, returns
// the existing booking without creating a duplicate.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ticket-book', requireTicketAuth, async (req, res) => {
  const { hold_id, ticket_order_id, ticket_paid_at, customer_name, phone } = req.body || {};

  if (!hold_id)         return res.status(400).json({ error: 'MISSING_HOLD_ID' });
  if (!ticket_order_id) return res.status(400).json({ error: 'MISSING_TICKET_ORDER_ID' });
  if (!ticket_paid_at)  return res.status(400).json({ error: 'MISSING_TICKET_PAID_AT' });

  const db = req.app.locals.db;

  try {
    // Idempotency: check if this ticket_order_id was already successfully booked
    const existing = await db.query(
      `SELECT id, ticket_order_id FROM dt_flow_bookings
       WHERE ticket_order_id = $1 AND status = 'confirmed'
       LIMIT 1`,
      [ticket_order_id]
    );

    if (existing.rows.length) {
      return res.status(200).json({
        success:          true,
        booking_id:       existing.rows[0].id,
        ticket_order_id:  existing.rows[0].ticket_order_id,
        idempotent:       true,
      });
    }

    const result = await flowService.consumeHold(hold_id, process.env.FLOW_TICKET_SOWON_ID, {
      ticket_order_id,
      ticket_paid_at,
      customer_name: customer_name || null,
      phone:         phone         || null,
    }, db);

    if (!result.success) {
      // Alert ops for all hold failures where payment may have been taken
      // HOLD_EXPIRED, HOLD_NOT_FOUND: hold unavailable after payment
      // HOLD_NOT_ACTIVE: hold already consumed by another path (potential double-book)
      const needsAlert = ['HOLD_EXPIRED', 'HOLD_NOT_FOUND', 'HOLD_NOT_ACTIVE'];
      if (needsAlert.includes(result.reason)) {
        const alertText = `[FLOW 티켓 경보] ticket_order_id=${ticket_order_id} hold_id=${hold_id} reason=${result.reason} — 결제됐으나 Hold 실패. 수동 확인 필요.`;
        const adminPhone = process.env.ADMIN_PHONE || process.env.SENDER_PHONE || '18996117';
        sendSensSMS(adminPhone, alertText).catch(e =>
          console.error('[flowTicket] ops SMS failed:', e.message)
        );
      }

      const statusMap = {
        HOLD_NOT_FOUND:          404,
        HOLD_OWNERSHIP_MISMATCH: 403,
        HOLD_NOT_ACTIVE:         409,
        HOLD_EXPIRED:            409,
      };
      return res.status(statusMap[result.reason] || 400).json({
        error: result.reason,
      });
    }

    return res.status(201).json({
      success:         true,
      booking_id:      result.booking.id,
      ticket_order_id: result.booking.ticket_order_id,
    });
  } catch (err) {
    // Concurrent duplicate: UNIQUE constraint on ticket_order_id (PG error 23505)
    // The race window between idempotency SELECT and consumeHold INSERT can cause this.
    // Treat as idempotent — re-query and return the existing booking.
    if (err.code === '23505' && err.constraint === 'uq_dt_flow_bookings_ticket_order') {
      try {
        const dup = await db.query(
          `SELECT id, ticket_order_id FROM dt_flow_bookings
           WHERE ticket_order_id = $1 AND status = 'confirmed' LIMIT 1`,
          [ticket_order_id]
        );
        if (dup.rows.length) {
          return res.status(200).json({
            success:         true,
            booking_id:      dup.rows[0].id,
            ticket_order_id: dup.rows[0].ticket_order_id,
            idempotent:      true,
          });
        }
      } catch (dupErr) {
        console.error('[flowTicket] idempotency re-query failed:', dupErr.message);
      }
    }

    console.error('[flowTicket] ticket-book error:', err.message);

    // Alert ops: unexpected DB error during booking (payment may have been taken)
    const alertText = `[FLOW 티켓 경보] ticket-book DB 오류: ticket_order_id=${ticket_order_id} hold_id=${hold_id} err=${err.message}`;
    const adminPhone = process.env.ADMIN_PHONE || process.env.SENDER_PHONE || '18996117';
    sendSensSMS(adminPhone, alertText).catch(e =>
      console.error('[flowTicket] ops SMS failed:', e.message)
    );

    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
