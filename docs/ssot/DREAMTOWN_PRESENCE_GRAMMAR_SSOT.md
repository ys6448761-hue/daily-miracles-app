# DREAMTOWN PRESENCE GRAMMAR — SSOT

**버전**: v0.3
**생성일**: 2026-05-24
**파일**: `prototype/dreamtown-presence-v0.3/presence-grammar.json`

---

## 핵심 원칙

> "캐릭터가 연기하는 영상이 아니라 공간이 감정을 기억하는 영상"

DreamTown 영상에서 모션은 **목적을 가진 행위(acting)**가 아니라 **환경 조건의 결과(consequence)**다.
사람이 움직이는 것이 아니라, 공기·빛·중력이 사람을 통해 기억된다.

---

## 5 Systems

### System 1 — Stillness Breakpoint Engine (MASTER)

모든 레이어의 강도를 지배하는 단일 마스터 커브.

```
Phase    시간 구간         breakInt 값          특성
─────────────────────────────────────────────────────────
still    0 → awaken        0                   아무것도 일어나지 않는다
awakening awaken → resonate 0 → 1 (cosine)     서서히 살아난다
resonance resonate → afterglow 1.0 → ~0.42 (linear) 절정에서 내려온다
afterglow afterglow → cycle  0.42 → 0 (quadratic) 여운이 사라진다
```

**레이어 깨어남 지연 (Staggered Awaken)**:
| Layer | Delay |
|-------|-------|
| motion | +0.0s |
| light | +0.4s |
| particle | +0.9s |
| constellation | +1.4s |

모션이 먼저 살아나고, 빛, 파티클, 별이 차례로 뒤따른다. 동시 활성화 금지.

---

### System 2 — Directional Motion System

바람 방향 벡터(angle, 0–360°)가 머리칼과 옷의 displacement를 결정한다.

```
dispX = (cos(angle) × speed × mult + turbulence) × amplitude
dispY = (sin(angle) × speed × 0.22 × mult + turbulence) × amplitude
```

**Region multipliers**:
- Hair (`yNorm < 0.50`): 1.35× — 머리칼은 바람에 더 민감
- Cloth (`yNorm ≥ 0.50`): 0.80× — 옷은 중력으로 안정됨

Turbulence는 `sin(yNorm × 5.5 + t × 0.72)` 기반 리플로, 자연스러운 비균일 흔들림 생성.

---

### System 3 — Emotional Event Timeline

감정에 따라 활성화되는 레이어가 다르다. Particle은 Stillness Breakpoint의 `partInt`에 의해 게이트됨.

| Emotion | Particle Mode | 설명 |
|---------|--------------|------|
| calm | `minimal` | 파티클 비활성 |
| hope | `sparse_upward` | 위로 떠오르는 빛 입자 |
| lonely | `sparse` | 매우 희미하게 존재 |
| healing | `sparse` | 희미한 회복의 잔여 |
| resonance | `sparse_upward` | 공명의 절정 — 위로 솟구침 |

Opacity multiplier: `sparse_upward` = 0.18, `sparse` = 0.09.

---

### System 4 — Hand Micro Acting

`hand_region` (top:62%, bottom:88%, left:25%, right:75%) 내 픽셀에만 추가 displacement 적용.

3가지 성분의 합:
```
tremble = hand.tremble × breakInt × W×0.003 × sin(t×9.1 + yNorm×13.5)
grip    = hand.grip_relax × breakInt × W×0.004 × sin(t/period×2π + yNorm×2.8)
sleeve  = hand.sleeve × breakInt × W×0.004 × sin(t/(period×1.25)×2π + 2.2)
```

- **tremble**: 9.1Hz 미세 떨림 (손끝 압력)
- **grip**: 천천히 이완되는 컵 쥠
- **sleeve**: 옷소매 cloth-linked 오프셋

**모두 breakInt에 비례** → 정적 구간에서는 손도 완전히 정지한다.

---

### System 5 — Observer Camera Grammar v1

`#stage-wrapper` div의 CSS `transform`만 사용. Canvas 자체는 변경하지 않는다.

```
scale = 1 + push × 0.0028 × breakInt
translateX = drift_x × breakInt × sin(t / drift_period × 2π)
translateY = drift_y × breakInt × cos(t / (drift_period×1.45) × 2π)
transformOrigin: 50% 38%  ← 상단 1/3 지점 기준 (인물 상반신)
```

최대 스케일 증가 (Variant B, resonance peak):
`1 + 1.4 × 0.0028 × 1.0 = 1.00392` (+0.39%)

**ALLOWED**: emotional_push, memory_pullback, observer_drift, side_breathing
**NEVER**: fast_pan, cinematic_sweep, handheld_shake, tiktok_motion, drone_movement, cinematic_pan, zoom_toward_subject, waving, large_movement

---

## Emotions 파라미터 표

### 고요함 (calm)
```json
{ "breakpoint": { "awaken":2.0, "resonate":6.0, "afterglow":10.0, "cycle":18.0 },
  "directional": { "angle":35, "speed":0.25, "turbulence":0.15 },
  "hand_micro":  { "tremble":0.20, "grip_relax":0.50, "sleeve":0.60, "period":4.8 },
  "camera":      { "push":0.8, "drift_x":0.15, "drift_y":0.08, "drift_period":22 } }
```

### 희망 (hope)
```json
{ "breakpoint": { "awaken":1.5, "resonate":4.5, "afterglow":8.0, "cycle":14.0 },
  "directional": { "angle":20, "speed":0.45, "turbulence":0.25 },
  "hand_micro":  { "tremble":0.40, "grip_relax":0.80, "sleeve":0.90, "period":3.2 },
  "camera":      { "push":1.2, "drift_x":0.20, "drift_y":0.12, "drift_period":16 } }
```

### 고독 (lonely)
```json
{ "breakpoint": { "awaken":3.0, "resonate":8.0, "afterglow":14.0, "cycle":22.0 },
  "directional": { "angle":290, "speed":0.15, "turbulence":0.08 },
  "hand_micro":  { "tremble":0.30, "grip_relax":0.30, "sleeve":0.40, "period":6.5 },
  "camera":      { "push":0.4, "drift_x":0.08, "drift_y":0.15, "drift_period":30 } }
```

### 치유 (healing)
```json
{ "breakpoint": { "awaken":2.5, "resonate":7.0, "afterglow":11.0, "cycle":18.0 },
  "directional": { "angle":45, "speed":0.30, "turbulence":0.18 },
  "hand_micro":  { "tremble":0.30, "grip_relax":0.70, "sleeve":0.70, "period":4.2 },
  "camera":      { "push":0.9, "drift_x":0.12, "drift_y":0.10, "drift_period":25 } }
```

### 공명 (resonance)
```json
{ "breakpoint": { "awaken":1.0, "resonate":3.5, "afterglow":7.0, "cycle":12.0 },
  "directional": { "angle":10, "speed":0.55, "turbulence":0.30 },
  "hand_micro":  { "tremble":0.50, "grip_relax":0.90, "sleeve":1.00, "period":2.8 },
  "camera":      { "push":1.4, "drift_x":0.25, "drift_y":0.15, "drift_period":14 } }
```

---

## Drift Guard — 절대 금지 목록

```
gaze_shift              — 시선 이동
facial_expression_change — 표정 변화
head_turn               — 고개 돌림
gesture                 — 손짓
lip_motion              — 입술 움직임
emotional_acting        — 감정 연기
cinematic_pan           — 영화적 팬
zoom_toward_subject     — 피사체 향한 줌
dramatic_sync           — 극적 동기화
viewer_directed_motion  — 관객 유도 움직임
fast_pan                — 빠른 팬
handheld_shake          — 손흔들림 카메라
tiktok_motion           — 틱톡 스타일 움직임
drone_movement          — 드론 무빙
cinematic_sweep         — 시네마틱 스윕
waving                  — 흔들기
large_movement          — 큰 동작
```

**판단 기준**:
- GOOD: "공기 때문에 아주 조금 흔들린다. 공간이 감정을 기억한다."
- BAD: "저 사람이 살아서 행동한다. 저가 AI 영상 느낌."

---

## Variants

| Variant | human_motion_pct | world_multiplier | 목적 |
|---------|-----------------|-----------------|------|
| A | 0% | 1.0 | 세계 레이어만 |
| B | 0.75% | 1.0 | 기본값 |
| C | 2.5% | 1.35 | 드리프트 위험 탐지 |

Variant C는 프로덕션에 사용하지 않는다. 경계 탐지 목적으로만 존재한다.

---

## Stage

- 크기: 280 × 373px
- Canvas 스택 (z-index 순서):
  1. `base-cvs` (z:1) — 정적 배경 이미지
  2. `human-cvs` (z:2) — 인물 displacement
  3. `shimmer-cvs` (z:3, screen) — 수면 shimmer
  4. `particle-cvs` (z:4, screen) — 감정 파티클
  5. `light-layer` (z:5) — 빛 레이어 (CSS radial-gradient)
  6. `grain-cvs` (z:6, soft-light) — 공기 그레인
  7. `star-cvs` (z:7, screen) — 별 펄스

---

## 구현 파일

| 파일 | 역할 |
|------|------|
| `prototype/dreamtown-presence-v0.3/presence3.js` | 엔진 (~650 lines) |
| `prototype/dreamtown-presence-v0.3/presence-grammar.json` | 파라미터 정본 |
| `prototype/dreamtown-presence-v0.3/index.html` | UI 뷰 |
| `prototype/dreamtown-presence-v0.3/style.css` | 스타일 |
| `outputs/presence-v0.3/comparison.html` | v0.2 vs v0.3 비교 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v0.1 | 2026-05 | 별/grain P0 레이어 only |
| v0.2 | 2026-05 | ImageData 인물 displacement (random wave, 3 emotions) |
| v0.3 | 2026-05-24 | Stillness Breakpoint + Directional Motion + Hand Micro + Camera Grammar + 5 emotions |
