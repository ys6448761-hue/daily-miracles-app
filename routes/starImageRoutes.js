'use strict';

/**
 * starImageRoutes.js — Star Image Generation (감정×보석×장소 → 캐시된 이미지)
 * prefix: /api/star-image
 *
 * POST /generate  { emotion, gem, location }
 *   → { success, image_url, sentence, from_cache }
 *
 * 캐시 전략:
 *   - cache_key = `${emotion}_${gem}_${location}` (예: comfort_citrine_yeosu_cablecar)
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

// ── 감정 SSOT ─────────────────────────────────────────────────────
// 4가지 새 감정 레이블 + 내부 키 + 화면 표시 문장 + 이미지 프롬프트
const EMOTION_MAP = {
  '숨이 놓였어요': {
    key:      'comfort',
    sentence: '잠시 숨을 내려놓아도 괜찮아요',
    prompt:   'The person looks deeply relaxed, shoulders softly dropped, a gentle breath of relief. The atmosphere feels like a quiet exhale — soft, still, and deeply restful.',
  },
  '믿고 싶어졌어요': {
    key:      'hope',
    sentence: '어딘가에서 답이 오고 있을지 몰라요',
    prompt:   'The person gazes through the window with quiet longing. A soft hopeful glow builds around the star seed. The atmosphere is tender, trusting, as if something good is on its way.',
  },
  '정리됐어요': {
    key:      'calm',
    sentence: '이미 마음속에서 답을 알고 있었어요',
    prompt:   'The person sits in quiet clarity. The star seed rests steadily in their hands, glowing evenly. The atmosphere is composed and still — thoughts have settled into place.',
  },
  '용기났어요': {
    key:      'courage',
    sentence: '한 걸음 더 나아갈 수 있을 것 같아요',
    prompt:   'The person sits with quiet but unmistakable inner strength. The star seed pulses with warm light. The atmosphere feels gently charged — ready to move forward.',
  },
};

// ── 보석 SSOT ──────────────────────────────────────────────────────
const GEM_MAP = {
  crystal:  { prompt: 'The star seed emits a transparent, softly diffused glow with subtle rainbow shimmer spreading through the fingers.' },
  ruby:     { prompt: 'The star seed glows with a warm, deep red tone — soft and emotional, pulsing gently like a heartbeat.' },
  emerald:  { prompt: 'The star seed radiates a gentle green light, natural and calm, breathing quietly like a forest.' },
  sapphire: { prompt: 'The star seed shines with a deep, steady blue — peaceful and thoughtful, like a still night sky.' },
  citrine:  { prompt: 'The star seed glows with rich golden amber warmth — like first light of dawn, full of prosperity and possibility.' },
};

// ── 기본 씬 프롬프트 ────────────────────────────────────────────────
const BASE_PROMPT =
`A soft 2D Korean watercolor webtoon illustration.
Inside a modern Yeosu marine cable car cabin at night, a person is sitting quietly by the window, seen from behind, wearing simple modern casual clothes.
They gently hold a small glowing gem-like star seed in both hands, in a quiet personal moment.
Outside the window, the Yeosu night sea, cable car line, harbor lights, and distant coastline are visible.
The mood is quiet, warm, personal, and emotional.
Strictly avoid Japanese traditional clothing, anime exaggeration, travel poster feeling, backpacks, suitcases, tourist pose, 3D, photorealism.`;

function buildPrompt(emotion, gem) {
  const emo = EMOTION_MAP[emotion];
  const g   = GEM_MAP[gem] || GEM_MAP.crystal;
  const emotionPart = emo ? emo.prompt : EMOTION_MAP['숨이 놓였어요'].prompt;
  return `${BASE_PROMPT}\n\n${g.prompt}\n\n${emotionPart}`;
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
    // gpt-image-1은 b64_json 형식으로 반환
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

  const emotionMeta = EMOTION_MAP[emotion];
  if (!emotionMeta) {
    return res.status(400).json({ success: false, error: '알 수 없는 감정' });
  }
  if (!GEM_MAP[gem]) {
    return res.status(400).json({ success: false, error: '알 수 없는 보석' });
  }

  const cacheKey = `${emotionMeta.key}_${gem}_${location}`;
  const sentence = emotionMeta.sentence;

  // ── 캐시 조회 ──────────────────────────────────────────────────
  try {
    const { rows } = await db.query(
      'SELECT image_url FROM star_image_cache WHERE cache_key = $1',
      [cacheKey]
    );
    if (rows.length > 0) {
      const imageUrl  = rows[0].image_url;
      const filePath  = path.join(CACHE_DIR, `${cacheKey}.png`);
      const fileReady = fs.existsSync(filePath);

      if (fileReady) {
        return res.json({ success: true, image_url: imageUrl, sentence, from_cache: true });
      }
      // 파일 없으면 (ephemeral 재시작) → 아래로 넘어가 재생성
    }
  } catch (e) {
    console.warn('[star-image] 캐시 조회 실패 (계속 진행):', e.message);
  }

  // ── 이미지 생성 ────────────────────────────────────────────────
  const prompt  = buildPrompt(emotion, gem);
  let   imgBuf  = null;

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
      [cacheKey, imageUrl, emotion, gem, location]
    );
    console.log(`[star-image] 캐시 저장 완료 | ${cacheKey}`);
  } catch (e) {
    console.warn('[star-image] 캐시 저장 실패 (이미지는 반환):', e.message);
  }

  return res.json({ success: true, image_url: imageUrl, sentence, from_cache: false });
});

module.exports = router;
