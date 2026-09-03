# DreamTown Presence Prototype v0.2 — Human Micro Presence Test

**목적**: 정적 Storybook 이미지 기반에서 세계 motion + 사람 micro-presence가 DreamTown다운 "살아 있음"을 만드는지 테스트한다.

**URL**: `http://localhost:8080/prototype/dreamtown-presence-v0.2/index.html`

---

## 핵심 판단 기준

> "사람을 움직이되, '공기 속에 머문다'로 느껴져야 한다."

좋음: "공기 때문에 아주 조금 흔들린다"로 느껴짐
나쁨: "저 사람이 살아서 행동한다"로 느껴짐

---

## 세 가지 Variant

| Variant | human_motion | world_motion | 목적 |
|---------|-------------|--------------|------|
| A | 0% | 표준 | 기존 DreamTown 안전안 |
| B | 0.75% (≈2px) | 표준 | DreamTown micro-presence 실험 |
| C | 2.5% (≈7px) | ×1.35 | drift/캐릭터화 시작점 탐지 |

---

## Human Micro 구현 방식

- **기법**: ImageData 픽셀 displacement (8fps)
- **영역**: 이미지 전체 높이의 30-88% (사람이 있는 영역)
  - Hair/상단 (30-52%): 더 빠른 파동 (period 3.7-6.2s)
  - Cloth/하단 (50-88%): 느린 파동 (period 5.5-9.8s)
- **displacement 계산**: `sin(t/period) × sin(yNorm × 6.5 + t/period × 1.7)` — 세로 위치마다 다른 위상, 자연스러운 물결 패턴
- **페더링**: 상단/하단 5%에서 alpha 0으로 점진 감소

---

## Drift Guard — 절대 금지

- gaze_shift (시선 변화)
- facial_expression_change (표정 변화)
- head_turn (고개 움직임)
- gesture (손짓)
- lip_motion (입 움직임)
- emotional_acting (감정 연기)
- cinematic_pan (카메라 이동)
- zoom_toward_subject (피사체 줌)
- dramatic_sync (극적 동기화)
- viewer_directed_motion (시청자 유도 움직임)

---

## Presence Parameter Map

```yaml
calm:
  world_motion: 3%  human_motion: 0.5%
  star_period:  8-12s  water: almost_still

hope:
  world_motion: 6%  human_motion: 1.0%
  star_period:  5-8s   water: gentle_flow

lonely:
  world_motion: 2%  human_motion: 0.5%
  star_period:  10-15s  water: slow_dark_ripple
```

---

## Aurora5 평가 질문

1. **살아 있다고 느껴졌는가?** — P0 레이어 + 인간 미세 모션의 합산 효과
2. **사람이 캐릭터처럼 느껴졌는가?** → 예이면 Drift (D-02 위반)
3. **내 감정을 투영할 여백이 있었는가?** — 침묵과 여백의 품질
4. **세계가 나를 위해 연기한다고 느껴졌는가?** → 예이면 Drift (D-07 위반)
5. **조용히 다시 보고 싶은가?** — DreamTown Resonance 8번 테스트
6. **A/B/C 중 DreamTown다운 것은 무엇인가?**

---

## 이상적인 응답 (DreamTown 기준)

| 질문 | 이상 응답 |
|------|---------|
| 1. 살아 있다고 느껴졌는가? | 예 |
| 2. 사람이 캐릭터처럼 느껴졌는가? | 아니오 |
| 3. 감정 투영 여백이 있었는가? | 예 |
| 4. 세계가 연기한다고 느껴졌는가? | 아니오 |
| 5. 다시 보고 싶은가? | 예 |
| 6. DreamTown다운 Variant | A 또는 B |

---

## 파일 구조

```
prototype/dreamtown-presence-v0.2/
  index.html          ← 메인 프로토타입
  style.css           ← 스타일
  presence.js         ← 엔진 (ImageData displacement + P0 레이어)
  presence-map.json   ← Presence Parameter Map (타이밍/강도 기준)
  README.md           ← 이 파일
```

---

## 참조 SSOT

- `docs/ssot/dreamtown/SSOT-DreamTown-Core-Philosophy-v1.0.md`
- `docs/ssot/DREAMTOWN_MOTION_SAFE.yml`
