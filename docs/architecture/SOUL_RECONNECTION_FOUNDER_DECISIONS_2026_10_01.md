# SOUL Reconnection Founder Decisions
Date: 2026-10-01
Branch: staging/storybook-c7a
Status: APPROVED — implementation scope for SOUL Runtime Reconnection V0.1
Prior Evidence: SOUL_READINESS_AUDIT_EVIDENCE_PACKAGE_V0_1.md / SOUL_RUNTIME_RECONNECTION_DECISION_AUDIT_V0_1.md / SOUL_MINIMUM_RECONNECTION_CONTRACT_AUDIT_V0_1.md / SOUL_FINAL_RECONNECTION_DECISION_EVIDENCE_V0_1.md

---

## D1 — Prepared Judgment First

SOUL JUDGMENT는 Founder 검수 Prepared Authoring을 기본 소유자로 유지한다.

Path B의 runtime DISCOVERY message_ko는 Journey/Explanation 또는 Clarification 용도로 사용하며,
Prepared SOUL JUDGMENT를 자동으로 덮어쓰지 않는다.

**Implementation contract:**
- `SOUL_DISCOVERY` object = unchanged. Renders in SOUL JUDGMENT card via `primaryDiscovery`.
- `response.message_ko` from any Path B response → `soulMessage` state → "여정 안내" card (separate from SOUL JUDGMENT card).
- The two slots do not compete.

---

## D2 — Living Detail Composition V0.1

Living Detail Page가 canonical experience다. 질문 결과가 페이지 전체를 교체하지 않는다.

V0.1 slot assignment:
- `response.course` → JOURNEY card (course blocks appended below JourneyFlow if present)
- `response.quote` → COST card (new minimal card after JOURNEY)
- `response.places[]` → **HOLD** (not displayed)
- `response.next_options[]` → **HOLD** (no existing surface; KEEP_SEPARATE from Quick Context)
- clarification/failure → Runtime `message_ko` → "여정 안내" card

Path B의 기존 결과 화면을 복제하지 않는다.

---

## D3 — Explicit Origin First

V0.1에서는 사용자가 자연어 질문에서 명시한 숙소/출발지를 Traveler Context에 사용한다.

"라마다에서 출발해서..." → origin/hotel context = RAMADA — message text에 포함되어 GPT-4로 전달됨.

Yeouiju / 이전 대화 / 예약정보 등을 통해 숙소를 자동 기억하는 Context Bridge는 이번 구현 범위가 아니다. **HOLD/future.**

---

## Implementation HOLD list

- Phoenix docs/knowledge runtime import
- Place Knowledge migration
- Relationship/Travel Time Matrix 연결
- 새 NL Parser, 새 Schedule Engine, 새 Pricing Engine, 새 Session Engine
- places[] 신규 UI
- next_options[] UI
- Context Bridge / Yeouiju integration
- Journey Snapshot / 소원꿈터 연결
- DB/Schema migration

---

## Current Next Action

**SOUL Runtime Reconnection V0.1 — Golden Question Vertical Slice**

Target: SoulCableCarPage ↔ /api/dt/travel/input/text 최소 연결 + Golden Question acceptance.
