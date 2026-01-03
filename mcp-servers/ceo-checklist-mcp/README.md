# CEO Checklist MCP

푸르미르 일일 체크리스트 관리 MCP 서버

## 기능

- `get_daily_checklist`: 오늘의 체크리스트 조회
- `update_checklist_item`: 체크리스트 항목 완료 처리
- `add_checklist_item`: 체크리스트 항목 추가
- `get_priority_tasks`: 우선순위 작업 Top 3
- `get_weekly_review`: 주간 체크리스트 리뷰

## 설치

```bash
uv sync
```

## 실행

```bash
uv run ceo-checklist-mcp
```

## Claude Desktop 설정

```json
{
  "mcpServers": {
    "ceo-checklist-mcp": {
      "command": "uv",
      "args": [
        "--directory",
        "C:\\Users\\세진\\OneDrive\\바탕 화면\\daily-miracles-mvp\\mcp-servers\\ceo-checklist-mcp",
        "run",
        "ceo-checklist-mcp"
      ]
    }
  }
}
```

## 사용 예시

```
오늘 할 일 목록 보여줘
@ceo-checklist-mcp get_daily_checklist

우선순위 작업 Top 3는?
@ceo-checklist-mcp get_priority_tasks

이번 주 체크리스트 완료율 확인
@ceo-checklist-mcp get_weekly_review
```
