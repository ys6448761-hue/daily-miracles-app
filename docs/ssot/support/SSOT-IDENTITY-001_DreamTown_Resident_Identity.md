---
code: SSOT-IDENTITY-001
title: DreamTown Resident Identity
status: LOCKED
owner: Aurora5 / Claude Code
based_on: SSOT-WISHART-001(Identity Lock), SSOT-ARCH-001(데이터 모델)
created: 2026-07-11
layer: LAYER 2 — Operational SSOT
---

# SSOT-IDENTITY-001 — DreamTown Resident Identity

> 정면사진 한 장을 공통 원본으로 사용해 소원그림과 디지털 주민카드, 두 가지 결과를 만든다. 주민카드 전체를 생성형 AI에 맡기지 않는다.

---

## 1. 정면사진 공통 원본

- DreamTown Route에서 받는 정면사진(`resident_assets.asset_type = PORTRAIT_ORIGINAL`)은 이후 모든 Identity 기반 산출물의 유일한 원본이다.
- 하멜등대 배경사진, 여행사진, 관광지 인증사진은 받지 않는다(§DreamTown Route 입력, 지시서 §5).
- 스타터카드 사진(`asset_type = STARTER_CARD`)은 Identity 원본이 아니다 — 신원·가입일·호텔 체험 근거로만 저장된다.

---

## 2. 소원그림 (`wishart_image`)

- DreamTown 별빛항로의 핵심 작품.
- 2D 한국만화·수채화 스타일(`SSOT-WISHART-001` ⑩ Prompt Builder 수채화 규칙).
- WishArt V4(`SSOT-WISHART-001`) 전체 규칙 적용 — Identity Lock, Reveal Rule, Negative Rule 등 예외 없음.
- 생성 경로: Core Engine(`SSOT-ARCH-001` §3 `generate_wishart(service_mode="DREAMTOWN_ROUTE")`) → `resident_assets.asset_type = WISHART_IMAGE`.

---

## 3. 디지털 주민카드 (`resident_profile_image` + `resident_card_image`)

- 역할: DreamTown 주민 등록 증표, 별공방·재회 시스템의 식별 기준.

### 3.1 구성 (전체 AI 생성 금지)

```
정면사진(공통 원본)
  ↓
AI 생성 — 2D 수채화 프로필 얼굴만  (resident_profile_image)
  ↓
고정 템플릿 합성
  이름 / 가입일 / Resident ID / 별들의 고향 호텔 / 첫 항로 / QR 또는 조회코드
  ↓
resident_card_image
```

- **AI가 생성하는 것은 얼굴(2D 수채화 프로필)뿐이다.** 이름/가입일/Resident ID/호텔/항로/QR은 고정 템플릿에 값을 채워 합성한다(생성형 AI에게 텍스트·레이아웃을 맡기지 않는다 — 지시서 §11 금지 사항).
- `resident_profile_image`는 `wishart_image`와 **동일한 Identity Lock**(정체성 보존율, 나이 역행 금지 등, `SSOT-WISHART-001` ④)을 적용받는다 — 같은 사람인데 소원그림과 주민카드의 얼굴이 다르게 보이면 실패다.

### 3.2 소원그림과 주민카드의 차이

| | 소원그림(`wishart_image`) | 주민 프로필(`resident_profile_image`) |
|---|---|---|
| 목적 | 별빛항로 핵심 작품 | 신원 식별 |
| 배경 | Background Asset(`SSOT-BG-001`) | 없음(또는 단순 배경, 템플릿 합성 대상) |
| 스타일 | 2D 한국만화·수채화 + WishArt V4 전체 규칙 | 2D 수채화 얼굴(단순화된 서브셋) |
| Identity Lock | 적용 | 적용(동일 기준) |

> 프로필용 스타일 규칙(배경 유무, 구도 등 세부)이 이번 지시서에 명시되어 있지 않다 — **자료 없음.** Phase B 착수 시 별도 확정 필요.

---

## 4. Identity Lock (재확인)

`SSOT-WISHART-001` ④의 규칙을 그대로 따른다 — 본 문서는 재정의하지 않는다. 핵심: 소원그림과 주민카드 모두 동일한 원본 정면사진에서 파생되므로, 두 산출물 사이에 "다른 사람처럼 보이는" 불일치가 없어야 한다. 이 일치성 검증(QC)의 구체 절차는 이번 지시서에 없어 Phase B에서 설계한다.

---

## 5. 재회 식별 기준

> ⚠️ **자료 없음 — 추측하지 않음.** 이번 지시서는 "별공방·재회 시스템의 식별 기준"이 주민카드라고만 명시했을 뿐, 재회 시스템 자체의 트리거(무엇이 "재회"를 발생시키는가)나 동작(재회 시 무엇이 일어나는가)을 정의하지 않았다.

현재 확정할 수 있는 것은 다음뿐이다:
- 식별 키는 `resident_id`다(`atelier_records.resident_id` 참조).
- `atelier_records.reunion_status` 컬럼이 이번 지시서의 데이터 모델에 존재하므로, 재회 상태를 추적할 자리는 마련되어 있다.
- **트리거·동작·화면 흐름은 전부 미정이다.** 지시서 §11(구현 금지 사항)의 "별공방·재회 기능을 추측으로 구현" 금지를 그대로 지킨다 — Phase B에서도 별도 스펙 없이는 구현하지 않는다.

## Original Source

본 문서는 신규 SSOT다. 새로운 원칙을 추가하지 않았으며, 지시서에 명시되지 않은 부분(프로필 스타일 세부, 재회 트리거)은 자료 없음으로 남겼다.
