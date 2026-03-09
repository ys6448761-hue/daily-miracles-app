# DreamTown Wish Image SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Define the wish image generation system — the visual identity of each wish.

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 개념

소원 이미지는 소원이의 소원이 **처음으로 형태를 갖추는 순간**이다.
텍스트로 적힌 소원이 AI를 통해 **빛 구슬(Light Orb)**로 시각화된다.
이 이미지가 7일 챌린지·소원꿈터·성장필름의 출발점이 된다.

---

## 1. 생성 파이프라인

```
wish_text + gem_type
        ↓
DALL-E 3 프롬프트 조립
(Cosmic universe + gem 색감 + keyword + Korean aesthetic)
        ↓
DALL-E 3 API 호출 (최대 3회 재시도, 2초 간격)
        ↓
        ├─ 성공 → 서버 영구 저장
        │          /images/wishes/wish_{timestamp}_{gem}.png
        │                ↓
        │          ① 7일 챌린지 자동 생성 (fail-open)
        │          ② 소원꿈터 WISH 카드 자동 생성 (fail-open)
        │                ↓
        │          영구 URL 반환
        │
        └─ 3회 실패 → Fallback 이미지 반환
```

---

## 2. 보석 시스템 (5종)

| 보석 | 코드 | 주색 | 보조색 | 키워드 |
|------|------|------|--------|--------|
| **루비** | `ruby` | Deep red | Golden | 열정과 용기 |
| **사파이어** | `sapphire` | Deep blue | Silver | 안정과 지혜 |
| **에메랄드** | `emerald` | Emerald green | Golden | 성장과 치유 |
| **다이아몬드** | `diamond` | White crystal | Rainbow | 명확한 결단 |
| **시트린** | `citrine` | Warm yellow | Orange | 긍정 에너지 |

보석 유형은 이미지 색감·감성·문구 톤 모두에 영향을 준다.

---

## 3. 이미지 스타일 (3종)

| 코드 | 스타일 | 가격 |
|------|--------|------|
| `miracle_fusion` | 지브리 따뜻함 + 한국 웹툰 수채화 | 무료 (기본값) |
| `miracle_ghibli` | 순수 지브리 스타일 | 유료 |
| `miracle_korean` | 한국 웹툰 스타일 (카페·골목·한옥) | 유료 |

**공통 규칙**: No text / No words / No letters / No characters in image

---

## 4. API 엔드포인트

| 엔드포인트 | 용도 |
|-----------|------|
| `POST /api/wish-image/generate` | 소원그림 생성 + 영구 저장 |
| `POST /api/wish-image/generate-with-watermark` | 생성 + 광고용 워터마크 자동 합성 |
| `POST /api/wish-image/watermark` | 기존 이미지에 워터마크 삽입 |
| `POST /api/wish-image/overlay` | 하단 그래디언트 + 한국어 캡션 오버레이 |
| `POST /api/wish-image/postcard` | 1:1 포스트카드 합성 |
| `GET /api/wish-image/list` | 저장된 이미지 목록 조회 |

---

## 5. 문구 시스템

### 톤앤매너
- 관찰형 70% — 객관적, 담담한 묘사
- 서정형 30% — 감성적, 시적 표현

### 제공 시점
| 시점 | 용도 |
|------|------|
| Day 1 | 소원그림 생성 중 로딩 문구 |
| Day 7 | 7일 여정 완주 축하 문구 |
| 영구 | 소원이 갤러리 보관 문구 |

### 성장 서사
```
Day 1: 씨앗  →  Day 3: 새싹  →  Day 7: 꽃
```

---

## 6. 7일 챌린지 자동 연동

소원 이미지 생성 즉시 **7일 챌린지가 자동 시작**된다.

```sql
INSERT INTO wish_challenges (wish_id, base_image_url, overlay_pack_id)
VALUES ($1, $2, 'hope_v1')
ON CONFLICT (wish_id) DO NOTHING
```

실패해도 이미지 응답을 막지 않는다 (fail-open).

---

## 7. 소원꿈터 자동 연동 (AIL-112)

소원 이미지 생성 즉시 소원꿈터 광장에 WISH 카드가 등록된다.

```sql
INSERT INTO "Post" (
  id, content, status, "postType", "wishId", "thumbnailUrl", "badgeText"
)
VALUES (uuid, '', 'APPROVED', 'WISH', $wishId, $imageUrl, 'Day 1')
ON CONFLICT DO NOTHING
```

- `authorId NULL` = 익명 카드 (AIL-112 P0 정책)
- 실패해도 이미지 응답을 막지 않는다 (fail-open)

---

## 8. 광고용 이미지

`POST /api/wish-image/generate-with-watermark`

- 원본 이미지와 워터마크 버전 동시 생성
- 기본 워터마크: `하루하루의 기적 | 예시 이미지`
- 위치: bottom-right (기본)
- 투명도: 0.7 (광고용 강조)

---

## 9. 기술 스펙

| 항목 | 값 |
|------|-----|
| AI 모델 | DALL-E 3 |
| 이미지 크기 | 1024x1024 |
| 품질 | standard |
| 재시도 | 최대 3회 (2초 간격) |
| 저장 위치 | `public/images/wishes/` |
| 파일명 형식 | `wish_{timestamp}_{gem}.png` |
| 라이브러리 | sharp (워터마크·오버레이) |

---

## 참조

- 소원 시스템: `DreamTown_Wish_System_SSOT.md`
- 비주얼 스타일: `DreamTown_Visual_Style_SSOT.md`
- 성장필름 연동: `DreamTown_Growth_Film_SSOT.md`
- API 코드: `routes/wishImageRoutes.js`
