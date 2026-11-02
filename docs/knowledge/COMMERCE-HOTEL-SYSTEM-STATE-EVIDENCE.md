# 호텔 예약 시스템 현황 Evidence

**Date**: 2026-11-02  
**Status**: HOTEL_SYSTEM_STATE_CONFIRMED  
**Mode**: 읽기 전용. Production/코드 변경 없음.

---

## §1 Evidence 출처

| 소스 | 날짜 |
|------|------|
| Kenny E2E Checkpoint | `memory/project_kenny_e2e_checkpoint.md` (2026-09-17) |
| Ramada Second Vertical | `memory/project_step6b_ramada_vertical.md` (2026-09-17) |
| Production Migration Audit | `staging/storybook-c7a:docs/architecture/SOUL_PRODUCTION_MIGRATION_STATUS_PRE_AUDIT_V0_1.md` (2026-10-03) |
| Commerce Phase 1 Evidence | `docs/knowledge/COMMERCE-PACKAGE-PHASE1-EVIDENCE.md` (2026-11-02) |

---

## §2 Production DB 마이그레이션 상태 (2026-10-03 감사 기준)

| 마이그레이션 | 내용 | Production 상태 |
|------------|------|--------------|
| 208 | dt_flow_inventory/holds/bookings 스키마 | **APPLIED** |
| 209 | Kenny 파트너+객실 시드 | **APPLIED** |
| 210 | dt_sodam_decisions | **APPLIED** |
| 211 | dt_flow_confirmations + KENNY code | **APPLIED** |
| 212 | dt_flow_holds.sodam_decision_id | **APPLIED** |
| 213 | Ramada 파트너+객실 시드 | **APPLIED** |
| 214 | sowon_identity_map/bindings | **APPLIED** (58 rows live) |
| 207 | voyage_wishes.owner_sowon_id | NOT_APPLIED |

---

## §3 코드 위치 (staging/storybook-c7a — main 미병합)

| 파일 | 역할 |
|------|------|
| `services/flowInventoryService.js` | getAvailability / createHold / consumeHold / releaseHold |
| `services/sodamDecisionService.js` | 파트너별 객실 결정 (SODAM) |
| `services/sowonIdentityService.js` | SOWON_ID 생성·관리 |
| `services/partnerPinService.js` | 파트너 PIN 인증 |
| `services/hospitalityService.js` | 체크인/체크아웃 처리 |
| `routes/flowRoutes.js` | GET /availability / POST /hold / POST /book / DELETE /hold/:id |
| `routes/sodamRoutes.js` | POST /decide |
| `routes/flowConfirmRoutes.js` | 파트너 PIN으로 예약 확정 |
| `routes/flowAdminRoutes.js` | 날짜별 재고 등록 (admin) |

---

## §4 E2E 9체크 범위 (Kenny + Ramada, 2026-09-17)

```
QR bootstrap → SOWON_ID → SODAM decide → FLOW hold → FLOW booking → Confirm
```

포함: availability check, hold, booking, PIN auth, cross-partner isolation  
**미포함**: NicePay 결제 연결, 고객 UI

---

## §5 판매 차단 조건 (2026-11-02 기준)

| 항목 | 상태 | 해소 방법 |
|------|------|---------|
| staging → main 병합 | BLOCKED | PR 생성 + 검토 |
| 라마다 실 PIN | NOT_READY | Founder → 파트너 담당자 요청 |
| 날짜별 재고 등록 | MISSING | admin 작업 |
| NicePay ↔ FLOW 결제 연결 | MISSING | 신규 개발 |
| 고객 예약 UI | MISSING | 신규 개발 |

---

## §6 판매 경로 선택지

### 경로 A: 티켓사이트 독립 상품 방식 (추가 개발 없음)
- ticket.6117.co.kr 패키지(30) 카테고리에 신규 상품 등록
- 가격·재고·날짜·발권·취소: 기존 그대로
- 차단 조건: 라마다 실 PIN만 (Founder Action)

### 경로 B: FLOW 시스템 완성 후 판매 (추가 개발 필요)
- staging 병합 → Production 배포 → 결제 연결 → UI 개발
- 소요: NicePay ↔ FLOW 연결 + 예약 화면 개발
- 이점: 완성형 예약 시스템, 재고 자동화 가능
