'use strict';
/**
 * cablecarRoutes.js — 케이블카 캐빈 QR 전용 진입 엔진
 *
 * POST /api/cablecar/enter
 *   - star_id 없음 → 소원 + 별 생성 + 즉시 각성
 *   - star_id 있음 + status='created' → 각성 (awakened)
 *   - star_id 있음 + 이미 각성 → 재각성 (growing, awaken_count++)
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
  // wish_text 첫 글자 코드 기반 결정론적 선택
  const code = (wishText || '').charCodeAt(0) || 0;
  return CABLECAR_STAR_NAMES[code % CABLECAR_STAR_NAMES.length];
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/cablecar/enter
// Body: { user_id, star_id?, wish_text?, place? }
// ─────────────────────────────────────────────────────────────────────
router.post('/enter', async (req, res) => {
  const {
    user_id,
    star_id,
    wish_text,
    place = 'yeosu_cablecar_cabin',
  } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id가 필요합니다.' });
  }

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

      // status 컬럼이 아직 없을 수 있음 (migration 117 미적용 환경)
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
      ).catch(() => {
        // migration 117 미적용 환경 — 컬럼 없으면 graceful skip
      });

      const mode = isFirstAwaken ? 'awakened' : 'reawakened';
      console.log(`[cablecar/enter] ${mode} | star=${star.id} | count=${newCount}`);

      return res.json({
        success:  true,
        mode,
        starId:   star.id,
        starName: star.star_name,
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

    // ① 소원 생성
    const wishR = await db.query(
      `INSERT INTO dt_wishes (user_id, wish_text, gem_type, status, safety_level)
       VALUES ($1, $2, $3, 'converted_to_star', 'GREEN')
       RETURNING id`,
      [user_id, trimmedWish, GEM_TYPE]
    );
    const wishId = wishR.rows[0].id;

    // ② 은하 조회
    const galaxyR = await db.query(
      `SELECT id FROM dt_galaxies WHERE code = $1 LIMIT 1`,
      [GALAXY_CODE]
    );
    if (!galaxyR.rows[0]) {
      return res.status(500).json({ error: '은하 데이터 없음' });
    }
    const galaxyId = galaxyR.rows[0].id;

    // ③ 별 씨앗
    const seedR = await db.query(
      `INSERT INTO dt_star_seeds (wish_id, seed_name, seed_state)
       VALUES ($1, $2, 'promoted')
       RETURNING id`,
      [wishId, `${trimmedWish.slice(0, 10)} 씨앗`]
    );
    const seedId = seedR.rows[0].id;

    // ④ 별 생성 (즉시 각성 상태로 INSERT)
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
      // migration 117 미적용 — status 컬럼 없이 재시도
      return db.query(
        `INSERT INTO dt_stars
           (user_id, wish_id, star_seed_id, star_name, star_slug, galaxy_id, star_stage)
         VALUES ($1, $2, $3, $4, $5, $6, 'day1')
         RETURNING id, star_name`,
        [user_id, wishId, seedId, starName, starSlug, galaxyId]
      );
    });

    const newStar = newStarR.rows[0];
    console.log(`[cablecar/enter] created_and_awakened | star=${newStar.id} | user=${user_id}`);

    return res.json({
      success:  true,
      mode:     'created_and_awakened',
      starId:   newStar.id,
      starName: newStar.star_name,
      headline: '당신의 별이 이곳에서 빛나기 시작합니다',
      subline:  `${PLACE_LABEL}에서`,
      nextUrl:  `/my-star/${newStar.id}`,
    });

  } catch (err) {
    console.error('[cablecar/enter] 오류:', err.message);
    return res.status(500).json({ error: '처리 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
