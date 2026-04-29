#!/usr/bin/env node
'use strict';

/**
 * generate-star-images.js — DreamTown 케이블카 25장 자동 생성
 *
 * 사용법:
 *   node scripts/generate-star-images.js --dry-run
 *   node scripts/generate-star-images.js --location=yeosu_cablecar --gem=citrine --limit=5
 *   node scripts/generate-star-images.js --location=yeosu_cablecar --emotion=anxiety --gem=citrine --force-regenerate
 *   node scripts/generate-star-images.js --location=yeosu_cablecar           [승인 후만]
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
const LOCATION        = (args.find(a => a.startsWith('--location='))  || '').replace('--location=',  '') || 'yeosu_cablecar';
const GEM_FILTER      = (args.find(a => a.startsWith('--gem='))       || '').replace('--gem=',       '') || null;
const EMOTION_FILTER  = (args.find(a => a.startsWith('--emotion='))   || '').replace('--emotion=',   '') || null;
const LIMIT           = parseInt((args.find(a => a.startsWith('--limit=')) || '').replace('--limit=', '') || '999', 10);

// ── 환경 설정 ──────────────────────────────────────────────────────
const MODEL       = process.env.DREAMTOWN_IMAGE_MODEL  || 'gpt-image-1';
const IMAGE_SIZE  = process.env.DREAMTOWN_IMAGE_SIZE   || '1024x1536';  // gpt-image-1 지원 최대 세로: 1024x1536
const BATCH_SIZE  = parseInt(process.env.DREAMTOWN_BATCH_SIZE  || '5', 10);
const RETRY_COUNT = parseInt(process.env.DREAMTOWN_RETRY_COUNT || '2', 10);
const MAX_COST    = parseFloat(process.env.DREAMTOWN_MAX_COST  || '5.0');
const COST_PER    = 0.04;  // gpt-image-1 per image (USD, 근사치)

// ── 경로 설정 ──────────────────────────────────────────────────────
const ROOT_DIR    = path.join(__dirname, '..');
const CACHE_BASE  = path.join(ROOT_DIR, 'public', 'images', 'star-cache');
const CACHE_DIR   = path.join(CACHE_BASE, LOCATION);
const LOG_DIR     = path.join(ROOT_DIR, 'logs');
const REPORT_DIR  = path.join(ROOT_DIR, 'reports');
const LOG_FILE    = path.join(LOG_DIR,    'star-images-generation.log');
const REPORT_FILE = path.join(REPORT_DIR, `${LOCATION}-generation-report.md`);

// 디렉토리 자동 생성
[CACHE_BASE, CACHE_DIR, LOG_DIR, REPORT_DIR].forEach(d => {
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

// 기존 5장 (재생성 금지)
const EXISTING_BASELINE = [
  'anxiety_emerald_yeosu_cablecar.png',
  'calm_sapphire_yeosu_cablecar.png',
  'comfort_citrine_yeosu_cablecar.png',
  'hope_diamond_yeosu_cablecar.png',
  'courage_ruby_yeosu_cablecar.png',
];

// ── 감정 SSOT v3.4 ────────────────────────────────────────────────
const EMOTION_KEYWORDS = {
  anxiety: {
    star:        'barely visible far in the distance, almost not yet emerged, faint hint through soft mist',
    atmosphere:  'deep night sky muted blue-green, thin gentle fog, melancholic but never scary, healing silence',
  },
  calm: {
    star:        'small star just being born, gently emerging, soft diffused light',
    atmosphere:  'deep night sky rich blue, very faint horizon afterglow, quiet introspective',
  },
  comfort: {
    star:        'settled star breathing softly, gentle warm glow, peaceful luminance like slow exhale',
    atmosphere:  'twilight just after sunset, restrained orange-pink afterglow, peaceful and embracing',
  },
  hope: {
    star:        'star coming closer, reaching softly, light particles drifting upward',
    atmosphere:  'pre-dawn deep blue to soft lavender, clear uplifting',
  },
  courage: {
    star:        'star about to expand, very soft light trails forming, quiet determination not explosive',
    atmosphere:  'sky just before dawn, warm soft glow rising on horizon, forward movement',
  },
};

// ── 보석 SSOT ─────────────────────────────────────────────────────
const GEM_TONES = {
  ruby:     'subtle warm red glow',
  sapphire: 'deep blue light emphasis',
  emerald:  'soft green healing tone',
  diamond:  'soft white luminance (NOT sparkle)',
  citrine:  'warm golden glow',
};

// ── 장소 씬 (cablecar 고정) ───────────────────────────────────────
const CABLECAR_SCENE =
`View from inside a cable car cabin (interior viewpoint, NOT external/aerial),
visible window frame with cable car handles on both sides,
window framing the Yeosu sea and distant city lights,
a single person seen from behind sitting in the center,
hair tied up neatly in a small bun, facing forward,
person occupies one-third of the lower frame, centered,
9:16 vertical composition.
The lower 20% stays visually calm and uncluttered.`;

// ── Negative Prompt ───────────────────────────────────────────────
const NEGATIVE_PROMPT =
`Avoid: photorealistic, 3D render, hyper detailed, aerial view, exterior view,
landscape only without person, multiple people, mascot, cartoon exaggeration,
commercial travel poster, tourism advertisement, hotel promotion,
gloomy horror, dark fantasy, scary, text, letters, numbers, captions, watermark, logo,
square aspect, landscape orientation,
sharp star rays, cross-shaped beams, overly intense star, completed star,
sharp distinct city lights, defined skyline, crisp mountain edges,
oversaturated, postcard look, travel brochure,
landscape competing with star, weak invisible star,
hair flowing loose, person off-center,
gemstone overpowering emotion, anxiety becoming hopeful,
warmth dominating cold mood, citrine making anxiety bright,
emotion changed by gem color, mood shifted by light temperature.`;

// ── 프롬프트 빌더 (v3.4 SSOT) ─────────────────────────────────────
function buildPrompt({ emotion, gem }) {
  const ek      = EMOTION_KEYWORDS[emotion];
  const gemTone = GEM_TONES[gem];

  return `2D watercolor illustration, soft Ghibli-inspired Korean comic style,
warm emotional atmosphere, gentle lighting, soft gradients,
no photorealism, no 3D, no text, no captions, no watermarks.

${CABLECAR_SCENE}

THE STAR IS THE EMOTIONAL FOCAL POINT,
positioned upper-center directly above the person's head,
distinctly the most luminous element in the frame,
gently glowing — not overly intense, not sharp,
soft and slightly diffused ${gem} light,
${ek.star},
just being born, quiet emergence rather than completed brilliance,
no harsh light beams, no sharp cross-shaped rays,
visual hierarchy: STAR > person > soft background.

Background restraint:
soft glowing warmth not sharp dots,
mountains barely defined,
bridges gently dissolved into atmosphere,
city feels like a memory, visual emptiness allows emotional fullness.

${ek.atmosphere}.

Subtle gemstone lighting accents emanating softly from the star: ${gemTone}.
The gemstone only changes the star's color/temperature,
NOT the emotional atmosphere.

This is the exact moment when a wish is JUST BEGINNING to become a star —
not arrived, but being born now.
Not a beautiful scene — the moment when the heart unwinds.

9:16 vertical aspect ratio, mobile portrait orientation.

${NEGATIVE_PROMPT}`;
}

// ── 커스텀 프롬프트 오버라이드 (코미 검수 후 보강 버전) ─────────────
// 키: `${emotion}_${gem}` / 값: 직접 지정 프롬프트 (buildPrompt 대체)
const PROMPT_OVERRIDES = {

  'anxiety_citrine': `2D watercolor illustration, soft Ghibli-inspired Korean comic style,
warm emotional atmosphere, gentle lighting, soft gradients,
no photorealism, no 3D, no text, no captions, no watermarks.

[SCENE]
View from inside a cable car cabin (interior, NOT external/aerial),
visible window frame with cable car handles on both sides,
window framing the Yeosu night sea wrapped in soft mist,
a single person seen from behind sitting in the center,
hair tied up neatly in a small bun, facing forward,
person occupies one-third of the lower frame, centered,
9:16 vertical composition.
The lower 20% stays visually calm and uncluttered.

[STAR — soft 4-pointed]
THE STAR IS THE EMOTIONAL FOCAL POINT,
positioned upper-center directly above the person's head,
a soft 4-pointed star (gentle cross shape, NOT sharp rays, NOT 8-pointed),
distinctly the most luminous element,
a star barely visible far in the distance, almost not yet emerged,
faint hint of light through soft mist,
gently glowing — not overly intense, not sharp,
soft and slightly diffused warm golden citrine light,
a wish has not yet found its form,
quiet emergence rather than completed brilliance,
no harsh light beams, no sharp cross-shaped rays,
visual hierarchy: STAR (faint) > person > misty background.

[CRITICAL — anxiety must remain anxiety]
The atmosphere MUST stay heavy, melancholic, weighted,
darkness and mist MUST dominate the scene,
warmth is ONLY a faint undertone in the star itself,
the city, sky, and air must NOT become warm,
this is anxiety with a tiny golden hint, NOT calm or hope.

[BACKGROUND RESTRAINT — strong]
Distant city lights MUST be soft glowing warmth, NOT sharp distinct dots,
mountains barely defined, almost dissolved into mist,
distant bridges gently dissolved into atmosphere,
city feels like a memory rather than a clear view,
fog must drift across the city, softening all details,
visual emptiness allows emotional fullness.

[ATMOSPHERE]
Deep night sky in muted dark blue with thin gentle fog,
melancholic but never scary, healing silence rather than oppressive,
the heavy quiet just before "it will be okay",
distant lights blurred and dim (very subtle warm undertone, kept very dim),
calm sea reflecting the dim night.

[GEM — Citrine as faint star tone only]
Subtle gemstone lighting from the star ONLY: warm golden citrine glow,
used VERY sparingly as a faint warm halo around the star,
the warmth must NOT spread to the city, sky, or atmosphere,
just a quiet golden whisper inside the anxiety.

[INTENT]
The exact moment when a wish is JUST BEGINNING to become a star,
even in mist, this is the beginning of light,
just with a faint warm hue inside the heaviness.

9:16 vertical aspect ratio, mobile portrait orientation.

NEGATIVE:
photorealistic, 3D render, hyper detailed, aerial view, exterior view,
horror, dark fantasy, scary, oppressive, depressing, lifeless,
landscape only without person, multiple people, mascot,
commercial travel poster, tourism, hotel promotion,
text, letters, numbers, captions, watermark, logo,
square aspect, landscape orientation,
sharp star rays, 8-pointed star, cross-shaped beams,
overly intense star, completed star, fully formed star,
sharp distinct city lights, clear bright dots, defined skyline,
crisp mountain edges, oversaturated colors,
landscape competing with star, postcard look, scenic photograph,
hair flowing loose, person off-center,
warmth dominating cold mood, golden glow spreading to city or sky,
becoming hopeful or peaceful, becoming calm or comfort atmosphere,
city lights becoming warm dots, sky becoming warm,
oversaturated golden tone, the heaviness disappearing,
emotion changed by gem temperature, mist disappearing,
clear visibility, sunset or sunrise vibe`,

  'hope_citrine': `2D watercolor illustration, soft Ghibli-inspired Korean comic style,
warm emotional atmosphere, gentle lighting, soft gradients,
no photorealism, no 3D, no text, no captions, no watermarks.

[SCENE]
View from inside a cable car cabin (interior, NOT external/aerial),
visible window frame with cable car handles on both sides,
window framing the Yeosu sea at pre-dawn,
a single person seen from behind sitting in the center,
hair tied up neatly in a small bun, facing forward,
person occupies one-third of the lower frame, centered,
9:16 vertical composition.
The lower 20% stays visually calm and uncluttered.

[STAR — soft 4-pointed, approaching]
THE STAR IS THE EMOTIONAL FOCAL POINT,
positioned upper-center directly above the person's head,
a soft 4-pointed star (gentle cross shape, NOT 8-pointed, NOT explosive rays),
distinctly the most luminous element,
a star coming closer to the viewer, reaching softly,
slightly brighter and clearer than calm but still gentle,
gently glowing — not overly intense, not sharp,
soft and slightly diffused warm golden citrine light,
a star just being born, still in emergence,
soft glowing light particles drifting upward from the star,
sense of gentle rising and approaching possibility,
no harsh light beams, no aggressive expansion,
visual hierarchy: STAR (primary, approaching) > person > soft background.

[CRITICAL — hope must remain hope, NOT courage]
This is "the moment of being pulled upward",
the star is APPROACHING but has NOT ARRIVED,
NOT a sun, NOT a sunrise, NOT a completed brilliance,
the star must NOT dominate the entire sky,
the horizon must NOT compete with the star,
this is hope (anticipation), NOT courage (decision/action).

[BACKGROUND RESTRAINT — strong]
Distant city lights soft glowing warmth, NOT sharp distinct dots,
soften background details — mountains barely defined,
distant bridges gently dissolved into atmosphere,
city feels like a memory, visual emptiness allows emotional fullness,
the horizon glow MUST be subtle, supporting the star not competing.

[ATMOSPHERE]
Pre-dawn sky transitioning from deep blue-purple to soft lavender,
clear and uplifting atmosphere with sense of lightness rising,
the sky is brighter than night but NOT yet dawn,
soft glowing particles drifting gently upward — sense of "being pulled up",
distant city lights softly fading as morning approaches (kept dim).

[GEM — Citrine as approaching star tone]
Subtle gemstone lighting from the star: warm golden citrine glow,
the warm tone is in the star and its immediate halo,
not in the sky, not in the city,
just the gentle warmth of approaching possibility.

[INTENT]
The exact moment when a wish is JUST BEGINNING to become a star —
not arrived, but approaching right now,
this is "the moment of being pulled upward".

9:16 vertical aspect ratio, mobile portrait orientation.

NEGATIVE:
photorealistic, 3D render, hyper detailed, aerial view, exterior view,
landscape only without person, multiple people, mascot,
commercial travel poster, tourism, hotel promotion,
text, letters, numbers, captions, watermark, logo,
square aspect, landscape orientation,
sharp star rays, 8-pointed star, cross-shaped beams,
overly intense star, completed star, fully formed star, explosive light,
sharp distinct city lights, oversaturated colors,
landscape competing with star, postcard look, travel brochure,
weak invisible star, hair flowing loose, person off-center,
hope becoming courage, hope becoming sunrise, star becoming a sun,
horizon dominating the sky, golden flood overpowering composition,
explosive light from star, 8-pointed sharp star,
sky already fully bright, already arrived feeling,
completed transformation, dramatic flare,
warmth dominating coolness of pre-dawn, sunset vibe, heroic atmosphere`,

};

// ── 백업 함수 ─────────────────────────────────────────────────────
function backupIfExists(filePath, cacheDir) {
  if (!fs.existsSync(filePath)) return;
  const backupDir = path.join(cacheDir, '_backup_v1');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const dest = path.join(backupDir, path.basename(filePath));
  fs.copyFileSync(filePath, dest);
  return dest;
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

  // gpt-image-1: b64_json 반환
  if (item.b64_json) {
    return { type: 'b64', data: Buffer.from(item.b64_json, 'base64') };
  }
  // fallback: URL 반환 (dall-e-3)
  if (item.url) {
    return { type: 'url', data: item.url };
  }
  throw new Error('응답에 b64_json/url 없음');
}

// ── URL → Buffer 다운로드 ─────────────────────────────────────────
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

// ── 대기 ─────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── 메인 ─────────────────────────────────────────────────────────
async function main() {
  if (!process.env.OPENAI_API_KEY && !DRY_RUN) {
    console.error('❌ OPENAI_API_KEY 없음. .env 설정 필요.');
    process.exit(1);
  }

  // 전체 25장 조합 목록 구성
  const all = [];
  for (const emotion of EMOTIONS) {
    for (const gem of GEMS) {
      all.push({ emotion, gem });
    }
  }

  // 필터 적용 (--emotion, --gem, --limit)
  let targets = all;
  if (EMOTION_FILTER) targets = targets.filter(t => t.emotion === EMOTION_FILTER);
  if (GEM_FILTER)     targets = targets.filter(t => t.gem     === GEM_FILTER);
  targets = targets.slice(0, LIMIT);

  // 통계
  const stats = { total: 0, generated: 0, skipped: 0, failed: 0, cost: 0 };

  log('START', `${LOCATION} 이미지 생성 시작 | dry=${DRY_RUN} | gem=${GEM_FILTER || 'ALL'} | limit=${LIMIT}`);

  for (const { emotion, gem } of targets) {
    const filename = `${emotion}_${gem}_${LOCATION}.png`;
    const filePath = path.join(CACHE_DIR, filename);

    stats.total++;

    // 기존 5장 SKIP
    if (EXISTING_BASELINE.includes(filename)) {
      log('SKIP', `${filename} (baseline — 재생성 금지)`);
      stats.skipped++;
      continue;
    }

    // 이미 파일 있으면 SKIP (--force-regenerate 시 백업 후 진행)
    if (fs.existsSync(filePath)) {
      if (!FORCE_REGEN) {
        log('SKIP', `${filename} (already exists)`);
        stats.skipped++;
        continue;
      }
      // --force-regenerate: 백업 후 덮어쓰기
      backupIfExists(filePath, CACHE_DIR);
      log('BACKUP', `${filename} → _backup_v1/${path.basename(filePath)}`);
    }

    // DRY-RUN
    if (DRY_RUN) {
      const action = FORCE_REGEN ? 'Would force-regenerate' : 'Would generate';
      log('DRY-RUN', `${action}: ${filename}`);
      stats.generated++;  // dry-run에서는 "예정"으로 카운트
      continue;
    }

    // 비용 한도 체크
    if (stats.cost + COST_PER > MAX_COST) {
      log('ERROR', `비용 한도 초과 ($${MAX_COST}). 중단.`);
      break;
    }

    // 이미지 생성 (재시도) — 오버라이드 프롬프트 우선 사용
    const overrideKey = `${emotion}_${gem}`;
    const prompt = PROMPT_OVERRIDES[overrideKey] || buildPrompt({ emotion, gem, location: LOCATION });
    if (PROMPT_OVERRIDES[overrideKey]) log('OVERRIDE', `${filename} (보강 프롬프트 적용)`);
    let   success = false;
    const genStart = Date.now();

    for (let attempt = 0; attempt < RETRY_COUNT; attempt++) {
      try {
        log('GENERATE', `${filename} (시도 ${attempt + 1}/${RETRY_COUNT})`);
        const result = await generateImage(prompt);

        let buf;
        if (result.type === 'b64') {
          buf = result.data;
        } else {
          buf = await downloadUrl(result.data);
        }

        fs.writeFileSync(filePath, buf);
        const elapsed = ((Date.now() - genStart) / 1000).toFixed(1);
        log('SUCCESS', `${filename} (${elapsed}s)`);
        stats.generated++;
        stats.cost += COST_PER;
        success = true;
        break;
      } catch (err) {
        log('RETRY', `${filename} attempt ${attempt + 1} 실패: ${err.message}`);
        if (attempt < RETRY_COUNT - 1) await sleep(3000);
      }
    }

    if (!success) {
      log('FAIL', `${filename} — 최대 재시도 초과`);
      stats.failed++;
    }

    // Rate limit 대응
    await sleep(1000);
  }

  // ── 요약 로그 ────────────────────────────────────────────────────
  const estimatedCost = DRY_RUN ? (stats.generated * COST_PER).toFixed(2) : stats.cost.toFixed(2);
  const summary = [
    `SUMMARY:`,
    `  Total: ${stats.total}`,
    `  Generated: ${stats.generated}${DRY_RUN ? ' (planned)' : ''}`,
    `  Skipped: ${stats.skipped}`,
    `  Failed: ${stats.failed}`,
    `  Cost: $${estimatedCost}${DRY_RUN ? ' (estimated)' : ''}`,
  ].join('\n  ');
  log('SUMMARY', '\n  ' + summary.replace('SUMMARY:\n  ', ''));

  // ── 검수 리포트 생성 ──────────────────────────────────────────────
  generateReport(stats, targets);

  // 종료 코드
  process.exit(stats.failed > 0 ? 1 : 0);
}

// ── 검수 리포트 생성 ──────────────────────────────────────────────
function generateReport(stats, targets) {
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

  const totalDone   = EMOTIONS.flatMap(e => GEMS.map(g => `${e}_${g}_${LOCATION}.png`))
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
