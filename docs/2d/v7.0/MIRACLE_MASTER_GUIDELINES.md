# MIRACLE MASTER GUIDELINES v7.0

> **Canonical Document - 2D Ghibli+Webtoon Track**
> Sources: 20260131_파크_2d_기술지원.md, 20260201_드라이브_공유폴더_마스터가이드.md
> Last updated: 2026-02-01

---

## 1. 제작 철학

> "우리는 영상을 만드는 것이 아니라, 5초의 마법을 조립한다."

- **One Shot, One Emotion**: 5초 유닛 하나에는 오직 하나의 명확한 감정만 담는다
- **Visual Storytelling**: 자막 없이 그림만 봐도 상황(Pain/Solution)이 이해되어야 한다
- **Pure 2D**: 100% 2D 지브리+한국 웹툰 융합 스타일

---

## 2. STYLE_LOCK (스타일 잠금)

### 필수 주입 문구

```
[STYLE LOCK]
Strict 2D hand-drawn animation style.
Ink line art + warm watercolor wash + paper grain texture.
Ghibli-inspired warmth mixed with Korean manhwa linework.
Lighting: Flat lighting (No heavy shadows).

Negative Constraints:
- NO 3D, NO photoreal, NO CGI look
- NO volumetric light, NO glossy highlights
- NO metallic reflections, NO heavy depth of field
```

### BASE 규칙 (반드시 이 3줄 그대로)

```
Line1: 9:16 vertical, pure 2D animation, Ghibli+Korean webtoon fusion style, NO 3D elements, cel animation aesthetic, hand-drawn line art with visible brush strokes.
Line2: Color: warm pastel watercolor, flat color blocks with subtle paper texture, NO gradients resembling 3D shading, edge-lit style like Studio Ghibli background paintings.
Line3: Main: Sowoni(20–22, warm smile, pastel casual clothes, consistent 2D face, simple anime eye style), object: wish paper airplane(소원비행기, origami-style flat rendering), SAFE SPACE action + Yeosu sea background (distant, painted backdrop style).
```

---

## 3. TEXT_ZERO (텍스트 제로 원칙)

```
영상 내 절대 금지:
- NO readable text, NO subtitles, NO logos, NO watermark
- NO 간판, NO UI 텍스트
- 폰 화면: ONLY abstract soft color blocks + bubble shapes
- 모든 텍스트는 후편집 자막으로만 처리
```

---

## 4. CHARACTER_LOCK (캐릭터 잠금)

### 소원이 (Sowoni)

```
[SOWONI LOCK v2]
- adult Korean college student, early 20s (20–22), NOT a minor
- No school uniform, avoid teen/child cues
- No readable text on clothing/objects
- Simple anime line art, large expressive eyes (웹툰 스타일 큰 눈)
- Minimal nose (small dot or simple line), soft rounded face
- NO realistic facial anatomy, NO motion capture fluidity
- Flat cel-shaded clothes (no 3D cloth sim wrinkles)

의상 프리셋:
- SPRING_CASUAL: 봄 캐주얼
- SUMMER_SEASIDE: 여름 바닷가
- AUTUMN_COZY: 가을 아늑함 (니트/편안함)
- WINTER_COAT: 겨울 코트
- NIGHT_WALK: 밤 산책
```

### 아우룸 (Aurum)

```
[AURUM TURTLE LOCK v2]
Aurum is a small warm golden turtle-spirit "seed" character.
- Rounded shell-orb body with simple scute plates (6–10 only)
- Minimal turtle face: two small eyes, tiny beak-like mouth, two dot nostrils
- Short little limbs with tiny claws/flippers visible
- Subtle watercolor halo ring (NOT volumetric light rays)
- One small crescent-rune mark on the shell (fixed position)

금지 사항:
- No jewelry, no clothing-like patterns
- No human baby face, no eyelashes, no teeth

상태 프리셋:
- BASE: 기본
- OBSERVE: 관찰/집중
- GUIDE: 미소/인도
- SPARKLE: 감동/반짝임
- COZY_BREEZE: 바람 탐
- NIGHT_CALM: 차분함
```

---

## 5. 5초 유닛 시스템 (3-Beat 리듬)

| Beat | 시간 | 역할 | 연출 |
|------|------|------|------|
| **Beat A** | 0~2s | 시선 고정 (Hook) | 눈 깜빡임, 숨소리, Push-in |
| **Beat B** | 2~4s | 마법의 순간 (Action) | 핵심 동작, 감정 변화, SFX 포인트 |
| **Beat C** | 4~5s | 연결 & 여백 (Hold) | 0.8~1.0초 홀드, 자막/CTA 공간 확보 |

### 영상 길이별 패키지

| 길이 | 씬 수 | 용도 |
|------|-------|------|
| 20초 | 4씬 | 숏폼 티저 |
| 30초 | 6씬 | 표준 홍보영상 |
| 55초 | 11씬 | 기적영상 스토리북 |

---

## 6. 컬러 스크립트 (Color Script)

### PAIN 단계
```
- Cool grey tones
- Desaturated watercolors
- Blue shadows
→ 차갑고, 채도 낮고, 그늘진 느낌
```

### SOLUTION 단계
```
- Warm golden wash
- Bright pastel colors
- Soft sunlight bloom
→ 따뜻하고, 파스텔톤, 햇살 느낌
```

---

## 7. 배경 시스템 (Background Mode)

### 일반 모드 (GENERIC)

| 코드 | 배경 |
|------|------|
| GN01 | 바닷가 산책로 |
| GN02 | 조용한 골목 |
| GN03 | 카페 창가 |
| GN04 | 공원 벤치 |
| GN05 | 밤 거리 |
| GN06 | 일출/일몰 해변 |

### 여수 모드 (YEOSU)

**규칙:**
- 최소 2개 씬에서 랜드마크 실루엣 노출
- 최소 1개 씬은 랜드마크가 배경의 핵심(Landmark-Anchor)

| 코드 | 랜드마크 | 감정 매칭 |
|------|----------|-----------|
| YS01 | 오동도 해안길 | 설렘, 시작 |
| YS02 | 해상케이블카 | 이동, 여정 |
| YS03 | 돌산공원 야경 | 여운, 마무리 |
| YS04 | 돌산대교 야경 | 흐름, 전환 |
| YS05 | 향일암 일출 | 기적, 소원 (Anchor) |
| YS06 | 빅오 (Big-O) | 시스템, 정답 |
| YS07 | 아쿠아플라넷 | 호기심, 발견 |
| YS08 | 진남관 | 역사, 무게감 |
| YS09 | 종포해양공원 | 산책, 일상 |
| YS10 | 여수수산시장 | 활기, 군중 |

---

## 8. NEGATIVE 프롬프트 (PATCH_NEGATIVE_FIXED_ULTRA)

```
photorealistic, 3D render, CGI, Unreal Engine, Unity, Blender, cinematic lighting, lens flare, depth of field, PBR materials, realistic shading, subsurface scattering, ambient occlusion, ray tracing, global illumination, volumetric fog, HDR, bloom effect, chromatic aberration, motion blur, camera shake, handheld camera, live-action, real camera, bokeh, DSLR, film grain, vignette, color grading, LUT, physically-based rendering, metallic, chrome, reflective surface, glossy, wet surface, glass material, mirror, specular highlights, caustics, refraction, translucent, photoreal skin, realistic hair physics, cloth simulation, particle effects, dynamic lighting, shadow mapping, normal mapping, bump mapping, displacement, tessellation
```

---

## 9. 2D PURITY CHECKLIST

모든 샷(A/B/C)은 아래 5가지를 반드시 만족해야 함:

```
✓ 1. 조명: "soft hand-painted shadow" / "watercolor ambient fill" 만 허용
   ❌ 금지: directional light, spotlight, rim light, three-point lighting

✓ 2. 재질: "matte paper texture" / "flat cel-shaded color" 만 허용
   ❌ 금지: shiny, glossy, reflective, metallic, wet, transparent glass

✓ 3. 카메라: "2D pan/zoom" / "cross-dissolve" 만 허용
   ❌ 금지: dolly, tracking shot, crane shot, aerial shot, drone view

✓ 4. 공간: "layered flat planes like Ghibli" / "painted backdrop" 만 허용
   ❌ 금지: 3D space, perspective grid, vanishing point emphasis

✓ 5. 캐릭터: "simple anime line art" / "webtoon proportion" 만 허용
   ❌ 금지: realistic anatomy, detailed muscle definition, photorealistic skin
```

---

## 10. GHIBLI_KOREAN_STYLE_TOKENS

모든 샷에 최소 3개 포함:

1. Studio Ghibli background painting style
2. Korean webtoon character design
3. Hayao Miyazaki soft color palette
4. Naver webtoon flat rendering
5. Spirited Away ambient mood
6. True Beauty character proportion
7. My Neighbor Totoro nature aesthetic
8. Lore Olympus pastel blocking
9. Kiki's Delivery Service cozy atmosphere
10. Solo Leveling action clarity with 2D lines

---

## 11. 물/바다 표현 (WATER_RENDERING_2D_ONLY)

```
✓ 허용: "painted ocean like Ponyo", "flat watercolor sea wash", "simple wave lines", "impressionist sea backdrop"
❌ 금지: "realistic ocean", "water simulation", "foam detail", "wet surface", "transparent water"
필수: "sea painted as flat backdrop (no 3D water simulation)"
```

---

## 12. FORBIDDEN_KEYWORD_SCANNER

```
🚫 Tier 1 (즉시 거부):
realistic, photorealistic, 3D, CGI, render, Unreal, Unity, cinema 4D, octane render

🚫 Tier 2 (대체 필요):
- "light" → "hand-painted glow" / "watercolor wash"
- "shadow" → "cel-shaded shadow" / "flat shadow"
- "reflection" → "painted highlight" / "simple shine mark"
- "depth" → "layered planes" / "painted distance"
- "camera move" → "2D pan" / "2D zoom"

🚫 Tier 3 (맥락 확인):
- "glow" → OK if "soft painted glow" / NG if just "glow"
- "blur" → OK if "hand-drawn motion blur" / NG if "depth of field blur"
```

---

## 13. FINAL_2D_VERIFICATION (EXPORT 직전 필수)

```
□ 모든 샷에 "2D/cel/Ghibli/webtoon" 키워드 포함?
□ NEGATIVE에 3D 엔진/재질 모두 포함?
□ 조명이 "hand-painted/watercolor"인가?
□ 카메라가 "2D pan/zoom"인가?
□ 바다가 "painted backdrop"인가?
□ Sowoni가 "anime line art/webtoon"인가?
→ 모두 Yes일 때만 EXPORT 출력
```

---

## 14. Disney QC Checklist

1. [ ] 플리커링(Flickering) 없는가?
2. [ ] 손가락/눈 개수 확인 (AI가 자주 틀림)
3. [ ] 감정의 색: Pain(차가움) → Solution(따뜻함)?
4. [ ] 텍스트 제로: 배경 간판/옷에 글자 없는가?
5. [ ] 3박자 리듬: 4~5초 홀드 충분한가?

---

*참조: profiles/2d_ghibli_webtoon.yaml*
