'use strict';

/**
 * sodamRoutes.js — SODAM Eligibility Decision + Hold Authorization
 *
 * POST /api/dt/sodam/decide   — decide OFFER/ALTERNATIVE/NO_OFFER (authenticated)
 * POST /api/dt/sodam/hold     — authorize hold from recorded decision (authenticated)
 */

const router = require('express').Router();
const db = require('../database/db');
const { requireAuthenticatedPrincipal } = require('../middleware/authenticatedPrincipal');
const sodamService = require('../services/sodamDecisionService');
const flowService = require('../services/flowInventoryService');

// ─── POST /decide ─────────────────────────────────────────────────────────────
router.post('/decide', requireAuthenticatedPrincipal, async (req, res) => {
  if (!req.sowon_id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      code: 'SOWON_ID_UNRESOLVED'
    });
  }

  // Extract USER_EXPLICIT fields only — body.sowon_id is ignored
  const { stay_date, party_size, preferred_room_type = null, partner_code = null } = req.body;

  // If partner_code provided, look up partner from DB; else decide() uses Kenny defaults
  let partner_id;
  let hotel_key;
  let resolvedPartnerCode = 'KENNY'; // Default — canonical form of KENNY_HOTEL_KEY
  if (partner_code) {
    let partnerRow;
    try {
      const r = await db.query(
        `SELECT id, partner_code FROM dt_partners
         WHERE partner_code = $1 AND category = 'accommodation' AND is_active = true`,
        [partner_code]
      );
      if (!r.rows.length) {
        return res.status(404).json({ error: 'NOT_FOUND', code: 'PARTNER_NOT_FOUND' });
      }
      partnerRow = r.rows[0];
    } catch (_) {
      return res.status(500).json({ error: 'INTERNAL_ERROR', code: 'PARTNER_LOOKUP_FAILED' });
    }
    partner_id = partnerRow.id;
    hotel_key  = partner_code.toLowerCase();
    resolvedPartnerCode = partnerRow.partner_code; // DB-resolved canonical — never request echo
  }

  let decision;
  try {
    decision = await sodamService.decide(
      {
        sowon_id: req.sowon_id, // VERIFIED — never from body
        stay_date,
        party_size,
        preferred_room_type,
        ...(partner_id ? { partner_id, hotel_key } : {})
      },
      db
    );
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        code: 'VALIDATION_ERROR',
        field: err.field,
        message: err.message
      });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', code: 'DECISION_FAILED' });
  }

  const statusCode = decision.decision_type === 'OFFER' || decision.decision_type === 'ALTERNATIVE'
    ? 201
    : 200;

  return res.status(statusCode).json({
    decision: {
      ...decision,
      partner_code: resolvedPartnerCode // DB-resolved canonical partner identity
    }
  });
});

// ─── POST /hold ───────────────────────────────────────────────────────────────
router.post('/hold', requireAuthenticatedPrincipal, async (req, res) => {
  if (!req.sowon_id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      code: 'SOWON_ID_UNRESOLVED'
    });
  }

  const { decision_id, inventory_id: bodyInventoryId } = req.body;

  if (!decision_id) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      code: 'MISSING_PARAMS',
      required: ['decision_id']
    });
  }

  // Load recorded decision
  let decisionRow;
  try {
    const result = await db.query(
      `SELECT id, sowon_id, decision_type, inventory_id, candidate
       FROM dt_sodam_decisions
       WHERE id = $1`,
      [decision_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        code: 'DECISION_NOT_FOUND'
      });
    }
    decisionRow = result.rows[0];
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }

  // Ownership: only the sowon who received the decision can hold it
  if (decisionRow.sowon_id !== req.sowon_id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      code: 'DECISION_OWNERSHIP_MISMATCH'
    });
  }

  // Only OFFER / ALTERNATIVE decisions can proceed to hold
  if (!['OFFER', 'ALTERNATIVE'].includes(decisionRow.decision_type)) {
    return res.status(409).json({
      error: 'CONFLICT',
      code: 'DECISION_NOT_HOLDABLE',
      decision_type: decisionRow.decision_type
    });
  }

  // Inventory ID: use decision record's value; if caller provides one, it must match
  const recordedInventoryId = decisionRow.inventory_id;
  if (!recordedInventoryId) {
    return res.status(409).json({
      error: 'CONFLICT',
      code: 'DECISION_NO_INVENTORY'
    });
  }

  if (bodyInventoryId && bodyInventoryId !== recordedInventoryId) {
    return res.status(409).json({
      error: 'CONFLICT',
      code: 'INVENTORY_ID_MISMATCH'
    });
  }

  // Delegate to FLOW — re-checks availability atomically (stale OFFER is caught here)
  // Pass decision_id so the hold record links back to the exact SODAM offer snapshot.
  let holdResult;
  try {
    holdResult = await flowService.createHold(
      recordedInventoryId,
      req.sowon_id, // VERIFIED
      1,
      db,
      decision_id  // server-validated: ownership + inventory match confirmed above
    );
  } catch (err) {
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }

  if (!holdResult.success) {
    const statusMap = {
      INVENTORY_NOT_FOUND: 404,
      INVENTORY_CLOSED: 409,
      CUTOFF_PASSED: 409,
      INSUFFICIENT_AVAILABILITY: 409
    };
    return res.status(statusMap[holdResult.reason] || 409).json({
      error: 'HOLD_FAILED',
      code: holdResult.reason,
      available: holdResult.available
    });
  }

  return res.status(201).json({
    hold_id: holdResult.hold.id,
    expires_at: holdResult.hold.expires_at,
    quantity: holdResult.hold.quantity,
    inventory_id: recordedInventoryId,
    decision_id
  });
});

module.exports = router;
