'use strict';

/**
 * wishEmotionService.js
 * 소원 → 공감/응원 유도 "감정 한 줄" 생성 (OpenAI gpt-4o-mini)
 *
 * 규칙 (SSOT):
 *   1. 1문장
 *   2. 감정/과정/부족함 포함
 *   3. 과장 금지
 *   4. 따뜻하지만 현실적
 */

const { OpenAI } = require('openai');
const db = require('../../database/db');
const { makeLogger } = require('../../utils/logger');

const log    = makeLogger('wishEmotionService');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPT = (wish) => `다음 소원을 보고, 사람들이 공감하고 응원하고 싶어지도록 "한 줄 이유"를 만들어주세요.

조건:
- 1문장
- 감정/과정/부족함 포함
- 과장 금지
- 따뜻하지만 현실적

소원: "${wish}"
출력: 한 줄 문장만`;

async function generateWishEmotion(wishText) {
  const res = await openai.chat.completions.create({
    model:       'gpt-4o-mini',
    messages:    [{ role: 'user', content: PROMPT(wishText) }],
    max_tokens:  80,
    temperature: 0.8,
  });
  return res.choices[0].message.content.trim();
}

async function generateAndSave(wishId, wishText) {
  try {
    const emotion = await generateWishEmotion(wishText);
    await db.query(
      `UPDATE dt_wishes SET wish_emotion = $1 WHERE id = $2`,
      [emotion, wishId]
    );
    log.info('wish_emotion 저장 완료', { wishId });
    return emotion;
  } catch (err) {
    log.warn('wish_emotion 생성 실패 (계속)', { err: err.message });
    return null;
  }
}

module.exports = { generateAndSave };
