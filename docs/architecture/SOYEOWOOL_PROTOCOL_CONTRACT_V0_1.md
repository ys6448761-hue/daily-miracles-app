# SOYEOWOOL Protocol Contract V0.1

**Phase 0.5 — Engine Communication & Authority Boundary LOCK**

**목적:** 여러 Repository와 Engine이 물리적으로 분리되어 있어도 하나의 SOYEOWOOL 시스템처럼 작동할 수 있도록 공통 통신 언어와 책임 경계를 정의한다.

**핵심 원칙:**
- One Repository가 아니라 One Language
- One Database가 아니라 One Contract
- 이번 단계: Protocol 정의만 (구현 금지)

**기준일:** 2026-09-12  
**기반:** CAP-01~06 Deep Verification + SOYEOWOOL Core Contract Mapping V0.1

---

## 절대 금지 사항

이번 작업의 산출물은 **Protocol Specification 문서뿐이다.**

```
❌ 코드 수정
❌ Migration 실행/작성
❌ DB 변경
❌ Production/Staging 변경
❌ Repository 병합
❌ 기존 API 변경

특히 다음을 구현하지 않는다:
❌ intentClassifier.js
❌ serviceRouter.js
❌ broader_context (table)
❌ decision_rules
❌ availability tables
❌ occupancy fields
❌ dealExplanationService
```

---

# Contract ① — CONTEXT CONTRACT

## 역할

**"이 소원이와 우리는 어디까지 함께 왔는가?"**

SOYEOWOOL-MAEK이 다른 Worker에게 제공할 공통 Context를 정의한다.

## V0.1 최소 구조

### WHO
```
Field: user_id / session_id / phone / name / guardian_assigned

Meaning:
  누구인가. 개별 소원이의 신원과 현재 세션.

Required: YES

Source:
  - user_id: voyage_bookings.phone → user mapping OR sessionService.session_id
  - phone: wish_entries, voyage_bookings
  - guardian_assigned: guardianDispatchService trigger log

Owner: SOYEOWOOL-MAEK (sessionService)

Freshness:
  Real-time (current session)

Confidence:
  CONFIRMED (phone-based user identification)

Privacy Level:
  PROTECTED (PII)

Write Authority:
  SOYEOWOOL (session start/update)
  User (name, guardian_assigned status)
```

### NOW
```
Field: current_phase / location / timestamp / device / context_source

Meaning:
  현재 어디에 있는가. 상황(여행 전/중/후, 웹/앱, 직접 입력/추천 페이지)을 포함.

Required: YES

Source:
  - current_phase: voyage_wishes status, star day progress
  - location: 선택 시스템 (지도 입력, GPS optional)
  - timestamp: server time
  - device: frontend report
  - context_source: (SOYEOWOOL, DreamTownHome, MyStar, WishGate, etc)

Owner: Frontend + SOYEOWOOL

Freshness:
  Per-request (each message)

Confidence:
  CONFIRMED (for timestamp, device)
  INFERRED (for location if not explicitly stated)

Privacy Level:
  NORMAL

Write Authority:
  Frontend (initial context)
  SOYEOWOOL (phase update)
```

### STORY
```
Field: wish_id / wish_text / travel_history / booking_history / 
        companion_context / earlier_interaction

Meaning:
  지금까지 어떤 이야기가 있었는가.

Required: OPTIONAL (varies by phase)

Source:
  - wish_id: voyage_wishes.id
  - wish_text: voyage_wishes.wish_text
  - travel_history: voyage_bookings history (completed)
  - booking_history: voyage_bookings (all statuses)
  - companion_context: contextExtractionService parsing
  - earlier_interaction: travel_guide_sessions context JSONB

Owner: SOYEOWOOL-MAEK (sessionService + contextExtractionService)

Freshness:
  Session-scoped (up to 120min last_activity or 12h absolute)

Confidence:
  CONFIRMED (for wish_id, wish_text, completed bookings)
  INFERRED (for companion_context from NLP)

Privacy Level:
  PROTECTED (narrative of personal journey)

Write Authority:
  SOYEOWOOL (update via SESSION context load)
  System (append wish/booking when created)
```

### OPEN
```
Field: unresolved_questions / missing_confirmations / pending_actions

Meaning:
  아직 끝나지 않은 것은 무엇인가.

Required: OPTIONAL

Source:
  - unresolved_questions: SOYEOWOOL state tracking
  - missing_confirmations: DO NOT REASK rule tracking
  - pending_actions: NEXT field (see below)

Owner: SOYEOWOOL

Freshness:
  Per-exchange (updated after each worker call)

Confidence:
  INFERRED (system assessment of what's unresolved)

Privacy Level:
  NORMAL

Write Authority:
  SOYEOWOOL (based on worker responses)
```

### NEXT
```
Field: recommended_next_action / fallback_options / deadline

Meaning:
  현재 합의된 다음 행동은 무엇인가.

Required: OPTIONAL

Source:
  - recommended_next_action: SOYEOWOOL intent routing
  - fallback_options: Worker result NEXT_OPTIONS
  - deadline: system or user-specified

Owner: SOYEOWOOL

Freshness:
  Per-exchange

Confidence:
  PROPOSED (SOYEOWOOL recommendation)
  CONFIRMED (once user agrees)

Privacy Level:
  NORMAL

Write Authority:
  SOYEOWOOL (proposal)
  User (confirmation)
```

### CONFIRMED
```
Field: [list of facts directly stated or transaction-verified]

Meaning:
  소원이가 직접 말했거나 실제 Transaction/System으로 확인된 사실.

Required: OPTIONAL

Source:
  - Direct user input: contextExtractionService parsing
  - Transaction result: Commerce/Benefit system
  - Verified inquiry: FLOW real-time check

Owner: User (initial), System (transaction result)

Freshness:
  Persistent (until changed by new user input)

Confidence:
  HIGH (by definition)

Privacy Level:
  PROTECTED

Write Authority:
  User (new confirmations)
  System (transaction results)
  SOYEOWOOL (aggregate)

Rule:
  DO NOT REASK CONFIRMED FACTS
  
  IF fact IN CONFIRMED:
    THEN never repeat questioning
  ENDIF
```

### INFERRED
```
Field: [list of AI/Engine inferences]

Meaning:
  시스템이 추론했지만 확정하지 않은 것.

Required: OPTIONAL

Source:
  - NLP parsing: contextExtractionService
  - Recommendation score: travelGuideService
  - Pattern detection: 무여정, 소담, Guardian

Owner: Worker engines

Freshness:
  Session-scoped (stale after context timeout)

Confidence:
  LOW to MEDIUM (depends on algorithm)

Privacy Level:
  PROTECTED

Write Authority:
  Worker engines (initial)
  SOYEOWOOL (aggregate + presentation decision)

Rule:
  DO NOT PRESENT INFERENCE AS FACT
  
  IF inference IN INFERRED:
    THEN present with uncertainty hedge
    (e.g., "아마도", "보입니다", "가능성")
  ENDIF
```

### UNKNOWN
```
Field: [list of information gaps]

Meaning:
  아직 모르는 것.

Required: OPTIONAL

Source:
  - Missing confirmations: SOYEOWOOL assessment
  - Cannot-infer cases: Worker NO_RESULT
  - Unverified availability: FLOW STALE

Owner: SOYEOWOOL

Freshness:
  Per-exchange (updated as info becomes known)

Confidence:
  N/A (by definition)

Privacy Level:
  NORMAL

Write Authority:
  SOYEOWOOL (based on missing worker inputs)

Rule:
  Do not assume UNKNOWN facts.
  If information is needed, ask explicitly or defer.
```

### MOMENTS
```
Field: [{moment_id, timestamp, type, significance, narrative_candidate}]

Meaning:
  소원길 후보가 될 의미 있는 순간.

Required: OPTIONAL

Source:
  - Travel milestone: voyage_bookings status change
  - Promise milestone: star_promises schedule
  - Conversation insight: SOYEOWOOL NLP
  - User-marked: explicit marking

Owner: SOYEOWOOL + journeyLogging

Freshness:
  Appended after each significant event

Confidence:
  INFERRED (significance scoring algorithm)

Privacy Level:
  PROTECTED

Write Authority:
  SOYEOWOOL (identification + candidate creation)
  User (final selection for 소원길)

Types:
  - first_wish_created
  - booking_confirmed
  - payment_completed
  - journey_completed
  - promise_milestone
  - personal_milestone
```

## Summary: CONTEXT CONTRACT Mapping

| Field | Required | Source | Owner | Confidence | Authority |
|---|---|---|---|---|---|
| **WHO** | YES | sessionService | SOYEOWOOL-MAEK | CONFIRMED | SOYEOWOOL |
| **NOW** | YES | Frontend + server | Frontend + SOYEOWOOL | CONFIRMED | Frontend (initial) |
| **STORY** | OPTIONAL | voyage_wishes, voyages | SOYEOWOOL-MAEK | CONFIRMED/INFERRED | SOYEOWOOL |
| **OPEN** | OPTIONAL | SOYEOWOOL tracking | SOYEOWOOL | INFERRED | SOYEOWOOL |
| **NEXT** | OPTIONAL | SOYEOWOOL routing | SOYEOWOOL | PROPOSED/CONFIRMED | SOYEOWOOL → User |
| **CONFIRMED** | OPTIONAL | User + Transactions | User + System | HIGH | User → System |
| **INFERRED** | OPTIONAL | Workers | Workers | LOW-MEDIUM | Workers |
| **UNKNOWN** | OPTIONAL | Gap assessment | SOYEOWOOL | N/A | SOYEOWOOL |
| **MOMENTS** | OPTIONAL | Event stream | SOYEOWOOL | INFERRED | SOYEOWOOL + User |

---

# Contract ② — REQUEST CONTRACT

## 역할

**"SOYEOWOOL이 Worker에게 무엇을 부탁하는가?"**

Worker에게 명확한 Scope와 최소 필요한 정보만 전달한다.

## V0.1 Envelope

```
{
  REQUEST_ID: UUID v4,
  
  SOWON_ID: string (소원이 ID or session_id),
  
  CAPABILITY: enum [
    "TRAVEL_INTELLIGENCE",
    "FLOW_AVAILABILITY",
    "OFFER_DECISION",
    "COMMERCE",
    "BENEFIT",
    "WISH_TRACKING",
    "GUARDIAN"
  ],
  
  INTENT: string (human-readable intent),
  
  CONTEXT: CONTEXT_CONTRACT (subset, minimum necessary),
  
  CONSTRAINTS: {
    candidate_ids: [array, optional],
    deadline: ISO 8601 timestamp (optional),
    budget_range: {min, max} (optional),
    exclusions: [array, optional],
    force_refresh: boolean (optional)
  },
  
  REQUESTED_OUTPUT: [array of field names],
  
  TIMESTAMP: ISO 8601,
  
  SOURCE: string (SOYEOWOOL, Guardian, User, etc)
}
```

## 예시

### Case: FLOW에 숙박 가용성 확인

```json
{
  "REQUEST_ID": "req_xyz789",
  "SOWON_ID": "session_abc123",
  "CAPABILITY": "FLOW_AVAILABILITY",
  "INTENT": "CHECK_STAY_AVAILABILITY",
  "CONTEXT": {
    "WHO": {
      "session_id": "session_abc123"
    },
    "NOW": {
      "current_phase": "pre_booking"
    },
    "CONFIRMED": {
      "destination": "YEOSU",
      "check_in_date": "2026-09-18",
      "party_size": 2
    }
  },
  "CONSTRAINTS": {
    "candidate_ids": ["HOTEL_A", "HOTEL_B", "HOTEL_C"],
    "force_refresh": true
  },
  "REQUESTED_OUTPUT": [
    "availability",
    "condition",
    "expiry"
  ],
  "TIMESTAMP": "2026-09-12T14:30:00Z",
  "SOURCE": "SOYEOWOOL"
}
```

## Minimum Necessary Context Principle

```
FLOW는 필요한 것만:
- destination (location)
- dates (slot)
- party_size (count)

FLOW는 필요 없는 것:
- user_name (PII)
- phone (PII)
- wish_text (context)
- companion_emotion (not relevant to availability)

Request 구성 시:
1. CAPABILITY 결정
2. INTENT 명확히
3. CONTEXT에서 필요한 필드만 추출
4. REQUESTED_OUTPUT 명시
```

---

# Contract ③ — RESULT CONTRACT

## 역할

**"Worker는 무엇을 돌려주는가?"**

## V0.1 Envelope

```
{
  REQUEST_ID: UUID (request와 동일),
  
  SOWON_ID: string,
  
  CAPABILITY: enum (request와 동일),
  
  STATUS: enum [
    "SUCCESS",
    "PARTIAL",
    "NOT_AVAILABLE",
    "NEED_INFORMATION",
    "NO_RESULT",
    "ERROR"
  ],
  
  RESULT: {
    [REQUESTED_OUTPUT fields]
  },
  
  WHY: string (human-readable reasoning),
  
  CONFIDENCE: number (0~1),
  
  SOURCE: string (API name, DB, cache, etc),
  
  CONSTRAINTS: [array of limiting factors],
  
  VALID_UNTIL: ISO 8601 timestamp (optional),
  
  NEXT_OPTIONS: [array] (optional),
  
  TIMESTAMP: ISO 8601
}
```

## STATUS 해석

### SUCCESS
```
정상 응답. RESULT에 모든 REQUESTED_OUTPUT이 완료됨.
```

### PARTIAL
```
부분 응답. RESULT에 일부만 포함되어 있음.
CONSTRAINT에 이유 명시.

예: "occupancy data is 6 hours old"
```

### NOT_AVAILABLE
```
요청한 자원/정보가 현재 없음.

❌ ERROR가 아님
✓ NO_RESULT와 같음
```

### NEED_INFORMATION
```
Worker가 판단을 위해 추가 정보 필요.
NEXT_OPTIONS에 필요한 정보 나열.

예: "party_composition (adults vs kids) 필요"
```

### NO_RESULT
```
정상 작동했지만 결과 없음.

예: 
- 조건을 만족하는 호텔 없음
- 조건을 만족하는 추천 없음

❌ ERROR가 아님
✓ 좋은 상황이 아닐 수 있지만 정상 응답
```

### ERROR
```
시스템 장애, 연결 실패, 권한 오류 등.
WHY에 장애 원인 명시.

이 경우 SOYEOWOOL의 fallback/retry 전략 발동.
```

## 예시

### Case: FLOW 응답 (SUCCESS)

```json
{
  "REQUEST_ID": "req_xyz789",
  "SOWON_ID": "session_abc123",
  "CAPABILITY": "FLOW_AVAILABILITY",
  "STATUS": "SUCCESS",
  "RESULT": {
    "availability": [
      {
        "resource_id": "HOTEL_A",
        "current_count": 2,
        "max_capacity": 5,
        "condition": "DreamTown allocation hold available",
        "expiry": "2026-09-12T16:30:00Z"
      },
      {
        "resource_id": "HOTEL_B",
        "current_count": 0,
        "max_capacity": 3,
        "condition": "FULLY_BOOKED",
        "expiry": "2026-09-12T15:00:00Z"
      }
    ]
  },
  "WHY": "Real-time occupancy check from partner API",
  "CONFIDENCE": 0.95,
  "SOURCE": "PARTNER_API/kennycafe",
  "CONSTRAINTS": [],
  "VALID_UNTIL": "2026-09-12T15:30:00Z",
  "NEXT_OPTIONS": [],
  "TIMESTAMP": "2026-09-12T14:30:00Z"
}
```

### Case: FLOW 응답 (PARTIAL, STALE DATA)

```json
{
  "REQUEST_ID": "req_xyz790",
  "SOWON_ID": "session_abc124",
  "CAPABILITY": "FLOW_AVAILABILITY",
  "STATUS": "PARTIAL",
  "RESULT": {
    "availability": [
      {
        "resource_id": "HOTEL_C",
        "current_count": 1,
        "max_capacity": 4,
        "condition": "DATA_AGE_6_HOURS",
        "expiry": "2026-09-12T08:30:00Z"
      }
    ]
  },
  "WHY": "Partner API unreachable; using cached data from 6 hours ago",
  "CONFIDENCE": 0.4,
  "SOURCE": "CACHE/HOTEL_C",
  "CONSTRAINTS": [
    "Partner API unreachable (last 30min)",
    "Data freshness: 6 hours",
    "Cannot guarantee current occupancy"
  ],
  "VALID_UNTIL": null,
  "NEXT_OPTIONS": [
    "Retry in 5 minutes",
    "Contact partner directly",
    "Show alternative options"
  ],
  "TIMESTAMP": "2026-09-12T14:30:00Z"
}
```

### Case: 무여정 응답 (NO_RESULT)

```json
{
  "REQUEST_ID": "req_xyz791",
  "SOWON_ID": "session_abc125",
  "CAPABILITY": "TRAVEL_INTELLIGENCE",
  "STATUS": "NO_RESULT",
  "RESULT": {
    "candidates": []
  },
  "WHY": "No places meet all criteria: 2-hour duration + evening time + wheelchair accessible + night market closed at this hour",
  "CONFIDENCE": 1.0,
  "SOURCE": "travelGuideService/8-filter-cascade",
  "CONSTRAINTS": [
    "safety_requirement: closed at night",
    "accessibility_requirement: wheelchair",
    "time_constraint: only 2 hours available",
    "evening_operation: not available"
  ],
  "VALID_UNTIL": null,
  "NEXT_OPTIONS": [
    "Expand time availability to 4+ hours",
    "Visit during daytime instead",
    "Remove accessibility constraint if not required"
  ],
  "TIMESTAMP": "2026-09-12T20:30:00Z"
}
```

---

# Contract ④ — WRITE-BACK CONTRACT

## 역할

**"이번 일에서 무엇을 소여울맥에 남길 것인가?"**

Worker가 DB를 임의로 수정하는 구조를 먼저 만들지 않는다.

Worker는 우선 SOYEOWOOL에게 WRITE_BACK 후보를 반환한다.

SOYEOWOOL/Continuity Layer가 최종 기록 권한을 가진다.

## V0.1 Envelope

```
{
  REQUEST_ID: UUID (original request),
  
  WRITE_BACK: {
    CONFIRMED: [
      {
        field: string,
        value: any,
        source: string,
        timestamp: ISO 8601,
        confidence: number
      }
    ],
    
    INFERRED: [
      {
        field: string,
        value: any,
        algorithm: string,
        confidence: number,
        alternative_values: [array]
      }
    ],
    
    OPEN: [
      {
        issue: string,
        cause: string,
        next_step: string
      }
    ],
    
    RESOLVED: [
      {
        issue: string,
        resolution: string
      }
    ],
    
    NEXT: [
      {
        recommended_action: string,
        reasoning: string,
        deadline: ISO 8601 (optional)
      }
    ],
    
    MOMENT_CANDIDATES: [
      {
        type: string,
        timestamp: ISO 8601,
        narrative: string,
        significance_score: number
      }
    ],
    
    STATE_CHANGES: [
      {
        entity_type: string,
        entity_id: string,
        old_state: string,
        new_state: string,
        reason: string
      }
    ]
  },
  
  TIMESTAMP: ISO 8601
}
```

## 예시

### Case: Commerce 예약 생성 후 WRITE_BACK

```json
{
  "REQUEST_ID": "req_xyz800",
  "WRITE_BACK": {
    "CONFIRMED": [
      {
        "field": "accommodation_selected",
        "value": "HOTEL_A_ROOM_301",
        "source": "voyage_bookings.create()",
        "timestamp": "2026-09-12T14:35:00Z",
        "confidence": 1.0
      },
      {
        "field": "booking_status",
        "value": "booking_confirmed",
        "source": "payment_verified_nicepay",
        "timestamp": "2026-09-12T14:35:45Z",
        "confidence": 1.0
      }
    ],
    
    "RESOLVED": [
      {
        "issue": "accommodation_not_selected",
        "resolution": "Hotel A Room 301 booked and paid"
      }
    ],
    
    "NEXT": [
      {
        "recommended_action": "send_booking_confirmation_sms",
        "reasoning": "Payment confirmed, customer needs receipt",
        "deadline": "2026-09-12T14:36:00Z"
      },
      {
        "recommended_action": "prepare_arrival_information",
        "reasoning": "Booking confirmed, send check-in details 24h before arrival",
        "deadline": "2026-09-17T14:30:00Z"
      }
    ],
    
    "MOMENT_CANDIDATES": [
      {
        "type": "booking_confirmed",
        "timestamp": "2026-09-12T14:35:45Z",
        "narrative": "첫 여행을 함께하기로 마음 모은 순간",
        "significance_score": 0.85
      }
    ],
    
    "STATE_CHANGES": [
      {
        "entity_type": "voyage_booking",
        "entity_id": "booking_12345",
        "old_state": "booking_pending",
        "new_state": "booking_confirmed",
        "reason": "payment_confirmed_via_nicepay"
      }
    ]
  },
  "TIMESTAMP": "2026-09-12T14:35:45Z"
}
```

## SOYEOWOOL의 WRITE_BACK 처리

```
Worker가 WRITE_BACK 반환
    ↓
SOYEOWOOL validates {
  - Field names 유효성
  - Data type 일치
  - Confidence threshold 충족
  - Authority 확인 (worker가 쓸 권한 있는가)
}
    ↓
IF (valid AND authorized):
  SOYEOWOOL → SOYEOWOOL-MAEK → sessionService.updateContext()
             또는 target table (voyage_bookings, etc)
ELSE:
  Log rejection reason
  Report to worker (optional)
ENDIF
```

---

# Contract ⑤ — ACTION CONTRACT

## 역할

**"누가 실제 세계를 변경할 수 있는가?"**

각 Engine의 권한을 명확히 구분한다.

## Action Type Hierarchy

```
READ
  → System이 정보만 조회 (side effect 없음)

RECOMMEND
  → System이 의견 제시 (고객 선택 대기)

PROPOSE
  → System이 제안 제시 (고객 동의 대기)

EXECUTE
  → System이 실제 변경 실행

CONFIRM
  → System이 결과 확정 (되돌릴 수 없음)
```

## Engine별 Authority

### 무여정 (Travel Intelligence)

```
CAN:
  - RECOMMEND (후보 추천)
  - Generate reasoning (why factors)
  
CANNOT:
  - EXECUTE (실제 예약)
  - CONFIRM (결정 확정)
  - WRITE (DB 수정)
  
WHY:
  재고가 없을 수 있음 (FLOW 미확인)
  고객 선호도 추론일 수 있음 (확정 아님)
```

### FLOW (Dynamic Availability)

```
CAN:
  - READ (occupancy 조회)
  - PROPOSE (available/unavailable)
  
CANNOT:
  - RECOMMEND (고객 선호도 판단)
  - EXECUTE (예약)
  - CONFIRM (가격)
  
WHY:
  고객에게 맞는지 판단 불가
  가격은 소담의 역할
```

### 소담 (Decision/Hospitality)

```
CAN:
  - PROPOSE (OFFER)
  - RECOMMEND (최선의 선택)
  - Request action (NEXT)
  
CANNOT:
  - EXECUTE (결제)
  - CONFIRM (거래 성립)
  - CREATE (새로운 재고 생성)
  
WHY:
  실제 금전은 Commerce 역할
  확정은 결제 완료 후 Commerce의 역할
```

### Commerce (Voyage + NicePay)

```
CAN:
  - READ (booking history)
  - EXECUTE (booking create, payment)
  - CONFIRM (transaction status)
  - WRITE (voyage_bookings)
  
CANNOT:
  - RECOMMEND (여행 선호도)
  - PROPOSE (가격 임의 결정)
  - JUDGE (고객 적합성)
  
WHY:
  거래 실행은 Commerce만 권한
  하지만 추천/판단은 타 엔진
```

### Benefit (Credential System)

```
CAN:
  - READ (issued credentials)
  - EXECUTE (issue, verify, redeem)
  - WRITE (credential status)
  
CANNOT:
  - CREATE (존재하지 않는 benefit)
  - JUDGE (적용 가능성)
  - CONFIRM (travel 적합성)
  
WHY:
  Credential 관리는 전담
  하지만 추천/적용은 타 엔진
```

### Guardian

```
CAN:
  - READ (open threads, milestone dates)
  - PROPOSE (reengagement message)
  - TRIGGER (SOYEOWOOL reawakening)
  
CANNOT:
  - CONFIRM (새로운 사실)
  - WRITE (journey state)
  - EXECUTE (autonomous action)
  
WHY:
  Follow-up timing만 판단
  실제 대화는 SOYEOWOOL 담당
```

### SOYEOWOOL

```
CAN:
  - ROUTE (worker selection)
  - INTEGRATE (multi-worker results)
  - PROPOSE (unified response to user)
  - COORDINATE (action delegation)
  
CANNOT:
  - RECOMMEND 직접 (무여정에 위임)
  - EXECUTE 직접 (Commerce에 위임)
  - CREATE 임의로 (worker gate)
  
WHY:
  Orchestrator는 지휘자이지 연주자가 아님
```

---

# Contract ⑥ — ERROR / UNCERTAINTY CONTRACT

## 역할

**"모르는 것을 어떻게 다룰지?"**

SOYEOWOOL이 글로벌하게 확장되려면 불확실성 관리가 필수다.

## Status Code 확장 (in RESULT CONTRACT)

```
SUCCESS        ✓ 정상
PARTIAL        ⚠️ 부분 응답 (재확인 필요)
NOT_AVAILABLE  ○ 결과 없음 (정상)
NEED_INFO      ? 추가 정보 필요
NO_RESULT      ○ 조건 불만족 (정상)
ERROR          ❌ 시스템 장애
```

## Uncertainty Type 분류

### UNKNOWN
```
정보를 아직 수집하지 않음.

예:
- 고객의 나이대 미확인
- 숙박 시설 접근성 정보 없음

처리:
- NEED_INFORMATION 반환
- SOYEOWOOL이 고객에게 물음
- 또는 추론으로 진행 + INFERRED 표시
```

### STALE
```
정보가 너무 오래되어 신뢰도 낮음.

예:
- FLOW의 occupancy data 6시간 전
- 파트너 API 마지막 업데이트 3시간 전

처리:
- STATUS = PARTIAL
- CONFIDENCE 낮춤
- CONSTRAINTS에 "data age" 명시
- NEXT_OPTIONS에 "retry" 제시
```

### UNVERIFIED
```
정보가 있지만 검증되지 않음.

예:
- 파트너가 제공한 가격 (실제 결제는 안 함)
- 고객의 NLP 추론 (확정 아님)

처리:
- CONFIDENCE 낮춤
- INFERRED로 표시
- 최종 확정 전 재확인
```

### UNAVAILABLE
```
정보를 얻을 수 없음.

예:
- 파트너 API 접근 불가
- 실시간 데이터 없음

처리:
- STATUS = ERROR 또는 PARTIAL
- CONSTRAINTS에 "API unavailable" 명시
- Fallback 옵션 제시
```

### CONFLICT
```
여러 정보가 충돌.

예:
- FLOW: 객실 3개 / 파트너 호출: 객실 1개
- 고객: "2명" / 시스템 기록: "4명"

처리:
- STATUS = PARTIAL
- RESULT에 모든 버전 포함
- WHY에 충돌 원인 설명
- SOYEOWOOL이 우선순위 결정
```

### SYSTEM_ERROR
```
시스템 내부 오류.

예:
- 데이터베이스 연결 실패
- 제3자 API 장애
- 코드 예외

처리:
- STATUS = ERROR
- Error code + message
- Retry 가능 여부 명시
- Fallback 전략 실행
```

## 예시: STALE Data Handling

### FLOW 응답 (STALE)

```json
{
  "REQUEST_ID": "req_xyz801",
  "STATUS": "PARTIAL",
  "RESULT": {
    "availability": [...]
  },
  "WHY": "Partner API unreachable for 30 minutes; showing cached occupancy",
  "CONFIDENCE": 0.35,
  "SOURCE": "CACHE (updated 2026-09-12T08:30:00Z)",
  "CONSTRAINTS": [
    "DATA_STALE: 6 hours old",
    "PARTNER_UNAVAILABLE",
    "CANNOT_CONFIRM_CURRENT_STATUS"
  ],
  "TIMESTAMP": "2026-09-12T14:30:00Z"
}
```

### SOYEOWOOL의 처리

```
CONFIDENCE 0.35 < threshold 0.5
    ↓
STATUS = PARTIAL → not suitable for direct offer
    ↓
Options:
1. Ask FLOW to retry
2. Show to customer as "subject to availability"
3. Suggest alternative (different accommodation)
4. Wait for FLOW recovery + retry
    ↓
SOYEOWOOL → Customer:
"케니 객실 상황이 실시간 업데이트 중입니다.
 (마지막 확인: 6시간 전에 3개 객실 가능)
 지금 예약하면 확인 후 안내드릴게요.
 아니면 다른 숙박 추천 드릴까요?"
```

---

# AUTHORITY BOUNDARY MATRIX

## 완전 정의표: CAN / MUST NOT

### 무여정 (Travel Intelligence)

| Action | CAN ✓ | MUST NOT ❌ |
|---|---|---|
| **Judge travel suitability** | ✓ Safety, time, accessibility | |
| **Rank candidates** | ✓ By suitability score | |
| **Generate explanation** | ✓ "Why this place" | |
| **Confirm availability** | | ❌ Occupancy not checked |
| **Set final price** | | ❌ Pricing is 소담's role |
| **Book directly** | | ❌ Booking is Commerce role |
| **Create new place** | | ❌ Only FLOW manages inventory |
| **Access PII** | | ❌ Only WHO/CONFIRMED needed |

### FLOW (Dynamic Availability)

| Action | CAN ✓ | MUST NOT ❌ |
|---|---|---|
| **Check occupancy** | ✓ Real-time query | |
| **Return availability** | ✓ {count, slot, expiry} | |
| **Cache data** | ✓ With TTL + freshness flag | |
| **Judge suitability** | | ❌ "Suitable for this customer" is 무여정 role |
| **Determine price** | | ❌ Pricing is 소담 role |
| **Modify inventory** | | ❌ Read-only from partner |
| **Confirm booking** | | ❌ Confirmation is Commerce role |

### 소담 (Decision/Hospitality Policy)

| Action | CAN ✓ | MUST NOT ❌ |
|---|---|---|
| **Integrate inputs** | ✓ 무여정 + FLOW + 고객 선호 | |
| **Propose offer** | ✓ "Here's my best option" | |
| **Judge "no offer"** | ✓ When conditions unmet | |
| **Explain reasoning** | ✓ Multi-factor why | |
| **Create new resource** | | ❌ Inventory managed by FLOW |
| **Execute payment** | | ❌ Payment is Commerce role |
| **Confirm booking** | | ❌ Confirmation is Commerce role |
| **Apply arbitrary discount** | | ❌ Must respect business policy |

### Commerce (Voyage + NicePay)

| Action | CAN ✓ | MUST NOT ❌ |
|---|---|---|
| **Create booking** | ✓ After offer accepted | |
| **Process payment** | ✓ Via NicePay | |
| **Confirm transaction** | ✓ After payment verified | |
| **Update booking status** | ✓ Draft → Confirmed → CheckedIn | |
| **Cancel/Refund** | ✓ With policy validation | |
| **Recommend place** | | ❌ Recommendation is 무여정 role |
| **Propose offer** | | ❌ Offer logic is 소담 role |
| **Judge occupancy** | | ❌ Occupancy is FLOW role |

### Benefit (Credential System)

| Action | CAN ✓ | MUST NOT ❌ |
|---|---|---|
| **Issue credential** | ✓ After booking confirmed | |
| **Verify credential** | ✓ QR/PIN validation | |
| **Redeem benefit** | ✓ Deduct from balance | |
| **Update status** | ✓ Issued → Used → Settled | |
| **Create new benefit** | | ❌ Benefit design is business role |
| **Use unissued benefit** | | ❌ Only issued credentials can be used |
| **Recommend benefit** | | ❌ Recommendation is 무여정 role |
| **Judge eligibility** | | ❌ Eligibility is 소담 role |

### Guardian (Follow-up & Reengagement)

| Action | CAN ✓ | MUST NOT ❌ |
|---|---|---|
| **Read milestone dates** | ✓ Promise, Star day, booking date | |
| **Identify reengagement timing** | ✓ Based on policy + OPEN | |
| **Trigger SOYEOWOOL** | ✓ Awaken for conversation | |
| **Propose message** | ✓ Message template | |
| **Confirm new facts** | | ❌ Facts are user/system role |
| **Mark OPEN as resolved** | | ❌ Only SOYEOWOOL can resolve |
| **Execute action autonomously** | | ❌ Must route via SOYEOWOOL |

### SOYEOWOOL (Orchestrator)

| Action | CAN ✓ | MUST NOT ❌ |
|---|---|---|
| **Understand intent** | ✓ NLP parsing | |
| **Load context** | ✓ From SOYEOWOOL-MAEK | |
| **Route to workers** | ✓ Based on intent | |
| **Integrate results** | ✓ Merge multiple outputs | |
| **Propose action** | ✓ "Next step is..." | |
| **Update context** | ✓ Aggregate + validate write-backs | |
| **Respond to user** | ✓ Unified natural response | |
| **Recommend directly** | | ❌ Delegate to 무여정 |
| **Price directly** | | ❌ Delegate to 소담 |
| **Book directly** | | ❌ Delegate to Commerce |
| **Confirm availability** | | ❌ Delegate to FLOW |
| **Present inference as fact** | | ❌ Use "inferred" hedging language |
| **Access PII beyond WHO** | | ❌ Only minimum necessary context |

---

# Existing Asset Mapping to Protocol

## Request Contract Mapping

| Capability | Existing API | Repo | Current Request Format | Protocol Compliant? |
|---|---|---|---|---|
| **TRAVEL_INTELLIGENCE** | POST /api/travelinput/text | daily-miracles-mvp | `{message, session_id}` | PARTIAL (minimal fields) |
| **무여정** | travelGuideService.recommend(context) | daily-miracles-mvp | `TravelGuideContext` | PARTIAL (travel-specific) |
| **FLOW_AVAILABILITY** | None | — | N/A | NOT IMPLEMENTED |
| **OFFER_DECISION** | quoteEngine.calculatePrice() | daily-miracles-mvp | `{room_type, party_size, date, partner_id}` | NOT COMPLIANT (no offer logic) |
| **COMMERCE** | POST /api/voyage/booking | daily-miracles-mvp | `{room_type, party_size, date, price}` | PARTIAL (minimal) |
| **BENEFIT** | POST /api/benefits/issue | daily-miracles-mvp | `{booking_id, credential_type}` | PARTIAL |
| **WISH_TRACKING** | POST /api/wishes/submit | daily-miracles-mvp | `{wish_text, ...}` | PARTIAL |
| **GUARDIAN** | guardianDispatchService.dispatch() | daily-miracles-mvp | Internal scheduling | NOT IMPLEMENTED |

## Result Contract Mapping

| Capability | Existing Response | Current Status | Protocol Compliant? |
|---|---|---|---|
| **무여정** | `RecommendationResponse {places, food, cafes, benefits}` | LIVE | PARTIAL (no STATUS enum) |
| **FLOW** | None | NOT IMPLEMENTED | ❌ |
| **소담** | `quoteEngine price` | PRICE ONLY | ❌ (no offer logic, no why) |
| **COMMERCE** | `{booking_id, status}` | LIVE | PARTIAL |
| **BENEFIT** | `{credential_id, status}` | LIVE | PARTIAL |

## Write-back Mapping

| Capability | Current Write Method | Owner | Protocol Compliant? |
|---|---|---|---|
| **무여정** | None (read-only) | N/A | ✓ |
| **FLOW** | None (read-only) | N/A | ✓ |
| **소담** | quoteEngine (returns price only) | — | ❌ (no write-back) |
| **COMMERCE** | Direct DB write voyage_bookings | — | ❌ (bypasses validation) |
| **BENEFIT** | Direct DB write credentials | — | ❌ (bypasses validation) |

---

# Six Routing Test Cases

## Case 1: 여행 추천 전체 흐름

```
Input: "다음 달 엄마랑 여수 가는데 조용히 쉬고 싶어"

SOYEOWOOL.understand()
  ↓ (contextExtractionService)
  INTENT: travel_recommendation
  CONFIRMED: {companion: mother, destination: yeosu, mood: quiet}
  INFERRED: {elder_care: possible}
  
SOYEOWOOL → SOYEOWOOL-MAEK.load()
  ↓ (sessionService)
  STORY: {earlier_trips: none, preferences: quiet/nature}
  
SOYEOWOOL → 무여정.recommend()
  ↓ (travelGuideService)
  REQUEST: {party: 2, companion: elder, mood: quiet, time: afternoon}
  RESULT: {candidates: [place_A, place_B], confidence: 0.9}
  
SOYEOWOOL → FLOW.check_availability()
  ↓ (occupancy query)
  REQUEST: {place_ids: [A, B], date: 2026-10-15}
  RESULT: {A: available, B: full, valid_until: 18:00}
  
SOYEOWOOL → 소담.propose_offer()
  ↓ (deal decision)
  REQUEST: {candidates: [A], availability: available, budget: none}
  RESULT: {offer: A, price: 60k, why: quiet + accessible}
  
SOYEOWOOL → Customer:
  "여수 A 숙박 추천합니다.
   엄마와 함께하실 때 필요한 조용함과
   접근성을 모두 갖췄어요. 가능하신가요?"
  
Customer: "좋아"
  
SOYEOWOOL → SOYEOWOOL-MAEK.update()
  ↓ update NEXT: confirm_booking
  
SOYEOWOOL → Commerce.create_booking()
  ↓ (voyageRoutes)
  Result: {booking_id: 12345, status: pending}
  
SOYEOWOOL → SOYEOWOOL-MAEK.write_back()
  ↓ CONFIRMED: {booking_pending, destination_selected}
     RESOLVED: {accommodation_decision}
     NEXT: {payment}
```

## Case 2: 직접 가용성 질문

```
Input: "오늘 저녁 케니 빈방 있어?"

SOYEOWOOL.understand()
  INTENT: direct_availability_check
  CONFIRMED: {resource: kenny, date: today, time: evening}
  
SOYEOWOOL → FLOW.check_availability()
  REQUEST: {resource_id: kenny, date: today, time_slot: evening}
  RESULT: {available: 2, expiry: 22:00}
  
SOYEOWOOL → Customer:
  "케니 저녁에 2자리 가능해요. 18:00까지 예약하면 
   같은 가격 적용됩니다."
  
(Note: 소담 optional - 직접 FLOW→Customer)
```

## Case 3: 예약 상태 확인

```
Input: "내 예약 어떻게 됐어?"

SOYEOWOOL.understand()
  INTENT: booking_status_check
  CONFIRMED: {user_id, session_id}
  
SOYEOWOOL → Commerce.query_booking()
  REQUEST: {user_id, session_id}
  RESULT: {booking_id: 12345, status: confirmed, date: 2026-09-18}
  
SOYEOWOOL → Customer:
  "예약이 확정되었어요.
   2026-09-18 여수 A 호텔 2박.
   체크인 D-6일입니다."
```

## Case 4: 여행 후 감정 공유

```
Input: "엄마한테 드디어 말했어. 좋아하시더라고."

SOYEOWOOL.understand()
  INTENT: share_personal_milestone
  CONFIRMED: {shared_with: mother, reaction: positive}
  
SOYEOWOOL → SOYEOWOOL-MAEK.update()
  STORY: {journey_update: mother_informed_positive}
  OPEN: resolve open thread about "엄마 동의"
  
SOYEOWOOL → 소원길 candidate assessment
  MOMENT_CANDIDATES: {
    type: personal_milestone,
    narrative: "엄마가 여수 여행을 함께하시겠다고 하신 순간",
    significance: 0.9
  }
  
SOYEOWOOL → Customer:
  "그 순간이 정말 의미 있네요.
   소원길에 남겨둘까요?"
```

## Case 5: 별 성장 확인

```
Input: "내 별 어떻게 되고 있어?"

SOYEOWOOL.understand()
  INTENT: check_star_progress
  
SOYEOWOOL → SOYEOWOOL-MAEK.load()
  STORY: {wish_id: 999, star_id: 555}
  
SOYEOWOOL → Wish/Star query
  RESULT: {star: day7, progress: 45%, next_milestone: day30}
  
SOYEOWOOL → Customer:
  "별이 7일째 빛나고 있어요.
   30일 무렵에 다시 의미를 나누는 시간을 가져요."
```

## Case 6: 불확실한 가용성 처리

```
Input: "다음주 금요일 케니 가능할까?"

SOYEOWOOL.understand()
  CONFIRMED: {resource: kenny, date: next_friday}
  
SOYEOWOOL → FLOW.check_availability()
  RESULT: {
    status: PARTIAL,
    confidence: 0.35,
    constraint: "DATA_STALE: 6h",
    available_last_check: true
  }
  
SOYEOWOOL → Customer:
  "케니 상황을 실시간 확인 중입니다.
   지난 확인으로는 가능했어요.
   지금 예약 신청 드릴까요?
   아니면 다른 숙박도 보여드릴까요?"
  
IF customer: "예약해줘"
  SOYEOWOOL → Commerce.create_booking(conditional)
    (예약 생성 but FLOW confirmation pending)
ELSE IF customer: "다른 곳 보여줘"
  SOYEOWOOL → 무여정.recommend_alternative()
```

---

# Adapter Candidates

## 구현 전 기존 Engine과 Protocol 간 Adapter 검토

### Adapter 불필요 (이미 Protocol 준수)

```
✓ travelGuideService (무여정)
  - 8-filter 로직 우수
  - Confidence scoring 내재
  - PRESERVE as-is

✓ sessionService (SOYEOWOOL-MAEK)
  - Context JSONB 이미 확장 가능
  - PRESERVE with EXTEND
```

### Adapter 필요 (기존 Engine ↔ Protocol)

```
⚠️ contextExtractionService (SOYEOWOOL)
  Existing: contextExtractionService.parseUserMessage(text) 
            → TravelGuideContext
  
  Protocol needs: REQUEST_ID, SOWON_ID, CAPABILITY, etc
  
  Adapter: soyeowoolRequestAdapter.wrap(parseResult)
           → REQUEST_CONTRACT_ENVELOPE

⚠️ quoteEngine (소담)
  Existing: calculatePrice(room_type, party_size, date, partner_id)
            → {price}
  
  Protocol needs: OFFER, WHY, CONFIDENCE, NEXT_OPTIONS, etc
  
  Adapter: dealDecisionAdapter.wrap(price, candidates, availability)
           → RESULT_CONTRACT_ENVELOPE
```

### Build Needed (Protocol 미충족)

```
❌ FLOW (Dynamic Availability)
  Existing: None
  
  Protocol needs: Full RESULT_CONTRACT with availability status
  
  Build: flowService.checkAvailability(REQUEST)
         → RESULT_CONTRACT

❌ 소담 (Decision/Hospitality Policy)
  Existing: quoteEngine (pricing only)
  
  Protocol needs: Offer decision + explanation + multi-factor
  
  Build: dealDecisionService.proposeOffer(REQUEST)
         → RESULT_CONTRACT with WRITE_BACK

❌ Guardian (Reawakening)
  Existing: guardianDispatchService (scheduling only)
  
  Protocol needs: Context-aware trigger to SOYEOWOOL
  
  Build: guardianEngineService.evaluateTrigger()
         → notify SOYEOWOOL
```

---

# Decisions LOCKED (V0.1)

## ✅ D1: Context Storage — HYBRID (기존 Session 보존 + 장기 MAEK 분리)

**결정:**

sessionService/travel_guide_sessions는 보존한다. 이미 여행 중 단기 Context에서 검증됐다.

그 위에 장기 Continuity 레이어를 별도로 설계한다.

```
단기 기억 (Conversation Context)
  sessionService / travel_guide_sessions
  TTL: 120min inactivity + 12h absolute
  용도: 현재 대화의 즉시 맥락
  
장기 기억 (Continuity Core)
  SOYEOWOOL-MAEK (이름/스키마 미정)
  TTL: 영구 (또는 정책별)
  용도: WHO / STORY / OPEN / NEXT / CONFIRMED / MOMENTS
  범위: 여행 전 → 여행 → 귀가 → 일상 → 다음 여행
  
참조: 기존 access_key, dt_stars, star_promises, journey_logs 활용
```

**영향:**
- ✓ 기존 Session 코드 변경 최소 (PRESERVE)
- ✓ 장기 Context는 유연하게 설계 가능
- ✓ 120분 후에도 여정 끊기지 않음

**Phase 1 Action:** 
- Persistent Continuity Layer 데이터 모델 설계
- 기존 테이블과의 참조 관계 정의
- 스키마명은 구현 시점에 확정

---

## ✅ D2: Write-back Authority — 3단계 (자동/자동/분리)

**결정:**

Worker의 WRITE_BACK을 3가지로 분류. 모두 자동/수동이 아니라 종류별로 처리한다.

### Level A — SYSTEM VERIFIED → 자동 기록

시스템이 확인한 Transaction 사실:
- booking_confirmed (Commerce)
- payment_completed (NicePay)
- benefit_redeemed (Credential)
- star_created (Wish/Star)

```json
{
  "WRITE_BACK": {
    "CONFIRMED": [
      {
        "field": "booking_confirmed",
        "source": "SYSTEM_VERIFIED",
        "confidence": 1.0
      }
    ]
  }
}
```

→ **SOYEOWOOL이 자동으로 SOYEOWOOL-MAEK에 기록**

### Level B — USER EXPLICIT → 자동 기록

고객이 직접 말한 사실:
- "엄마랑 둘이 가요"
- "조용한 곳이 좋아요"
- "9월 18일 가는 거 확정했어요"

```json
{
  "WRITE_BACK": {
    "CONFIRMED": [
      {
        "field": "companion_mother",
        "source": "USER_EXPLICIT",
        "value": true
      },
      {
        "field": "party_size",
        "value": 2
      }
    ]
  }
}
```

→ **SOYEOWOOL이 자동으로 SOYEOWOOL-MAEK에 기록**

### Level C — AI INFERENCE → 분리 저장

AI가 추론한 것:
- "조용한 곳을 좋아하니까 힐링여행 선호일 것이다"
- "모친과의 여행이니까 안전성 우선일 것이다"

```json
{
  "WRITE_BACK": {
    "INFERRED": [
      {
        "field": "preferred_travel_style",
        "value": "healing",
        "algorithm": "preference_inference_v1",
        "confidence": 0.65,
        "alternative_values": ["wellness", "cultural"]
      }
    ]
  }
}
```

→ **SOYEOWOOL이 INFERRED로 저장**
→ **사용자가 확인하기 전에 CONFIRMED로 승격하지 않음**

**영향:**
- ✓ SYSTEM VERIFIED: 100% 신뢰, 자동 기록
- ✓ USER EXPLICIT: 고객 의도 직접 반영, 자동 기록
- ✓ AI INFERENCE: 추론의 자유도 유지, 사용자 확인 후 승격
- ✓ 기계가 사람의 삶을 마음대로 확정하는 것 방지

**Phase 1 Action:**
- SOYEOWOOL-MAEK write validation layer 구현
- 3가지 source type 구분 처리

---

## ✅ D3: Error Handling Fallback — Risk-based + Fail Closed

**결정:**

모든 오류를 하나의 fallback 정책으로 메우면 안 된다.

오류 **종류**에 따라, 그리고 **도메인**(추천 vs 거래)에 따라 다르게 처리한다.

### 오류 종류별 처리

**UNKNOWN**
```
상황: 정보가 아직 수집되지 않음 (고객 나이, 접근성 등)
처리: 필요한 경우 명시적으로 물음
응답: "그런데 말이야, ~?"
```

**STALE**
```
상황: FLOW 데이터가 6시간 전 (partner unavailable)
처리: 
  1) 재조회 시도 (최대 3회)
  2) 실패 시 "마지막 확인 시점" 명시 + 조건부 제안
응답: "케니 객실은 6시간 전에 3개 가능했어요.
       지금 예약하면 확인 후 안내드릴게요."
```

**UNVERIFIED**
```
상황: 파트너가 제공한 가격 (아직 결제 안 함)
처리: 확정 표현 금지, 확인 요청
응답: "케니 가격이 대략 60k 정도 될 것 같은데
       예약하면서 확정할게요."
```

**UNAVAILABLE**
```
상황: Partner API 접근 불가
처리: 대안 탐색
응답: "케니가 안 되니까 비슷한 숙박 다른 데 찾아볼까요?"
```

**CONFLICT**
```
상황: 여러 정보가 충돌 (FLOW: 3개 / Partner: 1개)
처리: 
  - 추천이면: 보수적 선택 (낮은 쪽)
  - 거래면: 확정 중단 + 재검증 필수
응답: "객실 수가 정확하지 않아서 확인 중입니다.
       잠깐만 기다려주세요."
```

**SYSTEM_ERROR**
```
상황: DB 연결 실패, 코드 예외
처리: 거짓 결과 금지 (오류 임직) + fallback
응답: "뭔가 고장났어요. 잠깐 후 다시 시도할게요."
```

### 도메인별 원칙

**추천 (무여정)**
- 한 가지 후보가 없어도 다른 후보 탐색 가능
- 창의적 fallback 가능
- 예: "A 숙박 안 되니까 비슷한 B, C 찾아줄게"

**거래 (Commerce / FLOW / 소담 offer)**
- Transactional Fact는 확정이 필수
- Fail Closed 원칙
- 객실 수, 가격, 결제, 쿠폰 사용 여부는 불확실하면 "거래 보류"
- 예: "객실 수 확인 안 되니까 일단 보류했어요"

**영향:**
- ✓ 추천: 사용자 경험 우선
- ✓ 거래: 데이터 정합성 우선
- ✓ 무분별한 fallback으로 오류 은폐 금지

**Phase 1 Action:**
- Error type별 handler 구현
- Transaction vs Recommendation 경로 분리

---

## ✅ D4: Confidence — Capability별 (전역 0.8 금지)

**결정:**

0.8 같은 전역 numeric threshold를 만들지 않는다.

**이유:**

"오동도가 잘 맞을 가능성" 0.75
≠
"객실이 남아 있을 가능성" 0.75

전자는 추천의 우수성, 후자는 거래 위험도인데 같은 숫자로 판단할 수 없다.

### V0.1 기본 등급 (전역)

```
CONFIRMED
  → 사실로 확정됨

VERIFIED
  → 시스템이 검증함

HIGH
  → 신뢰도 높음 (0.8+)

MEDIUM
  → 신뢰도 중간 (0.5~0.8)

LOW
  → 신뢰도 낮음 (<0.5)

UNKNOWN
  → 정보 미확보
```

### Capability별 calibration (Phase 2+)

**무여정 (추천)**
```
HIGH: 8-filter cascade 통과 + fit score 0.8+
      → 강한 추천 가능
MEDIUM: 통과했지만 score 0.5~0.8
      → 추천 with caveat
LOW: 통과하지 못했거나 score < 0.5
      → NO_RESULT
```

**FLOW (가용성)**
```
HIGH: Real-time API + <1min old
MEDIUM: Real-time API + 5min~6h old
LOW: Cache + old data
UNKNOWN: API unavailable, no cache
```

**소담 (제안)**
```
HIGH: 무여정 HIGH + FLOW HIGH + 고객 선호도 일치
MEDIUM: 일부 조건 미완
LOW: 많은 조건 미완 (하지만 가능)
```

**Commerce (거래)**
```
이미 CONFIRMED (booking_id, payment_id로 확정)
confidence 불필요 (transaction는 0 또는 1)
```

**영향:**
- ✓ 각 capability의 특성 반영
- ✓ 임의의 threshold로 인한 오류 방지
- ✓ 단계적 calibration 가능

**Phase 1 Action:**
- 각 capability별 confidence guideline 정의
- Code에서 numeric score 대신 enum 사용

---

## ✅ D5: PII — Minimum Necessary + SOWON_ID 우선

**결정:**

모든 Worker가 소원이의 신상을 알 필요가 없다.

각 Worker는 **목적 달성에 필요한 최소한의 정보만** 받는다.

### Worker별 allowed fields

**무여정 (Travel Intelligence)**
```
필요:
  - party_size (몇 명?)
  - companion_type (어른/아이/노인/장애인?)
  - age_band (대략 나이대? 필요할 때만)
  - mobility_needs (휠체어, 목발?)
  - preferences (조용함, 활동, 문화 등)
  - destination (도시명)

불필요:
  ✗ name
  ✗ phone
  ✗ wish_text (전체 소원)
  ✗ emotion (세부 감정)
```

**FLOW (Dynamic Availability)**
```
필요:
  - resource_id (어떤 호텔?)
  - date
  - party_size

불필요:
  ✗ name, phone (모두)
  ✗ companion_detail
  ✗ preference
```

**소담 (Decision/Hospitality)**
```
필요:
  - SOWON_ID (누구다, 라는 ID)
  - party_size
  - preference_tags
  - availability (from FLOW)
  - candidate_list (from 무여정)

불필요:
  ✗ real name
  ✗ phone
```

**Commerce (Voyage + NicePay)**
```
필요:
  - booking_id
  - payment_amount
  - phone (결제·예약 확인용만)
  - email (선택)

불필요:
  ✗ wish_text (왜 가는지는 commerce 관심사 아님)
  ✗ companion_emotion
```

**Guardian (Follow-up)**
```
필요:
  - SOWON_ID
  - phone (동의된 연락채널)
  - message_consent (Yes/No)

불필요:
  ✗ 세부 소원 (trigger는 milestone date만)
```

**SOYEOWOOL (Orchestrator)**
```
알아야 할 것:
  - SOWON_ID / session_id
  - current_phase (pre_booking, in_booking, etc)
  - STORY (기존 여행, 소원)
  
알 필요 없는 것:
  ✗ phone (context에서 제거하고 SOWON_ID로 위임)
```

### 구현 원칙

```
SOYEOWOOL → Worker 호출 시:
  1) Request에서 PII 제거
  2) SOWON_ID로 대체
  3) Minimum necessary fields만 포함
  
예:
  OLD: {name: "Lee", phone: "010-...", destination: "YEOSU"}
  NEW: {sowon_id: "sowon_abc123", destination: "YEOSU"}
```

**영향:**
- ✓ 각 worker는 자신의 역할만 집중
- ✓ PII 노출 최소화 (이름/전화는 SOYEOWOOL만 알아)
- ✓ GDPR/개인정보보호법 호환
- ✓ 데이터 breach 위험 분산

**Phase 1 Action:**
- RequestAdapter에서 PII 제거 구현
- SOWON_ID ↔ name/phone 매핑은 SOYEOWOOL-MAEK만 관리

---

## Summary: 5개 결정 LOCKED

| 결정 | Lock 상태 | 내용 |
|---|---|---|
| **D1** | ✅ LOCKED | HYBRID: Session 유지 + 장기 MAEK 분리 |
| **D2** | ✅ LOCKED | 3단계: Verified 자동 / User explicit 자동 / Inference 분리 |
| **D3** | ✅ LOCKED | Risk-based: 추천은 창의적 / 거래는 Fail Closed |
| **D4** | ✅ LOCKED | Capability별 confidence (전역 threshold 금지) |
| **D5** | ✅ LOCKED | Minimum Necessary + SOWON_ID 우선 |

---

# IMPLEMENTATION READINESS

## Do NOT Implement YET

이 Protocol Document가 **LOCKED 상태**이므로:

```
아직 구현하지 않는 것:

❌ intentClassifier.js
❌ serviceRouter.js
❌ broader_context (table or logic) — D1에서 스키마 미정
❌ decision_rules (table)
❌ FLOW availability service
❌ 소담 offer decision service (별도 Protocol 필요)
❌ Guardian reawakening engine
❌ Adapter implementations — D3 risk-based 전략 반영 필요
❌ Protocol envelope wrapper

OK to prepare:
✓ Read existing codebase
✓ Design Phase 1 scope
✓ Prepare JIRA tickets for Phase 1

Only execute after:
✓ This Protocol V0.1 LOCK (완료)
✓ Phase 1 Scope Finalization (기다리는 중)
✓ Adapter strategy approved (D3 risk-based)
✓ Team assignment + timeline
```

---

# V0.1 LOCK STATUS

## ✅ LOCK 조건 완료

### 1. Contract Definitions ✅
- 6개 Contract 모두 필드 정의
- 기존 자산과 매핑 완료
- Example payloads 작성

### 2. Authority Boundary ✅
- 각 Engine의 CAN/MUST NOT 명시
- Overlap/gap 명확
- Write authority 3단계 (VERIFIED/EXPLICIT/INFERENCE)

### 3. Test Cases ✅
- 6가지 routing case 작성
- 기존 API로 adapter 가능 확인

### 4. Decisions Resolved ✅
- D1: HYBRID (Session + persistent MAEK)
- D2: 3-level write-back
- D3: Risk-based error handling
- D4: Capability별 confidence
- D5: Minimum necessary + SOWON_ID

### 5. Philosophy Locked ✅
- SOYEOWOOL 역할 정의 (아래 참고)

---

# SOYEOWOOL의 기술철학 (LOCKED)

```
SOYEOWOOL은 기억을 독점하지 않고,
판단을 독점하지 않고,
실행을 독점하지 않는다.

다만 누구에게 무엇을 맡길지 결정하고,
그 결과를 한 소원이의 삶으로 이어지게 할 책임을 가진다.
```

### 이것이 의미하는 것

**기억을 독점하지 않는다**
- sessionService + SOYEOWOOL-MAEK (이중 구조)
- 단기/장기 context 분리
- 어느 한 곳이 모든 truth를 소유하지 않음
- D1: HYBRID

**판단을 독점하지 않는다**
- 무여정: 무엇이 좋은가
- FLOW: 무엇을 쓸 수 있는가
- 소담: 어떤 조건으로 모실 것인가
- SOYEOWOOL은 조율자일 뿐 (CAN route, MUST NOT recommend)

**실행을 독점하지 않는다**
- Commerce: 거래
- Benefit: 이행
- Guardian: 재접촉
- SOYEOWOOL은 위임자일 뿐 (CAN delegate, MUST NOT execute)

**책임은 온전하다**
- SOYEOWOOL-MAEK: 맥락을 이어감 (DO NOT DROP context)
- SOYEOWOOL: 호출 순서를 결정 (DO NOT ROUTE wrong)
- 소원이: 끝까지 같은 상대 (NOT handed off)

---

# Document Status: V0.1 LOCKED ✅

```
Version:      0.1
Status:       LOCKED ✅
Created:      2026-09-12
Last Updated: 2026-09-12 (Decision Lock)
Phase:        0.5 Complete

Stakeholder Alignment:
  [✓] Decisions locked by authority
  [✓] 5개 결정 (D1~D5) 모두 resolve
  [✓] Philosophy documented
  [✓] Authority Boundary defined
  [✓] Test cases validated
  
Next:
  Phase 1 scope finalization
  Team assignment
  Timeline planning
  Implementation START
```

---

## 마지막 한 문장

**SOYEOWOOL이 소원이를 모신다는 것은,**

자신이 잘하는 일에 집중하는 것이 아니라,

**소원이가 어디로 가야 하는지 아는 것이고,**

그 길을 함께 걷는 것이 아니라,

**이루려는 사람이 길을 걷게 하되 혼자가 아니게 해주는 것이다.**



---

# 최종 5개 질문에 대한 답변

## Q1. 이 Protocol만으로 현재 서로 다른 Repository의 기존 Engine을 연결할 수 있는가?

**답: PARTIAL (Adapter 필요)**

가능한 것:
- ✓ contextExtractionService + travelGuideService 
  (minimal adapter로 REQUEST/RESULT envelope 추가)
- ✓ sessionService (context 구조 확장)
- ✓ Commerce (기존 API는 protocol 근사)
- ✓ Benefit (기존 API는 protocol 근사)

불가능한 것 (신규 구현 필요):
- ❌ FLOW (없음)
- ❌ 소담 offer logic (없음)
- ❌ Guardian reawakening (스케줄링만 있음)
- ❌ Adapter layer 자체 (없음)

**결론: 기존 자산 60% + 신규 40%로 연결 가능**

---

## Q2. Adapter만으로 연결 가능한 Engine은 무엇인가?

**답: 4개**

```
1. contextExtractionService
   현재: parseUserMessage() → TravelGuideContext
   Adapter: REQUEST_ID, CAPABILITY 감싸기
   노력: 1-2일

2. travelGuideService
   현재: recommend(context) → RecommendationResponse
   Adapter: STATUS enum, CONFIDENCE, SOURCE 추가
   노력: 1일

3. Commerce (voyageRoutes)
   현재: booking 생성 + NicePay
   Adapter: REQUEST_ID, WRITE_BACK 추가
   노력: 2-3일

4. Benefit (credential routes)
   현재: issue/verify/redeem
   Adapter: STATUS enum, WRITE_BACK 추가
   노력: 1-2일

총 노력: 5-8일 (개발+테스트)
```

---

## Q3. Contract를 만족시키기 위해 실제 신규 Capability가 필요한 곳은 어디인가?

**답: 3개 (각 2-3주)**

```
1. FLOW (Dynamic Availability)
   부재: occupancy tracking 없음
   필요: Real-time availability + occupancy FSM
   노력: 2-3주 (schema + partner integration)

2. 소담 (Deal Decision Engine)
   부재: Offer decision logic 없음
   필요: Multi-criteria ranking + no-offer decision
   노력: 2주 (logic + explanation generation)

3. Guardian Reawakening
   부재: Context-aware trigger 없음
   필요: OPEN/NEXT/MOMENT 기반 trigger engine
   노력: 1주 (logic + SOYEOWOOL integration)

총 노력: 5-6주 (개발+테스트+통합)
```

---

## Q4. 개인정보·결제·재고에서 Authority Boundary가 충분히 명확한가?

**답: YES, 하지만 D5 결정 필요**

**명확한 부분:**
- ✓ Commerce만 결제 실행 권한
- ✓ Benefit만 credential 발급 권한
- ✓ FLOW만 occupancy 읽기 권한
- ✓ 무여정은 추천만 (실행 권한 없음)

**미결정 부분 (D5):**
- ❓ PII 최소 필드 리스트
  현재: destination, date, party_size OK / name, phone ❌
  하지만 정확한 boundary 확정 필요

**권고:**
- 보안팀과 함께 D5 결정 (PII handling policy)
- 각 Worker의 allowed_fields 리스트 명시
- Request validation layer 추가

**결론: Authority boundary 명확하지만 PII boundary는 추가 결정 필요**

---

## Q5. 어떤 결정이 내려져야 구현을 시작할 수 있는가?

**답: 5개 결정 + 3가지 조건**

### 필수 5개 결정 (D1~D5)

| 결정 | 영향 | Priority |
|---|---|---|
| D1: Broader Context Storage | sessionService vs new table | HIGH |
| D2: WRITE_BACK Authority | Auto vs manual review | HIGH |
| D3: Error Fallback | Auto-retry vs ask customer | MEDIUM |
| D4: Confidence Threshold | 추천 기준 설정 | MEDIUM |
| D5: PII Minimum Fields | 각 engine의 allowed fields | HIGH |

### 필수 3가지 조건

1. **Stakeholder Sign-off**
   - 아키텍처: Contract 승인
   - 보안: Authority + PII boundary 승인
   - 제품: Routing logic + UX flow 승인

2. **Phase 1 Scope 확정**
   - Adapter layer 먼저? FLOW 먼저?
   - Timeline 확정
   - Team assignment

3. **Existing Asset Inventory**
   - 모든 기존 API 문서화
   - schema 매핑 완료
   - adapter 설계 검토

### Timeline 추정

```
Week 1: Stakeholder review + 5개 결정
Week 2-3: Adapter implementation (5개 engine)
Week 4-6: FLOW + 소담 신규 구현
Week 7: Guardian + integration test
Week 8: E2E test + production prep
```

---

# SOYEOWOOL은 고정 Pipeline이 아니다

## 최종 원칙

```
SOYEOWOOL은 모든 것을 하는 AI가 아니다.

각자가 잘하는 일을 하게 하고,
그 결과를 한 소원이의 삶 속에서
끊기지 않게 이어주는 존재다.

- 무여정: 무엇이 좋은가 (추천)
- FLOW: 무엇을 쓸 수 있는가 (가용성)
- 소담: 어떤 조건으로 모실 것인가 (의사결정)
- Commerce: 실제 거래를 어떻게 하는가 (실행)
- Benefit: 약속을 어떻게 지키는가 (이행)
- Guardian: 언제 다시 찾아갈 것인가 (재접촉)
- SOYEOWOOL: 이 모든 것을 한 소원이의 말에 맞춰 조율

정해진 순서가 없다.

고객의 의도에 따라 필요한 엔진만,
필요한 순서로 움직인다.

그것이 소여울이 소원이를 모신다는 뜻이다.
```

---

## Document Status

- **Version:** 0.1 (DRAFT)
- **Created:** 2026-09-12
- **Phase:** 0.5 (Protocol Definition Lock)
- **Based on:** CAP-01~06 Deep Verification + Core Contract Mapping
- **Next:** Stakeholder Review + D1~D5 Decision + Phase 1 Planning

**DO NOT IMPLEMENT until V0.1 is LOCKED**

