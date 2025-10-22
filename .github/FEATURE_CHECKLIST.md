# 하루하루의 기적 - 필수 기능 체크리스트

> **목적**: 담당자가 바뀌어도 핵심 기능이 누락되지 않도록 Golden Standard 문서화
> **최종 업데이트**: 2025-10-22
> **기준 버전**: v1.0-complete

---

## 📋 배포 전 필수 확인 사항

배포하기 전에 아래 모든 항목이 체크되어야 합니다.

---

## 1️⃣ daily-miracles-result.html 필수 요소

### ✅ 사용자 프로필 섹션
- [ ] **프로필 상세 설명** 표시됨
  - 예시: "이세진님은 노랑색 성향으로 밝은, 낙관적, 창의적인 특성을 보입니다..."
  - 색깔 특성 + 오행 패턴 + 에너지 소스 포함
  - 파란색 배경 박스로 강조 표시

- [ ] **기적지수** 표시됨
  - 숫자 + 프로그레스 바

- [ ] **강점/과제 리스트** 표시됨
  - 각각 최소 2개 이상

- [ ] **경고 신호 섹션** 표시됨

### ✅ 4주 액션플랜 섹션
- [ ] **주차 제목**이 "주차 계획"이 아닌 **실제 주제**로 표시
  - ❌ 잘못된 예: "WEEK1: 주차 계획"
  - ✅ 올바른 예: "WEEK1: 인식과 이해"

- [ ] **각 주차별 체크포인트 3개** 표시됨
  - week1: "고민의 핵심을 명확히 파악했는가?", "나의 성향을 이해하게 되었는가?", "내면의 목소리를 들었는가?"
  - week2, week3, week4: 각각 3개씩

- [ ] **일자 표시가 숫자 형식**으로 표시
  - ❌ 잘못된 예: "월요일, 화요일, 수요일..."
  - ✅ 올바른 예: "Day 1, Day 2, Day 3... Day 30"
  - 1주차: Day 1-7
  - 2주차: Day 8-14
  - 3주차: Day 15-21
  - 4주차: Day 22-30

- [ ] **액션 아이템에 소요시간** 표시됨
  - 예시: "약 10분 정도", "5-10분"

### ✅ 관계 분석 섹션 (관계 질문에 답한 경우)
- [ ] **오행 궁합 상세 설명** 표시됨
  - 예시: "두 분 모두 비슷한 행동 패턴을 보이는 그룹에 속합니다 (같은 패턴 그룹 약 3,200명 분석 기준)..."
  - 통계 정보 포함

- [ ] **색깔 궁합 메시지** 표시됨
  - type + message 형식

---

## 2️⃣ services/analysisEngine.js 필수 반환 값

### ✅ userProfile 객체
```javascript
{
  name: "이세진",
  miracleIndex: 75,
  personality: "차분하고 분석적",
  element: "water",
  colors: ["파란색"],
  description: "이세진님은 파란색 성향으로 차분한, 신뢰할 수 있는, 깊이 있는 특성을 보입니다...", // 🔥 필수!
  strengths: ["분석력", "신중함"],
  challenges: ["완벽주의", "결정 지연"]
}
```

### ✅ actionPlan 객체
```javascript
{
  week1: {
    title: "인식과 이해",        // 🔥 theme이 아닌 title!
    goal: "고민의 본질 파악",    // 🔥 focus가 아닌 goal!
    checkpoints: [              // 🔥 필수! 3개
      "고민의 핵심을 명확히 파악했는가?",
      "나의 성향을 이해하게 되었는가?",
      "내면의 목소리를 들었는가?"
    ],
    actions: [
      {
        day: 1,                 // 🔥 숫자! '월요일' 아님
        task: "현재 고민을 노트에 상세히 기록하기",
        time: "약 10분 정도"    // 🔥 duration이 아닌 time!
      },
      // ... Day 2-7
    ]
  },
  week2: { /* 동일 구조 */ },
  week3: { /* 동일 구조 */ },
  week4: { /* 동일 구조 */ }
}
```

### ✅ relationshipAnalysis 객체
```javascript
{
  elementCompatibility: {
    type: "동일 패턴",
    score: 60,
    description: "같은 속성으로 이해하기 쉬우나 변화가 필요합니다",
    detailedDescription: "두 분 모두 비슷한 행동 패턴을 보이는 그룹에 속합니다 (같은 패턴 그룹 약 3,200명 분석 기준)..." // 🔥 필수!
  },
  colorCompatibility: {
    type: "보색 관계",
    message: "서로 다른 색깔 성향으로..." // 🔥 필수!
  }
}
```

### ✅ consulting8Steps 객체
- [ ] step1 ~ step8 모두 존재
- [ ] 각 step에 title, content, actionItems 포함

### ✅ warningSignals 배열
- [ ] 최소 2개 이상의 경고 신호

---

## 3️⃣ 필드 매핑 규칙 (중요!)

프론트엔드는 서버 응답 필드를 다음과 같이 해석합니다:

| 서버 필드 | 프론트엔드 사용 | 폴백(fallback) |
|----------|--------------|--------------|
| `week.title` | 주차 제목 | `week.theme` → "주차 계획" |
| `week.goal` | 주차 목표 | `week.focus` → "" |
| `action.time` | 소요 시간 | `action.duration` → "" |
| `action.day` | 일자 (숫자) | 없으면 에러 |
| `elemCompat.detailedDescription` | 상세 설명 | `description` |
| `colorCompat.message` | 궁합 메시지 | 없으면 빈 문자열 |

**⚠️ 주의**: 서버에서 `theme`, `focus`, `duration` 대신 `title`, `goal`, `time`을 사용해야 합니다!

---

## 4️⃣ 검증 방법

### 자동 검증 (TODO: 스크립트 작성 예정)
```bash
npm run validate-features
```

### 수동 검증 (3분 소요)
1. https://daily-miracles-app.onrender.com/daily-miracles.html 접속
2. 테스트 데이터 입력:
   - 이름: 테스트
   - 생년월일: 1990-01-01
   - 현재 고민: 테스트 고민
   - Q1: 빨강색 선택
   - Q2-Q5: 아무거나 선택
   - Q6: 혼자만의 문제 선택
3. 결과 페이지에서 확인:
   - ✅ "테스트님은 빨강색 성향으로 열정적..." 문구 있음
   - ✅ "WEEK1: 인식과 이해" (주차 계획 ❌)
   - ✅ 체크포인트 3개 표시됨
   - ✅ "Day 1, Day 2..." 형식 (월요일 ❌)

---

## 5️⃣ 문제 발생 시

### 증상: "알 수 없음"만 표시됨
**원인**: `transformApiResponse()` 함수가 데이터를 제대로 추출하지 못함

**해결**:
```javascript
// daily-miracles-result.html의 transformApiResponse 함수 확인
const result = {
  userProfile: data.story.userProfile || {},        // ✅ 올바름
  consulting: data.story.consulting8Steps || {},    // ✅ 올바름
  actionPlan: data.story.actionPlan || {},          // ✅ 올바름
  // ...
};
```

### 증상: "주차 계획"으로만 표시됨
**원인**: 서버에서 `title` 대신 `theme`을 보내고 있음

**해결**:
- `services/analysisEngine.js` 확인
- actionPlan 생성 시 `title`, `goal`, `time` 사용

### 증상: 체크포인트가 안 보임
**원인**: `checkpoints` 배열이 비어있거나 없음

**해결**:
- `services/analysisEngine.js`의 각 week 객체에 `checkpoints: [...]` 추가

### 증상: "월요일, 화요일"로 표시됨
**원인**: `action.day`가 숫자가 아닌 문자열

**해결**:
- `action.day`를 1, 2, 3... 30으로 설정 (1주차: 1-7, 2주차: 8-14 등)

---

## 6️⃣ Git 태그 활용

현재 완전한 버전은 `v1.0-complete` 태그로 표시되어 있습니다.

### 혼선 발생 시 비교
```bash
# 현재 코드와 완전한 버전 비교
git diff v1.0-complete services/analysisEngine.js
git diff v1.0-complete public/daily-miracles-result.html

# 완전한 버전으로 복원
git checkout v1.0-complete -- services/analysisEngine.js
```

---

## 📞 문의

체크리스트 항목 중 불명확한 부분이 있으면:
- 코미(총괄)에게 문의
- 이 문서 업데이트 요청

---

**마지막 점검일**: 2025-10-22
**점검자**: 코드 (Claude Code)
**상태**: ✅ 모든 항목 통과
