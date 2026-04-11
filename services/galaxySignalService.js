/**
 * galaxySignalService.js — Galaxy Signal 생성 서비스
 *
 * whisper 저장 직후 비동기 호출:
 *   1. context signal  → context_tag 그대로
 *   2. emotion signal  → 규칙 기반 텍스트 감지
 *   3. length signal   → 문장 길이 구간
 *
 * 설계 원칙:
 *   - LLM 없음 (규칙 기반)
 *   - 응답 지연 없음 (fire-and-forget)
 *   - 실패해도 whisper 저장에 영향 없음
 *
 * 철학:
 *   사용자를 분석하는 게 아니라
 *   "사용자가 반복해서 보내는 신호를 듣는 것"
 */

'use strict';

const db = require('../database/db');

// ── 감정 감지 규칙 (MVP) ──────────────────────────────────────────────
const EMOTION_RULES = [
  { keywords: ['괜찮', '편해', '가벼워', '쉬어'], key: 'calm'    },
  { keywords: ['불안', '걱정', '두려', '무서'],   key: 'anxiety' },
  { keywords: ['하고 싶', '해보고 싶', '원해', '갖고 싶'], key: 'desire'  },
  { keywords: ['힘들', '지쳐', '피곤', '버거'],   key: 'fatigue' },
  { keywords: ['기뻐', '행복', '좋아', '설레'],   key: 'joy'     },
  { keywords: ['슬퍼', '울고 싶', '서러', '외로'], key: 'sadness' },
];

function detectEmotion(text) {
  for (const rule of EMOTION_RULES) {
    if (rule.keywords.some(kw => text.includes(kw))) return rule.key;
  }
  return 'neutral';
}

// ── 길이 신호 ─────────────────────────────────────────────────────────
function detectLength(text) {
  const len = text.trim().length;
  if (len < 10) return 'short';
  if (len < 25) return 'medium';
  return 'long';
}

// ── 신호 배열 빌드 ────────────────────────────────────────────────────
function buildSignals(journeyId, text, contextTag) {
  const signals = [];

  // 1. context signal (context_tag 있을 때만)
  if (contextTag) {
    signals.push({ journey_id: journeyId, signal_type: 'context', signal_key: contextTag });
  }

  // 2. emotion signal
  const emotion = detectEmotion(text);
  signals.push({ journey_id: journeyId, signal_type: 'emotion', signal_key: emotion });

  // 3. length signal
  const length = detectLength(text);
  signals.push({ journey_id: journeyId, signal_type: 'length', signal_key: length });

  return signals;
}

// ── 신호 저장 + 이벤트 로깅 ───────────────────────────────────────────
async function saveSignals(journeyId, text, contextTag) {
  const signals = buildSignals(journeyId, text, contextTag);

  // galaxy_signals 일괄 INSERT
  await Promise.all(
    signals.map(s =>
      db.query(
        `INSERT INTO galaxy_signals (journey_id, signal_type, signal_key)
         VALUES ($1, $2, $3)`,
        [s.journey_id, s.signal_type, s.signal_key]
      )
    )
  );

  // dt_events에 signal_generated 직접 기록 (서버사이드 이벤트)
  await Promise.all(
    signals.map(s =>
      db.query(
        `INSERT INTO dt_events (event_name, params)
         VALUES ('signal_generated', $1::jsonb)`,
        [JSON.stringify({
          journey_id:  journeyId,
          signal_type: s.signal_type,
          signal_key:  s.signal_key,
        })]
      )
    )
  );
}

/**
 * fire-and-forget wrapper — whisper 저장 응답에 영향 없음
 */
function generateSignals(journeyId, text, contextTag) {
  saveSignals(journeyId, text, contextTag)
    .catch(err => console.error('[galaxySignal] 신호 저장 실패:', err.message));
}

/**
 * 최근 7일 기준 사용자 상태 벡터 조회
 *
 * @returns {Promise<{dominant_context, dominant_emotion, recent_signals}>}
 */
async function getUserSignalState(journeyId) {
  const result = await db.query(
    `SELECT signal_type, signal_key, COUNT(*)::int AS count
     FROM galaxy_signals
     WHERE journey_id = $1
       AND created_at >= NOW() - INTERVAL '7 days'
     GROUP BY signal_type, signal_key
     ORDER BY count DESC`,
    [journeyId]
  );

  const rows = result.rows;

  const contextRows = rows.filter(r => r.signal_type === 'context');
  const emotionRows = rows.filter(r => r.signal_type === 'emotion');

  return {
    dominant_context: contextRows[0]?.signal_key ?? null,
    dominant_emotion: emotionRows[0]?.signal_key ?? null,
    recent_signals:   rows.slice(0, 10).map(r => ({
      type:  r.signal_type,
      key:   r.signal_key,
      count: r.count,
    })),
  };
}

module.exports = { generateSignals, getUserSignalState, detectEmotion, detectLength };
