'use strict';

/**
 * imageGenerationService.js — Star Image Generation (SSOT 기반)
 *
 * SSOT → 템플릿 → 자동 생성 구조
 *
 * generateStarImage(starId, emotion, location)  → star 연동 생성 (비동기 fire-and-forget)
 * generateShareImage(location, emotionText)     → 공유용 온디맨드 생성 (즉시 반환)
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

// ── SSOT: 장소 → 씬 설명 ─────────────────────────────────────────
const SCENE_MAP = {
  'yeosu-cablecar': 'Inside a cable car at night above the sea in Yeosu. Tiny glowing city lights below, dark ocean stretching to the horizon.',
  'lattoa_cafe':    'A quiet seaside café at night with soft warm lights. A single window reveals the dark sea and a star above.',
  'forestland':     'A quiet forest path at night with soft starlight filtering through the canopy. Fireflies drift in the stillness.',
  'paransi':        'A coastal hilltop lookout at night. A distant lighthouse blinks slowly over the dark sea below.',
  'cablecar':       'Inside a cable car at night above the sea in Yeosu. Tiny glowing city lights below, dark ocean stretching to the horizon.',
};

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

// ── DALL-E 3 호출 (공통) ──────────────────────────────────────────
async function _callDallE(prompt) {
  const openai = getOpenAI();
  if (!openai) return null;
  try {
    const response = await openai.images.generate({
      model:   'dall-e-3',
      prompt,
      n:       1,
      size:    '1024x1024',
      quality: 'standard',
      style:   'vivid',
    });
    return response.data?.[0]?.url ?? null;
  } catch (err) {
    console.error('[ImageGen] DALL-E 호출 실패:', err.message);
    return null;
  }
}

// ── 검수 1단계: URL 유효성 (Phase 2: GPT-4V 시각 검수 예정) ──────
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

// ── API 1: star 연동 생성 (POST /api/star/create 비동기 연결) ─────
async function generateStarImage(starId, emotion, location) {
  if (!getOpenAI()) {
    console.warn('[ImageGen] OPENAI_API_KEY 미설정 — 생략');
    return null;
  }

  const scene       = SCENE_MAP[location] ?? SCENE_MAP['cablecar'];
  const emotionText = EMOTION_TEXT_MAP[emotion] ?? DEFAULT_EMOTION_TEXT;
  const prompt      = PROMPT_TEMPLATE(scene, emotionText);

  console.log(`[ImageGen] star 생성 시작 | star:${starId} | loc:${location} | em:${emotion}`);

  const imageUrl = await _callDallE(prompt);
  if (!imageUrl) return null;

  const pass   = validateImage(imageUrl);
  const record = await saveImage({ starId, imageUrl, emotionText, location, promptUsed: prompt, validationPass: pass });

  if (!pass) {
    console.warn(`[ImageGen] 검수 실패 | star:${starId}`);
    return null;
  }
  console.log(`[ImageGen] star 완료 | image_id:${record?.id}`);
  return { image_url: imageUrl, image_id: record?.id };
}

// ── API 2: 공유용 온디맨드 생성 (POST /api/generate-share-image) ──
async function generateShareImage(location, emotionText) {
  if (!location || !emotionText) {
    throw new Error('location, emotionText 필수');
  }
  if (!getOpenAI()) {
    throw new Error('OPENAI_API_KEY 미설정');
  }

  const normalizedLoc = LOCATION_NORMALIZE[location] ?? location;
  const scene         = SCENE_MAP[normalizedLoc] ?? SCENE_MAP['cablecar'];

  if (!SCENE_MAP[normalizedLoc]) {
    throw new Error(`알 수 없는 location: ${location}`);
  }

  const prompt = PROMPT_TEMPLATE(scene, emotionText);
  console.log(`[ImageGen] share 생성 시작 | loc:${location} | text:${emotionText}`);

  const imageUrl = await _callDallE(prompt);
  if (!imageUrl) throw new Error('이미지 생성 실패 (DALL-E 오류)');

  const pass   = validateImage(imageUrl);
  const record = await saveImage({ starId: null, imageUrl, emotionText, location: normalizedLoc, promptUsed: prompt, validationPass: pass });

  if (!pass) throw new Error('이미지 검수 실패');

  console.log(`[ImageGen] share 완료 | image_id:${record?.id}`);
  return { image_url: imageUrl, image_id: record?.id, location: normalizedLoc };
}

module.exports = {
  generateStarImage,
  generateShareImage,
  SCENE_MAP,
  EMOTION_TEXT_MAP,
  LOCATION_NORMALIZE,
  PROMPT_TEMPLATE,
};
