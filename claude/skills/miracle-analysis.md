---
name: Miracle Analysis
description: 소원이의 12질문 답변을 분석하여 기적지수를 계산하는 스킬
version: 1.0.0
category: analysis
model: sonnet
---

## 개요
사용자(소원이)가 작성한 12가지 질문 답변을 AI가 분석하여:
- 기적지수 (50~100점)
- 5대 지표 점수
- 맞춤 인사이트

를 산출합니다.

## 12가지 질문

| # | 질문 | 분석 대상 |
|---|------|----------|
| 1 | 이름 | 호칭용 |
| 2 | 나이 | 생애주기 |
| 3 | 가장 이루고 싶은 소원 | 목표 명확성 |
| 4 | 소원을 이루면 누구와 나누고 싶은가 | 관계 지향성 |
| 5 | 소원을 위해 지금 하고 있는 것 | 행동 실천력 |
| 6 | 가장 행복했던 순간 | 긍정 기억력 |
| 7 | 가장 힘들었던 순간 | 회복 탄력성 |
| 8 | 힘든 순간을 어떻게 극복했는가 | 대처 능력 |
| 9 | 나를 가장 잘 아는 사람 | 지지 체계 |
| 10 | 나의 장점 3가지 | 자기 인식 |
| 11 | 1년 후 나의 모습 | 미래 비전 |
| 12 | 소원이에게 하고 싶은 말 | 자기 격려 |

## 5대 지표

```yaml
indicators:
  - name: 목표 명확성
    questions: [3, 11]
    weight: 0.25

  - name: 실행력
    questions: [5, 8]
    weight: 0.20

  - name: 회복 탄력성
    questions: [7, 8]
    weight: 0.20

  - name: 관계/지지 체계
    questions: [4, 9]
    weight: 0.20

  - name: 긍정 마인드
    questions: [6, 10, 12]
    weight: 0.15
```

## 기적지수 계산 공식

```javascript
// 각 지표별 점수 (0-100)
const indicatorScores = {
  goalClarity: analyzeGoalClarity(q3, q11),
  execution: analyzeExecution(q5, q8),
  resilience: analyzeResilience(q7, q8),
  support: analyzeSupportSystem(q4, q9),
  positivity: analyzePositivity(q6, q10, q12)
};

// 가중 평균 계산
const weightedSum =
  indicatorScores.goalClarity * 0.25 +
  indicatorScores.execution * 0.20 +
  indicatorScores.resilience * 0.20 +
  indicatorScores.support * 0.20 +
  indicatorScores.positivity * 0.15;

// 50-100 범위로 정규화
const miracleIndex = 50 + (weightedSum * 0.5);
```

## 입력 스키마

```typescript
interface MiracleAnalysisInput {
  answers: {
    q1_name: string;
    q2_age: number;
    q3_wish: string;
    q4_share_with: string;
    q5_current_action: string;
    q6_happiest_moment: string;
    q7_hardest_moment: string;
    q8_overcome_method: string;
    q9_closest_person: string;
    q10_strengths: string;
    q11_future_vision: string;
    q12_message_to_self: string;
  };
  options?: {
    detailed: boolean;  // 상세 분석 여부
    language: 'ko' | 'en';
  };
}
```

## 출력 스키마

```typescript
interface MiracleAnalysisOutput {
  miracleIndex: number;  // 50-100
  indicators: {
    goalClarity: { score: number; insight: string };
    execution: { score: number; insight: string };
    resilience: { score: number; insight: string };
    support: { score: number; insight: string };
    positivity: { score: number; insight: string };
  };
  summary: string;           // 종합 인사이트
  encouragement: string;     // 응원 메시지
  recommendations: string[]; // 추천 행동 3가지
  generatedAt: string;
}
```

## 출력 예시

```markdown
# 🌟 {{name}}님의 기적 분석 결과

## 기적지수: **78점** ⭐⭐⭐⭐

### 5대 지표
| 지표 | 점수 | 상태 |
|-----|------|-----|
| 목표 명확성 | 85 | 🟢 우수 |
| 실행력 | 72 | 🟡 양호 |
| 회복 탄력성 | 80 | 🟢 우수 |
| 관계/지지 체계 | 75 | 🟡 양호 |
| 긍정 마인드 | 78 | 🟡 양호 |

### 💡 인사이트
{{summary}}

### 🎯 추천 행동
1. {{recommendations[0]}}
2. {{recommendations[1]}}
3. {{recommendations[2]}}

### 💪 오늘의 응원
> {{encouragement}}
```

## 사용 예시

```
@miracle-analysis 다음 답변을 분석해줘:
- 소원: 작가가 되고 싶어요
- 현재 하는 것: 매일 30분 글쓰기
...
```

## 연동 서비스

- **7일 응원 메시지**: 기적지수 기반 맞춤 메시지 생성
- **30일 로드맵**: 5대 지표 기반 실천 계획 수립
- **소원항해**: 오프라인 체험 추천
