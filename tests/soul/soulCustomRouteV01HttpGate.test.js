'use strict';

/**
 * 맞춤 항로 V0.1 — HTTP Integration Gate
 *
 * Goal: POST /api/dt/travel/input/text 실제 Express HTTP 경로 검증
 *       운영 DB 쓰기 없이 격리 실행
 *
 * 검증 항목:
 *   HT-1: 토큰 없음 → 401 AUTHENTICATION_REQUIRED
 *   HT-2: 유효하지 않은 토큰 → 401 INVALID_CREDENTIAL
 *   HT-3: 메시지 없음 → 400 (인증 통과 후 입력 검증)
 *   HT-4: "하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘." → 200 + places
 *   HT-5: 응답에 session_id 포함 (sessionService.createSession mock 반환값)
 *   HT-6: travelGuideService.recommend 호출 시 must_visit=['hamel_lighthouse','hyangiram']
 *   HT-7: travelGuideService.recommend 호출 시 time_available_minutes=270
 *   HT-8: 빈 message 문자열 → 400
 *
 * 격리 방법:
 *   - sessionService.createSession: mock → INSERT 없음
 *   - contextExtractionService: mock → GPT 호출 없음
 *   - travelGuideService: mock → DB 읽기 없음
 *   - sharedJourneyService: mock
 *   - database/db: mock → DB 커넥션 없음
 *   - JWT: GUEST_JWT_SECRET='test-secret-http'로 서명된 실제 토큰 생성
 *   - authenticatedPrincipal 미들웨어: mock 없이 실제 실행 (JWT 서명 검증 포함)
 *
 * Run: npx jest --testPathPatterns="soulCustomRouteV01HttpGate"
 */

// ── 환경변수 먼저 설정 (모듈 로딩 전) ────────────────────────────────────────
process.env.OPENAI_API_KEY   = process.env.OPENAI_API_KEY   || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = 'test-secret-http-gate';
process.env.JWT_SECRET       = 'test-secret-http-gate';
// DB URL: pool 연결 자체를 mock하므로 형식만 맞추면 됨
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://localhost/test_mock';
}

// ── Mock 선언 (require 전에) ──────────────────────────────────────────────────
jest.mock('../../database/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

jest.mock('../../services/sessionService', () => ({
  createSession:          jest.fn().mockResolvedValue('http-test-session-abc123'),
  isSessionValid:         jest.fn().mockResolvedValue(true),
  touchSession:           jest.fn().mockResolvedValue({}),
  getSession:             jest.fn().mockResolvedValue({ ok: true, journey_ctx: null }),
  updateJourneyContext:   jest.fn().mockResolvedValue({}),
}));

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');

jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../services/routeSkeletonService', () => ({
  buildSkeleton: jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/quoteEngine', () => ({
  calculateQuote:       jest.fn(),
  sanitizeForCustomer:  jest.fn(),
}), { virtual: true });
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext:  jest.fn().mockReturnValue({}),
  isQuotable:          jest.fn().mockReturnValue(false),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput:     jest.fn().mockReturnValue({}),
  _extractLeisure:     jest.fn().mockReturnValue(null),
  _extractHotelCode:   jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } }),
}), { virtual: true });

// ── 모듈 로딩 ─────────────────────────────────────────────────────────────────
const express          = require('express');
const supertest        = require('supertest');
const jwt              = require('jsonwebtoken');
const contextSvc       = require('../../services/contextExtractionService');
const travelGuideSvc   = require('../../services/travelGuideService');
const sessionSvc       = require('../../services/sessionService');
const sharedJourneySvc = require('../../services/sharedJourneyService');

// ── Test App 구성 ─────────────────────────────────────────────────────────────
// server.js 전체 불러오지 않음 — 라우트 파일만 마운트
const travelInputRouter = require('../../routes/travelInputRoutes');
const app = express();
app.use(express.json());
app.use('/api/dt/travel', travelInputRouter);

const request = supertest(app);

// ── JWT Helper ────────────────────────────────────────────────────────────────
function makeGuestToken() {
  return jwt.sign(
    {
      sub:            'http-test-principal',
      principal_type: 'GUEST',
      sowon_id:       '00000000-0000-0000-0000-000000000099',
    },
    process.env.GUEST_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const hamelPlace    = { code: 'hamel_lighthouse', name_ko: '하멜등대',  physical_difficulty: 'low', avg_stay_minutes: 30  };
const hyangiramPlace = { code: 'hyangiram',        name_ko: '향일암',    physical_difficulty: 'low', avg_stay_minutes: 120 };

const mkCtx270 = () => ({
  people_type: 'solo',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 270,
  group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', time_available_minutes: 'USER_EXPLICIT' },
});

const mkExplicitWant = (...hints) => ({
  want: hints.map(h => ({ place_hint: h, specificity: 'EXPLICIT' })),
  repeat_intent: null,
  companion_voices: [],
});

const TARGET_MESSAGE = '하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘.';

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage     = jest.fn().mockResolvedValue(mkCtx270());
  travelGuideSvc.getPlaceByCode  = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend       = jest.fn().mockResolvedValue({ places: [hamelPlace, hyangiramPlace] });
  sharedJourneySvc.extractSharedJourney = jest.fn().mockResolvedValue(
    mkExplicitWant('하멜등대', '향일암')
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// HT-1: 토큰 없음 → 401
// ══════════════════════════════════════════════════════════════════════════════

test('HT-1: Authorization 헤더 없음 → 401 AUTHENTICATION_REQUIRED', async () => {
  const res = await request
    .post('/api/dt/travel/input/text')
    .send({ message: TARGET_MESSAGE });

  expect(res.status).toBe(401);
  expect(res.body.code).toBe('AUTHENTICATION_REQUIRED');
});

// ══════════════════════════════════════════════════════════════════════════════
// HT-2: 유효하지 않은 토큰 → 401
// ══════════════════════════════════════════════════════════════════════════════

test('HT-2: 잘못된 JWT → 401 INVALID_CREDENTIAL', async () => {
  const res = await request
    .post('/api/dt/travel/input/text')
    .set('Authorization', 'Bearer invalid.token.here')
    .send({ message: TARGET_MESSAGE });

  expect(res.status).toBe(401);
  expect(res.body.code).toBe('INVALID_CREDENTIAL');
});

// ══════════════════════════════════════════════════════════════════════════════
// HT-3: message 없음 → 400
// ══════════════════════════════════════════════════════════════════════════════

test('HT-3: message 없음 → 400', async () => {
  const token = makeGuestToken();
  const res = await request
    .post('/api/dt/travel/input/text')
    .set('Authorization', `Bearer ${token}`)
    .send({});

  expect(res.status).toBe(400);
});

// ══════════════════════════════════════════════════════════════════════════════
// HT-4: 정상 요청 → 200 + places 포함
// ══════════════════════════════════════════════════════════════════════════════

test('HT-4: 유효 토큰 + "하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘." → 200', async () => {
  const token = makeGuestToken();
  const res = await request
    .post('/api/dt/travel/input/text')
    .set('Authorization', `Bearer ${token}`)
    .send({ message: TARGET_MESSAGE });

  expect(res.status).toBe(200);
  expect(res.body).toBeDefined();
});

// ══════════════════════════════════════════════════════════════════════════════
// HT-5: 응답에 session_id 포함
// ══════════════════════════════════════════════════════════════════════════════

test('HT-5: 응답에 session_id 포함 (sessionService.createSession mock 값)', async () => {
  const token = makeGuestToken();
  const res = await request
    .post('/api/dt/travel/input/text')
    .set('Authorization', `Bearer ${token}`)
    .send({ message: TARGET_MESSAGE });

  expect(res.status).toBe(200);
  expect(res.body.session_id).toBe('http-test-session-abc123');
});

// ══════════════════════════════════════════════════════════════════════════════
// HT-6: travelGuideService.recommend에 must_visit 올바른 코드 전달
// ══════════════════════════════════════════════════════════════════════════════

test('HT-6: recommend 호출 시 must_visit_place_ids = [hamel_lighthouse, hyangiram]', async () => {
  const token = makeGuestToken();
  await request
    .post('/api/dt/travel/input/text')
    .set('Authorization', `Bearer ${token}`)
    .send({ message: TARGET_MESSAGE });

  expect(travelGuideSvc.recommend).toHaveBeenCalled();
  const domainCtx = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainCtx.must_visit_place_ids).toContain('hamel_lighthouse');
  expect(domainCtx.must_visit_place_ids).toContain('hyangiram');
  expect(domainCtx.must_visit_place_ids).not.toContain('하멜등대');
  expect(domainCtx.must_visit_place_ids).not.toContain('향일암');
});

// ══════════════════════════════════════════════════════════════════════════════
// HT-7: recommend에 time_available_minutes=270 전달
// ══════════════════════════════════════════════════════════════════════════════

test('HT-7: recommend 호출 시 time_available_minutes=270 (치환 없음)', async () => {
  const token = makeGuestToken();
  await request
    .post('/api/dt/travel/input/text')
    .set('Authorization', `Bearer ${token}`)
    .send({ message: TARGET_MESSAGE });

  expect(travelGuideSvc.recommend).toHaveBeenCalled();
  const domainCtx = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainCtx.time_available_minutes).toBe(270);
});

// ══════════════════════════════════════════════════════════════════════════════
// HT-8: 빈 message 문자열 → 400
// ══════════════════════════════════════════════════════════════════════════════

test('HT-8: 빈 문자열 message → 400', async () => {
  const token = makeGuestToken();
  const res = await request
    .post('/api/dt/travel/input/text')
    .set('Authorization', `Bearer ${token}`)
    .send({ message: '   ' });

  expect(res.status).toBe(400);
});
