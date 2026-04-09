/**
 * experimentService.js — A/B 실험 배정 + 노출 로그
 *
 * - 배정: user_id를 해시해 결정론적으로 A/B 배정 (DB 저장)
 * - 문구 변형: A="더 깊은 분석 보기", B="지금 더 또렷하게 만들기"
 * - 버튼 위치: A=하단, B=중앙
 * - 가격 노출: A=클릭 후, B=미리 노출
 */

'use strict';

const crypto = require('crypto');
const db     = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('experimentService');

// ── 실험 키 ──────────────────────────────────────────────────────────
const EXPERIMENT_KEY = 'ai_upsell_v1';

// ── 그룹별 UX 변형 정의 ───────────────────────────────────────────────
const VARIANTS = {
  A: {
    group:          'A',
    copy_cta:       '더 깊은 분석 보기',
    button_position: 'bottom',    // 하단 고정
    price_exposed:   false,       // 클릭 후 가격 노출
    upsell_stages:  ['limit'],    // A그룹: 한도 도달 시만
  },
  B: {
    group:          'B',
    copy_cta:       '지금 더 또렷하게 만들기',
    button_position: 'center',    // 중앙 강조
    price_exposed:   true,        // 가격 미리 노출
    upsell_stages:  ['day1', 'day3', 'limit'], // B그룹: 3번 기회
  },
};

// ── 결정론적 그룹 배정 (hash 기반) ──────────────────────────────────
function _hashGroup(userId) {
  const hash = crypto.createHash('md5').update(userId + EXPERIMENT_KEY).digest('hex');
  return parseInt(hash[0], 16) % 2 === 0 ? 'A' : 'B';
}

// ── 유저 그룹 조회 (DB 캐시 우선) ────────────────────────────────────
async function assignGroup(userId) {
  if (!userId) return VARIANTS.A; // 비회원 → A 기본

  try {
    // DB에서 기존 배정 확인
    const { rows } = await db.query(
      `SELECT group_name FROM dt_experiment_assignments
       WHERE user_id = $1 AND experiment_key = $2 LIMIT 1`,
      [userId, EXPERIMENT_KEY]
    );

    if (rows[0]) {
      return VARIANTS[rows[0].group_name] ?? VARIANTS.A;
    }

    // 신규 배정
    const group = _hashGroup(userId);
    await db.query(
      `INSERT INTO dt_experiment_assignments (user_id, experiment_key, group_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, experiment_key) DO NOTHING`,
      [userId, EXPERIMENT_KEY, group]
    );
    return VARIANTS[group];
  } catch (e) {
    log.warn('그룹 배정 실패 → A 기본', { err: e.message });
    return VARIANTS.A;
  }
}

// ── 노출/전환 이벤트 기록 ─────────────────────────────────────────────
async function logExposure({ userId, group, stage, eventName, copyVariant, productType, context = {} }) {
  try {
    await db.query(
      `INSERT INTO dt_experiment_exposures
         (user_id, experiment_key, group_name, stage, event_name, copy_variant, product_type, context)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId ?? null, EXPERIMENT_KEY, group, stage, eventName, copyVariant ?? group, productType ?? null,
       Object.keys(context).length ? JSON.stringify(context) : null]
    );
  } catch (e) {
    log.warn('실험 노출 로그 실패', { err: e.message });
  }
}

// ── 실험 메트릭 조회 (관리자용) ──────────────────────────────────────
async function getExperimentStats() {
  try {
    const [funnelByGroup, funnelByStage, conversionByGroup] = await Promise.all([
      // 그룹별 이벤트 수
      db.query(`
        SELECT group_name, event_name, COUNT(*) AS count,
               COUNT(DISTINCT user_id) AS unique_users
        FROM dt_experiment_exposures
        WHERE experiment_key = $1
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY group_name, event_name
        ORDER BY group_name, event_name
      `, [EXPERIMENT_KEY]),

      // 스테이지별 노출
      db.query(`
        SELECT group_name, stage, COUNT(*) AS exposures,
               COUNT(*) FILTER (WHERE event_name = 'upgrade_clicked')  AS clicks,
               COUNT(*) FILTER (WHERE event_name = 'purchase_completed') AS purchases
        FROM dt_experiment_exposures
        WHERE experiment_key = $1
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY group_name, stage
        ORDER BY group_name, stage
      `, [EXPERIMENT_KEY]),

      // 그룹별 전환율
      db.query(`
        SELECT
          e.group_name,
          COUNT(DISTINCT e.user_id) AS total_exposed,
          COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'upgrade_clicked')    AS clicked,
          COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'purchase_completed') AS converted,
          ROUND(
            COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'purchase_completed')::numeric
            / NULLIF(COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'upgrade_prompt_shown'), 0) * 100,
            2
          ) AS cvr_pct,
          ROUND(
            COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'upgrade_clicked')::numeric
            / NULLIF(COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'upgrade_prompt_shown'), 0) * 100,
            2
          ) AS ctr_pct
        FROM dt_experiment_exposures e
        WHERE experiment_key = $1
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY e.group_name
      `, [EXPERIMENT_KEY]),
    ]);

    const stageByGroup = await db.query(`
      SELECT group_name, stage,
             COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'upgrade_prompt_shown') AS exposed,
             COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'upgrade_clicked')       AS clicked,
             COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'purchase_completed')    AS converted,
             ROUND(
               COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'upgrade_clicked')::numeric
               / NULLIF(COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'upgrade_prompt_shown'), 0) * 100, 1
             ) AS ctr_pct,
             ROUND(
               COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'purchase_completed')::numeric
               / NULLIF(COUNT(DISTINCT user_id) FILTER (WHERE event_name = 'upgrade_prompt_shown'), 0) * 100, 1
             ) AS cvr_pct
      FROM dt_experiment_exposures
      WHERE experiment_key = $1
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY group_name, stage
      ORDER BY stage, group_name
    `, [EXPERIMENT_KEY]);

    const verdict = _computeVerdict(conversionByGroup.rows, stageByGroup.rows);

    return {
      experiment_key:  EXPERIMENT_KEY,
      funnel_by_group: funnelByGroup.rows,
      funnel_by_stage: funnelByStage.rows,
      stage_by_group:  stageByGroup.rows,
      conversion:      conversionByGroup.rows,
      verdict,
    };
  } catch (e) {
    log.warn('실험 통계 조회 실패', { err: e.message });
    return null;
  }
}

// ── 승자 판정 로직 (루미 Day4~7 판정표 SSOT) ─────────────────────────
//
// 케이스 1 (완벽한 승리):  B.CTR ≥ A.CTR  AND  B.CVR ≥ A.CVR  → B 채택
// 케이스 2 (클릭만 잘됨):  B.CTR > A.CTR  AND  B.CVR < A.CVR  → 결제 UX 수정
// 케이스 3 (과한 UX):      B.CTR ≤ A.CTR  AND  B.CVR ≤ A.CVR  → A 유지
// 케이스 4 (애매한 경우):  CTR 비슷       AND  CVR 비슷         → 표본 부족
//
// 최종 결정 SSOT: CVR 기준 — 클릭은 신호, 결제가 확신
const SIMILAR_THRESHOLD = 0.15; // 15% 차이 이내 = "비슷"
const MIN_SAMPLE = 30;           // 30명 미만이면 표본 부족 강제

function _computeVerdict(conversionRows, stageRows) {
  const byGroup = {};
  for (const r of conversionRows) {
    byGroup[r.group_name] = {
      total_exposed: parseInt(r.total_exposed ?? 0),
      clicked:       parseInt(r.clicked ?? 0),
      converted:     parseInt(r.converted ?? 0),
      ctr_pct:       parseFloat(r.ctr_pct ?? 0),
      cvr_pct:       parseFloat(r.cvr_pct ?? 0),
    };
  }

  const A = byGroup['A'];
  const B = byGroup['B'];

  // 샘플 부족 체크
  const totalSample = (A?.total_exposed ?? 0) + (B?.total_exposed ?? 0);
  if (!A || !B || totalSample < MIN_SAMPLE) {
    return {
      case:       4,
      label:      '표본 부족',
      color:      'purple',
      winner:     null,
      action:     `현재 ${totalSample}명 / 최소 ${MIN_SAMPLE}명 필요. 실험 계속`,
      cvr_delta:  null,
      ctr_delta:  null,
      sample:     totalSample,
      stage_insights: _stageInsights(stageRows),
    };
  }

  const ctrDelta = B.ctr_pct - A.ctr_pct;   // 양수 = B 우세
  const cvrDelta = B.cvr_pct - A.cvr_pct;   // 양수 = B 우세

  // 유사 판단: 두 그룹 중 높은 쪽 대비 차이가 threshold 이내
  const ctrBase  = Math.max(A.ctr_pct, B.ctr_pct, 1);
  const cvrBase  = Math.max(A.cvr_pct, B.cvr_pct, 1);
  const ctrSimilar = Math.abs(ctrDelta) / ctrBase < SIMILAR_THRESHOLD;
  const cvrSimilar = Math.abs(cvrDelta) / cvrBase < SIMILAR_THRESHOLD;

  let verdict;

  // 케이스 4: 모두 비슷 (표본 충분하지만 차이 없음)
  if (ctrSimilar && cvrSimilar) {
    verdict = {
      case:   4, label: '애매한 경우', color: 'purple', winner: null,
      action: '200명까지 확장. 표본 확보 후 재판정',
    };

  // 케이스 1: 완벽한 승리 — B 우세 or 동일
  } else if (cvrDelta >= 0 && ctrDelta >= 0) {
    verdict = {
      case:   1, label: '완벽한 승리', color: 'green', winner: 'B',
      action: 'B를 기본 UX로 즉시 승격. A 종료',
    };

  // 케이스 2: CTR↑ but CVR↓ — B가 클릭은 끌지만 결제로 이어지지 않음
  } else if (ctrDelta > 0 && cvrDelta < 0) {
    verdict = {
      case:   2, label: '클릭만 잘됨', color: 'yellow', winner: null,
      action: 'B의 가격 노출 타이밍 or 결제 UX 수정 후 재실험',
    };

  // 케이스 3: 양쪽 모두 B 열세 — 과한 UX
  } else {
    verdict = {
      case:   3, label: '과한 UX', color: 'red', winner: 'A',
      action: 'A 유지. B 폐기. 다른 가설 설계',
    };
  }

  return {
    ...verdict,
    cvr_delta:       +cvrDelta.toFixed(2),
    ctr_delta:       +ctrDelta.toFixed(2),
    a:               { ctr_pct: A.ctr_pct, cvr_pct: A.cvr_pct, sample: A.total_exposed },
    b:               { ctr_pct: B.ctr_pct, cvr_pct: B.cvr_pct, sample: B.total_exposed },
    sample:          totalSample,
    stage_insights:  _stageInsights(stageRows),
    decided_by:      'CVR',   // SSOT: 결정은 항상 CVR 기준
  };
}

// ── 스테이지별 인사이트 문장 ──────────────────────────────────────────
function _stageInsights(stageRows) {
  const byStage = {};
  for (const r of stageRows) {
    if (!byStage[r.stage]) byStage[r.stage] = {};
    byStage[r.stage][r.group_name] = {
      exposed:   parseInt(r.exposed ?? 0),
      ctr_pct:   parseFloat(r.ctr_pct ?? 0),
      cvr_pct:   parseFloat(r.cvr_pct ?? 0),
    };
  }

  const insights = [];
  for (const [stage, groups] of Object.entries(byStage)) {
    const A = groups['A'];
    const B = groups['B'];
    if (!A || !B) continue;

    const ctrDelta = B.ctr_pct - A.ctr_pct;
    const cvrDelta = B.cvr_pct - A.cvr_pct;

    let msg;
    if (stage === 'day1' && ctrDelta > 5) {
      msg = `Day1 CTR +${ctrDelta.toFixed(1)}%p → 감동 직후 트리거 성공`;
    } else if (stage === 'day3' && cvrDelta > 0) {
      msg = `Day3 CVR +${cvrDelta.toFixed(1)}%p → 몰입 중간이 핵심 전환 포인트`;
    } else if (stage === 'limit' && cvrDelta > 0) {
      msg = `Limit CVR +${cvrDelta.toFixed(1)}%p → 한도 도달 구조가 유효`;
    } else if (stage === 'limit' && ctrDelta <= 0 && cvrDelta <= 0) {
      msg = `Limit 스테이지는 A 구조가 유효 — B 추가 트리거 효과 없음`;
    } else {
      msg = `${stage}: CTR ${ctrDelta >= 0 ? '+' : ''}${ctrDelta.toFixed(1)}%p, CVR ${cvrDelta >= 0 ? '+' : ''}${cvrDelta.toFixed(1)}%p`;
    }

    insights.push({ stage, a: A, b: B, ctr_delta: +ctrDelta.toFixed(1), cvr_delta: +cvrDelta.toFixed(1), insight: msg });
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
// DreamTown 범용 A/B 실험 엔진
// ═══════════════════════════════════════════════════════════════

// ── 실험 카탈로그 (동시 2개 이하 운영 규칙) ──────────────────────
const DT_EXPERIMENTS = {
  star_cta_test: {
    key:      'star_cta_test',
    problem:  'UX 문제',
    variants: {
      A: '지금 별을 만들어보세요',
      B: '당신의 별이 곧 시작됩니다',
    },
  },
  resonance_cta_test: {
    key:      'resonance_cta_test',
    problem:  '콘텐츠 문제',
    variants: {
      A: '공유하기',
      B: '이 감정을 나눠보세요',
    },
  },
};

// ── 범용 해시 배정 (0~99 버킷, 결정론적) ─────────────────────────
function assignVariant(userId, experimentKey) {
  const hash   = crypto.createHash('md5').update(userId + experimentKey).digest('hex');
  const bucket = parseInt(hash.substring(0, 8), 16) % 100;
  return bucket < 50 ? 'A' : 'B';
}

// ── 승자 우선 배정 (승자 있으면 모두 winner로, 없으면 랜덤) ──
async function assignVariantSmart(userId, experimentKey) {
  try {
    const { getActiveVariant } = require('./experimentEvaluator');
    const winner = await getActiveVariant(experimentKey);
    if (winner) return winner;
  } catch { /* fallback */ }
  return assignVariant(userId, experimentKey);
}

// ── UX 설정 조회 ─────────────────────────────────────────────
function getUXConfig(experimentKey, variant) {
  const config = require('./uxExperimentConfig')[experimentKey];
  return config?.variants[variant] ?? null;
}

// ── actionPlan 문제 → 실험 설정 매핑 ──────────────────────────────
function generateExperiment(action) {
  if (action.problem === 'UX 문제') {
    return DT_EXPERIMENTS.star_cta_test;
  }
  if (action.problem === '콘텐츠 문제') {
    return DT_EXPERIMENTS.resonance_cta_test;
  }
  return null;
}

// ── dreamtown_flow 기반 실험 결과 집계 ───────────────────────────
async function getExperimentResults({ days = 7, experimentKey } = {}) {
  try {
    const keyFilter = experimentKey
      ? `AND value->>'experiment' = '${experimentKey}'`
      : '';

    const { rows } = await db.query(`
      SELECT
        value->>'experiment'                                             AS experiment_key,
        value->>'variant'                                               AS variant,
        COUNT(*) FILTER (WHERE action = 'exposure')::int                AS exposures,
        COUNT(*) FILTER (WHERE action = 'conversion')::int              AS conversions,
        ROUND(
          COUNT(*) FILTER (WHERE action = 'conversion')::numeric
          / NULLIF(COUNT(*) FILTER (WHERE action = 'exposure'), 0) * 100, 1
        )                                                               AS conversion_rate
      FROM dreamtown_flow
      WHERE stage = 'experiment'
        ${keyFilter}
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY value->>'experiment', value->>'variant'
      ORDER BY value->>'experiment', value->>'variant'
    `);
    return rows;
  } catch (e) {
    log.warn('실험 결과 집계 실패', { err: e?.message });
    return [];
  }
}

// ── 자동 승자 선택 (B CVR가 A보다 10% 이상 높으면 B 승) ─────────
function computeWinner(results) {
  // 실험키별로 그룹화
  const byKey = {};
  for (const r of results) {
    if (!byKey[r.experiment_key]) byKey[r.experiment_key] = {};
    byKey[r.experiment_key][r.variant] = r;
  }

  const summary = [];
  for (const [key, groups] of Object.entries(byKey)) {
    const A = groups['A'];
    const B = groups['B'];
    if (!A || !B) {
      summary.push({ key, winner: null, reason: '표본 부족' });
      continue;
    }
    const rateA = parseFloat(A.conversion_rate ?? 0);
    const rateB = parseFloat(B.conversion_rate ?? 0);
    let winner, reason;
    if (rateB > rateA * 1.1) {
      winner = 'B'; reason = `B ${rateB}% vs A ${rateA}% (+${((rateB/rateA-1)*100).toFixed(0)}%)`;
    } else if (rateA > rateB * 1.1) {
      winner = 'A'; reason = `A ${rateA}% vs B ${rateB}%`;
    } else {
      winner = null; reason = `차이 미미 (A ${rateA}% / B ${rateB}%)`;
    }
    summary.push({ key, winner, reason, A, B });
  }
  return summary;
}

module.exports = {
  assignGroup,
  logExposure,
  getExperimentStats,
  // DreamTown 범용 실험 엔진
  assignVariant,
  assignVariantSmart,
  getUXConfig,
  generateExperiment,
  getExperimentResults,
  computeWinner,
  DT_EXPERIMENTS,
  EXPERIMENT_KEY,
  VARIANTS,
};
