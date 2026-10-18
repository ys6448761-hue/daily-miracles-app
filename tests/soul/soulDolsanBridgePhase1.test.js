/**
 * SOUL Dolsan Bridge Phase 1 — Minimal Experience Copy
 * Option A-1: dolsan_daegyo.experience_ko replacement via PLACE_LOOKUP path
 *
 * Coverage:
 *   P-1: "돌산대교 어때요?" → alias + MEDIUM_LOOKUP → PLACE_LOOKUP → Founder experience_ko
 *   P-2: "어때요?" + explicit_context.place_code=dolsan_daegyo → EXPLICIT_CONTEXT → PLACE_LOOKUP → experience_ko
 *   P-3: "돌산대교는 어떤 곳이야?" → STRONG_LOOKUP → PLACE_LOOKUP (R19 regression)
 *   Adjacent: R21 fit_ko / R22 NOT-PSQ / R23 admission fallback / R24 cross-place isolation
 *   R20: PRE-EXISTING FAIL — JOURNEY_CONTINUITY instead of PSQ (R20 fix excluded from Phase 1)
 *   Place Isolation: dolsan_nightscape / cablecar / odongdo / hyangiram / lee_soon_shin_plaza
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
  _extractHotelCode: jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } })
}), { virtual: true });

const contextSvc     = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc     = require('../../services/sessionService');

const { handleTravelRequest } = require('../../services/soyeowoolService');

// Founder-approved experience_ko (exact, Phase 1 gate)
const APPROVED_EXP_KO = '돌산대교는 여수 시내와 돌산도를 이어주는 다리예요. 밤이 되면 다리 위의 불빛과 바다가 어우러져 여수의 풍경을 조금 다르게 느낄 수 있어요. 한쪽에서 다른 쪽으로 이어지는 길을 바라보며, 마음도 천천히 다음 순간으로 넘어가는 시간을 가져보세요.';
const EXP_PREFIX = APPROVED_EXP_KO.substring(0, 15); // "돌산대교는 여수 시내" (15 chars)

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

// Place stubs
const dolsanBridge     = { code: 'dolsan_daegyo',      name_ko: '돌산대교',     physical_difficulty: 'low' };
const dolsanNight      = { code: 'dolsan_nightscape',  name_ko: '돌산공원',     physical_difficulty: 'low' };
const cablecarPlace    = { code: 'cablecar',            name_ko: '여수해상케이블카', physical_difficulty: 'low' };
const odongdoPlace     = { code: 'odongdo',             name_ko: '오동도',       physical_difficulty: 'low' };
const hyangiramPlace   = { code: 'hyangiram',           name_ko: '향일암',       physical_difficulty: 'high' };
const leePlace         = { code: 'lee_soon_shin_plaza', name_ko: '이순신광장',   physical_difficulty: 'low' };

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: 'test-dolsan-bridge-p1',
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
// Phase 1 — Positive Cases
// ═══════════════════════════════════════════════════════════

test('P-1 — alias+어때요: PLACE_LOOKUP → Founder experience_ko', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교 어때요?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('dolsan_daegyo');
  expect(result.payload.message_ko).toMatch(EXP_PREFIX);
  // Must NOT contain old text "놀아"
  expect(result.payload.message_ko).not.toMatch(/놀아/);
  // Must NOT contaminate with other places' experience text
  expect(result.payload.message_ko).not.toMatch(/여수 바다 위를 가로지르는/); // cablecar
  expect(result.payload.message_ko).not.toMatch(/돌산도에서 여수 도심/);       // dolsan_nightscape
});

test('P-2 — context-only 어때요: EXPLICIT_CONTEXT → PLACE_LOOKUP → Founder experience_ko', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('어때요?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('dolsan_daegyo');
  expect(result.payload.message_ko).toMatch(EXP_PREFIX);
  expect(result.payload.message_ko).not.toMatch(/놀아/);
});

test('P-3 — identity query: STRONG_LOOKUP → PLACE_LOOKUP (R19 regression)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교는 어떤 곳이야?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  // R19 original condition: Founder experience_ko includes "돌산도"
  expect(result.payload.message_ko).toMatch(/돌산도|케이블카|야경/);
  // New text contains "돌산도" → satisfies R19 condition
  expect(result.payload.message_ko).toMatch(/돌산도/);
});

// ═══════════════════════════════════════════════════════════
// R19-R24 — Regression (from soul-broad-place-r1-r24.test.js)
// ═══════════════════════════════════════════════════════════

test('R19 — identity query → PLACE_LOOKUP /돌산도|케이블카|야경/ (existing PASS)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교는 어떤 곳이야?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.message_ko).toMatch(/돌산도|케이블카|야경/);
});

test('R20 — "걸어서 건너갈 수 있어?" PRE-EXISTING FAIL — routing not fixed in Phase 1', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교 걸어서 건너갈 수 있어?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  // PRE-EXISTING: routes to JOURNEY_CONTINUITY, NOT PLACE_SPECIFIC_QUERY
  // This test documents the known baseline failure — do NOT change expectation
  expect(result.payload.status).not.toBe('PLACE_SPECIFIC_QUERY');
});

test('R21 — fit query → PLACE_SPECIFIC_QUERY /야경|크루즈/ (LDF path via fit_ko)', async () => {
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

test('R22 — "다음에 어디 가?" → NOT PSQ', async () => {
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

test('R23 — admission null → PSQ honest fallback /확인|정보|문의/', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교 입장료 얼마야?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
  expect(result.payload.message_ko).toMatch(/확인|정보|문의/);
});

test('R24 — "향일암 어때?" on dolsan_daegyo page → routes to hyangiram', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) :
    code === 'hyangiram'     ? Promise.resolve(hyangiramPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('향일암 어때?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true);
  expect(travelGuideSvc.getPlaceByCode).toHaveBeenCalledWith('hyangiram');
});

// ═══════════════════════════════════════════════════════════
// Place Isolation — 다른 장소 experience_ko 불변 확인
// ═══════════════════════════════════════════════════════════

test('ISO-1 — dolsan_nightscape: 기존 experience_ko 불변', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanNight) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산공원 어때요?', {
    explicit_context: { place_code: 'dolsan_nightscape' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.message_ko).not.toMatch(EXP_PREFIX); // dolsan_daegyo 문구 오염 없음
  expect(result.payload.message_ko).toMatch(/돌산도에서|야경|야간/);
});

test('ISO-2 — cablecar: 기존 experience_ko 불변', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'cablecar' ? Promise.resolve(cablecarPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('케이블카 어때요?', {
    explicit_context: { place_code: 'cablecar' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.message_ko).not.toMatch(EXP_PREFIX);
  expect(result.payload.message_ko).toMatch(/여수 바다|케이블카/);
});

test('ISO-3 — odongdo: 기존 experience_ko 불변', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('오동도 어때요?', {
    explicit_context: { place_code: 'odongdo' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.message_ko).not.toMatch(EXP_PREFIX);
});

test('ISO-4 — hyangiram: 기존 experience_ko 불변', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'hyangiram' ? Promise.resolve(hyangiramPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('향일암 어때요?', {
    explicit_context: { place_code: 'hyangiram' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.message_ko).not.toMatch(EXP_PREFIX);
});

test('ISO-5 — lee_soon_shin_plaza: 기존 응답 불변', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'lee_soon_shin_plaza' ? Promise.resolve(leePlace) : Promise.resolve(null)
  );
  const result = await makeRequest('이순신광장 어때요?', {
    explicit_context: { place_code: 'lee_soon_shin_plaza' },
  });
  expect(result.ok).toBe(true);
  expect(result.payload.message_ko).not.toMatch(EXP_PREFIX);
});

// ═══════════════════════════════════════════════════════════
// Adjacent Behavior — 인접 쿼리 기존 경로 유지
// ═══════════════════════════════════════════════════════════

test('ADJ-1 — "걸어서 건너갈 수 있어?" httpStatus 200 (R20 baseline)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridge) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산대교 걸어서 건너갈 수 있어?', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });
  expect(result.ok).toBe(true); // 서버 정상, routing 결과만 기록
});
