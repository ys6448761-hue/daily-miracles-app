"""
도구 정의 모듈

MCP 서버에서 제공하는 도구들을 정의합니다.
"""

from typing import Literal
from pydantic import BaseModel, Field


# === 입력 스키마 정의 ===

class SummarizeInput(BaseModel):
    """요약 도구 입력 스키마"""
    text: str = Field(
        description="요약할 대화 또는 문서 텍스트"
    )
    type: Literal["daily", "weekly", "meeting"] = Field(
        default="daily",
        description="요약 유형: daily(일일), weekly(주간), meeting(회의록)"
    )


class ExtractDecisionsInput(BaseModel):
    """결정 사항 추출 도구 입력 스키마"""
    text: str = Field(
        description="결정 사항을 추출할 대화 텍스트"
    )


# === 프롬프트 템플릿 ===

SUMMARIZE_PROMPTS = {
    "daily": """다음 대화/문서를 일일 요약 형식으로 정리해주세요.

## 형식
### 오늘의 요약
- 핵심 내용 3-5개 bullet point

### 주요 논의 사항
- 논의된 주제별 정리

### 다음 단계
- 후속 작업이나 확인 필요 사항

---
원문:
{text}
""",

    "weekly": """다음 대화/문서를 주간 요약 형식으로 정리해주세요.

## 형식
### 이번 주 하이라이트
- 가장 중요한 성과나 이슈 3개

### 프로젝트별 진행 상황
- 각 프로젝트/업무별 상태

### 다음 주 계획
- 예정된 일정이나 목표

### 주의 사항
- 리스크나 블로커

---
원문:
{text}
""",

    "meeting": """다음 회의 내용을 회의록 형식으로 정리해주세요.

## 형식
### 회의 개요
- 참석자: (파악 가능한 경우)
- 주제:

### 논의 내용
1. [주제1] - 세부 내용
2. [주제2] - 세부 내용

### 결정 사항
- [ ] 결정1
- [ ] 결정2

### Action Items
| 담당자 | 내용 | 기한 |
|--------|------|------|
| - | - | - |

---
원문:
{text}
"""
}

EXTRACT_DECISIONS_PROMPT = """다음 대화에서 결정된 사항들을 추출해주세요.

결정 사항의 기준:
- 명시적으로 "~하기로 했다", "~로 결정", "~하자" 등의 표현
- 합의된 방향이나 선택
- 확정된 일정, 담당자, 방법 등

JSON 형식으로 응답해주세요:
{{
  "decisions": [
    {{
      "id": 1,
      "content": "결정 내용",
      "context": "결정이 내려진 맥락",
      "participants": ["관련자1", "관련자2"]
    }}
  ],
  "total_count": 0
}}

---
원문:
{text}
"""


# === 도구 정의 ===

TOOLS = [
    {
        "name": "summarize",
        "description": """대화나 문서를 요약합니다.

요약 유형:
- daily: 일일 요약 (핵심 내용, 주요 논의, 다음 단계)
- weekly: 주간 요약 (하이라이트, 프로젝트 진행, 다음 주 계획)
- meeting: 회의록 형식 (참석자, 논의 내용, 결정 사항, Action Items)""",
        "inputSchema": SummarizeInput.model_json_schema(),
    },
    {
        "name": "extract_decisions",
        "description": """대화에서 결정된 사항들을 추출합니다.

추출 대상:
- 명시적으로 합의된 결정
- 확정된 일정, 담당자, 방법
- 선택된 옵션이나 방향

JSON 형식으로 결정 사항 목록을 반환합니다.""",
        "inputSchema": ExtractDecisionsInput.model_json_schema(),
    },
]


def get_tool_prompt(tool_name: str, arguments: dict) -> str:
    """도구 이름과 인자를 받아 적절한 프롬프트를 반환합니다."""

    if tool_name == "summarize":
        text = arguments.get("text", "")
        summary_type = arguments.get("type", "daily")
        template = SUMMARIZE_PROMPTS.get(summary_type, SUMMARIZE_PROMPTS["daily"])
        return template.format(text=text)

    elif tool_name == "extract_decisions":
        text = arguments.get("text", "")
        return EXTRACT_DECISIONS_PROMPT.format(text=text)

    else:
        raise ValueError(f"Unknown tool: {tool_name}")
