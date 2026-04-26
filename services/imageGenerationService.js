'use strict';

/**
 * imageGenerationService.js — Star Image Generation (SSOT 기반)
 *
 * 3단계 Fallback 방어선:
 *   1) content_policy → 한글 제거 단순화 프롬프트 재시도
 *   2) rate_limit / quota / timeout → 장소별 정적 fallback 이미지
 *   3) 전체 실패 → is_fallback:true 명시 + KPI 이벤트 기록
 *
 * generateStarImage(starId, emotion, location)  → star 연동 비동기
 * generateShareImage(location, emotionText)     → 공유용 온디맨드
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

// ── SSOT: 장소별 정적 Fallback 이미지 (Tier 2 방어선) ────────────
const FALLBACK_IMAGE_URLS = {
  'yeosu-cablecar': '/images/fallback/star-yeosu-cablecar.svg',
  'lattoa_cafe':    '/images/fallback/star-lattoa-cafe.svg',
  'forestland':     '/images/fallback/star-forestland.svg',
  'paransi':        '/images/fallback/star-paransi.svg',
  'cablecar':       '/images/fallback/star-yeosu-cablecar.svg',
};
const FALLBACK_DEFAULT = '/images/fallback/star-default.svg';

// 입력 표기 정규화 (underscore ↔ hyphen 혼용 허용)
const LOCATION_NORMALIZE = {
  'yeosu_cablecar': 'yeosu-cablecar',
  'lattoa-cafe':    'lattoa_cafe',
};

// ── SSOT: 감정 → 이미지 텍스트 (star 생성 플로우용) ──────────────
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

// Fallback 프롬프트 (Tier 1 재시도 — 한글 제거, 단순화)
const FALLBACK_PROMPT = (scene) => `\
A soft 2D watercolor illustration.

Scene:
${scene}

Style: 2D only, watercolor texture, soft edges, no photorealism.
Color palette: Deep navy, soft purple, warm pink glow.
Focus: A single small glowing star.
Mood: Calm, hopeful.`;

// ── 에러 분류 ─────────────────────────────────────────────────────
function classifyDallEError(err) {
  const msg = (err.message || '').toLowerCase();
  const code = err.status || err.code || 0;
  if (msg.includes('content_policy') || msg.includes('safety'))   return 'content_policy';
  if (msg.includes('rate_limit') || code === 429)                  return 'rate_limit';
  if (msg.includes('insufficient_quota') || code === 402)         return 'quota_exceeded';
  if (msg.includes('timeout') || err.code === 'ETIMEDOUT')        return 'timeout';
  if (msg.includes('billing') || msg.includes('payment'))         return 'billing';
  return 'unknown';
}

// ── DALL-E 3 호출 + Tier 1 재시도 ────────────────────────────────
async function _callDallEWithFallback(primaryPrompt, fallbackPrompt) {
  const openai = getOpenAI();
  if (!openai) return { url: null, used_fallback_prompt: false, error_type: 'no_key' };

  // 1차 시도: 원본 프롬프트
  try {
    const res = await openai.images.generate({
      model: 'dall-e-3', prompt: primaryPrompt,
      n: 1, size: '1024x1024', quality: 'standard', style: 'vivid',
    });
    return { url: res.data?.[0]?.url ?? null, used_fallback_prompt: false, error_type: null };
  } catch (err) {
    const errType = classifyDallEError(err);
    console.warn(`[ImageGen] 1차 실패 (${errType}):`, err.message?.slice(0, 80));

    // content_policy인 경우에만 재시도 (한글 없는 단순화 프롬프트)
    if (errType !== 'content_policy') {
      return { url: null, used_fallback_prompt: false, error_type: errType };
    }
  }

  // 2차 시도: 단순화 프롬프트 (content_policy 우회)
  try {
    const res = await openai.images.generate({
      model: 'dall-e-3', prompt: fallbackPrompt,
      n: 1, size: '1024x1024', quality: 'standard', style: 'vivid',
    });
    console.log('[ImageGen] 2차 시도(단순화) 성공');
    return { url: res.data?.[0]?.url ?? null, used_fallback_prompt: true, error_type: null };
  } catch (err2) {
    const errType2 = classifyDallEError(err2);
    console.error(`[ImageGen] 2차 실패 (${errType2}):`, err2.message?.slice(0, 80));
    return { url: null, used_fallback_prompt: true, error_type: errType2 };
  }
}

// ── 검수 1단계: URL 유효성 ────────────────────────────────────────
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

// ── KPI: 실패 이벤트 기록 ─────────────────────────────────────────
function _emitFailure(errorType, location, source) {
  if (!emitKpiEvent) return;
  emitKpiEvent({
    eventName: 'image_generation_failed',
    source,
    extra: { error_type: errorType, location },
  }).catch(() => {});
}

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
    return null;
  }

  const pass   = validateImage(imageUrl);
  const record = await saveImage({ starId, imageUrl, emotionText, location, promptUsed: primaryPrompt, validationPass: pass });

  if (!pass) return null;
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

  // OPENAI_API_KEY 없으면 즉시 정적 fallback
  if (!getOpenAI()) {
    const fbUrl = FALLBACK_IMAGE_URLS[normalizedLoc] ?? FALLBACK_DEFAULT;
    console.warn('[ImageGen] API key 없음 → 정적 fallback 반환');
    return { image_url: fbUrl, image_id: null, location: normalizedLoc, is_fallback: true, fallback_reason: 'no_api_key' };
  }

  const { url: imageUrl, used_fallback_prompt, error_type } = await _callDallEWithFallback(primaryPrompt, fallbackPrompt);

  // DALL-E 실패 → Tier 2: 정적 fallback
  if (!imageUrl) {
    _emitFailure(error_type, normalizedLoc, 'share_image');
    const fbUrl = FALLBACK_IMAGE_URLS[normalizedLoc] ?? FALLBACK_DEFAULT;
    console.warn(`[ImageGen] 전체 실패(${error_type}) → 정적 fallback: ${fbUrl}`);
    return { image_url: fbUrl, image_id: null, location: normalizedLoc, is_fallback: true, fallback_reason: error_type };
  }

  const pass   = validateImage(imageUrl);
  const record = await saveImage({
    starId: null, imageUrl, emotionText, location: normalizedLoc,
    promptUsed: used_fallback_prompt ? fallbackPrompt : primaryPrompt,
    validationPass: pass,
  });

  console.log(`[ImageGen] share 완료 | fallback_prompt:${used_fallback_prompt} | image_id:${record?.id}`);
  return {
    image_url:             imageUrl,
    image_id:              record?.id ?? null,
    location:              normalizedLoc,
    is_fallback:           false,
    used_simplified_prompt: used_fallback_prompt,
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
