'use strict';
/**
 * Traveler Profile Continuity V0.1 — Integration tests (service path)
 *
 * Verifies that the full handleTravelRequest path:
 *   (1) writes USER_EXPLICIT traveler facts to journey_ctx.traveler_profile
 *   (2) re-injects stored profile into enrichedSoulContext before _buildDomainContext
 *   (3) enriched values reach travelGuideService.recommend
 *
 * Tests A–D: multi-turn integration traces
 * Test E: explicit override (current USER_EXPLICIT > persisted)
 * Test F: explicit false (has_car=false) infrastructure via stored profile re-injection
 */

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
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn().mockReturnValue(null),
  isQuotable: jest.fn().mockReturnValue(false),
  isComplexGroupHotel: jest.fn().mockReturnValue(false),
  buildQuoteInput: jest.fn().mockReturnValue(null),
  _extractLeisure: jest.fn().mockReturnValue(null),
}));
jest.mock('../../services/sessionService', () => ({
  getSession: jest.fn(),
  updateJourneyContext: jest.fn().mockResolvedValue({ updated: true }),
  createSession: jest.fn().mockResolvedValue({ session_id: 'mock-session' }),
}));

const { handleTravelRequest } = require('../../services/soyeowoolService');
const contextExtractionService = require('../../services/contextExtractionService');
const travelGuideService       = require('../../services/travelGuideService');
const sessionService           = require('../../services/sessionService');

// ─── Shared constants ─────────────────────────────────────────────────────────

const SESSION_ID = 'traveler-profile-int-001';
const PRINCIPAL  = { sowon_id: 'SOWON_TP_TEST', principal_type: 'guest' };

// CLARIFICATION message — does NOT trigger Discovery or Journey
const MSG_CLAR          = '부모님하고 갈 거야';
const MSG_CLAR_CAR      = '차 가져갈 거야';
const MSG_CLAR_UNRELATED = '안녕하세요 여수 어때요';
// DISCOVERY message — triggers Travel Intelligence path (no skeleton)
const MSG_DISCOVERY     = '여수 추천해줘';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeBaseSoulContext(overrides = {}) {
  return {
    session_id: 'ctx-uuid',
    entry_point: null,
    user_mode: 'DEFAULT',
    country_code: 'KR',
    city_code: 'YEOSU',
    time_available_minutes: 120,
    people_type: 'solo',
    companion_constraints: { has_kids: false, kids_age: null, has_elderly: false, disability: null },
    meal_context: 'none',
    has_car: true,          // null→true default applied by contextExtractionService
    mobility_type: 'mixed',
    wish_context: undefined,
    exclude_place_ids: [],
    must_visit_place_ids: [],
    group_size: null,
    _provenance: {
      people_type: 'UNKNOWN',
      has_elderly: 'UNKNOWN',
      has_kids:    'UNKNOWN',
      has_car:     'UNKNOWN',
    },
    ...overrides,
  };
}

function makeTgResult() {
  return {
    session_id: SESSION_ID,
    entry_point: 'YEOSU_GENERAL',
    user_mode: 'DEFAULT',
    places: [{ place_code: 'odongdo', name_ko: '오동도', stay_minutes: 60,
               travel_time_minutes: 15, reason: '바다 산책', safety_pass: true,
               live_status: 'OPEN', matching_score: 0.8,
               suitable_for: [], emotion_tags: [], accessibility_wheelchair: false,
               avg_stay_minutes: 60 }],
    food: null, cafes: null, benefits: null, course: null,
    message: 'OK', journey_preferences: {}
  };
}

function noStoredProfile() {
  return null;
}

function storedProfile(traveler_profile) {
  return { journey_ctx: { traveler_profile } };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Traveler Profile Continuity V0.1 — Integration', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    travelGuideService.recommend.mockResolvedValue(makeTgResult());
    sessionService.updateJourneyContext.mockResolvedValue({ updated: true });
  });

  // ─── Trace A: parent companion persists + re-injects ──────────────────────

  test('A1: CLARIFICATION turn with USER_EXPLICIT people_type writes traveler_profile', async () => {
    contextExtractionService.parseUserMessage.mockResolvedValue(makeBaseSoulContext({
      people_type: 'family',
      companion_constraints: { has_kids: false, kids_age: null, has_elderly: true, disability: null },
      _provenance: { people_type: 'USER_EXPLICIT', has_elderly: 'USER_EXPLICIT', has_kids: 'UNKNOWN', has_car: 'UNKNOWN' },
    }));
    sessionService.getSession.mockResolvedValue(noStoredProfile());

    const result = await handleTravelRequest({ message: MSG_CLAR, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });
    expect(result.ok).toBe(true);
    expect(result.payload.status).toBe('CLARIFICATION');

    // updateJourneyContext called with traveler_profile containing family + has_elderly
    const writeCalls = sessionService.updateJourneyContext.mock.calls;
    const profileWrite = writeCalls.find(([, ctx]) => ctx.traveler_profile);
    expect(profileWrite).toBeDefined();
    expect(profileWrite[1].traveler_profile.people_type).toBe('family');
    expect(profileWrite[1].traveler_profile.companion_has_elderly).toBe(true);
  });

  test('A2: DISCOVERY turn with UNKNOWN people_type gets stored profile re-injected into domainContext', async () => {
    // T2: GPT returns UNKNOWN people_type (default solo)
    contextExtractionService.parseUserMessage.mockResolvedValue(makeBaseSoulContext({
      people_type: 'solo',
      companion_constraints: { has_kids: false, kids_age: null, has_elderly: false, disability: null },
      _provenance: { people_type: 'UNKNOWN', has_elderly: 'UNKNOWN', has_kids: 'UNKNOWN', has_car: 'UNKNOWN' },
    }));
    // Stored profile from T1
    sessionService.getSession.mockResolvedValue(storedProfile({
      people_type: 'family', companion_has_elderly: true, companion_has_kids: false, has_car: null,
    }));

    const result = await handleTravelRequest({ message: MSG_DISCOVERY, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });
    expect(result.ok).toBe(true);

    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    expect(domainCtx.people_type).toBe('family');
    expect(domainCtx.companion_constraints.has_elderly).toBe(true);
  });

  // ─── Trace B: has_car persists + re-injects ───────────────────────────────

  test('B1: CLARIFICATION turn with USER_EXPLICIT has_car writes has_car to traveler_profile', async () => {
    contextExtractionService.parseUserMessage.mockResolvedValue(makeBaseSoulContext({
      has_car: true,
      _provenance: { people_type: 'UNKNOWN', has_elderly: 'UNKNOWN', has_kids: 'UNKNOWN', has_car: 'USER_EXPLICIT' },
    }));
    sessionService.getSession.mockResolvedValue(noStoredProfile());

    await handleTravelRequest({ message: MSG_CLAR_CAR, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });

    const writeCalls = sessionService.updateJourneyContext.mock.calls;
    const profileWrite = writeCalls.find(([, ctx]) => ctx.traveler_profile);
    expect(profileWrite).toBeDefined();
    expect(profileWrite[1].traveler_profile.has_car).toBe(true);
  });

  test('B2: DISCOVERY turn with UNKNOWN has_car gets stored has_car=false re-injected', async () => {
    // Stored: explicit false (no car)
    contextExtractionService.parseUserMessage.mockResolvedValue(makeBaseSoulContext({
      has_car: true, // null→true default (UNKNOWN)
      _provenance: { people_type: 'UNKNOWN', has_elderly: 'UNKNOWN', has_kids: 'UNKNOWN', has_car: 'UNKNOWN' },
    }));
    sessionService.getSession.mockResolvedValue(storedProfile({
      people_type: null, companion_has_elderly: null, companion_has_kids: null, has_car: false,
    }));

    const result = await handleTravelRequest({ message: MSG_DISCOVERY, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });
    expect(result.ok).toBe(true);

    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    // UNKNOWN default was true; stored explicit false must override it
    expect(domainCtx.has_car).toBe(false);
  });

  // ─── Trace C: multiple facts accumulate ───────────────────────────────────

  test('C: both people_type and has_car survive in domainContext from stored profile', async () => {
    contextExtractionService.parseUserMessage.mockResolvedValue(makeBaseSoulContext({
      people_type: 'solo',
      has_car: true, // UNKNOWN default
      _provenance: { people_type: 'UNKNOWN', has_elderly: 'UNKNOWN', has_kids: 'UNKNOWN', has_car: 'UNKNOWN' },
    }));
    sessionService.getSession.mockResolvedValue(storedProfile({
      people_type: 'family', companion_has_elderly: true, companion_has_kids: false, has_car: false,
    }));

    const result = await handleTravelRequest({ message: MSG_DISCOVERY, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });
    expect(result.ok).toBe(true);

    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    expect(domainCtx.people_type).toBe('family');
    expect(domainCtx.companion_constraints.has_elderly).toBe(true);
    expect(domainCtx.has_car).toBe(false);
  });

  // ─── Trace D: unrelated UNKNOWN turn does not erase stored profile ─────────

  test('D: unrelated CLARIFICATION turn with all-UNKNOWN soulContext does not overwrite stored profile', async () => {
    contextExtractionService.parseUserMessage.mockResolvedValue(makeBaseSoulContext({
      // All UNKNOWN — no USER_EXPLICIT provenance
      _provenance: { people_type: 'UNKNOWN', has_elderly: 'UNKNOWN', has_kids: 'UNKNOWN', has_car: 'UNKNOWN' },
    }));
    sessionService.getSession.mockResolvedValue(noStoredProfile());

    await handleTravelRequest({ message: MSG_CLAR_UNRELATED, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });

    // updateJourneyContext should NOT have been called with a traveler_profile key
    const writeCalls = sessionService.updateJourneyContext.mock.calls;
    const profileWrite = writeCalls.find(([, ctx]) => ctx.traveler_profile != null);
    expect(profileWrite).toBeUndefined();
  });

  // ─── Explicit Override: current USER_EXPLICIT > persisted ──────────────────

  test('E: current USER_EXPLICIT companion overrides stored persisted value in domainContext', async () => {
    // Stored: family. Current turn explicitly says couple.
    contextExtractionService.parseUserMessage.mockResolvedValue(makeBaseSoulContext({
      people_type: 'couple',
      _provenance: { people_type: 'USER_EXPLICIT', has_elderly: 'UNKNOWN', has_kids: 'UNKNOWN', has_car: 'UNKNOWN' },
    }));
    sessionService.getSession.mockResolvedValue(storedProfile({
      people_type: 'family', companion_has_elderly: null, companion_has_kids: null, has_car: null,
    }));

    const result = await handleTravelRequest({ message: MSG_DISCOVERY, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });
    expect(result.ok).toBe(true);

    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    expect(domainCtx.people_type).toBe('couple');
  });

  // ─── F: has_car=false infrastructure (stored path) ────────────────────────

  test('F: has_car=false stored explicitly reaches domainContext via re-injection', async () => {
    contextExtractionService.parseUserMessage.mockResolvedValue(makeBaseSoulContext({
      has_car: true, // null→true default UNKNOWN
      _provenance: { people_type: 'UNKNOWN', has_elderly: 'UNKNOWN', has_kids: 'UNKNOWN', has_car: 'UNKNOWN' },
    }));
    sessionService.getSession.mockResolvedValue(storedProfile({
      people_type: null, companion_has_elderly: null, companion_has_kids: null, has_car: false,
    }));

    const result = await handleTravelRequest({ message: MSG_DISCOVERY, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });
    expect(result.ok).toBe(true);

    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    expect(domainCtx.has_car).toBe(false);
  });
});
