/**
 * PHX-SOUL-QA-001 Hybrid V1 — H3 Response Quality Guard 단위 테스트.
 * 외부 호출 없음. 라우트 연결은 supertest 미설치로 자동 실행하지 않고 정적 확인만 한다.
 */

const fs = require('fs');
const path = require('path');
const { inspectPayload, guardPayload } = require('../../services/soulQualityGuard');
const { isHybridV1Enabled } = require('../../services/soulHybridFlag');

const KNOWLEDGE = JSON.stringify({ odongdo: { hours_ko: '연중무휴 (동백열차 09:00~17:00)', experience_ko: '바다 풍경을 느끼며 산책할 수 있는 곳이에요.' },
  cablecar: { hours_ko: '09:30~21:30 (토요일·성수기 연장)' } });
const fallbackFor = (message) => (/오동도/.test(message) ? '오동도는 바다 풍경을 느끼며 산책할 수 있는 곳이에요. 운영시간은 연중무휴 (동백열차 09:00~17:00)예요.' : null);
const deps = { knowledgeText: KNOWLEDGE, buildFactFallback: fallbackFor };

const payload = (message_ko, extra = {}) => ({ message_ko, status: 'SUCCESS', places: [], intent: 'X', ...extra });

describe('H3 검사 규칙', () => {
  test('빈 응답은 EMPTY로 판정한다', () => {
    expect(inspectPayload(payload('일행과 함께 여행이시군요.'), '오동도 도보 코스', deps)).toContain('EMPTY');
  });

  test('승인 근거 없는 혜택 주장은 차단한다', () => {
    expect(inspectPayload(payload('아메리카노 1잔 무료로 드릴 수 있어요.'), '혜택 알려줘', deps)).toContain('UNVERIFIED_BENEFIT_CLAIM');
    expect(inspectPayload(payload('제휴 카페에서 음료 1병 제공돼요.'), '혜택 알려줘', deps)).toContain('UNVERIFIED_BENEFIT_CLAIM');
  });

  test('요청하지 않은 일차 구조는 차단하고, 일정 요청이면 허용한다', () => {
    const body = '1일차: 오동도 산책\n2일차: 향일암 방문';
    expect(inspectPayload(payload(body), '오동도 운영시간 알려줘', deps)).toContain('UNREQUESTED_DAY_STRUCTURE');
    expect(inspectPayload(payload(body), '부모님과 여수 1박 2일 여행 일정을 만들어 줘', deps)).not.toContain('UNREQUESTED_DAY_STRUCTURE');
  });

  test('지식 본문에 없는 시각은 미검증으로 차단하고, 있는 시각은 통과시킨다', () => {
    expect(inspectPayload(payload('오전 9시쯤 도착해 보세요.'), '케이블카 시간', deps)).toContain('UNVERIFIED_CLOCK_TIME');
    expect(inspectPayload(payload('운영시간은 09:30~21:30이에요.'), '케이블카 운영시간', deps)).not.toContain('UNVERIFIED_CLOCK_TIME');
  });

  test('숫자 우연 일치를 검증으로 보지 않는다: 본문에 같은 숫자가 있어도 시각 형식이 다르면 미검증이다', () => {
    // "09:30"은 본문에 있지만 "9시 30분"은 본문에 없다 → 미검증
    expect(inspectPayload(payload('9시 30분에 도착하세요.'), '케이블카 시간', deps)).toContain('UNVERIFIED_CLOCK_TIME');
  });

  test('정상 응답은 문제 없이 그대로 통과한다', () => {
    const p = payload('오동도는 바다 풍경을 느끼며 산책할 수 있는 곳이에요.');
    expect(inspectPayload(p, '오동도는 어떤 곳이야?', deps)).toEqual([]);
    expect(guardPayload(p, '오동도는 어떤 곳이야?', deps)).toBe(p);
  });
});

describe('H3 교체 동작 — 검증된 사실 기반 대체 답변', () => {
  test('빈 응답은 장소 사실로 대체하고 재질문으로 돌아가지 않는다', () => {
    const out = guardPayload(payload('일행과 함께 여행이시군요.'), '오동도 도보 코스', deps);
    expect(out.status).toBe('GUARDED_FALLBACK');
    expect(out.message_ko).toMatch(/오동도는 바다 풍경/);
    expect(out.message_ko).toMatch(/운영시간은 연중무휴/);
    expect(out.message_ko).not.toMatch(/어떤|알려주세요\?/);
  });

  test('장소가 없는 빈 응답은 확인되지 않았다는 사실을 답한다 (질문 되돌리기 아님)', () => {
    const out = guardPayload(payload('일행과 함께 여행이시군요.'), '여행 이야기해 줘', deps);
    expect(out.message_ko).toMatch(/확인된 정보를 찾지 못했어요/);
  });

  test('혜택 주장은 미확인 혜택 문구로 교체한다', () => {
    const out = guardPayload(payload('아메리카노 1잔 무료예요.'), '혜택 알려줘', deps);
    expect(out.message_ko).toMatch(/확인된 공식 혜택 정보를 찾지 못했어요/);
    expect(out.message_ko).not.toMatch(/아메리카노/);
  });

  test('DIRECT 응답에 근거 없는 시각이 있으면 DIRECT 상태를 유지하며 교체한다', () => {
    const out = guardPayload({ message_ko: '오전 9시쯤 만나요.', status: 'DIRECT_RESPONSE', places: [] }, '좋은 아침이야', deps);
    expect(out.status).toBe('DIRECT_RESPONSE');
    expect(out.message_ko).not.toMatch(/9시/);
  });

  test('교체 시 응답 스키마 키는 유지된다', () => {
    const original = payload('아메리카노 1잔 무료예요.', { session_id: 's', understood_context: {}, why_details: [], next_options: [], timestamp: 't', shared_journey: null, quote: null, route: null, presentation_mode: 'X' });
    const out = guardPayload(original, '혜택 알려줘', deps);
    expect(Object.keys(out).sort()).toEqual(Object.keys(original).sort());
  });
});

describe('H3 플래그와 라우트 연결', () => {
  const ORIGINAL = process.env.SOUL_HYBRID_V1;
  afterEach(() => { if (ORIGINAL === undefined) delete process.env.SOUL_HYBRID_V1; else process.env.SOUL_HYBRID_V1 = ORIGINAL; });

  test('플래그는 기본적으로 꺼져 있다', () => {
    delete process.env.SOUL_HYBRID_V1;
    expect(isHybridV1Enabled()).toBe(false);
    process.env.SOUL_HYBRID_V1 = '1';
    expect(isHybridV1Enabled()).toBe(true);
  });

  test('라우트는 플래그가 켜졌을 때만 가드를 적용한다 (정적 확인)', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../routes/travelInputRoutes.js'), 'utf8');
    expect(src).toMatch(/isHybridV1Enabled\(\)\s*\?\s*guardPayload\(/);
    expect(src).toMatch(/:\s*soulResult\.payload;/);
  });
});
