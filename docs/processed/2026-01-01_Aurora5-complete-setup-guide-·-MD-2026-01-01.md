---
id: DOC-20260101-MKI
type: document
project: aurora5
priority: P0
topic: 소원
tags: [소원, aurora, 결제, 자동화]
owner: team
status: active
created_at: 2026-01-01
source:
  - raw/conversations/2025-12/Aurora5 complete setup guide · MD_2026-01-01.md
---

# � Aurora 5 UBOS - 완전 점검 및 설정 가이드

> **가공일:** 2026-01-04
> **원본:** raw/conversations/2025-12/Aurora5 complete setup guide · MD_2026-01-01.md
> **작성자:** 일

---

## 요약

12. 설치 상태 확인

```bash
 WishMaker Hub
cd mcpservers/wishmakerhubmcp
uv run wishmakerhubmcp help
cd ../..

 Business Ops
cd mcpservers/businessopsmcp
uv run businessopsmcp help
cd ../..

 I...

---

## 액션 아이템

| # | 내용 | 상태 | 담당 |
|---|------|------|------|
| 1 | 3개 MCP 서버 폴더 존재 | ⬜ | - |
| 2 | 각각 pyproject.toml 있음 | ⬜ | - |
| 3 | 각각 src/ 폴더에 server.py, tools.py 있음 | ⬜ | - |
| 4 | WishMaker Hub 실행됨 | ⬜ | - |
| 5 | Business Ops 실행됨 | ⬜ | - |
| 6 | Infra Monitor 실행됨 | ⬜ | - |
| 7 | .env 파일 생성됨 | ⬜ | - |
| 8 | DATABASE_URL 설정됨 | ⬜ | - |
| 9 | APP_URL, API_URL 설정됨 | ⬜ | - |
| 10 | (선택) API 키 설정됨 | ⬜ | - |

## 핵심 인사이트

1. STEP 2: 각 도구가 뭘 하는지 파악 (10분)

---

*자동 가공: 2026-01-04T08:41:43.240Z*
