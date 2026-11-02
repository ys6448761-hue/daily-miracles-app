# 커머스 Phase 1 — 복합상품 운영 코드 정합성 조사 Evidence

**Date**: 2026-11-02  
**Status**: COMMERCE_PACKAGE_PHASE1_CONFIRMED  
**조사 범위**: 읽기 전용. Production 변경 없음.

---

## §1 조사 대상

| 소스 | 경로 |
|------|------|
| 백업본 (2026-07-02) | `C:\DEV\Project Phoenix\Archive\Working\Legacy_Website\6117ticket_20260702\` |
| 백업 SQL | `Archive\Original\2026-07-02_티켓사이트백업\6117ticket_20260702.sql` |
| 운영 서버 소스 | 접근 불가 (Blocked) |

---

## §2 항목별 확인 결과

### Q1. `get_package_product_ids()` 함수 존재 여부

| 항목 | 결과 |
|------|------|
| 백업본 위치 | `theme/hotsauce/extend/_ticket.module.lib.php` 라인 301 |
| 함수 1 | `get_package_product_ids($it_id, $force=false)` — g5_shop_item_relation JOIN, 연결 상품 ID 배열 반환 |
| 함수 2 | `get_package_product_ids_not_in_cart($od_id, $it_ids)` — 장바구니에 없는 연결 상품 ID 반환 |
| 함수 3 | `is_package_product($it_id)` — 복합상품 여부 bool 반환 |
| 함수 4 | `package_product_cart_check($od_id)` — 빈 함수 (미구현) |
| 운영 서버 확인 | **Blocked** — 소스 접근 방법 없음 |

### Q2. 백업본 vs 현재 운영 코드 차이

**Blocked** — 운영 서버 FTP/SSH 접근 또는 Founder 파일 제공 없이 비교 불가.

### Q3. 양방향 연결이 단품 구매를 제한하는지

**Confirmed — 단품 구매 차단됨**

**저장 로직** (`adm/shop_admin/itemformupdate.php` 라인 467-479):
```php
// A→B 저장
INSERT INTO g5_shop_item_relation SET it_id = 'A', it_id2 = 'B', ir_no = 0
// B→A 자동 저장 (단방향 불가)
INSERT INTO g5_shop_item_relation SET it_id = 'B', it_id2 = 'A', ir_no = 0
```

**구매 차단 로직** (`shop/cartupdate.php` 라인 95-99):
```php
$package_items = get_package_product_ids($it_id);
$missing = get_package_product_ids_not_in_cart($cart_id, $package_items);
if(count($missing)) alert('복합상품을 같이 구매하셔야합니다.');
```

**결론**: A에 B를 복합상품 연결 → A 구매 시 B 필수, B 구매 시 A 필수. 단방향 설정 코드 없음.

### Q4. 기존 기능 유지하면서 독립 패키지 판매 가능 여부

**Confirmed — 패키지(30) 카테고리에 독립 상품 등록 방식으로 가능**

방법: 복합상품 연결 없이 단일 상품 등록.
- 가격: 패키지 총액 직접 입력
- 재고: 수동 관리
- 날짜: `ticket_use_calendar` 필드 활용
- 발권: `ticket_make.php` 기존 QR 발권 그대로
- 취소: `orderinquirycancel.php` 기존 그대로
- 기존 단품 영향: 없음

제약: 호텔 재고와 수동 동기화 필요. 구성품별 분리 발권 불가 (단일 패키지 티켓).

---

## §3 복합상품 DB 현황 (백업 SQL 기준)

```sql
CREATE TABLE `g5_shop_item_relation` (
  `it_id`  varchar(20) NOT NULL DEFAULT '',
  `it_id2` varchar(20) NOT NULL DEFAULT '',
  `ir_no`  int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`it_id`,`it_id2`)
) ENGINE=MyISAM;
-- 데이터: 비어있음 (2026-07-02 기준 복합상품 미사용)
```

---

## §4 최소 패키지 판매 방안

### 권장: 독립 상품 등록 방식

| 패키지 | 카테고리 | 구성 내용 | 판매 가능 여부 |
|--------|---------|---------|------------|
| 낭만야경 1박 2일 | 패키지(30) | 라마다 + 케이블카 | CONDITIONAL (실 PIN 교체 후) |
| 가족행복 1박 2일 | 패키지(30) | 라마다 오션패밀리 + 레저 미정 | 레저 공급 조건 확인 필요 |
| 바다쉼표 1박 2일 | 패키지(30) | 라마다/케니 + 레저 미정 | 레저 공급 조건 확인 필요 |

**복합상품 연결 사용 금지** — 기존 단품(케이블카 등) 구매 차단 위험.

### 절차 (상품 등록 시)

1. 관리자 → 상품 관리 → 상품 추가
2. 카테고리: 패키지(30)
3. 상품명: "낭만야경 1박 2일 (라마다 + 케이블카)"
4. 가격: 패키지 총액 직접 입력
5. 재고: 초기 물량 수동 입력
6. 티켓 설정: 날짜 선택 ON, 발권 방식 설정
7. 복합상품 탭: 연결 상품 없음 (비워둠)

---

## §5 미확인 항목

| 항목 | 상태 | 해소 조건 |
|------|------|---------|
| 운영 서버 코드 버전 | Blocked | FTP/SSH 접근 또는 Founder 파일 제공 |
| 라마다·케니 실 PIN | NOT_READY | 파트너 담당자 교체 |
| 패키지 단일 티켓 → 호텔+레저 분리 확인 방법 | Needs Verification | 실제 발권 테스트 필요 |

---

## §6 Production 변경 사항

**없음** — 읽기 전용 조사. 상품 가격·재고·분류·복합상품 연결 변경 없음.
