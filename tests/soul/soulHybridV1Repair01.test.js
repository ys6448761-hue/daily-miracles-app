/**
 * PHX-SOUL-QA-001 REPAIR-01 보강 (Hybrid V1 통합 브랜치).
 * "몇 시까지" 질문이 관람 키워드와 함께 와도 운영시간으로 답하는지 검증한다.
 */

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({ extractSharedJourney: jest.fn().mockResolvedValue(null) }));
jest.mock('../../services/quoteEngine', () => ({ calculateQuote: jest.fn(), sanitizeForCustomer: jest.fn() }), { virtual: true });
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn().mockReturnValue({}),
  isQuotable: jest.fn().mockReturnValue(false),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput: jest.fn().mockReturnValue({}),
  _extractLeisure: jest.fn().mockReturnValue(null),
}), { virtual: true });

const contextSvc = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc = require('../../services/sessionService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const req = (message) => handleTravelRequest({
  message, sessionId: 'test-hybrid-repair01', hotelId: null,
  principal: { principal_id: 'test-user', principal_type: 'GUEST' }, explicit_context: {},
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue({ people_type: 'solo', has_car: false,
    companion_constraints: { has_kids: false, has_elderly: false }, meal_context: 'none',
    time_available_minutes: 120, group_size: null, _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' } });
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockResolvedValue({ code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120 });
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
});

describe('REPAIR-01 보강: 몇 시까지는 운영시간', () => {
  test('관람은 몇 시까지야? → 운영시간으로 답하고 체류시간으로 답하지 않는다', async () => {
    const r = await req('오동도 관람은 몇 시까지야?');
    expect(r.payload.intent).toBe('PLACE_HOURS_INFO');
    expect(r.payload.message_ko).toMatch(/운영시간/);
    expect(r.payload.message_ko).not.toMatch(/평균적으로/);
  });
  test('관람 소요 질문은 여전히 체류 답변이다 (회귀 방지)', async () => {
    const r = await req('오동도 관람시간은 얼마나 걸려?');
    expect(r.payload.intent).toBe('PLACE_STAY_INFO');
  });
});
