/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Migration 018: WU 세션 테이블 (DB SSOT)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 실행: DATABASE_URL=... node database/migrate-018-wu-sessions.js
 * 의존성: Migration 017 (sowon_profiles 테이블 필수)
 *
 * 생성되는 객체:
 *   테이블: wu_sessions (DB 세션 SSOT)
 *   함수:  expire_wu_sessions()
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Migration 018: WU 세션 테이블 시작');
  console.log('═══════════════════════════════════════════════════════════════');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 환경변수가 필요합니다.');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // 의존성 확인: sowon_profiles 테이블 존재 여부
    const depCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'sowon_profiles' AND table_schema = 'public'
      ) AS ok
    `);
    if (!depCheck.rows[0].ok) {
      throw new Error('sowon_profiles 테이블이 없습니다. Migration 017을 먼저 실행하세요.');
    }
    console.log('   ✅ 의존성 확인: sowon_profiles 존재');

    // SQL 파일 읽기
    const migrationPath = path.join(__dirname, 'migrations', '018_wu_sessions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('\n📦 SQL 파일 로드 완료:', migrationPath);

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 마이그레이션 실행
    console.log('\n⏳ 마이그레이션 실행 중...');
    await client.query(sql);

    // 커밋
    await client.query('COMMIT');
    console.log('\n✅ Migration 018 SQL 실행 완료!');

    // ─── 검증 ───────────────────────────────────────────────────────
    console.log('\n🔍 검증 시작...');

    // 1. 테이블 존재 확인
    const tblCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'wu_sessions' AND table_schema = 'public'
      ) AS ok
    `);
    console.log(`   ${tblCheck.rows[0].ok ? '✅' : '❌'} 테이블: wu_sessions`);
    if (!tblCheck.rows[0].ok) throw new Error('wu_sessions 테이블 생성 실패');

    // 2. 컬럼 확인
    const expectedCols = [
      'session_id', 'profile_id', 'wu_type', 'status',
      'current_question_idx', 'answer_count',
      'started_at', 'expires_at', 'completed_at',
      'share_id', 'risk_level',
    ];
    const colResult = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'wu_sessions' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    const actualCols = colResult.rows.map(r => r.column_name);
    for (const col of expectedCols) {
      const ok = actualCols.includes(col);
      console.log(`   ${ok ? '✅' : '❌'} 컬럼: ${col}`);
      if (!ok) throw new Error(`wu_sessions.${col} 컬럼 누락`);
    }

    // 3. 인덱스 확인
    const idxResult = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'wu_sessions' AND schemaname = 'public'
    `);
    console.log(`   📊 인덱스: ${idxResult.rows.length}개`);
    idxResult.rows.forEach(r => {
      console.log(`      - ${r.indexname}`);
    });

    // 4. expire_wu_sessions() 함수 확인
    const fnCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_name = 'expire_wu_sessions' AND routine_schema = 'public'
      ) AS ok
    `);
    console.log(`   ${fnCheck.rows[0].ok ? '✅' : '❌'} 함수: expire_wu_sessions()`);
    if (!fnCheck.rows[0].ok) throw new Error('expire_wu_sessions 함수 생성 실패');

    // 5. FK 제약 확인
    const fkCheck = await client.query(`
      SELECT COUNT(*) AS cnt FROM information_schema.table_constraints
      WHERE table_name = 'wu_sessions'
        AND constraint_type = 'FOREIGN KEY'
    `);
    console.log(`   🔗 FK 제약: ${fkCheck.rows[0].cnt}개 (기대: 1 → sowon_profiles)`);

    // 6. 기본값 확인 (expires_at = NOW() + 30min)
    const defCheck = await client.query(`
      SELECT column_default FROM information_schema.columns
      WHERE table_name = 'wu_sessions' AND column_name = 'expires_at'
    `);
    console.log(`   ⏱️  expires_at 기본값: ${defCheck.rows[0]?.column_default || 'N/A'}`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Migration 018 완료 + 검증 통과');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('\n❌ 마이그레이션 실패:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
