'use strict';
// PHX-SOUL-QA-001 Response Quality Guard extensions: free claim, region generalization, unverified price.

const { inspectPayload, guardPayload } = require('../../services/soulQualityGuard');

const p = (text) => ({ message_ko: text, places: [], status: 'SUCCESS' });

describe('UNVERIFIED_FREE_CLAIM', () => {
  test('무료 이용 주장은 검증 지식에 무료가 없으면 차단된다', () => {
    expect(inspectPayload(p('오동도는 무료로 이용할 수 있어요.'), '여기 무료로 이용할 수 있어?', { knowledgeText: '{"hours":"09:00"}' }))
      .toContain('UNVERIFIED_FREE_CLAIM');
  });
  test('검증 지식에 무료가 있으면 통과한다', () => {
    expect(inspectPayload(p('오동도는 무료로 이용할 수 있어요.'), '여기 무료로 이용할 수 있어?', { knowledgeText: '{"admission":"무료"}' }))
      .not.toContain('UNVERIFIED_FREE_CLAIM');
  });
});

describe('UNVERIFIED_REGION_GENERALIZATION', () => {
  test('여수 전체 일반화 문장은 차단된다', () => {
    expect(inspectPayload(p('여수에는 무료 관광지가 많아요.'), '무료 관광지만 골라서 알려줘', { knowledgeText: '' }))
      .toContain('UNVERIFIED_REGION_GENERALIZATION');
  });
  test('일반 여행 조언은 차단되지 않는다', () => {
    expect(inspectPayload(p('여수 여행에는 편한 신발과 우산을 챙기면 좋아요.'), '여수 갈 때 뭘 챙겨야 해?', { knowledgeText: '' }))
      .toEqual([]);
  });
});

describe('UNVERIFIED_PRICE', () => {
  test('지식에 없는 금액은 차단된다', () => {
    expect(inspectPayload(p('케이블카는 12,000원이에요.'), '케이블카 타는 데 얼마가 필요해?', { knowledgeText: '{"fare":"9000"}' }))
      .toContain('UNVERIFIED_PRICE');
  });
  test('지식에 있는 금액은 통과한다', () => {
    expect(inspectPayload(p('케이블카는 12,000원이에요.'), '케이블카 타는 데 얼마가 필요해?', { knowledgeText: '{"fare":"12000"}' }))
      .not.toContain('UNVERIFIED_PRICE');
  });
});

describe('guardPayload with new reasons', () => {
  test('무료 주장은 대체 답변에 무료 주장을 남기지 않는다', () => {
    const out = guardPayload(p('오동도는 무료예요.'), '여기 무료로 이용할 수 있어?', { knowledgeText: '{}', buildFactFallback: () => null });
    expect(out.status).toBe('GUARDED_FALLBACK');
    expect(out.message_ko).not.toMatch(/무료(예요|입니다|로 이용)/);
    // 검증 사실이 없으면 정직한 기본 문구로 대체한다
    expect(out.message_ko).toContain('찾지 못했어요');
  });
  test('정상 답변은 그대로 통과한다', () => {
    const ok = p('준비물로는 모자와 물, 편한 신발을 챙기면 좋아요.');
    expect(guardPayload(ok, '여수 갈 때 뭘 챙겨야 해?', { knowledgeText: '' })).toBe(ok);
  });
});
