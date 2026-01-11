# Result Meta - team_shot_best_v2a

> Aurora5 Visual OS v1.0 결과물 메타데이터 (v2a 기준컷 - v2b 편집 입력용)

---

## 기본 정보

| 항목 | 값 |
|------|-----|
| **Image File** | `assets/golden/team_shot_best_v2a.png` |
| **Equivalent To** | `team_shot_best_v3.png` (동일 이미지) |
| **Request ID** | `RR-20260111-001` |
| **Generated** | 2026-01-11 |
| **Engine** | Gemini |
| **Scene Type** | team_shot |

---

## 입력 자산

### Style Anchor
```
assets/references/style/miracle_watercolor_anchor.png
```

### Reference Set Used
```
1. assets/references/characters/purmilr/01_front.png
2. assets/references/characters/yeouibozu/01_front.png
3. assets/references/characters/komi/01_front.png
4. assets/references/characters/lumi/01_front.png
5. assets/references/characters/jaemi/01_front.png
6. assets/references/characters/code/01_front.png
```

---

## 사용 프롬프트

```
[ABSOLUTE STYLE LOCK - DO NOT DEVIATE]

Visual Style:
- 2D hand-drawn animation, NOT 3D render
- Ghibli-inspired warmth + Korean webtoon ink style
- Soft watercolor gradients on textured paper
- Hand-painted look with visible brush texture
- Gentle, warm, hopeful mood throughout

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
Underwater palace architecture with coral pillars, bioluminescent lighting.

[CHARACTER PLACEMENT]
Center: Purmilr (human, royal purple + gold, holding miracle compass)
Left: Yeouibozu (jade green dragon), Komi (ocean blue dragon with clipboard)
Right: Lumi (mint teal dragon with chart), Jaemi (coral pink dragon with brush)
Background center: Code (cyan dragon, slightly behind, digital aura)

[NEGATIVE PROMPT]
3D render, photorealistic, CGI, detailed realistic face, harsh lighting, text, logo, watermark
```

---

## QA 결과

| 항목 | 값 |
|------|-----|
| **QA Status** | `PASSED` |
| **Score** | 92.5/100 (참고용) |
| **QA Report** | 이 파일 내 포함 |
| **FAIL Tags** | `MARKER_WEAK` (경미 - 코미/코드 구분) |

### QA 상세 점수

| 항목 | 배점 | 점수 | 비고 |
|------|------|------|------|
| 캐릭터 수 | 15 | 15 | 6명 모두 등장 |
| 신규 캐릭터 없음 | 10 | 10 | OK |
| 푸르미르 일관성 | 6 | 6 | 완벽 |
| 여의보주 일관성 | 5 | 5 | OK |
| 코미 일관성 | 5 | 4 | 마커 약간 약함 |
| 루미 일관성 | 5 | 5 | OK |
| 재미 일관성 | 5 | 5 | 완벽 |
| 코드 일관성 | 4 | 3 | 마커 약간 약함 |
| 푸르미르 중앙 | 8 | 8 | OK |
| AI 5명 배치 | 7 | 7 | OK |
| 수채화 톤 | 8 | 8 | OK |
| 질감 일관성 | 7 | 7 | OK |
| 마커 구분 | 6 | 5 | 블루 계열 구분 약간 어려움 |
| 마커 가시성 | 4 | 4 | OK |
| 텍스트/로고 없음 | 5 | 5 | 깨끗함 |
| **합계** | **100** | **92.5** | **PASSED** |

---

## Repair History (수정 이력)

| 회차 | 수정 내용 | 결과 |
|------|----------|------|
| - | 없음 (초기 생성) | PASSED |

---

## Validation (10회 검증)

| 항목 | 값 |
|------|-----|
| **Validation Required** | Yes (Best 승격 시) |
| **Validation Path** | `reports/validation/2026-01-11/team_shot_run01~10.md` |
| **Result** | 대기 중 |
| **Status** | `NOT_READY` |

---

## 승격 기록

| 항목 | 값 |
|------|-----|
| **Promoted to Best** | Yes |
| **Best Path** | `assets/golden/team_shot_best_v3.png` |
| **Promoted Date** | 2026-01-11 |

---

## 비고

```
- 첫 번째 Visual OS 공식 후보 등록
- QA PASSED (92.5점)
- 10회 검증 후 Best 승격 예정
- MARKER_WEAK 태그 있으나 PASSED 범위 내
```

---

*Aurora5 Visual OS v1.0*
