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
const PRINT_PROMPT    = args.includes('--print-prompt');
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

// ====================================================================
// v3.4 SSOT 전체 적용 — 2026-04-29 업그레이드
// 출처: docs/ssot/DreamTown_WishImage_GPT_v3.4_final.md
// ====================================================================

// ── 5감정 매트릭스 (별 상태 + 거리 + 방향 + 시간대 + 분위기 + 의도 + 본질 강제) ──
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

// ── 5보석 톤 (별 색·온도만 변주, 분위기 절대 변경 금지) ──────────────
const GEM_TONES = {
  ruby:     'subtle warm red glow forming gentle halo around the star',
  sapphire: 'deep blue light emphasis with soft diffusion',
  emerald:  'soft green healing tone, very subtle',
  diamond:  'soft white luminance (NOT crystalline sparkle, NOT diamond cut)',
  citrine:  'warm golden glow, used VERY sparingly as a faint warm halo around the star ONLY',
};

// ── 장소별 SCENE 블록 ──────────────────────────────────────────────
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
};

// ── Negative Prompt (v3.4 전체 + 5감정 특화 함정 차단) ───────────
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

★ GEM VARIATION FUNCTION TRAPS (보석 변주 함정 — 가장 중요):
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

// ── 프롬프트 빌더 v3.4 SSOT 전체 적용 ────────────────────────────
function buildPrompt({ emotion, gem, location }) {
  const em     = EMOTION_MATRIX[emotion];
  const gemTone = GEM_TONES[gem];
  const scene  = LOCATION_SCENE[location] || LOCATION_SCENE.yeosu_cablecar;

  if (!em)      throw new Error(`Unknown emotion: ${emotion}`);
  if (!gemTone) throw new Error(`Unknown gem: ${gem}`);

  return `2D watercolor illustration, soft Ghibli-inspired Korean comic style,
warm emotional atmosphere, gentle lighting, soft gradients,
no photorealism, no 3D, no excessive detail,
no text, no letters, no captions, no watermarks.

[SCENE]
${scene}

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
// v3.4 buildPrompt()가 전체 커버하므로 현재 비어 있음
// 특정 조합 수동 보강 필요 시 여기에 추가: { 'anxiety_citrine':  }
const PROMPT_OVERRIDES = {};
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

    // 이미 파일 있으면 SKIP (--force-regenerate 또는 dry+print-prompt 시 진행)
    if (fs.existsSync(filePath)) {
      if (!FORCE_REGEN && !(DRY_RUN && PRINT_PROMPT)) {
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

      if (PRINT_PROMPT) {
        const _overrideKey  = `${emotion}_${gem}`;
        const _promptPreview = PROMPT_OVERRIDES[_overrideKey] || buildPrompt({ emotion, gem, location: LOCATION });
        console.log('\n─────────────────────────────────────────');
        console.log(`PROMPT [${filename}] (${_promptPreview.length}자):`);
        console.log('─────────────────────────────────────────');
        console.log(_promptPreview);
        console.log('─────────────────────────────────────────\n');
      }

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
