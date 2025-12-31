"""
Business Ops Tools

비즈니스 운영을 위한 도구 정의
"""

from typing import Any

# 도구 정의
TOOLS = [
    # === 매출 관리 ===
    {
        "name": "get_revenue_realtime",
        "description": "실시간 매출 현황을 조회합니다 (오늘/이번 주/이번 달)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "time_range": {
                    "type": "string",
                    "enum": ["today", "week", "month", "custom"],
                    "description": "조회 기간 (기본: today)"
                },
                "start_date": {
                    "type": "string",
                    "description": "시작 날짜 (YYYY-MM-DD, custom일 때 필수)"
                },
                "end_date": {
                    "type": "string",
                    "description": "종료 날짜 (YYYY-MM-DD, custom일 때 필수)"
                },
                "group_by": {
                    "type": "string",
                    "enum": ["payment_method", "plan", "hour", "day"],
                    "description": "그룹화 기준"
                }
            }
        }
    },

    # === 결제 이상 감지 ===
    {
        "name": "detect_payment_anomaly",
        "description": "결제 이상 패턴을 감지합니다 (실패율 급증, 비정상 패턴)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "check_type": {
                    "type": "string",
                    "enum": ["failure_rate", "amount_spike", "frequency", "all"],
                    "description": "감지 유형 (기본: all)"
                },
                "threshold": {
                    "type": "number",
                    "description": "이상 기준치 (기본: 2.0 = 평균의 2배)"
                },
                "time_window_hours": {
                    "type": "number",
                    "description": "비교 시간 범위 (기본: 1시간)"
                }
            }
        }
    },

    # === 구독 건강도 ===
    {
        "name": "get_subscription_health",
        "description": "구독 건강도를 분석합니다 (이탈률, 갱신률, LTV)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "analysis_type": {
                    "type": "string",
                    "enum": ["summary", "cohort", "trend", "detailed"],
                    "description": "분석 유형 (기본: summary)"
                },
                "cohort_period": {
                    "type": "string",
                    "enum": ["week", "month", "quarter"],
                    "description": "코호트 기간 (cohort 분석 시)"
                },
                "include_predictions": {
                    "type": "boolean",
                    "description": "예측 포함 여부 (기본: false)"
                }
            }
        }
    },

    # === 자동 환불 ===
    {
        "name": "process_refund_auto",
        "description": "자동 환불 처리를 실행합니다 (7일 이내 결제)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "payment_id": {
                    "type": "string",
                    "description": "결제 ID"
                },
                "reason": {
                    "type": "string",
                    "enum": ["customer_request", "service_issue", "duplicate", "fraud", "other"],
                    "description": "환불 사유"
                },
                "partial_amount": {
                    "type": "number",
                    "description": "부분 환불 금액 (선택, 없으면 전액 환불)"
                },
                "notify_customer": {
                    "type": "boolean",
                    "description": "고객 알림 발송 여부 (기본: true)"
                }
            },
            "required": ["payment_id", "reason"]
        }
    }
]


def get_tool_prompt(name: str, arguments: dict[str, Any]) -> str:
    """도구 호출에 대한 프롬프트를 생성합니다."""

    prompts = {
        # === 실시간 매출 ===
        "get_revenue_realtime": lambda args: f"""
## 실시간 매출 현황 조회

### 조회 조건
- 기간: {args.get('time_range', 'today')}
- 시작일: {args.get('start_date', 'N/A')}
- 종료일: {args.get('end_date', 'N/A')}
- 그룹화: {args.get('group_by', '없음')}

### SQL 쿼리 실행

```sql
SELECT
  SUM(CASE WHEN DATE(paid_at) = CURRENT_DATE THEN amount ELSE 0 END) as today_revenue,
  SUM(CASE WHEN paid_at >= DATE_TRUNC('week', CURRENT_DATE) THEN amount ELSE 0 END) as week_revenue,
  SUM(CASE WHEN paid_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END) as month_revenue,
  COUNT(*) as transaction_count,
  AVG(amount) as avg_transaction
FROM payments
WHERE status = 'completed';
```

### 수익 구조 (Aurora 5 UBOS 기준)

| 단계 | 가격 | 전환율 목표 |
|------|------|-------------|
| 무료 체험 | 0원 | 100% (인입) |
| 기본 분석 | 5,000원 | 30% |
| 프리미엄 | 15,000원 | 10% |
| 소원항해 | 35,000원 | 5% |

**출력 형식:**
```json
{{
  "revenue": {{
    "today": 150000,
    "week": 850000,
    "month": 3200000
  }},
  "transactions": {{
    "count": 45,
    "average": 15000
  }},
  "by_plan": {{
    "basic": {{"count": 30, "revenue": 150000}},
    "premium": {{"count": 10, "revenue": 150000}},
    "voyage": {{"count": 5, "revenue": 175000}}
  }},
  "comparison": {{
    "vs_yesterday": "+15%",
    "vs_last_week": "+8%"
  }}
}}
```
""",

        # === 결제 이상 감지 ===
        "detect_payment_anomaly": lambda args: f"""
## 결제 이상 패턴 감지

### 감지 조건
- 유형: {args.get('check_type', 'all')}
- 기준치: {args.get('threshold', 2.0)}배
- 시간 범위: {args.get('time_window_hours', 1)}시간

### SQL 쿼리 실행

```sql
-- 최근 1시간 실패율
WITH recent AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    COUNT(*) as total
  FROM payments
  WHERE created_at > NOW() - INTERVAL '1 hour'
),
baseline AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'failed')::float / NULLIF(COUNT(*), 0) as avg_failure_rate
  FROM payments
  WHERE created_at > NOW() - INTERVAL '24 hours'
    AND created_at <= NOW() - INTERVAL '1 hour'
)
SELECT
  recent.failed::float / NULLIF(recent.total, 0) as current_failure_rate,
  baseline.avg_failure_rate,
  CASE
    WHEN recent.failed::float / NULLIF(recent.total, 0) > baseline.avg_failure_rate * 2
    THEN 'ALERT'
    ELSE 'NORMAL'
  END as status
FROM recent, baseline;
```

### 이상 감지 기준
1. **실패율 급증**: 평균 대비 {args.get('threshold', 2.0)}배 초과
2. **금액 스파이크**: 비정상적 고액/소액 결제
3. **빈도 이상**: 동일 카드/사용자 반복 결제

**출력 형식:**
```json
{{
  "status": "NORMAL|WARNING|ALERT",
  "anomalies": [
    {{
      "type": "failure_rate_spike",
      "severity": "high",
      "current_value": 0.15,
      "baseline": 0.03,
      "message": "결제 실패율 5배 증가 (3% → 15%)"
    }}
  ],
  "recent_failures": [
    {{
      "payment_id": "pay_xxx",
      "error_code": "card_declined",
      "time": "2026-01-01T10:30:00Z"
    }}
  ],
  "recommendations": [
    "PG사 상태 확인 필요",
    "특정 카드사 실패 집중 여부 확인"
  ]
}}
```
""",

        # === 구독 건강도 ===
        "get_subscription_health": lambda args: f"""
## 구독 건강도 분석

### 분석 조건
- 유형: {args.get('analysis_type', 'summary')}
- 코호트 기간: {args.get('cohort_period', 'month')}
- 예측 포함: {args.get('include_predictions', False)}

### SQL 쿼리 실행

```sql
-- 구독 건강도 요약
SELECT
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE status = 'expired') as expired,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'cancelled')::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as churn_rate,
  ROUND(
    COUNT(*) FILTER (WHERE renewed_at IS NOT NULL)::numeric /
    NULLIF(COUNT(*) FILTER (WHERE status = 'active'), 0) * 100, 2
  ) as renewal_rate
FROM subscriptions;

-- 평균 LTV 계산
SELECT
  AVG(total_paid) as avg_ltv,
  AVG(subscription_months) as avg_lifetime_months
FROM (
  SELECT
    user_id,
    SUM(amount) as total_paid,
    COUNT(DISTINCT DATE_TRUNC('month', paid_at)) as subscription_months
  FROM payments
  WHERE status = 'completed'
  GROUP BY user_id
) user_stats;
```

### 핵심 지표

| 지표 | 설명 | 목표 |
|------|------|------|
| 이탈률 (Churn Rate) | 취소/만료 비율 | 5% 미만 |
| 갱신률 (Renewal Rate) | 재결제 비율 | 80%+ |
| LTV (Lifetime Value) | 고객 생애 가치 | 50,000원+ |

**출력 형식:**
```json
{{
  "summary": {{
    "total": 500,
    "active": 450,
    "cancelled": 30,
    "expired": 20
  }},
  "rates": {{
    "churn_rate": "6%",
    "renewal_rate": "82%",
    "activation_rate": "90%"
  }},
  "ltv": {{
    "average": 45000,
    "median": 35000,
    "top_10_percent": 120000
  }},
  "trends": {{
    "churn_trend": "improving",
    "churn_change": "-2%",
    "ltv_trend": "stable"
  }},
  "at_risk": {{
    "count": 15,
    "total_revenue_at_risk": 225000
  }}
}}
```
""",

        # === 자동 환불 ===
        "process_refund_auto": lambda args: f"""
## 자동 환불 처리

### 환불 요청
- 결제 ID: {args.get('payment_id')}
- 환불 사유: {args.get('reason')}
- 부분 환불 금액: {args.get('partial_amount', '전액')}
- 고객 알림: {args.get('notify_customer', True)}

### 처리 절차

1. **결제 정보 조회**
```sql
SELECT
  id, user_id, amount, paid_at, payment_method, toss_payment_key
FROM payments
WHERE id = '{args.get('payment_id')}'
  AND status = 'completed'
  AND paid_at > NOW() - INTERVAL '7 days';
```

2. **환불 가능 여부 확인**
   - 7일 이내 결제만 자동 환불 가능
   - 이미 환불된 결제 체크
   - 부분 환불 가능 여부

3. **Toss API 호출**
```python
async def process_toss_refund(payment_key: str, amount: int, reason: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.tosspayments.com/v1/payments/{{payment_key}}/cancel",
            headers={{
                "Authorization": f"Basic {{base64_encode(TOSS_SECRET_KEY)}}"
            }},
            json={{
                "cancelReason": reason,
                "cancelAmount": amount
            }}
        )
        return response.json()
```

4. **DB 상태 업데이트**
```sql
UPDATE payments
SET
  status = 'refunded',
  refunded_at = NOW(),
  refund_reason = '{args.get('reason')}',
  refund_amount = {args.get('partial_amount') or 'amount'}
WHERE id = '{args.get('payment_id')}';
```

5. **고객 알림 발송** (선택)

### 환불 사유 코드

| 코드 | 설명 |
|------|------|
| customer_request | 고객 요청 |
| service_issue | 서비스 문제 |
| duplicate | 중복 결제 |
| fraud | 부정 결제 |
| other | 기타 |

**출력 형식:**
```json
{{
  "success": true,
  "refund": {{
    "payment_id": "pay_xxx",
    "original_amount": 15000,
    "refund_amount": 15000,
    "reason": "customer_request",
    "processed_at": "2026-01-01T10:30:00Z"
  }},
  "toss_response": {{
    "cancels": [
      {{
        "cancelAmount": 15000,
        "cancelReason": "고객 요청",
        "canceledAt": "2026-01-01T10:30:00Z"
      }}
    ]
  }},
  "notification": {{
    "sent": true,
    "channel": "kakao",
    "template": "refund_complete"
  }}
}}
```

### 주의사항
- 7일 초과 결제는 수동 처리 필요
- 부분 환불 시 남은 금액 관리
- 환불 완료 후 구독 상태 동기화
"""
    }

    if name not in prompts:
        raise ValueError(f"Unknown tool: {name}")

    return prompts[name](arguments)
