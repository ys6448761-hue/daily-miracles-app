# DreamTown Presence v0.3 — Event System Report

**날짜**: 2026-05-24
**버전**: v0.3
**프로토타입 경로**: `prototype/dreamtown-presence-v0.3/`
**비교 파일**: `outputs/presence-v0.3/comparison.html`

---

## 요약

v0.3은 v0.2의 ImageData 픽셀 displacement 엔진 위에 5개의 신규 시스템을 추가했다.
핵심 철학 변경: "항상 움직이는 영상" → "정적에서 살아나는 영상".

---

## DoD 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| Stillness Breakpoint가 MASTER 컨트롤 역할 | ✅ | `breakInt`가 모든 레이어 amplitude에 곱해짐 |
| Directional Motion (바람 방향 displacement) | ✅ | `calcWindDisp()`, hair×1.35 / cloth×0.80 |
| Hand Micro Acting (tremble/grip/sleeve) | ✅ | `calcHandMicroX()`, 9.1Hz tremble + sin-grip + sin-sleeve |
| Observer Camera Grammar | ✅ | `drawCamera()`, max scale +0.39% (variant B, peak) |
| Particle Event Layer | ✅ | `drawParticles()`, sparse_upward for hope/resonance |
| 5 emotions (calm/hope/lonely/healing/resonance) | ✅ | grammar JSON 완성 |
| Layer stagger timing (motion→light→particle→star) | ✅ | `LAYER_AWAKEN_DELAY = {motion:0, light:0.4, particle:0.9, constellation:1.4}` |
| Drift Guard 금지 목록 17개 UI 표시 | ✅ | `buildUI()` drift-items 섹션 |
| v0.2 vs v0.3 비교 HTML | ✅ | `outputs/presence-v0.3/comparison.html` |
| presence-grammar.json SSOT | ✅ | `prototype/dreamtown-presence-v0.3/presence-grammar.json` |
| SSOT 문서 | ✅ | `docs/ssot/DREAMTOWN_PRESENCE_GRAMMAR_SSOT.md` |
| syntax check (`node --check`) | ✅ | 에러 없음 |
| hand_region 버그 수정 | ✅ | grammar에 `hand_region` 추가, JS에서 `PG.drift_guard.hand_region` 참조 |

---

## 5 Systems 상세

### System 1 — Stillness Breakpoint Engine

전체 시스템의 마스터 강도 커브. 4 phases:

```
still(0) ──cosine ease-in──> awakening(0→1) ──linear decay──> resonance(1→0.42)
         ──quadratic decay──> afterglow(0.42→0) ──> cycle 재시작
```

감정별 사이클 (가장 짧은 순):
- resonance: 12s (가장 역동적)
- hope: 14s
- calm / healing: 18s
- lonely: 22s (가장 느리고 긴 정적)

### System 2 — Directional Motion System

v0.2의 random wave → v0.3의 방향성 바람 필드로 전환.

감정별 바람 방향:
- calm: 35° (우상향, 부드러운 봄바람)
- hope: 20° (거의 직상, 상승 에너지)
- lonely: 290° (좌하향, 무거운 기류)
- healing: 45° (우상향, 치유의 방향)
- resonance: 10° (거의 직상, 강한 공명)

### System 3 — Emotional Event Timeline

레이어 깨어남 순서: motion → light(+0.4s) → particle(+0.9s) → star(+1.4s)

효과: 생명이 한꺼번에 켜지지 않고, 파도처럼 차례로 살아난다.

### System 4 — Hand Micro Acting

`hand_region` (세로 62-88%, 가로 25-75%) 내에만 적용.

성분 분리:
1. **fingertip_tremble** (9.1Hz): 손 떨림의 물리적 표현
2. **cup_grip_relaxation** (period Hz): 컵을 쥔 손의 서서히 이완
3. **sleeve_drift** (period×1.25 Hz): 옷소매의 cloth-linked 지연

모두 `breakInt`에 비례 → 정적 구간 완전 정지, 공명 구간에서 최대 활성화.

### System 5 — Observer Camera Grammar v1

카메라가 "관찰자"처럼 호흡한다. 두 성분:

1. **Emotional Push**: `scale(1 + push×0.0028×breakInt)` — 공명 순간 화면이 0.4% 확대
2. **Observer Drift**: `translate(drift_x×sin(), drift_y×cos())` — 관찰자의 미세 호흡

`transformOrigin: 50% 38%` — 인물 상반신 기준으로 확대됨.

---

## v0.2 vs v0.3 비교

| 시스템 | v0.2 | v0.3 |
|--------|------|------|
| 인물 모션 | Random wave displacement | Directional wind field |
| 모션 타이밍 | 항상 활성 | Stillness Breakpoint 제어 |
| 손 연기 | 없음 | tremble + grip + sleeve |
| 카메라 | 고정 | Observer Grammar |
| 파티클 | 없음 | 감정별 sparse/sparse_upward |
| 레이어 타이밍 | 동시 활성 | staggered (+0/0.4/0.9/1.4s) |
| 감정 | 3 (calm/hope/lonely) | 5 (+healing/resonance) |

---

## 발견된 이슈 및 수정

### hand_region 런타임 버그 (v0.3 출시 당일 수정)

**문제**: `drawHuman()`이 `emo.hand_micro.region`을 참조하는데, grammar JSON의 `hand_micro` 객체에 `region` 프로퍼티가 없었음 → 런타임 `TypeError`.

**수정**:
1. `presence-grammar.json` → `drift_guard`에 `hand_region` 추가: `{ "top":0.62, "bottom":0.88, "left":0.25, "right":0.75 }`
2. `presence3.js` → `emo.hand_micro.region` → `PG.drift_guard.hand_region` (글로벌 참조)

**근거**: hand region은 모든 감정 공통 — 특정 감정마다 다를 이유 없음. drift_guard 소속이 맞음.

---

## MP4 출력 상태

브라우저 MediaRecorder (WebM) 방식으로 녹화 가능. 각 프로토타입에 "Record WebM" 버튼 구현됨.
FFmpeg MP4 변환은 Phase 2 (pipeline 통합 시 처리).

필요한 파일:
- `calm_presence_v3.mp4`
- `hope_presence_v3.mp4`
- `lonely_presence_v3.mp4`
- `resonance_presence_v3.mp4`

---

## Aurora5 평가 예상

| 질문 | 예상 |
|------|------|
| 살아 있다고 느껴졌는가? | 정적 구간 후 깨어남 순간에 YES 체감 확실 |
| 사람이 캐릭터처럼? | Variant B: 낮음. Variant C: 경계선. C는 프로덕션 사용 금지 |
| 바람 방향성이 느껴졌는가? | hope(20°)와 lonely(290°)가 가장 명확한 차이 |
| 정적 → 살아나는 순간? | resonance(cycle 12s), awakening(cosine ease-in) 구간에서 체감 |
| DreamTown다운 것은? | B (0.75%) — 존재감 있으나 행위하지 않음 |

---

## 다음 단계 (Phase 2)

1. MediaRecorder WebM → FFmpeg MP4 변환 자동화
2. `compose-temporal-rhythm.js`와 통합 — Presence v0.3을 Temporal Moment 레이어로 적용
3. presence-grammar.json v0.4 — 카페/하멜별 scene grammar 분리
4. Aurora5 실제 평가 수집 → 파라미터 튜닝 iteration

---

## 참조

- SSOT: `docs/ssot/DREAMTOWN_PRESENCE_GRAMMAR_SSOT.md`
- Grammar JSON: `prototype/dreamtown-presence-v0.3/presence-grammar.json`
- 엔진: `prototype/dreamtown-presence-v0.3/presence3.js`
- 비교 HTML: `outputs/presence-v0.3/comparison.html`
- v0.2 기준선: `prototype/dreamtown-presence-v0.2/`
