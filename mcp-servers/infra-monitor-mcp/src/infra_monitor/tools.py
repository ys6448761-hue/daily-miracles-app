"""
Infrastructure Monitor Tools

인프라 모니터링을 위한 도구 정의
"""

from typing import Any

# 도구 정의
TOOLS = [
    # === 서비스 헬스 체크 ===
    {
        "name": "check_all_services",
        "description": "모든 서비스의 헬스 상태를 체크합니다 (앱, API, DB)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "services": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "체크할 서비스 목록 (기본: 전체)"
                },
                "timeout_ms": {
                    "type": "number",
                    "description": "타임아웃 시간 (기본: 5000ms)"
                },
                "include_details": {
                    "type": "boolean",
                    "description": "상세 정보 포함 여부 (기본: true)"
                }
            }
        }
    },

    # === 에러 로그 조회 ===
    {
        "name": "get_recent_errors",
        "description": "최근 에러 로그를 조회합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "severity": {
                    "type": "string",
                    "enum": ["all", "error", "warning", "critical"],
                    "description": "심각도 필터 (기본: all)"
                },
                "time_range": {
                    "type": "string",
                    "enum": ["1h", "6h", "24h", "7d"],
                    "description": "조회 기간 (기본: 24h)"
                },
                "limit": {
                    "type": "number",
                    "description": "최대 조회 개수 (기본: 50)"
                },
                "group_by": {
                    "type": "string",
                    "enum": ["type", "service", "hour"],
                    "description": "그룹화 기준"
                }
            }
        }
    },

    # === 데이터베이스 건강도 ===
    {
        "name": "check_database_health",
        "description": "데이터베이스 건강 상태를 확인합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "check_type": {
                    "type": "string",
                    "enum": ["all", "connections", "storage", "slow_queries", "locks"],
                    "description": "체크 유형 (기본: all)"
                },
                "slow_query_threshold_ms": {
                    "type": "number",
                    "description": "느린 쿼리 기준 (기본: 1000ms)"
                }
            }
        }
    },

    # === API 성능 모니터링 ===
    {
        "name": "monitor_api_performance",
        "description": "API 엔드포인트별 성능을 모니터링합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "endpoints": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "모니터링할 엔드포인트 (기본: 전체)"
                },
                "time_range": {
                    "type": "string",
                    "enum": ["1h", "6h", "24h", "7d"],
                    "description": "조회 기간 (기본: 24h)"
                },
                "include_percentiles": {
                    "type": "boolean",
                    "description": "백분위수 포함 (p50, p95, p99)"
                }
            }
        }
    }
]


def get_tool_prompt(name: str, arguments: dict[str, Any]) -> str:
    """도구 호출에 대한 프롬프트를 생성합니다."""

    prompts = {
        # === 서비스 헬스 체크 ===
        "check_all_services": lambda args: f"""
## 전체 서비스 헬스 체크

### 체크 조건
- 대상 서비스: {args.get('services', '전체')}
- 타임아웃: {args.get('timeout_ms', 5000)}ms
- 상세 정보: {args.get('include_details', True)}

### 서비스 구성 (Aurora 5 UBOS)

| 서비스 | 플랫폼 | 역할 |
|--------|--------|------|
| API 서버 | Render | Node.js/Express 메인 서버 |
| 이미지 생성 | OpenAI | DALL-E 3 소원그림 |
| 메시지 발송 | Solapi | 카카오 알림톡 + SMS |
| 데이터 저장 | Airtable | 소원 데이터 관리 |
| 모니터링 | Render Logs | 실시간 로그 |

### 헬스 체크 코드

```python
import httpx
import time

async def check_endpoint(url: str, timeout: float = 5.0) -> dict:
    start = time.time()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=timeout)
            return {{
                "status": "healthy" if response.status_code == 200 else "degraded",
                "response_time_ms": int((time.time() - start) * 1000),
                "http_status": response.status_code
            }}
    except httpx.TimeoutException:
        return {{"status": "timeout", "error": "Request timed out"}}
    except Exception as e:
        return {{"status": "critical", "error": str(e)}}
```

### 체크할 엔드포인트

```
https://daily-miracles-app.onrender.com/api/notify/status
https://daily-miracles-app.onrender.com/api/wishes (POST)
https://daily-miracles-app.onrender.com/api/wish-image/status
```

**출력 형식:**
```json
{{
  "overall_status": "healthy|degraded|critical",
  "checked_at": "2026-01-01T10:00:00Z",
  "services": {{
    "api_server": {{
      "status": "healthy",
      "url": "https://daily-miracles-app.onrender.com",
      "response_time_ms": 150,
      "http_status": 200
    }},
    "database": {{
      "status": "healthy",
      "connections": 5,
      "max_connections": 100
    }},
    "solapi": {{
      "status": "healthy",
      "last_message_sent": "2026-01-01T09:55:00Z"
    }},
    "openai": {{
      "status": "healthy",
      "api_credits_remaining": true
    }}
  }},
  "summary": {{
    "healthy": 4,
    "degraded": 0,
    "critical": 0
  }}
}}
```
""",

        # === 에러 로그 조회 ===
        "get_recent_errors": lambda args: f"""
## 최근 에러 로그 조회

### 조회 조건
- 심각도: {args.get('severity', 'all')}
- 기간: {args.get('time_range', '24h')}
- 최대 개수: {args.get('limit', 50)}
- 그룹화: {args.get('group_by', '없음')}

### 에러 심각도 기준

| 레벨 | 설명 | 조치 |
|------|------|------|
| critical | 서비스 중단 | 즉시 대응 |
| error | 기능 오류 | 24시간 내 해결 |
| warning | 잠재적 문제 | 모니터링 |

### 조회 쿼리

```sql
SELECT
  severity,
  error_type,
  message,
  stack_trace,
  service,
  occurred_at,
  COUNT(*) OVER (PARTITION BY error_type) as occurrence_count
FROM error_logs
WHERE occurred_at > NOW() - INTERVAL '{args.get('time_range', '24h')}'
  AND ({args.get('severity', 'all')} = 'all' OR severity = '{args.get('severity', 'all')}')
ORDER BY occurred_at DESC
LIMIT {args.get('limit', 50)};
```

**출력 형식:**
```json
{{
  "total_errors": 15,
  "by_severity": {{
    "critical": 0,
    "error": 5,
    "warning": 10
  }},
  "errors": [
    {{
      "id": "err_001",
      "severity": "error",
      "type": "SolapiError",
      "message": "카카오 알림톡 발송 실패",
      "service": "solapiService",
      "occurred_at": "2026-01-01T10:15:00Z",
      "occurrence_count": 3,
      "stack_trace": "..."
    }}
  ],
  "top_errors": [
    {{
      "type": "SolapiError",
      "count": 5,
      "last_occurred": "2026-01-01T10:15:00Z"
    }}
  ],
  "recommendations": [
    "SolapiError 반복 발생 - API 상태 확인 필요"
  ]
}}
```
""",

        # === 데이터베이스 건강도 ===
        "check_database_health": lambda args: f"""
## 데이터베이스 건강도 체크

### 체크 조건
- 유형: {args.get('check_type', 'all')}
- 느린 쿼리 기준: {args.get('slow_query_threshold_ms', 1000)}ms

### 체크 항목

#### 1. 연결 상태
```sql
SELECT
  count(*) as active_connections,
  max_conn,
  ROUND(count(*) * 100.0 / max_conn, 2) as usage_percent
FROM pg_stat_activity,
  (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') s
WHERE datname = current_database();
```

#### 2. 스토리지 상태
```sql
SELECT
  pg_database_size(current_database()) as db_size_bytes,
  pg_size_pretty(pg_database_size(current_database())) as db_size,
  (SELECT setting FROM pg_settings WHERE name = 'data_directory') as data_dir;
```

#### 3. 느린 쿼리
```sql
SELECT
  query,
  calls,
  total_time / 1000 as total_seconds,
  mean_time as avg_ms
FROM pg_stat_statements
WHERE mean_time > {args.get('slow_query_threshold_ms', 1000)}
ORDER BY total_time DESC
LIMIT 10;
```

#### 4. 락 상태
```sql
SELECT
  locktype,
  COUNT(*) as lock_count
FROM pg_locks
WHERE NOT granted
GROUP BY locktype;
```

**출력 형식:**
```json
{{
  "overall_health": "healthy|warning|critical",
  "checked_at": "2026-01-01T10:00:00Z",
  "connections": {{
    "active": 5,
    "max": 100,
    "usage_percent": 5.0,
    "status": "healthy"
  }},
  "storage": {{
    "size_bytes": 52428800,
    "size_human": "50 MB",
    "status": "healthy"
  }},
  "slow_queries": {{
    "count": 2,
    "top_queries": [
      {{
        "query": "SELECT * FROM wishes WHERE...",
        "avg_time_ms": 1500,
        "calls": 100
      }}
    ],
    "status": "warning"
  }},
  "locks": {{
    "waiting": 0,
    "status": "healthy"
  }},
  "recommendations": [
    "인덱스 추가 검토: wishes 테이블 created_at"
  ]
}}
```
""",

        # === API 성능 모니터링 ===
        "monitor_api_performance": lambda args: f"""
## API 성능 모니터링

### 모니터링 조건
- 대상 엔드포인트: {args.get('endpoints', '전체')}
- 기간: {args.get('time_range', '24h')}
- 백분위수: {args.get('include_percentiles', True)}

### 핵심 엔드포인트 (Aurora 5 UBOS)

| 엔드포인트 | 역할 | 목표 응답시간 |
|------------|------|---------------|
| POST /api/wishes | 소원 제출 | 500ms 이하 |
| GET /api/notify/status | 발송 상태 | 200ms 이하 |
| POST /api/wish-image/generate | 이미지 생성 | 30s 이하 |
| POST /api/notify/test | 테스트 발송 | 3s 이하 |

### 성능 메트릭스 쿼리

```sql
SELECT
  endpoint,
  COUNT(*) as request_count,
  AVG(response_time_ms) as avg_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99,
  COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
  ROUND(COUNT(*) FILTER (WHERE status_code >= 400) * 100.0 / COUNT(*), 2) as error_rate
FROM api_logs
WHERE logged_at > NOW() - INTERVAL '{args.get('time_range', '24h')}'
GROUP BY endpoint
ORDER BY request_count DESC;
```

**출력 형식:**
```json
{{
  "time_range": "24h",
  "total_requests": 1500,
  "overall": {{
    "avg_response_time_ms": 320,
    "error_rate": "1.2%",
    "status": "healthy"
  }},
  "endpoints": [
    {{
      "path": "POST /api/wishes",
      "requests": 450,
      "avg_time_ms": 280,
      "p50_ms": 250,
      "p95_ms": 450,
      "p99_ms": 800,
      "error_rate": "0.5%",
      "status": "healthy"
    }},
    {{
      "path": "POST /api/wish-image/generate",
      "requests": 50,
      "avg_time_ms": 15000,
      "p50_ms": 12000,
      "p95_ms": 25000,
      "p99_ms": 45000,
      "error_rate": "2%",
      "status": "warning"
    }}
  ],
  "slowest_endpoints": [
    {{
      "path": "POST /api/wish-image/generate",
      "avg_time_ms": 15000
    }}
  ],
  "most_errors": [
    {{
      "path": "POST /api/notify/test",
      "error_count": 5,
      "error_rate": "5%"
    }}
  ],
  "recommendations": [
    "이미지 생성 API 캐싱 검토",
    "notify/test 에러 원인 분석 필요"
  ]
}}
```
"""
    }

    if name not in prompts:
        raise ValueError(f"Unknown tool: {name}")

    return prompts[name](arguments)
