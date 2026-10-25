/**
 * run-migration-207.js
 * avg_stay_minutes DB 업데이트 V0.1
 *
 * Approved values (Founder Decision 2026-10-25):
 *   hamel_lighthouse : null → 30
 *   hyangiram        : 90  → 120
 *
 * 기본 모드: READ-ONLY PREFLIGHT (실제 DB 변경 없음)
 * 실행 모드: node scripts/run-migration-207.js --execute
 *
 * Safety:
 *   - PREFLIGHT: DB 연결 대상, 현재 값, 조건 매칭 여부만 확인
 *   - --execute: 조건이 정확히 일치할 때만 Migration 207 SQL 실행
 *   - 조건 불일치 시 ABORT (DB 변경 없음)
 *   - 트랜잭션 실패 시 전체 ROLLBACK
 *   - 재실행: idempotent skip (이미 목표값이면 UPDATE 0, 정상 종료)
 *   - 비밀값(DATABASE_URL) 출력 금지
 */

'use strict';

require('dotenv').config();

const { Pool } = require('pg');
const fs       = require('fs');
const path     = require('path');

// ── 실행 모드 ─────────────────────────────────────────────────────────────────
const EXECUTE_MODE = process.argv.includes('--execute');

// ── 목표값 (Founder Decision 2026-10-25) ──────────────────────────────────────
const TARGETS = [
  { code: 'hamel_lighthouse', from: null,  to: 30  },
  { code: 'hyangiram',        from: 90,    to: 120 },
];

// ── DB 연결 ───────────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 환경변수 미설정');
  process.exit(1);
}

const isLocal = process.env.DATABASE_URL.includes('localhost') ||
                process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// ── DB 대상 식별 (비밀값 미출력) ──────────────────────────────────────────────
function identifyDbTarget(url) {
  const hostMatch = url.match(/@([^:/?]+)/);
  const host = hostMatch ? hostMatch[1] : 'unknown';
  let provider = 'UNKNOWN';
  if (host.includes('supabase.co'))    provider = 'SUPABASE';
  else if (host.includes('render.com')) provider = 'RENDER_POSTGRES';
  else if (host.includes('localhost') || host.includes('127.0.0.1')) provider = 'LOCAL';
  else if (host.includes('neon.tech')) provider = 'NEON';
  // Show only domain suffix — never the full host (may contain project ref)
  const domainSuffix = host.split('.').slice(-3).join('.');
  return { provider, domainSuffix };
}

// ── Migration SQL 경로 ────────────────────────────────────────────────────────
const MIGRATION_FILE = path.join(__dirname, '../database/migrations/207_travel_places_stay_time_v01.sql');

async function main() {
  const mode = EXECUTE_MODE ? '🔴 EXECUTE' : '🟡 PREFLIGHT (READ-ONLY)';
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Migration 207 — avg_stay_minutes DB Update V0.1`);
  console.log(`Mode: ${mode}`);
  console.log(`${'='.repeat(60)}\n`);

  // ── DB 대상 확인 ────────────────────────────────────────────────────────────
  const { provider, domainSuffix } = identifyDbTarget(process.env.DATABASE_URL);
  console.log(`DB Target:`);
  console.log(`  Provider : ${provider}`);
  console.log(`  Domain   : *.${domainSuffix}`);

  if (provider === 'SUPABASE') {
    console.error('\n❌ ABORT: DATABASE_URL이 Supabase를 가리킵니다.');
    console.error('   Production DB는 Render PostgreSQL이어야 합니다.');
    console.error('   올바른 DATABASE_URL인지 확인 후 재실행하세요.');
    await pool.end();
    process.exit(1);
  }

  if (provider !== 'RENDER_POSTGRES' && provider !== 'LOCAL') {
    console.warn(`\n⚠️  WARNING: 알 수 없는 DB Provider(${provider}). 계속 진행합니다.`);
  }

  // ── Migration SQL 파일 존재 확인 ────────────────────────────────────────────
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`\n❌ ABORT: Migration 파일을 찾을 수 없습니다.`);
    console.error(`   ${MIGRATION_FILE}`);
    await pool.end();
    process.exit(1);
  }
  console.log(`\nMigration file: 207_travel_places_stay_time_v01.sql ✅`);

  const client = await pool.connect();
  try {
    // ── 사전 값 조회 ──────────────────────────────────────────────────────────
    console.log('\n── Pre-flight: Current DB values ──────────────────────────');
    const { rows: current } = await client.query(
      `SELECT code, avg_stay_minutes, updated_at
         FROM travel_places
        WHERE code = ANY($1::text[])
        ORDER BY code`,
      [TARGETS.map(t => t.code)]
    );

    if (current.length !== TARGETS.length) {
      const found = current.map(r => r.code);
      const missing = TARGETS.map(t => t.code).filter(c => !found.includes(c));
      console.error(`\n❌ ABORT: 대상 레코드를 찾을 수 없습니다: ${missing.join(', ')}`);
      process.exit(1);
    }

    let allMatch = true;
    for (const row of current) {
      const target = TARGETS.find(t => t.code === row.code);
      const currentVal = row.avg_stay_minutes;
      const expectedFrom = target.from;
      const matches = currentVal === expectedFrom ||
                      (currentVal === null && expectedFrom === null);
      const alreadyDone = currentVal === target.to;

      let status;
      if (alreadyDone) {
        status = `✅ ALREADY_AT_TARGET (${currentVal} = ${target.to}) — idempotent skip`;
      } else if (matches) {
        status = `✅ MATCHES (${currentVal === null ? 'NULL' : currentVal} → ${target.to})`;
      } else {
        status = `❌ MISMATCH (current=${currentVal === null ? 'NULL' : currentVal}, expected=${expectedFrom === null ? 'NULL' : expectedFrom})`;
        allMatch = false;
      }

      console.log(`  ${row.code.padEnd(20)} current=${String(currentVal === null ? 'NULL' : currentVal).padEnd(5)} ${status}`);
    }

    // 이미 모두 목표값이면 idempotent skip
    const allAlreadyDone = current.every(row => {
      const t = TARGETS.find(t => t.code === row.code);
      return row.avg_stay_minutes === t.to;
    });

    if (allAlreadyDone) {
      console.log('\n✅ IDEMPOTENT SKIP: 모든 레코드가 이미 목표값입니다. 실행 불필요.');
      console.log('   hamel_lighthouse = 30, hyangiram = 120');
      await client.release();
      await pool.end();
      process.exit(0);
    }

    if (!allMatch) {
      console.error('\n❌ ABORT: 사전 값 조건 불일치. Migration을 실행하지 않습니다.');
      console.error('   hamel_lighthouse은 NULL, hyangiram은 90이어야 합니다.');
      await client.release();
      await pool.end();
      process.exit(1);
    }

    // ── PREFLIGHT 전용 요약 ────────────────────────────────────────────────────
    if (!EXECUTE_MODE) {
      console.log('\n── PREFLIGHT Result ────────────────────────────────────────');
      console.log('  DB Provider  : ' + provider);
      console.log('  Records      : 2 found, conditions MATCH');
      console.log('  hamel        : NULL → 30  (UPDATE 1 예상)');
      console.log('  hyangiram    : 90   → 120 (UPDATE 1 예상)');
      console.log('  Transaction  : BEGIN/COMMIT (full rollback on error)');
      console.log('  Idempotent   : yes (WHERE IS NULL / WHERE = 90)');
      console.log('\n  ✅ PREFLIGHT PASS — 실행 준비 완료');
      console.log('  실제 실행: node scripts/run-migration-207.js --execute');
      console.log(`${'─'.repeat(60)}\n`);
      await client.release();
      await pool.end();
      process.exit(0);
    }

    // ── EXECUTE MODE ──────────────────────────────────────────────────────────
    console.log('\n── Execute: Running Migration 207 ──────────────────────────');
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    await client.query(sql);
    console.log('  Migration 207 SQL: COMMITTED');

    // ── 사후 검증 ─────────────────────────────────────────────────────────────
    console.log('\n── Post-flight: Verify final values ────────────────────────');
    const { rows: after } = await client.query(
      `SELECT code, avg_stay_minutes, updated_at
         FROM travel_places
        WHERE code = ANY($1::text[])
        ORDER BY code`,
      [TARGETS.map(t => t.code)]
    );

    let verified = true;
    for (const row of after) {
      const target = TARGETS.find(t => t.code === row.code);
      const ok = row.avg_stay_minutes === target.to;
      const mark = ok ? '✅' : '❌';
      console.log(`  ${mark} ${row.code.padEnd(20)} = ${row.avg_stay_minutes} (expected ${target.to})`);
      if (!ok) verified = false;
    }

    if (!verified) {
      console.error('\n❌ POST-FLIGHT FAIL: 최종 값이 예상과 다릅니다.');
      console.error('   롤백 SQL을 Evidence §8에서 확인하세요.');
      process.exit(1);
    }

    const ts = new Date().toISOString();
    console.log(`\n✅ Migration 207 COMPLETE`);
    console.log(`  hamel_lighthouse : NULL → 30`);
    console.log(`  hyangiram        : 90   → 120`);
    console.log(`  Completed at     : ${ts}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (err) {
    console.error('\n❌ Migration FAILED:', err.message);
    console.error('   트랜잭션이 ROLLBACK되었습니다. DB 상태 변경 없음.');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
