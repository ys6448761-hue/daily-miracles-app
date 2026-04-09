/**
 * recommendationService.js — DreamTown 항로 추천 엔진
 *
 * 원칙:
 *   - 추천은 "콘텐츠 추천"이 아니라 "다음 항로 추천"
 *   - 항상 1개만 반환 (다수 추천 금지)
 *   - 강요 없음 — show 후 클릭은 사용자 선택
 *   - 새 데이터 없음 — dreamtown_flow + star_profile만 활용
 *
 * 흐름:
 *   getUserStage(flow) → detectGap(profile) → generateRecommendation()
 */

'use strict';

const db   = require('../database/db');
const flow = require('./dreamtownFlowService');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('recommendation');

// ── Step 1. 현재 단계 판단 (dreamtown_flow 기반) ──────────────
async function getUserStage(userId) {
  const { rows } = await db.query(
    `SELECT DISTINCT stage FROM dreamtown_flow WHERE user_id = $1`,
    [userId]
  );
  const stages = new Set(rows.map(r => r.stage));

  if (!stages.has('star'))      return 'wish';
  if (!stages.has('growth'))    return 'growth';
  if (!stages.has('resonance')) return 'resonance';
  return 'connection';
}

// ── Step 2. 부족한 축 감지 (star_profile 기반) ────────────────
async function detectGap(userId) {
  try {
    const { rows } = await db.query(
      `SELECT growth, resonance, impact FROM star_profile WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (!rows.length) return 'growth';

    const p = rows[0];
    if (!p.growth   || Object.keys(p.growth).length   === 0) return 'growth';
    if (!p.resonance || Object.keys(p.resonance).length === 0) return 'resonance';
    if (!p.impact   || Object.keys(p.impact).length   === 0) return 'impact';
    return null;
  } catch {
    return 'growth'; // DB 오류 시 성장 단계 유도
  }
}

// ── Step 3. 추천 생성 (gap 기준 1개) ──────────────────────────
function generateRecommendation(stage, gap) {
  if (gap === 'growth') {
    return {
      type:    'action',
      message: '오늘의 작은 행동 하나를 선택해보세요',
      cta:     '지금 시작하기',
    };
  }
  if (gap === 'resonance') {
    return {
      type:    'social',
      message: '이 감정을 나눠보면 더 또렷해져요',
      cta:     '공명하기',
    };
  }
  if (gap === 'impact') {
    return {
      type:    'impact',
      message: '당신의 경험이 누군가에게 힘이 될 수 있어요',
      cta:     '나눔하기',
    };
  }
  return null; // gap 없음 → 추천 없음
}

// ── 추천 조회 + show 로그 ─────────────────────────────────────
async function getRecommendation(userId) {
  const [stage, gap] = await Promise.all([
    getUserStage(userId),
    detectGap(userId),
  ]);

  const recommendation = generateRecommendation(stage, gap);

  if (recommendation) {
    flow.log({
      userId,
      stage:  'recommendation',
      action: 'show',
      value:  { type: gap, rec_type: recommendation.type },
    }).catch(() => {});

    log.info('추천 노출', { userId, stage, gap, type: recommendation.type });
  }

  return { stage, gap, recommendation };
}

// ── 클릭 로그 ──────────────────────────────────────────────────
async function logClick(userId, gap) {
  await flow.log({
    userId,
    stage:  'recommendation',
    action: 'click',
    value:  { type: gap },
  });
  log.info('추천 클릭', { userId, gap });
}

// ── KPI 집계 ───────────────────────────────────────────────────
async function getKpi({ days = 7 } = {}) {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE action = 'show')  AS show_count,
         COUNT(*) FILTER (WHERE action = 'click') AS click_count,
         COUNT(*) FILTER (WHERE action = 'show'  AND value->>'type' = 'growth')    AS show_growth,
         COUNT(*) FILTER (WHERE action = 'show'  AND value->>'type' = 'resonance') AS show_resonance,
         COUNT(*) FILTER (WHERE action = 'show'  AND value->>'type' = 'impact')    AS show_impact,
         COUNT(*) FILTER (WHERE action = 'click' AND value->>'type' = 'growth')    AS click_growth,
         COUNT(*) FILTER (WHERE action = 'click' AND value->>'type' = 'resonance') AS click_resonance,
         COUNT(*) FILTER (WHERE action = 'click' AND value->>'type' = 'impact')    AS click_impact
       FROM dreamtown_flow
       WHERE stage = 'recommendation'
         AND created_at >= NOW() - ($1 || ' days')::INTERVAL`,
      [days]
    );

    const r          = rows[0];
    const show       = parseInt(r.show_count,  10) || 0;
    const click      = parseInt(r.click_count, 10) || 0;
    const clickRate  = show  > 0 ? Math.round((click  / show)  * 100) : null;

    return {
      period_days:  days,
      show_count:   show,
      click_count:  click,
      click_rate:   clickRate,           // 추천 클릭률 (목표 30%+)
      by_type: {
        growth:    { show: parseInt(r.show_growth,    10) || 0, click: parseInt(r.click_growth,    10) || 0 },
        resonance: { show: parseInt(r.show_resonance, 10) || 0, click: parseInt(r.click_resonance, 10) || 0 },
        impact:    { show: parseInt(r.show_impact,    10) || 0, click: parseInt(r.click_impact,    10) || 0 },
      },
    };
  } catch (e) {
    log.warn('KPI 집계 실패', { err: e?.message });
    return null;
  }
}

module.exports = { getRecommendation, logClick, getKpi, getUserStage, detectGap, generateRecommendation };
