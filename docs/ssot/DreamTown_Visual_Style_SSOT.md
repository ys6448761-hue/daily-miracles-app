# DreamTown Visual Style SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Canonical reference for all visual style rules — image, webtoon, video production

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 규칙

- 모든 이미지·웹툰·영상 제작 전에 이 파일을 먼저 읽는다
- STYLE LOCK은 절대 변경 불가 (변경 시 CEO 승인 필요)
- TEXT ZERO 원칙은 모든 산출물에 예외 없이 적용된다

---

## 1. STYLE LOCK (스타일 잠금)

```
[STYLE LOCK — 절대 고정]

Strict 2D hand-drawn animation style.
Ink line art + soft watercolor wash + paper grain texture.
Ghibli-inspired warmth mixed with Korean webtoon linework.
Lighting: Flat lighting (No heavy shadows).
```

### 필수 3줄 BASE (이미지·영상 프롬프트에 반드시 포함)
```
Line 1: 9:16 vertical, pure 2D animation, Ghibli+Korean webtoon fusion style,
         NO 3D elements, cel animation aesthetic, hand-drawn line art with visible brush strokes.

Line 2: Color: warm pastel watercolor, flat color blocks with subtle paper texture,
         NO gradients resembling 3D shading, edge-lit style like Studio Ghibli background paintings.

Line 3: Main character: Sowoni (20–22, warm smile, pastel casual clothes, consistent 2D face,
         simple anime eye style), object: wish paper airplane (소원비행기, origami-style flat rendering),
         SAFE SPACE action + Yeosu sea background (distant, painted backdrop style).
```

---

## 2. 금지 사항 (절대 금지)

| 카테고리 | 금지 항목 |
|----------|----------|
| 렌더링 | 3D / Photoreal / CGI look |
| 조명 | Volumetric light / Glossy highlights |
| 재질 | Metallic reflections / Heavy depth of field |
| 텍스트 | 영상·이미지 내 모든 읽히는 텍스트 |
| 캐릭터 | 소원이를 아동/미성년자로 묘사 |
| 스타일 | Pixar / Plush / Realistic / Clay |

---

## 3. TEXT ZERO 원칙

```
[TEXT ZERO — 예외 없음]

영상·이미지 내 절대 금지:
- NO readable text
- NO subtitles
- NO logos (영상 내 베이크인 금지)
- NO watermark
- NO 간판
- NO UI 텍스트

폰 화면 등장 시:
- ONLY abstract soft color blocks + bubble shapes

모든 텍스트는 후편집(post-production) 자막으로만 처리
```

---

## 4. 컬러 스크립트

### PAIN 단계 (문제·고통)
```
Cool grey tones
Desaturated watercolors
Blue-grey shadows
→ 차갑고, 채도 낮고, 그늘진 느낌
```

### SOLUTION 단계 (해결·기적)
```
Warm golden wash
Bright pastel colors
Soft sunlight bloom
→ 따뜻하고, 파스텔톤, 햇살 느낌
```

### 브랜드 컬러 팔레트
| 역할 | 색상 | 코드 |
|------|------|------|
| Primary | 메인 퍼플 | `#9B87F5` |
| Secondary | 핑크/코랄 | `#F5A7C6` |
| Accent | 딥퍼플 | `#6E59A5` |
| Background | 연핑크 | `#FFF5F7` |
| Gradient | — | `linear-gradient(135deg, #9B87F5, #F5A7C6)` |

---

## 5. 배경 시스템

### 일반 모드 (GENERIC)
| 코드 | 배경 |
|------|------|
| `GN01` | 바닷가 산책로 |
| `GN02` | 조용한 골목 |
| `GN03` | 카페 창가 |
| `GN04` | 공원 벤치 |
| `GN05` | 밤 거리 |
| `GN06` | 일출/일몰 해변 |

### 여수 모드 (YEOSU)
스토리에 '여수'가 포함되거나 지정될 경우 활성화.
최소 2개 씬에서 랜드마크 실루엣 노출, 최소 1개 씬은 Landmark-Anchor.

| 코드 | 랜드마크 | 감정 매칭 |
|------|----------|----------|
| `YS01` | 오동도 해안길 | 설렘, 시작 |
| `YS02` | 해상케이블카 | 이동, 여정 |
| `YS03` | 돌산공원 야경 | 여운, 마무리 |
| `YS04` | 돌산대교 야경 | 흐름, 전환 |
| `YS05` | 향일암 일출 | 기적, 소원 (Anchor) |
| `YS06` | 빅오 (Big-O) | 시스템, 확신 |
| `YS07` | 아쿠아플라넷 | 호기심, 발견 |
| `YS08` | 진남관 | 역사, 무게감 |
| `YS09` | 종포해양공원 | 산책, 일상 |
| `YS10` | 여수수산시장 | 활기, 군중 |

---

## 6. 영상 기술 스펙

| 항목 | 값 |
|------|-----|
| 포맷 | 9:16 세로 |
| 해상도 | 1080×1920 |
| 유닛 길이 | 5초 (기적영상 2D) / 8초+6초 (Sora 광고) |
| 모션 | Minimal — 눈깜빡임, 머리카락 흔들림, 빛 변화 위주 |
| 카메라 | Gentle Push-in / Slow Pan / Hold |
| 로고 | 영상 내 베이크인 금지, 후편집 오버레이로만 |

---

## 7. 소원그림 스타일 (DALL-E 3)

| 스타일 코드 | 설명 |
|------------|------|
| `miracle_fusion` | 지브리 따뜻함 + 한국 웹툰 수채화 (기본값, 무료) |
| `miracle_ghibli` | 순수 지브리 스타일 (유료) |
| `miracle_korean` | 한국 웹툰 스타일 (유료) |

**공통 규칙**: No text, No words, No letters, No characters in image

---

## 참조

- 캐릭터 정의: `DreamTown_Character_SSOT.md`
- 영상 제작 플레이북: `.claude/team-memory/playbooks/miracle_video_system_v7.md`
- Sora 가이드: `docs/sora/v1.1/VIDEO_MASTER.md`
