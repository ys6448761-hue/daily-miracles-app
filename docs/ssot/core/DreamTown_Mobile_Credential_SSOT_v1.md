# DreamTown 모바일 증명 & 항로 확장 시스템 SSOT v1.0

> **정본 선언일**: 2026-04-09
> **P2 완료 확인일**: 2026-04-09
> **범위**: 모바일 이용권 발급 / QR 검증 / 사용 완료 / 메시지 트리거 / 항로 확장
> **위치**: `docs/ssot/core/DreamTown_Mobile_Credential_SSOT_v1.md`

---

## 결론 1줄

DreamTown 모바일 증명 시스템은 할인 쿠폰이 아니라,
**"소원이가 선택한 경험을 현장에서 자격으로 증명하고, 그 순간이 은하의 기록으로 이어지는 인프라"다.**

---

## 1. 시스템 정의

**DreamTown 모바일 레저 티켓/패스 시스템**은 제휴 레저·관광·체험·지역 혜택 상품에 대해,
사용자가 모바일 화면의 QR·코드·상태값을 업체에 제시하여 이용 자격을 증명하고,
제휴처는 이를 검증하여 서비스 제공 및 사용 완료 처리를 수행하며,
DreamTown은 사후 정산을 통해 파트너에게 대금을 지급하는 **글로벌 확장형 디지털 증명 인프라**이다.

---

## 2. 시스템 본질

| ❌ 아닌 것 | ✅ 맞는 것 |
|-----------|-----------|
| 할인 쿠폰 시스템 | **이용 증명 시스템 (Credential System)** |
| 포인트/적립 시스템 | 경험 자격 발급 시스템 |
| 단순 바코드 티켓 | 항로 연결형 디지털 증명 |

---

## 3. 핵심 구조

```
Benefit → Entitlement → Credential → Redemption → Settlement
혜택 정의   이용 자격 발생   디지털 증명 발급   현장 사용 완료   파트너 정산
```

---

## 4. 상태 흐름

```
ISSUED → ACTIVE → VERIFIED → REDEEMED → SETTLED
발급됨    활성화    현장 제시    사용 완료    정산 완료

예외:
ISSUED/ACTIVE → EXPIRED  (유효기간 초과)
ISSUED/ACTIVE → CANCELLED (취소)
```

### 상태별 정의

| 상태 | 의미 | 전환 트리거 |
|------|------|-----------|
| `ISSUED` | 발급됨, 아직 미활성 | 발급 즉시 |
| `ACTIVE` | 사용 가능한 상태 | 유효기간 시작 |
| `VERIFIED` | 파트너가 QR 확인함 | 파트너 스캔 |
| `REDEEMED` | 사용 완료 | 파트너 완료 처리 |
| `SETTLED` | 정산 완료 | 정산 배치 |
| `EXPIRED` | 유효기간 초과 | 자동 만료 |
| `CANCELLED` | 취소됨 | 환불/취소 처리 |

---

## 5. 이용권 종류 (benefit_type)

| 코드 | 상품명 | 액면가 | 항로 연결 |
|------|--------|--------|---------|
| `cablecar` | 해상케이블카 이용권 | ₩16,000 | 주중·별빛 |
| `cruise` | 유람선 이용권 | ₩13,000 | 주중 |
| `yacht` | 요트 이용권 | ₩35,000 | 주중 |
| `fireworks_cruise` | 불꽃유람선 이용권 | ₩35,000 | 별빛 |
| `fireworks_yacht` | 불꽃요트 이용권 | ₩55,000 | 별빛 |
| `aqua` | 아쿠아플라넷 이용권 | ₩32,000 | 패밀리 |
| `yeosu3pass` | 여수3합 패스 | ₩15,000 | 전 항로 |
| `moonlight` | 달빛혜택 쿠폰 | ₩6,000 | 소망 |

---

## 6. 은하군별 메시지 규칙

### 원칙
- REDEEMED 상태 전환 시 1회 트리거
- 은하군 기준 분기, 랜덤은 은하군 내부에서만 허용
- 1문장 / 2~3초 / 감정 중심

### 은하군 토스트 메시지

| 은하군 | galaxy_code | 토스트 (샘플) |
|--------|-------------|-------------|
| 북 (도전) | `challenge` | "도전을 증명했어요. 이 순간이 별이 됩니다 ✦" |
| 동 (성장) | `growth` | "경험이 쌓였어요. 성장의 별이 빛납니다 ✦" |
| 서 (관계) | `relation` | "함께한 시간이 기록됐어요 ✦" |
| 남 (치유) | `healing` | "치유가 시작됐어요. 이 순간을 기억하세요 ✦" |
| ⭐ 기적 | `miracle` | "기적을 선택했어요 ✦" |
| 기본값 | — | "이용이 완료됐어요 ✦" |

### 알림톡 규칙
- REDEEMED 시 1회 발송
- 은하 조건 기반 메시지
- 실패 시 SMS fallback

---

## 7. 기적항로 정의 (신규)

**기적항로(Miracle Route)**는 동서남북 은하군 어디에도 속하지 않는 자유형 항로로,
방향성·목표·성장 축에 얽매이지 않고 경험 자체를 선택하는 소원이를 위한 별도의 항로다.

### 항로 5종 구조

| 방향 | 은하군 | 코드 | 키워드 |
|------|--------|------|--------|
| 북 | 북은하 | `challenge` | 도전, 성취 |
| 동 | 동은하 | `growth` | 성장, 배움 |
| 서 | 서은하 | `relation` | 관계, 연결 |
| 남 | 남은하 | `healing` | 치유, 회복 |
| ⭐ 기적 | 기적항로 | `miracle` | 자유, 비정형, 우연 |

---

## 8. 데이터 구조

### benefit_credentials 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID PK | 내부 식별자 |
| `credential_code` | VARCHAR(20) UNIQUE | 사용자 노출 코드 (BNF-YYYYMMDD-XXXX) |
| `journey_id` | UUID | 발급 대상 journey_id |
| `benefit_type` | VARCHAR(50) | 이용권 종류 |
| `benefit_name` | VARCHAR(100) | 표시 이름 |
| `face_value` | INTEGER | 액면가 |
| `galaxy_code` | VARCHAR(20) | 연결 은하 |
| `qr_token` | VARCHAR(64) UNIQUE | QR 인코딩 토큰 |
| `status` | VARCHAR(20) | ISSUED/ACTIVE/VERIFIED/REDEEMED/EXPIRED/CANCELLED |
| `valid_until` | TIMESTAMPTZ | 유효기간 |
| `partner_code` | VARCHAR(50) | 제휴처 코드 |
| `verified_at` | TIMESTAMPTZ | 검증 시각 |
| `redeemed_at` | TIMESTAMPTZ | 사용 완료 시각 |
| `settlement_status` | VARCHAR(20) | PENDING/SETTLED |
| `issued_from` | VARCHAR(50) | 발급 원천 |
| `source_id` | VARCHAR(100) | 원천 ID |

### credential_logs 테이블

| 컬럼 | 설명 |
|------|------|
| `credential_id` | 이용권 FK |
| `action` | issued/verified/redeemed/expired/cancelled |
| `actor` | 수행자 |
| `note` | 부가 정보 |

---

## 9. API 구조

| 메서드 | 경로 | 역할 | 호출자 |
|--------|------|------|--------|
| POST | `/api/dt/credentials/issue` | 이용권 발급 | 서버/관리자 |
| GET | `/api/dt/credentials/my` | 내 이용권 목록 | 사용자 |
| GET | `/api/dt/credentials/:code` | 이용권 조회 + QR | 사용자 |
| GET | `/api/dt/credentials/scan/:qr_token` | QR 스캔 검증 | 파트너 |
| POST | `/api/dt/credentials/:code/verify` | VERIFIED 처리 | 파트너 |
| POST | `/api/dt/credentials/:code/redeem` | REDEEMED 처리 | 파트너 |

> **현재 파트너 검증은 token 기반 진입 방식이며, 브라우저 카메라 QR 스캔 연동은 다음 단계 범위로 둔다.**

---

## 10. 이벤트 추적

| 이벤트 | 발생 시점 |
|--------|---------|
| `benefit_issued` | 이용권 발급 완료 |
| `benefit_verified` | 파트너 QR 확인 |
| `benefit_redeemed` | 사용 완료 (메시지 트리거) |
| `benefit_expired` | 만료 처리 |

---

## 11. 개발 우선순위

1️⃣ 모바일 증명 시스템 핵심 플로우 — **P2 완료** ✅
2️⃣ 파트너 검증 UI 고도화 (브라우저 카메라 QR 스캔)
3️⃣ 수동 검증 모드 (업체 PIN/비밀번호 + 서명 기반 사용 완료 처리)
4️⃣ 현장 테스트
5️⃣ 정산 시스템 연결
6️⃣ 고급 예약 + 파트너 관리

---

## 12. 확장 금지 항목

- 사용자에게 "쿠폰", "할인" 표현 직접 노출 금지
- 중복 사용 허용 금지 (REDEEMED → 재사용 불가)
- 파트너 코드 없는 redeem 처리 금지

---

## 13. 알림톡 발송 조건 (P2 기준)

알림톡은 아래 조건이 모두 충족될 때만 비동기 발송한다.

1. `user_phone` 존재
2. 동일 `credential_id` + `event_name: benefit_redeemed` 기준 `sent` 이력 없음 (중복 방지)

발송 흐름:
```
sendBenefitRedeemedMessage() → SENS 알림톡
→ message_dispatch_logs: pending → sent / failed
```

---

## 14. 최종 고정 문장

> **DreamTown 모바일 증명 시스템은 여행을 기록하는 앱이 아니라,
> 소원이가 선택한 경험을 현장에서 증명하고,
> 그 순간이 은하의 별로 이어지는 디지털 자격 인프라다.**

---

## 15. P2 완료 상태 선언

본 문서는 모바일 증명 시스템의 핵심 플로우(P2) 구현 완료 상태를 기록한 것이며,
현장 UX 고도화(카메라 스캔)와 수동 검증 모드는 후속 단계로 분리한다.
