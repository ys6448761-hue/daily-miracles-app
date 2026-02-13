#!/usr/bin/env node
/**
 * Staging WU Check — Aurora5 통합 엔진 스키마 + WU 세션 검증
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 실행:
 *   DATABASE_URL=... node scripts/ops/staging-wu-check.js
 *
 * 옵션:
 *   DB_SSL=1                // 강제 SSL
 *   DB_SSL_REJECT_UNAUTH=0  // self-signed 허용 (기본 false)
 *   DB_SCHEMA=public        // 기본 public
 *   DB_CLEANUP=1            // 기본 1 (테스트 데이터 삭제). 0이면 보존
 *
 * 검증 항목:
 *   G1. 테이블 존재 (5개)
 *   G2. 뷰 존재 (4개)
 *   G3. 함수 존재 (4개) — pg_proc 기반
 *   G4. 인덱스 존재 (총 개수 + 핵심 인덱스)
 *   G5. FK 제약 조건
 *   G6. upsert_sowon_profile() 동작 확인
 *   G7. wu_sessions CRUD 테스트
 *   G8. expire_wu_sessions() 함수 테스트
 *   G9. complete_wu() 함수 테스트
 *   G10. 데이터 정리 (테스트 데이터 삭제)
 */

const { Pool } = require("pg");

const DB_SCHEMA = process.env.DB_SCHEMA || "public";
const DB_SSL = process.env.DB_SSL === "1";
const DB_SSL_REJECT_UNAUTH = process.env.DB_SSL_REJECT_UNAUTH === "1"; // default false
const DB_CLEANUP = process.env.DB_CLEANUP !== "0"; // default true

function maskedDbUrl(url) {
  if (!url) return "NOT SET";
  return url.replace(/\/\/.*@/, "//***@");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: DB_SSL ? { rejectUnauthorized: DB_SSL_REJECT_UNAUTH } : false,
});

let passCount = 0;
let failCount = 0;

// phone_hash는 실제 유저값이 아니어야 함 (원문/실명 금지 원칙 준수)
const TEST_PHONE_HASH = "staging_test_" + Date.now();

function pass(label) {
  passCount++;
  console.log(`   ✅ ${label}`);
}

function fail(label, err) {
  failCount++;
  console.log(`   ❌ ${label}: ${err}`);
}

async function existsTable(client, name) {
  const r = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema=$1 AND table_name=$2
     ) AS ok`,
    [DB_SCHEMA, name]
  );
  return !!r.rows[0]?.ok;
}

async function existsView(client, name) {
  const r = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.views
       WHERE table_schema=$1 AND table_name=$2
     ) AS ok`,
    [DB_SCHEMA, name]
  );
  return !!r.rows[0]?.ok;
}

// information_schema.routines는 overload/권한/검색경로에 따라 애매할 수 있어 pg_proc가 더 확실
async function existsFunction(client, fnName) {
  const r = await client.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = $1 AND p.proname = $2
    ) AS ok
    `,
    [DB_SCHEMA, fnName]
  );
  return !!r.rows[0]?.ok;
}

async function run() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🔬 Staging WU Check — Aurora5 통합 엔진");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`   시각: ${new Date().toISOString()}`);
  console.log(`   DB: ${maskedDbUrl(process.env.DATABASE_URL)}`);
  console.log(`   SSL: ${DB_SSL ? `ON (rejectUnauthorized=${DB_SSL_REJECT_UNAUTH})` : "OFF"}`);
  console.log(`   Schema: ${DB_SCHEMA}`);
  console.log(`   Cleanup: ${DB_CLEANUP ? "ON" : "OFF"}`);
  console.log("");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL 환경변수가 필요합니다.");
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // ─── G1. 테이블 존재 (5개) ──────────────────────────────────────
    console.log("G1. 테이블 존재 확인");
    const tables = [
      "sowon_profiles",
      "wu_events",
      "wu_results",
      "ef_daily_snapshots",
      "wu_sessions",
    ];
    for (const tbl of tables) {
      (await existsTable(client, tbl)) ? pass(tbl) : fail(tbl, "테이블 없음");
    }

    // ─── G2. 뷰 존재 (4개) ──────────────────────────────────────────
    console.log("\nG2. 뷰 존재 확인");
    const views = [
      "v_sowon_dashboard",
      "v_wu_abandon_analysis",
      "v_wu_completion_stats",
      "v_ai_usage_daily",
    ];
    for (const vw of views) {
      (await existsView(client, vw)) ? pass(vw) : fail(vw, "뷰 없음");
    }

    // ─── G3. 함수 존재 (4개) ────────────────────────────────────────
    console.log("\nG3. 함수 존재 확인");
    const functions = [
      "upsert_sowon_profile",
      "update_profile_ef",
      "complete_wu",
      "expire_wu_sessions",
    ];
    for (const fn of functions) {
      (await existsFunction(client, fn)) ? pass(`${fn}()`) : fail(`${fn}()`, "함수 없음");
    }

    // ─── G4. 인덱스 확인 ────────────────────────────────────────────
    console.log("\nG4. 인덱스 확인");
    const idxResult = await client.query(
      `
      SELECT tablename, COUNT(*)::int AS cnt
      FROM pg_indexes
      WHERE schemaname = $1
        AND tablename = ANY($2::text[])
      GROUP BY tablename
      ORDER BY tablename
      `,
      [DB_SCHEMA, tables]
    );

    let totalIdx = 0;
    for (const row of idxResult.rows) {
      console.log(`   📊 ${row.tablename}: ${row.cnt}개`);
      totalIdx += row.cnt;
    }
    totalIdx >= 15 ? pass(`총 인덱스 ${totalIdx}개 (최소 15개)`) : fail(`총 인덱스 ${totalIdx}개`, "15개 미만");

    // ─── G5. FK 제약 조건 ───────────────────────────────────────────
    console.log("\nG5. FK 제약 확인");
    const fkResult = await client.query(
      `
      SELECT tc.table_name, tc.constraint_name, ccu.table_name AS ref_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
       AND tc.table_schema = ccu.table_schema
      WHERE tc.table_schema = $1
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ANY($2::text[])
      ORDER BY tc.table_name, tc.constraint_name
      `,
      [DB_SCHEMA, ["wu_events", "wu_results", "ef_daily_snapshots", "wu_sessions"]]
    );

    if (fkResult.rows.length === 0) {
      fail("FK", "제약 조건 없음");
    } else {
      for (const fk of fkResult.rows) {
        pass(`${fk.table_name} → ${fk.ref_table} (${fk.constraint_name})`);
      }
    }

    // ─── G6~G10 트랜잭션 테스트 ─────────────────────────────────────
    console.log("\nG6. upsert_sowon_profile() 동작 테스트");
    await client.query("BEGIN");
    let profileId = null;
    let sessionId = null;
    let expiredId = null;
    let resultId = null;

    try {
      // G6
      const upsertR = await client.query(
        `SELECT ${DB_SCHEMA}.upsert_sowon_profile($1, $2, $3) AS profile_id`,
        [TEST_PHONE_HASH, "staging테스트", "2000-01"]
      );
      profileId = upsertR.rows[0]?.profile_id;
      profileId ? pass(`프로필 생성: ${profileId}`) : fail("프로필 생성", "NULL 반환");

      const upsertR2 = await client.query(
        `SELECT ${DB_SCHEMA}.upsert_sowon_profile($1, $2) AS profile_id`,
        [TEST_PHONE_HASH, "staging테스트_업데이트"]
      );
      upsertR2.rows[0]?.profile_id === profileId
        ? pass("upsert 멱등성 확인")
        : fail("upsert 멱등성", `다른 ID: ${upsertR2.rows[0]?.profile_id}`);

      // ─── G7. wu_sessions CRUD ─────────────────────────────────────
      console.log("\nG7. wu_sessions CRUD 테스트");
      const sessR = await client.query(
        `
        INSERT INTO ${DB_SCHEMA}.wu_sessions (profile_id, wu_type)
        VALUES ($1, 'REL')
        RETURNING session_id, status, expires_at, current_question_idx
        `,
        [profileId]
      );
      sessionId = sessR.rows[0]?.session_id;

      sessR.rows[0]?.status === "active" ? pass(`세션 생성: ${sessionId}`) : fail("세션 생성", sessR.rows[0]?.status);
      sessR.rows[0]?.current_question_idx === 0 ? pass("초기 question_idx = 0") : fail("초기 idx", sessR.rows[0]?.current_question_idx);

      const expiresAt = new Date(sessR.rows[0]?.expires_at);
      const diffMin = (expiresAt - new Date()) / 60000;
      diffMin > 24 && diffMin < 35 ? pass(`TTL 30분: ${diffMin.toFixed(1)}분 후 만료`) : fail("TTL", `${diffMin.toFixed(1)}분`);

      await client.query(
        `
        UPDATE ${DB_SCHEMA}.wu_sessions
        SET current_question_idx = 3, answer_count = 3
        WHERE session_id = $1
        `,
        [sessionId]
      );
      const updR = await client.query(
        `SELECT current_question_idx, answer_count FROM ${DB_SCHEMA}.wu_sessions WHERE session_id = $1`,
        [sessionId]
      );
      updR.rows[0]?.current_question_idx === 3 ? pass("진행 업데이트 OK") : fail("진행 업데이트", JSON.stringify(updR.rows[0]));

      // ─── G8. expire_wu_sessions() ────────────────────────────────
      console.log("\nG8. expire_wu_sessions() 테스트");
      const expiredSessR = await client.query(
        `
        INSERT INTO ${DB_SCHEMA}.wu_sessions (profile_id, wu_type, expires_at)
        VALUES ($1, 'SELF_ST_TXT', NOW() - INTERVAL '1 minute')
        RETURNING session_id
        `,
        [profileId]
      );
      expiredId = expiredSessR.rows[0]?.session_id;

      const expireR = await client.query(`SELECT ${DB_SCHEMA}.expire_wu_sessions() AS cnt`);
      const expiredCnt = Number(expireR.rows[0]?.cnt || 0);
      expiredCnt >= 1 ? pass(`만료 처리: ${expiredCnt}개`) : fail("만료 처리", `${expiredCnt}개`);

      const expChk = await client.query(
        `SELECT status FROM ${DB_SCHEMA}.wu_sessions WHERE session_id = $1`,
        [expiredId]
      );
      expChk.rows[0]?.status === "expired" ? pass("만료 상태 확인") : fail("만료 상태", expChk.rows[0]?.status);

      const origChk = await client.query(
        `SELECT status FROM ${DB_SCHEMA}.wu_sessions WHERE session_id = $1`,
        [sessionId]
      );
      origChk.rows[0]?.status === "active" ? pass("기존 세션 유지 (active)") : fail("기존 세션", origChk.rows[0]?.status);

      // ─── G9. complete_wu() ───────────────────────────────────────
      console.log("\nG9. complete_wu() 테스트");
      const completeR = await client.query(
        `
        SELECT ${DB_SCHEMA}.complete_wu(
          $1::UUID,       -- session_id
          $2::UUID,       -- profile_id
          'REL',          -- wu_type
          ARRAY['관계','소통','신뢰']::TEXT[],  -- keywords
          'relationship', -- category
          '{"vitality":70,"relationship":80,"growth":65,"resolve":72,"stability":68}'::JSONB,
          72,             -- miracle_score
          'emerald',      -- energy_type
          '{"encouragement":"잘했어요","insight":"관계 성장중","next_wu_hint":"CAREER"}'::JSONB,
          180,            -- duration_sec
          7               -- answer_count
        ) AS result_id
        `,
        [sessionId, profileId]
      );
      resultId = completeR.rows[0]?.result_id;
      resultId ? pass(`WU 완료: result_id = ${resultId}`) : fail("WU 완료", "NULL 반환");

      const wrChk = await client.query(
        `SELECT keywords, category, miracle_score_at FROM ${DB_SCHEMA}.wu_results WHERE id = $1`,
        [resultId]
      );
      if (wrChk.rows.length > 0) {
        pass(`wu_results 기록 (keywords: ${(wrChk.rows[0].keywords || []).join(",")})`);
        wrChk.rows[0]?.miracle_score_at === 72 ? pass("miracle_score_at = 72") : fail("miracle_score_at", wrChk.rows[0]?.miracle_score_at);
      } else {
        fail("wu_results 기록", "행 없음");
      }

      const profChk = await client.query(
        `SELECT miracle_score, energy_type, total_wu_count FROM ${DB_SCHEMA}.sowon_profiles WHERE id = $1`,
        [profileId]
      );
      if (profChk.rows.length > 0) {
        profChk.rows[0]?.miracle_score === 72 ? pass("프로필 miracle_score = 72") : fail("프로필 miracle_score", profChk.rows[0]?.miracle_score);
        profChk.rows[0]?.energy_type === "emerald" ? pass("프로필 energy_type = emerald") : fail("프로필 energy_type", profChk.rows[0]?.energy_type);
        profChk.rows[0]?.total_wu_count >= 1 ? pass(`total_wu_count = ${profChk.rows[0]?.total_wu_count}`) : fail("total_wu_count", profChk.rows[0]?.total_wu_count);
      } else {
        fail("프로필 조회", "행 없음");
      }

      const badgeChk = await client.query(
        `SELECT badges FROM ${DB_SCHEMA}.sowon_profiles WHERE id = $1`,
        [profileId]
      );
      const earned = badgeChk.rows[0]?.badges?.earned || [];
      earned.length > 0 ? pass(`배지 ${earned.length}개 획득 (first_wu, REL_first)`) : fail("배지", "0개");

      const snapChk = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM ${DB_SCHEMA}.ef_daily_snapshots WHERE sowon_profile_id = $1`,
        [profileId]
      );
      snapChk.rows[0]?.cnt >= 1 ? pass(`EF 스냅샷: ${snapChk.rows[0]?.cnt}개`) : fail("EF 스냅샷", "0개");

      // ─── G10. Cleanup ────────────────────────────────────────────
      console.log("\nG10. 테스트 데이터 정리");
      if (DB_CLEANUP) {
        await client.query(`DELETE FROM ${DB_SCHEMA}.wu_results WHERE sowon_profile_id = $1`, [profileId]);
        await client.query(`DELETE FROM ${DB_SCHEMA}.ef_daily_snapshots WHERE sowon_profile_id = $1`, [profileId]);
        await client.query(`DELETE FROM ${DB_SCHEMA}.wu_events WHERE sowon_profile_id = $1`, [profileId]);
        await client.query(`DELETE FROM ${DB_SCHEMA}.wu_sessions WHERE profile_id = $1`, [profileId]);
        await client.query(`DELETE FROM ${DB_SCHEMA}.sowon_profiles WHERE id = $1`, [profileId]);
        pass("테스트 데이터 삭제 완료");
      } else {
        pass("Cleanup 스킵 (DB_CLEANUP=0)");
      }

      await client.query("COMMIT");
    } catch (testErr) {
      await client.query("ROLLBACK");
      throw testErr;
    }

    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log(`🏁 결과: ${passCount} PASS / ${failCount} FAIL`);
    if (failCount === 0) console.log("🎉 All checks passed!");
    else console.log(`⚠️  ${failCount}개 항목 실패 — 위 로그를 확인하세요.`);
    console.log("═══════════════════════════════════════════════════════════════");
  } finally {
    client.release();
    await pool.end();
  }

  process.exit(failCount > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
