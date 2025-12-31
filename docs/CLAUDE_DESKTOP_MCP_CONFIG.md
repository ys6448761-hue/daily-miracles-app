# Claude Desktop MCP 서버 설정 가이드

Aurora 5 UBOS의 MCP 서버들을 Claude Desktop에 연동하는 방법입니다.

## 설정 파일 위치

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

## 전체 MCP 서버 설정

아래 내용을 `claude_desktop_config.json`에 추가하세요:

```json
{
  "mcpServers": {
    "wishmaker-hub": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:\\Users\\세진\\OneDrive\\바탕 화면\\daily-miracles-mvp\\mcp-servers\\wishmaker-hub-mcp",
        "wishmaker-hub-mcp"
      ]
    },
    "business-ops": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:\\Users\\세진\\OneDrive\\바탕 화면\\daily-miracles-mvp\\mcp-servers\\business-ops-mcp",
        "business-ops-mcp"
      ]
    },
    "infra-monitor": {
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "C:\\Users\\세진\\OneDrive\\바탕 화면\\daily-miracles-mvp\\mcp-servers\\infra-monitor-mcp",
        "infra-monitor-mcp"
      ]
    }
  }
}
```

## 개별 MCP 서버 설명

### 1. WishMaker Hub (wishmaker-hub)
소원이 통합 관리 시스템

**도구 14개:**
- `classify_traffic_light` - 신호등 분류
- `track_signup_funnel` - 퍼널 추적
- `get_stuck_users` - 멈춘 소원이 조회
- `send_recovery_message` - 복구 메시지
- `get_message_schedule` - 7일 스케줄
- `check_message_health` - 발송 건강도
- `analyze_message_engagement` - 참여도 분석
- `predict_satisfaction` - 만족도 예측
- `detect_churn_risk` - 이탈 위험 감지
- `generate_intervention_plan` - 개입 계획
- `identify_conversion_ready` - 전환 준비 식별
- `suggest_conversion_timing` - 전환 타이밍
- `get_daily_metrics` - 일일 메트릭스
- `get_traffic_light_summary` - 신호등 현황

### 2. Business Ops (business-ops)
비즈니스 운영 시스템

**도구 4개:**
- `get_revenue_realtime` - 실시간 매출
- `detect_payment_anomaly` - 결제 이상 감지
- `get_subscription_health` - 구독 건강도
- `process_refund_auto` - 자동 환불

### 3. Infrastructure Monitor (infra-monitor)
기술 인프라 모니터링

**도구 4개:**
- `check_all_services` - 서비스 헬스 체크
- `get_recent_errors` - 에러 로그 조회
- `check_database_health` - DB 건강도
- `monitor_api_performance` - API 성능

## 사용 예시

Claude Desktop에서 다음과 같이 사용할 수 있습니다:

### 소원이 관리
```
오늘 신호등 현황 보여줘
→ get_traffic_light_summary 호출

이탈 위험 있는 소원이 찾아줘
→ detect_churn_risk 호출
```

### 비즈니스 운영
```
오늘 매출 확인해줘
→ get_revenue_realtime 호출

결제 이상 있는지 체크해줘
→ detect_payment_anomaly 호출
```

### 인프라 모니터링
```
전체 서비스 상태 확인해줘
→ check_all_services 호출

최근 에러 로그 보여줘
→ get_recent_errors 호출
```

## 설치 확인

1. Claude Desktop 재시작
2. 새 대화에서 MCP 서버 목록 확인
3. 도구 호출 테스트

## 문제 해결

### 서버가 로드되지 않을 때
1. uv가 설치되어 있는지 확인: `uv --version`
2. 경로가 정확한지 확인
3. 각 MCP 서버 폴더에서 `uv sync` 실행

### 도구가 보이지 않을 때
1. Claude Desktop 완전 종료 후 재시작
2. 설정 파일 JSON 형식 검증
3. 로그 확인: `%APPDATA%\Claude\logs\`

## 버전

- 문서 버전: 1.0.0
- 작성일: 2026-01-01
- Aurora 5 UBOS
