/**
 * agentMetricsRoutes.js — Aurora 5 KPI 측정 API
 *
 * POST /api/ops/metrics              이벤트 기록
 * GET  /api/ops/metrics/kpi          KPI 요약 (관리자)
 * GET  /api/ops/metrics/trend        일별 트렌드 (관리자)
 * POST /api/ops/metrics/baseline     기준선 저장 (관리자)
 * GET  /api/ops/metrics/verdict      루미 판정 결과 (관리자)
 */

'use strict';

const express = require('express');
const router  = express.Router();
const svc     = require('../services/agentMetricsService');
const db      = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log      = makeLogger('agentMetrics');
const ADMIN_KEY = process.env.ADMIN_API_KEY ?? 'dt-admin-2025';

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] ?? req.query.admin_key;
  if (key !== ADMIN_KEY) return res.status(401).json({ error: '관리자 인증 필요' });
  next();
}

// ── POST /api/ops/metrics — 이벤트 기록 ──────────────────────────
// Body: { task_id, event_type, value, session_id?, operator? }
router.post('/', async (req, res) => {
  const { task_id, event_type, value = {}, session_id, operator } = req.body ?? {};

  if (!task_id || !event_type) {
    return res.status(400).json({ error: 'task_id, event_type 필요' });
  }
  if (!svc.ALLOWED_TYPES.includes(event_type)) {
    return res.status(400).json({ error: `허용되지 않는 event_type: ${event_type}` });
  }

  try {
    const entry = await svc.logEvent({ taskId: task_id, eventType: event_type, value, sessionId: session_id, operator });
    res.status(201).json({ ok: true, entry });
  } catch (err) {
    log.error('메트릭 기록 실패', { err: err.message });
    res.status(500).json({ error: '메트릭 기록 실패' });
  }
});

// ── GET /api/ops/metrics/kpi — KPI 요약 ──────────────────────────
router.get('/kpi', requireAdmin, async (req, res) => {
  const days = parseInt(req.query.days ?? '7', 10);
  try {
    const [summary, trend, breakdown] = await Promise.all([
      svc.getKpiSummary({ days }),
      svc.getDailyTrend({ days }),
      svc.getTaskTypeBreakdown({ days }),
    ]);
    res.json({ ok: true, period: `${days}d`, summary, trend, breakdown });
  } catch (err) {
    res.status(500).json({ error: 'KPI 조회 실패' });
  }
});

// ── POST /api/ops/metrics/baseline — 기준선 저장 ─────────────────
// 개선 전 기준 스냅샷 저장
router.post('/baseline', requireAdmin, async (req, res) => {
  const { retry_rate_pct, avg_turns, avg_response_length, note } = req.body ?? {};
  try {
    await db.query(
      `INSERT INTO agent_metrics (task_id, event_type, value, operator)
       VALUES ($1, 'task_start', $2, 'admin_baseline')`,
      [`baseline_${Date.now()}`, JSON.stringify({
        _type: 'baseline',
        retry_rate_pct, avg_turns, avg_response_length, note,
        recorded_at: new Date().toISOString(),
      })]
    );
    res.json({ ok: true, message: '기준선 저장 완료' });
  } catch (err) {
    res.status(500).json({ error: '기준선 저장 실패' });
  }
});

// ── GET /api/ops/metrics/verdict — 루미 판정 ─────────────────────
router.get('/verdict', requireAdmin, async (req, res) => {
  try {
    // 기준선 조회 (가장 최근 baseline 스냅샷)
    const { rows: blRows } = await db.query(`
      SELECT value FROM agent_metrics
      WHERE operator = 'admin_baseline' AND event_type = 'task_start'
      ORDER BY created_at DESC LIMIT 1
    `).catch(() => ({ rows: [] }));

    const baseline = blRows[0]?.value ?? null;
    const current  = await svc.getKpiSummary({ days: 7 });
    const verdict  = svc.computeVerdict(current, baseline);

    // 목표 달성 여부 체크
    const goals = {
      retry_rate: baseline
        ? { target: '-30%', achieved: parseFloat(current?.retry_rate_pct ?? 0) <= parseFloat(baseline.retry_rate_pct ?? 0) * 0.7 }
        : null,
      avg_turns: baseline
        ? { target: '-20~40%', achieved: parseFloat(current?.avg_turns ?? 0) <= parseFloat(baseline.avg_turns ?? 0) * 0.8 }
        : null,
      avg_response_length: baseline
        ? { target: '-30~50%', achieved: parseFloat(current?.avg_response_length ?? 0) <= parseFloat(baseline.avg_response_length ?? 0) * 0.7 }
        : null,
    };

    res.json({ ok: true, verdict, current, baseline, goals });
  } catch (err) {
    res.status(500).json({ error: '판정 실패' });
  }
});

// ── GET /api/ops/metrics/log — 최근 파일 로그 ────────────────────
router.get('/log', requireAdmin, async (req, res) => {
  const limit = parseInt(req.query.limit ?? '50', 10);
  const entries = svc.readLogFile({ lines: limit });
  res.json({ ok: true, count: entries.length, entries: entries.reverse() });
});

module.exports = router;
