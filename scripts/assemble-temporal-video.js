#!/usr/bin/env node
/**
 * assemble-temporal-video.js — DreamTown Layered Temporal Engine v1
 *
 * "그림은 고정하고, 세계의 시간만 흐르게 만든다."
 *
 * 세 개의 기억이 조용히 지나가는 시간.
 * No Ken Burns. No camera zoom. No pan. P0 layers always on.
 *
 * Usage:
 *   node scripts/assemble-temporal-video.js --wish "지쳐있는 나를 보듬어주고 싶어요"
 *   node scripts/assemble-temporal-video.js --wish "..." --mode attraction_social --id wish_W01_res
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const { interpretGravity, buildSequence } = require('./assemble-miracle-video');

const ROOT     = path.join(__dirname, '..');
const OUT_BASE = path.join(ROOT, 'outputs', 'temporal-preview');

// ─────────────────────────────────────────────────────────────
// buildTemporalSequence
//   5-frame seq → 3-moment temporal spec
//   F1 = 도착, F3 = 머무름, F5 = 잔향
//   F2/F4 breathing gaps are REPLACED by pure dissolve transitions
// ─────────────────────────────────────────────────────────────

const MOMENT_ROLES = ['도착의 순간', '머무름의 순간', '잔향의 순간'];
const DURATIONS    = [12, 12, 13]; // sec per moment
const TRANS_DUR    = 2;            // dissolve duration
const ENDING_DUR   = 2;            // fade to black

function hasWater(filePath) {
  return (filePath || '').includes('hamel');
}

function buildTemporalSequence(seq5, wishId, timing = {}) {
  const f1 = seq5.frames.find(f => f.id === 'F1');
  const f3 = seq5.frames.find(f => f.id === 'F3');
  const f5 = seq5.frames.find(f => f.id === 'F5');

  // Timeline build — timing can be overridden by caller (for variant tests)
  const [d1, d2, d3] = timing.durations || DURATIONS;
  const td = timing.transitionDur != null ? timing.transitionDur : TRANS_DUR;
  const endDur = timing.endingDur != null ? timing.endingDur : ENDING_DUR;
  const m1s = 0,       m1e = d1;
  const tr1s = m1e,    tr1e = m1e + td;
  const m2s = tr1e,    m2e = tr1e + d2;
  const tr2s = m2e,    tr2e = m2e + td;
  const m3s = tr2e,    m3e = tr2e + d3;
  const ends = m3e,    ende = m3e + endDur;

  const moments = [f1, f3, f5].map((f, i) => ({
    id:             `M${i + 1}`,
    role:           MOMENT_ROLES[i],
    file:           f.file,
    emotion:        f.emotion,
    start:          [m1s, m2s, m3s][i],
    end:            [m1e, m2e, m3e][i],
    duration:       [d1, d2, d3][i],
    subtitle:       f.subtitle,
    subtitle_offset: f.subtitle_start_offset || 1,
    has_water:      hasWater(f.file),
    water_y:        hasWater(f.file) ? 0.55 : 0.88,
    sky_h:          0.55,
  }));

  return {
    wish_id:             wishId,
    wish_text:           seq5.wish_text,
    wish_type:           seq5.wish_type,
    primary_gravity:     seq5.primary_gravity,
    gem_palette:         seq5.gem_palette,
    render_mode:         seq5.render_mode,
    ratio:               seq5.ratio,
    total_duration_sec:  ende,
    method:              'layered_temporal_composition',
    moments,
    transitions: [
      { id: 'T1', start: tr1s, end: tr1e, duration: td, type: 'pure_dissolve', from_moment: 0, to_moment: 1 },
      { id: 'T2', start: tr2s, end: tr2e, duration: td, type: 'pure_dissolve', from_moment: 1, to_moment: 2 },
    ],
    ending: { start: ends, end: ende, duration: endDur, type: 'fade_to_black' },
    presence_layers: { P0: ['star_pulse', 'water_shimmer', 'air_grain'], P1_active: ['light_breathing'] },
    drift_guard: { camera_fixed: true, person_fixed: true, structure_fixed: true, ken_burns: false, cinematic_zoom: false },
    generated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// assembleTemporal
//   temporal spec → HTML5 player with P0 layers + WebM export
// ─────────────────────────────────────────────────────────────

function assembleTemporal(temporal, gravity) {
  const {
    wish_text, wish_type, primary_gravity, gem_palette, render_mode,
    total_duration_sec, moments, transitions, ending, generated_at, wish_id,
  } = temporal;

  const isAtt  = render_mode === 'attraction_social';
  const stgW   = isAtt ? 250 : 280;
  const stgH   = isAtt ? 444 : 373;
  const totalStr = `${Math.floor(total_duration_sec / 60)}:${String(total_duration_sec % 60).padStart(2, '0')}`;

  const jSpec = JSON.stringify({
    moments: moments.map(m => ({
      file: m.file, start: m.start, end: m.end,
      subtitle: m.subtitle, subOff: m.subtitle_offset,
      hasWater: m.has_water, waterY: m.water_y, skyH: m.sky_h,
      emotion: m.emotion, role: m.role,
    })),
    transitions: transitions.map(t => ({ start: t.start, end: t.end, from: t.from_moment, to: t.to_moment })),
    ending: { start: ending.start, end: ending.end },
    total: total_duration_sec,
  });

  const scores  = gravity.gravity_scores;
  const maxScore = Math.max(...Object.values(scores), 1);
  const bars = Object.entries(scores)
    .filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a)
    .map(([g, v]) => {
      const pct = Math.round(v / maxScore * 100);
      const pri = g === primary_gravity;
      return `<div class="gr ${pri ? 'p' : ''}"><span class="gn">${g}</span>`
           + `<div class="gb"><div class="gf" style="width:${pct}%"></div></div>`
           + `<span class="gv">${v}</span>${pri ? '<span class="badge">primary</span>' : ''}</div>`;
    }).join('');

  const momentRows = moments.map(m =>
    `<div class="mrow" id="mr${m.id}">
      <span class="mid">${m.id}</span>
      <span class="mrole">${m.role}</span>
      <span class="mdur">${m.duration}s</span>
      <span class="mstate" id="ms${m.id}">—</span>
    </div>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DreamTown Temporal v1 — ${wish_type} · ${render_mode}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#04040e;color:#c0bcd8;font-family:'Noto Sans KR',-apple-system,sans-serif;padding:20px}
header{text-align:center;padding:14px 0 18px;margin-bottom:20px;border-bottom:1px solid #0e0e1a}
header h1{font-size:.8rem;color:#404068;font-weight:300;letter-spacing:.12em}
.wish{font-size:1.1rem;color:#d8d4f0;margin:10px 0 5px;font-weight:300}
.meta{font-size:.65rem;color:#2a2a40}
.layout{display:flex;gap:22px;justify-content:center;align-items:flex-start;flex-wrap:wrap}
/* ─── Stage ─── */
.scol{display:flex;flex-direction:column;align-items:center;gap:8px}
#stage{
  position:relative;width:${stgW}px;height:${stgH}px;
  overflow:hidden;border-radius:12px;background:#000;
  box-shadow:0 0 60px rgba(40,30,90,.35);
}
.mimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
#shimmer-cvs,#grain-cvs,#star-cvs{
  position:absolute;inset:0;width:100%;height:100%;pointer-events:none;
}
#shimmer-cvs{mix-blend-mode:screen;z-index:2}
#light-layer{position:absolute;inset:0;z-index:3;pointer-events:none}
#grain-cvs{mix-blend-mode:soft-light;z-index:4}
#star-cvs{mix-blend-mode:screen;z-index:5}
#sub-overlay{
  position:absolute;bottom:38px;left:0;right:0;text-align:center;
  color:rgba(255,255,255,${isAtt ? .9 : .7});
  font-size:${isAtt ? '1rem' : '.85rem'};
  font-weight:${isAtt ? '400' : '300'};
  letter-spacing:.05em;padding:0 16px;
  opacity:0;transition:opacity .7s;z-index:10;
  text-shadow:0 1px 8px rgba(0,0,0,.95);
}
#sub-overlay.vis{opacity:1}
#pbar{position:absolute;top:0;left:0;right:0;height:2px;background:rgba(255,255,255,.06);z-index:20}
#pbf{height:100%;background:rgba(120,100,220,.5);width:0%;transition:width .1s linear}
#pctl{
  position:absolute;bottom:0;left:0;right:0;
  display:flex;align-items:center;justify-content:space-between;
  padding:5px 10px;background:linear-gradient(transparent,rgba(0,0,0,.7));z-index:20;
}
.pbtn{background:none;border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:50%;
  width:24px;height:24px;font-size:.6rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
.pbtn:hover{background:rgba(255,255,255,.1)}
.tdsp{font-size:.6rem;color:rgba(255,255,255,.35);font-variant-numeric:tabular-nums}
.fphase{font-size:.58rem;color:rgba(160,140,220,.6)}
.stage-note{font-size:.62rem;color:#1e1e30;text-align:center;line-height:1.7}
/* ─── Panel ─── */
.pcol{width:270px;display:flex;flex-direction:column;gap:10px}
.sec{background:#080816;border:1px solid #141428;border-radius:9px;padding:11px 13px}
.sec-t{font-size:.6rem;color:#323258;letter-spacing:.1em;font-weight:400;margin-bottom:9px}
/* Moments */
.mrow{display:flex;align-items:center;gap:7px;margin:5px 0;font-size:.7rem;padding:4px 0;border-bottom:1px solid #0c0c1a}
.mrow:last-child{border-bottom:none}
.mid{width:24px;color:#404070;font-size:.65rem;font-weight:400}
.mrole{flex:1;color:#6060a0}
.mdur{width:26px;text-align:right;color:#303060;font-size:.62rem}
.mstate{width:56px;text-align:right;font-size:.62rem;color:#282840;transition:color .3s}
.mstate.active{color:#8080d0}
.mstate.trans{color:#a070c0}
/* Gravity */
.gr{display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.68rem}
.gr.p .gn{color:#b0a0f0}
.gn{width:120px;color:#5050a0}
.gb{flex:1;height:4px;background:#101020;border-radius:2px;overflow:hidden}
.gf{height:100%;background:#303060;border-radius:2px}
.gr.p .gf{background:#7060d0}
.gv{width:16px;text-align:right;color:#303050;font-size:.6rem}
.badge{background:#181040;color:#7060c0;padding:1px 5px;border-radius:8px;font-size:.58rem;margin-left:2px}
/* Layers */
.lrow{display:flex;align-items:center;gap:7px;margin:4px 0;font-size:.7rem}
.ldot{width:5px;height:5px;border-radius:50%;background:#101020;flex-shrink:0;transition:background .4s}
.ldot.on{background:#4070a0;box-shadow:0 0 3px #2050a0}
.lname{flex:1;color:#4a4a80}
.ltier{padding:1px 5px;border-radius:3px;font-size:.58rem;flex-shrink:0}
.tp0{background:#0c1c2c;color:#2870a0}.tp1{background:#14102a;color:#5040a0}
.ltog{width:28px;height:16px;border-radius:8px;background:#0c0c1c;border:1px solid #181830;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
.ltog.on{background:#181848;border-color:#303070}
.ltog::after{content:'';position:absolute;width:10px;height:10px;border-radius:50%;background:#282860;top:2px;left:2px;transition:left .2s,background .2s}
.ltog.on::after{left:14px;background:#8080d0}
/* Drift Guard */
.dg{background:#060612;border:1px solid #1a0a10;border-radius:8px;padding:10px 13px}
.dg-t{font-size:.6rem;color:#401020;letter-spacing:.1em;margin-bottom:6px}
.dg-r{font-size:.62rem;line-height:1.85}
.ok{color:#153015}.ng{color:#b03030}
/* Live status */
.sv{font-size:.62rem;color:#202038;font-family:monospace;line-height:1.9;white-space:pre}
/* Record */
.rec-p{height:2px;background:#0c0c18;border-radius:1px;margin-top:6px;overflow:hidden;display:none}
.rec-b{height:100%;background:#503080;width:0%}
.btn{background:#0c0c1c;border:1px solid #1a1a38;color:#5050a0;border-radius:6px;padding:4px 11px;font-size:.7rem;cursor:pointer;font-family:inherit;transition:all .15s}
.btn:hover{background:#141430;color:#a0a0ff;border-color:#383880}
.btn:disabled{opacity:.35;cursor:not-allowed}
/* Philosophy */
.phil{text-align:center;padding:18px 0 10px;font-size:.68rem;color:#1e1e30;font-style:italic;line-height:1.9}
</style>
</head>
<body>
<header>
  <h1>DREAMTOWN LAYERED TEMPORAL ENGINE v1</h1>
  <div class="wish">"${wish_text}"</div>
  <div class="meta">${wish_type} · ${render_mode} · ${wish_id} · ${(generated_at || '').slice(0, 10)}</div>
</header>

<div class="layout">

  <!-- ─── Stage ─── -->
  <div class="scol">
    <div id="stage">
      ${moments.map((m, i) =>
        `<img class="mimg" id="mi${i}" src="${m.file}" alt="${m.emotion}"` +
        ` style="z-index:1${i > 0 ? ';opacity:0' : ''}"` +
        ` onerror="this.style.background='#1a0808'">`
      ).join('\n      ')}
      <canvas id="shimmer-cvs"></canvas>
      <div id="light-layer"></div>
      <canvas id="grain-cvs"></canvas>
      <canvas id="star-cvs"></canvas>
      <div id="sub-overlay"></div>
      <div id="pbar"><div id="pbf"></div></div>
      <div id="pctl">
        <button class="pbtn" id="pbtn" onclick="togglePlay()">▶</button>
        <span class="fphase" id="fphase">M1</span>
        <span class="tdsp" id="tdsp">0:00 / ${totalStr}</span>
      </div>
    </div>
    <div class="stage-note">
      camera: fixed · person: fixed · structure: fixed<br>
      P0 layers: star · water · grain · always on
    </div>
  </div>

  <!-- ─── Controls ─── -->
  <div class="pcol">

    <!-- Moments -->
    <div class="sec">
      <div class="sec-t">3 MOMENTS TIMELINE</div>
      ${momentRows}
      <div style="font-size:.6rem;color:#1c1c30;margin-top:6px">
        T1 dissolve ${transitions[0].start}s~${transitions[0].end}s ·
        T2 dissolve ${transitions[1].start}s~${transitions[1].end}s ·
        fade ${ending.start}s~${ending.end}s
      </div>
    </div>

    <!-- Gravity -->
    <div class="sec">
      <div class="sec-t">GRAVITY</div>
      <div style="font-size:1.1rem;color:#b0a8e0;font-weight:300;margin-bottom:3px">${primary_gravity}</div>
      <div style="font-size:.68rem;color:#303060;margin-bottom:8px">${wish_type} · cafe:${gem_palette.cafe || '—'} · hamel:${gem_palette.hamel || '—'}</div>
      ${bars}
    </div>

    <!-- Layers -->
    <div class="sec">
      <div class="sec-t">PRESENCE LAYERS</div>
      <div class="lrow"><div class="ldot" id="d-star"></div><span class="lname">Star Pulse</span><span class="ltier tp0">P0</span><div class="ltog on" id="tg-star" onclick="tg('star')"></div></div>
      <div class="lrow"><div class="ldot" id="d-water"></div><span class="lname">Water Shimmer</span><span class="ltier tp0">P0</span><div class="ltog on" id="tg-water" onclick="tg('water')"></div></div>
      <div class="lrow"><div class="ldot" id="d-grain"></div><span class="lname">Air Grain</span><span class="ltier tp0">P0</span><div class="ltog on" id="tg-grain" onclick="tg('grain')"></div></div>
      <div class="lrow"><div class="ldot" id="d-light"></div><span class="lname">Light Breathing</span><span class="ltier tp1">P1</span><div class="ltog on" id="tg-light" onclick="tg('light')"></div></div>
    </div>

    <!-- Live status -->
    <div class="sec">
      <div class="sec-t">LIVE</div>
      <div class="sv" id="sv">star  —\nwater —\ngrain —\nlight —</div>
    </div>

    <!-- Export -->
    <div class="sec">
      <div class="sec-t">EXPORT</div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
        <button class="btn" id="rec-btn" onclick="rec()">● Record WebM</button>
        <button class="btn" id="pbtn2" onclick="togglePlay()" style="padding:4px 8px">▶</button>
        <button class="btn" onclick="rst()" style="padding:4px 8px">↺</button>
      </div>
      <div class="rec-p" id="rec-p"><div class="rec-b" id="rec-b"></div></div>
      <div style="font-size:.6rem;color:#1e1e2e;margin-top:4px">
        MediaRecorder · composite canvas · ${total_duration_sec}s
      </div>
    </div>

    <!-- Drift guard -->
    <div class="dg">
      <div class="dg-t">DRIFT GUARD</div>
      <div class="dg-r">
        <span class="ok">✓ camera: fixed</span><br>
        <span class="ok">✓ person: fixed</span><br>
        <span class="ok">✓ structure: fixed</span><br>
        <span class="ok">✓ Ken Burns: NEVER</span><br>
        <span class="ok">✓ P0 layers: always on</span><br>
        <span class="ok">✓ transitions: pure dissolve only</span>
      </div>
    </div>

  </div>
</div>

<div class="phil">
  "그림은 고정하고, 세계의 시간만 흐르게 만든다."<br>
  DreamTown Layered Temporal Engine v1 · ${(generated_at || '').slice(0, 10)}
</div>

<script>
const S = ${jSpec};
const W = ${stgW}, H = ${stgH};

// ─── Canvas setup ───────────────────────────────────────────
const shimCvs  = document.getElementById('shimmer-cvs');
const grainCvs = document.getElementById('grain-cvs');
const starCvs  = document.getElementById('star-cvs');
const shimCtx  = shimCvs.getContext('2d');
const grCtx    = grainCvs.getContext('2d');
const stCtx    = starCvs.getContext('2d');
[shimCvs, grainCvs, starCvs].forEach(c => { c.width = W; c.height = H; });

// ─── Layer state ────────────────────────────────────────────
const L = { star: true, water: true, grain: true, light: true };

// ─── Stars ──────────────────────────────────────────────────
let starPts = [];
function initStars() {
  const skyH = 0.55;
  starPts = Array.from({ length: 30 }, () => ({
    x: Math.random(), y: Math.random() * skyH,
    phase: Math.random() * Math.PI * 2,
    period: 6 + Math.random() * 3,
    r: 1.8 + Math.random() * 2.2,
  }));
}
function drawStars(t) {
  stCtx.clearRect(0, 0, W, H);
  if (!L.star) { dot('star', false); return; }
  starPts.forEach(s => {
    const op = 0.75 + 0.25 * Math.sin(t / s.period * Math.PI * 2 + s.phase);
    const sx = s.x * W, sy = s.y * H;
    const g = stCtx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 5);
    g.addColorStop(0,    \`rgba(255,252,240,\${(op * 0.38).toFixed(3)})\`);
    g.addColorStop(0.35, \`rgba(230,225,255,\${(op * 0.13).toFixed(3)})\`);
    g.addColorStop(1,    'rgba(230,225,255,0)');
    stCtx.fillStyle = g;
    stCtx.beginPath(); stCtx.arc(sx, sy, s.r * 5, 0, Math.PI * 2); stCtx.fill();
  });
  dot('star', true);
}

// ─── Water shimmer (canvas bands) ───────────────────────────
function drawWater(t, opacities) {
  shimCtx.clearRect(0, 0, W, H);
  if (!L.water) { dot('water', false); return; }
  // Compute blended water weight across moments
  let waterWeight = 0;
  S.moments.forEach((m, i) => { if (m.hasWater) waterWeight += opacities[i]; });
  if (waterWeight < 0.01) { dot('water', false); return; }
  const waterY = S.moments.reduce((acc, m, i) =>
    m.hasWater ? acc + m.waterY * opacities[i] : acc, 0) / waterWeight;
  const yStart = Math.floor(waterY * H);

  // 4 horizontal shimmer bands that slowly shift
  for (let b = 0; b < 4; b++) {
    const oy = yStart + (H - yStart) * (0.08 + b * 0.22);
    const ww = W * (0.35 + 0.45 * Math.sin(t * 0.4 + b * 1.1));
    const cx = (W - ww) / 2 + W * 0.08 * Math.sin(t * 0.55 + b * 0.9);
    const op = (0.022 + 0.014 * Math.sin(t * 0.85 + b * 0.7 + Math.PI)) * waterWeight;
    if (op < 0.001) continue;
    const grd = shimCtx.createLinearGradient(cx, oy, cx + ww, oy);
    grd.addColorStop(0, 'rgba(160,210,240,0)');
    grd.addColorStop(0.5, \`rgba(160,210,240,\${op.toFixed(4)})\`);
    grd.addColorStop(1, 'rgba(160,210,240,0)');
    shimCtx.fillStyle = grd;
    shimCtx.fillRect(cx, oy - 2, ww, 5);
  }
  dot('water', true);
}

// ─── Air grain ──────────────────────────────────────────────
const GRAIN_MS = 1000 / 12;
let lastGrain = 0;
function drawGrain(nowMs) {
  if (nowMs - lastGrain < GRAIN_MS) return;
  lastGrain = nowMs;
  grCtx.clearRect(0, 0, W, H);
  if (!L.grain) { dot('grain', false); return; }
  const op = 0.05 + 0.025 * Math.sin(nowMs / 3800);
  const id = grCtx.createImageData(W, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 100 + ((Math.random() * 110) | 0);
    d[i] = v; d[i+1] = v; d[i+2] = v + ((Math.random() * 12) | 0);
    d[i+3] = (op * 255) | 0;
  }
  grCtx.putImageData(id, 0, 0);
  dot('grain', true);
}

// ─── Light breathing ────────────────────────────────────────
const ll = document.getElementById('light-layer');
function drawLight(t) {
  if (!L.light) { ll.style.opacity = '0'; dot('light', false); return; }
  const op = 0.025 + 0.030 * ((Math.sin(t / 20 * Math.PI * 2) + 1) / 2);
  ll.style.background = \`radial-gradient(ellipse 65% 38% at 50% 22%,rgba(210,200,255,\${op.toFixed(4)}) 0%,transparent 68%)\`;
  ll.style.opacity = '1';
  dot('light', true);
}

// ─── Opacity engine ─────────────────────────────────────────
function getOpacities(t) {
  const ops = [0, 0, 0];
  // Ending fade to black
  if (t >= S.ending.start) {
    const p = Math.min(1, (t - S.ending.start) / (S.ending.end - S.ending.start));
    ops[2] = Math.max(0, 1 - p);
    return ops;
  }
  // Transitions (pure dissolve)
  for (const tr of S.transitions) {
    if (t >= tr.start && t < tr.end) {
      const p = (t - tr.start) / (tr.end - tr.start);
      ops[tr.from] = +(1 - p).toFixed(4);
      ops[tr.to]   = +p.toFixed(4);
      return ops;
    }
  }
  // In a moment
  for (let i = 0; i < S.moments.length; i++) {
    const m = S.moments[i];
    if (t >= m.start && t < m.end) { ops[i] = 1; return ops; }
  }
  return ops;
}

// ─── Subtitle ───────────────────────────────────────────────
const subEl = document.getElementById('sub-overlay');
function updateSubtitle(t, ops) {
  // Find dominant moment
  const domIdx = ops.indexOf(Math.max(...ops));
  const dom = S.moments[domIdx];
  if (!dom || !dom.subtitle) { subEl.classList.remove('vis'); return; }
  const elapsed = t - dom.start;
  // Show from subOff to (moment_end - 1.5s before transition/ending)
  const hideAt = dom.end - 1.5;
  if (elapsed >= dom.subOff && t < hideAt) {
    subEl.textContent = dom.subtitle;
    subEl.classList.add('vis');
  } else {
    subEl.classList.remove('vis');
  }
}

// ─── Phase indicator ────────────────────────────────────────
function updatePhase(t, ops) {
  const domIdx = ops.indexOf(Math.max(...ops));
  const m = S.moments[domIdx];
  // Check if in transition
  for (const tr of S.transitions) {
    if (t >= tr.start && t < tr.end) {
      document.getElementById('fphase').textContent = 'T→';
      document.getElementById(\`msM\${tr.from + 1}\`) && (document.getElementById(\`msM\${tr.from + 1}\`).textContent = '→');
      document.getElementById(\`msM\${tr.to + 1}\`) && (document.getElementById(\`msM\${tr.to + 1}\`).textContent = '←');
      return;
    }
  }
  for (let i = 0; i < S.moments.length; i++) {
    const state = document.getElementById(\`msM\${i + 1}\`);
    if (state) state.textContent = i === domIdx ? '● 재생' : '—';
  }
  document.getElementById('fphase').textContent = m ? m.id : '—';
}

// ─── Status display ─────────────────────────────────────────
function updateStatus(t, ops) {
  const domIdx = ops.indexOf(Math.max(...ops));
  const m = S.moments[domIdx];
  let waterW = 0;
  S.moments.forEach((mn, i) => { if (mn.hasWater) waterW += ops[i]; });
  const sv = document.getElementById('sv');
  const s1 = L.star  ? \`op\${(0.75+0.25*Math.sin(t/7*Math.PI*2)).toFixed(2)}\` : 'off';
  const s2 = L.water && waterW > 0.01 ? \`wt\${waterW.toFixed(2)}\` : 'off';
  const s3 = L.grain ? \`op\${(0.05+0.025*Math.sin(t/3.8)).toFixed(3)}\` : 'off';
  const s4 = L.light ? \`op\${(0.025+0.030*((Math.sin(t/20*Math.PI*2)+1)/2)).toFixed(4)}\` : 'off';
  sv.textContent = \`star  \${s1}\\nwater \${s2}\\ngrain \${s3}\\nlight \${s4}\`;
  // Progress
  document.getElementById('pbf').style.width = Math.min(t / S.total * 100, 100) + '%';
  document.getElementById('tdsp').textContent =
    Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')+' / ${totalStr}';
  document.getElementById('elapsed') && (document.getElementById('elapsed').textContent = t.toFixed(1)+'s');
}

// ─── Main loop ──────────────────────────────────────────────
let playing = false, startTs = null, pausedSec = 0, rafId = null;

function loop(ts) {
  if (!playing) return;
  if (startTs === null) startTs = ts - pausedSec * 1000;
  const t = Math.min((ts - startTs) / 1000, S.total);

  const ops = getOpacities(t);

  // Apply opacities to moment images
  ops.forEach((op, i) => {
    const el = document.getElementById('mi' + i);
    if (el) el.style.opacity = op.toFixed(4);
  });

  drawStars(t);
  drawGrain(ts);
  drawWater(t, ops);
  drawLight(t);
  updateSubtitle(t, ops);
  updatePhase(t, ops);
  updateStatus(t, ops);

  if (t >= S.total) {
    playing = false;
    document.getElementById('pbtn').textContent = '↺';
    document.getElementById('pbtn2').textContent = '↺';
    return;
  }
  rafId = requestAnimationFrame(loop);
}

function togglePlay() {
  if (!playing && (startTs === null || (performance.now() - (startTs || performance.now())) / 1000 >= S.total)) {
    startTs = null; pausedSec = 0;
  }
  playing = !playing;
  const label = playing ? '⏸' : '▶';
  document.getElementById('pbtn').textContent = label;
  document.getElementById('pbtn2').textContent = label;
  if (playing) { startTs = null; rafId = requestAnimationFrame(loop); }
  else { cancelAnimationFrame(rafId); pausedSec = startTs !== null ? (performance.now() - startTs) / 1000 : 0; }
}

function rst() {
  cancelAnimationFrame(rafId);
  startTs = null; pausedSec = 0; playing = false;
  document.getElementById('pbtn').textContent = '▶';
  document.getElementById('pbtn2').textContent = '▶';
  getOpacities(0).forEach((op, i) => {
    const el = document.getElementById('mi' + i);
    if (el) el.style.opacity = i === 0 ? '1' : '0';
  });
  document.getElementById('pbf').style.width = '0%';
  subEl.classList.remove('vis');
}

// ─── Toggle layer ────────────────────────────────────────────
function tg(name) {
  L[name] = !L[name];
  document.getElementById('tg-' + name).classList.toggle('on', L[name]);
  if (!L[name]) dot(name, false);
}
function dot(name, alive) {
  document.getElementById('d-' + name)?.classList.toggle('on', alive);
}

// ─── WebM record ─────────────────────────────────────────────
async function rec() {
  if (!window.MediaRecorder) { alert('MediaRecorder 미지원'); return; }
  const btn = document.getElementById('rec-btn');
  const prog = document.getElementById('rec-p');
  const bar  = document.getElementById('rec-b');
  btn.disabled = true; btn.textContent = '● 녹화 중...';
  prog.style.display = 'block';

  // Composite canvas
  const rc = document.createElement('canvas');
  rc.width = W; rc.height = H;
  const rCtx = rc.getContext('2d');

  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9' : 'video/webm';
  const chunks = [];
  const stream = rc.captureStream(24);
  const mr = new MediaRecorder(stream, { mimeType: mime });

  mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  mr.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = \`dreamtown-temporal-\${S.total}s-\${Date.now()}.webm\`;
    a.click(); URL.revokeObjectURL(url);
    btn.disabled = false; btn.textContent = '● Record WebM';
    prog.style.display = 'none'; bar.style.width = '0%';
  };

  mr.start(100);
  const t0 = performance.now();
  const TOTAL_MS = S.total * 1000;

  function rframe(ts) {
    const elapsed = ts - t0;
    if (elapsed >= TOTAL_MS) { mr.stop(); return; }
    bar.style.width = (elapsed / TOTAL_MS * 100).toFixed(1) + '%';
    const t = elapsed / 1000;
    const ops = getOpacities(t);

    rCtx.clearRect(0, 0, W, H);

    // Draw moments (back to front by opacity)
    for (let i = 0; i < S.moments.length; i++) {
      if (ops[i] < 0.01) continue;
      const imgEl = document.getElementById('mi' + i);
      if (!imgEl || !imgEl.complete) continue;
      rCtx.save(); rCtx.globalAlpha = ops[i];
      try { rCtx.drawImage(imgEl, 0, 0, W, H); } catch(e) {}
      rCtx.restore();
    }

    // Light breathing
    if (L.light) {
      const op = 0.025 + 0.030 * ((Math.sin(t / 20 * Math.PI * 2) + 1) / 2);
      const grd = rCtx.createRadialGradient(W/2, H*0.22, 0, W/2, H*0.22, W*0.65);
      grd.addColorStop(0, \`rgba(210,200,255,\${op.toFixed(4)})\`);
      grd.addColorStop(1, 'rgba(210,200,255,0)');
      rCtx.fillStyle = grd; rCtx.fillRect(0, 0, W, H);
    }

    // Water shimmer (simplified for record)
    if (L.water) {
      let ww = 0;
      S.moments.forEach((m, i) => { if (m.hasWater) ww += ops[i]; });
      if (ww > 0.01) {
        rCtx.save(); rCtx.globalCompositeOperation = 'screen';
        rCtx.drawImage(shimCvs, 0, 0); rCtx.restore();
      }
    }

    // Grain
    if (L.grain) {
      rCtx.save(); rCtx.globalCompositeOperation = 'soft-light';
      rCtx.drawImage(grainCvs, 0, 0); rCtx.restore();
    }

    // Stars
    if (L.star) {
      rCtx.save(); rCtx.globalCompositeOperation = 'screen';
      rCtx.drawImage(starCvs, 0, 0); rCtx.restore();
    }

    // Subtitle
    if (subEl.classList.contains('vis') && subEl.textContent) {
      rCtx.save();
      rCtx.font = '${isAtt ? '600px' : '500px'} 16px sans-serif';
      rCtx.fillStyle = 'rgba(255,255,255,${isAtt ? .9 : .7})';
      rCtx.textAlign = 'center';
      rCtx.shadowColor = 'rgba(0,0,0,.9)';
      rCtx.shadowBlur = 6;
      rCtx.fillText(subEl.textContent, W/2, H - 50);
      rCtx.restore();
    }

    requestAnimationFrame(rframe);
  }
  requestAnimationFrame(rframe);
}

// ─── Init ────────────────────────────────────────────────────
window.addEventListener('load', () => {
  initStars();
  // Show M1 initially
  document.getElementById('mi0').style.opacity = '1';
});
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const r = { wish: null, mode: 'resonance_personal', id: null };
  for (let i = 0; i < args.length; i++) {
    if      (args[i] === '--wish' && args[i+1]) { r.wish = args[++i]; }
    else if (args[i] === '--mode' && args[i+1]) { r.mode = args[++i]; }
    else if (args[i] === '--id'   && args[i+1]) { r.id   = args[++i]; }
  }
  return r;
}

function main() {
  const { wish, mode, id } = parseArgs();

  if (!wish) {
    console.error([
      '',
      '사용법:',
      '  node scripts/assemble-temporal-video.js --wish "소원 텍스트"',
      '  node scripts/assemble-temporal-video.js --wish "..." --mode attraction_social',
      '  node scripts/assemble-temporal-video.js --wish "..." --id wish_W01_res',
      '',
    ].join('\n'));
    process.exit(1);
  }

  const VALID_MODES = ['resonance_personal', 'attraction_social'];
  const renderMode  = VALID_MODES.includes(mode) ? mode : 'resonance_personal';

  console.log('\n─────────────────────────────────────────────');
  console.log(' DreamTown Layered Temporal Engine v1');
  console.log('─────────────────────────────────────────────');
  console.log(`wish : "${wish}"`);
  console.log(`mode : ${renderMode}`);
  console.log('─────────────────────────────────────────────');

  const gravity  = interpretGravity(wish);
  const seq5     = buildSequence(gravity, renderMode, 'tmp');
  const wishId   = id || `temporal_${Date.now()}`;
  const temporal = buildTemporalSequence(seq5, wishId);

  console.log('\n[1] interpretGravity');
  console.log(`  wish_type   : ${gravity.wish_type}`);
  console.log(`  gravity     : ${gravity.primary_gravity}`);

  console.log('\n[2] buildTemporalSequence');
  temporal.moments.forEach(m => {
    console.log(`  ${m.id} ${m.role} : ${m.start}s–${m.end}s [${m.emotion}] hasWater:${m.has_water}`);
  });
  console.log(`  total       : ${temporal.total_duration_sec}s`);

  const outDir = path.join(OUT_BASE, wishId);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, 'temporal.json');
  const htmlPath = path.join(outDir, 'index.html');

  fs.writeFileSync(jsonPath, JSON.stringify(temporal, null, 2), 'utf-8');
  fs.writeFileSync(htmlPath, assembleTemporal(temporal, gravity), 'utf-8');

  console.log('\n[3] Output');
  console.log(`  temporal.json : ${jsonPath}`);
  console.log(`  index.html    : ${htmlPath}`);
  console.log('\n✅ 완료');
  console.log(`   http://localhost:8080/outputs/temporal-preview/${wishId}/index.html`);
  console.log('─────────────────────────────────────────────\n');
}

if (require.main === module) {
  main();
} else {
  module.exports = { buildTemporalSequence, assembleTemporal };
}
