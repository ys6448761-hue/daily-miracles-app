/**
 * adminAiCostRoutes.js — AI 비용 대시보드 API
 *
 * GET /api/admin/ai-cost        — 전체 KPI 요약
 * GET /api/admin/ai-cost/trend  — 일별 트렌드 (최근 30일)
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

// ── 간단 토큰 가드 (서버 기존 패턴 동일) ─────────────────────
function adminGuard(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token && token === process.env.ADMIN_TOKEN) return next();
  // ADMIN_TOKEN 미설정 환경(로컬)은 통과
  if (!process.env.ADMIN_TOKEN) return next();
  return res.status(401).json({ error: '관리자 인증 필요' });
}

// ── GET /api/admin/ai-cost ─────────────────────────────────────
router.get('/', adminGuard, async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;

  try {
    // 1. 오늘 비용 / 이번 달 비용
    const costRow = await db.query(`
      SELECT
        COALESCE(SUM(cost_krw) FILTER (WHERE created_at >= CURRENT_DATE),                   0) AS today_cost,
        COALESCE(SUM(cost_krw) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())),      0) AS monthly_cost,
        COALESCE(SUM(cost_krw) FILTER (WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL), 0) AS period_cost
      FROM dt_ai_calls
    `, [days]);

    // 2. 호출 수 / 유저당 평균
    const callRow = await db.query(`
      SELECT
        COUNT(*)                                             AS total_calls,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_users
      FROM dt_ai_calls
      WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
    `, [days]);

    const totalCalls  = parseInt(callRow.rows[0]?.total_calls  ?? 0);
    const uniqueUsers = parseInt(callRow.rows[0]?.unique_users ?? 0);

    // 3. source 분포 (cache_hit / fallback_used / model='template' 기준 파생)
    const srcRow = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE cache_hit = true)                              AS cache_hits,
        COUNT(*) FILTER (WHERE fallback_used = true AND cache_hit = false)    AS fallbacks,
        COUNT(*) FILTER (WHERE model = 'template')                            AS templates,
        COUNT(*) FILTER (WHERE cache_hit = false AND fallback_used = false AND model != 'template') AS ai_calls
      FROM dt_ai_calls
      WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
    `, [days]);
    const src = srcRow.rows[0] ?? {};

    // 4. service별(feature별) 호출 수 + 비용
    const featureRows = await db.query(`
      SELECT
        service_name                      AS feature,
        COUNT(*)                          AS calls,
        COALESCE(SUM(cost_krw), 0)        AS cost,
        COUNT(*) FILTER (WHERE cache_hit) AS cache_hits
      FROM dt_ai_calls
      WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY service_name
      ORDER BY cost DESC
      LIMIT 20
    `, [days]);

    // 5. Top 10 유저
    const topRows = await db.query(`
      SELECT
        user_id::text,
        COUNT(*)                   AS calls,
        COALESCE(SUM(cost_krw), 0) AS cost
      FROM dt_ai_calls
      WHERE user_id IS NOT NULL
        AND created_at >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY user_id
      ORDER BY calls DESC
      LIMIT 10
    `, [days]);

    const c = costRow.rows[0] ?? {};
    return res.json({
      period_days:        days,
      generated:          new Date().toISOString(),

      today_cost:         parseFloat(c.today_cost   ?? 0),
      monthly_cost:       parseFloat(c.monthly_cost ?? 0),
      period_cost:        parseFloat(c.period_cost  ?? 0),

      total_calls:        totalCalls,
      unique_users:       uniqueUsers,
      avg_calls_per_user: uniqueUsers > 0 ? Math.round((totalCalls / uniqueUsers) * 10) / 10 : 0,

      source_breakdown: {
        ai:       parseInt(src.ai_calls   ?? 0),
        cache:    parseInt(src.cache_hits ?? 0),
        template: parseInt(src.templates  ?? 0),
        fallback: parseInt(src.fallbacks  ?? 0),
      },

      feature_usage: featureRows.rows.map(r => ({
        feature:    r.feature,
        calls:      parseInt(r.calls),
        cost:       parseFloat(r.cost),
        cache_hits: parseInt(r.cache_hits),
      })),

      top_users: topRows.rows.map(r => ({
        user_id: r.user_id,
        calls:   parseInt(r.calls),
        cost:    parseFloat(r.cost),
      })),
    });

  } catch (e) {
    console.error('[adminAiCost] error:', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ── GET /api/admin/ai-cost/trend — 일별 트렌드 ────────────────
router.get('/trend', adminGuard, async (req, res) => {
  const days = parseInt(req.query.days, 10) || 14;

  try {
    const { rows } = await db.query(`
      SELECT
        DATE(created_at AT TIME ZONE 'Asia/Seoul')   AS day,
        COUNT(*)                                      AS total_calls,
        COUNT(*) FILTER (WHERE cache_hit)             AS cache_hits,
        COUNT(*) FILTER (WHERE fallback_used)         AS fallbacks,
        COALESCE(SUM(cost_krw), 0)                   AS cost
      FROM dt_ai_calls
      WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY 1
      ORDER BY 1 ASC
    `, [days]);

    return res.json({ days, trend: rows });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
