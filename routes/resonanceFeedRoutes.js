/**
 * resonanceFeedRoutes.js — 공명(Resonance) 피드
 *
 * GET /api/dt/resonance-feed?journey_id=xxx
 *
 * 노출 조건 (유지):
 *   1. whisper_count >= 3
 *   2. 오늘 이미 노출된 이력 없음
 *   3. 15% 랜덤 필터 — 공명은 여전히 우연성 위에 존재
 *
 * 문장 선택 (진화):
 *   4. 후보 50개 조회
 *   5. dominant signal 기반 유사도 점수 계산
 *   6. 상위 5개 중 랜덤 선택 → "정확하지 않게" 우연을 유지
 *
 * 응답:
 *   { show: false }
 *   { show: true, aurum_message: string, items: [{text}] }
 *
 * 철학:
 *   "비슷한 상태의 사람끼리 조용히 스치는 구조"
 *   너무 잘 맞으면 추천 느낌 → 약간 어긋나야 우연 느낌
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { getUserSignalState, detectEmotion, detectLength } = require('../services/galaxySignalService');
const flow    = require('../services/dreamtownFlowService');
const { getTriggerRecommendation } = require('../services/aiRecommendationService');

// ── 점수 계산 상수 ────────────────────────────────────────────────────
const CONTEXT_MATCH_SCORE = 3;
const EMOTION_MATCH_SCORE = 2;
const LENGTH_MATCH_SCORE  = 1;
const MIN_SCORE_THRESHOLD = 2;   // 이 미만이면 fallback → 랜덤 선택
const CANDIDATE_POOL      = 50;  // 넓게 가져와서 메모리 계산
const TOP_N               = 5;   // 상위 N개 중 랜덤 선택 (자연스러움 유지)
const FINAL_COUNT         = 3;   // 최종 노출 문장 수

// ── 후보 점수 계산 ────────────────────────────────────────────────────
function scoreCandidate(row, dominant) {
  let score = 0;

  // context 일치
  if (dominant.dominant_context && row.context_tag === dominant.dominant_context) {
    score += CONTEXT_MATCH_SCORE;
  }

  // emotion 일치 (텍스트에서 실시간 추출)
  const rowEmotion = detectEmotion(row.growth_text);
  if (dominant.dominant_emotion && rowEmotion === dominant.dominant_emotion) {
    score += EMOTION_MATCH_SCORE;
  }

  // length 일치
  const rowLength = detectLength(row.growth_text);
  if (dominant.dominant_length && rowLength === dominant.dominant_length) {
    score += LENGTH_MATCH_SCORE;
  }

  return { ...row, score, row_emotion: rowEmotion, row_length: rowLength };
}

// ── 상위 N개 중 랜덤 FINAL_COUNT개 선택 ──────────────────────────────
function pickFromTopN(scored, n, count) {
  const pool = scored.slice(0, n);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── 라우터 ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { journey_id } = req.query;
  if (!journey_id) return res.status(400).json({ error: 'journey_id required' });

  try {
    // 1. whisper 누적 수 확인
    const countResult = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM journey_logs
       WHERE journey_id = $1 AND growth_text IS NOT NULL`,
      [journey_id]
    );
    const whisperCount = parseInt(countResult.rows[0].cnt, 10);
    if (whisperCount < 3) return res.json({ show: false, reason: 'not_enough_whispers' });

    // 2. 오늘 이미 노출 여부 확인
    const todayResult = await db.query(
      `SELECT 1 FROM resonance_exposures
       WHERE viewer_journey_id = $1
         AND created_at >= NOW() - INTERVAL '1 day'
       LIMIT 1`,
      [journey_id]
    );
    if (todayResult.rowCount > 0) return res.json({ show: false, reason: 'already_shown_today' });

    // 3. 15% 랜덤 필터 — 공명은 여전히 우연성 위에 존재
    if (Math.random() >= 0.15) return res.json({ show: false, reason: 'random_filtered' });

    // 4. 사용자 dominant signal 조회 (병렬)
    const [dominant, candidateResult] = await Promise.all([
      getUserSignalState(journey_id),
      db.query(
        `SELECT id, growth_text, context_tag
         FROM journey_logs
         WHERE journey_id      != $1
           AND growth_text     IS NOT NULL
           AND is_shareable    = TRUE
           AND COALESCE(resonance_used_count, 0) < 3
           AND char_length(trim(growth_text)) BETWEEN 8 AND 40
           AND id NOT IN (
             SELECT source_log_id FROM resonance_exposures
             WHERE viewer_journey_id = $1
           )
         ORDER BY RANDOM()
         LIMIT $2`,
        [journey_id, CANDIDATE_POOL]
      ),
    ]);

    if (candidateResult.rowCount === 0) return res.json({ show: false, reason: 'no_content' });

    // 5. signal 기반 유사도 점수 계산
    const scored = candidateResult.rows
      .map(row => scoreCandidate(row, dominant))
      .sort((a, b) => b.score - a.score);

    const bestScore = scored[0]?.score ?? 0;

    // 6. 상위 5개 중 랜덤 선택 — fallback: bestScore < MIN_SCORE 이면 순수 랜덤
    let selected;
    let signalUsed = false;

    if (bestScore >= MIN_SCORE_THRESHOLD) {
      selected   = pickFromTopN(scored, TOP_N, FINAL_COUNT);
      signalUsed = true;
    } else {
      // fallback: 랜덤 후보 중 FINAL_COUNT개
      const shuffled = [...candidateResult.rows].sort(() => Math.random() - 0.5);
      selected = shuffled.slice(0, FINAL_COUNT);
    }

    const logIds = selected.map(r => r.id);

    // 7. 노출 기록 + resonance_used_count +1 (비동기 처리 — 응답 지연 없음)
    Promise.all([
      ...logIds.map(lid =>
        db.query(
          `INSERT INTO resonance_exposures (viewer_journey_id, source_log_id)
           VALUES ($1, $2)`,
          [journey_id, lid]
        )
      ),
      ...logIds.map(lid =>
        db.query(
          `UPDATE journey_logs
           SET resonance_used_count = resonance_used_count + 1,
               last_resonated_at   = NOW()
           WHERE id = $1`,
          [lid]
        )
      ),
      // resonance_ranked 이벤트 직접 기록
      db.query(
        `INSERT INTO dt_events (event_name, params) VALUES ('resonance_ranked', $1::jsonb)`,
        [JSON.stringify({
          journey_id,
          dominant_context:   dominant.dominant_context,
          dominant_emotion:   dominant.dominant_emotion,
          top_score:          bestScore,
          signal_used:        signalUsed,
          candidate_pool:     candidateResult.rowCount,
        })]
      ),
      // resonance_selected 이벤트 (선택된 문장별)
      ...selected.map((row, i) =>
        db.query(
          `INSERT INTO dt_events (event_name, params) VALUES ('resonance_selected', $1::jsonb)`,
          [JSON.stringify({
            journey_id,
            source_text_id:      row.id,
            similarity_score:    row.score ?? 0,
            selection_pool_size: Math.min(TOP_N, scored.length),
            position:            i,
            signal_used:         signalUsed,
          })]
        )
      ),
    ]).catch(err => console.error('[resonanceFeed] 후처리 오류:', err));

    // ── flow 계측 (resonance/trigger) ───────────────────────────
    try {
      await flow.log({ userId: String(journey_id), stage: 'resonance', action: 'trigger', value: { type: 'feed', target: 'internal' }, refId: String(journey_id) });
    } catch (e) { console.warn('flow log failed (resonance/trigger)', e.message); }

    // ── AI 트리거 추천 (before_resonance) ───────────────────────
    const lumi = await getTriggerRecommendation(String(journey_id), 'before_resonance');

    res.json({
      show:          true,
      aurum_message: '조용히 이어진 순간들이 있어요',
      items:         selected.map(r => ({ text: r.growth_text })),
      lumi,
    });

  } catch (err) {
    console.error('[resonanceFeed] 오류:', err);
    res.status(500).json({ error: 'Failed to fetch resonance feed' });
  }
});

module.exports = router;
