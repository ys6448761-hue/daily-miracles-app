---
Document: REPORT-Route_Product_Alignment
Purpose: "DreamTown 별빛항로 및 상품 구조 최종 확정" 작업의 검증 기준 5문항에 대한 답변
Date: 2026-07-09
Based On: SSOT-ROUTE-001(업데이트), SSOT-BG-001(업데이트), SSOT-PRODUCT-001(신규), REPORT-WishArt_V4_Gap.md
---

# REPORT — Route × Product Alignment

> 5개 검증 질문에 대해 **설계(Design) 수준**과 **구현(Implementation) 수준**을 구분해서 답한다. 설계는 이번 작업으로 확정되었으나, 코드 구현은 별개 사안이며 이전 `REPORT-WishArt_V4_Gap.md`, `REPORT-StoryBook_Code_Analysis.md`에서 이미 확인된 미구현 상태를 그대로 반영한다.

---

## Q1. 모든 상품이 동일한 Route를 사용하는가?

**설계: YES.** `SSOT-PRODUCT-001`의 모든 상품(소원그림/기적영상/기적쇼츠/스토리북/별빛항로영상)이 `SSOT-ROUTE-001`/`SSOT-BG-001`의 8개 공식 항로(BG-01~08)를 참조하도록 정의했다.

**구현: 미확인/부분적.** `dreamtown-wishart`의 실제 코드(`LOCATION_MAP`)는 5개 Canon 감정에 대응하는 5개 장소만 매핑하며(오동도/이순신광장/하멜등대/엑스포역/케이블카), **미남크루즈(MINAM)는 "별도 night-cruise product line"의 location variant로만 존재**한다(이전 `REPORT-StoryBook_Code_Analysis.md` §5 참조). 8개 항로 전체가 하나의 순서로 코드에 구현되어 있는지는 확인되지 않았다.

---

## Q2. 모든 상품이 동일한 Background Asset을 사용하는가?

**설계: YES.** `SSOT-BG-001`이 명시하는 원칙("배경은 변경하지 않는다, 변경되는 것은 캐릭터뿐")을 `SSOT-PRODUCT-001`이 그대로 인용해 모든 상품에 적용했다.

**구현: 미확인.** Background Asset을 "최초 1회 생성 후 LOCK"하는 저장·관리 메커니즘(파일 저장소, DB 테이블 등)이 코드에 실제로 존재하는지는 이번 조사 범위에서 확인하지 않았다. 현재 코드는 매 생성 시 프롬프트로 배경을 다시 조립하는 방식에 가깝다(`dreamtown-wishart`의 `build_wishart_package`가 매 호출마다 오리진 프롬프트를 조립).

---

## Q3. 배우 소원이와 고객 본인의 역할이 명확히 구분되는가?

**설계: 대체로 YES, 일부 미확인.**

| 상품 | 주인공 |
|---|---|
| 소원그림 | 고객 본인 (Identity Lock 대상) |
| 기적영상 | 고객 본인 |
| 기적쇼츠 | **배우 2D 소원이** |
| 별빛항로 영상 | **고객 본인(여행 온 고객)** |
| 기적 스토리북 | **명시 안 됨** — 1P/2P가 소원그림 기반이라 고객 본인으로 추정되나, 이번 지시서에 명시적 확인이 없다. 추측하지 않고 미확인으로 남긴다. |

**구현: 미확인.** "배우 2D 소원이"라는 고정 캐릭터 에셋이 코드/이미지 자산으로 존재하는지 이번 조사에서 확인되지 않았다.

---

## Q4. 기적영상, 기적쇼츠, 스토리북, 별빛항로 영상이 하나의 WishArt Engine에서 파생되는가?

**설계: YES.** `SSOT-PRODUCT-001`이 이 4개 상품 모두를 하나의 WishArt Core Engine 출력으로 구조화했다.

**구현: NO — 명확한 간극.** 이전 분석(`REPORT-StoryBook_Code_Analysis.md`)에서 이미 확인된 대로, 현재 코드베이스에는 다음과 같이 **서로 연결되지 않은 별개 시스템**이 존재한다.
- StoryBook: E2E Commerce 파이프라인(생성 로직 자체가 없음, mock) + 포스트카드→슬라이드 파이프라인(실제 동작하나 4P 구조 아님) — 서로 다른 두 시스템
- 기적영상(프리뷰): `assemble-miracle-video.js` — 5-프레임 고정, 사진 없음, WishArt Engine과 무관 (현재 `scripts/legacy/`로 분리됨)
- WishArt 이미지 생성: `dreamtown-wishart` — 가장 정교하나 `daily-miracles-mvp`와 코드로 연결되어 있지 않음(`SSOT-ENGINE-002` Adapter Plan 참조, 아직 설계 단계)

**결론**: 설계 문서상으로는 하나의 Engine에서 파생되지만, **실제 코드는 4개 상품이 각각 다른 시스템에서 만들어지고 있다.** 이 간극을 좁히는 것이 `TODO-Core_Engine_Integration.md`의 과제다.

---

## Q5. 새로운 상품이 추가되어도 동일한 Route를 재사용할 수 있는가?

**설계: YES.** Route(`SSOT-ROUTE-001`)와 Background(`SSOT-BG-001`)를 Engine·Product 계층과 분리해 정의했으므로, 원칙적으로 새 상품은 동일 Route/Background를 참조하기만 하면 된다.

**구현: 검증되지 않음(아직 상품이 추가된 적 없음).** 향후 신규 상품(웹툰/애니메이션/엽서/굿즈/전시)이 실제로 추가될 때 이 재사용성이 검증될 것이다.

---

## 종합

5개 질문 모두 **설계 수준에서는 YES**로 답할 수 있다 — 이번 작업으로 Route·Background·Product 구조가 정합성 있게 확정되었다. 그러나 **구현(코드) 수준에서는 Q4가 명확히 NO**이며, Q1/Q2/Q3/Q5는 미확인 상태다. 이 보고서는 설계의 완결성과 구현의 현실을 혼동하지 않기 위해 작성되었다 — "확정되었다"는 것이 "이미 그렇게 동작한다"를 의미하지 않는다.

## 추가로 확인된 사항

- 기적쇼츠의 항로 수가 이전 문서(7개)에서 이번 확정(8개)으로 갱신되었으나, 항로당 시간 배분(기존 "5초×7=35초")이 8개 항로에 어떻게 적용되는지는 이번 지시에 없어 확정하지 않았다(`SSOT-PRODUCT-001` §4 참조).
- `SSOT-ROUTE-001`에 이미 존재하던 표기 불일치("영상 Route는 하멜등대에서 종료" vs 호�텔이 마지막 장면인 다이어그램)를 발견했다 — 이번 작업 범위를 벗어나 임의로 정정하지 않고 해당 문서에 플래그만 남겼다.
- 신규 미남크루즈(항해의 항로) 장면의 감정 상태 수치·소원이 행동·카메라 구도는 이번 지시에 포함되지 않아 `SSOT-ROUTE-001`에 "미정"으로 남겼다.
