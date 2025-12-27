/**
 * Aurora5 - Magic Link Service
 * 토큰 생성 및 결과 페이지 관리
 *
 * @version 1.0
 */

const crypto = require('crypto');
const db = require('../../database/db');

// 설정
const TOKEN_LENGTH = 32; // 64자 hex
const DEFAULT_EXPIRY_DAYS = 30; // 기본 30일 유효

/**
 * 안전한 토큰 생성
 * @returns {string} 64자 hex 토큰
 */
function generateToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * 추천 코드 생성 (짧은 형식)
 * @returns {string} REF-XXXXX 형식
 */
function generateRefCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외
  let code = 'REF-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 분석 결과 저장 및 매직 링크 생성
 * @param {Object} params
 * @param {number} params.inboxId - 인박스 ID
 * @param {Object} params.analysisJson - 분석 JSON
 * @param {string} params.analysisText - 요약 텍스트
 * @param {number} params.expiryDays - 만료일 (null = 무제한)
 */
async function createResult({ inboxId, analysisJson, analysisText, expiryDays = DEFAULT_EXPIRY_DAYS }) {
  const token = generateToken();

  // 만료 시간 계산
  let expiresAt = null;
  if (expiryDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
  }

  const result = await db.query(`
    INSERT INTO mvp_results (inbox_id, token, expires_at, analysis_json, analysis_text)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [inboxId, token, expiresAt, JSON.stringify(analysisJson), analysisText]);

  console.log(`🔗 Magic link created: ${token.substring(0, 8)}...`);

  return {
    ...result.rows[0],
    url: buildMagicUrl(token)
  };
}

/**
 * 매직 링크 URL 생성
 */
function buildMagicUrl(token) {
  const baseUrl = process.env.BASE_URL || 'https://daily-miracles.com';
  return `${baseUrl}/my-miracle/${token}`;
}

/**
 * 토큰으로 결과 조회
 * @param {string} token
 * @returns {Object|null} 결과 데이터
 */
async function getResultByToken(token) {
  const result = await db.query(`
    SELECT r.*, i.payload_norm, i.type
    FROM mvp_results r
    JOIN mvp_inbox i ON i.id = r.inbox_id
    WHERE r.token = $1
  `, [token]);

  if (result.rows.length === 0) {
    return null;
  }

  const data = result.rows[0];

  // 만료 체크
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { expired: true, expiresAt: data.expires_at };
  }

  return {
    expired: false,
    token: data.token,
    nickname: data.payload_norm?.nickname || '익명',
    type: data.type,
    analysis: data.analysis_json,
    analysisText: data.analysis_text,
    createdAt: data.created_at,
    expiresAt: data.expires_at
  };
}

/**
 * Trial(7일 여정) 생성
 * @param {Object} params
 * @param {number} params.inboxId
 * @param {string} params.token
 * @param {string} params.phone
 * @param {string} params.referredBy - 추천인 코드
 */
async function createTrial({ inboxId, token, phone, referredBy = null }) {
  const refCode = generateRefCode();

  // 다음 발송 시간 계산 (내일 오전 9시)
  const nextSendAt = getNextSendTime();

  const result = await db.query(`
    INSERT INTO trials (inbox_id, token, phone, active, start_at, last_day_sent, next_send_at, ref_code, referred_by)
    VALUES ($1, $2, $3, TRUE, NOW(), 0, $4, $5, $6)
    RETURNING *
  `, [inboxId, token, phone, nextSendAt, refCode, referredBy]);

  console.log(`🎫 Trial created: ${refCode} for ${phone}`);

  return result.rows[0];
}

/**
 * 다음 발송 시간 계산 (KST 09:00)
 */
function getNextSendTime() {
  const now = new Date();
  const kstOffset = 9 * 60; // KST = UTC+9

  // 현재 KST 시간
  const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
  const kstHour = kstNow.getUTCHours();

  // 다음 09:00 계산
  const nextSend = new Date(kstNow);
  nextSend.setUTCHours(9, 0, 0, 0);

  // 이미 9시가 지났으면 내일
  if (kstHour >= 9) {
    nextSend.setUTCDate(nextSend.getUTCDate() + 1);
  }

  // UTC로 변환
  return new Date(nextSend.getTime() - kstOffset * 60 * 1000);
}

/**
 * Trial 상태 업데이트 (Day 발송 후)
 */
async function updateTrialAfterSend(trialId, daySent) {
  const nextSendAt = getNextSendTime();

  await db.query(`
    UPDATE trials
    SET last_day_sent = $1, next_send_at = $2, updated_at = NOW()
    WHERE id = $3
  `, [daySent, nextSendAt, trialId]);

  // 7일 완료 시 비활성화
  if (daySent >= 7) {
    await db.query(`
      UPDATE trials SET active = FALSE, updated_at = NOW() WHERE id = $1
    `, [trialId]);
    console.log(`🏁 Trial ${trialId} completed!`);
  }
}

/**
 * 추천인 코드로 Trial 조회
 */
async function getTrialByRefCode(refCode) {
  const result = await db.query(`
    SELECT * FROM trials WHERE ref_code = $1
  `, [refCode]);
  return result.rows[0] || null;
}

/**
 * 발송 예정 Trial 목록 조회
 */
async function getTrialsToSend() {
  const result = await db.query(`
    SELECT t.*, r.analysis_json, i.payload_norm
    FROM trials t
    JOIN mvp_results r ON r.token = t.token
    JOIN mvp_inbox i ON i.id = t.inbox_id
    WHERE t.active = TRUE
      AND t.last_day_sent < 7
      AND t.next_send_at <= NOW()
    ORDER BY t.next_send_at ASC
  `);

  return result.rows;
}

module.exports = {
  generateToken,
  generateRefCode,
  createResult,
  buildMagicUrl,
  getResultByToken,
  createTrial,
  getNextSendTime,
  updateTrialAfterSend,
  getTrialByRefCode,
  getTrialsToSend
};
