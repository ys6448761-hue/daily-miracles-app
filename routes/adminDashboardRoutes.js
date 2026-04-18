'use strict';

/**
 * adminDashboardRoutes.js — 운영 관제 대시보드 API
 * Base path: /api/admin/dashboard
 *
 * GET /status  → 5개 카드 데이터 일괄 반환
 */

const express   = require('express');
const router    = express.Router();
const errorFeed = require('../services/errorFeed');

let db;
try { db = require('../database/db'); } catch (e) { /* SQLite 미연결 환경 허용 */ }

const SERVER_START = new Date().toISOString();

// ── 인증 가드 ─────────────────────────────────────────────────────
function adminGuard(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (!process.env.ADMIN_API_KEY) return next();            // 로컬: 무조건 통과
  if (key === process.env.ADMIN_API_KEY) return next();
  return res.status(401).json({ success: false, error: '관리자 인증 필요 (?key=...)' });
}

// ── Render API 호출 (선택적 — 환경변수 없으면 스킵) ──────────────
async function fetchRenderDeploys() {
  const apiKey    = process.env.RENDER_API_KEY;
  const serviceId = process.env.RENDER_SERVICE_ID;
  if (!apiKey || !serviceId) return null;

  try {
    const r = await fetch(
      `https://api.render.com/v1/services/${serviceId}/deploys?limit=5`,
      { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) return { error: `Render API ${r.status}` };
    return await r.json();
  } catch (e) {
    return { error: e.message };
  }
}

// ── Promise 플로우 통계 (최근 1시간) ─────────────────────────────
async function fetchFlowStats() {
  if (!db) return null;
  try {
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const [created, opened, withPhoto] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS n FROM promise_records WHERE created_at >= $1`,
        [oneHourAgo]
      ),
      db.query(
        `SELECT COUNT(*) AS n FROM promise_records WHERE opened_at >= $1`,
        [oneHourAgo]
      ),
      db.query(
        `SELECT COUNT(*) AS n FROM promise_records WHERE created_at >= $1 AND photo_url IS NOT NULL`,
        [oneHourAgo]
      ),
    ]);
    const toN = r => parseInt(r.rows?.[0]?.n ?? r.rows?.[0]?.count ?? 0, 10);
    return {
      created1h:   toN(created),
      opened1h:    toN(opened),
      withPhoto1h: toN(withPhoto),
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ── GET /status ────────────────────────────────────────────────────
router.get('/status', adminGuard, async (req, res) => {
  const [deployData, flowStats] = await Promise.all([
    fetchRenderDeploys(),
    fetchFlowStats(),
  ]);

  // 1. Health
  let health = { db: 'unknown', dbMs: null, checkedAt: null };
  if (db) {
    const t0 = Date.now();
    try {
      await db.query('SELECT 1');
      health = { db: 'ok', dbMs: Date.now() - t0, checkedAt: new Date().toISOString() };
    } catch (e) {
      health = { db: 'error', error: e.message, dbMs: Date.now() - t0, checkedAt: new Date().toISOString() };
    }
  }

  // 2. Deploy
  const deploy = {
    commit:      process.env.RENDER_GIT_COMMIT  || 'local',
    branch:      process.env.RENDER_GIT_BRANCH  || null,
    service:     process.env.RENDER_SERVICE_NAME || null,
    serverStart: SERVER_START,
    uptimeSec:   Math.floor(process.uptime()),
    renderApi:   deployData,
  };

  // 3. Errors feed
  const errors = errorFeed.get(20);

  // 4. Alert 상태
  const alerts = {
    slackConfigured: !!(process.env.OPS_SLACK_WEBHOOK || process.env.SLACK_WEBHOOK_URL),
    renderApiConfigured: !!(process.env.RENDER_API_KEY && process.env.RENDER_SERVICE_ID),
    recentErrors500: errors.filter(e => e.status >= 500).length,
  };

  res.json({
    ok:        health.db === 'ok',
    ts:        new Date().toISOString(),
    health,
    deploy,
    errors,
    flowStats,
    alerts,
  });
});

module.exports = router;
