/**
 * starProfileService.js — 별에 모든 성장 데이터를 쌓는 원장
 *
 * 철학: "모든 데이터 = 별에 쌓인다"
 *
 * 사용법:
 *   const sp = require('./starProfileService');
 *   await sp.upsert({ userId, starId, column: 'origin', patch: { gemType:'ruby' } });
 *   await sp.upsert({ userId, starId, column: 'growth', patch: { day1_start: true } });
 *
 * column 4개: origin / growth / route / impact
 */

'use strict';

const db           = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('starProfile');

const COLUMNS = ['origin', 'growth', 'route', 'impact'];

// ── JSONB merge upsert ────────────────────────────────────────
async function upsert({ userId, starId, column, patch = {} }) {
  if (!COLUMNS.includes(column)) throw new Error(`허용되지 않는 column: ${column}`);
  if (!userId || !starId) throw new Error('userId, starId 필요');

  try {
    await db.query(
      `INSERT INTO star_profile (user_id, star_id, ${column}, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (user_id, star_id) DO UPDATE
         SET ${column}    = star_profile.${column} || $3::jsonb,
             updated_at   = NOW()`,
      [String(userId), String(starId), JSON.stringify(patch)]
    );
  } catch (e) {
    const msg = e?.message || e?.detail || String(e);
    log.warn('star_profile upsert 실패', { err: msg, column });
    // 실패해도 호출자에게 throw 하지 않음
  }
}

// ── 조회 ─────────────────────────────────────────────────────
async function get({ userId, starId }) {
  try {
    const { rows } = await db.query(
      'SELECT * FROM star_profile WHERE user_id = $1 AND star_id = $2',
      [String(userId), String(starId)]
    );
    return rows[0] ?? null;
  } catch (e) {
    log.warn('star_profile 조회 실패', { err: e?.message });
    return null;
  }
}

// ── dreamtown_flow 이벤트 → star_profile 자동 동기 ──────────
// 각 stage/action 조합이 star_profile의 어느 column에 무엇을 쌓는지 정의
const FLOW_MAP = {
  'wish/create':          (v) => ({ column: 'origin', patch: { gem_type: v.gemType, channel: v.channel } }),
  'star/create':          (v) => ({ column: 'origin', patch: { source: v.source, gem_type: v.gemType } }),
  'growth/day1_start':    ()  => ({ column: 'growth', patch: { day1_start: true,    day1_at: new Date().toISOString() } }),
  'growth/day7_complete': ()  => ({ column: 'growth', patch: { day7_complete: true, day7_at: new Date().toISOString() } }),
  'growth/log_entry':     (v) => ({ column: 'growth', patch: { last_emotion: v.emotion, last_log_at: new Date().toISOString() } }),
  'resonance/trigger':    ()  => ({ column: 'impact',  patch: { last_resonance_at: new Date().toISOString() } }),
  'impact/share':         ()  => ({ column: 'impact',  patch: { last_share_at: new Date().toISOString() } }),
};

async function syncFromFlow({ userId, starId, stage, action, value = {} }) {
  if (!starId) return; // journey_id 기반 이벤트는 star_id 없음 → 스킵
  const key    = `${stage}/${action}`;
  const mapper = FLOW_MAP[key];
  if (!mapper) return;

  const { column, patch } = mapper(value);
  await upsert({ userId, starId, column, patch });
}

module.exports = { upsert, get, syncFromFlow, COLUMNS };
