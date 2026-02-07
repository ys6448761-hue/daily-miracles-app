# 🧾 AIL-정산-v2-final

**Aurora5 · 소원놀이터 수익배분/정산 최종 규칙**

> **Status:** BASELINE LOCKED
> **Version:** v2.0-final
> **Effective:** 2026-02-07
> **Owner:** 푸르미르 (CEO)

---

## 0. 목적

* 결제/환불/쿠폰/추천/리믹스가 섞여도
  **정산 합계가 항상 일치하는 자동 정산 시스템**을 보장한다.
* 분쟁 포인트(쿠폰 부담, 환불 후 회수, 리믹스 공정성)를 사전에 제거한다.

---

## 1. SSOT 정의

| 도메인 | 책임 |
|--------|------|
| **pay.dailymiracles.kr** | 결제, 환불, 차지백, PG 수수료 확정 / `SettlementEvent` 생성 (원장 이벤트) |
| **app.dailymiracles.kr** | 템플릿/크리에이터/리믹스/추천 관계 / 이벤트 수신 후 **배분 계산 + 지급 관리** |

---

## 2. 금액 정의 (불변)

| 항목 | 정의 |
|------|------|
| `Gross` | 정가(표시 가격) |
| `Coupon` | 할인액 (정책상 **플랫폼 부담**) |
| `Paid` | Gross − Coupon |
| `PG_Fee` | Paid × PG_RATE |
| `Net_Cash` | Paid − PG_Fee (👉 **실제 현금 유입**) |

---

## 3. 쿠폰 정책 (옵션 A – 고정)

* 쿠폰은 **플랫폼 비용**
* 크리에이터/성장/리스크 풀은 **쿠폰 영향을 받지 않음**
* 계산 기준 앵커:

```
Anchor = Gross − PG_Fee
```

---

## 4. 수익 배분 비율 (Anchor 기준)

| 구분 | 비율 |
|------|------|
| 플랫폼 | 55% |
| 크리에이터 풀 | 30% |
| 성장 풀 | 10% |
| 리스크/품질 풀 | 5% |

※ 플랫폼 실제 수령액 = `Net_Cash − (타 풀 합계)`

---

## 5. 크리에이터 풀 내부 분배

| 구분 | 비율 |
|------|------|
| 원저작자 | 70% |
| 리믹스 기여 | 20% (최대 **3단계**) |
| 큐레이션/검수 | 10% |

---

## 6. 성장 풀 분배

| 구분 | 비율 |
|------|------|
| 직접 추천자 | 7% |
| 캠페인/채널 운영 | 3% |

* 추천 미존재 시 → 성장 풀 적립

---

## 7. 환불 / 차지백 / 보류 규칙

| 항목 | 값 |
|------|-----|
| Hold 기간 | 14일 |
| 월 최대 차감 한도 | 10% |

**충당 순서:**
1. 미지급 정산액 상계
2. 리스크 풀 사용
3. 부족 시 차월 크리에이터 정산에서 제한 차감

* 역분개 필수 (원 이벤트 참조)

---

## 8. 지급 정책

| 항목 | 값 |
|------|-----|
| 최소 지급액 | ₩10,000 |
| 미달 시 | 이월 |

**지급 전 필수:**
- [ ] 계좌 등록
- [ ] 세금 서류 상태 정상

---

## 9. SettlementEvent v2 Schema (pay → app)

```typescript
interface SettlementEvent {
  event_id: string;          // idempotent key
  event_type: 'PAYMENT' | 'REFUND' | 'CHARGEBACK' | 'FEE_ADJUSTED';
  gross_amount: number;
  coupon_amount: number;
  paid_amount: number;
  pg_fee: number;
  net_cash: number;
  template_id: string;
  creator_root_id: string;
  remix_chain: string[];     // [creator1, creator2, creator3]
  referrer_id?: string;
  occurred_at: string;       // ISO 8601
  original_event_id?: string; // for reverse events
}
```

---

## 10. 계산 순서 (코드/테스트 기준)

```
1. Coupon 적용
2. PG 수수료 계산
3. Net_Cash 확정
4. Anchor 계산 (Gross - PG_Fee)
5. 풀별 배분
6. 플랫폼 잔여 계산
7. Hold 적용 (14일)
8. 지급/이월/차감 처리
```

---

## 11. Gate – 머지/배포 조건

- [ ] 정산 테스트 20케이스 통과 (쿠폰/추천/부분환불/차지백 포함)
- [ ] 모든 케이스에서 **원장 합계 = 배분 합계 = 지급 합계**
- [ ] idempotency 보장
- [ ] 상수(비율/Hold/최소지급) 코드 고정

---

## 12. 최종 선언

> **본 AIL이 존재하지 않는 정산 로직,
> 본 AIL을 위반한 변경은 머지/배포 불가.**

---

## 상수 요약 (코드 참조용)

```javascript
const SETTLEMENT_CONSTANTS = {
  // 배분 비율 (Anchor 기준)
  PLATFORM_RATE: 0.55,
  CREATOR_POOL_RATE: 0.30,
  GROWTH_POOL_RATE: 0.10,
  RISK_POOL_RATE: 0.05,

  // 크리에이터 풀 내부
  CREATOR_ORIGINAL_RATE: 0.70,
  CREATOR_REMIX_RATE: 0.20,
  CREATOR_CURATION_RATE: 0.10,
  REMIX_MAX_DEPTH: 3,

  // 성장 풀 내부
  GROWTH_REFERRER_RATE: 0.07,
  GROWTH_CAMPAIGN_RATE: 0.03,

  // 정책
  HOLD_DAYS: 14,
  MIN_PAYOUT: 10000,
  MAX_MONTHLY_DEDUCTION_RATE: 0.10,

  // PG (예시)
  PG_FEE_RATE: 0.033,  // 3.3%
};
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 결정자 |
|------|------|----------|--------|
| v2.0-final | 2026-02-07 | 초기 Baseline 확정 | 푸르미르 |

---

*다음 변경은 AIL-정산-v3로만 가능*
