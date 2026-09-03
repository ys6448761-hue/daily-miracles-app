# DreamTown Temporal Rhythm Test v1 — 시간 호흡 비교 보고서

**작성일**: 2026-05-24  
**작성자**: Lumi (Claude Code)  
**승인**: Aurora5 시청 평가 대기  
**Task ID**: TASK-2026-DT-TEMPORAL-RHYTHM-v1  

---

## 철학 선언

> "DreamTown은 움직임을 편집하지 않는다. 시간의 호흡을 작곡한다."

기적영상의 핵심 기준을 **motion** (얼마나 움직이는가)에서  
**temporal_rhythm** (시간이 어떤 호흡으로 흐르는가)으로 전환한다.

---

## 테스트 대상

| 항목 | 값 |
|------|-----|
| 테스트 소원 | "지쳐있는 나를 보듬어주고 싶어요" |
| wish_type | 위로형 |
| gravity | pause |
| render_mode | resonance_personal |
| 공통 레이어 | P0: star_pulse, water_shimmer, air_grain / P1: light_breathing |
| 이미지 구성 | M1(pause/cafe) → M2(calm/cafe) → M3(fragile_hope/hamel) |

---

## Variant 스펙

### Variant A — Freeze Risk (정지 위험)

```yaml
moment_duration: 18s each
dissolve_duration: 4s
fade_to_black: 2s
total: 64s (1:04)
timeline: M1(0-18) → T1(18-22) → M2(22-40) → T2(40-44) → M3(44-62) → end(62-64)
```

**위험 신호**:
- `static_slide_feeling` — 장면이 너무 오래 머물러 슬라이드 느낌
- `temporal_stagnation` — 시간의 흐름이 막혀있는 느낌

**특성**: P0 레이어가 충분히 살아있으면 위험이 낮아질 수 있음. 단, 이미지에 생동감이 없을 경우 18s는 지루하게 느껴질 수 있음.

---

### Variant B — Current Baseline (현재 기준선)

```yaml
moment_duration: 12s / 12s / 13s
dissolve_duration: 2s
fade_to_black: 2s
total: 43s (0:43)
timeline: M1(0-12) → T1(12-14) → M2(14-26) → T2(26-28) → M3(28-41) → end(41-43)
```

**위험 신호**: 없음

**특성**: 현재 Layered Temporal Engine v1의 기본값. M1/M2 동일 12s, M3 1s 더 긴 13s(잔향 강조).

---

### Variant C — Cinematic Risk (시네마틱 위험)

```yaml
moment_duration: 5s / 5s / 7s
dissolve_duration: 1s
fade_to_black: 2s
total: 21s (0:21)
timeline: M1(0-5) → T1(5-6) → M2(6-11) → T2(11-12) → M3(12-19) → end(19-21)
```

**위험 신호**:
- `MV_feeling` — 뮤직비디오 같은 편집 리듬
- `editing_rhythm` — 영상 편집 느낌
- `cinematic_drift` — DreamTown 철학 이탈

**특성**: 1s dissolve는 사실상 cut처럼 느껴질 수 있음. 5s 이하에서 사람은 감정이 착지하기 전에 다음 장면으로 넘어감.

---

## Aurora5 시청 평가 질문

아래 6가지 기준으로 각 Variant를 평가한다.

| # | 질문 | 판단 기준 |
|---|------|---------|
| 1 | 시간이 흐르는가? | 장면과 장면 사이에 흐름이 느껴지는가 |
| 2 | 압박감 없는가? | 빨리 넘어가야 한다는 긴장감이 없는가 |
| 3 | 영상처럼 느껴지는가? | MV/영화 같은 편집 리듬이 느껴지는가 (↑나쁜 신호) |
| 4 | 슬라이드처럼 느껴지는가? | 이미지 전환이 PPT처럼 느껴지는가 (↑나쁜 신호) |
| 5 | 기억이 지나가는 느낌이 있는가? | 과거의 감정이 스치는 듯한 느낌 |
| 6 | 감정이 머무를 공간이 있는가? | 장면 안에 침묵과 여백이 있는가 |

**이상적인 DreamTown temporal breathing 응답**:
- Q1: 예 · Q2: 예 · Q3: 아니오 · Q4: 아니오 · Q5: 예 · Q6: 예

---

## 예측 평가

### Variant A (18s / 4s dissolve)

| 질문 | 예측 | 근거 |
|------|------|------|
| 시간이 흐르는가? | △ 약하게 | 너무 오래 머물면 시간 흐름 감각이 희미해짐 |
| 압박감 없는가? | ✓ 예 | 느린 리듬, 압박 없음 |
| 영상처럼 느껴지는가? | ✓ 아니오 | 오히려 너무 정적 |
| 슬라이드처럼 느껴지는가? | ⚠ 위험 | 18s 정지는 슬라이드 느낌 가능성 있음 |
| 기억이 지나가는 느낌? | △ 약하게 | 지나가지 않고 멈춰있는 느낌 |
| 감정이 머무를 공간? | ✓ 예 | 공간은 충분함 |

**예측 결론**: P0 레이어가 살아있으면 18s도 버틸 수 있으나, 이미지 자체가 정적이면 stagnation 위험.

---

### Variant B (12-13s / 2s dissolve)

| 질문 | 예측 | 근거 |
|------|------|------|
| 시간이 흐르는가? | ✓ 예 | 12s는 충분히 느끼고 자연스럽게 전환 |
| 압박감 없는가? | ✓ 예 | 2s dissolve는 부드럽고 강요 없음 |
| 영상처럼 느껴지는가? | ✓ 아니오 | 리듬이 있으나 편집 느낌 아님 |
| 슬라이드처럼 느껴지는가? | ✓ 아니오 | 레이어가 살아있어 정적이지 않음 |
| 기억이 지나가는 느낌? | ✓ 예 | M1→M2→M3 감정 arc가 자연스럽게 흐름 |
| 감정이 머무를 공간? | ✓ 예 | 충분한 여백과 침묵 |

**예측 결론**: 6/6 통과 예상. 현재 최적 기준선.

---

### Variant C (5-7s / 1s dissolve)

| 질문 | 예측 | 근거 |
|------|------|------|
| 시간이 흐르는가? | ⚠ 너무 빠름 | 5s 안에 감정이 착지하기 전에 전환 |
| 압박감 없는가? | ⚠ 위험 | 빠른 전환이 무의식적 긴장감 생성 |
| 영상처럼 느껴지는가? | ⚠ 위험 | 1s 전환은 cut에 가까움 |
| 슬라이드처럼 느껴지는가? | △ 경계 | 빠르면 슬라이드로도 해석 가능 |
| 기억이 지나가는 느낌? | △ 약하게 | 너무 빨리 지나가 기억이 아닌 단절 |
| 감정이 머무를 공간? | ✗ 아니오 | 머무를 시간이 없음 |

**예측 결론**: DreamTown 기준 3-4개 실패 예상. cinematic_drift 확인 필요.

---

## Temporal Breathing 정의 (이번 테스트로부터)

```yaml
temporal_breathing:
  definition:
    "장면이 숨 쉬는 시간 간격"

  composed_of:
    - emotional_spacing:    감정이 착지하는 데 필요한 최소 시간 (≥10s 추정)
    - dissolve_pacing:      전환이 자연스럽게 느껴지는 속도 (2-3s 권장)
    - silence_density:      무음 구간에서 감정이 스스로 퍼지는 시간
    - pause_duration:       P0 레이어가 살아있을 때의 정적 내구 시간
    - temporal_weight:      moment별 감정 강도에 따른 체감 시간 차이

  DreamTown_safe_zone:
    moment_duration: 10s ~ 15s
    dissolve_duration: 1.5s ~ 3s
    total: 35s ~ 55s

  danger_zones:
    freeze: moment > 16s (P0 레이어 없을 경우)
    cinematic: moment < 8s, dissolve < 1.5s
```

---

## 출력 파일 목록

```
outputs/temporal-rhythm/
  comparison.html       ← A/B/C 나란히 + Aurora5 평가 체크리스트
  variant_A/
    temporal.json       (64s, 18/18/18s, 4s dissolve)
    index.html
  variant_B/
    temporal.json       (43s, 12/12/13s, 2s dissolve)
    index.html
  variant_C/
    temporal.json       (21s, 5/5/7s, 1s dissolve)
    index.html

scripts/
  compose-temporal-rhythm.js   (Temporal Rhythm Composer v1)
  assemble-temporal-video.js   (buildTemporalSequence timing 파라미터 추가)
```

---

## 다음 단계 (Aurora5 결정 필요)

1. **시청 평가 실시**: `comparison.html`에서 A/B/C를 직접 재생하며 6개 질문에 답변
2. **기준선 확정**: Variant B 유지 vs 미세 조정 (예: B+, moment=14s, dissolve=2.5s)
3. **감정 타입별 variant**: 위로형(pause) vs 결심형(curiosity) 는 다른 temporal breathing이 필요할 수 있음
4. **P0 레이어 강도 변수화**: moment_duration이 길수록 P0 레이어가 더 강해야 stagnation 방지

---

## 핵심 결론

```yaml
success_criteria:
  - "시간의 리듬이 존재한다"        → Variant B: ✓
  - "영상 편집 리듬은 느껴지지 않는다" → Variant B: ✓
  - "감정이 강요되지 않는다"         → Variant B: ✓
  - "소원이가 시간 안에 머무른다"     → Variant B: ✓ (예측)
  - "DreamTown다운 temporal breathing" → Variant B: ✓ (예측)
```

**현재 권장 기준**: Variant B (12-13s / 2s dissolve / 43s total)  
단, Aurora5 시청 확인 후 최종 확정.
