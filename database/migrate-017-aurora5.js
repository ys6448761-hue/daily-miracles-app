/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Migration 017: Aurora5 통합 엔진 (Unified Engine)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 실행: DATABASE_URL=... node database/migrate-017-aurora5.js
 *
 * 생성되는 객체:
 *   테이블:  sowon_profiles, wu_events, wu_results, ef_daily_snapshots
 *   뷰:     v_sowon_dashboard, v_wu_abandon_analysis, v_wu_completion_stats, v_ai_usage_daily
 *   함수:   upsert_sowon_profile(), update_profile_ef(), complete_wu()
 *   FK:     trials.sowon_profile_id, wish_entries.sowon_profile_id
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
  console.log('Migration 017: Aurora5 통합 엔진 시작');
  console.log('═══════════════════════════════════════════════════════════════');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 환경변수가 필요합니다.');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // SQL 파일 읽기
    const migrationPath = path.join(__dirname, 'migrations', '017_aurora5_unified_engine.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('\n📦 SQL 파일 로드 완료:', migrationPath);

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 마이그레이션 실행
    console.log('\n⏳ 마이그레이션 실행 중...');
    await client.query(sql);

    // 커밋
    await client.query('COMMIT');
    console.log('\n✅ Migration 017 SQL 실행 완료!');

    // ─── 검증 ───────────────────────────────────────────────────────
    console.log('\n🔍 검증 시작...');

    // 1. 테이블 존재 확인
    const tables = ['sowon_profiles', 'wu_events', 'wu_results', 'ef_daily_snapshots'];
    for (const tbl of tables) {
      const r = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = $1 AND table_schema = 'public'
        ) AS ok`,
        [tbl]
      );
      const icon = r.rows[0].ok ? '✅' : '❌';
      console.log(`   ${icon} 테이블: ${tbl}`);
      if (!r.rows[0].ok) throw new Error(`테이블 ${tbl} 생성 실패`);
    }

    // 2. 뷰 존재 확인
    const views = ['v_sowon_dashboard', 'v_wu_abandon_analysis', 'v_wu_completion_stats', 'v_ai_usage_daily'];
    for (const vw of views) {
      const r = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.views
          WHERE table_name = $1 AND table_schema = 'public'
        ) AS ok`,
        [vw]
      );
      const icon = r.rows[0].ok ? '✅' : '❌';
      console.log(`   ${icon} 뷰: ${vw}`);
      if (!r.rows[0].ok) throw new Error(`뷰 ${vw} 생성 실패`);
    }

    // 3. 함수 존재 확인
    const functions = ['upsert_sowon_profile', 'update_profile_ef', 'complete_wu'];
    for (const fn of functions) {
      const r = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.routines
          WHERE routine_name = $1 AND routine_schema = 'public'
        ) AS ok`,
        [fn]
      );
      const icon = r.rows[0].ok ? '✅' : '❌';
      console.log(`   ${icon} 함수: ${fn}()`);
      if (!r.rows[0].ok) throw new Error(`함수 ${fn} 생성 실패`);
    }

    // 4. 인덱스 수 확인
    const idxResult = await client.query(`
      SELECT COUNT(*) AS cnt FROM pg_indexes
      WHERE schemaname = 'public'
        AND (tablename IN ('sowon_profiles', 'wu_events', 'wu_results', 'ef_daily_snapshots'))
    `);
    console.log(`   📊 Aurora5 인덱스: ${idxResult.rows[0].cnt}개`);

    // 5. FK 연결 확인 (trials, wish_entries)
    for (const tbl of ['trials', 'wish_entries']) {
      const r = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = $1 AND column_name = 'sowon_profile_id'
        ) AS ok`,
        [tbl]
      );
      if (r.rows[0].ok) {
        console.log(`   ✅ FK: ${tbl}.sowon_profile_id → sowon_profiles.id`);
      } else {
        console.log(`   ⚠️  ${tbl} 테이블 없음 또는 FK 미추가 (정상: 테이블 미존재 시 스킵)`);
      }
    }

    // 6. complete_wu() 파라미터 수 확인 (11개)
    const paramCheck = await client.query(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.parameters
      WHERE specific_schema = 'public'
        AND specific_name LIKE 'complete_wu%'
        AND parameter_mode = 'IN'
    `);
    console.log(`   📐 complete_wu() 파라미터: ${paramCheck.rows[0].cnt}개 (기대: 11)`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Migration 017 완료 + 검증 통과');
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
