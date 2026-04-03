/**
 * services/dt/wisdomGenerator.js
 * Aurora5 지혜 생성 엔진
 */

const { OpenAI } = require('openai');
const db = require('../../database/db');
const logService = require('./logService');
const { makeLogger } = require('../../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const log = makeLogger('wisdomGenerator');

const PHASE_LABEL = { day: '오늘', week: '이번 주', quarter: '이번 분기', year: '올해' };

async function generateWisdom(wishText, phase = 'day') {
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
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.85,
  });

  return res.choices[0].message.content.trim();
}

async function createWisdom(starId, wishText, phase = 'day') {
  const content = await generateWisdom(wishText, phase);

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
    preview: content.substring(0, 80),
  });

  log.info('wisdom 생성', { star_id: starId, phase, wisdom_id: wisdom.id });
  return wisdom;
}

module.exports = { generateWisdom, createWisdom };
