/**
 * recallWhisperRoutes.js — 과거 속삭임 재등장 (Recall + Blend)
 *
 * GET /api/dt/recall-whisper?journey_id={id}
 *
 * ── 단계 ──────────────────────────────────────────────────────────
 * 1. 기본 자격 검사 (whisper ≥ 5, 오늘 이력 없음)
 * 2. 5% 랜덤 게이트 (RECALL_RANDOM_RATE)
 * 3. 소스 결정: 10%는 blend 시도, 나머지는 recall
 *    - blend 후보 없으면 무조건 recall fallback
 * 4. 결과 반환 + 이력 저장
 *
 * ── 상수 ──────────────────────────────────────────────────────────
 * RECALL_RANDOM_RATE = 0.05  (전체 노출 확률, env 미지원 — 고정)
 * BLEND_RATIO        = 0.10  (노출 중 blend 비율, env: BLEND_RATIO)
 *
 * ── 응답 ──────────────────────────────────────────────────────────
 * { show: false, reason }
 * { show: true, text, source_type: 'recall'|'blend',
 *   is_blend, text_length, used_context_match, fallback }
 *
 * SSOT: docs/ssot/core/DreamTown_Fandom_Engine_SSOT_v1.md § 3-3 Recall / § 3-4 Blend
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

// ── 운영 상수 (SSOT § 5 확정 확률 규칙) ──────────────────────────
const RECALL_RANDOM_RATE = 0.05;
const BLEND_RATIO        = parseFloat(process.env.BLEND_RATIO || '0.10');

// ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { journey_id } = req.query;
  if (!journey_id) return res.status(400).json({ error: 'journey_id required' });

  // A/B 실험: control 그룹은 전체 skip
  if (req.headers['x-exp-group'] === 'control') {
    return res.json({ show: false, reason: 'control_group' });
  }

  try {
    // ── 1. whisper 누적 수 ≥ 5 ──────────────────────────────────
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS cnt
       FROM journey_logs
       WHERE journey_id = $1 AND growth_text IS NOT NULL`,
      [journey_id]
    );
    if (countResult.rows[0].cnt < 5) {
      return res.json({ show: false, reason: 'not_enough_whispers' });
    }

    // ── 2. 오늘 이미 노출 여부 (recall 또는 blend 둘 다) ─────────
    const [recallToday, blendToday] = await Promise.all([
      db.query(
        `SELECT 1 FROM recall_exposures
         WHERE journey_id = $1 AND created_at >= CURRENT_DATE LIMIT 1`,
        [journey_id]
      ),
      db.query(
        `SELECT 1 FROM blend_whisper_exposures
         WHERE journey_id = $1 AND created_at >= CURRENT_DATE LIMIT 1`,
        [journey_id]
      ),
    ]);
    if (recallToday.rowCount > 0 || blendToday.rowCount > 0) {
      return res.json({ show: false, reason: 'already_shown_today' });
    }

    // ── 3. 5% 랜덤 게이트 ────────────────────────────────────────
    if (Math.random() > RECALL_RANDOM_RATE) {
      return res.json({ show: false, reason: 'random_filtered' });
    }

    // ── 4. 소스 결정: BLEND_RATIO 확률로 blend 시도 ──────────────
    const useBlend = Math.random() < BLEND_RATIO;

    if (useBlend) {
      // 4-a. 최근 whisper에서 context_tag 추출 (상위 3개)
      const recentResult = await db.query(
        `SELECT context_tag
         FROM journey_logs
         WHERE journey_id = $1 AND growth_text IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 3`,
        [journey_id]
      );
      const dominantTag = recentResult.rows.find(r => r.context_tag)?.context_tag ?? null;

      // 4-b. blend_eligible 이벤트 서버사이드 기록
      db.query(
        `INSERT INTO dt_events (event_name, params)
         VALUES ('blend_eligible', $1::jsonb)`,
        [JSON.stringify({ journey_id, context_tag: dominantTag })]
      ).catch(() => {});

      // 4-c. blend 후보 조회
      //   우선순위: context_tag 일치 → 없으면 일반 짧은 문장
      const blendResult = await db.query(
        `SELECT id, growth_text, context_tag
         FROM journey_logs
         WHERE journey_id != $1
           AND growth_text IS NOT NULL
           AND is_shareable = TRUE
           AND char_length(trim(growth_text)) BETWEEN 8 AND 40
           AND ($2::text IS NULL OR context_tag = $2)
           AND id NOT IN (
             SELECT source_text_id
             FROM blend_whisper_exposures
             WHERE journey_id = $1
               AND source_text_id IS NOT NULL
           )
         ORDER BY RANDOM()
         LIMIT 1`,
        [journey_id, dominantTag]
      );

      if (blendResult.rowCount > 0) {
        const blendRow     = blendResult.rows[0];
        const textLen      = blendRow.growth_text.trim().length;
        const ctxMatched   = !!dominantTag && blendRow.context_tag === dominantTag;

        // 4-d. blend_whisper_exposures 저장
        await db.query(
          `INSERT INTO blend_whisper_exposures (journey_id, source_text_id, delivered_text)
           VALUES ($1, $2, $3)`,
          [journey_id, blendRow.id, blendRow.growth_text]
        );

        // 4-e. blend_shown 서버사이드 이벤트
        db.query(
          `INSERT INTO dt_events (event_name, params)
           VALUES ('blend_shown', $1::jsonb)`,
          [JSON.stringify({
            journey_id,
            source_text_id:    blendRow.id,
            text_length:       textLen,
            used_context_match: ctxMatched,
          })]
        ).catch(() => {});

        return res.json({
          show:               true,
          text:               blendRow.growth_text,
          source_type:        'blend',
          is_blend:           true,
          text_length:        textLen,
          used_context_match: ctxMatched,
          fallback:           false,
        });
      }
      // blend 후보 없음 → recall fallback (아래로 계속)
    }

    // ── 5. 내 과거 문장 재등장 (recall) ──────────────────────────
    const recallResult = await db.query(
      `SELECT id, growth_text
       FROM journey_logs
       WHERE journey_id = $1
         AND growth_text IS NOT NULL
         AND char_length(trim(growth_text)) BETWEEN 5 AND 80
         AND id NOT IN (
           SELECT source_log_id
           FROM recall_exposures
           WHERE journey_id = $1
         )
       ORDER BY RANDOM()
       LIMIT 1`,
      [journey_id]
    );

    let row      = recallResult.rows[0] ?? null;
    let fallback = false;

    if (!row) {
      // 미노출 문장 소진 → 전체에서 fallback
      const fbResult = await db.query(
        `SELECT id, growth_text
         FROM journey_logs
         WHERE journey_id = $1
           AND growth_text IS NOT NULL
           AND char_length(trim(growth_text)) BETWEEN 5 AND 80
         ORDER BY RANDOM()
         LIMIT 1`,
        [journey_id]
      );
      if (!fbResult.rows[0]) {
        return res.json({ show: false, reason: 'no_content' });
      }
      row      = fbResult.rows[0];
      fallback = true;
    }

    // recall_exposures 저장
    await db.query(
      `INSERT INTO recall_exposures (journey_id, source_log_id) VALUES ($1, $2)`,
      [journey_id, row.id]
    );

    const textLen = row.growth_text.trim().length;

    return res.json({
      show:               true,
      text:               row.growth_text,
      source_type:        'recall',
      is_blend:           false,
      text_length:        textLen,
      used_context_match: false,
      fallback,
    });

  } catch (err) {
    console.error('[recallWhisper] 오류:', err);
    res.status(500).json({ error: 'Failed to fetch recall whisper' });
  }
});

module.exports = router;
