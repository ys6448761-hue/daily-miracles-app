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
const sessionService = require('./sessionService');

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

// ── PLACE_IDENTITY_KO: verified identity descriptions per code ─────────────────
// Derived from: place name, zone location (seed), emotion_tags (seed), verified public knowledge.
// DATA GAP: description_short is NULL for all 12 places (seed 001 + migrations 1–216).
// Update this map when description_short is populated via future data migration.
const PLACE_IDENTITY_KO = {
  hyangiram:           '돌산도에 자리한 암자예요. 바위 절벽 위에서 바다가 내려다보이는 일출 명소로 알려져 있고, 기도와 명상을 위해 찾는 분들도 많아요.',
  lee_soon_shin_plaza: '이순신 장군을 기리는 여수의 대표 광장이에요. 역사적인 분위기와 함께 여수항 풍경을 만날 수 있어요.',
  romantic_pojangmacha:'해질 무렵부터 열리는 여수의 포장마차 거리예요. 여수식 음식을 즐기며 현지 거리 분위기를 경험할 수 있어요.',
  odongdo:             '여수 앞바다에 자리한 섬이에요. 방파제 길을 걸으며 계절마다 다른 꽃과 바다 풍경을 즐길 수 있어요.',
  cablecar:            '여수 바다 위를 가로지르는 해상 케이블카예요. 케이블카 안에서 바다와 섬·항구를 내려다볼 수 있어요.',
  dolsan_daegyo:       '여수와 돌산도를 연결하는 대교예요. 야경과 일몰이 아름다워 저녁 시간대에 즐겨 찾는 곳이에요.',
  dolsan_nightscape:   '돌산도에서 여수 도심과 바다를 바라보는 야경 포인트예요. 야경 감상과 사진 촬영을 즐기는 분들이 많이 찾아요.',
  jaisan_park:         '언덕 위에 자리한 공원으로 여수 항구와 시내를 조용히 내려다볼 수 있어요.',
  sky_tower:           '여수엑스포장 근처의 전망 타워예요. 사방으로 여수 바다와 섬들을 감상할 수 있어요.',
  marine_park:         '바다 옆에 자리한 공원이에요. 탁 트인 바다 풍경과 함께 가볍게 산책하기 좋아요.',
  jungang_market:      '여수의 전통시장이에요. 현지 먹거리와 서민적인 일상 분위기를 경험할 수 있어요.',
  yeosu_expo_park:     '여수세계박람회가 열렸던 공원이에요. 넓은 야외 공간에서 산책과 다양한 이벤트를 즐길 수 있어요.',
};

// Suitable_for → brief Korean audience label (pilgrimage/foodies surface first — most specific)
const SUITABLE_PRIORITY = ['pilgrimage', 'foodies', 'couples', 'friends', 'solo', 'young_adults', 'family', 'kids_ok', 'elderly', 'groups'];
const SUITABLE_KO = {
  pilgrimage: '순례·기도 목적으로도', foodies: '미식가들에게도', couples: '커플',
  friends: '친구끼리', solo: '혼자', young_adults: '2030', family: '가족',
  kids_ok: '아이 동반', elderly: '어르신 동반', groups: '단체',
};

function _buildSuitableForLine(suitableFor) {
  if (!suitableFor || suitableFor.length === 0) return null;
  const special = SUITABLE_PRIORITY.slice(0, 2).filter(k => suitableFor.includes(k)); // pilgrimage / foodies
  if (special.length > 0) return `${SUITABLE_KO[special[0]]} 많이 찾는 곳이에요.`;
  const general = SUITABLE_PRIORITY.slice(5).filter(k => suitableFor.includes(k)).slice(0, 2);
  if (general.length === 0) return null;
  return `${general.map(k => SUITABLE_KO[k]).join(', ')} 여행에 잘 어울려요.`;
}

function _buildTimingHint(weather) {
  if (!weather || weather.length === 0) return null;
  if (weather.includes('sunrise'))                         return '특히 일출 무렵이 가장 아름다워요.';
  if (weather.includes('sunset'))                          return '석양이 질 무렵이 특히 아름다워요.';
  if (weather.includes('night') && weather.includes('evening')) return '저녁부터 밤까지 분위기가 좋아요.';
  if (weather.includes('night'))                           return '밤에도 분위기가 좋아요.';
  if (weather.includes('evening'))                         return '저녁 시간대가 특히 좋아요.';
  if (weather.includes('spring'))                          return '봄에 특히 아름다운 곳이에요.';
  return null;
}

/**
 * Build SOUL explanation for a known verified place.
 * Uses emotion_tags / suitable_for / weather_suitable from DB + PLACE_IDENTITY_KO map.
 * description_short is a DATA GAP for all 12 places — enrichment via identity map instead.
 * Never fabricates: all copy is derived from verified DB fields or the place name itself.
 */
function _buildPlaceLookupMessage(place) {
  const parts = [];
  const name = place.name_ko;

  parts.push(`${name}에 대해 알려드릴게요.`);

  // Identity + experience line
  if (place.description_short) {
    parts.push(place.description_short);
  } else {
    const identity = PLACE_IDENTITY_KO[place.code] || null;
    if (identity) {
      parts.push(identity);
    } else {
      // Structural fallback — rare (only for unknown codes)
      const io = place.indoor_outdoor;
      if (io === 'outdoor')                              parts.push('야외 공간이에요.');
      else if (io === 'indoor')                         parts.push('실내 시설이에요.');
      else if (io === 'indoor_outdoor' || io === 'mixed') parts.push('실내·외 혼합 공간이에요.');
    }
  }

  // Suitable-for qualifier (surface only when adds real value: pilgrimage / foodies)
  const suitableLine = _buildSuitableForLine(place.suitable_for);
  if (suitableLine) parts.push(suitableLine);

  // Timing hint from weather_suitable
  const timingHint = _buildTimingHint(place.weather_suitable);
  if (timingHint) parts.push(timingHint);

  // Stay duration
  if (place.avg_stay_minutes) {
    const t = place.avg_stay_minutes;
    const tLabel = t < 60 ? `약 ${t}분` : t % 60 === 0 ? `약 ${t / 60}시간` : `약 ${Math.round(t / 60)}시간`;
    parts.push(`보통 ${tLabel} 정도 머물러요.`);
  }

  // Admission fee
  const fee = place.admission_fee_json;
  if (fee && typeof fee.adult === 'number') {
    if (fee.adult === 0) {
      parts.push('무료로 둘러볼 수 있어요.');
    } else {
      const feeStr = fee.adult.toLocaleString();
      const extraFees = [];
      if (typeof fee.youth === 'number')  extraFees.push(`청소년 ${fee.youth.toLocaleString()}원`);
      if (typeof fee.senior === 'number') extraFees.push(`경로 ${fee.senior.toLocaleString()}원`);
      if (typeof fee.child === 'number')  extraFees.push(`어린이 ${fee.child.toLocaleString()}원`);
      const extraStr = extraFees.length ? ` / ${extraFees.join(' / ')}` : '';
      parts.push(`성인 입장료 ${feeStr}원이에요${extraStr}.`);
    }
  } else if (fee === null && place.code === 'cablecar') {
    parts.push('이용 요금이 있어요. 상세 금액은 예약 시 안내드려요.');
  }

  // Opening hours (verified hours suppress generic live_status warning below)
  const hours = place.opening_hours_json;
  let hasVerifiedHours = false;
  if (hours) {
    const hourStr = hours.mon || hours.tue || hours.wed || hours.thu || hours.fri || hours.sat || hours.sun;
    if (hourStr) {
      parts.push(`운영시간 ${hourStr}.`);
      hasVerifiedHours = true;
    }
  }

  // Physical difficulty
  if (place.physical_difficulty === 'high') {
    parts.push('경사와 계단이 많아 올라가는 데 체력이 필요해요.');
  }

  // Live status caution — suppress when: live_status_required=false OR hours are verified
  if (place.live_status_required && !hasVerifiedHours) {
    parts.push('방문 전 운영 여부를 꼭 확인해보세요.');
  }

  return parts.join('\n');
}

/**
 * Client payload for a successfully resolved PLACE_LOOKUP.
 * presentation_mode='PLACE_KNOWLEDGE' — frontend suppresses generic recommendation cards.
 */
function _buildPlaceLookupClientPayload(place, sessionId) {
  return {
    session_id: sessionId,
    understood_context: {},
    places: [place],
    why_details: [],
    message_ko: _buildPlaceLookupMessage(place),
    place_identity_ko: place.description_short || PLACE_IDENTITY_KO[place.code] || null,
    status: 'PLACE_LOOKUP',
    intent: 'PLACE_LOOKUP',
    presentation_mode: 'PLACE_KNOWLEDGE',
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
 * presentation_mode='PLACE_KNOWLEDGE' — suppresses unrelated recommendation substitution.
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
    presentation_mode: 'PLACE_KNOWLEDGE',
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

// Detect explicit itinerary-building intent.
// "일정 짜줘", "1박2일 일정 만들어줘", "2박3일 코스 짜줘" → true
// "일정 추천해줘", "야경 좋은 곳 알려줘" → false (추천해 is a recommendation override, not a construction verb)
function _isJourneyPlanningIntent(message) {
  if (!message) return false;
  // Overnight stay pattern always implies journey planning
  if (/\d박\s*\d일|\d박/.test(message)) return true;
  // Explicit construction verb attached to a planning noun
  if (/(일정|코스|여행|계획).*(짜줘|짜주세요|만들어줘|만들어주세요|세워줘|구성해줘)/.test(message)) return true;
  if (/(짜줘|짜주세요|만들어줘|만들어주세요).*(일정|코스|여행)/.test(message)) return true;
  return false;
}

// Extract number of overnight stays from message.
// "1박2일" → 1, "2박3일" → 2. Caps at 7.
function _extractNights(message) {
  const m = (message || '').match(/(\d)박/);
  return m ? Math.min(parseInt(m[1], 10), 7) : 1;
}

// Detect explicit price/quote follow-up intent.
// "이 정도면 얼마야?", "견적 보여줘", "가격 알려줘" → true
// "야경 추천해줘", "일정 짜줘" → false
function _isCommerceFollowUpIntent(message) {
  if (!message) return false;
  return /(얼마야|얼마에요|얼마예요|얼마 들|얼마나 들|가격 알려|견적 보여|견적 뽑|견적 알려|이 정도면|이 일정.*(얼마|가격)|이 코스.*(얼마|가격)|가격이 어)/.test(message);
}

// Merge stored journey_ctx with message-extracted overrides.
// Explicit current-message values always win over stored journey values.
function _mergeJourneyQuoteCtx(journeyCtx, messageCtx) {
  return {
    hotel_code:  messageCtx.hotel_code  || journeyCtx.hotel_code   || null,
    leisure:     messageCtx.leisure     || journeyCtx.leisure_code  || null,
    travel_date: messageCtx.travel_date || journeyCtx.travel_date   || null,
    guest_count: messageCtx.guest_count || journeyCtx.guest_count   || null,
    cable_car_type: messageCtx.cable_car_type || null,
    region: 'yeosu',
  };
}

// Build a CLARIFICATION payload — not DISCOVERING, no place cards.
function _buildClarificationPayload(sessionId, messageKo) {
  return {
    session_id: sessionId,
    understood_context: {},
    places: [],
    why_details: [],
    message_ko: messageKo,
    status: 'CLARIFICATION',
    presentation_mode: 'CLARIFICATION',
    quote: null,
    route: null,
    shared_journey: null,
    timestamp: new Date().toISOString(),
    next_options: [],
  };
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
  // Derive presentation_mode from authoritative backend artifacts.
  // Priority: QUOTE_READY > ROUTE_READY > DISCOVERING
  // PLACE_KNOWLEDGE is set in _buildPlaceLookupClientPayload / _buildUnknownPlacePayload (never reaches here).
  const presentationMode = (() => {
    if (quoteResult && quoteResult.status === 'CALCULATED') return 'QUOTE_READY';
    if (routeSkeleton && routeSkeleton.days && routeSkeleton.days.length > 0) return 'ROUTE_READY';
    return 'DISCOVERING';
  })();

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
    // Front-of-house Journey mode — controls which blocks the frontend renders as primary
    presentation_mode: presentationMode,
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

  // ─── COMMERCE FOLLOW-UP (pre-GPT, uses stored journey_ctx) ──────────────────
  // "이 정도면 얼마야?", "견적 보여줘" etc. — never routes to DISCOVERY.
  // Merges stored Journey with explicit message overrides (message wins on conflict).
  if (_isCommerceFollowUpIntent(message)) {
    let journeyCtx = null;
    try {
      const sessionCtx = await sessionService.getSession(sessionId);
      journeyCtx = sessionCtx && sessionCtx.journey_ctx ? sessionCtx.journey_ctx : null;
    } catch (_) {}

    if (!journeyCtx) {
      // No journey context at all → ask for minimum to build a quote
      return {
        ok: true,
        payload: _buildClarificationPayload(sessionId,
          '견적을 만들어드릴게요. 여행 인원과 숙소가 정해졌나요?'
        )
      };
    }

    // Merge stored context with explicit message overrides
    const msgCtx = quoteContextService.extractQuoteContext(message, {});
    const mergedCtx = _mergeJourneyQuoteCtx(journeyCtx, msgCtx);

    // No hotel in either stored or message → can't quote; ask for hotel
    if (!mergedCtx.hotel_code) {
      return {
        ok: true,
        payload: _buildClarificationPayload(sessionId,
          '어느 숙소로 견적을 드릴까요? 라마다 또는 켄싱턴 호텔 중 선택해주세요.'
        )
      };
    }

    // Hotel known but date unknown → ask for date (needed for room pricing)
    if (!mergedCtx.travel_date) {
      return {
        ok: true,
        payload: _buildClarificationPayload(sessionId,
          '여행 날짜를 알려주시면 정확한 견적을 계산해 드릴게요.'
        )
      };
    }

    // All required fields present → compute quote
    const guestCount = mergedCtx.guest_count || 2;
    mergedCtx.guest_count = guestCount;
    const complexCheck = quoteContextService.isComplexGroupHotel(mergedCtx, message);
    let quoteResult;
    if (complexCheck.complex) {
      quoteResult = { status: 'PENDING_HUMAN_QUOTE', reason: complexCheck.reason };
    } else {
      const raw = quoteEngine.calculateQuote(quoteContextService.buildQuoteInput(mergedCtx));
      if (raw.success) {
        const clean = quoteEngine.sanitizeForCustomer(raw);
        clean.status = 'CALCULATED';
        quoteResult = clean;
      } else {
        quoteResult = { status: 'CALCULATION_ERROR', error: raw.error };
      }
    }

    return {
      ok: true,
      payload: {
        session_id: sessionId,
        understood_context: { group_size: guestCount },
        places: [],
        why_details: [],
        message_ko: '견적을 계산했어요.',
        status: 'QUOTE_READY',
        presentation_mode: 'QUOTE_READY',
        quote: quoteResult,
        route: null,
        shared_journey: null,
        timestamp: new Date().toISOString(),
        next_options: [],
      }
    };
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

  // ─── MY ROUTE SKELETON (journey planning requests) ──────────────────────────
  // Fires for explicit itinerary-building intent regardless of whether a travel
  // date is provided. When travel_date is absent, the skeleton uses null dates
  // and the frontend renders "N일차" labels instead of calendar dates.
  // LOCKED items (hotel/leisure) are always present; AI cannot remove them.
  let routeSkeleton = null;
  if (_isJourneyPlanningIntent(message) && quoteCtx) {
    try {
      const { buildSkeleton } = require('./routeSkeletonService');
      routeSkeleton = buildSkeleton({
        start_date: quoteCtx.travel_date || null,
        hotel_code: quoteCtx.hotel_code || null,
        leisure_code: quoteCtx.leisure || null,
        guest_count: quoteCtx.guest_count || domainContext.group_size || 2,
        candidates: tgResult.places || [],
        nights: _extractNights(message),
      });
    } catch (err) {
      console.error('[SOUL_ROUTE_SKELETON_ERROR]', err.message);
      // Non-fatal: recommendations + quote still returned
    }
  }

  // For journey-planning requests: suppress "시간이 얼마나 남으셨어요?" PARTIAL and
  // "120분 가능" condition. Flag _isMultiDayTrip so _deriveStatus() and
  // _buildUserConditions() treat this as a multi-day context.
  if (routeSkeleton !== null && (_isMultiDayTrip(message) || _isJourneyPlanningIntent(message))) {
    domainContext._isMultiDayTrip = true;
  }

  // ─── JOURNEY CONTEXT WRITE-BACK ─────────────────────────────────────────────
  // After a successful MY ROUTE build, persist minimum journey context so the
  // next commerce follow-up ("이 정도면 얼마야?") can resolve without DISCOVERY.
  // Fire-and-forget — session write failure never blocks the response.
  if (routeSkeleton !== null && quoteCtx) {
    sessionService.updateJourneyContext(sessionId, {
      route_id:     routeSkeleton.route_id,
      nights:       _extractNights(message),
      hotel_code:   quoteCtx.hotel_code   || null,
      leisure_code: quoteCtx.leisure      || null,
      guest_count:  quoteCtx.guest_count  || domainContext.group_size || 2,
      travel_date:  quoteCtx.travel_date  || null,
    }).catch(err => console.error('[JOURNEY_CTX_WRITE_ERROR]', err.message));
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
