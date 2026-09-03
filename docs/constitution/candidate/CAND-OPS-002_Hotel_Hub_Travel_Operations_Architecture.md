# CAND-OPS-002: Hotel Hub & Travel Operations Architecture

**Status:** Candidate  
**Category:** Operations / System Architecture  
**Importance:** Level 4 (Strategic Direction)  
**Created:** 2026-08-24  
**Evidence Base:** DREAMTOWN_TRAVEL_BUSINESS_CAPABILITY_AUDIT.md (full code-level audit)  
**Next Step:** Review → Approved → LOCKED

---

## CORE DEFINITION

DreamTown는 새로운 여행 시스템을 계속 만드는 것이 아니라,
**이미 구축된 여행·견적·정산·혜택·쇼핑·MICE 자산을
실제 고객 흐름에 따라 연결하고,
호텔을 고객 접점의 허브로 활용하며,
복잡한 운영은 여수여행센터가 담당하는 구조**로 발전한다.

---

## PRINCIPLE

> **Build only after Evidence.**  
> **Connect before rebuilding.**

DreamTown의 기술은 기능의 수로 성장하지 않는다.  
사람과 현장에서 확인된 필요를,  
이미 가진 자산과 가장 짧게 연결할 때 성장한다.

---

## VERIFIED CURRENT ASSETS

### A. FIT Travel (1-4 Person) — IMPLEMENTED & PRODUCTION

| Asset | Location | Evidence | Status | Limitation |
|---|---|---|---|---|
| Travel recommendation engine | `travelGuideService.js` | Phase 1B tested, cluster diversity 0%, traveler fit working | ✅ Production | FIT only; no group variant |
| Place curation | `travel_places (12)`, `travel_restaurants (~10)` | Migrations 200, 201 | ✅ Verified data | Limited to YEOSU |
| Accessibility filtering | Migration 206, canonical fields | wheelchair/stroller/bus verified | ✅ Working | No capacity verification |
| Itinerary generation (≤4 pax) | `add_itinerary_tables.sql`, `itineraryService.js` | daily_plans (JSON), auto-generation | ✅ Working | Individual only; no resources |
| Benefit credentials | `benefitCredentialRoutes.js`, Migration 077 | 449 issued, 340 redeemed | ✅ Production | Benefit partners only |

### B. Quotation & Deal Structuring — IMPLEMENTED (fields) + PARTIAL (workflow)

| Asset | Location | Evidence | Status | Limitation |
|---|---|---|---|---|
| Core quotation engine | `quoteEngine.js`, `quote_schema.sql` | Cost/sell/list, day_type pricing | ✅ Working | No group resources |
| Operation mode determination | `dealStructuringService.js` | 4 modes (direct/agency/commission/hybrid) | ✅ Working | Manual mode override possible |
| Deal structuring fields | `add_deal_structuring_fields.sql` | 23 fields added (operation_mode, settlement_method, etc.) | ✅ Schema ready | Routes may not enforce |
| Auto-approval thresholds | `dealStructuringService.js` line 61-65 | maxAmount 3M, maxGuests ≤20 | ✅ Defined | Unknown if enforced in practice |
| Approval state machine | Migration for `approval_status` field | pending → deal_review → ceo_approval → approved | ⚠️ Fields exist | No `/api/approve` endpoint |

### C. Shopping & Partner Settlement — IMPLEMENTED

| Asset | Location | Evidence | Status | Limitation |
|---|---|---|---|---|
| Product catalog | `dt_shop_products` | name, price, category, wish_types ARRAY | ✅ Working | Partner products only |
| Order management | `dt_shop_orders` | quantity, payment_key, status | ✅ Working | No inventory sync |
| Delivery tracking | `dt_order_deliveries` | recipient, address, tracking_number | ✅ Working | Manual fulfillment |
| Settlement (shop) | `dt_settlements` (shop version) | partner_amount vs platform_amount split | ✅ Working | Separate from travel settlement |

### D. MICE / Event Reporting — IMPLEMENTED (post-event framework)

| Asset | Location | Evidence | Status | Limitation |
|---|---|---|---|---|
| Participant registry | `ops_mice_participants` (별지2-1호) | Pre/onsite, fee_paid, signature | ✅ Verified | Post-event only |
| Accommodation confirmation | `ops_mice_stays` (별지2-2호) | hotel_name, checkin/checkout, rooms_count | ✅ Verified | No room allocation |
| Expense documentation | `ops_mice_expenses` (별지2-3호) | Category, amount, evidence_assets (JSONB) | ✅ Verified | No pre-event validation |
| Photo log | `ops_mice_photos` (별지2-3호) | photo_tag ENUM, location, taken_at | ✅ Verified | Manual upload required |
| Result reporting package | `ops_mice_report_packs` | ZIP generation, checklist | ✅ Verified | Post-event only |

### E. Foundation Systems

| Asset | Location | Evidence | Status | Limitation |
|---|---|---|---|---|
| User identity (stars) | `dt_stars.user_id`, `journeys.root_access_key` | Token-based session, activity tracking | ✅ Working | No partner attribution |
| Partner identity | `dt_partners` + `partner_code` (Migration 105) | 7 benefit partners mapped | ✅ Phase 1 complete | Phase 2 hard FK pending |
| Session continuity | `sessionService.js` | session_id, last_active_at tracking | ✅ Working | No cross-hotel context |

---

## DISCONNECTED GOLD

### Definition
> Existing code/schema that is functionally complete but not connected to customer journeys, so current value is not fully delivered.

| Gold | Part A (Exists) | Part B (Missing) | Connection Gap | Value If Connected |
|---|---|---|---|---|
| **Group inquiry capture** | `group_inquiries` table (13 fields: room_pref, meal_pref, bus_required) | Room allocation logic, meal planning logic, vehicle selection | Text inputs → no downstream processing | Auto-generate room/meal/transport manifest |
| **Quotation approval fields** | `approval_status`, `approved_by` fields | `/api/quote/:id/approve` endpoint, state enforcement | Fields exist; routes don't use them | Enforce CEO approval for high-value/MICE deals |
| **Itinerary generation** | `itineraryService.js` (generates daily_places) | `itinerary_rooms`, `itinerary_meals`, `transport_manifest` tables | Places only; no resource schedule | Sync: place + room + meal + transport in single itinerary |
| **Operation mode logic** | `dealStructuringService.js` (determines direct/agency/commission/hybrid) | Route enforcement in `/api/quote/confirm` | Logic exists; may not be applied | Auto-route quotation based on mode |
| **Travel guide engine** | Recommendation logic (Phase 1B working) | Group persona differentiation | FIT only; no group variant | Apply group_type (company/alumni/family) → different clustering |
| **MICE flag** | `quotes.is_mice` BOOLEAN | MICE-specific itinerary (event-based, not place-based) | Flag set; no downstream handling | Use flag → generate seminar schedule, not tourism itinerary |
| **Settlement split logic** | `dt_shop_orders` (partner_amount vs platform_amount) | `dt_settlements.hotel_id` for referrer tracking | Can track partner; cannot track referrer | Add hotel_id → split commission by referrer |

---

## VERIFIED GAPS

### Critical Missing (Confirmed by code-level audit)

| Gap | Impact | Evidence | Blocker Level |
|---|---|---|---|
| **Vehicle dispatch system** | Cannot quote group 5-30; must manually select vehicle type & price | Zero references to starrex/solati/limousine/bus in all migrations, services, routes | P0 |
| **Room allocation** | Cannot generate hotel room manifest for groups | No `itinerary_rooms` table found | P0 |
| **Meal planning** | Cannot schedule meals for groups | No `itinerary_meals` table found | P0 |
| **Transport manifest** | Cannot schedule buses or assign drivers | No `transport_manifest` table found | P0 |
| **Multi-stage approval workflow** | Cannot manage B2B collaborative quotation (draft → internal → customer → signed) | No `/api/quote/:id/request-changes`, no change tracking | P1 |
| **Incentive eligibility engine** | Cannot pre-qualify groups for government subsidy | No `incentive_programs`, `incentive_rules`, or eligibility logic | P2 |
| **Hotel identity model** | Cannot implement Ramada hub or multi-hotel | No `dt_hotels` table; no `hotel_id` foreign keys on journeys/quotes | P0 |
| **Tenant isolation** | Cannot safely share with multiple hotels | No row-level security, no permission model | P1 |
| **Collaborative editing** | Cannot let multiple people edit quotation with roles | No owner/editor/viewer model on quotes | P1 |
| **Regional hardcoding** | Cannot expand to Suncheon/Goheung/etc. | city_code hardcoded in many places; only YEOSU seed data | P2 |

### What is NOT Missing

- ✅ Individual travel recommendation
- ✅ Itinerary generation (for ≤4 pax)
- ✅ Benefit credential system
- ✅ Shopping & order management
- ✅ MICE post-event reporting framework
- ✅ Settlement/commission calculation
- ✅ User identity & session tracking

---

## STRATEGIC DIRECTION: HOTEL HUB MODEL

### Vision

```
┌──────────────────────────────────────────────────────┐
│                  CUSTOMER ENTRY                       │
│                                                       │
│               RAMADA / OTHER HOTELS                  │
│          (Trust, Existing Traffic, Rooms)            │
│                                                       │
├──────────────────────────────────────────────────────┤
│             LUMI / DREAMTOWN LAYER                   │
│         (Intelligence, Personalization)              │
│                                                       │
│  • Travel Information (별빛항로 + Lumi)             │
│  • FIT Recommendations                               │
│  • Group Travel Planning                             │
│  • MICE/Seminar Coordination                         │
│  • Incentive Eligibility                             │
│  • Local Shopping                                    │
│  • Ticket/Experience Booking                         │
│                                                       │
├──────────────────────────────────────────────────────┤
│       YEOSU TRAVEL CENTER (Operations)               │
│                                                       │
│  • Quotation Finalization                            │
│  • Vehicle & Route Coordination                      │
│  • Restaurant & Meal Scheduling                      │
│  • MICE Logistics & Evidence                         │
│  • Incentive Administration                          │
│  • Customer Service & Adjustments                    │
│  • Settlement & Reporting                            │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Hotel Role (Zero-Operation Principle)

| What Hotel DOES | What Hotel DOES NOT DO |
|---|---|
| Customer trust & existing traffic | Operate travel details |
| Provide room/facility info | Book rooms (we do) |
| Receive guest feedback | Manage reservations system |
| Host branded landing | Handle vehicle dispatch |
| Manage gift/dining partnerships | Process quotations |
| | Coordinate MICE logistics |
| | Administer incentives |

### DreamTown/Lumi Role

- Recommendations personalized by star journey + emotion
- Group persona detection (company/alumni/family)
- Incentive eligibility pre-qualification
- Collaborative quotation planning
- Evidence collection & automation

### Travel Center Role

- All operational reality (vehicle, rooms, meals, people, money)
- MICE event logistics
- Government compliance
- Customer relationship
- Fallback decision-making

---

## NOW / NEXT / LATER

### NOW (Next 2-4 weeks)

**Objective:** Launch Ramada Lumi Travel Information MVP

**What we do:**
- Complete Ramada landing page with Lumi travel recommendations
- Integration: Ramada → Lumi travel guide → place details → booking CTA
- Deep link: Ramada guest → Lumi recommendations → local guide

**What we do NOT do:**
- Group quotation
- Hotel integration in quotation system
- Multi-hotel architecture
- Approval workflow
- Incentive pre-qualification

**Success metric:**
"Actual Ramada guests using Lumi travel information"

### NEXT (4+ weeks, after MVP launch)

**Objective:** Observe actual customer usage patterns

**What we observe:**
- FIT (couples/families) request volume → actual pain points
- Group inquiry frequency (5-10 / 5-14 / 15+ pax breakdown)
- Vehicle selection questions
- Room configuration preferences
- Meal coordination needs
- MICE/seminar event requests
- Customer feedback on modification workflow

**What we measure:**
- How many FIT recommendations → bookings?
- How many group inquiries requires manual quotation?
- What questions repeat most frequently?
- Where is Travel Center staff spending time?

**Evidence triggers next phase:** Pattern repetition (not single incidents)

### LATER (Evidence-driven development)

#### If "groups 5-14 asking for vehicle selection" repeats:
→ Implement vehicle dispatch system

#### If "customer wants to modify room/meal after proposal" repeats:
→ Implement change request & approval workflow

#### If "incentive eligibility question" repeats:
→ Build incentive pre-qualification engine

#### If "multiple hotels want same system" repeats:
→ Build multi-hotel architecture (hotel_id FK, tenant isolation)

#### If "regional expansion requested" repeats:
→ Decouple from YEOSU hardcoding

---

## RESTART CONDITIONS

### Development CAN resume when:

✅ **Repeated field Evidence** of specific need

Examples:
- "5-14 person group inquiries" appear 10+ times in 1 month
- "Customer wants to modify quotation" happens 5+ times
- "Incentive eligibility question" from 3+ different event organizers
- "We need Suncheon hotel integration" request from real partner

### Development MUST NOT resume because:

❌ "The feature would be useful someday"  
❌ "The architecture exists (but isn't connected)"  
❌ "Thorough hotel architecture requires these tables"  
❌ "Future scalability demands regional support"  

---

## DO NOT START (DEFERRED, NOT CANCELLED)

These items are **strategically valid** but **operationally unvalidated**. Do not begin until Evidence justifies.

### Infrastructure (No Evidence Yet)

- [ ] `dt_hotels` table design & migration
- [ ] `hotel_id` foreign key migration (journeys, quotes, itineraries)
- [ ] Row-level security by hotel_id
- [ ] Hotel-scoped API endpoints
- [ ] Multi-tenant permission model

### Group Operations (No Evidence Yet)

- [ ] Vehicle dispatch system (starrex/solati/limousine/bus capacity rules)
- [ ] Room allocation & manifest generation
- [ ] Meal planning & kitchen coordination
- [ ] Transport scheduling & driver assignment
- [ ] Capacity verification against venue constraints

### Approval & Collaboration (No Evidence Yet)

- [ ] `/api/quote/:id/approve` endpoint
- [ ] `/api/quote/:id/request-changes` endpoint
- [ ] Proposal amendment versioning
- [ ] Change delta tracking & comparison
- [ ] Collaborative editing (owner/editor/viewer roles)

### Incentive System (No Evidence Yet)

- [ ] `incentive_programs` table (government program SSOT)
- [ ] `quote_eligible_incentives` table
- [ ] Pre-qualification engine (eligibility rules JSONB)
- [ ] Subsidy estimation logic
- [ ] Incentive ↔ quotation pricing integration

### Regional Expansion (No Evidence Yet)

- [ ] De-hardcode city_code from services
- [ ] Regional place/restaurant data model
- [ ] Regional partner network scoping
- [ ] Regional incentive program rules

---

## STATUS: NOT YET VALIDATED

### Why are these Deferred, not Approved?

**Because**: Hotel operations exist only in Travel Center staff knowledge and printed manuals, not in code or customer workflows yet.

**Evidence needed**: Ramada guests requesting these specific capabilities repeatedly.

**Timeline**: 2-4 weeks of MVP operation → 4+ weeks of Evidence collection → decision point.

---

## LONG-TERM EXPANSION (Strategic Vision Only)

If Hotel Hub succeeds at Ramada:

```
2026-Q4
└─ Ramada MVP validated

2027-Q1
└─ Observation period (Evidence collection)

2027-Q2
└─ Phase 2 development (Evidence-driven)
   ├─ Group operations (if Evidence)
   ├─ Collaborative workflow (if Evidence)
   └─ Incentive system (if Evidence)

2027-Q3
└─ Suncheon / Goheung hotel integration candidates

2027-Q4
└─ Regional expansion model (if Ramada successful)
```

**Non-negotiable**: Do not expand before Evidence. Do not build multi-hotel before single-hotel succeeds.

---

## KNOWLEDGE PRINCIPLE

This Candidate encodes:

> **What we learned from 11 years of Yeosu Travel Center operations is not lost.  
> It exists in Travel Center staff minds and printed manuals.  
> Technology amplifies this knowledge only when Evidence shows where humans are stuck.  
> Build technology for bottlenecks, not for hypothetical futures.**

---

## SSOT PROMOTION

**Next Step:** Review → Committee Decision

**Do NOT promote to SSOT** until:
1. ✅ Ramada MVP launches
2. ✅ 2+ weeks of real customer usage
3. ✅ Observation report confirms/refutes assumptions
4. ✅ Evidence identifies next operational bottleneck
5. ✅ Architecture updated based on Evidence

**Current Status:** Candidate (AWAITING FIELD VALIDATION)

---

## Related Documents

- DREAMTOWN_TRAVEL_BUSINESS_CAPABILITY_AUDIT.md — Evidence base for this Candidate
- DREAMTOWN_STATUS.md — Current project state
- daily-miracles-mvp CLAUDE.md — Product principles

---

**Created:** 2026-08-24  
**Author:** Claude Code (Audit-based Strategic Capture)  
**Approved by:** (Pending Review Committee)  
**Last Updated:** 2026-08-24
