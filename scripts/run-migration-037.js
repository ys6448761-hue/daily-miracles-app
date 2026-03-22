/**
 * Migration 037: dt_voyage_logs 테이블 생성
 * Usage: DATABASE_URL=... node scripts/run-migration-037.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 환경변수 미설정');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  const sql = fs.readFileSync(
    path.join(__dirname, '../database/migrations/037_voyage_logs.sql'),
    'utf8'
  );

  console.log('🚀 Migration 037 시작...');
  try {
    await pool.query(sql);
    console.log('✅ dt_voyage_logs 테이블 생성 완료');
    const { rows } = await pool.query(`
      SELECT column_name, data_type
        FROM information_schema.columns
       WHERE table_name = 'dt_voyage_logs'
       ORDER BY ordinal_position
    `);
    console.log('📋 컬럼 확인:', rows.map(r => `${r.column_name}(${r.data_type})`).join(', '));
  } catch (err) {
    console.error('❌ Migration 실패:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
