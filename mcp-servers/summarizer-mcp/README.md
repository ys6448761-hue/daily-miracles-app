# Summarizer MCP Server

대화 및 문서를 자동으로 요약하는 MCP 서버입니다.

## 도구

| 도구 | 설명 |
|------|------|
| `summarize` | 대화/문서를 일일, 주간, 회의록 형식으로 요약 |
| `extract_decisions` | 대화에서 결정 사항 추출 (JSON 형식) |

## 설치

```bash
cd mcp-servers/summarizer-mcp
pip install -e .
# 또는
uv pip install -e .
```

## 실행

```bash
# 직접 실행
python -m summarizer.server

# 또는 스크립트로
summarizer-mcp
```

## Claude Desktop 연동

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "summarizer": {
      "command": "uv",
      "args": [
        "--directory",
        "C:\\path\\to\\daily-miracles-mvp\\mcp-servers\\summarizer-mcp",
        "run",
        "summarizer-mcp"
      ]
    }
  }
}
```

## 테스트

```bash
# MCP Inspector로 테스트
npx @modelcontextprotocol/inspector uv --directory . run summarizer-mcp
```
