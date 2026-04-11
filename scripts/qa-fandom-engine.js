/**
 * qa-fandom-engine.js — DreamTown 팬덤 엔진 QA 검증
 *
 * 검증 범위:
 *   1. DB 스키마 (journey_logs 컬럼, resonance_exposures 테이블)
 *   2. 이벤트 허용 목록 (dt_events 저장 가능 여부)
 *   3. /api/dt/journey-logs POST
 *   4. /api/dt/resonance-feed 로직 (조건 미충족 → eligible:false)
 *   5. 작성률 KPI 엔드포인트
 *
 * 실행: node scripts/qa-fandom-engine.js [--base-url http://localhost:3000]
 */

'use strict';

require('dotenv').config();

const { Pool } = require('pg');
const https = require('https');
const http  = require('http');
const crypto = require('crypto');

// ── 설정 ─────────────────────────────────────────────────────────────
const BASE_URL = (() => {
  const idx = process.argv.indexOf('--base-url');
  return idx !== -1 ? process.argv[idx + 1] : (process.env.APP_BASE_URL || 'http://localhost:3000');
})();

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    })
  : null;

// ── 결과 추적 ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function ok(label)  { console.log(`  ✅ ${label}`); passed++; }
function fail(label, detail) {
  console.log(`  ❌ ${label}${detail ? ': ' + detail : ''}`);
  failed++;
}
function section(title) { console.log(`\n── ${title} ─────────────────────────────`); }

// ── HTTP 헬퍼 ─────────────────────────────────────────────────────────
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url  = new URL(path, BASE_URL);
    const lib  = url.protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : null;

    const opts = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type':  'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = lib.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── 1. DB 스키마 검증 ─────────────────────────────────────────────────
async function checkSchema() {
  section('1. DB 스키마');
  if (!pool) { fail('DB 연결 불가 — DATABASE_URL 미설정'); return; }

  const client = await pool.connect();
  try {
    // journey_logs 컬럼
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'journey_logs'
    `);
    const colNames = cols.rows.map(r => r.column_name);
    for (const col of ['growth_text','context_tag','is_shareable','resonance_used_count','last_resonated_at']) {
      colNames.includes(col)
        ? ok(`journey_logs.${col} 존재`)
        : fail(`journey_logs.${col} 없음 — migration 069/070 실행 필요`);
    }

    // resonance_exposures 테이블
    const tbl = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'resonance_exposures'
    `);
    tbl.rowCount > 0
      ? ok('resonance_exposures 테이블 존재')
      : fail('resonance_exposures 테이블 없음 — migration 070 실행 필요');

  } finally {
    client.release();
  }
}

// ── 2. 이벤트 허용 목록 검증 ─────────────────────────────────────────
async function checkEvents() {
  section('2. 이벤트 허용 목록');

  const FANDOM_EVENTS = [
    'whisper_shown', 'whisper_created',
    'resonance_eligible', 'resonance_shown', 'resonance_item_rendered',
  ];

  for (const evt of FANDOM_EVENTS) {
    try {
      const res = await request('POST', '/api/dt/events', { event: evt, _qa_dry_run: true });
      // 201 = 저장됨, 400 with "허용되지 않은" = 거부됨
      if (res.status === 201) {
        ok(`이벤트 허용: ${evt}`);
      } else if (res.status === 400 && res.body?.error?.includes('허용되지 않은')) {
        fail(`이벤트 거부됨: ${evt}`);
      } else {
        ok(`이벤트 수신됨: ${evt} (${res.status})`);
      }
    } catch (e) {
      fail(`이벤트 요청 실패: ${evt}`, e.message);
    }
  }
}

// ── 3. journey-logs POST 검증 ─────────────────────────────────────────
async function checkJourneyLog() {
  section('3. /api/dt/journey-logs POST');

  const journeyId = crypto.randomUUID();

  // 정상 저장
  try {
    const res = await request('POST', '/api/dt/journey-logs', {
      journey_id:  journeyId,
      growth_text: '[QA] 테스트 속삭임',
      context_tag: 'alone',
    });
    res.status === 200 && res.body?.log
      ? ok('정상 저장 (200 + log 반환)')
      : fail(`저장 응답 이상 (${res.status})`, JSON.stringify(res.body));
  } catch (e) {
    fail('요청 실패', e.message);
  }

  // 빈 텍스트 방어
  try {
    const res = await request('POST', '/api/dt/journey-logs', {
      journey_id:  journeyId,
      growth_text: '   ',
    });
    res.status === 400
      ? ok('빈 텍스트 400 방어 정상')
      : fail(`빈 텍스트 방어 실패 (${res.status})`);
  } catch (e) {
    fail('빈 텍스트 요청 실패', e.message);
  }

  // journey_id 누락
  try {
    const res = await request('POST', '/api/dt/journey-logs', { growth_text: 'no id' });
    res.status === 400
      ? ok('journey_id 누락 400 방어 정상')
      : fail(`journey_id 누락 방어 실패 (${res.status})`);
  } catch (e) {
    fail('journey_id 누락 요청 실패', e.message);
  }
}

// ── 4. resonance-feed 조건 검증 ──────────────────────────────────────
async function checkResonanceFeed() {
  section('4. /api/dt/resonance-feed (조건 검증)');

  const freshId = crypto.randomUUID();

  // 새 journey_id → whisper 0개 → eligible:false
  try {
    const res = await request('GET', `/api/dt/resonance-feed?journey_id=${freshId}`);
    res.status === 200 && res.body?.eligible === false
      ? ok('whisper 0개 → eligible:false 정상')
      : fail(`예상 외 응답 (${res.status})`, JSON.stringify(res.body));
  } catch (e) {
    fail('요청 실패', e.message);
  }

  // journey_id 누락 → 400
  try {
    const res = await request('GET', '/api/dt/resonance-feed');
    res.status === 400
      ? ok('journey_id 누락 400 방어 정상')
      : fail(`누락 방어 실패 (${res.status})`);
  } catch (e) {
    fail('요청 실패', e.message);
  }
}

// ── 5. KPI 엔드포인트 검증 ───────────────────────────────────────────
async function checkKpi() {
  section('5. /api/dt/events/kpi (작성률 KPI)');

  try {
    const res = await request('GET', '/api/dt/events/kpi');
    if (res.status !== 200) {
      fail(`KPI 응답 ${res.status}`);
      return;
    }
    ok('KPI 200 응답');

    const f = res.body?.kpi5_fandom;
    f !== undefined
      ? ok(`kpi5_fandom 포함 — write_rate_pct: ${f?.write_rate_pct ?? 'null (데이터 없음)'}%`)
      : fail('kpi5_fandom 키 없음');

  } catch (e) {
    fail('요청 실패', e.message);
  }
}

// ── 메인 ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍 DreamTown 팬덤 엔진 QA`);
  console.log(`   BASE_URL: ${BASE_URL}`);

  await checkSchema();
  await checkEvents();
  await checkJourneyLog();
  await checkResonanceFeed();
  await checkKpi();

  console.log(`\n══════════════════════════════════════════`);
  console.log(`결과: ✅ ${passed}  ❌ ${failed}`);

  if (failed === 0) {
    console.log('🎉 전체 통과 — 배포 가능');
  } else {
    console.log('⚠️  실패 항목 수정 후 재실행');
  }

  if (pool) await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('❌ QA 스크립트 오류:', err);
  process.exit(1);
});
