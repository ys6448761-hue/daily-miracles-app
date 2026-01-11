# Render Request Template v1.0

> Visual OS 표준 입력 양식 - 모든 이미지 생성 요청은 이 템플릿 사용

---

## 기본 정보

| 항목 | 값 |
|------|-----|
| **Request ID** | `RR-YYYYMMDD-NNN` |
| **Scene Type** | `team_shot` / `storybook` / `webtoon_panel` / `video_frame` |
| **Engine** | `gemini` / `sora` / `auto` |
| **Requester** | (요청자 이름) |
| **Date** | YYYY-MM-DD |

---

## 자산 참조

### Style Anchor (필수)
```
assets/references/style/miracle_watercolor_anchor.png
```

### Reference Set (캐릭터별)
```
1. assets/references/characters/purmilr/01_front.png
2. assets/references/characters/yeouibozu/01_front.png
3. assets/references/characters/komi/01_front.png
4. assets/references/characters/lumi/01_front.png
5. assets/references/characters/jaemi/01_front.png
6. assets/references/characters/code/01_front.png
```

---

## HARD RULES (강제 - Prompt Compiler 자동 주입)

### CASTING RULE
```
Exactly 6 characters must be visible.
No merging into aura/light/silhouette.
No new characters. No extra mascots.
```

### FIXED POSITIONS (좌석 고정)
```
Leftmost: Yeouibozu (jade green dragon)
Left-second: Komi (ocean blue dragon)
Center: Purmilr (human, purple+gold)
Right-second: Lumi (mint teal dragon)
Rightmost: Code (cyan+navy dragon)
Front-right: Jaemi (coral pink dragon)
```

### LOCK IDENTITY
```
Keep faces/species/outfits/colors/silhouette/body ratio exactly the same.
Do not change any character identity.
Edit only specified target; others unchanged.
```

---

## NEGATIVE RULES (금지)

```
3D render, photorealistic, CGI, digital render
Detailed realistic face, skin pores, realistic eyes
Harsh lighting, sharp shadows, neon colors
Corporate stock photo, generic AI art style
Text, logo, watermark, signature
Dark mood, horror elements, aggressive poses
Mixed art styles, inconsistent character design
Crowded composition, overlapping characters
Hard sci-fi aesthetic, cyberpunk neon
```

---

## Scene Description

```
(여기에 장면 설명 작성)
예: A team portrait of six characters in a digital dragon palace miracle research lab.
```

---

## Output Configuration

| 항목 | 값 |
|------|-----|
| **Aspect Ratio** | 1:1 (1024x1024) |
| **Output Path** | `assets/golden/team_shot_candidate_v{VERSION}.png` |
| **Meta Path** | `assets/golden/team_shot_candidate_v{VERSION}_meta.md` |

---

## Checklist (요청 전 확인)

- [ ] Scene Type 선택됨
- [ ] Reference Set 6개 모두 지정됨
- [ ] Style Anchor 경로 확인됨
- [ ] HARD RULES 검토됨
- [ ] Output Path 버전 번호 확인됨

---

*Aurora5 Visual OS v1.0*
