/**
 * agentMetricsService.js — Aurora 5 Claude Code KPI 측정
 *
 * 이벤트 4개:
 *   task_start     { task_id, type: 'feature|fix|analysis', description? }
 *   task_retry     { task_id, retry_count, reason? }
 *   task_complete  { task_id, turns, duration_sec, success: true|false }
 *   response_metrics { task_id, response_length, tool_calls? }
 *
 * 저장: PostgreSQL agent_metrics + /logs/agent_metrics.log (fallback)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const db   = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log     = makeLogger('agentMetrics');
const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'agent_metrics.log');

const ALLOWED_TYPES = ['task_start', 'task_retry', 'task_complete', 'response_metrics'];

// ── JSON 로그 파일 fallback ───────────────────────────────────────
function _appendLog(entry) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch (e) {
    log.warn('파일 로그 실패', { err: e.message });
  }
}

// ── DB 저장 ──────────────────────────────────────────────────────
async function logEvent({ taskId, eventType, value = {}, sessionId = null, operator = 'aurora5' }) {
  if (!ALLOWED_TYPES.includes(eventType)) {
    throw new Error(`허용되지 않는 event_type: ${eventType}`);
  }
  if (!taskId) throw new Error('task_id 필요');

  const entry = {
    task_id:    taskId,
    event_type: eventType,
    value,
    session_id: sessionId,
    operator,
    created_at: new Date().toISOString(),
  };

  // 파일 로그 (항상)
  _appendLog(entry);

  // DB 저장 (비동기, 실패해도 파일 로그는 유지)
  try {
    await db.query(
      `INSERT INTO agent_metrics (task_id, event_type, value, session_id, operator)
       VALUES ($1, $2, $3::jsonb, $4, $5)`,
      [taskId, eventType, JSON.stringify(value), sessionId ?? null, operator ?? 'aurora5']
    );
  } catch (e) {
    const errMsg = e?.message || e?.detail || String(e) || '알 수 없는 오류';
    log.warn('DB 저장 실패 (파일 로그는 유지)', { err: errMsg });
  }

  return entry;
}

// ── KPI 집계 ─────────────────────────────────────────────────────
async function getKpiSummary({ days = 7 } = {}) {
  try {
    const { rows } = await db.query(`
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE event_type = 'task_retry')::numeric
          / NULLIF(COUNT(*) FILTER (WHERE event_type = 'task_start'), 0) * 100, 1
        )                                                                        AS retry_rate_pct,
        ROUND(AVG((value->>'turns')::int) FILTER (WHERE event_type = 'task_complete'), 1) AS avg_turns,
        ROUND(AVG((value->>'response_length')::int) FILTER (WHERE event_type = 'response_metrics'), 0) AS avg_response_length,
        COUNT(*) FILTER (WHERE event_type = 'task_complete')                    AS tasks_completed,
        COUNT(*) FILTER (WHERE event_type = 'task_start')                       AS tasks_started,
        COUNT(*) FILTER (WHERE event_type = 'task_retry')                       AS total_retries,
        ROUND(AVG((value->>'duration_sec')::int) FILTER (WHERE event_type = 'task_complete'), 0) AS avg_duration_sec
      FROM agent_metrics
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `);
    return rows[0] ?? null;
  } catch (e) {
    const errMsg = e?.message || e?.detail || String(e) || '알 수 없는 오류';
    log.warn('KPI 집계 실패', { err: errMsg });
    return null;
  }
}

// ── 일별 트렌드 ───────────────────────────────────────────────────
async function getDailyTrend({ days = 7 } = {}) {
  try {
    const { rows } = await db.query(`
      SELECT
        DATE(created_at AT TIME ZONE 'Asia/Seoul') AS kst_date,
        COUNT(*) FILTER (WHERE event_type = 'task_start')    AS starts,
        COUNT(*) FILTER (WHERE event_type = 'task_retry')    AS retries,
        COUNT(*) FILTER (WHERE event_type = 'task_complete') AS completes,
        ROUND(AVG((value->>'turns')::int) FILTER (WHERE event_type = 'task_complete'), 1) AS avg_turns,
        ROUND(
          COUNT(*) FILTER (WHERE event_type = 'task_retry')::numeric
          / NULLIF(COUNT(*) FILTER (WHERE event_type = 'task_start'), 0) * 100, 1
        ) AS retry_rate_pct
      FROM agent_metrics
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY kst_date
      ORDER BY kst_date DESC
    `);
    return rows;
  } catch (e) {
    log.warn('일별 트렌드 실패', { err: e.message });
    return [];
  }
}

// ── 작업 타입별 분석 ──────────────────────────────────────────────
async function getTaskTypeBreakdown({ days = 7 } = {}) {
  try {
    const { rows } = await db.query(`
      SELECT
        value->>'type' AS task_type,
        COUNT(*) AS count,
        ROUND(AVG((c.value->>'turns')::int), 1) AS avg_turns,
        ROUND(AVG((c.value->>'duration_sec')::int), 0) AS avg_duration_sec
      FROM agent_metrics s
      LEFT JOIN agent_metrics c ON c.task_id = s.task_id AND c.event_type = 'task_complete'
      WHERE s.event_type = 'task_start'
        AND s.created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY value->>'type'
      ORDER BY count DESC
    `);
    return rows;
  } catch (e) {
    log.warn('타입별 분석 실패', { err: e.message });
    return [];
  }
}

// ── 루미 판정 로직 ────────────────────────────────────────────────
// IF (재시도율↓ && 턴수↓ && 응답길이↓) → 성공
// IF (1개만 개선)                      → 부분 성공
// IF (변화 없음)                       → 규칙 미적용
// IF (악화)                            → 즉시 롤백
function computeVerdict(current, baseline) {
  if (!current || !baseline) {
    return { status: 'insufficient_data', message: '기준 데이터 없음 — 1일 수집 후 판정', color: 'gray' };
  }

  const retryImproved   = parseFloat(current.retry_rate_pct ?? 0)      < parseFloat(baseline.retry_rate_pct ?? 0);
  const turnsImproved   = parseFloat(current.avg_turns ?? 0)           < parseFloat(baseline.avg_turns ?? 0);
  const lengthImproved  = parseFloat(current.avg_response_length ?? 0) < parseFloat(baseline.avg_response_length ?? 0);

  const improvements = [retryImproved, turnsImproved, lengthImproved].filter(Boolean).length;

  // 악화 체크: 모두 악화 or 재시도율만 40% 이상 상승
  const retryWorse = parseFloat(current.retry_rate_pct ?? 0) > parseFloat(baseline.retry_rate_pct ?? 0) * 1.4;

  if (retryWorse && improvements === 0) {
    return { status: 'rollback', message: '즉시 롤백 — 재시도율 40%+ 상승, 개선 없음', color: 'red' };
  }
  if (improvements === 3) {
    return { status: 'success', message: '성공 — 유지 + 확장', color: 'green' };
  }
  if (improvements >= 1) {
    return { status: 'partial', message: `부분 성공 (${improvements}/3 개선) — 원인 분석 필요`, color: 'yellow' };
  }
  return { status: 'no_change', message: '변화 없음 — 규칙 미적용 or 잘못 적용 확인', color: 'gray' };
}

// ── 파일 로그에서 기준선 추출 (DB 없을 때 fallback) ─────────────
function readLogFile({ lines = 100 } = {}) {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const raw = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
    return raw.slice(-lines).map(l => JSON.parse(l));
  } catch { return []; }
}

module.exports = {
  logEvent,
  getKpiSummary,
  getDailyTrend,
  getTaskTypeBreakdown,
  computeVerdict,
  readLogFile,
  ALLOWED_TYPES,
};
