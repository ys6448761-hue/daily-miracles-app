# Miracle MCP Server

Daily Miracles 서비스의 핵심 기능을 제공하는 MCP 서버입니다.

## 도구

| 도구 | 설명 |
|------|------|
| `calculate_miracle_index` | 12질문 → 기적지수(50-100) 계산 |
| `generate_roadmap` | 30일 맞춤 로드맵 생성 |
| `get_daily_message` | 7일 응원 메시지 (아침/저녁) |

## 설치

```bash
cd mcp-servers/miracle-mcp
uv pip install -e .
```

## 실행

```bash
uv run miracle-mcp
```

## Claude Desktop 연동

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miracle": {
      "command": "uv",
      "args": [
        "--directory",
        "C:\\path\\to\\daily-miracles-mvp\\mcp-servers\\miracle-mcp",
        "run",
        "miracle-mcp"
      ]
    }
  }
}
```

## 사용 예시

### 기적지수 계산
```
12질문 답변을 분석해서 기적지수를 계산해줘
```

### 30일 로드맵 생성
```
기적지수 75점인 김소원님의 30일 로드맵을 만들어줘
```

### 7일 응원 메시지
```
3일차 응원 메시지를 생성해줘
```

## 테스트

```bash
npx @modelcontextprotocol/inspector uv --directory . run miracle-mcp
```
