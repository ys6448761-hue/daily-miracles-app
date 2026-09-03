#!/usr/bin/env node
/**
 * compose-temporal-rhythm.js — DreamTown Temporal Rhythm Composer v1
 *
 * "DreamTown은 움직임을 편집하지 않는다. 시간의 호흡을 작곡한다."
 *
 * Generates 3 variant temporal previews (A/B/C) + comparison HTML.
 *
 * Usage:
 *   node scripts/compose-temporal-rhythm.js
 *   node scripts/compose-temporal-rhythm.js --wish "소원 텍스트"
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const { interpretGravity, buildSequence }         = require('./assemble-miracle-video');
const { buildTemporalSequence, assembleTemporal } = require('./assemble-temporal-video');

const ROOT     = path.join(__dirname, '..');
const OUT_BASE = path.join(ROOT, 'outputs', 'temporal-rhythm');

// ─────────────────────────────────────────────────────────────
// Variant definitions
// ─────────────────────────────────────────────────────────────

const VARIANTS = [
  {
    id:    'A',
    label: 'Freeze Risk',
    label_ko: '정지 위험',
    color: '#6030a0',
    timing: {
      durations:     [18, 18, 18],
      transitionDur: 4,
      endingDur:     2,
    },
    risk: ['static_slide_feeling', 'temporal_stagnation'],
    description: '18s moment / 4s dissolve — 장면이 너무 오래 머물러 슬라이드처럼 느껴질 위험',
  },
  {
    id:    'B',
    label: 'Current Baseline',
    label_ko: '현재 기준선',
    color: '#2060a0',
    timing: {
      durations:     [12, 12, 13],
      transitionDur: 2,
      endingDur:     2,
    },
    risk: [],
    description: '12-13s moment / 2s dissolve — 현재 가장 유력한 DreamTown temporal breathing',
  },
  {
    id:    'C',
    label: 'Cinematic Risk',
    label_ko: '시네마틱 위험',
    color: '#a03020',
    timing: {
      durations:     [5, 5, 7],
      transitionDur: 1,
      endingDur:     2,
    },
    risk: ['MV_feeling', 'editing_rhythm', 'cinematic_drift'],
    description: '5-7s moment / 1s dissolve — 빠른 전환으로 영상 편집 리듬처럼 느껴질 위험',
  },
];

// ─────────────────────────────────────────────────────────────
// buildComparisonHtml
// ─────────────────────────────────────────────────────────────

function buildComparisonHtml(variants, wish, variantMeta) {
  const evalQuestions = [
    '시간이 흐르는가?',
    '압박감 없는가?',
    '영상처럼 느껴지는가?',
    '슬라이드처럼 느껴지는가?',
    '기억이 지나가는 느낌이 있는가?',
    '감정이 머무를 공간이 있는가?',
  ];

  const variantCols = variants.map(v => {
    const meta = variantMeta[v.id];
    const totalSec = meta.total;
    const totalStr = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;
    const riskHtml = v.risk.length
      ? v.risk.map(r => `<span class="risk">${r}</span>`).join('')
      : `<span class="ok">위험 없음</span>`;
    return `
    <div class="vcol" id="vc${v.id}">
      <div class="vhdr" style="border-color:${v.color}">
        <div class="vlabel" style="color:${v.color}">Variant ${v.id}</div>
        <div class="vname">${v.label}</div>
        <div class="vname-ko">${v.label_ko}</div>
      </div>
      <div class="vtiming">
        <div class="trow"><span class="tk">moment</span><span class="tv">${v.timing.durations.join(' / ')}s</span></div>
        <div class="trow"><span class="tk">dissolve</span><span class="tv">${v.timing.transitionDur}s</span></div>
        <div class="trow"><span class="tk">fade out</span><span class="tv">${v.timing.endingDur}s</span></div>
        <div class="trow ttotal"><span class="tk">total</span><span class="tv">${totalSec}s (${totalStr})</span></div>
      </div>
      <div class="vrisk">${riskHtml}</div>
      <div class="vdesc">${v.description}</div>
      <iframe src="variant_${v.id}/index.html" class="vframe" loading="lazy"></iframe>
      <div class="eval-col">
        ${evalQuestions.map((q, qi) => `
        <div class="erow">
          <div class="eq">${qi + 1}. ${q}</div>
          <div class="eans">
            <label><input type="radio" name="q${qi}_${v.id}" value="yes"> 예</label>
            <label><input type="radio" name="q${qi}_${v.id}" value="no">  아니오</label>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DreamTown Temporal Rhythm — A/B/C Comparison</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#03030c;color:#b0acd0;font-family:'Noto Sans KR',-apple-system,sans-serif;padding:24px 20px}
header{text-align:center;padding:16px 0 22px;border-bottom:1px solid #0c0c1c;margin-bottom:28px}
header h1{font-size:.75rem;color:#303050;letter-spacing:.15em;font-weight:300}
header .wish{font-size:1.05rem;color:#d0ccec;font-weight:300;margin:10px 0 5px}
header .sub{font-size:.62rem;color:#202038}
.grid{display:flex;gap:20px;justify-content:center;align-items:flex-start;flex-wrap:wrap}
.vcol{width:320px;display:flex;flex-direction:column;gap:10px}
.vhdr{border-left:3px solid #303060;padding:8px 12px;background:#06060f}
.vlabel{font-size:.58rem;letter-spacing:.12em;font-weight:400;margin-bottom:2px}
.vname{font-size:.9rem;color:#d0ccec;font-weight:300}
.vname-ko{font-size:.65rem;color:#404070;margin-top:2px}
.vtiming{background:#080814;border:1px solid #101020;border-radius:7px;padding:9px 11px}
.trow{display:flex;justify-content:space-between;font-size:.68rem;padding:3px 0;border-bottom:1px solid #0a0a18}
.trow:last-child{border-bottom:none}
.ttotal{font-size:.72rem;margin-top:4px;padding-top:6px;border-top:1px solid #181830 !important}
.tk{color:#303058}.tv{color:#8080c0;font-variant-numeric:tabular-nums}
.vrisk{display:flex;flex-wrap:wrap;gap:5px;padding:6px 0 2px}
.risk{background:#1a0810;color:#a04060;padding:2px 7px;border-radius:10px;font-size:.6rem;border:1px solid #301020}
.ok{color:#305030;font-size:.62rem;padding:2px 0}
.vdesc{font-size:.65rem;color:#252548;line-height:1.7;padding:4px 0}
.vframe{width:100%;height:460px;border:1px solid #101020;border-radius:10px;background:#000}
.eval-col{background:#060610;border:1px solid #0e0e1c;border-radius:8px;padding:11px 13px}
.erow{margin:6px 0;padding-bottom:6px;border-bottom:1px solid #0a0a18}
.erow:last-child{border-bottom:none}
.eq{font-size:.68rem;color:#4848a0;margin-bottom:4px}
.eans{display:flex;gap:14px;font-size:.65rem}
.eans label{display:flex;align-items:center;gap:4px;cursor:pointer;color:#303060}
.eans label:has(input:checked){color:#a0a0f0}
.eans input{accent-color:#6060d0;cursor:pointer}
.philosophy{text-align:center;padding:28px 0 12px;font-size:.65rem;color:#191930;font-style:italic;line-height:2}
.legend{display:flex;justify-content:center;gap:20px;margin:16px 0;flex-wrap:wrap}
.lg{display:flex;align-items:center;gap:6px;font-size:.65rem;color:#303058}
.lgd{width:10px;height:10px;border-radius:2px}
.summary-btn{background:#0c0c1c;border:1px solid #1a1a38;color:#5050a0;border-radius:6px;padding:6px 16px;
  font-size:.7rem;cursor:pointer;font-family:inherit;display:block;margin:10px auto}
.summary-btn:hover{background:#141430;color:#a0a0f0}
#summary-out{background:#060610;border:1px solid #101020;border-radius:8px;padding:14px;
  font-size:.68rem;color:#9090c0;white-space:pre;line-height:1.8;display:none;margin-top:16px}
</style>
</head>
<body>
<header>
  <h1>DREAMTOWN TEMPORAL RHYTHM COMPOSER v1 — A/B/C COMPARISON</h1>
  <div class="wish">"${wish}"</div>
  <div class="sub">시간이 조용히 지나간 느낌이어야 한다 · 영상처럼 잘 편집된 느낌이 아니라</div>
</header>

<div class="legend">
${VARIANTS.map(v => `  <div class="lg"><div class="lgd" style="background:${v.color}"></div>Variant ${v.id} — ${v.label}</div>`).join('\n')}
</div>

<div class="grid">
${variantCols}
</div>

<button class="summary-btn" onclick="showSummary()">Aurora5 평가 결과 요약 보기</button>
<div id="summary-out"></div>

<div class="philosophy">
  "DreamTown은 움직임을 편집하지 않는다. 시간의 호흡을 작곡한다."<br>
  Temporal Rhythm Composer v1 · ${new Date().toISOString().slice(0, 10)}
</div>

<script>
const QUESTIONS = ${JSON.stringify(evalQuestions)};
const VARIANTS_META = ${JSON.stringify(variants.map(v => ({ id: v.id, label: v.label, label_ko: v.label_ko })))};

function showSummary() {
  const out = document.getElementById('summary-out');
  out.style.display = 'block';
  let txt = 'Aurora5 평가 요약\\n' + '─'.repeat(40) + '\\n\\n';
  VARIANTS_META.forEach(vm => {
    txt += 'Variant ' + vm.id + ' — ' + vm.label + '\\n';
    QUESTIONS.forEach((q, qi) => {
      const yes = document.querySelector('input[name="q' + qi + '_' + vm.id + '"][value="yes"]');
      const no  = document.querySelector('input[name="q' + qi + '_' + vm.id + '"][value="no"]');
      const ans = yes?.checked ? '✓ 예' : no?.checked ? '✗ 아니오' : '—';
      txt += '  ' + (qi + 1) + '. ' + q + ' → ' + ans + '\\n';
    });
    txt += '\\n';
  });
  out.textContent = txt;
}
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const r = { wish: '지쳐있는 나를 보듬어주고 싶어요', mode: 'resonance_personal', id: null };
  for (let i = 0; i < args.length; i++) {
    if      (args[i] === '--wish' && args[i+1]) { r.wish = args[++i]; }
    else if (args[i] === '--mode' && args[i+1]) { r.mode = args[++i]; }
    else if (args[i] === '--id'   && args[i+1]) { r.id   = args[++i]; }
  }
  return r;
}

function main() {
  const { wish, mode, id } = parseArgs();
  const VALID_MODES = ['resonance_personal', 'attraction_social'];
  const renderMode  = VALID_MODES.includes(mode) ? mode : 'resonance_personal';
  const baseId      = id || `rhythm_${Date.now()}`;

  console.log('\n═════════════════════════════════════════════════');
  console.log(' DreamTown Temporal Rhythm Composer v1');
  console.log('═════════════════════════════════════════════════');
  console.log(`wish : "${wish}"`);
  console.log(`mode : ${renderMode}`);
  console.log('─────────────────────────────────────────────────');

  // Gravity + 5-frame sequence (shared across all variants)
  const gravity = interpretGravity(wish);
  const seq5    = buildSequence(gravity, renderMode, 'tmp');

  console.log(`\n[gravity]  ${gravity.wish_type} · ${gravity.primary_gravity}`);
  console.log('─────────────────────────────────────────────────');

  const variantMeta = {};

  // Generate each variant
  VARIANTS.forEach(v => {
    console.log(`\n[Variant ${v.id}] ${v.label} (${v.label_ko})`);
    console.log(`  moment: ${v.timing.durations.join('/')}s  dissolve: ${v.timing.transitionDur}s`);

    const wishId  = `${baseId}_V${v.id}`;
    const temporal = buildTemporalSequence(seq5, wishId, v.timing);
    const html     = assembleTemporal(temporal, gravity);

    const outDir = path.join(OUT_BASE, `variant_${v.id}`);
    fs.mkdirSync(outDir, { recursive: true });

    const jsonPath = path.join(outDir, 'temporal.json');
    const htmlPath = path.join(outDir, 'index.html');
    fs.writeFileSync(jsonPath, JSON.stringify(temporal, null, 2), 'utf8');
    fs.writeFileSync(htmlPath, html, 'utf8');

    variantMeta[v.id] = { total: temporal.total_duration_sec };

    console.log(`  total: ${temporal.total_duration_sec}s`);
    console.log(`  → ${htmlPath}`);
  });

  // Generate comparison HTML
  console.log('\n[comparison] building comparison.html ...');
  const compHtml = buildComparisonHtml(VARIANTS, wish, variantMeta);
  const compPath = path.join(OUT_BASE, 'comparison.html');
  fs.writeFileSync(compPath, compHtml, 'utf8');
  console.log(`  → ${compPath}`);

  // Summary
  console.log('\n─────────────────────────────────────────────────');
  console.log('✅ 완료\n');
  console.log('Variant 요약:');
  VARIANTS.forEach(v => {
    const d = v.timing.durations;
    const t = d[0] + d[1] + d[2] + v.timing.transitionDur * 2 + v.timing.endingDur;
    const risk = v.risk.length ? `⚠ ${v.risk.join(', ')}` : '✓ 위험 없음';
    console.log(`  ${v.id}: ${d.join('/')}s + ${v.timing.transitionDur}s dissolve = ${t}s   ${risk}`);
  });
  console.log('\n시청 평가:');
  console.log(`  http://localhost:8080/outputs/temporal-rhythm/comparison.html`);
  console.log('═════════════════════════════════════════════════\n');
}

main();
