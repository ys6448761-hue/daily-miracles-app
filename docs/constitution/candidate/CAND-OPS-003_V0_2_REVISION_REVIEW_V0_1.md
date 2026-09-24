# CAND-OPS-003 V0.2 Revision Review V0.1

**Date:** 2026-09-25
**Reviewer Role:** Final Reviewer (8777065) — independent verification of V0.2 revision against Final Review requirements
**V0.1 Final Review Commit:** `8777065`
**V0.2 Revision Commit:** `e5aab3f`
**Status:** REVISION REVIEW COMPLETE

---

## REVIEWER BOUNDARY

이번 Review는 새로운 Framework를 평가하거나 재설계하지 않는다.

Final Review(8777065)에서 요구한 RR-01~04가 V0.2에 정확하고 충분하게 반영되었는지만 독립 검증한다.

`CAND-OPS-003 = Candidate / Draft` 상태를 유지한다.

---

## REVISION REVIEW DECISION

```
V0.2 REVISION REVIEW PASS
```

RR-01~04 모두 충분히 반영되었다. FA-01/02/FA-NI-01/MR-01/02/03 전원 RESOLVED. Material Regression 없음. Evidence Preservation 확인됨.

---

## RR-01 — Official Layer Source Boundary

**판정: PASS**

### 검증 항목

**① Official Layer 허용 Source Type이 명확한가?**

Section 4 Layer 1 RR-01 블록:
```
허용:
- 정부 / 공공기관 공식 발행 정보 (여수시, 한국관광공사, 국립공원공단 등)
- 관리 주체 공식 안내 (시설 운영자, 공식 홈페이지)
- 학술 / 법적으로 확인된 사실
```
→ 충족. 예시까지 포함.

**② 허용되지 않는 Source Type도 명확한가?**

```
불허:
- 언론 기사 / 블로그 / 개인 후기 (출처가 World Experience임)
- Operator의 구조적 추론 (출처가 OPERATOR_INFERENCE임)
- 공식처럼 보이더라도 공식 기관 원문이 아닌 2차 인용
```
→ 충족. WE 출처와 OPERATOR_INFERENCE가 명시적으로 불허 목록에 포함됨.

**③ World Experience / blog / review / Operator inference가 Official로 승격되지 않도록 되어 있는가?**

불허 목록에 직접 명시됨. 추가로:
> "물리적으로 안정적인(STABLE) 사실이라도 WE 출처(블로그, 기사, 후기)에서 나온 관찰은 World Experience Layer에 기록하고, Stable 분류를 별도 표기한다."

→ 충족. OE-02 발생 원인(STABLE이면 Official에 배치 가능하다는 오독)을 정확히 차단.

**④ 정보가 안정적이라는 이유만으로 Official이 되지 않는다는 원칙이 존재하는가?**

위 인용문이 이 원칙을 명시적으로 설명함. Section 6 Two-Axis Model로 연결되는 Cross-reference도 포함됨.
→ 충족.

**⑤ 기존 Official Layer 목적과 충돌하지 않는가?**

V0.1의 기존 포함/불포함 목록이 보존됨. RR-01 블록은 추가(additive)이며 기존 항목을 제거하거나 수정하지 않음.
→ 충돌 없음.

---

## RR-02 — OPERATOR_INFERENCE

**판정: PASS**

### 검증 항목

**① Source 직접 진술과 Operator 추론이 구분되는가?**

Section 5 정의:
> "Operator가 알려진 구조적 사실에서 논리적으로 추론하였으나 외부 출처가 해당 결론을 직접 확인하지 않은 경우."

Provenance Type 표에서 OFFICIAL과 OPERATOR_INFERENCE가 별개 행으로 명확히 분리됨.
→ 충족.

**② supporting evidence를 요구하는가?**

필수 기록 항목에 "지지하는 Evidence (supporting evidence)" 명시됨.
→ 충족.

**③ confidence/strength를 기록할 수 있는가?**

필수 기록 항목에 "신뢰도 또는 강도 (confidence or strength)" 명시됨.
→ 충족.

**④ unresolved alternative를 보존하는가?**

필수 기록 항목에 "미해소 대안이 있다면 함께 기록 (unresolved alternative)" 명시됨.
→ 충족.

**⑤ Official/WE claim으로 위장하지 못하도록 경계가 있는가?**

> "OPERATOR_INFERENCE를 Official Fact나 World Experience Claim으로 위장하지 않는다."

명시적 금지문 포함.
→ 충족.

**추가 관찰:**

Section 11 V0.2 예시에서 OPERATOR_INFERENCE 실제 사용 형태까지 보여줌:
```
Provenance: OPERATOR_INFERENCE
추론 근거: 절벽 트레일 + 좁은 폭 + 경사 구간 구조
Supporting Evidence: Section 2.3 코스 구조 (OFFICIAL)
Confidence: HIGH
```
이론 정의와 실용 예시가 연결됨. 충분함.

---

## RR-03 — Provenance × Volatility Two-Axis Model

**판정: PASS**

### 검증 항목

**① 두 축이 실제로 독립적으로 정의되었는가?**

Section 6 RR-03 블록:
```
Axis A — Provenance (출처 유형):
  OFFICIAL / WORLD_EXPERIENCE / FOUNDER_LOCAL /
  FOUNDER_INTENT / DREAMTOWN / OPERATOR_INFERENCE /
  VERIFY_REQUIRED / LIVE_CHECK

Axis B — Volatility (시간적 휘발성):
  STABLE / LIVE / VERIFY / UNKNOWN
```

두 축이 별개 열거형으로 명시됨. 다시 혼합한 흔적 없음.
→ 충족.

**② STABLE ≠ OFFICIAL이 Framework에 명시되었는가?**

Section 6: "STABLE ≠ OFFICIAL" 직접 명시.
Section 5 Core Governance에도: `STABLE ≠ OFFICIAL (V0.2 추가 — Section 6 참조)` 추가됨.
→ 이중으로 명시됨. 충족.

**③ 네 가지 유효한 조합이 가능한가?**

유효한 조합 예시 표:

| Provenance | Volatility | 확인 |
|---|---|---|
| OFFICIAL | STABLE | ✓ (표에 명시) |
| OFFICIAL | LIVE | ✓ (표에 명시) |
| WORLD_EXPERIENCE | STABLE | ✓ (표에 명시) |
| WORLD_EXPERIENCE | LIVE | ✓ (표에 명시) |

→ 모든 필수 조합 충족.

**④ 두 축을 다시 단일 taxonomy처럼 혼합하지 않았는가?**

두 축은 별개 블록으로 정의됨. 조합 예시는 행렬 형식으로 표현됨. 단일 계층 구조로 다시 합쳐진 흔적 없음.
→ 충족.

**추가 관찰:**

이전 오독 패턴까지 명시적으로 교정함:
> 이전 단일 축 오독 패턴: "STABLE이면 Official Layer에 배치할 수 있다" — **잘못됨**

이 교정은 OE-02 재발 방지를 위한 가장 직접적인 개입이다. 충분함.

---

## RR-04 — Numeric Generalization Guardrail

**판정: PASS**

### 검증 항목

**① 단일/제한된 WE 사례 수치 → 일반적 숫자 범위 패턴이 방지되는가?**

Section 9 RR-04 블록:
> "범위 합성 주의: 여러 케이스 수치를 '30~50%'처럼 범위로 합성할 경우 해당 범위를 직접 지지하는 Evidence가 있는지 확인 필요."
> "단일 케이스 일반화 금지: 1코스 케이스를 전체 5코스에 일반화하지 않는다."

→ 충족.

**② Source 직접 수치 / case-level numeric / 반복 Evidence 범위 / Operator 합성 범위를 구분할 수 있는가?**

Evidence 확인 기준 4단계:
```
- 직접 Source가 제시한 수치 → 명시 가능
- 단일 사례 수치 → 케이스로만 표현
- 여러 Source에서 반복된 방향 → 방향만 표현
- Operator가 여러 사례를 합성한 범위 → OPERATOR_INFERENCE 명시
```
→ 4단계 구분 체계 충족.

**③ Operator 합성 범위는 적절한 Provenance를 가져야 하는가?**

> "없다면 OPERATOR_INFERENCE 표기 후 Evidence 한계 명시."

→ 충족. OPERATOR_INFERENCE와 연결됨.

**④ Evidence 부족 시 안전한 처리 방식이 존재하는가?**

> "방향성 표현 안전: '실제로는 더 걸리는 경우가 많다' → 범위 없이 방향만 표현하면 Evidence 과일반화 방지"

→ 충족.

**⑤ S5의 "30~50%" 문제가 같은 방식으로 다시 발생할 가능성이 충분히 줄었는가?**

Section 11 V0.2 예시:
```
Bad V0.1 style: "실제로는 30~50% 더 걸린다." (Evidence 불충분 범위)

Better V0.2 behavior:
- 케이스 단위: "1코스는 공식 2시간보다 1시간 정도 더 걸렸다는 후기가 있어요."
- 방향성: "대부분의 후기에서 공식 소요시간보다 더 걸린다고 해요."
- 범위 합성 시: OPERATOR_INFERENCE 명시 + supporting cases 나열
```

Bad/Better 비교 예시까지 Section 11에 추가됨으로써 Operator가 직접 참조할 수 있는 실용 가이드가 완성됨.
→ 충족. S5 재발 가능성이 구조적으로 감소했다.

---

## FINDINGS RESOLUTION

독립 검증 (작성 Code 판정을 그대로 받아들이지 않음).

| Finding | 요구 수정 | V0.2 반영 내용 | 독립 판정 |
|---|---|---|---|
| **FA-01** | Official Layer 출처 범위 명시 | Section 4 허용/불허 목록 추가 | **RESOLVED** |
| **FA-02** | OPERATOR_INFERENCE Provenance Type 부재 | Section 5 Type 표 + 정의 + 필수 기록 항목 추가 | **RESOLVED** |
| **FA-NI-01** | WE 수치 일반화 방지 가이드라인 부재 | Section 9 RR-04 블록 + Section 11 예시 추가 | **RESOLVED** |
| **MR-01** | Official Layer 포함 가능 출처 규정 없음 | Section 4 허용 출처 유형 규정 (FA-01과 동일 블록) | **RESOLVED** |
| **MR-02** | Structural Inference Provenance 규정 없음 | OPERATOR_INFERENCE 정의 = Structural Inference 공식화 | **RESOLVED** |
| **MR-03** | Numeric/Quantitative Claim 규정 없음 | Section 9 Error 9 + 4단계 처리 기준 | **RESOLVED** |

**모두 RESOLVED.**

---

## REGRESSION CHECK

**판정: REGRESSION 없음**

### Core Structure 보존 확인

| 항목 | V0.1 상태 | V0.2 상태 |
|---|---|---|
| Official → WE → Founder → DreamTown → SOUL 5-Layer | 유지됨 | 유지됨 (구조 변경 없음) |
| Separation-first, Composition-at-use-time | 유지됨 (Section 3) | 유지됨 (Section 3 무변경) |
| Conflict preservation | 유지됨 | 유지됨 |
| Entity boundary | 유지됨 (Section 7) | 유지됨 (Section 7 무변경, 금오도 예시만 추가) |
| Place / Route / Movement | 유지됨 | 유지됨 (Fifth Place 예시 추가) |
| Situation Knowledge | 유지됨 (Section 8) | 유지됨 (Section 8 무변경) |
| Founder isolation | 유지됨 (Layer 3) | 유지됨 (Layer 3 무변경) |
| DreamTown non-injection | 유지됨 (Layer 4) | 유지됨 (Layer 4 무변경) |

### 변경 방식 확인

V0.2 모든 변경은 **추가(additive)**이다:

- Section 4: RR-01 블록 추가 (기존 항목 삭제 없음)
- Section 5: Provenance Type 표 + OPERATOR_INFERENCE 정의 추가
- Section 6: Two-Axis 블록 추가 (기존 Stable/Live 원칙 보존)
- Section 9: Error 9 + RR-04 블록 추가
- Section 11: V0.2 예시 추가
- Section 17: Resolved 항목 이동 (Open → Resolved)
- Section 18: Self-Check 추가 (메타데이터)

Blind Test에서 검증되지 않은 새로운 구조가 추가된 흔적 없음.
최소 수정 원칙 준수됨.

---

## EVIDENCE PRESERVATION

**판정: 보존됨**

| 항목 | 확인 |
|---|---|
| V0.1 Candidate 파일 보존 | ✓ (`CAND-OPS-003_SOUL_Place_Knowledge_Authoring_Framework.md` 별도 파일로 유지) |
| Blind Test 10개 Artifact 명시 | ✓ (Revision History에 파일명 목록 포함) |
| V0.2 Revision History가 Final Review commit 8777065와 연결 | ✓ (명시됨) |
| 과거 오류(FA-NI-01 S5 "30~50%")가 없었던 것처럼 재작성되지 않음 | ✓ (Section 9 RR-04에서 직접 Evidence로 인용됨) |
| Research Limitation RL-01~04 이월 | ✓ (Section 17 Open 항목에 보존) |
| DreamTown Philosophy HOLD 유지 | ✓ (Section 15에 금오도 Founder Evidence 추가됐으나 HOLD 상태 유지) |

---

## CANDIDATE STATUS

```
CAND-OPS-003 = Candidate / Draft
변경 없음.

FA-01, FA-02, FA-NI-01, MR-01, MR-02, MR-03: RESOLVED (V0.2)

OPEN (V0.2 이후):
- SOUL Runtime 실제 연동 검증
- 여수 외 장소 Framework 적용 가능성
- 2개 이상 독립 Operator Blind Test
- SSOT 범위와 Operations Guide 경계
- RL-01/02/03/04 Research Gap
```

---

## SAVED FILE

`docs/constitution/candidate/CAND-OPS-003_V0_2_REVISION_REVIEW_V0_1.md`

---

## PROJECT STATE

```
CAND-OPS-003 Blind Test = COMPLETE
V0.2 Revision = APPLIED (e5aab3f)
V0.2 Revision Review = PASS
Candidate Status = Candidate / Draft (변경 없음)
```

---

## CURRENT NEXT ACTION

```
CAND-OPS-003 Promotion Review
```

---

## GIT

(commit 후 기재)
