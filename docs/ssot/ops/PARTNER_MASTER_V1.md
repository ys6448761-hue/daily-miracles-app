---
code: PARTNER-MASTER-V1
title: DreamTown 제휴처 마스터 데이터 명세
version: v1.0
status: Template (데이터 미입력)
owner: Aurora5 / (주)여수여행센터
updated: 2026-06-08
layer: LAYER 2 — Operational SSOT
---

# PARTNER-MASTER-V1 — DreamTown 제휴처 마스터 데이터 명세

> **[DEC-OPS-001]** 제휴처 데이터의 원본은 이 문서(`partner_master.csv`)다.
> DB는 파생물이다. 탐색 시 DB 조회 전 이 파일을 먼저 확인한다.
> 상세 결정: `docs/archive/decisions/DEC-OPS-001_Partner_Master_SSOT.md`

> 이 문서는 Benefit Engine 운영을 위한 제휴처 데이터의 **단일 진실 소스**다.
> 업체 등록 전 이 명세를 먼저 완성하고, `partner_master_seed.sql`로 DB에 적재한다.
> AdminBenefitPage(`/admin/benefit`)의 입력 항목과 1:1 매핑된다.

---

## 0. AdminBenefitPage 입력 항목 ↔ 필드 매핑

| AdminBenefitPage 항목 | PARTNER_MASTER 필드 | 필수 여부 |
|-----------------------|---------------------|---------|
| 업체명 | `partner_name` | **필수** |
| 카테고리 | `category` | **필수** |
| 주소 | `address` | **필수** |
| 전화 | `phone` | 권장 |
| 위도 | `lat` | 권장 |
| 경도 | `lng` | 권장 |
| 업체 설명 | `description` | 선택 |
| 혜택 타입 | `benefit_type` | **필수** |
| 혜택명(관리용) | `benefit_title` | **필수** |
| 노출 문장(UX 카피) | `benefit_display_copy` | **필수** |
| 조건 상세 | `benefit_description` | 선택 |
| 위치 힌트 | `benefit_location_hint` | 권장 |
| 상품 연결 | `route_code` | **필수** |
| — (DB 직접) | `settlement_policy_type` | **필수** |
| — (DB 직접) | `commission_rate` OR `net_amount` | **필수** |

---

## 1. 필드 표준 정의

### 1-1. partner_code 네이밍 규칙

```
형식: YS-{CATEGORY}-{SEQ}
예시: YS-CF-001

YS     = 도시코드 (여수 = YS / 제주 = JJ / 부산 = BS)
CATEGORY:
  CF = 카페 (cafe)
  RS = 맛집·식당 (restaurant)
  NT = 야간·바 (night)
  AC = 액티비티·체험 (activity)
  TR = 교통·이동 (transport)
  HT = 숙소 (accommodation)
  ET = 기타 (etc)
SEQ  = 등록 순번 (001~999)
```

### 1-2. category 표준값

| 값 | 설명 | 예시 |
|----|------|------|
| `cafe` | 카페·음료 | 아메리카노 1잔 무료 |
| `restaurant` | 식당·맛집 | 반찬 추가 제공 |
| `night` | 야간·바·노래방·오락실 | 입장료 할인 |
| `activity` | 체험·관광 | 케이블카, 아쿠아플라넷 |
| `transport` | 교통 | 크루즈, 요트 |
| `accommodation` | 숙소·호텔 | 체크아웃 연장 |
| `etc` | 기타 | 기념품점, 풍선 |

### 1-3. benefit_type 표준값

| 값 | 설명 | 사용 예시 |
|----|------|----------|
| `free` | 무료 제공 | 아메리카노 1인 무료 |
| `discount` | 금액/비율 할인 | 노래방 20% 할인, 입장료 2,000원 할인 |
| `gift` | 증정 | 풍선 1개 증정, 서비스 음료 |
| `experience` | 체험 제공 | 체험 프로그램 포함 |
| `upgrade` | 서비스 업그레이드 | 룸 업그레이드, 조식 추가 |

### 1-4. route_code 표준값

| 값 | 노출 대상 | 적합 업체 |
|----|---------|---------|
| `weekday` | 주중 항로 (월~목, 일) | 일반 카페·맛집 |
| `starlit` | 별빛 항로 (금·토·공휴일) | 야경 명소·분위기 카페 |
| `family` | 패밀리 항로 (3~4인 가족) | 아이 동반 가능 업체 |
| `challenge` | 도전 항로 (액티비티 선호) | 체험·스포츠 업체 |
| `all` | 전 항로 공통 | 모든 손님 대상 혜택 |

> `all`은 DB에 존재하지 않는 가상 코드다. 실제 등록 시 4개 route_code 각각 product-benefit 연결을 생성한다.

### 1-5. settlement_policy_type 표준값

| 값 | 설명 | 적합 상황 |
|----|------|---------|
| `commission_rate` | 수수료율 방식 | 매출 연동 정산 (기본 20%) |
| `net_amount` | 고정 입금가 방식 | 단가 고정 협약 업체 |

---

## 2. 카테고리별 필수 입력값 정의 (Master Data Checklist)

### 2-1. 카페 (cafe)

| 필드 | 필수 | 비고 |
|------|------|------|
| partner_name | ✅ | 상호명 정확히 |
| address | ✅ | 도로명 주소 |
| phone | ✅ | 현장 확인 전화 |
| lat / lng | 권장 | 네이버지도 좌표 |
| benefit_type | ✅ | 보통 `free` 또는 `discount` |
| benefit_title | ✅ | "아메리카노 1잔 무료" |
| benefit_display_copy | ✅ | "잠깐 쉬어갈 수 있어요 ☕" |
| benefit_description | ✅ | "이용권 소지자 1인 한정, 1회" |
| benefit_location_hint | ✅ | "케이블카 하차장 도보 3분" |
| route_code | ✅ | 어느 항로 상품에 노출할지 |
| settlement_policy_type | ✅ | |
| commission_rate | 조건부 | policy=commission_rate 시 |
| net_amount | 조건부 | policy=net_amount 시 |

### 2-2. 숙소 (accommodation)

| 필드 | 필수 | 비고 |
|------|------|------|
| partner_name | ✅ | |
| address | ✅ | |
| phone | ✅ | 예약 전화 |
| description | ✅ | 객실 유형, 체크인 시간 |
| benefit_type | ✅ | 보통 `upgrade` 또는 `discount` |
| benefit_title | ✅ | "얼리 체크인 무료" |
| benefit_display_copy | ✅ | "별빛 여행의 쉼터가 되어드릴게요 🌙" |
| benefit_description | ✅ | 적용 조건 (객실 타입, 선착순 등) |
| route_code | ✅ | |
| settlement_policy_type | ✅ | |

### 2-3. 액티비티 (activity / transport)

| 필드 | 필수 | 비고 |
|------|------|------|
| partner_name | ✅ | |
| address | ✅ | 탑승/집결 장소 |
| phone | ✅ | 현장 예약 전화 |
| description | ✅ | 운행 시간, 소요 시간 |
| benefit_type | ✅ | 보통 `discount` 또는 `free` |
| benefit_title | ✅ | "케이블카 왕복 할인" |
| benefit_display_copy | ✅ | "바다 위를 날아볼까요 🚡" |
| benefit_description | ✅ | 적용 요금, 제외 항목 |
| benefit_location_hint | ✅ | 탑승구 위치 |
| route_code | ✅ | |
| settlement_policy_type | ✅ | |

### 2-4. 맛집·식당 (restaurant / night)

| 필드 | 필수 | 비고 |
|------|------|------|
| partner_name | ✅ | |
| address | ✅ | |
| phone | ✅ | |
| description | ✅ | 대표 메뉴, 영업 시간 |
| benefit_type | ✅ | `gift` (서비스 반찬 등) 또는 `discount` |
| benefit_title | ✅ | "서비스 반찬 제공" |
| benefit_display_copy | ✅ | "여수 밥상의 정성을 담았어요 🍽️" |
| benefit_description | ✅ | 적용 조건 (테이블당 1회 등) |
| route_code | ✅ | |
| settlement_policy_type | ✅ | |

---

## 3. 데이터 미입력 항목 (현재 공백)

아래 항목은 저장소에 데이터가 없다. 운영 개시 전 입력 필수.

| 카테고리 | 필요 업체 수 | 현재 등록 | 비고 |
|---------|------------|---------|------|
| 카페 | 미정 | 0 | 여수3합 패스 대상 |
| 맛집 | 미정 | 0 | 여수3합 패스 대상 |
| 야간 | 미정 | 0 | 달빛혜택 대상 (오락실·분식·노래방) |
| 액티비티 | 1 (케이블카) | 0 | 테스트 스크립트만 존재 |
| 숙소 | 2 (유탑·케니) | 0 | 테스트 스크립트만 존재 |

---

## 관련 파일

- `docs/ssot/ops/partner_master_template.csv` — 입력용 CSV 템플릿
- `docs/ssot/ops/partner_master_seed.sql` — DB 적재용 SQL
- `docs/ssot/ops/SSOT-PRICE-001.md` — 가격·정산 기준
- `routes/dtAdminBenefitRoutes.js` — 관리자 API
- `dreamtown-frontend/src/pages/AdminBenefitPage.jsx` — 관리 UI
- `database/migrations/086_benefit_engine.sql` — 테이블 스키마
- `database/migrations/083_settlement_dual_policy.sql` — 정산 정책 스키마
