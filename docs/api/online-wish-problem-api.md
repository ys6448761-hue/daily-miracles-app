# 온라인 문제 해결 소원 API v0.1

> Wix 폼에서 사용자의 고민을 받아 AI 분석 리포트를 생성하는 REST API

---

## 📡 엔드포인트 정보

### 기본 정보
- **URL**: `POST /api/problem/online-wish`
- **Content-Type**: `application/json`
- **인증**: 없음 (향후 API Key 추가 예정)
- **평균 응답 시간**: 20-30초 (GPT-4 분석 포함)

### 프로덕션 URL (예정)
```
https://your-domain.com/api/problem/online-wish
```

---

## 📥 요청 (Request)

### JSON 스키마

```typescript
{
  // 필수 필드
  "nickname": string,          // 사용자 닉네임 (최대 20자)
  "wishSummary": string,       // 고민 요약 (최소 10자, 최대 500자)

  // 선택 필드
  "situation"?: string,        // 구체적 상황 설명 (최대 1000자)
  "tries"?: string,            // 시도해본 것들 (최대 1000자)
  "constraints"?: string,      // 제약사항 (예: "퇴사는 피하고 싶어요")
  "focus"?: string,            // 집중하고 싶은 부분 (예: "당장 할 수 있는 행동")

  // 메타데이터 (선택)
  "email"?: string,            // 이메일 주소 (결과 전송용)
  "wixUserId"?: string         // Wix 사용자 ID
}
```

### 필드 상세 설명

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `nickname` | string | ✅ | 사용자 닉네임 | "달빛고래" |
| `wishSummary` | string | ✅ | 고민 핵심 요약 | "상사가 회의에서 제 의견을 무시하는 게 너무 힘들어요." |
| `situation` | string | ❌ | 구체적 상황 | "스타트업에서 PM으로 일하고 있고..." |
| `tries` | string | ❌ | 시도했던 것 | "한 번은 개인적으로 이야기를 해보려고..." |
| `constraints` | string | ❌ | 제약사항 | "퇴사는 최대한 피하고 싶어요" |
| `focus` | string | ❌ | 원하는 초점 | "지금 당장 제가 어떤 행동을 해보면 좋을지" |
| `email` | string | ❌ | 결과 전송 이메일 | "user@example.com" |
| `wixUserId` | string | ❌ | Wix 사용자 ID | "wix_abc123" |

### 요청 예시

```json
{
  "nickname": "달빛고래",
  "wishSummary": "상사가 회의에서 제 의견을 무시하는 게 너무 힘들어요.",
  "situation": "스타트업에서 PM으로 일하고 있고, 매주 팀 회의에서 제안을 해도 상사가 듣지 않습니다. 이미 2년째인데 상황이 나아지지 않고 있어요.",
  "tries": "한 번은 개인적으로 이야기를 해보려고 했는데 시간이 없다고 하셨어요. 이메일로도 보냈지만 답장이 없었습니다.",
  "constraints": "퇴사는 최대한 피하고 싶어요. 가족 시간은 지키고 싶어요.",
  "focus": "지금 당장 제가 어떤 행동을 해보면 좋을지 알고 싶어요.",
  "email": "user@example.com"
}
```

---

## 📤 응답 (Response)

### 성공 응답 (200 OK)

```typescript
{
  "success": boolean,
  "data": {
    // 기본 정보
    "nickname": string,
    "detectedCategory": string,      // "직장", "관계", "가족" 등
    "categoryName": string,          // "직장/업무", "대인관계" 등

    // 분석 결과
    "analysis": {
      // 1) 핵심 요약
      "summary": string,             // 한 문장 요약 (40자 이내)

      // 2) 문제 분석
      "coreIssue": string,           // 핵심 문제 (100자 이내)
      "emotionalPattern": string,     // 감정 패턴 (100자 이내)
      "rootCause": string,           // 근본 원인 (100자 이내)

      // 3) 인사이트 (3-5개)
      "insights": string[],

      // 4) 선택지 (2-3개)
      "options": [
        {
          "title": string,           // 선택지 제목
          "description": string,      // 상세 설명 (150자 이내)
          "pros": string[],          // 장점 2-3개
          "cons": string[],          // 단점 1-2개
          "difficulty": string       // "쉬움" | "보통" | "어려움"
        }
      ],

      // 5) 다음 행동 (1-3개)
      "nextActions": [
        {
          "action": string,          // 구체적 행동 (명령형)
          "why": string,             // 이유
          "how": string,             // 구체적 방법
          "timeline": string         // "이번 주" | "1개월" | "3개월"
        }
      ],

      // 6) 경고 신호 (있는 경우)
      "warnings": string[]
    },

    // 메타데이터
    "reportId": string,              // "report_1702345678_abc123"
    "timestamp": string,             // ISO 8601 형식
    "processingTime": number         // 밀리초 단위
  }
}
```

### 응답 예시

```json
{
  "success": true,
  "data": {
    "nickname": "달빛고래",
    "detectedCategory": "직장",
    "categoryName": "직장/업무",
    "analysis": {
      "summary": "상사와의 의사소통 패턴 개선이 필요한 상황",
      "coreIssue": "조직 내 영향력 부족과 상사와의 의사소통 단절",
      "emotionalPattern": "무시당하는 느낌과 무력감, 억압된 분노",
      "rootCause": "수직적 조직 문화와 상사의 피드백 부족, 본인의 커뮤니케이션 전략 부재",
      "insights": [
        "상사가 의견을 무시하는 것처럼 보이지만, 실제로는 전달 방식이나 타이밍 문제일 수 있습니다",
        "2년간 지속된 패턴은 단순히 참는 것으로는 해결되지 않으며, 전략적 접근이 필요합니다",
        "퇴사 외에도 조직 내에서 영향력을 키우는 방법들이 있습니다"
      ],
      "options": [
        {
          "title": "선택지 1: 전략적 1:1 미팅 요청",
          "description": "상사의 일정을 고려해 미리 안건을 보내고 정기적인 1:1 미팅을 제안합니다. 회의가 아닌 개인 시간에 집중적으로 소통합니다.",
          "pros": [
            "상사와의 직접 소통 채널 확보",
            "제안이 묻히지 않고 전달됨",
            "관계 개선 가능성"
          ],
          "cons": [
            "상사가 거절할 가능성",
            "준비 시간 필요"
          ],
          "difficulty": "보통"
        },
        {
          "title": "선택지 2: 문서화된 제안서 작성",
          "description": "회의 전에 제안을 구조화된 문서로 미리 공유하고, 의사결정에 필요한 데이터를 함께 제공합니다.",
          "pros": [
            "전문성 어필",
            "회의 시간 효율 증가",
            "기록 남김"
          ],
          "cons": [
            "추가 업무 시간 필요",
            "즉각적인 피드백 어려움"
          ],
          "difficulty": "쉬움"
        },
        {
          "title": "선택지 3: 동료/멘토 통한 간접 영향력",
          "description": "조직 내에서 신뢰받는 동료나 다른 리더를 통해 제안을 전달하거나, 소규모 성공 사례를 먼저 만듭니다.",
          "pros": [
            "우회적이지만 효과적",
            "관계 악화 위험 적음",
            "조직 내 네트워크 강화"
          ],
          "cons": [
            "시간이 오래 걸림",
            "직접적 인정 어려움"
          ],
          "difficulty": "어려움"
        }
      ],
      "nextActions": [
        {
          "action": "이번 주 내로 상사에게 월 1회 정기 1:1 미팅 제안하기",
          "why": "회의 외 개인 소통 채널을 확보하여 제안이 묻히지 않게 하기 위해",
          "how": "이메일로 '업무 정렬을 위한 월 1회 30분 미팅'을 제안하고, 3가지 안건을 미리 공유",
          "timeline": "이번 주"
        },
        {
          "action": "다음 회의 전에 핵심 제안 1페이지 문서 작성하기",
          "why": "구두 제안보다 문서화된 제안이 더 진지하게 받아들여지기 때문",
          "how": "문제-해결책-기대효과-필요자원 구조로 A4 1장 분량 작성",
          "timeline": "2주"
        },
        {
          "action": "조직 내 신뢰하는 선배나 동료와 커피 미팅 가지기",
          "why": "상사와의 소통 전략에 대한 조언을 얻고, 조직 문화를 더 잘 이해하기 위해",
          "how": "점심 식사나 커피 타임에 자연스럽게 고민 공유하고 조언 구하기",
          "timeline": "1개월"
        }
      ],
      "warnings": [
        "2년간 변화가 없었다면, 상사 개인의 문제가 아닌 조직 문화일 수 있음을 인지하세요",
        "6개월~1년 시도 후에도 변화가 없다면 이직 고려가 현실적일 수 있습니다",
        "감정적 소진이 심해지면 전문 상담을 고려하세요"
      ]
    },
    "reportId": "report_1702345678_abc123",
    "timestamp": "2025-12-12T04:12:11.413Z",
    "processingTime": 25900
  }
}
```

---

## ❌ 에러 응답

### 400 Bad Request - 필수 필드 누락

```json
{
  "success": false,
  "error": "nickname과 wishSummary는 필수 입력입니다.",
  "hint": "최소한 닉네임과 고민 요약을 입력해주세요."
}
```

### 500 Internal Server Error - 서버 오류

```json
{
  "success": false,
  "error": "분석 처리 중 오류가 발생했습니다.",
  "message": "OpenAI API 호출 실패",
  "processingTime": 1234
}
```

---

## 🔧 내부 처리 흐름

```
1. 입력 검증 (nickname, wishSummary 필수 체크)
   ↓
2. 카테고리 자동 감지 (detectCategory 함수)
   - wishSummary에서 키워드 추출
   - 10개 카테고리 중 매칭
   ↓
3. Conversation 구조 생성 (buildConversationFromWish)
   - 5단계 질문-답변 구조로 변환
   ↓
4. GPT-4 분석 (analyzeWithClaude)
   - 심리 상담 전문가 역할 프롬프트
   - 구조화된 JSON 응답 생성
   ↓
5. 리포트 ID 생성 및 응답 반환
```

---

## 📋 카테고리 분류 기준

| 카테고리 키 | 카테고리 이름 | 감지 키워드 예시 |
|------------|-------------|----------------|
| `직장` | 직장/업무 | 직장, 회사, 상사, 동료, 팀장, 업무 |
| `관계` | 대인관계 | 친구, 사람, 관계, 지인, 모임 |
| `가족` | 가족 | 부모, 엄마, 아빠, 남편, 아내, 자녀 |
| `연애` | 연애/부부 | 남자친구, 여자친구, 연애, 사랑, 이별 |
| `진로` | 진로/커리어 | 진로, 커리어, 이직, 전직, 창업 |
| `건강` | 건강/심리 | 우울, 불안, 스트레스, 피로, 건강 |
| `재정` | 재정/경제 | 돈, 빚, 대출, 저축, 월급 |
| `학업` | 학업/성적 | 공부, 성적, 시험, 학교 |
| `자존감` | 자존감/정체성 | 자신감, 열등감, 자존감, 정체성 |
| `습관` | 습관/중독 | 게임, 술, 담배, 중독, 습관 |

---

## 🌐 Wix에서 호출 예시

### JavaScript (Wix Velo)

```javascript
import { fetch } from 'wix-fetch';

export async function submitWish() {
  const response = await fetch('https://your-domain.com/api/problem/online-wish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nickname: $w('#nicknameInput').value,
      wishSummary: $w('#wishSummaryInput').value,
      situation: $w('#situationInput').value,
      tries: $w('#triesInput').value,
      constraints: $w('#constraintsInput').value,
      focus: $w('#focusInput').value,
      email: $w('#emailInput').value
    })
  });

  const result = await response.json();

  if (result.success) {
    // 성공: 결과 페이지로 이동
    wixLocation.to(`/wish-result?reportId=${result.data.reportId}`);
  } else {
    // 실패: 에러 메시지 표시
    console.error('분석 실패:', result.error);
  }
}
```

---

## 📊 성능 지표

- **평균 응답 시간**: 20-30초
- **최대 응답 시간**: 45초 (timeout 권장)
- **동시 처리 가능**: 10 req/sec (GPT-4 API 제한에 따름)
- **데이터 크기**: 요청 ~2KB, 응답 ~5-10KB

---

## 🔐 보안 고려사항

### 현재 (v0.1)
- ❌ 인증 없음 (공개 API)
- ✅ CORS 설정 (허용 도메인 관리)
- ✅ 입력 길이 제한 (서버 측)

### 향후 계획 (v0.2+)
- [ ] API Key 인증
- [ ] Rate Limiting (사용자당 하루 3회)
- [ ] 입력 데이터 암호화
- [ ] 민감 정보 필터링

---

## 📞 문의 및 지원

- **개발팀 이메일**: dev@daily-miracles.com
- **API 버전**: v0.1
- **최종 업데이트**: 2025-12-12
- **상태 페이지**: https://status.daily-miracles.com

---

## 변경 이력

### v0.1 (2025-12-12)
- ✅ 초기 버전 출시
- ✅ GPT-4 분석 통합
- ✅ 10개 카테고리 자동 감지
- ✅ 구조화된 리포트 생성
