'use strict';
/**
 * cablecarRoutes.js — 케이블카 캐빈 QR 전용 진입 엔진
 *
 * POST /api/cablecar/enter
 *   Body: { user_id, star_id?, wish_text?, place?, credential_code? }
 *
 *   - star_id 없음 → 소원 + 별 생성 + 즉시 각성
 *   - star_id 있음 + status='created' → 각성 (awakened)
 *   - star_id 있음 + 이미 각성 → 재각성 (growing, awaken_count++)
 *
 *   - credential_code 있음 + 유효 → has_product: true → 각성 연출 트리거
 *   - credential_code 없음 or 무효 → has_product: false → 기본 로그 화면
 */

const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const db      = require('../database/db');

const PLACE_LABEL  = '여수 케이블카 캐빈';
const GALAXY_CODE  = 'challenge';
const GEM_TYPE     = 'citrine';
const ORIGIN_TYPE  = 'cablecar';

// ── 케이블카 테마 별 이름 풀 ────────────────────────────────────────
const CABLECAR_STAR_NAMES = [
  '용기의 별', '도전의 빛', '비상의 별', '하늘의 빛',
  '바람의 별', '높이의 별', '새벽의 별', '의지의 빛',
  '날개의 별', '하늘길의 빛',
];

function pickStarName(wishText) {
  const code = (wishText || '').charCodeAt(0) || 0;
  return CABLECAR_STAR_NAMES[code % CABLECAR_STAR_NAMES.length];
}

// ── credential_code 유효성 검증 ──────────────────────────────────
// 유효하면 VERIFIED 처리 후 true 반환 / 예외·없음은 false 반환
async function validateAndRedeemCredential(credentialCode) {
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

    // VERIFIED 상태로 업데이트 (이미 VERIFIED면 무시)
    await db.query(
      `UPDATE benefit_credentials
          SET status      = 'VERIFIED',
              verified_at = NOW()
        WHERE id = $1 AND status != 'REDEEMED'`,
      [r.rows[0].id]
    ).catch(() => {}); // verified_at 컬럼 없는 환경 graceful skip

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
    return res.status(400).json({ error: 'user_id가 필요합니다.' });
  }

  // 유료 상품 여부 확인 (각성 연출 트리거 결정)
  const hasProduct = await validateAndRedeemCredential(credential_code);

  try {
    // ── CASE A: 기존 별 있음 → 각성 or 재각성 ─────────────────────
    if (star_id) {
      const starR = await db.query(
        `SELECT id, star_name, status, awaken_count
           FROM dt_stars
          WHERE id = $1 AND user_id = $2
          LIMIT 1`,
        [star_id, user_id]
      );

      if (!starR.rows[0]) {
        return res.status(404).json({ error: '별을 찾을 수 없습니다.' });
      }
      const star = starR.rows[0];

      const currentStatus  = star.status ?? 'created';
      const currentCount   = star.awaken_count ?? 0;
      const isFirstAwaken  = currentStatus === 'created' || currentStatus === null;
      const newStatus      = isFirstAwaken ? 'awakened' : 'growing';
      const newCount       = currentCount + 1;

      await db.query(
        `UPDATE dt_stars
            SET status          = $1,
                awakened_at     = COALESCE(awakened_at, NOW()),
                awakened_place  = COALESCE(awakened_place, $2),
                awaken_count    = $3,
                updated_at      = NOW()
          WHERE id = $4`,
        [newStatus, place, newCount, star.id]
      ).catch(() => {});

      const mode = isFirstAwaken ? 'awakened' : 'reawakened';
      console.log(`[cablecar/enter] ${mode} | star=${star.id} | hasProduct=${hasProduct} | count=${newCount}`);

      return res.json({
        success:     true,
        mode,
        starId:      star.id,
        starName:    star.star_name,
        has_product: hasProduct,
        headline: isFirstAwaken
          ? '당신의 별이 이곳에서 빛나기 시작합니다'
          : '다시 이곳에 오셨네요. 당신의 별이 더 밝아집니다',
        subline:  `${PLACE_LABEL}에서`,
        nextUrl:  `/my-star/${star.id}`,
      });
    }

    // ── CASE B: 별 없음 → 소원 + 별 생성 + 즉시 각성 ─────────────
    if (!wish_text || !wish_text.trim()) {
      return res.status(400).json({ error: '소원(wish_text)이 필요합니다.' });
    }
    const trimmedWish = wish_text.trim();

    const wishR = await db.query(
      `INSERT INTO dt_wishes (user_id, wish_text, gem_type, status, safety_level)
       VALUES ($1, $2, $3, 'converted_to_star', 'GREEN')
       RETURNING id`,
      [user_id, trimmedWish, GEM_TYPE]
    );
    const wishId = wishR.rows[0].id;

    const galaxyR = await db.query(
      `SELECT id FROM dt_galaxies WHERE code = $1 LIMIT 1`,
      [GALAXY_CODE]
    );
    if (!galaxyR.rows[0]) {
      return res.status(500).json({ error: '은하 데이터 없음' });
    }
    const galaxyId = galaxyR.rows[0].id;

    const seedR = await db.query(
      `INSERT INTO dt_star_seeds (wish_id, seed_name, seed_state)
       VALUES ($1, $2, 'promoted')
       RETURNING id`,
      [wishId, `${trimmedWish.slice(0, 10)} 씨앗`]
    );
    const seedId = seedR.rows[0].id;

    const starName = pickStarName(trimmedWish);
    const starSlug = `cablecar-${Date.now()}`;

    const newStarR = await db.query(
      `INSERT INTO dt_stars
         (user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id,
          star_stage, status, origin_type, origin_place,
          awakened_at, awakened_place, awaken_count)
       VALUES
         ($1, $2, $3, $4, $5, $6,
          'day1', 'awakened', $7, $8,
          NOW(), $8, 1)
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
    console.log(`[cablecar/enter] created_and_awakened | star=${newStar.id} | hasProduct=${hasProduct}`);

    return res.json({
      success:     true,
      mode:        'created_and_awakened',
      starId:      newStar.id,
      starName:    newStar.star_name,
      has_product: hasProduct,
      headline:    '당신의 별이 이곳에서 빛나기 시작합니다',
      subline:     `${PLACE_LABEL}에서`,
      nextUrl:     `/my-star/${newStar.id}`,
    });

  } catch (err) {
    console.error('[cablecar/enter] 오류:', err.message);
    return res.status(500).json({ error: '처리 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
