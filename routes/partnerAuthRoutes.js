'use strict';

/**
 * partnerAuthRoutes.js — 별들의 고향 파트너 어드민 인증 + 대시보드 API
 *
 * POST /api/partner/login          이메일+비밀번호 → JWT 발급 (7일)
 * POST /api/partner/logout         로그아웃 (클라이언트 토큰 폐기 지시)
 * GET  /api/partner/me             내 업체 정보 + 통계
 * GET  /api/partner/stars          별자리 현황 (내 업체 소속 별 목록)
 * POST /api/partner/generate-qr   QR 코드 생성
 * GET  /api/partner/qr-download   QR PNG 다운로드
 */

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const db      = require('../database/db');
const QRCode  = require('qrcode');

const JWT_SECRET  = process.env.PARTNER_JWT_SECRET || 'hometown-partner-dev-secret';
const JWT_EXPIRES = '7d';
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://app.dailymiracles.kr';

// ── JWT 인증 미들웨어 ───────────────────────────────────────────────────
function partnerAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  try {
    const payload  = jwt.verify(auth.slice(7), JWT_SECRET);
    req.partnerId  = payload.partner_id;
    req.accountId  = payload.account_id;
    req.partnerEmail = payload.email;
    return next();
  } catch {
    return res.status(401).json({ error: '로그인이 만료됐어요. 다시 로그인해주세요.' });
  }
}

// ── QR 코드 문자열 생성 헬퍼 ───────────────────────────────────────────
function makeQrCode(partnerId) {
  const prefix = partnerId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const rand   = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HT_${prefix}_${rand}`;
}

// ─────────────────────────────────────────────────────────────────────────
// POST /api/partner/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { login_id, email, password } = req.body;
  const identifier = (login_id || email || '').trim();

  console.log('[partner/login] 시도:', { identifier, hasPassword: !!password });

  if (!identifier || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }

  try {
    // login_id(DT-YS-C001 형식) 또는 email 둘 다 조회
    // login_id 컬럼이 없을 경우 fallback: email만 조회
    let r;
    try {
      r = await db.query(
        `SELECT pa.id, pa.partner_id, pa.email, pa.login_id, pa.password_hash, pa.is_active,
                p.name AS partner_name
           FROM partner_accounts pa
           JOIN dt_partners p ON p.id = pa.partner_id
          WHERE pa.login_id = $1 OR pa.email = $2
          LIMIT 1`,
        [identifier, identifier.toLowerCase()]
      );
    } catch (colErr) {
      // login_id 컬럼 미존재 시 email만으로 재시도
      console.warn('[partner/login] login_id 컬럼 없음, email 폴백:', colErr.message);
      r = await db.query(
        `SELECT pa.id, pa.partner_id, pa.email, pa.password_hash, pa.is_active,
                p.name AS partner_name
           FROM partner_accounts pa
           JOIN dt_partners p ON p.id = pa.partner_id
          WHERE pa.email = $1
          LIMIT 1`,
        [identifier.toLowerCase()]
      );
    }

    const account = r.rows[0];
    console.log('[partner/login] 계정 조회:', account ? `found — active=${account.is_active}` : 'not found');

    if (!account || !account.is_active) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않아요.' });
    }

    const valid = await bcrypt.compare(password, account.password_hash);
    console.log('[partner/login] 비밀번호 검증:', valid ? 'ok' : 'fail');
    if (!valid) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않아요.' });
    }

    // last_login_at 업데이트 (fire-and-forget)
    db.query(
      `UPDATE partner_accounts SET last_login_at = NOW() WHERE id = $1`,
      [account.id]
    ).catch(() => {});

    const token = jwt.sign(
      { partner_id: account.partner_id, account_id: account.id, email: account.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    console.log('[partner/login] 성공:', account.partner_name);
    return res.json({
      token,
      partner_id:   account.partner_id,
      partner_name: account.partner_name,
      email:        account.email,
    });

  } catch (err) {
    console.error('[partner/login] 오류:', err.message, err.stack);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.', detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/partner/logout
// ─────────────────────────────────────────────────────────────────────────
router.post('/logout', partnerAuth, (req, res) => {
  // JWT는 stateless — 클라이언트가 토큰을 삭제하면 로그아웃 완료
  return res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/partner/me
// 내 업체 정보 + 대시보드 통계
// ─────────────────────────────────────────────────────────────────────────
router.get('/me', partnerAuth, async (req, res) => {
  const { partnerId } = req;

  try {
    // 파트너 기본 정보
    const pR = await db.query(
      `SELECT id, name, address, description, hometown_star_count, hometown_qr_code
         FROM dt_partners WHERE id = $1`,
      [partnerId]
    );
    const partner = pR.rows[0];
    if (!partner) {
      return res.status(404).json({ error: '업체 정보를 찾을 수 없습니다.' });
    }

    // 방문 통계
    const statsR = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE visited_at >= CURRENT_DATE)                          AS today_visits,
         COUNT(*) FILTER (WHERE visited_at >= date_trunc('month', CURRENT_DATE))     AS month_visits,
         COUNT(*)                                                                     AS total_visits
         FROM hometown_visits
        WHERE partner_id = $1`,
      [partnerId]
    );
    const stats = statsR.rows[0] || {};

    return res.json({
      partner: {
        id:               partner.id,
        name:             partner.name,
        address:          partner.address,
        hometown_star_count: partner.hometown_star_count ?? 0,
        hometown_qr_code: partner.hometown_qr_code,
      },
      stats: {
        star_count:    partner.hometown_star_count ?? 0,
        today_visits:  Number(stats.today_visits  ?? 0),
        month_visits:  Number(stats.month_visits  ?? 0),
        total_visits:  Number(stats.total_visits  ?? 0),
        month_revenue: 0, // 별들의 고향 수익 정산 미구현
      },
    });

  } catch (err) {
    console.error('[partner/me] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/partner/stars
// 내 업체 소속 별 목록 (소원 내용 노출 없음)
// ─────────────────────────────────────────────────────────────────────────
router.get('/stars', partnerAuth, async (req, res) => {
  const { partnerId } = req;

  try {
    const r = await db.query(
      `SELECT id, star_name, hometown_confirmed_at, hometown_visit_count, hometown_last_visit_at
         FROM dt_stars
        WHERE hometown_partner_id = $1
        ORDER BY hometown_confirmed_at DESC`,
      [partnerId]
    );
    return res.json({ stars: r.rows });
  } catch (err) {
    console.error('[partner/stars] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/partner/generate-qr
// ─────────────────────────────────────────────────────────────────────────
router.post('/generate-qr', partnerAuth, async (req, res) => {
  const { partnerId } = req;

  try {
    const r = await db.query(
      `SELECT id, name, hometown_qr_code FROM dt_partners WHERE id = $1`,
      [partnerId]
    );
    const partner = r.rows[0];
    if (!partner) return res.status(404).json({ error: '업체를 찾을 수 없습니다.' });

    let qrCode = partner.hometown_qr_code;
    if (!qrCode) {
      qrCode = makeQrCode(partner.id);
      await db.query(
        `UPDATE dt_partners
            SET hometown_qr_code = $1, hometown_qr_generated_at = NOW()
          WHERE id = $2`,
        [qrCode, partner.id]
      );
    }

    const qrUrl = `${APP_BASE_URL}/hometown?partner=${qrCode}`;
    const qrImageBase64 = await QRCode.toDataURL(qrUrl, {
      width: 400, margin: 2,
      color: { dark: '#0D1B2A', light: '#FFFFFF' },
    });

    return res.json({ qr_code: qrCode, qr_url: qrUrl, qr_image_base64: qrImageBase64 });

  } catch (err) {
    console.error('[partner/generate-qr] 오류:', err);
    return res.status(500).json({ error: 'QR 생성 중 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/partner/qr-download
// ─────────────────────────────────────────────────────────────────────────
router.get('/qr-download', partnerAuth, async (req, res) => {
  const { partnerId } = req;

  try {
    const r = await db.query(
      `SELECT hometown_qr_code FROM dt_partners WHERE id = $1`,
      [partnerId]
    );
    const partner = r.rows[0];
    if (!partner) return res.status(404).json({ error: '업체를 찾을 수 없습니다.' });
    if (!partner.hometown_qr_code) {
      return res.status(400).json({ error: 'QR 코드가 아직 생성되지 않았습니다.' });
    }

    const qrUrl = `${APP_BASE_URL}/hometown?partner=${partner.hometown_qr_code}`;
    const buffer = await QRCode.toBuffer(qrUrl, {
      width: 600, margin: 3,
      color: { dark: '#0D1B2A', light: '#FFFFFF' },
    });

    res.set({
      'Content-Type':        'image/png',
      'Content-Disposition': `attachment; filename="hometown-qr-${partner.hometown_qr_code}.png"`,
    });
    return res.send(buffer);

  } catch (err) {
    console.error('[partner/qr-download] 오류:', err);
    return res.status(500).json({ error: 'QR 다운로드 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
