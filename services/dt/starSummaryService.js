'use strict';

/**
 * starSummaryService.js
 * GET /api/dt/star/summary 응답 생성기
 * "별 페이지 = 내가 어떻게 변하고 있는지 느끼는 공간"
 */

const db  = require('../../database/db');
const cfg = require('./config/starContentConfig');

function generatePhaseMessage(phase) { return cfg.getPhaseMessage(phase); }
function generateNextAction(phase)   { return cfg.getNextAction(phase); }

// ── 최근 7일 로그 조회 ────────────────────────────────────────────
async function getLastLogs(starId, days = 7) {
  const { rows } = await db.query(
    `SELECT log_date, state, emotion_signal, help_tag, growth_sentence
     FROM star_daily_logs
     WHERE star_id = $1
       AND log_date >= CURRENT_DATE - $2
     ORDER BY log_date ASC`,
    [starId, days]
  );
  return rows;
}

// ── flow 포맷 (UI용 날짜 + 상태) ─────────────────────────────────
function formatFlow(logs) {
  return logs.map(l => ({
    date:  String(l.log_date).slice(5).replace('-', '-'), // "MM-DD"
    state: l.state,
  }));
}

// ── 장소-감정 인사이트 생성 ───────────────────────────────────────
const SPOT_KO   = { home: '집', cafe: '카페', work: '직장', outdoor: '야외', transit: '이동 중', other: '그 공간' };
const STATE_ADJ = {
  SEARCHING:  '정리가 잘 안 되는',
  BLOCKED:    '멈추게 되는',
  ANXIETY:    '불안해지는',
  RECOVERY:   '회복되는',
  GROWTH:     '성장하는',
  HESITATION: '망설이는',
  TRANSITION: '변화가 느껴지는',
  RELATION:   '연결이 느껴지는',
};

async function generateInsight(starId) {
  const { rows } = await db.query(
    `SELECT ls.spot_type,
            (array_agg(sdl.state ORDER BY sdl.created_at DESC))[1] AS recent_state,
            COUNT(*) AS cnt
     FROM star_daily_logs sdl
     JOIN life_spots ls ON sdl.life_spot_id = ls.id
     WHERE sdl.star_id = $1 AND sdl.life_spot_id IS NOT NULL
     GROUP BY ls.spot_type
     ORDER BY cnt DESC
     LIMIT 2`,
    [starId]
  );

  if (rows.length === 0) return null;

  const parts = rows.map(r => {
    const spot = SPOT_KO[r.spot_type]    || r.spot_type;
    const adj  = STATE_ADJ[r.recent_state] || r.recent_state;
    return `${spot}에서는 ${adj} 편이에요`;
  });

  return parts.join(', ');
}

// ── 최신 성장 문장 ────────────────────────────────────────────────
function pickLatestGrowth(logs) {
  const last = [...logs].reverse().find(l => l.growth_sentence);
  return last?.growth_sentence || '조금씩 나아가고 있어요';
}

// ── 핵심: getStarSummary ──────────────────────────────────────────
async function getStarSummary(userId) {
  // 사용자의 최신 별 조회
  const { rows: starRows } = await db.query(
    `SELECT id FROM dt_stars WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  const starId = starRows[0]?.id;

  if (!starId) {
    return {
      star:        { phase: '시작', phase_message: generatePhaseMessage('시작') },
      flow:        [],
      pattern:     { dominant_state: null, dominant_help_tag: null, insight: null },
      growth:      { message: '조금씩 나아가고 있어요' },
      next_action: { text: generateNextAction('시작') },
    };
  }

  // timeline_summary 조회
  const { rows: sumRows } = await db.query(
    `SELECT current_phase, dominant_state, dominant_help_tag, growth_score
     FROM star_timeline_summary WHERE star_id = $1`,
    [starId]
  );
  const summary = sumRows[0];
  const phase   = summary?.current_phase || '시작';

  // 최근 7일 로그
  const logs = await getLastLogs(starId, 7);

  // 인사이트 (장소-감정 패턴)
  const insight = await generateInsight(starId);

  return {
    star: {
      phase,
      phase_message: generatePhaseMessage(phase),
    },
    flow: formatFlow(logs),
    pattern: {
      dominant_state:    summary?.dominant_state    || null,
      dominant_help_tag: summary?.dominant_help_tag || null,
      insight,
    },
    growth: {
      message: pickLatestGrowth(logs),
    },
    next_action: {
      text: generateNextAction(phase),
    },
  };
}

module.exports = {
  getStarSummary,
  generatePhaseMessage,
  generateNextAction,
  formatFlow,
  pickLatestGrowth,
};
