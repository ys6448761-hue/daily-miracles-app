// ═══════════════════════════════════════════════════════════
// Diagnostic API v1 Service — SSOT-locked
//
// Rules:
// 1. Scoring via WEIGHT_MATRIX — no keyword matching
// 2. All content from getModeById() only — no hardcoded strings
// 3. In-memory store: global._diagV1Store (v1; DB in v2)
// 4. KST date via getKSTDateString()
// ═══════════════════════════════════════════════════════════

'use strict';

const { getModeById, getAllModes } = require('../config/modesLoader');
const { getKSTDateString } = require('../utils/kstDate');
const { ValidationError } = require('../utils/errors');

// ── Ordered mode IDs (derived from registry at load time) ──
const _orderedModeIds = getAllModes().map(m => m.mode_id);

// ── Weight matrix: WEIGHT_MATRIX[question][mode] ──────────
// Rows = Q0..Q7, Cols = mode index (registry order)
const WEIGHT_MATRIX = [
  // over burn avoid distr anx  comp hyper stuck
  [2,   1,   0,   1,   0,   0,   0,   1],  // Q0: 과부하 시그널
  [1,   2,   1,   0,   0,   0,   0,   1],  // Q1: 방전 시그널
  [0,   0,   2,   1,   0,   0,   0,   1],  // Q2: 회피 시그널
  [1,   0,   0,   2,   0,   0,   0,   0],  // Q3: 산만 시그널
  [0,   0,   0,   0,   2,   0,   1,   0],  // Q4: 불안 시그널
  [0,   0,   0,   0,   0,   2,   1,   0],  // Q5: 비교 시그널
  [0,   1,   0,   0,   1,   0,   2,   0],  // Q6: 과민 시그널
  [1,   1,   1,   0,   0,   0,   0,   2],  // Q7: 정체 시그널
];

const NUM_QUESTIONS = 8;
const VALID_ANSWER_VALUES = new Set([0, 1, 2]);

// ── Validation ────────────────────────────────────────────

function validateSubmit({ user_key, answers }) {
  if (!user_key || typeof user_key !== 'string' || user_key.trim() === '') {
    throw new ValidationError('user_key는 필수 문자열입니다.', 'user_key');
  }
  if (!Array.isArray(answers) || answers.length !== NUM_QUESTIONS) {
    throw new ValidationError(
      `answers는 정확히 ${NUM_QUESTIONS}개 항목의 배열이어야 합니다.`,
      'answers',
    );
  }
  for (let i = 0; i < answers.length; i++) {
    if (!VALID_ANSWER_VALUES.has(answers[i])) {
      throw new ValidationError(
        `answers[${i}]는 0, 1, 2 중 하나여야 합니다. (received: ${answers[i]})`,
        `answers[${i}]`,
      );
    }
  }
}

// ── Scoring ───────────────────────────────────────────────

function computeScores(answers, et) {
  const scoreArr = new Array(_orderedModeIds.length).fill(0);

  for (let q = 0; q < NUM_QUESTIONS; q++) {
    for (let m = 0; m < _orderedModeIds.length; m++) {
      scoreArr[m] += answers[q] * WEIGHT_MATRIX[q][m];
    }
  }

  // Build mode_scores object
  const mode_scores = {};
  _orderedModeIds.forEach((id, idx) => {
    mode_scores[id] = scoreArr[idx];
  });

  const maxScore = Math.max(...scoreArr);

  // Fallback: all zeros → stuck
  if (maxScore === 0) {
    return {
      mode_scores,
      winner_score: 0,
      winner_mode_id: 'stuck',
      tie: false,
      tie_breaker: null,
    };
  }

  // Find tied modes
  const tiedModeIds = _orderedModeIds.filter((_id, idx) => scoreArr[idx] === maxScore);
  const tie = tiedModeIds.length > 1;

  let winner_mode_id;
  let tie_breaker = null;

  if (!tie) {
    winner_mode_id = tiedModeIds[0];
  } else if (et !== null && et !== undefined && typeof et === 'number' && et < 60) {
    // Fast responder: prefer lower-indexed mode among tied
    winner_mode_id = tiedModeIds[0]; // already in registry order (lowest index first)
    tie_breaker = 'et_fast';
  } else {
    // Alphabetical among tied modes
    winner_mode_id = [...tiedModeIds].sort()[0];
    tie_breaker = 'alphabetical';
  }

  return {
    mode_scores,
    winner_score: maxScore,
    winner_mode_id,
    tie,
    tie_breaker,
  };
}

// ── SSOT Content Builder ──────────────────────────────────

function buildContent(mode) {
  return {
    label_kr: mode.label_kr,
    tagline: mode.tagline,
    recommended_action: mode.recommended_action_templates[0],
    ad_hook_keywords: mode.ad_hook_keywords,
    marketing_archetypes: mode.marketing_archetypes,
  };
}

// ── Submit Pipeline ───────────────────────────────────────

function submitDiagnostic({ user_key, date, answers, et }) {
  const resolvedDate = date || getKSTDateString();

  // Idempotency check
  const storeKey = `${user_key}::${resolvedDate}`;
  const store = _getStore();
  if (store.has(storeKey)) {
    return { idempotent: true, result: store.get(storeKey) };
  }

  // Score
  const { mode_scores, winner_score, winner_mode_id, tie, tie_breaker } =
    computeScores(answers, et ?? null);

  // SSOT content
  const mode = getModeById(winner_mode_id);
  if (!mode) {
    throw new Error(`[DiagV1] SSOT lookup failed for mode_id='${winner_mode_id}'`);
  }

  const result = {
    user_key,
    date: resolvedDate,
    mode_id: winner_mode_id,
    score: { mode_scores, winner_score, tie, tie_breaker },
    content: buildContent(mode),
  };

  store.set(storeKey, result);
  return { idempotent: false, result };
}

// ── Segment Query ─────────────────────────────────────────

function getTodaySegment({ user_key }) {
  const today = getKSTDateString();
  const storeKey = `${user_key}::${today}`;
  const store = _getStore();

  if (!store.has(storeKey)) return null;

  const stored = store.get(storeKey);
  const mode = getModeById(stored.mode_id);
  if (!mode) return null;

  return {
    user_key,
    date: today,
    mode_id: mode.mode_id,
    label_kr: mode.label_kr,
    ad_hook_keywords: mode.ad_hook_keywords,
    marketing_archetypes: mode.marketing_archetypes,
  };
}

// ── Store Helper ──────────────────────────────────────────

function _getStore() {
  if (!global._diagV1Store) {
    global._diagV1Store = new Map();
  }
  return global._diagV1Store;
}

module.exports = {
  validateSubmit,
  computeScores,
  submitDiagnostic,
  getTodaySegment,
  buildContent,
  WEIGHT_MATRIX,
  NUM_QUESTIONS,
};
