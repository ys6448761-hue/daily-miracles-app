---
code: CAND-EXP-003
title: 소원 우선 적응형 여행코스 — Wish-First Adaptive Route
status: Candidate
importance: Level 4
category: Experience
owner: 대표(푸르미르) / Aurora5 / Claude Code
created: 2026-10-22
origin: 대표님과 루미의 여행코스 개인화 논의 (2026-10-22)
promotion_path: Candidate → Research Validation → Constitution
related_ssot:
  - docs/constitution/candidate/CAND-EXP-001_DreamTown_Experience_Architecture.md
  - docs/constitution/candidate/CAND-EXP-002_DreamTown_Orchestra_of_Sowonis_Life.md
  - docs/knowledge/parking/handover/DATA_HANDOVER_01/Data_Handover_Report.md
  - memory/project_dreamtown_journey_ssot.md
  - memory/project_star_experience_principle.md
project_impact: 잠정 90/100
knowledge_value: ★★★★★
---

> 본 문서는 기존 Constitution/SSOT/Manifesto를 대체하지 않는다.
> 실제 오픈 테스트에서 반복 검증된 이후에만 승격을 검토한다.
> Candidate Lifecycle는 `CONSTITUTION_GOVERNANCE.md`를 따른다.

---

## Purpose

소원이가 먼저 선택한 장소를 중심으로, 소울이가 주차 혼잡·이동·시간·휴식·감정 흐름을 종합하여 여행코스를 구성·조정하는 경험 원칙을 정의한다.

기존 DreamTown 항로 시스템은 감정 흐름 중심의 추천 코스를 제공한다. 본 Candidate는 그 위에 **소원이의 직접 의사결정**을 경험의 출발점으로 삼는 레이어를 추가하는 방향을 탐색한다.

---

## Background

2026-10-22 대표님과 루미의 논의에서 제안된 아이디어:

- 주차 혼잡이 높은 시간대에 소원이가 선택한 장소를 방문해야 할 경우, 장소를 삭제하기보다 방문 순서나 주차 대안을 먼저 조정하는 것이 소원이 경험에 더 충실하다.
- 소울이가 코스를 일방적으로 변경하기보다, 변경 이유와 대안을 설명하고 소원이에게 선택권을 되돌려주는 것이 DreamTown 철학에 맞다.
- 소원이가 직접 고른 장소는 기억과 의미를 담은 선택이므로, AI가 임의로 대체하거나 삭제하면 경험의 주도권이 깨진다.

---

## Core Definition

소원이가 가고 싶은 장소를 먼저 선택하고, 소울이가 주차 혼잡·이동·시간·휴식·감정 흐름을 고려하여 해당 장소를 중심으로 여행코스를 구성하고 조정하는 경험 원칙.

**핵심 대비:**

| 기존 접근 | 본 Candidate 방향 |
|---|---|
| SOUL이 감정 흐름 기반으로 코스 추천 | 소원이가 장소를 먼저 선택, SOUL이 코스 구성 |
| 혼잡 시 장소 변경 권장 | 혼잡 시 순서·주차 조정 우선, 장소는 유지 |
| 코스 변경 시 새 추천 제시 | 변경 이유 설명 + 소원이에게 선택권 반환 |

---

## Principles

1. **소원 우선(Wish-First):** 소원이가 선택한 필수 방문지는 기본적으로 유지한다. 삭제는 최후의 선택이며, 삭제 시 반드시 이유를 설명하고 동의를 구한다.

2. **혼잡 = 조정 신호, 삭제 신호 아님:** 주차 혼잡은 방문지 삭제보다 방문 순서 변경, 대안 주차장 안내, 이동 방법 전환에 우선 사용한다.

3. **정보 투명성:** 실시간 데이터, 정적 정보(SSOT 기반), 추정 정보(경험 기반)를 소원이에게 명확하게 구분하여 전달한다. 확인되지 않은 정보를 확실한 정보처럼 제공하지 않는다.

4. **설명 + 선택권 반환:** 코스 조정 시 이유를 먼저 설명하고, 조정안과 원안 중 선택권을 소원이에게 제공한다. "이렇게 바꿨어요"가 아니라 "이런 이유로 이렇게 가는 건 어때요?"

5. **감정 항로 보호:** DreamTown 공식 감정 항로와 개인 맞춤 항로를 구분하며, 기존 장소의 감정 역할(SOUL `experience_ko`)을 임의로 변경하지 않는다.

---

## Applications

### 소울이 (SOUL AI)
- 소원이가 특정 장소를 명시하면, 해당 장소를 코스의 앵커로 설정한다.
- 이동 시간, 주차 상황, 동행자 제약을 고려하여 앵커 주변 코스를 구성한다.
- 혼잡·주차 문제 감지 시 → 순서 조정안 또는 대안 주차 제시 → 소원이 선택 대기.

### 앱 UX
- "꼭 가고 싶은 곳" 마킹 기능이 필요할 수 있음 (현재 미구현 — 검토 필요).
- 코스 조정 시 변경 이유와 대안을 명확히 표시하는 UI 설계 필요.

### DreamTown Route
- 기존 4단계 항로(기적→은하→항로→추천) 위에 적용되는 레이어.
- 기존 항로 SSOT(memory/project_dreamtown_journey_ssot.md)를 대체하지 않음.

### Parking
- 혼잡 기반 조정을 위해서는 신뢰할 수 있는 주차 혼잡 데이터 출처가 필요함.
- 현재 `_PLACE_PARKING` (DATA_HANDOVER_01)은 정적 시설 정보 — 실시간 혼잡 데이터 미포함.
- 실시간 혼잡 API 연동 여부는 별도 검증 필요 (→ Open Questions 참조).

### Experience
- 소원이의 직접 선택이 감정 경험의 주도권을 보강함.
- 기존 Star Experience Principle(memory/project_star_experience_principle.md)의 "감정 먼저" 원칙과 병행 적용 가능.

---

## Good / Bad Examples

### ✅ Good

**상황:** 소원이가 "이순신광장 꼭 가고 싶어요"라고 함. 주말 오후 주차 혼잡 예상.

> 소울이: "이순신광장은 주말 오후에 주차가 혼잡할 수 있어요. 오전에 먼저 들르거나, 인근 진남상가 주차장을 이용하는 방법도 있어요. 어떻게 하실래요?"

→ 장소 유지, 이유 설명, 선택권 반환.

### ❌ Bad

**상황:** 동일.

> 소울이: "이순신광장 대신 오동도로 코스를 바꿨어요."

→ 소원이 선택 무시, 대안 설명 없음, 선택권 박탈.

---

## Technical Dependencies

| 의존 항목 | 현재 상태 | 비고 |
|---|---|---|
| 소원이 장소 마킹 기능 | 미구현 | 앱 UX 설계 필요 |
| 실시간 주차 혼잡 데이터 | 미연동 | Open Question (아래 참조) |
| SOUL 코스 구성 로직 | `soyeowoolService.js` 존재 | 소원 우선 파라미터 미지원 |
| 대안 주차장 추천 | Parking Option B (구현 중, gate closed) | DATA_HANDOVER_01 기반 |
| 장소 감정 역할 정의 | `_PLACE_KNOWLEDGE.*.experience_ko` | 변경 금지 (SSOT 보호) |

---

## Open Questions

| ID | 질문 | 우선순위 | 검증 방법 |
|---|---|---|---|
| OQ-1 | 실시간 주차 혼잡 데이터 출처가 존재하는가? (공공 API, 파트너 데이터 등) | 높음 | 조사 필요 |
| OQ-2 | 소원이가 "꼭 가고 싶은 곳"을 명시하는 UX는 어느 단계에 배치되어야 하는가? | 중간 | 프로덕트 설계 |
| OQ-3 | 코스 조정 제안을 소원이가 거절할 경우 소울이의 다음 행동은? | 중간 | UX 정의 필요 |
| OQ-4 | 소원이 선택 장소와 감정 항로 추천이 충돌할 경우 우선순위는? | 중간 | Architecture Decision 필요 |
| OQ-5 | 정적 혼잡 패턴(요일·시간대 경험치)으로 실시간 대체 가능한가? | 낮음 | 데이터 검토 |

---

## Promotion Target

다음 조건이 충족되면 Constitution 승격을 검토한다.

1. OQ-1 (실시간 혼잡 데이터) 조사 완료 — 연동 가능 여부 확인
2. OQ-2 (UX 배치) 프로덕트 설계 합의
3. 실제 사용자 여행코스 시나리오 3개 이상 시뮬레이션 완료
4. 기존 DreamTown 항로 SSOT와 충돌 없음 확인

---

## Claude Code Action

현재 단계에서 구현 불가 항목:

- 소원이 장소 마킹 UX: `NEW` 분류 — 앱 UX 설계 선행 필요
- 실시간 혼잡 조정: `NEW` 분류 — 데이터 출처 검증 선행 필요
- SOUL 코스 구성 소원 우선 파라미터: `EXTEND` 분류 — 앱 UX 합의 후 설계 가능

현재 단계에서 가능한 항목:

- Parking Option B 데이터 연동 (gate 해제 시): `CONNECT` 분류 — DATA_HANDOVER_01 준비됨
- SOUL 응답에서 주차 혼잡 설명 + 선택권 제공 패턴: `EXTEND` 분류 — 설계 검토 가능

---

## Evidence / Decision References

- Parking 정적 데이터: `docs/knowledge/parking/handover/DATA_HANDOVER_01/`
- Parking Option B 구현 상태: `soyeowoolService.js` (gate closed, `approved_for_customer_publication: false`)
- SOUL 경험 원칙: `docs/architecture/SOUL_CABLE_CAR_PHASE1_CLOSURE_EVIDENCE_V1.md` 외 Phase 1 시리즈
- 여정 예약 4단계: `memory/project_dreamtown_journey_ssot.md`
- Star Experience Principle: `memory/project_star_experience_principle.md`

---

## Origin

- 날짜: 2026-10-22
- 출처: 대표님(푸르미르)과 루미의 여행코스 개인화 논의
- 기록자: Claude Code (Antigravity)

---

## Project Impact

**잠정 90/100**

소원이 경험의 주도권을 보강하는 원칙으로, DreamTown 전체 철학과 높은 정합성을 가짐.
실시간 데이터 연동 미확인 및 UX 설계 미착수 상태로 구현 난이도 불확실성 존재.
정적 혼잡 패턴 활용 시 부분 구현 가능성 있으나, 전체 원칙 실현까지 다수 결정 필요.
