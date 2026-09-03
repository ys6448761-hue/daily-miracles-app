#!/usr/bin/env node
'use strict';
/**
 * generate-hamel-world-canvas-v1.js
 * Phase 2 — hamel_lighthouse miracle 전용 world-canvas 1장 생성
 *
 * storybook: 등대 가까이 — 인물 중심, 감정 클로즈업
 * miracle:   등대 외부 — 세계 넓게, 바다+하늘, 인물은 기억처럼
 *
 * 저장: public/images/world-canvas/validation/hamel/hamel_world_canvas_v1.png
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
const OUT_DIR = path.join(ROOT, 'public', 'images', 'world-canvas', 'validation', 'hamel');
const OUT_FILE = path.join(OUT_DIR, 'hamel_world_canvas_v1.png');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function ts() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }).replace(',', '');
}
function log(lv, msg) { console.log(`[${ts()}] ${lv}: ${msg}`); }

// ─────────────────────────────────────────────────────────────
// hamel miracle world-canvas 프롬프트
//
// 원칙: "멋짐보다 기억처럼 남는 공기"
//       "세계가 주인공. 등대는 침묵하는 방향 표시"
//       "사람은 기억처럼 머문다"
// ─────────────────────────────────────────────────────────────
const PROMPT = `2D watercolor night illustration, Korean emotional animation style, Ghibli-inspired hand-painted atmosphere.
NOT photorealistic, NOT 3D, NOT cinematic trailer, NOT tourism poster.

[SCENE — Hamel Lighthouse, Yeosu — wide environmental view at night]
A quiet night. Viewed from a distance, looking across the calm dark sea toward the lighthouse.
Hamel Lighthouse stands quietly at the water's edge — small, weathered, not a monument.
The lighthouse beam sweeps slowly and quietly — a signal in the dark, not a dramatic hero.
The sea stretches wide in the foreground — calm water, soft city light reflections far in the distance.
Stars are quietly present in the upper sky — scattered, unhurried, not a light show.

[COMPOSITION — wide environmental, world is protagonist]
Sky and sea occupy 75% of the frame.
The lighthouse: mid-ground, small, one quiet vertical element against the vast sky.
Character: barely visible tiny silhouette near the lighthouse base or on the rocky shore.
Character position: bottom 7% of frame.
Character size: 5-6% of frame height — the lighthouse and sea are the world, not the person.

[ATMOSPHERE]
The air is breathable. The world is larger than any person.
Color: deep blue-black dominates — no warm drift, no golden glow.
The lighthouse beam: a quiet, cool blue-white sweep — NOT dramatic, NOT a movie beacon.
Water surface: patient reflections of distant city lights — soft dim dots, no bloom.
The sea: dark, calm, vast — it breathes.

[HAND-PAINTED STYLE]
Visible watercolor brush texture — sky washes, soft edges, natural grain.
The lighthouse is painted loosely, not architecturally precise.
Spaces between brushstrokes breathe — emptiness is part of the painting.

[MUST REMAIN]
- Sky and sea are the world — lighthouse is one quiet presence
- Lighthouse beam: direction-giver, not hero
- Deep blue-black color throughout — no warm drift
- Person: witness at the shore — silent, small
- Hand-painted watercolor texture throughout

MUST NOT: dramatic lighthouse spotlight, warm golden bloom, cinematic composition,
lighthouse as the hero subject, HDR lighting, 3D depth, photorealism,
person acting or gesturing, travel poster framing, busy details.

9:16 portrait orientation, mobile.

NEGATIVE: photorealistic, 3D render, text, watermark, logo, dramatic lighting,
warm golden glow, cinematic lens flare, tourism poster, hero framing, multiple people,
large character, close-up face, digital CG feel, excessive particle effects`;

async function main() {
  log('START', `hamel world-canvas miracle | model=${MODEL} | size=${IMAGE_SIZE}`);

  if (DRY_RUN) {
    log('DRY-RUN', 'Would generate: hamel_world_canvas_v1.png');
    log('DRY-RUN', 'PROMPT ↓\n' + PROMPT);
    return;
  }

  if (fs.existsSync(OUT_FILE) && !FORCE) {
    log('SKIP', 'hamel_world_canvas_v1.png already exists. Use --force to regenerate.');
    return;
  }

  log('GENERATE', 'hamel_world_canvas_v1.png');
  const t0 = Date.now();
  try {
    const { OpenAI } = require('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.images.generate({ model: MODEL, prompt: PROMPT, size: IMAGE_SIZE });
    const item = response.data[0];

    let buf;
    if (item.b64_json) {
      buf = Buffer.from(item.b64_json, 'base64');
    } else if (item.url) {
      const lib = item.url.startsWith('https') ? https : http;
      buf = await new Promise((resolve, reject) => {
        lib.get(item.url, res => {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });
    } else {
      throw new Error('b64_json/url 없음');
    }

    fs.writeFileSync(OUT_FILE, buf);
    log('OK', `saved in ${((Date.now()-t0)/1000).toFixed(1)}s — $0.04`);
    log('PATH', `/images/world-canvas/validation/hamel/hamel_world_canvas_v1.png`);
  } catch (err) {
    log('ERROR', err.message);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
