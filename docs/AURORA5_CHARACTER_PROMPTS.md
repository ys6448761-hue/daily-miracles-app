# Aurora 5 캐릭터 생성 프롬프트 패키지 v2.1

> **작성일**: 2026-01-10
> **버전**: 2.1
> **용도**: CEO/팀이 Sora에서 바로 사용할 수 있는 완성된 프롬프트 세트

---

## 스타일 LOCK (모든 프롬프트 공통)

### 필수 문구 (영문)

```
STYLE LOCK:

2D hand-drawn animation look, Ghibli-inspired warmth mixed with Korean manhwa ink linework. Soft watercolor shading, gentle paper grain texture, cozy and hopeful mood. Clean readable shapes, minimal facial details. Transparent background PNG.

NEGATIVE:

3D render, photorealistic, harsh neon, corporate stock style, realistic portrait, detailed face, text, logo, watermark.
```

---

## 6명 프롬프트 (복붙용 완성본)

### 1. 푸르미르 (CEO)

**파일명**: `fourmilr_ceo_1024.png`
**컬러**: 보라 `#8B7BB8` + 금 `#FFD700`

```
2D hand-drawn animation look, Ghibli-inspired warmth mixed with Korean manhwa ink linework. Soft watercolor shading, gentle paper grain texture, cozy and hopeful mood.

A warm and confident human CEO in their late 30s, smart casual outfit, calm leadership posture, gentle smile, intelligent eyes but minimal facial details. Subtle "roadmap" and "north star" motifs behind them, purple and gold accents. Clean silhouette, simple shapes.

Transparent background PNG.

Negative: 3D, photorealistic, harsh neon, corporate stock style, realistic portrait, detailed face, text, logo, watermark.
```

---

### 2. 코미 (COO)

**파일명**: `komi_coo_1024.png`
**컬러**: 파랑 `#4A90E2` + 회색 `#808080`

```
2D hand-drawn animation look, Ghibli-inspired warmth mixed with Korean manhwa ink linework. Soft watercolor shading, gentle paper grain texture.

A friendly AI coordinator agent character (semi-abstract), minimal facial detail, holding a checklist and a small compass. Background hints of simple timeline blocks and tidy workspace icons. Blue and white accents, organized and reliable vibe.

Transparent background PNG.

Negative: 3D, photorealistic, corporate stock, realistic portrait, text, logo, watermark.
```

---

### 3. 루미 (Data Analyst)

**파일명**: `lumi_data_1024.png`
**컬러**: 민트 `#7FCDBB` + 회색 `#808080`

```
2D hand-drawn animation look, Ghibli-inspired warmth mixed with Korean manhwa ink linework. Soft watercolor shading, gentle paper grain texture.

A calm AI data analyst agent character, minimal facial detail, holding a tablet with simple chart icons (line + dots). Subtle floating data symbols around. Mint accents, trustworthy and analytical but warm.

Transparent background PNG.

Negative: 3D, photorealistic, detailed realistic face, text, logo, watermark.
```

---

### 4. 재미 (Creative Director)

**파일명**: `jaemi_creative_1024.png`
**컬러**: 핑크 `#FFB6C1` + 노랑 `#FFD700`

```
2D hand-drawn animation look, Ghibli-inspired warmth mixed with Korean manhwa ink linework. Soft watercolor shading, gentle paper grain texture.

A cheerful creative AI agent character, minimal facial detail, playful spark motifs, holding a brush or color palette icon. Cozy studio hints (sticky notes, small doodles). Pink and soft yellow accents, bright warm energy.

Transparent background PNG.

Negative: 3D, photorealistic, corporate stock, text, logo, watermark.
```

---

### 5. 여의보주 (CRO)

**파일명**: `yeouibozu_cro_1024.png`
**컬러**: 초록 `#8FBC8F` + 베이지 `#F5F5DC`

```
2D hand-drawn animation look, Ghibli-inspired warmth mixed with Korean manhwa ink linework. Soft watercolor shading, gentle paper grain texture.

A wise and caring human companion in their 50s, modern hanbok-inspired comfortable attire, gentle welcoming gesture, warm reassuring presence. Subtle tea-light and calm wave motifs, green and beige accents, Korean aesthetic. Minimal facial details, clean silhouette.

Transparent background PNG.

Negative: 3D, photorealistic, detailed portrait face, text, logo, watermark.
```

---

### 6. Claude Code (Tech Lead)

**파일명**: `claudecode_tech_1024.png`
**컬러**: 청록 `#00CED1` + 검정 `#000000`

```
2D hand-drawn animation look, Ghibli-inspired warmth mixed with Korean manhwa ink linework. Soft watercolor shading, gentle paper grain texture.

An abstract "tech engine" emblem: a central node with interconnected smaller nodes (agent network), soft cyan and turquoise glow. Hints of code brackets and server icons as simple shapes. Stable and reliable feeling, not a person.

Transparent background PNG.

Negative: 3D, photorealistic, heavy sci-fi realism, text, logo, watermark.
```

---

## Sora 생성 가이드

### 기본 세팅

| 항목 | 설정 |
|------|------|
| 포맷 | PNG |
| 크기 | 1024 x 1024 |
| 배경 | 투명 |
| 품질 | 최고 |

### 생성 전략

```
1명당 3회 생성 → 베스트 선택

1. 프롬프트 그대로 입력 (1차)
2. 미세 조정 후 재생성 (2차)
3. 최종 조정 후 재생성 (3차)

총 6명 × 3회 = 18장 생성
→ 베스트 6장 선택
```

---

## 실패 확률 줄이는 팁 10가지

| # | 문제 | 해결책 |
|---|------|--------|
| 1 | 너무 사람처럼 나옴 | `"minimal facial details"`, `"silhouette-like"` 추가 |
| 2 | 색이 너무 튐 | `"soft pastel tones"`, `"muted palette"` 추가 |
| 3 | 3D 렌더링처럼 나옴 | NEGATIVE에 `"NOT 3D render"`, `"flat illustration"` 강화 |
| 4 | 배경이 복잡함 | `"simple background"`, `"minimal elements"` 추가 |
| 5 | 얼굴이 너무 정교함 | NEGATIVE에 `"no detailed skin pores"` 추가 |
| 6 | 텍스트/로고 포함됨 | NEGATIVE에 `"absolutely no text"`, `"no words"` 강조 |
| 7 | 일관성이 떨어짐 | STYLE LOCK 엄격히 적용, 1명씩 순차 생성 |
| 8 | 배경이 투명하지 않음 | `"transparent background PNG"` 강조, 생성 후 수동 제거 |
| 9 | 너무 어둡거나 밝음 | `"balanced lighting"`, `"soft natural light"` 추가 |
| 10 | 워터마크 포함 | NEGATIVE에 `"no watermark"`, `"no signature"` 명시 |

---

## 파일명 규칙

### 기본 버전 (1024x1024)

```
fourmilr_ceo_1024.png
komi_coo_1024.png
lumi_data_1024.png
jaemi_creative_1024.png
yeouibozu_cro_1024.png
claudecode_tech_1024.png
```

### 추가 버전

```
512px 버전:
fourmilr_ceo_512.png
komi_coo_512.png
...

원형 크롭:
fourmilr_ceo_circle.png
komi_coo_circle.png
...
```

---

## 베스트 선택 기준

### 체크리스트

- [ ] 지브리 + 한국만화 느낌 확인
- [ ] 수채화 질감 확인
- [ ] 종이 그레인 텍스처 확인
- [ ] 얼굴 디테일 최소화 확인
- [ ] 컬러 팔레트 일치 확인
- [ ] 배경 투명 확인
- [ ] 텍스트/로고 없음 확인
- [ ] 6명 스타일 일관성 확인

### 우선순위

| 순위 | 기준 |
|------|------|
| 1순위 | 스타일 일관성 (불일치 시 탈락) |
| 2순위 | 브랜드 톤 일치 |
| 3순위 | 디테일 퀄리티 |

---

## 컬러 팔레트 요약

| 캐릭터 | 메인 | 서브 | HEX |
|--------|------|------|-----|
| 푸르미르 | 보라 | 금 | `#8B7BB8` `#FFD700` |
| 코미 | 파랑 | 회색 | `#4A90E2` `#808080` |
| 루미 | 민트 | 회색 | `#7FCDBB` `#808080` |
| 재미 | 핑크 | 노랑 | `#FFB6C1` `#FFD700` |
| 여의보주 | 초록 | 베이지 | `#8FBC8F` `#F5F5DC` |
| Claude Code | 청록 | 검정 | `#00CED1` `#000000` |

---

## 사용 방법

1. CEO/팀이 Sora 접속
2. 프롬프트 복붙
3. 1명당 3회 생성
4. 베스트 6장 선택
5. 코미에게 전달 → 후처리 (크롭/리사이즈)
6. Wix/SNS 배포

---

*작성자: 코미 (based on 푸르미르 CEO 가이드)*
