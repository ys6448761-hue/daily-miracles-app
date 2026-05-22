# DreamTown Media Architecture SSOT

**문서 코드**: MEDIA-ARCH-001  
**Version**: v1.0  
**Owner**: Aurora5 / 루미  
**Status**: Confirmed  
**작성일**: 2026-05-22  
**상위 SSOT**: `docs/ssot/air-engine/05_DERIVATION_PIPELINE.md`, `docs/ssot/air-engine/06_OUTPUT_STRATEGY.md`

---

## 읽기 전 필수

이 문서는 DreamTown의 모든 영상·스토리북·홍보물 제작의 운영 헌법이다.  
영상 제작 착수 전, 스토리북 조립 전, 홍보 소재 기획 전 — 이 문서를 먼저 읽는다.

---

## 1. 핵심 원칙

```
원천 자산은 하나다.
출력은 여러 모드로 변환된다.
영상은 새로 생성하는 것이 아니라 감정을 재렌더링하는 것이다.
continuity가 영상 퀄리티보다 항상 우선한다.
```

### 1-1. 원천 자산은 하나

모든 미디어는 Canonical Air Seed(정규 공기 씨앗)에서 출발한다.

```
Canonical Air Seed (thumbnails/generated/full/ or star-cache/)
        │
        ├── Storybook Scene
        ├── 기적영상 프레임
        ├── Shorts 썸네일
        └── 포스트카드
```

동일한 감정 좌표(emotion × gemstone × location)를 가진 자산은 하나만 존재한다.  
플랫폼마다 별도로 이미지를 새로 생성하지 않는다.

### 1-2. 출력은 다중 모드

```
같은 자산 + 같은 registry
        ↓
render_mode 변경만으로 출력 형태 전환

render_mode: storybook    → 5페이지 감정 여정
render_mode: miracle_video → 기적영상 프레임 시퀀스
render_mode: shorts        → 9:16 단편 초대장
render_mode: postcard      → 4:3 카카오 공유
```

새로운 자산을 만드는 것이 아니라, 기존 자산의 렌더 방식을 바꾸는 것이다.

### 1-3. 영상 = 감정 재렌더링

영상은 새로운 시각적 경험을 창조하는 것이 아니다.  
소원이가 이미 경험한 감정 여정을 시간 축 위에 재렌더링하는 것이다.

```
❌ 잘못된 방향: 새 장면을 AI로 생성 → 영상으로 편집
✅ 올바른 방향: 기존 storybook 프레임 → 시간 순서 배열 → motion/sound 추가
```

### 1-4. continuity > 영상 퀄리티

DreamTown의 강점은 짧고 화려한 영상이 아니다.  
소원이가 처음 본 이미지와 나중에 받은 기적영상의 캐릭터가 같다는 연속성이다.

캐릭터 drift(감정 좌표 이탈, 외형 변화)는 어떤 이유로도 허용하지 않는다.

---

## 2. 영상 2분류

DreamTown의 모든 영상은 두 가지 목적 중 하나에 속한다.

| 구분 | Resonance Video | Attraction Video |
|------|----------------|-----------------|
| **한국어** | 공명 영상 | 유인 영상 |
| **목적** | 소원이의 감정 여정을 함께 걷기 | 새 소원이를 DreamTown으로 초대 |
| **대상** | 기존 소원이 (journey 중) | 비소원이 (외부 채널) |
| **속도** | 느림 — 여운이 남는 호흡 | 빠름 — 첫 15초 안에 훅 |
| **카메라** | 정적 또는 매우 느린 pan | 컷 편집, 역동적 |
| **텍스트** | 감정 레이블 최소 또는 없음 | 훅 문장 1줄 |
| **감정 흐름** | 1개 감정 전체 호흡 | 복수 감정 단편 조합 |
| **플랫폼** | 앱 내 / YouTube 장편 | Instagram Reels / TikTok / YouTube Shorts |
| **기준 자산** | storybook 5페이지 전체 | storybook 1~2페이지 발췌 |
| **render_mode** | `miracle_video` | `shorts` |

---

## 3. 공통 구조

두 영상 유형은 **같은 자산 풀**에서 출발한다.

```
config/storybook/asset-registry.json   ← 161개 에셋 등록 (단일 registry)
        │
        ├── Resonance Video 제작 시
        │     render_mode: miracle_video
        │     → 5감정 시퀀스 전체 사용
        │     → storybook page01~05 프레임 기반
        │
        └── Attraction Video 제작 시
              render_mode: shorts
              → 1~2감정 발췌
              → 훅 장면 선별
```

신규 자산 생성이 필요할 때는 **registry에 등록 후 사용**한다.  
registry 외부 자산을 영상에 직접 삽입하는 것은 금지한다.

---

## 4. 기적영상 원칙

기적영상(Resonance Video의 대표 형식)은 다음 원칙을 반드시 준수한다.

### 4-1. storybook frame reuse

기적영상의 모든 프레임은 storybook 소스 이미지에서 가져온다.

```
public/images/storybook/sources/page05/{location}/*.png
→ 기적영상의 기본 프레임
```

storybook이 없는 감정 장면을 새로 생성하는 것은 금지한다.  
먼저 storybook을 만들고, 그 프레임을 영상에서 재사용한다.

### 4-2. AI 전체 장면 재해석 금지

```
❌ 금지: "하멜 등대 장면을 영상용으로 새로 AI 생성"
✅ 허용: "hamel_calm_emerald_base03.png를 motion으로 렌더링"
```

AI 이미지 생성은 storybook에서 누락된 특정 페이지(1~2페이지)를 보완할 때만 사용한다.

### 4-3. 신규 생성 이미지 한도

영상 1편당 신규 AI 생성 이미지는 최대 2장으로 제한한다.

| 조건 | 허용 범위 |
|------|-----------|
| storybook 5페이지 전체 확보 시 | 신규 생성 0장 |
| 특정 감정 페이지 누락 시 | 해당 페이지 1~2장만 생성 |
| 전체 장면 재해석 요청 시 | **거부** — 기존 자산 사용 |

### 4-4. continuity 보호 우선

기적영상 제작 순서:

```
1. asset-registry에서 해당 location × emotion 자산 조회
2. storybook 소스 이미지 사용 가능 여부 확인
3. 없을 경우에만 → 기존 SSOT 프롬프트로 1장 보완 생성
4. 영상 조립 (프레임 시퀀스 → motion → subtitle → sound)
5. 캐릭터 drift 검수 후 배포
```

---

## 5. 운영 철학

### 비용 절감 = 재조합 구조

```
❌ 잘못된 이해: 광고를 줄이면 비용이 절감된다
✅ 올바른 이해: 1개 자산을 여러 출력으로 변환하면 제작 비용이 절감된다
```

1개의 Canonical Air Seed로 storybook 1장, 기적영상 1프레임, Shorts 썸네일 1장, 포스트카드 1장을 동시에 만든다. 이것이 DreamTown의 비용 구조다.

### DreamTown = Emotional Rendering System

DreamTown은 콘텐츠 제작사가 아니다.

```
콘텐츠 제작사: 새 콘텐츠를 만든다
DreamTown: 소원이의 감정을 여러 형식으로 렌더링한다
```

렌더링 대상은 언제나 소원이의 감정 여정이다.  
플랫폼이 바뀌어도 감정 좌표는 바뀌지 않는다.

### 하나의 감정 자산 → 여러 출력

```
emotion: calm  ×  gemstone: emerald  ×  location: hamel
        │
        ├── storybook page03 → 3:4 portrait 이미지
        ├── 기적영상 3번째 프레임 → 10초 motion clip
        ├── Shorts 썸네일 → 9:16 crop
        └── 포스트카드 → 4:3 crop + 내레이션 텍스트
```

---

## 6. Future Architecture (구현 예정)

### 6-1. Storybook → Video Assembly Flow

```
config/storybook/asset-registry.json
        │
        ▼
scripts/storybook/assemble-storybook-test.js
        │  (현재: 조립 테스트 단계)
        ▼
[미구현] scripts/video/assemble-miracle-video.js
        │
        ▼
routes/videoJobRoutes.js  ← 영상 Job 큐 연결 지점
```

**구현 우선순위**:
1. `assemble-storybook-test.js` 동작 확인 → storybook 조립 검증
2. page05 소스 이미지 → 영상 프레임 매핑 설계
3. `assemble-miracle-video.js` 작성 (storybook 조립 구조 재사용)
4. `videoJobRoutes.js` 연결

### 6-2. Subtitle Rules

```yaml
subtitle_policy:
  language: 한국어
  max_chars_per_line: 18
  duration_per_line: 3s
  position: bottom-center
  style: 감정 레이블 수준 (짧고 직접적)
  forbidden:
    - 설명형 문장
    - 광고 문구
    - 숫자/통계
```

### 6-3. Motion Rules

```yaml
motion_policy:
  base: 정적 이미지 → 최소 motion (Ken Burns 허용)
  forbidden:
    - 급격한 zoom in/out
    - 카메라 shake
    - 과도한 parallax
  speed: Resonance는 0.3-0.5x slow / Attraction은 1.0-1.5x normal
  transition: cross-dissolve 기본 (flash cut 금지)
```

### 6-4. Sound Rules

```yaml
sound_policy:
  resonance_video:
    bgm: 없음 또는 매우 조용한 앰비언트 (볼륨 -18dB 이하)
    sfx: 없음
  attraction_video:
    bgm: 짧은 도입부 (15초 이하)
    sfx: 최소 (별빛 효과음 1회 허용)
  forbidden:
    - 드라마틱 음악
    - 감정 조작용 효과음
    - 빠른 비트
```

---

## 7. 금지 사항

```
❌ Endless Video Generation
   — 같은 감정 장면을 계속 새로 AI 생성하는 것은 금지
   — 한 번 만든 자산은 재사용이 원칙

❌ 캐릭터 drift 허용
   — 소원이(Sowoni)의 외형·포즈·뒷모습 원칙이 영상에서 달라지면 안 됨
   — 하멜 캐릭터 SSOT(config/wish-image/hamel.json)가 영상에도 적용됨

❌ 감정보다 영상 효과 우선
   — 화려한 전환 효과·3D 렌더링·HDR 처리로 감정을 대체하는 것 금지
   — 감정이 없는 자리에 영상 효과를 채우는 것 금지

❌ 플랫폼별 별도 자산 제작 남발
   — YouTube용 따로, Shorts용 따로, 앱용 따로 만드는 것 금지
   — render_mode 변환으로 해결할 수 있는 것은 반드시 변환으로 처리

❌ Registry 외부 자산 직접 사용
   — asset-registry.json에 등록되지 않은 이미지를 영상에 직접 삽입 금지
   — 신규 생성 이미지는 registry 등록 후 사용
```

---

## 8. 관련 문서

| 문서 | 경로 | 참조 목적 |
|------|------|----------|
| Derivation Pipeline | `docs/ssot/air-engine/05_DERIVATION_PIPELINE.md` | 비율 마스터 및 파생 구조 |
| Output Strategy | `docs/ssot/air-engine/06_OUTPUT_STRATEGY.md` | 채널별 역할 정의 |
| Echo Physics | `docs/ssot/air-engine/02_DreamTown_Echo_Physics.md` | 파생 관계 정의 |
| Visual Style SSOT | `docs/ssot/core/DreamTown_Visual_Style_SSOT.md` | 비주얼 아이덴티티 |
| Hamel Wish-Image SSOT | `config/wish-image/hamel.json` | 캐릭터 continuity 기준 |
| Asset Registry | `config/storybook/asset-registry.json` | 전체 에셋 목록 |

---

## 버전 관리

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-05-22 | 최초 작성 — 영상 2분류, continuity 원칙, 기적영상 원칙 확정 |
