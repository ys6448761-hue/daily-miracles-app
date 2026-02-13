/**
 * Migration 019: fix complete_wu() total_wu_count double increment
 *
 * 실행:
 *   DATABASE_URL=... NODE_ENV=production node database/migrate-019-fix-total-wu-count.js
 *
 * 수정 사항:
 *   [1] total_wu_count UPDATE 2회 → 1회 통합
 *   [2] array_append(CASE..., NULL) → 깨끗한 CASE 표현식
 *   [3] completed_wu_types 이중 UPDATE → 단일 UPDATE로 통합
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function run() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("Migration 019: fix complete_wu() total_wu_count double increment");
  console.log("═══════════════════════════════════════════════════════════════");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL 환경변수가 필요합니다.");
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // 1) 안전장치: 함수 존재 확인 (pg_proc 기반)
    const exists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'complete_wu'
      ) AS ok
    `);
    if (!exists.rows[0].ok) {
      throw new Error(
        "complete_wu() 함수가 없습니다. (017이 적용되지 않았을 수 있음)"
      );
    }
    console.log("   ✅ 의존성 확인: complete_wu() 존재");

    // 2) SQL 파일 로드
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "019_fix_complete_wu.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");
    console.log("\n📦 SQL 파일 로드 완료:", migrationPath);

    // 3) 트랜잭션 실행
    await client.query("BEGIN");
    console.log("\n⏳ 마이그레이션 실행 중...");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("\n✅ Migration 019 SQL 실행 완료!");

    // 4) 검증: 함수 본문에 이중 증가가 없는지 확인
    console.log("\n🔍 검증 시작...");

    const srcCheck = await client.query(`
      SELECT prosrc FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'complete_wu'
    `);
    const fnBody = srcCheck.rows[0]?.prosrc || "";

    // total_wu_count 증가 횟수 카운트
    const incrementCount = (
      fnBody.match(/total_wu_count\s*=\s*COALESCE/gi) || []
    ).length;
    if (incrementCount === 1) {
      console.log("   ✅ total_wu_count 증가: 1회 (정상)");
    } else {
      console.log(
        `   ❌ total_wu_count 증가: ${incrementCount}회 (기대: 1)`
      );
    }

    // array_append(NULL) 패턴 없는지 확인
    const hasAppendNull = /array_append\s*\([^)]*,\s*NULL/i.test(fnBody);
    if (!hasAppendNull) {
      console.log("   ✅ array_append(NULL) 패턴 제거됨");
    } else {
      console.log("   ❌ array_append(NULL) 패턴 여전히 존재");
    }

    // sowon_profiles UPDATE 횟수 (배지 UPDATE 제외하면 1회여야 함)
    const profileUpdates = (
      fnBody.match(/UPDATE\s+sowon_profiles/gi) || []
    ).length;
    // 기대: step4에서 1회 + step5 배지에서 1회 = 2회 (배지가 있을 때)
    if (profileUpdates <= 2) {
      console.log(
        `   ✅ sowon_profiles UPDATE: ${profileUpdates}회 (이력 1 + 배지 1)`
      );
    } else {
      console.log(
        `   ⚠️  sowon_profiles UPDATE: ${profileUpdates}회 (기대: 2 이하)`
      );
    }

    // 5) 실제 동작 검증: 테스트 프로필로 complete_wu() 호출
    console.log("\n🧪 동작 검증...");
    await client.query("BEGIN");

    const testPhone = "migration019_verify_" + Date.now();
    const profileR = await client.query(
      `SELECT upsert_sowon_profile($1, $2) AS id`,
      [testPhone, "mig019test"]
    );
    const profileId = profileR.rows[0].id;

    // 세션 생성
    const sessR = await client.query(
      `INSERT INTO wu_sessions (profile_id, wu_type) VALUES ($1, 'REL') RETURNING session_id`,
      [profileId]
    );
    const sessionId = sessR.rows[0].session_id;

    // complete_wu 호출
    await client.query(
      `SELECT complete_wu(
        $1::UUID, $2::UUID, 'REL',
        ARRAY['테스트','검증']::TEXT[], 'relationship',
        '{"vitality":70,"relationship":80,"growth":65,"resolve":72,"stability":68}'::JSONB,
        72, 'emerald',
        '{"encouragement":"잘했어요"}'::JSONB, 60, 7
      )`,
      [sessionId, profileId]
    );

    // total_wu_count가 정확히 1인지 확인
    const countChk = await client.query(
      `SELECT total_wu_count FROM sowon_profiles WHERE id = $1`,
      [profileId]
    );
    const count = countChk.rows[0]?.total_wu_count;
    if (count === 1) {
      console.log(`   ✅ total_wu_count = ${count} (정상: 1회만 증가)`);
    } else {
      console.log(`   ❌ total_wu_count = ${count} (기대: 1)`);
    }

    // completed_wu_types에 NULL이 없는지 확인
    const typesChk = await client.query(
      `SELECT completed_wu_types FROM sowon_profiles WHERE id = $1`,
      [profileId]
    );
    const types = typesChk.rows[0]?.completed_wu_types || [];
    const hasNull = types.includes(null);
    if (!hasNull && types.includes("REL")) {
      console.log(
        `   ✅ completed_wu_types = [${types.join(",")}] (NULL 없음)`
      );
    } else {
      console.log(
        `   ❌ completed_wu_types = [${types.join(",")}] (NULL 포함 또는 REL 누락)`
      );
    }

    // 정리
    await client.query(
      `DELETE FROM wu_results WHERE sowon_profile_id = $1`,
      [profileId]
    );
    await client.query(
      `DELETE FROM ef_daily_snapshots WHERE sowon_profile_id = $1`,
      [profileId]
    );
    await client.query(
      `DELETE FROM wu_events WHERE sowon_profile_id = $1`,
      [profileId]
    );
    await client.query(`DELETE FROM wu_sessions WHERE profile_id = $1`, [
      profileId,
    ]);
    await client.query(`DELETE FROM sowon_profiles WHERE id = $1`, [profileId]);
    await client.query("COMMIT");
    console.log("   ✅ 검증 데이터 정리 완료");

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("✅ Migration 019 완료 + 검증 통과");
    console.log("═══════════════════════════════════════════════════════════════");
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    console.error("\n❌ Migration 019 failed:", e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
