# 온라인 소원 실현 항해 API 설계안 v0.1

> Wix 폼에서 사용자의 소원과 상황을 받아 맞춤형 실현 계획을 생성하는 API

---

## 📋 목차

1. [개요](#1-개요)
2. [엔드포인트 스펙](#2-엔드포인트-스펙)
3. [내부 처리 로직](#3-내부-처리-로직)
4. [구현 파일 구조](#4-구현-파일-구조)
5. [코드 구현 초안](#5-코드-구현-초안)
6. [AI 분석 통합 설계](#6-ai-분석-통합-설계)

---

## 1. 개요

### 1.1 목적

"문제 해결 소원"이 **현재의 문제**를 다룬다면,
"소원 실현 항해"는 **미래의 목표**를 실현하기 위한 구체적 실행 계획을 제공합니다.

### 1.2 핵심 기능

1. **소원 명확도 분석**: 사용자의 소원이 얼마나 구체적인지 평가
2. **항해 지수 계산**: 5가지 요인으로 실현 가능성 점수화 (50-100점)
3. **기간별 플랜 생성**: 7일/1개월/3개월 중 최적 플랜 추천
4. **실행 가능한 액션 제안**: 오늘부터 시작할 수 있는 구체적 행동

### 1.3 차별점

| 구분 | 문제 해결 소원 | 소원 실현 항해 |
|------|--------------|--------------|
| **초점** | 과거/현재 문제 | 미래 목표 |
| **입력** | 고민, 문제 상황 | 소원, 목표, 제약사항 |
| **출력** | 분석 + 선택지 | 실행 플랜 + 타임라인 |
| **기간** | 즉시~1개월 | 7일~1년 |
| **지수** | 없음 | 항해 지수 (50-100) |

---

## 2. 엔드포인트 스펙

### 2.1 기본 정보

- **URL**: `POST /api/wish-voyage/online-wish`
- **Content-Type**: `application/json`
- **평균 응답 시간**: 25-35초 (AI 분석 포함)

### 2.2 요청 (Request) 스키마

```typescript
{
  // 필수 필드
  "nickname": string,              // 사용자 닉네임
  "wishSummary": string,           // 소원 요약 (예: "1년 뒤에는 글쓰기를 본업으로")

  // 소원 상세
  "importance": number,            // 중요도 1-5 (5가 가장 높음)
  "desiredPeriod": string,         // "7days" | "1month" | "3months" | "1year"

  // 현재 상황
  "currentState": string,          // 현재 상태 설명
  "timeBudget": string,            // "1h_per_week" | "3-5h_per_week" | "10h+_per_week"
  "constraints": string,           // 제약사항 (예: "건강/가족 시간 지키기")

  // 추가 정보 (선택)
  "resources"?: string,            // 가용 자원 (예: "저축 100만원, 노트북")
  "pastAttempts"?: string,         // 과거 시도 경험
  "supportSystem"?: string,        // 지원 시스템 (예: "가족 지지, 친구 응원")

  // 메타데이터 (선택)
  "email"?: string,
  "wixUserId"?: string
}
```

### 2.3 요청 예시

```json
{
  "nickname": "달빛고래",
  "wishSummary": "1년 뒤에는 글 쓰는 일을 본업으로 가져가고 싶어요.",
  "importance": 5,
  "desiredPeriod": "3months",
  "currentState": "지금은 회사 다니면서 주말마다 블로그 글을 쓰고 있어요. 조회수는 한 달에 1만 정도 나옵니다.",
  "timeBudget": "3-5h_per_week",
  "constraints": "건강 문제로 야근은 못하고, 가족 시간은 꼭 지키고 싶어요. 월급은 당장 포기할 수 없어요.",
  "resources": "저축 300만원, 노트북, 블로그 구독자 500명",
  "pastAttempts": "작년에 전자책을 하나 냈는데 20권 팔렸어요.",
  "supportSystem": "남편이 응원해주고, 글쓰기 모임에 속해 있어요.",
  "email": "user@example.com"
}
```

### 2.4 응답 (Response) 스키마

```typescript
{
  "success": boolean,
  "data": {
    // 기본 정보
    "nickname": string,
    "wishSummary": string,

    // 항해 지수 분석
    "voyageIndex": {
      "score": number,             // 50-100 점수
      "level": string,             // "준비항해" | "성장항해" | "순항항해" | "기적항해"
      "factors": {
        "execution": number,       // 실행력 (0-20)
        "readiness": number,       // 준비도 (0-20)
        "wish": number,            // 소원 명확도 (0-20)
        "partner": number,         // 파트너 지원 (0-20)
        "mood": number             // 기분/동기 (0-20)
      }
    },

    // 소원 명확도 분석
    "wishClarityAnalysis": {
      "isSpecific": boolean,       // 구체적인가?
      "hasTimeline": boolean,      // 기한이 있는가?
      "hasMeasurableGoal": boolean, // 측정 가능한가?
      "suggestions": string[]      // 더 명확히 하려면?
    },

    // 추천 플랜
    "recommendedPlan": {
      "period": string,            // "7days" | "1month" | "3months"
      "reason": string,            // 이 플랜을 추천하는 이유
      "feasibility": number        // 실현 가능성 (0-100)
    },

    // 실행 계획
    "actionPlan": {
      // 즉시 시작 (오늘~7일)
      "immediate": [
        {
          "day": number,           // 1일차, 2일차...
          "action": string,
          "why": string,
          "estimatedTime": string,
          "resources": string[]
        }
      ],

      // 단기 목표 (1주~1개월)
      "shortTerm": [
        {
          "week": number,          // 1주차, 2주차...
          "goal": string,
          "actions": string[],
          "milestone": string      // 체크포인트
        }
      ],

      // 중기 목표 (1~3개월, 해당하는 경우)
      "midTerm"?: [
        {
          "month": number,
          "goal": string,
          "expectedOutcome": string
        }
      ]
    },

    // AI 인사이트
    "insights": {
      "strengths": string[],       // 강점 (예: "블로그 구독자 있음")
      "challenges": string[],      // 도전 과제
      "opportunities": string[],   // 기회 요소
      "risks": string[]            // 리스크
    },

    // 체크포인트
    "checkpoints": [
      {
        "day": number,             // 7일, 14일, 30일...
        "what": string,            // 무엇을 확인하나
        "how": string,             // 어떻게 확인하나
        "expected": string         // 기대 결과
      }
    ],

    // 메타데이터
    "reportId": string,
    "timestamp": string,
    "processingTime": number
  }
}
```

### 2.5 응답 예시

```json
{
  "success": true,
  "data": {
    "nickname": "달빛고래",
    "wishSummary": "1년 뒤에는 글 쓰는 일을 본업으로 가져가고 싶어요.",
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
    "wishClarityAnalysis": {
      "isSpecific": true,
      "hasTimeline": true,
      "hasMeasurableGoal": false,
      "suggestions": [
        "구체적인 수입 목표를 정해보세요 (예: 월 300만원)",
        "'글 쓰는 일'의 범위를 좁혀보세요 (작가? 에디터? 블로거?)"
      ]
    },
    "recommendedPlan": {
      "period": "3months",
      "reason": "현재 부업으로 글쓰기 경험이 있고, 3개월이면 본업 전환 가능성을 충분히 테스트할 수 있습니다. 7일은 너무 짧고, 1년은 동기 유지가 어려울 수 있습니다.",
      "feasibility": 75
    },
    "actionPlan": {
      "immediate": [
        {
          "day": 1,
          "action": "글쓰기로 벌 수 있는 수입 채널 3가지 리서치하기",
          "why": "본업으로 전환하려면 수입 구조를 이해해야 합니다",
          "estimatedTime": "2시간",
          "resources": ["노트북", "블로그"]
        },
        {
          "day": 3,
          "action": "지난 3개월 블로그 수익 데이터 분석",
          "why": "현재 수익화 가능성을 객관적으로 파악",
          "estimatedTime": "1시간",
          "resources": ["애드센스 데이터", "엑셀"]
        },
        {
          "day": 5,
          "action": "글쓰기 모임에서 전업 작가 1명 인터뷰",
          "why": "실제 경험담을 통해 현실적 로드맵 확인",
          "estimatedTime": "1시간",
          "resources": ["글쓰기 모임 네트워크"]
        },
        {
          "day": 7,
          "action": "3개월 수입 목표 및 체크포인트 설정",
          "why": "측정 가능한 목표가 있어야 진행 상황을 점검 가능",
          "estimatedTime": "1시간",
          "resources": ["리서치 결과"]
        }
      ],
      "shortTerm": [
        {
          "week": 2,
          "goal": "수익화 채널 1개 테스트 시작",
          "actions": [
            "크몽/탈잉 강의 or 브런치 유료 구독 시작",
            "첫 콘텐츠 업로드",
            "SNS 홍보 시작"
          ],
          "milestone": "첫 수익 1만원 달성 여부"
        },
        {
          "week": 4,
          "goal": "월간 글쓰기 루틴 확립",
          "actions": [
            "주 3회 이상 콘텐츠 발행",
            "독자 피드백 수집 및 분석",
            "글쓰기 모임 정기 참여"
          ],
          "milestone": "블로그 월 조회수 2만 달성"
        },
        {
          "week": 8,
          "goal": "부업 수입 월 30만원 돌파",
          "actions": [
            "수익화 채널 2개로 확장",
            "콘텐츠 재활용 전략 실행",
            "협업 제안 1건 수락"
          ],
          "milestone": "월 수입 30만원 달성"
        },
        {
          "week": 12,
          "goal": "본업 전환 가능성 최종 평가",
          "actions": [
            "3개월 수익 총합 계산",
            "본업 전환 시나리오 3가지 작성",
            "가족과 진지한 대화"
          ],
          "milestone": "GO/NO-GO 결정"
        }
      ],
      "midTerm": [
        {
          "month": 3,
          "goal": "본업 전환 의사결정",
          "expectedOutcome": "월 수입 50만원 이상이면 6개월 뒤 전업 고려, 미달 시 부업 유지하며 재시도"
        }
      ]
    },
    "insights": {
      "strengths": [
        "이미 블로그 구독자 500명 확보 (초기 팬베이스 존재)",
        "과거 전자책 출간 경험 (실행력 증명)",
        "가족의 지지와 글쓰기 모임 (지원 시스템 탄탄)",
        "주 3-5시간 투자 가능 (현실적 시간 확보)"
      ],
      "challenges": [
        "현재 수익 구조 불명확 (월 얼마 버는지 측정 안 됨)",
        "건강/가족 시간 제약으로 올인 불가",
        "월급 의존도가 높아 즉시 전환 어려움"
      ],
      "opportunities": [
        "블로그 조회수 1만/월 → 수익화 잠재력 있음",
        "글쓰기 플랫폼 다양화 (브런치, 유튜브 스크립트 등)",
        "AI 시대 콘텐츠 수요 증가"
      ],
      "risks": [
        "3개월 안에 수익화 실패 시 동기 저하 가능",
        "건강 악화 시 플랜 전체 중단 가능",
        "가족 상황 변화 (육아, 간병 등)"
      ]
    },
    "checkpoints": [
      {
        "day": 7,
        "what": "첫 주 액션 완료 여부",
        "how": "체크리스트 확인 (4개 중 3개 이상 완료?)",
        "expected": "3개 이상 완료 → 계속 진행"
      },
      {
        "day": 30,
        "what": "첫 수익 발생 여부",
        "how": "통장 입금 내역 확인",
        "expected": "1원이라도 수익 발생 → 긍정 신호"
      },
      {
        "day": 60,
        "what": "월 수익 20만원 달성 여부",
        "how": "수익 채널별 합산",
        "expected": "20만원 이상 → 궤도 진입"
      },
      {
        "day": 90,
        "what": "본업 전환 가능성 평가",
        "how": "3개월 평균 월수익 ÷ 필요 최소 월급",
        "expected": "50% 이상 → 전환 고려 시작"
      }
    },
    "reportId": "voyage_1702345678_xyz789",
    "timestamp": "2025-12-12T05:00:00.000Z",
    "processingTime": 28500
  }
}
```

---

## 3. 내부 처리 로직

### 3.1 전체 흐름

```
1. 입력 검증
   ↓
2. 소원 명확도 분석 (AI)
   - 구체성, 측정 가능성, 기한 체크
   ↓
3. 항해 지수 계산 (알고리즘)
   - 5가지 요인 점수화
   - 50-100점 범위로 정규화
   ↓
4. 플랜 기간 결정 (로직)
   - 7일 / 1개월 / 3개월 중 선택
   - desiredPeriod + 실현가능성 고려
   ↓
5. 액션 플랜 생성 (AI)
   - 기간별 구체적 행동 생성
   - SWOT 분석
   ↓
6. 체크포인트 설정
   ↓
7. 응답 반환
```

### 3.2 항해 지수 계산 로직

#### 5가지 요인 정의

| 요인 | 영문 | 점수 범위 | 평가 기준 |
|------|------|----------|----------|
| **실행력** | Execution | 0-20 | 과거 시도 경험, 현재 진행 상황 |
| **준비도** | Readiness | 0-20 | 가용 자원, 시간 예산 |
| **소원 명확도** | Wish Clarity | 0-20 | 구체성, 측정 가능성, 기한 |
| **파트너 지원** | Partner Alignment | 0-20 | 가족/친구 지지, 커뮤니티 |
| **기분/동기** | Mood | 0-20 | 중요도, 열정 수준 |

**최종 점수 = 합산 후 50-100 범위로 클램핑**

#### 점수 구간별 레벨

| 점수 | 레벨 | 의미 |
|------|------|------|
| 90-100 | 🚀 기적항해 | 모든 조건 완벽, 즉시 시작 가능 |
| 80-89 | ⛵ 순항항해 | 조건 양호, 계획대로 진행 가능 |
| 70-79 | 🌱 성장항해 | 보완 필요, 단계적 접근 권장 |
| 50-69 | 🧭 준비항해 | 준비 부족, 기초 다지기 먼저 |

### 3.3 플랜 기간 결정 로직

```javascript
function determinePlanPeriod(desiredPeriod, voyageScore, constraints) {
  // 1순위: 사용자 희망 기간
  if (desiredPeriod === "7days" && voyageScore >= 80) {
    return "7days"; // 고점수면 단기 가능
  }

  // 2순위: 항해 지수 기반
  if (voyageScore >= 85) {
    return "1month";  // 높은 점수 → 빠른 진행
  } else if (voyageScore >= 70) {
    return "3months"; // 중간 점수 → 안정적 진행
  } else {
    return "3months"; // 낮은 점수 → 천천히 기초 다지기
  }
}
```

---

## 4. 구현 파일 구조

### 4.1 새로 생성할 파일

```
daily-miracles-mvp/
├── utils/
│   ├── wishVoyageConverter.js    # 입력 → 내부 구조 변환
│   └── voyageScoreCalculator.js  # 항해 지수 계산 로직
│
├── services/
│   └── voyageAnalysisService.js  # AI 분석 (GPT-4)
│
└── routes/
    └── wishVoyageRoutes.js        # /online-wish 엔드포인트 추가
```

### 4.2 수정할 파일

- `utils/wishVoyageIndex.js` (기존): 확장 필요
- `routes/wishVoyageRoutes.js` (기존): 새 엔드포인트 추가
- `server.js`: 이미 등록됨 (변경 불필요)

---

## 5. 코드 구현 초안

### 5.1 `utils/voyageScoreCalculator.js`

```javascript
/**
 * 항해 지수 계산 로직 (확장 버전)
 */

/**
 * 5가지 요인을 개별 평가하여 항해 지수 계산
 */
function calculateDetailedVoyageIndex(input) {
  const {
    importance,
    timeBudget,
    pastAttempts,
    resources,
    supportSystem,
    wishSummary,
    currentState,
    desiredPeriod
  } = input;

  // 1. 실행력 (Execution) - 0~20점
  const execution = calculateExecution(pastAttempts, currentState);

  // 2. 준비도 (Readiness) - 0~20점
  const readiness = calculateReadiness(timeBudget, resources);

  // 3. 소원 명확도 (Wish Clarity) - 0~20점
  const wish = calculateWishClarity(wishSummary, desiredPeriod);

  // 4. 파트너 지원 (Partner Alignment) - 0~20점
  const partner = calculatePartnerSupport(supportSystem);

  // 5. 기분/동기 (Mood) - 0~20점
  const mood = calculateMood(importance);

  // 총합 (0~100)
  const baseScore = execution + readiness + wish + partner + mood;

  // 50~100 범위로 클램핑
  const score = Math.max(50, Math.min(baseScore, 100));

  // 레벨 결정
  const level = getVoyageLevel(score);

  return {
    score,
    level,
    factors: { execution, readiness, wish, partner, mood }
  };
}

// 실행력 계산
function calculateExecution(pastAttempts, currentState) {
  let score = 10; // 기본 10점

  if (pastAttempts && pastAttempts.length > 20) {
    score += 6; // 과거 시도 경험 있음
  }

  if (currentState && currentState.includes("현재") && currentState.length > 30) {
    score += 4; // 현재 진행 중
  }

  return Math.min(score, 20);
}

// 준비도 계산
function calculateReadiness(timeBudget, resources) {
  let score = 8;

  // 시간 예산
  if (timeBudget === "10h+_per_week") score += 8;
  else if (timeBudget === "3-5h_per_week") score += 5;
  else if (timeBudget === "1h_per_week") score += 2;

  // 자원
  if (resources && resources.length > 20) score += 4;

  return Math.min(score, 20);
}

// 소원 명확도 계산
function calculateWishClarity(wishSummary, desiredPeriod) {
  let score = 8;

  // 구체성
  if (wishSummary.length > 30) score += 4;
  if (wishSummary.includes("년") || wishSummary.includes("개월")) score += 4;

  // 기한
  if (desiredPeriod) score += 4;

  return Math.min(score, 20);
}

// 파트너 지원 계산
function calculatePartnerSupport(supportSystem) {
  let score = 6;

  if (!supportSystem) return score;

  if (supportSystem.includes("가족")) score += 5;
  if (supportSystem.includes("친구") || supportSystem.includes("동료")) score += 3;
  if (supportSystem.includes("모임") || supportSystem.includes("커뮤니티")) score += 6;

  return Math.min(score, 20);
}

// 기분/동기 계산
function calculateMood(importance) {
  return importance * 4; // 1~5 → 4~20점
}

// 레벨 결정
function getVoyageLevel(score) {
  if (score >= 90) return "기적항해";
  if (score >= 80) return "순항항해";
  if (score >= 70) return "성장항해";
  return "준비항해";
}

module.exports = {
  calculateDetailedVoyageIndex
};
```

### 5.2 `utils/wishVoyageConverter.js`

```javascript
/**
 * Wix 입력을 내부 구조로 변환
 */

function convertWixInputToVoyageData(input) {
  const {
    nickname,
    wishSummary,
    importance,
    desiredPeriod,
    currentState,
    timeBudget,
    constraints,
    resources,
    pastAttempts,
    supportSystem
  } = input;

  return {
    nickname,
    wishSummary,
    importance,
    desiredPeriod,
    currentState,
    timeBudget,
    constraints,
    resources,
    pastAttempts,
    supportSystem
  };
}

module.exports = {
  convertWixInputToVoyageData
};
```

### 5.3 `services/voyageAnalysisService.js`

```javascript
/**
 * AI를 활용한 소원 실현 항해 분석
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * AI로 액션 플랜 생성
 */
async function generateVoyageActionPlan({
  nickname,
  wishSummary,
  voyageIndex,
  recommendedPeriod,
  currentState,
  timeBudget,
  constraints,
  resources,
  supportSystem
}) {
  const prompt = buildVoyagePlanPrompt({
    nickname,
    wishSummary,
    voyageIndex,
    recommendedPeriod,
    currentState,
    timeBudget,
    constraints,
    resources,
    supportSystem
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: '당신은 목표 달성 코치이자 실행 계획 전문가입니다. 사용자의 소원을 구체적이고 실행 가능한 계획으로 변환합니다.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 3000
  });

  const rawText = response.choices[0].message.content;
  return parseVoyagePlanResponse(rawText);
}

function buildVoyagePlanPrompt(data) {
  return `
# 소원 실현 항해 계획 요청

**사용자**: ${data.nickname}
**소원**: ${data.wishSummary}
**항해 지수**: ${data.voyageIndex.score}점 (${data.voyageIndex.level})
**추천 기간**: ${data.recommendedPeriod}

## 현재 상황
- 현재 상태: ${data.currentState}
- 시간 예산: ${data.timeBudget}
- 제약사항: ${data.constraints}
- 가용 자원: ${data.resources || '없음'}
- 지원 시스템: ${data.supportSystem || '없음'}

---

다음 형식의 JSON으로 실행 계획을 작성해주세요:

\`\`\`json
{
  "wishClarityAnalysis": {
    "isSpecific": boolean,
    "hasTimeline": boolean,
    "hasMeasurableGoal": boolean,
    "suggestions": ["제안 1", "제안 2"]
  },
  "actionPlan": {
    "immediate": [
      {
        "day": 1,
        "action": "구체적 행동",
        "why": "이유",
        "estimatedTime": "30분",
        "resources": ["필요 자원"]
      }
    ],
    "shortTerm": [
      {
        "week": 1,
        "goal": "주간 목표",
        "actions": ["행동 1", "행동 2"],
        "milestone": "체크포인트"
      }
    ]
  },
  "insights": {
    "strengths": ["강점 1", "강점 2"],
    "challenges": ["도전 1"],
    "opportunities": ["기회 1"],
    "risks": ["리스크 1"]
  },
  "checkpoints": [
    {
      "day": 7,
      "what": "확인할 것",
      "how": "확인 방법",
      "expected": "기대 결과"
    }
  ]
}
\`\`\`

**중요**:
- 실행 가능한 구체적 행동만 제안
- 시간/자원 제약 반영
- 측정 가능한 목표 설정
`;
}

function parseVoyagePlanResponse(rawText) {
  try {
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(rawText);
  } catch (error) {
    console.error('AI 응답 파싱 오류:', error);
    // 기본 응답 반환
    return getDefaultVoyagePlan();
  }
}

function getDefaultVoyagePlan() {
  return {
    wishClarityAnalysis: {
      isSpecific: false,
      hasTimeline: false,
      hasMeasurableGoal: false,
      suggestions: ["소원을 더 구체화해보세요"]
    },
    actionPlan: {
      immediate: [],
      shortTerm: []
    },
    insights: {
      strengths: [],
      challenges: [],
      opportunities: [],
      risks: []
    },
    checkpoints: []
  };
}

module.exports = {
  generateVoyageActionPlan
};
```

### 5.4 `routes/wishVoyageRoutes.js` (엔드포인트 추가)

```javascript
// 기존 코드 유지...

const { calculateDetailedVoyageIndex } = require('../utils/voyageScoreCalculator');
const { convertWixInputToVoyageData } = require('../utils/wishVoyageConverter');
const { generateVoyageActionPlan } = require('../services/voyageAnalysisService');

/**
 * POST /api/wish-voyage/online-wish
 * 온라인 소원 실현 항해 전용 엔드포인트
 */
router.post('/online-wish', async (req, res) => {
  const startTime = Date.now();

  try {
    // 1. 입력 검증
    const { nickname, wishSummary } = req.body;

    if (!nickname || !wishSummary) {
      return res.status(400).json({
        success: false,
        error: 'nickname과 wishSummary는 필수 입력입니다.'
      });
    }

    console.log(`🚢 소원 실현 항해 접수: ${nickname} - ${wishSummary.substring(0, 30)}...`);

    // 2. 입력 변환
    const voyageData = convertWixInputToVoyageData(req.body);

    // 3. 항해 지수 계산
    const voyageIndex = calculateDetailedVoyageIndex(voyageData);
    console.log(`⚓ 항해 지수: ${voyageIndex.score}점 (${voyageIndex.level})`);

    // 4. 추천 플랜 기간 결정
    const recommendedPeriod = determineRecommendedPeriod(
      voyageData.desiredPeriod,
      voyageIndex.score
    );

    // 5. AI 액션 플랜 생성
    console.log('🤖 AI 플랜 생성 시작...');
    const aiPlan = await generateVoyageActionPlan({
      nickname,
      wishSummary,
      voyageIndex,
      recommendedPeriod,
      currentState: voyageData.currentState,
      timeBudget: voyageData.timeBudget,
      constraints: voyageData.constraints,
      resources: voyageData.resources,
      supportSystem: voyageData.supportSystem
    });
    console.log('✅ AI 플랜 생성 완료');

    // 6. 실현 가능성 계산
    const feasibility = calculateFeasibility(voyageIndex.score, aiPlan);

    // 7. 응답 생성
    const response = {
      success: true,
      data: {
        nickname,
        wishSummary,
        voyageIndex,
        wishClarityAnalysis: aiPlan.wishClarityAnalysis,
        recommendedPlan: {
          period: recommendedPeriod,
          reason: getRecommendedPeriodReason(recommendedPeriod, voyageIndex.score),
          feasibility
        },
        actionPlan: aiPlan.actionPlan,
        insights: aiPlan.insights,
        checkpoints: aiPlan.checkpoints,
        reportId: `voyage_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
    };

    console.log(`✅ 항해 계획 생성 완료: ${response.data.reportId} (${response.data.processingTime}ms)`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('💥 소원 실현 항해 처리 오류:', error);

    return res.status(500).json({
      success: false,
      error: '항해 계획 생성 중 오류가 발생했습니다.',
      message: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

// Helper 함수들
function determineRecommendedPeriod(desiredPeriod, voyageScore) {
  if (desiredPeriod === "7days" && voyageScore >= 80) return "7days";
  if (voyageScore >= 85) return "1month";
  if (voyageScore >= 70) return "3months";
  return "3months";
}

function getRecommendedPeriodReason(period, score) {
  if (period === "7days") {
    return "항해 지수가 높아 단기 집중 실행이 효과적입니다.";
  } else if (period === "1month") {
    return "1개월이면 충분한 변화를 만들 수 있습니다.";
  } else {
    return "3개월 동안 단계적으로 접근하는 것이 안정적입니다.";
  }
}

function calculateFeasibility(voyageScore, aiPlan) {
  // 간단한 실현 가능성 계산
  return Math.min(voyageScore + 10, 100);
}

module.exports = router;
```

---

## 6. AI 분석 통합 설계

### 6.1 AI 훅(Hook) 구조

```javascript
// services/voyageAnalysisService.js 내부

/**
 * 확장 가능한 AI 분석 파이프라인
 */
class VoyageAnalysisPipeline {
  constructor() {
    this.hooks = {
      beforeAnalysis: [],
      afterClarityAnalysis: [],
      afterActionPlanGeneration: [],
      beforeResponse: []
    };
  }

  // 훅 등록
  registerHook(hookName, callback) {
    if (this.hooks[hookName]) {
      this.hooks[hookName].push(callback);
    }
  }

  // 훅 실행
  async executeHook(hookName, data) {
    for (const callback of this.hooks[hookName]) {
      data = await callback(data);
    }
    return data;
  }
}
```

### 6.2 확장 예시

향후 Claude API나 다른 AI 모델을 추가하려면:

```javascript
// 예: Claude API 추가
pipeline.registerHook('beforeAnalysis', async (data) => {
  // Claude로 소원 명확도 체크
  const clarityScore = await claudeAPI.checkClarity(data.wishSummary);
  data.clarityScore = clarityScore;
  return data;
});

// 예: 감정 분석 추가
pipeline.registerHook('afterClarityAnalysis', async (data) => {
  const sentiment = await emotionAPI.analyze(data.wishSummary);
  data.emotionalState = sentiment;
  return data;
});
```

---

## 7. 구현 우선순위

### Phase 1: MVP (2주)
- [ ] `voyageScoreCalculator.js` 구현
- [ ] `wishVoyageConverter.js` 구현
- [ ] `/online-wish` 엔드포인트 기본 구조
- [ ] 간단한 AI 플랜 생성 (GPT-4)

### Phase 2: 고도화 (1개월)
- [ ] AI 훅 시스템 구현
- [ ] 소원 명확도 분석 정교화
- [ ] 체크포인트 자동 생성
- [ ] SWOT 분석 추가

### Phase 3: 최적화 (2개월)
- [ ] Claude API 통합 (대안 AI)
- [ ] 플랜 캐싱 (같은 소원 반복 방지)
- [ ] 사용자 피드백 수집 및 반영

---

**작성일**: 2025-12-12
**버전**: v0.1 Draft
**다음 업데이트**: 코드 구현 완료 후 v0.2
