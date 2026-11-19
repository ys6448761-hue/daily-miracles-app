# PHX-SOUL-QA-001 — Verified Knowledge 보존 및 원격 Fast-forward Push (V1, 2026-11-20)

> §65. Founder 결정: §64 구현 결과 인정, 안전 조건 충족 시 Fast-forward push 승인.
> 실제 LLM 호출 없음. 운영 DB 연결 없음. PR·main merge 없음. Render 배포 없음. Hybrid 운영 활성화 없음.

## Guardian Preflight Report (push 전 기록)

```
### Guardian Preflight Report

Requested Change:
  §64 코드 커밋(dc175c2, eb01d33)과 §60~§64 Evidence 를 origin/feat/phx-soul-hybrid-v1 에 Fast-forward push.
  Force push 금지. Evidence 는 선별 커밋 (다른 Workstream 제외).

Existing Assets Found:
  - 원격 HEAD 9ad729f 가 로컬 eb01d33 의 조상임 (확인 완료, Fast-forward 가능)
  - 기존 Manifest Generator / pre-commit hook (docs/ staged 시 docs/index/manifest.json·tags.json 자동 갱신)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 (branch feat/phx-soul-hybrid-v1)
  원격 origin/feat/phx-soul-hybrid-v1 (git ls-remote: 9ad729f 확인)

Relevant Files:
  services/soyeowoolService.js, tests/unit/soulKnowledgeVerifiedIntegration.test.js,
  tests/soul/soulHybridV1Fast.test.js, tests/soul/soulQA001ResponseRouting.test.js,
  tests/soul/soulRepair0103.test.js, tests/unit/soulClarifyAnswerFirst.test.js,
  tests/unit/soulRc3SelectiveRecovery.test.js
  docs/knowledge/PHX-SOUL-QA-001_{POST_CLARIFY_BENCHMARK, FIRST_VISIT_DUPLICATE_FIX, TOURISM_KNOWLEDGE_READINESS,
  KNOWLEDGE_EVIDENCE_VERIFICATION, VERIFIED_KNOWLEDGE_INTEGRATION}_V1.md (§60~§64), 본 문서 (§65)

Relevant Databases:
  없음 (DB·마이그레이션 변경 없음)

Change Classification:
  REPAIR (Knowledge 사실 정정) + Evidence 보존. 신규 기능 없음.

Connection Opportunity:
  해당 없음 (보존 작업)

Duplication Risk:
  낮음. 원격에 이미 존재하는 커밋 재작성 없음. 추가 커밋은 Evidence 만.

Data Risk:
  없음. 실제 LLM 원본·API Key·backups/·미추적 fixtures·DREAMTOWN_STATUS.md 는 커밋 범위 밖.

Recommended Approach:
  1) 사전 검증 5개 (아래 §1) 통과 확인
  2) Evidence 선별 커밋 (§60~§64 문서 + 본 문서). Hook 결과 확인
  3) 원격 HEAD 가 9ad729f 인지 재확인 후 Fast-forward push (force 금지)
  4) 로컬·원격 SHA 일치 확인, 본 문서 §3 기록, SOUL Project State·외부 SHA256 백업 갱신

Questions Requiring Decision:
  없음 (Founder 승인 범위 내). 단, §1-1 의 시간표 계절 표기는 "확인 결과" 로 보고 (아래).

Implementation Status: READY
```

## 1. 사전 검증 결과

### 1-1. 동백열차 시간표의 계절 범위 (Founder 확인 요청 1)

공식 출처: 여수시 시설 안내 `yeosu.go.kr/tour/travel/10tour/odongdo_open/facilities` (2026-11-20 재조회).

| 항목 | 공식 페이지 문구 | 현재 코드 표기 |
|---|---|---|
| 기본 운행시간 | "운행시간 : 09:30~18:00 (점심시간 12:00~13:00 미운행)" | `09:30~18:00` |
| 동절기 | "동절기(11~2월) 단축운행 → 09:30~17:00" | `동절기 11~2월은 17:00까지` |
| 게시일·갱신일 | 페이지에 표시 없음 | — |

판정: **연중 고정값으로 안내하지 않음.** 현재 표기는 기본 시간에 11~2월 단축 예외를 함께 명시한다. 다만 공식 페이지는 기본 시간이 적용되는 월 범위를 명시하지 않는다 (동절기 라벨만 있음). 이 점을 Founder 에게 보고하며, 코드 변경은 push 범위 밖이므로 수행하지 않는다.

### 1-2. 기존 테스트 5개 파일 변경 범위 (Founder 확인 요청 2)

`git show eb01d33 -- tests/` 기준 변경 줄 (추가 12 / 삭제 7, 전부 assertion 문구·수치):

| 파일 | 변경 | 분류 |
|---|---|---|
| tests/soul/soulHybridV1Fast.test.js | 케이블카 `09:30~21:30` 기대 → 미노출 + "운영시간은 확인되지 않았어요" | Knowledge 수치 (Q63-2) |
| tests/soul/soulQA001ResponseRouting.test.js | 오동도 `120분` → `일정에서 약 90분` | Knowledge 수치 (Q63-1) |
| tests/soul/soulRepair0103.test.js | 오동도 "평균적으로 약 120분" → "일정에서 약 90분", "오동도는 평균적으로" → "오동도는 일정에서" | Knowledge 문구·수치 (Q63-1) |
| tests/unit/soulClarifyAnswerFirst.test.js | `운영시간은 연중무휴` → `운영시간은 상시 개방 (연중무휴)` | Knowledge 문구 (Q63-3) |
| tests/unit/soulRc3SelectiveRecovery.test.js | M3 `120분` → `일정에서 약 90분` (모순 문구 검사는 유지) | Knowledge 수치 (Q63-1) |

판정: **승인된 Knowledge 문구·수치 변경으로 제한됨.** 검사 로직, 기대 구조, 테스트 개수 변경 없음.

### 1-3. 변경된 Mock 응답의 미확인 정보 추가 여부 (Founder 확인 요청 3)

재생 원본: `real-run-2026-11-20-post-clarify.json` (실제 LLM 응답, 재생 시 실제 호출 없음). 수정 후 재생 결과 `replay-A-post64.json`.

| 질문 | 수정 후 응답 (요지) | 미확인 정보 추가 여부 |
|---|---|---|
| H03 | 오동도 소개 + 산책 문구. "보통 약 2시간" 문장 제거 | 없음 (120 평균 제거) |
| H05 | 오동도 상시 개방 (연중무휴), 동백열차 09:30~18:00 (동절기 11~2월 17:00까지, 12~13시 미운행) | 없음. 1-1 의 공식 문구 그대로 |
| H16 | H05 와 동일 + "정확한 입장 시작 시간은 확인되지 않았어요" | 없음 |
| H18 | 실시간 운행 여부 확인 불가, 운영시간 확인되지 않음, 현장 번호 | 없음 (09:30~21:30 제거) |

추가로 H04·H06·H09·H14·H17 도 같은 방식으로 확인: 신규 시각은 `09:00~10:30`(일정 배정, 검증 corpus `schedule_slot_ko`), `09:30~18:00`, `17:00`, `12~13시` 뿐이며 모두 `_PLACE_KNOWLEDGE` 에 있다. 응답 가드 (`UNVERIFIED_CLOCK_TIME`) 통과. 판정: **미확인 정보 추가 없음.**

### 1-4. 케이블카 편도 13분 (Founder 확인 요청 4)

편도 약 13분은 `ride_trust: NON_OFFICIAL` 로 유지 (`ride_duration_ko: '편도 약 13분'`). §64 에서 노출 라우팅을 추가하지 않았다. 판정: **비공식 참고값 유지, 신규 라우팅 없음.**

### 1-5. 승인 범위 밖 변경·사실 충돌 (Founder 확인 요청 5)

- H03 의 "보통 약 2시간" 제거와 H16 의 동백열차 줄 추가는 원 계획 질문 목록(H04·H05·H06·H09·H14·H17·H18) 외의 질문이다. 두 변경은 승인된 "120 평균 노출 금지"와 "동백열차 시설시간 분리" 규칙의 직접 결과이며 새 사실을 추가하지 않는다. 범위 밖 변경으로 분류하되 push 중단 사유로 보지 않음. 보고 항목으로 남김.
- 사실 충돌: 발견되지 않음. 1-1 의 계절 범위 표기는 공식 문구와 일치.

## 2. Evidence 보존 범위

포함 (선별 커밋):
- `PHX-SOUL-QA-001_POST_CLARIFY_BENCHMARK_V1.md` (§60)
- `PHX-SOUL-QA-001_FIRST_VISIT_DUPLICATE_FIX_V1.md` (§61)
- `PHX-SOUL-QA-001_TOURISM_KNOWLEDGE_READINESS_V1.md` (§62)
- `PHX-SOUL-QA-001_KNOWLEDGE_EVIDENCE_VERIFICATION_V1.md` (§63)
- `PHX-SOUL-QA-001_VERIFIED_KNOWLEDGE_INTEGRATION_V1.md` (§64)
- 본 문서 `PHX-SOUL-QA-001_VERIFIED_KNOWLEDGE_PRESERVATION_V1.md` (§65)
- Hook 이 갱신하는 `docs/index/manifest.json`, `docs/index/tags.json`

제외:
- `DREAMTOWN_STATUS.md` (타 세션 변경 포함, 전체 커밋 금지)
- `PHX-SOUL-QA-001_APPROVAL_AND_PRESERVATION_V1.md` (§59 완료 기록의 미커밋 변경. 범위 밖)
- `PHX-SOUL-QA-001_TEST_ENV_PREFLIGHT_V1.md` (타 세션)
- `docs/knowledge/backups/`, `tests/fixtures/certificate/`, `tests/fixtures/postcard/` (미추적)
- 실제 LLM 원본 (`C:\DEV\_phx_soul_test_harness\results\`), API Key

비밀 스캔: §60 문서의 `FOUNDER-APPROVED-PHX-SOUL-QA-001-2026-11-19` 는 하네스 승인 토큰 문자열이며 API Key 가 아니다. 문서 원문은 변경하지 않는다.

## 3. 실행 결과 (push 후 기록)

(작성 중 — push 후 최종 SHA 와 manifest 검증 결과를 기록한다.)
