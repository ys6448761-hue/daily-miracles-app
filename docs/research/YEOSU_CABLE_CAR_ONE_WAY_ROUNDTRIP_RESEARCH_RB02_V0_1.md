# 여수해상케이블카 편도/왕복 판매 구조 Research
# RB-02 — Official Research Report V0.1

**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Researcher:** Claude (SOUL Knowledge Authoring)  
**Scope:** RB-02 — VR-006  
**Prior Decision File:** `docs/knowledge/YEOSU_RELATIONSHIP_HAMEL_CABLE_CAR_PHYSICAL_ROUTE_VERIFICATION_DECISION_V0_1.md`  
**Prior Research:** RB-01 (ab8ee0f)

---

## 1. Research Objective

NOF-02B Resolution Criteria RC-03 확인:

> RC-03: 편도/왕복 판매 구조가 검증되었는가? (일반 여행자 기준 자유 선택 여부)

대상 Verification Item:

| VR # | 질문 |
|---|---|
| VR-006 | 편도/왕복 판매 여부 및 조건 — 현재 운영 중인 구조 |

---

## 2. Source Access Log

| 소스 | Tier | 접근 결과 |
|---|---|---|
| yeosucablecar.com (공식 운영사) | OFFICIAL_PRIMARY | SSL 오류 — 접근 불가 (기존 known issue) |
| 나무위키 — 여수해상케이블카 항목 | SUPPORTING | **접근 성공 — 정보 확보** |
| oh-my-post.com 블로그 | NON_OFFICIAL_BLOG | **기존 Repository 기록 활용** |

---

## 3. 확보 Evidence

### 3-1. 나무위키 — 여수해상케이블카 항목 (2026-09-25)

| 항목 | 내용 |
|---|---|
| 편도 판매 | **YES — 편도 탑승 가능** |
| 왕복 판매 | **YES — 왕복 탑승 가능** |
| 선택 자유도 | **제약 없음 — 고객이 편도/왕복 자유 선택** |
| 요금표 구분 | "편도"/"왕복" 이 명확히 구분되어 요금표에 제시됨 |
| 현장 발권 | 현장 발권 원칙. 소셜커머스 예매 시 매표소에서 실제 표 발급 필요 |
| 단체 정책 | "단체 20인 이상 4천 원" 특별 할인 가격 — 편도 강제 정책 아님 |
| 탑승 방향 | 양방향 모두 가능 (명시적 제한 없음) |
| Source Type | SUPPORTING (나무위키) |

### 3-2. 요금표 교차 확인

| 구분 | 일반 캐빈(8인) | 크리스탈 캐빈(6인) |
|---|---|---|
| 대인 왕복 | 17,000원 | 24,000원 |
| 대인 편도 | 14,000원 | 19,000원 |
| 소인 왕복 | 12,000원 | 19,000원 |
| 소인 편도 | 9,000원 | 14,000원 |
| 단체(20인+) | 4,000원 할인 | — |

Source: 나무위키 + oh-my-post.com (기존 Repository YEOSU_2026_VERIFICATION_BATCH_01.md 일치)

### 3-3. RB-01 선행 Evidence (재활용)

oh-my-post.com (NON_OFFICIAL_BLOG, 2026-09-25):
- 왕복 17,000원 / 편도 14,000원 (일반 캐빈 대인) — 나무위키 요금표와 일치
- 편도/왕복 모두 판매 확인

---

## 4. VR-006 Decision

| 항목 | 값 |
|---|---|
| **VR Decision** | **PARTIALLY_VERIFIED** |
| 편도 판매 여부 | YES — 자유 선택 가능 |
| 왕복 판매 여부 | YES — 자유 선택 가능 |
| 선택 제약 | 없음 — 일반 여행자 기준 자유 선택 |
| 단체 편도 강제 여부 | NO — 단체 20인 이상 "할인" 정책만 존재. 편도 강제 없음. |
| 탑승 방향 제한 | 없음 (양방향 가능) |
| 일치 소스 수 | 2 (나무위키 + oh-my-post.com) |
| OFFICIAL_PRIMARY | 접근 불가 (SSL 오류) |
| Provenance | VERIFY_REQUIRED → PARTIALLY_VERIFIED |

---

## 5. Relationship Knowledge 영향 분석

`docs/knowledge/YEOSU_RELATIONSHIP_KNOWLEDGE_HAMEL_TO_CABLE_CAR_V0_1.md`

### 5-1. FL-02 Evidence 재평가

FL-02: "편도와 왕복 모두 제공됨"

| FL Evidence | RB-02 결과 | 판정 |
|---|---|---|
| FL-02 SUPPORTED | 편도/왕복 모두 자유 선택 확인 | **SUPPORTED — FL-02 유지** |

### 5-2. 단체 편도 정책 (FL-03) 재평가

FL-03: "단체는 편도를 선호하는 경향"

| 항목 | RB-02 결과 | 판정 |
|---|---|---|
| 단체 편도 강제 정책 존재 여부 | NO — 20인+ 할인만 존재. 편도 강제 없음. | **FL-03 "Universal Rule 아님" 유지** |
| 단체 편도 선택 가능성 | YES — 편도 자유 선택 가능 | 구조적으로 가능 확인 |
| 단체 할인 = 편도 유도 여부 | 불명확 — 할인이 편도/왕복 모두인지, 편도만인지 미확인 | VERIFY_REQUIRED 유지 |

**주의:** "단체 20인 이상 4천 원 할인"이 편도에만 적용되는지, 왕복에도 적용되는지 명확하지 않음. 이것은 VR-006 범위 안이지만 세부 확인 미완료.

### 5-3. 문서 업데이트 필요 사항

| 섹션 | 현재 상태 | 업데이트 |
|---|---|---|
| Section 11 (편도/왕복) | VERIFY_REQUIRED | PARTIALLY_VERIFIED로 격상 |
| Section 12-2 FL-02 비교 | SUPPORTED | 유지 — 재확인됨 |
| Section 23 Verification Backlog | 케이블카 공식 요금 HIGH | 업데이트 필요 |

---

## 6. NOF-02B RC-03 Impact

| RC | 기준 | 이번 Research 결과 |
|---|---|---|
| RC-03 | 편도/왕복 판매 구조 검증됨 | **PARTIALLY_COMPLETE** — 2개 SUPPORTING 소스. OFFICIAL_PRIMARY 미확인. |

RC-03 PARTIALLY_COMPLETE.  
실질적 결론: 편도/왕복 자유 선택 가능한 구조 확인됨. SOUL이 "편도/왕복 선택 가능"을 안내하는 데 이 정도 Evidence로 충분함.

---

## 7. RB-02 Success Criteria

| SC # | 기준 | 결과 |
|---|---|---|
| SC-01 | VR-006에 답했는가? | PASS |
| SC-02 | Source Authority 충족했는가? | PARTIAL — SUPPORTING 2개, OFFICIAL_PRIMARY 불가 |
| SC-03 | Naming Discipline 적용했는가? | PASS |
| SC-04 | Commit Gate 기준 충족했는가? | PARTIAL — OFFICIAL_PRIMARY 직접 확인 불가 |

**RB-02 Result: PASS WITH FINDINGS**

Findings:
1. OFFICIAL_PRIMARY SSL 오류 지속 — RC-03 최종 확인 불가
2. 단체 20인 이상 할인이 편도만 대상인지, 왕복 포함인지 불명확

---

## 8. NOF-02B 전체 RC 현황 업데이트

| RC # | 기준 | 상태 |
|---|---|---|
| RC-01 | 자산/돌산 측 공식 명칭 검증됨 | PARTIALLY_COMPLETE (RB-01) |
| RC-02 | 하멜등대→자산탑승장 물리적 접근 검증됨 | OPEN — RB-03 필요 (Field Confirmation) |
| RC-03 | 편도/왕복 판매 구조 검증됨 | **PARTIALLY_COMPLETE (RB-02)** |
| RC-04 | 케이블카 이용이 이 여정에서 가능함 확인됨 | COMPLETE (기존) |
| RC-05 | 감정 연속 가능성 지식 확보됨 | COMPLETE (기존) |

---

## 9. Next Action

| 선택 | 내용 | 결정 |
|---|---|---|
| A | RB-03 실행 (하멜→자산탑승장 물리적 접근 — Field Confirmation) | **선택** — RC-02 유일한 미완료 Research Bundle |
| B | RC-01 재시도 (전화 확인) | Founder/사용자가 결정 — Claude 직접 실행 불가 |

**Next Action: RB-03 설계 및 FVQ-01~03 검토**  
하멜등대→자산탑승장 이동 경로 검증 (도보/차량/버스 각 방법별)

---

*RB-02 Research Document V0.1 — 2026-09-25*
