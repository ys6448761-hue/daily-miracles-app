'use strict';

/**
 * adminQRRoutes.js — 창립 파트너 QR 코드 생성 + 다운로드 센터
 *
 * GET  /admin/partner-qr-list              — 전체 파트너 + QR base64
 * GET  /admin/partner-qr/:id/download      — 개별 PNG 다운로드
 * GET  /admin/partner-qr/download-all      — 전체 ZIP 다운로드
 */

const router   = require('express').Router();
const QRCode   = require('qrcode');
const archiver = require('archiver');
const db       = require('../database/db');

const APP_BASE = process.env.APP_BASE_URL || 'https://app.dailymiracles.kr';

const QR_OPTIONS = {
  type:         'png',
  width:        512,
  margin:       2,
  color: {
    dark:  '#0D1B2A',
    light: '#FAFAFA',
  },
  errorCorrectionLevel: 'M',
};

function getQRUrl(partnerId) {
  return `${APP_BASE}/partner/verify?pid=${partnerId}`;
}

// 파트너 목록 공통 쿼리
async function fetchActivePartners() {
  const r = await db.query(
    `SELECT pa.login_id  AS partner_id,
            p.name       AS business_name,
            pa.galaxy_type,
            pa.partner_tier,
            pa.is_active,
            pa.created_at
     FROM   partner_accounts pa
     JOIN   dt_partners p ON p.id = pa.partner_id
     WHERE  pa.is_active = true
     ORDER  BY pa.created_at ASC`
  );
  return r.rows;
}

// ─── 전체 목록 + QR base64 ────────────────────────────────────────
router.get('/partner-qr-list', async (req, res) => {
  try {
    const partners = await fetchActivePartners();

    const result = await Promise.all(partners.map(async (p) => {
      const url      = getQRUrl(p.partner_id);
      const qrBase64 = await QRCode.toDataURL(url, {
        ...QR_OPTIONS, type: 'image/png',
      });
      return {
        partner_id:   p.partner_id,
        business_name: p.business_name,
        galaxy_type:  p.galaxy_type,
        partner_tier: p.partner_tier,
        qr_image:     qrBase64,
        scan_url:     url,
      };
    }));

    return res.json({ partners: result, total: result.length });
  } catch (err) {
    console.error('[admin/partner-qr-list]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── 개별 PNG 다운로드 ────────────────────────────────────────────
router.get('/partner-qr/:id/download', async (req, res) => {
  try {
    const partnerId = req.params.id;

    // 파트너 이름 조회
    const r = await db.query(
      `SELECT p.name AS business_name
       FROM   partner_accounts pa
       JOIN   dt_partners p ON p.id = pa.partner_id
       WHERE  pa.login_id = $1 AND pa.is_active = true
       LIMIT 1`,
      [partnerId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: '파트너를 찾을 수 없어요' });

    const { business_name } = r.rows[0];
    const url      = getQRUrl(partnerId);
    const qrBuffer = await QRCode.toBuffer(url, QR_OPTIONS);
    const fileName = `QR_${partnerId}_${business_name}.png`;

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    return res.send(qrBuffer);
  } catch (err) {
    console.error('[admin/partner-qr/download]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── 전체 ZIP 다운로드 ────────────────────────────────────────────
router.get('/partner-qr/download-all', async (req, res) => {
  try {
    const partners = await fetchActivePartners();

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="DreamTown_Partners_QR.zip"');

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    for (const p of partners) {
      const url      = getQRUrl(p.partner_id);
      const qrBuffer = await QRCode.toBuffer(url, QR_OPTIONS);
      const fileName = `QR_${p.partner_id}_${p.business_name}.png`;
      archive.append(qrBuffer, { name: fileName });
    }

    // URL 목록 텍스트 파일 포함
    const header  = '파트너ID | 업체명 | 스캔 URL\n' + '='.repeat(60) + '\n';
    const urlList = partners.map(p =>
      `${p.partner_id} | ${p.business_name} | ${getQRUrl(p.partner_id)}`
    ).join('\n');
    archive.append(Buffer.from(header + urlList, 'utf8'), { name: 'QR_URL_목록.txt' });

    await archive.finalize();
  } catch (err) {
    console.error('[admin/partner-qr/download-all]', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

module.exports = router;
