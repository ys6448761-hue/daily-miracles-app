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

/**
 * Growth 전체 리텐션 KPI
 * - Day3 복귀율: day3_resume trigger 클릭 / trigger 노출
 * - Day7 완주율: day7_complete / day1_start
 * 목표: Day3 복귀율 40%+ / Day7 완주율 30%+
 */
async function getGrowthRetentionKpi(db, { days = 30 } = {}) {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE action = 'day1_start')    AS day1_start,
         COUNT(*) FILTER (WHERE action = 'day3_resume')   AS day3_resume,
         COUNT(*) FILTER (WHERE action = 'day7_complete') AS day7_complete
       FROM dreamtown_flow
       WHERE stage = 'growth'
         AND created_at >= NOW() - ($1 || ' days')::INTERVAL`,
      [days]
    );

    // Day3 복귀 trigger KPI (recommendation stage)
    const trig = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE value->>'trigger' = 'day3_resume' AND action = 'trigger') AS day3_shown,
         COUNT(*) FILTER (WHERE value->>'trigger' = 'day3_resume' AND action = 'click')   AS day3_click,
         COUNT(*) FILTER (WHERE value->>'trigger' IN ('day7_push','day7_stall') AND action = 'trigger') AS day7_shown,
         COUNT(*) FILTER (WHERE value->>'trigger' IN ('day7_push','day7_stall') AND action = 'click')   AS day7_click
       FROM dreamtown_flow
       WHERE stage = 'recommendation'
         AND created_at >= NOW() - ($1 || ' days')::INTERVAL`,
      [days]
    );

    const r  = rows[0]  ?? {};
    const t  = trig.rows[0] ?? {};
    const d1 = parseInt(r.day1_start,    10) || 0;
    const d7 = parseInt(r.day7_complete, 10) || 0;

    const day3Shown = parseInt(t.day3_shown, 10) || 0;
    const day3Click = parseInt(t.day3_click, 10) || 0;
    const day7Shown = parseInt(t.day7_shown, 10) || 0;
    const day7Click = parseInt(t.day7_click, 10) || 0;

    return {
      period_days:        days,
      day1_started:       d1,
      day7_completed:     d7,
      day7_complete_rate: d1 > 0 ? Math.round(d7 / d1 * 100) : null, // 목표 30%+
      day3_trigger: {
        shown:       day3Shown,
        clicked:     day3Click,
        return_rate: day3Shown > 0 ? Math.round(day3Click / day3Shown * 100) : null, // 목표 40%+
      },
      day7_trigger: {
        shown:       day7Shown,
        clicked:     day7Click,
        click_rate:  day7Shown > 0 ? Math.round(day7Click / day7Shown * 100) : null,
      },
    };
  } catch {
    return null;
  }
}

module.exports = { getDay1Prompt, getDay1ConversionRate, getGrowthRetentionKpi };
