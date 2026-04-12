'use strict';
/**
 * scripts/resetPartnerPasswords.js
 * 모든 active 파트너 비번을 dt1234로 일괄 변경
 *
 * 실행: node scripts/resetPartnerPasswords.js
 */

const bcrypt = require('bcryptjs');
const db     = require('../database/db');

async function resetAllPasswords() {
  console.log('🔑 파트너 비번 일괄 변경 시작 (→ dt1234)');

  const hash = await bcrypt.hash('dt1234', 10);
  console.log('✅ 해시 생성 완료:', hash.slice(0, 20) + '...');

  const result = await db.query(
    `UPDATE partner_accounts
     SET password_hash = $1, updated_at = NOW()
     WHERE is_active = TRUE`,
    [hash]
  );
  console.log(`✅ ${result.rowCount}개 파트너 비번 변경 완료\n`);

  const check = await db.query(
    `SELECT login_id, partner_tier, galaxy_type
     FROM partner_accounts
     WHERE is_active = TRUE
     ORDER BY login_id`
  );
  check.rows.forEach(r =>
    console.log(`  ✓ ${r.login_id}  (${r.galaxy_type ?? '-'} / ${r.partner_tier ?? '-'})`)
  );
  console.log(`\n총 ${check.rowCount}개 계정 — 로그인 비번: dt1234`);
}

resetAllPasswords().catch(console.error).finally(() => process.exit());
