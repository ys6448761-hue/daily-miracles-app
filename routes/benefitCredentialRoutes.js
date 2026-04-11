/**
 * benefitCredentialRoutes.js — 모바일 이용권 (증명 시스템)
 *
 * POST /api/dt/credentials/issue               이용권 발급
 * GET  /api/dt/credentials/my                  내 이용권 목록 (?journey_id=)
 * GET  /api/dt/credentials/scan/:qrToken       QR 스캔 → 이용권 조회 (파트너)
 * GET  /api/dt/credentials/:code               이용권 조회 + QR 이미지 (사용자)
 * POST /api/dt/credentials/:code/verify        현장 QR 확인 → VERIFIED
 * POST /api/dt/credentials/:code/redeem        사용 완료 → REDEEMED
 * POST /api/dt/credentials/:code/manual-redeem PIN 인증 수동 완료 → REDEEMED
 *
 * SSOT: docs/ssot/core/DreamTown_Mobile_Credential_SSOT_v1.md
 */

'use strict';

const express         = require('express');
const router          = express.Router();
const crypto          = require('crypto');
const QRCode          = require('qrcode');
const db              = require('../database/db');
const { makeLogger }  = require('../utils/logger');
const messageProvider = require('../services/messageProvider');

const log = makeLogger('benefitCredentialRoutes');

// ── 상수 ─────────────────────────────────────────────────────────────
const DEFAULT_VALID_DAYS = 30;

// benefit_type → benefit_name, face_value 매핑
const BENEFIT_CATALOG = {
  cablecar:         { name: '해상케이블카 이용권',  face_value: 16000 },
  cruise:           { name: '유람선 이용권',        face_value: 13000 },
  yacht:            { name: '요트 이용권',          face_value: 35000 },
  fireworks_cruise: { name: '불꽃유람선 이용권',    face_value: 35000 },
  fireworks_yacht:  { name: '불꽃요트 이용권',      face_value: 55000 },
  aqua:             { name: '아쿠아플라넷 이용권',  face_value: 32000 },
  yeosu3pass:       { name: '여수3합 패스',         face_value: 15000 },
  moonlight:        { name: '달빛혜택 쿠폰',        face_value: 6000  },
};

// 은하군별 REDEEMED 토스트 메시지 (각 5종, 랜덤 선택)
const GALAXY_TOASTS = {
  challenge: [
    '한 걸음이 기록됐어요 ✨',
    '오늘의 도전이 별에 남았어요',
    '용기 있는 선택이었어요',
    '멈추지 않은 순간이 빛나요',
    '작은 전진이 시작이었어요',
  ],
  growth: [
    '조금 더 또렷해졌어요 🌱',
    '오늘의 성장이 기록되었어요',
    '한 겹 깊어졌어요',
    '새로운 시선이 열렸어요',
    '배움이 별로 남았어요',
  ],
  relation: [
    '오늘의 연결이 남았어요 🤝',
    '함께한 순간이 기록되었어요',
    '마음이 닿았어요',
    '관계의 결이 하나 더 쌓였어요',
    '연결의 흔적이 남았어요',
  ],
  healing: [
    '조용히 잘 지나왔어요 🌙',
    '오늘의 회복이 기록되었어요',
    '숨이 조금 편해졌어요',
    '충분히 잘 해냈어요',
    '마음이 조금 가벼워졌어요',
  ],
  miracle: [
    '방향 없이도 충분히 의미 있었어요 ✨',
    '선택 자체가 항로였어요',
    '오늘은 흐름이 길이었어요',
    '기적은 계획 밖에서 시작됐어요',
    '그냥 좋았던 순간이 남았어요',
  ],
};
const DEFAULT_TOASTS = ['이용이 완료됐어요 ✦'];

function pickToast(galaxy_code) {
  const pool = GALAXY_TOASTS[galaxy_code] ?? DEFAULT_TOASTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────
function generateCredentialCode() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BNF-${date}-${rand}`;
}

function generateQrToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function generateQrDataUrl(qrToken) {
  // QR 내용: 파트너가 스캔하면 scan API로 연결되는 URL
  const content = `${process.env.APP_BASE_URL || ''}/api/dt/credentials/scan/${qrToken}`;
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: { dark: '#0D1B2A', light: '#FFFFFF' },
  });
}

async function logCredentialAction(credentialId, action, actor = null, note = null) {
  await db.query(
    `INSERT INTO credential_logs (credential_id, action, actor, note)
     VALUES ($1, $2, $3, $4)`,
    [credentialId, action, actor, note]
  );
}

// ── POST /issue ───────────────────────────────────────────────────────
// 이용권 발급
// Body: { journey_id?, benefit_type, galaxy_code?, valid_days?, issued_from?, source_id?, phone? }
router.post('/issue', async (req, res) => {
  const { journey_id, benefit_type, galaxy_code, valid_days, issued_from, source_id, phone } = req.body ?? {};

  if (!benefit_type) return res.status(400).json({ error: 'benefit_type 필요' });

  const catalog = BENEFIT_CATALOG[benefit_type];
  if (!catalog) {
    return res.status(400).json({ error: `알 수 없는 benefit_type: ${benefit_type}` });
  }

  const code      = generateCredentialCode();
  const qrToken   = generateQrToken();
  const validDays = parseInt(valid_days, 10) || DEFAULT_VALID_DAYS;
  const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

  try {
    const result = await db.query(
      `INSERT INTO benefit_credentials
         (credential_code, journey_id, benefit_type, benefit_name, face_value,
          galaxy_code, qr_token, valid_until, issued_from, source_id, user_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        code, journey_id ?? null, benefit_type, catalog.name, catalog.face_value,
        galaxy_code ?? null, qrToken, validUntil,
        issued_from ?? 'manual', source_id ?? null, phone ?? null,
      ]
    );

    const credential = result.rows[0];
    await logCredentialAction(credential.id, 'issued', 'system');

    // benefit_issued 이벤트
    db.query(
      `INSERT INTO dt_events (event_name, params)
       VALUES ('benefit_issued', $1::jsonb)`,
      [JSON.stringify({ credential_code: code, benefit_type, journey_id, galaxy_code })]
    ).catch(() => {});

    log.info('credential issued', { code, benefit_type, journey_id });

    res.status(201).json({
      ok:              true,
      credential_code: credential.credential_code,
      benefit_name:    credential.benefit_name,
      face_value:      credential.face_value,
      status:          credential.status,
      valid_until:     credential.valid_until,
    });

  } catch (err) {
    log.error('issue 실패', { err: err.message });
    res.status(500).json({ error: '이용권 발급에 실패했습니다' });
  }
});

// ── GET /my ──────────────────────────────────────────────────────────
// 내 이용권 목록
// Query: journey_id (required)
router.get('/my', async (req, res) => {
  const { journey_id } = req.query;
  if (!journey_id) return res.status(400).json({ error: 'journey_id 필요' });

  try {
    const result = await db.query(
      `SELECT credential_code, benefit_type, benefit_name, face_value,
              galaxy_code, status, valid_from, valid_until, redeemed_at
       FROM benefit_credentials
       WHERE journey_id = $1
       ORDER BY created_at DESC`,
      [journey_id]
    );

    res.json({ ok: true, credentials: result.rows });
  } catch (err) {
    log.error('my 조회 실패', { err: err.message });
    res.status(500).json({ error: '이용권 조회에 실패했습니다' });
  }
});

// ── GET /scan/:qrToken ────────────────────────────────────────────────
// 파트너 QR 스캔 → 이용권 정보 반환
// (파트너 검증 화면: /partner/verify?token=xxx 에서 사용)
router.get('/scan/:qrToken', async (req, res) => {
  const { qrToken } = req.params;

  try {
    const result = await db.query(
      `SELECT id, credential_code, benefit_type, benefit_name, face_value,
              galaxy_code, status, valid_from, valid_until, verified_at, redeemed_at
       FROM benefit_credentials
       WHERE qr_token = $1`,
      [qrToken]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '이용권을 찾을 수 없습니다' });
    }

    const c = result.rows[0];
    const now = new Date();

    // 만료 자동 처리
    if (c.status === 'ISSUED' || c.status === 'ACTIVE') {
      if (new Date(c.valid_until) < now) {
        await db.query(
          `UPDATE benefit_credentials SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
          [c.id]
        );
        return res.json({ ok: false, status: 'EXPIRED', message: '유효기간이 지난 이용권입니다' });
      }
    }

    res.json({
      ok:               true,
      credential_code:  c.credential_code,
      benefit_type:     c.benefit_type,
      benefit_name:     c.benefit_name,
      face_value:       c.face_value,
      status:           c.status,
      valid_until:      c.valid_until,
      verified_at:      c.verified_at,
      redeemed_at:      c.redeemed_at,
      can_verify:       ['ISSUED', 'ACTIVE'].includes(c.status),
      can_redeem:       c.status === 'VERIFIED',
    });

  } catch (err) {
    log.error('scan 조회 실패', { err: err.message });
    res.status(500).json({ error: 'QR 스캔 처리에 실패했습니다' });
  }
});

// ── GET /:code ────────────────────────────────────────────────────────
// 사용자 이용권 조회 + QR 이미지 (data URL)
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const result = await db.query(
      `SELECT id, credential_code, benefit_type, benefit_name, face_value,
              galaxy_code, qr_token, status, valid_from, valid_until,
              verified_at, redeemed_at
       FROM benefit_credentials
       WHERE credential_code = $1`,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '이용권을 찾을 수 없습니다' });
    }

    const c = result.rows[0];

    // QR 이미지 생성 (ISSUED/ACTIVE/VERIFIED만)
    let qr_data_url = null;
    if (['ISSUED', 'ACTIVE', 'VERIFIED'].includes(c.status)) {
      qr_data_url = await generateQrDataUrl(c.qr_token);
    }

    // REDEEMED 시 토스트 메시지 반환 (프론트 표시용)
    const toast_message = c.status === 'REDEEMED'
      ? (GALAXY_TOAST[c.galaxy_code] ?? DEFAULT_TOAST)
      : null;

    res.json({
      ok:              true,
      credential_code: c.credential_code,
      benefit_type:    c.benefit_type,
      benefit_name:    c.benefit_name,
      face_value:      c.face_value,
      galaxy_code:     c.galaxy_code,
      status:          c.status,
      valid_from:      c.valid_from,
      valid_until:     c.valid_until,
      verified_at:     c.verified_at,
      redeemed_at:     c.redeemed_at,
      qr_data_url,
      toast_message,
    });

  } catch (err) {
    log.error('조회 실패', { code, err: err.message });
    res.status(500).json({ error: '이용권 조회에 실패했습니다' });
  }
});

// ── POST /:code/verify ────────────────────────────────────────────────
// 파트너: ISSUED/ACTIVE → VERIFIED
// Body: { partner_code, verified_by? }
router.post('/:code/verify', async (req, res) => {
  const { code } = req.params;
  const { partner_code, verified_by } = req.body ?? {};

  if (!partner_code) return res.status(400).json({ error: 'partner_code 필요' });

  try {
    const result = await db.query(
      `SELECT id, status, valid_until, benefit_type, galaxy_code, journey_id
       FROM benefit_credentials WHERE credential_code = $1`,
      [code]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: '이용권을 찾을 수 없습니다' });

    const c = result.rows[0];

    if (!['ISSUED', 'ACTIVE'].includes(c.status)) {
      return res.status(400).json({
        error: `현재 상태(${c.status})에서 검증할 수 없습니다`,
        status: c.status,
      });
    }

    if (new Date(c.valid_until) < new Date()) {
      await db.query(
        `UPDATE benefit_credentials SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
        [c.id]
      );
      return res.status(400).json({ error: '유효기간이 지난 이용권입니다', status: 'EXPIRED' });
    }

    await db.query(
      `UPDATE benefit_credentials
       SET status = 'VERIFIED', partner_code = $2, verified_by = $3,
           verified_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [c.id, partner_code, verified_by ?? null]
    );

    await logCredentialAction(c.id, 'verified', partner_code, verified_by);

    // benefit_verified 이벤트
    db.query(
      `INSERT INTO dt_events (event_name, params) VALUES ('benefit_verified', $1::jsonb)`,
      [JSON.stringify({ credential_code: code, benefit_type: c.benefit_type, partner_code })]
    ).catch(() => {});

    log.info('credential verified', { code, partner_code });

    res.json({ ok: true, status: 'VERIFIED', verified_at: new Date().toISOString() });

  } catch (err) {
    log.error('verify 실패', { code, err: err.message });
    res.status(500).json({ error: '검증 처리에 실패했습니다' });
  }
});

// ── POST /:code/redeem ────────────────────────────────────────────────
// 파트너: VERIFIED → REDEEMED
// Body: { partner_code }
router.post('/:code/redeem', async (req, res) => {
  const { code } = req.params;
  const { partner_code } = req.body ?? {};

  if (!partner_code) return res.status(400).json({ error: 'partner_code 필요' });

  try {
    const result = await db.query(
      `SELECT id, status, benefit_type, benefit_name, face_value, galaxy_code, journey_id, user_phone
       FROM benefit_credentials WHERE credential_code = $1`,
      [code]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: '이용권을 찾을 수 없습니다' });

    const c = result.rows[0];

    if (c.status === 'REDEEMED') {
      return res.status(400).json({ error: '이미 사용 완료된 이용권입니다', status: 'REDEEMED' });
    }

    if (c.status !== 'VERIFIED') {
      return res.status(400).json({
        error: `현재 상태(${c.status})에서 사용 완료 처리할 수 없습니다. 먼저 verify를 호출하세요.`,
        status: c.status,
      });
    }

    const redeemedAt = new Date();

    await db.query(
      `UPDATE benefit_credentials
       SET status = 'REDEEMED', redeemed_at = $2, updated_at = NOW()
       WHERE id = $1`,
      [c.id, redeemedAt]
    );

    await logCredentialAction(c.id, 'redeemed', partner_code);

    // benefit_redemptions 상세 로그
    db.query(
      `INSERT INTO benefit_redemptions
         (credential_id, partner_id, verified_at, redeemed_at, status)
       VALUES ($1, $2, NOW(), $3, 'completed')`,
      [c.id, partner_code, redeemedAt]
    ).catch(() => {});

    // benefit_redeemed 이벤트
    const toastMessage = pickToast(c.galaxy_code);
    db.query(
      `INSERT INTO dt_events (event_name, params) VALUES ('benefit_redeemed', $1::jsonb)`,
      [JSON.stringify({
        credential_code: code,
        benefit_type:    c.benefit_type,
        benefit_name:    c.benefit_name,
        face_value:      c.face_value,
        galaxy_code:     c.galaxy_code,
        journey_id:      c.journey_id,
        partner_code,
        toast_message:   toastMessage,
      })]
    ).catch(() => {});

    // 알림톡 발송 + 발송 로그 (fire-and-forget, 중복 발송 방지)
    if (c.user_phone) {
      (async () => {
        try {
          // 중복 발송 체크: 이미 sent 기록 있으면 스킵
          const dupCheck = await db.query(
            `SELECT id FROM message_dispatch_logs
             WHERE credential_id = $1 AND event_name = 'benefit_redeemed'
               AND delivery_status = 'sent'
             LIMIT 1`,
            [c.id]
          );
          if (dupCheck.rowCount > 0) {
            log.info('알림톡 중복 발송 차단', { code });
            return;
          }

          const templateKey  = `alimtalk_${c.galaxy_code ?? 'miracle'}`;
          const dispatchLogId = crypto.randomUUID();

          await db.query(
            `INSERT INTO message_dispatch_logs
               (id, journey_id, credential_id, event_name, channel_type,
                template_key, delivery_status)
             VALUES ($1, $2, $3, 'benefit_redeemed', 'alimtalk', $4, 'pending')`,
            [dispatchLogId, c.journey_id, c.id, templateKey]
          );

          const result = await messageProvider.sendBenefitRedeemedMessage(c.user_phone, {
            galaxy_code:  c.galaxy_code,
            benefit_name: c.benefit_name,
            credential_code: code,
          });

          await db.query(
            `UPDATE message_dispatch_logs
             SET delivery_status = $2, provider_response = $3, sent_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [dispatchLogId, result?.success ? 'sent' : 'failed', JSON.stringify(result ?? {})]
          );
        } catch (err) {
          log.error('알림톡 발송 실패', { code, err: err?.message });
        }
      })();
    }

    log.info('credential redeemed', { code, partner_code, benefit_type: c.benefit_type });

    res.json({
      ok:            true,
      status:        'REDEEMED',
      redeemed_at:   new Date().toISOString(),
      toast_message: toastMessage,
    });

  } catch (err) {
    log.error('redeem 실패', { code, err: err.message });
    res.status(500).json({ error: '사용 완료 처리에 실패했습니다' });
  }
});

// ── POST /:code/manual-redeem ─────────────────────────────────────────
// 파트너: PIN 인증 → 수동 REDEEMED (QR 스캔 불가 환경용)
// Body: { partner_code, partner_pin, manual_reason? }
router.post('/:code/manual-redeem', async (req, res) => {
  const { code } = req.params;
  const { partner_code, partner_pin, manual_reason } = req.body ?? {};

  if (!partner_code) return res.status(400).json({ error: 'partner_code 필요' });
  if (!partner_pin)  return res.status(400).json({ error: 'partner_pin 필요' });

  try {
    // ① 파트너 PIN 검증
    const pinHash = crypto.createHash('sha256').update(String(partner_pin)).digest('hex');

    // 연속 실패 5회 이상 시 1분 잠금
    const recentFails = await db.query(
      `SELECT COUNT(*) AS cnt FROM partner_pin_attempts
       WHERE partner_code = $1 AND failed_at > NOW() - INTERVAL '1 minute'`,
      [partner_code]
    );
    if (parseInt(recentFails.rows[0].cnt, 10) >= 5) {
      return res.status(429).json({ error: 'PIN 시도 횟수 초과. 잠시 후 다시 시도해주세요.' });
    }

    const partnerRow = await db.query(
      `SELECT id, pin_hash, is_active FROM partner_configs
       WHERE partner_code = $1`,
      [partner_code]
    );

    if (partnerRow.rowCount === 0 || !partnerRow.rows[0].is_active) {
      return res.status(403).json({ error: '등록되지 않은 파트너 코드입니다' });
    }

    if (partnerRow.rows[0].pin_hash !== pinHash) {
      // 실패 기록
      db.query(
        `INSERT INTO partner_pin_attempts (partner_code) VALUES ($1)`,
        [partner_code]
      ).catch(() => {});
      return res.status(403).json({ error: 'PIN이 일치하지 않아요', code: 'WRONG_PIN' });
    }

    // ② 이용권 조회
    const result = await db.query(
      `SELECT id, status, benefit_type, benefit_name, face_value,
              galaxy_code, journey_id, user_phone
       FROM benefit_credentials WHERE credential_code = $1`,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '이용권을 찾을 수 없어요', code: 'NOT_FOUND' });
    }

    const c = result.rows[0];

    if (c.status === 'REDEEMED') {
      return res.status(400).json({ error: '이미 사용 완료된 이용권입니다', status: 'REDEEMED' });
    }
    if (c.status === 'EXPIRED') {
      return res.status(400).json({ error: '유효기간이 지난 이용권이에요', status: 'EXPIRED' });
    }
    if (c.status === 'CANCELLED') {
      return res.status(400).json({ error: '취소된 이용권이에요', status: 'CANCELLED' });
    }
    if (!['ISSUED', 'ACTIVE', 'VERIFIED'].includes(c.status)) {
      return res.status(400).json({ error: `현재 상태(${c.status})에서 처리할 수 없어요`, status: c.status });
    }

    // 만료 체크
    const validCheck = await db.query(
      `SELECT valid_until FROM benefit_credentials WHERE id = $1`,
      [c.id]
    );
    if (new Date(validCheck.rows[0].valid_until) < new Date()) {
      await db.query(
        `UPDATE benefit_credentials SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
        [c.id]
      );
      return res.status(400).json({ error: '유효기간이 지난 이용권이에요', status: 'EXPIRED' });
    }

    // ③ REDEEMED 처리
    const redeemedAt = new Date();

    await db.query(
      `UPDATE benefit_credentials
       SET status = 'REDEEMED', redeemed_at = $2, partner_code = $3, updated_at = NOW()
       WHERE id = $1`,
      [c.id, redeemedAt, partner_code]
    );

    await logCredentialAction(c.id, 'redeemed', partner_code, `manual:${manual_reason ?? 'no_scanner'}`);

    // benefit_redemptions — verification_method = manual_pin
    db.query(
      `INSERT INTO benefit_redemptions
         (credential_id, partner_id, redeemed_at, status, verification_method, manual_reason)
       VALUES ($1, $2, $3, 'completed', 'manual_pin', $4)`,
      [c.id, partner_code, redeemedAt, manual_reason ?? 'no_scanner']
    ).catch(() => {});

    // dt_events
    const toastMessage = pickToast(c.galaxy_code);
    db.query(
      `INSERT INTO dt_events (event_name, params) VALUES ('benefit_redeemed', $1::jsonb)`,
      [JSON.stringify({
        credential_code:     code,
        benefit_type:        c.benefit_type,
        benefit_name:        c.benefit_name,
        galaxy_code:         c.galaxy_code,
        journey_id:          c.journey_id,
        partner_code,
        toast_message:       toastMessage,
        verification_method: 'manual_pin',
        manual_reason:       manual_reason ?? 'no_scanner',
      })]
    ).catch(() => {});

    // 알림톡 (중복 발송 방지 포함)
    if (c.user_phone) {
      (async () => {
        try {
          const dup = await db.query(
            `SELECT id FROM message_dispatch_logs
             WHERE credential_id = $1 AND event_name = 'benefit_redeemed'
               AND delivery_status = 'sent' LIMIT 1`,
            [c.id]
          );
          if (dup.rowCount > 0) return;

          const templateKey   = `alimtalk_${c.galaxy_code ?? 'miracle'}`;
          const dispatchLogId = crypto.randomUUID();

          await db.query(
            `INSERT INTO message_dispatch_logs
               (id, journey_id, credential_id, event_name, channel_type, template_key, delivery_status)
             VALUES ($1, $2, $3, 'benefit_redeemed', 'alimtalk', $4, 'pending')`,
            [dispatchLogId, c.journey_id, c.id, templateKey]
          );

          const result = await messageProvider.sendBenefitRedeemedMessage(c.user_phone, {
            galaxy_code:  c.galaxy_code,
            benefit_name: c.benefit_name,
            credential_code: code,
          });

          await db.query(
            `UPDATE message_dispatch_logs
             SET delivery_status = $2, provider_response = $3, sent_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [dispatchLogId, result?.success ? 'sent' : 'failed', JSON.stringify(result ?? {})]
          );
        } catch (err) {
          log.error('수동 알림톡 발송 실패', { code, err: err?.message });
        }
      })();
    }

    log.info('manual redeem', { code, partner_code, reason: manual_reason });

    res.json({
      ok:                  true,
      status:              'REDEEMED',
      redeemed_at:         redeemedAt.toISOString(),
      toast_message:       toastMessage,
      verification_method: 'manual_pin',
    });

  } catch (err) {
    log.error('manual-redeem 실패', { code, err: err.message });
    res.status(500).json({ error: '수동 처리에 실패했습니다' });
  }
});

module.exports = router;
