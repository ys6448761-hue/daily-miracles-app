/**
 * experimentEvaluator.js — 실험 승자 자동 선택 + 승격
 *
 * 사용:
 *   const ev = require('./experimentEvaluator');
 *   const winner = ev.evaluateExperiment(results, config);
 *   if (winner && config.autoPromote) await ev.setGlobalVariant(key, winner, results);
 *   const active = await ev.getActiveVariant(key);  // null이면 랜덤 배정 사용
 *
 * SAFE GUARD:
 *   - 핵심 흐름(wish→star→growth) 변경 금지
 *   - 결제/정책 자동 변경 금지
 *   - 표본 미달 시 null 반환 (승격 없음)
 */

'use strict';

const db  = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('expEvaluator');

// ── SAFE GUARD: 이 실험키는 자동 승격 불가 ───────────────────
const PROMOTE_BLOCKLIST = new Set([
  'payment_flow', 'pricing', 'auth_flow',  // 결제/정책 관련 실험 영구 차단
]);

// ── 승자 판정 (표본 충족 + 10% 이상 차이) ────────────────────
function evaluateExperiment(results, config) {
  const A = results['A'];
  const B = results['B'];

  if (!A || !B) return null;
  if (A.sample < config.minSample || B.sample < config.minSample) return null;

  if (B.rate > A.rate * 1.1) return 'B';
  if (A.rate > B.rate * 1.1) return 'A';

  return null; // 차이 미미 — 승격 없음
}

// ── 승자 DB 저장 (UPSERT — 재실험 시 덮어씀) ─────────────────
async function setGlobalVariant(experimentKey, winner, results = {}) {
  if (PROMOTE_BLOCKLIST.has(experimentKey)) {
    log.warn('승격 차단됨 (BLOCKLIST)', { experimentKey });
    return;
  }

  const A = results['A'] ?? {};
  const B = results['B'] ?? {};

  try {
    await db.query(
      `INSERT INTO dt_experiment_winners
         (experiment_key, winner, rate_a, rate_b, sample_a, sample_b, promoted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (experiment_key) DO UPDATE
         SET winner      = EXCLUDED.winner,
             rate_a      = EXCLUDED.rate_a,
             rate_b      = EXCLUDED.rate_b,
             sample_a    = EXCLUDED.sample_a,
             sample_b    = EXCLUDED.sample_b,
             promoted_at = EXCLUDED.promoted_at`,
      [experimentKey, winner, A.rate ?? null, B.rate ?? null, A.sample ?? null, B.sample ?? null]
    );
    log.info('승자 승격 완료', { experimentKey, winner });
  } catch (e) {
    log.warn('승자 저장 실패', { err: e?.message });
  }
}

// ── 활성 승자 조회 (없으면 null → 랜덤 배정 유지) ────────────
async function getActiveVariant(experimentKey) {
  try {
    const { rows } = await db.query(
      'SELECT winner FROM dt_experiment_winners WHERE experiment_key = $1 LIMIT 1',
      [experimentKey]
    );
    return rows[0]?.winner ?? null;
  } catch (e) {
    return null;
  }
}

// ── 전체 활성 승자 목록 ───────────────────────────────────────
async function getAllWinners() {
  try {
    const { rows } = await db.query(
      'SELECT * FROM dt_experiment_winners ORDER BY promoted_at DESC'
    );
    return rows;
  } catch (e) {
    return [];
  }
}

module.exports = { evaluateExperiment, setGlobalVariant, getActiveVariant, getAllWinners };
