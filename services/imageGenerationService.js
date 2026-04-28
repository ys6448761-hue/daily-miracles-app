'use strict';

/**
 * imageGenerationService.js — Star Image Generation (SSOT 기반)
 *
 * 구조: emotion → scene → SSOT template → image
 *
 * 응답 보장:
 *   1) 3초 타임아웃 → 정적 fallback 즉시 반환
 *   2) content_policy → 한글 제거 단순화 재시도 (3s)
 *   3) timeout / rate_limit → async 재시도 큐 (백그라운드)
 *   4) quota / billing → 재시도 없음
 */

const { OpenAI } = require('openai');
const db = require('../database/db');

let _openai = null;
function getOpenAI() {
  if (!_openai && process.env.OPENAI_API_KEY) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

let emitKpiEvent = null;
try { ({ emitKpiEvent } = require('./kpiEventEmitter')); } catch (_) {}

// ── SSOT v1 확정: 3-레이어 프롬프트 ─────────────────────────────
// BASE × GEM × EMOTION = 16가지 조합
// "하나의 여수를 16번 다르게 느끼게 한다"

const BASE_PROMPT =
`A soft 2D Korean watercolor webtoon illustration.
Inside a modern Yeosu marine cable car cabin at night, a person is sitting quietly by the window, seen from behind, wearing simple modern casual clothes.
They gently hold a small glowing gem-like star seed in both hands, in a quiet personal moment.
Outside the window, the Yeosu night sea, cable car line, harbor lights, and distant coastline are visible.
The mood is quiet, warm, personal, and emotional.
Strictly avoid Japanese traditional clothing, anime exaggeration, travel poster feeling, backpacks, suitcases, tourist pose, 3D, photorealism.`;

// 보석 레이어 — 별씨앗의 빛 색깔/질감
const GEM_PROMPT = {
  crystal:  `The star seed emits a transparent, softly diffused glow with subtle rainbow shimmer spreading through the fingers.`,
  ruby:     `The star seed glows with a warm, deep red tone — soft and emotional, pulsing gently like a heartbeat.`,
  emerald:  `The star seed radiates a gentle green light, natural and calm, breathing quietly like a forest.`,
  sapphire: `The star seed shines with a deep, steady blue — peaceful and thoughtful, like a still night sky.`,
};

// 감정 레이어 — 분위기
const EMOTION_PROMPT = {
  '설렘':   `The atmosphere feels slightly bright and sparkling, with soft glowing particles floating in the air.`,
  '편안함': `The atmosphere is calm, stable, and gently dim, with smooth and quiet lighting.`,
  '기대':   `The atmosphere feels open and expanding, with soft light spreading outward into the distance.`,
  '정리됨': `The atmosphere is deep and still, with minimal movement and a quiet sense of clarity.`,
};

// 역방향 맵 (generateShareImage 하위 호환 — display text → emotion key)
const EMOTION_TEXT_REVERSE_MAP = Object.fromEntries(
  Object.entries({
    '설렘':   '괜찮아졌어요 ✨',
    '편안함': '조금 가벼워졌어요',
    '기대':   '기대가 별이 됐어요',
    '정리됨': '지금이 괜찮아요',
  }).map(([k, v]) => [v, k])
);

// SSOT: 프롬프트 조합 (BASE + GEM + EMOTION)
function buildPrompt(emotionKey, gem_type = 'ruby') {
  const gemPart     = GEM_PROMPT[gem_type]     || GEM_PROMPT.ruby;
  const emotionPart = EMOTION_PROMPT[emotionKey] || EMOTION_PROMPT['설렘'];
  return `${BASE_PROMPT}\n\n${gemPart}\n\n${emotionPart}`;
}

// 프롬프트 검수 (SSOT 핵심 3요소 필수)
function validatePrompt(prompt) {
  if (!prompt.includes('cable car')) return false;
  if (!prompt.includes('person'))    return false;
  if (!prompt.includes('star seed')) return false;
  return true;
}

// Fallback 프롬프트 (content_policy 재시도 — 단순화)
function buildFallbackPrompt(emotionKey, gem_type = 'ruby') {
  const gemPart = GEM_PROMPT[gem_type] || GEM_PROMPT.ruby;
  return `A soft 2D Korean watercolor webtoon illustration.
Inside a Yeosu marine cable car cabin at night. A person seen from behind, casual clothes, holding a glowing star seed, in a quiet personal moment. Yeosu night sea and cable car line visible outside.
${gemPart}
Strictly avoid Japanese traditional clothing, anime exaggeration, travel poster feeling, backpacks, suitcases, tourist pose, 3D, photorealism.`;
}

// 하위 호환 — 기존 코드가 emotionText(display)로 호출하는 경우 대비
function getEmotionType(emotion) {
  if (emotion.includes('가벼') || emotion.includes('괜찮')) return 'healing';
  if (emotion.includes('정리') || emotion.includes('또렷'))  return 'clarity';
  return 'hope';
}
const SCENE_MAP = {
  healing: `A calm night sea in Yeosu with gentle waves reflecting soft lights.`,
  clarity: `A quiet night view of Yeosu city with warm glowing lights.`,
  hope:    `Inside a cable car at night above the sea in Yeosu.`,
};

// ── SSOT: 감정 키 → 이미지 텍스트 ───────────────────────────────
const EMOTION_TEXT_MAP = {
  '설렘':   '괜찮아졌어요 ✨',
  '편안함': '조금 가벼워졌어요',
  '기대':   '기대가 별이 됐어요',
  '정리됨': '지금이 괜찮아요',
};
const DEFAULT_EMOTION_TEXT = '괜찮아졌어요 ✨';

// ── 정적 Fallback 이미지 ──────────────────────────────────────────
const TYPE_FALLBACK_URLS = {
  healing: '/images/fallback/star-yeosu-cablecar.svg',
  clarity: '/images/fallback/star-paransi.svg',
  hope:    '/images/fallback/star-yeosu-cablecar.svg',
};
const FALLBACK_DEFAULT = '/images/fallback/star-default.svg';

// 역호환 export용
const FALLBACK_IMAGE_URLS = {
  'yeosu-cablecar': '/images/fallback/star-yeosu-cablecar.svg',
  'lattoa_cafe':    '/images/fallback/star-lattoa-cafe.svg',
  'forestland':     '/images/fallback/star-forestland.svg',
  'paransi':        '/images/fallback/star-paransi.svg',
  'cablecar':       '/images/fallback/star-yeosu-cablecar.svg',
};

const LOCATION_NORMALIZE = {
  'yeosu_cablecar': 'yeosu-cablecar',
  'lattoa-cafe':    'lattoa_cafe',
};

// ── 25초 타임아웃 (DALL-E 3 실측 응답 ~20s 기준)
const DALLE_TIMEOUT_MS = 25000;

function _withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })),
        ms
      );
    }),
  ]);
}

// ── Async 재시도 큐 ───────────────────────────────────────────────
const _retryQueue = [];
let _retryBusy = false;

function _enqueueRetry(task) {
  _retryQueue.push(task);
  if (!_retryBusy) _drainRetryQueue();
}

async function _drainRetryQueue() {
  _retryBusy = true;
  while (_retryQueue.length) {
    const task = _retryQueue.shift();
    try { await task(); } catch (_) {}
    if (_retryQueue.length) await new Promise(r => setTimeout(r, 2000));
  }
  _retryBusy = false;
}

// ── 에러 분류 ─────────────────────────────────────────────────────
function classifyDallEError(err) {
  const msg  = (err.message || '').toLowerCase();
  const code = err.status || err.code || 0;
  if (msg.includes('content_policy') || msg.includes('safety'))  return 'content_policy';
  if (msg.includes('rate_limit') || code === 429)                 return 'rate_limit';
  if (msg.includes('insufficient_quota') || code === 402)        return 'quota_exceeded';
  if (msg.includes('timeout') || err.code === 'ETIMEDOUT')       return 'timeout';
  if (msg.includes('billing') || msg.includes('payment'))        return 'billing';
  return 'unknown';
}

// ── DALL-E 직접 호출 (타임아웃 없음 — 재시도 큐 전용) ────────────
async function _callDallERaw(prompt) {
  const openai = getOpenAI();
  if (!openai) return { url: null, error_type: 'no_key' };
  try {
    const res = await openai.images.generate({
      model: 'dall-e-3', prompt,
      n: 1, size: '1024x1024', quality: 'standard', style: 'natural',
    });
    return { url: res.data?.[0]?.url ?? null, error_type: null };
  } catch (err) {
    return { url: null, error_type: classifyDallEError(err) };
  }
}

// ── DALL-E 빠른 경로: 3s + content_policy 재시도 ─────────────────
async function _callDallEWithFallback(primaryPrompt, fallbackPrompt) {
  const openai = getOpenAI();
  if (!openai) return { url: null, used_fallback_prompt: false, error_type: 'no_key' };

  try {
    const res = await _withTimeout(
      openai.images.generate({
        model: 'dall-e-3', prompt: primaryPrompt,
        n: 1, size: '1024x1024', quality: 'standard', style: 'natural',
      }),
      DALLE_TIMEOUT_MS
    );
    return { url: res.data?.[0]?.url ?? null, used_fallback_prompt: false, error_type: null };
  } catch (err) {
    const errType = classifyDallEError(err);
    console.warn(`[ImageGen] 1차 실패 (${errType}):`, err.message?.slice(0, 80));
    if (errType !== 'content_policy') {
      return { url: null, used_fallback_prompt: false, error_type: errType };
    }
  }

  try {
    const res = await _withTimeout(
      openai.images.generate({
        model: 'dall-e-3', prompt: fallbackPrompt,
        n: 1, size: '1024x1024', quality: 'standard', style: 'natural',
      }),
      DALLE_TIMEOUT_MS
    );
    console.log('[ImageGen] 2차(단순화) 성공');
    return { url: res.data?.[0]?.url ?? null, used_fallback_prompt: true, error_type: null };
  } catch (err2) {
    const errType2 = classifyDallEError(err2);
    console.error(`[ImageGen] 2차 실패 (${errType2}):`, err2.message?.slice(0, 80));
    return { url: null, used_fallback_prompt: true, error_type: errType2 };
  }
}

// ── 검수 ──────────────────────────────────────────────────────────
function validateImage(imageUrl) {
  return typeof imageUrl === 'string' && imageUrl.startsWith('http');
}

// ── 저장 ─────────────────────────────────────────────────────────
async function saveImage({ starId = null, imageUrl, emotionText, location, promptUsed, validationPass }) {
  try {
    const { rows } = await db.query(
      `INSERT INTO star_images (star_id, image_url, emotion_text, location, prompt_used, validation_pass)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, image_url, created_at`,
      [starId, imageUrl, emotionText, location, promptUsed, validationPass]
    );
    return rows[0];
  } catch (err) {
    if (err.code === '42P01') {
      console.warn('[ImageGen] star_images 테이블 없음 (migration 144 필요) — 저장 생략');
      return null;
    }
    throw err;
  }
}

// ── 로그 ─────────────────────────────────────────────────────────
function _log({ status, emotionType, emotion, reason = null, source = 'share' }) {
  console.log('[ImageGen][LOG]', JSON.stringify({
    type: 'image_generation', status, emotion_type: emotionType,
    emotion: emotion?.slice(0, 30), reason, source,
    timestamp: new Date().toISOString(),
  }));
  if (emitKpiEvent && status === 'success') {
    emitKpiEvent({ eventName: 'image_generation_success', source, extra: { emotion_type: emotionType } }).catch(() => {});
  }
}

// ── KPI: 실패 이벤트 ──────────────────────────────────────────────
function _emitFailure(errorType, emotionType, source) {
  if (!emitKpiEvent) return;
  emitKpiEvent({
    eventName: 'image_generation_failed',
    source,
    extra: { error_type: errorType, emotion_type: emotionType },
  }).catch(() => {});
}

const RETRYABLE = new Set(['timeout', 'rate_limit', 'unknown']);

// ── API 1: star 연동 생성 (POST /api/star/create 비동기) ──────────
async function generateStarImage(starId, emotion, location, gem_type = 'ruby') {
  if (!getOpenAI()) return null;

  const emotionText    = EMOTION_TEXT_MAP[emotion] ?? DEFAULT_EMOTION_TEXT;
  const emotionType    = getEmotionType(emotionText);
  const primaryPrompt  = buildPrompt(emotion, gem_type);
  const fallbackPrompt = buildFallbackPrompt(emotion, gem_type);

  if (!validatePrompt(primaryPrompt)) {
    console.error('[ImageGen] 프롬프트 검수 실패 — SSOT 위반');
    return null;
  }

  console.log(`[ImageGen] star 시작 | star:${starId} | emotion:${emotion} | gem:${gem_type} | type:${emotionType}`);

  const { url: imageUrl, error_type } = await _callDallEWithFallback(primaryPrompt, fallbackPrompt);

  if (!imageUrl) {
    _emitFailure(error_type, emotionType, 'star_create');
    _log({ status: 'fallback', emotionType, emotion: emotionText, reason: error_type, source: 'star_create' });

    if (RETRYABLE.has(error_type)) {
      _enqueueRetry(async () => {
        console.log(`[ImageGen] star retry | star:${starId} | type:${emotionType}`);
        const { url: retryUrl, error_type: retryErr } = await _callDallERaw(primaryPrompt);
        if (retryUrl && validateImage(retryUrl)) {
          await saveImage({ starId, imageUrl: retryUrl, emotionText, location: emotionType, promptUsed: primaryPrompt, validationPass: true });
          _log({ status: 'success', emotionType, emotion: emotionText, source: 'star_retry' });
        } else {
          _emitFailure(retryErr, emotionType, 'star_create_retry');
        }
      });
    }
    return null;
  }

  const pass   = validateImage(imageUrl);
  const record = await saveImage({ starId, imageUrl, emotionText, location: emotionType, promptUsed: primaryPrompt, validationPass: pass });

  if (!pass) return null;
  _log({ status: 'success', emotionType, emotion: emotionText, source: 'star_create' });
  console.log(`[ImageGen] star 완료 | type:${emotionType} | image_id:${record?.id}`);
  return { image_url: imageUrl, image_id: record?.id };
}

// ── API 2: 공유용 온디맨드 생성 (POST /api/generate-share-image) ──
async function generateShareImage(location, emotionText, gem_type = 'ruby') {
  if (!location || !emotionText) throw new Error('location, emotionText 필수');

  // emotionText가 display text로 들어온 경우 key로 역변환 (하위 호환)
  const emotionKey     = EMOTION_TEXT_REVERSE_MAP[emotionText] || emotionText;
  const emotionType    = getEmotionType(emotionText);
  const primaryPrompt  = buildPrompt(emotionKey, gem_type);
  const fallbackPrompt = buildFallbackPrompt(emotionKey, gem_type);
  const fbUrl          = TYPE_FALLBACK_URLS[emotionType] ?? FALLBACK_DEFAULT;

  if (!validatePrompt(primaryPrompt)) {
    console.error('[ImageGen] 프롬프트 검수 실패 — SSOT 위반');
    return { image_url: fbUrl, image_id: null, location: emotionType, is_fallback: true, fallback_reason: 'prompt_validation_failed' };
  }

  console.log(`[ImageGen] share 시작 | type:${emotionType} | key:${emotionKey} | gem:${gem_type}`);

  if (!getOpenAI()) {
    _log({ status: 'fallback', emotionType, emotion: emotionText, reason: 'no_api_key' });
    return { image_url: fbUrl, image_id: null, location: emotionType, is_fallback: true, fallback_reason: 'no_api_key' };
  }

  const { url: imageUrl, used_fallback_prompt, error_type } = await _callDallEWithFallback(primaryPrompt, fallbackPrompt);

  if (!imageUrl) {
    _emitFailure(error_type, emotionType, 'share_image');
    _log({ status: 'fallback', emotionType, emotion: emotionText, reason: error_type });

    if (RETRYABLE.has(error_type)) {
      _enqueueRetry(async () => {
        console.log(`[ImageGen] share retry | type:${emotionType}`);
        const { url: retryUrl, error_type: retryErr } = await _callDallERaw(primaryPrompt);
        if (retryUrl && validateImage(retryUrl)) {
          await saveImage({ starId: null, imageUrl: retryUrl, emotionText, location: emotionType, promptUsed: primaryPrompt, validationPass: true });
          _log({ status: 'success', emotionType, emotion: emotionText, source: 'share_retry' });
        } else {
          _emitFailure(retryErr, emotionType, 'share_image_retry');
        }
      });
    }

    return { image_url: fbUrl, image_id: null, location: emotionType, is_fallback: true, fallback_reason: error_type };
  }

  const pass   = validateImage(imageUrl);
  const record = await saveImage({
    starId: null, imageUrl, emotionText, location: emotionType,
    promptUsed: used_fallback_prompt ? fallbackPrompt : primaryPrompt,
    validationPass: pass,
  });

  _log({ status: 'success', emotionType, emotion: emotionText });
  console.log(`[ImageGen] share 완료 | type:${emotionType} | simplified:${used_fallback_prompt} | image_id:${record?.id}`);
  return {
    image_url:              imageUrl,
    image_id:               record?.id ?? null,
    location:               emotionType,
    is_fallback:            false,
    used_simplified_prompt: used_fallback_prompt,
  };
}

module.exports = {
  generateStarImage,
  generateShareImage,
  buildPrompt,
  validatePrompt,
  getEmotionType,
  SCENE_MAP,
  EMOTION_TEXT_MAP,
  LOCATION_NORMALIZE,
  FALLBACK_IMAGE_URLS,
  PROMPT_TEMPLATE: null,
};
