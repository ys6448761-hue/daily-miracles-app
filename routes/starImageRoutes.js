'use strict';

/**
 * starImageRoutes.js — Star Image Generation (감정×보석×장소 → 캐시된 이미지)
 * prefix: /api/star-image
 *
 * POST /generate  { emotion, gem, location }
 *   → { success, image_url, sentence, from_cache }
 *
 * 캐시 전략:
 *   - cache_key = `${emotionKey}_${gem}_${location}` (예: comfort_citrine_yeosu_cablecar)
 *   - DB hit + 파일 존재 → 즉시 반환 (≤0.5s 보장)
 *   - 미스 → gpt-image-1 생성 → PNG 파일 저장 → DB 기록 → 반환
 *   - gpt-image-1 실패 → DALL-E 3 fallback
 */

const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const { OpenAI } = require('openai');
const db      = require('../database/db');

let _openai = null;
function getOpenAI() {
  if (!_openai && process.env.OPENAI_API_KEY) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ── 감정 SSOT (영문 내부 키 기준) ──────────────────────────────────
// sentence: 화면 표시용 관찰형 문장
// core: 분위기·감정 핵심 (프롬프트 [EMOTION] 치환)
// star: 별씨앗 상태 묘사 (프롬프트 [STAR_STATE] 치환)
const EMOTION_MAP = {
  comfort: {
    sentence: '조금 괜찮아진 것 같네요',
    core:     'warmth, emotional relief, a quiet exhale of tension releasing',
    star:     'a softly glowing star with stable, warm brightness held gently in both hands',
  },
  calm: {
    sentence: '조용해졌어요',
    core:     'stillness, quiet calmness, thoughts settling into place',
    star:     'a small but clear star, stable and unmoving, radiating even light',
  },
  anxiety: {
    sentence: '조용히 느껴지고 있어요',
    core:     'quiet anxiety, inner heaviness, a tentative stillness',
    star:     'a very small faint star barely visible, trembling softly',
  },
  hope: {
    sentence: '믿고 싶어졌네요',
    core:     'rising hope, gentle anticipation, tender trust in something unseen',
    star:     'a bright star sending soft light downward, growing steadily warmer',
  },
  courage: {
    sentence: '이제 움직일 수 있을 것 같네요',
    core:     'quiet determination, readiness to move forward, inner resolve',
    star:     'a radiant star slightly expanded, pulsing with steady confident light',
  },
};

// ── UI 레이블 → 내부 감정 키 매핑 ─────────────────────────────────
const EMOTION_LABEL_MAP = {
  '숨이 놓였어요':  'comfort',
  '믿고 싶어졌어요': 'hope',
  '정리됐어요':    'calm',
  '용기났어요':    'courage',
};

// ── 보석 SSOT ──────────────────────────────────────────────────────
// tone: 별씨앗 빛 색감·질감 (프롬프트 [GEM_TONE] 치환)
const GEM_MAP = {
  ruby:     { tone: 'Subtle warm red glow, emotional and alive, pulsing softly like a heartbeat' },
  sapphire: { tone: 'Cool blue light, calm and intelligent, deep as a still night sky' },
  emerald:  { tone: 'Soft green hues, healing and soothing, breathing quietly like a forest' },
  diamond:  { tone: 'Clear white light, sharp and pure, dispersing into subtle rainbow shimmer' },
  citrine:  { tone: 'Warm golden light, optimistic and bright, glowing like first light of dawn' },
};

// ── 프롬프트 템플릿 SSOT ───────────────────────────────────────────
const PROMPT_TEMPLATE =
`A soft 2D Korean watercolor webtoon illustration.
Inside a modern Yeosu marine cable car cabin at night, a person is sitting quietly by the window, seen from behind, wearing simple modern casual clothes.
They gently hold [STAR_STATE].
The atmosphere conveys [EMOTION].
The star seed emits [GEM_TONE].
Outside the window, the Yeosu night sea, cable car line, harbor lights, and distant coastline are visible.
Strictly avoid Japanese traditional clothing, anime exaggeration, travel poster feeling, backpacks, suitcases, tourist pose, 3D, photorealism.`;

function generatePrompt(emotionKey, gem) {
  const emo = EMOTION_MAP[emotionKey] || EMOTION_MAP.comfort;
  const g   = GEM_MAP[gem]           || GEM_MAP.diamond;
  return PROMPT_TEMPLATE
    .replace('[EMOTION]',    emo.core)
    .replace('[STAR_STATE]', emo.star)
    .replace('[GEM_TONE]',   g.tone);
}

// ── 파일 저장 디렉토리 ─────────────────────────────────────────────
const CACHE_DIR = path.join(__dirname, '..', 'public', 'images', 'star-cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// ── DB 테이블 자동 생성 ────────────────────────────────────────────
;(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS star_image_cache (
        cache_key  TEXT        PRIMARY KEY,
        image_url  TEXT        NOT NULL,
        emotion    TEXT,
        gem        TEXT,
        location   TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[star-image] star_image_cache 테이블 확인/생성 완료');
  } catch (e) {
    console.warn('[star-image] 테이블 초기화 실패 (무시):', e.message);
  }
})();

// ── gpt-image-1 생성 ──────────────────────────────────────────────
async function generateWithGptImage1(prompt) {
  const client = getOpenAI();
  if (!client) throw new Error('OpenAI key 없음');

  const response = await client.images.generate({
    model:  'gpt-image-1',
    prompt,
    size:   '1024x1792',
  });

  const b64 = response.data[0].b64_json;
  if (!b64) throw new Error('gpt-image-1 b64 없음');
  return Buffer.from(b64, 'base64');
}

// ── DALL-E 3 fallback ─────────────────────────────────────────────
async function generateWithDallE3(prompt) {
  const client = getOpenAI();
  if (!client) throw new Error('OpenAI key 없음');

  const response = await client.images.generate({
    model:           'dall-e-3',
    prompt,
    n:               1,
    size:            '1024x1792',
    response_format: 'b64_json',
    style:           'natural',
  });

  const b64 = response.data[0].b64_json;
  if (!b64) throw new Error('dall-e-3 b64 없음');
  return Buffer.from(b64, 'base64');
}

// ── POST /generate ────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  const { emotion, gem, location = 'direct' } = req.body || {};

  if (!emotion || !gem) {
    return res.status(400).json({ success: false, error: 'emotion, gem 필수' });
  }

  // UI 레이블 → 내부 키 변환 (한글 직접 입력 또는 영문 키 둘 다 허용)
  const emotionKey = EMOTION_LABEL_MAP[emotion] || (EMOTION_MAP[emotion] ? emotion : null);
  if (!emotionKey) {
    return res.status(400).json({ success: false, error: '알 수 없는 감정' });
  }
  if (!GEM_MAP[gem]) {
    return res.status(400).json({ success: false, error: '알 수 없는 보석' });
  }

  const emotionMeta = EMOTION_MAP[emotionKey];
  const cacheKey    = `${emotionKey}_${gem}_${location}`;
  const sentence    = emotionMeta.sentence;

  // ── 캐시 조회 ──────────────────────────────────────────────────
  try {
    const { rows } = await db.query(
      'SELECT image_url FROM star_image_cache WHERE cache_key = $1',
      [cacheKey]
    );
    if (rows.length > 0) {
      const imageUrl  = rows[0].image_url;
      const filePath  = path.join(CACHE_DIR, `${cacheKey}.png`);
      if (fs.existsSync(filePath)) {
        return res.json({ success: true, image_url: imageUrl, sentence, from_cache: true });
      }
      // 파일 없으면 (ephemeral 재시작) → 재생성
    }
  } catch (e) {
    console.warn('[star-image] 캐시 조회 실패 (계속 진행):', e.message);
  }

  // ── 이미지 생성 ────────────────────────────────────────────────
  const prompt = generatePrompt(emotionKey, gem);
  let   imgBuf = null;

  try {
    imgBuf = await generateWithGptImage1(prompt);
    console.log(`[star-image] gpt-image-1 생성 완료 | ${cacheKey}`);
  } catch (e1) {
    console.warn(`[star-image] gpt-image-1 실패, DALL-E 3 fallback | ${e1.message}`);
    try {
      imgBuf = await generateWithDallE3(prompt);
      console.log(`[star-image] DALL-E 3 fallback 성공 | ${cacheKey}`);
    } catch (e2) {
      console.error(`[star-image] DALL-E 3 fallback도 실패 | ${e2.message}`);
      return res.status(500).json({ success: false, error: '이미지 생성 실패', sentence });
    }
  }

  // ── 파일 저장 + DB 캐시 ────────────────────────────────────────
  const fileName = `${cacheKey}.png`;
  const filePath = path.join(CACHE_DIR, fileName);
  const imageUrl = `/images/star-cache/${fileName}`;

  try {
    fs.writeFileSync(filePath, imgBuf);
    await db.query(
      `INSERT INTO star_image_cache (cache_key, image_url, emotion, gem, location)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cache_key) DO UPDATE SET image_url = EXCLUDED.image_url`,
      [cacheKey, imageUrl, emotionKey, gem, location]
    );
    console.log(`[star-image] 캐시 저장 완료 | ${cacheKey}`);
  } catch (e) {
    console.warn('[star-image] 캐시 저장 실패 (이미지는 반환):', e.message);
  }

  return res.json({ success: true, image_url: imageUrl, sentence, from_cache: false });
});

module.exports = router;
