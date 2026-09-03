# DreamTown Presence v0.3 — Emotional Event System

> "캐릭터가 연기하는 영상이 아니라 공간이 감정을 기억하는 영상"

## Overview

v0.3 adds 5 new systems on top of v0.2's ImageData pixel displacement engine:

| System | Description |
|--------|-------------|
| Stillness Breakpoint | MASTER intensity curve — 정적→깨어남→공명→잔향 |
| Directional Motion | Wind angle vector drives hair/cloth displacement |
| Emotional Event Timeline | Per-layer staggered awaken delays |
| Hand Micro Acting | Fingertip tremble + grip relax + sleeve drift |
| Observer Camera Grammar v1 | Emotional push + observer drift on `#stage-wrapper` |

## Files

```
presence3.js          — Engine (~650 lines, 5 systems)
presence-grammar.json — Per-emotion parameters (5 emotions × 5 systems)
index.html            — Canvas stack + Breakpoint/Wind UI
style.css             — Dark theme, bp-bar, wind-compass, layer toggles
```

## Running

Open `index.html` via a local HTTP server (required for `fetch()` and `getImageData()`):

```bash
npx serve .
# or from repo root:
npx serve prototype/dreamtown-presence-v0.3
```

Then open `http://localhost:3000` in a browser.

## System 1 — Stillness Breakpoint Engine

All layers are gated by a single master intensity curve `breakInt ∈ [0,1]`:

```
0 ──── awaken ──── resonate ──── afterglow ──── cycle
       ease-in       decay          quad-decay      → 0
(still=0)  (0→1)     (1→0.42)       (0.42→0)
```

Each layer has a staggered awaken delay:
- `motion`: +0s
- `light`: +0.4s
- `particle`: +0.9s
- `constellation`: +1.4s

## System 2 — Directional Motion

Wind angle (per-emotion) decomposes into primary X/Y + turbulence ripple:
- Hair region (`yNorm < 0.50`): 1.35× multiplier
- Cloth region (`yNorm ≥ 0.50`): 0.80× multiplier

## System 3 — Emotional Event Timeline

Particle mode per emotion:
- `calm`: `minimal` (disabled)
- `hope`, `resonance`: `sparse_upward` (0.18× opacity multiplier, upward drift)
- `lonely`, `healing`: `sparse` (0.09× opacity multiplier)

## System 4 — Hand Micro Acting

Applied inside the `hand_region` (top: 62%, bottom: 88%, left: 25%, right: 75%) during the pixel displacement loop:
- `fingertip_tremble`: 9.1 Hz × 0.003W
- `cup_grip_relaxation`: `sin(t/period × 2π)` × 0.004W
- `sleeve_drift`: `sin(t/(period×1.25) × 2π + 2.2)` × 0.004W

## System 5 — Observer Camera Grammar v1

CSS `transform` on `#stage-wrapper`, `transformOrigin: 50% 38%`:
- `scale = 1 + push × 0.0028 × breakInt` (max +0.28% at peak resonance, variant B)
- `translateX = drift_x × breakInt × sin(t / drift_period × 2π)`

**NEVER** (Drift Guard): fast_pan, cinematic_sweep, handheld_shake, tiktok_motion, zoom_toward_subject, drone_movement, cinematic_pan, waving, large_movement.

## Variants

| Variant | human_motion_pct | Purpose |
|---------|-----------------|---------|
| A | 0% | World-only. Breakpoint controls world layers only. |
| B | 0.75% | Default. Directional micro + hand. |
| C | 2.5% | Drift Risk Zone. Boundary detection. |

## Emotions

| Emotion | Cycle | Wind | Particle |
|---------|-------|------|----------|
| 고요함 (calm) | 18s | 35° / 0.25 | minimal |
| 희망 (hope) | 14s | 20° / 0.45 | sparse_upward |
| 고독 (lonely) | 22s | 290° / 0.15 | sparse |
| 치유 (healing) | 18s | 45° / 0.30 | sparse |
| 공명 (resonance) | 12s | 10° / 0.55 | sparse_upward |

## Aurora5 Evaluation

The prototype includes 8 inline evaluation questions (below the stage). Key metrics:
1. 살아 있다고 느껴졌는가?
2. 사람이 캐릭터처럼 느껴졌는가? (낮을수록 good)
3. 내 감정을 투영할 여백이 있었는가?
4. 정적이 살아나는 순간이 있었는가? (Breakpoint 체감)
5. 조용히 다시 보고 싶은가?

## Drift Guard

Motion that is **never** allowed:
`gaze_shift / facial_expression_change / head_turn / gesture / lip_motion / emotional_acting /
cinematic_pan / zoom_toward_subject / dramatic_sync / viewer_directed_motion /
fast_pan / handheld_shake / tiktok_motion / drone_movement / cinematic_sweep /
waving / large_movement`

**Judgement Good**: "공기 때문에 아주 조금 흔들린다. 공간이 감정을 기억한다."
**Judgement Bad**: "저 사람이 살아서 행동한다. 저가 AI 영상 느낌."

## SSOT Reference

`docs/ssot/DREAMTOWN_PRESENCE_GRAMMAR_SSOT.md`
