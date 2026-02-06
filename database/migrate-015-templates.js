/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Migration 015: 소원놀이터 템플릿 테이블
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 실행: node database/migrate-015-templates.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Migration 015: 소원놀이터 템플릿 시작');
  console.log('═══════════════════════════════════════════════════════════════');

  const client = await pool.connect();

  try {
    // 마이그레이션 SQL 파일 읽기
    const migrationPath = path.join(__dirname, 'migrations', '015_playground_templates.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📦 SQL 파일 로드 완료:', migrationPath);

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 마이그레이션 실행
    console.log('\n⏳ 마이그레이션 실행 중...');
    await client.query(sql);

    // 커밋
    await client.query('COMMIT');

    console.log('\n✅ Migration 015 완료!');

    // 결과 확인
    const templateCount = await client.query('SELECT COUNT(*) FROM playground_templates');
    console.log(`   - playground_templates: ${templateCount.rows[0].count}개 템플릿`);

    // 템플릿 목록 출력
    const templates = await client.query('SELECT template_key, title, category FROM playground_templates ORDER BY sort_order');
    console.log('\n📋 등록된 템플릿:');
    templates.rows.forEach((t, i) => {
      console.log(`   ${i + 1}. [${t.template_key}] ${t.title} (${t.category})`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ 마이그레이션 실패:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 실행
runMigration()
  .then(() => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('마이그레이션 완료');
    console.log('═══════════════════════════════════════════════════════════════');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
