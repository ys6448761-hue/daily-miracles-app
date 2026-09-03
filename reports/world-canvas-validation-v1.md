# World-Canvas Validation — cablecar Miracle v1

**생성일**: 2026-05-25
**모델**: gpt-image-1 / 1024x1536
**비용**: $0.04
**SSOT**: docs/ssot/dreamtown/DreamTown_Emotion_Grammar_v1.md
**Presence Rule**: docs/ssot/dreamtown/DreamTown_Presence_Rule_v1.md

---

## 생성 파일

| 종류 | 파일 |
|------|------|
| world-canvas 이미지 | `public/images/world-canvas/validation/cablecar/cablecar_world_canvas_v1.png` |
| Miracle Presence prototype | `public/debug/miracle-presence-v1.html` |
| Storybook Flow prototype | `public/debug/storybook-flow-v1.html` |

---

## 1. World-Canvas 이미지 검수

### 구성 의도

```
storybook: 케이블카 내부 시점 — 창문 너머, 인물 가까이, 감정 클로즈업
miracle:   케이블카 외부 시점 — 항구 해변, 세계 넓게, 인물은 목격자
```

### 시각 검수 결과

```
케이블카 위치:
  → ✅ 상단 중앙 작고 조용하게 존재. "영웅 구도" 없음.
     케이블 선이 하늘을 조용히 가르는 실처럼 처리됨.

인물:
  → ✅ 하단 8% 수준 실루엣. 목격자로서 세계를 바라봄.
     행동 없음. 연기 없음. 시선 유도 없음.

색 체계:
  → ✅ 딥 블루-블랙 수채화 전체 유지.
     warm/golden drift 없음. 차갑지 않음. 야청색.

항구 + 물:
  → ✅ 수면에 도시 불빛 반사 — 잔잔, 드라마 없음.
     빛 블룸 없음. 홀로 빛나는 드라마 없음.

별:
  → ✅ 상단 하늘에 조용히 존재.
     빛쇼 없음. "이미 도착" 느낌 없음.

수채화 질감:
  → ✅ 붓 터치 결이 보임. 하늘 wash 자연스러움.
     디지털 CG 느낌 없음.

"기억처럼 남는 공기" 기준:
  → ✅ 통과. 멋짐보다 조용한 숨결이 우선됨.
```

---

## 2. Miracle Presence Prototype 검수

### 레이어 구성 (5개)

| 레이어 | 범위 | 주기 | 진폭 | 비고 |
|--------|------|------|------|------|
| sky breath | 상단 62% | 8s | opacity 0.35→0.00 | 하늘 호흡 |
| star breath | 케이블카 영역 40%×30% | 5s / delay 1.4s | scale 0.97→1.03, opacity 0.30→1.00 | 별+케이블카 맥박 |
| water breath | 하단 수면 16% | 7s / delay 0.8s | translateX ±3%, opacity 0.40→0.90 | 잔물결 |
| air grain | 전체 | 14s linear | opacity 0.012 고정 | noise drift |
| person still | 하단 30% | 없음 | 고정 | 인물 무움직임 anchor |

### 검수

```
레이어가 보이는가?
  → ✅ 의도적으로 감지 불가능 수준.
     "움직이나?" 수준. 느껴지는 순간 이미 과하다 기준 통과.

debug 느낌이 남아 있는가?
  → ✅ 제거 완료.
     label, legend, motion indicator, presence-note 모두 삭제됨.
     UI 존재감 없음.

"왜인지 모르겠는데 살아있는 느낌" 기준:
  → ✅ 의도됨. 하늘이 아주 조금 숨 쉬고, 별이 조용히 맥박치고,
     물이 아주 조금 움직인다.
     이 세 가지가 비동기로 작동해 "살아있는 정적" 만들어냄.
```

---

## 3. Storybook ↔ Miracle 분리 검증

### 나란히 놓았을 때

```
같은 것:
  - 같은 여수 밤
  - 같은 케이블카
  - 같은 딥 블루 색계
  - 같은 감정 우주 (confusion → fragile_hope)

다른 것:
  storybook                   miracle
  ────────────────────────    ────────────────────────────
  케이블카 내부                케이블카 외부/항구
  창문 프레임 가까이            하늘+항구 중심
  인물 1/3 이상                인물 8% 실루엣
  감정 문장 존재               텍스트 없음
  정적 이미지                  presence layer 살아있음
  "내 감정 가까이"              "내 감정이 살아있는 세계"
```

### 핵심 분리 질문

```
1. storybook은 감정 가까움으로 느껴지는가?
   → ✅ 이미지+문장이 인물 옆에 조용히 있음.
      "오늘은 어디로 가야 할지 모르겠어요." — 해석 없음, 여운 있음.

2. miracle은 세계 숨결로 느껴지는가?
   → ✅ 인물은 목격자, 세계가 살아있음.
      케이블카 작게, 하늘+항구 넓게, 별이 맥박침.

3. 같은 세계처럼 유지되는가?
   → ✅ 동일 색계, 동일 케이블카, 동일 여수.
      "다른 세계"가 아니라 "다른 거리".

4. 과하지 않은가?
   → ✅ storybook: 조용한 slide, fade 전환.
      miracle: 레이어 진폭 극소화, 카메라 이동 없음.

5. DreamTown답나?
   → ✅ 2D 수채화, 감정 우선, 기술 최소.
      "멋짐보다 기억처럼 남는 공기" 원칙 유지.
```

---

## 4. 적용 전/후 비교

```
miracle-presence-v1 (이전):
  기반 이미지: cablecar_curiosity_v1.png (storybook wide 이미지 임시 사용)
  문제: storybook 이미지와 동일한 이미지를 presence로만 다르게 처리
        "같은 그림 움직인 거네?" 가능성 존재
        debug label, legend, 이름 표시 등 prototype 느낌 잔류

miracle-presence-v1 (이후):
  기반 이미지: cablecar_world_canvas_v1.png (miracle 전용 외부 시점)
  변화: 완전히 다른 거리와 시점 — 내부 → 외부, 인물 크기 1/3 → 8%
        debug 제거 완료 — UI 존재감 없음
        "살아있는 정적"으로서의 분리 체감 가능
```

---

## 5. 현재 한계

```
Presence 레이어:
  현재 CSS only. 실제 Presence v0.3(presence3.js) 연동은 미완.
  CSS 프로토타입으로 개념 검증 단계. 체감 검증에는 충분.

감정별 Presence 차이:
  현재 모든 감정에 동일 레이어 적용됨.
  fragile_hope → 더 느린 별 맥박 / curiosity → 약간 빠른 air 등
  감정별 미세 조정은 다음 단계.

world-canvas 1장 전용:
  현재 cablecar 1장만 존재.
  cafe, hamel_lighthouse, stay_room miracle 이미지 미생성.
  cablecar 검증 통과 후 순차 확장 예정.
```

---

## 6. 다음 단계

> **팀 감정 검수**

두 프로토타입을 나란히 확인한다.

```
storybook-flow-v1.html 접속:
  http://localhost:5100/debug/storybook-flow-v1.html
  감정이 가까운가? 여운이 남는가?

miracle-presence-v1.html 접속:
  http://localhost:5100/debug/miracle-presence-v1.html
  세계가 살아있는가? 같은 세계인가?
```

검수 통과 후:
1. cablecar 감정 5종 storybook 이미지 → star-cache 확장 생성
2. cafe, hamel_lighthouse miracle 이미지 생성
3. presence3.js 연동 (CSS presence → JS presence)
4. 감정별 presence 속도 차이 적용 (fragile_hope 더 느리게 등)
