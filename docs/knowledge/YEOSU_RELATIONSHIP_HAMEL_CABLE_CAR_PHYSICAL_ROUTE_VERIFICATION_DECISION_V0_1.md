# P3→P4 Physical Route Verification Decision V0.1

**문서 유형:** Verification Decision (실행 아님)  
**대상 관계:** 하멜등대(P3) → 여수해상케이블카(P4)  
**생성일:** 2026-09-25  
**Trigger:** NOF-02B OPEN / VERIFY_REQUIRED  
**선행 문서:** `docs/knowledge/YEOSU_RELATIONSHIP_KNOWLEDGE_HAMEL_TO_CABLE_CAR_V0_1.md`  
**Framework:** CAND-OPS-003 V0.2 (Candidate / Approved)  
**Status:** DECISION COMPLETE

---

## IMPORTANT — Scope

이 문서는 **무엇을 검증할지 결정**하는 문서다.

- 실제 Web Search / Browser Research / 전화 / 현장 확인 없음
- Repository Evidence만 사용
- Physical Route 추측 없음
- 거리 / 시간 / 요금 생성 없음
- NOF-02B RESOLVED 처리 없음

---

## 1. Purpose

NOF-02A(Relationship Authoring)는 RESOLVED되었다.  
SOUL은 이제 P3→P4를 단일 Edge로 가정하지 않는다.

그러나 Physical Navigation Layer에는 아직 미검증 항목이 존재한다.

이 문서는 다음 질문에 답한다:

> 무엇을 검증해야 하는가? 어떤 Source가 적절한가? 어떤 정보는 Stable Knowledge이고 어떤 정보는 Live Check인가?

---

## 2. Trigger

| ID | 내용 | 상태 |
|---|---|---|
| NOF-02A | Relationship Authoring Gap | RESOLVED |
| NOF-02B | Physical Route Verification | OPEN — 이 문서 대상 |

---

## 3. Current State

Repository 현재 알고 있는 것:

| 항목 | 현재 값 | Source | 신뢰도 |
|---|---|---|---|
| 자산/돌산 양 탑승장 존재 | 확인됨 | Travel Matrix CSV | PARTIALLY SUPPORTED |
| 하멜전시관→자산탑승장 (CAR) | 약 10분 (참조값) | E6 ROUTE_SOURCE_DERIVED | LOW |
| 케이블카 편도 탑승 소요 | 약 12~15분 | UNVERIFIED_SECONDARY (CONFLICT) | LOW |
| 자산↔돌산 거리 | 약 1.5km (비공식) | UNVERIFIED_SECONDARY | LOW |
| 개인 자차 → 왕복 | Founder Route #001 기준 | FOUNDER_LOCAL | PARTIALLY SUPPORTED |
| 단체 → 편도 가능 | Founder Local + Travel Matrix | FOUNDER_LOCAL | PARTIALLY SUPPORTED |
| 편도/왕복 요금 | 비공식 참고값 (CONFLICT) | WORLD_EXPERIENCE | UNVERIFIED_SECONDARY |

현재 알지 못하는 것 (전부 VERIFY_REQUIRED):

- 자산 측 공식 명칭
- 돌산 측 공식 명칭
- 하멜등대→자산탑승장 직접 이동 시간/방법
- 하멜등대→돌산탑승장 이동 방법
- 편도/왕복 현재 판매 조건

---

## 4. Evidence Reviewed

| 문서 | 관련 내용 |
|---|---|
| `YEOSU_RELATIONSHIP_KNOWLEDGE_HAMEL_TO_CABLE_CAR_V0_1.md` | VERIFY_REQUIRED 12건, LIVE 3건, Branch 구조 |
| `YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_WE_V0_1.md` | P3 VERIFY_REQUIRED 목록 (접근성, 야간, 방파제 구조) |
| `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` | Entity 명칭 혼용, 편도/왕복 행동, Conflict A~H |
| `YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` | 상승의 의미, 내려옴 의미 |
| `YEOSU_FOUNDER_ROUTE_001_TIME_EVIDENCE.md` | E6 참조값, 개인/단체 이용 방식, ROUND_TRIP 확정 |
| `YEOSU_TRAVEL_TIME_MATRIX_V0_1.md` | 개인→왕복, 단체→편도 가능, 자산탑승장↔돌산공원탑승장 |
| `YEOSU_TIME_EVIDENCE_PILOT_V0_1.md` | 편도 요금 CONFLICT, 시간 CONFLICT |
| `YEOSU_2026_VERIFICATION_BATCH_01.md` | 비공식 참고값 (자산역↔돌산역 1.5km, 편도 12~13분) |

---

## 5. Verification Item Inventory

Relationship Knowledge의 모든 VERIFY_REQUIRED / LIVE / UNKNOWN / 미해소 항목 추출:

| ID | 항목 | 현재 상태 | 출처 |
|---|---|---|---|
| VR-P3P4-001 | 자산 측 케이블카 탑승 시설 공식 명칭 | VERIFY_REQUIRED | Cable Car WE Section 16-17 |
| VR-P3P4-002 | 돌산 측 케이블카 탑승 시설 공식 명칭 | VERIFY_REQUIRED | Cable Car WE Section 16-17 |
| VR-P3P4-003 | 하멜등대→자산탑승장 이동 방법 및 시간 | VERIFY_REQUIRED | Relationship Knowledge Section 15 |
| VR-P3P4-004 | 하멜등대→돌산탑승장 이동 방법 및 시간 | VERIFY_REQUIRED | Relationship Knowledge Section 15 |
| VR-P3P4-005 | 방파제 끝→입구 도보 추가 시간 | VERIFY_REQUIRED | OI-03 |
| VR-P3P4-006 | 편도/왕복 판매 조건 현재 구조 | VERIFY_REQUIRED + LIVE | Travel Time Pilot |
| VR-P3P4-007 | 현재 요금 (편도/왕복 각각) | CONFLICT + LIVE | Time Evidence Pilot |
| VR-P3P4-008 | 현재 운영시간 공식 | LIVE | Cable Car WE CONFLICT-H |
| VR-P3P4-009 | 단체 편도 운영 현재 정책 | VERIFY_REQUIRED | Founder Route Lines 220-225 |
| VR-P3P4-010 | 케이블카 편도 탑승 소요시간 공식값 | CONFLICT + VERIFY | Time Evidence Pilot |
| VR-P3P4-011 | 케이블카에서 하멜등대 시각적 가시성 | VERIFY_REQUIRED | Relationship Knowledge Section 3 |
| VR-P3P4-012 | 자산공원↔자산탑승장 Entity 관계 | VERIFY_REQUIRED | Cable Car WE Section 17 |
| VR-P3P4-013 | 돌산공원↔돌산탑승장 Entity 관계 | VERIFY_REQUIRED | Cable Car WE Section 17 |

---

## 6. Entity Resolution

### 현재 Repository Entity 상태

| Entity | 상태 | 이유 |
|---|---|---|
| 하멜등대 | WELL_DEFINED | WE + Founder Review 완료, Entity 독립 확립 |
| 하멜전시관 | WELL_DEFINED | 별도 Entity로 명시됨 |
| 여수해상케이블카 Experience | WELL_DEFINED | travel_places 등록됨 (cablecar) |
| 자산 측 탑승 시설 | **PARTIAL** | Travel Matrix에서 "자산탑승장" 사용. 공식 명칭 미확인. 자산공원과 관계 VERIFY_REQUIRED |
| 돌산 측 탑승 시설 | **PARTIAL** | Travel Matrix CSV에서 "돌산공원탑승장" 사용. 공식 명칭 미확인. 돌산공원과 관계 VERIFY_REQUIRED |

**전체 Entity Resolution: PARTIAL**

### 명칭 혼용 현황

**자산 측 혼용 명칭:**  
`자산탑승장` / `자산역` / `자산정류장` / `해야정류장` / `해야역`

비공식 참고값(Batch 01): "자산역↔돌산역"이라는 표현 사용.  
이것이 공식 명칭인지, 지역 통칭인지 확인 필요.

**돌산 측 혼용 명칭:**  
`돌산공원탑승장` / `돌산역` / `돌산정류장` / `놀아정류장`

**판단:** Entity alias를 임의 통합하지 않는다.  
SOUL은 현재 "자산탑승장"과 "돌산(공원) 측 탑승장"으로 방향 표현 가능하되, 공식 명칭이 확정되면 교체.

---

## 7. Physical Route Gaps

### Gap A — 하멜등대→자산탑승장 (VR-003)

현재 상태:
- E6: 하멜전시관→자산탑승장 CAR 약 10분 (ROUTE_SOURCE_DERIVED LOW)
- 이 값은 하멜전시관 기준이며 하멜등대에 직접 적용 불가

Gap:
- 하멜등대(방파제 출발)→자산탑승장 직접 이동 시간/방법 없음
- 도보 가능 여부 모름
- 버스 접근 모름

SOUL 영향: 이동 방법 안내 불가 → SOUL은 "확인 필요" 안내 의존

### Gap B — 하멜등대→돌산탑승장 (VR-004)

현재 상태: Evidence 전무

Gap: Branch B 접근 방법 완전 불명

SOUL 영향: Branch B 안내 불가

### Gap C — E6 하멜전시관→자산탑승장 직접 전환 불가 (VR-003 관련)

현재 E6 = 하멜전시관 기준 10분 참조값.  
OI-03 추론: 방파제 되돌아오는 시간 추가 필요.

이 Gap 자체는 작은 편이지만, SOUL이 "10분"을 하멜등대→자산탑승장으로 인용하면 FA-NI-01 유형 오류가 된다.

---

## 8. Founder Local Verification Needs

### FL-01 — Two Boarding Options

| 항목 | 현재 상태 |
|---|---|
| 두 탑승장 존재 | PARTIALLY SUPPORTED (Travel Matrix) |
| 공식 명칭 | VERIFY_REQUIRED |
| Corroboration needed | Official Entity Identity |
| Source type | OFFICIAL_PRIMARY |
| SOUL use before verification | 가능 — "두 방향 탑승장" 표현 사용 가능. 공식 명칭은 VERIFY_REQUIRED 명시 |

### FL-02 — One-way / Round-trip

| 항목 | 현재 상태 |
|---|---|
| 선택 구조 | SUPPORTED (복수 Source) |
| 현재 판매 조건 | VERIFY_REQUIRED + LIVE |
| Corroboration needed | 편도/왕복 현재 판매 조건 확인 |
| Source type | OFFICIAL_PRIMARY + LIVE_SOURCE |
| SOUL use before verification | 가능 — 선택 구조 언급, 요금은 "확인 필요" 안내 |

### FL-03 — Group + One-way Pattern

| 항목 | 현재 상태 |
|---|---|
| 구조 가능성 | PARTIALLY SUPPORTED (Founder + Travel Matrix) |
| Universal Rule | NOT SUPPORTED — 금지 유지 |
| Corroboration needed | 단체 운영 현재 정책 |
| Source type | OFFICIAL_PRIMARY (운영사) 또는 FOUNDER_LOCAL 유지 |
| SOUL use before verification | 가능 — "단체 여행 방식에 따라 달라질 수 있음" 표현 허용. 단체=편도 단언 금지 |

**판단:** FL-03은 FOUNDER_LOCAL_ACCEPTABLE 상태로 유지해도 SOUL 품질에 큰 문제 없음. Universal Rule이 되지 않으면 됨.

### FL-04 — Individual/Private Car + Round-trip

| 항목 | 현재 상태 |
|---|---|
| 패턴 | SUPPORTED (Founder Route #001 + Travel Matrix) |
| Universal Rule | NOT SUPPORTED — 금지 유지 |
| Corroboration needed | 추가 사례 또는 이유 구조 검증 |
| Source type | FOUNDER_LOCAL 유지 충분 |
| SOUL use before verification | 가능 — "자차 여행자는 왕복을 선택하는 경우가 많아요" 표현 허용. 단언 금지 |

**판단:** FL-04는 FOUNDER_LOCAL_ACCEPTABLE. 차량 위치 논리는 Evidence 지지됨.

---

## 9. Stable / Semi-Stable / Live / Contextual Classification

| VR ID | 항목 | 분류 | 이유 |
|---|---|---|---|
| VR-001 | 자산 측 공식 명칭 | STABLE | 시설 명칭은 잘 바뀌지 않음 |
| VR-002 | 돌산 측 공식 명칭 | STABLE | 동일 |
| VR-003 | 하멜등대→자산탑승장 이동 | CONTEXTUAL | 수단(자차/도보/버스)에 따라 달라짐 |
| VR-004 | 하멜등대→돌산탑승장 이동 | CONTEXTUAL | 동일 |
| VR-005 | 방파제 추가 시간 | SEMI_STABLE | 방파제 물리 구조는 변경 드묾 |
| VR-006 | 편도/왕복 판매 조건 | SEMI_STABLE | 운영 정책. 변경 가능하나 구조 자체는 안정적 |
| VR-007 | 현재 요금 | LIVE | 요금은 언제든 변경 가능 |
| VR-008 | 운영시간 | LIVE | 성수기/비수기/임시 변경 |
| VR-009 | 단체 편도 정책 | SEMI_STABLE | 운영 방식. 잘 바뀌지 않으나 공식화 여부 불명 |
| VR-010 | 편도 탑승 소요시간 | SEMI_STABLE | 물리 구조 기반. 변경 드묾 |
| VR-011 | 케이블카에서 하멜등대 가시성 | STABLE | 물리적 위치 기반 |
| VR-012 | 자산공원↔자산탑승장 관계 | STABLE | Entity 관계 |
| VR-013 | 돌산공원↔돌산탑승장 관계 | STABLE | Entity 관계 |

---

## 10. Verification Necessity Matrix

| VR ID | 항목 | Need Level | 판단 근거 |
|---|---|---|---|
| VR-001 | 자산 측 공식 명칭 | REQUIRED_RELATIONSHIP | SOUL이 여행자에게 가이드할 때 명칭 혼선 위험 |
| VR-002 | 돌산 측 공식 명칭 | REQUIRED_RELATIONSHIP | 동일 |
| VR-003 | 하멜등대→자산탑승장 이동 | REQUIRED_RELATIONSHIP | Branch A 사용 가능성이 가장 높은 항목 |
| VR-004 | 하멜등대→돌산탑승장 이동 | USEFUL_NOT_REQUIRED | Branch B 현재 Evidence 빈약 + 사용 시나리오 적음 |
| VR-005 | 방파제 추가 시간 | USEFUL_NOT_REQUIRED | SOUL이 "이동 시간은 확인 필요"로 처리 가능 |
| VR-006 | 편도/왕복 판매 조건 | REQUIRED_STABLE | 선택 구조 안내에 필요 |
| VR-007 | 현재 요금 | LIVE_CHECK | SOUL이 사전 저장보다 "확인 필요" 안내가 더 안전 |
| VR-008 | 운영시간 | LIVE_CHECK | 동일 이유 |
| VR-009 | 단체 편도 정책 | FOUNDER_LOCAL_ACCEPTABLE | Universal Rule 아님. 현재 수준으로 충분 |
| VR-010 | 편도 탑승 소요시간 | USEFUL_NOT_REQUIRED | SOUL이 범위 표현(약 12~15분) + VERIFY 안내 가능 |
| VR-011 | 가시성 | DO_NOT_NEED | SOUL 품질에 직접 영향 없음 |
| VR-012 | 자산공원↔자산탑승장 관계 | REQUIRED_RELATIONSHIP | Entity 혼동 방지 |
| VR-013 | 돌산공원↔돌산탑승장 관계 | REQUIRED_RELATIONSHIP | 동일 |

---

## 11. Source Authority Matrix

| VR ID | 항목 | Best Source Type | 대안 Source | 부적합 Source |
|---|---|---|---|---|
| VR-001 | 자산 측 공식 명칭 | OFFICIAL_PRIMARY (운영사 홈페이지 / 공식 관광사이트) | 여수시 공식 관광정보 | 블로그, 나무위키 단독 |
| VR-002 | 돌산 측 공식 명칭 | OFFICIAL_PRIMARY | 동일 | 동일 |
| VR-003 | 하멜등대→자산탑승장 이동 | FIELD_CONFIRMATION (Founder 현장) | 공식 지도 앱 측정값 + Source 명시 | 추측, 비공식 블로그 단독 |
| VR-004 | 하멜등대→돌산탑승장 이동 | FIELD_CONFIRMATION | 공식 지도 앱 | 추측 |
| VR-006 | 편도/왕복 판매 조건 | OFFICIAL_PRIMARY (운영사) | 운영사 전화 확인 | CONFLICT 상태 블로그 단독 |
| VR-007 | 요금 | LIVE_SOURCE (운영사 홈페이지 또는 현장) | — | 과거 블로그 단독 |
| VR-008 | 운영시간 | LIVE_SOURCE | — | 과거 블로그 단독 |
| VR-012 | 자산공원↔탑승장 | OFFICIAL_PRIMARY | 공식 지도 | — |
| VR-013 | 돌산공원↔탑승장 | OFFICIAL_PRIMARY | 공식 지도 | — |

**원칙:** 공식 명칭은 Official Primary 필수. 실제 여행 이동 방법은 Founder/현장 확인이 Official보다 적합할 수 있음.

---

## 12. Numeric Guardrail

이 문서에서 Numeric Knowledge에 적용하는 규칙:

| 수치 | 현재 Source | 사용 가능 여부 |
|---|---|---|
| E6: 10분 (하멜전시관→자산) | ROUTE_SOURCE_DERIVED LOW / trip.com | 하멜등대→자산탑승장에 직접 사용 금지 |
| 12~15분 (편도 탑승) | UNVERIFIED_SECONDARY + CONFLICT | 범위로만 참고, 확정값 금지 |
| 1.5km (자산↔돌산) | UNVERIFIED_SECONDARY (블로그) | 확정값 금지 |
| 25~30분 (왕복 탑승) | UNVERIFIED_SECONDARY | 확정값 금지 |

**SOUL에 적용:**

모든 Numeric을 SOUL이 확정값으로 안내하는 것은 FA-NI-01 위험.  
"약 N분 정도 걸린다고 하는데, 실제로는 다를 수 있어요"와 같이 Source + 불확실성을 함께 표현하거나 "직접 확인해 보세요"로 처리.

---

## 13. Verification Priority

| VR ID | 항목 | Priority | 이유 |
|---|---|---|---|
| VR-001 | 자산 측 공식 명칭 | P1 | SOUL이 안내 시 혼란 유발 가능. Official Research로 빠른 해소 가능 |
| VR-002 | 돌산 측 공식 명칭 | P1 | 동일 |
| VR-003 | 하멜등대→자산탑승장 이동 | P1 | Branch A는 주요 이동 경로. Field Confirmation 필요 |
| VR-004 | 하멜등대→돌산탑승장 이동 | P2 | Branch B Evidence 빈약. SOUL 품질 비차단 |
| VR-005 | 방파제 추가 시간 | P2 | 작은 추가값. 현재 SOUL 안내에 비차단 |
| VR-006 | 편도/왕복 판매 조건 | P1 | 구조 안내에 필요. Official Research 가능 |
| VR-007 | 요금 | P2 | SOUL이 Live Check 안내로 처리 가능 |
| VR-008 | 운영시간 | P2 | 동일 |
| VR-009 | 단체 편도 정책 | P3 | Founder Local 수준으로 충분 |
| VR-010 | 탑승 소요시간 | P2 | 범위 표현으로 현재 처리 가능 |
| VR-011 | 가시성 | P3 | SOUL 품질에 불필요 |
| VR-012 | 자산공원↔탑승장 | P1 | Entity 혼동 방지 필요 |
| VR-013 | 돌산공원↔탑승장 | P1 | 동일 |

**P0:** 없음 — SOUL이 현재 상태로도 위험한 답을 하지 않도록 Bad Answer Pattern이 작성되어 있음.

**P1 요약 (5개):** VR-001, VR-002, VR-003, VR-006, VR-012, VR-013 (Entity + Physical Access + Operational Structure)

---

## 14. Research Bundle Design

### RB-01 — Cable Car Entity Identity

**대상 VR:** VR-001, VR-002, VR-012, VR-013

**Question:**  
자산 측과 돌산 측 케이블카 탑승 시설의 정확한 공식 명칭은 무엇인가? 각 탑승 시설과 인근 공원(자산공원, 돌산공원)의 관계는 무엇인가?

**세부 질문:**
1. 자산 측 탑승 시설의 공식 명칭 — "자산탑승장", "자산역", "해야정류장" 중 어느 것이 운영사 기준 공식 명칭인가?
2. 돌산 측 탑승 시설의 공식 명칭 — "돌산공원탑승장", "돌산역", "놀아정류장" 중 어느 것인가?
3. 자산탑승장과 자산공원은 같은 장소인가, 다른 Entity인가?
4. 돌산탑승장과 돌산공원은 같은 장소인가, 다른 Entity인가?

**Preferred Source:**  
여수해상케이블카 운영사 공식 홈페이지, 공식 관광정보 (여수시 또는 한국관광공사 공식).

**Acceptable Source:**  
공식 지도 앱 표기 (카카오맵/네이버지도 공식 시설명).

**Unacceptable Source:**  
블로그, 나무위키 단독.

**Freshness requirement:**  
최근 1년 이내 공식 Source.

**Evidence threshold:**  
Official Primary 1개 이상. Conflict 시 복수 Official Source 비교.

**Conflict handling:**  
복수 공식 명칭이 있으면 운영사 명칭 우선. 상충 시 VERIFY_REQUIRED 유지.

**Save destination:**  
Cable Car WE Knowledge (Section 16-17 업데이트) + Relationship Knowledge (Section 9, 10 업데이트)

---

### RB-02 — One-way / Round-trip Current Structure

**대상 VR:** VR-006

**Question:**  
현재 여수해상케이블카에서 편도와 왕복 탑승 모두 가능한가? 이것이 현재 안정적인 운영 구조인가?

**세부 질문:**
1. 편도 / 왕복 모두 현재 판매/운영되는가?
2. 일방향 편도(자산→돌산만, 또는 돌산→자산만)가 있는가?
3. 요금은 편도/왕복 별도인가?

**Preferred Source:**  
운영사 공식 홈페이지 또는 현장 안내.

**Unacceptable Source:**  
요금 CONFLICT 상태의 구 블로그 단독.

**Evidence threshold:**  
Official Primary 1개 이상.

**Save destination:**  
Relationship Knowledge Section 11 업데이트.

---

### RB-03 — Hamel→Jasan Physical Access (Field)

**대상 VR:** VR-003

**Question:**  
하멜등대에서 자산탑승장까지 일반적인 이동 방법과 현실적 소요 시간은 무엇인가?

**세부 질문:**
1. 방파제 입구에서 자산탑승장까지 도보로 이동 가능한가? 가능하다면 약 몇 분인가?
2. 차량으로 이동 시 어떤 경로이며 약 몇 분인가? (하멜등대 방파제 입구 기준)
3. 대중교통(버스) 이동 옵션이 있는가?

**Preferred Source:**  
FIELD_CONFIRMATION — Founder 또는 현지 운영 직접 확인이 가장 신뢰할 수 있음.

**대안 Source:**  
공식 지도 앱 경로 측정 (출발점: 하멜등대 방파제 입구, 도착점: 자산탑승장 공식 명칭 기준으로 변경 후).  
단, 앱 측정값 저장 시 Source와 측정 조건을 명시해야 함.

**Unacceptable Source:**  
E6 참조값(하멜전시관 기준)을 하멜등대에 직접 적용.  
추측 기반 시간값.

**Evidence threshold:**  
Founder 확인 1회 이상, 또는 지도 앱 출발점 명확히 한 측정 1회 이상.

**Numeric Guardrail:**  
저장 시 Start Point / End Point / Mode / Source / Date 명기 필수.

**Save destination:**  
Relationship Knowledge Section 9.3 (Branch A Movement Knowledge) 업데이트.

---

## 15. Field Verification Questions

Founder 또는 현장 확인이 필요한 경우 사용할 질문 (이번 단계에서는 실행하지 않음):

### FVQ-01 — 하멜등대→자산탑승장 이동

> "하멜등대 방파제 입구에서 차량으로 자산탑승장까지 보통 몇 분 정도 걸리나요?"

**Gap 해소:** VR-003 (차량 이동 시간)

### FVQ-02 — 자산탑승장 공식 명칭

> "자산 측 케이블카 탑승 시설의 정확한 공식 이름이 무엇인가요? '자산탑승장'으로 부르면 되는지, 아니면 다른 공식 명칭이 있는지요."

**Gap 해소:** VR-001

### FVQ-03 — 도보 가능 여부

> "하멜등대에서 걸어서 자산탑승장까지 갈 수 있나요? 가능하다면 대략 몇 분 정도 걸리는지요."

**Gap 해소:** VR-003 (도보 옵션)

### FVQ-04 — 단체 편도 운영 구조

> "단체 손님이 케이블카를 이용할 때 편도를 선택하고 버스가 반대편에서 기다리는 방식으로 운영하는 경우가 있나요?"

**Gap 해소:** VR-009

**좋은 질문 특성:** 하나의 Evidence gap에 집중. 예/아니오 + 수치 또는 구조 설명 가능. 유도 표현 없음.

---

## 16. Live Check Boundary

다음 항목은 Knowledge Authoring 대상이 아니다.  
SOUL이 사용 시점에 확인하도록 안내한다.

| 항목 | 이유 |
|---|---|
| 당일 운행 여부 | 기상/강풍에 따라 수시 변경 |
| 실시간 대기시간 | 시간대/계절에 따라 변동 |
| 현재 요금 | 언제든 변경 가능 |
| 현재 운영시간 | 성수기/비수기/임시 변경 |
| Cabin 유형별 당일 운영 현황 | 현장 확인 |

**SOUL 표현 예시 (AUTHORING_OBSERVATION — production 적용 금지):**

> "케이블카 타기 전에 오늘 운행하는지, 지금 대기시간은 어떤지 미리 확인해 보는 게 좋아요."

공식 확인 번호: 061-664-7301 (VERIFY_REQUIRED — 공식 여부 미확인)

---

## 17. NOF-02B Resolution Criteria

NOF-02B가 RESOLVED되기 위한 조건:

| 조건 | 현재 상태 | 필요 조치 |
|---|---|---|
| RC-01: 자산/돌산 탑승 시설 공식 명칭 확인 | OPEN | RB-01 실행 |
| RC-02: 하멜등대→자산탑승장 현실적 이동 방법 확인 (최소 1 mode) | OPEN | RB-03 / FVQ-01~03 |
| RC-03: 편도/왕복 현재 판매 구조 확인 | OPEN | RB-02 실행 |
| RC-04: 하멜전시관→하멜등대 직접 수치 전환 제거 | RESOLVED — Relationship Knowledge에서 이미 분리됨 | 완료 |
| RC-05: Stable/Live boundary SOUL safe-answer에 반영 | RESOLVED — Relationship Knowledge Section 20-22 | 완료 |

NOF-02B 해소에 필요한 최소 조치: **RC-01 + RC-02 + RC-03**

현재 Decision 단계 완료 후:  
`NOF-02B = OPEN / VERIFICATION DECISION COMPLETE`

---

## 18. Cross-Place Observation

이번 Decision 단계에서도 다음 구조 패턴이 반복 관찰됨:

`현재 장소 → 복수 옵션(탑승장 선택) → 여행자 조건 → 선택 → 다음 경험`

**Status: OBSERVE ONLY**

| 항목 | 상태 |
|---|---|
| 이번 작업에서 관찰 | YES |
| 다른 장소에서 반복 확인 | UNKNOWN |
| Candidate 생성 | NO |
| Framework 변경 | NO |
| CAND-OPS-003 수정 | NO |

---

## 19. Three Perspectives

### World

세계의 일반적인 지도/검색/관광 안내 시스템은 두 지점 사이를 주로 "출발지 → 도착지 + 이동 시간"의 단일 Edge로 처리한다. 케이블카 같은 경우에도 "자산탑승장에서 탑승" 정도의 정보를 제공할 뿐, 여행자가 어느 지점에서 출발하는지, 편도인지 왕복인지, 차량이 어디 있는지를 결합한 추천을 하지 않는다. 따라서 일반 시스템이 제공하는 Official 정보는 Entity Identity(명칭, 위치)에는 충분하지만 실제 여행자의 상황 맥락(차량 위치, 일정, 그룹 구조)에는 답하지 못한다.

### Phoenix

이 Decision 단계에서 확인된 것: Entity Identity는 Official Research로 해소 가능하지만, Physical Access(하멜등대→탑승장 이동)는 Official Source보다 Founder/현장 확인이 더 신뢰할 수 있다. Source Authority가 Claim Type과 일치해야 한다는 원칙이 이 Case에서 명확하게 드러났다. 또한 P0 항목이 없다는 것은 Relationship Knowledge V0.1이 SOUL의 현재 답변을 위험한 수준에서 보호하고 있다는 의미다.

### Our Originality

SOUL이 단순 Route Finder가 아닌 여행 친구가 되려면 두 가지 Knowledge Layer가 모두 필요하다: (1) Entity/Structural Layer — 탑승장 명칭, 편도/왕복 구조, Branch 선택지. 이것은 Official Research로 확보 가능하다. (2) Situational Layer — 어떤 여행자에게 어떤 선택이 맞는가. 이것은 Founder Local + World Experience가 Official보다 더 적합한 Source다. 이 두 Layer를 분리하여 각각에 맞는 Source를 찾는 것이 이번 Decision의 핵심이다.

---

## 20. Decision

각 Verification Item별 최종 판정:

| VR ID | 항목 | Decision | Bundle / Action |
|---|---|---|---|
| VR-001 | 자산 측 공식 명칭 | RESEARCH_REQUIRED | RB-01 |
| VR-002 | 돌산 측 공식 명칭 | RESEARCH_REQUIRED | RB-01 |
| VR-003 | 하멜등대→자산탑승장 이동 | FIELD_VERIFICATION_REQUIRED | RB-03 + FVQ-01~03 |
| VR-004 | 하멜등대→돌산탑승장 이동 | USEFUL_NOT_REQUIRED | Backlog — P2 |
| VR-005 | 방파제 추가 시간 | USEFUL_NOT_REQUIRED | Backlog — P2 |
| VR-006 | 편도/왕복 판매 조건 | RESEARCH_REQUIRED | RB-02 |
| VR-007 | 현재 요금 | LIVE_CHECK_ONLY | SOUL Live Check 안내 |
| VR-008 | 운영시간 | LIVE_CHECK_ONLY | SOUL Live Check 안내 |
| VR-009 | 단체 편도 정책 | FOUNDER_LOCAL_ACCEPTABLE | FL-03 유지 |
| VR-010 | 탑승 소요시간 | USEFUL_NOT_REQUIRED | 범위 표현 허용 |
| VR-011 | 가시성 | DO_NOT_NEED | — |
| VR-012 | 자산공원↔탑승장 관계 | RESEARCH_REQUIRED | RB-01 |
| VR-013 | 돌산공원↔탑승장 관계 | RESEARCH_REQUIRED | RB-01 |

**P0:** 0개  
**P1 (RESEARCH_REQUIRED / FIELD_REQUIRED):** VR-001, VR-002, VR-003, VR-006, VR-012, VR-013 = 6개  
**P2:** VR-004, VR-005, VR-010 = 3개  
**P3:** VR-011 = 1개  
**LIVE_CHECK_ONLY:** VR-007, VR-008 = 2개  
**FOUNDER_LOCAL_ACCEPTABLE:** VR-009 = 1개  
**DO_NOT_NEED:** VR-011 = 1개

---

## 21. Limitations

| 한계 | 내용 |
|---|---|
| Official Research 미실행 | 이 문서는 결정만 함. 실제 검증 결과 미포함 |
| Field Confirmation 미실행 | FVQ-01~04는 설계만 됨 |
| Branch B Evidence 빈약 | VR-004 P2 결정이나 실제 안내 한계 잔존 |
| Numeric 전체 VERIFY_REQUIRED | SOUL이 이동 시간을 숫자로 안내하지 못하는 상태 지속 |
| 단체 편도 정책 변경 가능 | FL-03은 Founder Local 수준 유지 — 정책 변경 시 재검토 필요 |
