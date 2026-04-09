/**
 * run-migration-069-070.js
 * 별들의 속삭임 + 팬덤 공명 + 연결 엔진 마이그레이션 실행
 *
 * 069: journey_logs에 growth_text, context_tag 추가
 * 070: journey_logs에 공명 컬럼 + resonance_exposures 테이블 생성
 * 071: connection_exposures 테이블 생성 (연결 단계 생애 1회)
 *
 * 실행: node scripts/run-migration-069-070.js
 */

'use strict';

require('dotenv').config();

const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 환경변수 미설정');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});

const MIGRATIONS = [
  '069_journey_logs_whisper_cols.sql',
  '070_resonance_engine.sql',
  '071_connection_exposures.sql',
  '072_recall_exposures.sql',
  '073_galaxy_signals.sql',
  '074_recommendation_exposures.sql',
  '075_connection_events.sql',
  '076_blend_whisper_exposures.sql',
  '077_benefit_credentials.sql',
  '078_benefit_credentials_phone.sql',
  '079_benefit_message_tables.sql',
  '080_credential_idempotency.sql',
  '081_partner_manual_mode.sql',
  '082_dt_settlements.sql',
  '083_settlement_dual_policy.sql',
  '084_dt_funnel_contexts.sql',
  '085_dt_stars_userid_nullable.sql',
  '086_benefit_engine.sql',
  '087_ai_call_tracking.sql',
  '088_ai_unlock_monetization.sql',
  '089_ab_experiment_assignments.sql',
  '090_agent_metrics.sql',
  '091_dreamtown_flow.sql',
  '092_star_profile.sql',
];

async function run() {
  const client = await pool.connect();
  try {
    for (const file of MIGRATIONS) {
      const sqlPath = path.join(__dirname, '../database/migrations', file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(`\n🚀 실행 중: ${file}`);
      await client.query(sql);
      console.log(`✅ 완료: ${file}`);
    }

    // 결과 확인
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'journey_logs'
        AND column_name IN ('growth_text','context_tag','is_shareable','resonance_used_count','last_resonated_at')
      ORDER BY column_name
    `);
    console.log('\n📋 journey_logs 추가 컬럼:');
    cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`));

    for (const tbl of ['resonance_exposures', 'connection_exposures']) {
      const tableCheck = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name = $1`,
        [tbl]
      );
      console.log(`\n📋 ${tbl} 테이블: ${tableCheck.rowCount > 0 ? '✅ 존재' : '❌ 없음'}`);
    }

  } catch (err) {
    console.error('\n❌ 마이그레이션 실패:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
