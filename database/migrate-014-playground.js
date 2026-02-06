/**
 * Migration 014: 소원놀이터 (Playground Engine)
 *
 * 실행: node database/migrate-014-playground.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('═'.repeat(60));
    console.log('📦 Migration 014: 소원놀이터 시작');
    console.log('═'.repeat(60));

    // 마이그레이션 SQL 읽기
    const sqlPath = path.join(__dirname, 'migrations', '014_playground_engine.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 트랜잭션 시작
    await client.query('BEGIN');

    // SQL 실행
    await client.query(sql);

    await client.query('COMMIT');

    console.log('');
    console.log('✅ Migration 014 완료!');
    console.log('');
    console.log('생성된 테이블:');
    console.log('  - playground_users');
    console.log('  - artifacts');
    console.log('  - artifact_scores');
    console.log('  - artifact_reactions');
    console.log('  - shares');
    console.log('  - share_views');
    console.log('  - rewards');
    console.log('  - artifact_reports');
    console.log('  - user_badges');
    console.log('  - artifact_help_scores');
    console.log('');
    console.log('생성된 뷰:');
    console.log('  - v_feed_artifacts');
    console.log('');
    console.log('생성된 함수/트리거:');
    console.log('  - update_help_score()');
    console.log('  - trg_reaction_help_score');
    console.log('═'.repeat(60));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 실패:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
