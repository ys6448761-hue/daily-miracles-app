# Aurora 5 단체샷 - 나노바나나 프롬프트 v1

> **용도**: Google Gemini Nano Banana Pro로 단체샷 생성
> **생성일**: 2026-01-11
> **상태**: 테스트 준비

---

## 사용 방법

### Step 1: Gemini 접속
1. https://gemini.google.com 접속
2. 이미지 생성 모드 선택

### Step 2: 레퍼런스 이미지 첨부 (6개)
아래 순서대로 이미지 업로드:

```
1. assets/references/characters/purmilr/01_front.png
2. assets/references/characters/yeouibozu/01_front.png
3. assets/references/characters/komi/01_front.png
4. assets/references/characters/lumi/01_front.png
5. assets/references/characters/jaemi/01_front.png
6. assets/references/characters/code/01_front.png
```

### Step 3: 프롬프트 입력
아래 전체 프롬프트를 복사하여 붙여넣기:

---

## 완성 프롬프트 (복사용)

```
[ABSOLUTE STYLE LOCK - DO NOT DEVIATE]

Visual Style:
- 2D hand-drawn animation, NOT 3D render
- Ghibli-inspired warmth + Korean webtoon ink style
- Soft watercolor gradients on textured paper
- Hand-painted look with visible brush texture
- Gentle, warm, hopeful mood throughout

Character Consistency Rules:
- Maintain EXACT color palette for each character
- Keep facial features MINIMAL and ABSTRACT
- Preserve silhouette shapes as defined in reference
- NO detailed realistic faces
- NO style mixing between characters

[TEAM SHOT HARD RULES - TOP 10]
1. No new characters. Only the 6 referenced Aurora5 members.
2. No human protagonist / no extra mascots.
3. Do not change species/body type/outfit/colors.
4. Each member must match their reference set identity markers.
5. If drift occurs → multi-turn edit that character only (others locked).
6. Keep the same style anchor throughout.
7. Keep camera/lighting soft watercolor (no hard sci-fi/3D).
8. Background is "digital yonggung", but doesn't overwrite character design.
9. No text/logos in image.
10. Output must pass QA score threshold; otherwise reroll/edit.

[REFERENCE IMAGES]
Image 1 (Purmilr): Royal purple + gold outfit, human male leader, 30s, holding miracle compass
Image 2 (Yeouibozu): Jade green + pearl, flowing hanbok, dragon AI sage, holding yeouiju orb
Image 3 (Komi): Ocean blue + silver, clipboard fish companion, manager dragon AI
Image 4 (Lumi): Mint teal + crystal, constellation chart tablet, analyst dragon AI
Image 5 (Jaemi): Coral pink + sunshine yellow, brush fish, creative dragon AI
Image 6 (Code): Cyan + deep navy, circuit coral patterns, tech dragon AI

[SCENE]
A team portrait of six characters in a digital dragon palace miracle research lab.
All gathered around a central holographic table showing a glowing golden "wish" symbol.
Underwater palace architecture with coral pillars, bioluminescent lighting, starlight filtering through ocean currents above.

[CHARACTER PLACEMENT]
Center: Purmilr (human, royal purple + gold, holding miracle compass)
Left: Yeouibozu (jade green dragon), Komi (ocean blue dragon with clipboard)
Right: Lumi (mint teal dragon with chart), Jaemi (coral pink dragon with brush)
Background center: Code (cyan dragon, slightly behind, digital aura)

[COMPOSITION]
- Purmilr at center-front as focal point
- AI dragons arranged in gentle arc around him
- Holographic table connects all characters
- Each character has distinct color identity but harmonious together
- Warm collaborative energy, unified team

[MOOD]
Warm, hopeful, collaborative energy.
Like a family portrait of a magical research team.
Soft lighting from the wish symbol illuminates all faces gently.

[TECHNICAL]
Aspect ratio: 1:1 (1024x1024)
Style: 2D watercolor illustration, NOT 3D

[NEGATIVE PROMPT]
3D render, photorealistic, CGI, digital render, detailed realistic face, skin pores, realistic eyes, harsh lighting, sharp shadows, neon colors, corporate stock photo, generic AI art style, text, logo, watermark, signature, dark mood, horror elements, aggressive poses, mixed art styles, inconsistent character design, crowded composition, overlapping characters
```

---

## 체크리스트

- [ ] 6개 레퍼런스 이미지 모두 업로드됨
- [ ] 프롬프트 전체 복사됨
- [ ] Gemini 이미지 생성 모드 선택됨
- [ ] 1:1 비율 확인

---

## 예상 결과

| 항목 | 기대값 |
|------|--------|
| 캐릭터 수 | 6명 모두 등장 |
| 스타일 | 지브리 + 웹툰 수채화 |
| 컬러 일관성 | 각 캐릭터 고유색 유지 |
| 구도 | 푸르미르 중앙, AI 5명 주변 배치 |

---

## 변형 옵션

### A. 회의 중 버전
```
[SCENE] 수정:
All characters discussing around the table, some pointing at holographic charts.
Komi holding meeting notes, Lumi presenting data visualization.
```

### B. 축하 버전
```
[SCENE] 수정:
Celebrating a successful wish fulfillment.
Confetti and sparkles, joyful expressions.
Jaemi throwing paint sparkles in the air.
```

### C. 소원이 환영 버전
```
[SCENE] 수정:
Team facing forward with welcoming gestures.
Empty space in foreground for viewer (wish-maker) to feel included.
Warm, inviting expressions.
```

---

*NanoBananaSkill SSOT 시스템 산출물*
