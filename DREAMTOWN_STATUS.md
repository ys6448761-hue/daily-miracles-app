# DREAMTOWN_STATUS.md
# 새 담당자/새 세션은 이 파일부터 읽을 것

Last Updated: 2026-04-04
담당: Claude Code (Antigravity)

---

## 한 줄 요약

> **Phase 1 완료** — 감정 구조 / 여행 연결 / 쿠폰 시스템 / UX / 전환 구조 / 상담 시스템 확정.
> 다음: Phase 2 구현 착수 (쿠폰 발행 로직 / 업체 확인 화면 / 일상 장면 카드 확장).

---

## 저장소 구조

| 로컬 경로 | GitHub | 역할 |
|----------|--------|------|
| `C:\DEV\daily-miracles-mvp` | `ys6448761-hue/daily-miracles-app` | Express 백엔드 |
| `C:\DEV\sowon-dreamtown` | `ys6448761-hue/sowon-dreamtown` | React 프론트엔드 (dreamtown-frontend/) |

---

## 완료 이력 (압축)

| 완료일 | 티켓 | 내용 |
|--------|------|------|
| 03-16 | UX P1 | 신호등 카드(GREEN/YELLOW), RED 분기 `/red-support.html` |
| 03-16 | UX P2 | summary_line 룰 엔진 + today_action 카드 |
| 03-16 | GPT Docs | `docs/gpt/` DT_*.md 7종 생성 |
| 03-20 | AIL-DT-001 | Core Loop (소원→별→Day→MyStar→광장) |
| 03-22 | AIL-DT-002 | 역할 분리(MyStar/StarDetail), isOwnStar 리다이렉트 |
| 03-22 | AIL-DT-003 | Day 자동 진입 + doneTodayFlag 완료 상태 |
| 03-22 | AIL-DT-004 | Core Loop 최종 정비, 빌드+push |
| 03-22 | AIL-DT-005 | 항해 로그 source 필터 (resonance 제외) |
| 03-22 | AIL-DT-006 | Seed Stars 13개 재시드 (은하별 분산) |
| 03-22 | AIL-DT-008 | 별 선물하기 바이럴 루프 전체 (GiftLanding, MyStar UI, API) |
| 03-23 | AIL-DT-P0 | MilestoneBar 공통 컴포넌트, MyStar 닉네임/wish_text/케어현황, StarDetail 재구성, `/detail` API |
| 03-24 | Docs Audit | 중복/낡은 파일 78개 삭제, 토큰 최적화 완료 |
| 04-03 | DEC-0331-001 | Core Engine 전체 구현 — 마이그레이션 045~048, 6개 서비스, 3개 워커, dtEngineRoutes |
| 04-03 | Aurora5 Orch | Orchestrator + 5 Agents (Star/Care/K-Wisdom/Narrative/Monetization) |
| 04-03 | Funnel HTML | dt-landing / dt-wish / dt-star-born / dt-upgrade 4페이지 완성 |
| 04-03 | **P0 결제게이트** | **결제 전 소원그림 생성 차단 — dtArtifactWorker + dtEngineRoutes 게이트 적용, 실 DB 검증 완료** |
| 04-03 | Mig 046~048 | 마이그레이션 046~048 Supabase 운영 DB 반영 완료 (dt_narrative_jobs, Orchestrator 3종, care enum) |
| 04-03 | NicePay SDK | nicepayService.js 주석 SDK URL 통일 (`pg-web.nicepay.co.kr`) |
| 04-03 | Worker 등록 | dtArtifactWorker / dtNarrativeWorker / dtOrchestratorWorker server.js 등록 확인 완료 |

---

## 현재 Phase 상태

### ✅ Phase 1 — 완료 (2026-04-04)

| 영역 | 내용 | 상태 |
|------|------|------|
| 감정 구조 | 소원 → 기록 → 변화 → 결심 구조 | ✅ 확정 |
| 여행 연결 | 장면 카드 3종 (케이블카/전망대/유람선), 위치 비특정 + 상황 기반 문장 | ✅ 확정 |
| 일상 확장 | 아침/낮/밤 장면 카드 구조 | ✅ 설계 완료 |
| 쿠폰 시스템 | 쿠폰 = 감정 트리거 구조, 쿠폰 → 장면 매핑 SSOT | ✅ 확정 |
| UX | 앱진입→질문→장면 / 쿠폰상세→감정→QR / 사용직전→감정피크 | ✅ 완성 |
| 전환 구조 | 9~10개월 결심 UX, 책=결과물 구조, 300/500 깊이 차이 | ✅ 확정 |
| 상담 시스템 | 상담 흐름 4단계, 스크립트, 교육+롤플레잉 | ✅ 완료 |

### 기존 코어 완료 항목

| Phase | 내용 | 상태 |
|-------|------|------|
| UX Phase 1+2 | 신호등 + summary_line | ✅ 완료 |
| DreamTown Core Loop | 소원→별→Day→MyStar→광장 | ✅ 완료 |
| DreamTown Gift Loop | 별 선물하기 | ✅ 완료 (DoD 검수 대기) |
| DEC-2026-0331-001 | Core Engine (Star→Wisdom→Choice→Growth→Narrative→Artifact) | ✅ 완료 |
| Aurora5 Orchestrator | 이벤트 기반 에이전트 자동화 | ✅ 완료 |
| 소원꿈터 퍼널 | Landing→Wish→StarBorn→Upgrade HTML 4페이지 | ✅ 완료 |
| **P0 결제 게이트** | **결제 전 소원그림 생성 차단** | **✅ 완료 (실 DB 검증)** |
| Journey Scene Engine | 앱 진입 장면 카드 (3장면, 하루 1회, localStorage) | ✅ 완료 |
| Story Draft MVP | /story-draft-mvp 감정 서사 검증 페이지 | ✅ 완료 |

### ⏳ Phase 2 — 미시작

| 영역 | 내용 | 상태 |
|------|------|------|
| 쿠폰 발행 로직 | 결제 확정 → 쿠폰 자동 생성 + 카카오 발송 | ⏳ |
| 업체 확인 화면 | 현장 QR 확인 + 법인카드 차감 처리 | ⏳ |
| 일상 장면 카드 | 아침/낮/밤 카드 실제 구현 | ⏳ |
| 쿠폰 → 감정 연결 | 쿠폰 상세 진입 시 감정 피크 UX | ⏳ |
| 책 결과물 구조 | 9~10개월 전환, 300/500 깊이 차이 UX | ⏳ |

---

## 즉시 해야 할 것

### P0 결제 게이트 후속 작업 (2026-04-03 완료)
- [x] **마이그레이션 045~048 운영 DB 반영** — Supabase에 4개 마이그레이션 전체 적용 완료
  - 045: dt_core_engine 6개 테이블 ✅ (이전 세션에서 적용)
  - 046: dt_narrative_jobs ✅
  - 047: dt_orchestrator_events / dt_agent_runs / dt_orchestrator_decisions ✅
  - 048: dt_log_type enum 'care' 추가 ✅
- [x] **NicePay SDK URL 불일치 수정** — `nicepayService.js` 주석을 실제 사용 URL(`pg-web.nicepay.co.kr`)로 통일
- [x] **워커 3종 서버 시작 시 등록 확인** — `server.js` 2224~2246행에 3종 모두 start() 등록 확인 완료

### AIL-DT-008 DoD 검수 (2026-04-03 코드 검수 완료)
- [x] `POST /api/dt/stars/:id/gift` → 200 + gift_card 반환 확인 ✅ (실 DB 시뮬레이션 통과)
- [x] `GET /api/dt/gift/:star_id` → star_name + copy_text 확인 ✅ (실 DB 시뮬레이션 통과)
- [x] `/dreamtown/gift/:star_id` 공개 URL 접근 (로그인 불필요) ✅ (App.jsx — 인증 가드 없음)
- [x] MyStar 선물 버튼 → 유형선택 → 공유 플로우 ✅ (코드 경로 확인)
- [x] GiftLanding CTA → `/wish` 이동 ✅ (`nav('/wish')` 확인)
- [ ] **모바일(Android/iOS) 전체 플로우 테스트** — 푸르미르님 직접 필요 (코드로 대체 불가)
- [ ] **VITE_KAKAO_JS_KEY** Render 대시보드 설정 필요 (render.yaml 미포함, 미설정 시 공유 fallback으로 동작)
- [ ] **NicePay 환경변수 차이 추적** — 과거 성공 상태와 현재 차이 확인
  - `NICE_CLIENT_KEY` 값이 `YSTRAVEL1m`(MID)인지 확인 (Render 대시보드)
  - `NICE_SECRET_KEY` 88자가 과거 성공 당시와 동일한 값인지 확인 (팀 이력 or NicePay 관리자)
  - 위 두 값이 과거 성공 값과 같다면 → **이름만 연결하면 해결** (`NICEPAY_CLIENT_ID`, `NICEPAY_SECRET_KEY`로 추가)
- [ ] **Render 환경변수 3종 설정** — MerchantKey 확보 후
  - `NICEPAY_CLIENT_ID` = NICE_CLIENT_KEY 값 (MID)
  - `NICEPAY_MERCHANT_KEY` = 발급받은 64자 hex 값
  - `NICEPAY_RETURN_URL` = `https://app.dailymiracles.kr/nicepay/return`
- [ ] Render 재배포 → 서버 로그 NicePay 설정 3줄 ✅ 확인
- [ ] 결제 플로우 실검증 (결제창 → 콜백 → PAID → 이미지 생성)

---

## 다음 기능 후보

- 별 성장도 시각화 (항해 로그 누적 → 별 밝기 증가)
- Push Notification / 일일 리마인더
- 은하 탐험 UX 개선

---

## 핵심 파일 경로

```
routes/wishRoutes.js                  ← 소원 API + 신호등 + summary_line
routes/dreamtownRoutes.js             ← DreamTown 전체 API (최신 마이그레이션: 039)
routes/dtEngineRoutes.js              ← DEC-2026-0331-001 Core Engine API (/api/dt/engine/)
routes/nicepayRoutes.js               ← NicePay 결제 콜백 + 결제 활성화
server.js                             ← coreAnalyzeHandler
public/daily-miracles-result.html     ← 결과 화면
public/red-support.html               ← RED 랜딩
public/dt-landing.html                ← 소원꿈터 퍼널 1 (공개 입구)
public/dt-wish.html                   ← 소원꿈터 퍼널 2 (소원 입력)
public/dt-star-born.html              ← 소원꿈터 퍼널 3 (별 탄생)
public/dt-upgrade.html                ← 소원꿈터 퍼널 4 (플랜 선택 + 결제)
services/miracleScoreEngine.js        ← 기적지수 계산
services/messageProvider.js           ← 메시지 발송 허브
services/dtArtifactWorker.js          ← 소원그림 생성 워커 (결제 게이트 포함)
services/dtNarrativeWorker.js         ← 서사 생성 워커
services/dtOrchestratorWorker.js      ← Aurora5 오케스트레이터 워커
services/dt/                          ← Core Engine 서비스 모음
  starService.js                      ← Star Engine (소원→별→log→artifact)
  wisdomGenerator.js                  ← Aurora5 지혜 생성
  choiceService.js                    ← 선택 기록
  narrativeService.js / narrativeBuilder.js ← 서사 엔진
  artifactService.js                  ← Artifact 큐 관리
  logService.js                       ← dream_log CRUD
  orchestrator/                       ← dtOrchestrator, decisionEngine, agentRunner
  agents/                             ← starAgent, careAgent, kWisdomAgent, narrativeAgent, monetizationAgent
dreamtown-frontend/src/pages/         ← MyStar, StarDetail, GiftLanding 등
dreamtown-frontend/src/components/    ← MilestoneBar 공통 컴포넌트
database/migrations/045~048           ← DEC-2026-0331-001 마이그레이션 4종
docs/gpt/                             ← GPT Knowledge 7종 (Code Architect GPT 업로드용)
scripts/verify_payment_gate.js        ← P0 결제 게이트 검증 스크립트
```

---

## P0 결제 게이트 — 구현 상세

### 반영 파일
| 파일 | 변경 내용 |
|------|----------|
| `services/dtArtifactWorker.js` | `checkPaymentStatus(starId)` 함수 추가, `processOne()` 상단에 게이트 삽입 |
| `routes/dtEngineRoutes.js` | `assertPaymentConfirmed(starId)` 헬퍼 추가, `POST /artifact` 진입 시 호출 |

### 핵심 쿼리
```sql
SELECT np.status
FROM dt_dream_logs dl
JOIN nicepay_payments np ON np.order_id = (dl.payload->>'order_id')
WHERE dl.star_id = $1
  AND dl.payload->>'event' = 'upgrade_checkout_started'
  AND np.status = 'PAID'
LIMIT 1
```

### 시나리오 / 검증 결과 (2026-04-03, 실 DB)

| 시나리오 | 경로 | 결과 |
|---------|------|------|
| 미결제 → POST /artifact | `assertPaymentConfirmed()` throw | ✅ 402 반환 |
| 미결제 → 워커 폴링 | `checkPaymentStatus()` = false | ✅ pending 복귀, attempts 원복, PAYMENT_REQUIRED 로그 |
| PAID 삽입 → 워커 폴링 | `checkPaymentStatus()` = true | ✅ 게이트 통과, 이미지 생성 진행 |

### attempts 원복 설계
```js
SET status='pending', attempts=GREATEST(0, attempts-1)
```
- 워커가 pick 시 `attempts+1` → 게이트 실패 시 `-1` 원복
- `GREATEST(0, ...)` — 언더플로우 방지
- 결과: 결제 미확인 상태에서는 max_attempts(3) 소진 없음

### 남은 리스크
| 리스크 | 수준 | 대응 |
|--------|------|------|
| 마이그레이션 045~048 미반영 (운영 DB) | 🔴 HIGH | 배포 전 반드시 실행 |
| NicePay SDK URL 불일치 | ~~🟡 MED~~ | ✅ 해소 (주석 통일) |
| NicePay 환경변수 이름 불일치 (NICE_*키 ↔ NICEPAY_*코드) | 🔴 HIGH | 과거 성공 이력(MID=YSTRAVEL1m) 있음. NICE_CLIENT_KEY=YSTRAVEL1m 여부, NICE_SECRET_KEY가 과거 성공 당시 값과 동일한지 확인 필요. 이름만 연결하면 해결될 수도 있음 |
| 워커 3종 server.js 미등록 가능성 | 🟡 MED | server.js에서 `.start()` 호출 여부 확인 |
| order_id 없이 결제한 별 (레거시) | 🟢 LOW | dt_dream_logs에 upgrade_checkout_started 없으면 영구 pending → 수동 처리 필요 시 별도 스크립트 |

---

## 절대 규칙

1. **코드 수정 = Claude Code만**
2. **메시지 발송 = messageProvider.js 경유만**
3. **금지 표현**: 사주, 점술, 관상, 운세, 대운, 궁합
4. **point_ledger** — append-only, UPDATE/DELETE 금지
5. **마이그레이션 순번** — 현재 048, 다음은 049

---

## summary_line 룰 (빠른 참조)

| traffic_light | current_stage | summary_line |
|--------------|--------------|-------------|
| GREEN | 감정 정리(1) | 지금은 마음을 차분히 정리하며 다음 걸음을 준비하기 좋은 상태예요 |
| GREEN | 방향 정리(2) | 지금은 방향을 하나로 좁혀 첫 움직임을 준비하기 좋은 흐름이에요 |
| GREEN | 실행 시작(3) | 지금은 아주 작은 실행을 시작하기 좋은 상태예요 |
| GREEN | 유지 회복(4) | 지금은 기존 습관을 꾸준히 이어가는 것이 가장 중요한 상태예요 |
| YELLOW | 감정 정리(1) | 지금은 해결보다 마음의 무게를 먼저 알아보는 것이 중요한 상태예요 |
| YELLOW | 방향 정리(2) | 마음은 앞서 있지만, 무엇부터 할지 기준을 정하는 것이 먼저예요 |
| YELLOW | 실행 시작(3) | 실행할 힘은 있지만, 시작점을 더 작게 만드는 것이 필요한 상태예요 |
| YELLOW | 유지 회복(4) | 지금은 더 앞으로 나가기보다, 흔들린 리듬을 다시 고르게 만드는 것이 먼저예요 |
| RED | 전체 | 미노출 → /red-support.html |

---

## 업데이트 방법

이 파일은 **작업 완료 후 매번 업데이트**한다.
- 완료 항목 → 이력 테이블에 한 줄 추가
- 즉시 해야 할 것 갱신
- 절대로 삭제하지 말고 누적 업데이트
