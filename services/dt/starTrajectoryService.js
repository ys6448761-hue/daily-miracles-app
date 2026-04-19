'use strict';

/**
 * starTrajectoryService.js
 * life_spot_logs → star_daily_logs → star_timeline_summary
 * 별이 자라는 흐름을 재구성하는 코어 서비스
 */

const db  = require('../../database/db');
const { makeLogger } = require('../../utils/logger');
const log = makeLogger('starTrajectory');

// ── Phase 계산 ────────────────────────────────────────────────────
// 스펙 원본 순서: ANXIETY가 최우선 (가장 먼저 감지)
const PHASE_MAP = [
  { state: 'ANXIETY',    phase: '흔들림' },
  { state: 'BLOCKED',    phase: '정리' },
  { state: 'HESITATION', phase: '실행 전' },
  { state: 'RECOVERY',   phase: '회복' },
  { state: 'TRANSITION', phase: '전환' },
  { state: 'GROWTH',     phase: '성장' },
];

function calculatePhase(lastStates = []) {
  for (const { state, phase } of PHASE_MAP) {
    if (lastStates.includes(state)) return phase;
  }
  return '시작';
}

// ── 빈도 최다값 ───────────────────────────────────────────────────
function mostFrequent(arr) {
  if (!arr || arr.length === 0) return null;
  const freq = {};
  for (const v of arr) freq[v] = (freq[v] || 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

// ── 트렌드 감지 (최근 → 성장 방향성) ────────────────────────────
const POSITIVE_STATES  = new Set(['RECOVERY', 'TRANSITION', 'GROWTH']);
const GROWTH_SCORE_MAP = {
  GROWTH: 3, TRANSITION: 2, RECOVERY: 2,
  HESITATION: 1, RELATION: 1,
  SEARCHING: 0, BLOCKED: -1, ANXIETY: -1,
};

function calcGrowthScore(logs) {
  return logs.reduce((sum, l) => sum + (GROWTH_SCORE_MAP[l.state] ?? 0), 0);
}

function analyzePatterns(logs) {
  return {
    dominant_state:    mostFrequent(logs.map(l => l.state)),
    dominant_help_tag: mostFrequent(logs.map(l => l.help_tag)),
    growth_score:      calcGrowthScore(logs),
    phase:             calculatePhase(logs.map(l => l.state)),
  };
}

// ── 사용자의 활성 별 조회 ─────────────────────────────────────────
async function getActiveStarId(userId) {
  const { rows } = await db.query(
    `SELECT id FROM dt_stars
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0]?.id || null;
}

// ── star_daily_logs 생성 (life_spot_log → star 연결) ─────────────
async function createStarDailyLog({ userId, starId, spotLog }) {
  if (!userId || !starId || !spotLog) return null;
  try {
    const { rows } = await db.query(
      `INSERT INTO star_daily_logs
         (user_id, star_id, log_date, state, emotion_signal, help_tag, growth_sentence, life_spot_id, source_log_id)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId, starId,
        spotLog.state, spotLog.emotion_signal, spotLog.help_tag,
        spotLog.growth_sentence, spotLog.spot_id || null, spotLog.id || null,
      ]
    );
    return rows[0]?.id;
  } catch (err) {
    log.warn('star_daily_log 생성 실패 (계속)', { err: err.message });
    return null;
  }
}

// ── star_travel_logs 생성 ─────────────────────────────────────────
async function createStarTravelLog({ userId, starId, placeType, placeName, engineResult }) {
  const { state, growth } = engineResult;
  const { rows } = await db.query(
    `INSERT INTO star_travel_logs
       (user_id, star_id, place_type, place_name, state, emotion_signal, help_tag, growth_sentence)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [userId, starId, placeType, placeName, state,
     growth.emotion_signal, growth.help_tag, growth.growth_sentence]
  );
  return rows[0]?.id;
}

// ── star_timeline_summary 업데이트 ───────────────────────────────
async function refreshTimelineSummary(starId) {
  try {
    // 최근 7일 / 30일 로그 수집
    const [res7, res30] = await Promise.all([
      db.query(
        `SELECT state, emotion_signal, help_tag, growth_sentence, log_date
         FROM star_daily_logs
         WHERE star_id = $1 AND log_date >= CURRENT_DATE - 7
         ORDER BY log_date DESC`,
        [starId]
      ),
      db.query(
        `SELECT state, emotion_signal, help_tag, growth_sentence, log_date
         FROM star_daily_logs
         WHERE star_id = $1 AND log_date >= CURRENT_DATE - 30
         ORDER BY log_date DESC`,
        [starId]
      ),
    ]);

    const logs7  = res7.rows;
    const logs30 = res30.rows;
    const p30    = analyzePatterns(logs30.length > 0 ? logs30 : logs7);
    const phase  = calculatePhase(logs7.map(l => l.state));

    await db.query(
      `INSERT INTO star_timeline_summary
         (star_id, current_phase, last_7d_pattern, last_30d_pattern,
          dominant_state, dominant_help_tag, growth_score, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (star_id) DO UPDATE SET
         current_phase     = EXCLUDED.current_phase,
         last_7d_pattern   = EXCLUDED.last_7d_pattern,
         last_30d_pattern  = EXCLUDED.last_30d_pattern,
         dominant_state    = EXCLUDED.dominant_state,
         dominant_help_tag = EXCLUDED.dominant_help_tag,
         growth_score      = EXCLUDED.growth_score,
         updated_at        = NOW()`,
      [
        starId, phase,
        JSON.stringify(analyzePatterns(logs7)),
        JSON.stringify(p30),
        p30.dominant_state, p30.dominant_help_tag, p30.growth_score,
      ]
    );
  } catch (err) {
    log.warn('timeline_summary 업데이트 실패 (계속)', { err: err.message });
  }
}

// ── 별 궤적 전체 조회 (UI용) ─────────────────────────────────────
async function getStarTrajectory(starId) {
  const [summary, recent7, spotPattern] = await Promise.all([
    db.query(
      `SELECT current_phase, dominant_state, dominant_help_tag, growth_score,
              last_7d_pattern, last_30d_pattern, updated_at
       FROM star_timeline_summary WHERE star_id = $1`,
      [starId]
    ),
    db.query(
      `SELECT log_date, state, emotion_signal, help_tag, growth_sentence
       FROM star_daily_logs
       WHERE star_id = $1
       ORDER BY log_date DESC
       LIMIT 7`,
      [starId]
    ),
    // 장소 유형별 dominant 감정
    db.query(
      `SELECT ls.spot_type,
              (array_agg(sdl.state ORDER BY sdl.created_at DESC))[1] AS recent_state,
              COUNT(*) AS visit_count
       FROM star_daily_logs sdl
       JOIN life_spots ls ON sdl.life_spot_id = ls.id
       WHERE sdl.star_id = $1
         AND sdl.life_spot_id IS NOT NULL
       GROUP BY ls.spot_type
       ORDER BY visit_count DESC`,
      [starId]
    ),
  ]);

  const s = summary.rows[0];

  return {
    star_id:       starId,
    current_phase: s?.current_phase || '시작',
    growth_score:  s?.growth_score  || 0,
    phase_message: buildPhaseMessage(s?.current_phase),
    recent_flow:   recent7.rows,
    spot_insight:  buildSpotInsight(spotPattern.rows),
    last_7d:       s?.last_7d_pattern  || {},
    last_30d:      s?.last_30d_pattern || {},
  };
}

// ── UI 메시지 생성 ────────────────────────────────────────────────
const PHASE_MESSAGES = {
  '시작':    '이제 막 출발선에 서 있어요',
  '흔들림':  '지금은 흔들리는 중이에요. 그게 당연해요',
  '정리':    '지금은 정리가 필요한 시간이에요',
  '실행 전': '시작 직전에 와 있어요',
  '회복':    '조금씩 나아지고 있는 시간이에요',
  '전환':    '달라지기 시작하는 순간이에요',
  '성장':    '이미 충분히 멀리 와 있어요',
};

function buildPhaseMessage(phase) {
  return PHASE_MESSAGES[phase] || PHASE_MESSAGES['시작'];
}

function buildSpotInsight(rows) {
  if (!rows || rows.length === 0) return null;
  const STATE_KO = {
    SEARCHING: '정리가 잘 안 되는', BLOCKED: '멈추게 되는',
    ANXIETY: '불안해지는', RECOVERY: '회복되는',
    GROWTH: '성장하는', HESITATION: '망설이는',
    TRANSITION: '변화가 느껴지는', RELATION: '연결이 느껴지는',
  };
  const TYPE_KO = {
    home: '집', cafe: '카페', work: '직장',
    outdoor: '야외', transit: '이동 중', other: '그 공간',
  };
  const lines = rows.map(r =>
    `${TYPE_KO[r.spot_type] || r.spot_type}에서는 ${STATE_KO[r.recent_state] || r.recent_state} 편이에요`
  );
  return lines.join(', ');
}

module.exports = {
  createStarDailyLog,
  createStarTravelLog,
  refreshTimelineSummary,
  getStarTrajectory,
  getActiveStarId,
  calculatePhase,
  analyzePatterns,
};
