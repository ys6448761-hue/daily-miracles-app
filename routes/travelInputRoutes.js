/**
 * Travel Input Routes
 * Natural language text input endpoint for LUMI travel system
 * POST /api/dt/travel/input/text
 */

const express = require('express');
const contextExtractionService = require('../services/contextExtractionService');
const travelGuideService = require('../services/travelGuideService');
const sessionService = require('../services/sessionService');
const { requireAuthenticatedPrincipal } = require('../middleware/authenticatedPrincipal');

const router = express.Router();

// Canonical partner_code pattern — mirrors sessionService.ENTRY_POINT_PATTERN
// Accepts RAMADA, KENNY, HOTEL_ABC. Rejects free text, lowercase, spaces, SQL fragments.
const ENTRY_POINT_PATTERN = /^[A-Z][A-Z0-9_]{0,29}$/;

/**
 * POST /api/dt/travel/input/text
 * Accept natural language input, extract context, return recommendations
 * Body: { message: string, session_id?: string, hotel_id?: string }
 * Returns: { session_id, understood_context, places, why_details, message_ko }
 */
router.post('/input/text', requireAuthenticatedPrincipal, async (req, res) => {
  try {
    const { message, session_id, hotel_id } = req.body;

    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: '질문을 입력해주세요.'
      });
    }

    // 1. Extract context from natural language
    const context = await contextExtractionService.parseUserMessage(message);

    // Handle extraction errors
    if (context.error) {
      return res.status(400).json({
        error: context.error
      });
    }

    // 2. Set up session
    let finalSessionId = session_id;
    if (!finalSessionId) {
      finalSessionId = await sessionService.createSession(context);
    } else {
      const isValid = await sessionService.isSessionValid(finalSessionId);
      if (!isValid) {
        // Stale session: create a fresh one rather than blocking the authenticated user
        finalSessionId = await sessionService.createSession(context);
      } else {
        await sessionService.touchSession(finalSessionId);
      }
    }

    // Set session ID in context
    context.session_id = finalSessionId;

    // Set entry point if hotel_id provided
    if (hotel_id) {
      if (!ENTRY_POINT_PATTERN.test(hotel_id)) {
        return res.status(400).json({ error: 'INVALID_HOTEL_ID' });
      }
      context.entry_point = hotel_id;
    } else {
      context.entry_point = context.entry_point || 'YEOSU_GENERAL';
    }

    // Set user mode
    context.user_mode = 'DEFAULT';

    // 3. Get recommendations from travelGuideService
    const recommendations = await travelGuideService.recommend(context);

    // 4. Build response with understood context and why details
    const response = {
      session_id: finalSessionId,
      understood_context: {
        people_type: context.people_type,
        time_available_minutes: context.time_available_minutes,
        meal_context: context.meal_context,
        companion_constraints: context.companion_constraints
      },
      places: recommendations.places || [],
      why_details: generateWhyDetails(recommendations, context),
      message_ko: generateContextMessage(context)
    };

    // 5. Log event asynchronously
    logTravelInputEvent({
      session_id: finalSessionId,
      input_message: message.slice(0, 100),
      extracted_people_type: context.people_type,
      recommendations_count: recommendations.places?.length || 0
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

/**
 * Generate "why" details for each recommendation
 * @private
 */
function generateWhyDetails(recommendations, context) {
  return (recommendations.places || []).map((place, idx) => ({
    user_conditions: buildUserConditions(context),
    place_features: buildPlaceFeatures(place),
    confidence: place.matching_score || place.confidence_score || 0.7
  }));
}

/**
 * Build user conditions list
 * @private
 */
function buildUserConditions(context) {
  const conditions = [];

  if (context.time_available_minutes) {
    conditions.push(`${context.time_available_minutes}분 가능`);
  }

  if (context.people_type === 'family_with_kids') {
    conditions.push(`아이들과 함께`);
    if (context.companion_constraints?.kids_age) {
      conditions.push(`(만 ${context.companion_constraints.kids_age}세)`);
    }
  } else if (context.people_type === 'couple') {
    conditions.push('둘이 함께');
  } else if (context.people_type === 'family_elderly') {
    conditions.push('어르신과 함께');
  } else if (context.people_type === 'group') {
    conditions.push('단체 여행');
  } else {
    conditions.push('혼자');
  }

  if (context.meal_context === 'lunch') {
    conditions.push('점심시간');
  } else if (context.meal_context === 'dinner') {
    conditions.push('저녁시간');
  }

  return conditions;
}

/**
 * Build place features list
 * @private
 */
function buildPlaceFeatures(place) {
  const features = [];

  if (place.suitable_for && place.suitable_for.length > 0) {
    features.push(...place.suitable_for.slice(0, 2));
  }

  if (place.emotion_tags && place.emotion_tags.length > 0) {
    features.push(...place.emotion_tags.slice(0, 2));
  }

  if (place.avg_stay_minutes) {
    features.push(`${place.avg_stay_minutes}분 체류`);
  }

  if (place.accessibility_wheelchair) {
    features.push('휠체어 접근 가능');
  }

  if (place.accessibility_stroller) {
    features.push('유모차 접근 가능');
  }

  return features.slice(0, 4);
}

/**
 * Generate context message for UI display
 * @private
 */
function generateContextMessage(context) {
  const parts = [];

  // People type
  if (context.people_type === 'family_with_kids') {
    parts.push('아이들과 함께');
  } else if (context.people_type === 'couple') {
    parts.push('둘이 함께');
  } else if (context.people_type === 'family_elderly') {
    parts.push('어르신과 함께');
  } else if (context.people_type === 'group') {
    parts.push('단체로');
  } else {
    parts.push('혼자');
  }

  // Time
  if (context.time_available_minutes) {
    parts.push(`${context.time_available_minutes}분`);
  }

  // Meal time
  if (context.meal_context === 'lunch') {
    parts.push('점심때');
  } else if (context.meal_context === 'dinner') {
    parts.push('저녁때');
  }

  return `${parts.join(', ')}. 지금 상황에 맞는 곳으로 골라볼게요.`;
}

/**
 * Log travel input event
 * @private
 */
async function logTravelInputEvent(eventData) {
  // Implementation depends on existing logging infrastructure
  // Placeholder for now
  console.log('[TRAVEL_INPUT_EVENT]', eventData);
}

// Export private functions for testing
router.generateWhyDetails = generateWhyDetails;
router.buildUserConditions = buildUserConditions;
router.buildPlaceFeatures = buildPlaceFeatures;
router.generateContextMessage = generateContextMessage;

module.exports = router;
