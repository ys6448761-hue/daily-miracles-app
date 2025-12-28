---
name: 소원실현 항해
description: 미래 목표를 위한 단계별 실행 계획을 제시하는 AI 서비스
category: online
status: active
wix_page: https://daily-miracles.wixsite.com/voyage-wish
api_endpoint: POST /api/wish-voyage/online-wish
---

## 개요

**소원실현 항해**는 미래 목표를 실현하기 위한 구체적인 실행 계획을 제공하는 서비스입니다.
항해 지수(50-100점)를 계산하고, 7일/1개월/3개월 기간별 플랜을 생성합니다.

"문제해결 소원"이 **과거/현재 문제**를 다룬다면,
"소원실현 항해"는 **미래 목표**를 다룹니다.

## 대상

- 구체적인 목표가 있는 분
- 실행 계획이 필요한 분
- 동기부여와 체크포인트가 필요한 분
- 커리어 전환, 자기계발 목표가 있는 분

## 흐름

1. **소원 입력** - 이루고 싶은 목표 작성
2. **중요도 선택** - 1~5점 중요도
3. **희망 기간** - 7일/1개월/3개월/1년
4. **현재 상황** - 현재 상태 설명
5. **시간 예산** - 주당 투자 가능 시간
6. **제약사항** - 지켜야 할 것들
7. **항해 지수 계산** - 5가지 요인 분석
8. **액션 플랜 생성** - 기간별 구체적 계획

## 입력

```json
{
  "nickname": "달빛고래",
  "wishSummary": "글쓰기를 본업으로 가져가고 싶어요",
  "importance": 5,
  "desiredPeriod": "3months",
  "currentState": "회사 다니면서 주말마다 블로그...",
  "timeBudget": "3-5h_per_week",
  "constraints": "건강/가족 시간 지키기",
  "resources": "저축 300만원, 블로그 구독자 500명",
  "supportSystem": "남편 응원, 글쓰기 모임"
}
```

## 출력

```json
{
  "voyageIndex": {
    "score": 72,
    "level": "성장항해",
    "factors": {
      "execution": 16,
      "readiness": 14,
      "wish": 18,
      "partner": 12,
      "mood": 12
    }
  },
  "recommendedPlan": {
    "period": "3months",
    "feasibility": 75
  },
  "actionPlan": {
    "immediate": [...],
    "shortTerm": [...],
    "midTerm": [...]
  },
  "insights": {
    "strengths": [...],
    "challenges": [...],
    "opportunities": [...],
    "risks": [...]
  },
  "checkpoints": [...]
}
```

## 항해 지수 (Voyage Index)

| 점수 | 레벨 | 의미 |
|------|------|------|
| 90-100 | 🚀 기적항해 | 모든 조건 완벽, 즉시 시작 가능 |
| 80-89 | ⛵ 순항항해 | 조건 양호, 계획대로 진행 가능 |
| 70-79 | 🌱 성장항해 | 보완 필요, 단계적 접근 권장 |
| 50-69 | 🧭 준비항해 | 준비 부족, 기초 다지기 먼저 |

## 5가지 요인

| 요인 | 영문 | 점수 | 평가 기준 |
|------|------|------|----------|
| 실행력 | Execution | 0-20 | 과거 시도 경험 |
| 준비도 | Readiness | 0-20 | 가용 자원, 시간 |
| 소원 명확도 | Wish | 0-20 | 구체성, 측정 가능성 |
| 파트너 지원 | Partner | 0-20 | 가족/커뮤니티 지지 |
| 동기 | Mood | 0-20 | 중요도, 열정 |

## 가격

| 티어 | 가격 | 포함 |
|------|------|------|
| 무료 | $0 | 1회 분석, 기본 플랜 |
| 프리미엄 | $9.99/월 | 무제한, 상세 플랜, 30일 체크인 |

## 연동 서비스

- → `problem-solving.md` (문제해결과 선택 가능)
- → `roadmap-generator` (30일 PDF 로드맵)
- → `message-dispatcher` (체크포인트 알림)
