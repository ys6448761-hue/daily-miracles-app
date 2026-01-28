# 역순 프롬프트 전략 프레임워크

> 메시지/콘텐츠 품질을 획기적으로 향상시키는 프레임워크 라이브러리

---

## 핵심 개념: 역순 전략

```
【기존 방식】 ❌ 평범한 결과
페르소나 설정 → 이론 주입 → 결과 요청
→ 교과서적이고 진부한 답변

【역순 전략】 ✅ 날카로운 결과
초안 먼저 생성 → 프레임워크 입력 → 분석+보완 요청
→ 심리적 자극이 담긴 날카로운 콘텐츠
```

---

## 프레임워크 목록

| 파일 | 설명 | 활용 |
|------|------|------|
| `stick-principles.json` | 스틱(Made to Stick) 6원칙 | 기억에 남는 메시지 |
| `story-designer-templates.json` | 스토리 설계자 템플릿 | 마케팅 카피 |
| `hook-patterns.json` | 검증된 후크 패턴 | 오프닝 최적화 |
| `success-cases.json` | 성공 콘텐츠 패턴 | 메시지 유형별 가이드 |

---

## 사용법

### 1. 기본 사용 (utils/reverseOrderPrompt.js)

```javascript
const { prepareReverseOrderChain, buildEncouragementContext } = require('./utils/reverseOrderPrompt');

// 컨텍스트 생성
const context = buildEncouragementContext({
  name: '홍길동',
  concern: '매일 반복되는 일상에 지침',
  ageGroup: '30대'
}, 3);  // Day 3

// 역순 체인 준비
const chain = prepareReverseOrderChain(context, 'stick-principles');

// Step 1: 초안 생성 프롬프트
console.log(chain.step1_draftPrompt);
// → LLM에 전달하여 초안 5개 생성

// Step 2: 분석 프롬프트 (초안 결과와 함께)
const analysisPrompt = chain.step2_analysisPromptBuilder(draftsFromStep1);
// → LLM에 전달하여 분석 및 최종본 생성
```

### 2. 복수 프레임워크 적용

```javascript
const { buildMultiFrameworkAnalysisPrompt } = require('./utils/reverseOrderPrompt');

const prompt = buildMultiFrameworkAnalysisPrompt(
  drafts,
  ['stick-principles', 'hook-patterns']
);
```

### 3. 금지어 체크

```javascript
const { checkForbiddenWords } = require('./utils/reverseOrderPrompt');

const result = checkForbiddenWords('오늘 운세가 좋아요');
// { passed: false, violations: [{ word: '운세', ... }] }
```

---

## 스틱 6원칙 요약

| 원칙 | 영문 | 핵심 |
|------|------|------|
| 단순성 | Simple | 핵심만 남기고 모두 제거 |
| 의외성 | Unexpected | 예상을 깨는 반전 |
| 구체성 | Concrete | 숫자, 감각, 사례로 |
| 신뢰성 | Credible | 직접 확인 가능하게 |
| 감정 | Emotional | 논리보다 감정에 호소 |
| 스토리 | Stories | 이야기 구조로 전달 |

---

## 품질 비교 예시

### 기존 방식 (Day 3)

```
오늘도 화이팅하세요!
당신은 할 수 있어요.
작은 것부터 시작해보세요.
```

**점수: 6/10**
- 진부한 표현
- 구체성 부족
- 감정 자극 약함

### 역순 전략 (Day 3)

```
이 글을 읽는 5초 동안,
당신의 심장은 5번 뛰었습니다.

그 심장 박동 하나하나가
당신의 소원을 향해 나아가고 있어요.

오늘 할 수 있는 가장 작은 한 걸음,
뭐가 있을까요?
```

**점수: 9/10**
- 충격 후크 (심장 박동 카운팅)
- 자기 관련성 (실시간 연결)
- 구체적 행동 촉구

**개선율: +50%**

---

## 적용 프로세스

```
1. 소원이 데이터 수집
        ↓
2. buildEncouragementContext()로 컨텍스트 생성
        ↓
3. prepareReverseOrderChain()으로 체인 준비
        ↓
4. Step 1 프롬프트로 초안 5개 생성 (LLM)
        ↓
5. Step 2 분석 프롬프트로 최종본 생성 (LLM)
        ↓
6. checkForbiddenWords()로 금지어 검사
        ↓
7. 최종 메시지 발송
```

---

## 관련 파일

- `utils/reverseOrderPrompt.js` - 핵심 로직
- `skills/design-system/forbidden-words.json` - 금지어 목록
- `skills/design-system/brand-voice.md` - 톤앤매너 가이드

---

*마지막 업데이트: 2025-01-29*
