#!/usr/bin/env node
'use strict';
/**
 * generate-cablecar-world-canvas-v1.js
 * Phase 0 — cablecar miracle 전용 world-canvas 1장 생성
 *
 * storybook: 케이블카 내부, 인물 중심, 감정 클로즈업
 * miracle:   케이블카 외부/항구, 세계 중심, 인물은 기억처럼
 *
 * 저장: public/images/world-canvas/validation/cablecar/cablecar_world_canvas_v1.png
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE   = args.includes('--force');

const MODEL      = process.env.DREAMTOWN_IMAGE_MODEL || 'gpt-image-1';
const IMAGE_SIZE = '1024x1536';

const ROOT    = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'world-canvas', 'validation', 'cablecar');
const OUT_FILE = path.join(OUT_DIR, 'cablecar_world_canvas_v1.png');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function ts() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }).replace(',', '');
}
function log(lv, msg) { console.log(`[${ts()}] ${lv}: ${msg}`); }

// ─────────────────────────────────────────────────────────────
// miracle world-canvas 프롬프트
//
// 원칙:
//   "멋짐보다 기억처럼 남는 공기"
//   "세계가 숨 쉬지만 사람은 기억처럼 머문다"
//   storybook: 케이블카 내부 — 인물 가까이
//   miracle:   케이블카 외부 — 세계 넓게
// ─────────────────────────────────────────────────────────────
const PROMPT = `2D watercolor night illustration, Korean emotional animation style, Ghibli-inspired hand-painted atmosphere.
NOT photorealistic, NOT 3D, NOT cinematic trailer, NOT travel poster.

[SCENE — cablecar from outside, Yeosu harbor at night]
A quiet night. Viewed from the harbor shore, looking upward and outward across the water.
The cable car line stretches gently across the deep blue-black sky — a thin, quiet thread in the air.
One small cable car cabin floats in the mid-distance along the wire — very small, like a breath held.
The harbor water below reflects scattered city lights — soft dots, unhurried, no bloom.
Stars are quietly present in the upper sky — not a dramatic show, just existing.

[COMPOSITION — wide environmental, world is protagonist]
Sky and harbor water occupy 75% of the frame.
The cable line crosses the middle third of the frame — quietly, NOT as a dramatic hero subject.
Character: barely visible tiny silhouette standing at the shore edge, facing outward toward the sea.
Character position: bottom 6% of frame, slightly off-center left.
Character size: 5% of frame height — the world is the protagonist, not the person.

[ATMOSPHERE]
The air is breathable. The world is larger than any person.
Color: deep blue-black dominates — no warm drift, no golden miracle tone.
City lights on the distant horizon: soft dim white and cool amber dots, quiet, NOT glowing bloom.
Water surface: steady patient reflections — not dramatic, not rippling, just resting.
The cable car cabin: small, still, a quiet object in vast sky — NOT a hero, NOT a focal point.

[HAND-PAINTED STYLE]
Visible watercolor brush texture — sky washes, soft edges, natural grain.
No sharp contours, no hard digital lines.
The painting breathes — spaces between brushstrokes matter.

[MUST REMAIN]
- Sky and sea are the world — wide open, breathable
- Cablecar line: quiet thread across sky, NOT dramatic centerpiece
- Deep blue-black color dominates throughout
- Person: witness, not performer — silent presence
- Hand-painted watercolor feel throughout

MUST NOT: dramatic lens flare, golden warm bloom, movie poster framing, cable car as hero,
HDR lighting, 3D depth field, photorealism, complex busy details, person acting or gesturing,
viewer-directed gaze, warm drift, cinematic composition directing the eye.

9:16 portrait orientation, mobile.

NEGATIVE: photorealistic, 3D render, text, watermark, logo, dramatic lighting, warm golden glow,
cinematic lens flare, travel advertisement, tourism poster, hero composition, multiple people,
large character, close-up face, busy background, excessive particles, digital CG feel`;

async function generateImage(prompt) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.images.generate({ model: MODEL, prompt, size: IMAGE_SIZE });
  const item = response.data[0];
  if (item.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item.url) {
    const lib = item.url.startsWith('https') ? https : http;
    return new Promise((resolve, reject) => {
      lib.get(item.url, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    });
  }
  throw new Error('b64_json/url 없음');
}

async function main() {
  log('START', `cablecar world-canvas miracle | model=${MODEL} | size=${IMAGE_SIZE}`);

  if (DRY_RUN) {
    log('DRY-RUN', 'Would generate: cablecar_world_canvas_v1.png');
    log('DRY-RUN', 'PROMPT ↓\n' + PROMPT);
    return;
  }

  if (fs.existsSync(OUT_FILE) && !FORCE) {
    log('SKIP', 'cablecar_world_canvas_v1.png already exists. Use --force to regenerate.');
    return;
  }

  log('GENERATE', 'cablecar_world_canvas_v1.png');
  const t0 = Date.now();
  try {
    const buf = await generateImage(PROMPT);
    fs.writeFileSync(OUT_FILE, buf);
    log('OK', `saved in ${((Date.now()-t0)/1000).toFixed(1)}s — $0.04`);
    log('PATH', `/images/world-canvas/validation/cablecar/cablecar_world_canvas_v1.png`);
  } catch (err) {
    log('ERROR', err.message);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
