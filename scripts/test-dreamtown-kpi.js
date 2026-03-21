/**
 * test-dreamtown-kpi.js — DreamTown KPI 이벤트 연결 검증 스크립트
 *
 * 목적: dt_kpi_events 테이블에서 4개 이벤트의 실제 기록을 확인
 *
 * 실행: node scripts/test-dreamtown-kpi.js
 * 전제: DATABASE_URL 환경변수 설정 + migration 034 적용 완료
 */

'use strict';

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

const TARGET_EVENTS = [
  'resonance_created',
  'impact_created',
  'resonance_received',
  'connection_completed',
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('\n── DreamTown KPI 이벤트 검증 ──────────────────────────────');

    // 1. 테이블 존재 확인
    const tableCheck = await client.query(`
      SELECT table_name
        FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'dt_kpi_events'
    `);
    if (tableCheck.rowCount === 0) {
      console.error('❌ dt_kpi_events 테이블 없음 — migration 034를 먼저 실행하세요.');
      process.exit(1);
    }
    console.log('✅ dt_kpi_events 테이블 존재');

    // 2. 컬럼 구조 확인
    const colResult = await client.query(`
      SELECT column_name, data_type
        FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'dt_kpi_events'
       ORDER BY ordinal_position
    `);
    console.log('\n── 컬럼 구조 ─────────────────────────────────────────────');
    for (const col of colResult.rows) {
      console.log(`  ${col.column_name.padEnd(15)} ${col.data_type}`);
    }

    // 3. 이벤트별 집계
    const countResult = await client.query(`
      SELECT event_name, COUNT(*)::int AS cnt
        FROM dt_kpi_events
       GROUP BY event_name
       ORDER BY cnt DESC
    `);

    console.log('\n── 이벤트별 발생 수 ──────────────────────────────────────');
    const found = new Set(countResult.rows.map(r => r.event_name));

    for (const evt of TARGET_EVENTS) {
      const row = countResult.rows.find(r => r.event_name === evt);
      const cnt = row?.cnt ?? 0;
      const icon = cnt > 0 ? '✅' : '⚠️ ';
      const note = evt === 'connection_completed' && cnt === 0
        ? ' (TODO: emit 지점 미연결)'
        : '';
      console.log(`  ${icon} ${evt.padEnd(25)} ${cnt}건${note}`);
    }

    // 4. 최근 이벤트 샘플 (최대 5개)
    const sampleResult = await client.query(`
      SELECT event_name, star_id, source, extra, created_at
        FROM dt_kpi_events
       ORDER BY created_at DESC
       LIMIT 5
    `);

    if (sampleResult.rowCount === 0) {
      console.log('\n⚠️  기록된 이벤트 없음 — 공명 시나리오를 실행 후 재확인하세요.');
      console.log('   테스트: POST /api/resonance 호출 → resonance_created 확인');
    } else {
      console.log('\n── 최근 이벤트 샘플 ──────────────────────────────────────');
      for (const row of sampleResult.rows) {
        const ts = new Date(row.created_at).toLocaleString('ko-KR');
        const extra = row.extra ? JSON.stringify(row.extra) : '-';
        console.log(`  [${ts}] ${row.event_name} | star=${row.star_id?.slice(0, 8)}... | src=${row.source} | extra=${extra}`);
      }
    }

    // 5. 누락 이벤트 경고 (connection_completed 제외 — stub 허용)
    const required = TARGET_EVENTS.filter(e => e !== 'connection_completed');
    const missing  = required.filter(e => !found.has(e));
    if (missing.length > 0) {
      console.log('\n── 누락 이벤트 ────────────────────────────────────────────');
      for (const evt of missing) {
        console.warn(`  ❌ ${evt} — 아직 기록 없음. emit 지점 확인 필요.`);
      }
    }

    console.log('\n────────────────────────────────────────────────────────────\n');

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('스크립트 실패:', err.message);
  process.exit(1);
});
