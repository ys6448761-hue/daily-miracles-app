#!/usr/bin/env node
'use strict';

/**
 * generate-world-canvas.js — DreamTown miracle 전용 world-canvas 이미지 생성
 *
 * storybook: star-cache (감정 클로즈업, 인물 중심)
 * miracle:   world-canvas (세계 와이드샷, 인물은 실루엣)
 *
 * 사용법:
 *   node scripts/generate-world-canvas.js --dry-run
 *   node scripts/generate-world-canvas.js --scene=yeosu_harbor
 *   node scripts/generate-world-canvas.js --scene=yeosu_cablecar_night
 *   node scripts/generate-world-canvas.js --scene=yeosu_dolsan
 *   node scripts/generate-world-canvas.js               (3종 모두 생성)
 *   node scripts/generate-world-canvas.js --force-regenerate
 *
 * SSOT: config/world-canvas/prompt-ssot.json
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

// ── CLI ────────────────────────────────────────────────────────
const args         = process.argv.slice(2);
const DRY_RUN      = args.includes('--dry-run');
const FORCE_REGEN  = args.includes('--force-regenerate');
const SCENE_FILTER = (args.find(a => a.startsWith('--scene=')) || '').replace('--scene=', '') || null;

// ── 환경 ───────────────────────────────────────────────────────
const MODEL      = process.env.DREAMTOWN_IMAGE_MODEL || 'gpt-image-1';
const IMAGE_SIZE = '1024x1536';   // 9:16 portrait, 모바일 표준
const COST_PER   = 0.04;
const MAX_COST   = parseFloat(process.env.DREAMTOWN_MAX_COST || '5.0');

// ── 경로 ───────────────────────────────────────────────────────
const ROOT_DIR    = path.join(__dirname, '..');
const CANVAS_BASE = path.join(ROOT_DIR, 'public', 'images', 'world-canvas', 'miracle');
const CONFIG_FILE = path.join(ROOT_DIR, 'config', 'world-canvas', 'prompt-ssot.json');
const REPORT_DIR  = path.join(ROOT_DIR, 'reports');
const LOG_DIR     = path.join(ROOT_DIR, 'logs');

[CANVAS_BASE, REPORT_DIR, LOG_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── 로거 ───────────────────────────────────────────────────────
function ts() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }).replace(',', '');
}
function log(level, msg) {
  const line = `[${ts()}] ${level}: ${msg}`;
  console.log(line);
}

// ── SSOT 로드 ───────────────────────────────────────────────────
function loadSSoT() {
  if (!fs.existsSync(CONFIG_FILE)) throw new Error(`SSOT not found: ${CONFIG_FILE}`);
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

// ── 프롬프트 빌더 ───────────────────────────────────────────────
function buildWorldCanvasPrompt(scene, ssot) {
  const s    = ssot.scenes[scene];
  const vg   = ssot.visual_grammar;
  const base = ssot.base_prompt;
  const neg  = ssot.negative_prompt;

  if (!s) throw new Error(`Scene not found in SSOT: ${scene}`);

  return `${base}

[SCENE — ${s.label}]
${s.scene_description}

[WORLD-CANVAS COMPOSITION]
${vg.composition}
Sky and environment occupy 70–80% of the frame.
Character: ${s.character_instruction}
Character visibility: ${s.character_visibility} — the world is the protagonist, not the person.

[ATMOSPHERE]
${s.atmosphere}

[CRITICAL — what must stay]
${s.must_remain}

[VISUAL STYLE]
Style: ${vg.style}
Lighting: ${vg.lighting}
Emotion density: ${vg.emotion_density}

[DRIFT GUARD — NEVER]
No storybook close-up feel.
No large character.
No cinematic lens flare.
No excessive particles.
No photorealism. No 3D.
No text, no watermark.
NOT a tourism poster.
NOT a travel advertisement.

9:16 vertical composition, mobile portrait orientation.

NEGATIVE: ${neg}`;
}

// ── 이미지 생성 ─────────────────────────────────────────────────
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

// ── 단일 씬 생성 ────────────────────────────────────────────────
async function generateScene(sceneId, ssot, stats) {
  const sceneDir  = path.join(CANVAS_BASE, sceneId);
  if (!fs.existsSync(sceneDir)) fs.mkdirSync(sceneDir, { recursive: true });

  const filename  = `${sceneId}_world_canvas.png`;
  const filePath  = path.join(sceneDir, filename);
  const publicUrl = `/images/world-canvas/miracle/${sceneId}/${filename}`;

  if (fs.existsSync(filePath) && !FORCE_REGEN) {
    log('SKIP', `${filename} already exists. Use --force-regenerate to overwrite.`);
    return { scene: sceneId, status: 'skipped', path: filePath, url: publicUrl };
  }

  const prompt = buildWorldCanvasPrompt(sceneId, ssot);

  if (DRY_RUN) {
    log('DRY-RUN', `Would generate: ${filename}`);
    log('DRY-RUN', 'PROMPT ↓\n' + prompt);
    return { scene: sceneId, status: 'dry_run', path: null, url: null };
  }

  if (stats.cost + COST_PER > MAX_COST) {
    log('ERROR', `Cost limit exceeded ($${MAX_COST}). Aborting.`);
    return { scene: sceneId, status: 'cost_exceeded', path: null, url: null };
  }

  log('GENERATE', `${filename} — scene: ${sceneId}`);
  const genStart = Date.now();

  try {
    const result = await generateImage(prompt);
    let buf;
    if (result.type === 'b64') buf = result.data;
    else                        buf = await downloadUrl(result.data);

    fs.writeFileSync(filePath, buf);
    stats.cost    += COST_PER;
    stats.success += 1;
    const elapsed = ((Date.now() - genStart) / 1000).toFixed(1);
    log('OK', `${filename} saved (${elapsed}s) — cost so far: $${stats.cost.toFixed(2)}`);

    return { scene: sceneId, status: 'generated', path: filePath, url: publicUrl };

  } catch (err) {
    stats.failed += 1;
    log('ERROR', `${filename} failed: ${err.message}`);
    return { scene: sceneId, status: 'error', error: err.message, path: null, url: null };
  }
}

// ── 보고서 생성 ─────────────────────────────────────────────────
function writeReport(results, stats) {
  const lines = [
    '# World-Canvas 생성 보고서',
    '',
    `**날짜**: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
    `**모델**: ${MODEL} / ${IMAGE_SIZE}`,
    `**총 비용**: $${stats.cost.toFixed(2)}`,
    '',
    '## 결과',
    '',
    '| Scene | Status | URL |',
    '|-------|--------|-----|',
  ];
  results.forEach(r => {
    lines.push(`| ${r.scene} | ${r.status} | ${r.url || '—'} |`);
  });
  lines.push('');
  lines.push('## 라우팅 규칙');
  lines.push('');
  lines.push('```');
  lines.push('storybook → public/images/star-cache/{location}/');
  lines.push('miracle   → public/images/world-canvas/miracle/{scene}/');
  lines.push('```');

  const reportPath = path.join(REPORT_DIR, 'world-canvas-generation-report.md');
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  log('REPORT', `Report saved: ${reportPath}`);
}

// ── 메인 ────────────────────────────────────────────────────────
async function main() {
  log('START', `generate-world-canvas.js | model=${MODEL} | dry-run=${DRY_RUN}`);

  const ssot   = loadSSoT();
  const scenes = Object.keys(ssot.scenes);
  const target = SCENE_FILTER ? scenes.filter(s => s === SCENE_FILTER) : scenes;

  if (target.length === 0) {
    log('ERROR', `Scene not found: ${SCENE_FILTER}. Available: ${scenes.join(', ')}`);
    process.exit(1);
  }

  const stats = { cost: 0, success: 0, failed: 0 };
  const results = [];

  for (const sceneId of target) {
    const r = await generateScene(sceneId, ssot, stats);
    results.push(r);
  }

  log('DONE', `Success: ${stats.success} | Failed: ${stats.failed} | Cost: $${stats.cost.toFixed(2)}`);

  if (!DRY_RUN) writeReport(results, stats);

  return results;
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
} else {
  module.exports = { buildWorldCanvasPrompt, generateScene };
}
