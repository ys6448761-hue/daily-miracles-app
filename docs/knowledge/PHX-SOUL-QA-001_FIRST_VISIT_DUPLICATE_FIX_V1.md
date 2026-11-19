# PHX-SOUL-QA-001 — H19 첫 방문 응답의 중복 시간 질문 제거 (V1, 2026-11-20)

> §61. §60 실제 Benchmark 결과 (성공 8 / 부분 12 / 실패 0) 인정. 기존 실제 평가 점수 8/12/0 은 변경하지 않는다.
> 실제 LLM 호출 없음 (§60 원본 응답 재생). 신규 UI·질문 체계·키워드 패턴 추가 없음.

## Guardian Preflight Report (코드 수정 전 기록)

```
### Guardian Preflight Report

Requested Change:
  H19 첫 방문 Discovery 응답에서 숙박 여부 질문과 시간 Next Option 이 동시에 나오는 중복 제거.
  숙박 여부 질문이 실제로 응답에 포함된 경우에만 시간 Next Option 을 제거한다.

Existing Assets Found:
  services/soyeowoolService.js
    - 시간 Next Option 생성: _buildUserConditions 계열 nextOptions.push('시간이 얼마나 남으셨어요?') (PARTIAL, 약 L2252)
    - 기존 필터 패턴: CAR_INFO 에서 시간 Next Option 제거 (약 L3778) — 같은 방식으로 재사용
    - 숙박 질문 생성: _generateSoulMessage 첫 방문 분기 (§58 4-D, 문구 "당일 여행이신가요, 아니면 숙박하시나요?")
  §60 실제 응답 원본: C:\DEV\_phx_soul_test_harness\results\real-run-2026-11-20-post-clarify.json (재생 입력)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — HEAD 9ad729f (작업 트리 기존 미추적·타 세션 파일 보호)

Relevant Files:
  services/soyeowoolService.js (최소 수정: 필터 1곳), tests/unit/soulClarifyAnswerFirst.test.js (테스트 추가)

Relevant Databases:
  없음.

Change Classification:
  REPAIR (응답 중복 제거). 신규 기능·질문 체계·키워드 패턴 없음.

Connection Opportunity:
  기존 CAR_INFO 시간 Next Option 필터 패턴 재사용.

Duplication Risk:
  낮음. 조건은 응답 본문에 숙박 질문이 실제 포함된 경우로 한정.

Data Risk:
  없음 (외부 호출 없음, 개인정보 경로 변화 없음). 세션 정보 쓰기 경로 불변.

Recommended Approach:
  1) 필터 조건: soulMessage 에 "당일 여행이신가요, 아니면 숙박하시나요?" 가 포함될 때 result.next_options 에서 시간 옵션 제거
  2) 테스트: H19 중복 제거 + 숙박 질문 유지 + 추천 후보 유지 + solo null 유지 + 세션 보존 + 시간 질문이 필요한 다른 여행 문의는 유지
  3) §60 실제 응답 재생 (실제 호출 없음): 20개 중 H19 만 바뀌고 나머지 19개 응답·payload 불변 확인
  4) 전체 회귀 (flag unset / 0 / 1), Privacy·Hybrid 7 suite, Route·Gate·Manifest

Questions Requiring Decision:
  없음.

Implementation Status: READY
```

## 1. 중복 발생 지점 (확인됨, §60 재생 기준)

| 출처 | 내용 | 위치 |
|---|---|---|
| 메시지 본문 | "당일 여행이신가요, 아니면 숙박하시나요?" (첫 방문 분기, §58 4-D) | `_generateSoulMessage` |
| Next Option | "시간이 얼마나 남으셨어요?" (PARTIAL 기본 옵션) | `_buildUserConditions` 계열 (nextOptions 생성) |

§60 실제 payload: H19 `next_options = ["시간이 얼마나 남으셨어요?"]`, 메시지는 숙박 질문. 두 개의 질문이 한 응답에 동시에 나타났다.

## 2. 수정 방침

- 시간 Next Option 은 숙박 여부 질문이 응답 본문에 실제 포함된 경우에만 제거한다.
- 다른 여행 문의 (예: H10·H20 의 journey, 일반 추천) 는 시간 Next Option 을 그대로 유지한다.
- 기존 CAR_INFO 필터와 같은 형식의 한 줄 조건을 추가한다. 새 질문 체계·키워드 패턴 없음.

## 2. §61 수정 결과 (2026-11-20)

### 2.1 변경 (로컬 커밋 `dc175c2`)

| 파일 | 변경 |
|---|---|
| `services/soyeowoolService.js` | 4행 추가. 응답 본문에 "당일 여행이신가요, 아니면 숙박하시나요?" 가 있으면 `next_options` 의 "시간이 얼마나 남으셨어요?" 제거 |
| `tests/unit/soulClarifyAnswerFirst.test.js` | §61 테스트 2개 추가 (H19 중복 제거·숙박 질문·추천 후보 유지·solo null, H10 시간 옵션 유지) |

- 신규 UI·질문 체계·키워드 패턴 없음. Privacy Guard, Route Gate, Hybrid 플래그 파일 변경 없음.
- 기준 SHA: `9ad729f` (수정 전). 수정 후 로컬 HEAD: `dc175c2`. push 없음.

### 2.2 원인과 수정 (§60 실제 응답 기준 확인)

- 중복 발생: 본문의 숙박 질문 (§58 4-D 첫 방문 분기) 과 `next_options` 의 시간 옵션 (PARTIAL 기본 옵션) 이 같은 응답에 함께 나옴.
- 수정 조건: 본문에 숙박 질문이 실제로 포함된 경우에만 시간 옵션 제거. 여정 질문 (H10) 과 기타 여행 문의는 시간 옵션 유지.

### 2.3 재생 검증 (§60 실제 모델 응답, 실제 호출 없음)

- 기준: `9ad729f` 엔진 재생 vs 수정 후 엔진 재생. 입력은 §60 원본 (`real-run-2026-11-20-post-clarify.json`).
- 결과 (시나리오 A, 고정 stub 4행): 20개 중 H19 의 `next_options` 만 변경 (`["시간이 얼마나 남으셨어요?"]` → `[]`).
- H19 의 메시지, 숙박 질문, 추천 후보 4곳 (오동도/케이블카/하멜등대/향일암), 상태 DISCOVERING/PARTIAL, payload 키 집합, 호출 수 (3) 모두 불변.
- 시나리오 B (후보 0건): 20개 전부 불변.
- 나머지 19개 질문: 메시지, 상태, 프레젠테이션, 경로, `next_options`, payload 키, 장소 수, 호출 수 모두 불변. 재생 소진 0, 콘솔 오류 0.

### 2.4 회귀 테스트 (전체 suite)

| 구분 | 결과 |
|---|---|
| Hybrid flag unset | 862 pass / 1 fail (R20). 실패 suite 집합 수정 전과 동일 |
| Hybrid flag 0 | 862 pass / 1 fail (R20) |
| Hybrid flag 1 | 860 pass / 3 fail (LB-I7, R4, R20). 실패 suite 집합 수정 전과 동일 |
| Clarify 신규 테스트 | 24/24 (flag unset, flag 1 모두 통과) |
| Privacy·Hybrid 7 suite | 75/75 |
| Route·Gate·Manifest | 107/107 |
| 기존 실패 원인 | §56 과 동일 (supertest 미설치, 테스트 0개 suite, R20, flag 1 의 LB-I7·R4) |

### 2.5 보존

- §60 실제 Benchmark 원본 (`real-run-2026-11-20-post-clarify.json`, 17 호출) 과 §48 원본: 외부 하네스 폴더와 외부 백업에 보존. 원본 변경 없음.
- 실제 평가 점수 8/12/0 (§60) 은 변경하지 않았다. 이번 수정은 재생 기반 검증이며 실제 LLM 점수를 갱신하지 않는다.
- 로컬 커밋 `dc175c2` 는 push 하지 않았다 (Founder 지시에 push 승인 없음).

### 2.6 Current Next Action (exactly 1)

**다음 작업으로 실제 관광 Knowledge 의 활용 가능 범위를 확인한다** (검증된 장소 정보, 도보·연결 데이터의 존재 여부, 아동·첫 방문 정보의 공백 목록화). 실제 LLM 호출 없음. 추가 Clarify 설계 개선은 새 결함이 발견되기 전까지 종료한다.
