# PHX-SOUL-QA-001 — SOUL 품질 개선 마무리 계획 및 머먹지 준비 기록 (§68 후속 · V1, 2026-11-20)

> 계획 및 기록 단계. 서비스 코드 수정 없음. 데이터 변경 없음. 운영 DB 연결 없음. 실제 LLM 호출 없음.
> GitHub push·PR·merge 없음. Render 배포 없음. Hybrid 운영 활성화 없음. 고객 노출 변경 없음.
> 기준: local / remote HEAD `10f52dc`. 전체 회귀 873 pass / 기존 실패 1. 실제 LLM 8/12/0. Clarify CLOSED. Production HOLD. 개인정보 법률 검토 BLOCKED.
> 선행: §66 (카페 Knowledge 검증), §67 (Founder 확정), §68 (제휴 혜택 확인). 원문 보존.

## Guardian Preflight Report (기록 전)

```
### Guardian Preflight Report

Requested Change:
  (1) SOUL 품질 개선 범위 확대 중단, 남은 핵심 과제 선별·마무리 계획 수립
  (2) 무여정 서비스 확장 원칙 기록 및 CAND-EXP-001 Candidate 확인·생성 대상 기록
  (3) 머먹지 구축 준비 계획 (SOUL 품질 종료 이후). 실행하지 않음.

Existing Assets Found:
  - 완료 Evidence: §36~§68 (Clarify CLOSED, 실제 LLM 8/12/0, §61 중복 제거, §64 Knowledge 통합, §65 원격 보존, §66~§68 카페·제휴 기록)
  - docs/constitution/candidate/CAND-EXP-001_DreamTown_Experience_Architecture.md (daily-miracles-mvp, status Candidate, 제목 불일치)
  - docs/constitution/candidate/CAND-EXP-002_* 2종 (ID 중복 기존 상태)
  - sowon-dreamtown/docs/YAKB/02_SEEDS/Candidates/CAND-EXP-001_Hotel_Package_Multi_Dreamer_Access.md (다른 체계의 동일 ID)
  - docs/constitution/CONSTITUTION_GOVERNANCE.md (Research → Candidate → Constitution, Candidate Template)
  - 무여정 UI: daily-miracles-mvp MuyojeongHomePage.jsx (기존 존재, 본 단계에서 읽지 않음)

Repositories Inspected:
  daily-miracles-mvp (constitution/candidate, governance, knowledge 파일명·헤더 확인). 기존 검증 사항 재조사 없음.
  sowon-dreamtown (CAND-EXP-001 파일명 확인만).

Relevant Files:
  docs/constitution/CONSTITUTION_GOVERNANCE.md, docs/constitution/candidate/CAND-EXP-001_*.md (읽기만)

Relevant Databases:
  없음.

Change Classification:
  기록 및 계획 (Decision record). 코드·데이터·Candidate 원본 변경 없음.

Connection Opportunity:
  머먹지 카테고리는 기존 SOUL Knowledge (장소·파트너·혜택 허용 목록) 재사용. 신규 Architecture 없음.

Duplication Risk:
  중간. CAND-EXP-001 ID 가 daily-miracles-mvp 와 sowon-dreamtown 에서 서로 다른 문서에 쓰임. 기존 문서 덮어쓰기 금지.

Data Risk:
  없음 (계획 단계). 카페 혜택 노출 게이트는 §68 상태 유지.

Recommended Approach:
  1) Founder 방향 기록 (본 문서 §1)
  2) Phase A 항목을 4분류로 정리하고 품질 종료 기준 제안 (§2)
  3) CAND-EXP-001 충돌 확인 → 기존 문서 미변경, 머먹지 Candidate 는 ID 미부여 기록으로 보류 (§3)
  4) Phase C 머먹지 준비 계획 (실행 없음) (§4)
  5) Evidence, Project State, 외부 SHA256 백업

Questions Requiring Decision:
  Q69-1 머먹지 Candidate ID 부여 (CAND-EXP-001 은 두 저장소에서 이미 다른 문서에 사용)
  Q69-2 Candidate 단계 명칭: Founder 지시 (Candidate → Review → Approved → LOCKED) 와 CONSTITUTION_GOVERNANCE (Research → Candidate → Constitution) 중 어느 체계인지
  Q69-3 품질 개선 종료 전 필수 목록 (§2.2) 승인
  Q69-4 H07·H15 카페 추천 연결의 고객 노출 범위 (E 항목 허용 여부는 §68 Q68-4 와 연계)

Implementation Status: READY (기록 및 계획 전용. 코드·데이터·LLM·push·배포 제외)
```

## 1. Founder 방향 기록

| 항목 | 확정 내용 | 상태 |
|---|---|---|
| SOUL 품질 개선 | 범위를 계속 확대하지 않는다. 남은 핵심 과제만 선별해 마무리 | Founder Decision |
| 다음 단계 | 품질 개선 마무리 후 무여정 내부 **머먹지** 카테고리 구축으로 전환 | Founder Decision |
| 카페 제휴 (아메리카노 무료) | 7곳 합의 완료 (§68). 공통 이용 조건 유지 | Founder Confirmed |
| 모이핀 | 10% 할인 추진, 매장 합의 대기, 고객 노출 HOLD. 무료 음료 차단 유지 | Founder Decision (§67·§68) |
| 기준 상태 | HEAD 10f52dc. 회귀 873/1. 실제 LLM 8/12/0. Clarify CLOSED. Production HOLD. 법률 검토 BLOCKED | 확인 |

## 2. Phase A — 품질 개선 마무리 계획

기존 Evidence 를 근거로 했다. 재조사 없음.

### 2.1 항목별 분류

| # | 항목 | 현재 상태 (근거) | 분류 |
|---|---|---|---|
| A1-a | 카페 제휴 상태 기록 | 완료 (§68, Founder Confirmed 7곳) | **완료** |
| A1-b | 카페 장소 Knowledge 정리 | 분류표 완료 (§66). 번지·전화·영업 CONFLICT 다수 미해결. 바다 전망은 V 1곳, E 다수 | **품질 종료 전 필수** (노출하는 장소 항목에 C 값이 나가지 않도록 제외 규칙 확정) |
| A1-c | 승인 혜택 허용 목록 반영 | 허용 목록 비어 있음 (노출 0). 반영 시 P1~P4 점검 필요 (§68) | **출시 전 필수** (고객 노출 전 승인·테스트) |
| A2 | H07·H15 카페 추천 연결 | "카페 추천 기능은 아직 준비 중" (NOT_SUPPORTED_YET). §66 최소 계획 있음 | **품질 종료 전 필수** (정보 답변 경로만. 혜택 문구 제외) |
| A3 | 주요 도보 연결 및 반나절 일정 검증 | 도보 연결 미확인 표기 적용 (H06·H14). 반나절 일정 미구성 유지 (H09). 차량 기준 VERIFIED_TRAVEL_EDGES 8개 | 반나절 일정 **생성 기능** = **출시 이후 개선**. 미확인 도보 시간이 노출되지 않는지 확인 = **품질 종료 전 필수** (기존 가드·테스트로 대부분 충족, 최종 회귀에 포함) |
| A4 | 최종 H01~H20 실제 LLM 검증 | 최신 실제 측정 8/12/0 (§60). §61·§64 변경 후 실제 재측정 없음 (재생 검증만) | **출시 전 필수**. 실제 호출은 별도 Preflight·승인 후 1회 (예산 상한 재확정) |
| A5 | 모바일·브라우저 E2E | 로컬 Chrome 48케이스 (§25). 운영 기준 최종 검증 없음 | **출시 전 필수** (계획만. 실행은 Render 배포 승인 이후) |
| A6 | 최종 코드·Evidence 보존 | HEAD 10f52dc 원격 보존 완료. §66~§68 은 워킹트리 미커밋 | **품질 종료 전 필수** (승인된 문서만 선별 커밋. DREAMTOWN_STATUS 전체 커밋 금지) |

### 2.2 품질 개선 종료 기준 (제안, Q69-3 승인 대상)

품질 개선을 종료하려면 아래가 모두 충족되어야 한다.

1. 노출되는 장소 정보에 C (충돌) 값이 없다 (제외 규칙 + 테스트).
2. H07·H15 가 V·E 정보만 쓰고, 혜택 문구와 미승인 항목을 쓰지 않는다 (테스트).
3. 운영시간·체류 시간·도보 시간 중 근거 없는 값이 응답에 없다 (기존 가드 + 회귀).
4. 전체 회귀: flag unset / 0 / 1 에서 기존 실패 집합 외 신규 실패 0.
5. 실제 LLM 최종 측정 1회 (A4) 결과가 기존 8/12/0 대비 악화되지 않음, 또는 차이가 설명됨.
6. Clarify·Hybrid·Route Gate·Manifest 기존 테스트 유지.
7. 코드와 Evidence 가 승인된 범위만 보존되어 있다 (A6).

종료 이후 남는 것: A3 반나절 일정 생성, A5 E2E 실행 (배포 승인 후), 혜택 허용 목록 반영 (승인 후), 모이핀 10% 활성화 (파트너 합의 후).

### 2.3 실제 LLM 호출에 대한 주의

A4 는 실제 LLM 호출을 포함한다. 이번 계획은 호출하지 않는다. 호출 전 필요: 새 Preflight, 예산 상한 (질문 수·호출 수·USD), 승인 토큰, 기존 run-real 가드 재사용 여부 확인.

## 3. Phase B — 무여정 서비스 확장 원칙 및 머먹지 Candidate 기록

### 3.1 CAND-EXP-001 확인 결과

| 위치 | 파일 | 상태 |
|---|---|---|
| daily-miracles-mvp `docs/constitution/candidate/` | `CAND-EXP-001_DreamTown_Experience_Architecture.md` | Candidate. 제목은 "DreamTown Experience Architecture". **Founder 지정 파일명 (`CAND-EXP-001_Muyojeong_Unified_Experience.md`) 은 존재하지 않음** |
| daily-miracles-mvp `docs/constitution/candidate/` | `CAND-EXP-002_*` 2종 | 같은 ID 2개 (기존 상태) |
| sowon-dreamtown `docs/YAKB/02_SEEDS/Candidates/` | `CAND-EXP-001_Hotel_Package_Multi_Dreamer_Access.md` | 다른 저장소의 동일 ID, 다른 주제 |

판정: **CAND-EXP-001 은 이미 두 개의 다른 문서가 사용 중이다.** 무여정 통합 경험 Candidate 를 같은 ID 로 만들면 충돌하므로 기존 문서를 수정하거나 덮어쓰지 않는다. 신규 문서는 ID 를 부여하지 않고 보류 기록으로 남긴다 (Q69-1).

### 3.2 무여정 서비스 확장 원칙 (Founder 확정, 기록)

| 구성 | 정의 | 성격 |
|---|---|---|
| 무여정 | 통합 여행 브랜드 | 상위 브랜드 |
| 머먹지? | 먹거리 / EAT | 카테고리 (독립 서비스 아님, 신규 AI Engine 아님) |
| 어디 가지? | 볼거리 / SEE | 카테고리 |
| 뭐 하지? | 즐길거리 / DO | 카테고리 |
| 소원패스 | 공통 환대 서비스 | 공통 기능 |
| SOUL | 공통 AI 여행 동반자 | 공통 기능 |
| 여행정보·숙박·교통·일정 | 공통 지원 기능 | 공통 기능 |
| 쇼핑·특산품 | 향후 확장 기능 | 보류 |

거버넌스: "Candidate → Review → Approved → LOCKED" 를 유지한다 (Founder 지시).
- 충돌: `CONSTITUTION_GOVERNANCE.md` 의 기존 단계는 **Research → Candidate → Constitution** 이다. Review·Approved·LOCKED 는 현행 문서에 없다. 어느 체계를 쓸지 Q69-2 확인 필요. 기존 문서 체계를 임의로 바꾸지 않는다.

### 3.3 머먹지 Candidate 기록 상태

| 항목 | 상태 |
|---|---|
| Candidate ID | **미부여** (Q69-1) |
| 상태 | Founder 방향 기록 완료. 정식 Candidate 문서 미생성 |
| 위치 | 본 문서 및 `DREAMTOWN_STATUS.md` SOUL Project State |
| 템플릿 | `CONSTITUTION_GOVERNANCE.md` 의 Candidate Template 필드 (Status·Owner·Created·Related SSOT·Evidence·Validation Progress·Promotion Criteria·Last Review·Next Review) 를 ID 확정 후 채운다 |

## 4. Phase C — 머먹지 구축 준비 계획 (SOUL 품질 종료 이후, 실행 없음)

| 단계 | 내용 | 기존 자산 재사용 | 신규 필요 여부 |
|---|---|---|---|
| C1 식당·파트너 목록 정리 | 기존 CSV 식당 행 (범앗간 YS-RS-001 등 restaurant 행) 과 V31 에 언급된 식당 (동우랑 충무점, 나주곰탕, 명성족발, 좌수영바게트버거, 순이네밥상 — 제휴 상태 미확인) 을 분리 정리 | partner_master.csv, V31 기록 (§66 R7) | 없음 |
| C2 음식 종류·식사 상황 분류 | 음식 종류 (한식·카페·베이커리 등), 식사 상황 (아침·점심·저녁·간식) 분류 체계 | SOUL meal_context 필드, 기존 `meal_context` 추출 | 분류표만 추가 |
| C3 Place ID 기반 업체 관리 | Naver Place ID 를 업체 키 후보로. 현재 1개만 확보 (하루 한방카페 1480770989) | CSV partner_code (YS-RS-*), dt_partners.id | ID 수집 절차 필요 (외부 확인, 승인 후) |
| C4 업체 속성 정리 | 대표 메뉴, 위치, 가격, 영업시간, 동반자 조건 | §66 검증 방식 (V/E/C/M) | 속성표만 추가. 값은 공식 출처 확인 후 |
| C5 제휴·혜택 분리 | 승인 혜택 (허용 목록) 과 장소 정보를 별도 필드로 | §68 게이트 (허용 목록, affiliation_status) | 없음 |
| C6 SOUL Knowledge 재사용 | 장소 설명, 동반자 적합도 문구 등 | `_PLACE_KNOWLEDGE` 구조, 카페 Knowledge 분류 | 없음 |
| C7 무여정 카테고리 연결 | 머먹지? 를 무여정 내부 카테고리로 노출 | 기존 무여정 UI (MuyojeongHomePage.jsx) | UI 연결 설계 (별도 Preflight) |

금지 (Founder 지시): 별도 Architecture 생성, 신규 AI Engine, 독립 서비스화.

## 5. 이번 단계에서 하지 않은 것

- 서비스 코드 수정 (허용 목록, 게이트, H07·H15 경로 포함): 없음
- CAND-EXP-001 기존 문서 수정, 신규 Candidate 문서 생성 (ID 충돌): 없음
- 운영 DB 연결·변경: 없음
- 실제 LLM 호출: 없음
- 미확인 혜택 활성화, 모이핀 10% 노출: 없음
- 기존 완료 영역 재조사: 없음
- GitHub push, PR, merge, Render 배포, Hybrid 활성화: 없음

## 6. Founder 확인 요청

- **Q69-1** 머먹지 Candidate 의 ID (CAND-EXP-001 은 기존 문서 2종이 사용 중. 새 번호 또는 무여정 전용 접두어 지정)
- **Q69-2** 거버넌스 단계 체계 (Review·Approved·LOCKED 신설 여부, 또는 기존 Research → Candidate → Constitution 사용)
- **Q69-3** 품질 종료 기준 (§2.2) 과 "품질 종료 전 필수" 목록 (A1-b, A2, A3 검증 부분, A4, A6) 승인
- **Q69-4** H07·H15 고객 노출 범위 (§68 Q68-4 와 연계, 장소 E 항목 허용 여부)

## 7. Evidence 연결

- 선행: §66, §67, §68 (원문 보존), `docs/constitution/CONSTITUTION_GOVERNANCE.md` (읽기만).
- 기존 완료 Evidence (재조사 없음): §36 (연령 보정), §58·§61 (Clarify), §60 (실제 8/12/0), §62–§63 (Knowledge 감사·검증), §64 (구현), §65 (원격 보존).
- 외부 백업: `C:\DEV\_phx_soul_evidence_backup\20261120-quality-close-munmeokji-plan\` (SHA256 결과는 `DREAMTOWN_STATUS.md` 참조).
- 커밋 여부: 워킹트리 기록 (§64~§68 과 동일 정책). push 없음.
