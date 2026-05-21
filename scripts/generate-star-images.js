#!/usr/bin/env node
'use strict';

/**
 * generate-star-images.js — DreamTown 케이블카 25장 자동 생성 (Stage 1)
 *
 * 사용법:
 *   node scripts/generate-star-images.js --dry-run
 *   node scripts/generate-star-images.js --dry-run --print-prompt --emotion=anxiety --gem=citrine
 *   node scripts/generate-star-images.js --location=yeosu_cablecar --gem=citrine --limit=5
 *   node scripts/generate-star-images.js --location=yeosu_cablecar --emotion=anxiety --gem=citrine --force-regenerate
 *   node scripts/generate-star-images.js --validate-only --location=yeosu_cablecar
 *   node scripts/generate-star-images.js --retry-queue --location=yeosu_cablecar
 *   node scripts/generate-star-images.js --location=yeosu_cablecar           [승인 후만]
 *
 * 주의: --skip-validate 사용 금지 (Stage 2부터 validateImage 필수)
 *
 * SSOT: docs/ssot/DreamTown_WishImage_GPT_v3.4_final.md
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

// ── CLI 인자 파싱 ──────────────────────────────────────────────────
const args            = process.argv.slice(2);
const DRY_RUN         = args.includes('--dry-run');
const FORCE_REGEN     = args.includes('--force-regenerate');
const PRINT_PROMPT    = args.includes('--print-prompt');
const SKIP_VALIDATE   = args.includes('--skip-validate');
const VALIDATE_ONLY   = args.includes('--validate-only');
const RETRY_QUEUE_MODE = args.includes('--retry-queue');
const LOCATION        = (args.find(a => a.startsWith('--location='))  || '').replace('--location=',  '') || 'yeosu_cablecar';
const GEM_FILTER      = (args.find(a => a.startsWith('--gem='))       || '').replace('--gem=',       '') || null;
const EMOTION_FILTER  = (args.find(a => a.startsWith('--emotion='))   || '').replace('--emotion=',   '') || null;
const LIMIT           = parseInt((args.find(a => a.startsWith('--limit='))    || '').replace('--limit=',    '') || '999', 10);
const MAX_PARALLEL    = parseInt((args.find(a => a.startsWith('--parallel=')) || '').replace('--parallel=', '') || '4',   10);

// ── 환경 설정 ──────────────────────────────────────────────────────
const MODEL       = process.env.DREAMTOWN_IMAGE_MODEL  || 'gpt-image-1';
const IMAGE_SIZE  = process.env.DREAMTOWN_IMAGE_SIZE   || '1024x1536';
const RETRY_COUNT = parseInt(process.env.DREAMTOWN_RETRY_COUNT || '2', 10);
const MAX_COST    = parseFloat(process.env.DREAMTOWN_MAX_COST  || '5.0');
const COST_PER    = 0.04;  // gpt-image-1 per image (USD, 근사치)

// ── 경로 설정 ──────────────────────────────────────────────────────
const ROOT_DIR    = path.join(__dirname, '..');
const CACHE_BASE  = path.join(ROOT_DIR, 'public', 'images', 'star-cache');
const CACHE_DIR   = path.join(CACHE_BASE, LOCATION);
const FAILED_DIR  = path.join(CACHE_DIR, 'failed');
const LOG_DIR     = path.join(ROOT_DIR, 'logs');
const REPORT_DIR  = path.join(ROOT_DIR, 'reports');
const LOG_FILE    = path.join(LOG_DIR,    'star-images-generation.log');
const REPORT_FILE = path.join(REPORT_DIR, `${LOCATION}-generation-report.md`);
const RETRY_QUEUE = path.join(CACHE_DIR,  'retry_queue.json');

[CACHE_BASE, CACHE_DIR, FAILED_DIR, LOG_DIR, REPORT_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── 로거 ───────────────────────────────────────────────────────────
const LOG_STREAM = fs.createWriteStream(LOG_FILE, { flags: 'a' });
function ts() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }).replace(',', '');
}
function log(level, msg) {
  const line = `[${ts()}] ${level}: ${msg}`;
  console.log(line);
  LOG_STREAM.write(line + '\n');
}

// ── 매트릭스 SSOT ─────────────────────────────────────────────────
const EMOTIONS = ['anxiety', 'calm', 'comfort', 'hope', 'courage'];
const GEMS     = ['ruby', 'sapphire', 'emerald', 'diamond', 'citrine'];

// location별 베이스라인 보호 목록 (재생성 금지)
const BASELINE_BY_LOCATION = {
  yeosu_cablecar: [
    'anxiety_emerald_yeosu_cablecar.png',
    'calm_sapphire_yeosu_cablecar.png',
    'comfort_citrine_yeosu_cablecar.png',
    'hope_diamond_yeosu_cablecar.png',
    'courage_ruby_yeosu_cablecar.png',
  ],
  yeosu_cafe: [],  // Stage 2 — 베이스라인 없음 (신규 생성)
};
const EXISTING_BASELINE = BASELINE_BY_LOCATION[LOCATION] || [];

// ====================================================================
// v3.4 SSOT — 2026-04-29
// ====================================================================

const EMOTION_MATRIX = {
  anxiety: {
    star_state:   'barely visible far in the distance, almost not yet emerged, faint hint through soft mist',
    distance:     'very far',
    direction:    'downward weighted, heavy',
    time:         'deep night with mist',
    atmosphere:   'deep night sky muted blue-green, thin gentle fog drifting across distant lights, melancholic but never scary, healing silence rather than oppressive darkness',
    intent:       "the heavy quiet just before 'it will be okay'",
    must_remain:  'anxiety MUST stay heavy, melancholic, weighted, darkness and mist MUST dominate',
  },
  calm: {
    star_state:   'small star just being born, gently emerging, soft diffused light',
    distance:     'distant but visible',
    direction:    'still, paused',
    time:         'deep night',
    atmosphere:   'deep night sky rich blue, very faint horizon afterglow, quiet introspective mood',
    intent:       'the moment of stillness, before anything begins',
    must_remain:  'calm MUST stay still and quiet, NOT warm or hopeful',
  },
  comfort: {
    star_state:   'settled star breathing softly, gentle warm glow, peaceful luminance like slow exhale',
    distance:     'mid-distance',
    direction:    'settled, stable',
    time:         'twilight just after sunset',
    atmosphere:   'twilight just after sunset, restrained orange-pink afterglow, peaceful and embracing',
    intent:       'the moment when the heart unwinds',
    must_remain:  'comfort MUST feel embraced, NOT explosive or expanding',
  },
  hope: {
    star_state:   'star coming closer, reaching softly, light particles drifting upward',
    distance:     'closer than before',
    direction:    'upward, ascending',
    time:         'pre-dawn',
    atmosphere:   'pre-dawn sky transitioning from deep blue to soft lavender, clear and uplifting atmosphere with sense of lightness rising',
    intent:       'the moment of being pulled upward',
    must_remain:  'hope MUST be approaching, NOT arrived. NOT a sun, NOT a sunrise',
  },
  courage: {
    star_state:   'star about to expand, very soft light trails forming, quiet determination not explosive',
    distance:     'near',
    direction:    'forward, decisive',
    time:         'sky just before dawn',
    atmosphere:   'sky just before dawn, warm soft glow rising on horizon (supportive role only), forward movement',
    intent:       'the moment of quiet decision — about to move forward together with the star',
    must_remain:  'courage MUST be quiet decision, NOT explosive heroic flare',
  },
};

const GEM_TONES = {
  ruby:     'subtle warm red glow forming gentle halo around the star',
  sapphire: 'deep blue light emphasis with soft diffusion',
  emerald:  'soft green healing tone, very subtle',
  diamond:  'soft white luminance (NOT crystalline sparkle, NOT diamond cut)',
  citrine:  'warm golden glow, used VERY sparingly as a faint warm halo around the star ONLY',
};

const LOCATION_SCENE = {
  yeosu_cablecar:
`View from inside a cable car cabin (interior viewpoint, NOT external/aerial),
visible window frame with cable car handles on both sides,
window framing the Yeosu sea and distant city lights,
a single person seen from behind sitting in the center,
hair tied up neatly in a small bun, facing forward,
person occupies one-third of the lower frame, centered composition,
9:16 vertical composition.
The lower 20% stays visually calm and uncluttered.`,

  yeosu_cafe:
`View from inside a quiet Yeosu seaside café at night (interior viewpoint),
visible window frame with simple wooden sill,
window framing the calm Yeosu harbor and soft distant lights reflected on dark water,
a single person seen from behind sitting alone at the window table,
hair tied up neatly in a small bun, facing the window,
simple café table edge visible at the very bottom of frame,
person occupies one-third of the lower frame, centered composition,
9:16 vertical composition.
The lower 20% stays visually calm — no busy table details.`,
};

// ── Stage 1: 컴포지션 변형 A/B/C ──────────────────────────────────
const COMPOSITION_MAP = {
  A: 'Standard centered — person centered in frame, star centered directly above',
  B: 'Offset left — person slightly to the left, star upper-center, more sea space visible on the right',
  C: 'Person lower — person occupies lower 25% of frame, star positioned high above, expanded sky space',
};

// ── Stage 1: 포즈 변형 P1–P5 ──────────────────────────────────────
const POSE_VARIANT_MAP = {
  P1: 'hands resting gently on lap, sitting upright, relaxed posture',
  P2: 'hands folded together resting on window ledge, leaning slightly forward',
  P3: 'one hand raised slightly, fingertips barely touching the glass',
  P4: 'arms wrapped around knees, sitting curled inward, protective posture',
  P5: 'arms crossed gently across chest, leaning back slightly',
};

// 감정별 기본 포즈 매핑
const POSE_MAP = {
  anxiety:  'P4',
  calm:     'P1',
  comfort:  'P5',
  hope:     'P2',
  courage:  'P3',
};

// ── Stage 1: 카메라 앵글 ──────────────────────────────────────────
const CAMERA_MAP = {
  anxiety:  'slightly low angle, looking upward, making the distant star feel even further away',
  calm:     'neutral eye level, balanced and still composition',
  comfort:  'slight downward tilt, intimate embracing view',
  hope:     'slight upward tilt, star appears elevated and approaching',
  courage:  'forward-facing, direct neutral angle, steady and resolved',
};

const NEGATIVE_PROMPT =
`photorealistic, 3D render, hyper detailed, aerial view, exterior view, drone shot,
landscape only without person, multiple people, mascot character, cartoon exaggeration,
commercial travel poster, tourism advertisement, hotel promotion,
gloomy horror, dark fantasy, scary, oppressive, depressing, lifeless atmosphere,
text, letters, numbers, captions, words, watermark, signature, logo,
square aspect ratio, landscape orientation, busy lower frame,

★ STAR shape violations:
sharp star rays, harsh cross-shaped light beams, 8-pointed star,
overly intense star, completed star, fully formed brilliant star,
explosive light, dramatic flare, laser-like beams, aggressive light,
already arrived, completed transformation,

★ BACKGROUND violations:
sharp distinct city lights, clear bright dots, defined urban skyline,
crisp mountain edges, detailed bridges, harbor lights as bright spots,
oversaturated colors, vivid postcard look, travel brochure aesthetic,
landscape competing with star, beautiful scenic photograph feeling,
weak invisible star, multiple competing focal points,

★ COMPOSITION violations:
hair flowing loose, person facing sideways, person off-center,
person too small or too large, exterior view of cable car,

★ GEM VARIATION FUNCTION TRAPS:
gemstone color spreading to entire sky,
gemstone color overpowering the emotion,
warmth dominating cold mood,
golden glow flooding the city,
emotion changed by gem color,
mood shifted by light temperature,
anxiety becoming hopeful or peaceful,
calm becoming warm or comforting,
hope becoming sunrise or arrived,
courage becoming explosive heroic,
comfort becoming explosive joy,
sky color matching gem color,
city lights becoming gem-colored dots,

★ ANXIETY-specific traps:
anxiety becoming bright, anxiety becoming hopeful,
mist disappearing, clear visibility,
sunset or sunrise vibe in anxiety, anxiety atmosphere becoming warm,

★ HOPE-specific traps:
hope becoming courage, hope becoming sunrise,
star becoming a sun, horizon dominating sky,
explosive light from hope star, completed dawn,

★ COURAGE-specific traps:
heroic action movie atmosphere,
explosive expansion, blood-red ruby,
horizon overpowering star, completed sunrise,

★ COMFORT-specific traps:
comfort becoming hope or courage,
explosive warmth, dramatic sunset,

★ CALM-specific traps:
calm becoming comfort, warmth in calm,
already settled feeling, embracing atmosphere`;

// ── 프롬프트 빌더 v3.4 (Stage 1: composition + pose 파라미터 추가) ──
function buildPrompt({ emotion, gem, location, composition = 'A', pose = null }) {
  const em      = EMOTION_MATRIX[emotion];
  const gemTone = GEM_TONES[gem];
  const scene   = LOCATION_SCENE[location] || LOCATION_SCENE.yeosu_cablecar;
  const comp    = COMPOSITION_MAP[composition] || COMPOSITION_MAP.A;
  const poseKey = pose || POSE_MAP[emotion] || 'P1';
  const poseDesc = POSE_VARIANT_MAP[poseKey] || POSE_VARIANT_MAP.P1;
  const camera  = CAMERA_MAP[emotion];

  if (!em)      throw new Error(`Unknown emotion: ${emotion}`);
  if (!gemTone) throw new Error(`Unknown gem: ${gem}`);

  return `2D watercolor illustration, soft Ghibli-inspired Korean comic style,
warm emotional atmosphere, gentle lighting, soft gradients,
no photorealism, no 3D, no excessive detail,
no text, no letters, no captions, no watermarks.

[SCENE]
${scene}

[COMPOSITION — ${composition}]
${comp}.

[POSE — ${poseKey}]
Person posture: ${poseDesc}.
Camera angle: ${camera}.

[STAR — soft 4-pointed, the absolute focal point]
THE STAR IS THE EMOTIONAL FOCAL POINT,
positioned upper-center directly above the person's head,
a soft 4-pointed star (gentle cross shape, NOT sharp 8-pointed rays, NOT explosive),
distinctly the most luminous element in the frame,
${em.star_state},
the star is gently glowing — not overly intense, not sharp,
soft and slightly diffused ${gem} light,
just being born, quiet emergence rather than completed brilliance,
no harsh light beams, no sharp cross-shaped rays,
visual hierarchy: STAR (primary) > person (secondary) > soft background (tertiary).

[CRITICAL — emotion essence MUST be preserved]
${em.must_remain},
the gemstone color is ONLY in the star and its immediate halo,
the gemstone tone MUST NOT spread to the city, sky, or atmosphere,
the gemstone only changes the star's color/temperature,
NOT the emotional atmosphere of the scene.
This is ${emotion} with a ${gem} hint, NOT a different emotion.

[BACKGROUND RESTRAINT — beauty ≠ emotion, emptiness allows fullness]
Slightly reduce visual clarity of city lights — soft glowing warmth, NOT sharp distinct dots,
soften background details — mountains barely defined, almost dissolved,
distant bridges gently dissolved into atmosphere,
city feels like a memory rather than a clear view,
visual emptiness allows emotional fullness.

[ATMOSPHERE]
${em.atmosphere}.
${em.intent}.

[GEM — color/temperature variation only]
Subtle gemstone lighting accents emanating softly from the star itself: ${gemTone},
the warmth/coolness is ONLY around the star,
the rest of the scene preserves its ${emotion} mood.

[INTENT — DreamTown essence]
The exact moment when a wish is JUST BEGINNING to become a star —
not a star that has arrived, but a star being born right now.
Not a beautiful scene — the moment when the heart unwinds.

9:16 vertical aspect ratio, mobile portrait orientation.

NEGATIVE:
${NEGATIVE_PROMPT}`;
}

// ── 커스텀 프롬프트 오버라이드 ─────────────────────────────────────
const PROMPT_OVERRIDES = {};

// ── 백업 함수 ─────────────────────────────────────────────────────
function backupIfExists(filePath, dir) {
  if (!fs.existsSync(filePath)) return;
  const backupDir = path.join(dir, '_backup_v1');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const dest = path.join(backupDir, path.basename(filePath));
  fs.copyFileSync(filePath, dest);
  return dest;
}

// ── retry_queue.json 관리 ─────────────────────────────────────────
function enqueueRetry({ emotion, gem, location, reason, scores }) {
  let queue = [];
  if (fs.existsSync(RETRY_QUEUE)) {
    try { queue = JSON.parse(fs.readFileSync(RETRY_QUEUE, 'utf8')); } catch (_) { queue = []; }
  }
  // 동일 조합 중복 방지 (이미 있으면 업데이트)
  const idx = queue.findIndex(q => q.emotion === emotion && q.gem === gem && q.location === location);
  const entry = { emotion, gem, location, reason, scores, queued_at: new Date().toISOString() };
  if (idx >= 0) queue[idx] = entry;
  else          queue.push(entry);
  fs.writeFileSync(RETRY_QUEUE, JSON.stringify(queue, null, 2), 'utf8');
}

function dequeueRetry(emotion, gem) {
  if (!fs.existsSync(RETRY_QUEUE)) return;
  let queue = [];
  try { queue = JSON.parse(fs.readFileSync(RETRY_QUEUE, 'utf8')); } catch (_) { return; }
  queue = queue.filter(q => !(q.emotion === emotion && q.gem === gem && q.location === LOCATION));
  fs.writeFileSync(RETRY_QUEUE, JSON.stringify(queue, null, 2), 'utf8');
  if (queue.length === 0) {
    fs.unlinkSync(RETRY_QUEUE);
    log('INFO', 'retry_queue.json 비어 있음 → 삭제');
  }
}

// ── GPT-4o 이미지 검증 ─────────────────────────────────────────────
async function validateImage(imagePath, emotion, gem) {
  if (SKIP_VALIDATE) return { pass: true, skipped: true };

  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const base64 = fs.readFileSync(imagePath).toString('base64');

  const prompt =
`You are a visual quality evaluator for DreamTown star illustration images.

Evaluate this image. All scores are 0.0–1.0:

1. star_focal: Is there a clear, soft 4-pointed star as the dominant focal point above the person's head? (1.0 = perfect soft star, 0.0 = missing/wrong star)
2. emotion_preserved: Does the image accurately convey the emotion "${emotion}"? (1.0 = clearly ${emotion}, 0.0 = wrong emotion)
3. person_composition: Single person seen from behind, centered, in the lower portion of the frame? (1.0 = perfect, 0.0 = wrong)
4. overall_score: Overall quality as a DreamTown wish star illustration.

Respond ONLY with valid JSON:
{"star_focal":0.0,"emotion_preserved":0.0,"person_composition":0.0,"overall_score":0.0,"notes":"brief reason"}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}`, detail: 'high' } },
      ],
    }],
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  const scores = JSON.parse(response.choices[0].message.content);
  const pass = scores.overall_score >= 0.72 &&
               scores.star_focal >= 0.60 &&
               scores.emotion_preserved >= 0.60 &&
               scores.person_composition >= 0.60;
  return { ...scores, pass };
}

// ── OpenAI 이미지 생성 ────────────────────────────────────────────
async function generateImage(prompt) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.images.generate({
    model:  MODEL,
    prompt,
    size:   IMAGE_SIZE,
  });

  const item = response.data[0];
  if (item.b64_json) return { type: 'b64', data: Buffer.from(item.b64_json, 'base64') };
  if (item.url)      return { type: 'url', data: item.url };
  throw new Error('응답에 b64_json/url 없음');
}

function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── 단일 이미지 생성 + 검증 (with exponential backoff) ─────────────
async function generateOne({ emotion, gem, stats }) {
  const filename   = `${emotion}_${gem}_${LOCATION}.png`;
  const filePath   = path.join(CACHE_DIR, filename);
  const overrideKey = `${emotion}_${gem}`;
  const prompt = PROMPT_OVERRIDES[overrideKey] || buildPrompt({ emotion, gem, location: LOCATION });
  if (PROMPT_OVERRIDES[overrideKey]) log('OVERRIDE', `${filename} (보강 프롬프트 적용)`);

  for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
    if (stats.cost + COST_PER > MAX_COST) {
      log('ERROR', `비용 한도 초과 ($${MAX_COST}). 중단.`);
      return 'cost_exceeded';
    }

    const delay = attempt > 0 ? Math.pow(2, attempt) * 2000 : 0;
    if (delay) { log('WAIT', `${filename} 재시도 대기 ${delay / 1000}s`); await sleep(delay); }

    try {
      log('GENERATE', `${filename} (시도 ${attempt + 1}/${RETRY_COUNT})`);
      const genStart = Date.now();
      const result = await generateImage(prompt);

      let buf;
      if (result.type === 'b64') buf = result.data;
      else                        buf = await downloadUrl(result.data);

      // 임시 파일에 먼저 저장 후 검증
      const tmpPath = `${filePath}.tmp`;
      fs.writeFileSync(tmpPath, buf);

      const validation = await validateImage(tmpPath, emotion, gem);
      const elapsed = ((Date.now() - genStart) / 1000).toFixed(1);

      stats.cost += COST_PER;

      if (validation.pass || validation.skipped) {
        fs.renameSync(tmpPath, filePath);
        const scoreStr = validation.skipped
          ? '(검증 스킵)'
          : `overall=${validation.overall_score?.toFixed(2)} star=${validation.star_focal?.toFixed(2)} emotion=${validation.emotion_preserved?.toFixed(2)} pose=${validation.person_composition?.toFixed(2)}`;
        log('SUCCESS', `${filename} (${elapsed}s) ${scoreStr}`);
        dequeueRetry(emotion, gem);  // retry_queue에서 제거
        stats.generated++;
        return 'success';
      } else {
        // 검증 실패 → failed/ 폴더로 이동
        const failedPath = path.join(FAILED_DIR, `${path.basename(tmpPath, '.tmp')}_attempt${attempt + 1}.png`);
        fs.renameSync(tmpPath, failedPath);
        log('VALIDATE_FAIL', `${filename} attempt ${attempt + 1} — overall=${validation.overall_score?.toFixed(2)} notes="${validation.notes}"`);

        if (attempt === RETRY_COUNT - 1) {
          enqueueRetry({ emotion, gem, location: LOCATION, reason: validation.notes, scores: validation });
        }
      }
    } catch (err) {
      if (fs.existsSync(`${filePath}.tmp`)) fs.unlinkSync(`${filePath}.tmp`);
      log('RETRY', `${filename} attempt ${attempt + 1} 실패: ${err.message}`);
    }
  }

  log('FAIL', `${filename} — 최대 재시도 초과`);
  stats.failed++;
  return 'failed';
}

// ── --validate-only 모드 ──────────────────────────────────────────
async function runValidateOnly() {
  log('START', `validate-only 모드 | ${LOCATION}`);
  const results = [];
  for (const emotion of EMOTIONS) {
    for (const gem of GEMS) {
      const filename = `${emotion}_${gem}_${LOCATION}.png`;
      const filePath = path.join(CACHE_DIR, filename);
      if (!fs.existsSync(filePath)) continue;
      try {
        log('VALIDATE', filename);
        const v = await validateImage(filePath, emotion, gem);
        const mark = v.pass ? '✅' : '❌';
        log('SCORE', `${mark} ${filename} overall=${v.overall_score?.toFixed(2)} star=${v.star_focal?.toFixed(2)} emotion=${v.emotion_preserved?.toFixed(2)} pose=${v.person_composition?.toFixed(2)} | ${v.notes}`);
        results.push({ filename, ...v });
        if (!v.pass) enqueueRetry({ emotion, gem, location: LOCATION, reason: v.notes, scores: v });
      } catch (e) {
        log('ERROR', `${filename} 검증 실패: ${e.message}`);
      }
    }
  }
  const passed = results.filter(r => r.pass).length;
  log('SUMMARY', `검증 완료 — ${passed}/${results.length} 통과`);
}

// ── --retry-queue 모드 ────────────────────────────────────────────
async function runRetryQueue() {
  if (!fs.existsSync(RETRY_QUEUE)) {
    log('INFO', `retry_queue.json 없음 — 재생성 대상 없음 | ${LOCATION}`);
    return;
  }

  let queue = [];
  try { queue = JSON.parse(fs.readFileSync(RETRY_QUEUE, 'utf8')); } catch (e) {
    log('ERROR', `retry_queue.json 파싱 실패: ${e.message}`);
    return;
  }

  const targets = queue.filter(q => q.location === LOCATION);
  if (targets.length === 0) {
    log('INFO', `${LOCATION} 재생성 대상 없음 (큐에 다른 location 항목만 존재)`);
    return;
  }

  log('START', `retry-queue 모드 | ${LOCATION} | ${targets.length}개 대상 | validate=ON | parallel=${MAX_PARALLEL}`);
  const stats = { total: targets.length, generated: 0, skipped: 0, failed: 0, cost: 0 };

  const pLimit = require('p-limit');
  const limit  = pLimit(MAX_PARALLEL);

  const tasks = targets.map(({ emotion, gem }) =>
    limit(() => generateOne({ emotion, gem, stats }))
  );

  const results = await Promise.all(tasks);

  log('SUMMARY', [
    '',
    `  Retry 대상:  ${stats.total}`,
    `  재생성 완료: ${stats.generated}`,
    `  실패:        ${stats.failed}`,
    `  비용:        $${stats.cost.toFixed(2)}`,
  ].join('\n'));

  if (results.includes('cost_exceeded')) {
    log('WARN', '비용 한도로 일부 작업 중단됨');
  }

  // 남은 큐 상태 출력
  if (fs.existsSync(RETRY_QUEUE)) {
    const remaining = JSON.parse(fs.readFileSync(RETRY_QUEUE, 'utf8'));
    log('INFO', `retry_queue 잔여: ${remaining.length}개`);
  }

  generateReport(stats);
  process.exit(stats.failed > 0 ? 1 : 0);
}

// ── 메인 ─────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENAI_API_KEY && !DRY_RUN) {
    console.error('❌ OPENAI_API_KEY 없음. .env 설정 필요.');
    process.exit(1);
  }

  if (VALIDATE_ONLY) {
    await runValidateOnly();
    return;
  }

  if (RETRY_QUEUE_MODE) {
    await runRetryQueue();
    return;
  }

  // 전체 25장 조합 목록
  const all = [];
  for (const emotion of EMOTIONS) {
    for (const gem of GEMS) {
      all.push({ emotion, gem });
    }
  }

  let targets = all;
  if (EMOTION_FILTER) targets = targets.filter(t => t.emotion === EMOTION_FILTER);
  if (GEM_FILTER)     targets = targets.filter(t => t.gem     === GEM_FILTER);
  targets = targets.slice(0, LIMIT);

  const stats = { total: 0, generated: 0, skipped: 0, failed: 0, cost: 0 };

  log('START', `${LOCATION} | dry=${DRY_RUN} | parallel=${MAX_PARALLEL} | validate=${!SKIP_VALIDATE} | gem=${GEM_FILTER || 'ALL'} | emotion=${EMOTION_FILTER || 'ALL'} | limit=${LIMIT}`);

  // 스킵 판정 (baseline / 이미 존재)
  const toGenerate = [];
  for (const { emotion, gem } of targets) {
    const filename = `${emotion}_${gem}_${LOCATION}.png`;
    const filePath = path.join(CACHE_DIR, filename);
    stats.total++;

    if (EXISTING_BASELINE.includes(filename)) {
      log('SKIP', `${filename} (baseline — 재생성 금지)`);
      stats.skipped++;
      continue;
    }

    if (fs.existsSync(filePath)) {
      if (!FORCE_REGEN && !(DRY_RUN && PRINT_PROMPT)) {
        log('SKIP', `${filename} (already exists)`);
        stats.skipped++;
        continue;
      }
      if (FORCE_REGEN && !DRY_RUN) {
        backupIfExists(filePath, CACHE_DIR);
        log('BACKUP', `${filename} → _backup_v1/`);
      }
    }

    // DRY-RUN
    if (DRY_RUN) {
      log('DRY-RUN', `Would generate: ${filename}`);
      if (PRINT_PROMPT) {
        const overrideKey = `${emotion}_${gem}`;
        const preview = PROMPT_OVERRIDES[overrideKey] || buildPrompt({ emotion, gem, location: LOCATION });
        console.log('\n─────────────────────────────────────────');
        console.log(`PROMPT [${filename}] (${preview.length}자):`);
        console.log('─────────────────────────────────────────');
        console.log(preview);
        console.log('─────────────────────────────────────────\n');
      }
      stats.generated++;
      continue;
    }

    toGenerate.push({ emotion, gem });
  }

  if (!DRY_RUN && toGenerate.length > 0) {
    // p-limit 병렬 처리
    const pLimit = require('p-limit');
    const limit  = pLimit(MAX_PARALLEL);

    const tasks = toGenerate.map(({ emotion, gem }) =>
      limit(() => generateOne({ emotion, gem, stats }))
    );

    const results = await Promise.all(tasks);

    if (results.includes('cost_exceeded')) {
      log('WARN', '비용 한도로 일부 작업이 중단됨');
    }
  }

  // ── 요약 ─────────────────────────────────────────────────────────
  const estimatedCost = DRY_RUN ? (stats.generated * COST_PER).toFixed(2) : stats.cost.toFixed(2);
  log('SUMMARY', [
    '',
    `  Total:     ${stats.total}`,
    `  Generated: ${stats.generated}${DRY_RUN ? ' (planned)' : ''}`,
    `  Skipped:   ${stats.skipped}`,
    `  Failed:    ${stats.failed}`,
    `  Cost:      $${estimatedCost}${DRY_RUN ? ' (estimated)' : ''}`,
  ].join('\n'));

  generateReport(stats);
  process.exit(stats.failed > 0 ? 1 : 0);
}

// ── 검수 리포트 ───────────────────────────────────────────────────
function generateReport(stats) {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });

  const rows = EMOTIONS.map(emotion => {
    const cells = GEMS.map(gem => {
      const filename = `${emotion}_${gem}_${LOCATION}.png`;
      const filePath  = path.join(CACHE_DIR, filename);
      if (EXISTING_BASELINE.includes(filename)) return '✅ baseline';
      if (fs.existsSync(filePath)) return '✅ done';
      return DRY_RUN ? '⏳ planned' : '❌ missing';
    });
    return `| ${emotion.padEnd(8)} | ${cells.join(' | ')} |`;
  }).join('\n');

  const totalDone = EMOTIONS.flatMap(e => GEMS.map(g => `${e}_${g}_${LOCATION}.png`))
    .filter(f => fs.existsSync(path.join(CACHE_DIR, f)) || EXISTING_BASELINE.includes(f)).length;

  const report = `# ${LOCATION} 이미지 생성 리포트
생성일: ${now}
모드: ${DRY_RUN ? 'DRY-RUN' : 'REAL'}

## 결과 매트릭스 (25장)

|          | Ruby | Sapphire | Emerald | Diamond | Citrine |
|----------|------|----------|---------|---------|---------|
${rows}

## 통계

- **총 대상:** ${stats.total}
- **생성 완료:** ${stats.generated}
- **스킵:** ${stats.skipped}
- **실패:** ${stats.failed}
- **비용:** $${DRY_RUN ? (stats.generated * COST_PER).toFixed(2) : stats.cost.toFixed(2)}${DRY_RUN ? ' (예상)' : ''}
- **매트릭스 완성도:** ${totalDone}/25장

## 검수 체크리스트 (코미용)

${EMOTIONS.flatMap(emotion => GEMS.map(gem => {
    const filename = `${emotion}_${gem}_${LOCATION}.png`;
    const exists = EXISTING_BASELINE.includes(filename) || fs.existsSync(path.join(CACHE_DIR, filename));
    return `- [${exists ? 'x' : ' '}] ${filename}`;
  })).join('\n')}
`;

  fs.writeFileSync(REPORT_FILE, report, 'utf8');
  console.log(`\n📋 검수 리포트 저장: ${REPORT_FILE}`);
}

main().catch(err => {
  log('ERROR', `예상치 못한 오류: ${err.message}`);
  process.exit(1);
});
