"""
Miracle MCP 도구 정의

3가지 핵심 도구:
1. calculate_miracle_index: 기적지수 계산
2. generate_roadmap: 30일 로드맵 생성
3. get_daily_message: 7일 응원 메시지 조회
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field
import json
from datetime import datetime, timedelta


# ===== 입력 스키마 정의 =====

class MiracleIndexInput(BaseModel):
    """기적지수 계산 입력 스키마"""
    q1_name: str = Field(description="이름")
    q2_age: int = Field(description="나이")
    q3_wish: str = Field(description="가장 이루고 싶은 소원")
    q4_share_with: str = Field(description="소원을 이루면 누구와 나누고 싶은가")
    q5_current_action: str = Field(description="소원을 위해 지금 하고 있는 것")
    q6_happiest_moment: str = Field(description="가장 행복했던 순간")
    q7_hardest_moment: str = Field(description="가장 힘들었던 순간")
    q8_overcome_method: str = Field(description="힘든 순간을 어떻게 극복했는가")
    q9_closest_person: str = Field(description="나를 가장 잘 아는 사람")
    q10_strengths: str = Field(description="나의 장점 3가지")
    q11_future_vision: str = Field(description="1년 후 나의 모습")
    q12_message_to_self: str = Field(description="소원이에게 하고 싶은 말")


class RoadmapInput(BaseModel):
    """30일 로드맵 생성 입력 스키마"""
    name: str = Field(description="소원이 이름")
    miracle_index: int = Field(description="기적지수 (50-100)")
    wish: str = Field(description="소원 내용")
    indicators: dict = Field(description="5대 지표 점수")


class DailyMessageInput(BaseModel):
    """7일 응원 메시지 조회 입력 스키마"""
    name: str = Field(description="소원이 이름")
    day: int = Field(description="메시지 날짜 (1-7)", ge=1, le=7)
    miracle_index: int = Field(description="기적지수 (50-100)")
    wish: str = Field(description="소원 내용")


# ===== 프롬프트 템플릿 =====

MIRACLE_INDEX_PROMPT = """당신은 기적지수 분석 전문가입니다.

다음 12가지 질문 답변을 분석하여 기적지수(50-100점)와 5대 지표를 산출해주세요.

## 12질문 답변
1. 이름: {q1_name}
2. 나이: {q2_age}
3. 소원: {q3_wish}
4. 나누고 싶은 사람: {q4_share_with}
5. 현재 하는 것: {q5_current_action}
6. 행복했던 순간: {q6_happiest_moment}
7. 힘들었던 순간: {q7_hardest_moment}
8. 극복 방법: {q8_overcome_method}
9. 가까운 사람: {q9_closest_person}
10. 장점: {q10_strengths}
11. 1년 후 모습: {q11_future_vision}
12. 자신에게 한마디: {q12_message_to_self}

## 5대 지표 분석 기준
- 목표 명확성 (25%): 질문 3, 11 기반
- 실행력 (20%): 질문 5, 8 기반
- 회복 탄력성 (20%): 질문 7, 8 기반
- 관계/지지 체계 (20%): 질문 4, 9 기반
- 긍정 마인드 (15%): 질문 6, 10, 12 기반

## 출력 형식 (JSON)
{{
  "name": "{q1_name}",
  "miracleIndex": 75,
  "indicators": {{
    "goalClarity": {{ "score": 80, "insight": "..." }},
    "execution": {{ "score": 70, "insight": "..." }},
    "resilience": {{ "score": 75, "insight": "..." }},
    "support": {{ "score": 72, "insight": "..." }},
    "positivity": {{ "score": 78, "insight": "..." }}
  }},
  "summary": "종합 분석 2-3문장",
  "encouragement": "응원 메시지",
  "recommendations": ["추천1", "추천2", "추천3"]
}}
"""

ROADMAP_PROMPT = """당신은 30일 로드맵 설계 전문가입니다.

다음 정보를 바탕으로 {name}님의 30일 실천 로드맵을 생성해주세요.

## 입력 정보
- 이름: {name}
- 기적지수: {miracle_index}점
- 소원: {wish}
- 5대 지표:
{indicators_text}

## 로드맵 설계 원칙
1. 주차별 테마 설정 (Week 1-4)
2. 약한 지표 집중 강화
3. 작고 실천 가능한 미션
4. 점진적 난이도 상승

## 출력 형식 (JSON)
{{
  "name": "{name}",
  "totalDays": 30,
  "weeks": [
    {{
      "week": 1,
      "theme": "주제",
      "focus": "집중 지표",
      "days": [
        {{ "day": 1, "mission": "미션 내용", "duration": "10분" }},
        ...
      ]
    }},
    ...
  ],
  "milestones": [
    {{ "day": 7, "title": "첫 주 완료!", "reward": "..." }},
    ...
  ]
}}
"""

DAILY_MESSAGE_PROMPT = """당신은 응원 메시지 작가입니다.

다음 정보를 바탕으로 {day}일차 응원 메시지를 생성해주세요.

## 입력 정보
- 이름: {name}
- 기적지수: {miracle_index}점
- 소원: {wish}
- 현재 날짜: {day}일차 (7일 중)

## 메시지 작성 원칙
1. 이름을 포함한 개인화
2. 소원과 연결된 격려
3. 날짜별 톤 변화:
   - Day 1: 시작의 설렘
   - Day 2-3: 작은 성공 축하
   - Day 4: 중간 점검, 격려
   - Day 5-6: 끈기 응원
   - Day 7: 완주 축하, 다음 단계 안내
4. 50-100자 내외

## 출력 형식 (JSON)
{{
  "day": {day},
  "morning": "아침 메시지 (08:00)",
  "evening": "저녁 메시지 (20:00)",
  "emoji": "대표 이모지"
}}
"""


# ===== 도구 정의 =====

TOOLS = [
    {
        "name": "calculate_miracle_index",
        "description": """12가지 질문 답변을 분석하여 기적지수(50-100점)를 계산합니다.

출력:
- miracleIndex: 종합 점수 (50-100)
- 5대 지표: 목표 명확성, 실행력, 회복 탄력성, 관계/지지체계, 긍정 마인드
- 맞춤 인사이트 및 추천 행동 3가지""",
        "inputSchema": MiracleIndexInput.model_json_schema(),
    },
    {
        "name": "generate_roadmap",
        "description": """기적지수 분석 결과를 바탕으로 30일 맞춤 로드맵을 생성합니다.

출력:
- 4주 주차별 테마
- 일별 미션 (30개)
- 주간 마일스톤 4개""",
        "inputSchema": RoadmapInput.model_json_schema(),
    },
    {
        "name": "get_daily_message",
        "description": """7일 응원 메시지 중 해당 날짜의 아침/저녁 메시지를 생성합니다.

출력:
- 아침 메시지 (08:00 발송용)
- 저녁 메시지 (20:00 발송용)
- 대표 이모지""",
        "inputSchema": DailyMessageInput.model_json_schema(),
    },
]


def get_tool_prompt(tool_name: str, arguments: dict) -> str:
    """도구 이름과 인자를 받아 적절한 프롬프트를 반환합니다."""

    if tool_name == "calculate_miracle_index":
        return MIRACLE_INDEX_PROMPT.format(**arguments)

    elif tool_name == "generate_roadmap":
        # 지표 텍스트 포맷팅
        indicators = arguments.get("indicators", {})
        indicators_text = "\n".join([
            f"  - {k}: {v}" for k, v in indicators.items()
        ])
        return ROADMAP_PROMPT.format(
            name=arguments.get("name", ""),
            miracle_index=arguments.get("miracle_index", 0),
            wish=arguments.get("wish", ""),
            indicators_text=indicators_text
        )

    elif tool_name == "get_daily_message":
        return DAILY_MESSAGE_PROMPT.format(
            name=arguments.get("name", ""),
            day=arguments.get("day", 1),
            miracle_index=arguments.get("miracle_index", 0),
            wish=arguments.get("wish", "")
        )

    else:
        raise ValueError(f"Unknown tool: {tool_name}")
