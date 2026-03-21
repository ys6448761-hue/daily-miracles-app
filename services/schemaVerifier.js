/**
 * schemaVerifier.js — 서버 부팅 시 DB 스키마 자동 검증
 *
 * 목적: 코드-DB 불일치로 인한 운영 500 에러 사전 차단
 *
 * 동작:
 *   1. 필수 테이블 존재 확인
 *   2. 필수 컬럼 존재 확인
 *   3. 누락 시 → 에러 로그 + Slack 알림
 *   4. STRICT_SCHEMA=true → 누락 시 process.exit(1)
 *
 * SSOT: 체크 목록은 이 파일 REQUIRED_* 상수만 수정
 */

const db = require('../database/db');

// ── 체크 대상 (SSOT 고정) ─────────────────────────────────────────
const REQUIRED_TABLES = [
  'dt_wishes',
  'dt_stars',
  'resonance',
  'impact',
  'star_resonance_summary',
  'dt_kpi_events',
];

const REQUIRED_COLUMNS = [
  { table: 'dt_wishes', column: 'safety_level' },
  { table: 'dt_stars',  column: 'is_hidden' },
];
// ──────────────────────────────────────────────────────────────────

async function checkTables(missing) {
  const result = await db.query(`
    SELECT table_name
      FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1)
  `, [REQUIRED_TABLES]);

  const found = new Set(result.rows.map(r => r.table_name));

  for (const table of REQUIRED_TABLES) {
    if (!found.has(table)) {
      missing.push({ type: 'table', name: table });
    }
  }
}

async function checkColumns(missing) {
  if (REQUIRED_COLUMNS.length === 0) return;

  for (const { table, column } of REQUIRED_COLUMNS) {
    const result = await db.query(`
      SELECT 1
        FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name   = $1
         AND column_name  = $2
    `, [table, column]);

    if (result.rowCount === 0) {
      missing.push({ type: 'column', name: `${table}.${column}` });
    }
  }
}

async function notifySlack(missing) {
  const webhook = process.env.OPS_SLACK_WEBHOOK;
  if (!webhook) return;

  const lines = missing.map(m =>
    m.type === 'table'
      ? `• Missing table: \`${m.name}\``
      : `• Missing column: \`${m.name}\``
  );

  const text = [
    '🚨 *[Schema Verifier] DB 스키마 불일치 감지*',
    `환경: \`${process.env.NODE_ENV || 'unknown'}\``,
    '',
    ...lines,
    '',
    '→ 해당 migration 파일을 Render DB에 실행하세요.',
  ].join('\n');

  try {
    await fetch(webhook, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    });
  } catch (err) {
    console.error('[SchemaVerifier] Slack 알림 실패:', err.message);
  }
}

/**
 * verifySchema()
 *
 * @returns {Promise<{ ok: boolean, missing: Array<{type, name}> }>}
 */
async function verifySchema() {
  const missing = [];

  try {
    await checkTables(missing);
    await checkColumns(missing);
  } catch (err) {
    console.error('[SchemaVerifier] DB 쿼리 실패 — 검증 스킵:', err.message);
    // DB 연결 실패는 검증 실패로 처리하지 않음 (별도 에러로 처리됨)
    return { ok: true, missing: [] };
  }

  if (missing.length === 0) {
    console.log('✅ [SchemaVerifier] DB 스키마 검증 통과');
    return { ok: true, missing: [] };
  }

  // 누락 항목 로그
  console.error('\n╔══════════════════════════════════════════════════╗');
  console.error('║  ⚠️  [SchemaVerifier] DB 스키마 불일치 감지        ║');
  console.error('╠══════════════════════════════════════════════════╣');
  for (const m of missing) {
    const label = m.type === 'table' ? 'Missing table ' : 'Missing column';
    console.error(`║  ❌ ${label}: ${m.name.padEnd(37)}║`);
  }
  console.error('║                                                  ║');
  console.error('║  → migration 파일을 Render DB에 실행하세요        ║');
  console.error('╚══════════════════════════════════════════════════╝\n');

  // Slack 알림 (fire-and-forget)
  notifySlack(missing).catch(() => {});

  // STRICT_SCHEMA=true → 서버 부팅 차단
  const strict = process.env.STRICT_SCHEMA === 'true';
  if (strict) {
    console.error('[SchemaVerifier] STRICT_SCHEMA=true — 서버를 종료합니다.');
    process.exit(1);
  }

  return { ok: false, missing };
}

module.exports = { verifySchema };
