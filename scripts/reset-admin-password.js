'use strict';
/**
 * reset-admin-password.js
 * 사용: node scripts/reset-admin-password.js <location> <새비밀번호>
 * 예시: node scripts/reset-admin-password.js cablecar 1234
 *
 * DATABASE_URL 환경변수 필요
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function main() {
  const [,, location, rawPassword] = process.argv;

  if (!location || !rawPassword) {
    console.error('사용법: node scripts/reset-admin-password.js <location> <비밀번호>');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌  DATABASE_URL 환경변수 미설정');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  console.log(`\n🔑  비밀번호 리셋 — location: ${location}`);

  // 테이블 자동 생성 (migration 147 미실행 대비)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS location_admins (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      username   VARCHAR(50) NOT NULL UNIQUE,
      location   VARCHAR(50) NOT NULL,
      password   TEXT        NOT NULL,
      is_active  BOOLEAN     NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_location_admins_location ON location_admins (location)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_location_admins_username ON location_admins (username)`);

  // bcrypt 해시 생성
  console.log('  bcrypt 해시 생성 중...');
  const hashed = await bcrypt.hash(rawPassword, 10);
  console.log(`  해시 생성 완료 — 앞 10자: ${hashed.slice(0, 10)}...`);

  // UPSERT (location 기준)
  const upsertResult = await pool.query(`
    INSERT INTO location_admins (username, location, password, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (username)
    DO UPDATE SET password = EXCLUDED.password, updated_at = NOW()
    RETURNING id, username, location, updated_at
  `, [location, location, hashed]);

  const row = upsertResult.rows[0];
  console.log(`\n✅  업데이트 완료:`);
  console.log(`   id       : ${row.id}`);
  console.log(`   username : ${row.username}`);
  console.log(`   location : ${row.location}`);
  console.log(`   updated  : ${row.updated_at}`);

  // 검증 SELECT
  const verify = await pool.query(
    `SELECT id, username, location, LEFT(password, 10) AS pw_prefix,
            LENGTH(password) AS pw_length, is_active
     FROM location_admins WHERE location = $1`,
    [location]
  );
  const v = verify.rows[0];
  const pwType = v?.pw_prefix?.startsWith('$2b$') ? '✅ bcrypt' : '⚠️ 평문';
  console.log(`\n🔍  검증 SELECT:`);
  console.log(`   password  : ${v?.pw_prefix}... (${v?.pw_length}자) — ${pwType}`);
  console.log(`   is_active : ${v?.is_active}`);

  // 다른 관리자 영향 없음 확인
  const others = await pool.query(
    `SELECT username, location, updated_at FROM location_admins WHERE location != $1 LIMIT 5`,
    [location]
  );
  if (others.rows.length > 0) {
    console.log('\n📋  다른 관리자 계정 (변경 없음 확인):');
    for (const o of others.rows) {
      console.log(`   ${o.username} | ${o.location} | updated: ${o.updated_at}`);
    }
  } else {
    console.log('\n📋  다른 관리자 계정: 없음 (영향 0건 확인)');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  await pool.end();
}

main().catch(err => {
  console.error('❌  오류:', err.message);
  process.exit(1);
});
