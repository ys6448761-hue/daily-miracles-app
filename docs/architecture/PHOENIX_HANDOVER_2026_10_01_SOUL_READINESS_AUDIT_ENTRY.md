# Project Phoenix — Handover: SOUL Readiness Audit Entry State
# 2026-10-01

생성일: 2026-10-01  
상태: ACTIVE HANDOVER — HOLD until Readiness Audit  
이전 핸드오버: `PHOENIX_HANDOVER_2026_09_21_TRAVELER_BASELINE_SHARED_JOURNEY.md`  
Canonical repo HEAD: b9b37d6

---

## 현재 위치 (한 줄)

> "SoulCableCarPage 런타임의 실제 실행 경로가 확인되었다. Golden Question 01이 왜 응답을 만들지 못하는지 알고 있다. 다음은 Readiness Audit이다 — 구현하기 전에."

---

## 1. GOLDEN QUESTION 01 — CONFIRMED FAILURE CASE

**입력:**  
`"10월 17일 라마다에서 출발해서 여수해상케이블카 타려고 해. 일정하고 비용 알려줘."`

**관찰된 동작:**
- 입력 텍스트가 사라짐 (전달 클릭 후)
- Quick Context가 STATE0 유지
- 새로운 SOUL 응답 없음
- 페이지 재구성 없음
- 콘솔 ERROR 없음

**Execution Trace (확인됨):**

```
handleSubmit(e)
→ parseContext(inputValue, travelerContext)
   인식 토큰: 차/자차/드라이브/렌트 · 오동도 · 부모님/가족
   Golden Question 인식: 0건
   return { hasVehicle: false, nextPlace: null, companion: null }  ← 변화 없음
→ setTravelerContext(동일 값) → re-render 발생하나 stateIndex=0 유지
→ setInputValue('')  ← 무조건 실행, 조건 분기 없음
→ primaryDiscovery = SOUL_DISCOVERY.default (변화 없음)
```

**실패 분류:**

| 영역 | 판정 |
|---|---|
| Traveler-State Parsing | FAIL — 날짜/출발지/비용/일정 intent 인식 불가 |
| Knowledge Retrieval | NOT_IMPLEMENTED |
| Answer Composition | NOT_IMPLEMENTED (4개 하드코딩 문자열 중 선택) |
| Raw Question Preservation | FAIL — submit 즉시 소멸, 저장 없음 |

**Root Cause (한 문장):**
> `parseContext`는 차량/오동도/동반자 3개 토큰만 인식하고 날짜·출발지·비용·일정 인텐트를 전혀 지원하지 않으므로, Golden Question 입력은 context를 변경하지 못한 채 소멸되고 STATE0가 유지된다.

**중요 — 추론 금지:**
> 과거 Schedule/Estimate 기능이 사라졌다고 단정하지 않는다.  
> 해당 실행 경로는 아직 감사되지 않았다 (LEGACY-UNKNOWN).

---

## 2. VERIFIED RUNTIME STATE (SoulCableCarPage.jsx — b9b37d6)

| 항목 | 상태 |
|---|---|
| 자연어 입력 처리 | parseContext() 경유 — 3 토큰만 인식 |
| 날짜/출발지/비용/일정 파싱 | FAIL |
| Raw Question 보존 | FAIL — conversationLog 없음 |
| Phoenix Knowledge 연결 | NOT_IMPLEMENTED |
| Schedule/Cost 동적 생성 | NOT_IMPLEMENTED |
| SOUL Discovery 생성 방식 | 하드코딩 4개 문자열, stateIndex로 선택 |
| Repository Knowledge → Runtime | 연결 없음 |
| LLM/API 호출 | 없음 |

> Repository knowledge exists but current prototype runtime is not connected to it.

---

## 3. PRODUCT DIRECTION (보존 — 구현 아님)

### A. Rich Basic Information

```
기본정보는 풍부하게 준비하고,
여행자에게는 중요도와 깊이를 재편집해서 보여준다.
```

개인화가 기본 장소 정보를 대체하거나 빈약하게 만들어서는 안 된다.

### B. Phoenix-first Knowledge

SOUL은 준비된 Phoenix 정식 Knowledge를 우선 사용한다.

```
REUSE → COMPOSE → REASON (필요 시) → LIVE (진정으로 필요 시만)
```

안정적/반안정적 사실에 대해 질문마다 웹 검색을 기본으로 하지 않는다.

### C. Place Relationship Intelligence

장소 간 관계 이해가 SOUL의 핵심 차별점이다.  
필요한 차원: FROM / TO / MODE / DISTANCE / TIME RANGE / travel burden / EVIDENCE / CONFIDENCE / verification state.  
누락된 엣지를 추정으로 채우지 않는다.

### D. Prepared Forms / Module Architecture

런타임이 질문마다 전체 페이지를 처음부터 생성하지 않는다.

감사 대상 모듈:
- Hero / Place Basics / Experience / FOR ME / SOUL Judgment
- Schedule / Cost / Journey / Relationship / Context Visual
- Depth / Action

목표: `prepared knowledge + prepared modules → select / prioritize / compose`

### E. Unified Traveler Input

자연어 질문과 Quick Context는 경쟁 시스템이 아니다.  
최종적으로 동일한 Traveler State를 업데이트해야 한다.  
**아직 구현하지 않는다.**

### F. Failure Safety

예상치 못한 질문이 silent failure가 되어서는 안 된다.

감사 대상 동작:
- raw question/provenance 보존
- 이해된 부분은 유지
- 미지 항목은 명시적 표현
- 지원되지 않는 확실성 생성 금지
- Phoenix Knowledge 사용 (가용 시)
- 진정으로 필요한 context만 질문
- NO_MATCH가 절대로 NO_RESPONSE가 되어서는 안 됨

---

## 4. CURRENT KNOWLEDGE READINESS

| 영역 | 상태 | 비고 |
|---|---|---|
| Place Master / Rich Basic Information | PARTIAL | 커버리지 감사 필요 |
| Place Relationships | PARTIAL | 구조화 중 |
| Travel Time Matrix | EXISTS | 커버리지 충분성 미검증 |
| Ramada ↔ Dolsan 관계 | PARTIAL (medium-confidence) | canonical repository 상태 |
| Prepared Knowledge (PU 파일) | PARTIAL (pilot level) | |
| Runtime Knowledge Retrieval | NOT_IMPLEMENTED | Detail 프로토타입 연결 없음 |
| Schedule/Estimate 레거시 기능 | LEGACY-UNKNOWN | 실행 경로 감사 필요 |
| Failure Safety | CONFIRMED FAIL (Golden Q01) | |
| Reusable UI/Form 커버리지 | PARTIAL | 감사 필요 |
| Visual Assets | PARTIAL | Cable Car / Odongdo / Hyangiram 준비됨; 추가는 확장 시 |

**생성된 Visual Asset은 제품 자산이며 사실적 Evidence가 아니다.**

---

## 5. OPEN ITEMS

다음 항목은 명시적으로 OPEN 상태 유지:

- [ ] Legacy Schedule/Estimate 실행 경로
- [ ] 실제 Place Master 커버리지
- [ ] 실제 Relationship / Travel-Time Matrix 커버리지
- [ ] 실제 Rich Basic Information 커버리지
- [ ] 실제 Reusable Form/Module 커버리지
- [ ] 예상치 못한 질문 Failure Safety 커버리지
- [ ] Phoenix Knowledge ↔ runtime 검색 경로
- [ ] Judgment/Composition 실행 경로
- [ ] CONFLICT-H: 토요일 케이블카 마감 시간 충돌
- [ ] Judgment Priority 정의
- [ ] 이전에 언급된 비정상 Wish Scene 자동 노출 케이스

---

## 6. HOLD

Readiness Audit 검토 완료 전까지:

```
HOLD:
- 새로운 Question Router 구현
- 새로운 Traveler State 구현
- Detail Page 추가 기능 작업
- 추가 장소 이미지 제작
- 새로운 Candidate
- 새로운 Architecture Decision
- place_knowledge migration
- DB/schema/runtime/production 변경
```

---

## 7. CURRENT NEXT ACTION

```
SOUL Readiness Audit V0.1
— Knowledge · Relationship · Forms · Failure Safety
```

**감사만. 구현 없음.**

감사 결과 보고 형식 (각 항목: READY / PARTIAL / MISSING / LEGACY-UNKNOWN / CONFLICT):

1. Place Knowledge Coverage
2. Rich Basic Information Coverage
3. Place Relationship Coverage
4. Travel Time Matrix Coverage
5. Prepared Knowledge Coverage
6. Prepared Form / Module Coverage
7. Legacy Schedule / Estimate Path
8. Traveler Input / State Capability
9. Runtime Knowledge Retrieval Capability
10. Judgment / Composition Capability
11. Failure-Safety Capability
12. Visual Asset Readiness
13. Live Verification Boundary
14. Critical gaps blocking reliable SOUL operation

**감사 중 gap을 채우지 않는다. 대체 아키텍처를 설계하지 않는다.**

---

## 8. 새 개발자 / Lumi를 위한 시작 위치

이 Handover를 읽은 새 세션은:

1. `SoulCableCarPage.jsx` — b9b37d6 기준 파악 완료
2. Golden Question 01 Execution Trace를 사실로 수용
3. Product Direction (Section 3)을 방향으로 수용 (SSOT/Architecture Decision 아님)
4. HOLD 목록을 준수
5. CURRENT NEXT ACTION = SOUL Readiness Audit V0.1 착수

구현 시작 전 반드시 Readiness Audit 결과를 먼저 받는다.
