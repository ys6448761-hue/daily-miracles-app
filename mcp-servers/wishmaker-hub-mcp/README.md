# WishMaker Hub MCP Server

Aurora 5 UBOS의 핵심 시스템 - 소원이 통합 관리

## 기능

### 1. 신호등 시스템
- `classify_traffic_light`: 소원이 상태를 GREEN/YELLOW/RED로 분류

### 2. 가입 퍼널 관리
- `track_signup_funnel`: 퍼널 진행 상태 추적
- `get_stuck_users`: 멈춘 소원이 조회
- `send_recovery_message`: 복구 메시지 발송

### 3. 메시지 관리
- `get_message_schedule`: 7일 메시지 스케줄 조회
- `check_message_health`: 발송 건강도 체크
- `analyze_message_engagement`: 참여도 분석

### 4. 만족도 & 이탈 예측
- `predict_satisfaction`: 만족도 예측
- `detect_churn_risk`: 이탈 위험 감지
- `generate_intervention_plan`: 개입 계획 생성

### 5. 유료 전환
- `identify_conversion_ready`: 전환 준비 소원이 식별
- `suggest_conversion_timing`: 최적 전환 타이밍 제안

### 6. 대시보드
- `get_daily_metrics`: 일일 메트릭스 조회
- `get_traffic_light_summary`: 신호등 현황 요약

## 설치

```bash
cd mcp-servers/wishmaker-hub-mcp
uv venv
uv pip install -e .
```

## 실행

```bash
wishmaker-hub-mcp
```

## Claude Code 연동

`.claude/settings.json`:

```json
{
  "mcpServers": {
    "wishmaker-hub": {
      "command": "uv",
      "args": ["run", "--directory", "./mcp-servers/wishmaker-hub-mcp", "wishmaker-hub-mcp"]
    }
  }
}
```

## 버전

- v0.1.0: 초기 릴리스 (2025-01-01)
