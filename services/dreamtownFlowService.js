/**
 * dreamtownFlowService.js — DreamTown Full Loop 이벤트 로그 & KPI
 *
 * 흐름: wish → star → growth → resonance → impact → connection
 *
 * 사용법:
 *   const flow = require('./dreamtownFlowService');
 *   await flow.log({ userId, stage: 'wish', action: 'create', value: { gem:'ruby', emotion:'hope' }, refId: wishId });
 */

'use strict';

const db           = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('dtFlow');

// ── 감정 4개 (UX "3초 반응" 원칙) ────────────────────────────
const EMOTIONS = [
  { key: 'relieved',   label: '숨이 놓였어요' },
  { key: 'believing',  label: '믿고 싶어졌어요' },
  { key: 'organized',  label: '정리됐어요' },
  { key: 'courageous', label: '용기났어요' },
];

const STAGES  = ['wish','star','growth','resonance','impact','connection'];
const ACTIONS = {
  wish:       ['create','edit','delete'],
  star:       ['create','name','activate'],
  growth:     ['day1_start','day3_check','day7_complete','log_entry'],
  resonance:  ['trigger','share','comment','react'],
  impact:     ['share','miracle_note','badge_earned'],
  connection: ['join','follow','constellation_link'],
};

// ── 이벤트 기록 ───────────────────────────────────────────────
async function log_event({ userId, stage, action, value = {}, refId = null, sessionId = null }) {
  if (!STAGES.includes(stage)) throw new Error(`허용되지 않는 stage: ${stage}`);
  if (!userId) throw new Error('userId 필요');

  try {
    await db.query(
      `INSERT INTO dreamtown_flow (user_id, stage, action, value, ref_id, session_id)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
      [String(userId), stage, action, JSON.stringify(value), refId ?? null, sessionId ?? null]
    );
  } catch (e) {
    const msg = e?.message || e?.detail || String(e) || '알 수 없는 오류';
    log.warn('flow 기록 실패', { err: msg, stage, action });
    // 기록 실패는 사용자 흐름을 막지 않음
  }

  // star_profile 자동 동기 (refId = starId인 경우만)
  if (refId) {
    try {
      const { syncFromFlow } = require('./starProfileService');
      await syncFromFlow({ userId: String(userId), starId: String(refId), stage, action, value });
    } catch (e) {
      log.warn('star_profile 동기 실패', { err: e?.message });
    }
  }
}

// ── 7일 KPI 집계 (뷰 사용) ───────────────────────────────────
async function getKpiSummary({ days = 7 } = {}) {
  try {
    let kpiRow;
    if (days === 7) {
      const { rows } = await db.query('SELECT * FROM dreamtown_kpi_7d');
      kpiRow = rows[0] ?? null;
    } else {
      const { rows } = await db.query(`
        WITH period AS (SELECT NOW() - INTERVAL '${days} days' AS since),
        wishes  AS (SELECT COUNT(DISTINCT user_id) n FROM dreamtown_flow, period WHERE stage='wish'      AND action='create'        AND created_at>=since),
        stars   AS (SELECT COUNT(DISTINCT user_id) n FROM dreamtown_flow, period WHERE stage='star'      AND action='create'        AND created_at>=since),
        day1    AS (SELECT COUNT(DISTINCT user_id) n FROM dreamtown_flow, period WHERE stage='growth'    AND action='day1_start'    AND created_at>=since),
        day7    AS (SELECT COUNT(DISTINCT user_id) n FROM dreamtown_flow, period WHERE stage='growth'    AND action='day7_complete' AND created_at>=since),
        res_u   AS (SELECT COUNT(DISTINCT user_id) n FROM dreamtown_flow, period WHERE stage='resonance'                            AND created_at>=since),
        total_u AS (SELECT COUNT(DISTINCT user_id) n FROM dreamtown_flow, period WHERE                                               created_at>=since)
        SELECT
          wishes.n                                                   AS wish_count,
          stars.n                                                    AS star_count,
          ROUND(stars.n::numeric / NULLIF(wishes.n,0)*100,1)        AS star_creation_rate,
          day1.n                                                     AS growth_day1_count,
          day7.n                                                     AS growth_day7_count,
          ROUND(day7.n::numeric  / NULLIF(day1.n,0) *100,1)         AS growth_persist_rate,
          res_u.n                                                    AS resonance_user_count,
          total_u.n                                                  AS total_active_users,
          ROUND(res_u.n::numeric / NULLIF(total_u.n,0)*100,1)       AS resonance_rate
        FROM wishes,stars,day1,day7,res_u,total_u
      `);
      kpiRow = rows[0] ?? null;
    }

    if (!kpiRow) return null;

    // verdict + actionPlan 포함하여 반환
    const verdict    = computeVerdict(kpiRow);
    const actionPlan = generateActionPlan(kpiRow);
    return { ...kpiRow, verdict, actionPlan };

  } catch (e) {
    log.warn('KPI 집계 실패', { err: e?.message || String(e) });
    return null;
  }
}

// ── 일별 트렌드 ───────────────────────────────────────────────
async function getDailyTrend({ days = 7 } = {}) {
  try {
    const { rows } = await db.query(`
      SELECT
        DATE(created_at AT TIME ZONE 'Asia/Seoul') AS kst_date,
        COUNT(*) FILTER (WHERE stage='wish'      AND action='create')        AS wishes,
        COUNT(*) FILTER (WHERE stage='star'      AND action='create')        AS stars,
        COUNT(*) FILTER (WHERE stage='growth'    AND action='day1_start')    AS growth_starts,
        COUNT(*) FILTER (WHERE stage='growth'    AND action='day7_complete') AS growth_completes,
        COUNT(*) FILTER (WHERE stage='resonance')                            AS resonances,
        COUNT(DISTINCT user_id)                                              AS active_users
      FROM dreamtown_flow
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY kst_date
      ORDER BY kst_date DESC
    `);
    return rows;
  } catch (e) {
    log.warn('일별 트렌드 실패', { err: e?.message || String(e) });
    return [];
  }
}

// ── 루미 판정 ─────────────────────────────────────────────────
// 목표: 별생성률 70%+ / 성장지속률 50%+ / 공명률 20%+
const GOALS = {
  star_creation_rate:  70,
  growth_persist_rate: 50,
  resonance_rate:      20,
};

function computeVerdict(kpi) {
  if (!kpi || kpi.total_active_users == null || Number(kpi.total_active_users) === 0) {
    return { status: 'insufficient_data', label: '데이터 수집 중', color: '⬜', insights: [] };
  }

  const starOk     = parseFloat(kpi.star_creation_rate  ?? 0) >= GOALS.star_creation_rate;
  const growthOk   = parseFloat(kpi.growth_persist_rate ?? 0) >= GOALS.growth_persist_rate;
  const resonOk    = parseFloat(kpi.resonance_rate      ?? 0) >= GOALS.resonance_rate;
  const passed     = [starOk, growthOk, resonOk].filter(Boolean).length;

  const insights = [];
  if (!starOk)   insights.push('별 생성률 미달 → UX 문제 (소원→별 전환 개선 필요)');
  if (!growthOk) insights.push('성장 지속률 미달 → 온보딩 문제 (7일 여정 동기 강화)');
  if (!resonOk)  insights.push('공명률 미달 → 콘텐츠 문제 (SNS 공유 강화 필요)');

  if (passed === 3) return { status: 'success', label: '모든 목표 달성', color: '🟢', insights };
  if (passed === 2) return { status: 'partial',  label: '2/3 목표 달성',  color: '🟡', insights };
  if (passed === 1) return { status: 'weak',     label: '1/3 목표 달성',  color: '🟠', insights };
  return              { status: 'critical', label: '목표 미달성',      color: '🔴', insights };
}

// ── 자동 개선 제안 ────────────────────────────────────────────
function generateActionPlan(kpi) {
  if (!kpi) return [];
  const actions = [];

  const starRate      = parseFloat(kpi.star_creation_rate  ?? 0);
  const growthRate    = parseFloat(kpi.growth_persist_rate ?? 0);
  const resonanceRate = parseFloat(kpi.resonance_rate      ?? 0);

  if (starRate < GOALS.star_creation_rate) {
    actions.push({
      problem:  'UX 문제',
      metric:   'star_creation_rate',
      current:  starRate,
      target:   GOALS.star_creation_rate,
      owner:    ['Code', '코미'],
      severity: 'high',
      actions: [
        '소원 입력 → 별 생성 CTA 문구 A/B 테스트',
        '보석 선택 단계 이탈 로그 추가',
        '별 생성 완료까지 소요 시간 측정',
      ],
    });
  }

  if (growthRate < GOALS.growth_persist_rate) {
    actions.push({
      problem:  '온보딩 문제',
      metric:   'growth_persist_rate',
      current:  growthRate,
      target:   GOALS.growth_persist_rate,
      owner:    ['루미', '재미'],
      severity: 'medium',
      actions: [
        'Day1 메시지 감정선 개선',
        'Day3 이탈 구간 분석',
        '감정 선택 UX 단순화',
      ],
    });
  }

  if (resonanceRate < GOALS.resonance_rate) {
    actions.push({
      problem:  '콘텐츠 문제',
      metric:   'resonance_rate',
      current:  resonanceRate,
      target:   GOALS.resonance_rate,
      owner:    ['재미', '코미'],
      severity: 'medium',
      actions: [
        '공유 CTA 문구 개선',
        '피드 카드 디자인 개선',
        'SNS 공유 포맷 실험',
      ],
    });
  }

  return actions;
}

module.exports = {
  log: log_event,
  getKpiSummary,
  getDailyTrend,
  computeVerdict,
  generateActionPlan,
  STAGES,
  ACTIONS,
  GOALS,
  EMOTIONS,
};
