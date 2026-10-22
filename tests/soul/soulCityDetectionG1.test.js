'use strict';

/**
 * G1 City Detection V0.1 — Gate A + Gate B + Safety Regression
 *
 * Gate A: ORIGIN_TO_YEOSU 오인식 방지
 * Gate B: 복수 신규 도시 감지 (단일 도시 임의 확정 금지)
 * Safety: 순천/광양 D3.1, 케이블카 오인식, 기존 여수 흐름
 *
 * Design: docs/architecture (SOUL_CITY_DETECTION_G1_V0_1_*)
 * Run: npx jest --testPathPatterns="soulCityDetectionG1"
 */

process.env.OPENAI_API_KEY  = process.env.OPENAI_API_KEY  || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService',    () => ({ extractSharedJourney: jest.fn().mockResolvedValue(null) }));
jest.mock('../../services/routeSkeletonService',    () => ({ buildSkeleton: jest.fn().mockReturnValue(null) }), { virtual: true });
jest.mock('../../services/quoteEngine',             () => ({ calculateQuote: jest.fn(), sanitizeForCustomer: jest.fn() }), { virtual: true });
jest.mock('../../services/quoteContextService',     () => ({
  extractQuoteContext:    jest.fn().mockReturnValue({}),
  isQuotable:             jest.fn().mockReturnValue(false),
  isComplexGroupHotel:    jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput:        jest.fn().mockReturnValue({}),
  _extractLeisure:        jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } }),
}), { virtual: true });

const contextSvc    = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc    = require('../../services/sessionService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const SESSION_ID = 'test-g1-city';
const PRINCIPAL  = { principal_id: 'test-user', principal_type: 'GUEST' };

const blankSession = () => ({ ok: true, journey_ctx: null });
const mkCtx = (overrides = {}) => ({
  people_type: 'solo', has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none', time_available_minutes: 120,
  group_size: null, _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' },
  ...overrides,
});

const req = (message) => handleTravelRequest({
  message, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL, explicit_context: {},
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
});

// ══════════════════════════════════════════════════════════════
// Gate A — ORIGIN_TO_YEOSU 오인식 방지
// ══════════════════════════════════════════════════════════════

test('GA-1 — 부산에서 여수로 왔어 → 여수 요청 허용 (ORIGIN_TO_YEOSU)', async () => {
  const result = await req('부산에서 여수로 왔어');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('CITY_UNSUPPORTED');
  expect(result.payload.status).not.toBe('CITY_AMBIGUOUS');
  expect(result.payload.status).not.toBe('MULTI_CITY_PARTIAL');
});

test('GA-2 — 부산에서 왔는데 오동도 가고 싶어 → 여수 요청 허용 (ORIGIN_TO_YEOSU)', async () => {
  const result = await req('부산에서 왔는데 오동도 가고 싶어');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('CITY_UNSUPPORTED');
  expect(result.payload.status).not.toBe('CITY_AMBIGUOUS');
  expect(result.payload.status).not.toBe('MULTI_CITY_PARTIAL');
});

test('GA-3 — 부산에서 여행할 건데 여수는 다음에 → Guard 우회 금지', async () => {
  const result = await req('부산에서 여행할 건데 여수는 다음에');
  expect(result.ok).toBe(true);
  // 여수 단일 요청으로 처리되어선 안 됨 → Guard 차단 (UNSUPPORTED or AMBIGUOUS)
  const status = result.payload.status;
  expect(['CITY_UNSUPPORTED', 'CITY_AMBIGUOUS']).toContain(status);
});

test('GA-4 — 부산에서 오동도 말고 해운대 갈래 → 여수 장소 반환 금지', async () => {
  const result = await req('부산에서 오동도 말고 해운대 갈래');
  expect(result.ok).toBe(true);
  // 오동도(여수 장소)가 제외 맥락 → YEOSU flow 진입 금지
  const status = result.payload.status;
  expect(['CITY_UNSUPPORTED', 'CITY_AMBIGUOUS']).toContain(status);
  // 여수 장소명 미노출
  expect(result.payload.message_ko).not.toMatch(/오동도|이순신광장|향일암/);
});

test('GA-5 — 부산에서 여수랑 제주 비교해 줘 → 여수 단일 처리 금지', async () => {
  const result = await req('부산에서 여수랑 제주 비교해 줘');
  expect(result.ok).toBe(true);
  // 복수 도시(부산+제주) 감지 → AMBIGUOUS
  expect(result.payload.status).toBe('CITY_AMBIGUOUS');
});

// ══════════════════════════════════════════════════════════════
// Gate B — 복수 신규 도시 감지
// ══════════════════════════════════════════════════════════════

test('GB-1 — 부산이랑 서울 비교해 줘 → 단일 도시 확정 금지', async () => {
  const result = await req('부산이랑 서울 비교해 줘');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_AMBIGUOUS');
  // 부산 단독 CITY_UNSUPPORTED 아님 (복수 도시를 부산 단일로 임의 확정 금지)
  expect(result.payload.status).not.toBe('CITY_UNSUPPORTED');
});

test('GB-2 — 부산 다음 제주도 갈 거야 → 단일 도시 확정 금지', async () => {
  const result = await req('부산 다음 제주도 갈 거야');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_AMBIGUOUS');
  expect(result.payload.status).not.toBe('CITY_UNSUPPORTED');
});

test('GB-3 — 서울 1박 부산 1박 → 단일 도시 확정 금지', async () => {
  const result = await req('서울 1박 부산 1박');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_AMBIGUOUS');
  expect(result.payload.status).not.toBe('CITY_UNSUPPORTED');
});

test('GB-4 — 여수랑 부산 둘 다 여행 → 여수 단일 처리 금지', async () => {
  const result = await req('여수랑 부산 둘 다 여행');
  expect(result.ok).toBe(true);
  // 여수+부산 동시 요청 → Guard 차단 (AMBIGUOUS)
  expect(result.payload.status).toBe('CITY_AMBIGUOUS');
});

// ══════════════════════════════════════════════════════════════
// 추가 안전 회귀
// ══════════════════════════════════════════════════════════════

test('GS-1 — 순천에서 여수로 왔어 → 여수 요청 허용 (D3.1 LEGACY_ORIGIN_RE)', async () => {
  const result = await req('순천에서 여수로 왔어');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('CITY_UNSUPPORTED');
  expect(result.payload.status).not.toBe('CITY_AMBIGUOUS');
});

test('GS-2 — 순천에서 왔어 → 여수 목적지 미확정, 여수 단일 흐름 강제 금지', async () => {
  const result = await req('순천에서 왔어');
  expect(result.ok).toBe(true);
  // 레거시 Guard: 순천 포함, 출발지 패턴 여수 목적지 없음 → CITY_UNSUPPORTED
  // 여수 정보가 반환되어선 안 됨
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
});

test('GS-3 — 부산에서 케이블카 타고 싶어 → 여수 케이블카 반환 금지', async () => {
  const result = await req('부산에서 케이블카 타고 싶어');
  expect(result.ok).toBe(true);
  // 케이블카는 여수 확정 마커 아님 (YEOSU_DEST_RE 제외) → CITY_UNSUPPORTED
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
  // 여수 케이블카 정보 미노출
  expect(result.payload.message_ko).not.toMatch(/자산공원|돌산|케이블카.*매표/);
});

test('GS-4 — 광주 여행 추천 → CITY_UNSUPPORTED (D2 미등록 도시 차단)', async () => {
  const result = await req('광주 여행 추천');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
});

test('GS-5 — 여수랑 순천 비교 — 기존 레거시 동작 확인 (pre-existing: CITY_UNSUPPORTED)', async () => {
  // 현재 레거시 Guard: "랑" 커넥터 미지원 → CITY_UNSUPPORTED (pre-existing 동작)
  // 이 테스트는 G1이 기존 동작을 변경하지 않음을 확인
  const result = await req('여수랑 순천 비교');
  expect(result.ok).toBe(true);
  // G1이 신규 회귀를 도입하지 않으면 OK (현재 pre-existing 동작 = CITY_UNSUPPORTED)
  // AMBIGUOUS 또는 CITY_UNSUPPORTED 모두 허용 (레거시 동작 보존)
  expect(['CITY_UNSUPPORTED', 'CITY_AMBIGUOUS']).toContain(result.payload.status);
});
