/**
 * connectionStageRoutes.js — 연결(Connection) 단계
 *
 * GET /api/dt/connection-stage?journey_id=xxx
 *
 * 노출 조건 (생애 1회):
 *   1. whisper_count >= 5
 *   2. 공명 경험(resonance_exposures) 1회 이상
 *   3. connection_exposures 이력 없음 (UNIQUE 보장)
 *   4. 20% 랜덤 필터
 *
 * 매칭 로직:
 *   5. 타 사용자 후보 100개 조회
 *   6. dominant signal 기반 유사도 점수 계산
 *   7. 상위 3개 중 랜덤 선택 (min score 3 — 미달 시 skip)
 *
 * 응답:
 *   { show: false }
 *   { show: true, title, text, aurum_message }
 *
 * 철학:
 *   "이미 존재하던 것을 한 번 보여주는 것"
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { getUserSignalState, detectEmotion, detectLength } = require('../services/galaxySignalService');

// ── 상수 ─────────────────────────────────────────────────────────────
const CONNECTION_PROBABILITY  = 0.20;
const CANDIDATE_POOL          = 100;
const TOP_N                   = 3;
const MIN_SCORE               = 3;   // 이 미만이면 connection skip (공명과의 차이)

// ── 후보 점수 계산 ────────────────────────────────────────────────────
function scoreCandidate(row, dominant) {
  let score = 0;
  if (dominant.dominant_context && row.context_tag === dominant.dominant_context) score += 3;
  if (dominant.dominant_emotion) {
    if (detectEmotion(row.growth_text) === dominant.dominant_emotion) score += 2;
  }
  if (dominant.dominant_length) {
    if (detectLength(row.growth_text) === dominant.dominant_length) score += 1;
  }
  return { ...row, score };
}

// ── 라우터 ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { journey_id } = req.query;
  if (!journey_id) return res.status(400).json({ error: 'journey_id required' });

  try {
    // 1. whisper 누적 수 ≥ 5
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS cnt
       FROM journey_logs
       WHERE journey_id = $1 AND growth_text IS NOT NULL`,
      [journey_id]
    );
    if (countResult.rows[0].cnt < 5) {
      return res.json({ show: false, reason: 'not_enough_whispers' });
    }

    // 2. 공명 경험 ≥ 1
    const resonanceResult = await db.query(
      `SELECT 1 FROM resonance_exposures
       WHERE viewer_journey_id = $1
       LIMIT 1`,
      [journey_id]
    );
    if (resonanceResult.rowCount === 0) {
      return res.json({ show: false, reason: 'no_resonance_experience' });
    }

    // 3. 생애 1회 — 이미 본 경우 skip (connection_exposures + connection_events 이중 확인)
    const [existExp, existEvt] = await Promise.all([
      db.query(`SELECT 1 FROM connection_exposures WHERE journey_id = $1 LIMIT 1`, [journey_id]),
      db.query(`SELECT 1 FROM connection_events    WHERE journey_id = $1 LIMIT 1`, [journey_id]),
    ]);
    if (existExp.rowCount > 0 || existEvt.rowCount > 0) {
      return res.json({ show: false, reason: 'already_shown' });
    }

    // 4. 20% 랜덤 필터
    if (Math.random() > CONNECTION_PROBABILITY) {
      return res.json({ show: false, reason: 'random_filtered' });
    }

    // 5. dominant signal + 후보 100개 병렬 조회
    const [dominant, candidateResult] = await Promise.all([
      getUserSignalState(journey_id),
      db.query(
        `SELECT id, journey_id AS src_journey_id, growth_text, context_tag
         FROM journey_logs
         WHERE journey_id != $1
           AND growth_text IS NOT NULL
           AND is_shareable = TRUE
           AND char_length(trim(growth_text)) BETWEEN 8 AND 60
         ORDER BY RANDOM()
         LIMIT $2`,
        [journey_id, CANDIDATE_POOL]
      ),
    ]);

    if (candidateResult.rowCount === 0) {
      return res.json({ show: false, reason: 'no_candidates' });
    }

    // 6. 유사도 점수 계산 + 정렬
    const scored = candidateResult.rows
      .map(row => scoreCandidate(row, dominant))
      .sort((a, b) => b.score - a.score);

    const bestScore = scored[0]?.score ?? 0;

    // 7. 최소 점수 미달 → skip (connection은 공명보다 엄격)
    if (bestScore < MIN_SCORE) {
      return res.json({ show: false, reason: 'low_similarity' });
    }

    // 상위 3개 중 랜덤 1개 선택
    const pool     = scored.slice(0, TOP_N);
    const selected = pool[Math.floor(Math.random() * pool.length)];

    // 8. 기록 (connection_exposures + connection_events) — 이중 방어
    await Promise.all([
      db.query(
        `INSERT INTO connection_exposures (journey_id)
         VALUES ($1)
         ON CONFLICT (journey_id) DO NOTHING`,
        [journey_id]
      ),
      db.query(
        `INSERT INTO connection_events (journey_id, connected_journey_id, source_text_id, similarity_score)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (journey_id) DO NOTHING`,
        [journey_id, selected.src_journey_id, selected.id, selected.score]
      ),
      // connection_completed 이벤트 직접 기록
      db.query(
        `INSERT INTO dt_events (event_name, params) VALUES ('connection_completed', $1::jsonb)`,
        [JSON.stringify({ journey_id, connection_once: true, similarity_score: selected.score })]
      ),
    ]);

    res.json({
      show:          true,
      title:         '오늘, 비슷한 마음을 스친 사람이 있었어요',
      text:          selected.growth_text,
      aurum_message: '보이지 않는 연결이 생겼어요',
    });

  } catch (err) {
    console.error('[connectionStage] 오류:', err);
    res.status(500).json({ error: 'Failed to check connection stage' });
  }
});

module.exports = router;
