#!/usr/bin/env node
/**
 * assemble-miracle-video.js — DreamTown Wish-to-Preview Pipeline v1
 *
 * STATUS: Legacy Preview (2026-07-09) — 폐기 아님, 사용 중지 아님.
 * DreamTown Core Story Engine(SSOT-ENGINE-001/002)의 4P Master Asset 구조와는
 * 별개의 5-프레임 "중력(감정)" 체계이며, 사용자 사진/Identity Lock을 사용하지 않는다.
 * 신규 4P 기반 기적영상과 통합하기 전까지 scripts/legacy/에 분리 보관한다.
 * 상세: docs/reports/REPORT-Legacy_Video_Frame_System.md
 *
 * wish_text → interpretGravity → buildSequence → preview.html
 *
 * Usage:
 *   node scripts/assemble-miracle-video.js --wish "지쳐있는 나를 보듬어주고 싶어요"
 *   node scripts/assemble-miracle-video.js --wish "새로운 일을 시작해보고 싶어요" --mode attraction_social
 *   node scripts/assemble-miracle-video.js --wish "..." --id wish_001 --mode resonance_personal
 *
 * Constraints:
 *   - No AI image generation (existing assets only)
 *   - No external API calls
 *   - No new copy generation (SSOT subtitle_map only)
 *   - LLM freeform 금지 — keyword matching + heuristics only
 *
 * Output: outputs/auto-preview/{wish_id}/sequence.json + preview.html
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..', '..'); // scripts/legacy/ -> scripts/ -> repo root
const RULES_PATH = path.join(ROOT, 'outputs', 'gravity-interpreter', 'interpreter-rules.json');
const OUT_BASE   = path.join(ROOT, 'outputs', 'auto-preview');

// world-canvas 라우팅 (miracle F1 전용)
// star-cache 충돌 없음 — F1만 교체, F2/F4 breathing gap 현행 유지
const worldCanvas = (() => {
  try { return require('../../services/worldCanvasService'); }
  catch (_) { return null; }
})();

// ─────────────────────────────────────────────────────────────
// 1. interpretGravity
//    wish_text → gravity analysis (keyword scoring + tiebreak)
// ─────────────────────────────────────────────────────────────

const GRAVITY_TO_TYPE = {
  pause:                '위로형',
  curiosity:            '결심형',
  calm:                 '회복형',
  reality_reconnection: '관계형',
  confusion:            '불안형',
  fragile_hope:         '희망형',
  emotional_afterflow:  '위로형',
};

const STRUCTURAL_GRAVITIES = ['emotional_afterflow', 'reality_reconnection'];

// wish_type별 gem_palette 확정값 (gravity-engine.json + W1–W3 sequence.json 검증 기준)
// interpreter-rules.json의 gravity→gem보다 wish_type→gem이 우선 (더 구체적)
const WISH_TYPE_GEM = {
  '위로형': { cafe: 'citrine',   hamel: 'diamond' },
  '결심형': { cafe: 'citrine',   hamel: 'topaz' },
  '회복형': { cafe: 'sapphire',  hamel: 'emerald' },
  '관계형': { cafe: null,        hamel: null },       // page05 고정 자산
  '불안형': { cafe: 'moonstone', hamel: 'moonstone' },
  '희망형': { cafe: 'diamond',   hamel: 'diamond' },
};

function interpretGravity(wishText) {
  const rules = JSON.parse(fs.readFileSync(RULES_PATH, 'utf-8'));

  // Step 1 — keyword scoring
  const scores = {};
  for (const g of rules._gravity_types) scores[g] = 0;

  const matchedKeywords = [];
  for (const rule of rules.keyword_gravity_rules) {
    if (wishText.includes(rule.keyword)) {
      scores[rule.gravity] += rule.weight;
      matchedKeywords.push({ keyword: rule.keyword, gravity: rule.gravity, weight: rule.weight });
    }
  }

  // Step 2 — future signal heuristic (curiosity +1, fragile_hope +1)
  const futureMatches = [];
  for (const kw of rules.future_signal_heuristic.keywords) {
    if (wishText.includes(kw)) {
      scores.curiosity      += 1;
      scores.fragile_hope   += 1;
      futureMatches.push(kw);
    }
  }

  // Step 3 — primary gravity selection (structural types excluded)
  const candidates = Object.entries(scores)
    .filter(([g]) => !STRUCTURAL_GRAVITIES.includes(g))
    .sort(([, a], [, b]) => b - a);

  const topScore = candidates[0]?.[1] ?? 0;
  let primaryGravity, wishType, tiebreakApplied = false;

  if (topScore === 0) {
    primaryGravity = 'fragile_hope';
    wishType       = '희망형';
  } else {
    const tied = candidates.filter(([, s]) => s === topScore);
    if (tied.length > 1) {
      tiebreakApplied = true;
      const inferredType = GRAVITY_TO_TYPE[tied[0][0]];
      const tiebreakFavor = rules.type_heuristics[inferredType]?.tiebreak_favor;
      const tiedNames = tied.map(([g]) => g);
      primaryGravity = (tiebreakFavor && tiedNames.includes(tiebreakFavor))
        ? tiebreakFavor
        : tied[0][0];
    } else {
      primaryGravity = candidates[0][0];
    }
    wishType = GRAVITY_TO_TYPE[primaryGravity];
  }

  const palette   = rules.gravity_palette_map[primaryGravity];
  const location  = rules.gravity_location_map[primaryGravity];
  const renderFit = rules.gravity_render_fit[primaryGravity];
  const secondary = candidates.find(([g, s]) => g !== primaryGravity && s > 0)?.[0] ?? null;

  // wish_type별 gem 확정값 우선 적용 (위로형=diamond, 결심형=topaz 등)
  const gemOverride = WISH_TYPE_GEM[wishType];
  const gem_palette = gemOverride || { cafe: palette.cafe_gem, hamel: palette.hamel_gem };

  return {
    wish_text:        wishText,
    wish_type:        wishType,
    primary_gravity:  primaryGravity,
    secondary_gravity: secondary,
    gravity_scores:   scores,
    matched_keywords: matchedKeywords,
    future_matches:   futureMatches,
    tiebreak_applied: tiebreakApplied,
    gem_palette,
    lead_location:    location.primary,
    render_fit:       renderFit,
    palette_color:    palette.color,
    recommended_mode: renderFit.resonance >= renderFit.attraction
      ? 'resonance_personal'
      : 'attraction_social',
    fallback: topScore === 0,
  };
}

// ─────────────────────────────────────────────────────────────
// 2. buildSequence
//    gravity result → 5-frame sequence.json
// ─────────────────────────────────────────────────────────────

const WISH_TYPE_FRAME_SET = {
  '위로형': 'W1',
  '결심형': 'W2',
  '회복형': 'W3',
  '관계형': 'W1',  // v1 fallback: no dedicated 관계형 frame set
  '불안형': 'W3',  // recovery path; F5 overridden to fragile_hope
  '희망형': 'W1',  // fragile_hope dominant
};

const FRAME_FILES = {
  W1: { F1: 'F1_pause_cafe.png',    F2: 'F2_afterflow_cafe.png', F3: 'F3_calm_cafe.png',
        F4: 'F4_reconnection_hamel.png', F5: 'F5_fragile_hope_hamel.png' },
  W2: { F1: 'F1_curiosity_cafe.png', F2: 'F2_afterflow_cafe.png', F3: 'F3_calm_cafe.png',
        F4: 'F4_reconnection_hamel.png', F5: 'F5_curiosity_hamel.png' },
  W3: { F1: 'F1_pause_cafe.png',    F2: 'F2_afterflow_cafe.png', F3: 'F3_calm_cafe.png',
        F4: 'F4_reconnection_hamel.png', F5: 'F5_calm_hamel.png' },
};

const SUBTITLE_MAP = {
  '위로형': {
    F1: { copy: '#9',  text: '오늘의 마음을 이 밤에 남겨둘게요' },
    F3: { copy: '#11', text: '마음이 조금 가벼워졌다면 좋겠어요' },
    F5: { copy: '#2',  text: '작은 소원 하나가 밤하늘에 남았어요' },
  },
  '결심형': {
    F1: { copy: '#13', text: '오늘의 용기를 별에 담아두었어요' },
    F3: { copy: '#6',  text: '조금은 믿고 싶어졌어요' },
    F5: { copy: '#17', text: '작은 빛 하나가 길이 되어줄 거예요' },
  },
  '회복형': {
    F1: { copy: '#8',  text: '별빛은 아주 작은 마음에서 시작돼요' },
    F3: { copy: '#11', text: '마음이 조금 가벼워졌다면 좋겠어요' },
    F5: { copy: '#7',  text: '당신의 오늘도 충분히 반짝였어요' },
  },
  '관계형': {
    F1: { copy: '#9',  text: '오늘의 마음을 이 밤에 남겨둘게요' },
    F3: { copy: '#11', text: '마음이 조금 가벼워졌다면 좋겠어요' },
    F5: { copy: '#2',  text: '작은 소원 하나가 밤하늘에 남았어요' },
  },
  '불안형': {
    F1: { copy: '#8',  text: '별빛은 아주 작은 마음에서 시작돼요' },
    F3: { copy: '#11', text: '마음이 조금 가벼워졌다면 좋겠어요' },
    F5: { copy: '#2',  text: '작은 소원 하나가 밤하늘에 남았어요' },
  },
  '희망형': {
    F1: { copy: '#6',  text: '조금은 믿고 싶어졌어요' },
    F3: { copy: '#11', text: '마음이 조금 가벼워졌다면 좋겠어요' },
    F5: { copy: '#17', text: '작은 빛 하나가 길이 되어줄 거예요' },
  },
};

const GRAVITY_SEQUENCES = {
  '위로형': ['pause',              'emotional_afterflow', 'calm', 'reality_reconnection', 'fragile_hope'],
  '결심형': ['curiosity',          'emotional_afterflow', 'calm', 'reality_reconnection', 'curiosity'],
  '회복형': ['pause',              'emotional_afterflow', 'calm', 'reality_reconnection', 'calm'],
  '관계형': ['reality_reconnection','emotional_afterflow', 'calm', 'reality_reconnection', 'fragile_hope'],
  '불안형': ['confusion',          'emotional_afterflow', 'calm', 'reality_reconnection', 'fragile_hope'],
  '희망형': ['fragile_hope',       'emotional_afterflow', 'calm', 'reality_reconnection', 'fragile_hope'],
};

const RENDER_SPECS = {
  resonance_personal: {
    total_sec: 30,
    durations:        [5, 5, 5, 5, 10],
    subtitle_offset:  1.0,
    subtitle_opacity: 0.7,
    subtitle_weight:  'thin',
    dissolve_sec:     1.0,
    kb_speed:         0.3,
    ratio:            '3:4',
    breathing_gap:    '40%',
    viewer_intent:    'emotional_residue',
  },
  attraction_social: {
    total_sec: 21,
    durations:        [4, 3, 3, 3, 8],
    subtitle_offset:  0.3,
    subtitle_opacity: 0.9,
    subtitle_weight:  'regular',
    dissolve_sec:     0.7,
    kb_speed:         0.4,
    ratio:            '9:16',
    breathing_gap:    '28.5%',
    viewer_intent:    'save_share_follow',
  },
};

const FRAME_MOTIONS = {
  F1: (spec) => ({ type: 'ken_burns',          direction: 'top_to_bottom', speed: spec.kb_speed }),
  F2: ()     => ({ type: 'still',                                           speed: 0 }),
  F3: (spec) => ({ type: 'dissolve_still',     dissolve_sec: spec.dissolve_sec, speed: 0 }),
  F4: (spec) => ({ type: 'dissolve_pan',       direction: 'left_to_right', dissolve_sec: spec.dissolve_sec, speed: spec.kb_speed }),
  F5: (spec) => ({ type: 'dissolve_fadeout',   dissolve_sec: spec.dissolve_sec, fadeout_sec: 2, speed: 0 }),
};

function buildSequence(gravity, renderMode = 'resonance_personal', wishId) {
  const { wish_type: wt, primary_gravity: pg, gem_palette, wish_text } = gravity;
  const spec      = RENDER_SPECS[renderMode];
  const frameSet  = WISH_TYPE_FRAME_SET[wt] || 'W1';
  const files     = FRAME_FILES[frameSet];
  const subtitles = SUBTITLE_MAP[wt] || SUBTITLE_MAP['위로형'];
  const gravSeq   = GRAVITY_SEQUENCES[wt] || GRAVITY_SEQUENCES['위로형'];

  // confusion F5 override → W1 fragile_hope frame (EMOT-TRANS-001 §1-4)
  const f5Override = (wt === '불안형')
    ? '../../wish-render-prototype/W1/frames/F5_fragile_hope_hamel.png'
    : null;

  // world-canvas F1 override: miracle 첫 프레임은 세계 와이드샷 우선
  // 이미지 미존재 시 기존 wish-render-prototype fallback 유지 → star-cache 충돌 없음
  const f1WorldCanvas = worldCanvas
    ? worldCanvas.getMiracleF1Image(wt, pg, '../../../')
    : null;

  let elapsed = 0;
  const frames = ['F1','F2','F3','F4','F5'].map((fid, i) => {
    const dur   = spec.durations[i];
    const start = elapsed;
    elapsed += dur;
    const isGap = (fid === 'F2' || fid === 'F4');
    const sub   = isGap ? null : subtitles[fid];

    let imgSrc;
    if      (fid === 'F1' && f1WorldCanvas) imgSrc = f1WorldCanvas;   // world-canvas 우선
    else if (fid === 'F2') imgSrc = '../../../public/images/storybook/sources/page05/cafe/cafe_page05_emotional_afterflow_base.png';
    else if (fid === 'F4') imgSrc = '../../../public/images/storybook/sources/page05/hamel/hamel_page05_reality_reconnection_base.png';
    else if (fid === 'F5' && f5Override) imgSrc = f5Override;
    else imgSrc = `../../wish-render-prototype/${frameSet}/frames/${files[fid]}`;

    return {
      id:                   fid,
      index:                i + 1,
      emotion:              gravSeq[i],
      file:                 imgSrc,
      timing:               { start, end: start + dur, duration: dur },
      subtitle:             sub ? sub.text : null,
      subtitle_copy:        sub ? sub.copy : null,
      subtitle_start_offset: sub ? spec.subtitle_offset : null,
      breathing_gap:        isGap,
      motion:               FRAME_MOTIONS[fid](spec),
    };
  });

  return {
    wish_id:           wishId,
    wish_text,
    wish_type:         wt,
    primary_gravity:   pg,
    gem_palette,
    render_mode:       renderMode,
    total_duration_sec: spec.total_sec,
    ratio:             spec.ratio,
    emotion_arc:       gravSeq,
    auto_generated:    true,
    generated_at:      new Date().toISOString(),
    frame_set_source:       `wish-render-prototype/${frameSet}`,
    confusion_f5_override:  wt === '불안형',
    f1_world_canvas:        !!f1WorldCanvas,
    f1_source:              f1WorldCanvas ? 'world-canvas' : 'wish-render-prototype',
    render_spec: {
      ratio:                spec.ratio,
      breathing_gap_ratio:  spec.breathing_gap,
      subtitle_opacity:     spec.subtitle_opacity,
      subtitle_weight:      spec.subtitle_weight,
      viewer_intent:        spec.viewer_intent,
      new_ai_images:        0,
    },
    frames,
  };
}

// ─────────────────────────────────────────────────────────────
// 3. assemblePreview — HTML5 animation player
// ─────────────────────────────────────────────────────────────

function assemblePreview(seq, gravity) {
  const {
    render_mode, frames, total_duration_sec, ratio,
    wish_text, wish_type, primary_gravity, gem_palette,
    emotion_arc, generated_at, wish_id, frame_set_source,
    confusion_f5_override,
  } = seq;

  const isAttraction = render_mode === 'attraction_social';
  const spec         = RENDER_SPECS[render_mode];
  const rf           = gravity.render_fit;
  const scores       = gravity.gravity_scores;
  const matched      = gravity.matched_keywords;

  // ── gravity score bars ──
  const maxScore = Math.max(...Object.values(scores), 1);
  const bars = Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([g, v]) => {
      const pct = Math.round((v / maxScore) * 100);
      const isPrimary = g === primary_gravity;
      return `<div class="sr ${isPrimary ? 'prim' : ''}">
        <span class="gn">${g}</span>
        <div class="gb"><div class="gf" style="width:${pct}%"></div></div>
        <span class="gv">${v}</span>
        ${isPrimary ? '<span class="badge">primary</span>' : ''}
      </div>`;
    }).join('\n');

  // ── frame strip cards ──
  const strip = frames.map((f, i) => {
    const isGap = f.breathing_gap;
    return `<div class="fc ${isGap ? 'gap' : ''}">
      <div class="fi">
        <img src="${f.file}" alt="${f.id}" loading="lazy" onerror="this.closest('.fc')?.classList.add('img-err')">
        ${f.subtitle ? `<div class="fsub">${f.subtitle}</div>` : ''}
        <div class="flbl">${f.id} · ${f.emotion}</div>
      </div>
      <div class="fm">
        <span class="tag">${f.timing.start}s–${f.timing.end}s</span>
        <span class="tag">${f.motion.type.replace('_',' ')}</span>
        ${f.subtitle_copy ? `<span class="tag cp">${f.subtitle_copy}</span>` : '<span class="tag dim">—</span>'}
        ${isGap ? '<span class="tag dim">breathing</span>' : ''}
      </div>
    </div>`;
  }).join('\n');

  // ── W1-v3 comparison (위로형 only) ──
  const isW1 = wish_type === '위로형';
  const cmpSection = isW1 ? (() => {
    const checks = [
      ['wish_type',      '위로형',       wish_type,         wish_type === '위로형'],
      ['primary_gravity','pause',        primary_gravity,   primary_gravity === 'pause'],
      ['F1 gem',         'citrine/cafe', `${gem_palette.cafe}/cafe`, gem_palette.cafe === 'citrine'],
      ['F5 gem',         'diamond/hamel',`${gem_palette.hamel}/hamel`, gem_palette.hamel === 'diamond'],
      ['arc[0]',         'pause',        emotion_arc[0],    emotion_arc[0] === 'pause'],
      ['arc[4]',         'fragile_hope', emotion_arc[4],    emotion_arc[4] === 'fragile_hope'],
      ['F1 copy',        '#9',           frames[0]?.subtitle_copy, frames[0]?.subtitle_copy === '#9'],
      ['F3 copy',        '#11',          frames[2]?.subtitle_copy, frames[2]?.subtitle_copy === '#11'],
      ['F5 copy',        '#2',           frames[4]?.subtitle_copy, frames[4]?.subtitle_copy === '#2'],
      ['total_sec',      '30s',          `${total_duration_sec}s`, total_duration_sec === 30],
    ];
    const passed = checks.filter(([,,, ok]) => ok).length;
    const rows = checks.map(([k,expect,got,ok]) =>
      `<tr><td>${k}</td><td class="em">${expect}</td><td class="em">${got}</td><td>${ok ? '✅' : '❌'}</td></tr>`
    ).join('');
    return `<section class="sec">
      <h2>W1-v3 비교 <span class="badge-g">${passed}/${checks.length} match</span></h2>
      <p class="note">입력 소원이 수동 검증 완료된 W1-v3와 동일 wish_type입니다. auto-generated 결과와 구조적으로 비교합니다.</p>
      <table class="ctbl"><thead><tr><th>항목</th><th>W1-v3 (manual)</th><th>auto-generated</th><th>일치</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </section>`;
  })() : '';

  // ── player frame data for JS ──
  const jFrames = JSON.stringify(frames.map(f => ({
    start: f.timing.start, end: f.timing.end,
    sub: f.subtitle, subOffset: f.subtitle_start_offset || 0,
    motion: f.motion?.type || 'still',
    isGap: !!f.breathing_gap,
  })));

  const totalStr = `${Math.floor(total_duration_sec/60)}:${String(total_duration_sec % 60).padStart(2,'0')}`;
  const playerW  = isAttraction ? '280px' : '340px';
  const pRatio   = isAttraction ? '9/16' : '3/4';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DreamTown Auto Preview — ${wish_type} · ${render_mode}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#080810;color:#d8d4ee;font-family:'Noto Sans KR',-apple-system,sans-serif;line-height:1.6;padding:24px}
header{text-align:center;padding:32px 0 20px;border-bottom:1px solid #181828;margin-bottom:32px}
header h1{font-size:1.3rem;color:#9090b8;font-weight:300;letter-spacing:.06em}
.wt{font-size:1.15rem;color:#ede8ff;margin:12px 0 6px}
.meta{font-size:.75rem;color:#444}
.sec{max-width:900px;margin:0 auto 48px}
.sec h2{font-size:.9rem;color:#7878a0;font-weight:400;margin-bottom:14px;border-bottom:1px solid #181828;padding-bottom:7px;letter-spacing:.04em}
.note{font-size:.8rem;color:#555;margin-bottom:12px}
.badge{background:#201a50;color:#9080ee;padding:1px 8px;border-radius:10px;font-size:.7rem;margin-left:4px}
.badge-g{background:#102010;color:#60b870;padding:2px 8px;border-radius:10px;font-size:.75rem;margin-left:6px}
.modeB{display:inline-block;padding:3px 10px;border-radius:4px;font-size:.7rem;margin-left:8px}
.res-m{background:#101828;color:#5070b0}.att-m{background:#1a0e1e;color:#a060b0}
.warn{background:#1a1008;border:1px solid #383010;border-radius:8px;padding:12px 16px;font-size:.8rem;color:#b89040;margin-bottom:16px}
/* gravity */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.gbox{background:#0e0e1a;border-radius:10px;padding:18px}
.pg{font-size:1.5rem;color:#c8c0ff;font-weight:300;margin-bottom:6px}
.wtb{display:inline-block;background:#181830;padding:3px 10px;border-radius:16px;font-size:.75rem;color:#9090c0;margin-bottom:14px}
.gems{display:flex;gap:10px;margin-top:10px}
.gem{background:#14142a;border-radius:7px;padding:5px 12px;font-size:.78rem;color:#b0a8e0}
.gem .loc{color:#555;font-size:.65rem;display:block}
.fitrow{display:flex;gap:10px;margin-top:12px}
.fitb{background:#0c0c18;border-radius:7px;padding:10px;flex:1;text-align:center}
.fitb.rec{border:1px solid #282050}
.fv{font-size:1.4rem;color:#9090c8;font-weight:300}
.fl{font-size:.65rem;color:#444;margin-top:2px}
.fitb.rec .fv{color:#b0a0ff}
.sr{display:flex;align-items:center;gap:7px;margin:5px 0;font-size:.75rem}
.sr.prim .gn{color:#c0b0ff}
.gn{width:110px;color:#7070a0}
.gb{flex:1;height:5px;background:#181828;border-radius:3px;overflow:hidden}
.gf{height:100%;background:#4040880;border-radius:3px}
.sr.prim .gf{background:#8070e8}
.gv{width:18px;text-align:right;color:#444}
.kwchips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.kw{background:#14142a;border-radius:6px;padding:3px 9px;font-size:.72rem}
.kw .kt{color:#c8c0f0}
.kw .km{color:#444;font-size:.62rem;margin-left:3px}
/* player */
.pw{display:flex;justify-content:center;padding:16px 0}
.player{position:relative;width:${playerW};aspect-ratio:${pRatio};background:#000;border-radius:14px;overflow:hidden;box-shadow:0 0 50px rgba(60,50,120,.25)}
.fl{position:absolute;inset:0;opacity:0;transition:opacity .9s ease;z-index:1}
.fl.act{opacity:1;z-index:2}
.fl img{width:100%;height:100%;object-fit:cover;transform-origin:center}
@keyframes kbDown{from{transform:scale(1.08) translateY(-2%)}to{transform:scale(1) translateY(0)}}
@keyframes kbPan {from{transform:scale(1.05) translateX(-2%)}to{transform:scale(1) translateX(0)}}
.kbd{animation:kbDown 12s ease-out forwards}
.kbp{animation:kbPan 5s ease-out forwards}
.psub{position:absolute;bottom:40px;left:0;right:0;text-align:center;color:rgba(255,255,255,${spec.subtitle_opacity});font-size:${isAttraction?'1.05rem':'.9rem'};font-weight:${isAttraction?'400':'300'};letter-spacing:.05em;padding:0 18px;opacity:0;transition:opacity .6s;z-index:10;text-shadow:0 1px 6px rgba(0,0,0,.9)}
.psub.vis{opacity:1}
.pbar{position:absolute;top:0;left:0;right:0;height:2px;background:rgba(255,255,255,.08);z-index:20}
.pbf{height:100%;background:rgba(140,120,255,.55);width:0%;transition:width .1s linear}
.pctl{position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:linear-gradient(transparent,rgba(0,0,0,.65));z-index:20}
.pbtn{background:none;border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:50%;width:26px;height:26px;font-size:.65rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
.pbtn:hover{background:rgba(255,255,255,.1)}
.tdsp{font-size:.65rem;color:rgba(255,255,255,.4);font-variant-numeric:tabular-nums}
.fcnt{font-size:.6rem;color:rgba(255,255,255,.25)}
/* frame strip */
.fstrip{display:flex;gap:8px;overflow-x:auto;padding:4px 0}
.fc{flex:0 0 155px;background:#0e0e1a;border-radius:9px;overflow:hidden;border:1px solid #181828}
.fc.gap{opacity:.55}
.fi{position:relative;aspect-ratio:3/4;background:#080816}
.fi img{width:100%;height:100%;object-fit:cover}
.fsub{position:absolute;bottom:7px;left:0;right:0;text-align:center;font-size:.6rem;color:rgba(255,255,255,.7);padding:0 6px}
.flbl{position:absolute;top:5px;left:5px;background:rgba(0,0,0,.7);padding:2px 5px;border-radius:3px;font-size:.58rem;color:#aaa}
.fm{display:flex;gap:3px;flex-wrap:wrap;padding:5px 6px}
.tag{background:#141428;padding:2px 5px;border-radius:3px;font-size:.6rem;color:#6060a0}
.tag.cp{color:#9080c8}
.tag.dim{color:#333}
/* compare table */
.ctbl{width:100%;border-collapse:collapse;font-size:.82rem}
.ctbl th{background:#0e0e1a;padding:7px 11px;text-align:left;color:#7070a0;font-weight:400;border-bottom:1px solid #181828}
.ctbl td{padding:7px 11px;border-bottom:1px solid #0e0e18;color:#b8b4d8}
.ctbl .em{color:#d0cce8;font-size:.8rem}
.ctbl tr:hover td{background:#0c0c16}
/* json */
pre{background:#080816;border-radius:8px;padding:14px;overflow-x:auto;font-size:.68rem;color:#6070a0;max-height:280px;border:1px solid #141428}
footer{text-align:center;padding:28px 0;color:#2a2a3a;font-size:.7rem;border-top:1px solid #141424;margin-top:32px}
/* asset error */
#asset-err{display:none;max-width:900px;margin:0 auto 16px;background:#1a0808;border:1px solid #4a1010;color:#e06060;padding:10px 16px;border-radius:8px;font-size:.8rem;text-align:center}
.fc.img-err .fi::after{content:'⚠ 이미지 없음';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(180,20,20,.25);color:#e06060;font-size:.62rem;border:1px solid #802020}
.fl.img-err{background:#1a0808}
.fl.img-err::after{content:'⚠';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#e06060;font-size:2rem;z-index:3}
</style>
</head>
<body>

<header>
  <h1>DreamTown Auto Preview<span class="modeB ${isAttraction?'att-m':'res-m'}">${render_mode}</span></h1>
  <div class="wt">"${wish_text}"</div>
  <div class="meta">auto_generated · ${(generated_at||'').slice(0,10)} · ${wish_id} · ${frame_set_source}</div>
</header>

<div id="asset-err"></div>
${gravity.fallback ? `<div class="sec"><div class="warn">⚠ 키워드 매칭 없음 — fallback gravity(fragile_hope) 적용. 소원 텍스트에 감정 키워드가 없습니다.</div></div>` : ''}
${confusion_f5_override ? `<div class="sec"><div class="warn" style="background:#0a1818;border-color:#104030;color:#50b890">ℹ confusion primary → F5 fragile_hope 강제 적용 (EMOT-TRANS-001 §1-4)</div></div>` : ''}

<section class="sec">
  <h2>Gravity 분석</h2>
  <div class="g2">
    <div class="gbox">
      <div class="pg">${primary_gravity}</div>
      <div class="wtb">${wish_type}${gravity.tiebreak_applied ? ' · tiebreak' : ''}</div>
      <div class="gems">
        <div class="gem"><span class="loc">cafe</span>${gem_palette.cafe||'—'}</div>
        <div class="gem"><span class="loc">hamel</span>${gem_palette.hamel||'—'}</div>
      </div>
      <div class="fitrow">
        <div class="fitb ${render_mode==='resonance_personal'?'rec':''}">
          <div class="fv">${rf.resonance}</div>
          <div class="fl">resonance</div>
        </div>
        <div class="fitb ${render_mode==='attraction_social'?'rec':''}">
          <div class="fv">${rf.attraction}</div>
          <div class="fl">attraction</div>
        </div>
      </div>
    </div>
    <div class="gbox">
      <div style="font-size:.75rem;color:#555;margin-bottom:8px">Gravity Scores</div>
      ${bars||'<div style="color:#444;font-size:.8rem">키워드 없음</div>'}
      ${matched.length ? `<div class="kwchips">${matched.map(m=>`<div class="kw"><span class="kt">${m.keyword}</span><span class="km">→${m.gravity} +${m.weight}</span></div>`).join('')}</div>` : ''}
    </div>
  </div>
</section>

<section class="sec">
  <h2>Preview Player <span style="font-size:.72rem;color:#444">${total_duration_sec}s · ${ratio}</span></h2>
  <div class="pw">
    <div class="player" id="player">
      <div class="pbar"><div class="pbf" id="pbf"></div></div>
      ${frames.map((f,i)=>`<div class="fl" id="fl${i}"><img src="${f.file}" alt="${f.emotion}" id="fi${i}" onerror="this.closest('.fl')?.classList.add('img-err')"></div>`).join('\n      ')}
      <div class="psub" id="psub"></div>
      <div class="pctl">
        <button class="pbtn" id="pbtn" onclick="togglePlay()">▶</button>
        <span class="fcnt" id="fcnt">F1/5</span>
        <span class="tdsp" id="tdsp">0:00 / ${totalStr}</span>
      </div>
    </div>
  </div>
</section>

<section class="sec">
  <h2>Emotion Arc (5 Frames)</h2>
  <div class="fstrip">${strip}</div>
  <div style="margin-top:10px;font-size:.75rem;color:#444">
    emotion arc: ${emotion_arc.join(' → ')}
    &nbsp;·&nbsp; frame_set: ${frame_set_source}
    &nbsp;·&nbsp; ratio: ${ratio}
    &nbsp;·&nbsp; breathing_gap: ${spec.breathing_gap}
  </div>
</section>

${cmpSection}

<section class="sec">
  <h2>sequence.json</h2>
  <pre>${JSON.stringify(seq, null, 2)}</pre>
</section>

<footer>
  DreamTown Auto Preview · assemble-miracle-video.js v1 · ${generated_at||''}<br>
  기존 자산 재사용 · 신규 이미지 0건 · LLM freeform 없음 · EMOT-TRANS-001 준수
</footer>

<script>
const FR=${jFrames};
const TOTAL=${total_duration_sec};
let t=0,playing=false,last=null,raf=null;

function fmt(s){return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0')}

function active(t){
  for(let i=FR.length-1;i>=0;i--) if(t>=FR[i].start) return i;
  return 0;
}

function render(t){
  document.getElementById('pbf').style.width=Math.min(t/TOTAL*100,100)+'%';
  document.getElementById('tdsp').textContent=fmt(t)+' / '+fmt(TOTAL);
  const fi=active(t);
  document.getElementById('fcnt').textContent='F'+(fi+1)+'/5';
  for(let i=0;i<FR.length;i++){
    const el=document.getElementById('fl'+i);
    if(i===fi){
      if(!el.classList.contains('act')){
        el.classList.add('act');
        const img=document.getElementById('fi'+i);
        img.classList.remove('kbd','kbp');
        if(FR[i].motion==='ken_burns') img.classList.add('kbd');
        if(FR[i].motion==='dissolve_pan') img.classList.add('kbp');
      }
    } else el.classList.remove('act');
  }
  const f=FR[fi];
  const tif=t-f.start;
  const sub=document.getElementById('psub');
  if(f.sub&&tif>=f.subOffset){sub.textContent=f.sub;sub.classList.add('vis')}
  else{sub.classList.remove('vis')}
  if(t>=TOTAL-2){
    const last=document.getElementById('fl'+(FR.length-1));
    last.style.opacity=Math.max(0,1-(t-(TOTAL-2))/2);
  }
}

function tick(ts){
  if(!playing) return;
  if(last!==null) t=Math.min(t+(ts-last)/1000,TOTAL);
  last=ts; render(t);
  if(t>=TOTAL){playing=false;document.getElementById('pbtn').textContent='↺';last=null;return}
  raf=requestAnimationFrame(tick);
}

function togglePlay(){
  if(t>=TOTAL){t=0;render(0)}
  playing=!playing;
  document.getElementById('pbtn').textContent=playing?'⏸':'▶';
  if(playing){last=null;raf=requestAnimationFrame(tick)}
  else{cancelAnimationFrame(raf);last=null}
}

render(0);
document.getElementById('fl0').classList.add('act');

window.addEventListener('load', function() {
  const errs = document.querySelectorAll('.img-err');
  if (errs.length) {
    const b = document.getElementById('asset-err');
    b.style.display = 'block';
    b.textContent = '⚠ 이미지 로딩 실패 ' + errs.length + '개 — Network 탭에서 404 경로를 확인하세요';
  }
});
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// 4. Main
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const r = { wish: null, mode: 'resonance_personal', id: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--wish' && args[i+1]) { r.wish = args[++i]; }
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
      '  node scripts/assemble-miracle-video.js --wish "소원 텍스트"',
      '  node scripts/assemble-miracle-video.js --wish "..." --mode attraction_social',
      '  node scripts/assemble-miracle-video.js --wish "..." --id wish_001 --mode resonance_personal',
      '',
    ].join('\n'));
    process.exit(1);
  }

  const VALID_MODES = ['resonance_personal', 'attraction_social'];
  const renderMode = VALID_MODES.includes(mode) ? mode : 'resonance_personal';
  if (!VALID_MODES.includes(mode)) {
    console.warn(`⚠  mode "${mode}" 미인식 → resonance_personal 적용`);
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(' DreamTown Wish-to-Preview Pipeline v1');
  console.log('─────────────────────────────────────────────');
  console.log(`wish : "${wish}"`);
  console.log(`mode : ${renderMode}`);
  console.log('─────────────────────────────────────────────');

  // Step 1
  const gravity = interpretGravity(wish);
  console.log('\n[1] interpretGravity');
  console.log(`  wish_type       : ${gravity.wish_type}`);
  console.log(`  primary_gravity : ${gravity.primary_gravity}`);
  console.log(`  secondary       : ${gravity.secondary_gravity || '—'}`);
  console.log(`  gem cafe        : ${gravity.gem_palette.cafe || '—'}`);
  console.log(`  gem hamel       : ${gravity.gem_palette.hamel || '—'}`);
  console.log(`  tiebreak        : ${gravity.tiebreak_applied}`);
  console.log(`  fallback        : ${gravity.fallback}`);
  console.log(`  render_fit      : resonance ${gravity.render_fit.resonance} / attraction ${gravity.render_fit.attraction}`);
  if (gravity.matched_keywords.length) {
    console.log(`  matched         : ${gravity.matched_keywords.map(k=>`${k.keyword}(${k.gravity}+${k.weight})`).join(', ')}`);
  }

  // Step 2
  const wishId  = id || `wish_${Date.now()}`;
  const sequence = buildSequence(gravity, renderMode, wishId);
  console.log('\n[2] buildSequence');
  console.log(`  wish_id         : ${wishId}`);
  console.log(`  emotion_arc     : ${sequence.emotion_arc.join(' → ')}`);
  console.log(`  frame_set       : ${sequence.frame_set_source}`);
  console.log(`  total_sec       : ${sequence.total_duration_sec}s`);
  console.log(`  ratio           : ${sequence.ratio}`);
  if (sequence.confusion_f5_override) {
    console.log('  ⚠ confusion F5 override → fragile_hope (EMOT-TRANS-001 §1-4)');
  }

  // Step 3 — output
  if (!fs.existsSync(OUT_BASE)) fs.mkdirSync(OUT_BASE, { recursive: true });
  const outDir  = path.join(OUT_BASE, wishId);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const seqPath  = path.join(outDir, 'sequence.json');
  const htmlPath = path.join(outDir, 'preview.html');

  fs.writeFileSync(seqPath,  JSON.stringify(sequence, null, 2), 'utf-8');
  fs.writeFileSync(htmlPath, assemblePreview(sequence, gravity), 'utf-8');

  console.log('\n[3] Output');
  console.log(`  sequence.json : ${seqPath}`);
  console.log(`  preview.html  : ${htmlPath}`);
  console.log('\n✅ 완료');
  console.log('   브라우저로 열기: start "" "' + htmlPath + '"');
  console.log('─────────────────────────────────────────────\n');

  return { gravity, sequence, seqPath, htmlPath };
}

if (require.main === module) {
  main();
} else {
  module.exports = { interpretGravity, buildSequence };
}
