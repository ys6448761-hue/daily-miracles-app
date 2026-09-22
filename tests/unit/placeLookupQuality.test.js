'use strict';
/**
 * PLACE_LOOKUP Answer Quality V0.1 — T-PL01 to T-PL12
 *
 * Verifies that _buildPlaceLookupMessage produces place-specific,
 * meaningful responses using emotion_tags / suitable_for / weather_suitable.
 * All tests use the handleTravelRequest path with mocked DB.
 *
 * DATA GAP Matrix (as of mig216):
 *   description_short — NULL for all 12 places (DATA GAP)
 *   address           — PRESENT for 10/12 (dolsan_nightscape=NULL, others seed values)
 *   opening_hours     — VERIFIED for 2/12 (sky_tower 10:00-22:00, romantic_pojangmacha 18:00-01:00)
 *   admission_fee     — VERIFIED for 10/12 (9 FREE + sky_tower PAID; cablecar=null/PAID-Commerce; yeosu_expo_park=GAP)
 *   live_status=FALSE — 5/12 (dolsan_daegyo, dolsan_nightscape, jaisan_park, lee_soon_shin_plaza, marine_park)
 */

// ── Mocks ──────────────────────────────────────────────────────────────────────
jest.mock('../../services/travelGuideService', () => ({
  recommend: jest.fn().mockResolvedValue({ places: [], session_id: 'TEST' }),
  getPlaceByCode: jest.fn(),
}));

jest.mock('../../services/contextExtractionService', () => ({
  parseUserMessage: jest.fn().mockResolvedValue({
    people_type: 'solo', time_available_minutes: 120, companion_constraints: {},
    meal_context: 'none', has_car: true, mobility_type: 'mixed', wish_context: null,
    exclude_place_ids: [], must_visit_place_ids: [], time_of_day: null,
    preference_type: null, budget_constraint: null, group_size: null,
    requested_count: null, mobility_constraint: null,
    _provenance: { time_available_minutes: 'UNKNOWN', people_type: 'UNKNOWN' },
  }),
}));

jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn().mockReturnValue({}),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  isQuotable: jest.fn().mockReturnValue(false),
}));

jest.mock('../../services/sessionService', () => ({
  touchSession: jest.fn().mockResolvedValue(undefined),
}));

const tgMock = require('../../services/travelGuideService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

// ── Fixtures ───────────────────────────────────────────────────────────────────

const PLACES = {
  lee_soon_shin_plaza: {
    code: 'lee_soon_shin_plaza', name_ko: '이순신광장',
    description_short: null, indoor_outdoor: 'outdoor', avg_stay_minutes: 45,
    admission_fee_json: { adult: 0 }, opening_hours_json: null,
    physical_difficulty: null, live_status_required: false,
    suitable_for: ['family', 'kids_ok', 'elderly', 'groups'],
    emotion_tags: ['history', 'education'], weather_suitable: ['clear', 'all_season'],
  },
  odongdo: {
    code: 'odongdo', name_ko: '오동도',
    description_short: null, indoor_outdoor: 'outdoor', avg_stay_minutes: 120,
    admission_fee_json: { adult: 0 }, opening_hours_json: null,
    physical_difficulty: null, live_status_required: true,
    suitable_for: ['family', 'kids_ok', 'elderly', 'groups'],
    emotion_tags: ['nature', 'seasonal', 'growth'], weather_suitable: ['clear', 'clear_dry', 'spring'],
  },
  hyangiram: {
    code: 'hyangiram', name_ko: '향일암',
    description_short: null, indoor_outdoor: 'outdoor', avg_stay_minutes: 90,
    admission_fee_json: { adult: 0 }, opening_hours_json: null,
    physical_difficulty: 'high', live_status_required: true,
    suitable_for: ['family', 'elderly', 'kids_ok', 'pilgrimage'],
    emotion_tags: ['dawn', 'faith', 'historical'], weather_suitable: ['clear', 'sunrise', 'all_season'],
  },
  cablecar: {
    code: 'cablecar', name_ko: '케이블카',
    description_short: null, indoor_outdoor: 'outdoor', avg_stay_minutes: 45,
    admission_fee_json: null, opening_hours_json: null,
    physical_difficulty: null, live_status_required: true,
    suitable_for: ['family', 'kids_ok', 'young_adults'],
    emotion_tags: ['view', 'adventure', 'modern'], weather_suitable: ['clear', 'all_season'],
  },
  dolsan_nightscape: {
    code: 'dolsan_nightscape', name_ko: '돌산공원',
    description_short: null, indoor_outdoor: 'outdoor', avg_stay_minutes: 45,
    admission_fee_json: { adult: 0 }, opening_hours_json: null,
    physical_difficulty: null, live_status_required: false,
    suitable_for: ['young_adults', 'couples', 'groups'],
    emotion_tags: ['night_view', 'date'], weather_suitable: ['clear', 'night'],
  },
  marine_park: {
    code: 'marine_park', name_ko: '종포해양공원',
    description_short: null, indoor_outdoor: 'outdoor', avg_stay_minutes: 75,
    admission_fee_json: { adult: 0 }, opening_hours_json: null,
    physical_difficulty: null, live_status_required: false,
    suitable_for: ['family', 'kids_ok', 'elderly'],
    emotion_tags: ['nature', 'recreation'], weather_suitable: ['clear', 'all_season'],
  },
  sky_tower: {
    code: 'sky_tower', name_ko: '스카이타워',
    description_short: null, indoor_outdoor: 'indoor_outdoor', avg_stay_minutes: 60,
    admission_fee_json: { adult: 3000, youth: 2500, senior: 2500, child: 1500 },
    opening_hours_json: { mon: '10:00-22:00', tue: '10:00-22:00', wed: '10:00-22:00', thu: '10:00-22:00', fri: '10:00-22:00', sat: '10:00-22:00', sun: '10:00-22:00' },
    physical_difficulty: null, live_status_required: true,
    suitable_for: ['family', 'kids_ok', 'young_adults'],
    emotion_tags: ['view', 'landmark', 'modern'], weather_suitable: ['clear', 'all_season'],
  },
  romantic_pojangmacha: {
    code: 'romantic_pojangmacha', name_ko: '낭만포차거리',
    description_short: null, indoor_outdoor: 'outdoor', avg_stay_minutes: 60,
    admission_fee_json: { adult: 0 }, opening_hours_json: { mon: '18:00-01:00', tue: '18:00-01:00', wed: '18:00-01:00', thu: '18:00-01:00', fri: '18:00-01:00', sat: '18:00-01:00', sun: '18:00-01:00' },
    physical_difficulty: null, live_status_required: true,
    suitable_for: ['young_adults', 'groups', 'friends'],
    emotion_tags: ['food', 'social', 'street_culture'], weather_suitable: ['clear', 'cool', 'evening', 'night'],
  },
};

async function getMsg(code, query) {
  tgMock.getPlaceByCode.mockResolvedValue(PLACES[code]);
  const msg = query || `${PLACES[code].name_ko}에 대해 알려줘`;
  const result = await handleTravelRequest({ message: msg, sessionId: 'sess-test' });
  return result.payload.message_ko;
}

// ── T-PL01: 이순신광장 — identity & no live_status warning ─────────────────────
test('T-PL01 이순신광장: identity line present, live_status warning suppressed', async () => {
  const msg = await getMsg('lee_soon_shin_plaza', '이순신광장에 대해 알려줘');
  expect(msg).toContain('이순신광장에 대해 알려드릴게요.');
  expect(msg).toContain('이순신');
  expect(msg).not.toContain('방문 전 운영 여부');
  expect(msg).not.toContain('야외 공간이에요.');
});

// ── T-PL02: 이순신광장 — FREE admission shown correctly ────────────────────────
test('T-PL02 이순신광장: FREE admission — "무료로 둘러볼 수 있어요."', async () => {
  const msg = await getMsg('lee_soon_shin_plaza', '이순신광장에 대해 알려줘');
  expect(msg).toContain('무료로 둘러볼 수 있어요.');
  expect(msg).not.toContain('입장료는 무료예요.'); // old phrasing replaced
});

// ── T-PL03: 오동도 — spring timing hint ────────────────────────────────────────
test('T-PL03 오동도: spring timing hint from weather_suitable', async () => {
  const msg = await getMsg('odongdo', '오동도에 대해 알려줘');
  expect(msg).toContain('봄에 특히 아름다운');
});

// ── T-PL04: 향일암 — sunrise + pilgrimage + physical caution ──────────────────
test('T-PL04 향일암: sunrise timing, pilgrimage suitable, high physical difficulty warning', async () => {
  const msg = await getMsg('hyangiram', '향일암에 대해 알려줘');
  expect(msg).toContain('일출 무렵');
  expect(msg).toContain('순례·기도 목적');
  expect(msg).toContain('경사와 계단');
});

// ── T-PL05: 케이블카 — PAID (not "무료") with live_status warning ──────────────
test('T-PL05 케이블카: PAID message, no "무료", live_status warning present', async () => {
  const msg = await getMsg('cablecar', '케이블카에 대해 알려줘');
  expect(msg).not.toContain('무료');
  expect(msg).toContain('이용 요금이 있어요.');
  expect(msg).toContain('방문 전 운영 여부');
});

// ── T-PL06: 돌산공원 — night timing hint, no live_status warning ──────────────
test('T-PL06 돌산공원: night timing hint, live_status warning suppressed', async () => {
  const msg = await getMsg('dolsan_nightscape', '돌산공원에 대해 알려줘');
  expect(msg).toContain('야경');
  expect(msg).toContain('밤에도 분위기가 좋아요.');
  expect(msg).not.toContain('방문 전 운영 여부');
});

// ── T-PL07: 종포해양공원 — identity + FREE, no live_status warning ────────────
test('T-PL07 종포해양공원: identity present, FREE, no live_status warning', async () => {
  const msg = await getMsg('marine_park', '종포해양공원에 대해 알려줘');
  expect(msg).toContain('종포해양공원에 대해 알려드릴게요.');
  expect(msg).toContain('무료로 둘러볼 수 있어요.');
  expect(msg).not.toContain('방문 전 운영 여부');
});

// ── T-PL08: 스카이타워 — PAID fee + verified hours, no live_status warning ─────
test('T-PL08 스카이타워: PAID fee shown, verified hours shown, live_status warning suppressed', async () => {
  const msg = await getMsg('sky_tower', '스카이타워에 대해 알려줘');
  expect(msg).toContain('3,000원');
  expect(msg).toContain('2,500원'); // youth/senior
  expect(msg).toContain('10:00-22:00');
  expect(msg).not.toContain('방문 전 운영 여부');
});

// ── T-PL09: 낭만포차거리 — evening timing, verified hours, FREE, no live_status warning
test('T-PL09 낭만포차거리: evening+night timing, verified hours, FREE, live_status suppressed by hours', async () => {
  const msg = await getMsg('romantic_pojangmacha', '낭만포차거리에 대해 알려줘');
  expect(msg).toContain('저녁부터 밤까지 분위기가 좋아요.'); // both evening+night in weather_suitable
  expect(msg).toContain('18:00-01:00');
  expect(msg).toContain('무료로 둘러볼 수 있어요.');
  expect(msg).not.toContain('방문 전 운영 여부'); // hasVerifiedHours=true suppresses
});

// ── T-PL10: All 8 core places produce unique messages ─────────────────────────
test('T-PL10 Eight core places produce distinct messages (no two identical)', async () => {
  const codes = Object.keys(PLACES);
  const queries = {
    lee_soon_shin_plaza: '이순신광장에 대해 알려줘',
    odongdo: '오동도에 대해 알려줘',
    hyangiram: '향일암에 대해 알려줘',
    cablecar: '케이블카에 대해 알려줘',
    dolsan_nightscape: '돌산공원에 대해 알려줘',
    marine_park: '종포해양공원에 대해 알려줘',
    sky_tower: '스카이타워에 대해 알려줘',
    romantic_pojangmacha: '낭만포차거리에 대해 알려줘',
  };
  const messages = [];
  for (const code of codes) {
    tgMock.getPlaceByCode.mockResolvedValue(PLACES[code]);
    const result = await handleTravelRequest({ message: queries[code], sessionId: 'sess-uniq' });
    messages.push(result.payload.message_ko);
  }
  const unique = new Set(messages);
  expect(unique.size).toBe(codes.length);
});

// ── T-PL11: description_short takes priority over PLACE_IDENTITY_KO ───────────
test('T-PL11 description_short takes priority over identity map when populated', async () => {
  const placeWithDesc = {
    ...PLACES.lee_soon_shin_plaza,
    description_short: '미래에 채워질 공식 설명문이에요.',
  };
  tgMock.getPlaceByCode.mockResolvedValue(placeWithDesc);
  const result = await handleTravelRequest({ message: '이순신광장에 대해 알려줘', sessionId: 'sess-desc' });
  const msg = result.payload.message_ko;
  expect(msg).toContain('미래에 채워질 공식 설명문이에요.');
  // identity map not used when description_short is populated
  expect(msg).not.toContain('역사적인 분위기');
});

// ── T-PL12: stay time label — 120min → "약 2시간" ─────────────────────────────
test('T-PL12 stay time: 120min → "약 2시간", 45min → "약 45분"', async () => {
  const msgOdong = await getMsg('odongdo', '오동도에 대해 알려줘');
  expect(msgOdong).toContain('약 2시간');

  const msgPlaza = await getMsg('lee_soon_shin_plaza', '이순신광장에 대해 알려줘');
  expect(msgPlaza).toContain('약 45분');
});
