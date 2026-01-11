# 영상 프레임 - 나노바나나 프롬프트 v1

> **용도**: Google Gemini Nano Banana로 영상용 키프레임 생성
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
- 2D animation keyframe, Ghibli-inspired
- Soft watercolor gradients on textured paper
- Hand-painted look with visible brush texture
- Cinematic composition for video use

[REFERENCE IMAGES]
Image 1 ({CHARACTER_NAME}): Maintain exact appearance from reference

[SCENE TYPE]
Video keyframe for animated content
{SCENE_DESCRIPTION}

[COMPOSITION]
- 16:9 aspect ratio (video standard)
- Rule of thirds for character placement
- Dynamic but not frozen pose
- Implies motion/sequence potential

[CAMERA]
{CAMERA_TYPE}
Depth of field with soft bokeh background
Warm lighting from wish symbol or sunlight

[ATMOSPHERE]
Cinematic warmth, story moment
Emotional beat captured in single frame
Suitable for video thumbnail or key moment

[TECHNICAL]
Aspect ratio: 16:9 (1920x1080)
Style: 2D animation keyframe
Purpose: Video content / thumbnail

[NEGATIVE PROMPT]
3D render, CGI, stiff pose, static composition,
photo-real, harsh shadows, dark mood,
text, watermark, complex overlapping elements,
multiple focal points, cluttered frame
```

---

## 카메라 프리셋

| 프리셋 | CAMERA_TYPE 값 |
|--------|----------------|
| 클로즈업 | Close-up shot, face and shoulders visible |
| 미디엄 | Medium shot, waist up, character interaction space |
| 와이드 | Wide shot, full environment with small character |
| 오버숄더 | Over-the-shoulder, viewer perspective looking at character |

---

## 씬 프리셋

### A. 인트로 프레임
```
[SCENE TYPE]
Opening moment - Aurora 5 team logo reveal
Soft light rays, magical particles
Characters silhouetted or partially visible
```

### B. 하이라이트 프레임
```
[SCENE TYPE]
Key emotional moment - wish fulfillment celebration
{CHARACTER_NAME} with joyful expression
Sparkles, confetti, warm golden light
```

### C. 엔딩 프레임
```
[SCENE TYPE]
Closing moment - peaceful resolution
Sunset/starlight over dragon palace
Team gathered in harmonious composition
```

---

## 체크리스트

- [ ] 등장 캐릭터 레퍼런스 업로드됨
- [ ] {변수} 모두 치환됨
- [ ] 16:9 비율 확인
- [ ] 카메라 타입 선택됨

---

*NanoBananaSkill SSOT 시스템 산출물*
