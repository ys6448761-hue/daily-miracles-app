---
code: DEC-OPS-001
title: Partner Master Single Source of Truth
date: 2026-06-08
status: Confirmed
owner: Aurora5 / (주)여수여행센터
layer: LAYER 3 — Decision Archive
---

# DEC-OPS-001 — Partner Master Single Source of Truth

## 결정

모든 제휴처 데이터의 원본은 **PARTNER_MASTER** 다.
DB는 PARTNER_MASTER에서 파생된 결과물이다.

## 우선순위

```
PARTNER_MASTER (원본)
      ↓
  Seed SQL
      ↓
  Migration
      ↓
    DB (결과물)
```

## 금지

- DB를 조회해서 운영 원본으로 사용하지 않는다.
- "DB에 있으니 등록됐다"고 판단하지 않는다.
- PARTNER_MASTER에 없는 업체는 미등록으로 간주한다.

## 이유

DB는 세션 간 상태를 보존하지만, 탐색 시점에 따라
"이미 등록되어 있는데 없는 것으로 판단"하거나
"없는데 있다고 판단"하는 오류가 발생했다.

PARTNER_MASTER가 항상 최신 확정 상태를 기록하므로
다음 세션의 에이전트는 DB 조회 없이 PARTNER_MASTER만 읽으면 된다.

## 적용 범위

| 대상 | 원본 | 파생 |
|------|------|------|
| 제휴 업체 목록 | PARTNER_MASTER | DB dt_partners |
| 혜택 정의 | PARTNER_MASTER | DB dt_benefits |
| 상품 연결 | PARTNER_MASTER | DB dt_product_benefits |
| 정산 정책 | SSOT-PRICE-001 | DB benefit_settlement_configs |

## 원본 파일 위치

- `docs/ssot/ops/partner_master.csv` — 확정 데이터 원본
- `docs/ssot/ops/PARTNER_MASTER_V1.md` — 필드 명세
- `docs/ssot/ops/partner_master_seed.sql` — DB 적재용 파생물

## 운영 규칙

1. 업체 추가 → PARTNER_MASTER 먼저 수정, 이후 seed 적재
2. 업체 수정 → PARTNER_MASTER 수정 후 DB UPDATE
3. 업체 삭제 → PARTNER_MASTER에서 status=inactive, DB는 is_active=false
4. 탐색 시 → DB 조회 전 PARTNER_MASTER 기준으로 현황 판단
