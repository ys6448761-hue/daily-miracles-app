'use strict';

/**
 * hometownRoutes.js — 별들의 고향 (Hometown) API
 *
 * POST /api/hometown/arrive                  QR 스캔 → 고향 등록/방문 처리
 * POST /api/hometown/admin/generate-qr       QR 코드 생성 (관리자)
 * GET  /api/hometown/admin/:partnerId/stars  파트너 별 목록 + 통계 (관리자)
 * GET  /api/hometown/star/:starId            내 별 고향 정보
 * GET  /api/hometown/admin/:partnerId/qr-download  QR 이미지 다운로드 (관리자)
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const QRCode  = require('qrcode');

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://app.dailymiracles.kr';

let msg = null;
try {
  msg = require('../services/messageProvider');
} catch (e) {
  console.warn('[hometown] messageProvider 로드 실패:', e.message);
}

// ── 관리자 인증 미들웨어 ──────────────────────────────────────────────
function adminGuard(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN;
  // ADMIN_TOKEN 미설정 시 로컬 개발 환경으로 간주하여 통과
  if (!adminToken) return next();
  const provided = req.headers['x-admin-token'];
  if (!provided || provided !== adminToken) {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }
  return next();
}

// ── QR 코드 문자열 생성 헬퍼 ─────────────────────────────────────────
function generateQrCode(partnerId) {
  const prefix = partnerId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HT_${prefix}_${rand}`;
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/hometown/arrive
// Body: { partner_code, user_id? }
// ─────────────────────────────────────────────────────────────────────
router.post('/arrive', async (req, res) => {
  const { partner_code, user_id } = req.body;

  if (!partner_code) {
    return res.status(400).json({ error: 'partner_code가 필요합니다.' });
  }

  // ① 파트너 조회
  let partnerRow;
  try {
    const r = await db.query(
      `SELECT id, name, address, description, city_code, hometown_qr_code, hometown_star_count
         FROM dt_partners
        WHERE hometown_qr_code = $1 AND is_active = true
        LIMIT 1`,
      [partner_code]
    );
    partnerRow = r.rows[0];
  } catch (err) {
    console.error('[hometown/arrive] 파트너 조회 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }

  // ② 파트너 없으면 404
  if (!partnerRow) {
    return res.status(404).json({ error: '유효하지 않은 QR 코드입니다.' });
  }

  const partner = {
    id:          partnerRow.id,
    name:        partnerRow.name,
    address:     partnerRow.address,
    description: partnerRow.description,
  };

  // ③ user_id 없으면 로그인 필요
  if (!user_id) {
    return res.json({ status: 'need_login', partner });
  }

  // ④ 별 조회
  let starRow;
  try {
    const r = await db.query(
      `SELECT id, star_name, hometown_partner_id, hometown_visit_count, hometown_confirmed_at
         FROM dt_stars
        WHERE user_id = $1 AND is_hidden = false
        ORDER BY created_at DESC
        LIMIT 1`,
      [user_id]
    );
    starRow = r.rows[0];
  } catch (err) {
    console.error('[hometown/arrive] 별 조회 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }

  if (!starRow) {
    return res.json({ status: 'need_star', partner });
  }

  // ⑤ 고향 분기 처리 (트랜잭션)
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    let status;
    let visitCount;
    let isFirstVisit = false;

    if (!starRow.hometown_partner_id) {
      // 고향 없음 → 첫 방문 등록
      isFirstVisit = true;
      visitCount = 1;

      await client.query(
        `UPDATE dt_stars
            SET hometown_partner_id   = $1,
                hometown_confirmed_at = NOW(),
                hometown_visit_count  = 1,
                hometown_last_visit_at = NOW()
          WHERE id = $2`,
        [partnerRow.id, starRow.id]
      );

      await client.query(
        `INSERT INTO hometown_visits (star_id, partner_id, visit_number, is_first_visit)
         VALUES ($1, $2, 1, true)`,
        [starRow.id, partnerRow.id]
      );

      await client.query(
        `UPDATE dt_partners
            SET hometown_star_count = hometown_star_count + 1
          WHERE id = $1`,
        [partnerRow.id]
      );

      status = 'first_visit';

    } else if (starRow.hometown_partner_id === partnerRow.id) {
      // 동일 고향 재방문
      isFirstVisit = false;
      visitCount = (starRow.hometown_visit_count || 0) + 1;

      await client.query(
        `UPDATE dt_stars
            SET hometown_visit_count   = hometown_visit_count + 1,
                hometown_last_visit_at = NOW()
          WHERE id = $1`,
        [starRow.id]
      );

      await client.query(
        `INSERT INTO hometown_visits (star_id, partner_id, visit_number, is_first_visit)
         VALUES ($1, $2, $3, false)`,
        [starRow.id, partnerRow.id, visitCount]
      );

      status = 'revisit';

    } else {
      // 다른 파트너가 이미 고향으로 지정되어 있음
      await client.query('ROLLBACK');

      const origR = await db.query(
        `SELECT name, address FROM dt_partners WHERE id = $1`,
        [starRow.hometown_partner_id]
      );
      const orig = origR.rows[0] || {};

      return res.json({
        status: 'already_hometown',
        partner: { name: orig.name, address: orig.address },
        star:    { id: starRow.id, star_name: starRow.star_name },
      });
    }

    await client.query('COMMIT');

    // ⑥ first_visit 시 SMS/알림톡 발송
    if (isFirstVisit && msg && msg.isEnabled()) {
      try {
        const phoneR = await db.query(
          `SELECT phone_number
             FROM dt_voyage_schedule
            WHERE star_id = $1 AND phone_number IS NOT NULL
            LIMIT 1`,
          [starRow.id]
        );
        const phoneRow = phoneR.rows[0];

        if (phoneRow?.phone_number) {
          const phone = phoneRow.phone_number;
          const templateCode = process.env.SENS_HOMETOWN_TEMPLATE_CODE;

          if (templateCode) {
            await msg.sendSensAlimtalk(phone, {
              templateCode,
              star_name:    starRow.star_name,
              partner_name: partnerRow.name,
              partner_address: partnerRow.address,
            });
          } else {
            const smsText = `[하루하루의 기적] ${starRow.star_name}의 고향이 생겼어요!\n${partnerRow.name} (${partnerRow.address})\n별이 더 밝게 빛날 거예요 ✨`;
            await msg.sendSensSMS(phone, smsText);
          }
        }
      } catch (msgErr) {
        console.warn('[hometown/arrive] 메시지 발송 실패 (무시):', msgErr.message);
      }
    }

    return res.json({
      status,
      partner,
      star:          { id: starRow.id, star_name: starRow.star_name },
      visit_count:   visitCount,
      is_first_visit: isFirstVisit,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[hometown/arrive] 트랜잭션 오류:', err);
    return res.status(500).json({ error: '처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/hometown/admin/generate-qr
// Body: { partner_id }
// ─────────────────────────────────────────────────────────────────────
router.post('/admin/generate-qr', adminGuard, async (req, res) => {
  const { partner_id } = req.body;
  if (!partner_id) {
    return res.status(400).json({ error: 'partner_id가 필요합니다.' });
  }

  try {
    const r = await db.query(
      `SELECT id, name, hometown_qr_code FROM dt_partners WHERE id = $1`,
      [partner_id]
    );
    const partner = r.rows[0];
    if (!partner) {
      return res.status(404).json({ error: '파트너를 찾을 수 없습니다.' });
    }

    let qrCode = partner.hometown_qr_code;

    // QR 코드가 없으면 신규 생성
    if (!qrCode) {
      qrCode = generateQrCode(partner.id);
      await db.query(
        `UPDATE dt_partners
            SET hometown_qr_code = $1,
                hometown_qr_generated_at = NOW()
          WHERE id = $2`,
        [qrCode, partner.id]
      );
    }

    const qrUrl = `${APP_BASE_URL}/hometown?partner=${qrCode}`;
    const qrImageBase64 = await QRCode.toDataURL(qrUrl, {
      width:  400,
      margin: 2,
      color:  { dark: '#0D1B2A', light: '#FFFFFF' },
    });

    return res.json({
      qr_code:          qrCode,
      qr_url:           qrUrl,
      qr_image_base64:  qrImageBase64,
    });

  } catch (err) {
    console.error('[hometown/admin/generate-qr] 오류:', err);
    return res.status(500).json({ error: 'QR 생성 중 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/hometown/admin/:partnerId/stars
// ─────────────────────────────────────────────────────────────────────
router.get('/admin/:partnerId/stars', adminGuard, async (req, res) => {
  const { partnerId } = req.params;

  try {
    // 파트너 정보
    const pR = await db.query(
      `SELECT id, name, hometown_star_count, hometown_qr_code, hometown_qr_generated_at
         FROM dt_partners WHERE id = $1`,
      [partnerId]
    );
    const partner = pR.rows[0];
    if (!partner) {
      return res.status(404).json({ error: '파트너를 찾을 수 없습니다.' });
    }

    // 이 고향에 속한 별 목록 (소원 내용 제외)
    const starsR = await db.query(
      `SELECT id, star_name, hometown_confirmed_at, hometown_visit_count, hometown_last_visit_at
         FROM dt_stars
        WHERE hometown_partner_id = $1
        ORDER BY hometown_confirmed_at DESC`,
      [partnerId]
    );

    // 방문 통계
    const statsR = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE visited_at >= CURRENT_DATE) AS today_visits,
         COUNT(*) AS total_visits
         FROM hometown_visits
        WHERE partner_id = $1`,
      [partnerId]
    );
    const stats = statsR.rows[0] || { today_visits: 0, total_visits: 0 };

    return res.json({
      partner: {
        name:               partner.name,
        hometown_star_count: partner.hometown_star_count,
        hometown_qr_code:   partner.hometown_qr_code,
        qr_generated_at:    partner.hometown_qr_generated_at,
      },
      stars:        starsR.rows,
      today_visits: Number(stats.today_visits),
      total_visits: Number(stats.total_visits),
    });

  } catch (err) {
    console.error('[hometown/admin/:partnerId/stars] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/hometown/star/:starId
// ─────────────────────────────────────────────────────────────────────
router.get('/star/:starId', async (req, res) => {
  const { starId } = req.params;

  try {
    // 별 + 파트너 LEFT JOIN
    const r = await db.query(
      `SELECT
         s.id, s.star_name, s.hometown_partner_id,
         s.hometown_confirmed_at, s.hometown_visit_count,
         p.name    AS partner_name,
         p.address AS partner_address,
         p.description AS partner_description
         FROM dt_stars s
         LEFT JOIN dt_partners p ON p.id = s.hometown_partner_id
        WHERE s.id = $1`,
      [starId]
    );
    const row = r.rows[0];
    if (!row) {
      return res.status(404).json({ error: '별을 찾을 수 없습니다.' });
    }

    // 같은 고향의 다른 별들 (소원 내용 금지, 별 이름만, LIMIT 20)
    let constellation = [];
    if (row.hometown_partner_id) {
      const cR = await db.query(
        `SELECT id, star_name
           FROM dt_stars
          WHERE hometown_partner_id = $1
            AND id != $2
            AND is_hidden = false
          ORDER BY hometown_confirmed_at DESC
          LIMIT 20`,
        [row.hometown_partner_id, starId]
      );
      constellation = cR.rows;
    }

    return res.json({
      has_hometown: !!row.hometown_partner_id,
      partner: row.hometown_partner_id
        ? {
            name:        row.partner_name,
            address:     row.partner_address,
            description: row.partner_description,
          }
        : null,
      confirmed_at:  row.hometown_confirmed_at,
      visit_count:   row.hometown_visit_count,
      constellation,
    });

  } catch (err) {
    console.error('[hometown/star/:starId] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/hometown/admin/:partnerId/qr-download
// ─────────────────────────────────────────────────────────────────────
router.get('/admin/:partnerId/qr-download', adminGuard, async (req, res) => {
  const { partnerId } = req.params;

  try {
    const r = await db.query(
      `SELECT hometown_qr_code FROM dt_partners WHERE id = $1`,
      [partnerId]
    );
    const partner = r.rows[0];
    if (!partner) {
      return res.status(404).json({ error: '파트너를 찾을 수 없습니다.' });
    }
    if (!partner.hometown_qr_code) {
      return res.status(400).json({ error: 'QR 코드가 아직 생성되지 않았습니다.' });
    }

    const qrUrl = `${APP_BASE_URL}/hometown?partner=${partner.hometown_qr_code}`;
    const buffer = await QRCode.toBuffer(qrUrl, {
      width:  600,
      margin: 3,
      color:  { dark: '#0D1B2A', light: '#FFFFFF' },
    });

    res.set({
      'Content-Type':        'image/png',
      'Content-Disposition': `attachment; filename="hometown-qr-${partner.hometown_qr_code}.png"`,
    });
    return res.send(buffer);

  } catch (err) {
    console.error('[hometown/admin/:partnerId/qr-download] 오류:', err);
    return res.status(500).json({ error: 'QR 다운로드 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
