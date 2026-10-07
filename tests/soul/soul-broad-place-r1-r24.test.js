/**
 * SOUL BROAD Place Coverage — R1-R24 Targeted Regression
 * TRACK A: lee_soon_shin_plaza / dolsan_nightscape / marine_park / dolsan_daegyo
 * Evidence: docs/architecture/ (to be created after Founder review)
 */

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({ extractSharedJourney: jest.fn().mockResolvedValue(null) }));
jest.mock('../../services/routeSkeletonService', () => ({ buildSkeleton: jest.fn().mockReturnValue(null) }), { virtual: true });
jest.mock('../../services/quoteEngine', () => ({ calculateQuote: jest.fn(), sanitizeForCustomer: jest.fn() }), { virtual: true });
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn().mockReturnValue({}),
  isQuotable: jest.fn().mockReturnValue(false),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput: jest.fn().mockReturnValue({}),
  _extractLeisure: jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } })
}), { virtual: true });

const contextSvc = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc = require('../../services/sessionService');

const { handleTravelRequest } = require('../../services/soyeowoolService');

const blankSession = () => ({ ok: true, journey_ctx: null });

const mkSoloCtx = (overrides = {}) => ({
  people_type: 'solo',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 120,
  group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' },
  ...overrides,
});

// Stub place objects for the 4 BROAD places
const leePlace      = { code: 'lee_soon_shin_plaza', name_ko: '이순신광장', physical_difficulty: 'low' };
const dolsanPark    = { code: 'dolsan_nightscape',   name_ko: '돌산공원',   physical_difficulty: 'low' };
const marinePark    = { code: 'marine_park',          name_ko: '종포해양공원', physical_difficulty: 'low' };
const dolsanBridge  = { code: 'dolsan_daegyo',        name_ko: '돌산대교',   physical_difficulty: 'low' };
const odongdoPlace  = { code: 'odongdo',              name_ko: '오동도',     physical_difficulty: 'low' };

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: 'test-broad-r1-r24',
  hotelId: null,
  principal: { principal_id: 'test-user', principal_type: 'GUEST' },
  explicit_context: {},
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkSoloCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
});

// ═══════════════════════════════════════════════════════════
// 이순신광장 (lee_soon_shin_plaza) — R1–R6
// ═══════════════════════════════════════════════════════════

test('R1 — 이순신광장: identity query → experience_ko content served (PLACE_LOOKUP routing)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'lee_soon_shin_plaza' ? Promise.resolve(leePlace) : Promise.resolve(null)
  );
  const result = await makeRequest('이순신광장은 어떤 곳이야?', {
    explicit_context: { place_code: 'lee_soon_shin_plaza' },
  });
  expect(result.ok).toBe(true);
  // "어떤 곳이야" matches STRONG_LOOKUP → routes through PLACE_LOOKUP (correct for alias+verb queries)
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.message_ko).toMatch(/이순신 장군/);
  expect(result.payload.message_ko).toMatch(/거북선/);
});

test('R2 — 이순신광장: admission query → admission_ko served ("무료")', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'lee_soon_shin_plaza' ? Promise.resolve(leePlace) : Promise.resolve(null)
  );
  const result = await makeRequest('이순신광장 무료야?', {
    explicit_context: { place_code: 'lee_soon_shin_plaza' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  expect(result.payload.message_ko).toMatch(/무료/);
});

test('R3 — 이순신광장: fit/companion query → fit_ko served', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'lee_soon_shin_plaza' ? Promise.resolve(leePlace) : Promise.resolve(null)
  );
  const result = await makeRequest('이순신광장 누구랑 가면 좋아?', {
    explicit_context: { place_code: 'lee_soon_shin_plaza' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  expect(result.payload.message_ko).toMatch(/역사|크루즈|2층버스/);
});

test('R4 — 이순신광장: "다음에 어디 가?" → not PLACE_SPECIFIC_QUERY (Discovery or Journey)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'lee_soon_shin_plaza' ? Promise.resolve(leePlace) : Promise.resolve(null)
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [{ name_ko: '오동도', code: 'odongdo' }] });
  const result = await makeRequest('이순신광장 다음에 어디 가?', {
    explicit_context: { place_code: 'lee_soon_shin_plaza' },
  });
  expect(result.ok).toBe(true);
  // Should be Discovery or Travel Intelligence, not PLACE_SPECIFIC_QUERY
  expect(result.payload.status).not.toBe('PLACE_SPECIFIC_QUERY');
});

test('R5 — 이순신광장: unsupported fact (주차장) → UNKNOWN with honest fallback', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'lee_soon_shin_plaza' ? Promise.resolve(leePlace) : Promise.resolve(null)
  );
  const result = await makeRequest('이순신광장 주차장 어디야?', {
    explicit_context: { place_code: 'lee_soon_shin_plaza' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  // phone is null → should fall back with "현장에서 확인" language
  expect(result.payload.message_ko).toMatch(/현장|확인/);
  // Must NOT invent a phone number or claim to know parking
  expect(result.payload.message_ko).not.toMatch(/061-\d{3}-\d{4}/);
});

test('R6 — 이순신광장 page: "오동도 가고 싶어" → DISCOVERY routes to odongdo, not lee_soon_shin_plaza', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'lee_soon_shin_plaza' ? Promise.resolve(leePlace) :
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [{ name_ko: '오동도', code: 'odongdo' }] });
  const result = await makeRequest('오동도 가고 싶어', {
    explicit_context: { place_code: 'lee_soon_shin_plaza' },
  });
  expect(result.ok).toBe(true);
  // "가고 싶어" should be treated as DISCOVERY intent, not PSQ for current page
  expect(result.payload.status).not.toBe('PLACE_SPECIFIC_QUERY');
});

// ═══════════════════════════════════════════════════════════
// 돌산공원 (dolsan_nightscape) — R7–R12
// ═══════════════════════════════════════════════════════════

test('R7 — 돌산공원: identity query → experience_ko content served (PLACE_LOOKUP routing)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanPark) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산공원은 어떤 곳이야?', {
    explicit_context: { place_code: 'dolsan_nightscape' },
  });
  expect(result.ok).toBe(true);
  // "어떤 곳이야" → PLACE_LOOKUP routing (alias+verb)
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.message_ko).toMatch(/야경|돌산대교/);
});

test('R8 — 돌산공원: hours query → hours_ko served (24시간)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanPark) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산공원 몇 시까지야?', {
    explicit_context: { place_code: 'dolsan_nightscape' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  expect(result.payload.message_ko).toMatch(/24시간|연중개방/);
});

test('R9 — 돌산공원: fit query → fit_ko served', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanPark) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산공원 누구랑 가면 좋아?', {
    explicit_context: { place_code: 'dolsan_nightscape' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  expect(result.payload.message_ko).toMatch(/야경|반려동물|2층버스/);
});

test('R10 — 돌산공원: "다음에 어디 가?" → Discovery or Journey (not PSQ)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanPark) : Promise.resolve(null)
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [] });
  const result = await makeRequest('돌산공원 다음에 어디 갈까?', {
    explicit_context: { place_code: 'dolsan_nightscape' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('PLACE_SPECIFIC_QUERY');
});

test('R11 — 돌산공원: unsupported factual question → UNKNOWN/honest fallback', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanPark) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산공원에 카페 있어?', {
    explicit_context: { place_code: 'dolsan_nightscape' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  // Should not claim to know about cafes (not in knowledge)
  expect(result.payload.message_ko).toMatch(/확인|문의/);
});

test('R12 — 돌산공원 page: "케이블카 예약해줘" → not PSQ for dolsan_nightscape', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanPark) : Promise.resolve(null)
  );
  const result = await makeRequest('케이블카 타고 싶어', {
    explicit_context: { place_code: 'dolsan_nightscape' },
  });
  expect(result.ok).toBe(true);
  // "타고 싶어" is a desire/intent — should route to DISCOVERY or CLARIFICATION, not dolsanPark PSQ
  expect(result.payload.status).not.toBe('PLACE_SPECIFIC_QUERY');
});

// ═══════════════════════════════════════════════════════════
// 종포해양공원 (marine_park) — R13–R18
// ═══════════════════════════════════════════════════════════

test('R13 — 종포해양공원: identity query → experience_ko content served (PLACE_LOOKUP routing)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'marine_park' ? Promise.resolve(marinePark) : Promise.resolve(null)
  );
  const result = await makeRequest('종포해양공원은 어떤 곳이야?', {
    explicit_context: { place_code: 'marine_park' },
  });
  expect(result.ok).toBe(true);
  // "어떤 곳이야" → PLACE_LOOKUP routing (alias+verb)
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.message_ko).toMatch(/산책로|하멜전시관|크루즈/);
});

test('R14 — 종포해양공원: "하멜전시관 언제 쉬어?" → hamel_hours_ko served (월요일)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'marine_park' ? Promise.resolve(marinePark) : Promise.resolve(null)
  );
  const result = await makeRequest('하멜전시관 언제 쉬어?', {
    explicit_context: { place_code: 'marine_park' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  expect(result.payload.message_ko).toMatch(/월요일/);
  expect(result.payload.message_ko).toMatch(/09:00|18:00/);
});

test('R15 — 종포해양공원: fit query → fit_ko served', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'marine_park' ? Promise.resolve(marinePark) : Promise.resolve(null)
  );
  const result = await makeRequest('종포해양공원 누구랑 가면 좋아?', {
    explicit_context: { place_code: 'marine_park' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  expect(result.payload.message_ko).toMatch(/산책|하멜/);
});

test('R16 — 종포해양공원: "다음에 어디 가?" → Discovery or Journey (not PSQ)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'marine_park' ? Promise.resolve(marinePark) : Promise.resolve(null)
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [] });
  const result = await makeRequest('종포해양공원 다음에 어디 갈까?', {
    explicit_context: { place_code: 'marine_park' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('PLACE_SPECIFIC_QUERY');
});

test('R17 — 종포해양공원: "야간에도 열어?" → UNKNOWN/honest (no 24hr claim)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'marine_park' ? Promise.resolve(marinePark) : Promise.resolve(null)
  );
  const result = await makeRequest('종포해양공원 야간에도 열어?', {
    explicit_context: { place_code: 'marine_park' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  // hours_ko is null for marine_park — must NOT claim 24hr open
  expect(result.payload.message_ko).not.toMatch(/24시간|연중무휴/);
  // Should acknowledge UNKNOWN/verification needed
  expect(result.payload.message_ko).toMatch(/확인|문의/);
});

test('R18 — 종포해양공원 page: "오동도 어때?" → DISCOVERY routes away from marine_park', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'marine_park' ? Promise.resolve(marinePark) :
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('오동도 어때?', {
    explicit_context: { place_code: 'marine_park' },
  });
  expect(result.ok).toBe(true);
  // "오동도 어때?" with known alias should route to odonodo lookup, not marine_park PSQ
  expect(result.payload.status).not.toBe('PLACE_SPECIFIC_QUERY');
});

// ═══════════════════════════════════════════════════════════
// 돌산대교 (dolsan_daegyo) — R19–R24
// ═══════════════════════════════════════════════════════════

test('R19 — 돌산대교: identity query → experience_ko content served (PLACE_LOOKUP routing)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교는 어떤 곳이야?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  // "어떤 곳이야" → PLACE_LOOKUP routing (alias+verb)
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.message_ko).toMatch(/돌산도|케이블카|야경/);
});

test('R20 — 돌산대교: "걸어서 건너갈 수 있어?" → UNKNOWN (pedestrian access not verified)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교 걸어서 건너갈 수 있어?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  // Must NOT claim pedestrian access is possible (unknown_boundary)
  expect(result.payload.message_ko).toMatch(/현장|확인/);
  // Must NOT say "걸어서 건너갈 수 있어요" or similar affirmative
  expect(result.payload.message_ko).not.toMatch(/걸어서 건너갈 수 있어요/);
});

test('R21 — 돌산대교: fit query → fit_ko served', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교 누구랑 가면 좋아?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  expect(result.payload.message_ko).toMatch(/야경|크루즈/);
});

test('R22 — 돌산대교: "다음에 어디 가?" → Discovery or Journey (not PSQ)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [] });
  const result = await makeRequest('돌산대교 다음에 어디 가면 좋을까?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('PLACE_SPECIFIC_QUERY');
});

test('R23 — 돌산대교: unsupported factual question → honest fallback', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교 입장료 얼마야?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  // admission_ko is null for bridge — should give honest fallback
  expect(result.payload.message_ko).toMatch(/확인|정보|문의/);
});

test('R24 — 돌산대교 page: "향일암 어때?" → PLACE_LOOKUP routes to hyangiram', async () => {
  const hyangiramPl = { code: 'hyangiram', name_ko: '향일암', physical_difficulty: 'high' };
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) :
    code === 'hyangiram' ? Promise.resolve(hyangiramPl) : Promise.resolve(null)
  );
  const result = await makeRequest('향일암 어때?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  // "향일암 어때?" — MEDIUM_LOOKUP on known alias; should route away from dolsan_daegyo PSQ
  // and query hyangiram instead
  expect(travelGuideSvc.getPlaceByCode).toHaveBeenCalledWith('hyangiram');
});
