# Dashboard MCP

Aurora 5 UBOS 통합 대시보드 MCP 서버

## 기능

- `get_overview`: 전체 현황 한눈에 조회
- `get_all_alerts`: 모든 알림 통합 (긴급도 순)
- `get_insights`: 종합 인사이트 및 추천 액션
- `get_morning_briefing`: CEO 모닝 브리핑
- `get_realtime_status`: 실시간 시스템 상태

## 설치

```bash
uv sync
```

## 실행

```bash
uv run dashboard-mcp
```

## Claude Desktop 설정

```json
{
  "mcpServers": {
    "dashboard-mcp": {
      "command": "uv",
      "args": [
        "--directory",
        "C:\\Users\\세진\\OneDrive\\바탕 화면\\daily-miracles-mvp\\mcp-servers\\dashboard-mcp",
        "run",
        "dashboard-mcp"
      ]
    }
  }
}
```

## 사용 예시

```
전체 현황 보여줘
@dashboard-mcp get_overview

오늘 알림 뭐 있어?
@dashboard-mcp get_all_alerts

모닝 브리핑 해줘
@dashboard-mcp get_morning_briefing

실시간 상태 확인해줘
@dashboard-mcp get_realtime_status
```
