'use strict';
/**
 * cablecarRoutes.js — 케이블카 캐빈 QR 진입 엔진 + 각성 패스 결제
 *
 * POST /api/cablecar/enter
 *   Body: { user_id, star_id?, wish_text?, place?, credential_code? }
 *
 * ── 분기 로직 ──────────────────────────────────────────────────────
 *
 *  [유료 + 기존 별]  → 각성/재각성 (DB 상태 변경) → mode: awakened|reawakened
 *  [유료 + 별 없음]  → 소원 + 별 생성 + 즉시 각성 → mode: created_and_awakened
 *  [무료 + 기존 별]  → 방문 로그만, DB 상태 변경 없음 → mode: logged_only
 *  [무료 + 별 없음]  → 프론트에서 차단 (여기 도달 시 no_product 반환)
 *
 * ── 핵심 원칙 ──────────────────────────────────────────────────────
 *  "각성은 무료 기능이 아니라 상품이다"
 *  credential_code 검증 실패 = has_product: false → 각성 없음
 */

const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto  = require('crypto');
const db      = require('../database/db');

let nicepayService = null;
try { nicepayService = require('../services/nicepayService'); } catch (_) {}

function generateCredentialCode() {
  return 'TC-' + crypto.randomBytes(5).toString('hex').toUpperCase();
}

const PLACE_LABEL = '여수 케이블카 캐빈';
const GALAXY_CODE = 'challenge';
const GEM_TYPE    = 'citrine';
const ORIGIN_TYPE = 'cablecar';

const CABLECAR_STAR_NAMES = [
  '용기의 별', '도전의 빛', '비상의 별', '하늘의 빛',
  '바람의 별', '높이의 별', '새벽의 별', '의지의 빛',
  '날개의 별', '하늘길의 빛',
];

function pickStarName(wishText) {
  const code = (wishText || '').charCodeAt(0) || 0;
  return CABLECAR_STAR_NAMES[code % CABLECAR_STAR_NAMES.length];
}

// ── credential_code 검증 (실패 시 항상 false 반환) ─────────────────
async function validateCredential(credentialCode) {
  if (!credentialCode) return false;
  try {
    const r = await db.query(
      `SELECT id, benefit_type, status
         FROM benefit_credentials
        WHERE credential_code = $1
          AND benefit_type LIKE 'cablecar%'
          AND status IN ('ISSUED','ACTIVE','VERIFIED')
          AND (valid_until IS NULL OR valid_until > NOW())
        LIMIT 1`,
      [credentialCode]
    );
    if (!r.rows.length) return false;

    // VERIFIED 처리 (already VERIFIED: no-op)
    await db.query(
      `UPDATE benefit_credentials
          SET status = 'VERIFIED', verified_at = NOW()
        WHERE id = $1 AND status != 'REDEEMED'`,
      [r.rows[0].id]
    ).catch(() => {}); // verified_at 없는 환경 graceful skip

    return true;
  } catch (_) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/cablecar/enter
// ─────────────────────────────────────────────────────────────────────
router.post('/enter', async (req, res) => {
  const {
    user_id,
    star_id,
    wish_text,
    place = 'yeosu_cablecar_cabin',
    credential_code,
  } = req.body;

  if (!user_id) {
    return res.status(400).json({ success: false, error: 'user_id가 필요합니다.' });
  }

  const hasProduct = await validateCredential(credential_code);

  try {
    // ── CASE A: 기존 별 있음 ───────────────────────────────────────
    if (star_id) {
      const starR = await db.query(
        `SELECT id, star_name, status, awaken_count
           FROM dt_stars
          WHERE id = $1 AND user_id = $2
          LIMIT 1`,
        [star_id, user_id]
      );

      if (!starR.rows[0]) {
        return res.status(404).json({ success: false, error: '별을 찾을 수 없습니다.' });
      }
      const star = starR.rows[0];

      // ── 무료: 방문 로그만, 각성 없음 ─────────────────────────────
      if (!hasProduct) {
        console.log(`[cablecar/enter] logged_only | star=${star.id} | user=${user_id}`);
        return res.json({
          success:     true,
          mode:        'logged_only',
          starId:      star.id,
          starName:    star.star_name,
          has_product: false,
          nextUrl:     `/my-star/${star.id}`,
        });
      }

      // ── 유료: 각성 or 재각성 ─────────────────────────────────────
      const currentStatus = star.status ?? 'created';
      const currentCount  = star.awaken_count ?? 0;
      const isFirstAwaken = currentStatus === 'created' || currentStatus === null;
      const newStatus     = isFirstAwaken ? 'awakened' : 'growing';
      const newCount      = currentCount + 1;

      await db.query(
        `UPDATE dt_stars
            SET status         = $1,
                awakened_at    = COALESCE(awakened_at, NOW()),
                awakened_place = COALESCE(awakened_place, $2),
                awaken_count   = $3,
                updated_at     = NOW()
          WHERE id = $4`,
        [newStatus, place, newCount, star.id]
      ).catch(() => {});

      const mode = isFirstAwaken ? 'awakened' : 'reawakened';
      console.log(`[cablecar/enter] ${mode} | star=${star.id} | hasProduct=true | count=${newCount}`);

      return res.json({
        success:     true,
        mode,
        starId:      star.id,
        starName:    star.star_name,
        has_product: true,
        headline:    isFirstAwaken
          ? '당신의 별이 이곳에서 빛나기 시작합니다'
          : '다시 이곳에 오셨네요. 당신의 별이 더 밝아집니다',
        subline:     `${PLACE_LABEL}에서`,
        nextUrl:     `/my-star/${star.id}`,
      });
    }

    // ── CASE B: 별 없음 ───────────────────────────────────────────
    // 무료: 별 생성 불가 (프론트가 차단해야 하지만 안전망으로)
    if (!hasProduct) {
      console.log(`[cablecar/enter] no_product | user=${user_id}`);
      return res.status(403).json({
        success:     false,
        mode:        'no_product',
        has_product: false,
        message:     '별 생성 및 각성은 케이블카 상품 구매 후 이용 가능합니다.',
      });
    }

    // 유료: 소원 필수
    if (!wish_text || !wish_text.trim()) {
      return res.status(400).json({ success: false, error: '소원(wish_text)이 필요합니다.' });
    }
    const trimmedWish = wish_text.trim();

    // ① 소원
    const wishR = await db.query(
      `INSERT INTO dt_wishes (user_id, wish_text, gem_type, status, safety_level)
       VALUES ($1, $2, $3, 'converted_to_star', 'GREEN')
       RETURNING id`,
      [user_id, trimmedWish, GEM_TYPE]
    );
    const wishId = wishR.rows[0].id;

    // ② 은하
    const galaxyR = await db.query(
      `SELECT id FROM dt_galaxies WHERE code = $1 LIMIT 1`,
      [GALAXY_CODE]
    );
    if (!galaxyR.rows[0]) {
      return res.status(500).json({ success: false, error: '은하 데이터 없음' });
    }
    const galaxyId = galaxyR.rows[0].id;

    // ③ 씨앗
    const seedR = await db.query(
      `INSERT INTO dt_star_seeds (wish_id, seed_name, seed_state)
       VALUES ($1, $2, 'promoted')
       RETURNING id`,
      [wishId, `${trimmedWish.slice(0, 10)} 씨앗`]
    );
    const seedId = seedR.rows[0].id;

    // ④ 별 생성 (즉시 각성)
    const starName = pickStarName(trimmedWish);
    const starSlug = `cablecar-${Date.now()}`;

    const newStarR = await db.query(
      `INSERT INTO dt_stars
         (user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id,
          star_stage, status, origin_type, origin_place,
          awakened_at, awakened_place, awaken_count)
       VALUES ($1, $2, $3, $4, $5, $6, 'day1', 'awakened', $7, $8, NOW(), $8, 1)
       RETURNING id, star_name`,
      [user_id, wishId, seedId, starName, starSlug, galaxyId, ORIGIN_TYPE, place]
    ).catch(async () => {
      return db.query(
        `INSERT INTO dt_stars
           (user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, star_stage)
         VALUES ($1, $2, $3, $4, $5, $6, 'day1')
         RETURNING id, star_name`,
        [user_id, wishId, seedId, starName, starSlug, galaxyId]
      );
    });

    const newStar = newStarR.rows[0];
    console.log(`[cablecar/enter] created_and_awakened | star=${newStar.id} | hasProduct=true`);

    return res.json({
      success:     true,
      mode:        'created_and_awakened',
      starId:      newStar.id,
      starName:    newStar.star_name,
      has_product: true,
      headline:    '당신의 별이 이곳에서 빛나기 시작합니다',
      subline:     `${PLACE_LABEL}에서`,
      nextUrl:     `/my-star/${newStar.id}`,
    });

  } catch (err) {
    console.error('[cablecar/enter] 오류:', err.message);
    return res.status(500).json({ success: false, error: '처리 중 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/cablecar/checkout — 케이블카 각성 패스 결제 요청
// ─────────────────────────────────────────────────────────────────────
router.post('/checkout', async (req, res) => {
  const { user_id, phone } = req.body;

  if (!user_id) {
    return res.status(400).json({ success: false, error: 'user_id가 필요합니다.' });
  }

  if (!nicepayService) {
    return res.status(503).json({ success: false, error: '결제 서비스를 사용할 수 없습니다.' });
  }

  const pgConfig = nicepayService.validateConfig?.();
  if (pgConfig && !pgConfig.isValid) {
    return res.status(503).json({ success: false, error: '결제 설정 오류' });
  }

  try {
    const payment = await nicepayService.createPayment(19900, '케이블카 각성 패스');
    const credentialCode = generateCredentialCode();

    await db.query(
      `INSERT INTO cablecar_checkouts (order_id, user_id, phone, credential_code)
       VALUES ($1, $2, $3, $4)`,
      [payment.orderId, user_id, phone ?? null, credentialCode]
    );

    console.log(`[cablecar/checkout] order=${payment.orderId} user=${user_id} code=${credentialCode}`);

    return res.json({
      success:     true,
      order_id:    payment.orderId,
      payment_url: `/pay?moid=${encodeURIComponent(payment.orderId)}`,
    });
  } catch (err) {
    console.error('[cablecar/checkout] 오류:', err.message);
    return res.status(500).json({ success: false, error: '결제 요청 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
