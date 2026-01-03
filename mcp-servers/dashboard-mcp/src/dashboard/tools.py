"""
Dashboard Tools

Aurora 5 통합 대시보드를 위한 도구 정의
"""

from typing import Any

# 도구 정의
TOOLS = [
    # === 전체 현황 ===
    {
        "name": "get_overview",
        "description": "전체 현황을 한눈에 조회합니다 (모든 지표 통합)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "include_details": {
                    "type": "boolean",
                    "description": "상세 정보 포함 (기본: true)"
                }
            }
        }
    },

    # === 통합 알림 ===
    {
        "name": "get_all_alerts",
        "description": "모든 알림을 통합 조회합니다 (긴급도 순)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "severity": {
                    "type": "string",
                    "enum": ["all", "critical", "warning", "info"],
                    "description": "심각도 필터 (기본: all)"
                },
                "limit": {
                    "type": "number",
                    "description": "최대 개수 (기본: 10)"
                }
            }
        }
    },

    # === 종합 인사이트 ===
    {
        "name": "get_insights",
        "description": "종합 인사이트 및 추천 액션을 생성합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "focus_area": {
                    "type": "string",
                    "enum": ["all", "revenue", "users", "operations", "tech"],
                    "description": "분석 영역 (기본: all)"
                }
            }
        }
    },

    # === CEO 모닝 브리핑 ===
    {
        "name": "get_morning_briefing",
        "description": "CEO 모닝 브리핑을 생성합니다 (매일 아침 요약)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "include_yesterday": {
                    "type": "boolean",
                    "description": "어제 성과 포함 (기본: true)"
                }
            }
        }
    },

    # === 실시간 모니터 ===
    {
        "name": "get_realtime_status",
        "description": "실시간 시스템 상태를 조회합니다",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]


def get_tool_prompt(name: str, arguments: dict[str, Any]) -> str:
    """도구 호출에 대한 프롬프트를 생성합니다."""

    prompts = {
        # === 전체 현황 ===
        "get_overview": lambda args: f"""
## Aurora 5 UBOS 전체 현황

### 조회 조건
- 상세 정보: {args.get('include_details', True)}

### 통합 현황판

#### 1. 소원이 현황
```sql
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE status = 'active') as active_users,
  COUNT(*) FILTER (WHERE traffic_light = 'RED') as red_count,
  COUNT(*) FILTER (WHERE traffic_light = 'YELLOW') as yellow_count,
  COUNT(*) FILTER (WHERE traffic_light = 'GREEN') as green_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_new
FROM users;
```

#### 2. 매출 현황
```sql
SELECT
  SUM(CASE WHEN DATE(paid_at) = CURRENT_DATE THEN amount ELSE 0 END) as today_revenue,
  SUM(CASE WHEN paid_at >= DATE_TRUNC('week', CURRENT_DATE) THEN amount ELSE 0 END) as week_revenue,
  SUM(CASE WHEN paid_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END) as month_revenue
FROM payments
WHERE status = 'completed';
```

#### 3. 메시지 발송 현황
```sql
SELECT
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(COUNT(*) FILTER (WHERE status = 'delivered')::numeric / COUNT(*) * 100, 1) as success_rate
FROM outbound_messages
WHERE created_at >= CURRENT_DATE;
```

#### 4. 체크리스트 진행
```sql
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE completed) as completed,
  COUNT(*) FILTER (WHERE priority = 'P0' AND NOT completed) as p0_pending
FROM ceo_checklist
WHERE DATE(created_at) = CURRENT_DATE;
```

### Aurora 5 팀 상태

| 역할 | 담당자 | 오늘 상태 |
|------|--------|-----------|
| CEO | 푸르미르 | 체크리스트 확인 중 |
| COO | 코미 | 운영 모니터링 |
| CRO | 재미 | 소원이 응대 |
| Analyst | 루미 | 데이터 분석 |
| QA | 여의보주 | 품질 검수 |
| Tech | Code | 시스템 관리 |

**출력 형식:**
```json
{{
  "timestamp": "2026-01-01T10:00:00Z",
  "overall_status": "healthy|warning|critical",
  "users": {{
    "total": 150,
    "active": 120,
    "today_new": 5,
    "traffic_light": {{
      "GREEN": 110,
      "YELLOW": 8,
      "RED": 2
    }}
  }},
  "revenue": {{
    "today": 75000,
    "week": 450000,
    "month": 1800000,
    "vs_yesterday": "+15%",
    "vs_last_week": "+8%"
  }},
  "messages": {{
    "today_sent": 45,
    "success_rate": "97.8%",
    "failed": 1
  }},
  "checklist": {{
    "total": 8,
    "completed": 5,
    "p0_pending": 0,
    "completion_rate": "62.5%"
  }},
  "system": {{
    "api_status": "healthy",
    "db_status": "healthy",
    "last_error": null
  }},
  "quick_actions": [
    {{
      "priority": "P1",
      "action": "YELLOW 소원이 8명 케어 필요",
      "link": "wishmaker-hub-mcp"
    }}
  ]
}}
```
""",

        # === 통합 알림 ===
        "get_all_alerts": lambda args: f"""
## 통합 알림 조회

### 조회 조건
- 심각도: {args.get('severity', 'all')}
- 최대 개수: {args.get('limit', 10)}

### 알림 소스

| 소스 | 유형 | 담당 |
|------|------|------|
| 소원이 관리 | RED 신호등, 이탈 위험 | 재미 |
| 비즈니스 | 결제 실패, 매출 이상 | 코미 |
| 인프라 | 서버 에러, DB 문제 | Code |
| 체크리스트 | P0 미완료 | 푸르미르 |

### 알림 수집 쿼리

```sql
-- 소원이 알림
SELECT 'user' as source, 'critical' as severity,
  CONCAT('RED 소원이: ', name, ' - 긴급 대응 필요') as message
FROM users WHERE traffic_light = 'RED' AND status = 'active'

UNION ALL

-- 결제 알림
SELECT 'payment' as source, 'warning' as severity,
  CONCAT('결제 실패율 급증: ', failure_rate, '%') as message
FROM payment_stats WHERE failure_rate > 5

UNION ALL

-- 시스템 알림
SELECT 'system' as source, severity, message
FROM error_logs WHERE occurred_at >= NOW() - INTERVAL '1 hour'

ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 3
  END
LIMIT {args.get('limit', 10)};
```

**출력 형식:**
```json
{{
  "timestamp": "2026-01-01T10:00:00Z",
  "total_alerts": 5,
  "by_severity": {{
    "critical": 1,
    "warning": 3,
    "info": 1
  }},
  "alerts": [
    {{
      "id": "alert_001",
      "severity": "critical",
      "source": "user",
      "title": "RED 소원이 긴급 대응 필요",
      "message": "김소원님 - 3일 연속 무응답, 부정적 메시지 감지",
      "created_at": "2026-01-01T09:30:00Z",
      "action": {{
        "type": "contact",
        "assignee": "재미",
        "deadline": "2026-01-01T12:00:00Z"
      }}
    }},
    {{
      "id": "alert_002",
      "severity": "warning",
      "source": "payment",
      "title": "결제 실패율 상승",
      "message": "최근 1시간 결제 실패율 8% (평균 2%)",
      "created_at": "2026-01-01T09:45:00Z",
      "action": {{
        "type": "investigate",
        "assignee": "코미",
        "tool": "business-ops-mcp"
      }}
    }}
  ],
  "unresolved_count": 3,
  "oldest_unresolved": "2025-12-31T15:00:00Z"
}}
```
""",

        # === 종합 인사이트 ===
        "get_insights": lambda args: f"""
## 종합 인사이트

### 분석 영역
- 포커스: {args.get('focus_area', 'all')}

### 인사이트 생성 기준

#### 1. 매출 인사이트
- 일별/주별/월별 추이 분석
- 전환율 변화 감지
- 결제 수단별 성과

#### 2. 사용자 인사이트
- 신호등 분포 변화
- 이탈률 추이
- 참여도 패턴

#### 3. 운영 인사이트
- 체크리스트 완료율
- 메시지 발송 성과
- 응답 시간 분석

#### 4. 기술 인사이트
- 시스템 안정성
- API 성능 추이
- 에러 패턴

### 분석 쿼리

```sql
-- 전환율 분석
WITH funnel AS (
  SELECT
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - 7) as visitors,
    COUNT(*) FILTER (WHERE submitted_wish AND created_at >= CURRENT_DATE - 7) as submitted,
    COUNT(*) FILTER (WHERE paid AND created_at >= CURRENT_DATE - 7) as converted
  FROM users
)
SELECT
  visitors,
  submitted,
  converted,
  ROUND(submitted::numeric / visitors * 100, 1) as submit_rate,
  ROUND(converted::numeric / submitted * 100, 1) as conversion_rate
FROM funnel;
```

**출력 형식:**
```json
{{
  "timestamp": "2026-01-01T10:00:00Z",
  "insights": [
    {{
      "category": "revenue",
      "type": "positive",
      "title": "전환율 상승 추세",
      "description": "지난 주 대비 전환율 12% 상승 (3% → 3.4%)",
      "data": {{
        "current_rate": "3.4%",
        "previous_rate": "3.0%",
        "change": "+12%"
      }},
      "impact": "월 예상 추가 매출 150,000원"
    }},
    {{
      "category": "users",
      "type": "warning",
      "title": "YELLOW 소원이 증가",
      "description": "어제 대비 YELLOW 3명 증가 (5명 → 8명)",
      "data": {{
        "current": 8,
        "yesterday": 5,
        "change": "+60%"
      }},
      "action": "이탈 방지 개입 권장"
    }},
    {{
      "category": "operations",
      "type": "info",
      "title": "메시지 발송 안정",
      "description": "7일 연속 성공률 95% 이상 유지",
      "data": {{
        "avg_success_rate": "97.2%",
        "streak_days": 7
      }}
    }}
  ],
  "recommendations": [
    {{
      "priority": "P1",
      "title": "YELLOW 소원이 케어 캠페인",
      "description": "8명의 YELLOW 소원이에게 개인화 메시지 발송",
      "expected_impact": "이탈 방지 4명 이상",
      "owner": "재미",
      "tool": "wishmaker-hub-mcp"
    }},
    {{
      "priority": "P2",
      "title": "전환 최적 타이밍 활용",
      "description": "전환율 높은 저녁 시간대(20-22시) 프로모션 집중",
      "expected_impact": "추가 전환 2-3건/일",
      "owner": "푸르미르",
      "tool": "business-ops-mcp"
    }}
  ],
  "kpi_summary": {{
    "revenue_goal_progress": "68%",
    "user_goal_progress": "85%",
    "satisfaction_score": 4.2
  }}
}}
```
""",

        # === CEO 모닝 브리핑 ===
        "get_morning_briefing": lambda args: f"""
## CEO 모닝 브리핑

### 조회 조건
- 어제 성과 포함: {args.get('include_yesterday', True)}

### 브리핑 구성

#### 1. 어제 하이라이트
- 주요 성과 3가지
- 주요 이슈 (있을 경우)

#### 2. 오늘 포커스
- P0 작업 목록
- 예정된 이벤트

#### 3. 핵심 숫자
- 소원이 현황
- 매출 현황
- 시스템 상태

#### 4. 추천 첫 액션
- 가장 중요한 한 가지

### 데이터 수집

```sql
-- 어제 성과
SELECT
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - 1 AND created_at < CURRENT_DATE) as yesterday_new_users,
  SUM(CASE WHEN paid_at >= CURRENT_DATE - 1 AND paid_at < CURRENT_DATE THEN amount ELSE 0 END) as yesterday_revenue,
  COUNT(*) FILTER (WHERE completed AND DATE(completed_at) = CURRENT_DATE - 1) as yesterday_tasks_done
FROM users, payments, ceo_checklist;

-- 오늘 예정
SELECT * FROM ceo_checklist
WHERE DATE(created_at) = CURRENT_DATE AND priority = 'P0';
```

**출력 형식:**
```json
{{
  "date": "2026-01-01",
  "greeting": "좋은 아침입니다, 푸르미르님!",
  "yesterday": {{
    "highlights": [
      "신규 소원이 7명 가입 (목표 5명 대비 140%)",
      "일 매출 85,000원 달성 (전일 대비 +20%)",
      "RED 소원이 0명 유지 (3일 연속)"
    ],
    "issues": [],
    "overall": "성공적인 하루였습니다"
  }},
  "today": {{
    "focus": "연초 마케팅 캠페인 시작",
    "p0_tasks": [
      "신년 이벤트 메시지 발송 확인",
      "신호등 현황 점검"
    ],
    "scheduled_events": [
      {{"time": "10:00", "event": "Aurora 5 주간 회의"}},
      {{"time": "14:00", "event": "마케팅 콘텐츠 리뷰"}}
    ]
  }},
  "numbers": {{
    "active_users": 120,
    "today_target_revenue": 80000,
    "week_progress": "68%",
    "system_status": "healthy"
  }},
  "first_action": {{
    "title": "신호등 현황 확인",
    "why": "어제 YELLOW 2명 추가됨 - 케어 필요",
    "tool": "wishmaker-hub-mcp",
    "estimated_time": "5분"
  }},
  "weather": {{
    "summary": "맑음, 체감온도 -2도",
    "tip": "따뜻한 차 한 잔과 함께 시작하세요"
  }},
  "quote": "새해 첫날, 모든 소원이들의 기적이 시작됩니다"
}}
```
""",

        # === 실시간 상태 ===
        "get_realtime_status": lambda args: f"""
## 실시간 시스템 상태

### 모니터링 항목

| 항목 | 체크 방법 | 정상 기준 |
|------|-----------|-----------|
| API 서버 | /health 엔드포인트 | 200 OK, < 500ms |
| 데이터베이스 | 연결 테스트 | 연결 성공, < 100ms |
| Solapi | 잔여 크레딧 | 1,000건 이상 |
| OpenAI | API 상태 | 정상 |

### 실시간 체크 코드

```python
import httpx
import asyncio

async def check_all_services():
    results = {{}}

    # API 서버
    try:
        async with httpx.AsyncClient() as client:
            start = time.time()
            resp = await client.get(
                "https://daily-miracles-app.onrender.com/health",
                timeout=5.0
            )
            results['api'] = {{
                'status': 'healthy' if resp.status_code == 200 else 'degraded',
                'response_time_ms': int((time.time() - start) * 1000)
            }}
    except Exception as e:
        results['api'] = {{'status': 'critical', 'error': str(e)}}

    # DB 체크
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        start = time.time()
        await conn.fetchval('SELECT 1')
        results['database'] = {{
            'status': 'healthy',
            'response_time_ms': int((time.time() - start) * 1000)
        }}
        await conn.close()
    except Exception as e:
        results['database'] = {{'status': 'critical', 'error': str(e)}}

    return results
```

### 최근 활동 로그

```sql
SELECT
  'wish' as type, created_at, user_id as detail
FROM wishes
WHERE created_at >= NOW() - INTERVAL '1 hour'

UNION ALL

SELECT
  'payment' as type, paid_at as created_at,
  CONCAT(amount, '원') as detail
FROM payments
WHERE paid_at >= NOW() - INTERVAL '1 hour'

UNION ALL

SELECT
  'message' as type, created_at,
  CONCAT(recipient_phone, ' - ', template_name) as detail
FROM outbound_messages
WHERE created_at >= NOW() - INTERVAL '1 hour'

ORDER BY created_at DESC
LIMIT 20;
```

**출력 형식:**
```json
{{
  "timestamp": "2026-01-01T10:30:00Z",
  "overall_status": "healthy",
  "uptime": "99.9%",
  "services": {{
    "api_server": {{
      "status": "healthy",
      "url": "https://daily-miracles-app.onrender.com",
      "response_time_ms": 145,
      "last_check": "2026-01-01T10:30:00Z"
    }},
    "database": {{
      "status": "healthy",
      "connections": {{
        "active": 5,
        "max": 100,
        "usage": "5%"
      }},
      "response_time_ms": 12
    }},
    "solapi": {{
      "status": "healthy",
      "credits_remaining": 5000,
      "today_sent": 45
    }},
    "openai": {{
      "status": "healthy",
      "api_available": true
    }}
  }},
  "recent_activity": [
    {{
      "time": "10:28:45",
      "type": "wish",
      "detail": "새 소원 접수 - 이행복님"
    }},
    {{
      "time": "10:25:12",
      "type": "message",
      "detail": "ACK 발송 성공 - 010-****-5678"
    }},
    {{
      "time": "10:20:00",
      "type": "payment",
      "detail": "결제 완료 - 15,000원"
    }}
  ],
  "active_sessions": 3,
  "requests_per_minute": 12,
  "error_rate_last_hour": "0.5%"
}}
```
"""
    }

    if name not in prompts:
        raise ValueError(f"Unknown tool: {name}")

    return prompts[name](arguments)
