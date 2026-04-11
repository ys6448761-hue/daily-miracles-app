'use strict';

/**
 * partnerApplyService.js — 파트너 신청 + 자동 계정 생성
 *
 * submitApplication(data) → 심사 → 승인 시 계정 자동 생성 + SMS 발송
 */

const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const db       = require('../database/db');
const { evaluateApplication } = require('./auroraInterviewService');
const { sendSensSMS }         = require('./messageProvider');

// 은하 → dt_partners.category 매핑
const GALAXY_CATEGORY = {
  healing:      'cafe',
  relationship: 'restaurant',
  challenge:    'activity',
  growth:       'etc',
  miracle:      'etc',
};

// 은하 → 로그인 ID prefix
const GALAXY_TYPE_CODE = {
  healing:      'C',   // Calm
  relationship: 'R',   // Relation
  challenge:    'A',   // Action
  growth:       'G',   // Growth
  miracle:      'M',   // Miracle
};

// 여수 city_code (dt_regions.city_code)
const CITY_CODE = 'yeosu';

/**
 * 8자리 임시 비밀번호 생성 (영문 대소문자 + 숫자)
 */
function generateTempPassword() {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).padEnd(8, '0');
}

/**
 * 다음 순번 계산 — partner_accounts.login_id 패턴 기반
 * DT-YS-C001 → 다음 DT-YS-C002
 */
async function getNextLoginId(typeCode) {
  const prefix = `DT-YS-${typeCode}`;
  const result = await db.query(
    `SELECT login_id FROM partner_accounts
      WHERE login_id LIKE $1
      ORDER BY login_id DESC LIMIT 1`,
    [`${prefix}%`]
  );
  if (result.rowCount === 0) return `${prefix}001`;
  const last   = result.rows[0].login_id;           // DT-YS-C005
  const numStr = last.replace(prefix, '');           // '005'
  const next   = (parseInt(numStr, 10) || 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

/**
 * 승인된 신청서로 파트너 계정 생성
 * @returns {{ loginId: string, tempPw: string }}
 */
async function createPartnerAccount(application) {
  const typeCode = GALAXY_TYPE_CODE[application.q3_galaxy_choice] || 'C';
  const category = GALAXY_CATEGORY[application.q3_galaxy_choice]  || 'etc';
  const loginId  = await getNextLoginId(typeCode);
  const tempPw   = generateTempPassword();
  const pwHash   = await bcrypt.hash(tempPw, 10);
  const email    = `${loginId.toLowerCase()}@partner.dailymiracles.kr`;

  // 1. dt_partners 생성
  const partnerResult = await db.query(
    `INSERT INTO dt_partners (city_code, name, category, phone, description, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id`,
    [CITY_CODE, application.business_name, category, application.phone || null, application.q1_space_intro || null]
  );
  const partnerId = partnerResult.rows[0].id;

  // 2. partner_accounts 생성
  await db.query(
    `INSERT INTO partner_accounts
       (partner_id, email, password_hash, login_id, is_active,
        partner_tier, region_code, galaxy_type, terms_agreed)
     VALUES ($1, $2, $3, $4, true, 'branch', $5, $6, false)`,
    [partnerId, email, pwHash, loginId, application.region_code || 'KR_YEOSU', application.q3_galaxy_choice || null]
  );

  // 3. partner_applications 업데이트
  await db.query(
    `UPDATE partner_applications
        SET partner_id = $1, account_created_at = NOW(), decided_at = NOW()
      WHERE id = $2`,
    [loginId, application.id]   // partner_id VARCHAR 컬럼에 loginId 저장
  );

  return { loginId, tempPw, partnerId };
}

/**
 * 신청서 제출 + 즉시 심사
 */
async function submitApplication(data) {
  const {
    business_name, owner_name, phone, region_code = 'KR_YEOSU',
    q1_space_intro, q2_wish_connection, q3_galaxy_choice,
    q4_promise, q5_operations,
  } = data;

  // 심사
  const evalResult = evaluateApplication({
    q1_space_intro, q2_wish_connection, q3_galaxy_choice,
    q4_promise, q5_operations,
  });

  // DB 저장
  const { rows } = await db.query(
    `INSERT INTO partner_applications
       (business_name, owner_name, phone, region_code, motivation,
        q1_space_intro, q2_wish_connection, q3_galaxy_choice, q4_promise, q5_operations,
        aurora_score, aurora_verdict, aurora_reason, galaxy_assigned,
        status, decided_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
       CASE WHEN $12 != 'pending' THEN NOW() ELSE NULL END)
     RETURNING id, aurora_verdict, aurora_score`,
    [
      business_name, owner_name, phone, region_code,
      q1_space_intro?.slice(0, 200) || null,     // motivation 컬럼 재활용
      q1_space_intro, q2_wish_connection, q3_galaxy_choice,
      q4_promise, JSON.stringify(q5_operations || {}),
      evalResult.score, evalResult.verdict, evalResult.reason, evalResult.galaxy_assigned,
      evalResult.verdict === 'pending' ? 'pending' : (evalResult.verdict === 'approved' ? 'approved' : 'rejected'),
    ]
  );
  const application = { ...rows[0], business_name, owner_name, phone, region_code, q3_galaxy_choice, q1_space_intro };

  // 승인 → 계정 자동 생성 + SMS
  if (evalResult.verdict === 'approved') {
    try {
      const { loginId, tempPw } = await createPartnerAccount(application);
      application.loginId = loginId;
      application.tempPw  = tempPw;

      // SMS 발송 (알림톡 미등록 템플릿 대신 SMS)
      const smsText = [
        `[별들의 고향] 파트너 승인 안내`,
        `업체명: ${business_name}`,
        `로그인 ID: ${loginId}`,
        `임시 비밀번호: ${tempPw}`,
        `접속: app.dailymiracles.kr/partner/login`,
        `(첫 로그인 후 비밀번호 변경 권장)`,
      ].join('\n');
      await sendSensSMS(phone, smsText).catch(e =>
        console.warn('[partnerApply] SMS 발송 실패 (비치명):', e.message)
      );
    } catch (accErr) {
      console.error('[partnerApply] 계정 생성 실패:', accErr.message);
      // 계정 생성 실패해도 verdict는 approved로 유지 — 수동 처리
    }
  } else if (evalResult.verdict === 'rejected') {
    // 거절 SMS
    const smsText = [
      `[별들의 고향] 파트너 심사 결과`,
      `${business_name} 사장님, 신청해 주셔서 감사합니다.`,
      `이번에는 별들의 고향 파트너로 함께하기 어렵게 됐어요.`,
      `3개월 후 재신청 가능합니다.`,
    ].join('\n');
    await sendSensSMS(phone, smsText).catch(() => {});
  }

  return {
    application_id: application.id,
    verdict:        evalResult.verdict,
    score:          evalResult.score,
    loginId:        application.loginId || null,
  };
}

module.exports = { submitApplication };
