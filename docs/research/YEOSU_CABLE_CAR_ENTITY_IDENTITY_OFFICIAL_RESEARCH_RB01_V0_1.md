# 여수해상케이블카 Entity Identity 공식 Research
# RB-01 — Official Research Report V0.1

**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Researcher:** Claude (SOUL Knowledge Authoring)  
**Scope:** RB-01 — VR-001, VR-002, VR-012, VR-013  
**Prior Decision File:** `docs/knowledge/YEOSU_RELATIONSHIP_HAMEL_CABLE_CAR_PHYSICAL_ROUTE_VERIFICATION_DECISION_V0_1.md`  
**Parent Commit:** 2b67c8c  

---

## 1. Research Objective

NOF-02B Resolution Criteria RC-01 확인:

> RC-01: 자산 측·돌산 측 케이블카 탑승 시설의 공식 명칭이 검증되었는가?

대상 Verification Items:

| VR # | 질문 |
|---|---|
| VR-001 | 자산 측 케이블카 탑승 시설 공식 명칭 |
| VR-002 | 돌산 측 케이블카 탑승 시설 공식 명칭 |
| VR-012 | 자산공원과 자산 측 탑승장의 Entity 관계 |
| VR-013 | 돌산공원과 돌산 측 탑승장의 Entity 관계 |

---

## 2. Source Access Log

| 소스 | Tier | 접근 결과 |
|---|---|---|
| yeosucablecar.com (공식 운영사) | OFFICIAL_PRIMARY | **SSL 인증서 오류 — 접근 불가** |
| 한국관광공사 visitkorea.or.kr | OFFICIAL_PUBLIC | HTTP 404 |
| 여수시 공식 관광 yeosu.go.kr/tour | OFFICIAL_PUBLIC | HTTP 404 |
| 나무위키 — 여수해상케이블카 항목 | SUPPORTING | **접근 성공 — 정보 확보** |
| oh-my-post.com 블로그 | NON_OFFICIAL_BLOG | **접근 성공 — 정보 확보** |
| 카카오맵 place.map.kakao.com | SUPPORTING | HTTP 400 |
| 네이버 지도 map.naver.com | SUPPORTING | 접근 제한 |

**OFFICIAL_PRIMARY 접근 결과:** 불가 (SSL 인증서 오류)  
**NOTE:** 공식 사이트 SSL 오류는 기존 Repository 문서(YEOSU_2026_VERIFICATION_BATCH_01.md)에서 이미 기록된 known issue.

---

## 3. 확보 Evidence

### 3-1. 나무위키 — 여수해상케이블카 항목

| 항목 | 원문 |
|---|---|
| 자산 측 탑승장 | **해야정류장** |
| 돌산 측 탑승장 | **놀아정류장** |
| 운영 구조 | "자산공원에서 돌산공원까지 1.5km 구간을 왕복" |
| 탑승 옵션 | 왕복 / 편도 모두 판매 |
| 캐빈 종류 | 일반 캐빈(8인승) / 크리스탈 캐빈(6인승) |
| 자산공원↔탑승장 | 공원 내 또는 인접 위치 / 엘리베이터·계단 이용 구조 언급 |
| 돌산공원↔탑승장 | 돌산공원 쪽에 위치 / 돌산대교·장군도 전망대 근처 |
| Source Type | SUPPORTING (나무위키 — 위키 편집 기반, 비공식) |
| Accessed | 2026-09-25 |

### 3-2. oh-my-post.com 블로그 (기존 Repository 참조 소스)

| 항목 | 원문 |
|---|---|
| 자산 측 탑승장 | **자산정류장 / 브랜드명: 해야** |
| 돌산 측 탑승장 | **돌산정류장 / 브랜드명: 놀아** |
| 구간 표기 | "자산공원(해야정류장) ↔ 돌산공원(놀아정류장)" |
| 편도/왕복 | 왕복 17,000원 / 편도 14,000원 (일반 캐빈 대인) |
| 운행 거리 | 1.5km |
| 운행 시간 | 편도 12~13분 |
| Source Type | NON_OFFICIAL_BLOG (공식 사이트 참조 불가 상태에서 수집) |
| Accessed | 2026-09-25 (기존 YEOSU_2026_VERIFICATION_BATCH_01.md에 2026-09-20 기록 포함) |

### 3-3. Entity Candidate Manifest (Repository 내부 문서)

| 항목 | 값 |
|---|---|
| 엔티티명 | 해상케이블카 |
| 별칭 | 자산해상케이블카, 케이블카 |
| 카테고리 | 레저 |
| DB 상태 | IN_DB (cablecar) |
| 비고 | "자산해상케이블카"는 전체 시설의 별칭 — 자산 측 탑승장 단독 명칭 아님 |

---

## 4. Cross-Source Analysis

### 4-1. 자산 측 탑승장 명칭 비교

| 소스 | 사용 명칭 | Authority |
|---|---|---|
| 나무위키 | 해야정류장 | SUPPORTING |
| oh-my-post.com | 자산정류장 (브랜드명: 해야) | NON_OFFICIAL_BLOG |
| Repository Travel Matrix CSV | 자산탑승장 | INTERNAL_REFERENCE |
| Repository Founder Route Evidence | 자산탑승장 | INTERNAL_REFERENCE |

**분석:**
- "해야"라는 명칭은 2개 독립 소스에서 일치
- "자산정류장"과 "해야정류장"은 동일 시설의 복수 표기로 추정 (자산=지역명 접두사, 해야=브랜드명)
- OFFICIAL_PRIMARY 미확인으로 단독 VERIFIED 불가

### 4-2. 돌산 측 탑승장 명칭 비교

| 소스 | 사용 명칭 | Authority |
|---|---|---|
| 나무위키 | 놀아정류장 | SUPPORTING |
| oh-my-post.com | 돌산정류장 (브랜드명: 놀아) | NON_OFFICIAL_BLOG |
| Repository Travel Matrix CSV | 돌산공원탑승장 | INTERNAL_REFERENCE |

**분석:**
- "놀아"라는 명칭은 2개 독립 소스에서 일치
- "돌산정류장"과 "놀아정류장"은 동일 시설의 복수 표기로 추정

### 4-3. 공원↔탑승장 관계 비교

| 관계 | 소스 | 표현 | Authority |
|---|---|---|---|
| 자산공원↔탑승장 | oh-my-post.com | "자산공원(해야정류장)" — 공원이 탑승장을 포함 | NON_OFFICIAL_BLOG |
| 자산공원↔탑승장 | 나무위키 | 공원 내 또는 인접. 엘리베이터·계단 구조 | SUPPORTING |
| 돌산공원↔탑승장 | oh-my-post.com | "돌산공원(놀아정류장)" | NON_OFFICIAL_BLOG |
| 돌산공원↔탑승장 | 나무위키 | 돌산공원 쪽에 위치, 전망대 인근 | SUPPORTING |

---

## 5. VR Decision

### VR-001 — 자산 측 탑승 시설 공식 명칭

| 항목 | 값 |
|---|---|
| **VR Decision** | **PARTIALLY_VERIFIED** |
| 확인된 명칭 | **해야정류장** (브랜드명) / **자산정류장** (지역명 접두사 표기) |
| 일치 소스 수 | 2 (나무위키 + oh-my-post.com) |
| OFFICIAL_PRIMARY | 접근 불가 (SSL 오류) |
| 미해소 사항 | 운영사 공식 명칭이 "해야정류장"인지 "자산정류장"인지 단일 명칭 미확정 |
| Provenance | VERIFY_REQUIRED (상태 유지) → PARTIALLY_VERIFIED로 격상 |
| 권고 사항 | 전화 061-664-7301로 공식 명칭 확인 또는 공식 사이트 SSL 해소 후 직접 확인 |

### VR-002 — 돌산 측 탑승 시설 공식 명칭

| 항목 | 값 |
|---|---|
| **VR Decision** | **PARTIALLY_VERIFIED** |
| 확인된 명칭 | **놀아정류장** (브랜드명) / **돌산정류장** (지역명 접두사 표기) |
| 일치 소스 수 | 2 (나무위키 + oh-my-post.com) |
| OFFICIAL_PRIMARY | 접근 불가 (SSL 오류) |
| 미해소 사항 | 운영사 공식 명칭 단일 표기 미확정 |
| Provenance | VERIFY_REQUIRED (상태 유지) → PARTIALLY_VERIFIED로 격상 |
| 권고 사항 | VR-001 동일 |

### VR-012 — 자산공원과 자산 측 탑승장 Entity 관계

| 항목 | 값 |
|---|---|
| **VR Decision** | **PARTIALLY_VERIFIED** |
| 확인된 관계 | **LOCATED_WITHIN / ADJACENT** — 탑승장이 자산공원 내 또는 인접하여 위치 |
| 관계 표현 | "자산공원(해야정류장)" — 공원이 탑승장을 포함하는 구조 |
| 엘리베이터·계단 구조 | 탑승장 접근을 위한 수직 이동 수단 존재 가능성 |
| 동일 Entity 여부 | NO — 자산공원 ≠ 해야정류장, 별도 Entity |
| OFFICIAL_PRIMARY | 접근 불가 |
| Provenance | OPERATOR_INFERENCE (부분 지지됨) → PARTIALLY_VERIFIED |

### VR-013 — 돌산공원과 돌산 측 탑승장 Entity 관계

| 항목 | 값 |
|---|---|
| **VR Decision** | **PARTIALLY_VERIFIED** |
| 확인된 관계 | **LOCATED_WITHIN / ADJACENT** — 탑승장이 돌산공원 쪽에 위치 |
| 관계 표현 | "돌산공원(놀아정류장)" / "돌산대교·장군도 전망대 근처" |
| 동일 Entity 여부 | NO — 돌산공원 ≠ 놀아정류장, 별도 Entity |
| OFFICIAL_PRIMARY | 접근 불가 |
| Provenance | OPERATOR_INFERENCE (부분 지지됨) → PARTIALLY_VERIFIED |

---

## 6. RB-02 선행 Evidence (범위 외 메모)

RB-01 Research 중 VR-006 (편도/왕복 판매 구조)에 대한 Evidence도 수집됨.  
이것은 RB-02 범위이므로 결론을 내리지 않고 Evidence만 기록한다.

| 소스 | 내용 | Authority |
|---|---|---|
| 나무위키 | "왕복"과 "편도" 구분 요금표 명시 | SUPPORTING |
| oh-my-post.com | 왕복 17,000원 / 편도 14,000원 (일반 캐빈 대인) | NON_OFFICIAL_BLOG |
| Repository Batch 01 | 왕복/편도 구분 "비공식 블로그 참고값" | INTERNAL_REFERENCE |

→ RB-02 실행 시 이 Evidence 활용 가능.

---

## 7. Repository Impact Check

### 관계 Knowledge 파일 영향

`docs/knowledge/YEOSU_RELATIONSHIP_KNOWLEDGE_HAMEL_TO_CABLE_CAR_V0_1.md`

| 섹션 | 현재 상태 | 업데이트 필요 |
|---|---|---|
| Section 7 — P4 하위 Entity (탑승장) | VERIFY_REQUIRED 명칭 목록에 "해야정류장", "놀아정류장" 포함 | PARTIALLY_VERIFIED로 격상 |
| Section 14-1 — VERIFY_REQUIRED 목록 | "자산탑승장 공식 명칭", "돌산탑승장 공식 명칭" | 상태 업데이트 |
| Good Answer 예시 | "자산탑승장" 표기 | 변경 없음 — 실용적 표기 유지 |

**업데이트 방침:** 관계 Knowledge에서 명칭 상태를 VERIFY_REQUIRED → PARTIALLY_VERIFIED로 격상. 실용 표기("자산탑승장", "돌산공원탑승장")는 유지 — OFFICIAL_PRIMARY 미확인 상태에서 "해야정류장"/"놀아정류장"으로 전환 금지.

---

## 8. RB-01 Success Criteria 평가

| SC # | 기준 | 결과 |
|---|---|---|
| SC-01 | Q1-Q4에 답했는가? | PASS (PARTIALLY_VERIFIED) |
| SC-02 | Source Authority 충족했는가? | PARTIAL — OFFICIAL_PRIMARY 불가 / SUPPORTING 2개 확보 |
| SC-03 | Naming Discipline 적용했는가? | PASS — 복수 명칭 혼용 명시, 단일 공식 명칭 미선언 |
| SC-04 | Commit Gate 통과했는가? | PARTIAL — CG-05 미충족 (OFFICIAL_PRIMARY 직접 확인 불가) |

**RB-01 Result: PASS WITH FINDINGS**

Findings:
1. OFFICIAL_PRIMARY(yeosucablecar.com) SSL 오류 지속 — 기존 known issue 재확인
2. 자산 측 명칭: "해야정류장" / "자산정류장" 복수 표기 혼재 — 단일 공식 명칭 미확정
3. 돌산 측 명칭: "놀아정류장" / "돌산정류장" 복수 표기 혼재 — 단일 공식 명칭 미확정
4. VR-012, VR-013: 공원↔탑승장 관계는 LOCATED_WITHIN/ADJACENT로 수렴 (동일 Entity 아님 확인)

---

## 9. NOF-02B RC-01 Impact

| RC | 기준 | 이번 Research 결과 |
|---|---|---|
| RC-01 | 자산 측·돌산 측 공식 명칭 검증됨 | **PARTIALLY_COMPLETE** — SUPPORTING 소스 2개 일치. OFFICIAL_PRIMARY 미확인. |

RC-01은 OPEN 상태 유지.  
전화(061-664-7301) 또는 공식 사이트 복구 시 RC-01 최종 확인 가능.

---

## 10. Next Action 결정

RB-01 완료 후 선택지:

| 선택 | 내용 | 권고 |
|---|---|---|
| A | RB-02 실행 (VR-006 편도/왕복 공식 구조) | **선택** — RB-02 선행 Evidence 이미 확보됨 |
| B | RB-03 실행 (하멜→자산 물리적 접근 현장 확인) | DEFER — Field Confirmation 필요, 현재 실행 불가 |
| C | RC-01 재시도 (공식 전화 확인) | 사용자/Founder가 결정 — 현재 Claude는 직접 전화 불가 |

**Next Action: RB-02 실행** (VR-006 — 편도/왕복 판매 조건 공식 구조 확인)

---

## 11. Commit Gate 체크리스트

| CG # | 항목 | 상태 |
|---|---|---|
| CG-01 | 스코프 초과 없음 (VR-001, 002, 012, 013만) | PASS |
| CG-02 | Source Authority 명시됨 | PASS |
| CG-03 | OFFICIAL_PRIMARY 접근 결과 기록됨 | PASS (불가 기록) |
| CG-04 | VR Decision 4건 모두 명시됨 | PASS |
| CG-05 | Official Source 직접 확인됨 | **PARTIAL FAIL** — SSL 오류로 직접 접근 불가 |
| CG-06 | Naming Discipline 적용됨 | PASS |
| CG-07 | Entity 관계 유형 명시됨 | PASS |
| CG-08 | Repository Impact 분석 완료 | PASS |
| CG-09 | NOF-02B RC-01 영향 명시됨 | PASS |
| CG-10 | Next Action 결정됨 | PASS |

CG-05 PARTIAL FAIL로 인한 전체 Result: **PASS WITH FINDINGS (CG-05 PARTIAL)**

---

*RB-01 Research Document V0.1 — 2026-09-25*
