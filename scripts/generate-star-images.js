#!/usr/bin/env node
'use strict';

/**
 * generate-star-images.js — DreamTown 케이블카 25장 자동 생성
 *
 * 사용법:
 *   node scripts/generate-star-images.js --dry-run
 *   node scripts/generate-star-images.js --location=yeosu_cablecar --gem=citrine --limit=5
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
const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const LOCATION = (args.find(a => a.startsWith('--location=')) || '').replace('--location=', '') || 'yeosu_cablecar';
const GEM_FILTER = (args.find(a => a.startsWith('--gem=')) || '').replace('--gem=', '') || null;
const LIMIT    = parseInt((args.find(a => a.startsWith('--limit=')) || '').replace('--limit=', '') || '999', 10);

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

  // 필터 적용 (--gem, --limit)
  let targets = all;
  if (GEM_FILTER) targets = targets.filter(t => t.gem === GEM_FILTER);
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

    // 이미 파일 있으면 SKIP
    if (fs.existsSync(filePath)) {
      log('SKIP', `${filename} (already exists)`);
      stats.skipped++;
      continue;
    }

    // DRY-RUN
    if (DRY_RUN) {
      log('DRY-RUN', `Would generate: ${filename}`);
      stats.generated++;  // dry-run에서는 "예정"으로 카운트
      continue;
    }

    // 비용 한도 체크
    if (stats.cost + COST_PER > MAX_COST) {
      log('ERROR', `비용 한도 초과 ($${MAX_COST}). 중단.`);
      break;
    }

    // 이미지 생성 (재시도)
    const prompt = buildPrompt({ emotion, gem, location: LOCATION });
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
