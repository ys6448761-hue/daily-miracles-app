# DreamTown 영상 제작 파이프라인

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown 영상 제작 표준 파이프라인 — Aurora5 방식

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 핵심 원칙

```
영상 제작이 아니라 영상 파이프라인이다.

Character SSOT
      ↓
Image generation (캐릭터 고정)
      ↓
Storyboard (3 shots per scene)
      ↓
5-second video units
      ↓
Video assembly
      ↓
Subtitle burn-in
```

---

## Phase 1 — 캐릭터 시드 이미지 (Character SSOT)

영상 생성 전 **캐릭터 시드 이미지를 먼저 생성**한다.
이 이미지가 모든 영상의 캐릭터 기준이 된다.

### 별씨 (Byeolssi) 이미지 프롬프트

> ✅ CEO 확정: **옵션 B — 작은 빛 생명체 (눈 있는 별)** (2026-03-09)

```
a small glowing star creature called Byeolssi,
tiny round light body with gentle glowing eyes,
soft warm glow radiating from the body,
small expressive eyes that convey emotion,
floating in deep blue cosmic space,
minimalist design,
Studio Ghibli style mixed with Korean animation style,
soft watercolor shading,
2D hand-drawn animation look,
consistent character design,
simple shapes,
emotional and warm atmosphere,
capable of expressing joy, wonder, and warmth through eyes
```

### 캐릭터 고정 조건 (나노바나나 기법)

**모든 영상 프롬프트에 아래 문장 반드시 포함:**

```
same character design
consistent character shape
same glowing star character
no character redesign
keep identical visual identity
```

---

## Phase 2 — 스토리보드 (3 shots per scene)

Aurora5 규칙: **1 scene = 3 shots**

### DreamTown 기본 5장면 구조

| Scene | Shot 1 | Shot 2 | Shot 3 |
|-------|--------|--------|--------|
| 1. 빛 등장 | dark universe | small glowing light appears | light floats gently |
| 2. 별 탄생 | light glows brighter | light transforms | becomes star (별씨) |
| 3. 별 증가 | one star | more stars appear | stars multiply |
| 4. 별자리 형성 | stars connect | lines form | turtle constellation appears |
| 5. 우주 탄생 | constellation glows | zoom out | DreamTown universe revealed |

---

## Phase 3 — 영상 프롬프트 (5초 유닛)

영상은 **5초 단위**로 생성한다.

### 기본 스타일 헤더 (모든 유닛 공통)

```
2D animation, Studio Ghibli + Korean webtoon style,
soft watercolor lighting, hand-drawn animation,
soft emotional tone, consistent character design
```

### Video Unit 1 — 빛 등장 (5초)

```
2D animation, Studio Ghibli + Korean webtoon style, soft watercolor lighting

Shot 1: dark cosmic universe with soft stars and floating particles
Shot 2: a tiny glowing light appears slowly in the center
Shot 3: the light floats gently, pulsing softly

camera slow zoom in, soft motion, emotional tone,
same character design, keep identical visual identity
```

### Video Unit 2 — 별 탄생 (5초)

```
2D animation, Studio Ghibli + Korean webtoon style, soft watercolor lighting

Shot 1: the glowing light grows brighter
Shot 2: light begins to take shape
Shot 3: transforms into a small star character (Byeolssi), gentle and warm

consistent character shape, no character redesign, soft glow
```

### Video Unit 3 — 별 증가 (5초)

```
2D animation, Studio Ghibli + Korean webtoon style, soft watercolor lighting

Shot 1: one Byeolssi star glowing alone
Shot 2: another small star appears nearby
Shot 3: multiple stars fill the dark sky gently

same glowing star character, keep identical visual identity
```

### Video Unit 4 — 별자리 형성 (5초)

```
2D animation, Studio Ghibli + Korean webtoon style, soft watercolor lighting

Shot 1: stars floating in the night sky
Shot 2: soft golden lines connect between stars
Shot 3: a turtle-shaped constellation forms (Golden Nine Constellation)

watercolor style connecting lines, warm golden glow (#F4C542)
```

### Video Unit 5 — 우주 탄생 (5초)

```
2D animation, Studio Ghibli + Korean webtoon style, soft watercolor lighting

Shot 1: constellation glows brighter
Shot 2: slow zoom out reveals the full night sky
Shot 3: a beautiful cosmic world — DreamTown universe

soft purple night sky (#9B87F5), warm and hopeful atmosphere
```

**총 25초 영상 (5유닛 × 5초)**

---

## Phase 4 — 자막 처리 (TEXT ZERO 규칙)

### TEXT ZERO 규칙

```
영상 생성 모델에 한글 텍스트를 넣지 않는다.
```

이유: 영상 생성 AI는 한글을 정확히 렌더링하지 못한다 (깨짐 발생).

### 자막 후처리 파이프라인

```
영상 생성 (텍스트 없음)
      ↓
SRT 자막 파일 작성
      ↓
ASS 자막 스타일 적용
      ↓
FFmpeg burn-in
      ↓
최종 영상 출력
```

---

## 스타일 규칙 요약

### 반드시 포함
```
2D animation
Studio Ghibli style
Korean animation style
watercolor lighting
hand-drawn animation
soft emotional tone
```

### 금지
```
3D
photorealistic
cinematic realism
physics simulation
```

---

## 미결 사항

| 항목 | 상태 | 내용 |
|------|------|------|
| 별씨 디자인 방향 | **✅ 확정** | B: 눈 있는 빛 생명체 (2026-03-09 CEO 결정) |
| 별씨 ↔ 소원이 관계 | 미정 | 동일 캐릭터? 별개 캐릭터? |
| FFmpeg 자막 세팅 | 미정 | 폰트·크기·위치 |

---

## 참조

- 캐릭터 기준: `docs/ssot/DreamTown_Character_SSOT.md`
- 스타일 기준: `docs/ssot/DreamTown_Visual_Style_SSOT.md`
- 이미지 프롬프트: `docs/design/DreamTown_Image_Prompts_SSOT.md`
- 핵심 스토리보드: `docs/design/DreamTown_Core_Storyboard_SSOT.md`
