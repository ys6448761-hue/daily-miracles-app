# Infrastructure Monitor MCP Server

Aurora 5 UBOS의 기술 인프라 모니터링 시스템

## 기능

### 1. 서비스 헬스 체크 (check_all_services)
- 앱, API, DB 상태 확인
- HTTP 응답 코드 및 시간 측정
- 전체 서비스 요약

### 2. 에러 로그 조회 (get_recent_errors)
- 심각도별 필터링 (critical/error/warning)
- 발생 빈도 집계
- 상위 에러 유형 분석

### 3. 데이터베이스 건강도 (check_database_health)
- 연결 수 및 용량 확인
- 느린 쿼리 감지
- 락 상태 모니터링

### 4. API 성능 모니터링 (monitor_api_performance)
- 엔드포인트별 응답 시간
- 에러율 분석
- p50/p95/p99 백분위수

## 서비스 구성 (Aurora 5 UBOS)

| 서비스 | 플랫폼 | 역할 |
|--------|--------|------|
| API 서버 | Render | Node.js/Express |
| 이미지 생성 | OpenAI | DALL-E 3 |
| 메시지 발송 | Solapi | 알림톡 + SMS |
| 데이터 저장 | Airtable | 소원 데이터 |

## 설치

```bash
cd mcp-servers/infra-monitor-mcp
uv venv
uv pip install -e . --link-mode copy
```

## 환경 변수

```bash
# .env 파일
DATABASE_URL=postgresql://user:pass@host:5432/dbname
APP_URL=https://daily-miracles-app.onrender.com
```

## 실행

```bash
infra-monitor-mcp
```

## Claude Code 연동

`.claude/settings.json`:

```json
{
  "mcpServers": {
    "infra-monitor": {
      "command": "uv",
      "args": ["run", "--directory", "./mcp-servers/infra-monitor-mcp", "infra-monitor-mcp"]
    }
  }
}
```

## 버전

- v0.1.0: 초기 릴리스 (2026-01-01)
