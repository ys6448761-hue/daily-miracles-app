# 캐릭터 일관성 가드 (Consistency Guard)

> **용도**: 모든 이미지 생성 시 필수 포함하는 일관성 강제 문장
> **적용**: 프롬프트 맨 앞에 항상 삽입

---

## 필수 삽입 문장 (영문)

### 전체 가드 (Full Guard)

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

Quality Standards:
- Clean, readable silhouettes
- Harmonious color composition
- Soft lighting, no harsh shadows
- Dreamy atmospheric depth

[END STYLE LOCK]
```

### 간략 가드 (Short Guard)

```
STYLE: 2D watercolor, Ghibli + Korean webtoon, warm hopeful mood.
MUST: Exact character colors, minimal faces, hand-painted texture.
NEVER: 3D, photorealistic, detailed faces, harsh lighting.
```

---

## 캐릭터별 컬러 가드

### 반드시 지켜야 할 컬러

| 캐릭터 | 메인 컬러 | 서브 컬러 | 금지 컬러 |
|--------|----------|----------|----------|
| 푸르미르 | 로열 퍼플 #7E57C2 | 골드 #FFD700 | 블루, 레드 |
| 여의보주 | 제이드 그린 #00897B | 진주빛 #E0E0E0 | 핑크, 오렌지 |
| 코미 | 오션 블루 #1976D2 | 실버 #B0BEC5 | 그린, 퍼플 |
| 루미 | 민트 틸 #26A69A | 크리스탈 #E0F7FA | 핑크, 레드 |
| 재미 | 코랄 핑크 #FF7043 | 선샤인 #FFEE58 | 블루, 퍼플 |
| 코드 | 사이언 #00BCD4 | 딥 네이비 #0D47A1 | 핑크, 오렌지 |

---

## 금지 요소 (Negative Prompt)

### 항상 포함할 Negative

```
NEGATIVE PROMPT (Always Include):
3D render, photorealistic, CGI, digital render,
detailed realistic face, skin pores, realistic eyes,
harsh lighting, sharp shadows, neon colors,
corporate stock photo, generic AI art style,
text, logo, watermark, signature,
dark mood, horror elements, aggressive poses,
mixed art styles, inconsistent character design.
```

### 상황별 추가 Negative

| 상황 | 추가 Negative |
|------|--------------|
| 단체샷 | crowded composition, overlapping characters |
| 스토리북 | scary elements, adult themes |
| 웹툰 | excessive screentone, manga style |
| 영상 프레임 | static pose, complex overlaps |

---

## 단체샷 금지 규칙 Top 10 (Team Shot Hard Rules)

> **적용**: 단체샷(Group Shot) 생성 시 반드시 프롬프트에 포함

```
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

[END HARD RULES]
```

### 규칙 요약 (한글)

| # | 규칙 | 위반 시 조치 |
|---|------|-------------|
| 1 | 새 캐릭터 금지 - Aurora5 6명만 | 즉시 리롤 |
| 2 | 인간 주인공/추가 마스코트 금지 | 즉시 리롤 |
| 3 | 종족/체형/의상/색상 변경 금지 | 해당 캐릭터 수정 |
| 4 | 레퍼런스 ID 마커 일치 필수 | 해당 캐릭터 수정 |
| 5 | 드리프트 발생 시 해당 캐릭터만 수정 (나머지 잠금) | 멀티턴 수정 |
| 6 | 동일 스타일 앵커 유지 | 앵커 재첨부 |
| 7 | 소프트 수채화 조명 유지 (하드 SF/3D 금지) | 즉시 리롤 |
| 8 | 디지털 용궁 배경은 캐릭터 디자인 덮어쓰기 금지 | 배경만 수정 |
| 9 | 이미지 내 텍스트/로고 금지 | 인페인팅 제거 |
| 10 | QA 점수 미달 시 리롤/수정 | 재생성 |

---

## 레퍼런스 첨부 규칙

### 필수 첨부 순서

```
1. Style Anchor (스타일 앵커)
   → assets/references/style/aurora5_style_anchor.png
   → 항상 첫 번째로 첨부

2. Character References (등장 캐릭터별)
   → assets/references/characters/{NAME}/01_front.png
   → 등장하는 캐릭터만 첨부

3. Scene Reference (선택)
   → 비슷한 구도의 이전 승인 이미지가 있으면 첨부
```

### 첨부 시 설명 문구

```
[REFERENCE IMAGES]
Image 1: Style anchor - match this exact watercolor texture and warmth
Image 2: {CHARACTER_NAME} - maintain this exact appearance
Image 3: {CHARACTER_NAME} - maintain this exact appearance
...
```

---

## 프롬프트 조립 순서

```
1. [CONSISTENCY GUARD] - 이 문서의 Full Guard
2. [STYLE LOCK] - 씬 템플릿의 스타일 섹션
3. [CHARACTER SUMMARIES] - 등장 캐릭터 바이블 요약
4. [SCENE DESCRIPTION] - 씬 템플릿의 장면 설명
5. [CUSTOM PROMPT] - 사용자 추가 지시
6. [NEGATIVE] - 금지 요소
```

---

## 체크리스트 (생성 전)

- [ ] Full Guard 또는 Short Guard 포함됨
- [ ] 캐릭터별 컬러 가드 확인됨
- [ ] Negative 프롬프트 포함됨
- [ ] Style Anchor 이미지 첨부됨
- [ ] 등장 캐릭터 레퍼런스 첨부됨

---

*마지막 업데이트: 2026-01-11 (v1.1 - 단체샷 금지 규칙 Top 10 추가)*
