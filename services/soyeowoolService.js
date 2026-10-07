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

// Medium lookup verbs — proximity window from alias end.
// Korean is SOV: judgment verb often comes at sentence end ("향일암은 부모님이 가기 괜찮아?").
// 15-char window covers end-of-sentence verbs without spanning unrelated clauses.
// False-positive guard: DISCOVERY_OVERRIDES fires first for "포함/얼마/일정" messages.
const MEDIUM_LOOKUP = /알려줘|알려주세요|어때\??|어떤가요|은\?|는\?|이야\??|괜찮아\??/;
const MEDIUM_PROXIMITY = 15;

// Suitability-intent subset of MEDIUM_LOOKUP — evaluative/judgment framing vs pure informational.
// 알려줘/알려주세요 = informational only → isSuitabilityQuery:false
// Remainder = "how is it / is it ok?" → isSuitabilityQuery:true → Judgment V0.1 invoked
const SUITABILITY_LOOKUP = /어때\??|어떤가요|은\?|는\?|이야\??|괜찮아\??/;

// DISCOVERY overrides — when any of these appear, treat as DISCOVERY
// even if a known place alias is present in the message
const DISCOVERY_OVERRIDES = /근처|어디 갈|어디가 좋|갈만|가볼 만|추천해|뭐 할까|뭐 하지|뭐하지|어디서|같이 갈|같이 어디|타고 싶|가고 싶|하고 싶|일정|비용|얼마|포함/;

// ─── Place-Specific Query V0.1 — verified inline knowledge for 3 Golden Places ─
// Trust levels: VERIFIED=batch-verified, NON_OFFICIAL=blog source, UNKNOWN=no data.
// Fields: phone (inquiry), ride_duration_ko, price_ko, hours_ko, roundtrip_ko,
//         odongdo_connection_ko, weather_ko, wheelchair_ko, stairs_ko.
const _PLACE_KNOWLEDGE = {
  cablecar: {
    phone: '061-664-7301',
    ride_duration_ko: '편도 약 12~13분, 거리 1.5km',
    ride_trust: 'NON_OFFICIAL',
    price_ko: '일반캐빈 왕복 약 17,000원/편도 약 14,000원. 크리스탈캐빈(유리바닥) 왕복 약 24,000원/편도 약 19,000원.',
    price_trust: 'NON_OFFICIAL',
    hours_ko: '09:30~21:30 (토요일·성수기 연장)',
    hours_trust: 'NON_OFFICIAL',
    roundtrip_ko: '왕복권과 편도권 모두 있어요. 차를 가져오셨다면 한쪽 역에 주차하고 편도로 타신 후 반대편에서 이동하는 방법도 있어요. 왕복은 타신 곳으로 돌아오는 방식이에요.',
    odongdo_connection_ko: '자산역(여수 쪽)에서 오동도 입구까지 버스 연계 동선으로 이어갈 수 있어요.',
    weather_ko: '실외 고공 구간이 있어서, 강풍이나 기상 악화 시 운행이 중단될 수 있어요. 당일 날씨를 미리 확인해보세요.',
  },
  odongdo: {
    phone: '061-659-1819',
    admission_ko: '무료',
    hours_ko: '연중무휴 (동백열차 09:00~17:00)',
    hours_trust: 'NON_OFFICIAL',
  },
  hyangiram: {
    phone: null,
    admission_ko: '무료',
    hours_ko: '04:00~19:00',
    hours_trust: 'NON_OFFICIAL',
    stairs_ko: '경내 계단 구간이 있어요. 거동이 불편하신 분은 주의가 필요해요.',
  },
};

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
      return { isPlaceLookup: true, placeName: alias, resolvedCode: PLACE_ALIAS_MAP[alias], isSuitabilityQuery: false };
    }
    if (MEDIUM_LOOKUP.test(afterAlias.slice(0, MEDIUM_PROXIMITY))) {
      const isSuitabilityQuery = SUITABILITY_LOOKUP.test(afterAlias.slice(0, MEDIUM_PROXIMITY));
      return { isPlaceLookup: true, placeName: alias, resolvedCode: PLACE_ALIAS_MAP[alias], isSuitabilityQuery };
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

// ── CURRENT_PLACE_KO: Korean name for known Living Detail places ──────────────
// Used by V0.1 place-aware SOUL message framing (DISCOVERY context).
const CURRENT_PLACE_KO = { cablecar: '케이블카', odongdo: '오동도', hyangiram: '향일암' };

// ── Prepared Knowledge (PU) — static constants for Judgment V0.1 ──────────────
// Source: docs/research/SOUL_YEOSU_3_PLACE_PREPARATION_UNITS_V0_1.md
// These encode ONLY facts from PREPARED/VERIFIED corpus. Do not expand without authorization.

// PU-HY-003: Elder ASK trigger — MANDATORY ASK when family_elderly + high difficulty
// Provenance: PU-HY-003 (PREPARED) ← ER HY-001, HY-002, HY-003, HY-005
const PU_HY_003_ASK_EXAMPLES = [
  '평소 계단 오르내리기 불편하신 부분 있으세요?',
  '어느 정도 등산이나 걷기 무리 없으신 편인가요?',
];

// PU-HY-005: Visit Duration range
// Provenance: PU-HY-005 (PREPARED) ← ER HY-006 (VERIFIED_FOR_PREPARATION)
const PU_HY_005_STAY_RANGE = { min: 45, max: 90 }; // minutes; max maps to avg_stay_minutes=90

// PU-HY-001: Route options — conditional (surfaced only when ASK triggered)
// Provenance: PU-HY-001 (PREPARED) ← ER HY-001, HY-005
const PU_HY_001_ROUTE_OPTIONS = {
  stairsMinutes: 10,   // 계단길 — 급경사, 약 10분
  flatMinutes: 15,     // 평지길 — 완만, 약 15분
  descentOption: true, // 하산: 별도 완만한 우회 경로 존재
};

// ── Lightweight traveler extraction for PLACE_LOOKUP path (no GPT) ────────────
// Mirrors contextExtractionService.js:187 ELDERLY/KIDS arrays.
const _ELDERLY_PHRASES = ['부모님과', '부모님이랑', '어머니와', '엄마랑', '아버지와', '아빠랑'];
const _KIDS_PHRASES    = ['아이와', '아이랑', '아이들과', '어린이와', '자녀와', '애들과'];

function _extractPeopleLightweight(message) {
  if (_ELDERLY_PHRASES.some(p => message.includes(p))) {
    return { people_type: 'family_elderly', companion_has_elderly: true };
  }
  if (_KIDS_PHRASES.some(p => message.includes(p))) {
    return { people_type: 'family_with_kids', companion_has_elderly: false };
  }
  return { people_type: null, companion_has_elderly: false };
}

// ── Judgment V0.1 ─────────────────────────────────────────────────────────────
// Decides WHAT matters for a suitability query. Composer decides HOW to say it.
// Scope: PU-HY-003 + PU-HY-005 + PU-HY-001 (conditional). V0.1 only.
function _judgePlaceLookup(place, people_type, companion_has_elderly) {
  const hasElderlyContext = people_type === 'family_elderly' || companion_has_elderly === true;
  const isHighDifficulty  = place.physical_difficulty === 'high';

  // PU-HY-003: MANDATORY ASK when elderly context + high physical difficulty
  const askRequired = hasElderlyContext && isHighDifficulty;

  // PU-HY-005: stay-time range — hyangiram only (only place with VERIFIED range evidence)
  const stayRange = place.code === 'hyangiram' ? PU_HY_005_STAY_RANGE : null;

  // PU-HY-001: route options — conditional (only when ASK triggered, only hyangiram)
  const routeOptions = (askRequired && place.code === 'hyangiram') ? PU_HY_001_ROUTE_OPTIONS : null;

  return {
    askRequired,
    stayRange,
    routeOptions,
    askCategory:  askRequired ? 'mobility_stairs' : null,
    askExamples:  askRequired ? PU_HY_003_ASK_EXAMPLES : [],
    knowledgeRefs: [
      ...(stayRange    ? ['PU-HY-005'] : []),
      ...(askRequired  ? ['PU-HY-003'] : []),
      ...(routeOptions ? ['PU-HY-001'] : []),
    ],
  };
}

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
// judgedContext: optional output from _judgePlaceLookup (null → existing behavior, no Judgment)
function _buildPlaceLookupMessage(place, judgedContext = null) {
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
  // Judgment V0.1: range from PU-HY-005 when available (suitability queries only)
  if (judgedContext && judgedContext.stayRange) {
    const { min, max } = judgedContext.stayRange;
    const fmtMin = min < 60 ? `${min}분` : `${Math.floor(min/60)}시간`;
    const fmtMax = max < 60 ? `${max}분` : (max % 60 === 0 ? `${max/60}시간` : `${Math.floor(max/60)}시간 ${max%60}분`);
    parts.push(`빠르면 ${fmtMin}, 여유 있게 ${fmtMax} 정도 머물 수 있어요.`);
  } else if (place.avg_stay_minutes) {
    const t = place.avg_stay_minutes;
    // Exact hours+minutes display avoids Math.round() overstating non-round values (e.g. 90 min → 1h30m not 2h)
    const tHours = Math.floor(t / 60);
    const tMins = t % 60;
    const tLabel = tHours === 0 ? `약 ${t}분` : tMins === 0 ? `약 ${tHours}시간` : `약 ${tHours}시간 ${tMins}분`;
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
    // hours.summary: single-string fallback for places without day-of-week breakdown (e.g. hyangiram)
    const hourStr = hours.mon || hours.tue || hours.wed || hours.thu || hours.fri || hours.sat || hours.sun || hours.summary;
    if (hourStr) {
      parts.push(`운영시간 ${hourStr}.`);
      hasVerifiedHours = true;
    }
  }

  // Physical difficulty
  if (place.physical_difficulty === 'high') {
    parts.push('경사와 계단이 많아 올라가는 데 체력이 필요해요.');
  }

  // Judgment V0.1: route context (PU-HY-001) + ASK (PU-HY-003) — family_elderly + high difficulty
  if (judgedContext && judgedContext.askRequired) {
    if (judgedContext.routeOptions) {
      parts.push(`계단길(약 ${judgedContext.routeOptions.stairsMinutes}분)과 완만한 평지 길(약 ${judgedContext.routeOptions.flatMinutes}분) 두 코스가 있어요.`);
    }
    // Use first example question from PU-HY-003 (most concise mobility question)
    if (judgedContext.askExamples && judgedContext.askExamples.length > 0) {
      parts.push(judgedContext.askExamples[0]);
    }
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
function _buildPlaceLookupClientPayload(place, sessionId, judgedContext = null) {
  return {
    session_id: sessionId,
    understood_context: {},
    places: [place],
    why_details: [],
    message_ko: _buildPlaceLookupMessage(place, judgedContext),
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

async function _understand(message, options = {}) {
  const soulContext = await contextExtractionService.parseUserMessage(message);
  if (soulContext.error) {
    // PSQ messages are often short (e.g. "얼마야?" = 4 chars) and don't need full NL extraction.
    // When a place_code is set and the message matches PSQ patterns, return a minimal stub
    // so the PSQ gate downstream can handle it instead of returning HTTP 400.
    if (options.placeCode && _isPlaceSpecificQuery(message)) {
      return { ok: true, soulContext: { people_type: 'unknown', _provenance: {}, companion_constraints: {} } };
    }
    return { ok: false, error: soulContext.error };
  }
  return { ok: true, soulContext: _correctCoupleClassification(message, soulContext) };
}

// ─── Traveler Profile Continuity V0.1 ────────────────────────────────────────
// Only USER_EXPLICIT values may establish or update persisted traveler facts.
// UNKNOWN / AI_INFERENCE values must not overwrite previously stored explicit values.

// Returns current-turn USER_EXPLICIT fields only; null for non-explicit fields.
function _extractExplicitTravelerFacts(soulContext) {
  const prov = soulContext._provenance || {};
  const cc = soulContext.companion_constraints || {};
  return {
    people_type:           prov.people_type === 'USER_EXPLICIT' ? soulContext.people_type : null,
    companion_has_elderly: prov.has_elderly  === 'USER_EXPLICIT' ? !!cc.has_elderly        : null,
    companion_has_kids:    prov.has_kids     === 'USER_EXPLICIT' ? !!cc.has_kids            : null,
    has_car:               prov.has_car      === 'USER_EXPLICIT' ? soulContext.has_car      : null,
  };
}

// Merges current explicit facts with stored profile.
// Current explicit always wins; stored fills gaps where current is null.
function _mergeProfileFacts(currentFacts, stored) {
  const s = stored || {};
  return {
    people_type:           currentFacts.people_type           != null ? currentFacts.people_type           : (s.people_type           ?? null),
    companion_has_elderly: currentFacts.companion_has_elderly != null ? currentFacts.companion_has_elderly : (s.companion_has_elderly ?? null),
    companion_has_kids:    currentFacts.companion_has_kids    != null ? currentFacts.companion_has_kids    : (s.companion_has_kids    ?? null),
    has_car:               currentFacts.has_car               != null ? currentFacts.has_car               : (s.has_car               ?? null),
  };
}

// Re-injects persisted explicit traveler profile into soulContext.
// Precedence: CURRENT USER_EXPLICIT > PERSISTED USER_EXPLICIT > CURRENT DEFAULT/UNKNOWN.
function _applyPersistedTravelerProfile(soulContext, storedProfile) {
  if (!storedProfile) return soulContext;
  const prov = soulContext._provenance || {};
  const merged = { ...soulContext };
  const mergedProv = { ...prov };
  const mergedConstraints = { ...(soulContext.companion_constraints || {}) };
  let constraintsChanged = false;

  if (prov.people_type !== 'USER_EXPLICIT' && storedProfile.people_type != null) {
    merged.people_type = storedProfile.people_type;
    mergedProv.people_type = 'USER_EXPLICIT';
  }
  if (prov.has_elderly !== 'USER_EXPLICIT' && storedProfile.companion_has_elderly != null) {
    mergedConstraints.has_elderly = storedProfile.companion_has_elderly;
    mergedProv.has_elderly = 'USER_EXPLICIT';
    constraintsChanged = true;
  }
  if (prov.has_kids !== 'USER_EXPLICIT' && storedProfile.companion_has_kids != null) {
    mergedConstraints.has_kids = storedProfile.companion_has_kids;
    mergedProv.has_kids = 'USER_EXPLICIT';
    constraintsChanged = true;
  }
  if (prov.has_car !== 'USER_EXPLICIT' && storedProfile.has_car != null) {
    merged.has_car = storedProfile.has_car;
    mergedProv.has_car = 'USER_EXPLICIT';
  }

  merged._provenance = mergedProv;
  if (constraintsChanged) merged.companion_constraints = mergedConstraints;
  return merged;
}

// ─── UI-001: Explicit context chip supplement ─────────────────────────────────
// Supplements GPT-extracted soulContext with chip values ONLY for UNKNOWN fields.
// USER_EXPLICIT text provenance always wins over chip. Chip wins over session persisted.
// Mirrors _applyPersistedTravelerProfile pattern.
function _applyExplicitContextChip(soulContext, explicit_context) {
  if (!explicit_context || Object.keys(explicit_context).length === 0) return soulContext;
  const prov = soulContext._provenance || {};
  const merged = { ...soulContext };
  const mergedProv = { ...prov };
  const mergedConstraints = { ...(soulContext.companion_constraints || {}) };
  let constraintsChanged = false;

  if (prov.people_type !== 'USER_EXPLICIT' && explicit_context.people_type) {
    merged.people_type = explicit_context.people_type;
    mergedProv.people_type = 'USER_EXPLICIT';
    if (explicit_context.people_type === 'family_elderly') {
      mergedConstraints.has_elderly = true;
      mergedProv.has_elderly = 'USER_EXPLICIT';
      constraintsChanged = true;
    } else if (explicit_context.people_type === 'family_with_kids') {
      mergedConstraints.has_kids = true;
      mergedProv.has_kids = 'USER_EXPLICIT';
      constraintsChanged = true;
    }
  }

  // Fix 1: explicit_context.companion → people_type (UI-state companion overrides GPT text inference)
  // companion=parents → family_elderly, companion=family → family_with_kids
  // companion field from UI chip represents what the traveler has already set — usually authoritative.
  // Exception: when the current turn's GPT extraction has USER_EXPLICIT provenance (user said "나 혼자"
  // or "엄마는 안 가고"), that explicit text overrides the stale chip state.
  const COMPANION_PEOPLE_MAP = { parents: 'family_elderly', family: 'family_with_kids' };
  if (explicit_context.companion && COMPANION_PEOPLE_MAP[explicit_context.companion] &&
      prov.people_type !== 'USER_EXPLICIT') {
    const mappedType = COMPANION_PEOPLE_MAP[explicit_context.companion];
    merged.people_type = mappedType;
    mergedProv.people_type = 'USER_EXPLICIT';
    if (mappedType === 'family_elderly') {
      mergedConstraints.has_elderly = true;
      mergedProv.has_elderly = 'USER_EXPLICIT';
      constraintsChanged = true;
    } else if (mappedType === 'family_with_kids') {
      mergedConstraints.has_kids = true;
      mergedProv.has_kids = 'USER_EXPLICIT';
      constraintsChanged = true;
    }
  }

  if (prov.has_car !== 'USER_EXPLICIT' && explicit_context.has_car != null) {
    merged.has_car = explicit_context.has_car;
    mergedProv.has_car = 'USER_EXPLICIT';
  }

  merged._provenance = mergedProv;
  if (constraintsChanged) merged.companion_constraints = mergedConstraints;
  return merged;
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
  // Explicit construction verb attached to a planning noun ("동선" = route/itinerary)
  if (/(일정|코스|여행|계획|동선).*(짜줘|짜주세요|만들어줘|만들어주세요|세워줘|구성해줘)/.test(message)) return true;
  if (/(짜줘|짜주세요|만들어줘|만들어주세요).*(일정|코스|여행|동선)/.test(message)) return true;
  // Information-request verb attached to planning noun: "일정 알려줘", "동선 알려줘"
  if (/(일정|코스|여행 계획|동선).*(알려줘|알려주세요|보여줘|보여주세요|알고 싶|궁금해|부탁해)/.test(message)) return true;
  return false;
}

// Extract number of overnight stays from message.
// "1박2일" → 1, "2박3일" → 2. Caps at 7.
function _extractNights(message) {
  const m = (message || '').match(/(\d)박/);
  return m ? Math.min(parseInt(m[1], 10), 7) : 1;
}

// Detect a pure date provision message — user responding with just a date.
// "10월 17일", "10월17일이에요", "10월 17일로 해줘" → true
// Disqualified when competing journey/discovery signals are present.
function _isDateProvisionMessage(message) {
  if (!message) return false;
  if (!/\d{1,2}월\s*\d{1,2}일/.test(message)) return false;
  if (/추천해|일정 짜|코스 짜|어디 갈|갈 만한|\d박/.test(message)) return false;
  return true;
}

// Detect a pure guest-count provision message — user providing headcount only.
// "2명이야", "3명이에요", "둘이서", "혼자야" → true
// Disqualified when competing journey/discovery signals are present.
function _isGuestCountProvisionMessage(message) {
  if (!message) return false;
  if (!/(\d+명|혼자|둘이|둘이서|세명|네명|한명)/.test(message)) return false;
  if (/추천해|일정 짜|코스 짜|어디 갈|갈 만한|\d박|비용|얼마|견적/.test(message)) return false;
  return true;
}

// Detect explicit price/quote follow-up intent.
// "이 정도면 얼마야?", "견적 보여줘", "가격 알려줘" → true
// "야경 추천해줘", "일정 짜줘" → false
function _isCommerceFollowUpIntent(message) {
  if (!message) return false;
  return /(얼마야|얼마에요|얼마예요|얼마 들|얼마나 들|가격 알려|견적 보여|견적 뽑|견적 알려|이 정도면|이 일정.*(얼마|가격)|이 코스.*(얼마|가격)|가격이 어)/.test(message);
}

// ─── Place-Specific Query V0.1 ────────────────────────────────────────────────
// Detects operational/factual questions about the CURRENT place (place_code must be set at call site).
// These questions presuppose the place is already chosen — the user wants depth about it.
// Placed AFTER Journey Decision Gate so journey modifications ("빼줘", "가능해") take priority.
function _isPlaceSpecificQuery(message) {
  if (!message) return false;
  if (/(얼마나 걸|몇 분|소요시간|걸리나요|걸려요|걸려\??)/.test(message)) return true;
  if (/(얼마야|얼마예요|요금|입장료|가격|티켓)/.test(message)) return true;
  if (/(왕복|편도)/.test(message)) return true;
  if (/(휠체어|유모차|접근성|장애|배리어)/.test(message)) return true;
  if (/(지금.*탈|지금.*가도|지금.*갈|영업.*해|운영.*해|열었|탈 수 있|타도 돼|탈 수 있어|운행.*해|운행.*돼|운행 중|지금.*운행)/.test(message)) return true;
  if (/(비 오면|비 오|비가 오|날씨|우천|기상|눈이|바람이|태풍)/.test(message)) return true;
  if (/(오동도.*갔다가|오동도.*후에|오동도.*타도|오동도.*케이블|향일암.*갔다가|향일암.*후에)/.test(message)) return true;
  if (/(포토존|사진 어디|사진.*찍기|사진.*찍어|어디서.*찍|찍기 좋은 곳)/.test(message)) return true;
  if (/(알려 줘)/.test(message)) return true; // spaced form not in MEDIUM_LOOKUP
  return false;
}

// Build a deterministic response for place-specific operational/factual questions.
// Uses inline verified knowledge (_PLACE_KNOWLEDGE) + DB place fields.
// KNOWLEDGE SAFETY: answer only from known data; hedge on NON_OFFICIAL; UNKNOWN → VERIFY.
function _buildPlaceSpecificQueryPayload(message, place, soulContext, sessionId) {
  const msg = message;
  const code = place.code || '';
  const knowledge = _PLACE_KNOWLEDGE[code] || {};
  const name = place.name_ko || code;
  const phone = knowledge.phone || place.phone_inquiry || null;
  const verifyNote = phone
    ? `\n\n정확한 정보는 ${phone}에 문의하시거나 현장에서 확인해보세요.`
    : '\n\n현장에서 직원에게 문의해보세요.';

  let answer = null;

  // Duration
  if (/(얼마나 걸|몇 분|소요시간|걸리나요|걸려요|걸려\??)/.test(msg)) {
    if (knowledge.ride_duration_ko) {
      answer = `${name}은 ${knowledge.ride_duration_ko}예요.`;
      if (knowledge.ride_trust === 'NON_OFFICIAL') answer += '\n(블로그 참고값이에요. 현장 상황에 따라 다를 수 있어요.)';
    } else if (place.avg_stay_minutes) {
      answer = `${name} 평균 관람 시간은 약 ${place.avg_stay_minutes}분이에요.`;
    }
  }

  // Roundtrip vs oneway
  else if (/(왕복|편도)/.test(msg)) {
    if (knowledge.roundtrip_ko) {
      answer = knowledge.roundtrip_ko;
      if (knowledge.price_ko) {
        answer += `\n\n요금 참고: ${knowledge.price_ko}`;
        if (knowledge.price_trust === 'NON_OFFICIAL') answer += `\n※ 공식 사이트 확인이 필요해요.${verifyNote}`;
      }
    }
  }

  // Price / admission fee
  else if (/(얼마야|얼마예요|요금|입장료|가격|티켓)/.test(msg)) {
    if (knowledge.admission_ko === '무료') {
      answer = `${name}은 무료예요.`;
    } else if (knowledge.price_ko) {
      answer = `${name} 요금 참고값이에요.\n${knowledge.price_ko}`;
      if (knowledge.price_trust === 'NON_OFFICIAL') answer += `\n\n※ 공식 사이트 확인이 필요해요.${verifyNote}`;
    } else if (place.admission_fee_json) {
      answer = `${name} 요금 정보가 있어요.${verifyNote}`;
    } else {
      answer = `${name} 요금 정보를 정확하게 알고 있지 않아요.${verifyNote}`;
    }
  }

  // Wheelchair / accessibility
  else if (/(휠체어|유모차|접근성|장애|배리어)/.test(msg)) {
    const wsStatus = place.accessibility_wheelchair_status;
    if (wsStatus === 'verified_yes') {
      answer = `${name}은 휠체어 접근이 가능해요.`;
    } else if (wsStatus === 'verified_no') {
      answer = `${name}은 휠체어 접근이 어렵습니다.`;
    } else {
      answer = `${name}의 휠체어 접근 여부는 아직 정확하게 확인되지 않았어요.${verifyNote}`;
    }
    if (knowledge.stairs_ko) answer += `\n\n참고: ${knowledge.stairs_ko}`;
  }

  // Place connection (e.g. 오동도 갔다가 케이블카 타도 돼?) — checked BEFORE operation
  // to prevent "타도 돼" substring from matching the operation branch first.
  else if (/(오동도.*갔다가|오동도.*후에|오동도.*타도|오동도.*케이블|향일암.*갔다가|향일암.*후에)/.test(msg)) {
    if (knowledge.odongdo_connection_ko) {
      answer = knowledge.odongdo_connection_ko;
    } else {
      answer = `두 장소를 함께 계획하신다면 일정을 확인해드릴게요. 어떤 순서로 생각하고 계세요?`;
    }
  }

  // Current operation / can we go now? / is it running?
  else if (/(지금.*탈|지금.*가도|지금.*갈|영업.*해|운영.*해|열었|탈 수 있|타도 돼|운행.*해|운행.*돼|운행 중|지금.*운행)/.test(msg)) {
    if (knowledge.hours_ko) {
      answer = `${name} 운영시간은 ${knowledge.hours_ko}예요.`;
      if (knowledge.hours_trust === 'NON_OFFICIAL') answer += '\n(참고값이에요.)';
      // If weather is also asked, surface weather policy inline rather than losing it to the else-if chain
      if (/(비|날씨|우천|기상|눈|바람|태풍)/.test(msg) && knowledge.weather_ko) {
        answer += `\n\n${knowledge.weather_ko}`;
      }
      answer += '\n현재 운영 여부는 현장 확인이 필요해요.' + verifyNote;
    } else {
      answer = `${name}의 현재 운영 여부는 현장 확인이 필요해요.${verifyNote}`;
    }
  }

  // Weather
  else if (/(비 오면|비 오|비가 오|날씨|우천|기상|눈이|바람이|태풍)/.test(msg)) {
    if (knowledge.weather_ko) {
      answer = knowledge.weather_ko + verifyNote;
    } else {
      answer = `${name}의 날씨 운영 정책은 현장 확인이 필요해요.${verifyNote}`;
    }
  }

  // Photo zone — TRUE KNOWLEDGE GAP for all current places
  else if (/(포토존|사진 어디|사진.*찍기|사진.*찍어|어디서.*찍|찍기 좋은 곳)/.test(msg)) {
    answer = `${name} 내 포토존 위치는 아직 정확하게 파악하지 못했어요. 현장에서 직원에게 문의해보세요.`;
  }

  // Hours — alternative phrasings not caught by the operation branch ("몇 시까지", "마감", "열어")
  else if (/(몇 시까지|마감|닫어|닫나요|닫아|언제까지|열어|몇 시에 열|언제 열)/.test(msg)) {
    if (knowledge.hours_ko) {
      answer = `${name} 운영시간은 ${knowledge.hours_ko}예요.`;
      if (knowledge.hours_trust === 'NON_OFFICIAL') answer += '\n(참고값이에요.)';
      answer += verifyNote;
    } else {
      answer = `${name}의 운영시간 정보가 아직 없어요.${verifyNote}`;
    }
  }

  // Stairs / alternate route — return stairs knowledge, admit no alternate path data
  else if (/(계단|다른 길|우회|올라가는 길|내려가는 길)/.test(msg)) {
    if (knowledge.stairs_ko) {
      answer = knowledge.stairs_ko;
      answer += `\n대안 경로 정보는 아직 없어요.${verifyNote}`;
    } else {
      answer = `${name}의 경로 정보가 아직 없어요.${verifyNote}`;
    }
  }

  // "알려 줘" spaced-form fallback — route to existing place info
  else if (/(알려 줘)/.test(msg)) {
    if (knowledge.hours_ko) {
      answer = `${name}에 대해 알려드릴게요.\n`;
      if (knowledge.ride_duration_ko) answer += `이동시간: ${knowledge.ride_duration_ko}\n`;
      if (knowledge.hours_ko) answer += `운영시간: ${knowledge.hours_ko}\n`;
      if (knowledge.price_ko) answer += `요금(참고): ${knowledge.price_ko}\n※ 공식 확인 필요`;
      if (!knowledge.ride_duration_ko && !knowledge.hours_ko && !knowledge.price_ko) {
        answer = `${name}에 대해 더 구체적으로 알고 싶은 것이 있으신가요?`;
      }
    } else {
      answer = `${name}에 대해 더 구체적으로 알고 싶은 것이 있으신가요?`;
    }
  }

  // Default — should rarely happen given _isPlaceSpecificQuery patterns
  if (!answer) {
    answer = `${name}에 대한 정보를 확인 중이에요.${verifyNote}`;
  }

  return {
    ok: true,
    payload: {
      session_id: sessionId,
      understood_context: {
        people_type: (soulContext && soulContext.people_type) || null,
        group_size: (soulContext && soulContext.group_size) || null,
      },
      places: [],
      why_details: [],
      message_ko: answer,
      status: 'PLACE_SPECIFIC_QUERY',
      presentation_mode: 'PLACE_KNOWLEDGE',
      quote: null,
      route: null,
      shared_journey: null,
      timestamp: new Date().toISOString(),
      next_options: [],
    }
  };
}

// ─── Semantic Role Extraction ─────────────────────────────────────────────────
// Departure and lodging roles are additive — the same place can have both.
// Uses MVP_HOTELS mapping from quoteContextService; no new resolver added.
const _DEPARTURE_SUFFIX = /에서\s*출발/;
const _LODGING_SUFFIX   = /에서\s*(숙박|1박|묵)/;
const _HOTEL_CODE_TO_KO = { ramada: '라마다', kenny: '켄싱턴 호텔' };

function _extractSemanticRoles(message) {
  if (!message) return { departure_origin: null, hotel_lodging: null };
  const hotelCode = quoteContextService._extractHotelCode(message);
  if (!hotelCode) return { departure_origin: null, hotel_lodging: null };
  const name = _HOTEL_CODE_TO_KO[hotelCode] || hotelCode;
  return {
    departure_origin: _DEPARTURE_SUFFIX.test(message)
      ? { name, canonical_code: hotelCode, role: 'departure' } : null,
    hotel_lodging: _LODGING_SUFFIX.test(message)
      ? { name, canonical_code: hotelCode, role: 'lodging' } : null,
  };
}

// Determines hotel_code to pass to routeSkeletonService.
// departure_origin alone does NOT trigger lodging skeleton.
// hotel_lodging (or no explicit role = legacy path) → uses hotel_code for skeleton.
function _hotelCodeForSkeleton(message, quoteCtx) {
  const { departure_origin, hotel_lodging } = _extractSemanticRoles(message);
  if (departure_origin && !hotel_lodging) return null; // departure-only → no lodging nodes
  if (hotel_lodging) return hotel_lodging.canonical_code; // explicit lodging → use code
  return quoteCtx ? quoteCtx.hotel_code : null; // no explicit role → legacy hotel_id path
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
function _buildClarificationPayload(sessionId, messageKo, sharedJourney) {
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
    shared_journey: sharedJourney || null,
    timestamp: new Date().toISOString(),
    next_options: [],
  };
}

// Detect POSITIVE discovery intent — recommendation/exploration verbs required.
// Discovery fires ONLY on positive evidence. Default is NO DISCOVERY.
// "추천해줘", "어디 갈까", "갈 만한 곳" → true
// "케이블카 타고 싶어", "일정 괜찮아?", "안녕" → false
function _isDiscoveryIntent(message) {
  if (!message) return false;
  // Explicit recommendation verbs
  if (/(추천해|추천해줘|추천해주|추천좀|추천 좀|알려줘|알려주세요|보여줘|보여주세요|찾아줘|찾아주세요)/.test(message)) return true;
  // Discovery question forms — "어디 갈까", "어디가 좋아", "갈 곳 뭐 있어?"
  if (/(어디 갈까|어디갈까|어디 가면|어디가면|어디가 좋|어디 가도|어디에 가|근처에 어디|어디 뭐|갈 곳 뭐|갈곳 뭐)/.test(message)) return true;
  // Activity-seeking — "뭐 할까?", "뭐 하지?" (post-visit next-step)
  if (/(뭐 할까|뭐할까|무얼 할까|무엇을 할까|뭐 하지|뭐하지|무얼 하지)/.test(message)) return true;
  // Post-visit directional — "그 다음 어디 가?", "어딜 가?"
  if (/(어딜 가|어디 가\??$)/.test(message)) return true;
  // Discovery noun phrases — "갈 만한 곳", "가볼 만한 곳", "좋은 곳"
  if (/(갈 만한|갈만한|가볼 만한|가볼만한|좋은 곳|좋은곳|가봐야|가야 할 곳|볼 곳|볼곳)/.test(message)) return true;
  // Sightseeing intent
  if (/(구경하고 싶|구경하고싶|구경 하고 싶)/.test(message)) return true;
  return false;
}

// Generate a meaningful SOUL clarification response for non-discovery contexts.
// SOUL is always responsible for the next turn — never silent, never blank.
function _generateClarificationMessage(soulContext, message, journeyCtx) {
  const msg  = message || '';
  const pt   = (soulContext && soulContext.people_type) || null;
  const jctx = journeyCtx || {};

  const guestKnown   = !!(jctx.guest_count && jctx.guest_count >= 1);
  const dateKnown    = !!jctx.travel_date;
  const cableInRoute = (jctx.leisure_code === 'cable') && !!jctx.route_id;

  // Build cable-car clarification with known-field suppression
  const _cableClar = () => {
    if (cableInRoute) {
      return dateKnown
        ? '케이블카는 현재 일정에 포함되어 있어요.'
        : '케이블카는 현재 일정에 포함되어 있어요.\n날짜를 확정하시면 더 정확한 일정을 잡아드릴게요.';
    }
    const asks = [];
    if (!guestKnown) asks.push('인원');
    if (!dateKnown)  asks.push('날짜');
    if (asks.length === 0) return '케이블카를 꼭 타고 싶으시군요. 일정을 새로 구성해 드릴까요?';
    return `케이블카를 꼭 타고 싶으시군요.\n${asks.join('와 ')}을 알려주시면 일정에 바로 포함해 드릴게요.`;
  };

  // Cable car explicit negation ("케이블카는 빼고 싶어")
  if (/케이블카|케이블 카/.test(msg) && /빼고|빼줘|제외|없이|빼겠|뺄/.test(msg)) {
    if (jctx.route_id) {
      return '현재 일정을 직접 수정하는 기능은 아직 준비 중이에요.\n케이블카 없이 새 일정을 다시 짜드릴까요?';
    }
    return '알겠어요. 케이블카 없이 일정을 구성해 드릴게요.\n출발 날짜와 인원을 알려주세요.';
  }

  // Cable car positive intent (or "일정에 넣어줘" reference)
  // Strong-intent verbs: explicit desire or future-plan ("탈거야" = will ride = intent, not curiosity)
  if (/케이블카|케이블 카/.test(msg)) {
    if (/(꼭|반드시|타고 싶|타야|태워|일정에 넣|일정에 포함|일정에 추가|탈거야|탈 거야|탈거예요|탈려고|타러|탈 예정)/.test(msg)) {
      return _cableClar();
    }
    return '케이블카에 대해 알고 싶으신 게 있으신가요?';
  }

  // Walking constraint about companion
  if (/(걷는 걸 싫어|걷기 싫어|걷기 힘들|걷지 못|걷기 어려|보행 어려)/.test(msg)) {
    return '걷는 게 부담스럽지 않은 일정이 필요하시군요.\n현재 일정에서 덜 걷는 코스로 바꿔드릴까요?';
  }

  // Journey feedback — "이 일정 괜찮아?", "그거 괜찮아?"
  if (/(이 일정|이 코스|이거|그거|그 일정).*(괜찮|좋아|어때)/.test(msg) ||
      /^(괜찮아|어때|좋아)\??\s*$/.test(msg.trim())) {
    return '어떤 부분이 마음에 걸리시나요?\n말씀해 주시면 함께 살펴볼게요.';
  }

  // Greeting
  if (/^(안녕|안녕하세요|반가워|하이|hello|hi)\s*[!.?]?\s*$/i.test(msg.trim())) {
    return '안녕하세요! 여수 여행을 도와드릴게요.\n어떤 여행을 생각하고 계신가요?';
  }

  // Indecision / open
  if (/(잘 모르겠|모르겠어|뭐가 좋을|뭐 해야|어떡하|어쩌)/.test(msg)) {
    return '괜찮아요. 천천히 얘기해주세요.\n여수에서 어떤 경험을 하고 싶으신가요?';
  }

  // Specific operational/photo question — do NOT replace with companion context.
  // These questions have a clear factual intent; companion framing would be confusing.
  if (/(운행|운영|열었|오픈|마감|비 오|날씨|기상|사진|찍어|찍을|포토|얼마나|걸려|요금|입장|가격)/.test(msg)) {
    return '더 정확히 알아볼게요. 어느 장소에 대해 궁금하신가요?';
  }

  // Companion-aware generic fallback
  if (pt === 'family_with_kids') {
    return '아이와 함께하는 여행이시군요.\n어떤 경험을 찾고 계신지 조금 더 말씀해 주실 수 있나요?';
  }
  if (pt === 'couple') {
    return '둘이 함께하는 여행이시군요.\n어디를 가고 싶으신지, 또는 일정 도움이 필요하신가요?';
  }
  if (pt === 'family_elderly') {
    return '부모님과 함께하는 여행이시군요.\n어떤 도움이 필요하신가요?';
  }

  return '여수 여행을 더 잘 도와드릴 수 있도록, 어떤 여행을 계획하고 계신지 말씀해 주세요.';
}

function _generateSoulMessage(soulContext, status, message, quoteCtx, currentPlaceCode = null, effectiveMobility = null) {
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

  const mobilityConstraint = effectiveMobility || soulContext.mobility_constraint;
  const requestedCount = soulContext.requested_count;

  // Fix 2: Narrow journey acknowledgement — grounded, only when both hotel+leisure resolved.
  // Acknowledges explicit resolved choices naturally. Does NOT enumerate every field.
  // Only fires for journey planning intent — NOT Discovery, NOT clarification.
  const HOTEL_NAME_KO   = { ramada: '라마다', kenny: '켄싱턴 호텔' };
  const LEISURE_NAME_KO = { cable: '케이블카' };
  if (quoteCtx && _isJourneyPlanningIntent(message) && status !== 'NO_RESULT' && status !== 'ERROR') {
    const hotelName   = quoteCtx.hotel_code ? (HOTEL_NAME_KO[quoteCtx.hotel_code] || null) : null;
    const leisureName = quoteCtx.leisure    ? (LEISURE_NAME_KO[quoteCtx.leisure]  || null) : null;
    if (hotelName && leisureName) {
      const base = `좋아요. ${hotelName}에서 묵고 ${leisureName}를 타는 일정으로 잡아볼게요.`;
      if (!quoteCtx.travel_date && /비용|얼마|가격|견적/.test(message)) {
        return `${base}\n날짜를 알려주시면 숙박비와 ${leisureName} 요금도 바로 계산해 드릴게요.`;
      }
      if (quoteCtx.travel_date && !quoteCtx.guest_count && /비용|얼마|가격|견적/.test(message)) {
        return `${base}\n몇 분이세요? 인원을 알려주시면 숙박비와 ${leisureName} 요금을 바로 계산해 드릴게요.`;
      }
      return base;
    }
    if (hotelName) {
      return `좋아요. ${hotelName} 일정으로 잡아볼게요.`;
    }
    if (leisureName) {
      return `좋아요. ${leisureName}를 포함해서 일정을 잡아볼게요.`;
    }
  }

  if (status === 'NO_RESULT') {
    return `${situationLine}\n조건에 맞는 장소를 찾지 못했어요. 시간이나 조건을 조정해보실래요?`;
  }

  // Fix 4: place-aware prefix for PARTIAL — reflect current Living Detail context
  const curPlaceNamePartial = currentPlaceCode ? (CURRENT_PLACE_KO[currentPlaceCode] || null) : null;
  const placePrefix = curPlaceNamePartial ? `${curPlaceNamePartial}에서 이어지는 여행이에요.` : null;

  // D6 soft clarification for UNKNOWN time (PARTIAL)
  if (status === 'PARTIAL') {
    // Multi-day first: "1박2일" makes time_available clarification contradictory.
    if (_isMultiDayTrip(message)) {
      return placePrefix
        ? `${placePrefix}\n여수에서 가볼 만한 곳을 골라봤어요.`
        : `${situationLine}\n여수에서 가볼 만한 곳을 골라봤어요.`;
    }
    if (pref === 'photo') {
      const countNote = requestedCount ? `${requestedCount}곳 요청하셨는데, ` : '';
      const base = placePrefix ? `${placePrefix}\n${situationLine}` : situationLine;
      return `${base}\n${countNote}사진 찍기 좋은 곳 위주로 골라봤어요.`;
    }
    if (mobilityConstraint === 'low_walking') {
      const base = placePrefix ? `${placePrefix}\n${situationLine}` : situationLine;
      return `${base}\n걷기 부담이 적은 곳을 고르려 했는데, 지금 장소 데이터에 보행 난이도 정보가 없어요.\n방문 전 각 장소의 도보 거리를 꼭 확인해보세요.`;
    }
    // Fix 2: family_elderly + hyangiram (high difficulty) without mobility signal
    // → walking state is the decision-critical UNKNOWN, not time
    if (pt === 'family_elderly' && currentPlaceCode === 'hyangiram' && !mobilityConstraint) {
      return `${placePrefix || situationLine}\n이동 부담이 적은 곳으로 골라봤어요. 걷기 많이 힘드신가요?`;
    }
    if (timeOfDay === 'night' || timeOfDay === 'evening') {
      const base = placePrefix ? `${placePrefix}\n${situationLine}` : situationLine;
      return `${base}\n지금 갈 수 있는 야간 명소를 골라봤어요.`;
    }
    if (budget === 'free' || budget === 'low') {
      const base = placePrefix ? `${placePrefix}\n${situationLine}` : situationLine;
      return `${base}\n부담 적은 곳 위주로 골라봤는데, 입장료는 직접 확인이 필요해요.`;
    }
    // Default PARTIAL — place-aware if current place known
    if (placePrefix) {
      return `${placePrefix}\n${situationLine}\n대략 2시간 기준으로 갈 곳을 골라봤어요.\n시간이 얼마나 남으셨어요?`;
    }
    return `${situationLine}\n대략 2시간 기준으로 편하게 갈 곳을 골라봤어요.\n시간이 얼마나 남으셨어요?`;
  }

  // SUCCESS — second line based on companion + situation
  // V0.1: Place-aware Discovery framing — acknowledge transition from current Living Detail page.
  const curPlaceName = currentPlaceCode ? (CURRENT_PLACE_KO[currentPlaceCode] || null) : null;
  const isDiscovery  = _isDiscoveryIntent(message);
  let secondLine;
  if (mobilityConstraint === 'low_walking') {
    secondLine = '걷기 부담이 적은 곳으로 골라봤는데, 보행 난이도 정보가 없어 방문 전 확인을 권장해요.';
  } else if (pt === 'family_elderly') {
    secondLine = curPlaceName && isDiscovery
      ? `${curPlaceName} 다음으로, 이동 부담이 적은 곳을 골라봤어요.`
      : '이동 부담이 적은 곳으로 골라봤어요.';
  } else if (pref === 'photo') {
    const countNote = requestedCount ? `${requestedCount}곳 ` : '';
    secondLine = `사진 잘 나오는 ${countNote}뷰 포인트를 골라봤어요.`;
  } else if (budget === 'free' || budget === 'low') {
    secondLine = '부담 적은 곳 위주로 골라봤는데, 입장료는 방문 전 확인을 권장해요.';
  } else if (timeOfDay === 'night' || timeOfDay === 'evening') {
    secondLine = '지금 가도 분위기 좋은 곳으로 골라봤어요.';
  } else {
    secondLine = curPlaceName && isDiscovery
      ? `${curPlaceName} 다음으로 갈 곳을 골라봤어요.`
      : '이동 시간까지 생각해서 편하게 갈 수 있는 곳으로 골라봐요.';
  }

  return `${situationLine}\n${secondLine}`;
}

// ─── Private: Result envelope ────────────────────────────────────────────────

function _buildResultEnvelope(request, tgResult, domainContext, status, soulHints = {}) {
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
    // Fix 2: Decision-critical question priority
    // family_elderly + high-difficulty place + no mobility signal → ask walking state first
    const { currentPlaceCode } = soulHints;
    if (domainContext.people_type === 'family_elderly' && currentPlaceCode === 'hyangiram' && !domainContext.mobility_constraint) {
      nextOptions.push('걷기 많이 힘드신가요?');
    } else {
      nextOptions.push('시간이 얼마나 남으셨어요?');
    }
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
    route: routeSkeleton || null,
    // JOURNEY COMPOSER V0: rich course blocks (place/transition/meal/cafe)
    // Previously dropped here — restored as additive field. null when not generated.
    course: (tgResult && tgResult.course) || null
  };
}

// ─── SOUL MINIMUM JOURNEY CONTINUITY V0.1 ─────────────────────────────────────
// 5 Decision Types within the current conversation session.
// Journey state: journey_ctx.conversation_journey — no new DB schema.
// Scope: cablecar / odongdo / hyangiram only.
// All physical_difficulty data read from DB via getPlaceByCode() — not hardcoded.

const _CONV_GOLDEN_KO = { odongdo: '오동도', cablecar: '케이블카', hyangiram: '향일암' };

function _extractGoldenPlaceCode(message) {
  if (/오동도/.test(message)) return 'odongdo';
  if (/케이블카|케이블 카/.test(message)) return 'cablecar';
  if (/향일암/.test(message)) return 'hyangiram';
  return null;
}

// Korean particle selector: afterConsonant vs afterVowel based on last character
function _koreanParticle(word, afterConsonant, afterVowel) {
  if (!word) return afterConsonant;
  const code = word.charCodeAt(word.length - 1) - 0xAC00;
  if (code < 0 || code > 11171) return afterConsonant;
  return code % 28 === 0 ? afterVowel : afterConsonant;
}

// Detection order: JOURNEY_MODIFY > CONSTRAINT_UPDATE > FEASIBILITY > JOURNEY_ADD > JOURNEY_PREFERENCE
function _detectJourneyDecisionType(message) {
  const msg = message || '';
  if (/(하나 빼|빼줘|빼주세요|제외해줘|하나만 빼|뭐 빼)/.test(msg)) return 'JOURNEY_MODIFY';
  if (/(걷는 건 힘|걷기 힘|걸으면 힘|힘들어하|다리 아|무릎 아|걷기 많이|많이 걷는)/.test(msg)) return 'CONSTRAINT_UPDATE';
  if (/(가능해|가능한가요|갈 수 있어|될까|가봐도 될|갈 수 있을까)/.test(msg)) return 'FEASIBILITY';
  if (/(도 탈래|도 갈래|도 넣어|탈래|도 타고|도 가볼까)/.test(msg)) return 'JOURNEY_ADD';
  if (/(먼저 가고 싶|가고 싶어|가고싶어)/.test(msg)) return 'JOURNEY_PREFERENCE';
  // Multi-place sequence: "케이블카 타고 향일암 갔다 올 거야" — user states an ordered visit plan
  if (/(갔다 올|갔다가|들렀다가|타고.*갔다)/.test(msg)) {
    const mentionedCodes = [...new Set(
      Object.entries(PLACE_ALIAS_MAP)
        .filter(([alias]) => msg.includes(alias))
        .map(([, code]) => code)
    )];
    if (mentionedCodes.length >= 2) return 'JOURNEY_MULTI_PLACE';
    if (mentionedCodes.length === 1) return 'JOURNEY_PREFERENCE';
  }
  return null;
}

function _readConvJourney(journeyCtx) {
  const cj = (journeyCtx && journeyCtx.conversation_journey) || null;
  if (!cj) return { places: [], constraints: {} };
  return { places: Array.isArray(cj.places) ? cj.places : [], constraints: cj.constraints || {} };
}

function _convJourneyPlace(convJourney, code) {
  return convJourney.places.find(p => p.code === code) || null;
}

function _convJourneyUpsertPlace(convJourney, code, update) {
  const existing = convJourney.places.find(p => p.code === code);
  if (existing) {
    return convJourney.places.map(p => p.code === code ? { ...p, ...update } : p);
  }
  return [...convJourney.places, { code, ...update }];
}

function _convJourneyRemovePlace(convJourney, code) {
  return { ...convJourney, places: convJourney.places.filter(p => p.code !== code) };
}

function _convJourneyIncludedKo(convJourney) {
  return convJourney.places
    .filter(p => p.status === 'included' || p.status === 'proposed')
    .map(p => {
      const ko = _CONV_GOLDEN_KO[p.code] || p.code;
      return p.status === 'proposed' ? `${ko}(검토중)` : ko;
    })
    .join(', ');
}

async function _handleJourneyDecision({ decisionType, message, soulContext, convJourney, journeyCtxForClar, sessionId }) {
  const placeCode = _extractGoldenPlaceCode(message);
  const pt = soulContext.people_type;
  const hasLowWalking = convJourney.constraints.low_walking || false;

  let soulMsg = null;
  let nextOptions = [];
  let updatedConvJourney = { places: [...convJourney.places], constraints: { ...convJourney.constraints } };

  // A. JOURNEY_PREFERENCE
  if (decisionType === 'JOURNEY_PREFERENCE' && placeCode) {
    const ko = _CONV_GOLDEN_KO[placeCode];
    const isFirst = updatedConvJourney.places.length === 0 || /먼저/.test(message);
    updatedConvJourney.places = _convJourneyUpsertPlace(updatedConvJourney, placeCode, {
      status: 'included', ...(isFirst ? { preference: 'first' } : {}),
    });
    soulMsg = isFirst
      ? `${ko}를 첫 번째 장소로 넣을게요.\n추가하고 싶은 곳이 있으신가요?`
      : `${ko}를 여행에 넣을게요.\n추가하고 싶은 곳이 있으신가요?`;
    nextOptions = ['케이블카도 탈래', '향일암까지 가능해?'];
  }

  // B. JOURNEY_ADD
  else if (decisionType === 'JOURNEY_ADD' && placeCode) {
    const ko = _CONV_GOLDEN_KO[placeCode];
    updatedConvJourney.places = _convJourneyUpsertPlace(updatedConvJourney, placeCode, { status: 'included' });
    const includedKo = _convJourneyIncludedKo(updatedConvJourney);
    soulMsg = `${ko}도 함께 넣을게요.\n지금까지: ${includedKo}.`;
    nextOptions = ['향일암까지 가능해?', '다른 곳은요?'];
  }

  // C. FEASIBILITY
  else if (decisionType === 'FEASIBILITY' && placeCode) {
    const ko = _CONV_GOLDEN_KO[placeCode];
    const placeData = await travelGuideService.getPlaceByCode(placeCode);
    const difficulty = placeData ? placeData.physical_difficulty : null;

    if (placeCode === 'hyangiram') {
      if (difficulty === 'high') {
        if (pt === 'family_elderly' && !hasLowWalking) {
          soulMsg = `향일암 자체는 갈 수 있어요. 다만 계단이 가파른 구간이 있어요.\n부모님이 계단 오르내리기 불편하신 편인가요?`;
          nextOptions = [PU_HY_003_ASK_EXAMPLES[0], '괜찮으세요'];
        } else if (pt === 'family_elderly' && hasLowWalking) {
          soulMsg = `향일암은 계단이 가파른 구간이 있어요. 걷기 부담이 있으신 상황에서 무리가 될 수 있어요.\n일정에 넣되 당일 체력 상태를 보고 결정하시는 걸 권장해요.`;
          nextOptions = ['그래도 가볼게요', '그럼 빼줘'];
        } else {
          soulMsg = `향일암은 계단이 가파른 구간이 있어요. 체력에 따라 다를 수 있어요.\n일정에 넣어볼까요?`;
          nextOptions = ['네, 넣어주세요', '조금 더 생각해볼게요'];
        }
      } else if (!difficulty) {
        soulMsg = `향일암은 갈 수 있어요. 보행 난이도 정보가 충분하지 않아서 방문 전 확인을 권장해요.\n일정에 넣어볼까요?`;
        nextOptions = ['네, 넣어주세요'];
      } else {
        soulMsg = `향일암은 갈 수 있어요. 일정에 넣어볼까요?`;
        nextOptions = ['네, 넣어주세요'];
      }
      updatedConvJourney.places = _convJourneyUpsertPlace(updatedConvJourney, placeCode, { status: 'proposed' });
    } else {
      soulMsg = `${ko}는 가실 수 있어요.\n일정에 넣어볼까요?`;
      nextOptions = ['네, 넣어주세요'];
      updatedConvJourney.places = _convJourneyUpsertPlace(updatedConvJourney, placeCode, { status: 'proposed' });
    }
  }

  // D. CONSTRAINT_UPDATE
  else if (decisionType === 'CONSTRAINT_UPDATE') {
    updatedConvJourney.constraints.low_walking = true;
    const hya = _convJourneyPlace(updatedConvJourney, 'hyangiram');
    const includedKo = _convJourneyIncludedKo(updatedConvJourney);

    if (hya && (hya.status === 'proposed' || hya.status === 'included')) {
      soulMsg = `알겠어요. 걷기 부담을 줄이는 방향으로 볼게요.\n현재 일정: ${includedKo}.\n향일암은 계단이 가파른 구간이 있어서 부담이 될 수 있어요. 어떻게 할까요?`;
      nextOptions = ['향일암 빼줘', '그래도 가볼게요'];
    } else {
      const listStr = includedKo || '아직 없어요';
      soulMsg = `알겠어요. 걷기 부담이 적은 일정으로 생각할게요.\n현재 일정: ${listStr}.`;
      nextOptions = ['다른 장소 추가하기'];
    }
  }

  // E. JOURNEY_MODIFY
  else if (decisionType === 'JOURNEY_MODIFY') {
    const includedPlaces = updatedConvJourney.places.filter(p => p.status === 'included' || p.status === 'proposed');
    if (includedPlaces.length === 0) return { ok: false };

    const placeDetails = await Promise.all(
      includedPlaces.map(async p => {
        const data = await travelGuideService.getPlaceByCode(p.code);
        return { ...p, physical_difficulty: data ? data.physical_difficulty : null };
      })
    );

    let toRemove = null;
    if (hasLowWalking || pt === 'family_elderly') {
      toRemove = placeDetails.find(p => p.physical_difficulty === 'high')
        || placeDetails.find(p => p.status === 'proposed')
        || null;
    } else {
      toRemove = placeDetails.find(p => p.status === 'proposed') || null;
    }

    if (toRemove) {
      const removeKo = _CONV_GOLDEN_KO[toRemove.code] || toRemove.code;
      const remaining = includedPlaces.filter(p => p.code !== toRemove.code);
      const remainingKo = remaining.map(p => _CONV_GOLDEN_KO[p.code] || p.code).join(', ');
      updatedConvJourney = _convJourneyRemovePlace(updatedConvJourney, toRemove.code);

      let reason = '';
      if (toRemove.physical_difficulty === 'high' && (hasLowWalking || pt === 'family_elderly')) {
        reason = hasLowWalking
          ? '걷기 부담이 있는 상황에서 계단이 가파른 구간이 있어요'
          : '계단이 가파른 구간이 있어 부모님께 부담이 될 수 있어요';
      } else if (toRemove.status === 'proposed') {
        reason = '아직 확정되지 않은 장소예요';
      } else {
        reason = '현재 일정에서 가장 부담이 될 수 있어요';
      }

      const eul = _koreanParticle(removeKo, '을', '를');
      soulMsg = remainingKo
        ? `${removeKo}${eul} 빼겠어요. ${reason}.\n남은 일정: ${remainingKo}.`
        : `${removeKo}${eul} 빼겠어요. ${reason}.`;
      nextOptions = ['저녁엔 어디 가면 좋아?'];
    } else {
      const placeNames = includedPlaces.map(p => _CONV_GOLDEN_KO[p.code] || p.code).join(', ');
      soulMsg = `현재 일정: ${placeNames}.\n어떤 장소를 빼고 싶으신가요?`;
      nextOptions = includedPlaces.map(p => `${_CONV_GOLDEN_KO[p.code] || p.code} 빼기`).slice(0, 3);
    }
  }

  // F. JOURNEY_MULTI_PLACE — ordered multi-place visit ("케이블카 타고 향일암 갔다 올 거야")
  else if (decisionType === 'JOURNEY_MULTI_PLACE') {
    const seen = new Set();
    const orderedCodes = [];
    Object.keys(PLACE_ALIAS_MAP)
      .sort((a, b) => message.indexOf(a) - message.indexOf(b))
      .filter(a => message.includes(a))
      .forEach(a => {
        const code = PLACE_ALIAS_MAP[a];
        if (!seen.has(code)) { seen.add(code); orderedCodes.push(code); }
      });
    for (const code of orderedCodes) {
      updatedConvJourney.places = _convJourneyUpsertPlace(updatedConvJourney, code, { status: 'included' });
    }
    const placeNames = orderedCodes.map(c => _CONV_GOLDEN_KO[c] || c).join(' → ');
    const carNote = soulContext.has_car === true ? ' 차로 이동하시면 편하게 둘 다 보실 수 있어요.' : '';
    soulMsg = `${placeNames} 순서로 계획해볼게요.${carNote}\n다른 곳도 추가하거나 변경이 필요하시면 말씀해 주세요.`;
    nextOptions = ['이동 시간 알려줘', '다른 장소도 추가'];
  }

  if (!soulMsg) return { ok: false };

  return {
    ok: true,
    updatedConvJourney,  // returned to caller for a single awaited session write
    payload: {
      session_id: sessionId,
      understood_context: {
        people_type: soulContext.people_type || null,
        group_size: soulContext.group_size || null,
        mobility_constraint: updatedConvJourney.constraints.low_walking ? 'low_walking' : null,
      },
      places: [],
      why_details: [],
      message_ko: soulMsg,
      status: 'JOURNEY_CONTINUITY',
      presentation_mode: 'CLARIFICATION',
      quote: null,
      route: null,
      shared_journey: null,
      timestamp: new Date().toISOString(),
      next_options: nextOptions,
      conversation_journey: { places: updatedConvJourney.places, constraints: updatedConvJourney.constraints },
    }
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function handleTravelRequest({ message, sessionId, hotelId, principal, explicit_context = {} }) {
  // PLACE_LOOKUP DETECTION (deterministic, pre-GPT)
  // Exact/alias match → skip ranking. Unknown → PLACE_UNKNOWN (no substitution).
  // UI-001: chip place_code supplements when text has no alias but message has a lookup/suitability verb.
  // Text alias always wins over chip (Principle 1 of contract).
  let placeLookup = _detectPlaceLookupIntent(message);
  if (!placeLookup.isPlaceLookup && explicit_context.place_code && !DISCOVERY_OVERRIDES.test(message)) {
    const hasVerb = MEDIUM_LOOKUP.test(message) || STRONG_LOOKUP.test(message);
    if (hasVerb) {
      placeLookup = {
        isPlaceLookup: true,
        resolvedCode: explicit_context.place_code,
        isSuitabilityQuery: SUITABILITY_LOOKUP.test(message),
        source: 'EXPLICIT_CONTEXT',
      };
    }
  }

  if (placeLookup.isPlaceLookup) {
    if (placeLookup.resolvedCode) {
      const place = await travelGuideService.getPlaceByCode(placeLookup.resolvedCode);
      if (place) {
        // Judgment V0.1 — only for suitability queries (어때?/괜찮아? etc.), not informational (알려줘)
        let judgedContext = null;
        if (placeLookup.isSuitabilityQuery) {
          // Traveler context precedence: current message text > chip > persisted session > null
          const msgPeople = _extractPeopleLightweight(message);
          let people_type = msgPeople.people_type;
          let companion_has_elderly = msgPeople.companion_has_elderly;
          // UI-001: chip supplement (text > chip > session)
          if (!people_type && explicit_context.people_type) {
            people_type = explicit_context.people_type;
            companion_has_elderly = (explicit_context.people_type === 'family_elderly');
          }
          if (!people_type) {
            try {
              const sd = await sessionService.getSession(sessionId);
              const stored = sd && sd.journey_ctx && sd.journey_ctx.traveler_profile;
              if (stored) {
                if (stored.people_type) people_type = stored.people_type;
                if (stored.companion_has_elderly != null) companion_has_elderly = stored.companion_has_elderly;
              }
            } catch (_) {}
          }
          judgedContext = _judgePlaceLookup(place, people_type, companion_has_elderly);
        }
        return { ok: true, payload: _buildPlaceLookupClientPayload(place, sessionId, judgedContext) };
      }
    }
    return { ok: true, payload: _buildUnknownPlacePayload(placeLookup.placeName, sessionId) };
  }

  // ─── COMMERCE FOLLOW-UP (pre-GPT, uses stored journey_ctx) ──────────────────
  // "이 정도면 얼마야?", "견적 보여줘" etc. — never routes to DISCOVERY.
  // Merges stored Journey with explicit message overrides (message wins on conflict).
  // Guard: explicit place_code means user is asking about current place price, not journey quote.
  if (_isCommerceFollowUpIntent(message) && !explicit_context.place_code) {
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

  // ─── DATE PROVISION FOLLOW-UP ─────────────────────────────────────────────
  // Handles user providing a date in direct response to SOUL's date-ask.
  // Fires ONLY when stored journey_ctx has hotel_code but no travel_date.
  if (_isDateProvisionMessage(message)) {
    let storedCtx = null;
    try {
      const sessionData = await sessionService.getSession(sessionId);
      storedCtx = sessionData && sessionData.journey_ctx ? sessionData.journey_ctx : null;
    } catch (_) {}

    if (storedCtx && storedCtx.hotel_code && !storedCtx.travel_date) {
      const extractedDate = quoteContextService._extractDate(message);
      if (extractedDate) {
        const mergedCtx = {
          hotel_code:  storedCtx.hotel_code,
          leisure:     storedCtx.leisure_code || null,
          guest_count: storedCtx.guest_count  || 2,
          travel_date: extractedDate,
          region:      'yeosu',
        };

        let quoteResult = null;
        const complexCheck = quoteContextService.isComplexGroupHotel(mergedCtx, message);
        if (complexCheck.complex) {
          quoteResult = { status: 'PENDING_HUMAN_QUOTE', reason: complexCheck.reason };
        } else if (quoteContextService.isQuotable(mergedCtx)) {
          const raw = quoteEngine.calculateQuote(quoteContextService.buildQuoteInput(mergedCtx));
          if (raw.success) {
            const clean = quoteEngine.sanitizeForCustomer(raw);
            clean.status = 'CALCULATED';
            quoteResult = clean;
          } else {
            quoteResult = { status: 'CALCULATION_ERROR', error: raw.error };
          }
        }

        // Rebuild route skeleton with confirmed date — LOCKED items only (no fresh TG call)
        let routeSkeleton = null;
        try {
          const { buildSkeleton } = require('./routeSkeletonService');
          routeSkeleton = buildSkeleton({
            start_date:     extractedDate,
            hotel_code:     mergedCtx.hotel_code,
            leisure_code:   mergedCtx.leisure,
            leisure_source: 'USER_SELECTED',
            guest_count:    mergedCtx.guest_count,
            candidates:     [],
            nights:         storedCtx.nights || 1,
          });
        } catch (err) {
          console.error('[DATE_PROVISION_SKELETON_ERROR]', err.message);
        }

        // Persist confirmed date into session journey_ctx
        sessionService.updateJourneyContext(sessionId, {
          ...storedCtx,
          travel_date: extractedDate,
        }).catch(err => console.error('[DATE_PROVISION_CTX_WRITE]', err.message));

        const presentationMode = (quoteResult && quoteResult.status === 'CALCULATED') ? 'QUOTE_READY' : 'ROUTE_READY';
        const soulMsg = (quoteResult && quoteResult.status === 'CALCULATED')
          ? '날짜를 확인했어요. 숙박비와 케이블카 요금을 계산했어요.'
          : '날짜를 확인했어요.';

        return {
          ok: true,
          payload: {
            session_id: sessionId,
            understood_context: { group_size: mergedCtx.guest_count },
            places: [],
            why_details: [],
            message_ko: soulMsg,
            status: presentationMode,
            presentation_mode: presentationMode,
            quote: quoteResult,
            route: routeSkeleton,
            shared_journey: null,
            timestamp: new Date().toISOString(),
            next_options: [],
          }
        };
      }
    }
  }

  // ─── GUEST COUNT PROVISION FOLLOW-UP ─────────────────────────────────────
  // Handles user providing headcount in direct response to SOUL's count-ask.
  // Fires ONLY when stored journey_ctx has hotel_code + travel_date but no guest_count.
  if (_isGuestCountProvisionMessage(message)) {
    let storedCtx = null;
    try {
      const sessionData = await sessionService.getSession(sessionId);
      storedCtx = sessionData && sessionData.journey_ctx ? sessionData.journey_ctx : null;
    } catch (_) {}

    if (storedCtx && storedCtx.hotel_code && storedCtx.travel_date && !storedCtx.guest_count) {
      const extractedCount = quoteContextService._extractGuestCount(message, {});
      if (extractedCount && extractedCount >= 1) {
        const mergedCtx = {
          hotel_code:  storedCtx.hotel_code,
          leisure:     storedCtx.leisure_code || null,
          guest_count: extractedCount,
          travel_date: storedCtx.travel_date,
          region:      'yeosu',
        };

        let quoteResult = null;
        const complexCheck = quoteContextService.isComplexGroupHotel(mergedCtx, message);
        if (complexCheck.complex) {
          quoteResult = { status: 'PENDING_HUMAN_QUOTE', reason: complexCheck.reason };
        } else if (quoteContextService.isQuotable(mergedCtx)) {
          const raw = quoteEngine.calculateQuote(quoteContextService.buildQuoteInput(mergedCtx));
          if (raw.success) {
            const clean = quoteEngine.sanitizeForCustomer(raw);
            clean.status = 'CALCULATED';
            quoteResult = clean;
          } else {
            quoteResult = { status: 'CALCULATION_ERROR', error: raw.error };
          }
        }

        // Rebuild route skeleton with confirmed guest_count
        let routeSkeleton = null;
        try {
          const { buildSkeleton } = require('./routeSkeletonService');
          routeSkeleton = buildSkeleton({
            start_date:     mergedCtx.travel_date,
            hotel_code:     mergedCtx.hotel_code,
            leisure_code:   mergedCtx.leisure,
            leisure_source: 'USER_SELECTED',
            guest_count:    mergedCtx.guest_count,
            candidates:     [],
            nights:         storedCtx.nights || 1,
          });
        } catch (err) {
          console.error('[GUEST_COUNT_PROVISION_SKELETON_ERROR]', err.message);
        }

        // Persist confirmed guest_count into session journey_ctx
        sessionService.updateJourneyContext(sessionId, {
          ...storedCtx,
          guest_count: extractedCount,
        }).catch(err => console.error('[GUEST_COUNT_PROVISION_CTX_WRITE]', err.message));

        const presentationMode = (quoteResult && quoteResult.status === 'CALCULATED') ? 'QUOTE_READY' : 'ROUTE_READY';
        const soulMsg = (quoteResult && quoteResult.status === 'CALCULATED')
          ? `${extractedCount}명 확인했어요. 숙박비와 케이블카 요금을 계산했어요.`
          : `${extractedCount}명 확인했어요.`;

        return {
          ok: true,
          payload: {
            session_id: sessionId,
            understood_context: { group_size: extractedCount },
            places: [],
            why_details: [],
            message_ko: soulMsg,
            status: presentationMode,
            presentation_mode: presentationMode,
            quote: quoteResult,
            route: routeSkeleton,
            shared_journey: null,
            timestamp: new Date().toISOString(),
            next_options: [],
          }
        };
      }
    }
  }

  // UNDERSTAND + SHARED JOURNEY EXTRACTION (parallel — independent AI calls)
  const [understandResult, sharedJourney] = await Promise.all([
    _understand(message, { placeCode: explicit_context && explicit_context.place_code }),
    _extractSharedJourney(message)
  ]);

  if (!understandResult.ok) {
    return { ok: false, httpStatus: 400, error: understandResult.error };
  }
  // UI-001: apply chip supplement after GPT extraction.
  // Text (USER_EXPLICIT) always wins; chip fills only UNKNOWN/non-explicit fields.
  let { soulContext } = understandResult;
  soulContext = _applyExplicitContextChip(soulContext, explicit_context);

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

  // ─── DISCOVERY GATE ──────────────────────────────────────────────────────────
  // Travel Intelligence fires ONLY on positive discovery or journey-planning intent.
  // Everything else → SOUL clarification. SOUL never goes silent.
  //
  //   DISCOVERY  = "추천해줘", "어디 갈까?", "갈 만한 곳" (positive verb/phrase required)
  //   JOURNEY    = "1박2일 일정 짜줘" → handled by skeleton gate inside Travel Intelligence
  //   EVERYTHING ELSE → clarification with meaningful message_ko
  //
  // DO NOT add negative exclusion patterns. Absence of positive evidence = no Discovery.
  const needsTravelIntelligence = _isDiscoveryIntent(message) || _isJourneyPlanningIntent(message);

  if (!needsTravelIntelligence) {
    // Load journey_ctx for context-aware clarification (known-field suppression)
    let journeyCtxForClar = null;
    try {
      const sessionCtx = await sessionService.getSession(sessionId);
      journeyCtxForClar = sessionCtx && sessionCtx.journey_ctx ? sessionCtx.journey_ctx : null;
    } catch (_) {}

    // Traveler Profile Continuity: enrich soulContext from persisted profile BEFORE any gate uses it.
    // A non-companion turn ("차 가져가") must not overwrite an already-known explicit people_type.
    // Precedence: CURRENT USER_EXPLICIT > PERSISTED USER_EXPLICIT > CURRENT default/unknown.
    // _applyPersistedTravelerProfile is idempotent: if current turn already has USER_EXPLICIT, stored is ignored.
    const _earlyStoredProfile = (journeyCtxForClar && journeyCtxForClar.traveler_profile) || null;
    if (_earlyStoredProfile) {
      soulContext = _applyPersistedTravelerProfile(soulContext, _earlyStoredProfile);
    }

    // ── Place-Specific Query Gate (V0.1) — intercept before CLARIFICATION ────────
    // Handles operational/factual questions about the CURRENT place (place_code required).
    // Examples: 왕복이 나아?, 비 오면?, 휠체어 탈 수 있어?, 얼마나 걸려?, 얼마야?
    // Placed after Journey Decision Gate setup but before generic CLARIFICATION.
    // soulContext is already enriched with persisted traveler profile at this point.
    // Text alias wins over current page: "케이블카는 얼마야?" on Odongdo → cablecar PSQ.
    let _psqPlaceCode = explicit_context && explicit_context.place_code;
    if (_psqPlaceCode) {
      const _psqTextAlias = Object.keys(PLACE_ALIAS_MAP)
        .sort((a, b) => b.length - a.length)
        .find(alias => message.includes(alias));
      const _psqTextCode = _psqTextAlias ? PLACE_ALIAS_MAP[_psqTextAlias] : null;
      if (_psqTextCode && _psqTextCode !== _psqPlaceCode) _psqPlaceCode = _psqTextCode;
    }
    if (_psqPlaceCode && _isPlaceSpecificQuery(message)) {
      try {
        const _psqPlace = await travelGuideService.getPlaceByCode(_psqPlaceCode);
        if (_psqPlace) {
          return _buildPlaceSpecificQueryPayload(message, _psqPlace, soulContext, sessionId);
        }
      } catch (_psqErr) {
        console.warn('[PLACE_SPECIFIC_QUERY_ERROR]', _psqErr.message);
        // Non-fatal: fall through to Journey Decision Gate / CLARIFICATION
      }
    }

    // ── Journey Decision Gate — intercept before generic CLARIFICATION ──────────
    const _journeyDecisionType = _detectJourneyDecisionType(message);
    if (_journeyDecisionType) {
      const _convJourney = _readConvJourney(journeyCtxForClar);
      const _journeyResult = await _handleJourneyDecision({
        decisionType: _journeyDecisionType,
        message,
        soulContext,
        convJourney: _convJourney,
        journeyCtxForClar,
        sessionId,
      });
      if (_journeyResult.ok) {
        // Single awaited write: conversation_journey + traveler facts merged to avoid race.
        const _jFacts = _extractExplicitTravelerFacts(soulContext);
        const _cj = _journeyResult.updatedConvJourney;
        const _writeData = {
          ...(journeyCtxForClar || {}),
          conversation_journey: { places: _cj.places, constraints: _cj.constraints },
        };
        if (Object.values(_jFacts).some(v => v != null)) {
          _writeData.traveler_profile = _mergeProfileFacts(_jFacts, (journeyCtxForClar && journeyCtxForClar.traveler_profile) || null);
        }
        await sessionService.updateJourneyContext(sessionId, _writeData).catch(err => console.error('[CONV_JOURNEY_WRITE_ERROR]', err.message));
        return { ok: true, payload: _journeyResult.payload };
      }
    }

    // ── Living Detail Fallback — unrecognized concrete questions on place pages ──────
    // When the PSQ gate didn't fire (pattern not in _isPlaceSpecificQuery) but a place_code
    // context exists, attempt PSQ rather than falling to a generic planning prompt.
    // _buildPlaceSpecificQueryPayload returns graceful "정보를 확인 중이에요" for unknown patterns.
    // Guard: skip for greetings, indecision, and cable-car clarification intents that
    // belong in _generateClarificationMessage early branches.
    const _ldGuardBypass =
      /^(안녕|안녕하세요|반가워|하이|hello|hi)[\s!.?]*$/i.test(message.trim())
      || /(잘 모르겠|모르겠어|뭐가 좋을|뭐 해야|어떡하|어쩌)/.test(message)
      || (/케이블카|케이블 카/.test(message) && /(꼭|반드시|타고 싶|타야|빼고|빼줘|제외|일정에|탈거야)/.test(message));
    if (_psqPlaceCode && !_ldGuardBypass) {
      try {
        const _ldPlace = await travelGuideService.getPlaceByCode(_psqPlaceCode);
        if (_ldPlace) {
          return _buildPlaceSpecificQueryPayload(message, _ldPlace, soulContext, sessionId);
        }
      } catch (_ldErr) {
        console.warn('[LIVING_DETAIL_FALLBACK_ERROR]', _ldErr.message);
        // Non-fatal: fall through to _generateClarificationMessage
      }
    }

    const clarificationMsg = _generateClarificationMessage(soulContext, message, journeyCtxForClar);

    // Persist explicit leisure preference BEFORE returning response.
    // Awaited so Turn N+1 session read is guaranteed to see the written preference.
    // _extractLeisure returns null on negation — so we only write on genuine preference.
    const pendingLeisure = quoteContextService._extractLeisure(message);
    const cableNegated   = /케이블카|케이블 카/.test(message) && /빼고|빼줘|제외|없이|빼겠|뺄/.test(message);
    if (pendingLeisure) {
      try {
        const writeResult = await sessionService.updateJourneyContext(sessionId, {
          ...(journeyCtxForClar || {}),
          preferred_leisure: pendingLeisure,
        });
        void writeResult;
      } catch (err) {
        console.error('[JOURNEY_PREF_WRITE_ERROR]', err.message);
        // Non-fatal: log and continue — preference not persisted, next turn lacks continuity
      }
    } else if (cableNegated && journeyCtxForClar && journeyCtxForClar.preferred_leisure) {
      // Explicit negation clears stale preference so next route build excludes cablecar
      try {
        await sessionService.updateJourneyContext(sessionId, {
          ...journeyCtxForClar,
          preferred_leisure: null,
        });
      } catch (err) {
        console.error('[JOURNEY_PREF_CLEAR_ERROR]', err.message);
      }
    }

    // Persist USER_EXPLICIT traveler facts even on clarification turns (non-blocking).
    // e.g. "부모님이랑 갈 건데 어디 좋을까요?" — people_type written before Journey turn.
    const _clarFacts = _extractExplicitTravelerFacts(soulContext);
    if (Object.values(_clarFacts).some(v => v != null)) {
      sessionService.updateJourneyContext(sessionId, {
        ...(journeyCtxForClar || {}),
        traveler_profile: _mergeProfileFacts(_clarFacts, (journeyCtxForClar && journeyCtxForClar.traveler_profile) || null),
      }).catch(err => console.error('[TRAVELER_PROFILE_WRITE_ERROR]', err.message));
    }

    return {
      ok: true,
      payload: {
        session_id: sessionId,
        understood_context: {
          people_type: soulContext.people_type || null,
          group_size: soulContext.group_size || null,
        },
        places: [],
        why_details: [],
        message_ko: clarificationMsg,
        status: 'CLARIFICATION',
        presentation_mode: 'CLARIFICATION',
        quote: null,
        route: null,
        shared_journey: sharedJourney || null,
        timestamp: new Date().toISOString(),
        next_options: [],
      }
    };
  }

  // ─── Traveler Profile Continuity V0.1 ──────────────────────────────────────
  // Single session read shared by: profile re-injection + skeleton write-back.
  // Must precede _buildDomainContext so enriched facts flow into Journey Composer.
  let _sessionCtxForTurn = null;
  try {
    const _sd = await sessionService.getSession(sessionId);
    _sessionCtxForTurn = (_sd && _sd.journey_ctx) ? _sd.journey_ctx : null;
  } catch (_) {}
  const _storedTravelerProfile = (_sessionCtxForTurn && _sessionCtxForTurn.traveler_profile) || null;
  const enrichedSoulContext = _applyPersistedTravelerProfile(soulContext, _storedTravelerProfile);

  // Write USER_EXPLICIT facts from this turn to persisted profile (non-blocking).
  const _turnFacts = _extractExplicitTravelerFacts(soulContext);
  if (Object.values(_turnFacts).some(v => v != null)) {
    sessionService.updateJourneyContext(sessionId, {
      ...(_sessionCtxForTurn || {}),
      traveler_profile: _mergeProfileFacts(_turnFacts, _storedTravelerProfile),
    }).catch(err => console.error('[TRAVELER_PROFILE_WRITE_ERROR]', err.message));
  }

  // CONSTRUCT REQUEST ENVELOPE (internal audit — not returned to client directly)
  const request = _buildRequestEnvelope(principal, enrichedSoulContext, sessionId);

  // D5 DOMAIN CONTEXT + DOMAIN_FALLBACK labeling
  const baseDomainContext = _buildDomainContext(enrichedSoulContext, sessionId, hotelId);

  // V0.1: Place-aware Discovery — exclude current Living Detail place from recommendations.
  // Prevents SOUL from recommending the place the traveler is already viewing.
  if (explicit_context.place_code && !baseDomainContext.exclude_place_ids.includes(explicit_context.place_code)) {
    baseDomainContext.exclude_place_ids = [...baseDomainContext.exclude_place_ids, explicit_context.place_code];
  }

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
  let _resolvedLeisure = null;
  let _leisureSource   = null;
  if (_isJourneyPlanningIntent(message) && quoteCtx) {
    // Reuse session context already loaded for Traveler Profile Continuity above.
    const journeyCtxForSkeleton = _sessionCtxForTurn;

    // Priority: current message > stored traveler preference > null
    _resolvedLeisure = quoteCtx.leisure
      || (journeyCtxForSkeleton && journeyCtxForSkeleton.preferred_leisure)
      || null;
    _leisureSource = quoteCtx.leisure
      ? 'USER_SELECTED'
      : (_resolvedLeisure ? 'TRAVELER_REQUESTED' : null);
    try {
      const { buildSkeleton } = require('./routeSkeletonService');
      const nights = _extractNights(message);
      const _skeletonHotelCode = _hotelCodeForSkeleton(message, quoteCtx);
      routeSkeleton = buildSkeleton({
        start_date:     quoteCtx.travel_date || null,
        hotel_code:     _skeletonHotelCode,
        leisure_code:   _resolvedLeisure,
        leisure_source: _leisureSource,
        guest_count:    quoteCtx.guest_count || domainContext.group_size || 2,
        candidates:     tgResult.places || [],
        nights,
      });

      // Write-back: preserve existing journey_ctx fields + update route fields.
      // departure_origin / hotel_lodging stored as independent additive keys.
      // guest_count stored as null when not user-explicit — GUEST_COUNT_PROVISION fills it later.
      const _roles = _extractSemanticRoles(message);
      sessionService.updateJourneyContext(sessionId, {
        ...(journeyCtxForSkeleton || {}),
        route_id:         routeSkeleton.route_id,
        nights,
        hotel_code:       _skeletonHotelCode,
        leisure_code:     _resolvedLeisure,
        guest_count:      quoteCtx.guest_count  || domainContext.group_size || null,
        travel_date:      quoteCtx.travel_date  || null,
        departure_origin: _roles.departure_origin || (journeyCtxForSkeleton && journeyCtxForSkeleton.departure_origin) || null,
        hotel_lodging:    _roles.hotel_lodging    || (journeyCtxForSkeleton && journeyCtxForSkeleton.hotel_lodging)    || null,
        traveler_profile: _mergeProfileFacts(_extractExplicitTravelerFacts(enrichedSoulContext), _storedTravelerProfile),
      }).catch(err => console.error('[JOURNEY_CTX_WRITE_ERROR]', err.message));

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

  // STATUS
  const status = _deriveStatus(tgResult, domainContext);

  // D7 SOUL MESSAGE
  const soulMessage = _generateSoulMessage(enrichedSoulContext, status, message, quoteCtx, explicit_context.place_code || null, domainContext.mobility_constraint || null);

  // WHY DETAILS
  const whyDetails = _buildWhyDetails(tgResult, domainContext);

  // RESULT ENVELOPE
  const result = _buildResultEnvelope(request, tgResult, domainContext, status, { currentPlaceCode: explicit_context.place_code || null });

  // CLIENT PAYLOAD
  const payload = _buildClientPayload(result, tgResult, whyDetails, soulMessage, sessionId, enrichedSoulContext, sharedJourney, quoteResult, routeSkeleton);

  return { ok: true, payload };
}

module.exports = { handleTravelRequest };
