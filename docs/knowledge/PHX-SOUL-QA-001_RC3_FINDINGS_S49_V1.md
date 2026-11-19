# PHX-SOUL-QA-001 — Evidence §49: RC3 Route Skeleton 복구 가능성 조사 결과 (2026-11-19, 조사만)

> 코드 수정 없음. 실제 LLM 호출 없음. 운영 DB 연결 없음. push·PR·merge·배포·Hybrid 활성화 없음.
> 계획 문서: `PHX-SOUL-QA-001_RC3_RECOVERY_PLAN_V1.md` (Guardian Preflight 포함).
> 정본 연결 (읽기만, 정본 파일 미수정): `daily-miracles-mvp/docs/knowledge/PHX-SOUL-QA-001_RESPONSE_ROUTING_INVESTIGATION.md` §15 (Phase D 조건부 승인), §19.1 (routeSkeletonService 선별 복구 계획), §36.3 (Production 3건).

## 49.1 RC3 구현 위치와 SHA

| 항목 | 값 |
|---|---|
| 파일 | `services/routeSkeletonService.js` (164줄, 순수 함수, require 없음, export `buildSkeleton`) |
| 존재 위치 | `origin/staging/storybook-c7a`에만 존재. Hybrid HEAD `5c36837`과 main 계열에는 없음 |
| 최초 커밋 | `e2aab8f` feat(route): deterministic MY ROUTE skeleton (2026-09-22) |
| 후속 커밋 | `85a1792`, `aab9528`, `0c0da9a`, `72d333c`, `3711e15`, `7cce682` |
| 조상 관계 | `e2aab8f`은 Hybrid HEAD의 조상이 아님. merge-base `cc577d2`. Hybrid 고유 260 커밋, staging 고유 472 커밋 |
| 테스트 | `tests/unit/routeSkeletonTests.test.js` 24/24 (정본 §19.1 보고값. 이번 세션에서 재실행하지 않음) |
| 이번 세션 재확인 | staging 원본을 저장소 밖 임시 폴더에 꺼내 입력 1건 실행. 1n2d. 1일차 여수 도착, 오동도, 하멜등대, 라마다(LOCKED). 2일차 라마다(LOCKED), 향일암, 여행 마무리. 결정론 동작 확인 |

## 49.2 Hybrid 호출부 (`services/soyeowoolService.js`)

| 위치 | 함수 | 호출 조건 | 실패 처리 |
|---|---|---|---|
| L2810 | 날짜 확정 흐름 | 날짜 확정 | try/catch, `DATE_PROVISION_SKELETON_ERROR` |
| L2895 | 날짜 확정 흐름 2 | 날짜 확정 | 동일 |
| L3549 | `handleTravelRequest` MY ROUTE 블록 | `_isJourneyPlanningIntent(message) && quoteCtx` | try/catch, `SOUL_ROUTE_SKELETON_ERROR` (비치명) |

- 호출 시그니처는 staging 모듈과 호환된다. 호출부 수정은 필요 없다.
- L3549 블록은 성공 시 `journey_ctx`에 `route_id`, `nights`, `hotel_code`, `travel_date` 등을 기록한다. 복구 시 세션 저장 동작도 바뀐다.

## 49.3 질문별 경로 추적

`_isJourneyPlanningIntent` 정규식을 실제 H01~H20 문장에 적용한 결과다. 이 게이트를 통과한 질문만 skeleton 블록에 도달한다.

| ID | 질문 | 게이트 | 실제 경로 (실행 로그 대조) | 모듈 복구 시 변화 |
|---|---|---|---|---|
| H06 | 오동도에서 걸어서 둘러볼 만한 곳은? | 불일치 | 일반 CLARIFICATION (`_generateClarificationMessage` L1954) | 없음 |
| H10 | 성인 가족 3명 도보 코스 | 일치 (`코스 … 알려줘`) | DISCOVERING, 카드 4 (harness stub), `SOUL_ROUTE_SKELETON_ERROR` 발생 | route.days 생성됨. 아래 위험 참조 |
| H14 | 어린 자녀와 오동도를 걷고 싶어 | 불일치 | 일반 CLARIFICATION (companion 분기 L1945) | 없음 |
| H19 | 처음 여수에 왔는데 어디부터 가면 좋을까 | 불일치 | 일반 CLARIFICATION (L1954) | 없음 |
| H09 | 오동도와 케이블카 반나절 코스 | 불일치 (`만들어 줘` 띄어쓰기) | MULTI_PLACE_INFO (`_buildMultiPlaceInfoPayload` L633). skeleton 블록 미도달 | 없음. staging 모듈도 일 단위라 반나절 구성 불가 |
| H20 | 부모님과 여수 1박 2일 일정 | 일치 (`\d박\s*\d일`) | DISCOVERING, 카드 4, `SOUL_ROUTE_SKELETON_ERROR` | route.days 2일 생성됨 (1n2d) |

- 실행 로그의 `SOUL_ROUTE_SKELETON_ERROR` 2회는 H10과 H20이다. 정적 분석과 일치한다.
- 정정: 정본 §19.1과 이전 계획에서는 RC3 복구가 H06, H10, H14, H19, H09를 해결하는 것처럼 읽힐 수 있었다. 실제 게이트 기준으로는 H10과 H20만 영향을 받는다.

## 49.4 복구로 해결 가능한 것과 별도 해결이 필요한 것

| 구분 | 질문 | 판단 |
|---|---|---|
| 복구로 부분 해결 | H20 | 1박2일 `route.days` 생성. 고객 문장은 여전히 "골라봤어요" 중심이다. 일정 표시는 프론트와 Product Contract 결정(Q1) 필요 |
| 복구 시 생성되지만 위험 | H10 | 도보 "코스"는 당일 요청인데 `_extractNights` 기본값이 1이라 2일짜리 1n2d 일정이 생성된다. 당일 여부 가드가 필요하다 |
| 복구와 무관. Clarify·의도 정책 | H06, H14, H19 | 게이트 자체가 없다. 키워드 규칙 추가는 Founder 금지이므로 의도 분류 정책 설계가 필요하다 |
| 복구와 무관. 반나절 구성 | H09 | skeleton은 일 단위다. 반나절 구성은 Phase 2 CONNECT(체류·이동시간) 범위다 |
| 복구와 무관. 텍스트 결함 | H04, H17 | 49.5 참조 |
| 복구와 무관. 텍스트·조건 | H10 답변 | 49.6 참조 |

## 49.5 H04 모순 발생 지점 (확인됨)

- `services/soyeowoolService.js:586` (`_buildPlaceInfoPayload`, `kind === 'STAY'` 분기):
  `if (knowledge.hours_ko) lines.push(\`운영시간은 ${knowledge.hours_ko}예요. (관람 소요시간이 아니라 운영시간이에요.)\`);`
- 바로 위 L581은 DB `avg_stay_minutes`(오동도 120, migration 207, Founder 승인 2026-10-25)로 "평균 약 120분 머무는 곳"을 말한다. L586이 조건 없이 "관람 소요시간이 아니라…" 괄호 문구를 붙여서 자기모순이 생긴다.
- 원인은 하드코딩된 면책 문구다. 데이터 값 문제가 아니다. H04와 H17이 같은 분기를 탄다.
- 최소 수정: L586 괄호 문구 제거. 운영시간 문장만 남긴다. 키워드 규칙이 아니며 1줄 변경이다.

## 49.6 H10 "추천 완료" 표현 발생 지점 (정정 포함)

- `services/soyeowoolService.js:2101` (`_generateSoulMessage`, DISCOVERING 일반 분기): `가볼 만한 곳을 골라봤어요.\n시간이 얼마나 남으셨어요?`. 장소 존재 여부와 무관하게 "골라봤어요"를 말한다. L2094·L2095 등 가족 분기도 같은 패턴이다.
- 정정: §48의 H10 판정에서 "목록 없이 되묻기"라고 적은 것은 틀렸다. `payload.places`에는 4개 카드(오동도, 케이블카, 하멜등대, 향일암)가 있었다. 다만 이 4개는 harness의 `travelGuideService.recommend` stub이 질의와 무관하게 반환한 고정 DB 행이다. 따라서 H10 카드는 프로덕션 검색 결과를 대표하지 않는다.
- 결론: "허위 완결"은 확정 결함이 아니다. 확정된 결함은 (a) 도보 요청이 반영되지 않은 것, (b) 텍스트가 시간 되묻기로 끝나는 것이다.
- 최소 수정 후보: 2101의 "골라봤어요"를 실제 장소 배열이 있을 때만 쓰도록 데이터 조건으로 가드한다.

## 49.7 Harness 충실도 한계

- `travelGuideService.recommend` stub은 질의와 무관하게 DB 4행을 반환한다. 따라서 카드와 H03, H10, H20의 목록은 프로덕션과 다를 수 있다.
- `quoteContextService` stub은 `{}`를 반환한다. 프로덕션 `extractQuoteContext`는 항상 객체를 반환한다(L2014 주석). 게이트 `&& quoteCtx`는 양쪽 모두 참이지만 필드 값은 다를 수 있다.
- 따라서 §48의 H10·H20 카드 기반 판정은 잠정이다. 복구 후 재검증 전에 stub을 실제 추천 경로 또는 고정 픽스처로 교체해야 한다.

## 49.8 보류 사유 (정본 기록)

- 정본 §15 Phase D (2026-11-19): Q1 routeSkeletonService 선별 복구 방향 조건부 승인. Phase 1에서는 복구하지 않는다. Phase 2에서 별도 계획을 보고한다.
- 정본 §19.1: staging 문서에서 Founder 구현 승인 기록을 확인하지 못했다. 제품 비전 `SOUL_PRODUCT_VISION_V0_1.md`는 "Actual Movement / Route Flow"를 `STAGING_ONLY`로 분류한다.
- main 미반영 주석: `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx:75`에 "'1박 2일' 제외: routeSkeletonService 미구현 → routeSkeleton=null". 의도적 미구현인지 명시 기록은 찾지 못했다.
- 핵심 보류 사유는 제품 노출(Product Contract)이다. 복구하면 `route` 키가 API 응답에 즉시 포함된다(`_buildClientPayload` L2240: `route: routeSkeleton || null`). UI가 없어도 응답 계약이 바뀐다.

## 49.9 최소 수정 계획 (승인 후 실행, 이번 단계 미실행)

| 순서 | 대상 | 내용 | 분류 | 위험 |
|---|---|---|---|---|
| M1 | `services/routeSkeletonService.js` | staging 원본 단일 파일 복구 (수정 없음) | CONNECT | 응답에 `route` 노출 (Q1) |
| M2 | `tests/unit/routeSkeletonTests.test.js` | staging 24개 테스트 추가 | CONNECT | 낮음 |
| M3 | `services/soyeowoolService.js:586` | STAY 분기 괄호 문구 1줄 삭제 | REPAIR | 낮음 |
| M4 | `services/soyeowoolService.js:2101` 등 | "골라봤어요"를 장소 배열 존재 조건 하에서만 사용 | REPAIR | 중간 (DISCOVERING 문구 전반) |
| M5 | H10 당일 가드 | 당일 요청에 1n2d 생성 금지 (nights 명시 여부 등 데이터 조건) | REPAIR | 중간. 키워드 금지 원칙 준수 |
| 제외 | Privacy Guard, 응답 엔진 구조, Route Engine 신규 설계 | 변경 없음 (Founder 금지) | — | — |

- 롤백: M1 파일 삭제로 호출부의 try/catch 경로로 복귀한다 (정본 §19.1 격리 검증 기록).
- 검증: 기존 Mock 37/37 유지, routeSkeletonTests 24/24, SOUL 전체 재실행(기준선 595 pass / R20 1 fail / supertest 1 fail과 비교). H01~H20 재실행은 별도 승인이 필요하다(호출 상한 재설정 포함).
- 정본 §19.1의 routeFirst.test.js T7d 실패는 기대값 정정이므로 별도 Founder 승인 대상이다.

## 49.10 남은 Blocker

1. Q1 (Founder): `route.days` API 노출 허용 여부 (Product Contract). 미결정 시 M1 실행 불가.
2. Q2 (Founder): H10 당일 도보 코스의 기대 응답 (당일 일정 / 장소 카드 + 도보 필터 / 되묻기 중 택1).
3. 의도 정책: H06, H14, H19(걷기·첫 방문 추천)는 Clarify 정책 또는 의도 분류 설계가 필요하다. 키워드 규칙은 금지.
4. H09 반나절 구성: Phase 2 CONNECT (체류·이동시간 데이터). 이번 범위 아님.
5. harness stub 교체(travelGuide 질의 반영) 없이는 카드 기반 판정을 재현할 수 없다.

## 49.11 Evidence 연결 상태

- 정본 연결: §15, §19.1, §36.3 참조 (읽기만). 정본 파일은 수정하지 않았다 (다른 브랜치 체크아웃).
- §47: `PHX-SOUL-QA-001_REAL_LLM_FINAL_RETRY_V1.md` §5.
- §48: 같은 파일 §10. 49.6의 H10 정정은 이 §49에 기록했다.
- §49: 이 문서.
- 다른 세션 변경: 정본 체크아웃에 쓰기 없음. Hybrid 워크트리의 기존 미추적 파일은 건드리지 않았다.

## 49.12 완료 보고

- RC3 구현 위치·SHA: `origin/staging/storybook-c7a`의 `services/routeSkeletonService.js`. 최초 `e2aab8f`.
- 재사용 가능 파일·테스트: 모듈 1개 + `tests/unit/routeSkeletonTests.test.js` (24, 정본 보고값). routeFirst.test.js T7d는 기대값 정정 필요.
- 보류 사유: §15 Phase D 조건부 승인 (Phase 2 이월), 제품 비전 STAGING_ONLY, Product Contract 노출 판단.
- 질문별 해결 범위: H20 부분 (route.days). H10은 생성되나 위험(1n2d). H06·H14·H19는 복구와 무관. H09는 복구와 무관.
- 최소 수정 대상: M1~M5 (49.9). 이번 단계 코드 수정 없음.
- 남은 Blocker: 49.10.
- Current Next Action (exactly 1): Founder가 Q1(route.days API 노출 허용 여부)과 Q2(H10 당일 도보 코스 기대 응답)에 답하면, M1~M5를 위한 별도 Guardian Preflight를 발행한다.
