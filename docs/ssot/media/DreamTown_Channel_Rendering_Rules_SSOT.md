# DreamTown Channel Rendering Rules SSOT

**문서 코드**: MEDIA-CHAN-002  
**Version**: v1.1  
**Owner**: Aurora5 / 루미  
**Status**: Confirmed  
**작성일**: 2026-05-22  
**상위 SSOT**: `docs/ssot/media/DreamTown_Media_Architecture_SSOT.md` (MEDIA-ARCH-001)  
**참조**: `docs/ssot/air-engine/05_DERIVATION_PIPELINE.md` / `06_OUTPUT_STRATEGY.md` / `02_DreamTown_Echo_Physics.md`

---

## 읽기 전 필수

채널별 렌더링 규칙만 다룬다.  
"왜 이 구조인가"는 MEDIA-ARCH-001에서 읽는다.  
"비율이 왜 3:4 canonical인가"는 `05_DERIVATION_PIPELINE.md`에서 읽는다.

---

## 1. 핵심 철학

```
DreamTown은 플랫폼별 별도 콘텐츠 회사를 지향하지 않는다.
하나의 감정 자산을 채널별 언어로 번역한다.
asset은 공유하고 render rule만 변경한다.

algorithm first ❌
emotion first  ✅
```

채널은 감정의 번역기다.  
플랫폼의 알고리즘에 맞추는 것이 아니라, 그 플랫폼에서 감정이 가장 잘 전달되는 방식을 찾는 것이다.

---

## 2. 기본 구조

```yaml
source_asset:
  type: Canonical Air Seed
  registry: config/storybook/asset-registry.json
  canonical_ratio: "3:4 portrait"
  shared: true                 # 모든 채널이 같은 자산 풀 사용

render_mode:
  resonance:
    target: 소원이 (기존 journey 중)
    purpose: 감정 저장 / 회상 / 동행
  attraction:
    target: 비소원이 (외부 채널)
    purpose: 유입 / 저장 / 공유 / curiosity 유발

channel_rule:
  tiktok:
    render_mode: attraction
  reels:
    render_mode: attraction
  shorts:
    render_mode: attraction
  resonance:
    render_mode: resonance
```

---

## 3. 영상 2분류

### Resonance Video

- **목적**: 감정 저장 / 회상 / 동행
- **속도**: 느림
- **motion**: breathing — 정적 또는 매우 느린 pan
- **subtitle**: 최소 (감정 레이블 수준)
- **sound**: ambient / soft (-20dB 이하, 또는 무음)
- **플랫폼**: 개인 영상 / 저장형 / YouTube 장편

소원이가 자신의 여정을 다시 보는 경험이다.  
훅이 없어도 된다. 알고리즘 유입을 목표로 삼지 않는다.

---

### Attraction Video

- **목적**: 유입 / 저장 / 공유 / curiosity 유발
- **속도**: 빠름
- **motion**: hook first — 감정이 먼저 당겨야 한다
- **subtitle**: 강함 (훅 문장 1줄, 큰 글씨)
- **sound**: short impact (짧은 앰비언트 또는 효과음 1회)
- **플랫폼**: TikTok / YouTube Shorts / Instagram Reels

소원이가 아닌 사람에게 "이런 공기가 있다"는 것을 전달하는 초대장이다.

---

## 4. 채널별 렌더링 규칙

---

### TikTok

```yaml
render_mode: attraction
duration: "15–30초"
ratio: "9:16"

hook:
  window: "0.5초 이내"
  rule: 첫 프레임부터 감정이 보여야 한다. 로고 / 브랜딩 / 암전 오프닝 금지.

subtitle:
  size: 크게 (이미지 높이의 8% 이상 font-size)
  position: 중앙 하단 또는 중앙
  style: 훅 문장 또는 질문형
  max: 1줄 / 14자

motion: fast pacing (1.0–1.5x)
ending: curiosity loop — 마지막 컷이 질문을 남긴다
emotion: immediate — 이미지를 보는 순간 감정이 시작되어야 함

forbidden:
  - 로고 오프닝
  - slow motion
  - 드라마틱 서사 음악
  - 설명형 자막
```

---

### Instagram Reels

```yaml
render_mode: attraction
duration: "15–60초"
ratio: "9:16"

aesthetic: 우선 — 장면 자체가 시선을 잡는다
subtitle:
  style: poetic — 시적 / 감성적 문장 (광고 문구 금지)
  size: 보통 (이미지와 균형)
  timing: 2–3초 후 등장 (첫 컷 클린)
  max: 2줄 / 18자

motion: medium pacing (0.7–1.0x)
visual: visual breathing 유지 — 장면이 숨 쉬는 느낌

forbidden:
  - 가격 노출
  - 이모지 남발
  - flash cut
  - 즉각 자막 (0초 등장)
```

---

### YouTube Shorts

```yaml
render_mode: attraction
duration: "15–60초 (권장 30초)"
ratio: "9:16"

retention: 우선 — 이탈 없이 끝까지 보도록 설계
narrative: micro narrative — 감정 1개의 짧은 이야기 구조
cut_rhythm: "2–4초 컷"
ending: curiosity loop — 마지막 장면이 YouTube 전체 영상으로 유인

subtitle:
  style: 여정 맥락 1줄 (감정 흐름을 암시)
  forbidden: 구독 요청 / 좋아요 요청 자막

dependency:
  rule: YouTube canonical 영상이 존재해야 Shorts 공개 가능
  reference: OUTPUT_STRATEGY.md 절대 금지 §2

forbidden:
  - YouTube canonical 없이 단독 공개
  - 1편에 감정 2개 이상 혼재
  - 과도한 text overlay
```

---

### Resonance

```yaml
render_mode: resonance
duration: "3–7분 (7분 초과 금지)"
ratio: "3:4 원본 유지 또는 16:9 파생"

camera: breathing only — 정적 또는 매우 느린 pan / Ken Burns
subtitle:
  style: 최소 (감정 레이블 또는 내레이션 1줄)
  timing: 이미지 등장 2초 후 fade-in
  max: 2줄 / 20자
  source: dreamtown-postcard-emotion-copy-ssot.md

emotion_hold: "4–8초 이미지 유지 (감정을 충분히 본다)"
focus: 기억 / 회상 중심 — 소원이가 자신의 여정을 다시 본다

sound: ambient / soft / 무음 중 선택 (-20dB 이하)
cta: 없음 (영상 내 행동 유도 금지)

emotion_sequence:
  order: confusion → pause → calm → curiosity → fragile_hope
  rule: SSOT 순서 준수. 임의 재배열 금지.

asset_source:
  primary: "public/images/storybook/sources/page05/{location}/"
  fallback: "public/images/thumbnails/{location}/generated/full/"

forbidden:
  - 훅
  - CTA
  - 컷 편집
  - 감정 순서 임의 변경
  - 7분 초과
```

---

## 5. 공통 규칙

```yaml
asset_sharing:
  - 모든 채널은 같은 storybook source 이미지를 사용한다
  - 같은 asset-registry를 참조한다 (config/storybook/asset-registry.json)
  - render_mode만 변경한다. 자산 자체를 채널별로 새로 만들지 않는다.

continuity:
  - continuity 최우선
  - 캐릭터 drift 금지 (Sowoni 외형·포즈 변경 불가)
  - AI random reinterpretation 금지 (기존 자산 재사용 원칙)

production_order:
  - Resonance 먼저, Attraction은 Resonance에서 파생한다
  - Shorts / Reels / TikTok은 Resonance canonical 없이 단독 제작 금지
```

---

## 6. 기적영상 규칙

```yaml
frame_source:
  rule: storybook frame reuse
  path: "public/images/storybook/sources/page05/{location}/*.png"
  fallback: "thumbnails/{location}/generated/full/*.png"

generation_limit:
  new_ai_images_per_video: "최대 1–2페이지"
  condition: storybook에 해당 감정 페이지가 없을 때만 신규 생성 허용

assembly:
  structure: emotional assembly — 감정 순서대로 프레임을 조립한다
  principle: 영상은 새 생성이 아니라 감정 재렌더링이다

forbidden:
  - AI가 전체 장면을 새로 재해석하는 것
  - 캐릭터 일관성 무시한 신규 씬 생성
  - storybook과 다른 감정 좌표로 영상 제작
```

---

## 7. 비용 절감 구조

```yaml
wrong_understanding:
  "광고를 줄이면 비용이 절감된다" ❌

right_understanding:
  "재조합 가능한 감정 자산 구조로 비용을 줄인다" ✅
```

- 1개의 Canonical Air Seed → storybook 1장 + 기적영상 1프레임 + Shorts 썸네일 1장 + 포스트카드 1장
- 채널이 늘어도 자산 제작 비용은 선형으로 증가하지 않는다
- 새 채널 = 새 render rule만 추가

```yaml
DreamTown:
  콘텐츠 제작사: ❌
  Emotional Rendering System: ✅
```

---

## 8. Future Architecture

```yaml
pipeline:
  storybook:
    source: "public/images/storybook/sources/page05/{location}/"
    assembly: "scripts/storybook/assemble-storybook-test.js"

  video_assembly:
    input: storybook 프레임 시퀀스
    script: "scripts/video/assemble-miracle-video.js (미구현)"
    queue: "routes/videoJobRoutes.js (연결 예정)"

  render_mode:
    resonance: Resonance Video 출력
    attraction: Shorts / Reels / TikTok 출력

  channel_rendering:
    rule_source: "이 문서 (MEDIA-CHAN-002)"

subtitle_rules:
  source: "dreamtown-postcard-emotion-copy-ssot.md"
  max_chars_per_line: 20
  duration_per_line: "3초"
  style: "감정 레이블 수준"

motion_rules:
  resonance: "0.3–0.5x, Ken Burns 또는 정적"
  attraction: "0.8–1.5x, cross-dissolve"

sound_rules:
  resonance: "무음 또는 -20dB 이하 앰비언트"
  attraction: "짧은 앰비언트 또는 효과음 1회, -12dB 이하"
```

---

## 9. 금지 사항

```
❌ Endless Video Generation
   — 같은 감정을 계속 AI로 새로 생성. 기존 자산 재사용이 원칙.

❌ 플랫폼별 별도 자산 남발
   — 채널마다 새 이미지 생성. render_mode 변환으로 해결.

❌ 감정보다 영상효과 우선
   — 화려한 전환·3D·HDR로 감정을 대체. 효과는 감정을 보조하는 것.

❌ 캐릭터 continuity 붕괴
   — Sowoni 외형·포즈 변경, 감정 좌표 이탈. 어떤 채널에서도 동일 캐릭터.

❌ Registry 외부 직접 asset 사용
   — asset-registry.json에 없는 이미지를 직접 삽입.
   — 신규 생성 이미지는 registry 등록 후 사용.

❌ AI random motion 남발
   — 감정과 무관한 motion effect 추가. motion은 감정을 강화하는 것만 허용.
```

---

## 10. 최종 한 줄

```yaml
same_emotion:
  different_channel_render
```

같은 감정. 다른 채널 언어. 같은 자산.

---

## 관련 문서

| 문서 | 경로 | 참조 목적 |
|------|------|----------|
| Media Architecture SSOT | `docs/ssot/media/DreamTown_Media_Architecture_SSOT.md` | 전체 운영 헌법 |
| Output Strategy | `docs/ssot/air-engine/06_OUTPUT_STRATEGY.md` | 채널 역할 정의 |
| Derivation Pipeline | `docs/ssot/air-engine/05_DERIVATION_PIPELINE.md` | 비율 마스터 파생 |
| Echo Physics | `docs/ssot/air-engine/02_DreamTown_Echo_Physics.md` | 파생 관계 정의 |
| Postcard Emotion Copy | `docs/ssot/dreamtown-postcard-emotion-copy-ssot.md` | Resonance 내레이션 카피 |
| Asset Registry | `config/storybook/asset-registry.json` | 전체 자산 목록 |

---

## 버전 관리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-05-22 | 최초 작성 |
| v1.1 | 2026-05-22 | 전체 구조 재편 — TikTok hook 0.5초, 10섹션 구조, 최종 한 줄 추가 |
