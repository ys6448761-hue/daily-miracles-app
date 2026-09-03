/**
 * presence3.js — DreamTown Presence Engine v0.3
 *
 * 5 systems:
 *   1. Stillness Breakpoint Engine  (MASTER: 정적 → 살아나는 순간)
 *   2. Directional Motion System    (바람 방향 기반 displacement)
 *   3. Emotional Event Timeline     (감정별 레이어 타이밍 분리)
 *   4. Hand Micro Acting            (손/옷소매 미세 반응)
 *   5. Observer Camera Grammar v1   (감정적 push / observer drift)
 *
 * "캐릭터가 연기하는 영상" 이 아니라 "공간이 감정을 기억하는 영상"
 */
'use strict';

const TAU = Math.PI * 2;

// ─── Image list ───────────────────────────────────────────────
const IMAGES = [
  { label: 'Cafe — Afterflow',     path: '../../public/images/storybook/sources/page05/cafe/cafe_page05_emotional_afterflow_base.png',      hasWater: false },
  { label: 'Cafe — Reconnection',  path: '../../public/images/storybook/sources/page05/cafe/cafe_page05_reality_reconnection_base.png',     hasWater: false },
  { label: 'Cafe — Widened',       path: '../../public/images/storybook/sources/page05/cafe/cafe_page05_widened_continuation_base.png',     hasWater: false },
  { label: 'Cafe — Wish Signal',   path: '../../public/images/storybook/sources/page05/cafe/cafe_page05_wish_signal_continuation_base.png', hasWater: false },
  { label: 'Hamel — Afterflow',    path: '../../public/images/storybook/sources/page05/hamel/hamel_page05_emotional_afterflow_base.png',     hasWater: true  },
  { label: 'Hamel — Reconnection', path: '../../public/images/storybook/sources/page05/hamel/hamel_page05_reality_reconnection_base.png',    hasWater: true  },
  { label: 'Hamel — Widened',      path: '../../public/images/storybook/sources/page05/hamel/hamel_page05_widened_continuation_base.png',    hasWater: true  },
  { label: 'Hamel — Wish Signal',  path: '../../public/images/storybook/sources/page05/hamel/hamel_page05_wish_signal_continuation_base.png', hasWater: true },
];

// ─── State ────────────────────────────────────────────────────
let PG = null;
let W = 280, H = 373;
let currentVar = 'B';
let currentEmo = 'calm';
let hasWater    = false;
let playing     = true;
let startTs     = null;
let rafId       = null;
let baseLoaded  = false;

const L = { star: true, water: true, grain: true, light: true, human: true, particle: true, camera: true };

// ─── Canvas refs ──────────────────────────────────────────────
let baseCvs, humanCvs, shimCvs, partCvs, grainCvs, starCvs;
let baseCtx, humanCtx, shimCtx, partCtx, grCtx, stCtx;
let lightLayer;

// ─── Stars & particles ───────────────────────────────────────
let starPts = [];
let particles = [];

// ─── Timing ───────────────────────────────────────────────────
let lastGrainMs = 0, lastHumanMs = 0, lastPartMs = 0;
const GRAIN_FPS = 12, HUMAN_FPS = 8, PART_FPS = 24;

// ─────────────────────────────────────────────────────────────
// System 1: STILLNESS BREAKPOINT ENGINE
//   정적(still) → 깨어남(awakening) → 공명(resonance) → 잔향(afterglow)
// ─────────────────────────────────────────────────────────────

function getBreakpointCurve(tMod, bp) {
  if (tMod < bp.awaken) return 0;

  if (tMod < bp.resonate) {
    const p = (tMod - bp.awaken) / (bp.resonate - bp.awaken);
    return 0.5 - 0.5 * Math.cos(p * Math.PI); // smooth ease-in 0→1
  }

  if (tMod < bp.afterglow) {
    const p = (tMod - bp.resonate) / (bp.afterglow - bp.resonate);
    return 1.0 - 0.58 * p; // 1.0 → ~0.42 (stays elevated at afterglow entry)
  }

  // afterglow: quadratic decay back to stillness
  const p = (tMod - bp.afterglow) / (bp.cycle - bp.afterglow);
  return Math.max(0, 0.42 * (1 - p * p));
}

function getBreakpointPhase(tMod, bp) {
  if (tMod < bp.awaken)    return 'still';
  if (tMod < bp.resonate)  return 'awakening';
  if (tMod < bp.afterglow) return 'resonance';
  return 'afterglow';
}

// Layer-specific intensity with staggered delay:
// motion awakens first, then light, particles, constellation
const LAYER_AWAKEN_DELAY = { motion: 0, light: 0.4, particle: 0.9, constellation: 1.4 };

function getLayerIntensity(tMod, bp, layerName) {
  const delay = LAYER_AWAKEN_DELAY[layerName] || 0;
  const adj = { ...bp, awaken: bp.awaken + delay, resonate: bp.resonate + delay,
                afterglow: bp.afterglow + delay };
  return getBreakpointCurve(tMod, adj);
}

// ─────────────────────────────────────────────────────────────
// System 2: DIRECTIONAL MOTION SYSTEM
//   바람 방향 벡터 → 머리칼/옷 directional displacement
// ─────────────────────────────────────────────────────────────

function calcWindDisp(yNorm, t, wind, amplitudePct) {
  const rad  = wind.angle * Math.PI / 180;
  const base = wind.speed * amplitudePct;
  // Hair moves more than cloth; cloth has gravity component
  const isHair = yNorm < 0.50;
  const mult   = isHair ? 1.35 : 0.80;

  // Primary directional component (wind drives direction)
  const primaryX = Math.cos(rad) * base * mult;
  const primaryY = Math.sin(rad) * base * 0.22 * mult;

  // Turbulence: layered on primary — vertical position creates ripple
  const tb1 = Math.sin(yNorm * 5.5 + t * 0.72);
  const tb2 = Math.cos(yNorm * 3.1 + t * 1.10 + 1.3);
  const turbX = wind.turbulence * amplitudePct * (tb1 * 0.55 + tb2 * 0.25) * mult;
  const turbY = wind.turbulence * amplitudePct * tb1 * 0.10 * mult;

  return {
    dispX: (primaryX + turbX) * W / 100,
    dispY: (primaryY + turbY) * H / 100,
  };
}

// ─────────────────────────────────────────────────────────────
// System 4: HAND MICRO ACTING (integrated into drawHuman)
//   finger_pressure / cup_grip_relaxation / fingertip_tremble / sleeve_shift
//   NEVER: waving / gesture / large_movement
// ─────────────────────────────────────────────────────────────

function calcHandMicroX(y, H, t, hand, breakInt) {
  const yNorm = y / H;
  // Fingertip tremble: high freq, very tiny
  const tremble = hand.tremble   * breakInt * W * 0.003 * Math.sin(t * 9.1 + yNorm * 13.5);
  // Cup grip relaxation: slow, horizontal
  const grip    = hand.grip_relax * breakInt * W * 0.004 * Math.sin(t / hand.period * TAU + yNorm * 2.8);
  // Sleeve drift: follows cloth, slight offset
  const sleeve  = hand.sleeve    * breakInt * W * 0.004 * Math.sin(t / (hand.period * 1.25) * TAU + 2.2);
  return tremble + grip + sleeve;
}

// ─────────────────────────────────────────────────────────────
// drawHuman — combines Directional Motion + Hand Micro Acting
// ─────────────────────────────────────────────────────────────

function drawHuman(nowMs, t, amplitudePct, emo, breakInt) {
  if (nowMs - lastHumanMs < 1000 / HUMAN_FPS) return;
  lastHumanMs = nowMs;

  humanCtx.clearRect(0, 0, W, H);
  if (amplitudePct < 0.05) { dot('human', false); return; }

  let srcData;
  try { srcData = baseCtx.getImageData(0, 0, W, H); }
  catch (e) { return; }

  const dstData = humanCtx.createImageData(W, H);
  const src = srcData.data;
  const dst = dstData.data;

  const dg = PG.drift_guard;
  const topY    = Math.floor(dg.human_region.top    * H);
  const botY    = Math.floor(dg.human_region.bottom * H);
  const fadeLen = Math.floor(dg.fade_band * H);

  const hand    = emo.hand_micro;
  const hrgn    = PG.drift_guard.hand_region;
  const handTopY   = Math.floor(hrgn.top    * H);
  const handBotY   = Math.floor(hrgn.bottom * H);
  const handLeftX  = Math.floor(hrgn.left   * W);
  const handRightX = Math.floor(hrgn.right  * W);
  const inHandRegion = (y) => y >= handTopY && y < handBotY;

  for (let y = topY; y < botY; y++) {
    const yNorm = y / H;
    const dTop  = y - topY;
    const dBot  = botY - y;
    const fade  = Math.min(1, dTop / fadeLen, dBot / fadeLen);
    if (fade < 0.01) continue;

    const { dispX, dispY } = calcWindDisp(yNorm, t, emo.directional, amplitudePct);
    const handX = inHandRegion(y) ? calcHandMicroX(y, H, t, hand, breakInt) : 0;

    const shiftY = Math.round(dispY);
    const srcY   = Math.max(0, Math.min(H - 1, y - shiftY));
    const srcRow = srcY * W * 4;
    const dstRow = y   * W * 4;
    const alpha  = Math.round(fade * 255);

    for (let x = 0; x < W; x++) {
      const inHand   = inHandRegion(y) && x >= handLeftX && x < handRightX;
      const totalX   = dispX + (inHand ? handX : 0);
      const shiftX   = Math.round(totalX);
      const sx       = Math.max(0, Math.min(W - 1, x - shiftX));
      const si       = srcRow + sx * 4;
      const di       = dstRow + x  * 4;
      dst[di]   = src[si];
      dst[di+1] = src[si+1];
      dst[di+2] = src[si+2];
      dst[di+3] = alpha;
    }
  }

  humanCtx.putImageData(dstData, 0, 0);
  dot('human', true);
}

// ─────────────────────────────────────────────────────────────
// System 5: OBSERVER CAMERA GRAMMAR v1
//   emotional_push / memory_pullback / observer_drift / side_breathing
//   NEVER: fast_pan / cinematic_sweep / handheld_shake / tiktok_motion
// ─────────────────────────────────────────────────────────────

function drawCamera(t, breakInt, cam) {
  const wrapper = document.getElementById('stage-wrapper');
  if (!wrapper || !L.camera) { if (wrapper) wrapper.style.transform = ''; return; }

  if (breakInt < 0.005) { wrapper.style.transform = ''; return; }

  // Observer drift: extremely subtle lateral breathing (< 1px at B variant)
  const driftX = cam.drift_x * breakInt * Math.sin(t / cam.drift_period * TAU);
  const driftY = cam.drift_y * breakInt * Math.cos(t / (cam.drift_period * 1.45) * TAU);

  // Emotional push: barely perceptible scale (max +0.28% at peak)
  const scale  = 1 + cam.push * 0.0028 * breakInt;

  wrapper.style.transform       = `scale(${scale.toFixed(5)}) translate(${driftX.toFixed(2)}px,${driftY.toFixed(2)}px)`;
  wrapper.style.transformOrigin = '50% 38%'; // above-center focus
  wrapper.style.willChange      = 'transform';
}

// ─────────────────────────────────────────────────────────────
// P0 World Layers
// ─────────────────────────────────────────────────────────────

function drawWater(t, world, wMult) {
  shimCtx.clearRect(0, 0, W, H);
  if (!L.water || !hasWater) { dot('water', false); return; }
  const waterY = 0.55 * H;
  const opMax  = world.water_opacity_max * wMult;
  for (let b = 0; b < 4; b++) {
    const oy  = waterY + (H - waterY) * (0.08 + b * 0.22);
    const ww  = W * (0.35 + 0.45 * Math.sin(t * 0.4 + b * 1.1));
    const cx  = (W - ww) / 2 + W * 0.08 * Math.sin(t * 0.55 + b * 0.9);
    const op  = opMax * (0.70 + 0.30 * Math.sin(t * 0.85 + b * 0.7 + Math.PI));
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

function drawLight(t, world, lightInt) {
  if (!L.light) { lightLayer.style.opacity = '0'; dot('light', false); return; }
  const [loMin, loMax] = world.light_opacity;
  const baseOp = loMin + (loMax - loMin) * ((Math.sin(t / 20 * TAU) + 1) / 2);
  const op = baseOp * (0.4 + 0.6 * lightInt); // modulated by event timeline
  lightLayer.style.background =
    `radial-gradient(ellipse 65% 38% at 50% 22%,rgba(210,200,255,${op.toFixed(4)}) 0%,transparent 68%)`;
  lightLayer.style.opacity = '1';
  dot('light', true);
}

let lastGrainVal = 0.05;
function drawGrain(nowMs, world) {
  if (nowMs - lastGrainMs < 1000 / GRAIN_FPS) return;
  lastGrainMs = nowMs;
  grCtx.clearRect(0, 0, W, H);
  if (!L.grain) { dot('grain', false); return; }
  const [gMin, gMax] = world.grain_opacity;
  lastGrainVal = gMin + (gMax - gMin) * Math.random();
  const id = grCtx.createImageData(W, H);
  const d  = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 100 + ((Math.random() * 110) | 0);
    d[i] = v; d[i+1] = v; d[i+2] = v + ((Math.random() * 12) | 0);
    d[i+3] = (lastGrainVal * 255) | 0;
  }
  grCtx.putImageData(id, 0, 0);
  dot('grain', true);
}

function initStars() {
  starPts = Array.from({ length: 30 }, () => ({
    x: Math.random(), y: Math.random() * 0.55,
    phase:  Math.random() * TAU,
    period: 6 + Math.random() * 3,
    r:      1.8 + Math.random() * 2.2,
  }));
}

function drawStars(t, world, wMult, starInt) {
  stCtx.clearRect(0, 0, W, H);
  if (!L.star) { dot('star', false); return; }
  const [opMin, opMax] = world.star_opacity;
  const [pMin,  pMax]  = world.star_period;
  const starMult = 0.3 + 0.7 * starInt; // stays at 30% in stillness
  starPts.forEach(s => {
    const period = pMin + (pMax - pMin) * (s.period / 9);
    const op     = (opMin + (opMax - opMin) * ((Math.sin(t / period * TAU + s.phase) + 1) / 2)) * starMult * Math.min(1, wMult);
    const sx = s.x * W, sy = s.y * H;
    const g  = stCtx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 5);
    g.addColorStop(0,    `rgba(255,252,240,${(op * 0.38).toFixed(3)})`);
    g.addColorStop(0.35, `rgba(230,225,255,${(op * 0.13).toFixed(3)})`);
    g.addColorStop(1,    'rgba(230,225,255,0)');
    stCtx.fillStyle = g;
    stCtx.beginPath(); stCtx.arc(sx, sy, s.r * 5, 0, TAU); stCtx.fill();
  });
  dot('star', true);
}

// ─────────────────────────────────────────────────────────────
// System 3: EMOTIONAL EVENT TIMELINE — Particles
//   calm: minimal (none during still)
//   hope/resonance: sparse_upward (activated by breakpoint)
//   lonely/healing: sparse (very faint)
// ─────────────────────────────────────────────────────────────

function initParticles() {
  particles = Array.from({ length: 10 }, (_, i) => ({
    x:      0.08 + Math.random() * 0.84,
    y:      0.30 + Math.random() * 0.65,
    vy:     0.008 + Math.random() * 0.012,
    alpha:  Math.random(),
    r:      0.8 + Math.random() * 1.4,
    phase:  Math.random() * TAU,
    period: 7 + Math.random() * 8,
    driftX: (Math.random() - 0.5) * 0.004,
  }));
}

function drawParticles(nowMs, t, world, partInt) {
  if (nowMs - lastPartMs < 1000 / PART_FPS) return;
  lastPartMs = nowMs;
  partCtx.clearRect(0, 0, W, H);
  if (!L.particle || world.particles === 'minimal') { dot('particle', false); return; }
  if (partInt < 0.08) { dot('particle', false); return; }

  const dt = 1 / PART_FPS;
  particles.forEach(p => {
    p.y -= p.vy * dt * 60;
    p.x += p.driftX;
    if (p.y < 0.05) { p.y = 0.95; p.x = 0.08 + Math.random() * 0.84; }
    if (p.x < 0 || p.x > 1) p.driftX *= -1;

    const opMult = world.particles === 'sparse_upward' ? 0.18 : 0.09;
    const op = partInt * opMult * ((Math.sin(t / p.period * TAU + p.phase) + 1) / 2);
    if (op < 0.005) return;

    const px = p.x * W, py = p.y * H;
    const g  = partCtx.createRadialGradient(px, py, 0, px, py, p.r * 5);
    g.addColorStop(0,   `rgba(220,215,255,${op.toFixed(3)})`);
    g.addColorStop(0.5, `rgba(200,195,250,${(op * 0.4).toFixed(3)})`);
    g.addColorStop(1,   'rgba(200,195,250,0)');
    partCtx.fillStyle = g;
    partCtx.beginPath(); partCtx.arc(px, py, p.r * 5, 0, TAU); partCtx.fill();
  });
  dot('particle', true);
}

// ─────────────────────────────────────────────────────────────
// Image loading
// ─────────────────────────────────────────────────────────────

function loadImage(path, hw) {
  baseLoaded = false;
  hasWater   = !!hw;
  const img  = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    baseCtx.clearRect(0, 0, W, H);
    baseCtx.drawImage(img, 0, 0, W, H);
    humanCtx.clearRect(0, 0, W, H);
    baseLoaded = true;
  };
  img.onerror = () => {
    const grd = baseCtx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#04040e'); grd.addColorStop(1, '#060610');
    baseCtx.fillStyle = grd;
    baseCtx.fillRect(0, 0, W, H);
    baseCtx.fillStyle = 'rgba(80,70,120,0.25)';
    baseCtx.font = '11px sans-serif';
    baseCtx.textAlign = 'center';
    baseCtx.fillText('image not loaded', W / 2, H / 2);
    baseLoaded = true;
  };
  img.src = path;
}

function dot(name, on) {
  const el = document.getElementById('dot-' + name);
  if (el) el.classList.toggle('on', on);
}

// ─────────────────────────────────────────────────────────────
// Main loop
// ─────────────────────────────────────────────────────────────

function loop(ts) {
  if (!startTs) startTs = ts;
  const t    = (ts - startTs) / 1000;

  if (!baseLoaded || !playing) { rafId = requestAnimationFrame(loop); return; }

  const emo   = PG.emotions[currentEmo];
  const vari  = PG.variants[currentVar];
  const bp    = emo.breakpoint;
  const tMod  = t % bp.cycle;

  // ── Breakpoint (MASTER CONTROL) ──────────────────────────
  const breakInt   = getBreakpointCurve(tMod, bp);
  const phase      = getBreakpointPhase(tMod, bp);
  const motionInt  = getLayerIntensity(tMod, bp, 'motion');
  const lightInt   = getLayerIntensity(tMod, bp, 'light');
  const partInt    = getLayerIntensity(tMod, bp, 'particle');
  const starInt    = getLayerIntensity(tMod, bp, 'constellation');

  // ── Variant-scaled amplitude ──────────────────────────────
  const amplitudePct = L.human ? vari.human_motion_pct * motionInt : 0;

  // ── Draw ──────────────────────────────────────────────────
  drawCamera(t, breakInt, emo.camera);
  drawHuman(ts, t, amplitudePct, emo, motionInt);
  drawWater(t, emo.world, vari.world_multiplier);
  drawLight(t, emo.world, lightInt);
  drawGrain(ts, emo.world);
  drawStars(t, emo.world, vari.world_multiplier, starInt);
  drawParticles(ts, t, emo.world, partInt);

  // ── UI update ─────────────────────────────────────────────
  updateBreakpointUI(t, tMod, bp, phase, breakInt);
  updateLive(t, amplitudePct, phase, breakInt, emo, vari);

  rafId = requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────────────────────
// UI updates
// ─────────────────────────────────────────────────────────────

const PHASE_LABELS = {
  still: '● 정적', awakening: '◐ 깨어남', resonance: '◉ 공명', afterglow: '◌ 잔향',
};
const PHASE_COLORS = {
  still: '#1a1a30', awakening: '#304060', resonance: '#506090', afterglow: '#303050',
};

function updateBreakpointUI(t, tMod, bp, phase, intensity) {
  const el = document.getElementById('bp-phase');
  if (el) {
    el.textContent = PHASE_LABELS[phase];
    el.style.color = PHASE_COLORS[phase];
  }
  const pct = (tMod / bp.cycle * 100).toFixed(1);
  const bar = document.getElementById('bp-bar');
  if (bar) bar.style.width = pct + '%';
  const intEl = document.getElementById('bp-int');
  if (intEl) intEl.textContent = (intensity * 100).toFixed(0) + '%';

  const windEl = document.getElementById('wind-angle');
  if (windEl) {
    const emo = PG.emotions[currentEmo];
    windEl.style.transform = `rotate(${emo.directional.angle}deg)`;
  }
}

function updateLive(t, amplitudePct, phase, breakInt, emo, vari) {
  const el = document.getElementById('live-status');
  if (!el) return;
  el.textContent = [
    `t         ${t.toFixed(1)}s`,
    `variant   ${currentVar} · ${vari.label_ko}`,
    `emotion   ${currentEmo} · ${emo.label}`,
    `phase     ${phase}`,
    `breakpt   ${(breakInt * 100).toFixed(0)}%`,
    `human     ${amplitudePct > 0.05 ? amplitudePct.toFixed(2) + '%·' + (amplitudePct / 100 * W).toFixed(1) + 'px' : 'off'}`,
    `wind      ${emo.directional.angle}° spd${emo.directional.speed}`,
    `water     ${hasWater ? 'on' : 'off'}`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────
// Build UI
// ─────────────────────────────────────────────────────────────

function buildUI() {
  // Variant
  document.querySelectorAll('.vbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentVar = btn.dataset.v;
      document.querySelectorAll('.vbtn').forEach(b => b.classList.toggle('active', b.dataset.v === currentVar));
      const vari = PG.variants[currentVar];
      const desc = document.getElementById('variant-desc');
      if (desc) { desc.textContent = vari.description; desc.style.color = vari.color; }
    });
  });
  const vari0 = PG.variants[currentVar];
  const desc0 = document.getElementById('variant-desc');
  if (desc0) { desc0.textContent = vari0.description; desc0.style.color = vari0.color; }

  // Emotion
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
    opt.value = i; opt.textContent = img.label;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    const img = IMAGES[+sel.value];
    loadImage(img.path, img.hasWater);
    const wn = document.getElementById('water-note');
    if (wn) wn.textContent = img.hasWater ? '(하멜 — water layer 활성)' : '(카페 — water layer 비활성)';
  });

  // Layer toggles
  const LAYERS = [
    { id: 'star',     label: 'Star Pulse',      tier: 'P0',  new: false },
    { id: 'water',    label: 'Water Shimmer',   tier: 'P0',  new: false },
    { id: 'grain',    label: 'Air Grain',       tier: 'P0',  new: false },
    { id: 'light',    label: 'Light (event)',   tier: 'P1',  new: false },
    { id: 'human',    label: 'Human Directional', tier: 'NEW', new: true },
    { id: 'particle', label: 'Particles',       tier: 'NEW', new: true },
    { id: 'camera',   label: 'Camera Grammar',  tier: 'NEW', new: true },
  ];
  const lrows = document.getElementById('layer-rows');
  LAYERS.forEach(lyr => {
    const row = document.createElement('div');
    row.className = 'lrow';
    row.innerHTML = `<div class="ldot on" id="dot-${lyr.id}"></div>
      <span class="lname">${lyr.label}</span>
      <span class="ltier t${lyr.tier.toLowerCase().replace('/','')}">${lyr.tier}</span>
      <div class="ltog on" id="tg-${lyr.id}" data-ly="${lyr.id}"></div>`;
    row.querySelector('.ltog').addEventListener('click', e => {
      const name = e.currentTarget.dataset.ly;
      L[name] = !L[name];
      e.currentTarget.classList.toggle('on', L[name]);
      if (!L[name]) {
        const clearMap = { star: stCtx, water: shimCtx, grain: grCtx, particle: partCtx };
        if (clearMap[name]) clearMap[name].clearRect(0, 0, W, H);
        if (name === 'light') lightLayer.style.opacity = '0';
        if (name === 'human') humanCtx.clearRect(0, 0, W, H);
        if (name === 'camera') { const w = document.getElementById('stage-wrapper'); if (w) w.style.transform = ''; }
        dot(name, false);
      }
    });
    lrows.appendChild(row);
  });

  // Drift guard
  const dgEl = document.getElementById('drift-items');
  if (dgEl) {
    PG.drift_guard.never.forEach(item => {
      const d = document.createElement('div');
      d.className = 'dg-item';
      d.textContent = '✓ no ' + item.replace(/_/g, ' ');
      dgEl.appendChild(d);
    });
  }

  // Test questions
  const QS = [
    '살아 있다고 느껴졌는가?',
    '사람이 캐릭터처럼 느껴졌는가? (↑나쁨)',
    '내 감정을 투영할 여백이 있었는가?',
    '세계가 나를 위해 연기한다고 느껴졌는가? (↑나쁨)',
    '정적이 살아나는 순간이 있었는가?',
    '스토리북과 다른 체감이 있었는가?',
    '조용히 다시 보고 싶은가?',
    'A/B/C 중 DreamTown다운 것은?',
  ];
  const qaGrid = document.getElementById('qa-grid');
  if (qaGrid) {
    QS.forEach((q, qi) => {
      const row = document.createElement('div');
      row.className = 'qa-row';
      const isABC = qi === 7;
      row.innerHTML = `<div class="qtext">${qi + 1}. ${q}</div>
        <div class="qans">${isABC
          ? ['A','B','C'].map(v => `<label><input type="radio" name="q${qi}" value="${v}"> ${v}</label>`).join('')
          : `<label><input type="radio" name="q${qi}" value="yes"> 예</label>
             <label><input type="radio" name="q${qi}" value="no">  아니오</label>`
        }</div>`;
      qaGrid.appendChild(row);
    });

    const sumBtn = document.createElement('button');
    sumBtn.className = 'sum-btn';
    sumBtn.textContent = '평가 결과 요약';
    sumBtn.addEventListener('click', () => {
      let txt = 'DreamTown Presence v0.3 평가\n' + '─'.repeat(32) + '\n';
      txt += `Variant: ${currentVar} · Emotion: ${currentEmo}\n\n`;
      QS.forEach((q, qi) => {
        const sel = document.querySelector(`input[name="q${qi}"]:checked`);
        txt += `${qi + 1}. ${q}\n   → ${sel ? sel.value : '—'}\n`;
      });
      const out = document.getElementById('sum-out');
      if (out) { out.style.display = 'block'; out.textContent = txt; }
    });
    qaGrid.appendChild(sumBtn);

    const sumOut = document.createElement('pre');
    sumOut.id = 'sum-out'; sumOut.style.display = 'none';
    qaGrid.appendChild(sumOut);
  }
}

// ─────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────

async function dtPresenceV3Init() {
  const r = await fetch('./presence-grammar.json');
  PG = await r.json();
  W  = PG.stage.w;
  H  = PG.stage.h;

  const stage = document.getElementById('stage');
  stage.style.width  = W + 'px';
  stage.style.height = H + 'px';

  function mkCvs(id) {
    const c = document.getElementById(id);
    c.width = W; c.height = H;
    return c;
  }
  baseCvs  = mkCvs('base-cvs');    baseCtx  = baseCvs.getContext('2d');
  humanCvs = mkCvs('human-cvs');   humanCtx = humanCvs.getContext('2d');
  shimCvs  = mkCvs('shimmer-cvs'); shimCtx  = shimCvs.getContext('2d');
  partCvs  = mkCvs('particle-cvs'); partCtx = partCvs.getContext('2d');
  grainCvs = mkCvs('grain-cvs');   grCtx    = grainCvs.getContext('2d');
  starCvs  = mkCvs('star-cvs');    stCtx    = starCvs.getContext('2d');
  lightLayer = document.getElementById('light-layer');

  initStars();
  initParticles();
  buildUI();
  loadImage(IMAGES[0].path, false);
  rafId = requestAnimationFrame(loop);
}

window.addEventListener('load', dtPresenceV3Init);
