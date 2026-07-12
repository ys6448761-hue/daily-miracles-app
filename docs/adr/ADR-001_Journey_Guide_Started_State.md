---
title: ADR-001 — Journey에 IN_PROGRESS 상태 및 route_started_at 추가
status: Proposed (구현됨, 승인 대기 — Freeze §11 절차에 따름)
date: 2026-07-13
related: DreamTown_V1_Architecture_Freeze.md §4/§8 (Journey 구조), SSOT-ARCH-001 §6
---

# ADR-001 — Journey Guide Started State

## 배경

"DreamTown Part 3 모바일 별빛항로 안내 화면" 구현 지시에서, 사용자가 안내 화면의 "별빛항로 시작하기" 버튼을 눌렀을 때 `journey_status = IN_PROGRESS`, `route_started_at = current_timestamp`를 저장해야 한다.

기존 `resident_journeys` 스키마(`DreamTown_V1_Architecture_Freeze.md` §8)는 `route_status`에 `STARTED`/`COMPLETED` 두 값만 사용했고, `STARTED`는 Journey **레코드 생성 시점**(Booking REDEEMED 시)에 이미 기록된다. "사용자가 실제로 안내 화면에서 버튼을 눌러 항로를 시작한 시점"을 구분해서 기록할 필드가 없었다.

## 결정

1. `resident_journeys.route_status`에 **`IN_PROGRESS`**를 새 허용값으로 추가한다(레코드 생성=`STARTED` → 버튼 클릭=`IN_PROGRESS` → 완료=`COMPLETED`). 이 컬럼은 SQL `CHECK` 제약이 없는 TEXT 컬럼이므로 DB 스키마 변경(ALTER TABLE)은 없다 — Python 레벨의 허용값 확장이다.
2. `resident_journeys`에 **`route_started_at`**(nullable TEXT) 컬럼을 신규 추가한다 — 기존 `started_at`(레코드 생성 시각)과 분리해, "실제 안내 화면에서 시작 버튼을 누른 시각"만 기록한다. 기존 `started_at`의 의미·값은 변경하지 않는다.

## 영향 범위

- 순수 추가(additive)다 — 기존 `STARTED`/`COMPLETED` 값과 기존 `started_at` 필드의 의미·데이터를 변경하지 않는다.
- 기존 Booking 상태 전이표(`BOOKING_TRANSITIONS`)는 변경하지 않는다.

## 상태

**Freeze §11 절차에 따라 ADR을 먼저 작성했으나, 실제 구현을 함께 진행했다.** 대표 승인 전이므로 `status: Proposed`로 표기한다. 승인되지 않을 경우 이 컬럼/값을 되돌리는 것은 데이터 손실 없이 가능하다(nullable 컬럼, 추가된 열거값이므로).
