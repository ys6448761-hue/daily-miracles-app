/**
 * day1OnboardingService.js — 별 생성 직후 Day1 진입 브릿지
 *
 * 원칙:
 *   - 선택지 1개만 — 고민할 시간 주지 않음
 *   - 설명 없음 — 바로 행동으로
 *   - 감정 기반 맞춤 프롬프트 (없으면 default)
 *
 * 사용:
 *   const { getDay1Prompt } = require('./day1OnboardingService');
 *   const day1 = getDay1Prompt({ emotion });   // /wishes/with-star 응답에 포함
 */

'use strict';

// wish-checkin state → 첫 행동 프롬프트 매핑
const EMOTION_PROMPT_MAP = {
  breathless:   { prompt: '30초만 천천히 숨 쉬어볼까요?',              action_key: 'breathe'    },
  overthinking: { prompt: '지금 가장 중요한 한 가지만 적어볼까요?',      action_key: 'write_one'  },
  want_rest:    { prompt: '오늘 딱 3분만 이 소원을 생각해볼까요?',       action_key: 'reflect'    },
  want_more:    { prompt: '오늘 할 수 있는 가장 작은 행동 하나는요?',   action_key: 'next_step'  },
};

const DEFAULT_PROMPT = {
  prompt:     '오늘 이 소원을 위한 작은 행동 하나를 적어볼까요?',
  action_key: 'first_step',
};

/**
 * @param {object} opts
 * @param {string|null} opts.emotion — wish-checkin state key (optional)
 * @returns {{ message, prompt, cta, action_key }}
 */
function getDay1Prompt({ emotion = null } = {}) {
  const p = EMOTION_PROMPT_MAP[emotion] ?? DEFAULT_PROMPT;

  return {
    message:    '지금 이 순간이 가장 중요해요',
    prompt:     p.prompt,
    cta:        '오늘의 작은 행동 시작',
    action_key: p.action_key,
  };
}

/**
 * Day1 프롬프트 노출 KPI 집계
 * (dreamtown_flow growth/day1_prompt_shown vs growth/day1_start 비교)
 */
async function getDay1ConversionRate(db, { days = 7 } = {}) {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE action = 'day1_prompt_shown') AS shown,
         COUNT(*) FILTER (WHERE action = 'day1_start')        AS started
       FROM dreamtown_flow
       WHERE stage = 'growth'
         AND created_at >= NOW() - ($1 || ' days')::INTERVAL`,
      [days]
    );
    const shown   = parseInt(rows[0]?.shown,   10) || 0;
    const started = parseInt(rows[0]?.started, 10) || 0;
    const rate    = shown > 0 ? Math.round(started / shown * 100) : null;

    return { period_days: days, shown, started, entry_rate: rate };
  } catch {
    return null;
  }
}

module.exports = { getDay1Prompt, getDay1ConversionRate };
