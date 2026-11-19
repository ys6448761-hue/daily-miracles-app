# PHX-SOUL-QA-001 — Clarify 정책 조사 및 최소 수정 계획 (V1, 2026-11-20)

> 범위: 조사와 계획. 서비스 코드 수정, 실제 LLM 호출, 운영 DB 연결, push·PR·merge, Render 배포, Hybrid 활성화, Manifest 개선, 다른 Workstream 변경 없음.
> 선행 확정 (재조사하지 않음): Hybrid 로컬·원격 HEAD `776b355` (§56), 회귀 838 pass / 기존 실패 1, Privacy·Hybrid 75/75, 실제 LLM 성공 8·부분 8·실패 4 (§48), Production HOLD, 개인정보 법률 검토 BLOCKED.
> 핵심 정책: **Answer First, Clarify When Necessary.**

## Guardian Preflight Report (분석 전 기록)

```
### Guardian Preflight Report

Requested Change:
  H06(도보 여행), H14(아이 동반 도보 여행), H19(첫 여수 여행)의 generic clarification 경로 원인 분석과
  "가능한 답변 먼저, 필수 정보 부족 시에만 추가 질문" 정책의 최소 수정 계획. 코드 수정 없음.

Existing Assets Found:
  §48 실제 LLM 응답 및 추출 결과 (results/real-run-2026-11-19.json, 저장소 밖)
  §49·§50 RC3 조사·복구 (대표 장소 답변 경로), §51~§52 Route Gate (고정)
  services/soyeowoolService.js: _isDiscoveryIntent, _detectPlaceLookupIntent, _detectPlacesInMessage,
    _buildPlaceSpecificQueryPayload (PSQ), 동반 칩 응답, _routeToTravelIntelligence (추천), _PLACE_KNOWLEDGE (검증 텍스트),
    _generateClarificationMessage (generic clarification)
  services/soulDirectResponse.js, services/soulAdaptive.js (일반 답변 경로)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — HEAD 776b355 (읽기 전용)
  분석용 복사본: C:/DEV/_phx_soul_test_harness/clarify-analysis/ (원본 미수정, 실제 탐지 함수 로드)

Relevant Files:
  services/soyeowoolService.js (읽기 전용), tests/soul/*, tests/unit/soulRc3SelectiveRecovery.test.js

Relevant Databases:
  없음 (travelGuide 는 기록된 응답·stub 기준 분석).

Change Classification:
  REPAIR (응답 정책) 분석. 신규 Architecture 아님. 신규 키워드 분기 최소화 원칙.

Connection Opportunity:
  기존 PSQ·동반 칩·추천 경로 재사용. 추출 결과의 구조화 신호 (mobility_type, people_type) 활용.

Duplication Risk:
  중간 — 기존 PSQ 의 walking 정규식 (걸어야|걷기|걷는|보행) 과 신규 답변 빌더가 중복될 수 있음. 구조화 신호로 대체 권장.

Data Risk:
  낮음 — 분석만. 확인되지 않은 관광 정보 생성 금지 원칙 유지.
  추출 결과의 people_type 오류 (H19 "solo") 확인 → 구조화 신호 사용 시 가드 필요.

Recommended Approach:
  1) 실제 탐지 함수로 H01~H20 분류표 작성 (읽기 전용)
  2) generic clarification 진입 조건 특정
  3) 구조화 신호 기반 "Answer First" 최소 규칙 2개 + 가드 1개 제안
  4) 질문별 기대 응답을 검증된 knowledge 문구만으로 작성
  5) 회귀 영향 분석: 변경 대상 H06·H14·H19 외 질문이 바뀌는지 replay 기준 판정 방법 명시

Questions Requiring Decision:
  Q-K1. "어디부터" 패턴을 _isDiscoveryIntent 에 추가하는 것을 승인할지 (단일 키워드 추가, 신규 분기 아님).
  Q-K2. 대표 장소 목록 (H19 첫 방문 추천 4곳) 을 누가 정할지 (편집 결정, Knowledge 부족 영역).
  Q-K3. 걷기 부담 정보가 없는 장소 (하멜등대 등) 의 답변 방식: "정보 없음" 명시로 충분한지.

Implementation Status: READY (분석 및 계획. 코드 수정은 Founder 승인 후 별도 Preflight)
```

## 1. 현재 응답 경로 (H06·H14·H19)

응답 경로 판정은 실제 탐지 함수를 기록된 실제 입력에 적용했다 (`C:/DEV/_phx_soul_test_harness/clarify-analysis/classification.json`).

| 질문 | 발화 | 장소 탐지 | 장소 조회 의도 | 발견 의도 | 여정 의도 | 추천 경로 진입 | 실제 응답 (§48) |
|---|---|---|---|---|---|---|---|
| H06 | 오동도에서 걸어서 둘러볼 만한 곳은? | 오동도 | 아니오 | 아니오 | 아니오 | **아니오** | CLARIFICATION |
| H14 | 어린 자녀와 오동도를 걷고 싶어. | 오동도 | 아니오 | 아니오 | 아니오 | **아니오** | CLARIFICATION |
| H19 | 처음 여수에 왔는데 어디부터 가면 좋을까? | 없음 | 아니오 | 아니오 | 아니오 | **아니오** | CLARIFICATION |

- 분기 위치: `handleTravelRequest` 의 `needsTravelIntelligence = _isDiscoveryIntent(message) || _isJourneyPlanningIntent(message)` (약 L3072). 값이 거짓이면 장소 게이트 (PSQ·동반 칩·Living Detail·복수 장소) 를 거친 뒤, 어느 것도 해당하지 않으면 **L3295 `_generateClarificationMessage`** 로 떨어진다.
- 세 질문 모두 추천 경로 (`_routeToTravelIntelligence`) 에 도달하지 않는다.

## 2. Clarify-only 응답의 직접 원인

| 질문 | 직접 원인 | 구분 |
|---|---|---|
| H06 | (a) `_isDiscoveryIntent` 목록 ("갈 만한·가볼 만한·좋은 곳·볼 곳") 에 "둘러볼 만한 곳" 없음 (b) `_detectPlaceLookupIntent` 의 설명 창 15자에서 "은?" 이 잘림 (c) 페이지 장소 문맥 (`explicit_context.place_code`) 없음 → PSQ 미적용 | **고객 의도 파악 실패** (걷기 의도는 추출됨: `mobility_type=walk`, explicit) |
| H14 | (a) 발견·조회 패턴 없음 ("걷고 싶어") (b) 장소 조회 동사 없음 (c) 페이지 장소 문맥 없음 | **고객 의도 파악 실패** (동반 `family_with_kids`·걷기 `walk` 모두 explicit 로 추출됨) |
| H19 | (a) "어디부터 가면 좋을까" 가 발견 패턴에 없음 (b) 장소 없음 | **고객 의도 파악 실패** (첫 방문 추천 의도). 추출 오류 동반: `people_type=solo` 가 explicit 으로 기록되었으나 원문에 동반 표현 없음 |

- **Knowledge 부족이 원인이 아님을 확인**: 오동도·향일암에는 검증된 걷기 텍스트 (`walking_ok`, `stairs_ko`), 체험 설명 (`experience_ko`), 동반 적합 설명 (`fit_ko`) 이 있다 (L347~L370). 장소 정보는 기존 경로에서 이미 답할 수 있다.

## 3. 재사용 가능한 기존 기능

| 기능 | 위치 | 재사용 방식 |
|---|---|---|
| 장소 탐지 (결정적) | `_detectPlacesInMessage` (L517) | 단일 장소 판정 근거. LLM 이 아닌 정규 탐지 |
| 장소 조회 탐지 | `_detectPlaceLookupIntent` (L448) | 조회 의도가 있으면 기존 PLACE_LOOKUP 유지 (변경 없음) |
| 검증 텍스트 | `_PLACE_KNOWLEDGE` (L331~L430) | 답변 문장의 유일한 출처. 새 문구 생성 금지 |
| 동반 칩 응답 | L3211~ (`_isCompanionChipQuery`) | 페이지 장소 문맥이 있을 때 experience + fit 조합. 텍스트 장소 문맥용으로 패턴 참고 |
| PSQ 빌더 | `_buildPlaceSpecificQueryPayload` (L1468) | 걷기 정규식이 "걸어서·걷고"를 놓치므로 직접 재사용은 부적합 (아래 4-A) |
| 추천 경로 | `_routeToTravelIntelligence` → `travelGuideService.recommend` | H19 같은 "어디부터" 요청의 후보 제시 (PARTIAL + 시간 질문 = 기존 answer-first 형태) |
| 복수 장소 정보 | `_buildMultiPlaceInfoPayload` | 참고용. H09 에서 이미 사용 |
| 추출 신호 | 추출 결과 `mobility_type`, `people_type`, `_source` (explicit/inferred) | 구조화 신호로 사용 (키워드 신규 추가 없이) |
| 기존 Clarify 보호 | 차량·주차 짧은 질문 게이트, 중앙시장 정책 B, Living Detail 가드 | 변경하지 않음 |
| 일반 답변 | `soulDirectResponse` (인사·일반 대화), `soulAdaptive` (일반 조언) | H01·H02·H12·H13 에서 사용 중. 장소 정보 생성에는 사용하지 않음 |

## 4. 최소 수정 계획 (코드 수정은 승인 후)

### 4-A. 규칙 1 — 구조화 신호 기반 장소 우선 답변 (H06·H14 대상)

- 위치: `handleTravelRequest` 의 `!needsTravelIntelligence` 분기 안, PSQ·동반 칩 게이트 이후, `_generateClarificationMessage` 직전.
- 조건 (모두 충족):
  1. `explicit_context.place_code` 없음 (페이지 문맥 아님, 기존 페이지 경로 보존)
  2. `_detectPlacesInMessage(message)` 가 정확히 1개 장소
  3. `_detectPlaceLookupIntent` 가 조회 아님 (기존 조회 경로 보존)
  4. `!DISCOVERY_OVERRIDES.test(message)` (추천·일정·비용 요청 제외)
  5. 구조화 신호 중 하나 이상: 추출 `mobility_type === 'walk'` 이고 `_source.mobility_type === 'explicit'`, 또는 추출 `people_type` 이 동반 유형이고 `_extractPeopleLightweight` 와 일치
- 답변 구성 (새 빌더 `_buildPlaceAnswerFirstPayload`, 정규식 추가 없음):
  - 항상: `experience_ko` (장소 설명), `hours_ko` (운영시간, 비공식이면 "운영 상황은 방문 전에 확인" 문구)
  - 걷기 신호 시: `walking_ok` (있을 때만), `stairs_ko` (있을 때만)
  - 동반 신호 시: `fit_ko` (있을 때만)
  - 항상: "장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요." (검증 전 연결성 명시)
- 금지: 체류시간 표현 (M3 의미 구분 유지), 이동시간 숫자, 새 문구 생성.

### 4-B. 규칙 2 — 발견 패턴 한 개 추가 (H19 대상) [Q-K1 승인 필요]

- `_isDiscoveryIntent` 에 `어디부터|어디서부터` 한 패턴만 추가. 신규 분기 아님 (기존 발견 목록의 같은 형식).
- 결과: H19 가 기존 추천 경로 (`needsTravelIntelligence = true`) 로 진입 → 검증된 장소 후보 + 기존 PARTIAL 시간 질문 (answer first + 최소 질문).
- 장소 사이 도보 연결 미검증 문구는 기존 M4 문구를 발견 의도로 확장 (아래 4-D).

### 4-C. 가드 — 추출 people_type 검증 (H19 오류 대응)

- 추출 `people_type` 이 `solo` 이고 `_source.people_type === 'explicit'` 이어도, 원문에 혼자·단독 표현 (예: 혼자, 혼자서) 이 없으면 unknown 으로 낮춘다.
- 목적: 추천 경로에 잘못된 동반 조건이 들어가지 않도록 함. 기존 "혼자" 표현은 영향 없음.
- 위치: 추출 결과를 `soulContext` 로 만든 직후 (기존 `_applyExplicitContextChip` 전).

### 4-D. 문구 확장 — 발견 의도의 도보 연결 명시 (규칙 2 와 함께)

- 기존 M4 문구 (`_isJourneyPlanningIntent` 조건) 를 `_isJourneyPlanningIntent || _isDiscoveryIntent` 로 확장. 장소 후보만 있고 연결이 없을 때 "확인된 장소 후보" 와 연결 미검증 문구를 쓴다.

### 4-E. 명시적으로 하지 않는 것

- Clarify 함수 제거·우회 없음. `_generateClarificationMessage` 는 그대로 남아 필수 정보가 없는 경우의 응답으로 쓰인다.
- 새 키워드 분기 추가 없음 (4-B 의 한 패턴 제외). 걷기 판정은 추출 신호로 처리한다.
- 추천 알고리즘·경로 엔진 변경 없음. 새 Architecture 없음.

## 5. 질문별 개선 전후 기대 응답

**H06 — 오동도에서 걸어서 둘러볼 만한 곳은?**

- 개선 전 (§48): "여수 여행을 더 잘 도와드릴 수 있도록, 어떤 여행을 계획하고 계신지 말씀해 주세요."
- 개선 목표 (규칙 1):
  > 오동도는 바다 풍경을 보며 산책할 수 있는 곳이에요. 방파제 길과 섬 안쪽을 자신의 속도에 맞춰 즐길 수 있어요.
  > 걷는 부담은 어디까지 이동하느냐에 따라 달라져요. 걷기가 부담스럽다면 이동 범위를 짧게 잡고 중간에 쉬어가는 편을 추천해요.
  > 운영시간은 연중무휴 (동백열차 09:00~17:00)예요. 운영 상황은 방문 전에 한 번 더 확인해 주세요.
  > 장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요.
- 추가 질문: 없음 (필수 정보가 아님).

**H14 — 어린 자녀와 오동도를 걷고 싶어.**

- 개선 전 (§48): "아이와 함께하는 여행이시군요. 어떤 경험을 찾고 계신지 조금 더 말씀해 주실 수 있나요?"
- 개선 목표 (규칙 1, 동반 + 걷기 신호):
  > 아이와 함께 오동도를 걷는 여행이시군요.
  > 오동도는 방파제 길과 섬 안쪽을 산책하는 곳이에요. 아이와 함께라면 걷는 거리와 쉬는 시간을 고려해 동선을 정해보세요.
  > 걷는 부담은 이동 범위에 따라 달라져요. 짧게 잡고 중간에 쉬어가는 편을 추천해요.
  > 운영시간은 연중무휴 (동백열차 09:00~17:00)예요. 장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요.
- 추가 질문: 선택 사항. "아이 나이를 알려주시면 쉬는 지점 위주로 더 맞춰 볼게요." (필수 아님, Knowledge 에 쉬는 지점 정보가 없어 현재는 제시하지 않는 편이 정직함 — Q-K3 관련)

**H19 — 처음 여수에 왔는데 어디부터 가면 좋을까?**

- 개선 전 (§48): "여수 여행을 더 잘 도와드릴 수 있도록, 어떤 여행을 계획하고 계신지 말씀해 주세요."
- 개선 목표 (규칙 2 + 4-D; 후보 목록은 Q-K2 승인 후 확정):
  > 여수가 처음이시라면 대표 장소부터 보시는 걸 추천해요. 확인된 정보 기준이에요.
  > • 오동도: 바다 풍경과 산책 (연중무휴, 동백열차 09:00~17:00)
  > • 향일암: 바다와 바위 절벽 풍경 (경사·계단 구간이 있어요)
  > • 여수 해상케이블카: 바다와 섬을 높은 곳에서 바라보는 경험
  > • 하멜등대: 여수 바다를 바라보며 마음을 가다듬는 장소
  > 장소 사이의 이동시간은 아직 확인되지 않았어요. 며칠 머무시는지 알려주시면 순서를 함께 정해 볼게요.
- 추가 질문: 1개 (며칠 머무는지). 순서를 정하는 데 필요하므로 허용. 필수 정보 부족에 해당.
- 가드 (4-C) 로 "solo" 를 적용하지 않음. 동반 정보 없음으로 답한다.

## 6. 회귀 영향 분석

### 6-1. 실제 탐지 함수 분류 (H01~H20, 기록된 실제 입력)

| 질문 | 현재 추천 경로 | 규칙 1 (장소 우선) | 규칙 2 (어디부터) | 변화 |
|---|---|---|---|---|
| H01~H05, H08, H11~H13, H16~H18 | 변화 없음 (기존 경로) | 불일치 | 불일치 | 없음 |
| H06 | 아니오 → Clarify | **예** | 불일치 | 변경 (대상) |
| H07 | 예 (발견) | 불일치 (발견 우선) | 불일치 | 없음 |
| H09 | 아니오 → 복수 장소 정보 | 불일치 (장소 2개) | 불일치 | 없음 |
| H10 | 예 (여정) | 불일치 (여정 우선) | 불일치 | 없음 |
| H14 | 아니오 → Clarify | **예** | 불일치 | 변경 (대상) |
| H15 | 아니오 → 준비 중 | 불일치 (걷기·동반 신호 없음) | 불일치 | 없음 (탐지 확인) |
| H19 | 아니오 → Clarify | 불일치 (장소 없음) | **예** | 변경 (대상) |
| H20 | 예 (여정) | 불일치 | 불일치 | 없음 |

- 규칙 1 은 H06·H14 에만 적용된다. 규칙 2 는 H19 에만 적용된다. 나머지 17개 질문은 탐지 결과가 바뀌지 않는다.

### 6-2. 예상 위험과 방지

| 위험 | 영향 | 방지 |
|---|---|---|
| `어디부터` 패턴이 다른 문장에서 발견 경로를 바꿈 | 여정·장소 질문 변화 | 기존 test·replay 에서 `어디부터` 포함 문장 전수 확인. 변경 범위 보고 |
| 규칙 1 이 페이지 장소 문맥을 가로챔 | Living Detail 응답 변화 | `explicit_context.place_code` 있으면 규칙 미적용 (조건 1) |
| 규칙 1 의 walk 신호가 "걷기 싫다" 같은 부정 표현과 충돌 | 잘못된 걷기 안내 | 추출 `mobility_type` 이 walk 인 경우만 사용. 부정 표현 테스트 추가 |
| 추출 오류 (H19 solo) 가 추천에 반영 | 잘못된 동반 조건 | 4-C 가드 + 테스트 |
| 검증 텍스트 없는 장소 (하멜등대 걷기 정보) | 근거 없는 답변 | 있는 필드만 사용, 없으면 "정보 없음" 명시 |
| 운영시간·체류시간 혼동 | M3 회귀 | 체류시간 문구 금지, 기존 M3 테스트 유지 |
| 이동시간 생성 | 검증 원칙 위반 | 이동시간 숫자 금지 테스트 (기존 M4 테스트 확장) |
| Route Gate·Privacy Guard | 변화 없음 | 규칙이 골격·외부 전송을 추가하지 않음. 기존 75/75 와 게이트 테스트 재실행 |
| Clarify 보호 기능 | 조건 밖 질문 영향 | 기존 게이트 순서 유지, 신규 규칙은 `!needsTravelIntelligence` 안쪽에만 |

### 6-3. 검증 계획 (코드 승인 후)

1. 단위 테스트: H06·H14·H19 시나리오 (규칙 1 조건 각각, 페이지 문맥 제외, 부정 walk 제외, 4-C 가드, 이동시간 미생성).
2. Replay (기록된 실제 응답 재생, 저장소 밖): H01~H20 전체 비교. 기대 변화는 H06·H14·H19 뿐. 나머지 17개는 응답·상태·키 집합 동일.
   - 주의: H19 의 추천 경로는 추가 LLM 호출이 생길 수 있다. 기록에 없는 호출은 재생 소진으로 드러나므로, 소진 시 호출 수 증가를 보고한다. 실제 LLM 재호출은 하지 않는다.
3. 기존 회귀: 전체 Jest (기준 838 pass / 기존 실패 1), Privacy·Hybrid 75/75, Route·Gate·Manifest 107/107.

## 7. Knowledge 부족으로 별도 해결할 범위

| 항목 | 현황 | 필요한 것 | 처리 |
|---|---|---|---|
| 장소 간 도보 연결·거리 | 없음 | 검증된 거리·경로 데이터 | 계속 "확인되지 않음" 명시 (코스 생성 금지) |
| 첫 방문 대표 장소 목록 (H19) | 편집 결정 필요 | 승인된 대표 목록 (Q-K2) | 승인 전까지 DB 후보 + 검증 텍스트 있는 장소만 |
| 하멜등대 걷기·접근 정보 | experience 만 있고 walking 없음 | 검증된 접근 정보 | "걷기 정보는 확인되지 않았어요" 명시 |
| 아이 동반 쉬는 지점·안전 정보 | 없음 | 검증된 시설 정보 | 현재 제시하지 않음 (Q-K3) |
| 장소별 운영시간 신뢰도 | 일부 NON_OFFICIAL | 공식 확인 | 기존 "운영 상황 재확인" 문구 유지 |

## 8. 코드 수정 승인 요청 범위

승인 요청 (Q-K1~Q-K3 포함):

1. 규칙 1 (구조화 신호 기반 장소 우선 답변, 4-A) 구현. 신규 빌더 1개, 게이트 조건 1곳.
2. 규칙 2 (`어디부터|어디서부터` 발견 패턴 1개, 4-B). **Q-K1 승인 필요.**
3. 가드 (추출 people_type 검증, 4-C).
4. M4 문구 조건 확장 (4-D).
5. 테스트: 신규 단위 테스트 (H06·H14·H19 + 가드 + 이동시간 금지), 기존 전체 회귀, replay 기준 비교.
- 범위 밖: 경로 엔진, Privacy Guard, Route Gate, Hybrid 플래그, 운영 설정, Manifest, 다른 Workstream.
- 변경 대상 예상 파일: `services/soyeowoolService.js` (약 60~100행), 테스트 1개 신규.

## 9. 원격·Evidence 상태

- 선행 Evidence 원격 보존: §47~§56 중 `docs/knowledge` 의 §47~§55 는 원격 `776b355` 에 있다. §56 (`REMOTE_PRESERVATION_V1.md`) 은 워킹트리 전용 (외부 백업 보존).
- 본 §57 문서: 워킹트리 전용. 외부 SHA256 백업으로 보존. 커밋·push 하지 않음 (Founder 지시: 추가 push 반복 금지, 이번 단계는 분석).
- 정본 SOUL Evidence (`daily-miracles-mvp/docs/knowledge/PHX-SOUL-QA-001_RESPONSE_ROUTING_INVESTIGATION.md`): 읽기만. 미수정.

## 10. Current Next Action (exactly 1)

**Founder가 Q-K1 (`어디부터|어디서부터` 발견 패턴 추가), Q-K2 (첫 방문 대표 장소 목록 결정 주체), Q-K3 (정보 없는 장소의 답변 방식)에 답하고 코드 수정을 승인하면, 승인 범위 (4-A·4-C·4-D, 4-B 조건부) 를 별도 Guardian Preflight로 기록한 뒤 구현한다.**
