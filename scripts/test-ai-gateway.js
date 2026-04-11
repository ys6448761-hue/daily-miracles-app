/**
 * test-ai-gateway.js — AI Gateway + templateBank 단위 테스트
 *
 * 시나리오 1: 첫 사용자 — AI 호출 허용
 * 시나리오 2: 동일 요청 반복 — 캐시 히트
 * 시나리오 3: Day 2-6 메시지 — 템플릿 반환 (AI 0)
 * 시나리오 4: 한도 초과 — fallback 반환
 * 시나리오 5: 로그 이벤트 기록 확인
 *
 * 실행: node scripts/test-ai-gateway.js
 * (서버 불필요 — 직접 모듈 테스트)
 */

'use strict';

require('dotenv').config();

const aiGateway   = require('../services/aiGateway');
const templateBank = require('../services/messageTemplateBank');
const { resolve }  = require('../services/templates/templateResolver');
const db           = require('../database/db');

let passed = 0, failed = 0;

function ok(label, condition, detail = '') {
  if (condition) { console.log(`  ✅ ${label}`); passed++; }
  else           { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}

const crypto = require('crypto');
const TEST_USER_ID  = crypto.randomUUID();
const LIMIT_USER_ID = crypto.randomUUID();

async function main() {
  console.log('\n🤖 AI Gateway + Template Bank 테스트\n' + '═'.repeat(55));

  // ── 시나리오 3: Day 2-6 템플릿 (서버/OpenAI 불필요) ────────────────
  console.log('\n📋 시나리오 3: Day 2-6 메시지 → 템플릿 반환 (AI 0)');
  {
    const galaxies = ['healing', 'challenge', 'relation', 'growth', 'miracle'];
    for (const g of galaxies) {
      for (const d of [2, 3, 4, 5, 6]) {
        const daily  = templateBank.getDailyTemplate(g, d, '소원이');
        const wisdom = templateBank.getWisdomTemplate(g, d);
        ok(`${g} Day${d} daily 템플릿`, !!daily, `got: ${daily?.slice(0,20)}`);
        ok(`${g} Day${d} wisdom 템플릿`, !!wisdom, `got: ${wisdom?.slice(0,20)}`);
      }
    }
    const restart = templateBank.getRestartTemplate('healing', '소원이');
    ok('restart 템플릿', !!restart && restart.includes('소원이'), restart?.slice(0,30));
    const checkin = templateBank.getCheckinTemplate('challenge', '소원이');
    ok('checkin 템플릿', !!checkin && checkin.includes('소원이'), checkin?.slice(0,30));
  }

  // ── isTemplateEligible 검증 ─────────────────────────────────────────
  console.log('\n📋 템플릿 자격 결정 로직');
  {
    ok('Day 1 daily → AI 필요',      !templateBank.isTemplateEligible('daily', 1));
    ok('Day 2 daily → 템플릿 가능',   templateBank.isTemplateEligible('daily', 2));
    ok('Day 6 daily → 템플릿 가능',   templateBank.isTemplateEligible('daily', 6));
    ok('Day 7 daily → AI 필요',      !templateBank.isTemplateEligible('daily', 7));
    ok('Day 2 wisdom → 템플릿 가능',  templateBank.isTemplateEligible('wisdom', 2));
    ok('restart → 항상 템플릿',       templateBank.isTemplateEligible('restart', 99));
    ok('checkin → 항상 템플릿',       templateBank.isTemplateEligible('checkin', 99));
    ok('day1_origin → AI 필요',       !templateBank.isTemplateEligible('day1_origin', 1));
    ok('intervention → AI 필요',      !templateBank.isTemplateEligible('intervention', 3));
  }

  // ── DB 연결 확인 후 aiGateway 테스트 ───────────────────────────────
  console.log('\n📋 DB 연결 확인');
  let dbOk = false;
  try {
    await db.query('SELECT 1');
    dbOk = true;
    ok('DB 연결', true);
  } catch (e) {
    ok('DB 연결', false, e.message);
    console.log('  ⚠️  DB 없이 진행 가능한 테스트만 계속합니다');
  }

  if (dbOk) {
    // ── 시나리오 1: AI 호출 (실제 OpenAI 없이 mock) ─────────────────
    console.log('\n📋 시나리오 1: 첫 사용자 AI 호출 (mock modelFn)');
    {
      let modelCalled = false;
      const { text, source } = await aiGateway.call({
        userId:   TEST_USER_ID,
        service:  'wisdomGenerator',
        step:     'wisdom_day',
        wishText: '건강해지고 싶어요',
        modelFn: async () => {
          modelCalled = true;
          return { text: '오늘 한 걸음이 내일의 당신을 만듭니다.', model: 'gpt-4.1-mini', tokensIn: 50, tokensOut: 20 };
        },
        fallback: 'fallback text',
      });
      ok('AI 모델 호출됨', modelCalled);
      ok('source=ai', source === 'ai', `got: ${source}`);
      ok('text 반환', !!text, text?.slice(0,30));
    }

    // ── 시나리오 2: 동일 요청 → 캐시 히트 ──────────────────────────
    console.log('\n📋 시나리오 2: 동일 요청 반복 → 캐시 히트');
    {
      let modelCalled2 = false;
      const { text: t2, source: s2 } = await aiGateway.call({
        userId:   TEST_USER_ID,
        service:  'wisdomGenerator',
        step:     'wisdom_day',
        wishText: '건강해지고 싶어요',          // 동일 입력
        modelFn: async () => { modelCalled2 = true; return { text: '다른 텍스트', model: 'gpt-4.1-mini', tokensIn: 50, tokensOut: 20 }; },
        fallback: 'fallback text',
      });
      ok('AI 모델 재호출 없음', !modelCalled2, 'cache hit 기대');
      ok('source=cache', s2 === 'cache', `got: ${s2}`);
      ok('캐시된 text 동일', t2 === '오늘 한 걸음이 내일의 당신을 만듭니다.', t2?.slice(0,30));
    }

    // ── 시나리오 4: 한도 초과 → fallback ────────────────────────────
    console.log('\n📋 시나리오 4: 유저 호출 한도 초과 → fallback');
    {
      // 테스트용 별도 유저에게 한도 초과 상황 주입
      const limitUserId = LIMIT_USER_ID;
      const max = aiGateway.MAX_CALLS_PER_USER;

      // max 횟수만큼 fake 로그 삽입
      for (let i = 0; i < max; i++) {
        await db.query(
          `INSERT INTO dt_ai_calls (user_id, service_name, step, model, cache_hit, fallback_used, cost_krw)
           VALUES ($1, 'test', 'step', 'gpt-4.1-mini', false, false, 10)`,
          [limitUserId]
        );
      }

      let modelCalledLimit = false;
      const { text: tl, source: sl } = await aiGateway.call({
        userId:   limitUserId,
        service:  'wisdomGenerator',
        step:     'wisdom_new',
        wishText: '새 소원',
        modelFn: async () => { modelCalledLimit = true; return { text: 'AI text', model: 'gpt-4.1-mini', tokensIn: 10, tokensOut: 10 }; },
        fallback: 'fallback_text',
      });
      ok('한도 초과 시 AI 미호출', !modelCalledLimit);
      ok('source=fallback', sl === 'fallback', `got: ${sl}`);
      ok('fallback 텍스트 반환', tl === 'fallback_text', tl);
    }

    // ── 시나리오 5: 로그 이벤트 기록 확인 ───────────────────────────
    console.log('\n📋 시나리오 5: 로그 이벤트 기록');
    {
      const { rows } = await db.query(
        `SELECT service_name, step, cache_hit, fallback_used, cost_krw
         FROM dt_ai_calls WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3`,
        [TEST_USER_ID]
      );
      ok('dt_ai_calls 기록 존재', rows.length >= 2, `rows: ${rows.length}`);
      ok('ai_call 로그 (cache_hit=false)', rows.some(r => !r.cache_hit && !r.fallback_used));
      ok('cache_hit 로그 (cache_hit=true)', rows.some(r => r.cache_hit));
      console.log('     → 최근 로그:', rows.map(r => `${r.step}(cache=${r.cache_hit})`).join(', '));
    }

    // ── resolve() templateResolver 통합 ─────────────────────────────
    console.log('\n📋 templateResolver.resolve() 통합 검증');
    {
      // Day 4 daily → 반드시 템플릿
      const r1 = await resolve({
        userId: TEST_USER_ID, galaxy: 'growth', starName: '성장별', wishText: '성장하고 싶어요',
        service: 'careAgent', step: 'daily', day: 4,
        modelFn: async () => ({ text: 'AI text', model: 'gpt-4.1-mini', tokensIn: 10, tokensOut: 10 }),
        fallback: 'fallback',
      });
      ok('Day 4 daily → source=template', r1.source === 'template', `got: ${r1.source}`);
      ok('Day 4 daily text 존재', !!r1.text && r1.text.includes('성장별'), r1.text?.slice(0,30));

      // Day 1 wisdom → aiGateway
      const r2 = await resolve({
        userId: TEST_USER_ID, galaxy: 'healing', starName: '치유별', wishText: '쉬고 싶어요',
        service: 'wisdomGenerator', step: 'wisdom', day: 1,
        modelFn: async () => ({ text: 'AI wisdom text', model: 'gpt-4.1-mini', tokensIn: 30, tokensOut: 15 }),
        fallback: 'fallback wisdom',
      });
      ok('Day 1 wisdom → source=ai|cache|fallback', ['ai','cache','fallback'].includes(r2.source), `got: ${r2.source}`);
      ok('Day 1 wisdom text 존재', !!r2.text, r2.text?.slice(0,30));
    }

    // ── getStats 확인 ────────────────────────────────────────────────
    console.log('\n📋 통계 조회');
    {
      const stats = await aiGateway.getStats({ days: 1 });
      ok('getStats 반환', !!stats);
      ok('ai_calls 수치', parseInt(stats?.ai_calls ?? '0') >= 0);
      ok('cache_hits 수치', parseInt(stats?.cache_hits ?? '0') >= 0);
      console.log(`     → AI: ${stats?.ai_calls}, 캐시: ${stats?.cache_hits}, fallback: ${stats?.fallbacks}, 비용: ₩${parseFloat(stats?.total_cost_krw ?? 0).toFixed(0)}`);
    }

    // 테스트 데이터 정리
    await db.query(`DELETE FROM dt_ai_calls WHERE user_id IN ($1, $2)`, [TEST_USER_ID, LIMIT_USER_ID]).catch(() => {});
    await db.query(`DELETE FROM dt_ai_cache WHERE service = 'wisdomGenerator' AND step = 'wisdom_day'`).catch(() => {});
  }

  console.log('\n' + '═'.repeat(55));
  console.log(`결과: ✅ ${passed}개 통과 / ❌ ${failed}개 실패`);
  if (failed > 0) process.exit(1);
  await db.end?.().catch(() => {});
}

main().catch(e => { console.error('❌ 오류:', e.message); process.exit(1); });
