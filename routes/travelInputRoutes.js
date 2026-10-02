/**
 * Travel Input Routes — LUMI HTTP Ingress
 * Thin HTTP boundary: validates, manages session lifecycle, delegates to SOUL.
 * POST /api/dt/travel/input/text
 */

'use strict';

const express = require('express');
const sessionService = require('../services/sessionService');
const { requireAuthenticatedPrincipal } = require('../middleware/authenticatedPrincipal');
const { handleTravelRequest } = require('../services/soyeowoolService');

const router = express.Router();

// Canonical partner_code pattern — mirrors sessionService.ENTRY_POINT_PATTERN
// Accepts RAMADA, KENNY, HOTEL_ABC. Rejects free text, lowercase, spaces, SQL fragments.
const ENTRY_POINT_PATTERN = /^[A-Z][A-Z0-9_]{0,29}$/;

/**
 * POST /api/dt/travel/input/text
 * Body: { message: string, session_id?: string, hotel_id?: string }
 * Returns: { session_id, understood_context, places, why_details, message_ko, ...Protocol fields }
 */
router.post('/input/text', requireAuthenticatedPrincipal, async (req, res) => {
  try {
    const { message, session_id, hotel_id } = req.body;

    // Input validation
    if (!message || !message.trim()) {
      return res.status(400).json({ error: '질문을 입력해주세요.' });
    }

    if (hotel_id && !ENTRY_POINT_PATTERN.test(hotel_id)) {
      return res.status(400).json({ error: 'INVALID_HOTEL_ID' });
    }

    // Session lifecycle — Route responsibility (D9)
    // Creates minimal honest context: SOUL owns extraction, Route owns session.
    let finalSessionId = session_id;
    if (!finalSessionId) {
      finalSessionId = await sessionService.createSession({
        entry_point: hotel_id || 'YEOSU_GENERAL',
        source: 'lumi'
      });
    } else {
      const isValid = await sessionService.isSessionValid(finalSessionId);
      if (!isValid) {
        // Stale session: create fresh rather than blocking the authenticated user
        finalSessionId = await sessionService.createSession({
          entry_point: hotel_id || 'YEOSU_GENERAL',
          source: 'lumi'
        });
      } else {
        await sessionService.touchSession(finalSessionId);
      }
    }

    // SOUL orchestration
    const soulResult = await handleTravelRequest({
      message,
      sessionId: finalSessionId,
      hotelId: hotel_id || null,
      principal: { ...req.principal, sowon_id: req.sowon_id }
    });

    if (!soulResult.ok) {
      return res.status(soulResult.httpStatus || 500).json({
        error: soulResult.error || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      });
    }

    // Canonical session_id from route lifecycle
    const response = { ...soulResult.payload, session_id: finalSessionId };

    logTravelInputEvent({
      session_id: finalSessionId,
      input_message: message.slice(0, 100),
      extracted_people_type: response.understood_context && response.understood_context.people_type,
      recommendations_count: response.places ? response.places.length : 0
    }).catch(err => console.error('Travel input event log failed:', err));

    res.json(response);
  } catch (error) {
    console.error('[TRAVEL_INPUT_ERROR]', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

async function logTravelInputEvent(eventData) {
  console.log('[TRAVEL_INPUT_EVENT]', eventData);
}

module.exports = router;
