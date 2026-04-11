# DreamTown_Mobile_Credential_System_P2_Snapshot_v1.md

> **문서 타입**: Snapshot (현재 상태 기록)
> **기준**: P2 완료 시점 — 2026-04-09
> **다음 업데이트**: P3 (UX + 수동 검증 + 정산)

---

## 📌 문서 목적

본 문서는 DreamTown 모바일 증명 시스템의 P2 단계 (핵심 플로우 구현) 완료 상태를 기록하고,
현재 범위와 다음 단계 작업을 명확히 정의한다.

---

## 🎯 시스템 정의

DreamTown 모바일 증명 시스템은 사용자가 모바일 QR/코드 기반으로 이용 자격을 제시하고,
제휴처는 이를 검증하여 서비스 제공 및 사용 완료 처리를 수행하는 **디지털 이용 증명 인프라**이다.

---

## 🧱 P2 구현 범위 (완료)

### 핵심 플로우

```
issue → ticket 조회 → verify → redeem → toast → 알림톡 → 로그
```

---

### 1. 이용권 발급

`POST /api/dt/credentials/issue`

- `phone` 파라미터 포함 가능
- 이용권 생성 및 QR payload 발급

---

### 2. 사용자 이용권 화면

`/ticket/:code`

- QR 이미지 표시
- 상태 표시: `ISSUED` / `ACTIVE` / `VERIFIED` / `REDEEMED` / `EXPIRED` / `CANCELLED`

---

### 3. 파트너 검증

`/partner/verify?token=xxx`

- QR token 기반 진입
- 버튼:
  - [QR 확인 완료] → `verify` API
  - [사용 완료 처리] → `redeem` API

> 현재는 **token 기반 검증**이며, 브라우저 카메라 QR 스캔은 다음 단계에서 추가한다.

---

### 4. 사용 완료 처리

`POST /api/dt/credentials/:code/redeem`

응답:

```json
{
  "ok": true,
  "status": "REDEEMED",
  "toast_message": "배움이 별로 남았어요"
}
```

---

### 5. 토스트 메시지

`GalaxyToast` 오버레이

- 2.5초 노출 후 자동 사라짐
- 은하군 기반 메시지 (각 5종, 랜덤 선택)
- 적용 위치: `MobileTicket`, `PartnerVerify`

---

### 6. 알림톡 발송

**발송 조건:**

- `user_phone` 존재
- 동일 `credential_id` 기준 중복 발송 이력(`sent`) 없음

**동작:**

- `sendBenefitRedeemedMessage()` 비동기 처리
- SENS 알림톡 발송
- `message_dispatch_logs` 상태 기록: `pending → sent / failed`

---

### 7. 로그 기록

| 테이블 | 내용 |
|--------|------|
| `credential_logs` | 상태 변경 이력 |
| `benefit_redemptions` | 현장 리뎀션 상세 |
| `message_dispatch_logs` | 알림톡 발송 결과 |
| `dt_events` | benefit_redeemed 이벤트 |

---

## 🔒 중복 방지 구조 (3중)

| 레이어 | 내용 |
|--------|------|
| 앱 레벨 | `status === 'REDEEMED'` → 400 즉시 반환 |
| DB 레벨 | `benefit_redemptions(credential_id) WHERE status='completed'` UNIQUE index |
| 발송 레벨 | `message_dispatch_logs` sent 선조회 → 중복이면 스킵 |

---

## 📊 현재 상태 정의

DreamTown 모바일 증명 시스템은 발급·조회·검증·사용 완료 및
REDEEMED 기반 토스트/알림톡 자동화를 포함한 **핵심 플로우 구현을 완료한 상태**이다.

---

## 🚧 다음 단계

### 1. 파트너 검증 UX 고도화

- 브라우저 카메라 QR 스캔 (`html5-qrcode`)
- token 수동 입력 방식 보완

---

### 2. 수동 검증 모드 추가 ⭐

QR 스캔이 어려운 환경 대응:

- 업체 PIN/비밀번호 인증
- 서명 입력
- 수동 redeem 처리

**사용 사례:**
- 낚시배
- 요트
- 야외 체험
- 네트워크 불안정 환경

---

### 3. 현장 테스트

- 실제 QR 사용 테스트
- 파트너 UX 검증
- `node scripts/test-credential-flow.js` 실서버 실행

---

### 4. 정산 시스템

- partner 기준 정산
- 수수료 구조
- `settlement` 배치

---

## 🌌 DreamTown 구조 연결

```
소원 → 별 → 성장 → 공명 → 나눔 → 연결
```

> 모바일 증명 시스템은 **"연결" 단계의 핵심 인프라**이다.
> 체험을 가능하게 하고, 그 순간이 은하의 기록으로 이어진다.

---

## 🔥 루미 한 줄 요약

> **이 시스템은 쿠폰이 아니라 "현장에서 경험을 가능하게 하는 증명 인프라"다.**
