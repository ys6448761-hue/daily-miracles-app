# 웹툰 패널 - 나노바나나 프롬프트 v1

> **용도**: Google Gemini Nano Banana로 웹툰 스타일 패널 생성
> **생성일**: 2026-01-11
> **상태**: 템플릿 준비

---

## 사용 방법

### Step 1: Gemini 접속
1. https://gemini.google.com 접속
2. 이미지 생성 모드 선택

### Step 2: 레퍼런스 이미지 첨부
등장 캐릭터에 해당하는 레퍼런스만 업로드:
```
assets/references/characters/{캐릭터명}/01_front.png
(+ 02_3quarter.png, 03_fullbody.png if available)
```

### Step 3: 프롬프트 입력

---

## 완성 프롬프트 (복사용)

```
[ABSOLUTE STYLE LOCK - DO NOT DEVIATE]

Visual Style:
- Korean webtoon panel style with Ghibli warmth
- Clean ink lines with soft watercolor fills
- Hand-drawn look, NOT digital vector
- Minimal screentone, focus on color gradients

[REFERENCE IMAGES]
Image 1 ({CHARACTER_NAME}): Maintain exact appearance from reference

[SCENE TYPE]
Single panel webtoon illustration
{SCENE_DESCRIPTION}

[COMPOSITION]
- Clear focal point on main character
- Dynamic pose or emotional expression
- Speech bubble space consideration (leave room)
- Panel border style: rounded corners

[ATMOSPHERE]
Warm, hopeful, magical everyday moment
Soft lighting with gentle highlights
Emotional resonance for wish-fulfillment theme

[TECHNICAL]
Aspect ratio: 4:5 (vertical panel)
Style: Korean webtoon + watercolor hybrid

[NEGATIVE PROMPT]
3D, photorealistic, harsh inking, manga screentone, complex backgrounds,
text, speech bubbles (leave space only), dark themes, horror,
detailed realistic faces, CGI look
```

---

## 변수 치환

| 변수 | 설명 | 예시 |
|------|------|------|
| {CHARACTER_NAME} | 등장 캐릭터 | 푸르미르, 재미 |
| {SCENE_DESCRIPTION} | 장면 설명 | 재미가 소원이에게 그림을 보여주는 장면 |

---

## 씬 프리셋

### A. 응원 장면
```
[SCENE TYPE]
재미 character cheering on a wish-maker (viewer perspective)
Warm smile, encouraging gesture
Background: soft sparkles, miracle symbols
```

### B. 분석 장면
```
[SCENE TYPE]
루미 analyzing wish data on holographic chart
Focused expression, pointing at key insight
Background: constellation patterns, data visualization
```

### C. 상담 장면
```
[SCENE TYPE]
여의보주 offering wise counsel
Serene expression, yeouiju glowing softly
Background: peaceful dragon palace interior
```

---

## 체크리스트

- [ ] 등장 캐릭터 레퍼런스 업로드됨
- [ ] {변수} 모두 치환됨
- [ ] 4:5 비율 확인
- [ ] 말풍선 공간 고려됨

---

*NanoBananaSkill SSOT 시스템 산출물*
