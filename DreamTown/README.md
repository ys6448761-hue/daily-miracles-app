# DreamTown

> DreamTown은 관광 홍보 프로젝트가 아니다.
> DreamTown은 **감정 회복 설계(Emotional Recovery Design) 프로젝트**다.

DreamTown의 핵심 자산은 영상이 아니라 **SSOT**다.

DreamTown은 항로(Route)를 통해 사람들이 **자기 안의 희망을 다시 발견**하도록 돕는다.

---

## 핵심 원칙

```
장소는 캐릭터다.
순서는 스토리다.
회복은 목적지가 아니라 항로다.
감정 품질은 도구가 아니라 SSOT로 유지한다.
```

> 소원은 이루어지는 것이 아니라, 다시 빛나기 시작하는 것이다.

---

## Season 1

| 에피소드 | 제목 | 엔딩 감정 | 상태 |
|---------|------|----------|------|
| EP01 | 소원이의 별빛 항로 | 여수에서, 내 소원이 다시 빛나기 시작했다. | 완료 |
| EP02 | 소원이의 달빛 항로 | 마음이 열리기 시작했다. | 제작중 |
| EP03 | 소원이의 소망 항로 | 처음으로, 소원을 소리 내어 말할 수 있었다. | 예정 |

---

## 감정 회복 여정 구조

```
소원 → 도착 → 호흡 → 연결 → 상승 → 쉼 → 소원 → 안식 → 별
```

---

## 핵심 자산 (SSOT 전체 목록)

| SSOT | 역할 |
|------|------|
| [SSOT-WORLD-001](SSOT/INDEX.md#world) | DreamTown 철학 — 모든 제작 결정의 출발점 |
| [SSOT-CHAR-001](SSOT/INDEX.md#character) | 소원이 캐릭터 — 모든 제작의 캐릭터 기준 |
| [SSOT-LOC-001](SSOT/INDEX.md#location) | 여수 장소 — 장소도 캐릭터다 |
| [SSOT-ROUTE-001](SSOT/INDEX.md#route) | EP01 항로 — 순서가 감정을 만든다 |
| [SSOT-IMG-001](SSOT/INDEX.md#image) | 이미지 생성 — 감정 품질의 70% |
| [SSOT-VID-002](SSOT/INDEX.md#animation) | 영상 생성 — Kling/Sora 기준 |
| [SSOT-OPS-001](SSOT/INDEX.md#pipeline) | 전체 파이프라인 |
| [SSOT-DESIGN-001](SSOT/INDEX.md#design) | 역순 감정 설계 — 엔딩에서 역산 |
| [SSOT-EXP-001](SSOT/INDEX.md#expansion) | 확장 가이드 — Level 1~5 |

---

## Candidates & Research (미승인 — 참고용)

아래 문서는 **아직 SSOT나 Constitution으로 승인되지 않았다.** 위
"핵심 자산" 표와 같은 층위로 취급하지 않는다 — Research → Candidate →
Constitution 순서 중 앞 두 단계에 있는 진행 중 자료다.

| 문서 | Status | 위치 |
|---|---|---|
| CAND-CONSTITUTION-001 (Geumo Legend Heart Mirror) | Candidate | `docs/constitution/candidate/CAND-CONSTITUTION-001_Geumo_Legend_Heart_Mirror.md` |
| RESEARCH-GEUMO-001 (Turtle Legend Symbol Interpretation) | Research Note | `docs/constitution/research/RESEARCH-GEUMO-001_Turtle_Legend_Symbol_Interpretation.md` |
| RESEARCH-010 (Pilot Study EP01) | Pilot Study | `docs/constitution/research/RESEARCH-010_Pilot_Study_EP01.md` — 참조하는 `RESEARCH-009_User_Validation_Protocol`는 아직 저장소에 없음 |
| RESEARCH-011 (Evidence Collection Protocol) | Research | `docs/constitution/research/RESEARCH-011_Evidence_Collection_Protocol.md` — RESEARCH-010의 인터뷰 수집 형식을 표준화 |
| RESEARCH-012 (Participant Journey) | Research | `docs/constitution/research/RESEARCH-012_Participant_Journey.md` — §4에 "EP01 End-to-End 경험 시나리오 미작성" 공백을 기록 |
| RESEARCH-013 (EP01 End-to-End User Journey) | Experience Scenario | `docs/constitution/research/RESEARCH-013_EP01_End-to-End_User_Journey.md` — RESEARCH-012 §4의 공백을 채움 |

**현재 작업 상태:** `docs/constitution/research/STATUS_Pilot_Research.md`
참조 (Next Task: `RESEARCH-014_EP01_Operator_Playbook`, 아직 생성 안 함)

## 신규 파트너 / 새 세션 시작 순서

1. 이 README를 읽는다
2. `SSOT/INDEX.md` → 인수인계 순서대로 SSOT를 읽는다
3. `Assets/EP0X/` → 직전 에피소드 에셋을 확인한다
4. `docs/ssot/episodes/STATE-EP0X_*.md` → 감정 상태를 이어받는다

---

## Production / Operations 역할 분리 (2026-07-17)

`dreamtown-assets`(별도 저장소)와 이 `DreamTown/` 폴더는 역할이 다르다.

```
dreamtown-assets  → Production (제작)
  ├─ 03_KLING      생성 소스
  ├─ 04_DAVINCI    편집 중
  └─ 05_FINAL      완성본 (Source of Truth)

DreamTown/        → Operations (운영)
  ├─ 07_YOUTUBE    YouTube 운영 (영상 재저장 없음)
  ├─ 08_SNS        SNS 운영 (영상/이미지 재저장 없음)
  └─ 09_CUSTOMER   고객 패키지 운영 (예: Starter Kit)
```

**절대 원칙:** `07_YOUTUBE`에는 영상을 중복 저장하지 않는다. 영상
원본은 항상 `dreamtown-assets/05_FINAL`을 참조한다. `08_SNS`,
`09_CUSTOMER`도 동일한 원칙을 따른다 — 원본은 항상 `dreamtown-assets`를
참조하고, 이 폴더들은 운영 문서(업로드 기록/게시 기록/고객 패키지
실행 문서)만 담는다.

## 디렉토리 구조

```
DreamTown/
├─ README.md          ← 지금 이 파일
├─ SSOT/
│  └─ INDEX.md        ← 전체 SSOT 진입점 (원본은 docs/ssot/ 에 있음)
├─ Assets/
│  ├─ EP01/ (Images/ Videos/ OST/)
│  ├─ EP02/
│  └─ EP03/
├─ 07_YOUTUBE/         ← Operations: YouTube 운영 기록
├─ 08_SNS/             ← Operations: SNS 운영 기록
└─ 09_CUSTOMER/        ← Operations: 고객 패키지 (Starter Kit 등)
```
