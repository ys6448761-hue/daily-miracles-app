# PHX-SOUL-QA-001 — Real LLM Verification Final Retry (V1, 2026-11-19)

> 운영 출시 승인 아님. 실제 검증 성공 ≠ 운영 출시 승인. 개인정보 법률 검토는 계속 미완료(BLOCKED).
> 번호: 기존 SOUL 정본 §46(`daily-miracles-mvp/docs/knowledge/PHX-SOUL-QA-001_RESPONSE_ROUTING_INVESTIGATION.md`)은 다른 체크아웃·브랜치에 있어 수정하지 않았다. 이 문서가 §47 기록이며, 정본 반영은 별도 결정 대상.

## 1. Guardian Preflight Report (실행 전 기록)

```
### Guardian Preflight Report

Requested Change:
  PHX-SOUL-QA-001 실제 LLM 검증 최종 재시도 (H01~H20, 고정 질문 20개, 테스트 전용 Key 1회 실행).
  Founder 승인: 2026-11-19 (pasted instruction "Real LLM Verification Final Retry").

Existing Assets Found:
  C:\DEV\_phx_soul_test_harness\run-real.js (승인 토큰·형식·HEAD·엔진 clean 게이트 보유, 재사용)
  C:\DEV\_phx_soul_test_harness\engine-harness.js (4개 LLM 경로 실코드, SDK maxRetries=0, store=false 강제)
  C:\DEV\_phx_soul_test_harness\harness.js (호출·비용 예약/정산 가드)
  mock 37/37 (engine 14 + harness 14 + real-transport 9)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 — feat/phx-soul-hybrid-v1, HEAD 5c368371eaab4d26be25942528b48500cebe1b4c
  engine 경로(services/routes/database/utils) git status: clean (실행 직전 확인)

Relevant Files:
  C:\DEV\_phx_soul_test_harness\fixtures\h-questions.json (H01~H20, 합성 문장, Production 실패 H04/H07/H09 포함)
  C:\DEV\_phx_soul_test_harness\results\aborted-invalid-session-key-2026-11-19.json (이전 중단 시도 — 4회·USD 0.004698 예약 기록)

Relevant Databases:
  없음. pg는 가짜 Pool(연결 차단). 운영 DB·sowon DB 미접속.

Change Classification:
  REPAIR (검증 실행) — 제품 코드 변경 없음. 하네스 run-real.js에 예산 차감 옵션 1줄 추가(저장소 밖).

Connection Opportunity:
  해당 없음 (검증 실행).

Duplication Risk:
  낮음. 이전 중단 시도는 실제 LLM 품질 검증 1회로 계산하지 않음 (Founder 지시). 결과 파일은 1회 전용 (존재 시 실행 거부).

Data Risk:
  낮음. 합성 질문 20개만 외부 전송. 운영 .env 미로드(워크트리 .env 없음), 운영 Key 미사용, 운영 DB 미접속, 실제 고객 개인정보 없음.
  Key 값은 출력·저장하지 않음 (형식 boolean만 확인: sk- 접두, 길이 164, 공백·제어·비ASCII 없음).

Recommended Approach:
  (1) 기존 run-real.js 재사용 (승인 토큰 FOUNDER-APPROVED-PHX-SOUL-QA-001-2026-11-19 게이트 통과 시에만 전송)
  (2) 예산 차감: 이전 중단 시도 예약(4회, USD 0.004698)을 차감한 유효 상한 — 호출 36회, USD 0.0953 (총 상한 40회 / USD 0.10 유지)
  (3) 질문당 최대 4회, 연속 실패 3회 시 중단, 남은 질문은 UNVERIFIED
  (4) 결과: 질문별 원문·경로·평가·호출·토큰·비용·응답시간 기록 → 결과 JSON(1회 전용)

Questions Requiring Decision:
  없음 (Founder 승인 범위 명시). 결과에 따라 운영 출시 여부는 별도 결정.

Implementation Status: READY
```

## 2. 실행 전 안전 조건 체크리스트

| 조건 | 기준 | 결과 |
|---|---|---|
| Hybrid HEAD | 5c368371eaab4d26be25942528b48500cebe1b4c | PASS (run-real.js 게이트) |
| 엔진 소스 변경 | services/routes/database/utils 0건 | PASS (run-real.js 게이트) |
| Key 형식 | sk- 접두, 공백·제어·비ASCII 없음, 길이 ≥20 | PASS (길이 164, 값 미출력) |
| 운영 Key 사용 | 없음 | PASS (OPENAI_API_KEY 세션 변수, 테스트 전용 Founder 주입) |
| 운영 .env / 운영 DB | 미로드 / 미접속 | PASS |
| 모델 / 엔드포인트 | gpt-4o-mini / chat/completions 단독 | PASS (가드 강제) |
| SDK 재시도 | 0 | PASS (maxRetries=0 강제) |
| store | false | PASS (가드 강제) |
| 질문 수 | ≤20 (고정 20) | PASS |
| 호출 상한 | ≤40 전체, 이전 시도 4회 차감 → 36 | PASS |
| 비용 상한 | ≤USD 0.10, 이전 예약 USD 0.004698 차감 → 0.0953 | PASS |
| 1회 전용 | 결과 파일 존재 시 실행 거부 | PASS (`real-run-2026-11-19.json` 미존재 확인) |

## 3. Mock 기준선 (실행 직전)

- engine.mock.test.js 14/14, harness.mock.test.js 14/14, real-transport.mock.test.js 9/9 → **37/37 PASS**

## 4. 백업

- 실행 전 `DREAMTOWN_STATUS.md` SHA256 `b332394477a21559286dfac9121158130af6923e67ec2a5dbf3b22fa72083269`
- 백업: `docs/knowledge/backups/DREAMTOWN_STATUS.pre-PHX-SOUL-QA-001-real-retry-2026-11-19.md` (해시 일치 확인)

---

## 5. 실행 결과

**판정: BLOCKED — 실제 LLM 호출 0회. 결과 파일 미생성. 질문별 실제 응답 없음.**

| 항목 | 값 |
|---|---|
| 실행 명령 | `node run-real.js` (1회) |
| 출력 | `RUN_ERROR PREFLIGHT_REFUSED [PREFLIGHT_REFUSED] worst-case calls 40 > 36; worst-case cost 0.097200 > 0.0953` |
| 전송 여부 | 전송 전 차단 (harness.js `preflight`, 질문 20개 전체 worst-case 계산 단계) |
| 호출 수 | 0 (이번 실행) / 누적 4 (이전 중단 시도, 전부 EXCEPTION·usage 없음) |
| 비용 | 0 (이번 실행) / 이전 예약 USD 0.004698 |
| 토큰·응답시간 | 없음 |
| 결과 파일 | 미생성 (`results/real-run-2026-11-19.json` 없음 — 1회 전용 게이트는 재실행 가능 상태 유지) |

### 5.1 차단 원인

- 하네스 preflight(harness.js `preflight`)는 질문당 `1 + maxRetriesPerQuestion(1) = 2`회로 계산해 20개 × 2 = 40회, worst-case USD 0.0972(안전계수 2 포함)를 산출한다.
- Founder 지시대로 이전 예약 USD 0.004698을 차감하면 유효 상한은 36회 / USD 0.0953 이다. 비용 worst-case 0.0972가 0.0953을 넘으므로 preflight가 전송 전에 거부했다.
- 즉 "이전 예약 보수 차감"과 "질문 20개 전체 preflight worst-case"를 동시에 만족하는 실행은 현재 승인 범위 안에서 불가능하다.
- 주의: preflight 가정(질문당 2회)은 런타임 질문당 상한(4회, LLM 경로 4개)과 다르다. 런타임에서는 `reserveCall`이 호출마다 회수·비용 상한을 강제하므로, 상한 도달 시 남은 질문은 UNVERIFIED로 중단된다. preflight는 전체 worst-case를 미리 보는 추가 게이트다.
- 하네스 코드(harness.js, engine-harness.js)와 Hybrid 엔진은 수정하지 않았다. 변경은 `run-real.js` 예산 옵션 추가뿐이다(저장소 밖).

### 5.2 Founder 결정 필요 (택 1)

1. **이전 예약 차감 없이 실행**: 상한 40회 / USD 0.10 그대로. 이전 중단 시도는 usage 없이 EXCEPTION으로 끝났으므로 실과금 0으로 본다. preflight worst-case 40회 / 0.0972 < 0.10 으로 통과. 단 이 경우 이전 예약 0.0047까지 합산하면 이론상 worst-case는 0.1019로 상한을 넘으므로, 실과금 0 가정을 Founder가 승인해야 한다.
2. **질문 수 축소 (예산 차감 유지)**: 18개 이하로 줄이면 preflight 기준 36회 / USD 0.0875 로 0.0953 이내 통과. 어떤 질문을 뺄지 Founder 지정 필요. "H01~H20 전체" 승인과 달라진다. (Production 실패 H04·H07·H09는 반드시 포함 권고)
3. **현행 유지**: 실행 보류. 이번 시도 결과를 BLOCKED로 확정.

기본 권고는 1 (승인 문구의 "40회·USD 0.10"을 그대로 적용하고, 이전 중단 시도는 실과금 0 근거로 기록). 단 "보수적 고려"의 해석은 Founder 판단이다. 옵션 1 선택 시 `run-real.js`의 `GUARD_OVERRIDES` 차감 줄만 제거하면 된다.

### 5.3 Production 0/3 비교

- 실행하지 않았으므로 비교 결과 없음. 기준: H04·H07·H09 Production 실패 3건 (fixture `production_failure_mapping`).

## 6. 금지 사항 준수 (이번 세션)

- 신규 기능 개발: 없음 / Hybrid 서비스 코드 수정: 없음 / 운영 Key: 미사용
- GitHub push·PR·merge: 없음 / Render 배포: 없음 / Hybrid 운영 활성화: 없음
- API Key 값 출력·저장: 없음 (형식 boolean만 확인)
- 추가 진단 API 요청: 없음 / SDK 자동 재시도: 해당 없음 (호출 0)

## 7. 백업 검증

- `DREAMTOWN_STATUS.md` 백업 SHA256 재확인: 실행 전 해시 `b332394477a21559286dfac9121158130af6923e67ec2a5dbf3b22fa72083269` 일치.

## 8. Current Next Action (§5 시점, §48에서 대체됨)

**Founder가 §5.2 결정(1·2·3 중 택1)을 회신 → 회신 내용에 맞춰 `run-real.js` 예산을 조정하고 H01~H20 실제 검증 1회 실행.**

## 9. 법적 상태

- 개인정보 법률 검토: 계속 미완료(BLOCKED). 실제 검증 성공이 운영 출시 승인을 의미하지 않는다.

---

## 10. §48 — H01~H20 실제 LLM 검증 실행 결과 (2026-11-19, 1회 실행)

> 승인: Founder 신규 독립 예산 — 질문 20개 전체, 외부 호출 최대 40회, 이번 실행 USD 0.10. 이전 실패 기록(4회·USD 0.004698, 모델 응답 없음)은 별도 보존하며 차감하지 않음. 보수적 누적 상한 USD 0.104698. OpenAI 프로젝트 hard limit USD 1 유지(Founder 설정 보고, 이 세션에서 확인하지 않음).
> 실행: `run-real.js` 1회. 감액 guardOverrides 제거, 정상 상한 적용. 우선순위 H04·H07·H09 → 나머지 원래 순서. 상한 도달 중단 조건 미발동.
> 런타임 강제: `reserveCall` (호출 40 / USD 0.10 / 질문당 4 / 연속 실패 3). 사전 추정은 질문당 2회 가정이며 런타임 최대는 4회 (이 차이는 §5.1에 기록).

### 10.1 실행 요약

| 항목 | 값 |
|---|---|
| HEAD | `5c368371eaab4d26be25942528b48500cebe1b4c` (엔진 변경 0) |
| 모델 / 엔드포인트 | gpt-4o-mini / chat/completions 단독, store=false, SDK 재시도 0 |
| 질문 | 20개 전체 실행, 중단 없음 (`stop: none`) |
| 실제 HTTP 호출 | 17회 (17 시도, 실패 0) |
| 토큰 | 입력 11,912 / 출력 2,429 |
| 비용 (실측 usage 기준) | USD 0.003244 |
| 비용 (harness 추정, 안전계수 2) | USD 0.006488 |
| 누적 보수 기준 (이전 기록 포함) | USD 0.011186 — 상한 0.104698 대비 여유 |
| 호출 상한 대비 | 17 / 40 |
| 전체 응답 시간 | 34,182 ms |
| 결과 파일 | `C:\DEV\_phx_soul_test_harness\results\real-run-2026-11-19.json` |
| 런타임 로그 | `[SOUL_ROUTE_SKELETON_ERROR] Cannot find module './routeSkeletonService'` ×2 — 아래 10.4 |

### 10.2 질문별 판정

판정 기준: **성공** = 확인된 정보로 답하거나, 미확인을 정직하게 고지하고 다음 행동을 안내. **부분** = 일부만 답하거나 답에 혼선·과장. **실패** = 질문에 답하지 못했거나 되묻기만 하거나 주장과 내용이 맞지 않음.

| ID | 질문 | 판정 | 실제 답변 요약 | 엔진 상태(요약 라벨, 정확한 값은 JSON `engine_status`) | 호출 | tok in/out | 비용 USD | 응답 ms |
|---|---|---|---|---|---|---|---|---|
| H01 | 좋은 아침이야, 소울아. | 성공 | 좋은 아침이에요, 계획을 물음 | direct | 1 | 105/32 | 0.000035 | 1055 |
| H02 | 게장이 어떤 음식이야? | 성공 | 게장 일반 설명 (여행 범위 밖, 무해) | direct | 1 | 101/60 | 0.000051 | 1618 |
| H03 | 오동도는 어떤 곳이야? | 성공 | 방파제 길·산책, 약 2시간 머묾 (verified knowledge 기반) | place | 0 | – | – | 1 |
| H04 | 오동도 관람시간은 얼마나 걸려? | **부분** | "평균 약 120분 머무는 곳" + 운영시간 09:00~17:00. 단 "관람 소요시간이 아니라 운영시간" 괄호 문구가 앞 답과 충돌 | place | 0 | – | – | 10 |
| H05 | 오동도 관람 가능 시간은? | 성공 | 연중무휴, 동백열차 09:00~17:00 | place | 0 | – | – | 0 |
| H06 | 오동도에서 걸어서 둘러볼 만한 곳은? | **실패** | 여행 계획 되묻기만 함. 장소 답 없음 | clarification | 2 | 1843/359 | 0.000492 | 4029 |
| H07 | 바다가 보이는 여수 카페를 알려줘. | **부분** | "카페 추천은 아직 준비 중" 정직 고지, 장소명 요청. 카페 답 없음 | not_supported | 0 | – | – | 1 |
| H08 | 돌산게장명가 소원패스 혜택은? | 성공 | 확인된 혜택 없음 고지, 공식 안내·현장 확인 안내 | benefit | 0 | – | – | 2 |
| H09 | 오동도와 케이블카 반나절 코스를 만들어 줘. | **부분** | 케이블카(45분, 09:30~21:30)·오동도(120분, 연중무휴) 정보 제공. "반나절 일정은 아직 구성 불가" 고지 | multi_place | 2 | 1849/378 | 0.000504 | 5623 |
| H10 | 성인 가족 3명, 도보 코스를 알려줘. | **실패** | "가볼 만한 곳을 골라봤어요"라고 하고 [정정 §49.6] 카드 4개 존재(harness stub 고정 DB 행). 시간 되묻기로 끝남. 도보 코스 없음 | partial | 2 | 1847/339 | 0.000480 | 5229 |
| H11 | 아까 질문에 먼저 답변해 줘. | 성공 | 직전 질문 기억 못함 정직 고지, 재질문 안내 | context_na | 0 | – | – | 0 |
| H12 | 마음이 지쳐서 조용히 쉬고 싶어. | **부분** | 일반적 공감·휴식 조언. 여수 구체 장소 없음 | direct | 1 | 108/51 | 0.000047 | 1351 |
| H13 | 아이 없이 성인끼리 가족여행을 왔어. | **부분** | 성인 여행용 명소 일반 설명 (구체 장소 없음, "성인끼리" 맥락은 반영) | adaptive | 1 | 257/59 | 0.000074 | 1700 |
| H14 | 어린 자녀와 오동도를 걷고 싶어. | **실패** | "어떤 경험을 찾고 계신지" 되묻기만 함. 오동도 도보 정보 없음 | clarification | 2 | 1843/398 | 0.000515 | 4604 |
| H15 | 오동도 근처에 바다가 보이는 카페가 있을까? | **부분** | H07과 동일: 카페 기능 준비 중 고지, 장소명 요청 | not_supported | 0 | – | – | 1 |
| H16 | 오동도는 몇 시부터 들어갈 수 있어? | 성공 | 운영시간 제시, 정확한 입장 시작 시간은 미확인 고지 | place | 0 | – | – | 0 |
| H17 | 오동도를 한 바퀴 둘러보려면 얼마나 걸려? | **부분** | 120분 머묾 제시 + 운영시간 괄호 문구 (H04와 동일한 혼선) | place | 0 | – | – | 1 |
| H18 | 여수 케이블카는 지금 운행하고 있어? | 성공 | 실시간 확인 불가 고지, 운영시간, 현장 문의처 안내 (번호는 프로젝트 문서 기재 번호와 일치) | live_unavailable | 0 | – | – | 0 |
| H19 | 처음 여수에 왔는데 어디부터 가면 좋을까? | **실패** | 여행 계획 되묻기만 함. 추천 없음 | clarification | 3 | 2106/347 | 0.000524 | 4856 |
| H20 | 부모님과 여수 1박 2일 여행 일정을 만들어 줘. | **부분** | 오동도·케이블카·하멜등대·향일암 목록 제시. 1박 2일 일정 구성 없음 | partial | 2 | 1853/406 | 0.000522 | 3858 |

**집계**: 성공 8 (H01, H02, H03, H05, H08, H11, H16, H18) / 부분 8 (H04, H07, H09, H12, H13, H15, H17, H20) / 실패 4 (H06, H10, H14, H19).

### 10.3 Production 비교 (필수 3건)

| 질문 | Production (§36.3) | 이번 실행 | 변화 |
|---|---|---|---|
| H04 오동도 관람 소요시간 | 0/3 (장소 재질문) | **부분** — 장소 재질문 없이 120분·운영시간 답변. 괄호 문구 혼선 | 재질문 제거 |
| H07 바다 전망 카페 | 0/3 (질문과 무관한 응답) | **부분** — 질문에 맞춰 "카페 기능 준비 중" 정직 고지. 카페 추천은 없음 | 무관 응답 제거 |
| H09 오동도+케이블카 반나절 | 0/3 (케이블카 재질문) | **부분** — 두 장소 정보 제공, 반나절 일정은 구성 불가 고지 | 재질문 제거 |

- 완전 성공(성공) 판정: 0/3. 부분 성공: 3/3. Production 대비 실패 모드는 제거되었으나, 세 질문 모두 원래 요구한 답(소요 시간 자체, 카페 추천, 반나절 일정)은 제공되지 않았다.

### 10.4 품질 이슈 (발견 사항)

1. **H10 주장-내용 불일치**: "가볼 만한 곳을 골라봤어요"라고 말했으나 [정정 §49.6] 목록이 없다는 판정은 틀렸다. 카드 4개가 있었으나 harness stub의 고정 DB 행이다. 허위 완결은 확정 결함이 아니다. 도보 요청 미반영으로 실패 판정은 유지한다.
2. **H04·H17 문구 혼선**: 120분을 머무는 시간으로 제시한 뒤 "관람 소요시간이 아니라 운영시간"이라고 덧붙여 자기모순.
3. **도보 코스 부재**: H06·H10·H14·H19 모두 걷기·코스 요청에 답하지 못함. 되묻기 편중.
4. **routeSkeletonService 누락**: 이 워크트리에 `services/routeSkeletonService.js`가 없다. 로그 `SOUL_ROUTE_SKELETON_ERROR`가 2회 찍혔다. §36/§44의 RC3(반나절 일정 구성 불가)와 같은 원인으로 보인다. 이번 실행에서는 확정하지 않았다.
5. **H18 번호**: `061-664-7301`은 프로젝트 문서(케이블카 Evidence 계열)에 기재된 번호와 일치하나, 현행 공식 번호 여부는 이 검증에서 확인하지 않았다.

### 10.5 금지 사항 준수

- 추가 진단 API 요청: 없음. 호출은 질문 실행 17회뿐 (각 질문 1회 시도, 재시도·SDK 재시도 없음, 실패 0).
- 엔진·서비스 코드 수정: 없음 (`git diff -- services routes database utils` 0줄).
- 운영 Key·운영 DB·운영 .env: 미사용. 결과 파일에 Key 값 없음 (run-real 누출 가드 통과).
- Push / PR / merge / 배포 / Hybrid 활성화: 없음.
- 운영 출시 승인: 아님. 실제 검증 성공 ≠ 운영 출시 승인.
- 개인정보 법률 검토: 계속 미완료(BLOCKED).

### 10.6 SHA256 백업

- 결과 JSON·실행 전 status 백업·갱신 status·본 문서 해시는 아래 `docs/knowledge/backups/PHX-SOUL-QA-001_REAL_RUN_2026-11-19.sha256.txt`에 기록.

### 10.7 Current Next Action (exactly 1)

**H10·H14·H19·H06 실패 (도보 코스·여행 계획 요청에 답하지 못하고 되묻기만 함)와 routeSkeletonService 누락을 해결할 수 있도록, Founder가 다음 작업 범위(RC3 라우팅 복구 vs. 되묻기 정책 수정)를 결정.** 이는 Hybrid 서비스 코드 수정이므로 Founder 결정 후 Guardian Preflight 재발행 필요.
