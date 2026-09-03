# DreamTown Layered Temporal Engine v1 — 구현 보고서

**작성일**: 2026-05-24  
**작성자**: Lumi (Claude Code)  
**승인**: 푸르미르 검토 대기  
**Task ID**: TASK-2026-DT-MIRACLE-VIDEO-LAYERED-TEMPORAL-v1  

---

## 철학 선언

> "그림은 고정하고, 세계의 시간만 흐르게 만든다."

기적영상은 스토리보드 이미지를 움직이지 않는다.  
대신, 그 위에 흐르는 세계의 시간(별빛, 물결, 공기)이 감정으로 스며든다.

---

## 구현 요약

| 항목 | 내용 |
|------|------|
| 스크립트 | `scripts/assemble-temporal-video.js` |
| 의존 | `scripts/assemble-miracle-video.js` (interpretGravity, buildSequence) |
| 출력 | `outputs/temporal-preview/{wish_id}/temporal.json` + `index.html` |
| 엔진 방식 | Layered Temporal Composition (HTML5 Canvas) |
| 영상 길이 | 43초 고정 (3 moment × 10-15s + 전환 2s×2 + 엔딩 2s) |

---

## 3-Moment 시간 구조

```
[M1 도착의 순간 0-12s] → [T1 dissolve 12-14s] → [M2 머무름의 순간 14-26s]
  → [T2 dissolve 26-28s] → [M3 잔향의 순간 28-41s] → [fade_to_black 41-43s]
```

| Moment | 프레임 소스 | 역할 | 길이 |
|--------|------------|------|------|
| M1 | F1 (도착 감정) | 감정의 도착 | 12s |
| M2 | F3 (중심 감정) | 조용한 머무름 | 12s |
| M3 | F5 (잔향/해소) | 삶으로의 귀환 | 13s |
| T1, T2 | — | pure dissolve | 2s 각 |
| 엔딩 | — | fade to black | 2s |

F2/F4 (breathing gap 이미지)는 전환 연출로 대체됨 — 이미지 슬라이드쇼 구조를 해체.

---

## Presence Layer 구조

### P0 — 항상 활성 (Always On)

| 레이어 | 구현 | 파라미터 |
|--------|------|---------|
| star_pulse | Canvas, screen blend | 30개 점, opacity 0.75-1.0, 주기 6-9s, 비동기 위상 |
| water_shimmer | Canvas, screen blend | 수평 shimmer band 4개, hasWater moment만 가중치 |
| air_grain | Canvas ImageData, soft-light | center-biased noise (100-210), 12fps, opacity 0.04-0.08 |

### P1 — 선택 활성 (Optional On by default)

| 레이어 | 구현 | 파라미터 |
|--------|------|---------|
| light_breathing | div radial-gradient | opacity 0.025-0.055, 20s 주기, 감정 방향 없음 |

### 제거된 레이어

- **P2 frame_breathing**: CSS scale(1.002) — NEVER 목록에 cinematic_zoom 포함이므로 제외

---

## Drift Guard 확인

```json
{
  "camera_fixed": true,
  "person_fixed": true,
  "structure_fixed": true,
  "ken_burns": false,
  "cinematic_zoom": false
}
```

NEVER 목록 전체 통과:

| 항목 | 상태 |
|------|------|
| camera_pan | ✅ 없음 |
| camera_zoom | ✅ 없음 |
| ken_burns | ✅ false |
| character_motion | ✅ 없음 |
| MV_rhythm | ✅ 없음 |
| emotional_editing | ✅ 없음 |
| narrative_progression | ✅ 없음 |
| cinematic_camera | ✅ 없음 |
| image_scaling | ✅ 없음 |
| P2_frame_breathing | ✅ 제외됨 |

---

## 3 Test Case 검증 결과

### W01 — 위로형 (resonance_personal)

```
wish: "지쳐있는 나를 보듬어주고 싶어요"
gravity: pause
```

| Moment | 이미지 | 감정 | water | 길이 |
|--------|--------|------|-------|------|
| M1 | F1_pause_cafe.png | pause | false | 12s |
| M2 | F3_calm_cafe.png | calm | false | 12s |
| M3 | F5_fragile_hope_hamel.png | fragile_hope | true | 13s |

### W03 — 결심형 (attraction_social)

```
wish: "새로운 일을 시작해보고 싶어요"
gravity: curiosity
stage: 250×444 (9:16)
```

| Moment | 이미지 | 감정 | water | 길이 |
|--------|--------|------|-------|------|
| M1 | curiosity 프레임 | curiosity | false | 12s |
| M2 | calm 프레임 | calm | false | 12s |
| M3 | hamel 잔향 | curiosity | true | 13s |

### W09 — 불안형 (resonance_personal)

```
wish: "앞날이 너무 불확실하고 막막해요"
gravity: confusion
```

| Moment | 이미지 | 감정 | water | 길이 |
|--------|--------|------|-------|------|
| M1 | confusion 프레임 | confusion | false | 12s |
| M2 | calm 프레임 | calm | false | 12s |
| M3 | F5_fragile_hope_hamel.png | fragile_hope | true | 13s |

---

## DoD 체크리스트

| # | 항목 | 상태 |
|---|------|------|
| 1 | 3 moment sequence preview 생성 | ✅ W01/W03/W09 모두 생성 |
| 2 | 각 moment 10초 이상 | ✅ 12s / 12s / 13s |
| 3 | transition은 pure dissolve만 사용 | ✅ pure_dissolve × 2 |
| 4 | camera pan/zoom 제거 | ✅ drift_guard 확인 |
| 5 | P0 presence layer 적용 | ✅ star_pulse, water_shimmer, air_grain |
| 6 | webm export 가능 | ✅ MediaRecorder composite canvas |
| 7 | 기존 preview.html 유지 | ✅ auto-preview / motion-preview 무변경 |
| 8 | 보고서 작성 | ✅ 이 문서 |

**DoD 완료: 8/8**

---

## 기술 세부 사항

### getOpacities(t)

전환 구간에서 두 moment 간의 opacity를 계산하는 크로스페이드 엔진:

- M1 단독 구간 (0-12s): [1, 0, 0]
- T1 전환 (12-14s): M1 감소, M2 증가
- M2 단독 구간 (14-26s): [0, 1, 0]
- T2 전환 (26-28s): M2 감소, M3 증가
- M3 단독 구간 (28-41s): [0, 0, 1]
- 엔딩 (41-43s): 전체 opacity 0으로 감소 (fade to black)

### drawWater(t, opacities)

hasWater가 true인 moment의 opacity 합산으로 waterWeight를 계산.  
shimmer band의 강도가 M3(hamel 이미지) 구간에서 자연스럽게 증가.

### water_y 기준

- hamel 이미지 (has_water: true): `water_y = 0.55` — 화면 55% 지점부터 물결
- 일반 이미지 (has_water: false): `water_y = 0.88` — 하단 12%만 반짝임

### Stage 크기

| render_mode | 크기 | 비율 |
|-------------|------|------|
| resonance_personal | 280×373 | 3:4 |
| attraction_social | 250×444 | 9:16 |

---

## 다음 단계 제안 (Aurora5 결정 필요)

1. **Phase 2 ffmpeg 연동**: MediaRecorder WebM → ffmpeg mp4 변환 파이프라인
2. **오디오 레이어**: ambient 사운드(바다/새벽 공기) 시간 흐름에 연동
3. **실제 스토리북 이미지 연동**: 현재 placeholder → 실제 생성 이미지
4. **감정 arc별 P1 조정**: gravity에 따라 light_breathing 강도 미세 조정 고려

---

## 파일 목록

```
outputs/temporal-preview/
  wish_W01_res/
    temporal.json    (위로형, resonance_personal, 43s)
    index.html       (HTML5 temporal player)
  wish_W03_att/
    temporal.json    (결심형, attraction_social, 43s)
    index.html
  wish_W09_res/
    temporal.json    (불안형, resonance_personal, 43s)
    index.html

scripts/
  assemble-temporal-video.js   (Layered Temporal Engine v1)
  assemble-miracle-video.js    (module.exports 추가됨)
```
