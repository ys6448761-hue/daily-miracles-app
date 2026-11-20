# PHX-SOUL-QA-001 — 최종 품질 마무리 구현 및 H07·H15 검증 카페 연결 (§70, V1, 2026-11-20)

> §70. Founder §70 승인 범위 구현. 실제 LLM 호출 없음. 운영 DB 연결·변경 없음. Migration 없음.
> 신규 Schema·Architecture 없음. Clarify 추가 개발 없음. Manifest 개선 없음. push·PR·merge 없음. Render 배포 없음. Hybrid 운영 활성화 없음.
> 기준: HEAD `10f52dc`. 전체 회귀 873 pass / 기존 실패 1 (기준선). 실제 LLM 8/12/0 (변경 없음).
> 선행: §66 (카페 검증), §67 (Founder 확정), §68 (제휴 확인), §69 (품질 마무리 계획, 번호 정정 포함).

## Guardian Preflight Report (구현 전 기록)

```
### Guardian Preflight Report

Requested Change:
  H07·H15 의 "카페 추천 기능은 아직 준비 중" 응답을, 검증된 바다 전망 카페 Knowledge (포트앤포트 1곳) 연결 응답으로 교체.
  Founder 조건: 검증 정보만 추천, 충돌 주소·전화·영업시간 제외, H15 거리 미검증 명시, 혜택 노출 제외, 모이핀 차단·HOLD 유지.

Existing Assets Found:
  - services/soyeowoolService.js: _isCafeQuestion (L557), _buildCafeNotSupportedPayload, 카페 분기 (handleTravelRequest, place_code 없을 때)
  - _PLACE_KNOWLEDGE 구조 (§64) 와 검증 corpus (_VERIFIED_KNOWLEDGE_TEXT, 응답 가드 routes/travelInputRoutes.js 에서 사용)
  - §66 분류표, §68 게이트 (CONFIRMED_BENEFIT_PARTNERS 빈 배열, is_active 필터)
  - Candidate: docs/constitution/candidate 의 CAND-EXP-001/002 (기존 문서 보존)

Repositories Inspected:
  daily-miracles-mvp (services, tests, Candidate 폴더, 저장소 이력 CAND-EXP 중복 검색)
  sowon-dreamtown (CAND-EXP 색인)

Relevant Files:
  services/soyeowoolService.js (수정), tests/unit/soulCafeSeaViewKnowledge.test.js (신규),
  tests/soul/soulRepair0103.test.js, tests/soul/soulHybridV1Fast.test.js, tests/soul/soulQA001ResponseRouting.test.js (기존 고정 문구 갱신),
  docs/constitution/candidate/CAND-EXP-005_Muyojeong_Unified_Experience.md (신규 Candidate, 미커밋)

Relevant Databases:
  없음. 운영 DB 접근 없음. partner CSV·Seed 변경 없음.

Change Classification:
  REPAIR (H07·H15 응답 공백 해소 — 준비 중 응답을 검증 정보 응답으로). 신규 기능·Schema·Architecture 없음.

Connection Opportunity:
  기존 _PLACE_KNOWLEDGE 방식과 검증 corpus 에 카페 Knowledge 한 항목 추가. 기존 응답 빌더 패턴 재사용.

Duplication Risk:
  낮음. 신규 응답 파이프라인 없음. 기존 카페 분기의 조건부 분기만 추가.

Data Risk:
  낮음. 혜택 필드 없음. 충돌 주소·전화 미포함. 모이핀 미언급. 고객 노출 확대는 검증된 1곳뿐.

Recommended Approach:
  1) _SEA_VIEW_CAFE_KNOWLEDGE 에 검증 항목만 등록 (포트앤포트)
  2) 바다 + 카페 질문에만 전용 응답. 그 외 카페 질문은 기존 응답 유지
  3) H15 는 오동도 감지 시 거리 미검증 문장 추가
  4) 검증 corpus 에 카페 영업시간 포함 (응답 가드 통과)
  5) 테스트: 신규 9건 + 기존 고정 문구 3건 갱신 (상태·내용만)
  6) Replay H01–H20 vs 기준선: H07·H15 외 변경 없음 확인
  7) 전체 회귀 flag unset / 0 / 1 + 하위 집합

Questions Requiring Decision:
  없음 (Founder §70 조건 범위 내). 실제 LLM 최종 측정은 별도 승인 대상 (§6).

Implementation Status: READY (Founder §70 승인 범위)
```

## 1. Founder 결정 기록

| 항목 | 결정 | 조치 |
|---|---|---|
| Q69-1 Candidate ID | 기존 CAND-EXP-001 덮어쓰지 않음. 미사용 ID 를 무여정 통합 Candidate 에 할당 | **CAND-EXP-005** 할당. 신규 파일 `docs/constitution/candidate/CAND-EXP-005_Muyojeong_Unified_Experience.md` (기존 문서 미변경). 미사용 확인: 저장소 이력 (전 브랜치) 및 sowon-dreamtown 후보 색인 |
| Q69-2 거버넌스 | GitHub 정본 우선. Constitution 승격과 일반 Candidate 승인 절차 구분. Governance 수정 금지 | Candidate 문서에 구분 기록. `CONSTITUTION_GOVERNANCE.md` 미수정 |
| Q69-3 품질 종료 기준 | 조건부 승인 | 반나절 자동 일정 생성 → 후속 개선. 개인정보 법률 검토, 혜택 활성화, 최종 E2E → 출시 전 필수 유지 |

## 2. 구현 내용

### 2.1 변경 파일

| 파일 | 변경 |
|---|---|
| `services/soyeowoolService.js` | `_SEA_VIEW_CAFE_KNOWLEDGE` (검증 카페 1항목), `_isSeaViewCafeQuestion`, `_buildSeaViewCafePayload`. 카페 분기에서 바다 질문만 신규 응답. `_VERIFIED_KNOWLEDGE_TEXT` 에 카페 Knowledge 추가 |
| `tests/unit/soulCafeSeaViewKnowledge.test.js` | 신규 9건 |
| `tests/soul/soulRepair0103.test.js` | 기존 카페 고정 문구 → 검증 카페 응답 (상태·내용) |
| `tests/soul/soulHybridV1Fast.test.js` | 동일 (상태만) |
| `tests/soul/soulQA001ResponseRouting.test.js` | 동일 (상태·내용) |

### 2.2 응답 규칙 (구현됨)

- 포함: 포트앤포트, 엘리스테이 여수 4층 (돌산 백초길), 공식 사이트의 "오션뷰" 소개 문구, 영업시간 11:00~21:00 (브레이크타임 15:00~17:00), 다른 카페 바다 전망 미확인 문장.
- H15 (오동도 감지): "오동도와의 거리는 확인되지 않아서 오동도 근처라고 말할 수 없어요."
- 제외: 번지 (28-52, 28-58), 전화 (0507-1371-2956, 0507-1429-5241 — 자료 간 충돌), 혜택 문구 (아메리카노·무료·할인·쿠폰·제휴), 모이핀, 미검증 카페 (프롬나드, 더 포레스트랜드, 라또아, 카프아일랜드, 메리엘, 하루 한방카페).
- next_options, places 비어 있음 (추천 목록 생성 없음).
- 응답 구조: 기존 필드 (`status: PLACE_LOOKUP`, `intent: CAFE_RECOMMENDATION`, `presentation_mode: PLACE_KNOWLEDGE`). 새 Architecture 아님.

판단 근거: Founder 규칙 "검증된 바다 전망 카페만 추천" 을 엄격히 적용. 포트앤포트만 공식 자료에서 바다 전망 소개가 확인됨. 다른 6곳은 후기 기반이라 추천 대상에서 제외. §66 의 "E (후기 기준)" 는 "조건부 안내" 였으나 Founder 조건으로 이번 단계에서는 사용하지 않는다.

### 2.3 기존 고정 문구 갱신 (3 파일)

기존 테스트는 H07 류 질문이 "준비 중" 응답을 받는 것을 고정하고 있었다. §70 의 승인된 변경이므로 기대값을 새 응답 (PLACE_LOOKUP, 포트앤포트) 으로 바꿨다. 제휴·혜택·추천 카페·관광코스 배제 검사는 유지했다.

## 3. 검증 결과

### 3.1 신규 테스트

`tests/unit/soulCafeSeaViewKnowledge.test.js` 9/9 통과. H07 (추천·제외 항목·거리 문장 없음·next_options 없음), H15 (거리 미검증 명시, 제외 항목), 범위 보존 (바다 없는 카페 질문 = 기존 준비 중 응답, place_code 카페 질문 = PSQ 경로, 바다 관광지 질문 = 카페 응답 아님).

### 3.2 H07·H15 응답 전후 (Mock 재생, 실제 LLM 아님)

재생 원본: `real-run-2026-11-20-post-clarify.json`. 기준: HEAD `10f52dc` (git archive) vs 수정 후.

| 질문 | 전 | 후 |
|---|---|---|
| H07 | NOT_SUPPORTED_YET, "카페 추천 기능은 아직 준비 중이에요." | PLACE_LOOKUP, 포트앤포트 안내 (주소 번지·전화·혜택 없음) |
| H15 | NOT_SUPPORTED_YET, 동일 | PLACE_LOOKUP, 포트앤포트 + "오동도 근처라고 말할 수 없어요" |

### 3.3 H01–H20 Mock 회귀

- 변경된 질문: **H07, H15 만**. 나머지 18개는 상태·프레젠테이션·메시지·next_options·payload 키·호출 수 모두 동일.
- 재생 소진 0, 콘솔 오류 0. 응답 가드 (routes 계층) 통과 (GUARDED_FALLBACK 없음).

### 3.4 전체 회귀 (기준선 대비)

| 구분 | 결과 | 기준선 (§68 말) | 차이 |
|---|---|---|---|
| Hybrid flag unset | 882 pass / 1 fail (R20) | 873 / 1 | +9 신규 |
| Hybrid flag 0 | 882 pass / 1 fail (R20) | 873 / 1 | +9 신규 |
| Hybrid flag 1 | 880 pass / 3 fail (LB-I7, R4, R20) | 871 / 3 | +9 신규 |
| Privacy·Route Gate·Manifest·RC3·Hybrid 하위 집합 | 121 / 121 | — | — |

실패 이름 집합은 기준선과 동일. 신규 실패 0. 실패 suite 의 원인 (supertest 미설치, 테스트 0개 suite, privacyHotfix process.exit, R20, flag 1 의 LB-I7·R4) 은 기존 기록과 동일.

### 3.5 실제 LLM Benchmark

실행하지 않았다. 기존 결과 8/12/0 는 변경하지 않았다. §70 Founder 요청: H07·H15 개선 검증 후 최종 실제 LLM Benchmark 실행 승인 요청 (§6).

## 4. 범위 밖 (명시)

- 소원패스 혜택 고객 노출: 없음 (허용 목록 `CONFIRMED_BENEFIT_PARTNERS` 미변경)
- 모이핀 무료 혜택 차단: 유지. 10% 할인 HOLD: 유지 (코드·DB 미변경)
- 머먹지 구현: 없음 (Phase C)
- 신규 Schema, Migration, DB 연결: 없음
- Clarify 추가 개발, Manifest 개선: 없음
- 실제 LLM 호출: 없음
- push·PR·merge, Render 배포, Hybrid 운영 활성화: 없음
- Hybrid flag ON 경로: 기존 테스트 (soulHybridV1Fast 의 H2 카페 항목) 가 PLACE_LOOKUP 을 확인. 별도 flag ON 재생 검증은 하지 않음

## 5. 품질 개선 종료 기준 상태 (§69 §2.2, Founder 조건부 승인)

| # | 기준 | 상태 |
|---|---|---|
| 1 | 노출 장소 정보에 C (충돌) 값 없음 | 충족 (카페 제외 규칙 + 테스트). 기존 장소 Knowledge 는 §64 로 정리 |
| 2 | H07·H15 는 검증 정보만, 혜택 문구·미승인 항목 없음 | **충족** (§70) |
| 3 | 근거 없는 시각·도보 시간 없음 | 충족 (기존 가드·테스트, 회귀 포함) |
| 4 | 전체 회귀 기준선 유지, 신규 실패 없음 | **충족** (§3.4) |
| 5 | 실제 LLM 최종 측정 1회, 기존 대비 악화 없음 | **대기** (별도 승인 요청) |
| 6 | Clarify·Hybrid·Route Gate·Manifest 기존 테스트 유지 | 충족 (§3.4) |
| 7 | 코드·Evidence 가 승인 범위만 보존 | 코드 커밋 (승인 범위), Evidence 는 워킹트리 (정책 §64~§70) |

분류 (Founder §69 체계):
- **완료**: 카페 제휴 상태 기록 (§68), H07·H15 검증 카페 연결 (§70), 무여정 Candidate 할당 (CAND-EXP-005), Clarify CLOSED.
- **품질 종료 전 필수**: 기준 5 (실제 LLM 최종 측정 승인·실행), Evidence 최종 선별 커밋.
- **출시 전 필수 (Founder 유지)**: 개인정보 법률 검토 (BLOCKED), 혜택 활성화 (모이핀 10% 포함, 허용 목록 반영), 최종 모바일·브라우저 E2E.
- **출시 이후 개선**: 반나절 자동 일정 생성 (Founder 후속 이관), 도보 연결 데이터 확장.

## 6. Founder 승인 요청: 최종 실제 LLM Benchmark

요청 내용 (실행 전 별도 Preflight 와 승인 필요):
- 대상: H01–H20 (20 질문), 기존 실행 가드 재사용 (run-real.js, 승인 토큰 방식)
- 예산: 기존 §60 기준 (질문 ≤20, 호출 ≤40, USD ≤0.10) 유지 제안
- 모델: 기존과 동일 (gpt-4o-mini, store false, SDK 재시도 금지)
- 비교 기준: 8/12/0 (§60). 악화 판정 기준은 Founder 확인 필요
- 실행 시점: 본 §70 커밋 이후, Founder 승인 시

## 7. 저장 및 Evidence

- 코드·테스트 커밋: 검증 통과 후 승인 파일만 로컬 커밋 (아래 §8).
- 워킹트리 Evidence: 본 문서, `CAND-EXP-005` Candidate 문서, `DREAMTOWN_STATUS.md` (Project State). push 없음.
- 외부 백업: `C:\DEV\_phx_soul_evidence_backup\20261120-final-quality-closure\` (SHA256 결과는 Project State 참조).

## 8. 기준 Place ID 참조값 (Founder 제공, 외부 미검증)

재수집 전 참조값으로 기록만 한다. 응답 코드에서는 사용하지 않는다.

| 업체 | 참조 Place ID | 외부 검증 |
|---|---|---|
| 프롬나드 | 1824472821 | 미검증 |
| 더 포레스트랜드 | 1813900564 | 미검증 |
| 엘리스테이 | 1630029854 | 미검증 |
| 라또아 | 1244240771 | 미검증 |
| 카프아일랜드 | 1826950499 | 미검증 |
| 메리엘 | 35251952 | 미검증 |
| 하루 한방카페 | 1480770989 | 미검증 (§67 Founder 제공) |

포트앤포트 (엘리스테이 4층) 의 Place ID 는 Founder 목록에 "엘리스테이" 로만 있다. 포트앤포트 전용 ID 는 기록되지 않았다 (확인 필요).

## 9. 커밋 대상 (검증 통과 후)

- `services/soyeowoolService.js`
- `tests/unit/soulCafeSeaViewKnowledge.test.js`
- `tests/soul/soulRepair0103.test.js`
- `tests/soul/soulHybridV1Fast.test.js`
- `tests/soul/soulQA001ResponseRouting.test.js`

제외: 워킹트리 문서 (§64~§70 Evidence, DREAMTOWN_STATUS.md), CAND-EXP-005 문서, backups/, fixtures.
