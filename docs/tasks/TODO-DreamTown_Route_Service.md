---
Document: TODO-DreamTown_Route_Service
Based On: DreamTown_V1_Architecture_Freeze.md (APPROVED v1.0), DreamTown V1 Implementation Directive
Date: 2026-07-12 (갱신, 원문 2026-07-11)
Status: Implementation in progress — Phase 1 완료
---

# TODO — DreamTown Route Service (V1 Implementation)

> 2026-07-12: Architecture Freeze가 APPROVED v1.0으로 승인되고 Implementation Directive가 접수되면서, 이 문서의 우선순위를 Directive의 Phase 1~4 구조로 갱신했다(기존 P0~P3 계획을 대체).

---

## Phase 1 — Booking / Journey / Credential(Entitlement) ✅ 완료 (2026-07-12, dreamtown-wishart 커밋 `6aaa819`)

```
[완료]
작업명: DreamTown V1 Phase 1 — Booking/Journey/Entitlement
영향 파일: dreamtown-wishart/db.py, dreamtown-wishart/app.py, dreamtown-wishart/test_booking_flow.py
Migration: db.py _create_tables()에 bookings/residents/resident_assets/resident_journeys/atelier_records 5개 테이블 추가(SQLite, idempotent CREATE TABLE IF NOT EXISTS 방식 — 이 저장소의 기존 관례를 따름, 별도 migrations 폴더 없음)
API: POST/GET /api/bookings, GET /api/bookings/{id}, POST /api/bookings/{id}/confirm, POST /api/bookings/{id}/entitlement, POST /api/bookings/{id}/redeem, GET /api/journeys/{id}, POST /api/journeys/{id}/complete
Test: test_booking_flow.py 20/20 통과(상태 전이, 잘못된 채널/전이 거부, cascade completion). FastAPI TestClient로 HTTP 레이어도 별도 확인(create/get/confirm/list 200, 잘못된 channel 400, credential 서비스 미가용 시 503 — 정상 동작)
SSOT 일치 여부: DreamTown_V1_Architecture_Freeze.md §4 상태 전이표·Entitlement 재사용 결정과 일치. Entitlement는 신규 테이블을 만들지 않고 기존 credential_code/dm_client 시스템을 그대로 재사용함(Freeze 문서 결정 그대로 구현).
남은 작업: HOTEL/OTA 채널 자동 연동(PMS/OTA API)은 V1_FOUNDATION_ONLY로 스키마만 존재, 구현하지 않음(Freeze §9 분류 그대로). residents/resident_assets/atelier_records 테이블은 스키마만 생성했고, 이번 Phase에서는 create_resident/get_resident 최소 함수만 구현(Journey의 FK 의존성 해소 목적) — 전체 등록 API/폼은 Phase 4 대상, 이번 범위 아님.
```

## Phase 2 — Product Code 적용 (대기)

- `DT-BASIC`/`DT-HOTEL`/`DT-PREMIUM` 표준 코드 및 `DT-OPT-*` Option 적용.
- 가격은 수정하지 않는다 — `SSOT-PRICE-001`만 기준.
- **의존성**: Phase 1의 `bookings.product_code` 필드(이미 스키마 존재, Phase 1에서 생성 완료) — Phase 2는 이 필드에 실제 `DT-*` 코드값을 채우는 검증/시딩 작업.

## Phase 3 — QR 2축 처리 (대기)

- Service Domain(DreamTown/WishArt/Wish) × Purpose(Activation/Location/Partner/Content).
- 기존 라우트 유지: 파트너 QR=WishArt+Partner, 장소 QR=DreamTown+Location.
- **의존성**: 없음(기존 라우트 코드 변경 없이 분류/문서화 작업 위주).

## Phase 4 — Identity (대기)

- "별들의 가족 되기" = 기존 `consent_version` 절차 재사용(신규 컬럼 없음).
- Identity/Resident 개념적 구분, 물리 구조는 기존 `residents` 유지.
- 스타터카드+정면사진 업로드 라우트/폼, 소원그림 생성 연결, 주민 프로필/주민카드 합성, 결과 화면.
- **의존성**: Phase 1의 `residents`/`resident_assets` 스키마(이미 생성 완료) + WishArt Core Engine 추출(`generate_wishart` 인터페이스, 아직 미구현 — `_run_generation()`이 여전히 `stars` 전용으로 결합되어 있음, `REPORT-WishArt_Platform_Refactor_Impact.md` §1 참조).

---

## 구현 금지 (Directive 기준, 전체 Phase 공통)

- OTA API, OTA Webhook, 호텔 PMS 연동, 자동 정산
- Wish Platform 구현, Wish 독립 서비스
- Dynamic Pricing, Marketplace, Community, AI 추천 기능
- 별공방·재회 기능을 추측으로 구현
- 주민카드 전체를 생성형 AI에 맡김
- 두 서비스 데이터를 동일 폼·동일 결과 화면에 혼합

## 완료 기준 (Freeze §9 MVP 분류 기준, 전체 완료 시 재검증)

- [x] 기존 포토존 기능이 유지되는가? (회귀 테스트로 확인, Phase 1)
- [ ] DreamTown Route가 별도 서비스로 분리되는가?
- [x] Booking/Journey/Entitlement가 동일 Core Engine·DB와 독립적으로 동작하는가? (Phase 1)
- [ ] 정면사진 한 장으로 소원그림과 주민카드를 만들 수 있는가? (Phase 4 대상)
- [ ] DreamTown 데이터가 포토존 데이터와 혼합되지 않는가? (스키마 분리는 완료, 전체 검증은 Phase 4 이후)
- [ ] 향후 축제·행사 서비스를 추가할 때 엔진 수정 없이 서비스만 추가할 수 있는가?
