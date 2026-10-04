# SOUL_CABLE_CAR_MORE_TO_KNOW_QUESTION_DISCOVERY_V0_1_EVIDENCE

**Status:** IMPLEMENTED / VERIFIED / CLOSED  
**Branch:** `integration/soul-cablecar-port-v0-1`  
**Starting HEAD:** `085ed75` (Living Detail Information Hierarchy V0.1)  
**Date:** 2026-10-04

---

## 구현 범위

"더 알고 싶을 때" 영역을 일괄 accordion에서
질문 중심 discovery 구조로 Presentation 변경.

Knowledge 추가 없음. 기존 verified Knowledge 재사용.  
Quick Basic / Rich Basic / SOUL Judgment / Journey 변경 없음.  
backend / schema / migration 변경 없음.

**파일:** `dreamtown-frontend/src/pages/SoulCableCarPage.jsx`  
**Build:** 690 modules, 0 errors — PASS

---

## Before → After

### Before
```
더 알고 싶을 때
└── ExpandableSection (하나의 큰 accordion)
    ├── 크리스탈 캐빈
    ├── 오동도 연계 동선 (conditional)
    ├── 돌산 하차 후
    ├── 함께 찾는 코스
    └── ☎ 운행 문의
```

### After
```
더 알고 싶을 때
├── [context 질문들 — 상위 우선]
│   ├── 🚗 차를 가져가면 뭘 먼저 봐야 해요?     (hasVehicle)
│   ├── 🌿 오동도와 어떻게 이어가요?             (nextPlace=odongdo)
│   └── 👨‍👩‍👧 부모님과 탈 때 뭘 보면 좋을까요?   (companion=parents)
├── [general 질문들]
│   ├── 💎 크리스탈 캐빈은 뭐가 달라요?
│   ├── 🏔️ 돌산에서 내리면 뭐가 있어요?
│   └── 🗺️ 케이블카와 함께 어디를 둘러볼까요?
└── ☎ 운행 문의: 061-664-7301
```

---

## Interaction

- 각 질문 독립 클릭·expand
- `useState(new Set())` — `openKeys`로 key 추가/제거
- 각 질문 state 독립 (다른 질문 자동 닫힘 없음)
- 여러 개 동시 열림 가능
- DEFAULT: 질문 목록만 보임, 답은 collapsed

---

## Context Priority (ctx boolean reorder)

| Context | 상위 질문 |
|---|---|
| DEFAULT | general 3개만 |
| VEHICLE | 🚗 차를 가져가면 → general 3개 |
| ODONGDO | 🌿 오동도와 이어가요 → general 3개 |
| PARENTS | 👨‍👩‍👧 부모님과 탈 때 → general 3개 |
| ALL | 🚗 + 🌿 + 👨‍👩‍👧 → general 3개 |

새 추천 엔진 없음. `ctx` boolean으로 단순 prepend.

---

## Knowledge 재사용 매핑

| 질문 | 출처 |
|---|---|
| 🚗 차를 가져가면 | Rich Basic "정류장 & 자동차 여행" — 편도 차량 잔류·왕복 단순 |
| 🌿 오동도와 이어가요 | 기존 Depth "오동도 연계 동선" — 자산정류장↔오동도 입구 |
| 👨‍👩‍👧 부모님과 탈 때 | Rich Basic "캐빈 선택" — 접근성·투명 바닥·전동휠체어 제한 |
| 💎 크리스탈 캐빈 | 기존 Depth + Rich Basic "캐빈 선택" — 6인·바퀴 제한·현장 선택 |
| 🏔️ 돌산 내리면 | 기존 Depth "돌산 하차 후" — 돌산공원·야경 |
| 🗺️ 함께 어디를 | 기존 Depth "함께 찾는 코스" — 향일암 오전→케이블카 오후 |

---

## 미지원 질문 제외

- 이동 구체 시간·교통수단 → Travel Time GOVERNANCE_HOLD
- 예약 방법 구체값 → 공식 안내 확인 처리
- 할인 금액 구체값 → 현장 확인 처리

---

## Final Copy Correction

| | 변경 전 | 변경 후 |
|---|---|---|
| 질문 | `🗺️ 케이블카 다음엔 어디로 이어갈까요?` | `🗺️ 케이블카와 함께 어디를 둘러볼까요?` |
| 이유 | 질문이 케이블카 이후를 묻지만, 답("향일암 오전→케이블카 오후")은 케이블카 이전 코스 — 질문·답 불일치 | 기존 검증된 Knowledge와 의미 정렬 |
| 답 | 변경 없음 | 변경 없음 |

---

## Founder Review

**PASS**

검증 항목:
- 기존 큰 accordion 제거 — PASS
- 질문 목록 먼저 노출 — PASS
- context 관련 질문 상위 우선 — PASS
- 각 질문 독립 expand — PASS
- 기존 verified Knowledge만 재사용 — PASS
- 미검증 Knowledge 없음 — PASS
- 전화번호 유지 — PASS
- 전체 hierarchy 보존 — PASS
- copy correction 적용 — PASS
- Evidence Safety 0건 — PASS

추가: Founder Final Review 도달 → **PRODUCT STRUCTURE PASS**  
전체 Living Detail Page V1 CLOSE는 이 persistence 완료 후 별도 확인.

---

## Evidence Safety

7종 금지 표현 — 0건:  
`예약 불필요 / 1,000 / 오전 일찍 / 도보 약 5분 / 3~4시간 / 도보 불가 / 자산정류장 주차장에 차`

---

## HOLD

| 항목 | 상태 |
|---|---|
| Human Experience | DEFERRED |
| Hero image | DEFERRED |
| Travel Time Matrix | GOVERNANCE_HOLD |
| taxonomy | 미포함 |
| Production Promotion | PROMOTION_HOLD 유지 |

---

## Current Next Action

`CABLE_CAR_LIVING_DETAIL_PAGE_V1_FOUNDER_FINAL_REVIEW`
