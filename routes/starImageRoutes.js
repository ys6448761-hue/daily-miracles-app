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

// ── 프롬프트 템플릿 SSOT (location별) ────────────────────────────
const PROMPT_TEMPLATES = {
  cablecar:
`A soft 2D Korean watercolor webtoon illustration.
Inside a modern Yeosu marine cable car cabin at night, a person is sitting quietly by the window, seen from behind, wearing simple modern casual clothes.
They gently hold [STAR_STATE].
The atmosphere conveys [EMOTION].
The star seed emits [GEM_TONE].
Outside the window, the Yeosu night sea, cable car line, harbor lights, and distant coastline are visible.
Strictly avoid Japanese traditional clothing, anime exaggeration, travel poster feeling, backpacks, suitcases, tourist pose, 3D, photorealism.`,

  hamel:
`A soft 2D Korean watercolor webtoon illustration.
At the Hamel Lighthouse Village waterfront in Yeosu at dusk, a person stands quietly near the old stone lighthouse, seen from behind, wearing simple modern casual clothes.
They gently hold [STAR_STATE].
The atmosphere conveys [EMOTION].
The star seed emits [GEM_TONE].
The background shows the historic red-brick lighthouse, calm harbor water, and gentle golden-hour light reflecting off the sea.
Strictly avoid Japanese traditional clothing, anime exaggeration, travel poster feeling, backpacks, suitcases, tourist pose, 3D, photorealism.`,
};
// default = cablecar (기존 동작 유지)
PROMPT_TEMPLATES.default = PROMPT_TEMPLATES.cablecar;

// ── Location SSOT — canonical: cablecar / hamel ─────────────────────
// alias (yeosu_cablecar/yeosu_hamel/yeosu-*) 입력 허용, deprecation warning
const LOCATION_ALIAS = {
  'yeosu_cablecar':  'cablecar',
  'yeosu-cablecar':  'cablecar',
  'yeosu_hamel':     'hamel',
  'yeosu-hamel':     'hamel',
  'hamel_village':   'hamel',
};

function normalizeLocation(loc) {
  if (!loc) return 'direct';
  if (LOCATION_ALIAS[loc]) {
    console.warn(`[star-image] location alias deprecated: "${loc}" → "${LOCATION_ALIAS[loc]}". 호출자는 canonical key 사용 필요.`);
    return LOCATION_ALIAS[loc];
  }
  return loc;
}

function generatePrompt(emotionKey, gem, location) {
  const emo      = EMOTION_MAP[emotionKey] || EMOTION_MAP.comfort;
  const g        = GEM_MAP[gem]           || GEM_MAP.diamond;
  const template = PROMPT_TEMPLATES[location] || PROMPT_TEMPLATES.default;
  return template
    .replace('[EMOTION]',    emo.core)
    .replace('[STAR_STATE]', emo.star)
    .replace('[GEM_TONE]',   g.tone);
}

// ── Hamel 썸네일 파이프라인 SSOT ─────────────────────────────────────
// 소스: public/images/thumbnails/hamel/generated/full/ (manifest.json 기반)
// UI 4-emotion 키 → hamel thumbnail emotion 최근접 매핑
const HAMEL_THUMBNAIL_EMOTION_MAP = {
  comfort:  'calm',
  hope:     'fragile_hope',
  calm:     'calm',
  courage:  'curiosity',
  anxiety:  'confusion',
};

// hamel 썸네일 emotion별 고정 보석 (manifest SSOT 기준)
const HAMEL_THUMBNAIL_GEM_MAP = {
  confusion:    'moonstone',
  pause:        'sapphire',
  calm:         'emerald',
  curiosity:    'topaz',
  fragile_hope: 'diamond',
};

// base03 = hamel_base_04_low.png 기반, 구도 가장 안정적
function getHamelThumbnailImage(emotionKey) {
  const hamelEmotion = HAMEL_THUMBNAIL_EMOTION_MAP[emotionKey] || 'calm';
  const gemstone     = HAMEL_THUMBNAIL_GEM_MAP[hamelEmotion];
  return `/images/thumbnails/hamel/generated/full/hamel_${hamelEmotion}_${gemstone}_base03.png`;
}

// ── Stage 1 yeosu_cablecar 사전 생성 이미지 SSOT ──────────────────
// 파일명 형식: {index}_{emotion}_{gem}_yeosu_cablecar_stage1.png
// 인덱스 구조: gem 먼저 고정, emotion이 순환 (stage2와 반대)
//   01~05: citrine×(confusion,pause,calm,curiosity,fragile_hope)
//   06~10: sapphire×(...), 11~15: emerald×(...), 16~20: ruby×(...), 21~25: diamond×(...)
// UI 4-emotion 키 → stage1 5-emotion 키 최근접 매핑
const CABLECAR_STAGE1_EMOTION_REMAP = {
  comfort:  'calm',
  hope:     'fragile_hope',
  calm:     'calm',
  courage:  'curiosity',
  anxiety:  'confusion',
};

const CABLECAR_STAGE1_GEM_BASE = {
  citrine:  1,
  sapphire: 6,
  emerald:  11,
  ruby:     16,
  diamond:  21,
};

const CABLECAR_STAGE1_EMOTION_OFFSET = {
  confusion:    0,
  pause:        1,
  calm:         2,
  curiosity:    3,
  fragile_hope: 4,
};

function getCablecarStage1Image(emotionKey, gem) {
  const mapped     = CABLECAR_STAGE1_EMOTION_REMAP[emotionKey];
  const gemBase    = CABLECAR_STAGE1_GEM_BASE[gem];
  const emoOffset  = CABLECAR_STAGE1_EMOTION_OFFSET[mapped];
  if (gemBase === undefined || emoOffset === undefined) return null;
  const index = String(gemBase + emoOffset).padStart(2, '0');
  return `/images/star-cache/yeosu_cablecar/${index}_${mapped}_${gem}_yeosu_cablecar_stage1.png`;
}

// ── Stage 2 yeosu_cafe 사전 생성 이미지 SSOT ───────────────────────
// 파일명 형식: {index}_{emotion}_{gem}_yeosu_cafe_stage2.png
// index = EMOTION_BASE + GEM_OFFSET (01~25)
const STAGE2_EMOTION_BASE = {
  confusion:    1,
  pause:        6,
  calm:         11,
  curiosity:    16,
  fragile_hope: 21,
};

const STAGE2_GEM_OFFSET = {
  citrine:  0,
  sapphire: 1,
  emerald:  2,
  ruby:     3,
  diamond:  4,
};

function getStarImage(emotion, gem) {
  const base   = STAGE2_EMOTION_BASE[emotion];
  const offset = STAGE2_GEM_OFFSET[gem];
  if (base === undefined || offset === undefined) return null;
  const index = String(base + offset).padStart(2, '0');
  return `/images/star-cache/yeosu_cafe/${index}_${emotion}_${gem}_yeosu_cafe_stage2.png`;
}

// ── 파일 저장 기본 디렉토리 (location별 서브폴더 사용) ─────────────
const CACHE_BASE = path.join(__dirname, '..', 'public', 'images', 'star-cache');
if (!fs.existsSync(CACHE_BASE)) fs.mkdirSync(CACHE_BASE, { recursive: true });

function getCacheDir(location) {
  const dir = path.join(CACHE_BASE, location);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ── postcards/tmp_ 임시 저장 디렉토리 (generate → commit 이관용) ───
const POSTCARDS_BASE = path.join(__dirname, '..', 'public', 'images', 'postcards');
if (!fs.existsSync(POSTCARDS_BASE)) fs.mkdirSync(POSTCARDS_BASE, { recursive: true });

// 프리젠 소스 이미지를 postcards/tmp_{id}.png 로 복사 → URL 반환
// source 파일이 없으면 null 반환 (DALL-E fallback 유도)
async function copyPregenToPostcards(sourceRelPath) {
  const sharp      = require('sharp');
  const sourcePath = path.join(__dirname, '..', 'public', sourceRelPath.replace(/^\//, ''));
  if (!fs.existsSync(sourcePath)) return null;
  const tmpId   = require('crypto').randomUUID().slice(0, 12);
  const destPath = path.join(POSTCARDS_BASE, `tmp_${tmpId}.png`);
  await sharp(sourcePath).png().toFile(destPath);
  return `/images/postcards/tmp_${tmpId}.png`;
}

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
    size:   '1024x1536',  // gpt-image-1 지원 최대 세로 (1024x1792 미지원)
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
    size:            '1024x1536',
    response_format: 'b64_json',
    style:           'natural',
  });

  const b64 = response.data[0].b64_json;
  if (!b64) throw new Error('dall-e-3 b64 없음');
  return Buffer.from(b64, 'base64');
}

// ── POST /generate ────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  const { emotion, gem, location: rawLocation = 'direct' } = req.body || {};

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

  // location SSOT — canonical 1종만 내부 사용
  const requestedLocation = rawLocation;
  const location          = normalizeLocation(rawLocation);

  const emotionMeta = EMOTION_MAP[emotionKey];
  const cacheKey    = `${emotionKey}_${gem}_${location}`;
  const sentence    = emotionMeta.sentence;
  const cacheDir    = getCacheDir(location);

  // 모든 응답에 공통으로 들어가는 운영 로그 필드
  const buildPayload = (extra) => ({
    success: true,
    sentence,
    requested_location: requestedLocation,
    resolved_location:  location,
    ...extra,
  });

  // ── cablecar 사전 생성 이미지 우선 조회 ──────────────────────────
  if (location === 'cablecar') {
    const pregenUrl = getCablecarStage1Image(emotionKey, gem);
    if (pregenUrl) {
      const postcardUrl = await copyPregenToPostcards(pregenUrl).catch(() => null);
      if (postcardUrl) {
        return res.json(buildPayload({
          image_url:     postcardUrl,
          from_cache:    true,
          source_image:  pregenUrl,
          fallback_used: false,
        }));
      }
    }
    // pregen 미스 → AI 생성 fallback (location 강제 매칭은 PROMPT_TEMPLATES.cablecar)
  }

  // ── hamel 썸네일 이미지 우선 조회 ────────────────────────────────
  if (location === 'hamel') {
    const pregenUrl   = getHamelThumbnailImage(emotionKey);
    const postcardUrl = await copyPregenToPostcards(pregenUrl).catch(() => null);
    if (postcardUrl) {
      return res.json(buildPayload({
        image_url:     postcardUrl,
        from_cache:    true,
        source_image:  pregenUrl,
        fallback_used: false,
      }));
    }
    // pregen 미스 → AI 생성 fallback (PROMPT_TEMPLATES.hamel 사용)
  }

  // ── yeosu_cafe 사전 생성 이미지 (legacy stage2) ──────────────────
  if (location === 'yeosu_cafe') {
    const emotionNorm = emotionKey.replace(/\s+/g, '_');
    const pregenUrl   = getStarImage(emotionNorm, gem);
    if (pregenUrl) {
      const postcardUrl = await copyPregenToPostcards(pregenUrl).catch(() => null);
      if (postcardUrl) {
        return res.json(buildPayload({
          image_url:     postcardUrl,
          from_cache:    true,
          source_image:  pregenUrl,
          fallback_used: false,
        }));
      }
    }
  }

  // ── DB 캐시 조회 ───────────────────────────────────────────────
  try {
    const { rows } = await db.query(
      'SELECT image_url FROM star_image_cache WHERE cache_key = $1',
      [cacheKey]
    );
    if (rows.length > 0) {
      const imageUrl = rows[0].image_url;
      const filePath = path.join(cacheDir, `${cacheKey}.png`);
      if (fs.existsSync(filePath)) {
        return res.json(buildPayload({
          image_url:     imageUrl,
          from_cache:    true,
          source_image:  'db-cache',
          fallback_used: false,
        }));
      }
      // 파일 없으면 (ephemeral 재시작) → 재생성
    }
  } catch (e) {
    console.warn('[star-image] 캐시 조회 실패 (계속 진행):', e.message);
  }

  // ── 이미지 생성 ────────────────────────────────────────────────
  // location이 cablecar/hamel인데 pregen이 비어 떨어진 경우 — 'pregen-miss' fallback
  const pregenMissed = (location === 'cablecar' || location === 'hamel');
  const prompt       = generatePrompt(emotionKey, gem, location);
  let   imgBuf       = null;
  let   sourceModel  = null;
  let   fallbackUsed = pregenMissed ? 'pregen-miss' : false;

  try {
    imgBuf = await generateWithGptImage1(prompt);
    sourceModel = 'gpt-image-1';
    console.log(`[star-image] gpt-image-1 생성 완료 | ${cacheKey}`);
  } catch (e1) {
    console.warn(`[star-image] gpt-image-1 실패, DALL-E 3 fallback | ${e1.message}`);
    try {
      imgBuf = await generateWithDallE3(prompt);
      sourceModel = 'dall-e-3';
      fallbackUsed = fallbackUsed
        ? `${fallbackUsed},gpt-to-dalle`
        : 'gpt-to-dalle';
      console.log(`[star-image] DALL-E 3 fallback 성공 | ${cacheKey}`);
    } catch (e2) {
      console.error(`[star-image] DALL-E 3 fallback도 실패 | ${e2.message}`);
      return res.status(500).json({
        success: false,
        error: '이미지 생성 실패',
        sentence,
        requested_location: requestedLocation,
        resolved_location:  location,
      });
    }
  }

  // ── 파일 저장 → postcards/tmp_ (star-cache 경로 클라이언트 노출 금지) ──
  const tmpId    = require('crypto').randomUUID().slice(0, 12);
  const tmpFile  = `tmp_${tmpId}.png`;
  const filePath = path.join(POSTCARDS_BASE, tmpFile);
  const imageUrl = `/images/postcards/${tmpFile}`;

  try {
    fs.writeFileSync(filePath, imgBuf);
    await db.query(
      `INSERT INTO star_image_cache (cache_key, image_url, emotion, gem, location)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cache_key) DO UPDATE SET image_url = EXCLUDED.image_url`,
      [cacheKey, imageUrl, emotionKey, gem, location]
    );
    console.log(`[star-image] 저장 완료 | ${imageUrl}`);
  } catch (e) {
    console.warn('[star-image] 저장 실패 (이미지는 반환):', e.message);
  }

  return res.json(buildPayload({
    image_url:     imageUrl,
    from_cache:    false,
    source_image:  sourceModel,
    fallback_used: fallbackUsed,
  }));
});

// ── GET /resolve ─────────────────────────────────────────────────
// yeosu_cafe 사전 생성 이미지 URL 반환
// ?emotion=confusion&gem=citrine
router.get('/resolve', (req, res) => {
  const { emotion, gem } = req.query;
  if (!emotion || !gem) {
    return res.status(400).json({ success: false, error: 'emotion, gem 필수' });
  }

  const imageUrl = getStarImage(emotion, gem);
  if (!imageUrl) {
    return res.status(404).json({ success: false, error: '알 수 없는 emotion/gem' });
  }

  const filePath = path.join(CACHE_BASE, 'yeosu_cafe', path.basename(imageUrl));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: '이미지 파일 없음', image_url: imageUrl });
  }

  return res.json({ success: true, image_url: imageUrl });
});

// ── GET /list ─────────────────────────────────────────────────────
// 사전 생성 이미지 목록 — index 기준 정렬
// ?location=yeosu_cafe
router.get('/list', (req, res) => {
  const { location = 'yeosu_cafe' } = req.query;
  const dir = path.join(CACHE_BASE, location);

  if (!fs.existsSync(dir)) {
    return res.json({ success: true, location, images: [] });
  }

  const images = fs.readdirSync(dir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(f => ({
      file_name: f,
      url: `/images/star-cache/${location}/${f}`,
    }));

  return res.json({ success: true, location, images });
});

module.exports = router;
module.exports.getStarImage = getStarImage;
