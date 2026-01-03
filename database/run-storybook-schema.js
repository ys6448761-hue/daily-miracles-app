/**
 * Storybook E2E Commerce 스키마 마이그레이션
 *
 * 실행 방법:
 *   node database/run-storybook-schema.js
 *
 * 환경변수:
 *   DATABASE_URL - PostgreSQL 연결 문자열
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Storybook E2E Commerce 스키마 마이그레이션');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 데이터베이스 연결
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
  });

  try {
    // 연결 테스트
    console.log('📡 데이터베이스 연결 중...');
    const client = await pool.connect();
    console.log('✅ 데이터베이스 연결 성공');
    console.log('');

    // 스키마 파일 읽기
    const schemaPath = path.join(__dirname, 'storybook_schema.sql');
    console.log(`📄 스키마 파일 로드: ${schemaPath}`);

    if (!fs.existsSync(schemaPath)) {
      console.error('❌ 스키마 파일을 찾을 수 없습니다.');
      process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log(`✅ 스키마 파일 로드 완료 (${schemaSql.length} bytes)`);
    console.log('');

    // 스키마 실행
    console.log('🚀 스키마 마이그레이션 실행 중...');
    console.log('─────────────────────────────────────────────────────────────');

    await client.query(schemaSql);

    console.log('─────────────────────────────────────────────────────────────');
    console.log('✅ 스키마 마이그레이션 완료!');
    console.log('');

    // 테이블 확인
    console.log('📋 생성된 테이블 확인:');
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'storybook_%'
      ORDER BY table_name
    `);

    for (const row of tableCheck.rows) {
      // 각 테이블의 행 수 확인
      const countResult = await client.query(`SELECT COUNT(*) FROM ${row.table_name}`);
      console.log(`   ✓ ${row.table_name} (${countResult.rows[0].count}행)`);
    }
    console.log('');

    // 인덱스 확인
    console.log('🔑 생성된 유니크 인덱스 (중복 방지 핵심):');
    const indexCheck = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'ux_%'
        AND tablename LIKE 'storybook_%'
      ORDER BY tablename, indexname
    `);

    for (const row of indexCheck.rows) {
      console.log(`   🔒 ${row.indexname}`);
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  마이그레이션 완료!');
    console.log('');
    console.log('  생성된 테이블:');
    console.log('    - storybook_orders     (주문의 진실 원본)');
    console.log('    - storybook_jobs       (생성 워크플로우)');
    console.log('    - storybook_assets     (산출물 링크)');
    console.log('    - storybook_deliveries (전달 로그)');
    console.log('    - storybook_events     (관측/대시보드)');
    console.log('    - storybook_revisions  (크레딧 수정)');
    console.log('');
    console.log('  핵심 원칙:');
    console.log('    ✓ 유실 0: 모든 주문은 DONE 또는 FAIL_*로 종결');
    console.log('    ✓ 중복 0: order_id/payment_id + deliveries 유니크');
    console.log('    ✓ 관측 가능: events 테이블로 전체 추적');
    console.log('═══════════════════════════════════════════════════════════');

    client.release();
  } catch (error) {
    console.error('');
    console.error('💥 마이그레이션 실패:', error.message);
    console.error('');
    console.error('상세 오류:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 실행
runMigration().catch(console.error);
