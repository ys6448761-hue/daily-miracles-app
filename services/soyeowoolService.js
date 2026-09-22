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
const sharedJourneyService = require('./sharedJourneyService');
const quoteContextService = require('./quoteContextService');
const quoteEngine = require('./quoteEngine');

const CAPABILITY = 'TRAVEL_INTELLIGENCE';
const SOURCE = 'travelGuideService/8-filter-cascade';

// ─── PLACE_LOOKUP: alias map ──────────────────────────────────────────────────
// Maps Korean name/alias → travel_places.code
// Only verified travel_places codes. Alias ≠ unverified place name.
const PLACE_ALIAS_MAP = {
  '이순신광장':     'lee_soon_shin_plaza',
  '이순신 광장':    'lee_soon_shin_plaza',
  '오동도':         'odongdo',
  '향일암':         'hyangiram',
  '케이블카':       'cablecar',
  '해상케이블카':   'cablecar',
  '여수 해상케이블카': 'cablecar',
  '자산공원':       'jaisan_park',
  '돌산대교':       'dolsan_daegyo',
  '돌산공원':       'dolsan_nightscape',
  '낭만포차거리':   'romantic_pojangmacha',
  '포차거리':       'romantic_pojangmacha',
  '낭만포차':       'romantic_pojangmacha',
  '중앙시장':       'jungang_market',
  '여수중앙시장':   'jungang_market',
  '스카이타워':     'sky_tower',
  '해양공원':       'marine_park',
  '종포해양공원':   'marine_park',
  '엑스포공원':     'yeosu_expo_park',
  '여수엑스포장':   'yeosu_expo_park',
  '엑스포장':       'yeosu_expo_park',
};

// Strong lookup verbs — unambiguously signal "tell me ABOUT this place"
// 20-char proximity window from alias end
const STRONG_LOOKUP = /에 대해|설명해줘|설명해주세요|어떤 곳이야|이란 뭐|뭐야/;
const STRONG_PROXIMITY = 20;

// Medium lookup verbs — need tight proximity (≤ 6 chars) to avoid false positives
// e.g. "케이블카 포함해서 알려줘" → "알려줘" is 9+ chars away → NOT lookup
const MEDIUM_LOOKUP = /알려줘|알려주세요|어때\??|어떤가요|은\?|는\?|이야\??/;
const MEDIUM_PROXIMITY = 6;

// DISCOVERY overrides — when any of these appear, treat as DISCOVERY
// even if a known place alias is present in the message
const DISCOVERY_OVERRIDES = /근처|어디 갈|어디가 좋|갈만|가볼 만|추천해|뭐 할까|어디서|같이 갈|같이 어디|타고 싶|가고 싶|하고 싶|일정|비용|얼마|포함/;

// Place-like noun suffixes — for unknown place detection
const PLACE_SUFFIX_RE = /공원|시장|광장|대교|타워|암자|향일암|해변|마을|포차거리|케이블카|전망대|박물관|기념관|해수욕/;

// Strong lookup for full-message unknown-place check
const STRONG_LOOKUP_ANY = /에 대해|설명해줘|설명해주세요/;

/**
 * Detect PLACE_LOOKUP intent from raw message.
 * Returns { isPlaceLookup, placeName, resolvedCode }
 *
 * Rules:
 * 1. No DISCOVERY override signals → otherwise DISCOVERY wins.
 * 2. KNOWN alias: STRONG lookup within 20 chars OR MEDIUM lookup within 6 chars of alias end.
 * 3. UNKNOWN place (no alias): PLACE_SUFFIX + STRONG_LOOKUP_ANY anywhere in message.
 */
function _detectPlaceLookupIntent(message) {
  if (!message) return { isPlaceLookup: false };

  // DISCOVERY override always wins
  if (DISCOVERY_OVERRIDES.test(message)) return { isPlaceLookup: false };

  // Try to match a known alias (longest-first for specificity)
  const aliases = Object.keys(PLACE_ALIAS_MAP).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const idx = message.indexOf(alias);
    if (idx === -1) continue;
    const afterAlias = message.slice(idx + alias.length);
    if (STRONG_LOOKUP.test(afterAlias.slice(0, STRONG_PROXIMITY))) {
      return { isPlaceLookup: true, placeName: alias, resolvedCode: PLACE_ALIAS_MAP[alias] };
    }
    if (MEDIUM_LOOKUP.test(afterAlias.slice(0, MEDIUM_PROXIMITY))) {
      return { isPlaceLookup: true, placeName: alias, resolvedCode: PLACE_ALIAS_MAP[alias] };
    }
  }

  // No known alias — check if message mentions an unknown place-like noun with a strong lookup verb
  if (PLACE_SUFFIX_RE.test(message) && STRONG_LOOKUP_ANY.test(message)) {
    const verbMatch = message.match(/^(.+?)\s*(에 대해|설명해줘|설명해주세요)/);
    const placeName = verbMatch ? verbMatch[1].trim() : message.replace(/[?!。，,.]/g, '').trim();
    return { isPlaceLookup: true, placeName, resolvedCode: null };
  }

  return { isPlaceLookup: false };
}

/**
 * Build SOUL explanation for a known verified place.
 * Uses only available DB fields — never fabricates facts.
 */
function _buildPlaceLookupMessage(place) {
  const parts = [];
  const name = place.name_ko;

  parts.push(`${name}에 대해 알려드릴게요.`);

  // Description if available
  if (place.description_short) {
    parts.push(place.description_short);
  }

  // Indoor/outdoor
  const io = place.indoor_outdoor;
  if (io === 'outdoor')          parts.push('야외 공간이에요.');
  else if (io === 'indoor')      parts.push('실내 시설이에요.');
  else if (io === 'indoor_outdoor' || io === 'mixed') parts.push('실내·외 혼합 공간이에요.');

  // Stay time
  if (place.avg_stay_minutes) {
    const t = place.avg_stay_minutes;
    const tLabel = t < 60 ? `${t}분` : t % 60 === 0 ? `${t / 60}시간` : `약 ${Math.round(t / 60)}시간`;
    parts.push(`평균 체류시간은 약 ${tLabel}이에요.`);
  }

  // Admission fee
  const fee = place.admission_fee_json;
  if (fee && typeof fee.adult === 'number') {
    if (fee.adult === 0) {
      parts.push('입장료는 무료예요.');
    } else {
      const feeStr = fee.adult.toLocaleString();
      const extraFees = [];
      if (typeof fee.youth === 'number')  extraFees.push(`청소년 ${fee.youth.toLocaleString()}원`);
      if (typeof fee.child === 'number')  extraFees.push(`어린이 ${fee.child.toLocaleString()}원`);
      const extraStr = extraFees.length ? ` / ${extraFees.join(' / ')}` : '';
      parts.push(`성인 입장료 ${feeStr}원이에요${extraStr}.`);
    }
  } else if (fee === null && place.code === 'cablecar') {
    parts.push('이용 요금이 있어요. 상세 금액은 예약 시 안내드려요.');
  }

  // Opening hours
  const hours = place.opening_hours_json;
  if (hours) {
    const monHours = hours.mon || hours.tue || hours.wed;
    if (monHours) {
      parts.push(`운영시간 ${monHours} (방문 전 확인 권장).`);
    }
  }

  // Physical difficulty
  if (place.physical_difficulty === 'high') {
    parts.push('계단과 경사가 있어 보행이 불편한 분들은 주의가 필요해요.');
  }

  // Live status caution — only when explicitly required (not outdoor public spaces)
  if (place.live_status_required) {
    parts.push('방문 전 운영 여부를 꼭 확인해보세요.');
  }

  return parts.join('\n');
}

/**
 * Client payload for a successfully resolved PLACE_LOOKUP.
 * Single place in `places[]` — backward-compatible with card-based frontend.
 */
function _buildPlaceLookupClientPayload(place, sessionId) {
  return {
    session_id: sessionId,
    understood_context: {},
    places: [place],
    why_details: [],
    message_ko: _buildPlaceLookupMessage(place),
    status: 'PLACE_LOOKUP',
    intent: 'PLACE_LOOKUP',
    resolved_code: place.code,
    next_options: [],
    timestamp: new Date().toISOString(),
    shared_journey: null,
    quote: null,
    route: null,
  };
}

/**
 * Client payload for an UNKNOWN named-place query.
 * DO NOT substitute an unrelated place — return PLACE_UNKNOWN.
 */
function _buildUnknownPlacePayload(placeName, sessionId) {
  const safeName = (placeName || '').replace(/[<>]/g, '').trim();
  return {
    session_id: sessionId,
    understood_context: {},
    places: [],
    why_details: [],
    message_ko: [
      `${safeName}에 대해 물어보셨군요.`,
      `현재 제가 가진 검증된 장소 정보에서는 찾을 수 없어요.`,
      `가고 싶은 분위기나 조건을 알려주시면, 맞는 곳을 찾아드릴게요.`,
    ].join('\n'),
    status: 'PLACE_UNKNOWN',
    intent: 'PLACE_LOOKUP',
    resolved_code: null,
    next_options: ['가고 싶은 분위기를 알려주세요'],
    timestamp: new Date().toISOString(),
    shared_journey: null,
    quote: null,
    route: null,
  };
}

// ─── Private: Understand ─────────────────────────────────────────────────────

// Deterministic post-extraction correction for couple/partner language.
// contextExtractionService._applyExplicitCompanionGuard checks message.includes('친구랑'),
// which is a substring of '여자친구랑' and '남자친구랑' — causing those to be
// misclassified as people_type='group'. This guard corrects after extraction,
// without modifying the locked contextExtractionService.
const PARTNER_PHRASES = ['여자친구', '남자친구', '와이프', '남편', '아내', '배우자', '연인'];

function _correctCoupleClassification(message, soulContext) {
  if (soulContext.people_type !== 'group') return soulContext;
  const isPartner = PARTNER_PHRASES.some(p => message.includes(p));
  if (!isPartner) return soulContext;
  return {
    ...soulContext,
    people_type: 'couple',
    _provenance: {
      ...(soulContext._provenance || {}),
      people_type: 'USER_EXPLICIT'
    }
  };
}

async function _understand(message) {
  const soulContext = await contextExtractionService.parseUserMessage(message);
  if (soulContext.error) {
    return { ok: false, error: soulContext.error };
  }
  return { ok: true, soulContext: _correctCoupleClassification(message, soulContext) };
}

// ─── Private: Shared Journey (V0.2) ──────────────────────────────────────────

async function _extractSharedJourney(message) {
  return sharedJourneyService.extractSharedJourney(message);
}

/**
 * Derive minimum domain-relevant signals from sharedJourney.
 * Rules:
 *   - EXPERIENCED items → NEVER added to exclude_place_ids (EXPERIENCED ≠ EXCLUDE)
 *   - repeat_intent night condition → supplement time_of_day if not already set
 *   - companion mobility_hint=low_walking → supplement mobility_constraint if not already set
 *   - Companion relationship labels not forwarded to domain
 */
function _supplementDomainFromSharedJourney(domainContext, sharedJourney) {
  if (!sharedJourney) return domainContext;

  const supplemented = Object.assign({}, domainContext);

  // Supplement time_of_day from repeat_intent conditions
  if (!supplemented.time_of_day && sharedJourney.repeat_intent) {
    const conds = sharedJourney.repeat_intent.conditions || [];
    if (conds.includes('night'))   supplemented.time_of_day = 'night';
    else if (conds.includes('morning')) supplemented.time_of_day = 'morning';
    else if (conds.includes('evening')) supplemented.time_of_day = 'evening';
  }

  // Supplement mobility_constraint from companion voices
  if (!supplemented.mobility_constraint) {
    const hasLowWalking = (sharedJourney.companion_voices || []).some(
      cv => cv.mobility_hint === 'low_walking'
    );
    if (hasLowWalking) supplemented.mobility_constraint = 'low_walking';
  }

  // EXPERIENCED ≠ EXCLUDE: explicitly do not add experienced to exclude_place_ids
  // (no-op guard — just documents the invariant)

  return supplemented;
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
    domainContext._domainFallbacks.includes('time_available_minutes') &&
    !domainContext._isMultiDayTrip
  ) {
    return 'PARTIAL';
  }
  return 'SUCCESS';
}

// ─── Private: Why details ────────────────────────────────────────────────────

function _buildUserConditions(domainContext) {
  const conditions = [];

  const timeIsDefault = (domainContext._domainFallbacks && domainContext._domainFallbacks.includes('time_available_minutes')) || domainContext._isMultiDayTrip;
  if (domainContext.time_available_minutes && !timeIsDefault) {
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
    const gs = domainContext.group_size;
    conditions.push(gs && gs >= 5 ? '단체 여행' : '친구와 함께');
  } else {
    conditions.push('혼자');
  }

  const mc = domainContext.meal_context;
  if (mc === 'lunch') conditions.push('점심시간');
  else if (mc === 'dinner') conditions.push('저녁시간');

  return conditions;
}

const PLACE_TAG_KO = {
  family: '가족 여행', kids_ok: '아이와 함께', couple: '커플 추천',
  solo: '혼자 여행', elderly: '어르신 동반', group: '단체 여행',
  view: '전망 좋음', adventure: '액티비티', photo: '사진 명소',
  food: '맛집 인근', history: '역사·문화', nature: '자연', night: '야경',
  walking: '산책', waterfront: '해변·바다', indoor: '실내', outdoor: '야외',
};

function _buildPlaceFeatures(place) {
  const features = [];
  if (place.suitable_for && place.suitable_for.length > 0) {
    const translated = place.suitable_for.slice(0, 2).map(t => PLACE_TAG_KO[t] || null).filter(Boolean);
    features.push(...translated);
  }
  if (place.emotion_tags && place.emotion_tags.length > 0) {
    const translated = place.emotion_tags.slice(0, 2).map(t => PLACE_TAG_KO[t] || null).filter(Boolean);
    features.push(...translated);
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
    ``,
    `5명 이상 단체여행은 숙소·차량·식사와 일정에 따라`,
    `견적이 달라져요.`,
    ``,
    `무여정이 정확한 여행 준비를 위해`,
    `여수여행센터 담당자에게 연결해드릴게요.`
  ].join('\n');
}

// ─── Private: D7 Soul message ────────────────────────────────────────────────

function _isMultiDayTrip(message) {
  return /\d박\d일|\d박\s*\d일|1박|2박|3박/.test(message || '');
}

function _generateSoulMessage(soulContext, status, message) {
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
  // Multi-day trips: time_of_day from GPT may reflect hotel "overnight" context,
  // not the user's desired activity time. Guard before timeOfDay check.
  let situationLine;
  if (_isMultiDayTrip(message)) {
    situationLine = companionLine
      ? `${companionLine} 여행이시군요.`
      : '여수 여행을 계획하고 계시군요.';
  } else if (timeOfDay === 'night' || timeOfDay === 'evening') {
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
    // Multi-day first: "1박2일" makes time_available clarification contradictory.
    if (_isMultiDayTrip(message)) {
      return `${situationLine}\n여수에서 가볼 만한 곳을 골라봤어요.`;
    }
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

function _buildClientPayload(result, tgResult, whyDetails, soulMessage, sessionId, soulContext, sharedJourney, quoteResult, routeSkeleton) {
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
    timestamp: result.timestamp,
    // V0.2: Shared Journey context (SOUL preserves; domain only got minimum signals)
    shared_journey: sharedJourney || null,
    // Commerce: Route→Quote bridge result (null if not quotable)
    // COST/margin excluded by sanitizeForCustomer()
    quote: quoteResult || null,
    // MY ROUTE: deterministic skeleton (null for single-day trips)
    route: routeSkeleton || null
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function handleTravelRequest({ message, sessionId, hotelId, principal }) {
  // PLACE_LOOKUP DETECTION (deterministic, pre-GPT)
  // Exact/alias match → skip ranking. Unknown → PLACE_UNKNOWN (no substitution).
  const placeLookup = _detectPlaceLookupIntent(message);
  if (placeLookup.isPlaceLookup) {
    if (placeLookup.resolvedCode) {
      const place = await travelGuideService.getPlaceByCode(placeLookup.resolvedCode);
      if (place) {
        return { ok: true, payload: _buildPlaceLookupClientPayload(place, sessionId) };
      }
    }
    return { ok: true, payload: _buildUnknownPlacePayload(placeLookup.placeName, sessionId) };
  }

  // UNDERSTAND + SHARED JOURNEY EXTRACTION (parallel — independent AI calls)
  const [understandResult, sharedJourney] = await Promise.all([
    _understand(message),
    _extractSharedJourney(message)
  ]);

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
      next_options: ['여수 관광지 먼저 둘러보기'],
      group_size: soulContext.group_size,
      timestamp: new Date().toISOString(),
      shared_journey: sharedJourney || null
    };
    return { ok: true, payload };
  }

  // CONSTRUCT REQUEST ENVELOPE (internal audit — not returned to client directly)
  const request = _buildRequestEnvelope(principal, soulContext, sessionId);

  // D5 DOMAIN CONTEXT + DOMAIN_FALLBACK labeling
  const baseDomainContext = _buildDomainContext(soulContext, sessionId, hotelId);

  // V0.2: Supplement domain context with minimum Shared Journey signals
  // EXPERIENCED items are NEVER added to exclude_place_ids
  const domainContext = _supplementDomainFromSharedJourney(baseDomainContext, sharedJourney);

  // ROUTE TO TRAVEL_INTELLIGENCE
  const routeResult = await _routeToTravelIntelligence(domainContext);
  if (!routeResult.ok) {
    return { ok: false, httpStatus: 500, error: routeResult.error };
  }
  const { tgResult } = routeResult;

  // ─── ROUTE → QUOTE BRIDGE (minimum, Phase 1) ────────────────────────────────
  // Prices come exclusively from quoteEngine/quotePriceData — GPT never generates prices.
  // sanitizeForCustomer() ensures COST/margin never reach the client payload.
  let quoteResult = null;
  let quoteCtx = null;
  try {
    quoteCtx = quoteContextService.extractQuoteContext(message, soulContext);
    // Complex group hotel check runs BEFORE isQuotable — PENDING_HUMAN_QUOTE
    // is valid even without a travel_date (human confirms all conditions anyway).
    const complexCheck = quoteContextService.isComplexGroupHotel(quoteCtx, message);
    if (complexCheck.complex) {
      quoteResult = {
        status: 'PENDING_HUMAN_QUOTE',
        reason: complexCheck.reason,
        quoteCtx
      };
    } else if (quoteContextService.isQuotable(quoteCtx)) {
      const raw = quoteEngine.calculateQuote(quoteContextService.buildQuoteInput(quoteCtx));
      if (raw.success) {
        const clean = quoteEngine.sanitizeForCustomer(raw);
        clean.status = 'CALCULATED';
        quoteResult = clean;
      } else {
        quoteResult = { status: 'CALCULATION_ERROR', error: raw.error, message: raw.message };
      }
    }
  } catch (err) {
    console.error('[SOUL_QUOTE_BRIDGE_ERROR]', err.message);
    // Non-fatal: travel recommendations still returned
  }

  // ─── MY ROUTE SKELETON (multi-day trips only) ───────────────────────────────
  // Pure deterministic skeleton — LOCKED items always present, AI cannot remove them.
  // Only runs when user message contains overnight stay pattern (1박2일 etc.)
  let routeSkeleton = null;
  if (_isMultiDayTrip(message) && quoteCtx && quoteCtx.travel_date) {
    try {
      const { buildSkeleton } = require('./routeSkeletonService');
      routeSkeleton = buildSkeleton({
        start_date: quoteCtx.travel_date,
        hotel_code: quoteCtx.hotel_code || null,
        leisure_code: quoteCtx.leisure || null,
        guest_count: quoteCtx.guest_count || domainContext.group_size || 2,
        candidates: tgResult.places || []
      });
    } catch (err) {
      console.error('[SOUL_ROUTE_SKELETON_ERROR]', err.message);
      // Non-fatal: recommendations + quote still returned
    }
  }

  // For valid multi-day routes: suppress "시간이 얼마나 남으셨어요?" PARTIAL and
  // "120분 가능" condition. A user who said "1박2일" has defined their trip scope;
  // a remaining-time default is irrelevant. Flag _isMultiDayTrip on domainContext
  // so _deriveStatus() and _buildUserConditions() both respect it without
  // mutating _domainFallbacks (which would flip timeIsDefault to false and re-show
  // the synthetic time string).
  if (routeSkeleton !== null && _isMultiDayTrip(message)) {
    domainContext._isMultiDayTrip = true;
  }

  // STATUS
  const status = _deriveStatus(tgResult, domainContext);

  // D7 SOUL MESSAGE
  const soulMessage = _generateSoulMessage(soulContext, status, message);

  // WHY DETAILS
  const whyDetails = _buildWhyDetails(tgResult, domainContext);

  // RESULT ENVELOPE
  const result = _buildResultEnvelope(request, tgResult, domainContext, status);

  // CLIENT PAYLOAD
  const payload = _buildClientPayload(result, tgResult, whyDetails, soulMessage, sessionId, soulContext, sharedJourney, quoteResult, routeSkeleton);

  return { ok: true, payload };
}

module.exports = { handleTravelRequest };
