---
code: CAND-EXP-001
title: DreamTown Experience Architecture
status: Candidate
priority: Level 5 (Candidate Constitution)
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-12
promotion_path: Research → Candidate → Constitution (본 문서는 Candidate 단계, 실제 MVP 운영 검증 전까지 Confirmed/Constitution으로 취급하지 않는다)
---

> 본 문서는 기존 Constitution/SSOT/Manifesto를 대체하지 않는다. 실제 오픈 테스트에서 반복 검증된 이후에만 승격을 검토한다.
>
> Candidate Lifecycle는 `CONSTITUTION_GOVERNANCE.md`를 따른다.

---

# CAND-EXP-001 — DreamTown Experience Architecture (Candidate)

## 문서 목적

DreamTown의 설계 기준은 기능(Function)이 아니라 **사람의 변화(Transformation)**이다.

기술은 경험을 위해 존재하며, 경험은 사람의 변화를 위해 존재한다.

---

## 핵심 원칙

DreamTown은 여행을 판매하지 않는다.

사람의 삶에 오래 남는 기억과 관계를 설계한다.

여행은 그 기억을 만드는 하나의 경험이다.

---

## Design Hierarchy

```
Belief
  ↓
Purpose
  ↓
Constitution
  ↓
Experience
  ↓
Journey
  ↓
Touchpoint
  ↓
Technology
```

각 계층은 아래 계층을 제약하지 않고 방향을 제시한다.

Technology는 언제든 변경 가능하지만, Belief와 Constitution은 반복 검증을 통해서만 변경된다.

---

## Experience Pipeline (Candidate)

```
Wish → Welcome → Check-in → Journey → Return → Reconnection
```

> 아래 표는 기존에 확정된 SSOT(`SSOT-WISHART-001`, `SSOT-ROUTE-001`, `SSOT-BG-001`, `SSOT-PRODUCT-001`, `DreamTown_V1_Architecture_Freeze.md`, `DreamTown_Character_SSOT.md`)를 근거로 단계별 목적·감정·행동·역할을 정리한 것이다. 새로운 원칙을 만들지 않았으며, 근거가 없는 단계(Reconnection)는 추측하지 않고 그대로 미정으로 남긴다.

| 단계 | 목적 | 사용자 감정 | 사용자 행동 | DreamTown 역할 |
|---|---|---|---|---|
| **Wish** | 소원을 발견하고 표현한다 | 아직 응답 전(1P 발견, `SSOT-WISHART-001` ②) | 소원 작성, 스타터카드·정면사진 제출 | WishArt Engine이 1P(소원그림) 생성 |
| **Welcome**(= First Promise, `SSOT-APP-002` Draft) | 별들의 가족이 된다 | 낯섦 → 기대 | 가족선택→스타터카드→정면사진→동의(First Promise 화면 순서) | Activation(권한검증·Check-in Session) → First Promise(사용자화면) → System Registration Transaction(Journey 연결, Route Ready). **동의·사진 제출 완료 전까지 Resident/Atelier는 PENDING 유지** |
| **Check-in** | 여정의 시작을 확인한다 | 도착의 항로(BG-01, 새로운 시작) | 스타터키트 수령, QR/Activation Token 오픈 | Activation 레이어가 Booking/Product/Hotel/Token 권한 검증 + 재진입 가능한 Check-in Session 생성(`SSOT-APP-002`) |
| **Journey** | EP01 Main Starlight Route **6개 장면**을 체험한다(2026-07-13 확정) | 도착→호흡→연결→상승→쉼→소원(`SSOT-BG-001`/`SSOT-ROUTE-001` Main Route) | 걷기·바라보기·쉬기(`DreamTown_Character_SSOT.md` 소원이 담당 행동) | Background Asset 제공(Main Route 6개), 모바일 안내 화면(`SSOT-APP-001`), Reveal Rule(별·별씨앗·별공방은 3P부터). 미남크루즈는 Optional Experience로 별도 제공 |
| **Return** | 오늘을 마무리하고 일상으로 돌아간다 | 안식(호텔 Experience Stage, `SSOT-APP-002`) | 결과(소원그림+주민카드) 확인, 다운로드/공유 | 결과 전달, `atelier_records` 저장(별공방), Promise 기록. 호텔은 Route Location이 아니라 Experience Stage(체크인/First Promise/안식/재진입)로 관리 |
| **Reconnection** | 시간이 지난 뒤 다시 연결된다 | 그리움 → 재회 | 재방문 또는 알림 수신 | **미정 — 자료 없음.** 재회(Reunion) 트리거·동작은 `SSOT-IDENTITY-001` §5, `DreamTown_V1_Architecture_Freeze.md` §6에서 이미 스펙 없음으로 확인됨. 이 문서에서도 추측하지 않는다. |

각 단계에서 **아우룸의 안내 음성**(보이스오버/시스템 내레이션)이 전환을 알리고, **소원이**는 감정 장면만 담당한다(`DreamTown_Character_SSOT.md` v2.1 역할 분리 원칙).

---

## Technology Principle

DreamTown은 기술을 보여주는 서비스가 아니다.

모든 기술은 사용자의 경험을 더 자연스럽게 만들기 위해 존재한다.

사용자는 기술이 아니라 감정과 기억을 기억한다.

---

## Experience First Principle

```
사람의 변화
  ↓
경험
  ↓
기술
```

모든 신규 기능은 이 순서를 만족해야 한다.

---

## Validation Principle

DreamTown은 철학을 선언으로 확정하지 않는다.

실제 운영과 반복 검증을 통해 원칙으로 승격한다.

---

## Knowledge Growth Model

```
Research
  ↓
Candidate
  ↓
Constitution
```

| 단계 | 의미 |
|---|---|
| Research | 아이디어, 실험 전 |
| Candidate | 실제 운영 검증 중 |
| Constitution | 여러 프로젝트에서도 반복 검증 완료 |

---

## 운영 원칙

SSOT는 정답을 저장하는 장소가 아니다.

검증된 진실만 살아남는 장소다.

---

## 검증 항목 (MVP)

다음 항목을 실제 오픈 테스트에서 확인한다.

① Experience Pipeline이 실제 행동을 변화시키는가

② Welcome → Check-in → Return 구조가 자연스러운가

③ 사용자가 "AI"보다 "나를 이해해 준다"라고 느끼는가

④ 재방문 및 별들의 약속 참여율이 증가하는가

⑤ 호텔 운영자가 프로세스를 쉽게 이해하는가

---

## 승격 경로

Research → Candidate(본 문서) → Constitution.

DreamTown에서 충분히 검증된 뒤, Project Phoenix의 다른 프로젝트에도 동일 원칙이 반복 적용되면 Project Phoenix Constitution으로 승격을 검토할 수 있다. **이 승격은 자동으로 일어나지 않으며, 반복 검증 후 별도 승인이 필요하다.**

---

## 관련 문서 (참조만, 변경하지 않음)

- `SSOT-WISHART-001_WishArt_V4_Core_Guide.md`
- `SSOT-ROUTE-001_EP01_Wish_Journey.md`, `SSOT-BG-001_Starlight_Route_Background_Guide.md`(2026-07-13: EP01 Main Route 6개 확정)
- `SSOT-PRODUCT-001_DreamTown_Product_Architecture.md`
- `SSOT-APP-001_DreamTown_Mobile_Journey_Guide.md`(Part 3, 구현됨) / `SSOT-APP-002_DreamTown_First_Promise_Flow.md`(Part 2, Draft)
- `DreamTown_V1_Architecture_Freeze.md`(APPROVED v1.0)
- `docs/ssot/media/SSOT-OPS-001_DreamTown_Video_Pipeline.md`
- `docs/ssot/core/DreamTown_Character_SSOT.md`

> 참고: 지시서에 언급된 `SSOT-VID-001_DreamTown_Video_Pipeline.md`는 저장소에서 확인되지 않았다. 동일 주제의 실제 파일은 `SSOT-OPS-001_DreamTown_Video_Pipeline.md`(`docs/ssot/media/`) 하나뿐이며, 이 문서에는 그쪽에만 참조를 추가했다.
