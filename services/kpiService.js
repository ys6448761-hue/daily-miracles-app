/**
 * kpiService.js — KPI 대시보드 집계 로직
 *
 * 퍼널: star_created → resonance_created → impact_created → connection_completed
 * North Star: 공명 받은 별 / 전체 별
 *
 * 전환율 규칙:
 *   resonance_rate    = resonance_created / star_created
 *   impact_rate       = impact_created    / resonance_created
 *   connection_rate   = connection_completed / resonance_received (별 단위)
 *
 * impact_created는 구조상 owner 기준 → same star 기준으로 계산 (OK)
 */

'use strict';

const repo = require('../repositories/kpiRepository');

function pct(num, den) {
  if (!den || !num) return 0;
  return +((num / den) * 100).toFixed(1);
}

async function getDashboard(range = '7d') {
  const rangeStart = repo.getRangeStart(range);

  const [eventCounts, starCount, resonanceReceivedStars, safetyStats, recentEvents] =
    await Promise.all([
      repo.getEventCounts(rangeStart),
      repo.getStarCount(rangeStart),
      repo.getResonanceReceivedStarCount(rangeStart),
      repo.getSafetyStats(rangeStart),
      repo.getRecentEvents(20),
    ]);

  const resonanceCreated   = eventCounts['resonance_created']    ?? 0;
  const impactCreated      = eventCounts['impact_created']       ?? 0;
  const connCompleted      = eventCounts['connection_completed'] ?? 0;
  const growthLogged       = eventCounts['growth_logged']        ?? 0;
  const milestoneDay7      = eventCounts['milestone_day7']       ?? 0;

  return {
    north_star: {
      label:       '공명 받은 별',
      description: '적어도 1번 이상 공명을 받은 별',
      value:       resonanceReceivedStars,
      total_stars: starCount,
      rate_pct:    pct(resonanceReceivedStars, starCount),
    },

    funnel: {
      star_created: {
        count: starCount,
        label: '별 생성',
        rate_pct: 100,
      },
      resonance_created: {
        count:    resonanceCreated,
        label:    '공명 발생',
        rate_pct: pct(resonanceCreated, starCount),
      },
      impact_created: {
        count:    impactCreated,
        label:    '나눔 생성',
        rate_pct: pct(impactCreated, resonanceCreated),
        note:     'same-star 기준 (공명→나눔 전환)',
      },
      connection_completed: {
        count:    connCompleted,
        label:    '연결 완료',
        rate_pct: pct(connCompleted, resonanceReceivedStars),
      },
    },

    stage_metrics: {
      growth_logged: {
        count: growthLogged,
        label: '성장 기록',
        rate_pct: pct(growthLogged, starCount),
      },
      milestone_day7: {
        count: milestoneDay7,
        label: 'Day 7 재방문',
        note:  'GA4 보조 확인 권장 (서버 emit 미연결)',
      },
      quick_click_rate:  { value: 0, note: 'TODO: 전용 이벤트 필요' },
      expand_rate:       { value: 0, note: 'TODO: 전용 이벤트 필요' },
      avg_time_to_click: { value: 0, note: 'TODO: 전용 이벤트 필요' },
    },

    safety: safetyStats,

    experiments: [], // TODO: A/B 실험 데이터

    today_actions: recentEvents.map(row => ({
      event:      row.event_name,
      star_id:    row.star_id,
      source:     row.source,
      extra:      row.extra,
      created_at: row.created_at,
    })),

    meta: {
      range,
      range_start:     rangeStart.toISOString(),
      timezone:        'Asia/Seoul',
      source_of_truth: 'db.dt_kpi_events',
    },
  };
}

module.exports = { getDashboard };
