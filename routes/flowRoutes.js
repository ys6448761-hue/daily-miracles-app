'use strict';

/**
 * flowRoutes.js — FLOW Kenny Availability MVP (user-facing)
 *
 * GET  /api/dt/flow/availability  — check availability for a date (public)
 * POST /api/dt/flow/hold          — place a temporary hold (authenticated)
 * POST /api/dt/flow/book          — convert hold to booking (authenticated)
 * DELETE /api/dt/flow/hold/:id   — release a hold (authenticated)
 */

const router = require('express').Router();
const db     = require('../database/db');
const { requireAuthenticatedPrincipal } = require('../middleware/authenticatedPrincipal');
const flowService = require('../services/flowInventoryService');

// ─── GET /availability ───────────────────────────────────────────────────────
router.get('/availability', async (req, res) => {
  const { accommodation_id, date } = req.query;

  if (!accommodation_id || !date) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code:  'MISSING_PARAMS',
      required: ['accommodation_id', 'date']
    });
  }

  try {
    const inv = await flowService.getAvailability(accommodation_id, date, db);

    if (!inv) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        code:  'INVENTORY_NOT_FOUND'
      });
    }

    // Never expose internal allocation details or other SOWON_IDs
    return res.json({
      accommodation_id: inv.accommodation_id,
      stay_date:        inv.stay_date,
      status:           inv.status,
      available:        inv.available,
      cutoff_date:      inv.cutoff_date
    });
  } catch (err) {
    if (err.message && err.message.startsWith('INVENTORY_INTEGRITY_ERROR')) {
      return res.status(500).json({ error: 'INTERNAL_ERROR', code: 'INTEGRITY_ERROR' });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ─── POST /hold ──────────────────────────────────────────────────────────────
router.post('/hold', requireAuthenticatedPrincipal, async (req, res) => {
  if (!req.sowon_id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      code:  'SOWON_ID_UNRESOLVED'
    });
  }

  const { inventory_id, quantity } = req.body;

  if (!inventory_id) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code:  'MISSING_PARAMS',
      required: ['inventory_id']
    });
  }

  try {
    const result = await flowService.createHold(
      inventory_id,
      req.sowon_id, // server-resolved from verified JWT claim only
      quantity || 1,
      db
    );

    if (!result.success) {
      const statusMap = {
        INVENTORY_NOT_FOUND:       404,
        INVENTORY_CLOSED:          409,
        CUTOFF_PASSED:             409,
        INSUFFICIENT_AVAILABILITY: 409
      };
      return res.status(statusMap[result.reason] || 400).json({
        error:     'HOLD_FAILED',
        code:      result.reason,
        available: result.available
      });
    }

    return res.status(201).json({
      hold_id:    result.hold.id,
      expires_at: result.hold.expires_at,
      quantity:   result.hold.quantity
    });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ─── POST /book ──────────────────────────────────────────────────────────────
router.post('/book', requireAuthenticatedPrincipal, async (req, res) => {
  if (!req.sowon_id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      code:  'SOWON_ID_UNRESOLVED'
    });
  }

  const { hold_id, customer_name, phone } = req.body;

  if (!hold_id) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code:  'MISSING_PARAMS',
      required: ['hold_id']
    });
  }

  try {
    const result = await flowService.consumeHold(
      hold_id,
      req.sowon_id, // server-resolved
      { customer_name, phone }
    , db);

    if (!result.success) {
      const statusMap = {
        HOLD_NOT_FOUND:          404,
        HOLD_OWNERSHIP_MISMATCH: 403,
        HOLD_NOT_ACTIVE:         409,
        HOLD_EXPIRED:            409
      };
      return res.status(statusMap[result.reason] || 400).json({
        error: 'BOOKING_FAILED',
        code:  result.reason
      });
    }

    return res.status(201).json({
      booking_id:   result.booking.id,
      inventory_id: result.booking.inventory_id,
      status:       result.booking.status,
      quantity:     result.booking.quantity,
      created_at:   result.booking.created_at
    });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ─── DELETE /hold/:id ────────────────────────────────────────────────────────
router.delete('/hold/:id', requireAuthenticatedPrincipal, async (req, res) => {
  if (!req.sowon_id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      code:  'SOWON_ID_UNRESOLVED'
    });
  }

  try {
    const result = await flowService.releaseHold(req.params.id, req.sowon_id, db);

    if (!result.success) {
      const statusMap = {
        HOLD_NOT_FOUND:          404,
        HOLD_OWNERSHIP_MISMATCH: 403,
        HOLD_NOT_ACTIVE:         409
      };
      return res.status(statusMap[result.reason] || 400).json({
        error: 'RELEASE_FAILED',
        code:  result.reason
      });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
