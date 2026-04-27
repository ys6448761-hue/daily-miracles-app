'use strict';
/**
 * diagnose-admin-password.js
 * 사용: node scripts/diagnose-admin-password.js
 *
 * DATABASE_URL 환경변수 필요 (Render 환경 또는 .env)
 */

require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌  DATABASE_URL 환경변수 미설정');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔬 관리자 계정 진단 — daily-miracles');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. location_admins 테이블 존재 확인
  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'location_admins'
    ) AS exists
  `);

  if (!tableCheck.rows[0].exists) {
    console.log('⚠️  location_admins 테이블 없음 — migration 147 미실행');
    console.log('   → migration 147 실행 후 다시 진단하세요.\n');
    await pool.end();
    process.exit(0);
  }
  console.log('✅  테이블: location_admins 확인됨\n');

  // 2. cablecar 관리자 조회
  const { rows } = await pool.query(`
    SELECT id, username, location, LEFT(password, 10) AS pw_prefix,
           LENGTH(password) AS pw_length, is_active, created_at
    FROM   location_admins
    WHERE  location = 'cablecar'
  `);

  if (rows.length === 0) {
    console.log('⚠️  location=cablecar 관리자 없음 — INSERT 필요\n');
    await pool.end();
    process.exit(0);
  }

  console.log(`📋  cablecar 관리자 (${rows.length}건):`);
  for (const r of rows) {
    const pwType = r.pw_prefix.startsWith('$2b$') || r.pw_prefix.startsWith('$2a$')
      ? '🔐 bcrypt 해시'
      : '⚠️  평문 (즉시 해시화 필요)';
    console.log(`
  id        : ${r.id}
  username  : ${r.username}
  location  : ${r.location}
  password  : ${r.pw_prefix}... (${r.pw_length}자) — ${pwType}
  is_active : ${r.is_active}
  created   : ${r.created_at}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  await pool.end();
}

main().catch(err => {
  console.error('❌  오류:', err.message);
  process.exit(1);
});
