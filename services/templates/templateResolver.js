/**
 * templateResolver.js — AI vs 템플릿 결정 엔진
 *
 * 역할:
 *   - 요청이 들어왔을 때 "AI를 써야 하나 / 템플릿으로 충분한가"를 결정
 *   - AI가 필요한 경우 aiGateway를 경유
 *   - 템플릿이 가능한 경우 messageTemplateBank에서 즉시 반환
 *
 * 결정 우선순위:
 *   1. step이 template-eligible 구간인가? → 템플릿
 *   2. 캐시 히트 가능한가?              → 캐시 반환 (aiGateway 경유)
 *   3. 유저 AI 호출 한도 초과?          → fallback
 *   4. 일일 예산 초과?                  → fallback
 *   5. → AI 호출 (aiGateway 경유)
 *
 * 핵심 원칙:
 *   Day 1 Origin / 첫 지혜 / 개입 메시지 → 반드시 AI
 *   Day 2-6 daily / checkin / restart    → 반드시 템플릿
 */

'use strict';

const {
  getDailyTemplate,
  getWisdomTemplate,
  getRestartTemplate,
  getCheckinTemplate,
  isTemplateEligible,
} = require('../messageTemplateBank');
const aiGateway = require('../aiGateway');

/**
 * resolve(options) — 메인 진입점
 *
 * @param {object} options
 *   userId      - 유저 ID (null 허용)
 *   starId      - 별 ID (null 허용)
 *   galaxy      - 'healing' | 'challenge' | 'relation' | 'growth' | 'miracle'
 *   starName    - 별 이름
 *   wishText    - 소원 텍스트
 *   service     - 서비스명 ('wisdomGenerator', 'careAgent', ...)
 *   step        - 'daily' | 'wisdom' | 'restart' | 'checkin' | 'day1_origin' | 'intervention'
 *   day         - 일차 (1-365)
 *   modelFn     - async () => string  (AI 호출 함수)
 *   fallback    - string (한도 초과 시 반환할 기본값)
 *
 * @returns { text: string, source: 'template' | 'cache' | 'ai' | 'fallback' }
 */
async function resolve(options) {
  const {
    userId,
    starId,
    galaxy    = 'healing',
    starName  = '별',
    wishText  = '',
    service,
    step,
    day       = 1,
    modelFn,
    fallback,
  } = options;

  // ── 1. 템플릿 구간 우선 처리 ──────────────────────────────────────
  if (isTemplateEligible(step, day)) {
    const text = _getTemplate(step, galaxy, day, starName);
    if (text) {
      // 이벤트만 기록 (AI 미호출)
      aiGateway.logTemplateUsed({ userId, starId, service, step, day, galaxy }).catch(() => {});
      return { text, source: 'template' };
    }
  }

  // ── 2. AI 게이트웨이 경유 (캐시 → 한도 → 예산 → AI) ─────────────
  if (!modelFn) {
    return { text: fallback ?? _defaultFallback(step, galaxy, starName), source: 'fallback' };
  }

  const result = await aiGateway.call({
    userId,
    starId,
    service,
    step,
    day,
    galaxy,
    wishText,
    modelFn,
    fallback: fallback ?? _defaultFallback(step, galaxy, starName),
  });

  return result;
}

// ── 내부 헬퍼 ──────────────────────────────────────────────────────
function _getTemplate(step, galaxy, day, starName) {
  if (step === 'daily')   return getDailyTemplate(galaxy, day, starName);
  if (step === 'wisdom')  return getWisdomTemplate(galaxy, day);
  if (step === 'restart') return getRestartTemplate(galaxy, starName);
  if (step === 'checkin') return getCheckinTemplate(galaxy, starName);
  return null;
}

function _defaultFallback(step, galaxy, starName) {
  // 어떤 상황에서도 서비스가 죽지 않도록 최소한의 응답 보장
  const FALLBACKS = {
    day1_origin:    '당신의 소원이 별로 태어났습니다. 이 여정의 시작을 축하드립니다.',
    intervention:   '잠깐 멈췄더라도 괜찮아요. 소원은 사라지지 않습니다.',
    wisdom:         '오늘 하루, 소원을 한 번 더 떠올려보세요.',
    daily:          `${starName}의 별이 오늘도 빛나고 있어요.`,
    checkin:        `${starName}, 소원꿈터가 기다리고 있어요.`,
    restart:        `${starName}, 언제든 돌아오면 됩니다.`,
  };
  return FALLBACKS[step] ?? `${starName}의 소원을 응원합니다.`;
}

module.exports = { resolve };
