# WISH_IMAGE_HOLD_REVIEW.md

> 작성일: 2026-05-22  
> 기준 커밋: `f6ad953`  
> 목적: wish-image HOLD 항목 기능 검토 + MVP 포함 여부 판단  
> 상태: **검토 완료 — 미커밋**

---

## 검토 대상 (6개 경로)

| 경로 | 유형 | 크기 |
|------|------|-----:|
| `config/wish-image/hamel.json` | SSOT 설정 | 6KB |
| `config/wish-image/hamel-copy.json` | 감정 카피 설정 | 0KB (빈 파일) |
| `scripts/wish-image/generate-hamel-wish-image.js` | CLI 생성 스크립트 | 6KB |
| `scripts/wish-image/build-hamel-wish-image.js` | CLI 프롬프트 빌더 | 4KB |
| `outputs/prompts/wish-image/hamel/` | 생성 완료 프롬프트 5개 | 24KB |
| `public/images/star-cache/yeosu_hamel/` | 생성 결과물 1개 + .gitkeep | ~3.3MB |
| `public/images/star-cache/_baseline/.gitkeep` | 빈 플레이스홀더 | 0B |

---

## 구조 분석

### 기존 활성 wish-image 시스템 (wishImageRoutes.js)

`server.js:2151`에서 `/api/wish-image` 라우트로 마운트된 기존 시스템:

```
소원 내용 + gem_type → DALL-E 3 → public/images/wishes/{timestamp}_{gem}.png
```

- 범용 프롬프트 (gem별 색상 + 소원 내용 기반)
- 서버 런타임 활성 ✅
- hamel.json SSOT 미사용

### HOLD 파이프라인 (scripts/wish-image/)

```
config/wish-image/hamel.json (SSOT)
        ↓
build-hamel-wish-image.js → outputs/prompts/wish-image/hamel/*.txt (5개)
        ↓
generate-hamel-wish-image.js → outputs/wish-image/hamel/ (QA)
                              → public/images/star-cache/yeosu_hamel/ (--final 플래그)
```

- **서버 독립 CLI** — `wishImageRoutes.js`가 require 하지 않음
- hamel 전용 Sowoni 중심 소원그림 (9:16 portrait, 썸네일과 별도 컨셉)
- `gpt-image-1` / `dall-e-3` ENV로 교체 가능 (vendor-neutral 설계)

### starImageRoutes.js hamel 서빙 현황

`routes/starImageRoutes.js:360` — hamel location 처리 분기:

```javascript
if (location === 'hamel') {
  const pregenUrl = getHamelThumbnailImage(emotionKey);  // thumbnails/hamel/generated/full/ 참조
  const postcardUrl = await copyPregenToPostcards(pregenUrl).catch(() => null);
  return res.json(buildPayload({ image_url: postcardUrl, from_cache: true }));
  // pregen 미스 → AI 생성 fallback
}
```

**hamel 위치에서 starImageRoutes는 thumbnails/generated/full/ (이미 커밋된 25장)을 서빙 — `star-cache/yeosu_hamel/` 경로는 참조하지 않음.**

---

## 핵심 발견: 파이프라인 단절 지점

```
[wish-image CLI 파이프라인]          [서버 런타임]
                                        
config/wish-image/hamel.json            wishImageRoutes.js
        ↓                              → public/images/wishes/   ← 활성 (범용)
scripts/wish-image/*.js
        ↓                              starImageRoutes.js:360
star-cache/yeosu_hamel/*.png           → thumbnails/hamel/full/  ← 활성 (hamel)
        ↑
        ⚠️ 이 경로를 서빙하는 라우트 없음
```

**`star-cache/yeosu_hamel/`에 생성된 이미지를 실제 사용자에게 전달하는 라우트 미존재.**

---

## 항목별 판단

### `config/wish-image/hamel.json` ← **COMMIT 가능**

| 항목 | 내용 |
|------|------|
| **역할** | 하멜 소원그림 SSOT — 장면/캐릭터/스타일/구도/감정오버라이드 전체 정의 |
| **품질** | 완성도 높음 — 썸네일 SSOT와 동급, 파이프라인 재실행 시 재현성 보장 |
| **서버 참조** | ❌ 서버 런타임에서 require 없음 — CLI 전용 |
| **크기** | 6KB |
| **결론** | ✅ COMMIT — `generate-star-images.js`와 동일한 성격의 CLI 설정 파일 |

### `config/wish-image/hamel-copy.json` ← **COMMIT 또는 DISCARD**

| 항목 | 내용 |
|------|------|
| **크기** | 0KB (빈 파일) |
| **역할** | `build-hamel-wish-image.js`가 감정 카피 배열로 사용 — 현재 비어있으면 스크립트 오류 가능 |
| **결론** | ⚠️ 내용 확인 필요. 빈 파일이면 스크립트에서 `copies.slice(0, LIMIT)` 빈 배열 → 프롬프트 0개 생성. COMMIT 시 빈 파일로 커밋하거나 내용 채워서 커밋 |

### `scripts/wish-image/generate-hamel-wish-image.js` ← **COMMIT 가능**

| 항목 | 내용 |
|------|------|
| **역할** | 하멜 소원그림 생성 CLI — `--dry-run`, `--emotion`, `--limit`, `--final` 플래그 지원 |
| **품질** | vendor-neutral 설계(gpt-image-1/dall-e-3 ENV 교체), DoD guard 포함 |
| **서버 참조** | ❌ 없음 |
| **결론** | ✅ COMMIT — CLI 운영 도구, `apply-migration.js`와 동일한 성격 |

### `scripts/wish-image/build-hamel-wish-image.js` ← **COMMIT 가능**

| 항목 | 내용 |
|------|------|
| **역할** | 하멜 소원그림 프롬프트 빌더 — SSOT에서 프롬프트 5개 생성 |
| **의존성** | `scripts/thumbnail/utils.js` (이미 tracked), `config/wish-image/hamel.json` (미커밋) |
| **서버 참조** | ❌ 없음 |
| **결론** | ✅ COMMIT (hamel.json과 함께) |

### `outputs/prompts/wish-image/hamel/` ← **COMMIT 가능**

| 항목 | 내용 |
|------|------|
| **파일** | 5개 txt (confusion/pause/calm/curiosity/fragile_hope) |
| **크기** | 24KB |
| **용도** | 파이프라인 재실행 없이 프롬프트 이력 확인 + 검수용 |
| **결론** | ✅ COMMIT — `outputs/prompts/hamel/` (썸네일)과 동일한 성격 |

### `public/images/star-cache/yeosu_hamel/` ← **HOLD (git 제외)**

| 항목 | 내용 |
|------|------|
| **파일** | `01_confusion_sapphire_yeosu_hamel.png` (3.3MB) + `.gitkeep` |
| **서버 참조** | ❌ `starImageRoutes.js` hamel 분기는 thumbnails/full/ 서빙 — star-cache/yeosu_hamel 미참조 |
| **서빙 경로** | 없음 — 라우트 미연결 |
| **크기** | 3.3MB (git 비적합) |
| **결론** | ⛔ git 제외 유지 — 서빙 라우트 연결 전까지 git에 포함 금지. 로컬 생성 결과물은 `outputs/wish-image/`(gitignore)로 보관 |

### `public/images/star-cache/_baseline/.gitkeep` ← **HOLD**

| 항목 | 내용 |
|------|------|
| **역할** | 빈 디렉토리 플레이스홀더 |
| **결론** | ⏸ 기능 확정 후 결정 — 현재 커밋 가치 없음 |

---

## MVP 포함 여부 종합 판단

### 파이프라인 완성도 평가

| 레이어 | 상태 | 판단 |
|--------|------|------|
| SSOT 설계 (`hamel.json`) | ✅ 완성 | 커밋 가능 |
| 프롬프트 빌더 (`build-*.js`) | ✅ 완성 | 커밋 가능 |
| 이미지 생성기 (`generate-*.js`) | ✅ 완성 | 커밋 가능 |
| 프롬프트 결과물 (`outputs/prompts/`) | ✅ 5개 생성 완료 | 커밋 가능 |
| 생성 이미지 (`star-cache/yeosu_hamel/`) | ⚠️ 1개만 생성, 미서빙 | git 제외 |
| **서빙 라우트 연결** | ❌ **미존재** | **MVP 차단 지점** |

### 결론

**CLI 파이프라인 (config + scripts + prompts)**: 독립 실행 가능한 운영 도구로서 커밋 가치 있음.  
**생성 결과물 (star-cache/*.png)**: 서빙 라우트 미연결 상태에서 git에 포함 불필요.

---

## 권고 커밋 구성 (다음 단계)

```
chore(wish-image): commit hamel wish-image pipeline scripts and config

- config/wish-image/hamel.json: 하멜 소원그림 SSOT
- scripts/wish-image/build-hamel-wish-image.js: 프롬프트 빌더
- scripts/wish-image/generate-hamel-wish-image.js: 이미지 생성기
- outputs/prompts/wish-image/hamel/: 5개 프롬프트 결과물
```

**포함 제외:**
- `config/wish-image/hamel-copy.json`: 빈 파일 — 내용 확인 후 결정
- `star-cache/yeosu_hamel/*.png`: 서빙 라우트 연결 전까지 git 제외
- `star-cache/_baseline/.gitkeep`: 기능 확정 후 결정

---

## 서빙 라우트 연결 시 필요 작업 (참고)

`starImageRoutes.js` hamel 분기를 thumbnails → star-cache로 전환하려면:

```javascript
// 현재: thumbnails/generated/full/ 서빙
const pregenUrl = getHamelThumbnailImage(emotionKey);

// 전환 시: star-cache/yeosu_hamel/ 서빙 (파일명 규칙 다름)
// {NN}_{emotion}_{gem}_yeosu_hamel.png 패턴 필요
// → 25장 전체 생성 + 파일명 SSOT 확정 후 구현
```

**전환 조건**: yeosu_hamel/ 25장 전체 생성 + DoD 검수 통과 후 별도 커밋으로 처리.
