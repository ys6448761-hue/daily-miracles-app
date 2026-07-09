---
code: SSOT-DOC-001
title: DreamTown / Project Phoenix Document Governance
status: LOCKED
owner: Aurora5
created: 2026-07-09
layer: LAYER 2 — Operational SSOT
---

# SSOT-DOC-001 — Document Governance

> **원본은 보존하고, SSOT는 설계하며, 코드는 구현한다. DreamTown의 모든 지식은 이 계층 구조를 따른다.**

---

## 최상위 원칙

원본은 절대 수정하지 않는다.

원본은 Archive이다.

SSOT는 원본을 기반으로 작성한다.

Code는 SSOT를 기반으로 구현한다.

---

## 문서 계층

DreamTown 문서는 다음 계층을 가진다.

### Level 0 — Original
원본. 변경 금지. → `docs/originals/`

### Level 1 — Research
연구, 검토, 분석. → `docs/research/` 등

### Level 2 — SSOT
공식 설계. → `docs/ssot/`

### Level 3 — Implementation
Code. → 각 저장소의 소스 코드

### Level 4 — Output
상품, 영상, 이미지, 스토리북 등 산출물.

---

## 문서 흐름

```
Original
  ↓
Research
  ↓
SSOT
  ↓
Implementation
  ↓
Product
```

이 순서를 변경하지 않는다. Implementation이 Research나 Original을 건너뛰고 임의로 규칙을 만들지 않으며, SSOT는 반드시 Original(있는 경우) 또는 Research를 근거로 작성한다.

---

## Repository 구조

```
docs/
├── originals/   ← Level 0
├── research/    ← Level 1
├── ssot/        ← Level 2
├── reports/     ← 분석/조사 보고 (Level 1과 Level 2 사이의 산출물)
└── tasks/       ← 실행 항목 추적
```

---

## SSOT 문서의 Original Reference 항목 (제안)

원본이 존재하는 SSOT 문서는, frontmatter 또는 본문 상단에 원본 출처를 명시하는 항목을 추가할 수 있다. 예시:

```markdown
---
code: SSOT-WISHART-001
title: WishArt V4 Core Guide
status: LOCKED
original_source: docs/originals/WishArt-GPTS-V4-Original.md
---
```

또는 본문 내:

```markdown
## Original Source

- 원본: `WishArt-GPTS-V4-Original.md`
- 원본 변경 금지, 본 문서는 원본을 개발 가능한 구조로 재구성한 것이다.
```

> 이 항목은 **제안 구조**이며, 기존 SSOT 문서에 일괄 소급 적용하지 않는다. 원본이 실제로 확보된 신규 SSOT 작성 시부터 적용한다.

---

## 적용 범위 및 하지 않은 것

- 이번 문서는 원칙과 구조만 정의한다. 기존 문서의 실제 이동은 수행하지 않는다(별도 지시로 진행).
- `docs/ssot/INDEX.md`는 이번 작업에서 수정하지 않는다. Repository 구조가 확정된 후 별도 작업으로 갱신한다.
- 어떤 기존 문서가 Level 0(Original)에 해당하는지의 실사 결과는 `REPORT-Original_Document_Inventory.md`에 별도로 기록하며, 본 문서는 그 결과를 전제하지 않는다.
