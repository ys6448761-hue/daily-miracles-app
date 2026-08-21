/**
 * Travel Guide Routes
 * Phase 1 API endpoints:
 * - POST /api/dt/travel/recommend
 * - POST /api/dt/travel/events
 * - GET /api/dt/travel/health-check
 */

const express = require('express');
const sessionService = require('../services/sessionService');
const travelGuideService = require('../services/travelGuideService');
const db = require('../database/db');

const router = express.Router();

/**
 * POST /api/dt/travel/recommend
 * Main recommendation endpoint
 * Body: { context: TravelGuideContext }
 * Returns: RecommendationResponse
 */
router.post('/recommend', async (req, res) => {
  try {
    const { context } = req.body;

    if (!context) {
      return res.status(400).json({
        error: 'Missing context',
        message: 'Request body must include context object',
      });
    }

    // Validate or create session
    let sessionId = context.session_id;

    if (!sessionId) {
      // Create new session
      sessionId = await sessionService.createSession(context);
      context.session_id = sessionId;
    } else {
      // Validate existing session (check validity only, context passed in request)
      const isValid = await sessionService.isSessionValid(sessionId);
      if (!isValid) {
        return res.status(401).json({
          error: 'Session expired or invalid',
          message: 'Please restart your travel journey',
        });
      }
      // Touch session for activity tracking
      await sessionService.touchSession(sessionId);
    }

    // Get recommendations
    const response = await travelGuideService.recommend(context);

    // Log event (asynchronously, don't block response)
    logEvent({
      session_id: sessionId,
      entry_point: context.entry_point,
      user_mode: context.user_mode,
      event_type: 'RECOMMEND_REQUESTED',
      event_data: {
        place_code: response.places[0]?.place_code || null,
        experience_type: context.people_type,
      },
    }).catch((err) => console.error('Event logging failed:', err));

    res.json(response);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      error: 'Recommendation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/dt/travel/events
 * Analytics endpoint (privacy-first)
 * Body: { session_id, entry_point, user_mode, event_type, event_data }
 * Stores: session_id, entry_point, user_mode, event_type, event_data
 * Excludes: wish_text, user_id, exact location, room_number, personal Q&A
 */
router.post('/events', async (req, res) => {
  try {
    const { session_id, entry_point, user_mode, event_type, event_data } = req.body;

    if (!session_id || !event_type) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'event must include session_id and event_type',
      });
    }

    // Validate session exists
    const isValid = await sessionService.isSessionValid(session_id);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid session',
      });
    }

    // Insert event (privacy-safe data only)
    const query = `
      INSERT INTO travel_guide_events (
        session_id, entry_point, user_mode, event_type, event_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `;

    const result = await db.query(query, [
      session_id,
      entry_point,
      user_mode,
      event_type,
      JSON.stringify(event_data || {}),
    ]);

    res.json({
      success: true,
      event_id: result.rows[0]?.id,
    });
  } catch (error) {
    console.error('Event logging error:', error);
    res.status(500).json({
      error: 'Event logging failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/dt/travel/health-check
 * Readiness probe (DB connectivity + data availability)
 * Returns: { status, database, places_count, restaurants_count, timestamp }
 */
router.get('/health-check', async (req, res) => {
  try {
    // Check DB connectivity
    const dbCheck = await db.query('SELECT 1');
    if (!dbCheck) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }

    // Count places (V1: KR/YEOSU)
    const placesResult = await db.query(
      `SELECT COUNT(*) as count FROM travel_places
       WHERE country_code = 'KR' AND city_code = 'YEOSU'`
    );
    const placesCount = parseInt(placesResult.rows[0]?.count || 0, 10);

    // Count restaurants (V1: KR/YEOSU)
    const restaurantsResult = await db.query(
      `SELECT COUNT(*) as count FROM travel_restaurants
       WHERE country_code = 'KR' AND city_code = 'YEOSU'`
    );
    const restaurantsCount = parseInt(restaurantsResult.rows[0]?.count || 0, 10);

    // Count live statuses
    const liveStatusResult = await db.query(
      `SELECT COUNT(*) as count FROM travel_live_status
       WHERE country_code = 'KR' AND city_code = 'YEOSU'`
    );
    const liveStatusCount = parseInt(liveStatusResult.rows[0]?.count || 0, 10);

    res.json({
      status: 'healthy',
      database: 'connected',
      data: {
        places: placesCount,
        restaurants: restaurantsCount,
        live_statuses: liveStatusCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Helper: Log event asynchronously
 * @private
 */
async function logEvent(eventPayload) {
  try {
    const query = `
      INSERT INTO travel_guide_events (
        session_id, entry_point, user_mode, event_type, event_data, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await db.query(query, [
      eventPayload.session_id,
      eventPayload.entry_point,
      eventPayload.user_mode,
      eventPayload.event_type,
      JSON.stringify(eventPayload.event_data || {}),
    ]);
  } catch (error) {
    console.error('Event logging error:', error);
  }
}

module.exports = router;
