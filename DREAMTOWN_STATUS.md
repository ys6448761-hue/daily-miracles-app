# DREAMTOWN_STATUS.md
# 새 담당자/새 세션은 이 파일부터 읽을 것

Last Updated: 2026-10-17
담당: Claude Code (Lumi / Code Master)

---

## ★ PROJECT PHOENIX — ACTIVE (2026-09-18 ~ 현재)

> **아래 섹션이 현재 활성 작업입니다.** 2026-04-04 이후 내용은 Project Phoenix 시대입니다.

### 필수 읽기 순서 (신규 세션)

```
1. memory/MEMORY.md (동일 머신)                        ← 최신 Project State + Current Next Action
   또는 이 파일 §★ Current Next Action (원격 클론 환경) ← git-tracked 스냅샷
2. docs/product/SOUL_PRODUCT_VISION_V0_1.md            ← Active Product Vision (SOUL 상세 경험)
3. docs/governance/ARCH_GUARD_PROTOCOL_V0_1.md         ← Architecture Guard PILOT rev3 (충돌 판정)
4. docs/governance/meetings/ (최신 Meeting Record)     ← 결정 근거 + Founder Decision 상태
5. docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md  ← D2 결정
```

### ★ Current Next Action (exactly 1) — Updated: 2026-10-18

**Founder — Cable Car SOUL Phase 1 Production Deploy 승인 대기**
- Cablecar Phase 1 Minimal: MERGED — PRODUCTION_DEPLOY_PENDING (PR #74 @7951fd0, 2026-10-18)
- Production Live SHA: `896e4d5ec37dc1937ee361c3090bfded2b7d1e6e` / Render: `dep-db9v233ncjis73ap46cg` (불변)
- CBL-1~CBL-9 52/52 PASS / Regression 183/183 PASS / AIL Gate PASS / docker-smoke PASS

---

### 완료된 작업 기록 (2026-10-18)

- **Cablecar SOUL Phase 1 Minimal: MERGED — PRODUCTION_DEPLOY_PENDING (2026-10-18)**
  - PR #74 Squash Merge SHA: `7951fd0cee8ba9d3bfebf1359f4401b9003f8db8`
  - Scope: C1a (experience_ko) + C2a ("어때요" PSQ 분기) — Founder C-1/C-5 승인 문구 정확 반영
  - 신규: soulCablecarPhase1.test.js CBL-1~CBL-9 + GV-01~GV-07 52/52 PASS
  - 회귀: Hyangiram 66 / Odongdo 57 / YiSunSin 39 / CaseC 21 = 183/183 PASS
  - AIL Gate PASS / docker-smoke PASS / Production 배포 미실행 (Founder 별도 승인 필요)
  - 제외: JOURNEY_PREFERENCE / Companion Chip / parking_trust / DB·Schema — Phase 2 후보

- **Hyangiram SOUL Phase 1: CLOSED — DEPLOYED_AND_VERIFIED (2026-10-18)**
  - PR #71 Squash Merge SHA: `6965910d4a95d0f740e3a275857d0bb416048dc6` (2026-10-17T21:26Z / KST 2026-10-18 06:26)
  - Production SHA: `896e4d5ec37dc1937ee361c3090bfded2b7d1e6e` / Render: `dep-db9v233ncjis73ap46cg` / LIVE: 2026-10-18 07:07 KST
  - 신규: soulHyangiramPhase1.test.js 66/66 PASS
  - 회귀: Case C 21/21 / YiSunSin Phase 2 39/39 / Odongdo Phase 1 57/57 PASS / 합계: 183/183 PASS
  - H-1~H-7: 7/7 PASS / R-1~R-4: 4/4 PASS / Guardrail violations: 0
  - H-1 experience_ko / H-2 계단 경고+걷기질문 / H-3 아이이동안내 / H-4 walking_ok / H-5 주차UNKNOWN / H-6 부모+차 / H-7 아이+차
  - Guardrails: "공영주차장 2시간 무료" 미노출 / "쉽게 오를 수 있어요" 미노출 / 10분/15분 단정 없음 / "괜찮아요" 미노출
  - Advisory: R-1에서 has_car 미설정에도 주차 안내 노출 — NON_BLOCKING (UNKNOWN 비단정, Phase 2 후보)

### 완료된 작업 기록 (2026-10-17)

- **Odongdo SOUL Phase 1: CLOSED — DEPLOYED_AND_VERIFIED (2026-10-17)**
  - PR #67 Squash Merge SHA: `12b70516b99bc8cc29766ca61d69ac9b1fbb1700` (2026-10-17T05:25Z)
  - Production SHA: `199bcf6e14943a1b394b95bcf02b2e77f17f7d69` / Render: `dep-db9gq76q1p3s7386qn00` / LIVE: 14:55 KST
  - O-1~O-7: 7/7 PASS / R-1~R-4: 4/4 PASS / Total: 11/11 PASS / Guardrail violations: 0
  - Guardrails: "이동 부담이 적어요" 미노출 / 주차 비단정 / 동백열차 단정 없음 — 전 시나리오 PASS
  - 신규 57/57 PASS / 회귀 117/117 PASS (YiSunSin Phase 2 39/39 + Case C 21/21)

- **YiSunSin Square SOUL Phase 2: DEPLOYED_AND_VERIFIED (2026-10-17)**
  - PR #64 MERGED @d272003 / PR #65 MERGED @284c5cb
  - Render Deploy: `dep-db9fdotg1s2s738gt6l0` / SHA: `284c5cb97030b4abe6b1e9aab7af18a07ce38c37` / Live: 13:20 KST
  - Fix A: `_handleJourneyDecision` placeCodeHint → S-4/S-6 JOURNEY_PREFERENCE lee_soon_shin_plaza 분기
  - Fix B: `_PLACE_KNOWLEDGE.lee_soon_shin_plaza` `parking_trust: 'UNKNOWN'` → S-5 주차 비단정 안내
  - Fix C: `_yisunsinVehicleBypass` + Companion Chip 차량 맥락 (lee_soon_shin_plaza 전용 격리)
  - Scope Fix: `_ccPlace.code === 'lee_soon_shin_plaza'` 조건 추가 (다른 장소 차량 문구 미적용)
  - 신규 테스트: `soulYisunsinPhase2.test.js` (39/39 PASS) / Case C 회귀 21/21 PASS
  - Runtime QA 10/10 PASS: S-4~S-8 + S-1~S-3 + Case C + Isolation
  - Advisory: S-7/S-8 next_options 비어있음 (Guardrail 위반 아님, Phase 3 후보)

- **SOUL Case C 접근성 질문 Production 종료: DEPLOYED_AND_VERIFIED (Founder Decision 2026-10-17)**
  - Production SHA: `d7ac07fc97dec7e23a2730450827bc41c966f139`
  - Render Deploy ID: `dep-db9chre7bikc73fhhc7g`
  - Live 시각: 2026-10-17 10:04 KST
  - **Founder Browser Runtime Evidence:**
    - 테스트 장소: 향일암 Living Detail
    - 입력: "부모님과 함께 가려고 해요."
    - 확인된 SOUL 응답: "향일암에 대해 알려드릴게요." / "경사나 계단이 있어요. 이동 동선을 미리 확인해보세요." / "걷기 많이 힘드신가요?"
    - 기존 장소 안내 유지: PASS
  - RC1 Guard PASS / RC2 접근성 후속 질문 PASS
  - **Case C: DEPLOYED_AND_VERIFIED**

- **SOUL Case C RC2 Companion Chip next_options 수정: DEPLOYED**
  - PR #61 MERGED @521afda / Merge Commit: `86d684620486ad13a55aeac3cb04c8342529ac3d`
  - Merge 시각: 2026-10-17T00:53:46Z (KST 오전 9:53)
  - 변경: `services/soyeowoolService.js` (+6줄) — `_ccAccessibilityQ` 조건 + `next_options` 추가
  - 신규 테스트: `soulCaseCCompanionGuard.test.js` RC2 8케이스 (21/21 PASS)
  - AIL Gate PASS / docker-smoke PASS
  - Root Cause 2: `_isCompanionChipQuery`=TRUE → `_buildPlaceLookupClientPayload` spread → `next_options:[]`
  - Fix: `family_elderly + physical_difficulty='high' + !mobility_constraint` → `next_options:['걷기 많이 힘드신가요?']`
  - Production 배포: `d7ac07f` (dep-db9chre7bikc73fhhc7g) DEPLOYED

- **SOUL Case C RC1 Companion Guard 수정: DEPLOYED**
  - PR #59 MERGED @f3bb1e2 / Merge Commit: `a1a4621ee5be832232af58cbc4d51898c2e085f8`
  - Merge 시각: 2026-10-16T23:56:43Z (KST 오전 8:56)
  - 변경: `services/soyeowoolService.js` (1+1-) — `_ldGuardBypass` 정규식에 `가려고` 추가
  - 신규: `tests/unit/soulCaseCCompanionGuard.test.js` (13케이스 / 13/13 PASS)
  - AIL Gate PASS / docker-smoke PASS
  - Root Cause 1: "부모님과 함께 가려고 해요" → `_ldGuardBypass=false` → Living Detail Fallback → `next_options:[]`
  - Fix: `가려고` 패턴 추가 → `_ldGuardBypass=true` → Companion Chip Response 경로 진입
  - Production 배포: `d7ac07f` (dep-db9chre7bikc73fhhc7g) DEPLOYED

- **SOUL next_options 코스 응답 시간 질문 억제: CLOSED (Founder Decision 2026-10-17)**
  - PR #57 MERGED @efc0a60 (main) — Founder FINAL MERGE AUTHORIZATION 2026-10-17
  - Commit: `b53d474` / Merge Commit: `efc0a60`
  - 변경: `services/soyeowoolService.js` (+5줄) — `_buildResultEnvelope` 후 `result.next_options = []` 조건부 억제
  - 가드: `_isCourseMsg && explicit_context.place_code && tgResult?.places?.length >= 2`
  - SOUL 65/65 PASS / AIL Gate PASS / docker-smoke PASS
  - PR #55(soulMessage 텍스트 제거)와 합산 시 코스 후 시간 질문 텍스트·버튼 모두 억제
  - Production 배포: 없음 (Render 자동 배포 미실행 확인 — deployment `[]`)
  - **UNVERIFIED:** 실제 Production 브라우저 SOUL API 응답 확인

### 완료된 작업 기록 (2026-10-16)

- **SOUL Time Honesty Message Repair: CLOSED (Founder Decision 2026-10-15)**
  - PR #55 MERGED @22a3e16 / Render LIVE 2026-10-15 16:28 KST
  - 변경: `services/soyeowoolService.js` (BE 1파일, 3줄) — FE·DB·API 계약 무변경
  - CLOSED 범위: 경로 A(PARTIAL default "2시간 기준" 제거) / 경로 B(코스 요청 후 시간 질문 제거)
  - Jest SOUL 65/65 PASS / AIL Gate PASS / docker-smoke PASS
  - **OPEN:** `next_options[0]` '시간이 얼마나 남으셨어요?' 코스 요청 후 미억제 — 최소 수정안 확인 완료 (soyeowoolService.js 2줄 추가), Founder 승인 대기
  - **UNVERIFIED:** 브라우저 실 API SOUL 응답 확인

- **SSOT-ROUTE-003 별빛 해안길 Draft 생성 (2026-10-16)**
  - 파일: `docs/ssot/episodes/SSOT-ROUTE-003_Starlight_Coastal_Walk.md`
  - Status: Draft (Confirmed 전)
  - Founder Confirmed: 이순신광장→하멜등대 / 1.2km / 18~25분 / 기본감상형 40~60분 / 여유체험형 120~150분 / 중간 선택 경험 정의
  - 기존 SSOT 충돌 없음: SSOT-ROUTE-001·002·LOC-001·TIME-001 미변경
  - Draft → Confirmed 조건: 1.2km 지도 실측 + 별빛혜택 정의 + Founder 최종 승인

### 완료된 작업 기록 (2026-10-15)

- **CourseDisplay Time Honesty Repair: CLOSED (Founder Decision 2026-10-15)**
  - PR #53 MERGED @5937d17 / Render LIVE 2026-10-15 15:33 KST (dep-db8765jncjis73et8acg)
  - 변경: `CourseDisplay.jsx` (FE 1파일, +29/-36) — 백엔드 무변경
  - CLOSED 범위: 코드 수정 · PR Merge · Production 배포 · 이순신광장 D1~D4 화면 검증
    - D1: 숫자 코스 배지 제거 PASS / D2: 이동시간 반복 제거 + footer 1회 PASS
    - D3: 내부 경고 코드 비노출 PASS / D4: 장소 체류시간 합계 180분 표시 PASS
  - **OPEN:** SOUL 상위 응답 "대략 2시간 기준" 문구 ↔ 체류시간 합계 180분 불일치 — 별도 검토 필요
  - **UNVERIFIED:** 케이블카 상세 회귀 / 부모님·여행코스 칩 순서 회귀 / 실제 이동시간·총 소요시간
  - AIL Gate PASS / docker-smoke PASS

- **Architecture Guard A+B 적용 완료 (2026-10-10)**
  - Option B: PR 필수 (`required_approving_review_count=0`) APPLIED ✓
  - Option A: `enforce_admins=true` APPLIED ✓
  - AIL Gate (`contexts: ["AIL Gate"]`, `strict: true`) 보존 ✓
  - Evidence: `docs/architecture/ARCH_GUARD_A_PLUS_B_ENFORCEMENT_EVIDENCE_V0_1.md`
- **기존 위험 해소:**
  - `enforce_admins=false` UNRESOLVED → **RESOLVED** ✓
  - 관리자 직접 Push 차단 → **적용** ✓
- **RUNTIME UNVERIFIED (OPEN):**
  - 직접 Push 실제 차단 / AIL Gate FAIL Merge 차단 / Founder self-merge 동작
  - → 다음 실제 기능 PR에서 자연 확인
- SOUL suitable_for Option C: **PRODUCTION_LIVE** @afcecc4 (유지)
- 미해결: SOUL+elderly_fit_unverified message_ko 직접 관찰 / dolsan_nightscape top-3 (구조적, 유지)
- 전체 상세: `docs/governance/meetings/MEET-20261010-003.md`
- **STOP Guard Rule Recovery: CLOSED** (PR #35 @4f99dc0, 2026-10-11)
  - Guardian Preflight 필수 발행 의무 / Founder 구두 승인 ≠ 면제 (CLAUDE.md)
  - 컴팩션 재개 = 신규 세션 (Current Next Action 선확인 의무)
  - Architecture Guard §4 [7] Current Next Action 정렬 항목 추가
  - 잔여 위험: 자동 차단 미구현 (AI 지침 준수 의존)
- **무여정 메인 4개 카테고리 칩 PR #42: MERGED (2026-10-13)**
  - Merge SHA: eadcbde9a8bcdb6c67ebe43fc1afc53eca0266ec / Feature: 788962b
  - 변경 파일 2개: `MuyojeongHomePage.jsx`, `soyeowoolService.js`
  - C-1~C-4 로컬 API 검증 PASS / AIL Gate PASS / docker-smoke PASS
  - Vercel 2건 FAIL (비필수 체크) / Render Production 미배포 (미승인)
  - Architecture Guard Runtime 부분 확인: enforce_admins=true 작동 ✓ (Founder PR 통해 Merge)
  - Architecture Guard Runtime 미확인: AIL Gate FAIL → Merge 차단 동작 (다음 PR로 이월)
  - Evidence: `docs/architecture/MUYOJEONG_CHIP_C3C4_PR42_EVIDENCE.md`
- **YiSunSin Square SOUL Phase 1: CLOSED (Founder Decision 2026-10-13)**
  - PR #40 PSQ Fix A/B/C MERGED @0a19a291 ✓
  - PR #39 YiSunSin chip variants + parseContext MERGED @a4511a96 ✓
  - Production Live SHA: a4511a96f4e8a3ad0f922c55f4a61c5e66a26d42
  - S-1~S-3 (PSQ): 3/3 PASS / 부모님·가족·차량 컨텍스트 칩 UI 확인 ✓
  - S-4~S-8 일반 fallback: Journey Decision → Living Detail Fallback 경로 확인
    - 원인: `_extractGoldenPlaceCode`가 이순신광장 미인식 + JOURNEY_PREFERENCE가 explicit_context 미사용
    - Phase 1 범위에 맥락별 SOUL API 응답 미포함 → Phase 2로 분리 (Founder 결정)
- **중앙시장 Policy B: CLOSED (Founder Decision 2026-10-15)**
  - PR #52 MERGED @50cd3d6 / Render LIVE 2026-10-15 14:03 KST
  - 대상: `jungang_market` — TG 추천 후보·Fallback·PLACE_LOOKUP·PSQ 전면 차단
  - 변경: `travelGuideService.js` + `fallbackService.js` + `soyeowoolService.js` (3파일, +36/-3)
  - Production P1~P10 10/10 PASS (일반·부모님·아이·차량·직접질문·회귀)
  - DB 및 Route Corpus 보존 / 수산물특화시장 별도 장소로 구분
  - **UNVERIFIED:** PLACE_EXCLUDED 브라우저 렌더링 / Fallback 실제 DB 실행 / 부모님→코스 실제 순차 칩 전이
  - **후속 개선 후보:** 중앙시장 포함 요청 시 제외 이유 안내 / `_ELDERLY_MSG_EXCLUDE` 코드 정리(COSMETIC)
  - Architecture Guard Runtime 확인: AIL Gate FAIL → Merge 차단 동작 **최초 자연 확인 완료** ✓
    - 초기 PR body에 [AIL] 섹션 누락 → AIL Gate FAILURE → Merge 차단 → body 보완 후 재통과

### Founder Decision — 케이블카 왕복 기본 원칙 SOUL-CABLECAR-001 (2026-10-15 등록)

**상태:** CANDIDATE (SSOT 승격 전 검증 필요)

| 결정 항목 | 확정값 |
|---|---|
| 탑승 방식 | 왕복 기본 (자산→돌산→자산) |
| 편도/왕복 질문 | 개인 코스에서 묻지 않음 |
| 단체 편도 | 단체 견적 영역 별도 계산 |
| 왕복 후 출발 기점 | 자산탑승장 (`cablecar`, 오동도로 61-11) |

적용 코스: `이순신광장 → 자산탑승장 → 케이블카왕복 → 자산탑승장 → 향일암`

**기존 결정과 충돌 없음** — Founder Route #001 ROUND_TRIP(2026-09-21)과 방향 일치.

**UNVERIFIED 유지:** `avg_stay_minutes=45` (cablecar DB)가 왕복 탑승(25~30분) + 돌산 체류를 포함하는지 미확인.

**Evidence 확보 현황 (2026-10-15 갱신):**

| Edge | From | To | Mode | 값 | Source | 상태 |
|---|---|---|---|---|---|---|
| EA | 이순신광장 | 자산탑승장(케이블카) | CAR | 10분 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| EB | 자산탑승장(케이블카) | 향일암 | CAR | 36분 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| EC | 이순신광장 | 자산공원 | CAR | 9분 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| ED | 자산공원 | 중앙시장 | CAR | UNKNOWN | — | jungang_market 추천 제외로 측정 불필요 |
| EE | 오동도 | 자산탑승장(케이블카) | CAR | 3분 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| EF | 자산탑승장(케이블카) | 수산물특화시장 | CAR | 7분 | FOUNDER_EVIDENCE | UNVERIFIED — 수산물특화시장 DB 미등록, place_code 없음 |

EA+EB 합계: 46분 / 일반 코스 체류(180) + 이동(46) = 226분 (참고값, Runtime 미적용)

저장: `docs/knowledge/YEOSU_FOUNDER_ROUTE_001_TIME_EVIDENCE.md` [UPDATE 2026-10-15] 섹션 추가 완료

**남은 검증 항목:**
- EA~EE 네이버/카카오맵 실측 검증 (현재 UNVERIFIED)
- 역방향 Edge 별도 측정 필요
- 케이블카 avg_stay_minutes=45 왕복 적절성 UNVERIFIED
- `_estimateTravelTime()` 교체: EA~EE 확보됐으나 검증 완료 후 별도 Preflight 필요

---

### Phase 2 Open Item — YiSunSin SOUL 맥락별 대화 응답 (2026-10-13 등록)

이순신광장 SOUL의 companion/vehicle context를 SOUL API 응답에 반영하는 작업.

검토 대상:
- `explicit_context.place_code` 기반 JOURNEY_PREFERENCE 처리 (`_handleJourneyDecision` 수정)
- `_extractGoldenPlaceCode`에 이순신광장 추가 또는 `explicit_context` fallback 활용
- parents / vehicle / family 컨텍스트별 응답 분기
- 확인되지 않은 장소 정보에 대한 안전한 응답 (guardrail 유지)
- S-4~S-8 응답 품질 검증 (현재 진단 Evidence 재사용 가능)

기존 Evidence: 이번 세션 진단 (soyeowoolService.js 1758~1976 + 2400~2474 경로 확인 완료)
착수 조건: Founder 기능 기획 결정 + Guardian Preflight READY
후속 Next Action 후보: YiSunSin SOUL Phase 2 착수 (Founder 기능 기획 결정 대기 — 현재 OPEN)

### Production-Live (Project Phoenix)

| Surface | Commit | Status |
|---|---|---|
| PlaceBasicInfo V0.2 (6 fields) | 17aebc8 | PRODUCTION_LIVE |
| Judgment V0.1 backend | d3e7f0e | PRODUCTION_LIVE |
| UI-001 explicit_context contract | 294c55c | PRODUCTION_LIVE |
| Soyeowool Phase 1 | 1f5afab | PRODUCTION_LIVE |
| SOUL Short Op Gate V0.1 | b11f012 | PRODUCTION_LIVE |
| **SOUL Living Detail Navigation R1** | **77cac69** | **PRODUCTION_LIVE — Founder QA ALL PASS** |
| **SOUL suitable_for Option C** | **afcecc4** | **PRODUCTION_LIVE — Smoke Test 8/8 PASS** |
| **YiSunSin chip variants + image reorder** | **d95fd45** | **PRODUCTION_LIVE (코드) — 차량 Content QA 미완료** |
| **PSQ Fix A/B/C (주차 우선순위·거북선·이중어미)** | **0a19a291** | **PRODUCTION_LIVE — S-1~S-3 3/3 PASS** |
| **YiSunSin SOUL Phase 1 (chip variants + parseContext)** | **a4511a96** | **PRODUCTION_LIVE — Phase 1 CLOSED @2026-10-13** |
| **무여정 메인 4개 카테고리 칩 (C-3/C-4)** | **788962b** | **MERGED to main (PR #42, eadcbde) — Render Production 미배포 (미승인)** |
| **상세 Living Detail Nav 제거** | **e0df2bf** | **MERGED to main (PR #47) — PRODUCTION_LIVE @bcf391f** |
| **상세 조건 전달 Repair (handleDetailChipClick ec 누적)** | **0cba566** | **MERGED to main (PR #48) — PRODUCTION_LIVE @bcf391f** |
| **상세 여행코스 Repair (must-visit + C4 guard + transport 재주입)** | **9261908** | **PRODUCTION_LIVE (PR #49, bcf391f, 2026-10-15) — B 5/5 PASS, C 2/2 PASS** |
| **중앙시장 Policy B (TG·Fallback·PSQ·PLACE_LOOKUP 제외)** | **4abae6e** | **PRODUCTION_LIVE (PR #52, 50cd3d6, 2026-10-15 14:03 KST) — P1~P10 10/10 PASS** |
| **CourseDisplay Time Honesty Repair (D1~D4)** | **b4876eb** | **PRODUCTION_LIVE (PR #53, 5937d17, 2026-10-15 15:33 KST) — D1~D4 Founder Screenshot PASS** |
| **SOUL Time Honesty Message Repair** | **82a404e** | **PRODUCTION_LIVE (PR #55, 22a3e16, 2026-10-15 16:28 KST) — 경로 A·B 수정. next_options 미억제 OPEN** |
| **SOUL next_options 코스 응답 시간 질문 억제 (PR #57)** | **efc0a60** | **MERGED to main (5be00bf) — PRODUCTION_LIVE @5be00bf028a1fc1e (dep-db99p9navr4c73d8fg4g, 2026-10-17 오전 6:55 KST, Founder Evidence)** |
| **SOUL Case C Companion Guard 가려고 추가 (PR #59)** | **f3bb1e2** | **MERGED to main (a1a4621) — PRODUCTION_LIVE @199bcf6e** |
| **Odongdo SOUL Phase 1 (O-1~O-7)** | **12b7051** | **PRODUCTION_LIVE @199bcf6e (dep-db9gq76q1p3s7386qn00, 2026-10-17 14:55 KST) — 11/11 PASS** |
| **Hyangiram SOUL Phase 1 (H-1~H-7)** | **6965910** | **PRODUCTION_LIVE @896e4d5 (dep-db9v233ncjis73ap46cg, 2026-10-18 07:07 KST) — H-1~H-7 7/7 PASS / R-1~R-4 4/4 PASS** |

### Staging-Only (SoulCableCarPage, 9 elements)

QUESTION_COMPOSER / SOUL_MESSAGE / PLACE_HERO / ESSENTIAL_INFO / FOR_ME / SOUL_JUDGMENT / JOURNEY / COST / DEPTH

### Key Phoenix Architecture Documents

| Document | Path | Purpose |
|---|---|---|
| SOUL Product Vision | `docs/product/SOUL_PRODUCT_VISION_V0_1.md` | Canonical product direction |
| D2 Decision | `docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md` | Living Detail Page decision |
| Traveler Baseline | `docs/architecture/PHOENIX_HANDOVER_2026_09_21_TRAVELER_BASELINE_SHARED_JOURNEY.md` | Level 4 핵심 |
| Aurora3/Route | `docs/architecture/PHOENIX_HANDOVER_2026_09_21.md` | Aurora3 + Route knowledge |

---

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
