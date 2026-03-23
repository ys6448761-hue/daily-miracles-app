/**
 * DreamTown P0 Migration Runner
 * Usage: node scripts/run-dreamtown-migration.js
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

  const sqlPath = path.join(__dirname, '../database/migrations/029_dreamtown_p0.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 DreamTown P0 Migration 시작...');
  try {
    await pool.query(sql);
    console.log('✅ Migration 완료');

    const galaxies = await pool.query('SELECT code, name_ko FROM dt_galaxies ORDER BY sort_order');
    console.log('🌌 galaxies seed 확인:', galaxies.rows.map(r => `${r.code}(${r.name_ko})`).join(', '));
  } catch (err) {
    console.error('❌ Migration 실패:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
