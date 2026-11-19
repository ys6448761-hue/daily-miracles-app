'use strict';
// PHX-SOUL-QA-001 §29 — 외부 전송 직전 payload 검증 (OpenAI는 mock. 실제 외부 호출 없음).
// 기존 추출 경로, 공유 여정, 직접 응답은 Feature Flag와 무관하게 보호되어야 한다.

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-placeholder';

const mockCreate = jest.fn();
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({ chat: { completions: { create: mockCreate } } })),
}));

const RAW_PHONE = '010-0000-0000';
const RAW_EMAIL = 'tester.one@example.com';

// 외부로 나간 모든 user/system 메시지 문자열을 모은다
const sentText = () => mockCreate.mock.calls.map(c => JSON.stringify(c[0].messages)).join('\n');

beforeEach(() => {
  mockCreate.mockReset();
  mockCreate.mockResolvedValue({ choices: [{ message: { content: '{}' } }] });
});

describe('기존 추출 경로 (contextExtractionService, flag 무관)', () => {
  test('전화번호는 외부 payload에 원문으로 나가지 않고 핵심 질문은 남는다', async () => {
    const svc = require('../../services/contextExtractionService');
    await svc._extractWithGPT4(`제 전화번호는 ${RAW_PHONE}인데 오동도 관람시간을 알려주세요.`);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const text = sentText();
    expect(text).not.toContain(RAW_PHONE);
    expect(text).toContain('[전화번호]');
    expect(text).toContain('오동도 관람시간을 알려주세요');
  });

  test('이메일은 외부 payload에 원문으로 나가지 않는다', async () => {
    const svc = require('../../services/contextExtractionService');
    await svc._extractWithGPT4(`문의 ${RAW_EMAIL} 여행 준비물 알려줘 성인 3명`);
    expect(sentText()).not.toContain(RAW_EMAIL);
    expect(sentText()).toContain('[이메일]');
  });

  test('차단 대상(카드번호 등)이면 외부 호출을 생략한다', async () => {
    const svc = require('../../services/contextExtractionService');
    const r = await svc._extractWithGPT4('카드번호 1234-5678-9012-3456 로 결제해 여수 여행');
    expect(r).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('성인 3명, 이동수단, 여행시간 같은 여행 조건은 보존된다', async () => {
    const svc = require('../../services/contextExtractionService');
    await svc._extractWithGPT4(`${RAW_PHONE} 성인 3명 차 없이 2시간 여행 준비물`);
    const text = sentText();
    expect(text).toContain('성인 3명');
    expect(text).toContain('차 없이');
    expect(text).toContain('2시간');
  });
});

describe('공유 여정 추출 (sharedJourneyService)', () => {
  test('원문 이메일과 전화번호를 보내지 않는다', async () => {
    const { extractSharedJourney } = require('../../services/sharedJourneyService');
    await extractSharedJourney(`연락처 ${RAW_PHONE} 메일 ${RAW_EMAIL} 여행 준비물`);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(sentText()).not.toContain(RAW_PHONE);
    expect(sentText()).not.toContain(RAW_EMAIL);
  });

  test('차단 대상이면 외부 호출 없이 빈 결과를 반환한다', async () => {
    const { extractSharedJourney } = require('../../services/sharedJourneyService');
    const r = await extractSharedJourney('비밀번호 알려줘 여수 여행');
    expect(mockCreate).not.toHaveBeenCalled();
    expect(r).toBeTruthy();
  });
});

describe('직접 응답 (soulDirectResponse, flag 무관 함수 수준)', () => {
  test('인사 문장의 전화번호를 마스킹해서 보낸다', async () => {
    const { generateDirectReply } = require('../../services/soulDirectResponse');
    await generateDirectReply(`좋은 아침이야 ${RAW_PHONE}`);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(sentText()).not.toContain(RAW_PHONE);
  });

  test('차단 대상이면 호출하지 않고 null을 반환한다', async () => {
    const { generateDirectReply } = require('../../services/soulDirectResponse');
    const r = await generateDirectReply('주민번호 900101-1234567 좋은 아침');
    expect(r).toBeNull();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
