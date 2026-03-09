# DreamTown 디지털 용궁 DB 설계

Version: v1.0
Owner: Aurora5 / 루미
Status: Review
Purpose: 디지털 용궁 중심 데이터 구조 설계 — 온라인/오프라인 소원 통합 아카이브

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 개념 원칙

```
디지털 용궁 = 원본 (저장)
DreamTown  = 표현 (드러남)
```

DB 최상위 원본 테이블은 개념적으로 `DragonPalaceArchive`다.

---

## 개념 데이터 계층

```
DragonPalaceArchive   ← 원본 (용궁) — 온라인/오프라인 모든 소원
        ↓
     Wish             ← 정제된 소원
        ↓
     Story            ← DreamTown 노출 구조체
        ↓
     Star             ← 별 표현 단위
        ↓
  Constellation       ← 별자리 연결
```

---

## DragonPalaceArchive 테이블 (제안)

소원의 원본 아카이브. 온라인/오프라인 모두 수렴.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| source_channel | ENUM | `online` / `offline_voyage` / `offline_letter` / `offline_plane` |
| online_or_offline | ENUM | `online` / `offline` |
| event_id | UUID | 오프라인 이벤트 ID (nullable) |
| wish_text | TEXT | 소원 원문 |
| wish_letter_front_image | TEXT | 소원엽서 앞면 이미지 URL (nullable) |
| wish_letter_back_image | TEXT | 소원엽서 뒷면 이미지 URL (nullable) |
| participant_face_image | TEXT | 참가자 사진 URL (nullable) |
| paper_plane_image | TEXT | 종이비행기 이미지 URL (nullable) |
| raw_story | TEXT | 원본 스토리 전문 (nullable) |
| consent_level | ENUM | `none` / `private` / `community` / `public` |
| archive_status | ENUM | `pending` / `active` / `archived` |
| created_at | TIMESTAMP | 생성 시각 |

---

## source_channel 정의

| 값 | 설명 |
|----|------|
| `online` | 앱/웹 온라인 소원 접수 |
| `offline_voyage` | 오프라인 소원항해 체험 |
| `offline_letter` | 소원엽서 |
| `offline_plane` | 종이비행기 소원 |

---

## 기존 wish_entries와의 관계

> ⚠️ 현재 운영 중인 `wish_entries` 테이블과의 마이그레이션 전략은 별도 검토 필요.

개념적 매핑:
- `wish_entries` → `DragonPalaceArchive`의 `source_channel = 'online'` 서브셋
- 오프라인 소원 → 신규 추가 경로

---

## 미결 사항

| 항목 | 상태 |
|------|------|
| 기존 wish_entries 마이그레이션 여부 | 검토 필요 |
| consent_level 정책 상세 | 법무 검토 필요 |
| 오프라인 이미지 저장소 | S3 or Render |
| 오프라인 입력 인터페이스 | 어드민 or 현장 태블릿 |

---

## 참조

- 아키텍처: `docs/ssot/DreamTown_World_Architecture_SSOT.md`
- 안전/개인정보: `docs/ssot/DreamTown_Safety_Ethics_SSOT.md`
