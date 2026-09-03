#!/usr/bin/env node
'use strict';
/**
 * generate-hamel-validation.js
 * Phase 2 — Hamel Lighthouse Emotion Candidate 5장 검증 생성
 *
 * SSOT: docs/ssot/dreamtown/DreamTown_Emotion_Grammar_v1.md
 * 장소 특성: 실내+실외, 수면, 물빛, 방향/기다림/신호
 *
 * 사용법:
 *   node scripts/generate-hamel-validation.js --dry-run
 *   node scripts/generate-hamel-validation.js
 *   node scripts/generate-hamel-validation.js --emotion=confusion
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const args         = process.argv.slice(2);
const DRY_RUN      = args.includes('--dry-run');
const EMOTION_ONLY = (args.find(a => a.startsWith('--emotion=')) || '').replace('--emotion=', '') || null;

const MODEL      = process.env.DREAMTOWN_IMAGE_MODEL || 'gpt-image-1';
const IMAGE_SIZE = '1024x1536';
const COST_PER   = 0.04;

const ROOT    = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'world-canvas', 'validation', 'hamel');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function ts() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }).replace(',', '');
}
function log(lv, msg) { console.log(`[${ts()}] ${lv}: ${msg}`); }

// ─────────────────────────────────────────────────────────────
// Hamel Lighthouse 공통 씬 베이스
//
// hamel_lighthouse 핵심:
//   방향 / 기다림 / 신호 / 멀리 보이는 빛 / 혼자가 아닌 느낌
//   관광지 느낌 ❌ / DreamTown navigation symbol ⭕
// ─────────────────────────────────────────────────────────────
const SCENE_BASE =
`2D watercolor illustration, soft Ghibli-inspired Korean emotional animation style.
No photorealism, no 3D, no text, no letters, no watermark.
No dramatic cinematic framing, no lens flare, no warm golden drift.
No tourism poster, no travel advertisement aesthetic.

[PLACE — hamel_lighthouse, Yeosu]
At a historic stone lighthouse by the Yeosu sea — quiet, weathered, not decorative.
Iron railing or stone window arch visible — the structure grounds the person.
A view of the Yeosu night sea through the railing or window frame.
A single person seen from behind — hair tied, watching the sea in quiet.
The lighthouse is not a hero — it is a companion. A direction-giver.
The lower 20% of the frame stays visually calm.`;

const NEGATIVE_BASE =
`photorealistic, 3D render, HDR lighting, movie poster composition,
tourist attraction signage, tourism brochure feel, travel advertisement,
multiple people, mascot, cartoon exaggeration, dramatic lens flare,
excessive warm golden glow, lighthouse as dramatic focal hero,
person turning around, facial expression, gesture, lip motion,
text, letters, watermark, logo, tiktok motion, dramatic action`;

// ─────────────────────────────────────────────────────────────
// 감정별 프롬프트 (Emotion Grammar v1 + hamel 장소 감정)
// ─────────────────────────────────────────────────────────────
const EMOTION_SPECS = {

  confusion: {
    label_ko:    '혼란',
    distance:    'medium',
    motion_safe: true,
    composition: 'Standard centered — person at railing, centered, lower third of frame.',
    emotion_prompt:
`[EMOTION — confusion: 방향이 불분명한 공기]
Heavy fog rolls over the dark sea. The lighthouse beam is barely visible — a faint sweep through mist.
The sea and sky merge into the same heavy grey-blue fog — no clear horizon line.
The direction is unclear. The light sweeps but gives no certainty.
The person presses close to the iron railing, facing into fog and darkness.

Star: NOT visible — only fog, and the faint memory that a light might exist somewhere.
Light: directionless diffusion, the lighthouse beam muffled by heavy mist, no sharp beam.
Color: deep grey-blue, low saturation, heavy muted atmosphere.
Air: thick, quiet, directionless — the fog absorbs everything.

MUST NOT: lighthouse beam as dramatic hero, any sense of clarity, warm tones, resolution.
MUST NOT: stars visible, clear horizon, hopeful brightness.`,
  },

  pause: {
    label_ko:    '멈춤',
    distance:    'medium',
    motion_safe: true,
    composition: 'Standard centered — person at railing, completely still, lower third of frame.',
    emotion_prompt:
`[EMOTION — pause: 조용히 멈춘 파도]
The sea has stilled. The waves are barely moving — a held breath of water.
The lighthouse beam makes one slow, quiet sweep — unhurried, mechanical, patient.
A very faint point of light is barely visible far out at sea — not a star yet, just a suggestion.
The person stands completely still at the railing, watching. Nothing is about to happen yet.

Star/light: the faintest hint at the far horizon — not glowing, not calling, just existing.
Light: low, stable, the lighthouse rhythm quiet and steady.
Color: deep dark blue — cool, still, rich.
Air: complete quiet. The world is holding its breath.

MUST NOT: any energy rising, hopeful warmth, lighthouse beam as spotlight, momentum.`,
  },

  calm: {
    label_ko:    '고요함',
    distance:    'medium',
    motion_safe: true,
    composition: 'Standard centered — person at railing or window frame, settled, lower third of frame.',
    emotion_prompt:
`[EMOTION — calm: 안정된 수면 반사]
The sea surface is steady and undisturbed — water reflecting the lighthouse beam softly.
The lighthouse beam turns with a quiet, unhurried rhythm — a reliable pulse.
A star is quietly emerging in the upper sky — soft, just beginning, not yet completed.
The person is settled — not searching, not waiting urgently. This moment is enough.

Star: softly emerging in the upper distance — quiet birth, not dramatic.
Light: the lighthouse beam creates a gentle path on calm water — soft, not a dramatic streak.
Color: deep night blue, balanced — not warm, not cold.
Air: clear and still, like a held exhale.

MUST NOT: hope rising, warmth entering, arrival feeling, comfort wrapping.
MUST NOT: calm is 'just before anything begins' — not 'arrived and safe'.`,
  },

  curiosity: {
    label_ko:    '호기심',
    distance:    'wide',
    motion_safe: true,
    composition: 'Person lower — person occupies lower fifth of frame. More open sky and sea horizon visible.',
    emotion_prompt:
`[EMOTION — curiosity: 저기는 어떤 곳일까]
The person is lower in the frame — the horizon opens wide above and ahead.
The lighthouse stands quietly behind or beside — pointing outward, not inward.
Far at the horizon, there is a faint glow approaching — not a formed star, a sense of something coming closer.
The sky opens — a wide quiet question, not an answer.
The lighthouse beam traces a path across the water toward the distant glow.

Star/light: approaching from far at the horizon — a soft uncertain glow, NOT arrived, NOT formed.
Color: deep blue, with the softest hint of lavender at the very edge of the horizon — barely there.
Air: slightly lighter than calm — a gentle opening, a forward-leaning.

MUST NOT: formed star, arrival feeling, lighthouse as dramatic hero, certainty, golden drift.
MUST NOT: curiosity is still searching, still leaning forward, still a question.`,
  },

  fragile_hope: {
    label_ko:    '연약한 희망',
    distance:    'detail',
    motion_safe: true,
    composition: 'Close detail view — railing or window frame takes more of the frame. Person quietly in lower portion.',
    emotion_prompt:
`[EMOTION — fragile_hope: 작은 빛이 꺼지지 않고 있다]
A closer, more intimate view — near the lighthouse railing or the stone window arch.
At the edge of the sea horizon: the faintest pre-dawn lightening — barely distinguishable from deep night.
The lighthouse beam traces a soft, quiet path on the water — continuing, persisting.
A star almost formed somewhere above — almost there, but still becoming, not yet arrived.
The person is small and quiet in the lower portion — watching this fragile persistence.

Star: almost formed at the top — forming, still in process, carefully not yet complete.
Light: the lighthouse beam as a whisper of direction — soft traces, not a beacon shout.
Color: pre-dawn sky at the horizon — deepest lavender meeting deep blue. The faintest boundary.
Air: lavender, fragile, quiet upward feeling.

MUST NOT: star arriving or completing, sunrise breaking through, warmth flooding the scene.
MUST NOT: 'it worked' feeling, explosive brightness, certainty, 'lighthouse saved me' feeling.`,
  },
};

// ─────────────────────────────────────────────────────────────
function buildPrompt(emotionId) {
  const spec = EMOTION_SPECS[emotionId];
  return `${SCENE_BASE}

[COMPOSITION — ${spec.distance}]
${spec.composition}

${spec.emotion_prompt}

[PRESENCE RULE]
The world breathes. The person remains like a memory.
Sea, sky, lighthouse light breathe. The person does NOT act.
No acting, no gesture, no gaze shift, no emotional performance.
Only the air passes through.

9:16 vertical composition, mobile portrait orientation.

NEGATIVE: ${NEGATIVE_BASE}`;
}

function writeTag(emotionId, imagePath) {
  const spec = EMOTION_SPECS[emotionId];
  const tag = {
    place:       'hamel_lighthouse',
    emotion:     emotionId,
    emotion_ko:  spec.label_ko,
    purpose:     'validation',
    distance:    spec.distance,
    motion_safe: spec.motion_safe,
    phase:       'phase_2',
    generated_at: new Date().toISOString(),
    image:       path.basename(imagePath),
    ssot_ref:    'docs/ssot/dreamtown/DreamTown_Emotion_Grammar_v1.md',
  };
  const tagPath = imagePath.replace('.png', '.tag.json');
  fs.writeFileSync(tagPath, JSON.stringify(tag, null, 2), 'utf8');
  return tagPath;
}

async function generateImage(prompt) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.images.generate({ model: MODEL, prompt, size: IMAGE_SIZE });
  const item = response.data[0];
  if (item.b64_json) return { type: 'b64', data: Buffer.from(item.b64_json, 'base64') };
  if (item.url)      return { type: 'url', data: item.url };
  throw new Error('b64_json/url 없음');
}

function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const emotions = EMOTION_ONLY ? [EMOTION_ONLY] : Object.keys(EMOTION_SPECS);
  log('START', `hamel validation | emotions: ${emotions.join(', ')} | dry-run: ${DRY_RUN}`);

  let totalCost = 0;
  for (const eid of emotions) {
    if (!EMOTION_SPECS[eid]) { log('ERROR', `Unknown emotion: ${eid}`); continue; }

    const filename = `hamel_${eid}_v1.png`;
    const outPath  = path.join(OUT_DIR, filename);
    const prompt   = buildPrompt(eid);

    if (DRY_RUN) {
      log('DRY-RUN', `Would generate: ${filename}`);
      log('DRY-RUN', 'PROMPT ↓\n' + prompt.substring(0, 400) + '…');
      continue;
    }

    log('GENERATE', `${filename} (emotion: ${eid})`);
    const t0 = Date.now();
    try {
      const result = await generateImage(prompt);
      const buf = result.type === 'b64' ? result.data : await downloadUrl(result.data);
      fs.writeFileSync(outPath, buf);
      totalCost += COST_PER;
      writeTag(eid, outPath);
      log('OK', `${filename} (${((Date.now()-t0)/1000).toFixed(1)}s) — $${totalCost.toFixed(2)} total`);
    } catch (err) {
      log('ERROR', `${filename} failed: ${err.message}`);
    }
  }

  log('DONE', `emotions: ${emotions.length} | cost: $${totalCost.toFixed(2)}`);
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
} else {
  module.exports = { buildPrompt, EMOTION_SPECS };
}
