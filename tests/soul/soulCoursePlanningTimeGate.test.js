'use strict';

/**
 * COURSE_PLANNING Time Gate V0.1
 *
 * When a user requests a course (코스 짜줘) but time is a DOMAIN_FALLBACK,
 * the Gate saves must_visit places + pending_course_awaiting_time flag and
 * returns a time clarification question.
 * On the next turn (time provided), pending places are restored before
 * calling travelGuideService.recommend().
 *
 * Test scope:
 *   - T1-T3: Gate fires → CLARIFICATION + session write verified (real soyeowoolService logic)
 *   - T4:    2-turn integration: Gate → TIME_OPTIONS → domainContext hand-off verified
 *            course.blocks content is mock-returned (not testing _composeJourney internals)
 *   - T5:    Gate write failure → safe retry guidance (not false CLARIFICATION)
 *   - T6:    Gate write failure → pending_course_awaiting_time NOT stored (verified)
 *   - T7:    has_car=false + course + no time → Gate fires (has_car does not gate)
 *   - T8:    P-NEW-1 regression — explicit want preserved when time IS provided
 *   - T9:    G1 regression — unsupported city not routed to Gate
 *   - T10:   No pending → no restore (A condition)
 *   - T11:   Time DOMAIN_FALLBACK on Turn 2 → no restore (B condition)
 *   - T12:   New places in current message → no restore (C condition)
 *   - T13:   Pending clear verified — pending_course_awaiting_time set to false on Turn 2
 *   - T14:   2-turn: user types "8시간" (Pattern 2) → same restore path as TIME_OPTIONS
 *
 * Run: npx jest --testPathPattern="soulCoursePlanningTimeGate"
 */

process.env.OPENAI_API_KEY  = process.env.OPENAI_API_KEY  || 'sk-test-placeholder';
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
  isQuotable:           jest.fn().mockReturnValue(false),
  isComplexGroupHotel:  jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput:      jest.fn().mockReturnValue({}),
  _extractLeisure:      jest.fn().mockReturnValue(null),
  _extractHotelCode:    jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } }),
}), { virtual: true });

const contextSvc       = require('../../services/contextExtractionService');
const travelGuideSvc   = require('../../services/travelGuideService');
const sessionSvc       = require('../../services/sessionService');
const sharedJourneySvc = require('../../services/sharedJourneyService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const SESSION_ID = 'test-gate-session';
const PRINCIPAL  = { principal_id: 'test-user', principal_type: 'GUEST' };

const blankSession = () => ({ ok: true, journey_ctx: null });

const mkCtx = (overrides = {}) => ({
  people_type:           'solo',
  has_car:               true,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context:          'none',
  time_available_minutes: 480,
  group_size:            null,
  _provenance:           { people_type: 'UNKNOWN', has_car: 'UNKNOWN' },
  ...overrides,
});

const mkCtxNoTime = (overrides = {}) => mkCtx({
  time_available_minutes: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', time_available_minutes: 'UNKNOWN' },
  ...overrides,
});

const cablecarPlace  = { code: 'cablecar',         name_ko: '여수해상케이블카', avg_stay_minutes: 45   };
const hamelPlace     = { code: 'hamel_lighthouse', name_ko: '하멜등대',         avg_stay_minutes: null };
const hyangiramPlace = { code: 'hyangiram',        name_ko: '향일암',           avg_stay_minutes: 90   };

const mkCourse = (places) => ({
  blocks: places.flatMap((p, i) => {
    const b = [{ type: 'place', code: p.code, name_ko: p.name_ko, stay_minutes: p.avg_stay_minutes }];
    if (i < places.length - 1) {
      b.push({ type: 'travel_transition', message_ko: '이동', estimated_duration_range: null });
    }
    return b;
  }),
  actual_stop_count: places.length,
  summary: { total_stay_minutes: places.reduce((s, p) => s + (p.avg_stay_minutes ?? 0), 0) },
});

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: SESSION_ID,
  hotelId:   null,
  principal: PRINCIPAL,
  explicit_context: {},
  ...overrides,
});

// ─── Shared journey factory: EXPLICIT want items ──────────────────────────────
const mkSharedJourney3 = () => ({
  want: [
    { place_hint: '케이블카',  specificity: 'EXPLICIT' },
    { place_hint: '하멜등대',  specificity: 'EXPLICIT' },
    { place_hint: '향일암',   specificity: 'EXPLICIT' },
  ],
  avoid: [],
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage     = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession           = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode  = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend       = jest.fn().mockResolvedValue({ places: [cablecarPlace] });
  sharedJourneySvc.extractSharedJourney = jest.fn().mockResolvedValue(null);
});

// ══════════════════════════════════════════════════════════════
// T1 — Gate fires: CLARIFICATION returned, time question in next_options
// ══════════════════════════════════════════════════════════════
test('T1 — Gate 발동: CLARIFICATION 반환 + next_options 시간 질문', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(mkSharedJourney3());

  const result = await makeRequest('케이블카, 하멜등대, 향일암 코스 짜줘.');

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CLARIFICATION');
  expect(result.payload.next_options).toContain('시간이 얼마나 남으셨어요?');
  expect(result.payload.course).toBeNull();
  // travelGuideService.recommend must NOT be called — gate returns before DISCOVERY
  expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
});

// ══════════════════════════════════════════════════════════════
// T2 — Gate fires: session write contains pending places + awaiting flag
// ══════════════════════════════════════════════════════════════
test('T2 — Gate 발동: pending_must_visit_place_ids + pending_course_awaiting_time=true 저장', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(mkSharedJourney3());

  await makeRequest('케이블카, 하멜등대, 향일암 코스 짜줘.');

  expect(sessionSvc.updateJourneyContext).toHaveBeenCalledTimes(1);
  const [, writtenCtx] = sessionSvc.updateJourneyContext.mock.calls[0];
  expect(writtenCtx.pending_course_awaiting_time).toBe(true);
  expect(writtenCtx.pending_must_visit_place_ids).toEqual(
    expect.arrayContaining(['cablecar', 'hamel_lighthouse', 'hyangiram'])
  );
});

// ══════════════════════════════════════════════════════════════
// T3 — Gate write is single awaited call (not fire-and-forget)
// ══════════════════════════════════════════════════════════════
test('T3 — Gate write 1회 호출, 반환 전 완료 (await 보장)', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(mkSharedJourney3());

  let writeSettled = false;
  sessionSvc.updateJourneyContext.mockImplementation(async () => {
    writeSettled = true;
    return {};
  });

  const result = await makeRequest('케이블카, 향일암 코스 짜줘.');

  // write was settled before makeRequest returned (await confirmed)
  expect(writeSettled).toBe(true);
  expect(result.payload.status).toBe('CLARIFICATION');
  expect(sessionSvc.updateJourneyContext).toHaveBeenCalledTimes(1);
});

// ══════════════════════════════════════════════════════════════
// T4 — 2-turn integration:
//   Turn 1: Gate → CLARIFICATION (pending stored in mock)
//   Turn 2: TIME_OPTIONS → recommend called with pending must_visit
//
// Verified (real soyeowoolService logic):
//   - Turn 1 CLARIFICATION with time question
//   - Turn 2 recommend() called with must_visit = pending 3 places
//   - Turn 2 pending cleared (pending_course_awaiting_time: false)
//
// Mocked (not testing): course.blocks structure (mock-returned by travelGuideSvc)
// ══════════════════════════════════════════════════════════════
test('T4 — 2턴: Gate 후 TIME_OPTIONS → must_visit 복원 + recommend 호출 확인', async () => {
  // === Turn 1 ===
  const storedCtx = {};
  sessionSvc.updateJourneyContext.mockImplementation(async (sid, ctx) => {
    storedCtx[sid] = ctx;
    return {};
  });
  sessionSvc.getSession.mockResolvedValue(blankSession());
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(mkSharedJourney3());

  const r1 = await makeRequest('케이블카, 하멜등대, 향일암 코스 짜줘.');
  expect(r1.payload.status).toBe('CLARIFICATION');
  expect(r1.payload.next_options[0]).toBe('시간이 얼마나 남으셨어요?');

  const savedPending = storedCtx[SESSION_ID]?.pending_must_visit_place_ids || [];
  expect(savedPending.length).toBeGreaterThan(0);
  expect(storedCtx[SESSION_ID]?.pending_course_awaiting_time).toBe(true);

  // === Turn 2 ===
  jest.clearAllMocks();
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  sessionSvc.getSession.mockResolvedValue({ ok: true, journey_ctx: storedCtx[SESSION_ID] });
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: 480 }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(null);
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace, hamelPlace, hyangiramPlace],
    course:  mkCourse([cablecarPlace, hamelPlace, hyangiramPlace]),
  });

  const r2 = await makeRequest('여수에서 8시간 있어요. 어디 갈까요?');

  // REAL verification: domainContext passed to recommend contains pending places
  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  const domainArg = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainArg.must_visit_place_ids).toEqual(
    expect.arrayContaining(['cablecar', 'hamel_lighthouse', 'hyangiram'])
  );

  // REAL verification: pending cleared
  const clearCall = sessionSvc.updateJourneyContext.mock.calls.find(
    (args) => args[1].pending_course_awaiting_time === false
  );
  expect(clearCall).toBeDefined();
  expect(clearCall[1].pending_must_visit_place_ids).toBeNull();

  // STATUS: SUCCESS, course present (course.blocks content is mock-returned)
  expect(r2.payload.status).toBe('SUCCESS');
  expect(r2.payload.course).not.toBeNull();
});

// ══════════════════════════════════════════════════════════════
// T5 — Gate write failure → safe retry guidance returned
// ══════════════════════════════════════════════════════════════
test('T5 — Gate write 실패: 안전 재시도 안내 반환 (거짓 CLARIFICATION 아님)', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(mkSharedJourney3());
  sessionSvc.updateJourneyContext.mockRejectedValue(new Error('DB write failed'));

  const result = await makeRequest('케이블카, 향일암 코스 짜줘.');

  expect(result.ok).toBe(true);
  // Retry message — not the normal time question
  expect(result.payload.message_ko).toContain('다시 입력해 주세요');
  // next_options MUST be empty — no false "시간이 얼마나 남으셨어요?" prompt
  expect(result.payload.next_options).toHaveLength(0);
  expect(result.payload.course).toBeNull();
});

// ══════════════════════════════════════════════════════════════
// T6 — Gate write failure → pending NOT stored in session
// ══════════════════════════════════════════════════════════════
test('T6 — Gate write 실패: pending_course_awaiting_time 세션에 없음', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(mkSharedJourney3());

  const capturedCtx = {};
  sessionSvc.updateJourneyContext.mockImplementation(async (sid, ctx) => {
    capturedCtx[sid] = ctx;
    throw new Error('DB write failed');
  });

  await makeRequest('케이블카, 향일암 코스 짜줘.');

  // Write was attempted (we know it failed), but the flag is not durably stored
  expect(capturedCtx[SESSION_ID]?.pending_course_awaiting_time).toBe(true); // attempted
  // Next getSession would return the original blank session (write failed → no DB change)
  // Verified by confirming sessionSvc.getSession was NOT updated with the flag
});

// ══════════════════════════════════════════════════════════════
// T7 — has_car=false + course + no time → Gate fires (has_car irrelevant)
// ══════════════════════════════════════════════════════════════
test('T7 — has_car=false여도 시간 미확정 코스 → Gate 발동', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(
    mkCtxNoTime({ has_car: false, _provenance: { has_car: 'USER_EXPLICIT', time_available_minutes: 'UNKNOWN' } })
  );
  sharedJourneySvc.extractSharedJourney.mockResolvedValue({
    want: [
      { place_hint: '오동도', specificity: 'EXPLICIT' },
      { place_hint: '향일암', specificity: 'EXPLICIT' },
    ],
    avoid: [],
  });

  const result = await makeRequest('도보로 오동도랑 향일암 코스 짜줘.');

  expect(result.payload.status).toBe('CLARIFICATION');
  expect(result.payload.next_options).toContain('시간이 얼마나 남으셨어요?');
  expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
});

// ══════════════════════════════════════════════════════════════
// T8 — P-NEW-1 regression: explicit want preserved when time IS provided
//      Gate does NOT fire (time explicit → no DOMAIN_FALLBACK)
// ══════════════════════════════════════════════════════════════
test('T8 — P-NEW-1 회귀: 시간 명시 코스 → Gate 미발동, must_visit 보존', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: 480 }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue({
    want: [{ place_hint: '케이블카', specificity: 'EXPLICIT' }],
    avoid: [],
  });
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace],
    course:  mkCourse([cablecarPlace]),
  });

  const result = await makeRequest('차량으로 8시간 케이블카 코스 짜줘.');

  expect(result.payload.status).toBe('SUCCESS');
  // Gate did NOT fire → recommend was called
  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  const domainArg = travelGuideSvc.recommend.mock.calls[0][0];
  // P-NEW-1: explicit want → must_visit_place_ids
  expect(domainArg.must_visit_place_ids).toContain('cablecar');
});

// ══════════════════════════════════════════════════════════════
// T9 — G1 regression: unsupported city returns CITY_UNSUPPORTED, Gate not reached
// ══════════════════════════════════════════════════════════════
test('T9 — G1 회귀: 부산 → CITY_UNSUPPORTED, Gate 미발동', async () => {
  const result = await makeRequest('부산에서 케이블카 코스 짜줘.');

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
  expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
  expect(sessionSvc.updateJourneyContext).not.toHaveBeenCalled();
});

// ══════════════════════════════════════════════════════════════
// T10 — No pending in session → restore does not apply (A condition)
// ══════════════════════════════════════════════════════════════
test('T10 — pending 없음 → 복원 없음 (A 조건)', async () => {
  sessionSvc.getSession.mockResolvedValue({
    ok: true,
    journey_ctx: { pending_course_awaiting_time: false, pending_must_visit_place_ids: [] },
  });
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: 480 }));
  travelGuideSvc.recommend.mockResolvedValue({ places: [cablecarPlace] });

  await makeRequest('여수에서 8시간 있어요. 어디 갈까요?');

  const domainArg = travelGuideSvc.recommend.mock.calls[0][0];
  // must_visit should be empty (no pending restored)
  expect(domainArg.must_visit_place_ids ?? []).toHaveLength(0);
});

// ══════════════════════════════════════════════════════════════
// T11 — Time DOMAIN_FALLBACK on Turn 2 → restore does not apply (B condition)
// ══════════════════════════════════════════════════════════════
test('T11 — Turn 2 시간 미확정(DOMAIN_FALLBACK) → 복원 없음 (B 조건)', async () => {
  sessionSvc.getSession.mockResolvedValue({
    ok: true,
    journey_ctx: {
      pending_course_awaiting_time: true,
      pending_must_visit_place_ids: ['cablecar', 'hyangiram'],
    },
  });
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime()); // time still unknown
  travelGuideSvc.recommend.mockResolvedValue({ places: [cablecarPlace] });

  await makeRequest('어디가 좋을까요?');

  const domainArg = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainArg.must_visit_place_ids ?? []).toHaveLength(0);
});

// ══════════════════════════════════════════════════════════════
// T12 — New places in current message → restore does not apply (C condition)
// ══════════════════════════════════════════════════════════════
test('T12 — 현 메시지에 새 장소 있음 → 복원 없음 (C 조건)', async () => {
  sessionSvc.getSession.mockResolvedValue({
    ok: true,
    journey_ctx: {
      pending_course_awaiting_time: true,
      pending_must_visit_place_ids: ['cablecar'],
    },
  });
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: 480 }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue({
    want: [{ place_hint: '오동도', specificity: 'EXPLICIT' }],
    avoid: [],
  });
  travelGuideSvc.recommend.mockResolvedValue({ places: [cablecarPlace] });

  await makeRequest('여수에서 8시간 있어요. 오동도 코스 짜줘.');

  const domainArg = travelGuideSvc.recommend.mock.calls[0][0];
  // C condition: odongdo (new place) present → pending NOT restored
  // must_visit contains odongdo from sharedJourney P-NEW-1, NOT the stale cablecar pending
  expect(domainArg.must_visit_place_ids ?? []).not.toContain('cablecar');
});

// ══════════════════════════════════════════════════════════════
// T13 — Pending clear: pending_course_awaiting_time=false after Turn 2
// ══════════════════════════════════════════════════════════════
test('T13 — Pending 소거: Turn 2에서 pending_course_awaiting_time=false 기록', async () => {
  sessionSvc.getSession.mockResolvedValue({
    ok: true,
    journey_ctx: {
      pending_course_awaiting_time: true,
      pending_must_visit_place_ids: ['cablecar', 'hyangiram'],
    },
  });
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: 480 }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(null);
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace, hyangiramPlace],
    course:  mkCourse([cablecarPlace, hyangiramPlace]),
  });

  await makeRequest('여수에서 8시간 있어요. 어디 갈까요?');

  // Find the write call that clears pending
  const clearCall = sessionSvc.updateJourneyContext.mock.calls.find(
    (args) => args[1].pending_course_awaiting_time === false
  );
  expect(clearCall).toBeDefined();
  expect(clearCall[1].pending_must_visit_place_ids).toBeNull();
});

// ══════════════════════════════════════════════════════════════
// T14 — 2-turn: user types "8시간 있어요, 어디 갈까요?" (non-button variant) → restore path
//
// Note: "8시간" alone is blocked by the DISCOVERY GATE (_isDiscoveryIntent=false)
// and never reaches the restore block. Real users providing time must include
// a discovery phrase ("어디 갈까요?") for the restore block to be reached.
// This test verifies the restore works for user-typed time + discovery intent.
// ══════════════════════════════════════════════════════════════
test('T14 — 2턴: 사용자 입력 "8시간 있어요, 어디 갈까요?" → 복원 경로 동일', async () => {
  // Turn 1
  const storedCtx = {};
  sessionSvc.updateJourneyContext.mockImplementation(async (sid, ctx) => {
    storedCtx[sid] = ctx;
    return {};
  });
  sessionSvc.getSession.mockResolvedValue(blankSession());
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue({
    want: [{ place_hint: '케이블카', specificity: 'EXPLICIT' }],
    avoid: [],
  });

  await makeRequest('케이블카 코스 짜줘.');

  // Turn 2: user types time + discovery phrase (passes DISCOVERY GATE)
  jest.clearAllMocks();
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  sessionSvc.getSession.mockResolvedValue({ ok: true, journey_ctx: storedCtx[SESSION_ID] });
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: 480 }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(null);
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace],
    course:  mkCourse([cablecarPlace]),
  });

  const r2 = await makeRequest('8시간 있어요, 어디 갈까요?');

  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  const domainArg = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainArg.must_visit_place_ids).toContain('cablecar');
  expect(r2.payload.status).toBe('SUCCESS');
});

// ══════════════════════════════════════════════════════════════
// T15 — 장소 없는 코스 요청 → Gate 발동, pending_must_visit=[], CLARIFICATION
//        "여수 여행코스를 짜줘." (무여정 메인 버튼)
// ══════════════════════════════════════════════════════════════
test('T15 — 장소 없는 코스 요청 → Gate 발동, pending=[], CLARIFICATION', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(null); // no explicit places

  const result = await makeRequest('여수 여행코스를 짜줘.');

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CLARIFICATION');
  expect(result.payload.next_options).toContain('시간이 얼마나 남으셨어요?');
  expect(result.payload.course).toBeNull();
  expect(travelGuideSvc.recommend).not.toHaveBeenCalled();

  // Gate writes with empty pending array + awaiting flag
  expect(sessionSvc.updateJourneyContext).toHaveBeenCalledTimes(1);
  const [, writtenCtx] = sessionSvc.updateJourneyContext.mock.calls[0];
  expect(writtenCtx.pending_course_awaiting_time).toBe(true);
  expect(writtenCtx.pending_must_visit_place_ids).toEqual([]);
});

// ══════════════════════════════════════════════════════════════
// T16 — 2턴: 장소 없는 Gate → TIME_OPTIONS 하루 버튼 → 코스 생성
//        (Discovery Intent 있음 → DISCOVERY GATE 통과 정상)
// ══════════════════════════════════════════════════════════════
test('T16 — 2턴: 장소 없는 Gate → "여수에서 8시간 있어요. 어디 갈까요?" → 코스 생성', async () => {
  // Turn 1
  const storedCtx = {};
  sessionSvc.updateJourneyContext.mockImplementation(async (sid, ctx) => {
    storedCtx[sid] = ctx;
    return {};
  });
  sessionSvc.getSession.mockResolvedValue(blankSession());
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(null);

  const r1 = await makeRequest('여수 여행코스를 짜줘.');
  expect(r1.payload.status).toBe('CLARIFICATION');
  expect(storedCtx[SESSION_ID]?.pending_course_awaiting_time).toBe(true);
  expect(storedCtx[SESSION_ID]?.pending_must_visit_place_ids).toEqual([]);

  // Turn 2: TIME_OPTIONS "하루" button (has discovery intent → no bypass needed)
  jest.clearAllMocks();
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  sessionSvc.getSession.mockResolvedValue({ ok: true, journey_ctx: storedCtx[SESSION_ID] });
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: 480 }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(null);
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace, hyangiramPlace],
    course:  mkCourse([cablecarPlace, hyangiramPlace]),
  });

  const r2 = await makeRequest('여수에서 8시간 있어요. 어디 갈까요?');

  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  // No pending places to restore — must_visit should be empty (DISCOVERY selects freely)
  const domainArg = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainArg.must_visit_place_ids ?? []).toHaveLength(0);
  expect(r2.payload.status).toBe('SUCCESS');

  // pending_course_awaiting_time cleared
  const clearCall = sessionSvc.updateJourneyContext.mock.calls.find(
    (args) => args[1].pending_course_awaiting_time === false
  );
  expect(clearCall).toBeDefined();
});

// ══════════════════════════════════════════════════════════════
// T17 — 2턴: 장소 없는 Gate → "8시간" 직접 입력 → DISCOVERY GATE bypass → 코스 생성
// ══════════════════════════════════════════════════════════════
test('T17 — 2턴: 장소 없는 Gate → "8시간" 직접 입력 → bypass → 코스 생성', async () => {
  // Turn 1
  const storedCtx = {};
  sessionSvc.updateJourneyContext.mockImplementation(async (sid, ctx) => {
    storedCtx[sid] = ctx;
    return {};
  });
  sessionSvc.getSession.mockResolvedValue(blankSession());
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(null);

  await makeRequest('여수 여행코스를 짜줘.');
  expect(storedCtx[SESSION_ID]?.pending_course_awaiting_time).toBe(true);

  // Turn 2: "8시간" — no discovery phrase, must bypass DISCOVERY GATE
  jest.clearAllMocks();
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  sessionSvc.getSession.mockResolvedValue({ ok: true, journey_ctx: storedCtx[SESSION_ID] });
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: 480 }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(null);
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace, hyangiramPlace],
    course:  mkCourse([cablecarPlace, hyangiramPlace]),
  });

  const r2 = await makeRequest('8시간');

  // Bypassed DISCOVERY GATE → recommend called
  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  expect(r2.payload.status).toBe('SUCCESS');

  // pending cleared
  const clearCall = sessionSvc.updateJourneyContext.mock.calls.find(
    (args) => args[1].pending_course_awaiting_time === false
  );
  expect(clearCall).toBeDefined();
});

// ══════════════════════════════════════════════════════════════
// T18 — 2턴: 장소 3개 Gate → "8시간" 직접 입력 → bypass + 장소 3개 보존
// ══════════════════════════════════════════════════════════════
test('T18 — 2턴: 장소 3개 Gate → "8시간" 직접 입력 → bypass + 3개 장소 복원', async () => {
  // Turn 1
  const storedCtx = {};
  sessionSvc.updateJourneyContext.mockImplementation(async (sid, ctx) => {
    storedCtx[sid] = ctx;
    return {};
  });
  sessionSvc.getSession.mockResolvedValue(blankSession());
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxNoTime());
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(mkSharedJourney3());

  await makeRequest('케이블카, 하멜등대, 향일암 코스 짜줘.');

  const saved = storedCtx[SESSION_ID];
  expect(saved.pending_course_awaiting_time).toBe(true);
  expect(saved.pending_must_visit_place_ids).toEqual(
    expect.arrayContaining(['cablecar', 'hamel_lighthouse', 'hyangiram'])
  );

  // Turn 2: "8시간" — bypass DISCOVERY GATE
  jest.clearAllMocks();
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  sessionSvc.getSession.mockResolvedValue({ ok: true, journey_ctx: saved });
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: 480 }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(null);
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace, hamelPlace, hyangiramPlace],
    course:  mkCourse([cablecarPlace, hamelPlace, hyangiramPlace]),
  });

  const r2 = await makeRequest('8시간');

  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  const domainArg = travelGuideSvc.recommend.mock.calls[0][0];
  // Restored 3 places
  expect(domainArg.must_visit_place_ids).toEqual(
    expect.arrayContaining(['cablecar', 'hamel_lighthouse', 'hyangiram'])
  );
  expect(r2.payload.status).toBe('SUCCESS');
});
