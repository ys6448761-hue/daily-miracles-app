# 영상 제작 핸드오프 가이드 — 실수 방지 매뉴얼

> **대상**: 영상 제작 담당자 (키프레임 생성, Sora I2V 프롬프트 투입, 후편집 담당)
> **목적**: 프롬프트 작성·투입 시 반복되는 위반을 원천 차단
> **기준 문서**: `gpt-video-production.md` (v1.0, 2026-02-18)
> **Last updated**: 2026-02-19

---

## 이 문서를 만든 이유

실제 제작 과정에서 아래 실수가 **반복적으로** 발생했습니다.
이 문서는 "왜 틀렸는지"와 "정확히 어떻게 해야 하는지"를 한 곳에 모아,
**프롬프트를 쓸 때마다 대조할 수 있는 실전 매뉴얼**입니다.

---

# Part 1. 실제 발생한 실수 7가지 (사례 기반)

> 각 항목에 **실제 잘못된 프롬프트 → 올바른 프롬프트** 비교를 포함합니다.
> 프롬프트 작성 시 이 7가지만 체크해도 대부분의 위반을 방지할 수 있습니다.

---

### 실수 #1. STYLE LOCK을 "요약"하거나 "새로 씀"

**발생 상황**: STYLE LOCK 블록을 직접 작성하면서 원문과 다른 내용이 들어감.

```
❌ 잘못된 예시:
[STYLE LOCK v1]
BASE:
- 2D hand-drawn animation
- soft watercolor texture
- gentle cinematic lighting
STYLE TOKENS:
- aurora glow particles        ← 가이드에 없는 임의 토큰
- pastel emotional gradients
```

```
✅ 올바른 예시 (원문 그대로):
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

**규칙**: STYLE LOCK은 **한 글자도 바꾸지 않고 복붙**합니다. 버전 번호를 붙이거나(v1 등), 항목을 추가/삭제/요약하면 안 됩니다.

---

### 실수 #2. BASE 3줄을 빼먹음

**발생 상황**: STYLE LOCK은 넣었지만 BASE 3줄(Line1/Line2/Line3)을 통째로 누락.

**규칙**: STYLE LOCK 바로 뒤에 BASE 3줄이 반드시 와야 합니다. 이 3줄도 **원문 그대로** 복붙합니다.

```
✅ BASE 3줄 (변경 금지, 그대로 사용):

Line1: 9:16 vertical, pure 2D animation, Ghibli+Korean webtoon fusion style,
NO 3D elements, cel animation aesthetic, hand-drawn line art with visible brush strokes.

Line2: Color: warm pastel watercolor, flat color blocks with subtle paper texture,
NO gradients resembling 3D shading, edge-lit style like Studio Ghibli background paintings.

Line3: Main: Sowoni(20–22, warm smile, pastel casual clothes, consistent 2D face,
simple anime eye style), object: wish paper airplane(origami-style flat rendering),
SAFE SPACE action + Yeosu sea background (painted backdrop style).
```

---

### 실수 #3. 소원이를 "정령"이나 다른 존재로 바꿈

**발생 상황**: 소원이를 "Small soft spirit-like character, Round silhouette, Gentle glowing outline"로 묘사 → **사람이 아닌 정령이 됨**.

```
❌ 잘못된 예시:
- Small soft spirit-like character     ← 사람이 아님
- Round silhouette                     ← 소원이 체형이 아님
- Gentle glowing outline               ← 발광체가 됨
- Moves with light floating motion     ← 떠다님
```

```
✅ 올바른 예시 (SOWONI LOCK v2 원문):
[SOWONI LOCK v2]
- adult Korean college student, early 20s (20–22), NOT a minor
- No school uniform, avoid teen/child cues
- No readable text on clothing/objects
- Simple anime line art, large expressive eyes (웹툰 스타일 큰 눈)
- Minimal nose (small dot or simple line), soft rounded face
- NO realistic facial anatomy, NO motion capture fluidity
- Flat cel-shaded clothes (no 3D cloth sim wrinkles)
```

**소원이는 20-22세 한국인 대학생입니다. 정령, 요정, 캐릭터 아이콘이 아닙니다.**

의상 프리셋 5종 중 하나를 반드시 명시:
`SPRING_CASUAL / SUMMER_SEASIDE / AUTUMN_COZY / WINTER_COAT / NIGHT_WALK`

**15초 광고 내에서는 의상을 바꾸지 않습니다** (1종 고정).

---

### 실수 #4. 아우룸을 "빛줄기"나 "오로라"로 바꿈

**발생 상황**: 아우룸을 "Subtle aurora ribbon light that reacts to emotion"으로 묘사 → **거북이가 빛으로 변형됨**.

```
❌ 잘못된 예시:
AURUM PRESENCE:
- Subtle aurora ribbon light            ← 거북이가 아닌 빛줄기
- Never forms readable shapes
```

```
✅ 올바른 예시 (AURUM TURTLE LOCK v2 원문):
[AURUM TURTLE LOCK v2]
- Rounded shell-orb body with simple scute plates (6–10 only)
- Minimal turtle face: two small eyes, tiny beak-like mouth, two dot nostrils
- Short little limbs with tiny claws/flippers visible
- Subtle watercolor halo ring (NOT volumetric light rays)
- One small crescent-rune mark on the shell (fixed position)
- No jewelry, no clothing-like patterns, no human face, no eyelashes, no teeth
```

**아우룸은 거북이입니다. 빛, 리본, 오로라, 구름이 아닙니다.**

상태 프리셋 6종 중 하나를 반드시 명시:
`BASE / OBSERVE / GUIDE / SPARKLE / COZY_BREEZE / NIGHT_CALM`

---

### 실수 #5. TEXT ZERO 위반 — 영상 안에 글자를 넣음

**발생 상황**: 프롬프트에 자막, UI 텍스트, 진단 결과 문구를 직접 넣음.

```
❌ 잘못된 예시:
On-screen subtitle (Korean, soft handwritten font):
"괜찮은 척, 오늘도 했죠?"

Result text fades in:
"당신은 Healing Seeker 성향이 강해요."

Final on-screen text (centered, elegant serif font):
"지금, 당신만을 위한 7일 회복 여정 시작"
```

```
✅ 올바른 방식:
1. 프롬프트에서: 텍스트 관련 지시 일체 없음
2. 폰 화면: ONLY abstract soft color blocks + bubble shapes
3. 자막은: 6단계 중 "5. SUBTITLES + TIMECODES" 섹션에만 기록
4. 자막은: 후편집에서만 오버레이
```

**TEXT ZERO 원문 (매 프롬프트에 포함)**:
```
[TEXT ZERO]
- NO readable text, NO subtitles, NO logos, NO watermark
- NO 간판, NO UI 텍스트
- 폰 화면: ONLY abstract soft color blocks + bubble shapes
- 모든 텍스트는 후편집 자막으로만 처리
```

**특히 주의**: 폰 화면에 "진단 인터페이스", "질문", "결과 텍스트"를 넣으면 안 됩니다.
폰 화면은 **추상적인 색 블록과 거품 형태**만 허용됩니다.

---

### 실수 #6. NEGATIVE 프롬프트를 축소하거나 생략함

**발생 상황**: 40+ 단어의 전체 NEGATIVE 프롬프트를 10줄로 요약하거나 생략.

```
❌ 잘못된 예시 (축소):
NO readable text
NO subtitles
NO sharp 3D lighting
NO hyper-detailed textures
NO brand logos
```

```
✅ 올바른 예시 (전량 — 한 줄도 빼지 않음):
[NEGATIVE]
photorealistic, 3D render, CGI, Unreal Engine, Unity, Blender,
cinematic lighting, lens flare, depth of field, PBR materials,
realistic shading, subsurface scattering, ambient occlusion,
ray tracing, global illumination, volumetric fog, HDR, bloom effect,
chromatic aberration, motion blur, camera shake, handheld camera,
live-action, real camera, bokeh, DSLR, film grain, vignette,
color grading, LUT, physically-based rendering, metallic, chrome,
reflective surface, glossy, wet surface, glass material, mirror,
specular highlights, caustics, refraction, translucent,
photoreal skin, realistic hair physics, cloth simulation,
particle effects, dynamic lighting, shadow mapping, normal mapping,
bump mapping, displacement, tessellation
```

**규칙**: 이 목록은 **전량 복붙**합니다. "비슷한 뜻이니까 줄여도 되겠지"가 가장 위험한 판단입니다.

---

### 실수 #7. 5초 유닛 × 3-Beat 구조를 무시함

**발생 상황**: 15초를 1개 씬으로 작성. 감정 3개가 한 씬에 혼재.

```
❌ 잘못된 예시:
Scene begins with exhaustion... then she discovers the app...
then she feels hopeful... (15초를 하나로)
```

```
✅ 올바른 구조:

유닛 1개 = 5초 = 감정 1개 (One Shot, One Emotion)

각 유닛 내부:
  Beat A (0–2s): 시선 고정 (Hook) — 눈 깜빡임, 숨소리, Push-in
  Beat B (2–4s): 마법의 순간 (Action) — 핵심 동작, 감정 변화, SFX
  Beat C (4–5s): 연결 & 여백 (Hold) — 0.8~1.0초 홀드, 자막/CTA 공간
```

**15초 광고 = 반드시 3유닛으로 분해**:
| 유닛 | 시간 | 감정 개수 |
|------|------|----------|
| U1 | 0–5s | 1개 (PAIN) |
| U2 | 5–10s | 1개 (SOLUTION 전환) |
| U3 | 10–15s | 1개 (SOLUTION 확신) |

---

# Part 2. 필수 원문 블록 모음 (복붙 전용)

> 아래 블록들은 **모든 키프레임 프롬프트와 Sora I2V 프롬프트에 매번 전량 포함**해야 합니다.
> 편의를 위해 한 곳에 모았습니다. 여기서 복사해서 쓰세요.

---

### 블록 A: STYLE LOCK

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

### 블록 B: BASE 3줄

```
[BASE]
9:16 vertical, pure 2D animation, Ghibli+Korean webtoon fusion style, NO 3D elements, cel animation aesthetic, hand-drawn line art with visible brush strokes.
Color: warm pastel watercolor, flat color blocks with subtle paper texture, NO gradients resembling 3D shading, edge-lit style like Studio Ghibli background paintings.
Main: Sowoni(20–22, warm smile, pastel casual clothes, consistent 2D face, simple anime eye style), object: wish paper airplane(origami-style flat rendering), SAFE SPACE action + Yeosu sea background (painted backdrop style).
```

### 블록 C: SOWONI LOCK v2

```
[SOWONI LOCK v2]
- adult Korean college student, early 20s (20–22), NOT a minor
- No school uniform, avoid teen/child cues
- No readable text on clothing/objects
- Simple anime line art, large expressive eyes (웹툰 스타일 큰 눈)
- Minimal nose (small dot or simple line), soft rounded face
- NO realistic facial anatomy, NO motion capture fluidity
- Flat cel-shaded clothes (no 3D cloth sim wrinkles)
```

+ 반드시 의상 프리셋 1종 명시:
`SPRING_CASUAL / SUMMER_SEASIDE / AUTUMN_COZY / WINTER_COAT / NIGHT_WALK`

### 블록 D: AURUM TURTLE LOCK v2

```
[AURUM TURTLE LOCK v2]
- Rounded shell-orb body with simple scute plates (6–10 only)
- Minimal turtle face: two small eyes, tiny beak-like mouth, two dot nostrils
- Short little limbs with tiny claws/flippers visible
- Subtle watercolor halo ring (NOT volumetric light rays)
- One small crescent-rune mark on the shell (fixed position)
- No jewelry, no clothing-like patterns, no human face, no eyelashes, no teeth
```

+ 반드시 상태 프리셋 1종 명시:
`BASE / OBSERVE / GUIDE / SPARKLE / COZY_BREEZE / NIGHT_CALM`

### 블록 E: TEXT ZERO

```
[TEXT ZERO]
- NO readable text, NO subtitles, NO logos, NO watermark
- NO 간판, NO UI 텍스트
- 폰 화면: ONLY abstract soft color blocks + bubble shapes
- 모든 텍스트는 후편집 자막으로만 처리
```

### 블록 F: NEGATIVE 프롬프트 (전량)

```
[NEGATIVE]
photorealistic, 3D render, CGI, Unreal Engine, Unity, Blender, cinematic lighting, lens flare, depth of field, PBR materials, realistic shading, subsurface scattering, ambient occlusion, ray tracing, global illumination, volumetric fog, HDR, bloom effect, chromatic aberration, motion blur, camera shake, handheld camera, live-action, real camera, bokeh, DSLR, film grain, vignette, color grading, LUT, physically-based rendering, metallic, chrome, reflective surface, glossy, wet surface, glass material, mirror, specular highlights, caustics, refraction, translucent, photoreal skin, realistic hair physics, cloth simulation, particle effects, dynamic lighting, shadow mapping, normal mapping, bump mapping, displacement, tessellation
```

### 블록 G: SORA I2V 공통 지침

```
[SORA I2V COMMON]
Use the provided keyframe image as the only visual reference.
Keep 2D style and character identity perfectly consistent.
Duration: 5 seconds. One continuous shot (NO hard cuts).
Motion Scale: "Minimal motion"
- Micro-expression, Blink, Hair flutter, Wind/Light 변화 위주
Camera: Gentle Push-in / Slow Pan / Hold
9:16 vertical (1080×1920).
```

---

# Part 3. 스타일 토큰 허용 목록

> 프롬프트에 **최소 3개** 포함해야 합니다.
> **이 목록 밖의 토큰은 사용 금지**입니다.

| # | 토큰 |
|---|------|
| 1 | Studio Ghibli background painting style |
| 2 | Korean webtoon character design |
| 3 | Hayao Miyazaki soft color palette |
| 4 | Naver webtoon flat rendering |
| 5 | Spirited Away ambient mood |
| 6 | True Beauty character proportion |
| 7 | My Neighbor Totoro nature aesthetic |
| 8 | Lore Olympus pastel blocking |
| 9 | Kiki's Delivery Service cozy atmosphere |
| 10 | Solo Leveling action clarity with 2D lines |

**금지 예시**: "aurora glow particles", "pastel emotional gradients", "subtle floating dust motes" → 가이드에 없는 토큰이므로 사용 불가.

---

# Part 4. 컬러 스크립트 규칙

| 단계 | 허용 컬러 | 금지 |
|------|----------|------|
| **PAIN** | Cool grey, Desaturated watercolors, Blue shadows | Warm tones, Lavender, Golden light |
| **SOLUTION** | Warm golden wash, Bright pastel, Soft sunlight bloom | Cool grey, Blue shadows |

**실수 사례**: PAIN 씬에 "Warm lavender light"를 사용 → PAIN의 차가운 톤이 깨짐.

**규칙**: PAIN 씬은 반드시 차갑고 채도가 낮아야 합니다. SOLUTION 씬에서만 따뜻한 톤을 사용합니다.

---

# Part 5. 물/바다 표현 규칙

```
✅ 허용:
"painted ocean like Ponyo"
"flat watercolor sea wash"
"simple wave lines"
"sea painted as flat backdrop (no 3D water simulation)"

❌ 금지:
"realistic ocean"
"water simulation"
"foam detail"
"wet surface"
```

**규칙**: 바다가 등장하는 모든 씬에 `sea painted as flat backdrop (no 3D water simulation)` 문구를 반드시 포함합니다.

---

# Part 6. 2D 순수성 체크리스트

| # | 항목 | 허용 | 금지 |
|---|------|------|------|
| 1 | 조명 | soft hand-painted shadow, watercolor ambient fill | directional light, spotlight, rim light |
| 2 | 재질 | matte paper texture, flat cel-shaded color | shiny, glossy, reflective, metallic |
| 3 | 카메라 | 2D pan/zoom, cross-dissolve | dolly, tracking, crane, aerial |
| 4 | 공간 | layered flat planes, painted backdrop | 3D space, perspective grid |
| 5 | 캐릭터 | simple anime line art, webtoon proportion | realistic anatomy, photorealistic skin |

---

# Part 7. 금지 키워드 스캐너

### Tier 1: 즉시 거부 (프롬프트에 있으면 삭제)

`realistic` `photorealistic` `3D` `CGI` `render` `Unreal` `Unity` `cinema 4D` `octane render`

### Tier 2: 대체 필요

| 원본 (사용 금지) | 대체 (이것을 사용) |
|-----------------|-----------------|
| light | hand-painted glow / watercolor wash |
| shadow | cel-shaded shadow / flat shadow |
| reflection | painted highlight / simple shine mark |
| depth | layered planes / painted distance |
| camera move | 2D pan / 2D zoom |

---

# Part 8. 6단계 출력 포맷 체크리스트

> 크리에이티브 문서는 반드시 아래 6단계를 **순서대로** 포함해야 합니다.

| 단계 | 섹션명 | 필수 포함 내용 | 누락 시 문제 |
|------|--------|-------------|-------------|
| 1 | PRODUCTION SUMMARY | 타이틀, 포맷, 톤앤매너, 캐릭터, 배경모드 | 제작 방향 불명확 |
| 2 | SCENE PLAN (표) | 씬별 시간/목적/감정/배경/아우룸상태 | 유닛 간 감정 충돌 |
| 3 | KEYFRAME PROMPTS | 이미지 생성 프롬프트 (블록 A~F 전량) | 키프레임 품질 불안정 |
| 4 | SORA I2V PROMPTS | 5초 모션 지시 (블록 G + 3-Beat) | 모션 일관성 깨짐 |
| 5 | SUBTITLES + TIMECODES | 후편집용 자막 (영상 내 미포함) | 자막 타이밍 불일치 |
| 6 | LOGO SONG BRIEF | 사운드 가이드 (악기/BPM/무드) | 영상-음악 불일치 |

**추가 필수 섹션**:
- Disney QC 체크리스트 (생성 전 + 생성 후)
- 가이드 준수 매트릭스 (15개 항목)

---

# Part 9. 프롬프트 투입 전 최종 체크리스트

> **모든 프롬프트를 Sora/이미지 생성 도구에 투입하기 전에 아래를 확인합니다.**
> **하나라도 "아니오"면 투입하지 않습니다.**

## 키프레임 프롬프트 체크 (이미지 생성 시)

```
□ 1. STYLE LOCK 원문이 프롬프트 상단에 있는가? (한 글자도 변경 없이)
□ 2. BASE 3줄(Line1/2/3)이 STYLE LOCK 바로 뒤에 있는가?
□ 3. SOWONI LOCK v2 원문이 포함되어 있는가?
□ 4. 소원이 의상 프리셋 1종이 명시되어 있는가? (5종 중 택1)
□ 5. AURUM TURTLE LOCK v2 원문이 포함되어 있는가?
□ 6. 아우룸 상태 프리셋 1종이 명시되어 있는가? (6종 중 택1)
□ 7. TEXT ZERO 블록이 포함되어 있는가?
□ 8. 프롬프트 전체에서 읽을 수 있는 텍스트 지시가 0개인가?
□ 9. 폰 화면 묘사가 "abstract soft color blocks + bubble shapes"만인가?
□ 10. 스타일 토큰이 허용 목록(10종)에서 3개 이상 선택되었는가?
□ 11. NEGATIVE 프롬프트가 전량(40+ 단어) 포함되어 있는가?
□ 12. PAIN 씬은 Cool grey/Desaturated/Blue shadows인가?
□ 13. SOLUTION 씬은 Warm golden wash/Bright pastel인가?
□ 14. 바다 등장 시 "sea painted as flat backdrop (no 3D water simulation)" 포함인가?
□ 15. 9:16 비율 + 1080×1920 해상도가 명시되어 있는가?
```

## Sora I2V 프롬프트 체크 (영상 생성 시)

```
□ 16. SORA I2V COMMON 블록이 상단에 있는가?
□ 17. STYLE LOCK 원문이 포함되어 있는가? (키프레임과 별도로, 다시 포함)
□ 18. TEXT ZERO 블록이 포함되어 있는가?
□ 19. 3-Beat 구조가 명시되어 있는가?
       Beat A (0–2s): 시선 고정
       Beat B (2–4s): 마법의 순간
       Beat C (4–5s): 연결 & 여백
□ 20. Beat C의 홀드 시간이 0.8초 이상인가?
□ 21. "Duration: 5 seconds. One continuous shot (NO hard cuts)" 포함인가?
□ 22. NEGATIVE 프롬프트가 전량 포함되어 있는가?
□ 23. 감정이 유닛당 정확히 1개인가? (혼재 없음)
```

## 크리에이티브 문서 전체 체크 (문서 완성 시)

```
□ 24. 6단계 포맷(SUMMARY→PLAN→KEYFRAME→SORA→SUBTITLE→SOUND) 모두 있는가?
□ 25. 소원이 의상이 15초 전체에서 1종으로 통일되어 있는가?
□ 26. 아우룸 상태가 유닛별로 자연스러운 전환인가?
□ 27. Disney QC 체크리스트(생성 전 + 생성 후)가 포함되어 있는가?
□ 28. 가이드 준수 매트릭스(15개 항목)가 포함되어 있는가?
□ 29. 자막이 영상 프롬프트가 아닌 별도 섹션(5단계)에만 있는가?
□ 30. YEOSU 모드 사용 시: 랜드마크 2씬 + 앵커 1씬 충족하는가?
```

---

# Part 10. QC 게이트 프로세스

> 프롬프트 작성 → 투입 → 결과물 사이에 3단계 게이트를 둡니다.

## Gate 1: 프롬프트 작성 직후 (자가 점검)

Part 9 체크리스트를 스스로 수행합니다.
30개 항목 중 **1개라도 미통과 → 수정 후 재체크**.

## Gate 2: 투입 전 피어 리뷰 (다른 사람이 확인)

아래 5가지 **킬 크라이테리아**만 빠르게 확인:

| # | 킬 크라이테리아 | 확인 방법 |
|---|----------------|----------|
| K1 | 프롬프트에 읽을 수 있는 한국어/영어 텍스트 지시가 있는가? | Ctrl+F로 "subtitle", "text", "자막", "글자" 검색 |
| K2 | STYLE LOCK 블록이 원문과 100% 일치하는가? | 원문과 diff |
| K3 | 소원이가 "사람"으로 묘사되어 있는가? | "college student", "20–22" 존재 확인 |
| K4 | 아우룸이 "거북이"로 묘사되어 있는가? | "shell-orb", "turtle face" 존재 확인 |
| K5 | NEGATIVE 단어 수가 40개 이상인가? | 쉼표(,) 개수 세기 → 39개 이상 |

**K1~K5 중 1개라도 실패 → 투입 금지. 수정 후 Gate 1부터 재시작.**

## Gate 3: 결과물 생성 후 (Disney QC)

생성된 키프레임 이미지 / Sora 영상을 보고 확인:

```
□ 플리커링 없는가?
□ 소원이 손가락 5개인가?
□ 아우룸이 거북이 형태를 유지하는가? (빛/리본/구름 아님)
□ PAIN → SOLUTION 컬러 전환이 명확한가?
□ 텍스트 제로인가? (영상 안에 읽을 수 있는 글자 0개)
□ Beat C 홀드가 충분한가? (0.8초+)
□ 소원이 의상이 유닛 간 동일한가?
□ 바다가 3D 시뮬레이션 없이 평면 워터컬러인가?
```

**Gate 3에서 텍스트가 보이거나, 캐릭터가 3D처럼 보이면 → 해당 유닛 재생성.**

---

# Part 11. 크리에이티브 간 일관성 규칙

> 여러 크리에이티브를 동시에 운영할 때 지켜야 할 규칙.

| 규칙 | 상세 |
|------|------|
| **1 크리에이티브 = 1 의상** | 15초 내 의상 변경 금지 |
| **아우룸 상태는 점진 전환** | 갑자기 NIGHT_CALM → SPARKLE 불가. 중간 단계(OBSERVE/GUIDE) 필요 |
| **PAIN→SOLUTION 순서 고정** | SOLUTION→PAIN 역순 불가 |
| **배경 모드 혼용 금지** | GENERIC과 YEOSU를 한 크리에이티브에서 혼용하지 않음 |
| **YEOSU 모드 최소 요건** | 랜드마크 2씬 + 앵커 1씬 (가이드 §5) |
| **스타일 토큰 중복 허용** | 크리에이티브 간 같은 토큰 사용 가능 (일관성 유지) |

---

# Part 12. 현재 확정된 4종 크리에이티브 참조표

| 크리에이티브 | 의상 | 배경 | 아우룸 전환 | 고유 장치 |
|------------|------|------|-----------|----------|
| Healing-High | AUTUMN_COZY | GN03→GN06 | BASE→OBSERVE→SPARKLE | 찻잔 방치 (멈춤) |
| Growth-High | SPRING_CASUAL | GN02→GN01 | NIGHT_CALM→GUIDE→SPARKLE | 비행기 발사 (행동) |
| Healing-Mid | SPRING_CASUAL | GN04→GN01 | BASE→OBSERVE→COZY_BREEZE | 하늘 복수 비행기 (사회증거) |
| Growth-Mid | NIGHT_WALK | YS02→YS06→YS05 | NIGHT_CALM→GUIDE→SPARKLE | 비행기 살짝 릴리즈 (작은 행동) |

**신규 크리에이티브 작성 시**: 위 4종과 의상·배경·고유 장치가 겹치지 않도록 차별화합니다.

---

# Part 13. 참조 문서 맵

| 문서 | 경로 | 용도 |
|------|------|------|
| 영상기획 GPT 지침서 (SSOT) | `docs/marketing/gpt-video-production.md` | **모든 규칙의 원본**. 의심되면 이 문서 확인 |
| Healing-High 크리에이티브 | `docs/marketing/ad-creative-healing-high-v1.md` | 올바른 작성 예시 (참고용) |
| Growth-High 크리에이티브 | `docs/marketing/ad-creative-growth-high-v1.md` | 올바른 작성 예시 (참고용) |
| Healing-Mid 크리에이티브 | `docs/marketing/ad-creative-healing-mid-v1.md` | 올바른 작성 예시 (참고용) |
| Growth-Mid 크리에이티브 | `docs/marketing/ad-creative-growth-mid-v1.md` | 올바른 작성 예시 (참고용) |
| Ad Set 매핑 + A/B 테스트 | `docs/marketing/ad-set-mapping-and-ab-test-v1.md` | 캠페인 운영 기준 |
| 이 문서 (핸드오프 가이드) | `docs/marketing/video-production-handoff-guide.md` | 실수 방지 매뉴얼 |

---

# 요약: 프롬프트를 쓸 때 반드시 기억할 7가지

```
1. STYLE LOCK은 원문 복붙이다. 요약하거나 새로 쓰지 않는다.
2. BASE 3줄은 빠지면 안 된다. STYLE LOCK 바로 뒤에 온다.
3. 소원이는 사람이다. 정령/요정/아이콘이 아니다.
4. 아우룸은 거북이다. 빛/리본/오로라가 아니다.
5. 영상 안에 글자는 0개다. 자막은 후편집에서만.
6. NEGATIVE는 전량이다. 한 줄도 빼지 않는다.
7. 5초에 감정 1개. 15초면 3유닛. 각 유닛에 3-Beat.
```

---

*하루하루의 기적 영상 제작 핸드오프 가이드 v1.0*
