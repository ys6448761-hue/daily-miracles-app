#!/usr/bin/env node
/**
 * generate-motion-preview.js
 * Reads sequence.json from outputs/auto-preview/{id}/
 * Generates side-by-side STATIC vs MICRO MOTION HTML player
 * Output: outputs/motion-preview/{id}/preview.html
 *
 * Usage:
 *   node scripts/generate-motion-preview.js                          # all
 *   node scripts/generate-motion-preview.js --id wish_W01_res       # single
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUTO_DIR = path.join(ROOT, 'outputs', 'auto-preview');
const OUT_DIR  = path.join(ROOT, 'outputs', 'motion-preview');

// ---------- motion params per emotion ----------
const MOTION_PARAMS = {
  pause: {
    zoom: [1.0, 1.06],
    pan:  [0, 0],
    overlay: 'none',
  },
  calm: {
    zoom: [1.0, 1.04],
    pan:  [0, 0],
    overlay: 'none',
  },
  curiosity: {
    zoom: [1.0, 1.055],
    pan:  [-0.8, 0.8],      // left → right drift
    overlay: 'none',
  },
  fragile_hope: {
    zoom: [1.0, 1.05],
    pan:  [0, 0],
    overlay: 'shimmer',
  },
  reality_reconnection: {
    zoom: [1.0, 1.02],
    pan:  [-1.2, 1.2],
    overlay: 'shimmer',
  },
  emotional_afterflow: {
    zoom: [1.0, 1.0],       // no zoom — breathing gap
    pan:  [0, 0],
    overlay: 'none',
    breathe: true,
  },
  confusion: {
    zoom: [1.0, 1.03],
    pan:  [0, 0],
    overlay: 'fog',
  },
};

// resonance = 1.0× base, attraction = 1.3× slightly livelier
const MOTION_SPEED = {
  resonance_personal: 1.0,
  attraction_social: 1.3,
};

// ---------- HTML template ----------
function buildHtml(seq) {
  const ratio = seq.ratio;               // '3:4' | '9:16'
  const ratioClass = ratio === '9:16' ? 'ratio-9-16' : 'ratio-3-4';
  const speed = MOTION_SPEED[seq.render_mode] || 1.0;
  const totalSec = seq.total_duration_sec;
  const subWeight = seq.render_mode === 'attraction_social' ? '400' : '300';

  const frames = seq.frames;

  function buildFrameImgs(playerId) {
    return frames.map((f, i) =>
      `<img class="frame-img${i === 0 ? ' active' : ''}" id="${playerId}-img-${i}" src="${f.file}" alt="${f.emotion}" draggable="false">`
    ).join('\n        ');
  }

  const staticFrames = buildFrameImgs('s');
  const motionFrames = buildFrameImgs('m');

  const seqJson = JSON.stringify(seq);
  const motionParamsJson = JSON.stringify(MOTION_PARAMS);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Motion Prototype — ${seq.wish_id}</title>
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #08080f;
  color: #ccc;
  font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
  min-height: 100vh;
  padding-bottom: 32px;
}

header {
  text-align: center;
  padding: 24px 16px 8px;
}
header h1 {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: #444;
  text-transform: uppercase;
  font-weight: 300;
}
header .wish-text {
  font-size: 13px;
  color: #777;
  margin-top: 8px;
  font-weight: 300;
}
header .meta {
  font-size: 10px;
  color: #3a3a50;
  margin-top: 6px;
  letter-spacing: 0.08em;
}

.comparison {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 16px 8px;
  flex-wrap: wrap;
}

.player-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.player-label {
  font-size: 9px;
  letter-spacing: 0.2em;
  color: #3a3a55;
  text-transform: uppercase;
  font-weight: 400;
}

.player {
  position: relative;
  overflow: hidden;
  background: #000;
  border: 1px solid #1a1a28;
  flex-shrink: 0;
}
.ratio-3-4  { width: 270px; height: 360px; }
.ratio-9-16 { width: 202px; height: 360px; }

.frame-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.7s ease-in-out;
  will-change: transform, opacity;
}
.frame-img.active { opacity: 1; }

/* overlays */
.overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.8s ease;
}
.overlay.visible { opacity: 1; }

.water-shimmer {
  background: radial-gradient(ellipse 130% 55% at 50% 88%,
    rgba(160, 210, 255, 0.10) 0%,
    rgba(140, 190, 255, 0.04) 45%,
    transparent 70%);
  animation: shimmer 5.5s ease-in-out infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.35; transform: scaleX(0.94); }
  50%       { opacity: 1;    transform: scaleX(1.06); }
}

.fog-drift {
  background: linear-gradient(
    148deg,
    rgba(195, 212, 235, 0.09) 0%,
    transparent 42%,
    rgba(195, 212, 235, 0.06) 100%
  );
  animation: fog 9s ease-in-out infinite;
}
@keyframes fog {
  0%, 100% { opacity: 0.45; transform: translateX(-2.5%); }
  50%       { opacity: 1;    transform: translateX(2.5%);  }
}

/* subtitle */
.subtitle {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 14px 18px 22px;
  background: linear-gradient(transparent, rgba(0,0,0,0.38));
  text-align: center;
  font-size: 12.5px;
  line-height: 1.75;
  color: transparent;
  transition: color 0.9s ease;
  letter-spacing: 0.06em;
  font-weight: ${subWeight};
  pointer-events: none;
}
.subtitle.visible { color: rgba(255,255,255,0.70); }
.subtitle.bold-mode.visible { color: rgba(255,255,255,0.90); }

/* subtitle breathing — motion player only */
#motion-subtitle.visible {
  animation: sub-breathe 3.8s ease-in-out infinite;
}
@keyframes sub-breathe {
  0%, 100% { opacity: 0.82; }
  50%       { opacity: 1;    }
}

/* hud */
.hud {
  position: absolute;
  top: 7px; left: 7px;
  font-size: 9px;
  color: rgba(255,255,255,0.22);
  letter-spacing: 0.07em;
  background: rgba(0,0,0,0.28);
  padding: 2px 6px;
  border-radius: 2px;
  pointer-events: none;
}
.motion-badge {
  position: absolute;
  top: 7px; right: 7px;
  font-size: 8px;
  color: rgba(100,150,255,0.35);
  letter-spacing: 0.12em;
  background: rgba(0,0,0,0.28);
  padding: 2px 6px;
  border-radius: 2px;
  pointer-events: none;
}
.emotion-tag {
  position: absolute;
  bottom: 6px; right: 8px;
  font-size: 8px;
  color: rgba(255,255,255,0.18);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  pointer-events: none;
}

/* controls */
.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  padding: 16px 24px 0;
  max-width: 640px;
  margin: 0 auto;
}
.play-btn {
  background: none;
  border: 1px solid #2a2a40;
  color: #666;
  padding: 6px 18px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  letter-spacing: 0.08em;
  white-space: nowrap;
  transition: border-color 0.2s, color 0.2s;
}
.play-btn:hover { border-color: #555; color: #aaa; }

.progress-bar {
  flex: 1;
  height: 1px;
  background: #1e1e2e;
  border-radius: 1px;
  cursor: pointer;
  position: relative;
}
.progress-fill {
  height: 100%;
  background: #334;
  border-radius: 1px;
  width: 0%;
  transition: width 0.08s linear;
}
.time-display {
  font-size: 10px;
  color: #333;
  min-width: 72px;
  text-align: right;
  letter-spacing: 0.05em;
}

/* legend */
.legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 18px 0 0;
  flex-wrap: wrap;
}
.legend-item {
  font-size: 9.5px;
  color: #2e2e48;
  letter-spacing: 0.08em;
}
.legend-item span { color: #3a3a60; }
</style>
</head>
<body>

<header>
  <h1>DreamTown · Micro Motion Prototype</h1>
  <p class="wish-text">"${seq.wish_text}"</p>
  <p class="meta">${seq.wish_type} · ${seq.primary_gravity} · ${seq.render_mode} · ${ratio} · ${totalSec}s</p>
</header>

<div class="comparison">

  <!-- LEFT: STATIC -->
  <div class="player-col">
    <div class="player-label">Static</div>
    <div class="player ${ratioClass}" id="static-player">
      ${staticFrames}
      <div class="hud" id="s-hud">F1</div>
      <div class="emotion-tag" id="s-emotion"></div>
      <div class="subtitle" id="s-sub"></div>
    </div>
  </div>

  <!-- RIGHT: MICRO MOTION -->
  <div class="player-col">
    <div class="player-label">Micro Motion</div>
    <div class="player ${ratioClass}" id="motion-player">
      ${motionFrames}
      <div class="overlay water-shimmer" id="ov-shimmer"></div>
      <div class="overlay fog-drift"    id="ov-fog"></div>
      <div class="motion-badge">✦ MOTION</div>
      <div class="emotion-tag" id="m-emotion"></div>
      <div class="subtitle" id="m-sub"></div>
    </div>
  </div>

</div>

<div class="controls">
  <button class="play-btn" id="play-btn">▶ Play</button>
  <div class="progress-bar">
    <div class="progress-fill" id="progress-fill"></div>
  </div>
  <div class="time-display" id="time-display">0.0 / ${totalSec}s</div>
</div>

<div class="legend">
  <div class="legend-item">zoom slow: <span>pause / calm</span></div>
  <div class="legend-item">zoom + pan: <span>curiosity / reconnection</span></div>
  <div class="legend-item">shimmer: <span>fragile_hope / reconnection</span></div>
  <div class="legend-item">fog: <span>confusion</span></div>
  <div class="legend-item">breathe only: <span>emotional_afterflow</span></div>
</div>

<script>
const SEQ = ${seqJson};
const MP  = ${motionParamsJson};
const SPEED = ${speed};

const totalSec = SEQ.total_duration_sec;
const frames   = SEQ.frames;

const sImgs    = Array.from(document.querySelectorAll('#static-player .frame-img'));
const mImgs    = Array.from(document.querySelectorAll('#motion-player .frame-img'));
const sHud     = document.getElementById('s-hud');
const sEmotion = document.getElementById('s-emotion');
const mEmotion = document.getElementById('m-emotion');
const sSub     = document.getElementById('s-sub');
const mSub     = document.getElementById('m-sub');
const shimmer  = document.getElementById('ov-shimmer');
const fog      = document.getElementById('ov-fog');
const playBtn  = document.getElementById('play-btn');
const pFill    = document.getElementById('progress-fill');
const tDisp    = document.getElementById('time-display');

const isBold = SEQ.render_mode === 'attraction_social';

let playing = false;
let startTs  = null;
let rafId    = null;
let prevIdx  = -1;

function frameAt(t) {
  for (let i = frames.length - 1; i >= 0; i--) {
    if (t >= frames[i].timing.start) return i;
  }
  return 0;
}

function showFrame(idx) {
  sImgs.forEach((img, i) => img.classList.toggle('active', i === idx));
  mImgs.forEach((img, i) => img.classList.toggle('active', i === idx));
  sHud.textContent     = frames[idx].id;
  sEmotion.textContent = frames[idx].emotion;
  mEmotion.textContent = frames[idx].emotion;
  // reset transform on leaving frames
  mImgs.forEach((img, i) => { if (i !== idx) img.style.transform = ''; });
}

function applyMotion(idx, fp) {
  const em  = frames[idx].emotion;
  const p   = MP[em] || MP['pause'];
  const img = mImgs[idx];
  if (!img) return;

  // zoom
  const z0 = p.zoom[0], z1 = p.zoom[1];
  const scale = z0 + (z1 - z0) * fp;

  // pan — array means [startX, endX], number means fixed
  let panX = 0;
  if (Array.isArray(p.pan)) {
    panX = p.pan[0] + (p.pan[1] - p.pan[0]) * fp;
  }

  img.style.transform       = 'scale(' + scale.toFixed(4) + ') translateX(' + panX.toFixed(2) + '%)';
  img.style.transformOrigin = 'center center';

  // overlays
  shimmer.classList.toggle('visible', p.overlay === 'shimmer');
  fog.classList.toggle(    'visible', p.overlay === 'fog');

  // breathing gap: extra opacity pulse for afterflow
  if (p.breathe) {
    const phase = (Math.sin(Date.now() / 1800) + 1) / 2;
    img.style.opacity = (0.85 + phase * 0.12).toFixed(3);
  } else {
    img.style.opacity = '';
  }
}

function applySub(idx, t) {
  const f   = frames[idx];
  const off = f.subtitle_start_offset || 0;
  const vis = f.subtitle && t >= f.timing.start + off && t < f.timing.end;

  if (vis) {
    sSub.textContent = f.subtitle;
    mSub.textContent = f.subtitle;
    sSub.classList.add('visible');
    mSub.classList.add('visible');
    if (isBold) { sSub.classList.add('bold-mode'); mSub.classList.add('bold-mode'); }
  } else {
    sSub.textContent = '';
    mSub.textContent = '';
    sSub.classList.remove('visible', 'bold-mode');
    mSub.classList.remove('visible', 'bold-mode');
  }
}

function tick(ts) {
  if (!startTs) startTs = ts;
  const t = Math.min((ts - startTs) / 1000, totalSec);

  pFill.style.width = (t / totalSec * 100).toFixed(2) + '%';
  tDisp.textContent = t.toFixed(1) + ' / ' + totalSec + 's';

  const idx = frameAt(t);
  if (idx !== prevIdx) { showFrame(idx); prevIdx = idx; }

  const f  = frames[idx];
  const fp = Math.min((t - f.timing.start) / f.timing.duration, 1.0);
  applyMotion(idx, fp);
  applySub(idx, t);

  if (t < totalSec) {
    rafId = requestAnimationFrame(tick);
  } else {
    playing = false;
    playBtn.textContent = '↺ Restart';
  }
}

function reset() {
  if (rafId) cancelAnimationFrame(rafId);
  startTs = null; prevIdx = -1;
  sImgs.forEach(img => { img.classList.remove('active'); img.style.transform = ''; img.style.opacity = ''; });
  mImgs.forEach(img => { img.classList.remove('active'); img.style.transform = ''; img.style.opacity = ''; });
  shimmer.classList.remove('visible');
  fog.classList.remove('visible');
  sSub.classList.remove('visible','bold-mode');
  mSub.classList.remove('visible','bold-mode');
  sSub.textContent = '';
  mSub.textContent = '';
  pFill.style.width = '0%';
  tDisp.textContent = '0.0 / ' + totalSec + 's';
}

playBtn.addEventListener('click', () => {
  if (!playing) {
    playing = true;
    playBtn.textContent = '⏸ Pause';
    reset();
    showFrame(0);
    rafId = requestAnimationFrame(tick);
  } else {
    playing = false;
    playBtn.textContent = '▶ Play';
    if (rafId) cancelAnimationFrame(rafId);
  }
});

// init
showFrame(0);
</script>
</body>
</html>`;
}

// ---------- runner ----------
function processSequence(seqDir, id) {
  const seqPath = path.join(seqDir, id, 'sequence.json');
  if (!fs.existsSync(seqPath)) {
    console.warn('[SKIP] sequence.json not found:', seqPath);
    return;
  }

  const seq = JSON.parse(fs.readFileSync(seqPath, 'utf8'));
  const html = buildHtml(seq);

  const outDir = path.join(OUT_DIR, id);
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, 'preview.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('[OK]', id, '→', path.relative(ROOT, outPath));
}

// parse --id argument
const args = process.argv.slice(2);
const idFlag = args.indexOf('--id');
const targetId = idFlag !== -1 ? args[idFlag + 1] : null;

if (targetId) {
  processSequence(AUTO_DIR, targetId);
} else {
  // process all
  const ids = fs.readdirSync(AUTO_DIR).filter(d =>
    fs.statSync(path.join(AUTO_DIR, d)).isDirectory()
  );
  ids.forEach(id => processSequence(AUTO_DIR, id));
}

console.log('\nDone. Open in browser:');
console.log('  python -m http.server 8080');
console.log('  → http://localhost:8080/outputs/motion-preview/wish_W01_res/preview.html');
