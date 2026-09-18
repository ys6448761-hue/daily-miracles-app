/**
 * Soyeowool Service (소여울 / SOUL)
 * Phase 1 thin orchestration boundary — TRAVEL_INTELLIGENCE
 *
 * D6: UNKNOWN → PARTIAL + DOMAIN_FALLBACK + soft clarification
 * D7: SOUL owns conversational explanation (natural time units)
 * D8: SOWON_ID through-carry, no new DB
 * D9: Session lifecycle owned by caller (travelInputRoutes)
 * D10: Single-intent only — multi-intent is V0.2 (MULTI_INTENT_V02_REQUIRED)
 * D11: confidence = null — TRAVEL_INTELLIGENCE semantics undefined in Phase 1
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const contextExtractionService = require('./contextExtractionService');
const travelGuideService = require('./travelGuideService');

const CAPABILITY = 'TRAVEL_INTELLIGENCE';
const SOURCE = 'travelGuideService/8-filter-cascade';

// ─── Private: Understand ─────────────────────────────────────────────────────

async function _understand(message) {
  const soulContext = await contextExtractionService.parseUserMessage(message);
  if (soulContext.error) {
    return { ok: false, error: soulContext.error };
  }
  return { ok: true, soulContext };
}

// ─── Private: Domain context (D5 + DOMAIN_FALLBACK) ─────────────────────────

function _identifyDomainFallbacks(provenance) {
  if (!provenance) return [];
  return Object.keys(provenance).filter(field => provenance[field] === 'UNKNOWN');
}

function _buildDomainContext(soulContext, sessionId, hotelId) {
  return {
    session_id: sessionId,
    entry_point: hotelId || soulContext.entry_point || 'YEOSU_GENERAL',
    user_mode: soulContext.user_mode || 'DEFAULT',
    country_code: soulContext.country_code || 'KR',
    city_code: soulContext.city_code || 'YEOSU',
    time_available_minutes: soulContext.time_available_minutes,
    people_type: soulContext.people_type,
    companion_constraints: soulContext.companion_constraints,
    meal_context: soulContext.meal_context,
    has_car: soulContext.has_car,
    mobility_type: soulContext.mobility_type,
    wish_context: soulContext.wish_context,
    exclude_place_ids: soulContext.exclude_place_ids || [],
    must_visit_place_ids: soulContext.must_visit_place_ids || [],
    _domainFallbacks: _identifyDomainFallbacks(soulContext._provenance)
    // D5: sowon_id, phone, name, wish_text excluded — not forwarded to domain
  };
}

// ─── Private: Request envelope ───────────────────────────────────────────────

function _buildRequestEnvelope(principal, soulContext, sessionId) {
  return {
    request_id: uuidv4(),
    sowon_id: (principal && principal.sowon_id) || null,
    capability: CAPABILITY,
    intent: 'travel_recommendation',
    context: {
      // D5 minimum — no PII forwarded
      people_type: soulContext.people_type,
      time_available_minutes: soulContext.time_available_minutes,
      provenance: soulContext._provenance
    },
    constraints: {},
    requested_output: ['places', 'why_factors'],
    timestamp: new Date().toISOString(),
    source: 'SOYEOWOOL',
    session_id: sessionId
  };
}

// ─── Private: Route to domain ────────────────────────────────────────────────

async function _routeToTravelIntelligence(domainContext) {
  try {
    const tgResult = await travelGuideService.recommend(domainContext);
    return { ok: true, tgResult };
  } catch (err) {
    console.error('[SOUL_ROUTE_ERROR]', { message: err.message });
    return { ok: false, error: err.message };
  }
}

// ─── Private: Status ─────────────────────────────────────────────────────────

function _deriveStatus(tgResult, domainContext) {
  if (!tgResult || !Array.isArray(tgResult.places)) {
    return 'ERROR';
  }
  if (tgResult.places.length === 0) {
    return 'NO_RESULT';
  }
  if (
    domainContext._domainFallbacks &&
    domainContext._domainFallbacks.includes('time_available_minutes')
  ) {
    return 'PARTIAL';
  }
  return 'SUCCESS';
}

// ─── Private: Why details ────────────────────────────────────────────────────

function _buildUserConditions(domainContext) {
  const conditions = [];

  if (domainContext.time_available_minutes) {
    conditions.push(`${domainContext.time_available_minutes}분 가능`);
  }

  const pt = domainContext.people_type;
  if (pt === 'family_with_kids') {
    conditions.push('아이들과 함께');
    if (domainContext.companion_constraints && domainContext.companion_constraints.kids_age) {
      conditions.push(`(만 ${domainContext.companion_constraints.kids_age}세)`);
    }
  } else if (pt === 'couple') {
    conditions.push('둘이 함께');
  } else if (pt === 'family_elderly') {
    conditions.push('어르신과 함께');
  } else if (pt === 'group') {
    conditions.push('단체 여행');
  } else {
    conditions.push('혼자');
  }

  const mc = domainContext.meal_context;
  if (mc === 'lunch') conditions.push('점심시간');
  else if (mc === 'dinner') conditions.push('저녁시간');

  return conditions;
}

function _buildPlaceFeatures(place) {
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
  if (place.accessibility_wheelchair) features.push('휠체어 접근 가능');
  if (place.accessibility_stroller) features.push('유모차 접근 가능');
  return features.slice(0, 4);
}

function _buildWhyDetails(tgResult, domainContext) {
  return (tgResult.places || []).map(place => ({
    user_conditions: _buildUserConditions(domainContext),
    place_features: _buildPlaceFeatures(place),
    confidence: place.matching_score || place.confidence_score || 0.7
  }));
}

// ─── Private: D7 Soul message ────────────────────────────────────────────────

function _generateSoulMessage(soulContext, status) {
  const provenance = soulContext._provenance || {};
  const pt = soulContext.people_type;
  const timeMinutes = soulContext.time_available_minutes;
  const timeKnown = provenance.time_available_minutes !== 'UNKNOWN';

  let companionLine;
  if (pt === 'family_elderly') companionLine = '어르신과 함께';
  else if (pt === 'family_with_kids') companionLine = '아이들과 함께';
  else if (pt === 'couple') companionLine = '둘이 함께';
  else if (pt === 'group') companionLine = '단체로';
  else companionLine = '혼자';

  let firstLine;
  if (timeKnown && timeMinutes) {
    if (timeMinutes < 60) {
      firstLine = `${companionLine} ${timeMinutes}분이시군요.`;
    } else {
      const hours = Math.round(timeMinutes / 60);
      firstLine = `${companionLine} ${hours}시간이시군요.`;
    }
  } else {
    firstLine = `${companionLine} 여행이시군요.`;
  }

  if (status === 'NO_RESULT') {
    return `${firstLine}\n조건에 맞는 장소를 찾지 못했어요. 시간이나 조건을 조정해보실래요?`;
  }

  // D6 soft clarification for UNKNOWN time (PARTIAL)
  if (status === 'PARTIAL') {
    return `${firstLine}\n대략 2시간 기준으로 편하게 갈 곳을 골라봤어요.\n시간이 얼마나 남으셨어요?`;
  }

  const secondLine =
    pt === 'family_elderly'
      ? '편하게 다니실 수 있는 곳으로 골라봤어요.'
      : '지금 상황에 맞는 곳으로 골라봤어요.';

  return `${firstLine}\n${secondLine}`;
}

// ─── Private: Result envelope ────────────────────────────────────────────────

function _buildResultEnvelope(request, tgResult, domainContext, status) {
  const constraints = [];
  if (
    status === 'PARTIAL' &&
    domainContext._domainFallbacks &&
    domainContext._domainFallbacks.includes('time_available_minutes')
  ) {
    constraints.push('시간 미확인 — 2시간 기준 DOMAIN_FALLBACK 적용');
  }

  const nextOptions = [];
  if (status === 'NO_RESULT') {
    nextOptions.push('시간 조건을 늘리면 더 많은 곳을 추천할 수 있어요');
    nextOptions.push('제약 조건을 변경해보세요');
  } else if (status === 'PARTIAL') {
    nextOptions.push('시간이 얼마나 남으셨어요?');
  }

  let why;
  if (status === 'SUCCESS') {
    why = '여행 컨텍스트 기준으로 추천했어요';
  } else if (status === 'PARTIAL') {
    why = '시간을 2시간 기준으로 적용했어요 — 더 정확한 추천을 위해 시간을 알려주세요';
  } else if (status === 'NO_RESULT') {
    why = '현재 조건에 맞는 장소를 찾지 못했어요';
  } else {
    why = '서비스 처리 중 오류가 발생했어요';
  }

  return {
    request_id: request.request_id,
    sowon_id: request.sowon_id,
    capability: CAPABILITY,
    status,
    result: tgResult || {},
    why,
    confidence: null, // D11: Phase 1 — TRAVEL_INTELLIGENCE confidence semantics not defined
    source: SOURCE,
    constraints,
    valid_until: null,
    next_options: nextOptions,
    timestamp: new Date().toISOString()
  };
}

// ─── Private: Client payload ─────────────────────────────────────────────────

function _buildClientPayload(result, tgResult, whyDetails, soulMessage, sessionId, soulContext) {
  return {
    // Backward-compatible — LumiTravelPage contract preserved
    session_id: sessionId,
    understood_context: {
      people_type: soulContext.people_type,
      time_available_minutes: soulContext.time_available_minutes,
      meal_context: soulContext.meal_context,
      companion_constraints: soulContext.companion_constraints
    },
    places: (tgResult && tgResult.places) ? tgResult.places : [],
    why_details: whyDetails,
    message_ko: soulMessage,
    // Additive Protocol fields (forward-compatible — frontend ignores unknown fields)
    request_id: result.request_id,
    sowon_id: result.sowon_id,
    status: result.status,
    confidence: result.confidence,
    source: result.source,
    next_options: result.next_options,
    timestamp: result.timestamp
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function handleTravelRequest({ message, sessionId, hotelId, principal }) {
  // UNDERSTAND
  const understandResult = await _understand(message);
  if (!understandResult.ok) {
    return { ok: false, httpStatus: 400, error: understandResult.error };
  }
  const { soulContext } = understandResult;

  // CONSTRUCT REQUEST ENVELOPE (internal audit — not returned to client directly)
  const request = _buildRequestEnvelope(principal, soulContext, sessionId);

  // D5 DOMAIN CONTEXT + DOMAIN_FALLBACK labeling
  const domainContext = _buildDomainContext(soulContext, sessionId, hotelId);

  // ROUTE TO TRAVEL_INTELLIGENCE
  const routeResult = await _routeToTravelIntelligence(domainContext);
  if (!routeResult.ok) {
    return { ok: false, httpStatus: 500, error: routeResult.error };
  }
  const { tgResult } = routeResult;

  // STATUS
  const status = _deriveStatus(tgResult, domainContext);

  // D7 SOUL MESSAGE
  const soulMessage = _generateSoulMessage(soulContext, status);

  // WHY DETAILS
  const whyDetails = _buildWhyDetails(tgResult, domainContext);

  // RESULT ENVELOPE
  const result = _buildResultEnvelope(request, tgResult, domainContext, status);

  // CLIENT PAYLOAD
  const payload = _buildClientPayload(result, tgResult, whyDetails, soulMessage, sessionId, soulContext);

  return { ok: true, payload };
}

module.exports = { handleTravelRequest };
