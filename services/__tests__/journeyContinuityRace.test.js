'use strict';
/**
 * Journey Continuity Race Fix — Integration Test
 *
 * Tests that Turn 1 preference write is committed before Turn 2 reads session.
 * Root Cause C (async write race) regression guard.
 *
 * Turn 1: "케이블카는 꼭 타고 싶어." → CLARIFICATION + writes preferred_leisure=cable
 * Turn 2: "여자친구랑 둘이 가. 1박2일 일정 짜줘." → MY ROUTE must contain cablecar
 *
 * No artificial delay between turns — this is the race scenario.
 */

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-guest-secret';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-user-secret';

jest.mock('../../services/sessionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sharedJourneyService');
jest.mock('../../services/contextExtractionService');

const sessionService         = require('../../services/sessionService');
const travelGuideService     = require('../../services/travelGuideService');
const sharedJourneyService   = require('../../services/sharedJourneyService');
const contextExtractionService = require('../../services/contextExtractionService');
const { handleTravelRequest } = require('../soyeowoolService');

const PRINCIPAL = {
  principal_id: 'test-guest-uuid',
  principal_type: 'GUEST',
  sowon_id: 'test-sowon-uuid',
};

// Shared in-memory session store — simulates Supabase without network
let _store = {};

beforeEach(() => {
  _store = {};
  jest.clearAllMocks();

  // getSession: returns parsed context (including journey_ctx if written)
  sessionService.getSession.mockImplementation(async (sessionId) => {
    return _store[sessionId] || null;
  });

  // updateJourneyContext: writes journey_ctx into store synchronously
  // (real DB is async; mock is sync — race fix ensures this completes before return)
  sessionService.updateJourneyContext.mockImplementation(async (sessionId, journeyCtx) => {
    if (!sessionId || !journeyCtx) return { updated: false };
    if (!_store[sessionId]) _store[sessionId] = {};
    _store[sessionId].journey_ctx = journeyCtx;
    return { updated: true };
  });

  // contextExtractionService: parse message into soulContext (couple, no constraints)
  contextExtractionService.parseUserMessage = jest.fn().mockResolvedValue({
    people_type: 'couple',
    group_size: 2,
    time_available_minutes: null,
    companion_constraints: { has_kids: false, has_elderly: false },
    meal_context: null,
    country_code: 'KR',
    city_code: 'YEOSU',
  });

  // travelGuideService: minimal mock returning one place
  travelGuideService.recommend = jest.fn().mockResolvedValue({
    places: [
      { code: 'dolsan', name_ko: '돌산공원', type: 'attraction', emotion_tags: [], reason: '전망 좋음' }
    ],
    message_ko: '여수 추천 장소입니다.',
  });
  travelGuideService.getPlaceByCode = jest.fn().mockResolvedValue(null);

  // sharedJourneyService: return empty journey (no prior signals)
  sharedJourneyService.extractSharedJourney = jest.fn().mockResolvedValue({
    want: [], experienced: [], repeat_intent: [], companion_voices: [],
    has_signals: false,
  });
});

describe('Journey Continuity Race Fix', () => {
  const SESSION_ID = 'race-test-session-001';

  test('Turn 1 → Turn 2: preferred_leisure written before Turn 2 reads session', async () => {
    // ─── Turn 1: cable car preference expressed ───────────────────────────────
    const turn1Result = await handleTravelRequest({
      message: '케이블카는 꼭 타고 싶어.',
      sessionId: SESSION_ID,
      hotelId: null,
      principal: PRINCIPAL,
    });

    expect(turn1Result.ok).toBe(true);
    expect(turn1Result.payload.presentation_mode).toBe('CLARIFICATION');

    // Verify the session write happened BEFORE Turn 2 (race fix: awaited)
    expect(sessionService.updateJourneyContext).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({ preferred_leisure: 'cable' })
    );

    // Verify in-memory store reflects the written preference
    expect(_store[SESSION_ID]).toBeDefined();
    expect(_store[SESSION_ID].journey_ctx).toMatchObject({ preferred_leisure: 'cable' });

    // ─── Turn 2: IMMEDIATELY after Turn 1 (no delay) ─────────────────────────
    const turn2Result = await handleTravelRequest({
      message: '여자친구랑 둘이 가. 1박2일 일정 짜줘.',
      sessionId: SESSION_ID,
      hotelId: null,
      principal: PRINCIPAL,
    });

    expect(turn2Result.ok).toBe(true);
    expect(turn2Result.payload.presentation_mode).toBe('ROUTE_READY');

    // Route must be present
    const route = turn2Result.payload.route;
    expect(route).not.toBeNull();
    expect(route.days).toBeDefined();

    // Cable car must appear in Day 1 items
    const day1Items = route.days[0].items;
    const cableItem = day1Items.find(item => item.commerce_code === 'cable');
    expect(cableItem).toBeDefined();
    expect(cableItem.selection_status).toBe('TRAVELER_REQUESTED');
    expect(cableItem.source).toBe('TRAVELER_PREFERENCE');

    console.log('✅ Race fix verified: cablecar present in MY ROUTE after immediate Turn 2');
  });

  test('Turn 1 → Turn 2: no cablecar when Turn 1 has no preference', async () => {
    // Control: if Turn 1 has no leisure preference, Turn 2 should not include cablecar
    const turn1 = await handleTravelRequest({
      message: '여수 여행 어떻게 할까?',
      sessionId: SESSION_ID,
      hotelId: null,
      principal: PRINCIPAL,
    });

    expect(turn1.ok).toBe(true);
    // "어떻게 할까" → no positive discovery intent and no journey intent → CLARIFICATION
    // Or if it triggers discovery, places but no cablecar
    // Either way, no preferred_leisure should be written
    const writeCalls = sessionService.updateJourneyContext.mock.calls
      .filter(([, ctx]) => ctx && ctx.preferred_leisure);
    expect(writeCalls.length).toBe(0);

    const turn2 = await handleTravelRequest({
      message: '여자친구랑 둘이 가. 1박2일 일정 짜줘.',
      sessionId: SESSION_ID,
      hotelId: null,
      principal: PRINCIPAL,
    });

    expect(turn2.ok).toBe(true);
    if (turn2.payload.route) {
      const day1Items = turn2.payload.route.days[0].items;
      const cableItem = day1Items.find(item => item.commerce_code === 'cable');
      expect(cableItem).toBeUndefined();
      console.log('✅ Control verified: no cablecar without prior preference');
    }
  });

  test('Turn 1 negation → Turn 2: stale preferred_leisure cleared before route build', async () => {
    // Pre-seed: preferred_leisure already in session from a prior turn
    _store[SESSION_ID] = { journey_ctx: { preferred_leisure: 'cable', guest_count: 2 } };

    // Turn 1: explicit negation
    const turn1 = await handleTravelRequest({
      message: '케이블카는 빼고 싶어.',
      sessionId: SESSION_ID,
      hotelId: null,
      principal: PRINCIPAL,
    });

    expect(turn1.ok).toBe(true);
    expect(turn1.payload.presentation_mode).toBe('CLARIFICATION');

    // Negation write should have cleared preferred_leisure
    expect(sessionService.updateJourneyContext).toHaveBeenCalledWith(
      SESSION_ID,
      expect.objectContaining({ preferred_leisure: null })
    );
    expect(_store[SESSION_ID].journey_ctx.preferred_leisure).toBeNull();

    // Turn 2: route build — no cablecar
    const turn2 = await handleTravelRequest({
      message: '여자친구랑 둘이 가. 1박2일 일정 짜줘.',
      sessionId: SESSION_ID,
      hotelId: null,
      principal: PRINCIPAL,
    });

    expect(turn2.ok).toBe(true);
    if (turn2.payload.route) {
      const day1Items = turn2.payload.route.days[0].items;
      const cableItem = day1Items.find(item => item.commerce_code === 'cable');
      expect(cableItem).toBeUndefined();
      console.log('✅ Negation verified: cablecar absent after explicit negation');
    }
  });
});
