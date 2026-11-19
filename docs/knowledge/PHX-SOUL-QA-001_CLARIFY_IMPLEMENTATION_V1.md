# PHX-SOUL-QA-001 — Clarify 정책 선별 구현 (V1, 2026-11-20)

> 선행: §57 (`PHX-SOUL-QA-001_CLARIFY_POLICY_V1.md`, 분석). 기준 HEAD `776b355` (로컬·원격 일치).
> 범위: 기존 `services/soyeowoolService.js` 최소 수정 + 신규 테스트 1개. 로컬 커밋만. push 없음.
> 금지: 신규 Architecture·POC, 무분별한 키워드 분기, 실제 유료 LLM 호출, 운영 DB 연결, Privacy Guard 변경, Route Gate 변경, Manifest 개선, push·PR·merge, Render 배포, Hybrid 운영 활성화, 다른 Workstream 변경.

## Guardian Preflight Report (코드 수정 전 기록)

```
### Guardian Preflight Report

Requested Change:
  §57 승인분 구현.
  Q-K1: 어디부터|어디서부터 발견 패턴을 여행 추천 문맥(여수·여행)과 장소 문맥 없음 조건에서만 추가.
  Q-K2: 첫 여수 여행 후보는 기존 Knowledge (travelGuide 결과, _PLACE_KNOWLEDGE) 에서만. 장소 하드코딩 추가 없음.
  Q-K3: 도보 정보가 없는 장소는 검증된 일반 정보 + 미확인 명시. 전체 되묻기로 대체하지 않음.
  4-A: 단일 장소 + 명시적 mobility(walk) 또는 명시적 동반(아이·부모님, 어휘 확인) → 검증된 장소 정보로 먼저 답변 (페이지 문맥 없음).
  4-B: 발견 패턴 최소 추가 + 부정 사례 테스트.
  4-C: 명시적 혼자 표현 없이 추출 solo 가 USER_EXPLICIT 이면 UNKNOWN 으로 강등. 세션 명시 동반 정보는 기존 병합으로 보존.
  4-D: 여정·첫 방문 추천 응답에서만 연결 미검증 안내. 일반 답변에 경고 추가 없음.

Existing Assets Found:
  services/soyeowoolService.js
    _isDiscoveryIntent (L1815, 호출처 L2125 다른 용도 → 변경하지 않음)
    needsTravelIntelligence 판정 (L3072)
    understand 직후 soulContext (L3036~3037)
    _generateClarificationMessage fall-through (L3295)
    _buildPlaceInfoPayload 반환 형식 (L596~611)
    _applyPersistedTravelerProfile (L1055): 세션 명시 동반 정보 병합 (provenance != USER_EXPLICIT 일 때만 적용)
    _PLACE_KNOWLEDGE (L331~430, 검증 텍스트), _extractPeopleLightweight (L733), _KIDS_PHRASES (L731)
  services/contextExtractionService.js: mapSource (explicit→USER_EXPLICIT), people_type 기본값 'solo'

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — HEAD 776b355, 작업 트리 기존 미추적 파일 보호

Relevant Files:
  services/soyeowoolService.js (수정), tests/unit/soulClarifyAnswerFirst.test.js (신규)

Relevant Databases:
  없음 (테스트는 DB·세션 mock).

Change Classification:
  REPAIR (응답 라우팅·정책). 신규 Architecture 아님. 키워드는 발견 패턴 1개만 추가.

Connection Opportunity:
  기존 장소 정보 payload 형식, 기존 PARTIAL 후보 응답, 기존 병합 로직 재사용.

Duplication Risk:
  낮음 — 장소 답변 빌더 1개 (기존 _buildPlaceInfoPayload 와 형식 동일, 내용은 구조화 신호 기반).

Data Risk:
  낮음 — 외부 호출 추가 없음 (Privacy 경로 변화 없음). 추출 solo 확정 차단으로 잘못된 동반 조건 전달 감소.
  세션 명시 동반 정보는 기존 병합 경로로 보존 (테스트로 확인).

Recommended Approach:
  1) 4-C 가드를 understand 직후에 1곳 추가
  2) 4-B 패턴: _isFirstVisitTripIntent (여수·여행 + 어디부터|어디서부터, 장소 문맥 없음) 를 needsTravelIntelligence 에 OR
  3) 4-A: fall-through 직전에 단일 장소 답변 빌더 1개 (structured signal only)
  4) 4-D: 기존 M4 문구 조건을 여정 또는 첫 방문 추천으로 확장, 질문은 의도별 1개
  5) 테스트: H06·H14·H19 시나리오, 가드, 부정 사례 (Living Detail·혜택·실시간·비관련 문장), 세션 보존, 이동시간 금지
  6) Mock 재현: 기록된 실제 추출 결과 사용, H01~H20 전체 비교 (기대 변화 H06·H14·H19 외 0)
  7) 회귀: 전체 Jest (flag unset/0/1), Privacy·Hybrid 7 suite, Route·Gate·Manifest, 기준선 대비

Questions Requiring Decision:
  없음 (Founder Q-K1~Q-K3 승인 완료). 구현 중 다른 파일 변경이 필요하면 범위 확대 전에 보고.

Implementation Status: READY
```

## 1. 구현 항목 (승인분)

| 항목 | 파일·위치 | 내용 |
|---|---|---|
| 4-C | `soyeowoolService.js` understand 직후 | `_guardUnconfirmedSolo` — 명시 혼자 표현 없음 + USER_EXPLICIT solo → UNKNOWN 강등 |
| 4-B | `needsTravelIntelligence` | `_isFirstVisitTripIntent` (어디부터|어디서부터 + 여수|여행) + 장소 문맥 없음 |
| 4-A | fall-through 직전 | 단일 장소 + 구조화 신호 → `_buildPlaceAnswerFirstPayload` |
| 4-D | `_generateSoulMessage` PARTIAL 기본 분기 | 여정 또는 첫 방문 추천 & 추천 경로 결과에 경로 없음 → 연결 미검증 안내 + 의도별 질문 1개 |

## 2. §58 구현 및 검증 결과 (2026-11-20)

**로컬 커밋: `8955a14`** (기준 `776b355`, 원격 push 없음). 변경 파일 2개: `services/soyeowoolService.js` (+95 / -4), `tests/unit/soulClarifyAnswerFirst.test.js` (신규, 22 테스트). Privacy Guard, Route Gate, Hybrid 플래그 파일, Knowledge 문서, 운영 설정은 변경하지 않았다.

### 2.1 구현 항목

| 항목 | 구현 위치 | 결과 |
|---|---|---|
| 4-A 장소 우선 답변 | fall-through 직전 (`_hasAnswerFirstSignal`, `_buildPlaceAnswerFirstPayload`) | 단일 장소 + 명시적 walk 또는 어휘와 일치하는 명시 동반 (아이·부모님) 일 때 검증 텍스트로 답함. 페이지 장소 문맥 있으면 미적용. 정보 없는 항목은 "확인되지 않았어요"로 명시 |
| 4-B 첫 방문 추천 패턴 | `_isFirstVisitTripIntent` → `needsTravelIntelligence` | `어디부터\|어디서부터` + `여수\|여행`, 장소 문맥 없음. 기존 분류기 `classifyFastPath` (혜택·실시간) 에 해당하면 제외 |
| 4-C 미확인 solo 가드 | understand 직후 `_guardUnconfirmedSolo` | 명시 solo 표현(혼자·1인·솔로 등)이 없는 USER_EXPLICIT solo → `people_type: null`, provenance UNKNOWN. 세션 명시 동반은 기존 병합 (`_applyPersistedTravelerProfile`) 이 그대로 보존 |
| 4-D 연결 미검증 안내 | `_generateSoulMessage` PARTIAL 기본 분기 | 여정 요청 또는 장소 문맥 없는 첫 방문 추천에서만. 질문은 여정=시간, 첫 방문=숙박 여부 1개 |
| 추가 (Q-K2 해석) | 발행 페이로드 | 첫 방문 추천 응답은 추천 결과의 `course`(일정형 구조) 를 노출하지 않음 (`course: null`). 후보 목록으로만 취급 |

### 2.2 H06·H14·H19 응답 전후 (기록된 실제 추출 결과 재생, 실제 LLM 호출 없음)

- **H06** 전: "여수 여행을 더 잘 도와드릴 수 있도록, 어떤 여행을 계획하고 계신지 말씀해 주세요." (CLARIFICATION)
  후: "오동도는 바다 풍경과 계절의 자연을 느끼며 산책할 수 있는 곳이에요. 방파제 길과 섬 안쪽의 산책 경험을 자신의 속도에 맞춰 즐겨보세요. / 오동도는 산책을 즐기는 장소예요. 어느 구간까지 이동하느냐에 따라 걷는 부담이 달라질 수 있어요. 걷기가 부담스럽다면 이동 범위를 짧게 잡고 중간에 쉬어가는 편을 추천해요. / 운영시간은 연중무휴 (동백열차 09:00~17:00)예요. 운영 상황은 방문 전에 한 번 더 확인해 주세요. / 장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요." (PLACE_KNOWLEDGE, 질문 없음)
  - 한계: 질문은 "걸어서 둘러볼 만한 곳"의 여러 장소가 아니라 명시된 오동도 한 곳에 대한 답이다. 다른 장소 후보는 도보 연결 데이터가 없어 제시하지 않는다.
- **H14** 전: "아이와 함께하는 여행이시군요. / 어떤 경험을 찾고 계신지 조금 더 말씀해 주실 수 있나요?" (CLARIFICATION)
  후: "아이와 함께하는 여행이시군요. / 오동도는 바다 풍경과 계절의 자연을 느끼며 산책할 수 있는 곳이에요. 방파제 길과 섬 안쪽의 산책 경험을 자신의 속도에 맞춰 즐겨보세요. / 오동도는 산책을 즐기는 장소예요. 어느 구간까지 이동하느냐에 따라 걷는 부담이 달라질 수 있어요. 걷기가 부담스럽다면 이동 범위를 짧게 잡고 중간에 쉬어가는 편을 추천해요. / 자연과 바다를 천천히 즐기고 싶은 분께 잘 어울려요. 부모님이나 아이와 함께라면 걷는 거리와 쉬는 시간을 고려해 동선을 정해보세요. / 운영시간은 연중무휴 (동백열차 09:00~17:00)예요. 운영 상황은 방문 전에 한 번 더 확인해 주세요. / 장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요." (질문 없음. 답변이 충분하므로 선택 질문도 넣지 않음)
- **H19** 전: "여수 여행을 더 잘 도와드릴 수 있도록, 어떤 여행을 계획하고 계신지 말씀해 주세요." (CLARIFICATION)
  후: "지금 상황에 맞는 곳을 찾아볼게요. / 확인된 장소 후보를 알려드릴게요. 장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요. / 당일 여행이신가요, 아니면 숙박하시나요?" (PARTIAL / DISCOVERING, 후보 카드 4개, 질문 1개). 후보 4개는 travelGuide 결과 (하드코딩 없음). 이 Mock 에서는 고정 stub 이 같은 4개를 반환한다.
  - 추출의 solo 는 확정되지 않음: `understood_context.people_type = null`.

### 2.3 나머지 17개 질문 회귀 (replay pre 776b355 ↔ post 8955a14)

- 변경된 행: H06, H14, H19 뿐 (시나리오 A 와 B 모두). 나머지 17개: 상태·프리젠테이션·경로·메시지·payload 키 집합 모두 동일. 재생 소진 0, 콘솔 오류 0, LLM 호출 합계 17 → 17 (불변).

### 2.4 검증 결과

| 검증 | 결과 |
|---|---|
| 신규 테스트 `soulClarifyAnswerFirst` | 22/22 (flag unset, flag 1 모두 통과) |
| 전체 회귀 flag unset | 860 pass / 1 fail (R20, 기준선과 동일). 실패 suite 집합 기준선과 동일 |
| 전체 회귀 flag 0 | unset 과 동일 (실패 suite 동일) |
| 전체 회귀 flag 1 | 858 pass / 3 fail (LB-I7, R4, R20 = 기준선 776b355 flag 1 과 동일). 신규 실패 0 |
| Privacy·Hybrid 7 suite | 75/75 |
| Route·Gate·Manifest | 107/107 |
| 기존 Clarify 보호 | "여수 여행 좀 도와줘" 등 신호 없는 요청은 기존 되묻기 유지 (테스트) |
| 기존 세션 동반 정보 보존 | 세션에 family_with_kids 가 저장된 상태에서 H19 질문 → 동반 `family_with_kids` 유지 (테스트) |
| solo 오추론 차단 | H19 기록 추출(solo, explicit) → null (테스트, replay). "1인"·"혼자" 명시는 solo 유지 (테스트) |
| 이동시간·도보 연결 생성 금지 | 응답에 "N분" 이동·도보 문구 없음 (테스트) |
| 도보 정보 없는 장소 | 하멜등대 + 걷기 신호 → "도보 적합성은 아직 확인되지 않았어요" (테스트) |
| Living Detail·혜택·실시간 | 페이지 place_code 문맥, 혜택 문의, 실시간 문의에서 추천 경로 미진입 (테스트) |

### 2.5 Founder 지시와의 차이 (보고)

1. 4-C 강등 값: 지시는 "unknown 또는 기존 미확인 표현" 이었다. 구현은 `people_type: null` 을 택했다. 기존 `'solo'` 기본값을 유지하면 `travelGuideService` 의 solo 적합도 가산점이 잘못된 추론을 계속 반영하기 때문이다 (`context.people_type === 'solo'`). null 은 같은 파일에서 "없음"으로 처리된다 (`if (!context.people_type) return 0`).
2. 추가 항목: 첫 방문 추천 응답의 `course` 비노출 (Q-K2 "확정 일정이 아닌 후보 목록" 해석). 이 항목은 4-D 목록 밖이므로 승인 범위 확인 대상으로 보고한다.
3. 테스트 환경: 플래그 unset 기준으로 Clarify 보호 케이스를 고정했다. 플래그 ON 에서는 기존 Hybrid 직접 응답이 먼저 답하는 것이 기준선 776b355 에서도 확인되었다 (기존 동작).

### 2.6 Knowledge 부족으로 남은 항목

- 하멜등대 걷기·접근 정보: 검증 텍스트 없음 → "확인되지 않았어요" 명시.
- 장소 간 도보 연결·거리·이동시간: 검증 데이터 없음 → 생성하지 않음.
- 아이 동반 쉬는 지점·안전 정보: 없음 → 질문하지 않음 (Q-K3 에 따라 정직하게 미확인 상태로 둠).
- 첫 방문 후보의 실제 DB 구성: 이번 검증은 고정 stub 기준. 프로덕션 travelGuide 결과의 장소 구성은 확인하지 않았다. Mock 결과는 실제 관광 정보 품질 검증이 아니다.
- 추출의 solo 오류 자체 (추출 단계): 가드로 차단만 했다. 추출 프롬프트 개선은 범위 밖.

### 2.7 Evidence 및 상태

- §57 (분석): `PHX-SOUL-QA-001_CLARIFY_POLICY_V1.md`. §58 (구현): 이 문서. 둘 다 워킹트리 (미커밋, docs 커밋 조건 미충족). 외부 SHA256 백업 보존.
- 로컬 커밋 `8955a14` (코드·테스트만). push 없음. 원격 `feat/phx-soul-hybrid-v1` 은 `776b355` 유지.
- 정본 SOUL Evidence (`daily-miracles-mvp` 다른 체크아웃): 읽기만. 미수정.
- 실제 LLM 점수 8/8/4: 변경하지 않음.

### 2.8 Current Next Action (exactly 1)

**Founder가 `8955a14` 의 push 여부와, 2.5의 두 차이 (4-C null 강등, course 비노출) 를 승인하는지 판단한다. 승인 전까지 push 하지 않는다.** 추가 개발은 승인 후 별도 Preflight 로 진행한다.
