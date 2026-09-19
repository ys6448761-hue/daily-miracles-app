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
    // Phase 2 additive fields
    time_of_day: soulContext.time_of_day || null,
    preference_type: soulContext.preference_type || null,
    budget_constraint: soulContext.budget_constraint || null,
    group_size: soulContext.group_size || null,
    requested_count: soulContext.requested_count || null,
    mobility_constraint: soulContext.mobility_constraint || null,
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

// ─── Private: Group quote detection ─────────────────────────────────────────

function _isGroupQuoteRequest(soulContext) {
  const groupSize = soulContext.group_size;
  const pt = soulContext.people_type;
  // 5+ people AND a quote/cost intent → human consultation territory
  if (!groupSize) return false;
  return groupSize >= 5 && (pt === 'group');
}

function _buildGroupQuoteMessage(soulContext) {
  const size = soulContext.group_size;
  return [
    `친구 ${size}명이시군요.`,
    `5명 이상 단체 여행 비용은 숙소·코스·식사 조합에 따라 크게 달라져서,`,
    `정확한 견적은 담당자와 직접 확인하는 편이 좋아요.`,
    ``,
    `지금 여수 관광지를 먼저 둘러보시겠어요?`,
    `아니면 단체 여행 상담을 연결해드릴까요?`
  ].join('\n');
}

// ─── Private: D7 Soul message ────────────────────────────────────────────────

function _generateSoulMessage(soulContext, status) {
  const provenance = soulContext._provenance || {};
  const pt = soulContext.people_type;
  const timeMinutes = soulContext.time_available_minutes;
  const timeKnown = provenance.time_available_minutes !== 'UNKNOWN';
  const timeOfDay = soulContext.time_of_day;
  const pref = soulContext.preference_type;
  const budget = soulContext.budget_constraint;

  // Companion acknowledgement
  let companionLine;
  if (pt === 'family_elderly') companionLine = '부모님과 함께';
  else if (pt === 'family_with_kids') companionLine = '아이들과 함께';
  else if (pt === 'couple') companionLine = '둘이 함께';
  else if (pt === 'group') companionLine = '일행과 함께';
  else companionLine = null; // solo — omit companion line, use situation instead

  // Build situation line
  let situationLine;
  if (timeOfDay === 'night' || timeOfDay === 'evening') {
    situationLine = companionLine
      ? `${companionLine} 밤 시간이 남으셨군요.`
      : '밤에 시간이 남으셨군요.';
  } else if (pref === 'photo') {
    situationLine = companionLine
      ? `${companionLine} 사진 찍기 좋은 곳을 찾으시는군요.`
      : '사진 찍기 좋은 곳을 찾으시는군요.';
  } else if (budget === 'free' || budget === 'low') {
    situationLine = companionLine
      ? `${companionLine} 가볍게 즐길 수 있는 곳을 찾으시는군요.`
      : '부담 없이 즐길 수 있는 곳을 찾으시는군요.';
  } else if (timeKnown && timeMinutes) {
    const timeLabel = timeMinutes < 60
      ? `${timeMinutes}분`
      : `${Math.round(timeMinutes / 60)}시간`;
    situationLine = companionLine
      ? `${companionLine} ${timeLabel} 정도 시간이 있으시군요.`
      : `${timeLabel} 정도 시간이 있으시군요.`;
  } else if (companionLine) {
    situationLine = `${companionLine} 여행이시군요.`;
  } else {
    situationLine = '지금 상황에 맞는 곳을 찾아볼게요.';
  }

  const mobilityConstraint = soulContext.mobility_constraint;
  const requestedCount = soulContext.requested_count;

  if (status === 'NO_RESULT') {
    return `${situationLine}\n조건에 맞는 장소를 찾지 못했어요. 시간이나 조건을 조정해보실래요?`;
  }

  // D6 soft clarification for UNKNOWN time (PARTIAL)
  if (status === 'PARTIAL') {
    if (pref === 'photo') {
      const countNote = requestedCount ? `${requestedCount}곳 요청하셨는데, ` : '';
      return `${situationLine}\n${countNote}사진 찍기 좋은 곳 위주로 골라봤어요.`;
    }
    if (mobilityConstraint === 'low_walking') {
      return `${situationLine}\n걷기 부담이 적은 곳을 고르려 했는데, 지금 장소 데이터에 보행 난이도 정보가 없어요.\n방문 전 각 장소의 도보 거리를 꼭 확인해보세요.`;
    }
    if (timeOfDay === 'night' || timeOfDay === 'evening') {
      return `${situationLine}\n지금 갈 수 있는 야간 명소를 골라봤어요.`;
    }
    if (budget === 'free' || budget === 'low') {
      return `${situationLine}\n부담 적은 곳 위주로 골라봤는데, 입장료는 직접 확인이 필요해요.`;
    }
    return `${situationLine}\n대략 2시간 기준으로 편하게 갈 곳을 골라봤어요.\n시간이 얼마나 남으셨어요?`;
  }

  // SUCCESS — second line based on companion + situation
  let secondLine;
  if (mobilityConstraint === 'low_walking') {
    secondLine = '걷기 부담이 적은 곳으로 골라봤는데, 보행 난이도 정보가 없어 방문 전 확인을 권장해요.';
  } else if (pt === 'family_elderly') {
    secondLine = '이동 부담이 적은 곳으로 골라봤어요.';
  } else if (pref === 'photo') {
    const countNote = requestedCount ? `${requestedCount}곳 ` : '';
    secondLine = `사진 잘 나오는 ${countNote}뷰 포인트를 골라봤어요.`;
  } else if (budget === 'free' || budget === 'low') {
    secondLine = '부담 적은 곳 위주로 골라봤는데, 입장료는 방문 전 확인을 권장해요.';
  } else if (timeOfDay === 'night' || timeOfDay === 'evening') {
    secondLine = '지금 가도 분위기 좋은 곳으로 골라봤어요.';
  } else {
    secondLine = '이동 시간까지 생각해서 편하게 갈 수 있는 곳으로 골라봐요.';
  }

  return `${situationLine}\n${secondLine}`;
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
      companion_constraints: soulContext.companion_constraints,
      // Phase 2 additive
      time_of_day: soulContext.time_of_day || null,
      preference_type: soulContext.preference_type || null,
      budget_constraint: soulContext.budget_constraint || null,
      group_size: soulContext.group_size || null,
      requested_count: soulContext.requested_count || null,
      mobility_constraint: soulContext.mobility_constraint || null
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

  // GROUP QUOTE ROUTING — 5+ people with cost/quote intent → human consultation
  if (_isGroupQuoteRequest(soulContext)) {
    const quoteMessage = _buildGroupQuoteMessage(soulContext);
    const payload = {
      session_id: sessionId,
      understood_context: {
        people_type: soulContext.people_type,
        time_available_minutes: soulContext.time_available_minutes,
        meal_context: soulContext.meal_context,
        companion_constraints: soulContext.companion_constraints,
        group_size: soulContext.group_size
      },
      places: [],
      why_details: [],
      message_ko: quoteMessage,
      status: 'GROUP_CONSULTATION_REQUIRED',
      next_options: ['여수 관광지 먼저 둘러보기', '단체 여행 상담 연결'],
      group_size: soulContext.group_size,
      timestamp: new Date().toISOString()
    };
    return { ok: true, payload };
  }

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
