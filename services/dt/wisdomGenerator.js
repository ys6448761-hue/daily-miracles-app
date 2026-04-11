/**
 * services/dt/wisdomGenerator.js
 * Aurora5 지혜 생성 엔진
 *
 * v2: aiGateway + templateResolver 통합
 *   - Day 2-6: templateBank에서 즉시 반환 (AI 미호출)
 *   - Day 1 또는 phase 기반: aiGateway 경유 (캐시 → 한도 → 예산 → AI)
 */

'use strict';

const { OpenAI } = require('openai');
const db             = require('../../database/db');
const logService     = require('./logService');
const { makeLogger } = require('../../utils/logger');
const aiGateway      = require('../aiGateway');
const { getWisdomTemplate, isTemplateEligible } = require('../messageTemplateBank');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const log    = makeLogger('wisdomGenerator');

const PHASE_LABEL = { day: '오늘', week: '이번 주', quarter: '이번 분기', year: '올해' };

// ── AI 지혜 생성 (day1 또는 첫 지혜에만 호출) ────────────────────────
async function _callOpenAI(wishText, phase) {
  const label = PHASE_LABEL[phase] || '오늘';
  const prompt = `당신은 Aurora5입니다.
소원꿈터의 별지기로서, 소원이의 성장을 돕는 따뜻하고 명확한 지혜를 전합니다.

사용자의 소원:
"${wishText}"

조건:
- 1~2문장, 200자 이내
- ${label}을 위한 방향 제시
- 지시적이지 않고, 스스로 답을 찾도록 비춰주기
- 따뜻하지만 명확하게, 행동을 자연스럽게 유도

출력:`;

  const res = await openai.chat.completions.create({
    model:       'gpt-4.1-mini',
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  200,
    temperature: 0.85,
  });

  return {
    text:      res.choices[0].message.content.trim(),
    model:     'gpt-4.1-mini',
    tokensIn:  res.usage?.prompt_tokens     ?? 0,
    tokensOut: res.usage?.completion_tokens ?? 0,
  };
}

/**
 * generateWisdom(wishText, phase, options)
 *   options.userId   - 유저 ID (게이트웨이 한도 추적용)
 *   options.galaxy   - 은하 코드 (템플릿 선택용)
 *   options.day      - 일차 (1~365)
 *   options.starId   - 별 ID (로깅용)
 */
async function generateWisdom(wishText, phase = 'day', options = {}) {
  const { userId, galaxy = 'healing', day = 1, starId } = options;

  // ── Day 2-6: 템플릿 우선 ──────────────────────────────────────────
  if (isTemplateEligible('wisdom', day)) {
    const tmpl = getWisdomTemplate(galaxy, day);
    if (tmpl) {
      log.info('지혜 템플릿 반환', { galaxy, day });
      aiGateway.logTemplateUsed({ userId, starId, service: 'wisdomGenerator', step: 'wisdom', day, galaxy }).catch(() => {});
      return tmpl;
    }
  }

  // ── Day 1 / 이후 phases: aiGateway 경유 ──────────────────────────
  const { text } = await aiGateway.call({
    userId,
    starId,
    service:  'wisdomGenerator',
    step:     `wisdom_${phase}`,
    wishText,
    modelFn:  () => _callOpenAI(wishText, phase),
    fallback: '오늘 하루, 소원을 한 번 더 떠올려보세요.',
  });

  return text;
}

/**
 * createWisdom(starId, wishText, phase, options)
 * DB에 저장하고 logService에 기록
 */
async function createWisdom(starId, wishText, phase = 'day', options = {}) {
  const content = await generateWisdom(wishText, phase, { ...options, starId });

  const result = await db.query(
    `INSERT INTO dt_wisdom_logs (star_id, content, phase, aurora5_prompt)
     VALUES ($1, $2, $3, $4)
     RETURNING id, content, phase, created_at`,
    [starId, content, phase, `phase=${phase} wish="${wishText.substring(0, 50)}"`]
  );
  const wisdom = result.rows[0];

  await logService.createLog(starId, 'wisdom', {
    wisdom_id: wisdom.id,
    phase,
    preview:   content.substring(0, 80),
  });

  log.info('wisdom 생성', { star_id: starId, phase, wisdom_id: wisdom.id });
  return wisdom;
}

module.exports = { generateWisdom, createWisdom };
