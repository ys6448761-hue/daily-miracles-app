'use strict';
// Production Privacy Hotfix (PHX-SOUL-QA-001 §31) — node 스크립트 검증. 신규 테스트 프레임워크를 도입하지 않는다.
// OpenAI 클라이언트는 Module._load로 가짜 모듈을 주입한다. 실제 외부 호출과 유료 호출은 없다.
// 실행: node tests/privacy/privacyHotfix.test.js

const assert = require('assert');
const Module = require('module');

// ── OpenAI 가짜 모듈: 외부로 나가는 payload를 모두 기록한다 ──
const sent = [];
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'openai') {
    return {
      OpenAI: class {
        constructor() {
          this.chat = {
            completions: {
              create: async (args) => {
                sent.push(args);
                return { choices: [{ message: { content: '{}' } }] };
              },
            },
          };
        }
      },
    };
  }
  return origLoad.call(this, request, ...rest);
};

const { sanitizeForExternal } = require('../../services/soulPrivacyGuard');
const contextExtraction = require('../../services/contextExtractionService');
const { extractSharedJourney } = require('../../services/sharedJourneyService');

const sentText = () => sent.map(c => JSON.stringify(c.messages)).join('\n');
let passed = 0;
const cases = [];
const test = (name, fn) => cases.push({ name, fn });
const resetSent = () => { sent.length = 0; };

// ── 1. 마스킹 단위 ──
test('전화번호 형식 변형은 모두 마스킹된다', () => {
  for (const p of ['010-0000-0000', '010 0000 0000', '01000000000', '010.0000.0000', '+82 10-1234-5678', '02-123-4567']) {
    const r = sanitizeForExternal(`연락처 ${p} 준비물`);
    assert.ok(!r.text.includes(p), `phone not masked: ${p}`);
    assert.ok(r.masked.includes('PHONE'), `PHONE tag missing: ${p}`);
    assert.strictEqual(r.blocked, false);
  }
});

test('이메일 형식 변형은 마스킹된다', () => {
  for (const e of ['tester.one@example.com', 'a+tag@example.co.kr', 'x_y-z@sub.domain.org']) {
    const r = sanitizeForExternal(`메일 ${e} 여행 준비물`);
    assert.ok(!r.text.includes(e), `email not masked: ${e}`);
    assert.ok(r.masked.includes('EMAIL'));
  }
});

test('예약번호 값과 인증 키워드를 보호한다', () => {
  const r = sanitizeForExternal('예약번호: AB12345 오동도 운영 시간');
  assert.ok(!r.text.includes('AB12345'));
  assert.ok(r.text.includes('[예약번호]'));
  assert.strictEqual(sanitizeForExternal('인증번호 알려줘 여행').blocked, true);
  assert.strictEqual(sanitizeForExternal('비밀번호 알려줘').blocked, true);
});

test('주민등록번호, 카드번호, 계좌 키워드, 토큰은 차단된다', () => {
  for (const s of ['주민번호 900101-1234567 등록', '카드번호 1234-5678-9012-3456 결제', '계좌번호 알려줘', 'Bearer abcdefghijklmnop 호출']) {
    assert.strictEqual(sanitizeForExternal(s).blocked, true, s);
  }
});

test('이름 자기소개와 행정구역 주소를 마스킹한다', () => {
  const n = sanitizeForExternal('제 이름은 김영희예요. 여수 2시간 코스');
  assert.ok(!n.text.includes('김영희'));
  const a = sanitizeForExternal('여수시 돌산로 123 근처 준비물');
  assert.ok(!a.text.includes('돌산로 123'));
});

test('여행 숫자(인원, 시간, 요금, 시각)는 보존된다', () => {
  for (const s of ['성인 가족 3명, 차 없이 2시간 여행 준비물', '오동도 12:00 에 가능해? 가격 12,000원', '10:00-18:00 운영 확인', '2026년 11월 19일 날씨']) {
    const r = sanitizeForExternal(s);
    assert.strictEqual(r.text, s);
    assert.strictEqual(r.blocked, false);
  }
});

test('마스킹 중 예외가 나면 차단으로 처리한다 (fail-closed)', () => {
  const r = sanitizeForExternal({ toString() { throw new Error('boom'); } });
  assert.strictEqual(r.blocked, true);
  assert.strictEqual(r.blockReason, 'SANITIZE_ERROR');
  assert.strictEqual(r.text, '');
});

// ── 2. 조건 추출 외부 전송 직전 payload ──
test('조건 추출: 전화번호는 외부 payload에 원문으로 나가지 않고 핵심 질문은 남는다', async () => {
  resetSent();
  await contextExtraction.parseUserMessage('제 전화번호는 010-0000-0000인데 오동도 관람시간을 알려주세요.');
  assert.ok(sent.length >= 1, 'extraction should call LLM once for maskable input');
  const text = sentText();
  assert.ok(!text.includes('010-0000-0000'), 'raw phone leaked to extraction payload');
  assert.ok(text.includes('[전화번호]'));
  assert.ok(text.includes('오동도 관람시간을 알려주세요'));
});

test('조건 추출: 이메일과 여행 조건(인원, 이동수단, 시간)은 보존된다', async () => {
  resetSent();
  await contextExtraction.parseUserMessage('tester.one@example.com 으로 알려줘. 성인 3명 차 없이 2시간 여행 준비물');
  const text = sentText();
  assert.ok(!text.includes('tester.one@example.com'));
  assert.ok(text.includes('성인 3명') && text.includes('차 없이') && text.includes('2시간'));
});

test('조건 추출: 차단 대상이면 외부 호출 0회이고 상위 흐름은 오류 응답을 받는다', async () => {
  resetSent();
  const r = await contextExtraction.parseUserMessage('카드번호 1234-5678-9012-3456 로 결제해 여수 여행');
  assert.strictEqual(sent.length, 0, 'blocked input must not reach external LLM');
  assert.ok(r && r.error, 'blocked input must return error payload, not a fallback that resends raw text');
});

// ── 3. 공유 여정 외부 전송 직전 payload ──
test('공유 여정: 전화번호와 이메일은 외부 payload에 없다', async () => {
  resetSent();
  await extractSharedJourney('연락처 010-0000-0000 메일 tester.one@example.com 여행 준비물');
  assert.strictEqual(sent.length, 1);
  const text = sentText();
  assert.ok(!text.includes('010-0000-0000'));
  assert.ok(!text.includes('tester.one@example.com'));
});

test('공유 여정: 차단 대상이면 외부 호출 0회', async () => {
  resetSent();
  await extractSharedJourney('주민번호 900101-1234567 여수 여행');
  assert.strictEqual(sent.length, 0);
});

// ── 4. fallback 재전송 방지: 두 경로 모두 원문이 외부로 나간 적이 없어야 한다 ──
test('fallback: 차단 입력은 추출과 공유 여정 어디에서도 원문 식별자를 보내지 않는다', async () => {
  resetSent();
  const raw = '비밀번호 알려줘 010-0000-0000';
  await contextExtraction.parseUserMessage(raw);
  await extractSharedJourney(raw);
  assert.strictEqual(sent.length, 0, 'blocked input produced an external call');
});

// ── 실행 ──
(async () => {
  let failed = 0;
  for (const c of cases) {
    try {
      await c.fn();
      passed++;
      console.log(`  ok  ${c.name}`);
    } catch (e) {
      failed++;
      console.log(`  FAIL ${c.name}\n       ${e.message}`);
    }
  }
  Module._load = origLoad;
  console.log(`\nprivacyHotfix: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
