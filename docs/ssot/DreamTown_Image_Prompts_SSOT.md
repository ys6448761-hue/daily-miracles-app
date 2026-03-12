# DreamTown Image Prompts SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: DreamTown 공식 이미지 생성 마스터 프롬프트 — DALL-E/Sora/Midjourney 기준

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 선언

이 문서는 DreamTown 공식 이미지 생성에 사용하는 **마스터 프롬프트**를 정의한다.
모든 이미지 생성 전 이 문서를 먼저 읽고, Style Lock을 반드시 준수한다.

> 상세 스타일 기준: `DreamTown_Character_Style_Guide_SSOT.md`
> 비주얼 스타일 원칙: `DreamTown_Visual_Style_SSOT.md`

---

## Style Lock (필수 — 모든 프롬프트에 적용)

### 허용 (MUST USE)
```
strict 2D hand-drawn illustration
warm watercolor wash background
Ghibli warmth + Korean manhwa linework
soft pastel palette
gentle glowing light effects
night sky with soft stars
```

### 금지 (NEVER USE)
```
NO 3D rendering
NO CGI
NO photorealism
NO anime (Japanese style — DreamTown is Korean-inspired)
NO dark/horror
NO complex mechanical details
NO Western cartoon style
```

---

## 색상 팔레트 (모든 프롬프트 공통)

| 용도 | 색상 | 코드 |
|------|------|------|
| 아우룸 (황금 거북) | 따뜻한 황금색 | #F4C542 |
| DreamTown 메인 | 소프트 퍼플 | #9B87F5 |
| 소원이 포인트 | 핑크/코랄 | #F5A7C6 |
| 배경 강조 | 딥 퍼플 | #6E59A5 |
| 배경 베이스 | 연핑크 | #FFF5F7 |
| 별빛 | 소프트 화이트 | #FFF8E7 |

---

## PROMPT-01. 아우룸 (Aurum) 캐릭터

### 용도
- 아우룸 단독 등장 장면
- 안내자/수호자 역할 강조 장면

### 마스터 프롬프트
```
A small golden turtle named Aurum, strict 2D hand-drawn illustration,
warm watercolor wash style, soft glowing golden shell (#F4C542),
gentle warm light radiating from the shell,
swimming through a deep blue starry night sky,
surrounded by soft floating star particles,
Korean manhwa linework, Ghibli warmth,
soft pastel color palette, dreamy atmosphere,
NO 3D, NO CGI, NO photorealism
```

### 상태별 변형

| 상태 | 추가 프롬프트 |
|------|------------|
| 기본 (수영) | swimming gently through starry sky |
| 안내 (빛 발산) | radiating a soft beam of golden light forward |
| 용궁 (바다 속) | swimming in deep ocean with golden bioluminescent glow |
| 북극성과 함께 | gazing up at a single bright north star, leading the way |
| 소원이와 함께 | gently guiding a small glowing wish-spirit forward |
| 잠자는 별 | curled up sleeping, shell glowing softly as a small star |

---

## PROMPT-02. 소원이 (Sowoni) 캐릭터

### 용도
- 소원이 단독 등장 장면
- 사용자 여정 장면

### 마스터 프롬프트
```
A small glowing wish-spirit named Sowoni, strict 2D hand-drawn illustration,
soft watercolor style, gentle pink and lavender glow (#F5A7C6, #9B87F5),
small round soft form with delicate light wings or trails,
floating above the sea of Yeosu at night,
surrounded by tiny sparkling stars,
Korean manhwa linework, warm Ghibli atmosphere,
soft pastel color palette, hopeful and gentle mood,
NO 3D, NO CGI, NO photorealism
```

### 상태별 변형

| 상태 | 추가 프롬프트 |
|------|------------|
| 소원 입력 | holding a tiny glowing wish light in both hands |
| 첫 별 탄생 | transforming into a rising star, ascending to the night sky |
| 아우룸과 함께 | following Aurum the golden turtle through the starry sky |
| 별자리 도달 | joining a constellation of small stars |
| 슬픔/고민 | slightly dimmed glow, looking down gently, soft warm colors still |
| 기쁨/성장 | bright glowing, spinning joyfully, trails of golden light |

---

## PROMPT-03. DreamTown 핵심 장면 (KV-01: 소원이 별이 되는 순간)

### 용도
- 브랜드 포스터
- 앱 소개 화면
- 캠페인 핵심 비주얼

### 마스터 프롬프트
```
A magical scene over the sea of Yeosu, South Korea, at night,
strict 2D hand-drawn illustration, warm watercolor style,
a small wish-spirit (Sowoni) sitting on a rock above the calm ocean,
transforming into a rising star, surrounded by soft golden light particles,
a small golden turtle (Aurum) nearby radiating gentle light,
in the background a turtle-shaped constellation forms in the night sky,
Korean manhwa linework, Ghibli warmth,
soft purple and pink night sky (#9B87F5, #F5A7C6),
golden glowing accents (#F4C542),
dreamy, hopeful, gentle atmosphere,
NO 3D, NO CGI, NO photorealism
```

---

## PROMPT-04. DreamTown 세계관 (Golden Turtle Constellation)

### 용도
- KV-02 황금거북 별자리 장면
- 세계관 소개 영상
- 커뮤니티 상징 비주얼

### 마스터 프롬프트
```
A vast night sky above the sea of Yeosu, South Korea,
strict 2D hand-drawn illustration, warm watercolor style,
a golden turtle constellation formed by 9 connected stars,
connecting lines drawn in soft golden light,
the turtle shape clearly visible in the stars,
below, the calm Yeosu sea reflects the constellation light,
soft purple and deep blue night sky,
golden star connecting lines (#F4C542),
Korean manhwa linework, Ghibli warmth,
peaceful, ancient, majestic atmosphere,
NO 3D, NO CGI, NO photorealism
```

---

## PROMPT-05. 아우룸과 북극성 (KV-03)

### 용도
- KV-03 아우룸과 북극성 장면
- 안내·방향·희망 상징 비주얼

### 마스터 프롬프트
```
A small golden turtle (Aurum) swimming upward through a starry night sky,
strict 2D hand-drawn illustration, warm watercolor style,
looking toward a single bright north star (Yeouiboju) glowing at the center of the sky,
a beam of gentle golden light connecting Aurum to the north star,
below, a tiny wish-spirit (Sowoni) follows Aurum's path,
soft purple and blue night sky with warm gold accents,
Korean manhwa linework, Ghibli warmth,
hopeful, guiding, serene atmosphere,
NO 3D, NO CGI, NO photorealism
```

---

## PROMPT-06. 용궁 (Dragon Palace)

### 용도
- 용궁 세계관 소개
- 소원 전달 장면

### 마스터 프롬프트
```
An ancient magical dragon palace beneath the sea of Yeosu,
strict 2D hand-drawn illustration, warm watercolor style,
glowing soft teal and golden architecture,
golden turtles swimming around the palace,
tiny glowing wish lights floating upward toward the surface,
deep ocean atmosphere with bioluminescent particles,
Korean traditional architecture elements mixed with fantasy,
Korean manhwa linework, Ghibli warmth,
mysterious yet warm and safe atmosphere,
NO 3D, NO CGI, NO photorealism
```

---

## 영상 프롬프트 (Sora / Gen-2)

### 오프닝 시퀀스
```
Slow zoom out from a single glowing star above the sea of Yeosu at night,
revealing a turtle-shaped constellation,
2D animation style, warm watercolor aesthetic,
gentle orchestral music implied in the visual rhythm,
soft particle effects, dreamy slow motion,
Korean manhwa animation style, Studio Ghibli warmth
```

---

## 사용 규칙

1. **Style Lock 항상 마지막에 추가**: 모든 프롬프트 끝에 `NO 3D, NO CGI, NO photorealism` 포함
2. **색상 코드 명시**: 중요 색상은 hex 코드로 프롬프트에 포함
3. **캐릭터 이름 명시**: "Aurum the golden turtle", "Sowoni the wish-spirit"로 명확히 지정
4. **배경 지정**: "sea of Yeosu, South Korea" — 지역 정체성 유지
5. **분위기 키워드**: dreamy / hopeful / gentle / warm / ancient — 항상 하나 이상 포함

---

## 참조

- 캐릭터 스타일: `DreamTown_Character_Style_Guide_SSOT.md`
- 비주얼 스타일: `DreamTown_Visual_Style_SSOT.md`
- 핵심 비주얼: `DreamTown_Key_Visuals_SSOT.md`
- 캐릭터 정의: `DreamTown_Character_SSOT.md`
- 원전 신화: `DreamTown_Origin_Myth_SSOT.md`
