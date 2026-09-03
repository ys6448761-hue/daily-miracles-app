#!/usr/bin/env node
'use strict';
/**
 * generate-cablecar-validation.js
 * Phase 0 — Cablecar Emotion Candidate 5장 검증 생성
 *
 * SSOT: docs/ssot/dreamtown/DreamTown_Emotion_Grammar_v1.md
 *
 * 사용법:
 *   node scripts/generate-cablecar-validation.js --dry-run
 *   node scripts/generate-cablecar-validation.js
 *   node scripts/generate-cablecar-validation.js --emotion=confusion
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

const ROOT     = path.join(__dirname, '..');
const OUT_DIR  = path.join(ROOT, 'public', 'images', 'world-canvas', 'validation', 'cablecar');
const RPT_DIR  = path.join(ROOT, 'reports');
[OUT_DIR, RPT_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

function ts() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }).replace(',', '');
}
function log(lv, msg) { console.log(`[${ts()}] ${lv}: ${msg}`); }

// ─────────────────────────────────────────────────────────────
// Cablecar 공통 씬 베이스 (Presence Rule v1 + Emotion Grammar v1 기반)
// ─────────────────────────────────────────────────────────────
const SCENE_BASE =
`2D watercolor illustration, soft Ghibli-inspired Korean emotional animation style.
No photorealism, no 3D, no text, no letters, no watermark.
No sharp city lights, no tourism poster aesthetic.

[PLACE — cablecar interior]
Interior viewpoint — NOT external, NOT aerial.
Visible cable car window frame with handles on both sides.
Window framing the Yeosu night sea and distant city.
A single person seen from behind, hair tied in a small bun, facing the window.
The lower 20% stays visually calm and uncluttered.`;

const NEGATIVE_BASE =
`photorealistic, 3D render, aerial view, external cable car view,
multiple people, mascot, cartoon exaggeration, tourism poster,
text, letters, watermark, logo, signature,
lens flare, excessive particles, VFX overload,
person turning around, facial expression, gesture, lip motion,
dramatic action, viewer-directed motion, tiktok motion`;

// ─────────────────────────────────────────────────────────────
// 감정별 프롬프트 (Emotion Grammar v1 직접 번역)
// ─────────────────────────────────────────────────────────────
const EMOTION_SPECS = {

  confusion: {
    label_ko:    '혼란',
    distance:    'medium',
    motion_safe: true,
    composition: 'Standard centered — person centered, occupies one-third of lower frame.',
    emotion_prompt:
`[EMOTION — confusion: 무엇인지 모르겠는 무게]
The window glass is slightly fogged — city lights barely visible through soft haze.
The reflection in the glass is blurred and uncertain.
Star: NOT visible — only fog and the vague sense that something is beyond.
Light: directionless diffusion, no clear source, no shadows.
Color: muted deep blue-gray, low saturation, heavy atmosphere.
Air: thick, quiet, heavy.
The moment of searching through fog.

MUST NOT: any brightening, hopeful light, clear visibility, warm tones, sign of resolution.`,
  },

  pause: {
    label_ko:    '멈춤',
    distance:    'medium',
    motion_safe: true,
    composition: 'Standard centered — person centered, completely still, occupies one-third of lower frame.',
    emotion_prompt:
`[EMOTION — pause: 숨을 고르는 중]
Everything is stopped. The cable car feels completely still.
A very tiny star is just barely visible at the very top of the frame —
  a quiet presence, not glowing, not calling — just existing.
Light: low, stable, settled — no movement.
Color: deep dark blue, rich and still.
Air: complete quiet. The world is holding its breath.
The person is perfectly still. Nothing is about to happen yet.

MUST NOT: any energy rising, hopeful light, momentum, sense of beginning.`,
  },

  calm: {
    label_ko:    '고요함',
    distance:    'medium',
    motion_safe: true,
    composition: 'Standard centered — person centered, occupies one-third of lower frame.',
    emotion_prompt:
`[EMOTION — calm: 이 순간이 충분함]
The window shows calm Yeosu sea — water with soft, gentle undisturbed reflections.
A star is quietly being born in the upper distance — very soft, just emerging, not yet arrived.
Light: balanced, neutral deep night blue — not warm, not cold.
Color: deep night blue, rich and settled without heaviness.
Air: clear and still, like a held exhale.
The calm reflection on the water is steady and undisturbed.

MUST NOT: hope rising, warmth entering, comfort wrapping around.
MUST NOT: a feeling of arrival — calm is 'just before anything begins.'`,
  },

  curiosity: {
    label_ko:    '호기심',
    distance:    'wide',
    motion_safe: true,
    composition: 'Person lower — person occupies lower quarter of frame. More open night sky visible through the window above.',
    emotion_prompt:
`[EMOTION — curiosity: 무언가가 올 것 같은 감정]
The person is smaller, settled in the lower quarter — the sky opens wide above.
Somewhere far above, something is moving closer — not a star yet, a distant uncertain glow.
A soft, unfocused shimmer in the upper sky: NOT a formed shape, NOT a pointed star.
Only a faint presence of light — as if something is approaching from very far away.
The sky feels slightly opened: a question forming, not an answer arriving.
Curiosity is forward-looking, not fulfilled. The feeling of leaning toward something unknown.

Color: deep blue, with only the faintest possible edge of lavender at the very top — barely there.
Light: diffuse, distant, directionless — no golden tones, no warm drift, no corona.
Air: slightly lighter than calm — an almost-imperceptible opening sensation.

MUST NOT: a formed 4-pointed star shape.
MUST NOT: sharp light beams, cross beams, or star corona.
MUST NOT: golden, amber, or warm miracle tones anywhere in the frame.
MUST NOT: the feeling that something has arrived or been confirmed.
MUST NOT: completed hope — curiosity is still searching, still leaning forward.`,
  },

  fragile_hope: {
    label_ko:    '연약한 희망',
    distance:    'detail',
    motion_safe: true,
    composition: 'Close detail view — window and its light take more of the frame. Person quietly in lower portion.',
    emotion_prompt:
`[EMOTION — fragile_hope: 믿고 싶지만 아직 확신 못함]
A closer, more intimate view of the window and the faint light beyond.
At the very top edge of the sky: the softest possible pre-dawn color —
  barely distinguishable from deep night, just the thinnest hint of deep lavender.
In the glass: a gentle, barely-there trace of light drifting upward — not a star, a memory of one.
The star is almost formed but not yet complete — forming, still becoming.
Light: soft upward traces, whisper-quiet, not arrived.
Color: pre-dawn sky at the top — deepest lavender meeting deep blue, the faintest boundary.
Air: lavender, quiet upward feeling, fragile.

MUST NOT: the star arriving or completing.
MUST NOT: sunrise, sunlight breakthrough, warmth flooding.
MUST NOT: explosive brightness, certainty, courage, 'it worked' feeling.`,
  },
};

// ─────────────────────────────────────────────────────────────
// 프롬프트 빌더
// ─────────────────────────────────────────────────────────────
function buildPrompt(emotionId) {
  const spec = EMOTION_SPECS[emotionId];
  return `${SCENE_BASE}

[COMPOSITION — ${spec.distance}]
${spec.composition}

${spec.emotion_prompt}

[PRESENCE RULE]
The world breathes. The person remains like a memory.
Sky, water, light breathe. The person does NOT act.
No acting, no gesture, no gaze shift, no emotional performance.
Only the air passes through.

9:16 vertical composition, mobile portrait orientation.

NEGATIVE: ${NEGATIVE_BASE}`;
}

// ─────────────────────────────────────────────────────────────
// 태그 파일 생성
// ─────────────────────────────────────────────────────────────
function writeTag(emotionId, imagePath) {
  const spec = EMOTION_SPECS[emotionId];
  const tag = {
    place:       'cablecar',
    emotion:     emotionId,
    emotion_ko:  spec.label_ko,
    purpose:     'validation',
    distance:    spec.distance,
    motion_safe: spec.motion_safe,
    phase:       'phase_0',
    generated_at: new Date().toISOString(),
    image:       path.basename(imagePath),
    ssot_ref:    'docs/ssot/dreamtown/DreamTown_Emotion_Grammar_v1.md',
  };
  const tagPath = imagePath.replace('.png', '.tag.json');
  fs.writeFileSync(tagPath, JSON.stringify(tag, null, 2), 'utf8');
  return tagPath;
}

// ─────────────────────────────────────────────────────────────
// 이미지 생성
// ─────────────────────────────────────────────────────────────
async function generateImage(prompt) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.images.generate({ model: MODEL, prompt, size: IMAGE_SIZE });
  const item = response.data[0];
  if (item.b64_json) return { type: 'b64', data: Buffer.from(item.b64_json, 'base64') };
  if (item.url)      return { type: 'url', data: item.url };
  throw new Error('응답에 b64_json/url 없음');
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

// ─────────────────────────────────────────────────────────────
// 검수 메모 생성
// ─────────────────────────────────────────────────────────────
function writeValidationMemo(results) {
  const lines = [
    '# Cablecar Emotion Validation — Phase 0',
    '',
    `**생성일**: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
    `**모델**: ${MODEL} / ${IMAGE_SIZE}`,
    `**SSOT**: docs/ssot/dreamtown/DreamTown_Emotion_Grammar_v1.md`,
    '',
    '---',
    '',
    '## 검수 질문 (팀/CEO 검수용)',
    '',
    '각 이미지를 보며 아래 질문에 답한다.',
    '',
    '| # | 질문 |',
    '|---|------|',
    '| Q1 | 숨이 느껴지는가? |',
    '| Q2 | DreamTown답나? |',
    '| Q3 | 과하지 않은가? |',
    '| Q4 | 같은 세계로 느껴지는가? |',
    '| Q5 | 감정이 다르게 남는가? |',
    '',
    '---',
    '',
    '## 후보 이미지 5장',
    '',
  ];

  const EMOTIONS_ORDER = ['confusion', 'pause', 'calm', 'curiosity', 'fragile_hope'];
  EMOTIONS_ORDER.forEach((eid, i) => {
    const r   = results.find(x => x.emotion === eid);
    const spec = EMOTION_SPECS[eid];
    lines.push(`### ${i + 1}. ${eid} — ${spec.label_ko}`);
    lines.push('');
    lines.push('```');
    lines.push(`place:       cablecar`);
    lines.push(`emotion:     ${eid}`);
    lines.push(`purpose:     validation`);
    lines.push(`distance:    ${spec.distance}`);
    lines.push(`motion_safe: ${spec.motion_safe}`);
    lines.push(`status:      ${r ? r.status : '—'}`);
    lines.push(`file:        ${r && r.filename ? r.filename : '—'}`);
    lines.push('```');
    lines.push('');
    lines.push('감정 핵심:');
    lines.push('```');
    const grammarMap = {
      confusion:    '무엇인지 모르겠는 무게. 안개 속에서 무언가를 찾는 중. 별이 보이지 않는다.',
      pause:        '숨을 고르는 중. 아직 결정하지 않은 사이. 별이 아주 조금 보이기 시작한다.',
      calm:         '이 순간이 충분하다. 아무것도 바라지 않는 상태. 별이 조용히 탄생 중.',
      curiosity:    '가벼운 기울어짐. 알고 싶다. 별이 가까워지고 있다.',
      fragile_hope: '믿고 싶지만 아직 확신 못함. 별이 거의 완성됐지만 아직 아니다.',
    };
    lines.push(grammarMap[eid]);
    lines.push('```');
    lines.push('');
    lines.push('검수 메모 (작성란):');
    lines.push('```');
    lines.push('Q1 숨이 느껴지는가:');
    lines.push('Q2 DreamTown답나:');
    lines.push('Q3 과하지 않은가:');
    lines.push('Q4 같은 세계인가:');
    lines.push('Q5 감정이 다르게 남는가:');
    lines.push('종합:');
    lines.push('```');
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  lines.push('## 다음 단계');
  lines.push('');
  lines.push('> **팀/CEO 감정 검수**');
  lines.push('');
  lines.push('위 5장의 이미지를 팀과 CEO가 직접 검수한다.');
  lines.push('');
  lines.push('검수 기준:');
  lines.push('- 감정 5종이 시각적으로 구분되는가');
  lines.push('- DreamTown 세계관에서 벗어나지 않는가');
  lines.push('- 과한 연출 없이 공기의 밀도가 느껴지는가');
  lines.push('');
  lines.push('검수 통과 후:');
  lines.push('- storybook 에셋으로 star-cache 생성 확장');
  lines.push('- miracle 에셋으로 world-canvas 1종 생성');
  lines.push('- cafe, hamel_lighthouse 씬으로 순차 확장');

  const memoPath = path.join(RPT_DIR, 'cablecar-emotion-validation-v1.md');
  fs.writeFileSync(memoPath, lines.join('\n'), 'utf8');
  log('MEMO', `Validation memo: ${memoPath}`);
  return memoPath;
}

// ─────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────
async function main() {
  const emotions = EMOTION_ONLY
    ? [EMOTION_ONLY]
    : Object.keys(EMOTION_SPECS);

  log('START', `cablecar validation | emotions: ${emotions.join(', ')} | dry-run: ${DRY_RUN}`);

  let totalCost = 0;
  const results = [];

  for (const eid of emotions) {
    if (!EMOTION_SPECS[eid]) { log('ERROR', `Unknown emotion: ${eid}`); continue; }

    const filename = `cablecar_${eid}_v1.png`;
    const outPath  = path.join(OUT_DIR, filename);
    const pubUrl   = `/images/world-canvas/validation/cablecar/${filename}`;
    const prompt   = buildPrompt(eid);

    if (DRY_RUN) {
      log('DRY-RUN', `Would generate: ${filename}`);
      log('DRY-RUN', 'PROMPT ↓\n' + prompt.substring(0, 400) + '…');
      results.push({ emotion: eid, status: 'dry_run', filename });
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
      results.push({ emotion: eid, status: 'generated', filename, url: pubUrl });
    } catch (err) {
      log('ERROR', `${filename} failed: ${err.message}`);
      results.push({ emotion: eid, status: 'error', filename, error: err.message });
    }
  }

  log('DONE', `generated: ${results.filter(r=>r.status==='generated').length}/5 | cost: $${totalCost.toFixed(2)}`);

  if (!DRY_RUN) {
    writeValidationMemo(results);
  }
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
} else {
  module.exports = { buildPrompt, EMOTION_SPECS };
}
