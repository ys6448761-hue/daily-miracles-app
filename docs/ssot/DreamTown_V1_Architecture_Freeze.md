---
title: DreamTown V1 Architecture Freeze
status: APPROVED
version: "1.0"
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-11
approved: 2026-07-12
layer: LAYER 1 — Constitution급 (V1 오픈 최종 설계 기준)
change_process: 승인 이후 신규 기능은 DreamTown_V2_Backlog.md로 관리한다. V1 구조 변경이 필요한 예외는 ADR 작성 후 승인한다(§11).
---

# DreamTown V1 Architecture Freeze

> **이 문서는 오픈 버전(V1)의 최종 설계 기준이다.**
> V1 개발은 승인된(APPROVED) 본 문서만을 기준으로 진행한다.

---

## 1. Vision

> DreamTown은 관광상품이 아니다. **감정여행 플랫폼**이다.

기존 SSOT(`SSOT-BG-001`, `SSOT-PRODUCT-001`)의 철학과 일치한다.

---

## 2. Platform

```
Project Phoenix
  ↓
Wish Platform
  ↓
DreamTown / WishArt / Wish
```

- **Project Phoenix**: 최상위 사업 단위.
- **Wish Platform / "Wish" 축**: V1 범위에 포함하지 않는다. 역할 정의 자체가 없어 §10에서 **V2_BACKLOG**로 분류한다.
- DreamTown = 별빛항로 기반 서비스. WishArt = 이미지 생성 엔진 + 서비스군.

---

## 3. Service / Product (Product Code 정규화 확정)

```
DreamTown
  ↓
Basic / Hotel / Premium / Option
```

기존 가격 SSOT(`SSOT-PRICE-001`, `DreamTown_Product_Structure_SSOT.md`)의 명칭(YW_BASIC_7, 소원항해단 Basic/Experience, 별빛항로 FIT 등)과 이번 문서의 Basic/Hotel/Premium/Option을 **하나의 Product Code 네임스페이스로 통합**한다.

### Product Code 규칙

```
Product Code = DT-{TIER}         TIER ∈ { BASIC, HOTEL, PREMIUM }
Option Code  = DT-OPT-{NAME}     (기본 상품과 분리된 추가 권한 — 별도 엔티티, 그 자체로 Booking을 발생시키지 않고 기존 Booking에 부가된다)
```

### 기존 상품과의 매핑 (가격은 재확정하지 않음 — `SSOT-PRICE-001`이 원 단위 금액의 유일한 SSOT로 남는다)

| Product Code | 대응하는 기존 상품 | 비고 |
|---|---|---|
| `DT-BASIC` | 별빛항로 체험 단독(FIT Basic, `SSOT-PRICE-001` §7-1, ₩41,000) / 소원항해단 Experience | 숙박 없음 |
| `DT-HOTEL` | 1박2일 패키지(유탑/케니 + 별빛항로, `SSOT-PRICE-001` §7-2/7-3) | 숙박 결합 |
| `DT-PREMIUM` | 명확히 대응하는 기존 상품 없음(가장 가까운 것: `YW_PREMIUM_30`) | **가격·구성 미확정 — V1_FOUNDATION_ONLY(§10)** |
| `DT-OPT-POSTCARD` | 소원엽서(옵션, `SSOT-PRICE-001` §1) | Option 구조 확정, 개별 Option 목록 확장은 V2 |
| `DT-OPT-MIRACLE-SHORTS` 등 | 기적쇼츠 등 개별 산출물 단독 구매 | 위와 동일 |

- 기존 `PRG_*`(온라인 프로그램)/`YW_*` 코드는 이번 정규화 대상이 아니다 — "Wish" 축(§2) 자체가 V2로 분류되어, 그 하위 상품 코드도 함께 보류한다.
- `Option`은 §2 지시대로 **기본 상품(Basic/Hotel/Premium)과 분리된 추가 권한 구조**로 확정한다 — Option 단독으로는 Booking(§4)을 발생시키지 않고, 기존 Booking에 추가되는 형태다.

---

## 4. Booking (최소 모델 확정)

```
채널(Direct/Hotel/OTA/Partner)
  ↓
Booking
  ↓
Entitlement
  ↓
Journey
  ↓
Identity
```

### Booking 최소 필드

```
bookings
  booking_id        PK
  channel           ENUM(DIRECT, HOTEL, OTA, PARTNER)
  channel_ref       TEXT NULLABLE   -- 외부 채널 참조번호(OTA 주문번호, 호텔 예약번호 등)
  product_code      TEXT            -- §3의 DT-BASIC / DT-HOTEL / DT-PREMIUM
  option_codes      TEXT[] NULLABLE -- DT-OPT-* 배열
  customer_name     TEXT
  contact           TEXT NULLABLE
  origin_hotel_id   TEXT NULLABLE
  partner_code      TEXT NULLABLE
  entitlement_code  TEXT NULLABLE   -- 기존 이용권(credential_code) 시스템의 코드를 그대로 참조. 신규 Entitlement 테이블을 만들지 않는다.
  booking_status    ENUM(...)       -- 아래 상태 전이 참조
  created_at, updated_at
```

### 상태 전이

```
CREATED → CONFIRMED → ENTITLED → REDEEMED → COMPLETED
   ↓           ↓
CANCELLED   CANCELLED
                ↓
             EXPIRED  (Entitlement 유효기간 경과, 미사용)
```

- `CREATED`: 채널로부터 예약 정보 수신.
- `CONFIRMED`: 결제/예약 확정.
- `ENTITLED`: `entitlement_code` 발급 완료(기존 `credential_code`/voucher 시스템 재사용).
- `REDEEMED`: 고객이 실제로 Entitlement를 사용해 DreamTown Route에 등록 — 이 시점에 Journey가 생성된다.
- `COMPLETED`: Journey 완료(별빛항로 체험 + 소원그림 수령까지).

### Entitlement · Journey와의 관계

- **Booking : Entitlement = 1 : 1.** Entitlement는 신규 테이블이 아니라 **기존 이용권(`credential_code`, `dm_client.check_credential`) 시스템을 그대로 재사용**한다.
- **Entitlement : Journey = 1 : 1.** `REDEEMED` 시점에 `resident_journeys` 행이 생성된다. 이를 위해 `resident_journeys`에 **`booking_id`(nullable FK) 컬럼을 추가**한다(`SSOT-ARCH-001` §6 스키마 갱신 — 본 문서가 최신 기준).
- **Journey : Resident = N : 1.** 기존 관계 그대로 유지.

### V1 범위

- **DIRECT/PARTNER 채널**: 등록 시점에 최소 `bookings` row를 생성한다 — **V1_REQUIRED**(단순 insert, 외부 시스템 연동 없음).
- **HOTEL/OTA 채널의 자동 연동**(PMS/OTA API로부터 예약을 자동으로 Booking으로 변환): 스키마(channel enum, channel_ref)는 지금 확정하되, 실제 자동 연동은 **V1_FOUNDATION_ONLY** — V1에서는 호텔 스타터키트 수령 시 `origin_hotel_id`를 수동/폼 입력으로 받는 현재 방식(`SSOT-ARCH-001`)을 유지한다.

---

## 5. QR (2축 모델 확정)

```
Service Domain: DreamTown / WishArt / Wish
Purpose:        Activation / Location / Partner / Content
```

기존 파트너 QR과 장소 QR은 **Purpose 기준으로 그대로 유지**한다(라우트 변경 없음).

| 기존 라우트 | Service Domain | Purpose |
|---|---|---|
| `/qr/partner/{partner}` → `/partner-workshop` | WishArt | Partner |
| `/qr/place/{place}` → `/origin-checkin` | DreamTown | Location |

| 미구현 축 값 | 상태 |
|---|---|
| Domain: Wish | **V2_BACKLOG**(§2에서 Wish 축 자체가 미정) |
| Purpose: Activation | **V1_FOUNDATION_ONLY** — Booking(§4)의 Entitlement 발급/활성화와 연결될 개념, 실제 QR 미발급 |
| Purpose: Content | **V2_BACKLOG** — 인쇄물(스토리북 등)에 붙는 공유용 QR, 상품 자체가 아직 없음 |

---

## 6. Identity (구조 확정)

```
호텔
  ↓
별들의 가족 되기   ← 명시적 고객 선택으로 확정 (아래 참조)
  ↓
Identity / Resident   ← 개념적으로만 구분, 물리 테이블은 하나(residents + resident_assets)
  ↓
WishArt
  ↓
Resident Card
  ↓
Atelier
  ↓
Promise
  ↓
Reunion
```

### "별들의 가족 되기" — 명시적 고객 선택으로 확정

`residents.consent_version`(개인정보·이미지 저장 동의, DreamTown Route 필수 입력 항목)이 곧 "별들의 가족 되기"의 실제 구현이다. 별도의 신규 필드나 이벤트를 만들지 않는다 — **기존 동의 입력을 이 단계의 명칭·화면 카피로 프레이밍한다.**

### Identity vs Resident — 물리적으로 하나의 데이터 모델

- **Identity**(개념): 정면사진·Identity Lock·소원그림·주민 프로필 등 "얼굴/정체성 파생 자산" 전체를 가리키는 개념적 레이어. 물리적으로는 `resident_assets`(asset_type=PORTRAIT_ORIGINAL/WISHART_IMAGE/RESIDENT_PROFILE 등)에 저장된다.
- **Resident**(개념): 이름·가입일·호텔·상태 등 "등록 정보"를 가리키는 개념적 레이어. 물리적으로는 `residents` 테이블이다.
- **결정**: 별도의 `identity` 테이블을 만들지 않는다. `residents` + `resident_assets` 두 테이블로 충분하다(`SSOT-ARCH-001` §6 그대로 유지).

### Promise / Reunion

- Promise: `atelier_records.promise_text` — 필드는 확정, 실제 입력 UI/흐름은 **V1_FOUNDATION_ONLY**.
- Reunion: `atelier_records.reunion_status` — 컬럼은 확정, 트리거·동작은 **V2_BACKLOG**(스펙 없음, 추측 구현 금지).

---

## 7. WishArt

```
하나의 엔진
  ↓
DreamTown / PhotoZone / Festival
```

`SSOT-ARCH-001`/`SSOT-WISHART-002`와 동일. `HOTEL_LOBBY`는 별도 WishArt 서비스 모드가 아니라 **§3의 `DT-HOTEL` Product Code로 흡수**한다(DreamTown 서비스 모드 하나로 처리, WishArt 엔진 관점에서는 DreamTown과 동일 경로).

---

## 8. Data

```
Booking / Journey / Identity(resident_assets) / Resident(residents) / Assets / Atelier
```

§6의 결정에 따라 Identity와 Resident는 개념적 구분이며 물리 테이블은 `residents`/`resident_assets`로 확정. 전체 스키마:

```sql
bookings           -- §4 신규
residents          -- SSOT-ARCH-001 §6, 변경 없음
resident_assets     -- SSOT-ARCH-001 §6, 변경 없음
resident_journeys   -- SSOT-ARCH-001 §6 + booking_id(신규, nullable FK) 추가
atelier_records     -- SSOT-ARCH-001 §6, 변경 없음
```

---

## 9. MVP 분류 (전체 기능, 3-상태 확정)

### `V1_REQUIRED`

| 기능 | 근거 |
|---|---|
| WishArt Quick(PhotoZone) | 이미 동작 + 하드닝 완료 |
| 장소 QR → 워크숍 연결 | 버그 수정 완료 |
| WishArt Core Engine 추출(`generate_wishart`) | 다른 모든 서비스의 전제조건 |
| DreamTown Route 등록(스타터카드+정면사진→Identity) | 핵심 신규 기능 |
| 소원그림 생성(DreamTown Route 경유) | 핵심 신규 기능 |
| 디지털 주민카드(2D 프로필 + 고정 템플릿 합성) | 주민등록 증표 |
| "별들의 가족 되기"(명시적 동의) | 법적/운영상 필수 입력이기도 함 |
| Booking 최소 레코드(DIRECT/PARTNER 채널) | §4 확정 |
| Entitlement 발급/검증(기존 시스템 재사용) | 이미 부분 구현됨 |
| QR 2축 taxonomy 라벨링(기존 라우트 재분류만, 코드 변경 없음) | §5 확정 |
| `DT-BASIC`, `DT-HOTEL` Product Code 부여 | §3 확정 |

### `V1_FOUNDATION_ONLY` (스키마/구조는 확정하되 전체 기능·UI는 V1에 불필요)

| 기능 | 비고 |
|---|---|
| `atelier_records` 테이블 | 최소 `wishart_image_path` 기록만, Promise 입력 UI 없음 |
| Booking의 HOTEL/OTA 자동 연동 | channel enum만 존재, 실제 PMS/OTA API 연동 없음 |
| `DT-PREMIUM` Product Code | 코드는 존재, 가격/구성 미정이라 판매 미개시 가능 |
| `DT-OPT-*` Option 구조 | 개념 확정, 개별 Option 항목 확장은 이후 |
| QR Purpose: Activation | taxonomy엔 존재, 실제 QR 미발급 |
| WishArt `Festival`(§7) | enum엔 존재, 실제 서비스 미오픈 |

### `V2_BACKLOG`

| 기능 |
|---|
| 별공방 실제 등록 UI/로직 전체 |
| 재회(Reunion) 시스템 트리거·동작 |
| Festival/Event 서비스 전체 구현 |
| Booking의 OTA/Hotel PMS 자동 연동(실제 구현) |
| Wish Platform / "Wish" 축 전체 |
| QR Purpose: Content, Domain: Wish |
| 웹툰/애니메이션/엽서/굿즈/전시 |
| 카카오톡 결과 전송 |
| 코드 정리(precheck_photo 중복, Identity Lock 수치 통일 80~90%↔85~95%, 캔버스 비율 통일 9:16↔1024x1536, SSOT-ROUTE-001 표기 불일치) |
| 기적쇼츠 "배우 소원이" 소재 확보 |

V1 오픈에 직접 필요하지 않은 신규 기능은 구현하지 않는다. 상세 목록은 `docs/ssot/DreamTown_V2_Backlog.md`에서 계속 관리한다.

---

## 10. Freeze 승인

```
Status: APPROVED
Version: 1.0
```

승인 이후:
- 신규 기능 아이디어는 이 문서에 직접 추가하지 않는다 → `docs/ssot/DreamTown_V2_Backlog.md`.
- V1 구조 변경이 필요한 예외는 ADR(Architecture Decision Record) 작성 후 승인한다(§11).
- V1 개발은 승인된 본 문서만을 기준으로 진행한다.

## 11. V1 구조 변경 절차 (ADR)

승인된 V1 구조(§3~§9)를 변경해야 하는 경우:
1. `docs/adr/ADR-{NNN}_{제목}.md`를 작성한다 — 변경 배경, 대안, 결정, 영향 범위 포함.
2. 대표 승인 후에만 본 문서(§해당 절)를 갱신한다.
3. ADR 없이 코드에서 임의로 구조를 바꾸지 않는다.

> 현재 ADR 폴더/문서는 존재하지 않는다 — 첫 예외 발생 시 생성한다.

---

## Original Source

본 문서는 커밋 `e85fad6`의 초안을 "DreamTown V1 Architecture Freeze — Review Instruction"의 6개 항목에 따라 개정한 것이다. §1(MVP 3분류), §2(Booking), §3(Product), §4(QR), §5(Identity)를 모두 확정하고 승인 상태로 전환했다.

## 관련 문서

- `SSOT-WISHART-001`, `SSOT-ROUTE-001`, `SSOT-BG-001`, `SSOT-PRODUCT-001`
- `SSOT-ARCH-001`(§6 데이터 모델은 본 문서의 §8로 갱신됨), `SSOT-WISHART-002`, `SSOT-IDENTITY-001`, `SSOT-UPLOAD-001`
- 신규 아이디어: `docs/ssot/DreamTown_V2_Backlog.md`
