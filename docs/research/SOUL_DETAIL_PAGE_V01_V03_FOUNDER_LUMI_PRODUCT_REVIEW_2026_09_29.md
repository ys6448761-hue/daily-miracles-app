# SOUL Detail Page Prototype — Founder + Lumi Product Review Evidence
## Cable Car V0.1 → V0.3
Status: PRODUCT PROTOTYPE EVIDENCE — NOT Candidate / NOT SSOT
Date: 2026-09-29
Scope: /soul/cable-car vertical slice only

---

## A. Confirmed by Prototype

- SOUL Detail Page는 단순 chat answer보다 living detail page 형태로 작동 가능하다.
- Place Identity는 안정적으로 유지하면서 Traveler Context에 따라 페이지 일부를 재구성할 수 있다.
- Context는 누적 가능하다: car → car+odongdo → car+odongdo+parents.
- Personalization은 페이지 전체 재생성보다 priority/depth/emphasis 변경 방식이 적합하다.
- PLACE / FOR ME / SOUL / JOURNEY / DEPTH 역할 분리가 반복 감소에 도움이 됐다.
- Depth disclosure는 풍부한 Prepared Knowledge를 initial reading에서 숨길 수 있다.
- State 2 (car + odongdo)에서 Place Relationship을 이용한 Journey Judgment가 SOUL 차별화를 가장 명확하게 드러냈다.

---

## B. Learned / Observed

- 기본정보는 필요하지만 기본정보 = 운영정보는 아니다. Place Attraction / Experience Basics가 필요하다.
- Prepared Knowledge가 풍부하다고 모두 먼저 말하면 안 된다.
- Context가 많아질수록 페이지가 길어지는 것이 아니라 중요한 판단이 더 선명해져야 한다.
- 모든 Context가 같은 UI 변화를 일으키면 안 된다.
- 이동에 영향을 주는 Context와 경험 조건을 바꾸는 Context는 역할이 다르다.
- 모든 Context를 Journey node로 표현하면 시간/의미 구조가 깨질 수 있다.
- SOUL Judgment와 Journey Visual은 서로 다른 역할을 가져야 한다.
- 깊은 지역지식일수록 관계를 정확하게 표현하는 것이 중요하다.

---

## C. State-Specific Findings

### STATE 0 (public page)
- Context가 부족한 상태에서 SOUL이 자산→돌산 방향을 너무 일찍 판단했다.

### STATE 1 — car
- FOR ME recomposition은 작동했다.
- 주차 관련 판단과 SOUL 문장이 일부 반복됐다.
- 다음 목적지를 모르는 상태에서 주차/왕복 판단이 너무 빨랐다.

### STATE 2 — car + odongdo
- Journey Discovery가 가장 강하게 나타났다.
- SOUL text / Journey visual / 자산 하차 후 오동도 연결 설명 사이의 이동 관계가 명확히 일치해야 한다.
- Place Relationship은 추측으로 시각화하면 안 된다.

### STATE 3 — car + odongdo + parents
- 기존 Context가 삭제되지 않고 누적되는 것은 성공.
- parents Context에서 crystal cabin을 primary judgment로 올린 것은 우선순위 부적절.
- 부모 동행을 고소 불편으로 자동 가정하지 않는다.
- parents는 새로운 destination node라기보다 기존 Journey의 경험 조건을 바꾸는 Context에 가깝다.

---

## D. Interaction Finding

- "부모님도 함께 가는데" 자연어 입력이 처음에는 parents state를 활성화하지 못했다.
- Deterministic prototype에서도 natural-language context activation과 quick context control은 일관되어야 한다.

---

## E. Visual Asset Finding

Founder가 준비한 Visual Assets 경로:
`C:\DREAM TOWN\Assets\SOUL\Yeosu_Cable_Car\Place_Hero / Experience / Journey / Context / Wish_Scene`

V0.3 Repository에서 해당 경로를 찾지 못해 기존 repo 이미지로 대체됨:
- Hero: `public/images/og/cablecar.jpg`
- Wish Scene: `public/images/storybook/sources/page05/cablecar/…wish_signal…`

따라서:
- Visual Hospitality hypothesis는 V0.3에서 검증 완료로 기록하지 않는다.
- 준비된 로컬 Visual Assets는 Product Asset이지 factual Evidence가 아니다.
- Generated image의 지리/운영정보를 Truth Source로 사용하지 않는다.

---

## F. Open / Hold

| 항목 | 상태 |
|------|------|
| Prepared Visual Asset 실제 연결 + Visual Hospitality 검증 | OPEN — NEXT ACTION |
| State 2 정확한 Place Relationship/route representation | Verification 필요 |
| Judgment Priority 규칙 | Evidence 있음, Candidate 승격 금지 |
| Odongdo/Hyangiram Detail Page 확장 | HOLD |
| place_knowledge migration | HOLD (기존) |
| DB/schema/runtime/production | 변경 없음 |

---

## G. Working Product Principles (Prototype-supported, NOT Candidate)

1. **기본정보는 차별화의 반대가 아니라 차별화를 신뢰하게 만드는 기반이다.**

2. **답변은 짧게. 준비는 과할 정도로.**

3. **SOUL이 나를 더 많이 알수록 페이지가 길어지는 것이 아니라, 무엇이 중요한지가 더 선명해져야 한다.**

4. **페이지 개인화는 정보를 계속 추가하는 것이 아니라, 지금 이 사람에게 중요한 정보의 깊이와 순서를 다시 편집하는 것이다.**

5. **V0.3에서 새롭게 구체화된 working hypothesis:**
   Context가 많아질수록 Prepared Knowledge를 더 많이 꺼내는 것이 아니라,
   여행 전체의 성공에 더 큰 영향을 주는 판단부터 선택해야 한다.

---

## Current Next Action

Cable Car V0.3 Prepared Visual Asset Integration + Visual Hospitality Validation

목적: Founder가 준비한 실제 Place_Hero / Experience / Journey / Context / Wish_Scene 자산을
Repository에서 사용할 수 있게 연결한 뒤,
동일한 Cable Car prototype에서 Visual Hospitality만 검증.

Judgment Priority 수정 및 Odongdo/Hyangiram 페이지 구현과 섞지 않는다.
