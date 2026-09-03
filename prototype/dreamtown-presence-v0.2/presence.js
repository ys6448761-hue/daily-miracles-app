/**
 * presence.js — DreamTown Presence Prototype v0.2
 * "사람을 움직이되, 공기 속에 머문다로 느껴져야 한다."
 */
'use strict';

const TAU = Math.PI * 2;

// ─── Image options ────────────────────────────────────────────
const IMAGES = [
  { label: 'Cafe — Afterflow',      path: '../../public/images/storybook/sources/page05/cafe/cafe_page05_emotional_afterflow_base.png',      hasWater: false },
  { label: 'Cafe — Reconnection',   path: '../../public/images/storybook/sources/page05/cafe/cafe_page05_reality_reconnection_base.png',     hasWater: false },
  { label: 'Cafe — Widened',        path: '../../public/images/storybook/sources/page05/cafe/cafe_page05_widened_continuation_base.png',     hasWater: false },
  { label: 'Cafe — Wish Signal',    path: '../../public/images/storybook/sources/page05/cafe/cafe_page05_wish_signal_continuation_base.png', hasWater: false },
  { label: 'Hamel — Afterflow',     path: '../../public/images/storybook/sources/page05/hamel/hamel_page05_emotional_afterflow_base.png',     hasWater: true  },
  { label: 'Hamel — Reconnection',  path: '../../public/images/storybook/sources/page05/hamel/hamel_page05_reality_reconnection_base.png',    hasWater: true  },
  { label: 'Hamel — Widened',       path: '../../public/images/storybook/sources/page05/hamel/hamel_page05_widened_continuation_base.png',    hasWater: true  },
  { label: 'Hamel — Wish Signal',   path: '../../public/images/storybook/sources/page05/hamel/hamel_page05_wish_signal_continuation_base.png', hasWater: true },
];

// ─── State ────────────────────────────────────────────────────
let PM = null;
let W = 280, H = 373;
let currentVar = 'B';
let currentEmo = 'calm';
let hasWater    = false;
let playing     = true;
let startTs     = null;
let rafId       = null;
let baseLoaded  = false;

const L = { star: true, water: true, grain: true, light: true, human: true };

// ─── Canvas refs ──────────────────────────────────────────────
let baseCvs, humanCvs, shimCvs, grainCvs, starCvs;
let baseCtx, humanCtx, shimCtx, grCtx, stCtx;
let lightLayer;

// ─── Stars ───────────────────────────────────────────────────
let starPts = [];

// ─── Timing ───────────────────────────────────────────────────
let lastGrainMs = 0, lastHumanMs = 0;
const GRAIN_FPS = 12, HUMAN_FPS = 8;

// ─────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────
async function dtPresenceInit() {
  const r = await fetch('./presence-map.json');
  PM = await r.json();
  W = PM.stage.w;
  H = PM.stage.h;

  const stage = document.getElementById('stage');
  stage.style.width  = W + 'px';
  stage.style.height = H + 'px';

  function mkCvs(id, zIndex, blend) {
    const c = document.getElementById(id);
    c.width  = W; c.height = H;
    c.style.zIndex = zIndex;
    if (blend) c.style.mixBlendMode = blend;
    return c;
  }
  baseCvs  = mkCvs('base-cvs',    1);        baseCtx  = baseCvs.getContext('2d');
  humanCvs = mkCvs('human-cvs',   2);        humanCtx = humanCvs.getContext('2d');
  shimCvs  = mkCvs('shimmer-cvs', 3, 'screen'); shimCtx = shimCvs.getContext('2d');
  grainCvs = mkCvs('grain-cvs',   5, 'soft-light'); grCtx = grainCvs.getContext('2d');
  starCvs  = mkCvs('star-cvs',    6, 'screen'); stCtx  = starCvs.getContext('2d');
  lightLayer = document.getElementById('light-layer');

  buildUI();
  loadImage(IMAGES[0].path, false);
  initStars();
  rafId = requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────────────────────
// Main loop
// ─────────────────────────────────────────────────────────────
function loop(ts) {
  if (!startTs) startTs = ts;
  const t = (ts - startTs) / 1000;

  if (!baseLoaded) { rafId = requestAnimationFrame(loop); return; }
  if (!playing)    { rafId = requestAnimationFrame(loop); return; }

  const emo   = PM.emotions[currentEmo];
  const vari  = PM.variants[currentVar];
  const wMult = vari.world_multiplier;
  const humanAmp = L.human ? (vari.human_motion_pct / 100 * W) : 0;

  drawHuman(ts, t, humanAmp, emo);
  drawWater(t, emo, wMult);
  drawLight(t, emo, wMult);
  drawGrain(ts, emo);
  drawStars(t, emo, wMult);
  updateLive(t, humanAmp, emo, vari);

  rafId = requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────────────────────
// drawHuman — pixel displacement on human region
// "공기 때문에 흔들린다" — NOT "사람이 행동한다"
// ─────────────────────────────────────────────────────────────
function drawHuman(nowMs, t, amplitude, emo) {
  if (nowMs - lastHumanMs < 1000 / HUMAN_FPS) return;
  lastHumanMs = nowMs;

  humanCtx.clearRect(0, 0, W, H);
  if (amplitude < 0.05) return;

  let srcData;
  try {
    srcData = baseCtx.getImageData(0, 0, W, H);
  } catch (e) {
    return; // cross-origin guard
  }

  const dstData = humanCtx.createImageData(W, H);
  const src = srcData.data;
  const dst = dstData.data;

  const dg      = PM.drift_guard;
  const humanTopY = Math.floor(dg.human_region.top    * H);
  const humanBotY = Math.floor(dg.human_region.bottom * H);
  const hairBotY  = Math.floor(dg.hair_region.bottom  * H);
  const fadeLen   = Math.floor(dg.fade_band * H);

  const [pHair, pCloth] = emo.human_period;
  const scatter = emo.human_phase_scatter;

  for (let y = humanTopY; y < humanBotY; y++) {
    const yNorm  = y / H;
    const isHair = y < hairBotY;
    const period = isHair ? pHair : pCloth;

    // Wave: vertical position phase creates natural cloth ripple
    const phaseY = yNorm * scatter;
    const wave1  = Math.sin(t / period * TAU + phaseY);
    const wave2  = Math.sin(yNorm * 6.5 + t / (period * 1.7) * TAU);
    const dispX  = amplitude * wave1 * wave2;
    const dispY  = amplitude * 0.18 * Math.sin(t / (period * 1.4) * TAU + phaseY + 1.1);

    // Feather: fade in at top, fade out at bottom
    const dTop  = y - humanTopY;
    const dBot  = humanBotY - y;
    const fade  = Math.min(1, dTop / fadeLen, dBot / fadeLen);
    if (fade < 0.01) continue;

    const srcY  = Math.max(0, Math.min(H - 1, Math.round(y - dispY)));
    const shiftX = Math.round(dispX);
    const srcRow = srcY * W * 4;
    const dstRow = y    * W * 4;
    const alpha  = Math.round(fade * 255);

    for (let x = 0; x < W; x++) {
      const sx = Math.max(0, Math.min(W - 1, x - shiftX));
      const si  = srcRow + sx * 4;
      const di  = dstRow + x  * 4;
      dst[di]   = src[si];
      dst[di+1] = src[si+1];
      dst[di+2] = src[si+2];
      dst[di+3] = alpha;
    }
  }

  humanCtx.putImageData(dstData, 0, 0);
  dot('human', amplitude > 0.05);
}

// ─────────────────────────────────────────────────────────────
// drawWater — canvas horizontal shimmer bands (screen blend)
// ─────────────────────────────────────────────────────────────
function drawWater(t, emo, wMult) {
  shimCtx.clearRect(0, 0, W, H);
  if (!L.water || !hasWater) { dot('water', false); return; }

  const waterY   = 0.55 * H;
  const opMax    = emo.water_opacity_max * wMult;

  for (let b = 0; b < 4; b++) {
    const oy  = waterY + (H - waterY) * (0.08 + b * 0.22);
    const ww  = W * (0.35 + 0.45 * Math.sin(t * 0.4 + b * 1.1));
    const cx  = (W - ww) / 2 + W * 0.08 * Math.sin(t * 0.55 + b * 0.9);
    const op  = (opMax * (0.7 + 0.3 * Math.sin(t * 0.85 + b * 0.7 + Math.PI)));
    if (op < 0.001) continue;
    const grd = shimCtx.createLinearGradient(cx, oy, cx + ww, oy);
    grd.addColorStop(0,   'rgba(160,210,240,0)');
    grd.addColorStop(0.5, `rgba(160,210,240,${op.toFixed(4)})`);
    grd.addColorStop(1,   'rgba(160,210,240,0)');
    shimCtx.fillStyle = grd;
    shimCtx.fillRect(cx, oy - 2, ww, 5);
  }
  dot('water', true);
}

// ─────────────────────────────────────────────────────────────
// drawLight — radial gradient breathing (P1)
// ─────────────────────────────────────────────────────────────
function drawLight(t, emo, wMult) {
  if (!L.light) { lightLayer.style.opacity = '0'; dot('light', false); return; }
  const [loMin, loMax] = emo.light_opacity;
  const op = loMin + (loMax - loMin) * ((Math.sin(t / 20 * TAU) + 1) / 2) * wMult;
  lightLayer.style.background =
    `radial-gradient(ellipse 65% 38% at 50% 22%,rgba(210,200,255,${op.toFixed(4)}) 0%,transparent 68%)`;
  lightLayer.style.opacity = '1';
  dot('light', true);
}

// ─────────────────────────────────────────────────────────────
// drawGrain — center-biased noise (soft-light blend)
// ─────────────────────────────────────────────────────────────
function drawGrain(nowMs, emo) {
  if (nowMs - lastGrainMs < 1000 / GRAIN_FPS) return;
  lastGrainMs = nowMs;

  grCtx.clearRect(0, 0, W, H);
  if (!L.grain) { dot('grain', false); return; }

  const [gMin, gMax] = emo.grain_opacity;
  const op  = gMin + (gMax - gMin) * Math.random();
  const id  = grCtx.createImageData(W, H);
  const d   = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 100 + ((Math.random() * 110) | 0);
    d[i] = v; d[i+1] = v; d[i+2] = v + ((Math.random() * 12) | 0);
    d[i+3] = (op * 255) | 0;
  }
  grCtx.putImageData(id, 0, 0);
  dot('grain', true);
}

// ─────────────────────────────────────────────────────────────
// drawStars — radial glow points in sky region (screen blend)
// ─────────────────────────────────────────────────────────────
function initStars() {
  starPts = Array.from({ length: 30 }, () => ({
    x: Math.random(), y: Math.random() * 0.55,
    phase:  Math.random() * TAU,
    period: 6 + Math.random() * 3,
    r:      1.8 + Math.random() * 2.2,
  }));
}

function drawStars(t, emo, wMult) {
  stCtx.clearRect(0, 0, W, H);
  if (!L.star) { dot('star', false); return; }

  const [opMin, opMax] = emo.star_opacity;
  const [pMin,  pMax ] = emo.star_period;

  starPts.forEach(s => {
    const period = pMin + (pMax - pMin) * s.period / 9;
    const op = opMin + (opMax - opMin) * ((Math.sin(t / period * TAU + s.phase) + 1) / 2);
    const opAdj = op * Math.min(1, wMult);
    const sx = s.x * W, sy = s.y * H;
    const g = stCtx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 5);
    g.addColorStop(0,    `rgba(255,252,240,${(opAdj * 0.38).toFixed(3)})`);
    g.addColorStop(0.35, `rgba(230,225,255,${(opAdj * 0.13).toFixed(3)})`);
    g.addColorStop(1,    'rgba(230,225,255,0)');
    stCtx.fillStyle = g;
    stCtx.beginPath(); stCtx.arc(sx, sy, s.r * 5, 0, TAU); stCtx.fill();
  });
  dot('star', true);
}

// ─────────────────────────────────────────────────────────────
// loadImage
// ─────────────────────────────────────────────────────────────
function loadImage(path, hw) {
  baseLoaded  = false;
  hasWater    = hw;
  const img   = new Image();
  img.crossOrigin = 'anonymous';
  img.onload  = () => {
    baseCtx.clearRect(0, 0, W, H);
    baseCtx.drawImage(img, 0, 0, W, H);
    humanCtx.clearRect(0, 0, W, H);
    baseLoaded = true;
  };
  img.onerror = () => {
    // Draw fallback gradient
    const grd = baseCtx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0,   '#04040e');
    grd.addColorStop(0.5, '#0a0816');
    grd.addColorStop(1,   '#060610');
    baseCtx.fillStyle = grd;
    baseCtx.fillRect(0, 0, W, H);
    // Draw "no image" notice
    baseCtx.fillStyle = 'rgba(80,70,120,0.3)';
    baseCtx.font = '12px sans-serif';
    baseCtx.textAlign = 'center';
    baseCtx.fillText('image not loaded', W/2, H/2);
    baseLoaded = true;
  };
  img.src = path;
}

// ─────────────────────────────────────────────────────────────
// Dot indicator helper
// ─────────────────────────────────────────────────────────────
function dot(name, on) {
  const el = document.getElementById('dot-' + name);
  if (el) el.classList.toggle('on', on);
}

// ─────────────────────────────────────────────────────────────
// updateLive
// ─────────────────────────────────────────────────────────────
function updateLive(t, humanAmp, emo, vari) {
  const el = document.getElementById('live-status');
  if (!el) return;
  const [opMin, opMax] = emo.star_opacity;
  const starOp = (opMin + (opMax - opMin) * ((Math.sin(t / 7 * TAU) + 1) / 2)).toFixed(2);
  const humanPct = (vari.human_motion_pct || 0).toFixed(2);
  el.textContent = [
    `t     ${t.toFixed(1)}s`,
    `var   ${currentVar} · ${vari.label_ko}`,
    `emo   ${currentEmo} · ${emo.label}`,
    `star  op${starOp}`,
    `water ${hasWater ? 'on' : 'off (no water in image)'}`,
    `human ${humanAmp > 0.05 ? humanPct + '% · ' + humanAmp.toFixed(1) + 'px' : 'off'}`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────
// buildUI
// ─────────────────────────────────────────────────────────────
function buildUI() {
  // Variant buttons
  document.querySelectorAll('.vbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentVar = btn.dataset.v;
      document.querySelectorAll('.vbtn').forEach(b => b.classList.toggle('active', b.dataset.v === currentVar));
      const vari = PM.variants[currentVar];
      const descEl = document.getElementById('variant-desc');
      if (descEl) {
        descEl.textContent = vari.description;
        descEl.style.color = vari.color;
      }
      const humanToggle = document.getElementById('tg-human');
      if (humanToggle) humanToggle.classList.toggle('on', L.human && vari.human_motion_pct > 0);
    });
  });
  // Set initial desc
  const descEl = document.getElementById('variant-desc');
  if (descEl) {
    const vari = PM.variants[currentVar];
    descEl.textContent = vari.description;
    descEl.style.color = vari.color;
  }

  // Emotion buttons
  document.querySelectorAll('.ebtn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentEmo = btn.dataset.e;
      document.querySelectorAll('.ebtn').forEach(b => b.classList.toggle('active', b.dataset.e === currentEmo));
    });
  });

  // Image select
  const sel = document.getElementById('img-select');
  IMAGES.forEach((img, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = img.label;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    const img = IMAGES[+sel.value];
    loadImage(img.path, img.hasWater);
    document.getElementById('water-note').textContent = img.hasWater ? '(이미지에 물 있음)' : '(이미지에 물 없음 — water layer 비활성)';
  });

  // Layer toggles
  const layers = [
    { id: 'star',  label: 'Star Pulse',      tier: 'P0' },
    { id: 'water', label: 'Water Shimmer',   tier: 'P0' },
    { id: 'grain', label: 'Air Grain',       tier: 'P0' },
    { id: 'light', label: 'Light Breathing', tier: 'P1' },
    { id: 'human', label: 'Human Micro',     tier: 'NEW' },
  ];
  const lrows = document.getElementById('layer-rows');
  layers.forEach(lyr => {
    const row = document.createElement('div');
    row.className = 'lrow';
    row.innerHTML = `
      <div class="ldot on" id="dot-${lyr.id}"></div>
      <span class="lname">${lyr.label}</span>
      <span class="ltier t${lyr.tier.toLowerCase()}">${lyr.tier}</span>
      <div class="ltog on" id="tg-${lyr.id}" data-ly="${lyr.id}"></div>`;
    row.querySelector('.ltog').addEventListener('click', e => {
      const name = e.currentTarget.dataset.ly;
      L[name] = !L[name];
      e.currentTarget.classList.toggle('on', L[name]);
      if (!L[name]) {
        if (name === 'star')  stCtx.clearRect(0, 0, W, H);
        if (name === 'water') shimCtx.clearRect(0, 0, W, H);
        if (name === 'grain') grCtx.clearRect(0, 0, W, H);
        if (name === 'light') lightLayer.style.opacity = '0';
        if (name === 'human') humanCtx.clearRect(0, 0, W, H);
        dot(name, false);
      }
    });
    lrows.appendChild(row);
  });

  // Drift guard items
  const dgEl = document.getElementById('drift-items');
  if (dgEl) {
    PM.drift_guard.never.forEach(item => {
      const d = document.createElement('div');
      d.className = 'dg-item';
      d.textContent = '✓ no ' + item.replace(/_/g, ' ');
      dgEl.appendChild(d);
    });
  }

  // Test questions
  const QS = [
    '살아 있다고 느껴졌는가?',
    '사람이 캐릭터처럼 느껴졌는가?',
    '내 감정을 투영할 여백이 있었는가?',
    '세계가 나를 위해 연기한다고 느껴졌는가?',
    '조용히 다시 보고 싶은가?',
    'A/B/C 중 DreamTown다운 것은 무엇인가?',
  ];
  const qaGrid = document.getElementById('qa-grid');
  if (qaGrid) {
    QS.forEach((q, qi) => {
      const row = document.createElement('div');
      row.className = 'qa-row';
      if (qi < 5) {
        row.innerHTML = `<div class="qtext">${qi + 1}. ${q}</div>
          <div class="qans">
            <label><input type="radio" name="q${qi}" value="yes"> 예</label>
            <label><input type="radio" name="q${qi}" value="no">  아니오</label>
          </div>`;
      } else {
        row.innerHTML = `<div class="qtext">${qi + 1}. ${q}</div>
          <div class="qans">
            ${['A','B','C'].map(v => `<label><input type="radio" name="q${qi}" value="${v}"> ${v}</label>`).join('')}
          </div>`;
      }
      qaGrid.appendChild(row);
    });

    const sumBtn = document.createElement('button');
    sumBtn.className = 'sum-btn';
    sumBtn.textContent = '평가 결과 요약';
    sumBtn.addEventListener('click', showSummary);
    qaGrid.appendChild(sumBtn);

    const sumOut = document.createElement('pre');
    sumOut.id = 'sum-out';
    qaGrid.appendChild(sumOut);
  }
}

function showSummary() {
  const QS = [
    '살아 있다고 느껴졌는가?',
    '사람이 캐릭터처럼 느껴졌는가?',
    '내 감정을 투영할 여백이 있었는가?',
    '세계가 나를 위해 연기한다고 느껴졌는가?',
    '조용히 다시 보고 싶은가?',
    'A/B/C 중 DreamTown다운 것은?',
  ];
  let txt = 'DreamTown Presence v0.2 평가\n' + '─'.repeat(32) + '\n';
  txt += `Variant: ${currentVar} (${PM.variants[currentVar].label_ko})\n`;
  txt += `Emotion: ${currentEmo}\n\n`;
  QS.forEach((q, qi) => {
    const sel = document.querySelector(`input[name="q${qi}"]:checked`);
    txt += `${qi+1}. ${q}\n   → ${sel ? sel.value : '—'}\n`;
  });
  const out = document.getElementById('sum-out');
  if (out) { out.style.display = 'block'; out.textContent = txt; }
}

// ─── Boot ────────────────────────────────────────────────────
window.addEventListener('load', dtPresenceInit);
