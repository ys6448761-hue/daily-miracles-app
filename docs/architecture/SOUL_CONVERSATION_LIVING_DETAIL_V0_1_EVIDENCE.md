# SOUL_CONVERSATION_LIVING_DETAIL_V0_1_EVIDENCE

**Status:** IMPLEMENTED / FOUNDER + LUMI REVIEW REQUIRED / NOT CLOSED  
**Date:** 2026-10-05  
**Commits:** `3407e95` (connection impl) → `4fc2111` (discovery pattern fix)

---

## 1. PRODUCT DEFINITION

"SOUL 대화에서 '다음에 어디 가면 좋아?' 라는 자연스러운 다음 여행 질문에 대해,  
현재 보고 있는 Living Detail 장소를 제외한 추천을 보여주고,  
추천된 장소의 Living Detail로 이동할 수 있다."

---

## 2. IMPLEMENTED LAYERS

### 2-1. Frontend: `dreamtown-frontend/src/pages/SoulCableCarPage.jsx`

| 변경 | 상태 | 상세 |
|---|---|---|
| `navPlaceCode` state | ADDED | Living Detail 내 장소 전환 핸들러 |
| `placeCode` derivation | MODIFIED | `navPlaceCode \|\| soulResponse.resolved_code \|\| 'cablecar'` |
| `handleSubmit` → `explicit_context.place_code` | ADDED | 현재 장소 전송 |
| `setNavPlaceCode(null)` on submit | ADDED | 새 질문 시 nav 상태 초기화 |
| DISCOVERING 장소 카드 UI | ADDED | Living Detail이 있는 장소만 필터링 노출 |

**DISCOVERING UI 조건:**
- `soulResponse.presentation_mode === 'DISCOVERING'`
- `soulResponse.places` 중 `{ cablecar, odongdo, hyangiram }` 코드만 표시
- 클릭 → `setNavPlaceCode(p.code)` → 해당 Living Detail로 전환

### 2-2. Backend: `services/soyeowoolService.js`

| 변경 | 상태 | 상세 |
|---|---|---|
| `CURRENT_PLACE_KO` constant | ADDED | `{ cablecar, odongdo, hyangiram }` 한국어 매핑 |
| `_generateSoulMessage` signature | MODIFIED | `currentPlaceCode = null` 파라미터 추가 |
| Place-aware second line | ADDED | `"${curPlaceName} 다음으로 갈 곳을 골라봤어요."` |
| `exclude_place_ids` injection | ADDED | `explicit_context.place_code` → 추천 제외 |
| `_isDiscoveryIntent` 패턴 추가 | ADDED | `뭐 하지 / 어딜 가 / 어디 가?` (4fc2111) |
| `DISCOVERY_OVERRIDES` 패턴 추가 | ADDED | `뭐 하지 / 뭐하지` (4fc2111) |

---

## 3. E2E TEST RESULTS

| 시나리오 | 메시지 | 컨텍스트 | DISCOVERING | 현재장소 제외 | Knowledge Safety |
|---|---|---|---|---|---|
| A | 다음에 어디가 좋아? | hyangiram/parents/car | ✓ | hyangiram 제외 ✓ | ✓ |
| B | 다음엔 뭐 하지? | odongdo/family | ✓ | odongdo 제외 ✓ | ✓ |
| C | 그 다음 어디 가? | cablecar | ✓ | cablecar 제외 ✓ | ✓ |
| D | 다음에 어디가 좋아? | cablecar/parents/car | ✓ | cablecar 제외 ✓ | ✓ |
| E | 어디 가면 좋아? | 컨텍스트 없음 | ✓ (PARTIAL) | N/A | 추측 없음 ✓ |
| F-1 | 케이블카 어때? | — | PLACE_KNOWLEDGE ✓ | — | ✓ |
| F-2 | 오동도 알려줘 | — | PLACE_KNOWLEDGE ✓ | — | ✓ |
| F-3 | 향일암 어때? | — | PLACE_KNOWLEDGE ✓ | — | ✓ |

**F-3 보조 확인:** "향일암 가고 싶어" → CLARIFICATION (pre-existing, `가고 싶` DISCOVERY_OVERRIDES 충돌 — V0.1 범위 외)

---

## 4. KNOWLEDGE SAFETY

| 항목 | 결과 |
|---|---|
| 발명된 이동시간 | 0건 ✓ ("2시간" = 여행자 본인 가용시간 반영) |
| Travel Time Matrix | 미사용 ✓ |
| 새 Memory Architecture | 0건 ✓ |
| 4번째 장소 구현 | 0건 ✓ |
| Schema / Migration / DB / Seed | 0건 ✓ |
| 새 recommendation engine | 0건 ✓ |

---

## 5. BUILD / REGRESSION

| 항목 | 결과 |
|---|---|
| 빌드 모듈 수 | **690** |
| 빌드 오류 | **0** |
| Cable Car Living Detail regression | **0건** ✓ |
| Odongdo Living Detail regression | **0건** ✓ |
| Hyangiram Living Detail regression | **0건** ✓ |

---

## 6. HOLD 목록 (V0.1 미구현)

| 항목 | 이유 |
|---|---|
| "향일암 가고 싶어" PLACE_LOOKUP 복구 | 기존 DISCOVERY_OVERRIDES `가고 싶` 충돌 — 별도 판단 필요 |
| SOUL message SUCCESS path place-aware 확인 | PARTIAL 경로에서만 E2E 테스트됨 (time 필드 없이) |
| Human Experience fabrication | HOLD |
| Travel Time Matrix | GOVERNANCE_HOLD |

---

## 7. COMMITS

| Commit | 내용 |
|---|---|
| `3407e95` | feat(soul): SOUL Conversation × Living Detail V0.1 (fork agent) |
| `4fc2111` | fix(soul): DISCOVERY_OVERRIDES + _isDiscoveryIntent pattern coverage |
