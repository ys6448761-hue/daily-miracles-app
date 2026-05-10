'use strict';

/**
 * seedRoutes.js — DreamTown Seed Library
 * prefix: /api/seeds
 *
 * Seed = 공유 진입점 SSOT.
 *   - 별 commit 시 자동 발행 금지 — 사용자가 "이 별로 Seed 만들기" 클릭 시에만 생성
 *   - /seed/:id 는 비로그인 외부 접근용 SSR 페이지 (server.js에서 처리)
 *   - ref_code 는 8자 base36 — 공유 친화 + star_id 노출 방지
 *
 * Endpoints:
 *   POST /api/seeds                       Seed 생성 (명시 클릭)
 *   GET  /api/seeds/:id                   Seed 메타 조회 (비로그인)
 *   POST /api/seeds/:id/event             view | click | wish_started 기록
 */

const router  = require('express').Router();
const crypto  = require('crypto');
const path    = require('path');
const fs      = require('fs');
const sharp   = require('sharp');
const db      = require('../database/db');

const ALLOWED_LOCATIONS = new Set(['cablecar', 'hamel']);
const ALLOWED_STATUS    = new Set(['active', 'disabled']);
const ALLOWED_EVENTS    = new Set(['view', 'click', 'wish_started']);

// location → OG-suitable base image (Kakao 5MB 권장 이내, 1200x1200 JPEG)
// 미제공 또는 default OG 입력 시 location별 자동 매핑. 파일 부재 시 DEFAULT_OG fallback.
const DEFAULT_OG = '/images/dreamtown-og-v4.jpg';
const LOCATION_BASE_IMAGE = {
  cablecar:                '/images/og/cablecar.jpg',
  yeosu_cablecar:          '/images/og/cablecar.jpg',
  yeosu_cablecar_workshop: '/images/og/cablecar.jpg',
  hamel:                   '/images/og/hamel.jpg',
  yeosu_hamel:             '/images/og/hamel.jpg',
};

function resolveBaseImage(inputUrl, location) {
  // 1) 명시 입력이 default OG 아니면 그대로 사용
  if (inputUrl && inputUrl !== DEFAULT_OG) return inputUrl;
  // 2) location 매핑 시도 (파일 존재 확인)
  const mapped = LOCATION_BASE_IMAGE[location];
  if (mapped) {
    const abs = path.join(__dirname, '..', 'public', mapped.replace(/^\/+/, ''));
    if (fs.existsSync(abs)) return mapped;
  }
  // 3) 최종 fallback
  return inputUrl || DEFAULT_OG;
}

const POSTCARDS_DIR = path.join(__dirname, '..', 'public', 'images', 'postcards');
if (!fs.existsSync(POSTCARDS_DIR)) fs.mkdirSync(POSTCARDS_DIR, { recursive: true });

// ── 8자 base36 ref_code (uppercase + digit) ─────────────────────
// crypto.randomBytes(6) → base36 substring(0, 8) — 충돌률 36^8 ≈ 2.8조
function generateRefCode() {
  const bytes = crypto.randomBytes(6);
  const num   = BigInt('0x' + bytes.toString('hex'));
  return num.toString(36).padStart(8, '0').slice(0, 8).toUpperCase();
}

async function uniqueRefCode(maxRetry = 5) {
  for (let i = 0; i < maxRetry; i++) {
    const code = generateRefCode();
    const { rows } = await db.query(
      'SELECT 1 FROM seeds WHERE ref_code = $1 LIMIT 1',
      [code]
    );
    if (rows.length === 0) return code;
  }
  throw new Error('ref_code 충돌 — 재시도 한도 초과');
}

// 별 image_url (예: /images/postcards/tmp_abcd.png) → seeds 영구 사본 복사
async function persistSeedImage(sourceUrl, seedId) {
  const sourceRel  = (sourceUrl || '').replace(/^\/+/, '');
  const sourcePath = path.join(__dirname, '..', 'public', sourceRel);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`source image not found: ${sourceUrl}`);
  }
  const destFile = `seed_${seedId.slice(0, 12)}.png`;
  const destPath = path.join(POSTCARDS_DIR, destFile);
  await sharp(sourcePath).png().toFile(destPath);
  return `/images/postcards/${destFile}`;
}

// ── POST /api/seeds — 명시 클릭 시 Seed 생성 ────────────────────
router.post('/', async (req, res) => {
  const { location, image_url, title = null, parent_star_id = null } = req.body || {};

  if (!ALLOWED_LOCATIONS.has(location)) {
    return res.status(400).json({
      success: false,
      error:   `허용되지 않은 location: "${location}"`,
      allowed: [...ALLOWED_LOCATIONS],
    });
  }
  // image_url 미제공 또는 default OG → location 매핑으로 자동 대체
  const sourceImage = resolveBaseImage(
    typeof image_url === 'string' && image_url.trim() ? image_url : null,
    location
  );

  try {
    const seedId   = crypto.randomUUID();
    const refCode  = await uniqueRefCode();
    const persisted = await persistSeedImage(sourceImage, seedId);
    const shareUrl  = `/seed/${seedId}?ref=${refCode}`;

    const { rows } = await db.query(
      `INSERT INTO seeds
         (id, location, title, image_url, share_url, ref_code, parent_star_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id, location, title, image_url, share_url, ref_code, parent_star_id, status, created_at`,
      [seedId, location, title, persisted, shareUrl, refCode, parent_star_id]
    );

    return res.json({ success: true, seed: rows[0] });
  } catch (e) {
    console.error('[seeds/create]', e.message);
    if (e.code === '42P01') {
      return res.status(503).json({ success: false, error: '준비 중 (마이그레이션 172 미반영)' });
    }
    return res.status(500).json({ success: false, error: 'Seed 생성 실패' });
  }
});

// ── GET /api/seeds/:id — 메타 조회 (비로그인) ──────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT id, location, title, image_url, share_url, ref_code,
              parent_star_id, status, view_count, click_count, created_at
       FROM seeds
       WHERE id = $1 AND status = 'active'`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Seed 없음 또는 비공개' });
    }
    return res.json({ success: true, seed: rows[0] });
  } catch (e) {
    console.error('[seeds/get]', e.message);
    if (e.code === '42P01') {
      return res.status(503).json({ success: false, error: '준비 중' });
    }
    return res.status(500).json({ success: false, error: '조회 실패' });
  }
});

// ── POST /api/seeds/:id/event — view | click | wish_started ────
router.post('/:id/event', async (req, res) => {
  const { id } = req.params;
  const { type, ref_code = null } = req.body || {};

  if (!ALLOWED_EVENTS.has(type)) {
    return res.status(400).json({
      success: false,
      error:   `허용되지 않은 event type: "${type}"`,
      allowed: [...ALLOWED_EVENTS],
    });
  }

  try {
    // seed 존재 확인 (active만)
    const { rows: seedRows } = await db.query(
      `SELECT id FROM seeds WHERE id = $1 AND status = 'active'`,
      [id]
    );
    if (seedRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Seed 없음' });
    }

    const ua = (req.headers['user-agent'] || '').slice(0, 200);

    await db.query(
      `INSERT INTO seed_events (seed_id, ref_code, type, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [id, ref_code, type, ua]
    );

    // view/click counter 증가 (wish_started 는 카운터 영향 없음 — 별도 분석)
    if (type === 'view') {
      await db.query('UPDATE seeds SET view_count = view_count + 1 WHERE id = $1', [id]);
    } else if (type === 'click') {
      await db.query('UPDATE seeds SET click_count = click_count + 1 WHERE id = $1', [id]);
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('[seeds/event]', e.message);
    if (e.code === '42P01') return res.json({ success: true });  // 마이그레이션 미반영 시 silent ok
    return res.status(500).json({ success: false, error: '이벤트 기록 실패' });
  }
});

module.exports = router;
