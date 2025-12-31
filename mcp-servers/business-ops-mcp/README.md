# Business Ops MCP Server

Aurora 5 UBOS의 비즈니스 운영 시스템

## 기능

### 1. 실시간 매출 (get_revenue_realtime)
- 오늘/이번 주/이번 달 매출 조회
- 결제 수단별, 플랜별 분류
- 전일/전주 대비 비교

### 2. 결제 이상 감지 (detect_payment_anomaly)
- 실패율 급증 알림
- 금액/빈도 이상 패턴 감지
- 최근 1시간 vs 24시간 평균 비교

### 3. 구독 건강도 (get_subscription_health)
- 이탈률, 갱신률, LTV 계산
- 코호트별 분석 지원
- 예측 기능 (선택)

### 4. 자동 환불 (process_refund_auto)
- 7일 이내 자동 환불 처리
- Toss API 연동
- DB 상태 업데이트

## 수익 구조 (Aurora 5 UBOS)

| 단계 | 가격 | 전환율 목표 |
|------|------|-------------|
| 무료 체험 | 0원 | 100% |
| 기본 분석 | 5,000원 | 30% |
| 프리미엄 | 15,000원 | 10% |
| 소원항해 | 35,000원 | 5% |

## 설치

```bash
cd mcp-servers/business-ops-mcp
uv venv
uv pip install -e . --link-mode copy
```

## 환경 변수

```bash
# .env 파일
DATABASE_URL=postgresql://user:pass@host:5432/dbname
TOSS_SECRET_KEY=test_sk_xxx
```

## 실행

```bash
business-ops-mcp
```

## Claude Code 연동

`.claude/settings.json`:

```json
{
  "mcpServers": {
    "business-ops": {
      "command": "uv",
      "args": ["run", "--directory", "./mcp-servers/business-ops-mcp", "business-ops-mcp"]
    }
  }
}
```

## 버전

- v0.1.0: 초기 릴리스 (2026-01-01)
