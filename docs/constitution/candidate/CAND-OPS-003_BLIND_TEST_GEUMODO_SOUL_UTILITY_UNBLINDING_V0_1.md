# CAND-OPS-003 Blind Test — 금오도 비렁길 SOUL Utility Unblinding V0.1

**Date:** 2026-09-25
**Blind Evaluation Commit:** `8a655e3` (고정 — 수정 없음)
**Status:** UNBLINDING COMPLETE

---

## 1. MAPPING REVEAL

### Official Mapping (Execution Record → Blind Package)

| Scenario | X (Blind) | Y (Blind) | X 실제 | Y 실제 |
|---|---|---|---|---|
| S1 | X | Y | **B (Framework)** | A (Baseline) |
| S2 | X | Y | A (Baseline) | **B (Framework)** |
| S3 | X | Y | **B (Framework)** | A (Baseline) |
| S4 | X | Y | A (Baseline) | **B (Framework)** |
| S5 | X | Y | **B (Framework)** | A (Baseline) |
| S6 | X | Y | A (Baseline) | **B (Framework)** |

### Blind Pairwise Result × Condition 연결

| Scenario | Blind Pairwise | Winner (Blind) | 실제 Condition |
|---|---|---|---|
| S1 | X materially stronger | X | **B (Framework)** |
| S2 | Y materially stronger | Y | **B (Framework)** |
| S3 | X materially stronger | X | **B (Framework)** |
| S4 | Y materially stronger | Y | **B (Framework)** |
| S5 | Mixed / trade-off | — | — |
| S6 | Y materially stronger | Y | **B (Framework)** |

**Blind Reviewer가 더 강하다고 판정한 응답 = 5/6 시나리오에서 Condition B (Framework)**

---

## 2. SCENARIO-BY-SCENARIO A/B RESULT

---

### Scenario 1 — Time Constraint

**Condition A Result:**
- D3 PARTIAL (자신의 정보 한계 미명시, 연락처 미제공)
- D6 PARTIAL (확인 권고는 있으나 응답자 제한 미명시)
- D7 PARTIAL (역산 방법론만 제시, 연락처 없음)
- D10 PARTIAL (부분 완주 허용 방향 있으나 따뜻한 허가 언어 없음)

**Condition B Result:**
- D3 PASS ("현재 운항 시간은 제가 확인할 수 없어서 여객선사(1577-6951)에 직접 물어봐야 해요")
- D6 PASS (자신의 정보 한계 + 확인 경로 제공)
- D7 PASS (전화번호 + 구체 코스명 + 실행 가능 플랜)
- D10 PASS ("억지로 전부 다 걸으려 하지 않아도 돼요")

**차이 분석:**
B는 A 대비 D3/D6/D7/D10 4개 Dimension에서 우위.

**CAND-OPS-003 Knowledge Layer 기여:**

| Layer | 기여 내용 |
|---|---|
| Stable/Live/Verify Discipline | 여객선 시간 = LIVE 분류 → 명시적 불확실 처리 + 연락처 |
| Founder Intent | "천천히 가도/일부만 걸어도 충분하다" → "않아도 돼요" 번역 |
| Place/Route/Movement | 1코스(함구미~두포) 구체명 사용 |

---

### Scenario 2 — Low Energy / Companion

**Condition A Result:**
- D3 PARTIAL (배편 확인 안내 없음)
- D10 PARTIAL ("체력 상태에 맞게 계획하세요" — 일반적 권고)
- D7 PASS (1코스 대안 제시)

**Condition B Result:**
- D3 PASS ("여객선 시간은 미리 확인하고 출발하세요")
- D7 PASS (두포 마을 + 식사 + 배편 4단계 경로)
- D10 PASS ("짧은 구간 하나를 느긋하게 걷는 게 훨씬 여유로울 거예요")

**차이 분석:**
B는 A 대비 D3/D10 개선 + D7 풍부화.

**CAND-OPS-003 Knowledge Layer 기여:**

| Layer | 기여 내용 |
|---|---|
| Situation Knowledge | 동행자 이동 제약 + 부축 어려움 구체 인식 |
| Founder Intent | "부분으로도 충분하다" + 느긋한 여행 허가 |
| World Experience | 두포 마을 + 식사 경험 맥락 (WE 관찰) |
| Stable/Live/Verify | 배편 시간 Live 확인 포함 |

---

### Scenario 3 — Solo / Emotional

**Condition A Result:**
- D4 PARTIAL (Route 구조 연결 약함)
- D10 PARTIAL ("본인 페이스로 걸을 수 있고" — 방향만)

**Condition B Result:**
- D4 PASS ("1~2코스만 천천히 걸어도 절벽과 바다는 충분히 만날 수 있어요")
- D7 PASS (이른 아침 출발 전술 포함)
- D10 PASS ("전부 다 걸으려 하지 않아도 … 충분히 만날 수 있어요")

**차이 분석:**
B는 D4/D10 개선 + 조용한 경험을 위한 구체 행동 전술 추가.

**CAND-OPS-003 Knowledge Layer 기여:**

| Layer | 기여 내용 |
|---|---|
| Founder Intent | "완주가 목표가 아니다 / 속도보다 경험" → 구체 허가 언어 |
| Situation Knowledge | 성수기 군중 인식 + 이른 아침 출발 대안 |
| Place/Route/Movement | 1~2코스에서 절벽/바다 경험 가능 — 부분 코스 충분성 |

---

### Scenario 4 — Weather

**Condition A Result:**
- D3 PASS (당일 재확인 권고)
- D6 PASS (조건부 판단 위임)
- 자신의 정보 한계 미명시

**Condition B Result:**
- D3 PASS + 강화 ("오늘 실제 날씨 상태는 제가 확인하기 어려우니")
- D6 PASS + 강화 ("잠깐 내리는 정도인지, 종일 우천인지에 따라 결정이 달라질 거예요")
- D7 강화 (기상청 + 여객선사 이중 확인 소스)

**차이 분석:**
A도 기본 안전 정보를 잘 전달했으나 B는 인식론적 명확성 (자신의 정보 한계 명시)과 판단 기준 세분화에서 우위.

**CAND-OPS-003 Knowledge Layer 기여:**

| Layer | 기여 내용 |
|---|---|
| Stable/Live/Verify Discipline | 날씨 = Live → "제가 확인하기 어려우니" 명시 |
| World Experience | 경사 구간 미끄러움 + 해안 절벽 강풍 구체 위험 |
| Situation Knowledge | 비 강도(잠깐 vs. 종일)에 따른 판단 분기 |

---

### Scenario 5 — Expectation Gap

**Condition A Result:**
- D10 PARTIAL
- D12 PASS ("실제로는 더 걸리는 경우가 많아요" — 방향성)
- D3 PASS

**Condition B Result:**
- D10 PASS ("무조건 힘든 곳은 아니고, 1코스 하나만 선택해서 천천히 걸으면 충분히 즐길 수 있어요")
- D12 REVIEW NEEDED ("30~50%" 수치 — 아래 S5/CF-U7 절에서 최종 판정)
- D3 PARTIAL (구체 퍼센트 사용)

**차이 분석:**
B는 D10에서 우위이나 D12/D3에서 약점. A는 D12/D3 안전하나 D10 약함.
→ Blind 판정 그대로 유지: **Mixed / trade-off**

**Knowledge Layer 기여 (B):**

| Layer | 기여 내용 |
|---|---|
| Founder Intent | "만만하게 보지 마라"를 교정하면서도 "1코스만으로 충분히 즐길 수 있어요" 균형 |
| World Experience | 공식 소요시간 초과 경험 (Section 9 Frictions, STRONG) |

**Knowledge Layer 위험 (B):**
- WE Frictions의 구체 수치를 범용화 → "30~50%" 과일반화 (아래 상세)

---

### Scenario 6 — Open Recommendation

**Condition A Result:**
- D2 PARTIAL (구체 위험 미언급)
- D5 PARTIAL (체력 물음 있으나 동행자 미포함)

**Condition B Result:**
- D2 PASS ("배 시간에 쫓기거나 체력 소진이 생길 수 있어요")
- D5 PASS ("동행이 있는지", "무릎 상태는 어떤지" 명시 질문)
- D7 PASS (맞춤 코스 안내 약속으로 대화 구조 명확화)

**차이 분석:**
B는 D2/D5 개선 + 더 구체적인 상황 파악 질문으로 D7 강화.

**CAND-OPS-003 Knowledge Layer 기여:**

| Layer | 기여 내용 |
|---|---|
| Situation Knowledge | 무릎 상태 / 동행 여부 / 날씨 / 당일치기 — 상황 변수 체계 |
| World Experience | 배 시간 압박 + 체력 소진 — 구체 운영 위험 출처 |
| Place/Route/Movement | 상황에 따라 다른 코스 → 맞춤 안내 가능성 암시 |

---

## 3. S5 / CF-U7 FINAL INVESTIGATION

### 쟁점

Condition B / S5 응답: "공식 소요시간이 있긴 한데, 실제로는 30~50% 더 걸리는 경우도 자주 있어요"

Blind Review 당시 판정: D12 REVIEW NEEDED / CF-U7 REVIEW NEEDED

### Evidence 확인

CAND-OPS-003 Section 9 Frictions (Research V0.1) 원문:

```
마찰 항목: 공식 소요시간 과소 표기
강도: STRONG
내용: 1코스 2시간 → 실제 3시간. 종주 8.5시간 → 실제 10시간
```

### 수치 분석

| 항목 | 공식 | 실제 | 초과율 |
|---|---|---|---|
| 1코스 | 2시간 | 3시간 | **+50%** |
| 종주 | 8.5시간 | 10시간 | **+17.6%** |

### "30~50%" 판정

**Evidence Status: OVERGENERALIZED FROM EVIDENCE**

- 50% 상한값: 1코스 케이스 (2hr→3hr)에서 직접 지지됨
- 30% 하한값: Evidence에 없음. 두 케이스(50%, 17.6%) 사이 중간값에 해당하나 Evidence가 이 범위를 명시하지 않음
- "자주 있어요" 헤지: Evidence는 두 개의 특정 케이스를 기록하며 "자주"라는 빈도 표현은 STRONG 강도 Friction에서 간접 지지 가능
- 핵심 문제: 두 개의 케이스 데이터를 "30~50%"라는 일반 범위로 합성한 것 — Evidence 기반이나 해당 범위 자체가 문서화되지 않음

**CF-U7 Final: NOT TRIGGERED**

이유:
1. "경우도 자주 있어요"로 헤지되어 확정 사실 주장 아님
2. 50% 상한값은 Evidence에서 직접 지지됨
3. 범위 합성이 과일반화이나 허구 생성(fabrication)과 다름
4. CF-U7 트리거 조건 = "확정 사실로 생성" — 이 응답은 경험 범위로 제시

**D12 Final (Condition B / S5): PARTIAL** (REVIEW NEEDED → PARTIAL로 하향)

이유: 수치 자체의 Evidence 기반은 있으나 범위 합성이 개별 케이스를 초과 일반화함. PASS 불인정, FAIL까지는 아님.

### Newly Discovered Issue (Evidence로만 기록)

**Framework Issue FA-NI-01:**
World Experience Frictions에서 구체 케이스 수치(예: 1코스 50% 초과)를 SOUL이 범용 범위로 변환할 위험. Friction 데이터 사용 시 케이스 단위 표현을 권장하는 가이드라인 부재. → Candidate 수정은 Final Review 이후 별도 처리.

---

## 4. FRAMEWORK UTILITY PATTERN

### Material Improvement (B가 A보다 실질적으로 우위)

**S1, S2, S3, S4, S6 — 5개 시나리오**

공통 개선 차원:
- D10 (Founder Intent Translation): B가 A보다 일관되게 자연스러운 철학 번역
- D3/D6 (Stable/Live/Verify + Uncertainty Handling): 특히 S1/S4에서 자신의 정보 한계 명시
- D5 (Companion/Energy): S2/S6에서 더 세밀한 상황 변수 인식

### Trade-off

**S5 — 1개 시나리오**

- B 우위: D10 PASS (부분 완주 허용 + 따뜻한 균형 메시지)
- B 약점: D12 PARTIAL (30~50% 과일반화), D3 PARTIAL
- A 우위: D12 PASS, D3 PASS (방향성만 사용)

### Regression

**없음 (0개 시나리오)**

Condition B가 A보다 실질적으로 나쁜 시나리오 없음.

---

## 5. KNOWLEDGE LAYER CONTRIBUTION SUMMARY

| Layer | 기여 시나리오 | 기여 내용 |
|---|---|---|
| **Founder Intent** | S1, S2, S3, S5, (S6 간접) | "않아도 돼요", "느긋하게", "충분히 만날 수 있어요" — 행동 번역 |
| **Stable/Live/Verify Discipline** | S1, S4 | 자신의 정보 한계 명시, 이중 확인 소스 |
| **Situation Knowledge** | S2, S3, S4, S6 | 동행자 이동 제약, 군중, 비 강도 구분, 상황 변수 체계 |
| **World Experience** | S1, S2, S4, S5, S6 | 실제 소요시간 초과, 미끄러움, 강풍, 두포 마을, 체력 소진 위험 |
| **Place/Route/Movement** | S1, S3 | 코스명 구체화, 부분 코스 충분성 |
| **DreamTown Comparison** | 없음 | 이번 테스트에서 관찰된 직접 기여 없음 |

---

## 6. FOUNDER INTENT TRANSLATION CHECK

### D10 Pattern (Blind Evaluation 그대로)

| S | A | B |
|---|---|---|
| S1 | PARTIAL | **PASS** |
| S2 | **PASS** | PARTIAL* |
| S3 | PARTIAL | **PASS** |
| S4 | PARTIAL | PARTIAL |
| S5 | PARTIAL | **PASS** |
| S6 | PARTIAL | PARTIAL |

*S2에서 A가 D10 PASS로 평가된 것은 — Blind 시점 기준으로 A="첫 코스(함구미~두포)만 걷고 마을에서 쉬는 방법도 있어요"를 PARTIAL로, B="짧은 구간 하나를 느긋하게 걷는 게 훨씬 여유로울 거예요"를 PASS로 판정한 것이다. Unblinding 후 확인 시 이 판정은 정확하다.

**B 기여 확인:**

Condition B가 PASS한 S1/S3/S5 패턴 분석:

- S1: "억지로 전부 다 걸으려 하지 않아도 돼요" — Founder Intent "천천히 가도 목적지에 닿는다" 번역
- S3: "전부 다 걸으려 하지 않아도 1~2코스만 천천히 걸어도 절벽과 바다는 충분히 만날 수 있어요" — 완주 강박 해소 + 경험 충분성 제시
- S5: "무조건 힘든 곳은 아니고, 1코스 하나만 선택해서 천천히 걸으면 충분히 즐길 수 있어요" — 기대 갭 교정 + 부분 완주 격려

공통 패턴: 선택/속도/머무름 개념이 "~않아도 돼요 / ~만으로 충분해요" 형태로 구체 여행 행동으로 번역됨.

**철학 언어 직접 노출 여부:**
"자기 속도", "희망", "회복", "DreamTown" — 전 시나리오에서 미사용. D11 PASS 전원 유지.

---

## 7. DREAMTOWN BOUNDARY CHECK

**Blind Evaluation D11 결과:** 양쪽 전 시나리오 PASS (유지)

**DreamTown Comparison Knowledge 직접 노출:** 없음

DreamTown Comparison 문서(`CAND-OPS-003_BLIND_TEST_GEUMODO_DREAMTOWN_COMPARISON_V0_1.md`)의 Alignment/Extension/Tension 내용이 응답에 직접 언급되지 않았다. 이것은 실패가 아니다.

**설명:** DreamTown Comparison은 SOUL이 금오도 경험을 DreamTown 가치관에 맞게 해석하는 배경 지식이다. 이번 테스트에서 B 응답들이 "DreamTown입니다"라고 말하지 않고도 Alignment된 방식으로 여행을 안내한 것은 이 Knowledge가 배경 해석 레이어로 작동한 결과로 해석된다.

직접 노출 없는 것이 D11 PASS의 조건이며, 이 조건이 충족됨을 재확인한다.

---

## 8. UTILITY TEST CONCLUSION

### 판정 기준 확인 (Protocol §11)

**Framework PASS 기준:**
1. Critical Failure = 0건 → **충족** (CF-U7 최종 NOT TRIGGERED)
2. Condition B가 3개 이상 Dimension에서 A 대비 개선 → **충족** (D3/D6/D7/D10 반복 개선)
3. D10 PASS (최소 2개 시나리오) → **충족** (B: S1/S3/S5 = 3 PASS)

### 결론

**UTILITY EVIDENCE POSITIVE**

근거:
- 6개 시나리오 중 5개에서 Condition B (Framework Knowledge)가 Baseline 대비 Material Improvement
- 1개 시나리오에서 Trade-off (D10 B 우위, D12 A 우위) — Regression 없음
- Blind Reviewer가 사전 지식 없이 B를 5/6에서 더 강하다고 판정
- D10 Founder Intent Translation: B 3 PASS vs A 1 PASS
- D11 Philosophy Overexposure: 양쪽 전원 PASS (DreamTown 철학 과다 노출 없음)
- Critical Failure: 0건

---

## 9. LIMITATIONS

| 항목 | 내용 |
|---|---|
| 실제 SOUL 런타임 미사용 | 문서 기반 시뮬레이션 — 실제 코드 실행 결과 아님 |
| 단일 장소 | 금오도 비렁길 1개 장소만 테스트 |
| 6개 시나리오 | 모든 여행자 유형 커버 불가 |
| 단일 Operator | A/B 모두 동일 Operator — 독립성 제한 |
| 생성 변동성 | 동일 Operator가 A → B 순서로 생성, B에 문체 학습 효과 가능성 |
| Live 정보 미반영 | 배편/날씨 실제 데이터 없이 테스트 |
| Framework 미완성 | FA-01/FA-02/MR-01/MR-02 OPEN — 일부 provenance 구분 불완전 |
| 금오도 SSOT 미등록 | 이번 결과는 SSOT 등록 근거가 되지 않음 |

**이번 테스트 하나만으로:**

> "CAND-OPS-003이 모든 SOUL 답변을 개선한다"

고 결론내리지 않는다. 이번 테스트가 보여주는 것은:

> "금오도 비렁길이라는 단일 장소에 대해 CAND-OPS-003 방식으로 작성된 Knowledge를 제공받은 조건에서, 6개 시나리오 중 5개에서 더 유용한 응답 패턴이 관찰되었다"

---

## 10. NEWLY DISCOVERED ISSUES (Evidence Only — Candidate 수정 보류)

| ID | 내용 | 출처 시나리오 | 처리 |
|---|---|---|---|
| FA-NI-01 | WE Frictions 케이스 수치를 범용 범위로 변환할 위험 (30~50% 과일반화) | S5 / Condition B | Final Review 이후 별도 처리 |

---

## 11. CANDIDATE STATUS

```
CAND-OPS-003: Candidate / Draft (변경 없음)
FA-01, FA-02, MR-01, MR-02: OPEN (변경 없음)
```

이번 Utility Evidence가 Positive임에도 Candidate 상태를 유지한다.
Promotion Decision은 Final Review 이후 별도 절차.

---

## PROJECT STATE

```
Geumodo SOUL Utility Blind Evaluation = SAVED / READY FOR UNBLINDING → COMPLETED
Geumodo SOUL Utility Unblinding = SAVED / COMPLETE
CAND-OPS-003 Utility Test Conclusion = UTILITY EVIDENCE POSITIVE
```

---

## CURRENT NEXT ACTION

```
CAND-OPS-003 Blind Test — Final Review
```

---

## GIT

(commit 후 기재)
