'use strict';

/**
 * imageGenerationService.js — Star Image Generation
 *
 * SSOT → 템플릿 → 자동 생성 구조
 *
 * buildPrompt(scene, emotionText) → prompt string
 * generateStarImage(starId, emotion, location) → { image_url, image_id }
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
  'yeosu-cablecar':  'Inside a cable car at night above the sea in Yeosu. Tiny glowing city lights below, dark ocean stretching to the horizon.',
  'lattoa_cafe':     'A quiet seaside café at night with soft warm lights. A single window reveals the dark sea and a star above.',
  'forestland':      'A quiet forest path at night with soft starlight filtering through the canopy. Fireflies drift in the stillness.',
  'paransi':         'A coastal hilltop lookout at night. A distant lighthouse blinks slowly over the dark sea below.',
  'cablecar':        'Inside a cable car at night above the sea in Yeosu. Tiny glowing city lights below, dark ocean stretching to the horizon.',
};

// ── SSOT: 감정 → 이미지 텍스트 ───────────────────────────────────
const EMOTION_TEXT_MAP = {
  '설렘':   '괜찮아졌어요 ✨',
  '편안함': '조금 가벼워졌어요',
  '기대':   '기대가 별이 됐어요',
  '정리됨': '지금이 괜찮아요',
};
const DEFAULT_EMOTION_TEXT = '괜찮아졌어요 ✨';

// ── SSOT: 프롬프트 템플릿 (고정) ─────────────────────────────────
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

// ── 검수 로직 (1단계: API 성공 여부만 자동 체크) ─────────────────
// Phase 2에서 GPT-4V를 통한 자동 시각 검수 추가 예정
function validateImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('http')) return false;
  return true;
}

// ── 저장 ──────────────────────────────────────────────────────────
async function saveImage({ starId, imageUrl, emotionText, location, promptUsed, validationPass }) {
  try {
    const { rows } = await db.query(
      `INSERT INTO star_images (star_id, image_url, emotion_text, location, prompt_used, validation_pass)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, image_url, created_at`,
      [starId, imageUrl, emotionText, location, promptUsed, validationPass]
    );
    return rows[0];
  } catch (err) {
    // migration 144 미실행 시 graceful 처리
    if (err.code === '42P01') {
      console.warn('[ImageGen] star_images 테이블 없음 (migration 144 필요) — 저장 생략');
      return null;
    }
    throw err;
  }
}

// ── 메인 함수 ─────────────────────────────────────────────────────
async function generateStarImage(starId, emotion, location) {
  const openai = getOpenAI();
  if (!openai) {
    console.warn('[ImageGen] OPENAI_API_KEY 미설정 — 이미지 생성 생략');
    return null;
  }

  const scene       = SCENE_MAP[location] || SCENE_MAP['cablecar'];
  const emotionText = EMOTION_TEXT_MAP[emotion] || DEFAULT_EMOTION_TEXT;
  const prompt      = PROMPT_TEMPLATE(scene, emotionText);

  console.log(`[ImageGen] 생성 시작 | star:${starId} | location:${location} | emotion:${emotion}`);

  let imageUrl;
  try {
    const response = await openai.images.generate({
      model:   'dall-e-3',
      prompt,
      n:       1,
      size:    '1024x1024',
      quality: 'standard',
      style:   'vivid',
    });
    imageUrl = response.data?.[0]?.url;
  } catch (err) {
    console.error('[ImageGen] DALL-E 호출 실패:', err.message);
    return null;
  }

  const pass   = validateImage(imageUrl);
  const record = await saveImage({ starId, imageUrl, emotionText, location, promptUsed: prompt, validationPass: pass });

  if (!pass) {
    console.warn(`[ImageGen] 검수 실패 | star:${starId} | url:${imageUrl?.slice(0, 60)}`);
    return null;
  }

  console.log(`[ImageGen] 완료 | star:${starId} | image_id:${record?.id}`);
  return { image_url: imageUrl, image_id: record?.id };
}

module.exports = { generateStarImage, buildPrompt: PROMPT_TEMPLATE, SCENE_MAP, EMOTION_TEXT_MAP };
