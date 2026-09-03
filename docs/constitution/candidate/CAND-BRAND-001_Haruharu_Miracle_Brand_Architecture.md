---
code: CAND-BRAND-001
title: 하루하루의 기적 — 브랜드 구조 (Brand Architecture)
status: Candidate
priority: Level 4 (Brand / Organizational Structure)
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-07-16
related_ssot:
  - docs/02-brand/brand-bible.md (하루하루의 기적을 "서비스명"으로 지칭 — 용어 조정 필요, §Conflict Check 참조)
  - docs/00-master/aurora5-master-knowledge-v2.md (동일하게 "서비스명"으로 지칭)
  - brand/characters/lumi.md (고객 대면 캐릭터 "루미" — Lumi OS와 이름 중복, §Conflict Check 참조)
  - sowon-dreamtown/docs/YAKB/00_MANIFESTO/MANIFESTO-001_Invisible_Value_Manifesto.md (Project Phoenix를 플랫폼 자체로 서술 — §Conflict Check 참조)
  - docs/constitution/candidate/CAND-OS-001_Lumi_OS_v2_Phase1_Operating_Roadmap.md
  - docs/constitution/candidate/CAND-OS-002_Lumi_OS_v2.1_Memory_Engine.md
  - daily-miracles-mvp/DreamTown/09_CUSTOMER/STARTERKIT-v1.0_Hotel_Pilot_Package.md (§8 호텔 운영 흐름의 실행 절차 상세본)
promotion_path: Research → Candidate → Review → Constitution / SSOT (본 문서는 Candidate 단계, SSOT 승격이나 기존 구조 변경을 하지 않는다)
---

> 본 문서는 기존 Constitution/SSOT/Manifesto를 대체하지 않는다. Level 4
> 아이디어로 감지되어 Candidate로 저장하며, 신규 SSOT에 바로 반영하지
> 않는다.
>
> Candidate Lifecycle는 `CONSTITUTION_GOVERNANCE.md`(Research → Candidate →
> Constitution)를 따른다.

---

# CAND-BRAND-001 — 하루하루의 기적 Miracle Brand Architecture

## 1. Core Definition

'하루하루의 기적'은 고객과 만나는 최상위 브랜드이며, DreamTown은 고객
경험을 만들고, Project Phoenix는 그 경험을 뒤에서 운영하고 성장시킨다.

## 2. 핵심 구조

```
하루하루의 기적 (최상위 브랜드, 웹사이트·카카오톡 채널)
    │
    ▼
DreamTown (고객 경험 브랜드 — 여행·콘텐츠·상품)
    │
    ▼
Project Phoenix (내부 운영·지식·기술 플랫폼)
    │
    ▼
Lumi OS (Project Phoenix 내부 운영체계)
```

- **하루하루의 기적** — 최상위 브랜드이자 웹사이트·카카오톡 채널
- **DreamTown** — 고객이 경험하는 여행·콘텐츠·상품 브랜드
- **Project Phoenix** — 내부 운영·지식·기술 플랫폼
- **Lumi OS** — Project Phoenix 내부 운영체계

## 3. 노출 기준

**고객이 접하는 브랜드 (2026-07-16 갱신):**

- 하루하루의 기적 (웹사이트 / 카카오톡 채널)
- DreamTown
- 여수 별빛항로
- 오로라5

**고객에게 기본적으로 노출하지 않는 내부 구조:**

- Project Phoenix
- Lumi OS
- 그 외 운영체계 명칭 전반

- 카카오톡 채널 '하루하루의 기적'은 DreamTown 상품 안내, 영상 전달,
  문의, 재회 연결의 공식 접점으로 사용한다.

> **참고:** "오로라5(Aurora5)"는 내부 문서(`aurora5-master-knowledge-v2.md`,
> `AURORA-STATUS.md` 등)에서는 프로젝트/팀 코드명으로도 함께 쓰이고
> 있다. 이번 갱신은 오로라5가 §8 호텔 운영 흐름의 "21시 오로라5 안내"처럼
> **고객 대면 기능/캐릭터로도** 쓰인다는 사실을 반영한 것이며, 내부
> 코드명으로서의 오로라5 사용을 바꾸는 것은 아니다 — 하나의 이름이
> 내부/고객 대면 두 층위에 걸쳐 쓰이는 사례로, §5.3(Lumi/Lumi OS)과
> 같은 종류의 관찰이다. 지금 정리하지 않고 발견 사실만 남긴다.

## 4. Applications

- 웹사이트 정보 구조
- 카카오톡 채널 운영
- 호텔 제안서
- 여수 별빛항로 상품
- 고객 안내 문구
- 내부 시스템 명칭과 외부 노출 기준

---

## 5. Conflict Check (기존 브랜드 관련 SSOT 점검 결과)

전체 저장소(`daily-miracles-mvp`, `sowon-dreamtown`)에서 "브랜드
구조"/"브랜드 아키텍처"/"최상위 브랜드"를 명시적으로 정의한 기존 문서는
**없음**을 확인했다(2026-07-16, 전체 검색 기준). 따라서 이름이 직접
충돌하는 기존 SSOT는 없다. 다만 아래 3가지는 **용어/노출 기준 상
재검토가 필요한 지점**으로 확인되어 그대로 보고한다 — 지금 수정하지
않는다.

### 5.1 "하루하루의 기적"의 명칭 — "서비스명" vs "브랜드"

`docs/02-brand/brand-bible.md`(1행, 53행)와
`docs/00-master/aurora5-master-knowledge-v2.md`(12행)는 둘 다
"하루하루의 기적"을 **"서비스명"**으로 지칭한다. 이번 Candidate는 이를
**"최상위 브랜드"**로 재정의한다. 두 표현이 상충하는 것은 아니지만("서비스"이자
"브랜드"일 수 있음), 향후 Review 단계에서 용어를 통일할지 결정이
필요하다.

### 5.2 MANIFESTO-001의 "Project Phoenix" 서술과의 관계

`sowon-dreamtown/docs/YAKB/00_MANIFESTO/MANIFESTO-001_Invisible_Value_Manifesto.md`는
"Project Phoenix는 사람의 보이지 않는 가치를 발견하고... 세상에
따뜻한 흔적으로 남기는 **플랫폼**이다"(1절, 10절)라고 선언하며, "DreamTown은
관광지가 아니라... 인생의 기준점이다"(§7)라고 DreamTown을 그 플랫폼 하위
경험으로 서술한다.

이 서술 방식 자체는 이번 Candidate의 계층 구조(Project Phoenix → 내부
운영, DreamTown → 고객 경험)와 **내용상 크게 어긋나지 않는다** — "Project
Phoenix가 하는 일"을 설명하는 선언문으로 읽을 수 있다. 그러나
MANIFESTO-001의 언어 자체가 고객을 향한 선언문처럼 쓰여 있어("Project
Phoenix는 ~하는 플랫폼이다"), **"Project Phoenix는 고객에게 노출하지
않는다"는 이번 Candidate의 원칙과 표현 층위가 다르다.** MANIFESTO-001은
현재 GOV-001 감사 기록상 실질적으로 LOCKED로 운영되고 있어(§Governance
참조) 지금 수정하지 않으며, 이 차이를 향후 Review에서 "Project
Phoenix라는 이름이 고객에게 실제로 노출되는 문서/화면이 있는지" 확인할
지점으로 남긴다.

### 5.3 "Lumi"(캐릭터) vs "Lumi OS"(내부 운영체계) — 이름 중복

`brand/characters/lumi.md`는 "루미(Lumi)"를 **고객 대면 AI 캐릭터**로
정의한다(Aurora5 캐릭터군 중 하나, 데이터 분석 AI/통찰의 탐험가). 반면
`CAND-OS-001`, `CAND-OS-002`가 정의하는 **Lumi OS**는 이번 Candidate의
원칙상 "내부 운영체계"로 노출하지 않아야 한다.

**같은 이름 "Lumi"가 두 가지 다른 층위(고객 대면 캐릭터 / 내부 전용
운영체계)에서 쓰이고 있다.** 이는 직접적인 내용 충돌은 아니지만, 실제
운영 시 고객이 "Lumi OS"라는 표현을 우연히 접하면 캐릭터 "루미"와
혼동할 위험이 있다. Review 단계에서 다음 중 하나를 결정해야 한다:

- (a) 캐릭터 "루미"가 곧 Lumi OS의 고객 대면 인터페이스라고 명확히
  규정한다(이름 재사용을 의도된 것으로 확정), 또는
- (b) 내부 운영체계의 이름을 다르게 지어 혼동을 없앤다.

이번 Candidate는 이 결정을 내리지 않는다 — 발견 사실만 기록한다.

#### Review Note (2026-07-16)

명칭 중복은 확인되었으나, 현재 파일럿에서는 **Lumi OS는 내부 운영
전용, DreamTown은 고객 경험 전용**으로 분리 운영하는 것으로 결정한다.
따라서 (a)/(b) 중 어느 쪽으로도 **이름 변경은 지금 보류한다.**

**재검토 트리거:** 1호 호텔 운영 이후 실제로 고객이 "Lumi OS"라는
표현에 노출되어 캐릭터 "루미"와 혼동하는 사례가 발생하면, 그 시점에
이 항목을 Review Agenda로 상정한다. 그 전까지는 별도 조치를 하지
않는다.

### 5.4 Lumi OS Candidate와의 관계

`CAND-OS-001`(Lumi OS v2 Phase 1 로드맵), `CAND-OS-002`(Memory Engine)는
이미 "Lumi OS는 Project Phoenix 산하"라는 전제를 명시적으로 다루지는
않았으나, 내용상 "운영·지식·기술" 층위를 다루고 있어 이번 Candidate의
계층 구조(Project Phoenix → Lumi OS)와 **정합적**이다. 충돌 없음.

---

## 6. Governance

이번 Candidate는 `CONSTITUTION_GOVERNANCE.md`(Research → Candidate →
Constitution)를 따른다. 다음을 하지 않는다:

- 신규 SSOT 생성 또는 기존 SSOT 수정
- `MANIFESTO-001`(YAKB, 실질적 LOCKED) 수정
- `brand-bible.md`, `aurora5-master-knowledge-v2.md`의 "서비스명" 표현 변경
- "Lumi" 캐릭터 또는 "Lumi OS" 명칭 변경

## 7. Pilot Operating Principle (2026-07-16)

1호 호텔 파일럿 기간에는 **새로운 기능 개발을 중단한다.** 운영
우선순위는 다음과 같다.

1. Starter Kit 운영
2. 실제 고객 경험
3. 호텔 운영 피드백
4. 운영 데이터 수집
5. 이후 개선

이 원칙은 `docs/lumi/operations/README.md`의 "운영 → 패턴 발견 →
Evidence 축적 → Candidate" 원칙, `CAND-OS-001`의 "운영이 설계를
검증한다"는 원칙과 동일한 사고방식을 1호 호텔 파일럿에 적용한 것이다.

## 8. 호텔 운영 흐름

```
호텔 판매
  ↓
카카오톡 채널 (하루하루의 기적)
  ↓
Part 1
  ↓
호흡항로
  ↓
15시 체크인
  ↓
Part 2
  ↓
21시 오로라5 안내
  ↓
Part 3
  ↓
후기
  ↓
별들의 약속
```

이 흐름의 Part 1/2/3 실행 순서·재생 방법은
`daily-miracles-mvp/DreamTown/09_CUSTOMER/STARTERKIT-v1.0_Hotel_Pilot_Package.md`에
상세히 정의되어 있다 — 이 문서는 브랜드/운영 원칙 층위를, Starter Kit
문서는 실행 절차 층위를 각각 담당한다.

## 9. 호텔 패키지 운영안

호텔 기본 서비스와 연계 가능한 항목:

- 오전 10~11시 캐리어 보관 안내
- 체크인은 기존 15시 유지
- 체크인 전 시간을 여행 경험으로 활용
- 가능 시 바다 전망 객실 우선 배정 (객실 상황에 따라 제공)

> **명확화:** 이는 호텔의 운영 정책을 변경하는 것이 아니라, 호텔이
> 이미 제공하는 기존 서비스(캐리어 보관, 15시 체크인 등)를 DreamTown
> 상품 경험으로 연결하는 방식이다.

## 10. DreamTown 핵심 메시지

DreamTown은 '숙박을 판매하는 프로젝트'가 아니라 '도착하는 순간부터
여행이 시작되는 경험'을 만든다.

여수를 '별들의 고향'으로 기억하고, '별들의 약속'을 통해 재방문을
넘어 재회를 만들어 간다.

> 이 메시지는 §1 Core Definition, 그리고
> `sowon-dreamtown/docs/YAKB/02_SEEDS/Candidates/CAND-ROUTE-001_DreamTown_Route_Manifesto.md`
> (Superseded by `SSOT-ROUTE-001`)의 "별은 잊히지 않았다는 약속이다"
> 원칙과 정합적이다.

## 11. 문의 채널

Starter Kit 및 고객 문의는 카카오톡 채널 '하루하루의 기적'을 공식
문의 채널로 사용한다.

## 12. Review Note — Pilot Freeze (2026-07-16)

1호 호텔 운영 종료 전까지는 다음을 보류한다:

- 새로운 기능 개발
- 새로운 Starter Kit 제작
- 브랜드 구조 변경
- Lumi OS 외부 노출

운영 결과를 Review한 후 Version 1.1 개선 여부를 결정한다.

## 13. Production / Operations 저장소 분리 (2026-07-17)

`dreamtown-assets`(Production: `03_KLING`/`04_DAVINCI`/`05_FINAL`)와
`daily-miracles-mvp/DreamTown/`(Operations: `07_YOUTUBE`/`08_SNS`/
`09_CUSTOMER`)의 역할을 분리하기로 확정했다. `07_YOUTUBE`에는 영상을
중복 저장하지 않으며, 영상 원본은 항상 `dreamtown-assets/05_FINAL`을
참조한다.

이 결정에 따라 `dreamtown-assets/09_STARTERKIT/STARTERKIT-v1.0_Hotel_Pilot_Package.md`를
`daily-miracles-mvp/DreamTown/09_CUSTOMER/`로 이동했다(내용 변경 없음,
경로 참조만 갱신). `dreamtown-assets/09_STARTERKIT/`에는 새 위치를
안내하는 포인터만 남겼다.

**추가 발견 (같은 조사 중):** `daily-miracles-mvp/DreamTown/SSOT/`에
이미 `SSOT-IMG-001`, `SSOT-VID-002`, 그리고 **`SSOT-ROUTE-001`**이
존재한다는 것을 확인했다. 특히 `SSOT-ROUTE-001`은
`sowon-dreamtown`(Route 철학 선언)과 `daily-miracles-mvp`(EP01 7장면
제작 기준)에 **같은 코드로 서로 다른 문서**가 존재하는 이름 중복이다
— `dreamtown-assets/07_ASSET_SSOT/ASSET_MAP.md`에 상세 기록했다. 지금
어느 쪽으로 통일할지 결정하지 않는다.

## Validation Progress

```
□ 웹사이트 정보 구조에 실제 적용 및 검증
□ 카카오톡 채널 운영에 실제 적용 및 검증
□ 호텔 제안서 반영 검증 (1호 호텔 파일럿 연계)
□ §5.1 용어 통일 여부 결정 (서비스명 vs 브랜드)
□ §5.2 Project Phoenix 고객 노출 여부 실사 확인
■ §5.3 Lumi/Lumi OS 이름 중복 해결 방향 결정 — **결정: 이름 변경 보류,
  Lumi OS(내부)/DreamTown(고객) 분리 운영 유지. 재검토 트리거: 1호
  호텔 운영 중 실제 혼동 사례 발생 시 Review Agenda 상정.**
□ 오로라5 내부 코드명 vs 고객 대면 기능 이름 중복 정리 (§3 참고 사항)
□ §7 Pilot Operating Principle 준수 여부 (파일럿 기간 중 신규 기능
  개발이 실제로 없었는지)
□ §8 호텔 운영 흐름 실제 실행 검증
□ §9 호텔 패키지 운영안 실제 호텔 협의 및 적용 확인
□ §12 Pilot Freeze 항목 준수 확인 (신규 기능/신규 Starter Kit/브랜드
  구조 변경/Lumi OS 외부 노출 없었는지)
```

## Evidence

(이번 대화에서 구두로 확정된 구조를 최초 기록. 실제 웹사이트/카카오톡
채널 적용 후 운영 근거가 쌓이면 이 절에 링크를 추가한다.)

## Last Review

2026-07-16 — §7~§12 추가(Pilot Operating Principle, 호텔 운영 흐름,
호텔 패키지 운영안, DreamTown 핵심 메시지, 문의 채널, Pilot Freeze
Review Note). §3 노출 기준에 여수 별빛항로/오로라5 반영. §5.3 Review
Note(이름 변경 보류 결정) 포함. 최초 작성도 2026-07-16.

## Next Review

1호 호텔 파일럿 운영 종료 시점(§12 Pilot Freeze 해제 검토), §5의 나머지
재검토 지점(용어 통일, Project Phoenix 노출 여부) 중 하나 이상이 실제
운영에서 문제로 드러나는 시점, §5.3의 재검토 트리거(Lumi/Lumi OS 혼동
사례 발생) 시점, 또는 웹사이트/카카오톡 채널 정보 구조에 이 구조를
실제 적용하는 시점
