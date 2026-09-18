# SOYEOWOOL Core Contract Mapping V0.1

**목적:** DreamTown에 이미 존재하는 Capability와 앞으로 완성할 Capability가 서로 침범하거나 중복 개발되지 않도록 기존 자산을 Core Contract에 매핑한다.

**기준일:** 2026-09-12  
**검증 기반:** CAP-01~06 Deep Verification 결과 (4개 재채점 완료)

---

## 1. SOYEOWOOL — Orchestrator

### 역할
한 문장: **"지금 이 소원이에게 누가 일해야 하는가?"**

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Intent Understanding** | contextExtractionService.js (220 lines) | daily-miracles-mvp | LIVE (travel-only) | 멀티-도메인 intent 분류 부재 | PRESERVE + EXTEND |
| **Context Loading** | sessionService.js | daily-miracles-mvp | LIVE (120min TTL) | restoration token, broader context | PRESERVE + EXTEND |
| **Worker Selection** | None | — | ABSENT | serviceRouter (intent→handler mapping) | BUILD |
| **Multi-engine Call** | travelGuideService internal sub-calls | daily-miracles-mvp | PARTIAL (travel only) | cross-domain orchestration | BUILD |
| **Result Synthesis** | RecommendationResponse merging (travel+food+cafe+benefits) | daily-miracles-mvp | PARTIAL | deal/pricing explanation | EXTEND |
| **Customer Response** | travelInputRoutes.js response formatting | daily-miracles-mvp | PARTIAL | multi-capability unified response | EXTEND |
| **Action Dispatch** | voyageRoutes, wishRoutes separate entry points | daily-miracles-mvp | LINK-ONLY | orchestrated action execution | BUILD |
| **Context Write-back** | None | — | ABSENT | SOYEOWOOL-MAEK 상태 갱신 | BUILD |

### Code Ownership
- **Keep:** contextExtractionService.js (travel intent parsing 우수, test 9개 완성)
- **Extend:** sessionService.js (restoration mechanism 추가)
- **Build:** serviceRouter.js (intent-based worker selection)
- **Build:** orchestrationEngine.js (multi-engine coordination)

### Key Constraints
❌ contextExtractionService 프롬프트를 멀티-도메인으로 변경하지 말 것 (test 재작성 비용)
❌ 기존 travelGuideService 8-filter 순서 변경하지 말 것 (2,000+/일 사용자 영향)
✓ 기존 travel recommendation 로직은 `무여정`으로 위임

---

## 2. SOYEOWOOL-MAEK — Continuity Core

### 역할
한 문장: **"우리는 이 소원이와 어디까지 함께 왔는가?"**

### Context Contract

```
WHO
  - user_id
  - session_id
  - guardian_assigned
  - phone

NOW
  - current_phase (pre_booking, in_booking, post_booking, wish_active, wish_completed, star_growth, etc)
  - location
  - timestamp

STORY
  - wish_id
  - travel_history
  - booking_history
  - companion_context

OPEN
  - unresolved_questions
  - missing_confirmations
  - pending_actions

NEXT
  - recommended_next_action
  - fallback_options
  - deadline

CONFIRMED
  - 소원이가 직접 확인한 사실
  - party_composition: [person1, person2, ...]
  - travel_date
  - budget_range

INFERRED
  - 시스템이 추론했지만 확정하지 않은 것
  - preferred_style
  - emotion_profile
  - accessibility_needs

UNKNOWN
  - 아직 모르는 것
  - accommodation_preference
  - meal_preference

MOMENTS
  - 소원길 후보가 될 의미 있는 순간
  - [moment_id, timestamp, type, significance]
```

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Session Storage** | travel_guide_sessions table (Migration 203) | daily-miracles-mvp | LIVE (120min inactivity + 12h absolute) | restoration token, broader context | EXTEND |
| **Session Schema** | context JSONB, expires_at, last_activity_at | daily-miracles-mvp | PARTIAL | WHO/NOW/STORY structure missing | COMPLETE |
| **Wish Tracking** | voyage_wishes (Migration 059, 6-stage FSM) | daily-miracles-mvp | LIVE | integration with SOYEOWOOL-MAEK | CONNECT |
| **Star Lifecycle** | dt_stars (day1→day7→day30→day100→day365) | daily-miracles-mvp | LIVE | phase tracking in context | CONNECT |
| **Promise Tracking** | star_promises (3-stage capsules: 3m/6m/12m) | daily-miracles-mvp | LIVE | timeline integration | CONNECT |
| **Booking History** | voyage_bookings + quotes | daily-miracles-mvp | SCHEMA ONLY | journey context linkage | COMPLETE |
| **Moment Capture** | event logging (journey_logs, voyage_logs) | daily-miracles-mvp | PARTIAL | significance scoring for MOMENTS | EXTEND |
| **MOMENTS → 소원길** | None | — | ABSENT | meaning extraction + selection | BUILD |

### DO NOT REASK Rule
```
IF fact IN CONFIRMED
  THEN skip questioning
ENDIF

IF inference IN INFERRED
  THEN present with uncertainty hedge
  (NOT as CONFIRMED fact)
ENDIF
```

### Code Ownership
- **Keep:** travel_guide_sessions schema (120min timeout 설계 우수)
- **Extend:** sessionService.restore() (restoration token 구현)
- **Build:** broader_context table (공유 context packet)
- **Build:** contextPacketService.js (WHO/NOW/STORY/OPEN/NEXT 구조화)

---

## 3. 무여정 — Travel Intelligence

### 역할
한 문장: **"이 소원이에게 무엇이 좋은가?"**

### Input Contract
```
party:
  - adults
  - kids (age)
  - elderly
  - mobility_assistance
  
time:
  - available_hours
  - day_of_week
  - season
  
emotion:
  - primary_emotion
  - preference_tags
  - accessibility_needs
  
location:
  - current_city
  - distance_tolerance
  
constraint:
  - budget (optional, for FLOW integration)
  - dietary
  - physical_limitation
```

### Output Contract
```
CANDIDATES: [
  {
    candidate_id,
    resource_type (place|hotel|restaurant|activity|benefit),
    suitability_score (0~1),
    why_factors: {
      safety: score,
      time_sufficient: score,
      emotional_fit: score,
      companion_match: score,
      accessibility: score
    },
    constraints: [list],
    alternative_ids: [...]
  }
]
```

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **8-Priority Filter** | travelGuideService._getPlaces() (lines 56-162) | daily-miracles-mvp | VERIFIED (2,000+/day, zero fails) | hotel/restaurant에도 적용 | PRESERVE + EXTEND |
| **Safety Filter** | line 60 check | daily-miracles-mvp | LIVE | confirmed safe/unsafe status | CONNECT |
| **Time Filter** | _calculateDuration() (line 74-104) | daily-miracles-mvp | LIVE | — | PRESERVE |
| **Transport Accessibility** | line 111 check | daily-miracles-mvp | LIVE | real occupancy data | CONNECT |
| **Physical Accessibility** | line 118-124 accessibility filter | daily-miracles-mvp | LIVE | accommodation accessibility fields | EXTEND |
| **Emotion Scoring** | _calculateTravelerFitScore() (line 146) | daily-miracles-mvp | LIVE | restaurant/hotel emotion matching | EXTEND |
| **Diversity Application** | _applyClusterDiversity() (line 153) | daily-miracles-mvp | LIVE | all resources | PRESERVE |
| **Candidate Ranking** | sort by suitability_score | daily-miracles-mvp | LIVE (travel only) | hotel/restaurant ranking logic | EXTEND |
| **Hotel Candidates** | _getHotelRecommendations() | daily-miracles-mvp | ABSENT (hardcoded selection) | implement with 8-filter | BUILD |
| **Restaurant Candidates** | _getFoodRecommendation() (line 201) | daily-miracles-mvp | PARTIAL (meal_context only) | full 8-filter application | EXTEND |
| **Benefit Integration** | _getBenefits() (line 207) | daily-miracles-mvp | PARTIAL (accessibility only) | multi-criteria benefit matching | EXTEND |

### Core Assets to PRESERVE
- **travelGuideService 8-priority cascade** (780 lines)
  - Safety, Time, Transport, Accessibility, Emotion, Companion, Weather, Connection
  - 검증됨: 18개월 운영, 이상보고 0
  - ⚠️ 순서 변경 금지

### Key Constraints
✓ 재고를 확정하지 않는다 (확정은 FLOW의 역할)
✓ 가격을 제시하지 않는다 (제시는 소담의 역할)
✗ 하드코딩된 hotel selection 제거 (EXTEND로 구현)

---

## 4. FLOW — Dynamic Availability

### 역할
한 문장: **"그중 언제 무엇을 실제로 사용할 수 있는가?"**

### Resource Contract (모든 자원 공통 문법)
```
RESOURCE:
  resource_id
  resource_type (hotel_room|restaurant_seat|activity_slot|food_truck|etc)
  location
  
SLOT:
  date
  time_slot
  duration (minutes)
  
AVAILABILITY:
  current_count (available)
  max_capacity
  reserved_count
  
CONDITION:
  restriction (age|accessibility|dietary|etc)
  allocation_policy (DreamTown reservation hold, etc)
  
EXPIRY:
  hold_until (ISO 8601 timestamp)
  hard_deadline
  
SOURCE:
  partner_api
  last_update (timestamp)
  
CONFIDENCE:
  certainty_score (0~1)
  update_frequency
```

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Hotel Occupancy** | dt_accommodations (Migration 189) | daily-miracles-mvp | SCHEMA ONLY (is_available BOOLEAN, no current_occupancy) | daily tracking, reservation state | COMPLETE |
| **Pricing Structures** | rates table (Migration 190) | daily-miracles-mvp | SCHEMA ONLY (day_of_week, season, special_period) | cost/sell/list fields, live JOIN | COMPLETE |
| **Live Status** | travel_live_status (Migration 202) | daily-miracles-mvp | SCHEMA ONLY (open/closed/partial/unknown) | JOIN in queries, real-time updates | CONNECT |
| **Restaurant Capacity** | travel_restaurants table (Migration 201) | daily-miracles-mvp | SCHEMA ONLY (no occupancy fields) | capacity/current_occupancy/dietary | COMPLETE |
| **Partner API** | None | — | ABSENT | 파트너 재고 조회 API | BUILD |
| **Food Truck Inventory** | C:\DEV\JINDU design docs only | — | DESIGN ONLY (no implementation) | 실제 운영 시스템 | DO NOT TOUCH YET |
| **Idle Resource Management** | None | — | ABSENT | 유휴 자원 추적 및 할당 | BUILD |
| **Availability Caching** | None | — | ABSENT | 캐시 전략 (TTL, invalidation) | BUILD |
| **Occupancy Logging** | None | — | ABSENT | audit trail (who, when, how many) | BUILD |

### CRITICAL GAP: Occupancy Tracking
```
❌ 현황:
   - dt_accommodations.is_available = 0|1 (on/off만)
   - quoteEngine: occupancy 체크 안 함 (overbooking 가능)
   - travelGuideService: occupancy 입력 안 받음
   
✓ 필요:
   - current_occupancy 필드
   - daily reservation state machine
   - FLOW ↔ 소담 실시간 피드백
```

### Code Ownership
- **Do Not Touch Yet:** C:\DEV\JINDU (JINDU village 운영 요구사항 미결)
- **Complete:** dt_accommodations (current_occupancy field + daily tracking)
- **Complete:** rates table (cost/sell/list fields + runtime JOIN)
- **Connect:** travel_live_status (JOIN in place queries)
- **Build:** Partner API adapter layer
- **Build:** occupancyService.js

---

## 5. 소담 — Decision / Hospitality Policy

### 역할
한 문장: **"이 소원이를 어떤 조건으로 모시는 것이 가장 좋은가?"**

### Input Contract
```
SOWON_CONTEXT:
  - party_composition
  - emotion_profile
  - accessibility_needs
  - budget_range
  - preference_tags

CANDIDATES:
  - [candidate_id, resource_type, suitability_score, ...]
  (from 무여정 output)

AVAILABILITY:
  - {resource_id: AVAILABILITY contract}
  (from FLOW output)

PRICE:
  - {resource_id: cost/sell/list prices}
  (from rates/pricing)

PARTNER_CONDITION:
  - operation_mode (direct|agency|commission|hybrid)
  - special_offer
  - allocation_hold

BENEFIT:
  - available_credentials
  - discount_policy
  - point_usage

BUSINESS_POLICY:
  - margin_min
  - margin_max
  - no_offer_condition
```

### Output Contract
```
OFFER: {
  offer_id,
  resource_id,
  offering_price (sell_price for customer),
  why: {
    suitability: [factors],
    why_not_alternatives: [reasons]
  },
  price_condition: {
    base_price,
    benefit_applied,
    final_price,
    margin_for_dreamtown
  },
  valid_until: ISO 8601,
  next_action: "confirm|select_variant|ask_question|..."
}

NO_OFFER: {
  reason: "no_suitable|occupancy_full|outside_policy|other",
  fallback_options: [...]
}

WRITE_BACK: {
  CONFIRMED: {...},
  INFERRED: {...},
  OPEN: {...}
}
```

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Candidate Ranking** | quoteEngine.calculatePrice() (480 lines) | daily-miracles-mvp | PRICE ONLY (hardcoded 60k/89k) | multi-criteria ranking (suitability→occupancy→availability) | EXTEND |
| **Cost/Sell/List Model** | rates table (Migration 190) | daily-miracles-mvp | SCHEMA ONLY (base_rate only) | cost_price, sell_price, list_price fields | COMPLETE |
| **Margin Calculation** | None in quoteEngine | daily-miracles-mvp | ABSENT | cost - sell_price = margin logic | BUILD |
| **Operation Mode** | dealStructuringService.js (380 lines) | daily-miracles-mvp | LIVE (direct/agency/commission/hybrid determination) | margin policy per mode | EXTEND |
| **Approval Workflow** | dealStructuringService approval logic | daily-miracles-mvp | LIVE | deal rejection criteria | EXTEND |
| **No Offer Decision** | travelGuideService empty list return | daily-miracles-mvp | PARTIAL (implicit) | explicit deal_rejected with reason | BUILD |
| **Occupancy Check** | None | daily-miracles-mvp | ABSENT | blocking based on availability | BUILD |
| **Benefit Integration** | _getBenefits() (line 207) | daily-miracles-mvp | PARTIAL (returned but not applied to deal) | benefit-adjusted pricing | EXTEND |
| **Deal Explanation** | generateWhyDetails() (line 210-232) | daily-miracles-mvp | PARTIAL (travel only) | hotel/meal/benefit explanation | EXTEND |
| **CAP-04 × CAP-05** | None | daily-miracles-mvp | ABSENT | 무여정 결과 + FLOW availability 동시 입력 | BUILD |

### CRITICAL FINDINGS
```
❌ Current Issue: Hardcoded Pricing
   quoteEngine.calculatePrice(room_type, party_size, date, partner_id) {
     const price = date.day === 'weekday' ? 60000 : 89000;
     return price;
   }
   - rates 테이블 JOIN 없음
   - occupancy 체크 없음
   - cost/sell/list 구분 없음
   - margin 계산 없음

✓ PRESERVE: dealStructuringService operation_mode logic
   - direct/agency/commission/hybrid 분류 검증됨
   - 파트너 조건 처리 가능성 있음

❌ BUILD: Deal Decision Engine
   - 여러 후보 중 최고 조건 선택 로직
   - NO_OFFER 판정 (좋은 deal 없으면 팔지 않음)
```

### Code Ownership
- **Keep:** dealStructuringService.js (operation_mode 우수)
- **Extend:** quoteEngine.calculatePrice() (rates JOIN + cost/sell/margin 추가)
- **Build:** dealDecisionEngine.js (candidate ranking + multi-criteria)
- **Build:** dealExplanationService.js (why_factors + alternatives)

---

## 6. Commerce (Voyage + NicePay + Quote)

### 역할
한 문장: **"결정한 것을 실제 거래로 만들 수 있는가?"**

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Booking Creation** | voyageRoutes.js (403 lines) | daily-miracles-mvp | LIVE (6-stage FSM) | recommendation_id tracking | EXTEND |
| **Payment Processing** | nicepayService.js (480 lines) + nicepayRoutes.js (662 lines) | daily-miracles-mvp | LIVE (production-hardened) | — | PRESERVE |
| **Quote Generation** | quoteEngine.generateQuote() | daily-miracles-mvp | LIVE (기본 구조) | cost/sell/margin transparency | EXTEND |
| **Booking Status Machine** | voyage_wishes (Migration 059, 6-stage) | daily-miracles-mvp | LIVE | — | PRESERVE |
| **Settlement** | dtSettlementService.js (387 lines) | daily-miracles-mvp | LIVE (2-system: Creator pool + Partner commission) | — | PRESERVE |
| **Cancellation / Refund** | None | daily-miracles-mvp | PARTIAL | refund workflow | COMPLETE |

### Integration Point
```
소담 OFFER
    ↓
voyage booking creation
    ↓
NicePay payment
    ↓
SOYEOWOOL-MAEK context update (NEXT action)
    ↓
Guardian notification
```

### Code Ownership
- **Keep:** voyageRoutes.js, nicepayService.js, dtSettlementService.js
- **Extend:** voyage_bookings (recommendation_id FK, reason, selected_from)

---

## 7. Benefit (Credential System)

### 역할
한 문장: **"약속한 혜택을 실제로 받을 수 있는가?"**

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Credential Issuance** | credentialTriggerService.js (216 lines) | daily-miracles-mvp | LIVE (auto-issue on payment) | offer_id linkage | EXTEND |
| **QR Management** | benefitCredentialRoutes.js (753 lines) | daily-miracles-mvp | LIVE (issuance, verify, redeem) | — | PRESERVE |
| **Verification** | 5-fail PIN lockout | daily-miracles-mvp | LIVE | — | PRESERVE |
| **Settlement** | Credential redemption tracking | daily-miracles-mvp | LIVE | — | PRESERVE |
| **Ramada V23 Integration** | Reference only (separate system) | sowon-dreamtown | DO NOT TOUCH YET | API adapter if needed | DEFER |

### Code Ownership
- **Keep:** benefitCredentialRoutes.js (fully operational)
- **Extend:** credentialTriggerService.js (offer_id integration)

---

## 8. Guardian (Follow-up & Re-engagement)

### 역할
한 문장: **"지금 다시 찾아가야 할 때인가?"**

### Current Architecture
```
Guardian (scheduled)
    ↓
SOYEOWOOL (reawaken)
    ↓
SOYEOWOOL-MAEK (load context)
    ↓
Conversation resume
```

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Scheduled Dispatch** | guardianDispatchService.js (line 169-197, T+1/7/30) | daily-miracles-mvp | LIVE (dry-run, Phase 2 SMS pending) | trigger logic (OPEN/NEXT/STAR_STATE/MOMENT) | EXTEND |
| **Context Restoration** | None | daily-miracles-mvp | ABSENT | SOYEOWOOL-MAEK restoration | BUILD |
| **Message Templates** | reminders (3m/6m/12m promise) | daily-miracles-mvp | LIVE | general follow-up templates | EXTEND |

### Integration Point
```
SOYEOWOOL-MAEK:
  - OPEN: unresolved questions
  - NEXT: agreed next action
  - STAR_STATE: growth milestone
  - MOMENT: candidate sowon-gil
  
IF (deadline_reached OR milestone_achieved):
  Guardian → SOYEOWOOL reawaken
```

### Code Ownership
- **Keep:** guardianDispatchService.js (scheduling framework)
- **Build:** guardianTriggerService.js (context-aware reawakening)

---

## 9. Wish / Star (Lifecycle)

### 역할
한 문장: **"소원에서 별까지, 생명주기를 어떻게 기록하는가?"**

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Wish Submission** | voyage_wishes table (Migration 059, 6-stage FSM) | daily-miracles-mvp | LIVE | SOYEOWOOL-MAEK linkage | EXTEND |
| **Wish State Machine** | CHECK constraint (6 valid states) | daily-miracles-mvp | LIVE | — | PRESERVE |
| **Star Creation** | dt_stars table (day1→day7→day30→day100→day365) | daily-miracles-mvp | LIVE | phase awareness in context | CONNECT |
| **Promise Tracking** | star_promises (3m/6m/12m capsules) | daily-miracles-mvp | LIVE | timeline in SOYEOWOOL-MAEK | CONNECT |
| **Travel Journey** | voyage_bookings + booking history | daily-miracles-mvp | LIVE | wish ↔ voyage linkage | EXTEND |

### Code Ownership
- **Keep:** All wish/star schema and FSM logic
- **Connect:** SOYEOWOOL-MAEK context integration

---

## 10. 소원꿈터 (Dream Gallery)

### 역할
한 문장: **"내 삶에서 DreamTown과 함께 만들어진 것은 무엇인가?"**

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Wish Listing** | dt_stars table | daily-miracles-mvp | SCHEMA ONLY | presentation logic, curation | BUILD |
| **Story Presentation** | storybooks table (Migration 162, JSONB slides) | daily-miracles-mvp | SCHEMA ONLY | frontend rendering, meta extraction | BUILD |
| **Promise Visualization** | star_promises | daily-miracles-mvp | SCHEMA ONLY | timeline UI | BUILD |
| **Benefit/Credential Show** | benefitCredentialRoutes QR data | daily-miracles-mvp | SCHEMA ONLY | redemption history display | BUILD |
| **Achievement Display** | None | — | ABSENT | user growth metrics | BUILD |

### Code Ownership
- **Build:** dreamGalleryService.js
- **Build:** Frontend components (sowon-dreamtown or daily-miracles-mvp)

---

## 11. 소원길 (Sowon-Gil, Meaningful Timeline)

### 역할
한 문장: **"내 삶에서 어떤 순간들이 의미 있었는가?"**

### Moment Elevation Process
```
RAW EVENT (모든 클릭·대화·결제)
    ↓
MOMENT CANDIDATE (의미 있을 것 같은 것)
    ↓
SIGNIFICANCE SCORING (의미도 평가)
    ↓
MEANING EXTRACTION (내러티브 추출)
    ↓
SOWON-GIL (공개된 타임라인)
```

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Event Logging** | journey_logs, voyage_logs | daily-miracles-mvp | LIVE | significance field, MOMENTS category | EXTEND |
| **Moment Candidate** | SOYEOWOOL-MAEK MOMENTS field | — | DESIGN ONLY | capture + scoring implementation | BUILD |
| **Meaning Extraction** | None | — | ABSENT | narrative generation | BUILD |
| **Curation** | None | — | ABSENT | user selection / consent gate | BUILD |
| **Privacy Gate** | None | — | ABSENT | de-identification before Aurora3/5 use | BUILD |

### Code Ownership
- **Build:** momentService.js (capture + scoring)
- **Build:** meaningExtractorService.js (narrative)
- **Build:** privacyGateService.js (de-id)

---

## 12. Aurora3 / Aurora5 (Research & Wisdom)

### 역할
**Aurora3:** 사람들의 경험에서 세상을 연구한다.  
**Aurora5:** 소원이 이루어지는 과정에서 지혜를 연구한다.

### CRITICAL CONSTRAINT: Privacy/Consent Gate
```
PERSONAL EXPERIENCE
        ↓
   Privacy Check
   Consent Gate
   De-identification
        ↓
Researchable Pattern
        ↓
NUTRIENT (집단지식)
```

**절대 금지:** 개인의 Raw Story를 그대로 집단지성에 넣는 것 ❌

### 기존 자산 매핑

| Aspect | Existing Asset | Repo | Current Status | Contract Gap | Action |
|---|---|---|---|---|---|
| **Experience Capture** | event logs, story data | daily-miracles-mvp | SCHEMA ONLY | Aurora-specific logging | BUILD |
| **Pattern Recognition** | None | — | ABSENT | ML model for experience analysis | BUILD |
| **Wisdom Generation** | None | — | ABSENT | insight extraction and ranking | BUILD |
| **Privacy Compliance** | None | — | ABSENT | full de-identification + consent | BUILD |

### DO NOT IMPLEMENT YET
```
❌ Aurora3/5 business logic
❌ Research data pipeline
❌ Insight models

✓ Design privacy/consent architecture first
```

---

## Contract Mapping Summary Table

| Layer | Role | Existing Asset | Repo | Current | Action | Priority |
|---|---|---|---|---|---|---|
| **Orchestration** | SOYEOWOOL | contextExtractionService.js | daily-miracles-mvp | LIVE (travel) | PRESERVE + EXTEND | HIGH |
| **Continuity** | SOYEOWOOL-MAEK | sessionService.js | daily-miracles-mvp | LIVE (120min) | EXTEND + BUILD | HIGH |
| **Travel Intel** | 무여정 | travelGuideService.js | daily-miracles-mvp | VERIFIED | PRESERVE + EXTEND | HIGH |
| **Availability** | FLOW | dt_accommodations, rates, travel_live_status | daily-miracles-mvp | SCHEMA ONLY | COMPLETE + BUILD | CRITICAL |
| **Decision** | 소담 | quoteEngine.js, dealStructuringService.js | daily-miracles-mvp | PARTIAL | EXTEND + BUILD | CRITICAL |
| **Commerce** | Commerce | voyageRoutes, nicepayService | daily-miracles-mvp | LIVE | PRESERVE + EXTEND | MEDIUM |
| **Benefit** | Benefit | credentialTriggerService, benefitCredentialRoutes | daily-miracles-mvp | LIVE | PRESERVE + EXTEND | MEDIUM |
| **Follow-up** | Guardian | guardianDispatchService | daily-miracles-mvp | PARTIAL | EXTEND + BUILD | MEDIUM |
| **Lifecycle** | Wish/Star | voyage_wishes, dt_stars, star_promises | daily-miracles-mvp | LIVE | PRESERVE + CONNECT | MEDIUM |
| **Gallery** | 소원꿈터 | storybooks, dt_stars | daily-miracles-mvp | SCHEMA ONLY | BUILD | LOW |
| **Timeline** | 소원길 | journey_logs | daily-miracles-mvp | LIVE (raw) | BUILD (curation) | LOW |
| **Research** | Aurora3/5 | None | — | ABSENT | BUILD (with privacy) | DEFERRED |

---

## High-Risk Gaps Requiring Immediate Attention

### CRITICAL — Block any further implementation without resolving

1. **CAP-04 × CAP-05 Integration (소담)**
   - Current: Separate systems (무여정 results ≠ FLOW availability ≠ 소담 decision)
   - Risk: Can create impossible offers (recommend occupied rooms, unavailable meals)
   - Action: Build shared context packet + decision integration

2. **Occupancy Tracking (FLOW)**
   - Current: is_available BOOLEAN (on/off only)
   - Risk: Overbooking possible (quoteEngine never checks current_occupancy)
   - Action: Implement daily_occupancy_log + real-time state machine

3. **Cost/Sell/List/Margin Model (소담)**
   - Current: Hardcoded 60k/89k pricing, no margin distinction
   - Risk: Cannot implement partner commission, dynamic pricing, or business policy
   - Action: Add cost_price/sell_price/list_price fields + margin calculation

4. **Session Restoration (SOYEOWOOL-MAEK)**
   - Current: 120min timeout → complete context loss
   - Risk: Journey interruption = lost sale + poor UX
   - Action: Implement restoration token + broader_context table

### HIGH — Schedule for Phase 2

5. **Deal Explanation (소담)**
   - Current: why_details only for travel
   - Risk: Customers don't understand why Hotel A not Hotel B
   - Action: Implement dealExplanationService (multi-factor reasoning)

6. **Multi-resource Ranking (무여정 + 소담)**
   - Current: Travel places ranked, hotels/restaurants random/first-match
   - Risk: Poor recommendations outside travel domain
   - Action: Extend 8-filter cascade to all resources

7. **No Offer Decision (소담)**
   - Current: Return empty list (implicit rejection)
   - Risk: No user feedback on why deal rejected
   - Action: Explicit deal_rejected with reason

8. **Guardian Reawakening (Guardian)**
   - Current: Scheduled messaging only
   - Risk: Missed re-engagement opportunities
   - Action: Build context-aware Guardian → SOYEOWOOL trigger

---

## What NOT to Do

```
❌ Create intentClassifier.js yet
   (먼저 Contract Mapping을 끝낸 후에만)

❌ Create serviceRouter.js yet
   (SOYEOWOOL 인터페이스가 먼저 확정되어야 함)

❌ Create broader_context table yet
   (SOYEOWOOL-MAEK context contract가 먼저 확정)

❌ Create decision_rules table yet
   (소담의 우선순위/정책이 먼저 명확해야 함)

❌ Merge C:\DEV\* repositories yet
   (One Language first, then One Repository)

❌ Modify daily-miracles-mvp CLAUDE.md
   (existing rules preserved)

❌ Implement JINDU / Food Trucks
   (운영 요구사항이 명확해질 때까지)

✓ DO: Create this Contract Mapping document
✓ DO: Review with stakeholders
✓ DO: Lock contract definitions
✓ DO: Plan implementation phases based on gaps
```

---

## Next Steps

1. **Contract Stakeholder Review** (24-48h)
   - SOYEOWOOL definition review
   - SOYEOWOOL-MAEK context contract review
   - 무여정/FLOW/소담 input/output contracts review

2. **Gap Analysis & Roadmap** (1 week)
   - 8 Critical Gaps를 Phase별로 분류
   - 각 Phase 스코프 확정
   - 팀 할당 및 스케줄 결정

3. **Implementation Phase 1** (4-6 weeks, CRITICAL gaps only)
   - SOYEOWOOL-MAEK context packet 구현
   - FLOW occupancy tracking 구현
   - 소담 cost/sell/margin model 구현
   - CAP-04 × CAP-05 integration

4. **Implementation Phase 2** (4-6 weeks, HIGH gaps)
   - Service Router + orchestration engine
   - Deal Decision Engine + explanation
   - Guardian reawakening logic

5. **Implementation Phase 3+** (subsequent phases)
   - 소원꿈터 / 소원길 curation
   - Aurora3/5 (with privacy compliance)

---

## Document Status

- **Version:** 0.1
- **Created:** 2026-09-12
- **Based on:** CAP-01~06 Deep Verification (4개 재채점)
- **Lock Status:** DRAFT (awaiting stakeholder review)
- **Next Review:** Contract definitions finalized
- **Owner:** SOYEOWOOL Architecture Team

