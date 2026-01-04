/**
 * 여수 소원항해 견적 시스템 v2.0 - 스키마 마이그레이션
 *
 * 실행 방법:
 *   node database/run-quote-schema.js
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
  console.log('  여수 소원항해 견적 시스템 v2.0 스키마 마이그레이션');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 데이터베이스 연결
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
  });

  try {
    // 연결 테스트
    console.log('데이터베이스 연결 중...');
    const client = await pool.connect();
    console.log('데이터베이스 연결 성공');
    console.log('');

    // 스키마 파일 읽기
    const schemaPath = path.join(__dirname, 'quote_schema.sql');
    console.log(`스키마 파일 로드: ${schemaPath}`);

    if (!fs.existsSync(schemaPath)) {
      console.error('스키마 파일을 찾을 수 없습니다.');
      process.exit(1);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log(`스키마 파일 로드 완료 (${schemaSql.length} bytes)`);
    console.log('');

    // 스키마 실행
    console.log('스키마 마이그레이션 실행 중...');
    console.log('─────────────────────────────────────────────────────────────');

    await client.query(schemaSql);

    console.log('─────────────────────────────────────────────────────────────');
    console.log('스키마 마이그레이션 완료!');
    console.log('');

    // 테이블 확인
    console.log('생성된 테이블 확인:');
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (table_name LIKE 'quotes' OR table_name LIKE 'quote_%' OR table_name LIKE 'group_%')
      ORDER BY table_name
    `);

    for (const row of tableCheck.rows) {
      // 각 테이블의 행 수 확인
      const countResult = await client.query(`SELECT COUNT(*) FROM ${row.table_name}`);
      console.log(`   [OK] ${row.table_name} (${countResult.rows[0].count}행)`);
    }
    console.log('');

    // 뷰 확인
    console.log('생성된 뷰 확인:');
    const viewCheck = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name LIKE 'v_quotes_%'
      ORDER BY table_name
    `);

    for (const row of viewCheck.rows) {
      console.log(`   [VIEW] ${row.table_name}`);
    }
    console.log('');

    // 인덱스 확인
    console.log('생성된 유니크 인덱스:');
    const indexCheck = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE 'ux_%'
        AND (tablename LIKE 'quote%' OR tablename LIKE 'group%')
      ORDER BY tablename, indexname
    `);

    for (const row of indexCheck.rows) {
      console.log(`   [UNIQUE] ${row.indexname}`);
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  마이그레이션 완료!');
    console.log('');
    console.log('  생성된 테이블:');
    console.log('    - quotes              (견적의 진실 원본)');
    console.log('    - quote_events        (관측/대시보드)');
    console.log('    - group_inquiries     (단체 추가 정보)');
    console.log('    - quote_notifications (알림 발송 로그)');
    console.log('    - quote_price_versions(가격 버전 관리)');
    console.log('');
    console.log('  생성된 뷰:');
    console.log('    - v_quotes_today      (오늘의 견적)');
    console.log('    - v_quotes_hot_leads  (HOT 리드)');
    console.log('    - v_quotes_groups     (단체 현황)');
    console.log('');
    console.log('  핵심 원칙:');
    console.log('    [OK] 지역 확장: region_code 필드');
    console.log('    [OK] 가격 분리: cost/sell/list/margin');
    console.log('    [OK] 운영비 분리: operation_fee 별도');
    console.log('    [OK] 혜택 표시: benefits_display (차감 X)');
    console.log('═══════════════════════════════════════════════════════════');

    client.release();
  } catch (error) {
    console.error('');
    console.error('마이그레이션 실패:', error.message);
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
