'use strict';

/**
 * imageGenerationService.js — Star Image Generation (SSOT 기반)
 *
 * 응답 보장 구조:
 *   1) 3초 타임아웃 → 즉시 정적 fallback 반환 (UX 끊김 없음)
 *   2) content_policy → 한글 제거 단순화 프롬프트 재시도 (3s 이내)
 *   3) timeout / rate_limit → async 재시도 큐 (백그라운드, DB 저장)
 *   4) quota / billing → 정적 fallback (재시도 없음)
 *   5) 전체 실패 → is_fallback:true + KPI 이벤트 기록
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

// ── SSOT: 장소 → 씬 설명 ─────────────────────────────────────────
const SCENE_MAP = {
  'yeosu-cablecar': 'Inside a cable car at night above the sea in Yeosu. Tiny glowing city lights below, dark ocean stretching to the horizon.',
  'lattoa_cafe':    'A quiet seaside café at night with soft warm lights. A single window reveals the dark sea and a star above.',
  'forestland':     'A quiet forest path at night with soft starlight filtering through the canopy. Fireflies drift in the stillness.',
  'paransi':        'A coastal hilltop lookout at night. A distant lighthouse blinks slowly over the dark sea below.',
  'cablecar':       'Inside a cable car at night above the sea in Yeosu. Tiny glowing city lights below, dark ocean stretching to the horizon.',
};

// ── SSOT: 장소별 정적 Fallback 이미지 ────────────────────────────
const FALLBACK_IMAGE_URLS = {
  'yeosu-cablecar': '/images/fallback/star-yeosu-cablecar.svg',
  'lattoa_cafe':    '/images/fallback/star-lattoa-cafe.svg',
  'forestland':     '/images/fallback/star-forestland.svg',
  'paransi':        '/images/fallback/star-paransi.svg',
  'cablecar':       '/images/fallback/star-yeosu-cablecar.svg',
};
const FALLBACK_DEFAULT = '/images/fallback/star-default.svg';

// 입력 표기 정규화
const LOCATION_NORMALIZE = {
  'yeosu_cablecar': 'yeosu-cablecar',
  'lattoa-cafe':    'lattoa_cafe',
};

// ── SSOT: 감정 → 이미지 텍스트 ───────────────────────────────────
const EMOTION_TEXT_MAP = {
  '설렘':   '괜찮아졌어요 ✨',
  '편안함': '조금 가벼워졌어요',
  '기대':   '기대가 별이 됐어요',
  '정리됨': '지금이 괜찮아요',
};
const DEFAULT_EMOTION_TEXT = '괜찮아졌어요 ✨';

// ── SSOT: 프롬프트 템플릿 (절대 고정 — 변수 2개만 교체) ──────────
const PROMPT_TEMPLATE = (scene, emotionText) => `\
A soft 2D watercolor illustration in Ghibli-inspired and Korean manhwa style.

Scene:
${scene}

Perspective:
First-person or immersive perspective.

Character:
A very small, subtle silhouette, not the main subject.

Focus:
A single small glowing star aligned with the viewer's gaze.

Mood:
Calm, emotional, slightly hopeful.

Style constraints:
- 2D only
- watercolor texture
- no photorealism
- no 3D
- soft edges

Color palette:
Deep navy, soft purple, warm pink glow

Add minimal Korean text:
"${emotionText}"`;

// Fallback 프롬프트 (content_policy 재시도 — 한글 제거, 단순화)
const FALLBACK_PROMPT = (scene) => `\
A soft 2D watercolor illustration.

Scene:
${scene}

Style: 2D only, watercolor texture, soft edges, no photorealism.
Color palette: Deep navy, soft purple, warm pink glow.
Focus: A single small glowing star.
Mood: Calm, hopeful.`;

// ── UX 타임아웃: 3초 초과 시 fallback 즉시 반환 ─────────────────
const DALLE_TIMEOUT_MS = 3000;

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

// ── Async 재시도 큐 (백그라운드 — 타임아웃/레이트리밋 시) ─────────
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
  const msg = (err.message || '').toLowerCase();
  const code = err.status || err.code || 0;
  if (msg.includes('content_policy') || msg.includes('safety'))  return 'content_policy';
  if (msg.includes('rate_limit') || code === 429)                 return 'rate_limit';
  if (msg.includes('insufficient_quota') || code === 402)        return 'quota_exceeded';
  if (msg.includes('timeout') || err.code === 'ETIMEDOUT')       return 'timeout';
  if (msg.includes('billing') || msg.includes('payment'))        return 'billing';
  return 'unknown';
}

// ── DALL-E 3 직접 호출 (타임아웃 없음 — 재시도 큐 전용) ──────────
async function _callDallERaw(prompt) {
  const openai = getOpenAI();
  if (!openai) return { url: null, error_type: 'no_key' };
  try {
    const res = await openai.images.generate({
      model: 'dall-e-3', prompt,
      n: 1, size: '1024x1024', quality: 'standard', style: 'vivid',
    });
    return { url: res.data?.[0]?.url ?? null, error_type: null };
  } catch (err) {
    return { url: null, error_type: classifyDallEError(err) };
  }
}

// ── DALL-E 3 빠른 경로: 3s 타임아웃 + content_policy 재시도 ──────
async function _callDallEWithFallback(primaryPrompt, fallbackPrompt) {
  const openai = getOpenAI();
  if (!openai) return { url: null, used_fallback_prompt: false, error_type: 'no_key' };

  // 1차 시도: 원본 프롬프트 (3s)
  try {
    const res = await _withTimeout(
      openai.images.generate({
        model: 'dall-e-3', prompt: primaryPrompt,
        n: 1, size: '1024x1024', quality: 'standard', style: 'vivid',
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

  // 2차 시도: 단순화 프롬프트 (content_policy 우회, 3s)
  try {
    const res = await _withTimeout(
      openai.images.generate({
        model: 'dall-e-3', prompt: fallbackPrompt,
        n: 1, size: '1024x1024', quality: 'standard', style: 'vivid',
      }),
      DALLE_TIMEOUT_MS
    );
    console.log('[ImageGen] 2차 시도(단순화) 성공');
    return { url: res.data?.[0]?.url ?? null, used_fallback_prompt: true, error_type: null };
  } catch (err2) {
    const errType2 = classifyDallEError(err2);
    console.error(`[ImageGen] 2차 실패 (${errType2}):`, err2.message?.slice(0, 80));
    return { url: null, used_fallback_prompt: true, error_type: errType2 };
  }
}

// ── 검수: URL 유효성 ──────────────────────────────────────────────
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

// ── 로그 (성공/실패 공통) ─────────────────────────────────────────
function _log({ status, location, emotion, reason = null, source = 'share' }) {
  console.log('[ImageGen][LOG]', JSON.stringify({
    type: 'image_generation', status, location,
    emotion: emotion?.slice(0, 30), reason, source,
    timestamp: new Date().toISOString(),
  }));
  if (emitKpiEvent && status === 'success') {
    emitKpiEvent({ eventName: 'image_generation_success', source, extra: { location } }).catch(() => {});
  }
}

// ── KPI: 실패 이벤트 ──────────────────────────────────────────────
function _emitFailure(errorType, location, source) {
  if (!emitKpiEvent) return;
  emitKpiEvent({
    eventName: 'image_generation_failed',
    source,
    extra: { error_type: errorType, location },
  }).catch(() => {});
}

// 재시도 대상 에러 (quota/billing은 재시도 무의미)
const RETRYABLE = new Set(['timeout', 'rate_limit', 'unknown']);

// ── API 1: star 연동 생성 (POST /api/star/create 비동기) ──────────
async function generateStarImage(starId, emotion, location) {
  if (!getOpenAI()) return null;

  const scene          = SCENE_MAP[location] ?? SCENE_MAP['cablecar'];
  const emotionText    = EMOTION_TEXT_MAP[emotion] ?? DEFAULT_EMOTION_TEXT;
  const primaryPrompt  = PROMPT_TEMPLATE(scene, emotionText);
  const fallbackPrompt = FALLBACK_PROMPT(scene);

  console.log(`[ImageGen] star 시작 | star:${starId} | loc:${location}`);

  const { url: imageUrl, error_type } = await _callDallEWithFallback(primaryPrompt, fallbackPrompt);

  if (!imageUrl) {
    _emitFailure(error_type, location, 'star_create');
    _log({ status: 'fallback', location, emotion, reason: error_type, source: 'star_create' });

    if (RETRYABLE.has(error_type)) {
      _enqueueRetry(async () => {
        console.log(`[ImageGen] star retry 시작 | star:${starId}`);
        const { url: retryUrl, error_type: retryErr } = await _callDallERaw(primaryPrompt);
        if (retryUrl && validateImage(retryUrl)) {
          await saveImage({ starId, imageUrl: retryUrl, emotionText, location, promptUsed: primaryPrompt, validationPass: true });
          _log({ status: 'success', location, emotion, source: 'star_retry' });
          console.log(`[ImageGen] star retry 성공 | star:${starId}`);
        } else {
          _emitFailure(retryErr, location, 'star_create_retry');
        }
      });
    }
    return null;
  }

  const pass   = validateImage(imageUrl);
  const record = await saveImage({ starId, imageUrl, emotionText, location, promptUsed: primaryPrompt, validationPass: pass });

  if (!pass) return null;
  _log({ status: 'success', location, emotion, source: 'star_create' });
  console.log(`[ImageGen] star 완료 | image_id:${record?.id}`);
  return { image_url: imageUrl, image_id: record?.id };
}

// ── API 2: 공유용 온디맨드 생성 (POST /api/generate-share-image) ──
async function generateShareImage(location, emotionText) {
  if (!location || !emotionText) throw new Error('location, emotionText 필수');

  const normalizedLoc  = LOCATION_NORMALIZE[location] ?? location;
  if (!SCENE_MAP[normalizedLoc]) throw new Error(`알 수 없는 location: ${location}`);

  const scene          = SCENE_MAP[normalizedLoc];
  const primaryPrompt  = PROMPT_TEMPLATE(scene, emotionText);
  const fallbackPrompt = FALLBACK_PROMPT(scene);

  console.log(`[ImageGen] share 시작 | loc:${location} | text:${emotionText?.slice(0, 20)}`);

  // API key 없으면 즉시 정적 fallback
  if (!getOpenAI()) {
    const fbUrl = FALLBACK_IMAGE_URLS[normalizedLoc] ?? FALLBACK_DEFAULT;
    _log({ status: 'fallback', location: normalizedLoc, emotion: emotionText, reason: 'no_api_key' });
    return { image_url: fbUrl, image_id: null, location: normalizedLoc, is_fallback: true, fallback_reason: 'no_api_key' };
  }

  const { url: imageUrl, used_fallback_prompt, error_type } = await _callDallEWithFallback(primaryPrompt, fallbackPrompt);

  // DALL-E 실패 → 정적 fallback 즉시 반환 + async 재시도 큐
  if (!imageUrl) {
    _emitFailure(error_type, normalizedLoc, 'share_image');
    const fbUrl = FALLBACK_IMAGE_URLS[normalizedLoc] ?? FALLBACK_DEFAULT;
    _log({ status: 'fallback', location: normalizedLoc, emotion: emotionText, reason: error_type });

    if (RETRYABLE.has(error_type)) {
      _enqueueRetry(async () => {
        console.log(`[ImageGen] share retry 시작 | loc:${normalizedLoc}`);
        const { url: retryUrl, error_type: retryErr } = await _callDallERaw(primaryPrompt);
        if (retryUrl && validateImage(retryUrl)) {
          await saveImage({ starId: null, imageUrl: retryUrl, emotionText, location: normalizedLoc, promptUsed: primaryPrompt, validationPass: true });
          _log({ status: 'success', location: normalizedLoc, emotion: emotionText, source: 'share_retry' });
          console.log(`[ImageGen] share retry 성공 저장 | loc:${normalizedLoc}`);
        } else {
          _emitFailure(retryErr, normalizedLoc, 'share_image_retry');
        }
      });
    }

    return { image_url: fbUrl, image_id: null, location: normalizedLoc, is_fallback: true, fallback_reason: error_type };
  }

  const pass   = validateImage(imageUrl);
  const record = await saveImage({
    starId: null, imageUrl, emotionText, location: normalizedLoc,
    promptUsed: used_fallback_prompt ? fallbackPrompt : primaryPrompt,
    validationPass: pass,
  });

  _log({ status: 'success', location: normalizedLoc, emotion: emotionText });
  console.log(`[ImageGen] share 완료 | fallback_prompt:${used_fallback_prompt} | image_id:${record?.id}`);
  return {
    image_url:               imageUrl,
    image_id:                record?.id ?? null,
    location:                normalizedLoc,
    is_fallback:             false,
    used_simplified_prompt:  used_fallback_prompt,
  };
}

module.exports = {
  generateStarImage,
  generateShareImage,
  SCENE_MAP,
  EMOTION_TEXT_MAP,
  LOCATION_NORMALIZE,
  FALLBACK_IMAGE_URLS,
  PROMPT_TEMPLATE,
};
