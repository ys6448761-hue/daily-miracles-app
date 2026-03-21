/**
 * kpiRepository.js — KPI 대시보드 DB 쿼리 계층
 *
 * 정본: dt_kpi_events (서버 사이드 emit)
 * star_created는 dt_stars를 직접 카운트 (서버 emit 추가 후엔 dt_kpi_events 단일화 가능)
 */

'use strict';

const db = require('../database/db');

// ── 범위 시작 시점 계산 ────────────────────────────────────────────
// 'today' = 한국 시간(UTC+9) 기준 자정
function getRangeStart(range) {
  const now = new Date();
  if (range === 'today') {
    const koreaIso = new Date(now.getTime() + 9 * 3600_000)
      .toISOString()
      .slice(0, 10); // 'YYYY-MM-DD' in KST
    return new Date(`${koreaIso}T00:00:00+09:00`);
  }
  if (range === '7d')  return new Date(now.getTime() - 7  * 86_400_000);
  if (range === '30d') return new Date(now.getTime() - 30 * 86_400_000);
  return new Date(now.getTime() - 7 * 86_400_000); // default
}

// ── dt_kpi_events 이벤트별 카운트 ────────────────────────────────
async function getEventCounts(rangeStart) {
  const r = await db.query(
    `SELECT event_name, COUNT(*)::int AS cnt
       FROM dt_kpi_events
      WHERE created_at >= $1
      GROUP BY event_name`,
    [rangeStart]
  );
  const map = {};
  for (const row of r.rows) map[row.event_name] = row.cnt;
  return map;
}

// ── 별 생성 수 (dt_stars 직접 카운트) ────────────────────────────
async function getStarCount(rangeStart) {
  const r = await db.query(
    `SELECT COUNT(*)::int AS cnt FROM dt_stars WHERE created_at >= $1`,
    [rangeStart]
  );
  return r.rows[0]?.cnt ?? 0;
}

// ── resonance_received 별 수 (DISTINCT star_id) ───────────────────
async function getResonanceReceivedStarCount(rangeStart) {
  const r = await db.query(
    `SELECT COUNT(DISTINCT star_id)::int AS cnt
       FROM dt_kpi_events
      WHERE event_name = 'resonance_received'
        AND created_at >= $1`,
    [rangeStart]
  );
  return r.rows[0]?.cnt ?? 0;
}

// ── 안전 통계 (dt_wishes safety_level 기준) ───────────────────────
async function getSafetyStats(rangeStart) {
  const r = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE safety_level = 'RED')   ::int AS red_blocked,
       COUNT(*) FILTER (WHERE safety_level = 'YELLOW')::int AS yellow_hidden,
       COUNT(*) FILTER (WHERE safety_level = 'GREEN') ::int AS green_passed
       FROM dt_wishes
      WHERE created_at >= $1`,
    [rangeStart]
  );
  return r.rows[0] ?? { red_blocked: 0, yellow_hidden: 0, green_passed: 0 };
}

// ── 최근 이벤트 스트림 ────────────────────────────────────────────
async function getRecentEvents(limit = 20) {
  const r = await db.query(
    `SELECT event_name, star_id, source, extra, created_at
       FROM dt_kpi_events
      ORDER BY created_at DESC
      LIMIT $1`,
    [limit]
  );
  return r.rows;
}

module.exports = {
  getRangeStart,
  getEventCounts,
  getStarCount,
  getResonanceReceivedStarCount,
  getSafetyStats,
  getRecentEvents,
};
