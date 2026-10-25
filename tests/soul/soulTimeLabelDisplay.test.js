'use strict';

/**
 * SOUL 시간 표시 버그 재현 및 수정 검증
 *
 * Production Finding (2026-10-25):
 *   270분 → "5시간 정도 시간이 있으시군요." (WRONG — Math.round(4.5) = 5)
 *   Expected: "4시간 30분 정도 시간이 있으시군요."
 *
 * Root Cause:
 *   soyeowoolService.js:1785 — `${Math.round(timeMinutes / 60)}시간`
 *   Math.round(270/60) = Math.round(4.5) = 5 → "5시간" (오버스테이트)
 *   File's own principle at line 650: "Math.round() overstating non-round values"
 *
 * Fix:
 *   timeMinutes % 60 === 0 → "${timeMinutes/60}시간"
 *   else                   → "${Math.floor(timeMinutes/60)}시간 ${timeMinutes%60}분"
 *
 * Test cases:
 *   TL-1: 270분 → "4시간 30분" (FIXED — was "5시간")
 *   TL-2: 120분 → "2시간" (no change)
 *   TL-3: 300분 → "5시간" (no change)
 *   TL-4: 480분 → "8시간" (no change)
 *   TL-5: 90분 → "1시간 30분" (improved — was "2시간")
 *   TL-6: 150분 → "2시간 30분" (improved — was "3시간")
 *   TL-7: 시간 UNKNOWN (provenance) → timeLabel 미사용 (situationLine 미발동)
 *
 * Run: npx jest --testPathPatterns="soulTimeLabelDisplay"
 */

process.env.OPENAI_API_KEY   = process.env.OPENAI_API_KEY   || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../services/routeSkeletonService', () => ({
  buildSkeleton: jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/quoteEngine', () => ({
  calculateQuote: jest.fn(),
  sanitizeForCustomer: jest.fn(),
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

const contextSvc       = require('../../services/contextExtractionService');
const travelGuideSvc   = require('../../services/travelGuideService');
const sessionSvc       = require('../../services/sessionService');
const sharedJourneySvc = require('../../services/sharedJourneyService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const SESSION_ID = 'test-time-label';
const PRINCIPAL  = { principal_id: 'test-user', principal_type: 'GUEST' };

const blankSession = () => ({ ok: true, journey_ctx: null });

const mkCtxWithTime = (timeMinutes) => ({
  people_type: 'solo',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: timeMinutes,
  group_size: null,
  _provenance: {
    people_type: 'UNKNOWN',
    has_car: 'UNKNOWN',
    time_available_minutes: 'USER_EXPLICIT',
  },
});

const hamelPlace = { code: 'hamel_lighthouse', name_ko: '하멜등대', physical_difficulty: 'low', avg_stay_minutes: 30 };

const makeRequest = (message, timeMinutes) => handleTravelRequest({
  message,
  sessionId: SESSION_ID,
  hotelId: null,
  principal: PRINCIPAL,
  explicit_context: {},
});

beforeEach(() => {
  jest.clearAllMocks();
  sessionSvc.getSession           = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode  = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend       = jest.fn().mockResolvedValue({ places: [hamelPlace] });
  sharedJourneySvc.extractSharedJourney = jest.fn().mockResolvedValue(null);
});

// ══════════════════════════════════════════════════════
// TL-1: 270분 → "4시간 30분" (핵심 버그)
// ══════════════════════════════════════════════════════

test('TL-1: 270분 USER_EXPLICIT → message_ko에 "4시간 30분" 포함 (버그: Math.round(4.5)=5 → "5시간")', async () => {
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtxWithTime(270));

  const result = await makeRequest('하멜등대 가고 싶어요. 270분 코스 짜줘.', 270);

  expect(result.ok).toBe(true);
  const msg = result.payload.message_ko || '';
  expect(msg).toContain('4시간 30분');
  expect(msg).not.toContain('5시간');
});

// ══════════════════════════════════════════════════════
// TL-2: 120분 → "2시간" (변경 없음)
// ══════════════════════════════════════════════════════

test('TL-2: 120분 USER_EXPLICIT → message_ko에 "2시간" 포함 (회귀 없음)', async () => {
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtxWithTime(120));

  const result = await makeRequest('하멜등대 가고 싶어요. 120분 코스 짜줘.', 120);

  expect(result.ok).toBe(true);
  const msg = result.payload.message_ko || '';
  expect(msg).toContain('2시간');
});

// ══════════════════════════════════════════════════════
// TL-3: 300분 → "5시간" (변경 없음)
// ══════════════════════════════════════════════════════

test('TL-3: 300분 USER_EXPLICIT → message_ko에 "5시간" 포함 (회귀 없음)', async () => {
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtxWithTime(300));

  const result = await makeRequest('하멜등대 가고 싶어요. 300분 코스 짜줘.', 300);

  expect(result.ok).toBe(true);
  const msg = result.payload.message_ko || '';
  expect(msg).toContain('5시간');
});

// ══════════════════════════════════════════════════════
// TL-4: 480분 → "8시간" (변경 없음)
// ══════════════════════════════════════════════════════

test('TL-4: 480분 USER_EXPLICIT → message_ko에 "8시간" 포함 (회귀 없음)', async () => {
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtxWithTime(480));

  const result = await makeRequest('하멜등대 가고 싶어요. 480분 코스 짜줘.', 480);

  expect(result.ok).toBe(true);
  const msg = result.payload.message_ko || '';
  expect(msg).toContain('8시간');
});

// ══════════════════════════════════════════════════════
// TL-5: 90분 → "1시간 30분" (Math.round(1.5)=2 → 개선)
// ══════════════════════════════════════════════════════

test('TL-5: 90분 USER_EXPLICIT → message_ko에 "1시간 30분" 포함 (개선: 기존 "2시간")', async () => {
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtxWithTime(90));

  const result = await makeRequest('하멜등대 가고 싶어요. 90분 코스 짜줘.', 90);

  expect(result.ok).toBe(true);
  const msg = result.payload.message_ko || '';
  expect(msg).toContain('1시간 30분');
  expect(msg).not.toContain('2시간');
});

// ══════════════════════════════════════════════════════
// TL-6: 150분 → "2시간 30분" (Math.round(2.5)=3 → 개선)
// ══════════════════════════════════════════════════════

test('TL-6: 150분 USER_EXPLICIT → message_ko에 "2시간 30분" 포함 (개선: 기존 "3시간")', async () => {
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtxWithTime(150));

  const result = await makeRequest('하멜등대 가고 싶어요. 150분 코스 짜줘.', 150);

  expect(result.ok).toBe(true);
  const msg = result.payload.message_ko || '';
  expect(msg).toContain('2시간 30분');
  expect(msg).not.toContain('3시간');
});

// ══════════════════════════════════════════════════════
// TL-7: 시간 UNKNOWN → "N시간 M분" 미표시
// ══════════════════════════════════════════════════════

test('TL-7: time_available_minutes UNKNOWN → "시간이 있으시군요" 미포함', async () => {
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue({
    people_type: 'solo',
    has_car: false,
    companion_constraints: { has_kids: false, has_elderly: false },
    meal_context: 'none',
    time_available_minutes: 120,
    group_size: null,
    _provenance: {
      people_type: 'UNKNOWN',
      has_car: 'UNKNOWN',
      time_available_minutes: 'UNKNOWN', // ← UNKNOWN → timeKnown=false
    },
  });

  const result = await makeRequest('하멜등대 가고 싶어요.', 120);

  expect(result.ok).toBe(true);
  const msg = result.payload.message_ko || '';
  // timeKnown=false → situationLine should NOT use time label
  expect(msg).not.toMatch(/\d+시간.*정도 시간이 있으시군요/);
});
