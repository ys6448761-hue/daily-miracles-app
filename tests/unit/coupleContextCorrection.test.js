'use strict';
/**
 * Couple / Party Context Correction — Tests A–H
 *
 * Root cause: contextExtractionService._applyExplicitCompanionGuard checks
 * message.includes('친구랑'), which is a substring of '여자친구랑'.
 * Fix: soyeowoolService._correctCoupleClassification post-corrects after extraction.
 */

// Mock GPT-dependent services so tests run deterministically
jest.mock('../../services/contextExtractionService', () => ({
  parseUserMessage: jest.fn()
}));
jest.mock('../../services/travelGuideService', () => ({
  recommend: jest.fn()
}));
jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue({
    want: [], experienced: [], repeat_intent: null, companion_voices: [], voice_provenance: null
  })
}));
// Import after mocks
const { handleTravelRequest } = require('../../services/soyeowoolService');
const contextExtractionService = require('../../services/contextExtractionService');
const travelGuideService = require('../../services/travelGuideService');

const SESSION_ID = 'test-couple-001';
const PRINCIPAL = { sowon_id: 'SOWON_COUPLE', principal_type: 'guest' };

function makeSoulContext(overrides = {}) {
  return {
    session_id: 'uuid-1',
    entry_point: null,
    user_mode: 'DEFAULT',
    country_code: 'KR',
    city_code: 'YEOSU',
    time_available_minutes: 180,
    people_type: 'solo',
    companion_constraints: { has_kids: false, has_elderly: false, disability: null },
    meal_context: 'none',
    has_car: true,
    mobility_type: 'mixed',
    wish_context: undefined,
    exclude_place_ids: [],
    must_visit_place_ids: [],
    group_size: null,
    _provenance: {
      time_available_minutes: 'USER_EXPLICIT',
      people_type: 'AI_INFERENCE',
    },
    ...overrides
  };
}

function makeTgResult() {
  return {
    session_id: SESSION_ID,
    entry_point: 'YEOSU_GENERAL',
    user_mode: 'DEFAULT',
    places: [{
      place_code: 'ODONGDO', name_ko: '오동도', type: 'nature',
      stay_minutes: 60, travel_time_minutes: 15,
      reason: '오동도는 좋아요', safety_pass: true, live_status: 'OPEN',
      matching_score: 0.9, suitable_for: [], emotion_tags: [],
      accessibility_wheelchair: false, avg_stay_minutes: 60
    }],
    food: null, cafes: null, benefits: null, message: 'OK', course: null, journey_preferences: {}
  };
}

async function call(message, soulContextOverrides = {}) {
  contextExtractionService.parseUserMessage.mockResolvedValue(
    makeSoulContext(soulContextOverrides)
  );
  travelGuideService.recommend.mockResolvedValue(makeTgResult());
  return handleTravelRequest({ message, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });
}

beforeEach(() => jest.clearAllMocks());

// A: 여자친구랑 둘이 — was misclassified as group, must become couple
test('A: 여자친구랑 둘이 → people_type=couple, NOT 단체 여행', async () => {
  const result = await call(
    '10월 17일 여자친구랑 둘이 여수 1박2일 가는데 라마다에서 자고 케이블카도 타고 싶어.',
    // contextExtractionService would return 'group' due to '친구랑' substring match
    { people_type: 'group', group_size: 2 }
  );
  expect(result.ok).toBe(true);
  expect(result.payload.understood_context.people_type).toBe('couple');
  const whyConditions = result.payload.why_details[0]?.user_conditions || [];
  expect(whyConditions).not.toContain('단체 여행');
});

// B: 남편과 둘이 — partner phrase, must not show 단체 여행
test('B: 남편과 둘이 → not 단체 여행', async () => {
  const result = await call(
    '남편과 둘이 여수 여행 가요',
    { people_type: 'group', group_size: 2 }
  );
  expect(result.ok).toBe(true);
  expect(result.payload.understood_context.people_type).toBe('couple');
  const whyConditions = result.payload.why_details[0]?.user_conditions || [];
  expect(whyConditions).not.toContain('단체 여행');
});

// C: 가족 4명 → family label
test('C: 가족 4명 → family label (family_with_kids or family_elderly preserved)', async () => {
  const result = await call(
    '가족 4명이서 여수 가려해요',
    { people_type: 'family_with_kids', group_size: 4 }
  );
  expect(result.ok).toBe(true);
  const pt = result.payload.understood_context.people_type;
  expect(['family_with_kids', 'family_elderly']).toContain(pt);
  const whyConditions = result.payload.why_details[0]?.user_conditions || [];
  expect(whyConditions).not.toContain('단체 여행');
});

// D: 친구 3명 → 친구와 함께, NOT 단체 여행
test('D: 친구 3명 → 친구와 함께 (not 단체 여행)', async () => {
  const result = await call(
    '친구 3명이랑 여수 가려고요',
    { people_type: 'group', group_size: 3 }
  );
  expect(result.ok).toBe(true);
  const whyConditions = result.payload.why_details[0]?.user_conditions || [];
  expect(whyConditions).not.toContain('단체 여행');
  expect(whyConditions).toContain('친구와 함께');
});

// E: 10명 단체 → GROUP_CONSULTATION_REQUIRED (5인+ group → human handoff path)
// why_details is empty on this path; check status and message instead.
test('E: 10명 단체 → GROUP_CONSULTATION_REQUIRED (not misclassified as couple)', async () => {
  const result = await call(
    '직원 10명이랑 여수 단체 여행이에요',
    { people_type: 'group', group_size: 10 }
  );
  expect(result.ok).toBe(true);
  // 10명 group → human consultation path, NOT couple correction
  expect(result.payload.status).toBe('GROUP_CONSULTATION_REQUIRED');
  expect(result.payload.understood_context.people_type).toBe('group');
  expect(result.payload.message_ko).toContain('단체여행');
});

// F: 혼자 → 혼자 여행 label
test('F: 혼자 → solo classification preserved', async () => {
  const result = await call('혼자 여수 여행 가요', { people_type: 'solo' });
  expect(result.ok).toBe(true);
  expect(result.payload.understood_context.people_type).toBe('solo');
});

// G: Founder baseline — Commerce SELL=172,000 unaffected
test('G: Founder baseline Commerce SELL=172,000 unaffected', async () => {
  const quoteEngine = require('../../services/quoteEngine');
  const raw = quoteEngine.calculateQuote({
    guestCount: 2, hotel: 'ramada', leisure: 'cable',
    travelDate: '2026-10-17', region: 'yeosu'
  });
  expect(raw.success).toBe(true);
  expect(raw.pricing.totalSell).toBe(172000);
  const clean = quoteEngine.sanitizeForCustomer(raw);
  expect(clean.pricing.totalSell).toBe(172000);
  // COST must never appear in customer payload
  const hasCost = clean.breakdown.some(b => 'cost' in b);
  expect(hasCost).toBe(false);
});

// H: 여자친구랑 without group — couple pass-through (no false positive correction)
test('H: couple people_type pass-through — no mutation when already couple', async () => {
  const result = await call(
    '여자친구랑 여수 가요',
    { people_type: 'couple', group_size: 2 }
  );
  expect(result.ok).toBe(true);
  expect(result.payload.understood_context.people_type).toBe('couple');
});
