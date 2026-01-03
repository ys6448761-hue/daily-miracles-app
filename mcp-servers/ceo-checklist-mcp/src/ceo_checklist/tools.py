"""
CEO Checklist Tools

푸르미르 일일 체크리스트를 위한 도구 정의
"""

from typing import Any

# 도구 정의
TOOLS = [
    # === 일일 체크리스트 ===
    {
        "name": "get_daily_checklist",
        "description": "오늘의 체크리스트를 조회합니다 (자동 생성 + 수동 추가 항목)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "date": {
                    "type": "string",
                    "description": "조회 날짜 (YYYY-MM-DD, 기본: 오늘)"
                },
                "include_completed": {
                    "type": "boolean",
                    "description": "완료된 항목 포함 (기본: true)"
                },
                "priority_filter": {
                    "type": "string",
                    "enum": ["all", "P0", "P1", "P2"],
                    "description": "우선순위 필터"
                }
            }
        }
    },

    # === 체크리스트 항목 업데이트 ===
    {
        "name": "update_checklist_item",
        "description": "체크리스트 항목의 완료 상태를 변경합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "item_id": {
                    "type": "string",
                    "description": "항목 ID"
                },
                "completed": {
                    "type": "boolean",
                    "description": "완료 여부"
                },
                "notes": {
                    "type": "string",
                    "description": "완료 메모 (선택)"
                }
            },
            "required": ["item_id", "completed"]
        }
    },

    # === 체크리스트 항목 추가 ===
    {
        "name": "add_checklist_item",
        "description": "체크리스트에 새 항목을 추가합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "할 일 제목"
                },
                "priority": {
                    "type": "string",
                    "enum": ["P0", "P1", "P2"],
                    "description": "우선순위 (P0: 긴급, P1: 중요, P2: 일반)"
                },
                "category": {
                    "type": "string",
                    "enum": ["operation", "marketing", "development", "customer", "admin"],
                    "description": "카테고리"
                },
                "due_time": {
                    "type": "string",
                    "description": "마감 시간 (HH:MM, 선택)"
                }
            },
            "required": ["title", "priority"]
        }
    },

    # === 우선순위 작업 조회 ===
    {
        "name": "get_priority_tasks",
        "description": "오늘의 우선순위 작업 Top 3를 조회합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "include_overdue": {
                    "type": "boolean",
                    "description": "지연된 작업 포함 (기본: true)"
                }
            }
        }
    },

    # === 주간 리뷰 ===
    {
        "name": "get_weekly_review",
        "description": "주간 체크리스트 완료율 및 리뷰를 생성합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "week_offset": {
                    "type": "number",
                    "description": "주차 오프셋 (0: 이번 주, -1: 지난 주)"
                }
            }
        }
    }
]


def get_tool_prompt(name: str, arguments: dict[str, Any]) -> str:
    """도구 호출에 대한 프롬프트를 생성합니다."""

    prompts = {
        # === 일일 체크리스트 ===
        "get_daily_checklist": lambda args: f"""
## 일일 체크리스트 조회

### 조회 조건
- 날짜: {args.get('date', '오늘')}
- 완료 포함: {args.get('include_completed', True)}
- 우선순위: {args.get('priority_filter', 'all')}

### Aurora 5 UBOS 일일 체크리스트 구조

#### 자동 생성 항목 (매일)
| 시간대 | 항목 | 우선순위 |
|--------|------|----------|
| 09:00 | 신호등 현황 확인 (RED 있는지) | P0 |
| 09:00 | 오늘 소원 인입 현황 확인 | P1 |
| 12:00 | 메시지 발송 상태 점검 | P1 |
| 18:00 | 일일 매출 확인 | P2 |
| 18:00 | 이탈 위험 소원이 확인 | P1 |

#### 우선순위 기준
- **P0 (긴급)**: 즉시 처리 필요, 서비스 영향
- **P1 (중요)**: 당일 처리 필요
- **P2 (일반)**: 가능하면 처리

### 조회 쿼리

```sql
SELECT
  id,
  title,
  priority,
  category,
  completed,
  completed_at,
  due_time,
  notes
FROM ceo_checklist
WHERE DATE(created_at) = '{args.get('date', 'CURRENT_DATE')}'
ORDER BY
  CASE priority
    WHEN 'P0' THEN 1
    WHEN 'P1' THEN 2
    WHEN 'P2' THEN 3
  END,
  due_time NULLS LAST;
```

**출력 형식:**
```json
{{
  "date": "2026-01-01",
  "summary": {{
    "total": 8,
    "completed": 5,
    "remaining": 3,
    "completion_rate": "62.5%"
  }},
  "by_priority": {{
    "P0": {{"total": 1, "completed": 1}},
    "P1": {{"total": 4, "completed": 3}},
    "P2": {{"total": 3, "completed": 1}}
  }},
  "items": [
    {{
      "id": "chk_001",
      "title": "신호등 현황 확인 (RED 있는지)",
      "priority": "P0",
      "category": "operation",
      "completed": true,
      "completed_at": "2026-01-01T09:15:00Z",
      "due_time": "09:00"
    }},
    {{
      "id": "chk_002",
      "title": "오늘 소원 인입 현황 확인",
      "priority": "P1",
      "category": "operation",
      "completed": false,
      "due_time": "09:00"
    }}
  ],
  "next_due": {{
    "id": "chk_003",
    "title": "메시지 발송 상태 점검",
    "due_time": "12:00"
  }}
}}
```
""",

        # === 체크리스트 업데이트 ===
        "update_checklist_item": lambda args: f"""
## 체크리스트 항목 업데이트

### 업데이트 정보
- 항목 ID: {args.get('item_id')}
- 완료 여부: {args.get('completed')}
- 메모: {args.get('notes', '없음')}

### SQL 실행

```sql
UPDATE ceo_checklist
SET
  completed = {args.get('completed')},
  completed_at = {'NOW()' if args.get('completed') else 'NULL'},
  notes = '{args.get('notes', '')}'
WHERE id = '{args.get('item_id')}'
RETURNING id, title, completed, completed_at;
```

### 완료 시 자동 알림

P0 항목 완료 시:
- Slack/카카오톡 팀 채널에 자동 알림
- 코미(COO)에게 상태 보고

**출력 형식:**
```json
{{
  "success": true,
  "item": {{
    "id": "{args.get('item_id')}",
    "title": "신호등 현황 확인",
    "completed": {str(args.get('completed')).lower()},
    "completed_at": "2026-01-01T09:15:00Z",
    "notes": "{args.get('notes', '')}"
  }},
  "daily_progress": {{
    "completed": 6,
    "total": 8,
    "completion_rate": "75%"
  }}
}}
```
""",

        # === 체크리스트 추가 ===
        "add_checklist_item": lambda args: f"""
## 체크리스트 항목 추가

### 새 항목 정보
- 제목: {args.get('title')}
- 우선순위: {args.get('priority')}
- 카테고리: {args.get('category', 'operation')}
- 마감 시간: {args.get('due_time', '없음')}

### 카테고리 분류

| 카테고리 | 설명 | 담당 |
|----------|------|------|
| operation | 운영 | 코미, 재미 |
| marketing | 마케팅 | 푸르미르 |
| development | 개발 | Code |
| customer | 고객 응대 | 재미 |
| admin | 행정 | 푸르미르 |

### SQL 실행

```sql
INSERT INTO ceo_checklist (
  title, priority, category, due_time, completed, created_at
)
VALUES (
  '{args.get('title')}',
  '{args.get('priority')}',
  '{args.get('category', 'operation')}',
  '{args.get('due_time')}',
  FALSE,
  NOW()
)
RETURNING id, title, priority, category, due_time;
```

**출력 형식:**
```json
{{
  "success": true,
  "item": {{
    "id": "chk_new_001",
    "title": "{args.get('title')}",
    "priority": "{args.get('priority')}",
    "category": "{args.get('category', 'operation')}",
    "due_time": "{args.get('due_time', 'N/A')}",
    "completed": false,
    "created_at": "2026-01-01T10:00:00Z"
  }},
  "today_total": 9
}}
```
""",

        # === 우선순위 작업 ===
        "get_priority_tasks": lambda args: f"""
## 우선순위 작업 Top 3

### 조회 조건
- 지연 작업 포함: {args.get('include_overdue', True)}

### 선정 기준

1. **P0 미완료** (최우선)
2. **지연된 P1** (마감시간 지남)
3. **오늘 마감 P1**
4. **P2 중 오래된 것**

### 조회 쿼리

```sql
WITH priority_tasks AS (
  SELECT
    id,
    title,
    priority,
    category,
    due_time,
    created_at,
    CASE
      WHEN priority = 'P0' AND NOT completed THEN 1
      WHEN priority = 'P1' AND due_time < CURRENT_TIME AND NOT completed THEN 2
      WHEN priority = 'P1' AND NOT completed THEN 3
      ELSE 4
    END as urgency_score
  FROM ceo_checklist
  WHERE DATE(created_at) = CURRENT_DATE
    AND completed = FALSE
  ORDER BY urgency_score, due_time NULLS LAST
  LIMIT 3
)
SELECT * FROM priority_tasks;
```

### 푸르미르님 추천 행동

| 우선순위 | 추천 시간 | 예상 소요 |
|----------|-----------|-----------|
| 1순위 | 즉시 | 5분 |
| 2순위 | 30분 내 | 10분 |
| 3순위 | 오후 | 15분 |

**출력 형식:**
```json
{{
  "timestamp": "2026-01-01T10:30:00Z",
  "top_3": [
    {{
      "rank": 1,
      "id": "chk_001",
      "title": "RED 소원이 긴급 대응",
      "priority": "P0",
      "category": "customer",
      "reason": "P0 미완료 - 즉시 처리 필요",
      "suggested_action": "재미에게 상황 확인 요청",
      "estimated_time": "5분"
    }},
    {{
      "rank": 2,
      "id": "chk_002",
      "title": "메시지 발송 상태 점검",
      "priority": "P1",
      "category": "operation",
      "reason": "마감시간(12:00) 경과",
      "suggested_action": "코미에게 발송 현황 보고 요청",
      "estimated_time": "10분"
    }},
    {{
      "rank": 3,
      "id": "chk_003",
      "title": "이탈 위험 소원이 확인",
      "priority": "P1",
      "category": "operation",
      "reason": "오늘 마감(18:00)",
      "suggested_action": "루미 분석 데이터 확인",
      "estimated_time": "15분"
    }}
  ],
  "overdue_count": 1,
  "remaining_p0": 1,
  "message": "P0 작업 1개 미완료 - 우선 처리 권장"
}}
```
""",

        # === 주간 리뷰 ===
        "get_weekly_review": lambda args: f"""
## 주간 체크리스트 리뷰

### 조회 기간
- 주차 오프셋: {args.get('week_offset', 0)} (0: 이번 주, -1: 지난 주)

### 분석 항목

1. **완료율 추이**
   - 일별 완료율
   - 우선순위별 완료율
   - 카테고리별 완료율

2. **시간 분석**
   - 평균 완료 시간
   - 지연된 작업 비율
   - 가장 바쁜 요일

3. **개선 포인트**
   - 반복적으로 미완료되는 항목
   - 지연이 잦은 카테고리
   - 추천 조정 사항

### 조회 쿼리

```sql
WITH weekly_stats AS (
  SELECT
    DATE(created_at) as day,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE completed) as completed,
    ROUND(COUNT(*) FILTER (WHERE completed)::numeric / COUNT(*) * 100, 1) as rate
  FROM ceo_checklist
  WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '{args.get('week_offset', 0)} weeks'
    AND created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '{args.get('week_offset', 0) + 1} weeks'
  GROUP BY DATE(created_at)
  ORDER BY day
)
SELECT * FROM weekly_stats;
```

**출력 형식:**
```json
{{
  "week": "2025-W52",
  "date_range": "2025-12-30 ~ 2026-01-05",
  "overall": {{
    "total_items": 42,
    "completed": 38,
    "completion_rate": "90.5%",
    "vs_last_week": "+5.2%"
  }},
  "by_day": [
    {{"day": "Mon", "total": 8, "completed": 7, "rate": "87.5%"}},
    {{"day": "Tue", "total": 7, "completed": 7, "rate": "100%"}},
    {{"day": "Wed", "total": 6, "completed": 6, "rate": "100%"}}
  ],
  "by_priority": {{
    "P0": {{"total": 5, "completed": 5, "rate": "100%"}},
    "P1": {{"total": 20, "completed": 18, "rate": "90%"}},
    "P2": {{"total": 17, "completed": 15, "rate": "88.2%"}}
  }},
  "by_category": {{
    "operation": {{"total": 20, "completed": 19, "rate": "95%"}},
    "customer": {{"total": 10, "completed": 9, "rate": "90%"}},
    "marketing": {{"total": 7, "completed": 6, "rate": "85.7%"}},
    "development": {{"total": 3, "completed": 3, "rate": "100%"}},
    "admin": {{"total": 2, "completed": 1, "rate": "50%"}}
  }},
  "insights": [
    {{
      "type": "positive",
      "message": "P0 작업 100% 완료 - 긴급 대응 우수"
    }},
    {{
      "type": "warning",
      "message": "admin 카테고리 완료율 저조 (50%)",
      "recommendation": "행정 업무 시간 별도 확보 권장"
    }}
  ],
  "overdue_items": [
    {{
      "title": "월간 리포트 작성",
      "category": "admin",
      "delay_days": 2
    }}
  ],
  "next_week_focus": [
    "admin 카테고리 개선",
    "오전 집중 시간 확보"
  ]
}}
```
"""
    }

    if name not in prompts:
        raise ValueError(f"Unknown tool: {name}")

    return prompts[name](arguments)
