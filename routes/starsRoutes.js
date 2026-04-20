'use strict';

/**
 * starsRoutes.js — 단순 별 시스템
 * Base path: /api/stars
 *
 * POST /            Issue 1: 별 생성 (PRE-ON)
 * GET  /:id         Issue 4: 별 상세 + day 메시지
 * GET  /:id/day30   Issue 5: day30 결과 요약
 *
 * GET  /api/messages?user_id=  Issue 4: user 기반 day 메시지
 * GET  /api/result?user_id=    Issue 5: user 기반 day30 결과
 */

const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');

let db;
try { db = require('../database/db'); } catch (e) {}

const VALID_GEM_TYPES = new Set(['ruby', 'sapphire', 'emerald', 'diamond', 'citrine']);

// ── Day 메시지 ─────────────────────────────────────────────────────
const DAY_MESSAGES = {
  1: '당신의 별이 조금 또렷해졌어요',
  2: '별이 여행을 기억하고 있어요',
  3: '세 번의 마음이 별에 새겨졌습니다',
  4: '별이 당신을 기다리고 있어요',
  5: '이 별은 당신의 이야기를 담고 있어요',
  6: '별빛이 흔들리며 더 밝아지고 있어요',
  7: '이 별은 이제 당신의 약속이 되었습니다',
};

const IDENTITY = {
  ruby:     '당신은 도전을 멈추지 않는 사람입니다',
  sapphire: '당신은 꾸준히 성장하는 사람입니다',
  emerald:  '당신은 스스로를 치유하는 사람입니다',
  diamond:  '당신은 기적을 만들어내는 사람입니다',
  citrine:  '당신은 관계를 소중히 하는 사람입니다',
};

function calcDay(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.floor(diff / 86_400_000) + 1;
}

function dayMessage(day) {
  return DAY_MESSAGES[Math.min(day, 7)] || DAY_MESSAGES[7];
}

// ── POST / — 별 생성 (Issue 1) ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { user_id, wish_text, gem_type } = req.body;

    if (!user_id)   return res.status(400).json({ success: false, error: 'user_id 필수' });
    if (!wish_text) return res.status(400).json({ success: false, error: 'wish_text 필수' });
    if (!gem_type)  return res.status(400).json({ success: false, error: 'gem_type 필수' });
    if (!VALID_GEM_TYPES.has(gem_type))
      return res.status(400).json({ success: false, error: `gem_type 유효값: ${[...VALID_GEM_TYPES].join(', ')}` });

    const id = uuidv4();
    await db.query(
      `INSERT INTO stars (id, user_id, wish_text, gem_type, status)
       VALUES ($1, $2, $3, $4, 'PRE-ON')`,
      [id, user_id, wish_text, gem_type]
    );

    const row = await db.query(`SELECT * FROM stars WHERE id = $1`, [id]);
    const star = row.rows[0];

    res.status(201).json({
      success:    true,
      star_id:    star.id,
      status:     star.status,
      created_at: star.created_at,
    });
  } catch (e) {
    console.error('POST /api/stars error:', e.message);
    res.status(500).json({ success: false, error: '별 생성 실패' });
  }
});

// ── GET /featured — /:id 보다 먼저 등록 (UUID 파싱 오류 방지) ─────
router.get('/featured', (_req, res) => {
  res.status(301).json({ message: 'DreamTown featured는 /api/dt/stars/featured 를 사용하세요' });
});

// ── GET /:id — 별 상세 + day 메시지 (Issue 4) ────────────────────
router.get('/:id', async (req, res) => {
  try {
    const row = await db.query(`SELECT * FROM stars WHERE id = $1`, [req.params.id]);
    if (!row.rows[0]) return res.status(404).json({ success: false, error: '별을 찾을 수 없어요' });

    const star = row.rows[0];
    const day  = calcDay(star.created_at);

    res.json({
      success: true,
      star,
      day,
      day_message: dayMessage(day),
    });
  } catch (e) {
    console.error('GET /api/stars/:id error:', e.message);
    res.status(500).json({ success: false, error: '별 조회 실패' });
  }
});

// ── GET /:id/day30 — 30일 결과 요약 (Issue 5) ────────────────────
router.get('/:id/day30', async (req, res) => {
  try {
    const row = await db.query(`SELECT * FROM stars WHERE id = $1`, [req.params.id]);
    if (!row.rows[0]) return res.status(404).json({ success: false, error: '별을 찾을 수 없어요' });

    const star = row.rows[0];
    const day  = calcDay(star.created_at);

    if (day < 30) {
      return res.status(403).json({
        success:  false,
        error:    `Day ${day} — Day30 결과는 30일 이후에 열립니다`,
        day,
        days_left: 30 - day,
      });
    }

    // 로그 수 조회
    const logRow = await db.query(
      `SELECT COUNT(*) AS n FROM star_logs WHERE star_id = $1`,
      [star.id]
    );
    const logCount = parseInt(logRow.rows[0]?.n ?? 0, 10);

    const identity = IDENTITY[star.gem_type] || '당신은 멈추지 않는 사람입니다';

    res.json({
      success:    true,
      day,
      summary:    `${day}일간 ${logCount}번의 여정을 별에 새겼습니다. 이 별은 당신의 소원 "${star.wish_text}"를 담고 있어요.`,
      identity,
      share_text: '내 별이, 하나의 이야기가 됐다',
      star_id:    star.id,
      gem_type:   star.gem_type,
      log_count:  logCount,
    });
  } catch (e) {
    console.error('GET /api/stars/:id/day30 error:', e.message);
    res.status(500).json({ success: false, error: 'Day30 결과 조회 실패' });
  }
});

// ── 유저 기반 최신 별 조회 헬퍼 ──────────────────────────────────
async function latestStarByUser(user_id) {
  if (!user_id) return null;
  const r = await db.query(
    `SELECT * FROM stars WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [user_id]
  );
  return r.rows[0] || null;
}

module.exports = router;
module.exports.latestStarByUser = latestStarByUser;
module.exports.calcDay          = calcDay;
module.exports.dayMessage       = dayMessage;
module.exports.IDENTITY         = IDENTITY;
