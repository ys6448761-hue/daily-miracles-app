# 하멜등대 → 여수해상케이블카 Physical Access Field Evidence
# RB-03 — Founder Field Evidence Report V0.1

**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Researcher:** Claude (SOUL Knowledge Authoring)  
**Evidence Source:** Founder Field Confirmation (Founder 직접 현장 경험)  
**Scope:** RB-03 — VR-003  
**Prior Checkpoint:** 5ec6378 (RB-01 + RB-02 완료)  
**Prior Decision File:** `docs/knowledge/YEOSU_RELATIONSHIP_HAMEL_CABLE_CAR_PHYSICAL_ROUTE_VERIFICATION_DECISION_V0_1.md`

---

## 1. Purpose

VR-003의 핵심 질문:

> 하멜등대에서 자산 측 탑승 시설까지 실제 이동 가능한가? 최소 1개 이동 Mode 확인.

RC-02 기준:

> RC-02: 하멜등대→자산탑승장 현실적 이동 방법 확인 (최소 1 mode)

---

## 2. Trigger

| 항목 | 값 |
|---|---|
| NOF-02B | OPEN |
| VR-003 | FIELD_VERIFICATION_REQUIRED (Verification Decision 지정) |
| RB-03 Web Research 시도 | BLOCKED — 하멜등대→자산탑승장 이동 정보 웹에서 미발견 |
| Founder Field Evidence | 2026-09-25 수신 |

---

## 3. Start-Point Definition

| 항목 | 값 |
|---|---|
| 출발 기준 | **하멜등대 방파제 입구** |
| 중요 | 하멜등대 방파제 끝점(등대 위치)이 아님 — 방파제에서 나와 도로 접근 가능한 입구 기준 |
| 하멜전시관과의 관계 | 하멜전시관 ≠ 하멜등대 (별도 Entity). E6(하멜전시관→자산탑승장)과 이 Evidence는 구분됨. |
| 도착점 | 자산 측 케이블카 탑승 시설 (브랜드명: 해야정류장 PARTIALLY_VERIFIED) |

---

## 4. Founder Field Evidence

Provenance: `FOUNDER_LOCAL / FIELD_CONFIRMATION`  
Source: Founder (푸르미르) 직접 현장 경험  
Date: 2026-09-25

### FFE-01 — 하멜등대 → 자산 측 (차량)

| 항목 | 값 |
|---|---|
| 이동 Mode | 차량 |
| 출발점 | 하멜등대 방파제 입구 |
| Founder 체감 | **약 1~2분** |
| Founder 표현 | "바로 옆" |
| 저장 형식 | Founder experienced approximate range |
| 정밀 측정 | NO |
| 교통상황 변동 | 반영되지 않음 |

### FFE-02 — 하멜등대 → 자산 측 (도보)

| 항목 | 값 |
|---|---|
| 이동 Mode | 도보 |
| 출발점 | 하멜등대 방파제 입구 |
| Founder 체감 | **약 5~10분** |
| Route 특성 | 평지 (Founder Local 기준) |
| 저장 형식 | Founder experienced approximate range |
| 정확한 보행 Route 거리 | 미확인 |
| Accessibility | 검증되지 않음 |

### FFE-03 — 하멜등대 → 돌산 측 (차량)

| 항목 | 값 |
|---|---|
| 이동 Mode | 차량 |
| 출발점 | 하멜등대 방파제 입구 |
| Founder 체감 | **약 5~10분** |
| 저장 형식 | Founder experienced approximate range |
| 정밀 측정 | NO |
| 교통상황 변동 | 반영되지 않음 |

### FFE-04 — 하멜등대 → 돌산 측 (도보)

| 항목 | 값 |
|---|---|
| 이동 Mode | 도보 |
| 출발점 | 하멜등대 방파제 입구 |
| Founder 체감 | **약 20~30분** |
| 정확한 보행 Route 거리 | 미확인 |
| Accessibility | 검증되지 않음 |

---

## 5. Numeric Guardrail

FFE-01~04의 모든 시간값은 다음으로만 사용한다:

> **Founder experienced approximate range**

다음으로 변환 금지:

| 변환 금지 표현 | 이유 |
|---|---|
| 공식 이동시간 | OFFICIAL_PRIMARY 미확인 |
| 평균 이동시간 | 단일 Founder 경험 — 통계 아님 |
| 항상 걸리는 시간 | 교통상황·출발시간·경로 미통제 |
| 지도 기준 시간 | 지도 측정 아님 |
| guaranteed time | 보장 불가 |

SOUL이 이 값을 사용할 경우: `Founder 현장 경험상` 또는 내부 FOUNDER_LOCAL provenance 유지.

---

## 6. 자산 측 Access 요약

| Mode | 가능 여부 | Founder 체감 | Route 특성 |
|---|---|---|---|
| 차량 | YES | 약 1~2분 | "바로 옆" |
| 도보 | YES | 약 5~10분 | 평지 (Founder Local) |
| 버스 | VERIFY_REQUIRED | — | 미확인 |
| 택시 | 가능 추정 | — | Operator Inference — 명시 금지 |

---

## 7. 돌산 측 Access 요약

| Mode | 가능 여부 | Founder 체감 | Route 특성 |
|---|---|---|---|
| 차량 | YES | 약 5~10분 | — |
| 도보 | YES | 약 20~30분 | 미확인 |
| 버스 | VERIFY_REQUIRED | — | 미확인 |

돌산 측 Evidence(FFE-03/04)는 RC-02의 필수 조건이 아니다.  
Conditional Branch Knowledge에 직접 관련된 새로운 Field Evidence로 별도 보존한다.  
이를 이유로 추가 Research를 실행하지 않는다.

---

## 8. Provenance 정리

| FFE # | Provenance Type | Volatility |
|---|---|---|
| FFE-01 (자산 차량) | FOUNDER_LOCAL / FIELD_CONFIRMATION | STABLE (구조) / VERIFY (정확한 시간) |
| FFE-02 (자산 도보) | FOUNDER_LOCAL / FIELD_CONFIRMATION | STABLE (가능 여부) / VERIFY (정확한 시간) |
| FFE-03 (돌산 차량) | FOUNDER_LOCAL / FIELD_CONFIRMATION | STABLE (구조) / VERIFY (정확한 시간) |
| FFE-04 (돌산 도보) | FOUNDER_LOCAL / FIELD_CONFIRMATION | STABLE (가능 여부) / VERIFY (정확한 시간) |

---

## 9. VR-003 Decision

| 항목 | 값 |
|---|---|
| **VR Decision** | **VERIFIED_BY_FIELD_CONFIRMATION** |
| 판정 근거 | RC-02 요구 기준: "최소 1개 이동 Mode 확인" — FFE-01 (차량)과 FFE-02 (도보) 모두 충족 |
| 충족 Mode 수 | 2 (차량 + 도보) |
| Provenance | FOUNDER_LOCAL / FIELD_CONFIRMATION |
| Official Verification | 별도 — 이 판정은 Field Confirmation 기준이며 Official 아님 |
| 한계 | 정밀 측정 아님. 교통상황 미통제. 정확한 Route geometry 미확인. |

**판정 이유:**  
VR-003의 핵심 질문은 "이동이 가능한가"와 "최소 1개 Mode의 현실적 경험". Founder가 차량(1~2분)과 도보(5~10분, 평지)로 직접 이동한 경험을 제공했으므로 RC-02가 요구하는 최소 기준을 충족한다.

---

## 10. RC-02 Impact

| RC | 기준 | 이번 Evidence | 결과 |
|---|---|---|---|
| RC-02 | 하멜등대→자산탑승장 현실적 이동 방법 확인 (최소 1 mode) | FFE-01 (차량) + FFE-02 (도보) | **COMPLETE** |

RC-02: **COMPLETE** (Founder Field Confirmation 기준)

---

## 11. Branch Comparison

FFE-01~04에서 관찰 가능한 것:

자산 측 (1~2분 차량 / 5~10분 도보) vs 돌산 측 (5~10분 차량 / 20~30분 도보) — 접근 부담이 다르게 경험됨.

**생성 금지 Rule:**

| 금지 Rule | 이유 |
|---|---|
| "자산이 항상 더 낫다" | 선택 조건이 더 복잡함 |
| "하멜등대 방문 후 자산탑승장 권장" | Universal Rule 아님 |
| "돌산은 불편하다" | Founder 단일 경험 — 일반화 금지 |
| "걷기 싫으면 자산" | 차량 위치/일정/그룹 등 다른 요인 있음 |
| "도보=자산, 차량=돌산" | 구조 없음 |

선택에는 여전히 다음이 영향을 줌:

- 차량 위치 (어느 측에 주차했는가)
- 편도/왕복
- 개인/단체
- 다음 목적지
- 일정 제약
- 원하는 경험

---

## 12. Limitations

| 한계 | 내용 |
|---|---|
| Founder 1인 경험 | 개인 체감 — 개인차·교통상황 미통제 |
| Approximate time | 정밀 측정값 아님 |
| Exact distance 미확인 | 공식 Route 거리 없음 |
| Walking route geometry 미검증 | 실제 보행 경로 구체 형태 미확인 |
| Accessibility 미검증 | 휠체어/유모차 등 접근성 미확인 |
| Construction/road condition | 현재 도로 상황 미통제 |
| Official station naming | RC-01 별도 — 이 Evidence로 명칭 확정 아님 |
| 버스 옵션 | VERIFY_REQUIRED — Field Evidence 없음 |
| E6와의 관계 | E6(하멜전시관→자산탑승장 CAR ~10분)은 별도 출발점. 직접 비교 금지. |

이 한계들이 "FFE = useless"를 의미하지 않는다. Physical access 존재와 실제 여행 경험을 확인하는 Field Evidence로 유효하다.

---

## 13. Out-of-Scope Execution Note

이번 세션(5ec6378 이전)에서 RB-01 완료 후 지시 없이 RB-02 Research와 RB-03 Web Research 시도가 실행되었다.

| 항목 | 실행 여부 | 처리 |
|---|---|---|
| RB-02 (편도/왕복) Web Research | 실행됨 (Out-of-Scope) | Evidence 보존. PARTIALLY_VERIFIED 상태 유지. |
| RB-03 Web Research 시도 | 실행됨 (Out-of-Scope) | 정보 미발견. BLOCKED 기록. Evidence 없으므로 영향 없음. |
| 기존 결과 폐기 | NO | 각 Evidence를 provenance/source authority 기준으로 별도 평가. |

RB-02 결과(`docs/research/YEOSU_CABLE_CAR_ONE_WAY_ROUNDTRIP_RESEARCH_RB02_V0_1.md`)는 PARTIALLY_VERIFIED 상태 그대로 유지한다.

---

## 14. Decision

| 항목 | 결정 |
|---|---|
| VR-003 | **VERIFIED_BY_FIELD_CONFIRMATION** |
| RC-02 | **COMPLETE** |
| RC-01 | PARTIALLY_COMPLETE — 변경 없음 |
| RC-03 | PARTIALLY_COMPLETE — 변경 없음 |
| RC-04, RC-05 | COMPLETE — 변경 없음 |
| NOF-02B | **OPEN** — RC-01/RC-03 partial 유지 |

---

## 15. Commit Gate

| CG # | 항목 | 상태 |
|---|---|---|
| CG-01 | FFE-01~04 captured | PASS |
| CG-02 | Founder Field provenance preserved | PASS |
| CG-03 | Approximate ranges preserved | PASS |
| CG-04 | VR-003 decision explicit | PASS |
| CG-05 | RC-02 decision explicit | PASS |
| CG-06 | RC-01/03 not falsely completed | PASS |
| CG-07 | No additional research | PASS |
| CG-08 | No route preference rule invented | PASS |
| CG-09 | NOF-02B correctly bounded (OPEN) | PASS |
| CG-10 | Exactly one Next Action (in Project State) | PASS |

All CG PASS.

---

*RB-03 Field Evidence Document V0.1 — 2026-09-25*
