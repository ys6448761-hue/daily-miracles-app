---
code: SSOT-PRODUCT-001
title: DreamTown Product Architecture
status: LOCKED
owner: Aurora5 / Claude Code
based_on: SSOT-WISHART-001_WishArt_V4_Core_Guide.md, SSOT-ROUTE-001_EP01_Wish_Journey.md, SSOT-BG-001_Starlight_Route_Background_Guide.md
created: 2026-07-09
layer: LAYER 2 — Operational SSOT
---

# SSOT-PRODUCT-001 — DreamTown Product Architecture

> DreamTown의 모든 상품은 **하나의 WishArt Core Engine**과 **하나의 별빛항로(Route)**, **하나의 Background Asset**을 공유한다. 변경되는 것은 캐릭터뿐이다.

---

## 0. 전체 구조 다이어그램

```
DreamTown 주민 등록
  ↓
주민증 발급
  ↓
Story ID 생성
  ↓
보석별 결정 (SSOT-WISHART-001 ⑧ Gem Star Rule)
  ↓
┌─────────────────────────────────────────────┐
│         WishArt Core Engine (1개)             │
│  (SSOT-WISHART-001 + SSOT-ROUTE-001 8항로     │
│   + SSOT-BG-001 Background Asset)             │
└─────────────────────────────────────────────┘
  ↓                ↓                ↓                ↓
소원그림(1P)   기적영상(4P)    기적쇼츠         기적 스토리북(10P)
  │                │                │                │
  │                │                │                └→ 별빛항로 영상 (동일 10P를 Kling으로 영상화)
  │                │                │
  └────────────────┴────────────────┴──────────→ 별씨앗 (Story의 기억을 실물로)
                                                       ↓
                                                     별공방 (Story가 현실이 되는 마지막 단계)
```

---

## 1. 주민 등록 → 주민증 → Story ID → 보석별

```
DreamTown 주민 등록
  ↓
주민증 발급
  ↓
Story ID 생성
  ↓
보석별 결정
```

- 보석별 결정은 `SSOT-WISHART-001` ⑤ Emotion Rule / ⑧ Gem Star Rule을 따른다(치유=Emerald, 새출발=Diamond, 용기=Ruby, 지혜=Sapphire, 감사=Citrine).
- Story ID는 이후 모든 상품(소원그림/기적영상/기적쇼츠/스토리북/별빛항로영상/별씨앗/별공방)을 연결하는 키다.

---

## 2. 소원그림

```
WishArt Engine
  ↓
1P (발견)
  ↓
고객 제공
```

- `SSOT-WISHART-001` ②③④의 1P 규칙(등장 가능/금지 요소, Identity Lock)을 그대로 따른다.

---

## 3. 기적영상 — DreamTown 대표 상품

```
WishArt Engine
  ↓
4P
  발견 → 응답 → 기록 → 참여
```

**DreamTown의 대표 상품으로 정의한다.**

> ⚠️ **확인 필요**: `SSOT-WISHART-001` §② 원문 확인 사항에 기록된 대로, WishArt V4 Original은 1P(발견)/2P(응답)/3P(기록) **3막만 명시적으로 정의**하며 "4P(참여)"는 원문에 없다. 4P는 `dreamtown-wishart` 코드에서 확인된 것이다(`REPORT-WishArt_V4_Gap.md` §2). 이번 지시로 기적영상이 "4P 기반"이자 "대표 상품"으로 명시적으로 확정되었으므로, **4P(참여) 단계의 원문 정의(등장 가능/금지 요소, Reveal Rule과의 관계)를 V4 원문 수준으로 보강할 필요가 있다** — 이 보강은 이번 작업 범위에 포함되지 않아 별도 지시가 필요하다.

---

## 4. 기적쇼츠

```
소원그림 1P
  ↓
배우 2D 소원이 — 8개 항로 체험 (SSOT-ROUTE-001 / SSOT-BG-001 BG-01~08)
  ↓
소원그림 2P
  ↓
DreamTown Ending
```

**주인공은 배우 소원이다.** (고객 본인이 아니다 — §7 참조)

> ⚠️ **수치 갱신 필요**: 이전 `TODO-Core_Engine_Integration.md`/`SSOT-ENGINE-001`에는 기적쇼츠가 "7개 항로 × 5초(=35초)"로 기록되어 있었다. 이번 확정으로 공식 Route가 8개 장면(미남크루즈/항해의 항로 추가)이 되었으므로, 항로 수는 **7 → 8로 갱신**한다. 다만 **"항로당 5초"가 8개 항로에도 그대로 적용되는지(8×5=40초가 되는지, 다른 배분인지)는 이번 지시에 없어 확정하지 않았다** — 별도 확인 필요. 상세는 `REPORT-Route_Product_Alignment.md` 참조.

---

## 5. 기적 스토리북 (10P)

```
1P    소원그림
2~9P  별빛항로 (8개 장면 — BG-01~BG-08)
10P   소원그림 2P + CTA
```

스토리 글은 별도로 생성한다(각 페이지에 대응하는 Story Text).

---

## 6. 별빛항로 영상

```
기적 스토리북의 동일한 10P 이미지
  ↓
Kling 영상화
```

**주인공은 배우 소원이가 아니라, 여행 온 고객이다.**

> 기적쇼츠(§4, 배우 소원이 주인공)와 별빛항로 영상(§6, 고객 본인 주인공)은 **동일한 Route·Background를 공유하지만 캐릭터가 다르다** — `SSOT-BG-001`의 "Background는 절대 변경하지 않는다. 변경되는 것은 캐릭터뿐이다" 원칙이 두 상품 사이에서 실제로 검증되는 지점이다.

---

## 7. 별씨앗

Story의 기억을 실물로 남긴다.

- 실물 규격은 `SSOT-WISHART-001` ③ Reveal Rule의 "별씨앗 규칙 v1"을 따른다(노란색 야광, 5각 둥근 별, 반투명 야광 소재, 텍스트 삽입 금지 등).

---

## 8. 별공방

Story가 현실이 되는 마지막 단계.

- Reveal Rule상 3P(기록)에서 최초 등장하는 대상이며, 목적지가 아니라 결과다(`SSOT-WISHART-001` ③ 참조).

---

## Background Asset 원칙 (재확인, 재정의 아님)

Background는 DreamTown의 공식 제작 자산이다. 모든 상품은 동일한 Background Asset(`SSOT-BG-001` BG-01~08)을 사용한다. 변경되는 것은 캐릭터뿐이다. 본 문서는 이 원칙을 재정의하지 않고 그대로 인용한다.

---

## 제작 도구

| 용도 | 도구 |
|---|---|
| 이미지 | GPT Image 2 |
| 음원 | Mureka |
| 영상 | Kling |

도구 변경 시 SSOT를 수정한다(`SSOT-BG-001` 기술 스택과 동일 원칙).

---

## Original Source

- 본 문서는 신규 SSOT이며, 기존 SSOT(`SSOT-WISHART-001`, `SSOT-ROUTE-001`, `SSOT-BG-001`, `SSOT-LOC-001`, Character SSOT)를 변경하지 않고 그 위에 상품 구조만 확정한 것이다.
- 검증 결과는 `docs/reports/REPORT-Route_Product_Alignment.md` 참조.
