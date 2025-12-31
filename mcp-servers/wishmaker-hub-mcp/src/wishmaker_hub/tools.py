"""
WishMaker Hub Tools

소원이 통합 관리를 위한 도구 정의
"""

from typing import Any

# 도구 정의
TOOLS = [
    # === 신호등 시스템 ===
    {
        "name": "classify_traffic_light",
        "description": "소원이의 상태를 신호등으로 분류합니다 (GREEN: 정상, YELLOW: 주의, RED: 긴급)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "wish_content": {
                    "type": "string",
                    "description": "소원 내용"
                },
                "responses": {
                    "type": "object",
                    "description": "12질문 응답 데이터"
                },
                "engagement_history": {
                    "type": "array",
                    "description": "최근 참여 이력"
                }
            },
            "required": ["wish_content"]
        }
    },

    # === 가입 퍼널 관리 ===
    {
        "name": "track_signup_funnel",
        "description": "소원이의 가입 퍼널 진행 상태를 추적합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "소원이 ID"
                },
                "current_step": {
                    "type": "string",
                    "enum": ["landing", "form_start", "form_complete", "ack_received", "day1_message", "day7_complete"],
                    "description": "현재 단계"
                }
            },
            "required": ["user_id", "current_step"]
        }
    },
    {
        "name": "get_stuck_users",
        "description": "퍼널에서 멈춘 소원이들을 조회합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "stuck_at_step": {
                    "type": "string",
                    "description": "멈춘 단계 (선택)"
                },
                "min_stuck_hours": {
                    "type": "number",
                    "description": "최소 멈춘 시간 (기본: 24시간)"
                }
            }
        }
    },
    {
        "name": "send_recovery_message",
        "description": "멈춘 소원이에게 복구 메시지를 발송합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "소원이 ID"
                },
                "message_type": {
                    "type": "string",
                    "enum": ["gentle_reminder", "incentive", "urgency", "personal_touch"],
                    "description": "메시지 유형"
                }
            },
            "required": ["user_id", "message_type"]
        }
    },

    # === 메시지 관리 ===
    {
        "name": "get_message_schedule",
        "description": "소원이의 7일 메시지 스케줄을 조회합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "소원이 ID"
                }
            },
            "required": ["user_id"]
        }
    },
    {
        "name": "check_message_health",
        "description": "메시지 발송 건강도를 체크합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "time_range": {
                    "type": "string",
                    "enum": ["today", "week", "month"],
                    "description": "조회 기간"
                }
            }
        }
    },
    {
        "name": "analyze_message_engagement",
        "description": "메시지 참여도를 분석합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "소원이 ID (선택, 없으면 전체)"
                },
                "message_type": {
                    "type": "string",
                    "enum": ["ack", "morning", "evening", "special"],
                    "description": "메시지 유형"
                }
            }
        }
    },

    # === 만족도 & 이탈 예측 ===
    {
        "name": "predict_satisfaction",
        "description": "소원이의 만족도를 예측합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "소원이 ID"
                },
                "include_factors": {
                    "type": "boolean",
                    "description": "영향 요인 포함 여부"
                }
            },
            "required": ["user_id"]
        }
    },
    {
        "name": "detect_churn_risk",
        "description": "이탈 위험 소원이를 감지합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "risk_threshold": {
                    "type": "number",
                    "description": "위험 기준점 (0-1, 기본: 0.7)"
                },
                "include_reasons": {
                    "type": "boolean",
                    "description": "이탈 사유 포함 여부"
                }
            }
        }
    },
    {
        "name": "generate_intervention_plan",
        "description": "이탈 방지를 위한 개입 계획을 생성합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "소원이 ID"
                },
                "churn_risk_score": {
                    "type": "number",
                    "description": "이탈 위험 점수"
                },
                "churn_reasons": {
                    "type": "array",
                    "description": "이탈 사유 목록"
                }
            },
            "required": ["user_id"]
        }
    },

    # === 유료 전환 ===
    {
        "name": "identify_conversion_ready",
        "description": "유료 전환 준비가 된 소원이를 식별합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "min_engagement_score": {
                    "type": "number",
                    "description": "최소 참여 점수 (기본: 70)"
                },
                "exclude_converted": {
                    "type": "boolean",
                    "description": "이미 전환된 사용자 제외 (기본: true)"
                }
            }
        }
    },
    {
        "name": "suggest_conversion_timing",
        "description": "유료 전환 최적 타이밍을 제안합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "소원이 ID"
                }
            },
            "required": ["user_id"]
        }
    },

    # === 대시보드 ===
    {
        "name": "get_daily_metrics",
        "description": "일일 메트릭스를 조회합니다 (인입 수, ACK 성공률, 평균 응답 시간, RED 비율)",
        "inputSchema": {
            "type": "object",
            "properties": {
                "date": {
                    "type": "string",
                    "description": "조회 날짜 (YYYY-MM-DD, 기본: 오늘)"
                }
            }
        }
    },
    {
        "name": "get_traffic_light_summary",
        "description": "신호등별 현황 요약을 조회합니다",
        "inputSchema": {
            "type": "object",
            "properties": {
                "time_range": {
                    "type": "string",
                    "enum": ["today", "week", "month"],
                    "description": "조회 기간"
                }
            }
        }
    }
]


def get_tool_prompt(name: str, arguments: dict[str, Any]) -> str:
    """도구 호출에 대한 프롬프트를 생성합니다."""

    prompts = {
        # === 신호등 시스템 ===
        "classify_traffic_light": lambda args: f"""
## 소원이 신호등 분류

### 분류 기준
- **GREEN (정상)**: 정상 참여, 긍정적 반응
- **YELLOW (주의)**: 참여도 저하, 응답 지연
- **RED (긴급)**: 부정적 신호, 즉각 개입 필요

### 입력 데이터
- 소원 내용: {args.get('wish_content', 'N/A')}
- 12질문 응답: {args.get('responses', 'N/A')}
- 참여 이력: {args.get('engagement_history', 'N/A')}

### 분석 요청
위 데이터를 기반으로 신호등 색상을 분류하고, 분류 사유와 권장 조치를 제시해주세요.

**출력 형식:**
```json
{{
  "traffic_light": "GREEN|YELLOW|RED",
  "confidence": 0.0-1.0,
  "reasons": ["분류 사유 1", "분류 사유 2"],
  "recommended_actions": ["권장 조치 1", "권장 조치 2"]
}}
```
""",

        # === 가입 퍼널 관리 ===
        "track_signup_funnel": lambda args: f"""
## 가입 퍼널 추적

### 현재 상태
- 소원이 ID: {args.get('user_id')}
- 현재 단계: {args.get('current_step')}

### 퍼널 단계 정의
1. landing: 랜딩 페이지 방문
2. form_start: 소원 양식 시작
3. form_complete: 소원 제출 완료
4. ack_received: ACK 메시지 수신
5. day1_message: 1일차 메시지 발송
6. day7_complete: 7일 여정 완료

### 분석 요청
현재 단계 기준으로 다음 단계 전환율 예측과 이탈 위험을 분석해주세요.
""",

        "get_stuck_users": lambda args: f"""
## 멈춘 소원이 조회

### 필터 조건
- 멈춘 단계: {args.get('stuck_at_step', '전체')}
- 최소 멈춘 시간: {args.get('min_stuck_hours', 24)}시간

### 조회 요청
위 조건에 해당하는 소원이 목록과 각각의 멈춘 기간, 마지막 활동을 조회해주세요.

**출력 형식:**
```json
{{
  "stuck_users": [
    {{
      "user_id": "...",
      "stuck_at": "form_start",
      "stuck_hours": 48,
      "last_activity": "2025-01-01T10:00:00Z"
    }}
  ],
  "total_count": 0
}}
```
""",

        "send_recovery_message": lambda args: f"""
## 복구 메시지 발송

### 대상
- 소원이 ID: {args.get('user_id')}
- 메시지 유형: {args.get('message_type')}

### 메시지 유형별 톤
- gentle_reminder: 부드러운 리마인더
- incentive: 혜택/보상 제안
- urgency: 긴급성 강조
- personal_touch: 개인화된 감성 메시지

### 생성 요청
해당 소원이의 상황에 맞는 복구 메시지를 생성하고 발송 시간대를 제안해주세요.
""",

        # === 메시지 관리 ===
        "get_message_schedule": lambda args: f"""
## 7일 메시지 스케줄 조회

### 대상
- 소원이 ID: {args.get('user_id')}

### 조회 항목
- 일자별 아침/저녁 메시지 (14개)
- 발송 상태 (예정/발송완료/실패)
- 수신 확인 여부

**출력 형식:**
```json
{{
  "schedule": [
    {{
      "day": 1,
      "morning": {{"content": "...", "status": "sent", "sent_at": "..."}},
      "evening": {{"content": "...", "status": "pending"}}
    }}
  ],
  "progress": {{"sent": 0, "total": 14, "rate": "0%"}}
}}
```
""",

        "check_message_health": lambda args: f"""
## 메시지 발송 건강도 체크

### 조회 기간
- 기간: {args.get('time_range', 'today')}

### 체크 항목
1. 발송 성공률 (목표: 95%+)
2. 평균 응답 시간 (목표: 10초 이내)
3. 실패 유형별 분포
4. 재시도 현황

**출력 형식:**
```json
{{
  "health_score": 0-100,
  "success_rate": "95%",
  "avg_response_time_ms": 150,
  "failures": {{"count": 0, "by_type": {{}}}},
  "recommendations": []
}}
```
""",

        "analyze_message_engagement": lambda args: f"""
## 메시지 참여도 분석

### 필터
- 소원이 ID: {args.get('user_id', '전체')}
- 메시지 유형: {args.get('message_type', '전체')}

### 분석 항목
1. 열람률 (카카오톡 확인)
2. 반응률 (답장/클릭)
3. 시간대별 열람 패턴
4. 참여도 높은 메시지 특성

**출력 형식:**
```json
{{
  "open_rate": "70%",
  "response_rate": "15%",
  "peak_hours": ["09:00", "20:00"],
  "high_engagement_patterns": []
}}
```
""",

        # === 만족도 & 이탈 예측 ===
        "predict_satisfaction": lambda args: f"""
## 만족도 예측

### 대상
- 소원이 ID: {args.get('user_id')}
- 영향 요인 포함: {args.get('include_factors', False)}

### 예측 모델 입력
- 참여 이력
- 메시지 반응
- 기적지수 변화 추이
- 소원 진행 상태

**출력 형식:**
```json
{{
  "satisfaction_score": 0-100,
  "confidence": 0.0-1.0,
  "factors": {{
    "positive": ["요인1", "요인2"],
    "negative": ["요인3"]
  }},
  "trend": "improving|stable|declining"
}}
```
""",

        "detect_churn_risk": lambda args: f"""
## 이탈 위험 감지

### 필터
- 위험 기준점: {args.get('risk_threshold', 0.7)}
- 이탈 사유 포함: {args.get('include_reasons', True)}

### 이탈 신호
- 메시지 미열람 연속 N일
- 기적지수 하락
- 부정적 반응
- 장기 미활동

**출력 형식:**
```json
{{
  "at_risk_users": [
    {{
      "user_id": "...",
      "risk_score": 0.85,
      "reasons": ["3일 연속 미열람", "기적지수 10점 하락"],
      "last_activity": "2025-01-01"
    }}
  ],
  "total_at_risk": 0
}}
```
""",

        "generate_intervention_plan": lambda args: f"""
## 개입 계획 생성

### 대상
- 소원이 ID: {args.get('user_id')}
- 이탈 위험 점수: {args.get('churn_risk_score', 'N/A')}
- 이탈 사유: {args.get('churn_reasons', [])}

### 개입 전략
1. 즉각 조치 (24시간 내)
2. 단기 조치 (7일 내)
3. 중기 조치 (30일 내)

**출력 형식:**
```json
{{
  "intervention_plan": {{
    "immediate": [
      {{"action": "개인화 메시지 발송", "channel": "카카오톡", "timing": "오늘 저녁"}}
    ],
    "short_term": [],
    "medium_term": []
  }},
  "expected_outcome": "이탈 위험 30% 감소"
}}
```
""",

        # === 유료 전환 ===
        "identify_conversion_ready": lambda args: f"""
## 전환 준비 소원이 식별

### 필터
- 최소 참여 점수: {args.get('min_engagement_score', 70)}
- 기전환자 제외: {args.get('exclude_converted', True)}

### 전환 준비 신호
- 기적지수 80+
- 7일 메시지 완주
- 긍정적 반응 2회+
- 추가 정보 문의

**출력 형식:**
```json
{{
  "conversion_ready": [
    {{
      "user_id": "...",
      "readiness_score": 85,
      "signals": ["7일 완주", "2회 긍정 반응"],
      "recommended_offer": "기본 분석"
    }}
  ],
  "total_count": 0
}}
```
""",

        "suggest_conversion_timing": lambda args: f"""
## 전환 타이밍 제안

### 대상
- 소원이 ID: {args.get('user_id')}

### 분석 항목
- 활동 패턴 (활발한 시간대)
- 참여 추이 (상승/정체/하락)
- 감정 상태 (긍정/중립/부정)
- 외부 요인 (급여일, 주말 등)

**출력 형식:**
```json
{{
  "optimal_timing": {{
    "date": "2025-01-05",
    "time": "20:00",
    "reason": "7일차 완료 직후, 참여도 최고점"
  }},
  "alternative_timings": [],
  "avoid_timings": ["월요일 오전", "급여일 전"]
}}
```
""",

        # === 대시보드 ===
        "get_daily_metrics": lambda args: f"""
## 일일 메트릭스 조회

### 조회 날짜
- 날짜: {args.get('date', '오늘')}

### 핵심 지표 (Aurora 5 UBOS 기준)
| 지표 | 설명 | 목표 |
|------|------|------|
| 인입 수 | 하루 신규 소원 | 10+ |
| ACK 성공률 | 알림톡/SMS 발송 | 95%+ |
| 평균 응답 시간 | ACK 발송까지 | 10초 이내 |
| RED 비율 | 긴급 소원 비율 | 1% 미만 |

**출력 형식:**
```json
{{
  "date": "2025-01-01",
  "metrics": {{
    "total_wishes": 15,
    "ack_success_rate": "96%",
    "avg_response_time_ms": 850,
    "red_ratio": "0.5%"
  }},
  "vs_goal": {{
    "total_wishes": "above",
    "ack_success_rate": "above",
    "avg_response_time_ms": "above",
    "red_ratio": "below"
  }}
}}
```
""",

        "get_traffic_light_summary": lambda args: f"""
## 신호등 현황 요약

### 조회 기간
- 기간: {args.get('time_range', 'today')}

### 집계 항목
- GREEN/YELLOW/RED 각각 수량
- 비율
- 추이 (전일/전주 대비)

**출력 형식:**
```json
{{
  "summary": {{
    "GREEN": {{"count": 45, "ratio": "90%"}},
    "YELLOW": {{"count": 4, "ratio": "8%"}},
    "RED": {{"count": 1, "ratio": "2%"}}
  }},
  "trend": {{
    "GREEN": "+5%",
    "YELLOW": "-3%",
    "RED": "-2%"
  }},
  "total": 50
}}
```
"""
    }

    if name not in prompts:
        raise ValueError(f"Unknown tool: {name}")

    return prompts[name](arguments)
