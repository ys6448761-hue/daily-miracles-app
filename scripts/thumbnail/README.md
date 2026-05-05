# Thumbnail Pipeline

> **SSOT**: `.claude/DEC/DEC-THUMBNAIL-PIPELINE-v2.md`
> 파이프라인 로직 변경 전 반드시 DEC를 확인할 것.

---

## 실행 명령

### 1. 프롬프트 빌드

```bash
node scripts/thumbnail/build-thumbnail.js --location hamel
node scripts/thumbnail/build-thumbnail.js --location cablecar
```

→ `outputs/prompts/thumbnail/{location}/*.txt` (5개) 생성

---

### 2. 베이스 이미지 생성 (API 5회)

```bash
node scripts/thumbnail/generate-thumbnail.js --location hamel
node scripts/thumbnail/generate-thumbnail.js --location cablecar
```

→ `public/images/thumbnails/{location}/base/` (5장)
→ `.env`의 `OPENAI_API_KEY` 필요

---

### 3. Full 25장 합성 (API 없음)

```bash
node scripts/thumbnail/build-thumbnail.js --location hamel --full25
node scripts/thumbnail/build-thumbnail.js --location cablecar --full25
```

→ `public/images/thumbnails/{location}/generated/full/` (25장)
→ `manifest.json` 자동 생성

---

### 드라이런 (API 호출 없이 프롬프트 확인)

```bash
node scripts/thumbnail/generate-thumbnail.js --location cablecar --dry-run
```

---

## 신규 장소 추가

```
1. config/thumbnail/{location}.json  생성
2. config/thumbnail/{location}-copy.json  생성
3. 위 1-3번 명령 순서대로 실행
```

스크립트 코드 수정 불필요.

---

## Deprecated 스크립트

아래 스크립트는 **사용하지 말 것** (경고 후 실행됨):

| deprecated | 대체 |
|-----------|------|
| `build-hamel-prompts.js` | `build-thumbnail.js --location hamel` |
| `generate-hamel-images.js` | `generate-thumbnail.js --location hamel` |
| `build-cablecar-prompts.js` | `build-thumbnail.js --location cablecar` |
| `generate-cablecar-images.js` | `generate-thumbnail.js --location cablecar` |

---

## 파일 구조

```
scripts/thumbnail/
  build-thumbnail.js        ← 통합 빌드 (프롬프트 + full25 + sample)
  generate-thumbnail.js     ← 통합 생성 (base 이미지)
  utils.js                  ← 공통 유틸 (runGenerate, recolorStar 등)
  lib/
    recolorStar.js
    drawStar.js
    makeOgImage.js
    starPosition.js

config/thumbnail/
  {location}.json           ← 장소 SSOT
  {location}-copy.json      ← 감정별 카피

public/images/thumbnails/
  {location}/
    base/                   ← 베이스 5장
    generated/
      full/                 ← 완성 25장 + manifest.json
```
