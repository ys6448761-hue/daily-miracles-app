/**
 * captionService.js
 * 소원그림 패키지 공통 1줄 캡션 생성 서비스
 *
 * - 보장/과장/민감정보 리스크 없는 담백한 1줄 캡션
 * - Postcard / Certificate / Wallpaper 공통 사용
 * - 톤: HOPEFUL | CALM | RESTART
 */

const { OpenAI } = require('openai');
const { checkForbiddenWords } = require('../utils/reverseOrderPrompt');

// 지연 초기화 (API 키 없어도 모듈 로딩 가능)
let _openai = null;
function getOpenAI() {
  if (!_openai && process.env.OPENAI_API_KEY) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ─── 톤별 폴백 캡션 ──────────────────────────────────
const FALLBACKS = {
  CALM: '오늘의 기록이 조용히 쌓여가요.',
  HOPEFUL: '좋은 방향으로 한 걸음 더.',
  RESTART: '다시 시작해도 괜찮아요.'
};

// ─── 보장/단정 금지어 정규식 ──────────────────────────
const GUARANTEE_REGEX = /이루어집니다|확실히|반드시|100%|운명\s*확정|당첨|보장|틀림없이|무조건|꼭\s*됩니다|성공\s*보장/;

// ─── 시스템 프롬프트 ──────────────────────────────────
const SYSTEM_PROMPT = `You are a caption writer for "하루하루의 기적" (Daily Miracles).

OUTPUT RULES (violating any = REJECTION):
- EXACTLY 1 line of Korean text, 8-22 characters (excluding spaces)
- Maximum 1 emoji (0 is preferred), no line breaks, no quotation marks
- NEVER use guarantee/certainty words: 이루어집니다, 확실히, 반드시, 100%, 운명, 확정, 당첨, 보장, 틀림없이, 무조건
- NEVER expose personal information or raw wish content
- NEVER mention diseases, treatments, investments, or specific promises
- NO fortune-telling, astrology, superstition, or gambling language
- Tone: warm but realistic, psychological/poetic language preferred

TONE GUIDE:
- CALM: contemplative, quiet accumulation, recording-focused
- HOPEFUL: forward-looking, gentle optimism, one-step-at-a-time
- RESTART: compassionate, fresh-start energy, permission-giving

Output ONLY the caption text. Nothing else.`;

/**
 * 유저 프롬프트 생성
 */
function buildUserPrompt(tone, keywords) {
  let prompt = `톤: ${tone}`;
  if (keywords && keywords.length > 0) {
    prompt += `\n키워드: ${keywords.join(', ')}`;
  }
  prompt += '\n\n위 조건에 맞는 1줄 캡션을 작성하세요.';
  return prompt;
}

/**
 * 캡션 후처리 검증
 * @returns {{ valid: boolean, safety_flags: object }}
 */
function validateCaption(caption) {
  const safety_flags = { has_forbidden: false, redacted: false, reason: null };

  // 1) 금지어 체크 (reverseOrderPrompt.js 재사용)
  const forbiddenResult = checkForbiddenWords(caption);
  if (!forbiddenResult.passed) {
    safety_flags.has_forbidden = true;
    safety_flags.redacted = true;
    safety_flags.reason = `Forbidden: ${forbiddenResult.violations.map(v => v.word).join(', ')}`;
    return { valid: false, safety_flags };
  }

  // 2) 보장/단정 정규식
  if (GUARANTEE_REGEX.test(caption)) {
    safety_flags.has_forbidden = true;
    safety_flags.redacted = true;
    safety_flags.reason = 'Contains guarantee/certainty words';
    return { valid: false, safety_flags };
  }

  // 3) 길이 체크 (공백 제외 10-30자, 여유 범위)
  const charCount = caption.replace(/\s/g, '').length;
  if (charCount < 5 || charCount > 22) {
    safety_flags.redacted = true;
    safety_flags.reason = `Length out of range: ${charCount} chars`;
    return { valid: false, safety_flags };
  }

  // 4) 이모지 1개 초과 금지
  const emojiCount = (caption.match(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}]/gu) || []).length;
  if (emojiCount > 1) {
    safety_flags.redacted = true;
    safety_flags.reason = `Too many emojis: ${emojiCount}`;
    return { valid: false, safety_flags };
  }

  // 5) 줄바꿸 금지
  if (caption.includes('\n')) {
    safety_flags.redacted = true;
    safety_flags.reason = 'Contains line break';
    return { valid: false, safety_flags };
  }

  return { valid: true, safety_flags };
}

/**
 * 1줄 캡션 생성
 *
 * @param {Object} options
 * @param {'HOPEFUL'|'CALM'|'RESTART'} options.tone
 * @param {string[]} [options.keywords]
 * @param {string} [options.locale='ko']
 * @returns {Promise<{ caption: string, safety_flags: { has_forbidden: boolean, redacted: boolean, reason?: string } }>}
 */
async function generateCaption({ tone = 'CALM', keywords = [], locale = 'ko' } = {}) {
  const safeTone = ['HOPEFUL', 'CALM', 'RESTART'].includes(tone) ? tone : 'CALM';
  const fallback = FALLBACKS[safeTone];

  // OpenAI API 키 없으면 즉시 폴백
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[CaptionService] OPENAI_API_KEY 미설정 → 폴백 반환');
    return { caption: fallback, safety_flags: { has_forbidden: false, redacted: false, reason: 'No API key' } };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(safeTone, keywords) }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      let caption = completion.choices[0].message.content.trim();

      // 따옴표 제거 (LLM이 가끔 감싸서 반환)
      caption = caption.replace(/^["'"']|["'"']$/g, '');

      const { valid, safety_flags } = validateCaption(caption);

      if (valid) {
        console.log(`[CaptionService] OK (attempt ${attempt}): "${caption}"`);
        return { caption, safety_flags };
      }

      console.warn(`[CaptionService] Validation failed (attempt ${attempt}): ${safety_flags.reason}`);
      lastError = new Error(safety_flags.reason);

    } catch (err) {
      lastError = err;
      console.error(`[CaptionService] API error (attempt ${attempt}):`, err.message);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  // 3회 모두 실패 → 폴백
  console.warn(`[CaptionService] All attempts failed → fallback (${safeTone})`);
  return {
    caption: fallback,
    safety_flags: {
      has_forbidden: false,
      redacted: true,
      reason: `Fallback after 3 failures: ${lastError?.message || 'unknown'}`
    }
  };
}

module.exports = { generateCaption, validateCaption, FALLBACKS };
