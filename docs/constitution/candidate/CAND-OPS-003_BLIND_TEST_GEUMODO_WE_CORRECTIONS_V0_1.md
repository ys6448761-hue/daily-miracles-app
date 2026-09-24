# CAND-OPS-003 Blind Test — 금오도 비렁길 WE Corrections V0.1

**Date:** 2026-09-24
**Source Review:** `docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_GEUMODO_WE_REVIEW_V0_1.md`
**WE Review Decision:** PASS WITH CORRECTIONS
**Raw Evidence (immutable):** `docs/constitution/candidate/CAND-OPS-003_BLIND_TEST_GEUMODO_RESEARCH_V0_1.md`

---

## IMPORTANT — Raw Evidence Immutability

`CAND-OPS-003_BLIND_TEST_GEUMODO_RESEARCH_V0_1.md` 원문은 수정하지 않는다.

이 파일은 Blind Test Raw Evidence이며 immutable로 보존된다.

이 문서는 별도 Correction Record이다.

---

## Corrections Applied

Review에서 승인된 2건 (OE-01, OE-02)만 적용한다.

---

## CORRECTION-01 — OE-01: Structural Inference Provenance 표기

**Review 근거:** OE-01 — "구조 상 판단"이 Official/Factual claim처럼 보이지 않도록 분리

**대상:** Raw Evidence Section 2.7 (접근성) 중 다음 항목

```
접근성 항목: 유모차
판정: 불가 (절벽 트레일 구조)
출처: 구조 상 판단

접근성 항목: 어린이
판정: 코스별 난이도 차이 있으나 전반적 주의 필요
출처: 구조 상 판단
```

**문제:** "구조 상 판단"이 Official Source 또는 WE Source와 동등한 위치에 기록되어 있어 Downstream에서 Operator 추론이 외부 출처 사실처럼 오독될 수 있음.

**적용 방식:** 내용을 삭제하거나 교체하지 않는다. Provenance 표기를 추가한다.

**Corrected Version:**

```
접근성 항목: 유모차
판정: 불가
출처: OPERATOR_INFERENCE
추론 근거: 절벽 트레일 구조 — 기울어진 경사 + 좁은 폭 + 계단 구간
Note: 공식 출처(visitkorea)에서 유모차 접근 불가를 확인함 (Section 2.5에 STABLE로 기록)
      이 항목의 추론은 공식 확인 사실과 일치하나, 추론 자체는 OPERATOR_INFERENCE
```

```
접근성 항목: 어린이
판정: 코스별 난이도 차이 있으나 전반적 주의 필요
출처: OPERATOR_INFERENCE
추론 근거: 절벽 트레일 구조 + 체력 요구 수준 (Section 9 Frictions)
Note: 어린이 방문에 대한 독립 WE Evidence 부족 (Section 20 Unknowns에 기록됨)
      구체 Evidence가 확보되면 WORLD_EXPERIENCE 또는 VERIFY_REQUIRED로 대체 검토
```

**Provenance Note:**

현재 CAND-OPS-003 Framework에 `OPERATOR_INFERENCE` / `STRUCTURAL_INFERENCE`가 공식 Provenance Type으로 등록되어 있지 않다.

이 표기는 임시 표기이며, FA-02 / MR-02 (Framework Findings — OPEN)가 해소될 때 공식 Type으로 대체된다.

---

## CORRECTION-02 — OE-02: WE 출처 안전 관찰 Layer 소속 명시

**Review 근거:** OE-02 — Section 2.6 WE 출처 안전 항목이 Official Section 안에 포함되어 있어 Official 정보처럼 보임

**대상:** Raw Evidence Section 2.6 (안전 관련) 중 다음 항목

```
항목: 추락 경고판
내용: 길 곳곳에 "추락주의" 안내판 설치됨
출처: 오마이뉴스 (현장 경험)
Status: STABLE

항목: 비 올 때 위험
내용: 경사로 미끄러짐 위험
출처: 오마이뉴스
Status: STABLE

항목: 강풍
내용: 바다 접한 지점에서 극심한 바람 발생 가능
출처: brunch 현장 경험
Status: STABLE

항목: 3코스 특이
내용: 중간 탈출 경로가 없는 구간 존재
출처: brunch (현장)
Status: VERIFY_REQUIRED
```

**문제:** 위 항목들은 오마이뉴스 현장 르포, brunch 개인 후기 — 즉 WORLD_EXPERIENCE 출처에서 나온 관찰이다. Section 2 헤더("Official / Factual Skeleton")와 구조적으로 불일치하여 Official 확인 사실처럼 보일 수 있음.

**적용 방식:** 내용을 새로 조사하거나 사실 교정하지 않는다. Layer 소속을 명시한다.

**Corrected Version — Layer 소속 표기 추가:**

```
항목: 추락 경고판
내용: 길 곳곳에 "추락주의" 안내판 설치됨
출처: 오마이뉴스 (현장 경험)
Provenance Layer: WORLD_EXPERIENCE (WE 출처 관찰 — Official 확인 아님)
Status: STABLE (물리적 안전 시설 — 구조적으로 지속)
Note: 비렁길 공식 안내에서 안전 강조가 있으나 설치 사실을 Official로 확인한 출처 없음

항목: 비 올 때 위험
내용: 경사로 미끄러짐 위험
출처: 오마이뉴스
Provenance Layer: WORLD_EXPERIENCE (현장 관찰)
Status: STABLE (물리적 지형 특성)

항목: 강풍
내용: 바다 접한 지점에서 극심한 바람 발생 가능
출처: brunch 현장 경험
Provenance Layer: WORLD_EXPERIENCE (현장 관찰)
Status: STABLE (해안 절벽 지형 특성 — 날씨 조건과 무관한 구조적 특성)
Note: 강풍 심각도는 날씨에 따라 달라짐 — 특정 날 강풍 여부는 LIVE

항목: 3코스 특이
내용: 중간 탈출 경로가 없는 구간 존재
출처: brunch (현장)
Provenance Layer: WORLD_EXPERIENCE (현장 관찰)
Status: VERIFY_REQUIRED (CONFLICT-03 참조 — 여수시 공식과 상충)
```

**Layer Placement Note:**

이 항목들은 물리적 사실로서 STABLE한 특성을 가지나, 출처가 WE이므로 Provenance Layer는 WORLD_EXPERIENCE이다.

STABLE은 시간적 휘발성(temporal volatility) 분류이고, Provenance Layer는 출처 유형 분류이다 — 이 두 분류는 독립적이다.

WE 출처 + STABLE 분류는 모순이 아니다: "현장에서 관찰된 물리적 안정 사실"이다.

이 구분이 Framework에 명시되어 있지 않다 — FA-01 / MR-01 (Framework Findings — OPEN) 참조.

---

## Framework Findings — OPEN (이번 단계에서 해소하지 않음)

다음 4건은 Blind Test가 발견한 Framework Evidence로 OPEN 상태를 유지한다.

이번 단계에서 Candidate Framework를 수정하지 않는다.

| ID | 유형 | 내용 | Status |
|---|---|---|---|
| FA-01 | Framework Ambiguity | Official Layer에서 허용되는 출처 범위 미정의 | OPEN |
| FA-02 | Framework Ambiguity | Operator 구조적 추론의 Provenance Type 부재 | OPEN |
| MR-01 | Missing Framework Rule | Official Layer 포함 가능 출처 유형 규정 없음 | OPEN |
| MR-02 | Missing Framework Rule | Structural Inference Provenance 규정 없음 | OPEN |

해소 시점: Blind Test 전체 완료 후 Promotion Decision 단계에서 결정.

---

## Raw Evidence Status

```
CAND-OPS-003_BLIND_TEST_GEUMODO_RESEARCH_V0_1.md
  = UNCHANGED (immutable Raw Evidence)
```

---

## Candidate Status

```
CAND-OPS-003 = Candidate / Draft
```

WE Review Decision: `PASS WITH CORRECTIONS` — 변경 없음.

Correction 적용이 Candidate Approval 또는 Status 변경을 의미하지 않는다.

---

## Next Step

Corrections 완료 → **Geumodo Founder Review** 진행 가능.
