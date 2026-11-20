/**
 * PHX-SOUL-QA-001 REPAIR-01~03 회귀 테스트 (운영 SOUL 코드 대상, mock 기반 오프라인)
 * 기준 커밋: 39a82fe. 기대값은 Founder 승인 요구사항에서 정했다.
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

const contextSvc = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc = require('../../services/sessionService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const mkCtx = (o = {}) => ({
  people_type: 'solo', has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none', time_available_minutes: 120, group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' }, ...o,
});
const PLACES = {
  odongdo: { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120 },
  hyangiram: { code: 'hyangiram', name_ko: '향일암', avg_stay_minutes: 120 },
  cablecar: { code: 'cablecar', name_ko: '케이블카', avg_stay_minutes: 45 },
};
const req = (message) => handleTravelRequest({
  message, sessionId: 'test-repair-0103', hotelId: null,
  principal: { principal_id: 'test-user', principal_type: 'GUEST' }, explicit_context: {},
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(c => Promise.resolve(PLACES[c] || null));
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
});

describe('REPAIR-01 운영시간과 체류시간 구분', () => {
  test('관람 가능 시간 질문은 운영시간으로 답하고 체류시간으로 답하지 않는다', async () => {
    const r = await req('오동도 관람 가능 시간은?');
    expect(r.payload.status).toBe('PLACE_LOOKUP');
    expect(r.payload.message_ko).toMatch(/운영시간/);
    expect(r.payload.message_ko).not.toMatch(/평균적으로/);
  });

  test('관람 소요 질문은 체류시간을 답하고 운영시간을 체류로 바꾸지 않는다', async () => {
    const r = await req('오동도 관람시간은 얼마나 걸려?');
    expect(r.payload.message_ko).toMatch(/일정에서 약 90분/); // §64 Q63-1
    expect(r.payload.intent).toBe('PLACE_STAY_INFO');
  });

  test('한 바퀴 둘러보는 시간 질문도 체류 답변으로 분류한다', async () => {
    const r = await req('오동도를 한 바퀴 둘러보려면 얼마나 걸려?');
    expect(r.payload.intent).toBe('PLACE_STAY_INFO');
  });

  test('입장 시작 시각 질문은 운영시간을 안내하고 정확한 입장 시각은 미확인이라고 말한다', async () => {
    const r = await req('오동도는 몇 시부터 들어갈 수 있어?');
    expect(r.payload.intent).toBe('PLACE_HOURS_INFO');
    expect(r.payload.message_ko).toMatch(/정확한 입장 시작 시간은 확인되지 않았어요/);
    expect(r.payload.message_ko).not.toMatch(/평균적으로/);
  });

  test('입장료 질문은 운영 시간 응답으로 바뀌지 않는다 (기존 PSQ 경로 유지)', async () => {
    const r = await req('오동도 입장료 얼마야?');
    expect(r.payload.intent).not.toBe('PLACE_HOURS_INFO');
  });
});

describe('REPAIR-02 한국어 조사 선택 (기존 _koreanParticle 재사용)', () => {
  test('받침 없는 장소명은 "는", 받침 있는 장소명은 "은"을 쓴다 (체류 문구)', async () => {
    const odongdo = await req('오동도 관람시간은 얼마나 걸려?');
    expect(odongdo.payload.message_ko).toMatch(/오동도는 일정에서/); // §64 Q63-1
    expect(odongdo.payload.message_ko).not.toMatch(/은\(는\)/);
    const hyang = await req('향일암 관람시간은 얼마나 걸려?');
    expect(hyang.payload.message_ko).toMatch(/향일암은 평균적으로/);
  });

  test('소스에 하드코딩된 은(는) 조사가 남아 있지 않다', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '../../services/soyeowoolService.js'), 'utf8');
    expect(src).not.toMatch(/\$\{[a-zA-Z_]+\}은\(는\)/);
  });
});

describe('REPAIR-03 미확인 제휴처·혜택 차단 (카페 목록 오인 방지)', () => {
  test('카페 질문은 제휴처 목록이나 오션뷰 추천처럼 보이는 응답을 하지 않는다', async () => {
    const r = await req('바다가 보이는 여수 카페를 추천해 줘.');
    // §70: 검증된 바다 전망 카페 (포트앤포트) 1곳만 안내. 제휴·혜택·미검증 카페는 없어야 한다.
    expect(r.payload.status).toBe('PLACE_LOOKUP');
    expect(r.payload.message_ko).toContain('포트앤포트');
    expect(r.payload.message_ko).not.toMatch(/제휴|추천 카페|혜택|아메리카노/);
    expect(r.payload.places).toEqual([]);
  });

  test('관리 목록(partner_master)의 카페 정보가 응답에 노출되지 않는다', async () => {
    const r = await req('여수 카페 알려줘');
    expect(JSON.stringify(r.payload)).not.toMatch(/프롬나드|카페하루|모이핀/);
  });

  test('travelGuideService는 확인되지 않은 파트너 혜택을 모두 제외한다 (허용 목록 기준)', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '../../services/travelGuideService.js'), 'utf8');
    expect(src).toMatch(/const CONFIRMED_BENEFIT_PARTNERS = \[\];/);
    expect(src).not.toMatch(/UNCONFIRMED_BENEFIT_PARTNERS/);
  });
});
