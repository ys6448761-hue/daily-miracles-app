# Storybook ↔ Miracle Separation — Validation v1

**생성일**: 2026-05-25
**장소**: cablecar only
**감정**: confusion / pause / calm / curiosity / fragile_hope
**SSOT**: docs/ssot/dreamtown/DreamTown_Emotion_Grammar_v1.md
**Presence Rule**: docs/ssot/dreamtown/DreamTown_Presence_Rule_v1.md

---

## 프로토타입 파일

| 종류 | 파일 |
|------|------|
| Storybook Flow | `public/debug/storybook-flow-v1.html` |
| Miracle Presence | `public/debug/miracle-presence-v1.html` |

---

## 1. Storybook Flow — 검수 소견

### 구성 방식

- 감정 5종 순서: confusion → pause → calm → curiosity → fragile_hope
- 이미지: `cablecar_{emotion}_v1.png` (medium/detail distance)
- 문장: 짧고 여백 있음 (1~2줄)
- 전환: 0.7s fade, 텍스트 delay 0.35s~0.55s
- 끝 화면: "같은 케이블카. 같은 밤. 당신의 감정이 머문 곳."
- 조작: tap → 다음 / 좌우 키보드 지원

### 감정별 소견

```
confusion
  이미지: 안개, 인물 어둠에 묻힘, 별 없음 — SSOT 정확
  문장:   "오늘은 어디로 가야 할지 모르겠어요."
  소견:   가까움. 설명 없음. 여백 있음. ✅

pause
  이미지: 완전 정적, 별 조금 존재, 야청색 — 정확
  문장:   "잠깐은 멈춰 있어도 괜찮았어요."
  소견:   "괜찮았어요" — 판단이 아닌 허용. 여운 있음. ✅

calm
  이미지: 수면 반사 잔잔, 별 조용히 탄생 중 — 정확
  문장:   "조금 숨이 놓였어요."
  소견:   한 줄. 여백 최대. "충분하다"를 말하지 않음. ✅

curiosity
  이미지: wide, 하늘 열림, 원형 glow 상단 — 대체로 정확
  문장:   "저 멀리에 무언가 있는 것 같았어요."
  소견:   "것 같았어요" — 확신 없음, 탐색 중 표현 정확. ✅
  주의:   이미지의 원형 glow 선명도 팀 확인 필요 (v2 재생성 반영됨)

fragile_hope
  이미지: detail view, 새벽 직전 라벤더, 별 형성 중 — 정확
  문장:   "조금은 믿어보고 싶어졌어요."
  소견:   "싶어졌어요" — 아직 믿지 않음. 조심스러운 상승. ✅
```

### Storybook 검수 질문 평가

```
감정이 가까운가?
  → ✅ 각 이미지+문장이 공간을 채우지 않고 인물 옆에 조용히 있음

사용자가 자기 기억을 넣을 공간이 있는가?
  → ✅ 문장이 완성형이 아님. "모르겠어요" "것 같았어요"는 열린 문장

설명보다 여운이 남는가?
  → ✅ 감정 label(10px, 낮은 opacity)만 노출. 해석 없음.
```

---

## 2. Miracle Presence — 검수 소견

### 구성 방식

- 기반 이미지: `cablecar_curiosity_v1.png` (wide — 현재 검증 세트 중 가장 world에 가까운 구도)
  - 주의: 실제 miracle 전용 이미지는 `scripts/generate-world-canvas.js` 실행 필요
- Presence Layer 5개:

| 레이어 | 범위 | 주기 | 진폭 |
|--------|------|------|------|
| sky breath | 상단 62% | 8s | opacity 0.30 → 0.00 |
| star pulse | 상단 중앙 30% | 5s / delay 1.2s | scale 0.96 → 1.04, opacity 0.40 → 1.00 |
| water shimmer | 하단 22~36% | 6.5s / delay 0.7s | translateX ±4%, opacity 0.50 → 1.00 |
| air grain | 전체 | 12s linear | opacity 0.015 고정 (noise texture drift) |
| person still | 하단 32% | 없음 | 고정 anchor overlay |

### Presence 원칙 준수 여부

```
하늘이 미세하게 숨 쉬는가?
  → ✅ skyBreathe 8s — 느끼기 어렵지만 존재함

별이 조용히 깜박이는가?
  → ✅ starPulse 5s — scale 4% 범위, 느껴지지 않을 만큼 작음

물이 조용히 출렁이는가?
  → ✅ waterShimmer 6.5s — horizontal translate 4%, 잔잔함

사람이 움직이는가?
  → ✅ 없음. layer-person-still은 어떤 animation도 없음.

카메라가 드라마를 만드는가?
  → ✅ 없음. 정적 프레임. 카메라 이동 없음.

"느껴지는 순간 이미 과하다" 기준 통과하는가?
  → ✅ 각 레이어 진폭이 의도적으로 극소화됨. 보는 사람이 "뭔가 움직이나?" 수준.
```

### Miracle 검수 질문 평가

```
세계가 살아있는가?
  → ✅ sky breath + star pulse + water shimmer 복합. 정적이 아닌 살아있는 정적.

같은 장소가 더 넓게 느껴지는가?
  → ⚠️ 현재 기반 이미지(curiosity)가 storybook 이미지와 동일.
       실제 miracle 전용 world-canvas 이미지 생성 후 재검수 필요.
       wide angle + person 5-10% silhouette 이미지로 교체하면 해소됨.

과하지 않은가?
  → ✅ trailer 느낌 없음. VFX 없음. 카메라 이동 없음.

DreamTown답나?
  → ✅ 수채화 기반 이미지 + 미세 presence. 세계관 유지됨.
```

---

## 3. Storybook ↔ Miracle 분리 검증

### 같은 세계, 다른 거리

```
같은 것:
  - 동일한 케이블카 공간
  - 동일한 감정 5종 (confusion → fragile_hope)
  - 동일한 색 체계 (야청색, 라벤더 방향)
  - 동일한 별의 여정 (없음 → 탄생 중 → 형성 중)

다른 것:
  storybook    miracle
  ──────────   ───────────────────────
  텍스트 존재   텍스트 없음
  medium/detail   wide (예정)
  감정 가까이   세계 넓게
  정적 이미지   presence layer 살아있음
  사용자 경험   세계 체험
```

### 분리 원칙 준수 여부

```
완전히 다른 색감 체계 사용?
  → ✅ 없음. 동일 색계.

별도 세계관처럼 보이는 연출?
  → ✅ 없음. 같은 세계.

상품 경쟁 구조?
  → ✅ 없음. storybook=감정 클로즈업, miracle=세계 체험으로 역할 분리.
```

---

## 4. 현재 한계 / 다음 단계 조건

```
현재 한계:
  - miracle 전용 world-canvas 이미지 미생성
    → curiosity(wide) 임시 사용 중
    → 실제 검증은 generate-world-canvas.js 실행 후 가능
    → 필요 이미지: yeosu_cablecar_night (또는 cablecar miracle 전용)

  - Presence 레이어 CSS만으로 구성
    → prototype 검증용으로 충분
    → 실제 구현은 presence3.js 연동 필요

  - 감정 간 Presence 속도 차이 없음
    → 현재 모든 감정에 동일 레이어 적용
    → fragile_hope는 더 느린 star pulse 고려 가능
```

---

## 5. 다음 단계

> **팀 감정 검수**

팀과 CEO가 두 프로토타입을 각각 확인한다.

```
storybook-flow-v1.html 검수 기준:
  - 감정이 가까운가?
  - 사용자가 자기 기억을 넣을 공간이 있는가?
  - 설명보다 여운이 남는가?

miracle-presence-v1.html 검수 기준:
  - 세계가 살아있는가?
  - 과하지 않은가?
  - DreamTown답나?
```

검수 통과 후:
1. `scripts/generate-world-canvas.js` 실행 → cablecar miracle 전용 이미지 생성
2. miracle-presence-v1.html의 기반 이미지를 world-canvas 이미지로 교체
3. 두 프로토타입 나란히 재검수 → "같은 세계 / 다른 거리" 최종 확인
4. cafe, hamel_lighthouse 씬으로 순차 확장
