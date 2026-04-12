'use strict';

/**
 * credentialTriggerService.js — 결제완료 → benefit_credentials 자동 발급
 *
 * 공개 함수:
 *   issueOnNicepayPaid(moid, db)           NicePay PAID 콜백 후 호출
 *   issueOnVoyageConfirmed(booking, db)    Voyage payment/confirm 후 호출
 *
 * 설계 원칙:
 *   - 결제 성공 보장 최우선 — 이용권 발급 실패는 로그만 남기고 throw 안 함
 *   - DB 직접 삽입 (내부 HTTP 호출 금지 — 자기 자신 호출 시 포트 충돌 위험)
 *   - setImmediate로 결제 응답 흐름과 분리
 */

const crypto = require('crypto');
const db     = require('../database/db');

let sendSensSMS = null;
try { ({ sendSensSMS } = require('./messageProvider')); } catch (_) {}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 상수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const APP_BASE = process.env.APP_BASE_URL || 'https://app.dailymiracles.kr';
const DEFAULT_VALID_DAYS = 30;

const BENEFIT_CATALOG = {
  cablecar:         { name: '해상케이블카 이용권',  face_value: 16000 },
  cruise:           { name: '유람선 이용권',        face_value: 13000 },
  yacht:            { name: '요트 이용권',          face_value: 35000 },
  fireworks_cruise: { name: '불꽃유람선 이용권',    face_value: 35000 },
  fireworks_yacht:  { name: '불꽃요트 이용권',      face_value: 55000 },
  aqua:             { name: '아쿠아플라넷 이용권',  face_value: 32000 },
  yeosu3pass:       { name: '여수3합 패스',         face_value: 15000 },
  moonlight:        { name: '달빛혜택 쿠폰',        face_value: 6000  },
  voyage_pass:      { name: '소원항해 이용권',      face_value: 0     },
};

// goods_name 키워드 → benefit_type 매핑
const GOODS_NAME_MAP = [
  { keywords: ['케이블카', 'cable'],          type: 'cablecar'         },
  { keywords: ['아쿠아', 'aqua'],             type: 'aqua'             },
  { keywords: ['불꽃유람선'],                 type: 'fireworks_cruise' },
  { keywords: ['불꽃요트'],                   type: 'fireworks_yacht'  },
  { keywords: ['유람선', 'cruise'],           type: 'cruise'           },
  { keywords: ['요트', 'yacht'],              type: 'yacht'            },
  { keywords: ['3합', '여수3합', 'pass_3'],   type: 'yeosu3pass'       },
  { keywords: ['달빛', 'moonlight', 'dalbit'],type: 'moonlight'        },
];

function mapGoodsNameToBenefitType(goodsName) {
  if (!goodsName) return 'moonlight';
  const lower = goodsName.toLowerCase();
  for (const { keywords, type } of GOODS_NAME_MAP) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) return type;
  }
  return 'moonlight';   // 기본: 달빛혜택 쿠폰
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 내부 헬퍼
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateCredentialCode() {
  return 'TC-' + crypto.randomBytes(5).toString('hex').toUpperCase();
}

function generateQrToken() {
  return crypto.randomBytes(20).toString('hex');
}

async function insertCredential({ benefitType, journeyId, galaxyCode, issuedFrom, sourceId, phone, validDays }) {
  const catalog    = BENEFIT_CATALOG[benefitType] || BENEFIT_CATALOG.moonlight;
  const code       = generateCredentialCode();
  const qrToken    = generateQrToken();
  const vDays      = validDays ?? DEFAULT_VALID_DAYS;
  const validUntil = new Date(Date.now() + vDays * 86400 * 1000);

  const r = await db.query(
    `INSERT INTO benefit_credentials
       (credential_code, journey_id, benefit_type, benefit_name, face_value,
        galaxy_code, qr_token, valid_until, issued_from, source_id, user_phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING credential_code, benefit_name, face_value, valid_until`,
    [
      code, journeyId ?? null, benefitType, catalog.name, catalog.face_value,
      galaxyCode ?? null, qrToken, validUntil,
      issuedFrom ?? 'payment', sourceId ?? null, phone ?? null,
    ]
  );

  // 발급 이벤트 로그 (실패해도 무시)
  db.query(
    `INSERT INTO dt_events (event_name, params)
     VALUES ('benefit_issued', $1::jsonb)`,
    [JSON.stringify({ credential_code: code, benefit_type: benefitType, issued_from: issuedFrom, source_id: sourceId })]
  ).catch(() => {});

  return { ...r.rows[0], credential_code: code };
}

async function sendIssuedSMS(phone, credential) {
  if (!phone || !sendSensSMS) return;
  try {
    const ticketUrl = `${APP_BASE}/ticket/${credential.credential_code}`;
    const expiryDate = new Date(credential.valid_until).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const text = `[하루하루의 기적] 이용권이 발급됐어요!\n\n` +
                 `✦ ${credential.benefit_name}\n` +
                 `유효기간: ${expiryDate}까지\n\n` +
                 `모바일 이용권 확인:\n${ticketUrl}`;
    await sendSensSMS(phone, text);
  } catch (e) {
    console.warn('[credentialTrigger] SMS 발송 실패:', e.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public: NicePay PAID 훅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * NicePay 결제 완료 시 호출
 * nicepay_payments.goods_name → benefit_type 자동 매핑
 *
 * @param {string} moid  — nicepay_payments.order_id
 */
async function issueOnNicepayPaid(moid) {
  try {
    // 결제 정보 조회
    const pr = await db.query(
      `SELECT goods_name, amount FROM nicepay_payments WHERE order_id = $1 LIMIT 1`,
      [moid]
    );
    if (!pr.rows[0]) {
      console.warn('[credentialTrigger] NicePay moid 없음:', moid);
      return;
    }
    const { goods_name } = pr.rows[0];

    // DreamTown upgrade 결제는 이용권 발급 대상 아님
    if ((goods_name || '').includes('업그레이드') || (goods_name || '').includes('30일')) {
      console.log('[credentialTrigger] DreamTown 업그레이드 결제 — 이용권 발급 건너뜀');
      return;
    }

    // yeosu_wishes에서 phone 조회 (moid → order_id 매핑)
    let phone = null;
    try {
      const wr = await db.query(
        `SELECT phone FROM yeosu_wishes WHERE order_id = $1 LIMIT 1`,
        [moid]
      );
      phone = wr.rows[0]?.phone ?? null;
    } catch (_) {}

    const benefitType = mapGoodsNameToBenefitType(goods_name);
    const credential  = await insertCredential({
      benefitType,
      issuedFrom: 'nicepay',
      sourceId:   moid,
      phone,
    });

    console.log(`✅ [credentialTrigger] NicePay 이용권 발급 완료: ${credential.credential_code} (${benefitType}) ← ${moid}`);
    await sendIssuedSMS(phone, credential);
  } catch (err) {
    console.error('[credentialTrigger] issueOnNicepayPaid 실패 (결제에는 영향 없음):', err.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Public: Voyage 예약 확정 훅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Voyage payment/confirm 완료 시 호출
 *
 * @param {object} booking — voyage_bookings 레코드 { id, wish_id, phone, customer_name, ... }
 */
async function issueOnVoyageConfirmed(booking) {
  try {
    // 중복 방지: 같은 booking_id로 이미 발급된 게 있으면 건너뜀
    const dup = await db.query(
      `SELECT 1 FROM benefit_credentials
       WHERE issued_from = 'voyage' AND source_id = $1 LIMIT 1`,
      [booking.id]
    );
    if (dup.rows.length > 0) {
      console.log('[credentialTrigger] Voyage 이용권 이미 발급됨:', booking.id);
      return;
    }

    const credential = await insertCredential({
      benefitType: 'voyage_pass',
      journeyId:   booking.wish_id ?? null,
      issuedFrom:  'voyage',
      sourceId:    booking.id,
      phone:       booking.phone ?? null,
      validDays:   90,
    });

    console.log(`✅ [credentialTrigger] Voyage 이용권 발급 완료: ${credential.credential_code} ← booking ${booking.id}`);
    await sendIssuedSMS(booking.phone, credential);
  } catch (err) {
    console.error('[credentialTrigger] issueOnVoyageConfirmed 실패 (결제에는 영향 없음):', err.message);
  }
}

module.exports = {
  issueOnNicepayPaid,
  issueOnVoyageConfirmed,
  mapGoodsNameToBenefitType,   // 테스트/어드민용
};
