'use strict';
// PHX-SOUL-QA-001 Adaptive General Advice unit tests. OpenAI is fully mocked (no external calls).

const mockCreate = jest.fn();
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({ chat: { completions: { create: mockCreate } } })),
}));

const { eligibleForAdaptive, containsPII, adaptiveGeneralAnswer } = require('../../services/soulAdaptive');

beforeEach(() => { mockCreate.mockReset(); });

describe('eligibleForAdaptive', () => {
  test('일반 준비 질문은 대상이다', () => {
    expect(eligibleForAdaptive('여수 갈 때 뭘 챙겨야 해?', 0)).toBe(true);
    expect(eligibleForAdaptive('비가 올 때 여행은 어떻게 준비하지?', 0)).toBe(true);
  });
  test('장소가 명시되면 대상이 아니다', () => {
    expect(eligibleForAdaptive('여수 갈 때 뭘 챙겨야 해?', 1)).toBe(false);
  });
  test('사실 민감어가 있으면 대상이 아니다', () => {
    expect(eligibleForAdaptive('여기 무료로 이용할 수 있어?', 0)).toBe(false);
    expect(eligibleForAdaptive('케이블카 타는 데 얼마가 필요해?', 0)).toBe(false);
    expect(eligibleForAdaptive('오늘 여수 날씨가 어때?', 0)).toBe(false);
  });
  test('맥락 의존 표현이 있으면 대상이 아니다', () => {
    expect(eligibleForAdaptive('아까 말한 그거 뭐였지?', 0)).toBe(false);
  });
  test('빈 문자열과 200자 초과는 대상이 아니다', () => {
    expect(eligibleForAdaptive('', 0)).toBe(false);
    expect(eligibleForAdaptive('가'.repeat(201), 0)).toBe(false);
  });
  test('개인정보가 있으면 대상이 아니다', () => {
    expect(eligibleForAdaptive('제 번호 010-1234-5678로 연락 주세요', 0)).toBe(false);
    expect(eligibleForAdaptive('mail me at test@example.com about packing', 0)).toBe(false);
  });
});

describe('containsPII', () => {
  test('전화번호, 이메일, 예약번호를 탐지한다', () => {
    expect(containsPII('010-9876-5432')).toBe(true);
    expect(containsPII('a.b@c.com')).toBe(true);
    expect(containsPII('예약번호: AB12345')).toBe(true);
  });
  test('일반 문장은 탐지하지 않는다', () => {
    expect(containsPII('여수 갈 때 뭘 챙겨야 해?')).toBe(false);
  });
});

describe('adaptiveGeneralAnswer', () => {
  test('GENERAL_ANSWER면 답변을 반환하고 호출은 1회다', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ route: 'GENERAL_ANSWER', answer: '모자와 물을 챙기면 좋아요.' }) } }] });
    const r = await adaptiveGeneralAnswer('여수 갈 때 뭘 챙겨야 해?');
    expect(r).toEqual({ route: 'GENERAL_ANSWER', answer: '모자와 물을 챙기면 좋아요.' });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const sent = mockCreate.mock.calls[0][0];
    // 외부 전송은 질문 원문 한 줄뿐이다 (user 메시지만, 대화 기록 없음)
    expect(sent.messages.filter(m => m.role === 'user')).toEqual([{ role: 'user', content: '여수 갈 때 뭘 챙겨야 해?' }]);
    expect(sent.messages.length).toBe(2);
  });
  test('NEED_PLACE 등 다른 route는 answer 없이 null을 가진 객체를 반환한다', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ route: 'NEED_PLACE', answer: '여기요' }) } }] });
    const r = await adaptiveGeneralAnswer('가족이랑 어디 가면 좋을까?');
    expect(r.route).toBe('NEED_PLACE');
    expect(r.answer).toBeNull();
  });
  test('허용되지 않은 route는 null route로 처리한다', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ route: 'UNKNOWN', answer: 'x' }) } }] });
    const r = await adaptiveGeneralAnswer('준비물 알려줘');
    expect(r.route).toBeNull();
    expect(r.answer).toBeNull();
  });
  test('LLM 오류면 null을 반환하고 예외를 던지지 않는다', async () => {
    mockCreate.mockRejectedValueOnce(new Error('timeout'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(adaptiveGeneralAnswer('준비물 알려줘')).resolves.toBeNull();
    spy.mockRestore();
  });
  // §29 정책 변경: 개인정보는 제거한 뒤 핵심 질문만 보낸다 (이전에는 생략). 원문 전화번호는 외부 payload에 없어야 한다.
  test('개인정보는 마스킹 후 핵심 질문만 보내고 원문 번호는 보내지 않는다', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ route: 'GENERAL_ANSWER', answer: '준비물로 우산을 챙기세요.' }) } }] });
    const r = await adaptiveGeneralAnswer('010-1111-2222로 준비물 알려줘');
    expect(r).toEqual({ route: 'GENERAL_ANSWER', answer: '준비물로 우산을 챙기세요.' });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const sent = JSON.stringify(mockCreate.mock.calls[0][0].messages);
    expect(sent).not.toContain('010-1111-2222');
    expect(sent).toContain('[전화번호]');
    expect(sent).toContain('준비물');
  });
  test('차단 대상(카드번호)이면 LLM을 호출하지 않는다', async () => {
    const r = await adaptiveGeneralAnswer('카드번호 1234-5678-9012-3456 로 준비물 알려줘');
    expect(r).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });
  test('대상이 아닌 질문(사실 민감어)은 LLM을 호출하지 않는다', async () => {
    const r = await adaptiveGeneralAnswer('여기 무료로 이용할 수 있어?');
    expect(r).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
