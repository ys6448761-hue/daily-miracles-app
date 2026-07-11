---
title: DreamTown V1 Architecture Freeze
status: FROZEN (V1)
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-11
layer: LAYER 1 — Constitution급 (V1 오픈 최종 설계 기준)
supersedes_process: 이 문서 확정 이후 새로운 아이디어는 V1 설계에 즉시 반영하지 않고 `V2_Backlog.md`로 관리한다.
---

# DreamTown V1 Architecture Freeze

> **이 문서는 오픈 버전(V1)의 최종 설계 기준이다.**
> V1 개발은 본 문서를 기준으로 진행한다. 이후 새로운 아이디어는 V2 Backlog로 관리한다.
> "더 이상 기능을 만들지 말고 구조를 먼저 고정한다" — 아이디어 발전 단계는 끝났고, 지금부터는 오픈을 위한 구현 단계다.

---

## 1. Vision

> DreamTown은 관광상품이 아니다. **감정여행 플랫폼**이다.

기존 SSOT(`SSOT-BG-001`, `SSOT-PRODUCT-001`)의 철학과 일치한다 — "장소는 감정을 담는 또 하나의 캐릭터", "Character는 사람이다. Location은 감정이다. Background는 Story를 기억한다."

---

## 2. Platform

```
Project Phoenix
  ↓
Wish Platform
  ↓
DreamTown / WishArt / Wish
```

- **Project Phoenix**: 최상위 사업 단위(daily-miracles-mvp 전체를 아우르는 명칭으로 이번 세션 내내 사용됨).
- **Wish Platform**: 이번 문서에서 처음 등장하는 중간 계층. 하위 문서(SSOT-ARCH-001 등)에는 대응하는 명칭이 없다 — **구조만 확정하며, "Wish Platform"이 구체적으로 무엇을 관장하는 계층인지(조직/시스템/브랜드 중 어느 것인지)는 세부 정의가 없다.**
- **DreamTown / WishArt / Wish**: 세 개의 하위 축.
  - DreamTown = 별빛항로 기반 서비스(`SSOT-PRODUCT-001`)
  - WishArt = 이미지 생성 엔진 + 서비스군(`SSOT-ARCH-001`, `SSOT-WISHART-002`)
  - **Wish**: 이번 문서에서 처음 별도 축으로 명시됨. daily-miracles-mvp의 기존 `wish_entries`/`wish_tracking_requests` 테이블(CLAUDE.md에 명시된 핵심 테이블) 및 온라인 프로그램(`PRG_WISH_30` 등, `DreamTown_Product_Structure_SSOT.md`)과 개념적으로 연결될 가능성이 있으나, **이번 문서에서 명시적으로 연결하지 않았다 — 확인 필요.**

---

## 3. Service

```
DreamTown
  ↓
Basic / Hotel / Premium / Option
```

이 4단계 서비스 티어는 이번 문서에서 새로 도입되었다. 기존 가격 SSOT(`SSOT-PRICE-001`, `DreamTown_Product_Structure_SSOT.md`)에는 이 정확한 명칭(Basic/Hotel/Premium/Option)으로 된 4단계 구분이 없다 — 가장 가까운 기존 개념은 `YW_BASIC_7`/`YW_PREMIUM_30`(온라인), 별빛항로 FIT/단체 등급, 소원항해단 Basic/Online/Experience다.

**구조만 확정. 각 티어의 정확한 가격·포함 범위·`Basic`과 `Hotel`의 관계(별개 티어인지, `Hotel`이 숙박 결합 옵션인지)는 정의되지 않았다 — V2 Backlog 또는 별도 확인 필요.**

---

## 4. Booking

```
채널
  ↓
Booking
  ↓
Entitlement
  ↓
Journey
  ↓
Identity
```

모든 예약을 **Booking**으로 통합한다는 원칙.

| 단계 | 기존 코드/SSOT 대응 | 상태 |
|---|---|---|
| 채널 | 파트너/QR 경로(`partner_code`, `origin_hotel_id`) | 부분 존재 |
| **Booking** | 대응하는 테이블/개념 없음 | **완전 신규 — 통합 예약 레이어는 설계·구현 전무** |
| Entitlement | 기존 이용권(`credential_code`, `dm_client.check_credential`, `entry_type`, `redeem_policy`) | **이미 부분 구현됨**(daily-miracles-mvp ↔ dreamtown-wishart 연동) |
| Journey | `resident_journeys`(`SSOT-ARCH-001` §6) | 설계 완료, 구현 전 |
| Identity | `residents`(`SSOT-ARCH-001` §6) | 설계 완료, 구현 전 |

**"Booking"이 이 체인의 새 허브로 도입되었으나, 이를 뒷받침하는 스키마·라우트는 없다.** Entitlement/Journey/Identity는 이미 각자 설계·부분구현되어 있어 그대로 연결 가능하지만, "채널→Booking" 구간은 V1에서 새로 만들어야 하는지, 아니면 각 서비스가 지금처럼 개별적으로 Entitlement를 검증하는 방식으로 V1을 열고 Booking 통합은 이후로 미룰지는 **MVP 결정(§10) 대상이다.**

---

## 5. QR

QR은 세 종류다: **Wish / WishArt / DreamTown**

**현재 실제 코드의 QR 상태** (이전 오픈 준비 점검 + 이번 세션 수정 기준):
- `/qr/partner/{partner}` → `/partner-workshop` (WishArt Quick/PhotoZone 진입) — 이것이 "WishArt" QR에 해당하는 것으로 보인다.
- `/qr/place/{place}` → `/origin-checkin` → (수정 후) `/partner-workshop` 연결 — 이것이 "DreamTown"(별빛항로 체크인) QR에 해당하는 것으로 보인다.
- **"Wish" QR**: 대응하는 기존 라우트를 찾지 못했다 — §2 Platform의 "Wish" 축과 마찬가지로 신규이거나, 기존 `wish_entries` 관련 플로우(daily-miracles-mvp 쪽)와 연결될 가능성이 있으나 확인되지 않았다.

**구조(3종)는 확정하되, 3종과 기존 2개 라우트(partner/place)의 정확한 매핑은 이번 문서에서 확정되지 않았다 — 확인 필요.**

---

## 6. Identity

```
호텔
  ↓
별들의 가족 되기
  ↓
Identity
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

`SSOT-IDENTITY-001`의 흐름(정면사진→소원그림/주민카드)을 감싸는 더 큰 여정으로 확장되었다.

| 단계 | 대응 |
|---|---|
| 호텔 | `origin_hotel_id`(`residents` 테이블) |
| **별들의 가족 되기** | 신규 — 등록/동의(`consent_version`) 시점을 가리키는 것으로 추정되나 명시적 정의 없음 |
| Identity | `residents` 등록(`SSOT-ARCH-001`) |
| WishArt | 소원그림 생성(`SSOT-IDENTITY-001` §2) |
| Resident Card | 주민카드(`SSOT-IDENTITY-001` §3) |
| Atelier | `atelier_records`(별공방) |
| **Promise** | `atelier_records.promise_text` 컬럼과 직접 대응 — 이미 데이터 모델에 자리가 있다(`SSOT-ARCH-001` §6에서 이번 지시서 원문의 필드를 그대로 채택함) |
| Reunion | `atelier_records.reunion_status` — 트리거/동작은 여전히 미정(`SSOT-IDENTITY-001` §5) |

**"별들의 가족 되기"만 유일하게 기존 데이터 모델에 대응 컬럼이 없다** — 별도의 상태값(예: `resident_status`의 한 단계)인지, 별도 이벤트인지 확인 필요.

---

## 7. WishArt

```
하나의 엔진
  ↓
DreamTown / PhotoZone / Festival
```

`SSOT-ARCH-001`/`SSOT-WISHART-002`와 동일한 원칙 — 이미 확정됨. 단, 이전 설계에서 언급했던 `HOTEL_LOBBY` 서비스 모드가 이번 3분류에는 없다 — `Hotel`이 §3의 Service 티어로 흡수된 것인지, 별도 서비스로 남는지 확인 필요.

---

## 8. Product

```
Basic / Hotel / Premium / Option
```

§3(Service)과 동일한 4단계 — 중복 확정이므로 §3을 그대로 참조한다. 별도 내용 추가 없음.

---

## 9. Data

```
Booking / Journey / Identity / Resident / Assets / Atelier
```

| 개념 | 기존 대응 |
|---|---|
| Booking | 신규(§4 참조, 미구현) |
| Journey | `resident_journeys` |
| **Identity** | `residents`? — §6에서는 "Identity"가 별도 단계로 나오고 "Resident Card"도 별도로 나온다. 이번 절에서도 **"Identity"와 "Resident"가 별개 데이터 개념으로 나열**되어 있어, 기존 설계(`SSOT-ARCH-001`)의 `residents` 테이블 하나로 충분한지, 아니면 Identity(정체성/사진 원본)와 Resident(등록 정보)를 별도 테이블로 분리해야 하는지 **확인이 필요하다 — 임의로 병합하지 않았다.** |
| Resident | 위와 동일 이슈 |
| Assets | `resident_assets` |
| Atelier | `atelier_records` |

---

## 10. MVP — 오픈 범위 제안 (Claude Code 제안, 확정 아님 — 대표 검토 필요)

이전 오픈 준비 점검(완료/진행중/미구현 조사)과 이번까지의 설계를 근거로 제안한다.

### 포함(V1 오픈에 만든다)

| 항목 | 근거 |
|---|---|
| WishArt Quick(PhotoZone) | 이미 동작, 이번 세션에서 하드닝 완료(사진 필수화, 다운로드) |
| 장소 QR → 워크숍 연결 | 이번 세션에서 버그 수정 완료(8개 장소 전부 검증됨) |
| WishArt Core Engine 추출(`generate_wishart`) | 다른 모든 서비스의 전제조건(`TODO-DreamTown_Route_Service.md` P0) |
| DreamTown Route: 스타터카드+정면사진 업로드 → Identity 등록 → 소원그림 생성 → 결과화면 | 오픈에 필요한 핵심 신규 기능(`TODO-DreamTown_Route_Service.md` P1~P2) |
| 디지털 주민카드(2D 프로필 + 고정 템플릿 합성) | 주민등록의 실물 증표로서 오픈에 필요 |
| Entitlement(기존 이용권 체계) | 이미 부분 구현되어 있어 재사용만 하면 됨 — Booking 통합 없이도 개별 서비스가 지금처럼 Entitlement를 검증하는 방식으로 오픈 가능 |

### 보류 (V2 Backlog로 이동, 오픈 후 진행)

| 항목 | 사유 |
|---|---|
| Booking 통합 레이어(채널→Booking) | 대응 코드/스키마 전무, 설계량이 크다. 각 서비스 개별 Entitlement 검증으로 V1은 충분 |
| 별공방 실제 등록 로직 | 스펙 없음(`SSOT-IDENTITY-001` §5) |
| 재회(Reunion) 시스템 | 스펙 없음, `reunion_status` 컬럼만 존재 |
| Promise 단계의 실제 UI/흐름 | `promise_text` 필드는 있으나 사용자 흐름 미정 |
| Festival/Event, Hotel Lobby 서비스 | 향후 서비스, 이번 문서에서도 세부 미정 |
| QR 3종 체계 정식 도입("Wish" QR 포함) | 현재 2종(파트너/장소)으로 오픈 가능, 3종 재편은 오픈 후 |
| Service 4단계(Basic/Hotel/Premium/Option) 요금·기능 세부 확정 | 기존 가격 SSOT와의 정합성 검토 필요, 시간 부족 시 V1은 단일 티어로 열고 세분화는 이후 진행 고려 |
| "별들의 가족 되기" 단계의 정확한 정의 | 데이터 모델 대응 없음 |
| "Wish Platform"/"Wish" 축의 정확한 역할 | 이번 문서에서도 구조만 있고 세부 없음 |

---

## Original Source

본 문서는 대표가 제공한 10개 섹션 구조를 그대로 채택했다. 각 섹션에서 기존 SSOT와 명확히 연결되는 부분은 인용했고, 새로 등장했으나 세부 정의가 없는 개념(Wish Platform, Booking, 별들의 가족 되기, Service 4단계 등)은 추측으로 채우지 않고 "확인 필요"로 표시했다. §10 MVP는 Claude Code의 제안이며 대표 확정 전까지 구속력이 없다.

## 관련 문서 (V1 하위 설계, 변경 없음)

- `SSOT-WISHART-001_WishArt_V4_Core_Guide.md`
- `SSOT-ROUTE-001_EP01_Wish_Journey.md`, `SSOT-BG-001_Starlight_Route_Background_Guide.md`
- `SSOT-PRODUCT-001_DreamTown_Product_Architecture.md`
- `SSOT-ARCH-001_WishArt_Platform.md`, `SSOT-WISHART-002_WishArt_Service_Modes.md`
- `SSOT-IDENTITY-001_DreamTown_Resident_Identity.md`, `SSOT-UPLOAD-001_WishArt_Operating_Modes.md`
- 신규 이후 아이디어는 `docs/ssot/DreamTown_V2_Backlog.md`로 관리한다.
