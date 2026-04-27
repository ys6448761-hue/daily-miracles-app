'use strict';

/**
 * imageGenerationService.js — Star Image Generation (SSOT 기반)
 * Phase 1: 여수 Base SSOT 적용
 *
 * 장면 선택 우선순위:
 *   1) emotion key → EMOTION_SCENE_MAP → YEOSU_SCENES
 *   2) emotionText 역추적 → emotion key → scene
 *   3) location → LOCATION_SCENE_MAP → scene
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

// ── Phase 1 SSOT: 여수 3대 장면 ──────────────────────────────────
const YEOSU_SCENES = {
  'night-sea':
    'The still night sea of Yeosu seen from a low pier. Dark calm water. Distant city glow on the horizon. Absolute silence.',
  'night-view':
    'An elevated rooftop overlooking the night cityscape of Yeosu. Soft amber and white city lights far below. Open sky above.',
  'cablecar':
    'Inside a cable car drifting silently above the sea at night. Far below, Yeosu city lights flicker on dark water. Wide horizon.',
};

// emotion key → 여수 장면 key
// 치유/위로 → 밤바다 | 정리/생각 → 야경 | 희망/전환 → 케이블카
const EMOTION_SCENE_MAP = {
  '편안함': 'night-sea',
  '설렘':   'cablecar',
  '기대':   'cablecar',
  '정리됨': 'night-view',
};

// location → 여수 장면 key (share image API 역호환)
const LOCATION_SCENE_MAP = {
  'yeosu-cablecar': 'cablecar',
  'lattoa_cafe':    'night-sea',
  'forestland':     'night-view',
  'paransi':        'night-sea',
  'cablecar':       'cablecar',
};

// emotionText display → emotion key (share image에서 scene 역추적)
const DISPLAY_TO_EMOTION = {
  '괜찮아졌어요 ✨':   '설렘',
  '조금 가벼워졌어요': '편안함',
  '기대가 별이 됐어요': '기대',
  '지금이 괜찮아요':   '정리됨',
};

// ── 장면 해석 ─────────────────────────────────────────────────────
function _resolveSceneKey(emotion, normalizedLoc, emotionText) {
  if (emotion && EMOTION_SCENE_MAP[emotion])               return EMOTION_SCENE_MAP[emotion];
  const eKey = emotionText && DISPLAY_TO_EMOTION[emotionText];
  if (eKey && EMOTION_SCENE_MAP[eKey])                     return EMOTION_SCENE_MAP[eKey];
  return LOCATION_SCENE_MAP[normalizedLoc] ?? 'cablecar';
}

// ── 장소별 정적 Fallback 이미지 (DoD ③ — fallback도 같은 scene 규칙) ──
const SCENE_FALLBACK_URLS = {
  'night-sea':  '/images/fallback/star-yeosu-cablecar.svg',
  'night-view': '/images/fallback/star-paransi.svg',
  'cablecar':   '/images/fallback/star-yeosu-cablecar.svg',
};
const FALLBACK_DEFAULT = '/images/fallback/star-default.svg';

// 역호환 export용 (외부 참조 유지)
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

// ── SSOT: 감정 키 → 이미지 텍스트 ───────────────────────────────
const EMOTION_TEXT_MAP = {
  '설렘':   '괜찮아졌어요 ✨',
  '편안함': '조금 가벼워졌어요',
  '기대':   '기대가 별이 됐어요',
  '정리됨': '지금이 괜찮아요',
};
const DEFAULT_EMOTION_TEXT = '괜찮아졌어요 ✨';

// ── Phase 1 SSOT 프롬프트 템플릿 ─────────────────────────────────
// DoD: 텍스트 1줄만 / 여수 + 감정 + 별 1개 구조
const PROMPT_TEMPLATE = (scene, emotionText) => `\
A soft 2D watercolor illustration.

Scene:
${scene}

Composition:
Wide, still, immersive. One small glowing star as the single focal point, aligned with the viewer's gaze.

Character:
A single tiny silhouette — barely visible, far in the distance. Not the subject.

Mood:
Quiet, calm, slightly hopeful. No movement. No drama.

Style:
- 2D watercolor only
- No photorealism, no 3D rendering
- Soft brush strokes, muted glow
- Palette: deep navy, warm amber, faint starlight

Text:
One line only, minimal, placed near the star — "${emotionText}"`;

// Fallback 프롬프트 (content_policy 재시도 — 한글 제거)
// DoD ③: fallback도 같은 scene 규칙
const FALLBACK_PROMPT = (scene) => `\
A soft 2D watercolor illustration.

Scene:
${scene}

Composition: Wide, still. One small glowing star as focal point.
Style: 2D watercolor, soft edges, no photorealism, no 3D.
Palette: Deep navy, warm amber.
Mood: Quiet, hopeful.`;

// 역호환 export용 (외부 참조 유지)
const SCENE_MAP = Object.fromEntries(
  Object.entries(LOCATION_SCENE_MAP).map(([loc, key]) => [loc, YEOSU_SCENES[key]])
);

// ── 3s 타임아웃 ───────────────────────────────────────────────────
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
  const msg = (err.message || '').toLowerCase();
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
      n: 1, size: '1024x1024', quality: 'standard', style: 'vivid',
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

  try {
    const res = await _withTimeout(
      openai.images.generate({
        model: 'dall-e-3', prompt: fallbackPrompt,
        n: 1, size: '1024x1024', quality: 'standard', style: 'vivid',
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

const RETRYABLE = new Set(['timeout', 'rate_limit', 'unknown']);

// ── API 1: star 연동 생성 ─────────────────────────────────────────
// Phase 1: emotion → YEOSU_SCENES 자동 선택
async function generateStarImage(starId, emotion, location) {
  if (!getOpenAI()) return null;

  const sceneKey     = EMOTION_SCENE_MAP[emotion] ?? LOCATION_SCENE_MAP[location] ?? 'cablecar';
  const scene        = YEOSU_SCENES[sceneKey];
  const emotionText  = EMOTION_TEXT_MAP[emotion] ?? DEFAULT_EMOTION_TEXT;
  const primaryPrompt  = PROMPT_TEMPLATE(scene, emotionText);
  const fallbackPrompt = FALLBACK_PROMPT(scene);

  console.log(`[ImageGen] star 시작 | star:${starId} | emotion:${emotion} | scene:${sceneKey}`);

  const { url: imageUrl, error_type } = await _callDallEWithFallback(primaryPrompt, fallbackPrompt);

  if (!imageUrl) {
    _emitFailure(error_type, sceneKey, 'star_create');
    _log({ status: 'fallback', location: sceneKey, emotion, reason: error_type, source: 'star_create' });

    if (RETRYABLE.has(error_type)) {
      _enqueueRetry(async () => {
        console.log(`[ImageGen] star retry | star:${starId} | scene:${sceneKey}`);
        const { url: retryUrl, error_type: retryErr } = await _callDallERaw(primaryPrompt);
        if (retryUrl && validateImage(retryUrl)) {
          await saveImage({ starId, imageUrl: retryUrl, emotionText, location: sceneKey, promptUsed: primaryPrompt, validationPass: true });
          _log({ status: 'success', location: sceneKey, emotion, source: 'star_retry' });
        } else {
          _emitFailure(retryErr, sceneKey, 'star_create_retry');
        }
      });
    }
    return null;
  }

  const pass   = validateImage(imageUrl);
  const record = await saveImage({ starId, imageUrl, emotionText, location: sceneKey, promptUsed: primaryPrompt, validationPass: pass });

  if (!pass) return null;
  _log({ status: 'success', location: sceneKey, emotion, source: 'star_create' });
  console.log(`[ImageGen] star 완료 | image_id:${record?.id} | scene:${sceneKey}`);
  return { image_url: imageUrl, image_id: record?.id };
}

// ── API 2: 공유용 온디맨드 생성 ───────────────────────────────────
// Phase 1: emotionText 역추적 → scene, 없으면 location → scene
async function generateShareImage(location, emotionText) {
  if (!location || !emotionText) throw new Error('location, emotionText 필수');

  const normalizedLoc = LOCATION_NORMALIZE[location] ?? location;
  if (!LOCATION_SCENE_MAP[normalizedLoc] && !DISPLAY_TO_EMOTION[emotionText]) {
    throw new Error(`알 수 없는 location: ${location}`);
  }

  const sceneKey     = _resolveSceneKey(null, normalizedLoc, emotionText);
  const scene        = YEOSU_SCENES[sceneKey];
  const primaryPrompt  = PROMPT_TEMPLATE(scene, emotionText);
  const fallbackPrompt = FALLBACK_PROMPT(scene);
  const fbUrl        = SCENE_FALLBACK_URLS[sceneKey] ?? FALLBACK_DEFAULT;

  console.log(`[ImageGen] share 시작 | loc:${location} | scene:${sceneKey} | text:${emotionText?.slice(0, 20)}`);

  if (!getOpenAI()) {
    _log({ status: 'fallback', location: sceneKey, emotion: emotionText, reason: 'no_api_key' });
    return { image_url: fbUrl, image_id: null, location: sceneKey, is_fallback: true, fallback_reason: 'no_api_key' };
  }

  const { url: imageUrl, used_fallback_prompt, error_type } = await _callDallEWithFallback(primaryPrompt, fallbackPrompt);

  if (!imageUrl) {
    _emitFailure(error_type, sceneKey, 'share_image');
    _log({ status: 'fallback', location: sceneKey, emotion: emotionText, reason: error_type });

    if (RETRYABLE.has(error_type)) {
      _enqueueRetry(async () => {
        console.log(`[ImageGen] share retry | scene:${sceneKey}`);
        const { url: retryUrl, error_type: retryErr } = await _callDallERaw(primaryPrompt);
        if (retryUrl && validateImage(retryUrl)) {
          await saveImage({ starId: null, imageUrl: retryUrl, emotionText, location: sceneKey, promptUsed: primaryPrompt, validationPass: true });
          _log({ status: 'success', location: sceneKey, emotion: emotionText, source: 'share_retry' });
        } else {
          _emitFailure(retryErr, sceneKey, 'share_image_retry');
        }
      });
    }

    return { image_url: fbUrl, image_id: null, location: sceneKey, is_fallback: true, fallback_reason: error_type };
  }

  const pass   = validateImage(imageUrl);
  const record = await saveImage({
    starId: null, imageUrl, emotionText, location: sceneKey,
    promptUsed: used_fallback_prompt ? fallbackPrompt : primaryPrompt,
    validationPass: pass,
  });

  _log({ status: 'success', location: sceneKey, emotion: emotionText });
  console.log(`[ImageGen] share 완료 | scene:${sceneKey} | simplified:${used_fallback_prompt} | image_id:${record?.id}`);
  return {
    image_url:              imageUrl,
    image_id:               record?.id ?? null,
    location:               sceneKey,
    is_fallback:            false,
    used_simplified_prompt: used_fallback_prompt,
  };
}

module.exports = {
  generateStarImage,
  generateShareImage,
  SCENE_MAP,          // 역호환 (location → Yeosu scene description)
  YEOSU_SCENES,
  EMOTION_SCENE_MAP,
  EMOTION_TEXT_MAP,
  LOCATION_NORMALIZE,
  FALLBACK_IMAGE_URLS,
  PROMPT_TEMPLATE,
};
