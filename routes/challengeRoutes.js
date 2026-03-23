/**
 * 성장필름 챌린지 API 라우트 (AIL-105-P0, AIL-113)
 *
 * GET  /api/challenge/:wishId/film        - 챌린지 상태 + 7컷 필름 데이터
 * POST /api/challenge/:wishId/checkin     - 일별 체크인
 * POST /api/challenge/:wishId/cheer       - 응원하기
 * POST /api/challenge/:wishId/share-film  - 필름관 공유 (AIL-112)
 * POST /api/challenge/:wishId/growth-film - 성장필름 PNG 캐시 (AIL-113)
 * POST /api/challenge/:wishId/event       - 이벤트 로그 적재 (AIL-113)
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// DB 인스턴스 (init(db)로 주입)
let db = null;

// ── AIL-TIME-001: KST 날짜 키 유틸 ──────────────────────────────────────────
// 모든 Day 계산은 서버 KST 기준. UTC 기준 절대 금지.
function getKSTDateKey(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10); // YYYY-MM-DD
}

// UUID 생성 (Plaza Post ID용)
const { randomUUID } = require('crypto');

// 루틴 온도 서비스 (tolerant loading)
let attendanceService = null;
try {
  attendanceService = require('../services/attendanceService');
} catch (e) {
  console.warn('[ChallengeRoutes] attendanceService 로드 실패 (non-fatal):', e.message);
}

// CSS 기반 오버레이 레이어 매니페스트 (DB 불필요, 정적 상수)
const OVERLAY_PACKS = {
  hope_v1: {
    id: 'hope_v1',
    layers: [
      {
        id: 'color_wash',
        type: 'filter',
        trigger: { field: 'cheer_count', threshold: 10 }
      },
      {
        id: 'light_overlay',
        type: 'radial_gradient',
        trigger: { field: 'total_points', threshold: 20 }
      },
      {
        id: 'sparkle',
        type: 'keyframe_animation',
        trigger: { field: 'total_points', threshold: 60 }
      }
    ]
  }
};

/**
 * 라우터 초기화 (server.js에서 호출)
 * @param {Object} dbInstance - database/db.js pool 인스턴스
 * @returns {Router}
 */
function init(dbInstance) {
  db = dbInstance;
  console.log('[ChallengeRoutes] 라우터 초기화 완료');
  return router;
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/challenge/:wishId/film
// 챌린지 상태 + 7컷 필름 데이터 조회
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:wishId/film', async (req, res) => {
  if (!db) return res.status(503).json({ success: false, error: 'DB not initialized' });

  const wishId = parseInt(req.params.wishId, 10);
  if (isNaN(wishId)) return res.status(400).json({ success: false, error: 'Invalid wishId' });

  try {
    // 챌린지 + 체크인 일 목록 병렬 조회
    const [challengeResult, daysResult] = await Promise.all([
      db.query(
        `SELECT id, wish_id, status, base_image_url,
                checkin_count, action_points, cheer_count, cheer_points, total_points,
                overlay_pack_id, completed_at, created_at
         FROM wish_challenges
         WHERE wish_id = $1`,
        [wishId]
      ),
      db.query(
        `SELECT wcd.day_number, wcd.action_line, wcd.checked_in_at, wcd.points_earned
         FROM wish_challenge_days wcd
         JOIN wish_challenges wc ON wcd.challenge_id = wc.id
         WHERE wc.wish_id = $1
         ORDER BY wcd.day_number ASC`,
        [wishId]
      )
    ]);

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Challenge not found for this wish' });
    }

    const challenge = challengeResult.rows[0];
    const checkedInDays = new Map(daysResult.rows.map(d => [d.day_number, d]));

    // 7컷 배열 구성 (미체크인 day는 null action_line, checked_in: false)
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayNum = i + 1;
      const dayData = checkedInDays.get(dayNum);
      return {
        day: dayNum,
        action_line: dayData ? dayData.action_line : null,
        checked_in: !!dayData,
        checked_in_at: dayData ? dayData.checked_in_at : null,
        points_earned: dayData ? dayData.points_earned : 0
      };
    });

    const packId = challenge.overlay_pack_id || 'hope_v1';
    const overlayPack = OVERLAY_PACKS[packId] || OVERLAY_PACKS.hope_v1;

    // AIL-TIME-001: KST 기준 오늘 체크인 가능 여부 (프론트는 이 값만 사용)
    let can_checkin_today = false;
    if (challenge.status === 'ONGOING' && challenge.checkin_count < 7) {
      if (challenge.checkin_count === 0) {
        // Day 1: 항상 가능
        can_checkin_today = true;
      } else {
        // 마지막 체크인이 오늘(KST)이 아닌 경우에만 가능
        const lastDay = daysResult.rows[daysResult.rows.length - 1];
        if (lastDay) {
          const lastKey = getKSTDateKey(new Date(lastDay.checked_in_at));
          can_checkin_today = (lastKey !== getKSTDateKey());
        }
      }
    }

    res.json({
      success: true,
      wish_id: challenge.wish_id,
      status: challenge.status,
      base_image_url: challenge.base_image_url,
      completed_at: challenge.completed_at,
      can_checkin_today,
      score: {
        checkin_count: challenge.checkin_count,
        cheer_count: challenge.cheer_count,
        action_points: challenge.action_points,
        cheer_points: challenge.cheer_points,
        total_points: challenge.total_points
      },
      overlay_pack: overlayPack,
      days
    });

  } catch (err) {
    console.error('[ChallengeRoutes] GET film error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/challenge/:wishId/checkin
// 일별 체크인
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:wishId/checkin', async (req, res) => {
  if (!db) return res.status(503).json({ success: false, error: 'DB not initialized' });

  const wishId = parseInt(req.params.wishId, 10);
  if (isNaN(wishId)) return res.status(400).json({ success: false, error: 'Invalid wishId' });

  const { action_line } = req.body || {};

  try {
    // 챌린지 조회
    const challengeResult = await db.query(
      `SELECT id, status, checkin_count FROM wish_challenges WHERE wish_id = $1`,
      [wishId]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];

    // 이미 완료된 챌린지 체크인 시도 → 409
    if (challenge.status === 'COMPLETED' || challenge.checkin_count >= 7) {
      return res.status(409).json({ success: false, error: 'Challenge already completed' });
    }

    // AIL-TIME-001: KST 동일일 중복 체크인 차단
    if (challenge.checkin_count > 0) {
      const lastDayResult = await db.query(
        `SELECT checked_in_at FROM wish_challenge_days
         WHERE challenge_id = $1
         ORDER BY day_number DESC LIMIT 1`,
        [challenge.id]
      );
      if (lastDayResult.rows.length > 0) {
        const lastKey = getKSTDateKey(new Date(lastDayResult.rows[0].checked_in_at));
        if (lastKey === getKSTDateKey()) {
          return res.status(409).json({
            success: false,
            error: '오늘은 이미 체크인하셨어요. 내일 또 와요!',
            already_today: true
          });
        }
      }
    }

    const nextDay = challenge.checkin_count + 1;
    const pointsEarned = 10;

    // wish_challenge_days INSERT (UNIQUE 위반 시 409)
    let insertResult;
    try {
      insertResult = await db.query(
        `INSERT INTO wish_challenge_days (challenge_id, day_number, action_line, points_earned)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [challenge.id, nextDay, action_line || null, pointsEarned]
      );
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        // UNIQUE 위반: 이미 해당 day 체크인됨
        return res.status(409).json({ success: false, error: `Day ${nextDay} already checked in` });
      }
      throw insertErr;
    }

    const willComplete = nextDay === 7;

    // wish_challenges UPDATE
    await db.query(
      `UPDATE wish_challenges
       SET checkin_count = checkin_count + 1,
           action_points = action_points + $1,
           total_points  = total_points  + $1,
           status        = CASE WHEN $2 THEN 'COMPLETED' ELSE status END,
           completed_at  = CASE WHEN $2 THEN NOW() ELSE completed_at END
       WHERE id = $3`,
      [pointsEarned, willComplete, challenge.id]
    );

    // ── AIL-112: WISH Post badgeText 업데이트 (fail-open) ───────────────────
    try {
      const badgeLabel = willComplete ? '🎬 완주' : `Day ${nextDay}`;
      await db.query(
        `UPDATE "Post"
         SET "badgeText" = $1, "updatedAt" = NOW()
         WHERE "wishId" = $2 AND "postType" = 'WISH'`,
        [badgeLabel, String(wishId)]
      );
    } catch (badgeErr) {
      console.warn('[Challenge] WISH badgeText 업데이트 실패 (non-fatal):', badgeErr.message);
    }

    // ── BE-1: 루틴 온도 상승 (attendanceService, fail-open) ─────────────────
    // wishId(URL param) → wish_entries.phone_hash → attendanceService.ping
    if (attendanceService) {
      try {
        const weRes = await db.query(
          'SELECT phone_hash FROM wish_entries WHERE id = $1',
          [wishId]
        );
        const userId = weRes.rows[0]?.phone_hash;
        if (userId) {
          const tempResult = await attendanceService.ping(userId, 'open');
          console.log('[Challenge] 루틴 온도 업데이트:', {
            wishId,
            userId: userId.slice(0, 8) + '...',
            duplicate: tempResult.duplicate ?? false,
            temperature: tempResult.temperature,
          });
        } else {
          console.warn('[Challenge] BE-1 skip: wish_entries.phone_hash is null for wish_id=', wishId);
        }
      } catch (tempErr) {
        console.warn('[Challenge] attendanceService.ping 실패 (non-fatal):', tempErr.message);
      }
    }

    res.json({
      success: true,
      day: nextDay,
      points_earned: pointsEarned,
      completed: willComplete
    });

  } catch (err) {
    console.error('[ChallengeRoutes] POST checkin error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/challenge/:wishId/cheer
// 응원하기 (중복 방지)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:wishId/cheer', async (req, res) => {
  if (!db) return res.status(503).json({ success: false, error: 'DB not initialized' });

  const wishId = parseInt(req.params.wishId, 10);
  if (isNaN(wishId)) return res.status(400).json({ success: false, error: 'Invalid wishId' });

  const { cheerer_id } = req.body || {};
  if (!cheerer_id) return res.status(400).json({ success: false, error: 'cheerer_id required' });

  try {
    // 챌린지 조회
    const challengeResult = await db.query(
      `SELECT id, cheer_count FROM wish_challenges WHERE wish_id = $1`,
      [wishId]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];

    // INSERT ON CONFLICT DO NOTHING RETURNING id
    const cheerResult = await db.query(
      `INSERT INTO wish_challenge_cheers (challenge_id, cheerer_id)
       VALUES ($1, $2)
       ON CONFLICT (challenge_id, cheerer_id) DO NOTHING
       RETURNING id`,
      [challenge.id, cheerer_id]
    );

    const wasNew = cheerResult.rows.length > 0;

    let newCheerCount = challenge.cheer_count;
    if (wasNew) {
      // 새 응원일 때만 카운트/포인트 업데이트
      const updateResult = await db.query(
        `UPDATE wish_challenges
         SET cheer_count   = cheer_count + 1,
             cheer_points  = cheer_points + 1,
             total_points  = total_points + 1
         WHERE id = $1
         RETURNING cheer_count`,
        [challenge.id]
      );
      newCheerCount = updateResult.rows[0].cheer_count;
    }

    // ── BE-2: 소셜 온도 상승 (was_new일 때만, fail-open) ───────────────────
    // wish 소유자(phone_hash)의 social_temperature +0.3
    if (wasNew) {
      try {
        const weRes = await db.query(
          'SELECT phone_hash FROM wish_entries WHERE id = $1',
          [wishId]
        );
        const ownerId = weRes.rows[0]?.phone_hash;
        if (ownerId) {
          // Aurora5: social_temperature = 36.5° 고정 (Max Cap, 상승 없음)
          await db.query(
            `INSERT INTO temperature_state (user_id, social_temperature, updated_at)
             VALUES ($1, 36.5, NOW())
             ON CONFLICT (user_id)
             DO UPDATE SET
               social_temperature = 36.5,
               updated_at = NOW()`,
            [ownerId]
          );
          console.log('[Challenge] 소셜 온도 36.5° 유지 (me_too_receive):', {
            wishId,
            ownerId: ownerId.slice(0, 8) + '...',
          });
        } else {
          console.warn('[Challenge] BE-2 skip: wish_entries.phone_hash is null for wish_id=', wishId);
        }
      } catch (tempErr) {
        console.warn('[Challenge] social_temperature 업데이트 실패 (non-fatal):', tempErr.message);
      }
    }

    res.json({
      success: true,
      cheer_count: newCheerCount,
      was_new: wasNew
    });

  } catch (err) {
    console.error('[ChallengeRoutes] POST cheer error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/challenge/:wishId/share-film
// AIL-112: 완주 후 사용자 능동 필름관 공유 (P0 롤백옵션 방식)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:wishId/share-film', async (req, res) => {
  if (!db) return res.status(503).json({ success: false, error: 'DB not initialized' });

  const wishId = parseInt(req.params.wishId, 10);
  if (isNaN(wishId)) return res.status(400).json({ success: false, error: 'Invalid wishId' });

  try {
    // 챌린지 완주 여부 확인
    const challengeResult = await db.query(
      `SELECT status, base_image_url FROM wish_challenges WHERE wish_id = $1`,
      [wishId]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];
    if (challenge.status !== 'COMPLETED') {
      return res.status(409).json({ success: false, error: '7일 완주 후 필름관에 공유할 수 있어요' });
    }

    // 클라이언트가 콜라주 URL을 전달하면 사용, 없으면 base_image_url 사용
    const { thumbnailUrl } = req.body || {};
    const finalThumbnail = thumbnailUrl || challenge.base_image_url;

    const wishIdStr = String(wishId);
    const now = new Date().toISOString();

    // Plaza FILM 포스트 upsert (중복 무시 — ON CONFLICT DO NOTHING)
    await db.query(
      `INSERT INTO "Post" (
         id, content, status, "createdAt", "updatedAt",
         "postType", "wishId", "thumbnailUrl", "badgeText", "summaryStatus"
       )
       VALUES ($1, '', 'APPROVED', $2, $2, 'FILM', $3, $4, '🎬 완주', 'NONE')
       ON CONFLICT DO NOTHING`,
      [randomUUID(), now, wishIdStr, finalThumbnail]
    );

    // WISH 포스트도 badgeText 동기화
    await db.query(
      `UPDATE "Post"
       SET "badgeText" = '🎬 완주', "updatedAt" = NOW()
       WHERE "wishId" = $1 AND "postType" = 'WISH'`,
      [wishIdStr]
    );

    console.log('[ChallengeRoutes] FILM Post shared:', { wishId, thumbnailUrl: finalThumbnail });

    res.json({ success: true, wishId, message: '필름관에 공유됐어요 🎬' });

  } catch (err) {
    console.error('[ChallengeRoutes] POST share-film error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/challenge/:wishId/suggestion
// AIL-114: 체크인 후 보여줄 Plaza WISDOM/MIRACLE 카드 1개 무작위 조회 (fail-open)
// ═══════════════════════════════════════════════════════════════════════════
// Gap-2: AIL-110 DailyCuration 캐시 100% 재활용 (무작위 Post 조회 X)
router.get('/:wishId/suggestion', async (req, res) => {
  if (!db) return res.json({ post: null });

  try {
    const dateKey = getKSTDateKey();
    const result = await db.query(
      `SELECT "miracleLine", "wisdomLine", "miraclePostId", "wisdomPostId"
       FROM "DailyCuration"
       WHERE "dateKey" = $1`,
      [dateKey]
    );

    if (result.rows.length === 0) return res.json({ post: null });

    const row = result.rows[0];
    // miracle / wisdom 중 하나 랜덤 선택 (당일 큐레이션 데이터 재활용)
    const candidates = [];
    if (row.miracleLine) candidates.push({ text: row.miracleLine, type: 'MIRACLE', id: row.miraclePostId });
    if (row.wisdomLine)  candidates.push({ text: row.wisdomLine,  type: 'WISDOM',  id: row.wisdomPostId });

    if (candidates.length === 0) return res.json({ post: null });

    const post = candidates[Math.floor(Math.random() * candidates.length)];
    res.json({ post });
  } catch (err) {
    console.warn('[ChallengeRoutes] suggestion error (non-fatal):', err.message);
    res.json({ post: null });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/challenge/:wishId/growth-film
// AIL-113: 클라이언트 생성 성장필름 PNG 서버 캐시 저장 + URL 반환
// Body: { variant: 'my' | 'share', imageData?: string (data:image/png;base64,...) }
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:wishId/growth-film', async (req, res) => {
  const wishId = parseInt(req.params.wishId, 10);
  if (isNaN(wishId)) return res.status(400).json({ success: false, error: 'Invalid wishId' });

  const { variant, imageData } = req.body || {};
  if (!variant || !['my', 'share'].includes(variant)) {
    return res.status(400).json({ success: false, error: 'variant must be "my" or "share"' });
  }

  const FILMS_DIR = path.join(__dirname, '..', 'public', 'images', 'films');
  const filename  = `wish_${wishId}_${variant}.png`;
  const filepath  = path.join(FILMS_DIR, filename);
  const imageUrl  = `/images/films/${filename}`;

  // 캐시 히트: imageData 없어도 URL 반환
  if (fs.existsSync(filepath)) {
    return res.json({ success: true, imageUrl, variant, cached: true });
  }

  // imageData 없으면 캐시 미스 상태 반환 (클라이언트가 imageData와 함께 재요청)
  if (!imageData) {
    return res.json({ success: true, imageUrl: null, variant, cached: false });
  }

  // base64 PNG 디스크 저장
  try {
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    fs.mkdirSync(FILMS_DIR, { recursive: true });
    fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
    console.log(`[ChallengeRoutes] Film cached: ${filename}`);
  } catch (saveErr) {
    console.error('[ChallengeRoutes] Film save error:', saveErr.message);
    return res.status(500).json({ success: false, error: 'Failed to save film' });
  }

  res.json({ success: true, imageUrl, variant, cached: false });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/challenge/:wishId/event
// AIL-113: 성장필름 이벤트 로그 적재 (fire-and-forget, fail-open)
// Body: { event_type: string, variant?: string, session_id?: string }
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:wishId/event', async (req, res) => {
  const wishId = parseInt(req.params.wishId, 10);
  if (isNaN(wishId)) return res.status(400).json({ success: false, error: 'Invalid wishId' });

  const { event_type, variant, session_id } = req.body || {};
  if (!event_type) return res.status(400).json({ success: false, error: 'event_type required' });

  try {
    if (db) {
      await db.query(
        `INSERT INTO growth_film_events (wish_id, event_type, variant, session_id)
         VALUES ($1, $2, $3, $4)`,
        [wishId, String(event_type).slice(0, 60), variant || null, session_id || null]
      );
    }
  } catch (err) {
    // fail-open: 로그 실패가 응답을 막지 않음
    console.warn('[ChallengeRoutes] event log error (non-fatal):', err.message);
  }

  res.json({ success: true });
});

module.exports = { init };
