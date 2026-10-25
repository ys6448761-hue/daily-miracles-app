# 맞춤 항로 V0.1 — Runtime Integration Gate Evidence

**Date**: 2026-10-25  
**Branch**: main (post-merge SHA `98550fb`)  
**Status**: RUNTIME_SERVICE_PASS / HTTP_PATH_UNVERIFIED

---

## 격리 환경 판정

| 항목 | 상태 | 근거 |
|------|------|------|
| HTTP 경로 실행 | 불가 | `sessionService.createSession()` → `INSERT INTO travel_guide_sessions` → 운영 DB 쓰기 |
| DATABASE_URL (`.env`) | 운영 DB 2개 | Supabase(최고 운영) + Render PostgreSQL(운영), 로컬 분기 없음 |
| 서비스 로직 실행 | **가능** | Jest mock 패턴 — 기존 테스트 동일 방식 |
| soyeowoolService 실제 코드 | **실행됨** | mock 제외 대상 아님 |

---

## 테스트 결과: 6/6 PASS

**파일**: `tests/soul/soulCustomRouteV01Integration.test.js`  
**실행**: `npx jest --testPathPatterns="soulCustomRouteV01Integration"`

| ID | 검증 항목 | 결과 |
|----|-----------|------|
| MR-1 | `buildSoulMessage([하멜등대, 향일암], 270)` → `"하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘."` | **PASS** ✅ |
| MR-2 | 향일암 EXPLICIT → `must_visit_place_ids` 에 `hyangiram` 포함, 원문 없음 | **PASS** ✅ |
| MR-3 | 하멜등대+향일암 동시 → `hamel_lighthouse` + `hyangiram` 모두 포함 | **PASS** ✅ |
| MR-4 | `time_available_minutes=270` 치환 없이 `travelGuideService.recommend` 전달 | **PASS** ✅ |
| MR-5 | 270분 `USER_EXPLICIT` → Time Gate 미발동, CLARIFICATION 아님, 코스 정상 반환 | **PASS** ✅ |
| MR-6 | `hyangiram→hamel_lighthouse` 역방향 `VERIFIED_TRAVEL_EDGES` 미포함 → `travel_time_unverified` 예상 (정적 검증) | **PASS** ✅ |

보조: `soulTravelTimeDisplay` 46/46 PASS (fitStatus 로직 포함)

---

## 검증된 코드 경로 (서비스 계층)

```
buildSoulMessage(["하멜등대","향일암"], 270)
  ↓  문자열: "하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘."
  
sharedJourneyService.extractSharedJourney(message)
  → want: [{place_hint:'하멜등대', specificity:'EXPLICIT'}, {place_hint:'향일암', specificity:'EXPLICIT'}]

soyeowoolService._supplementDomainFromSharedJourney()
  → PLACE_ALIAS_MAP['하멜등대'] = 'hamel_lighthouse'  ✅
  → PLACE_ALIAS_MAP['향일암']   = 'hyangiram'         ✅ (신규 확인)
  → must_visit_place_ids = ['hamel_lighthouse', 'hyangiram']

contextExtractionService.parseUserMessage()
  → time_available_minutes = 270 (GPT 직접 추출, 치환 없음)  ✅
  → _provenance.time_available_minutes = 'USER_EXPLICIT'

soyeowoolService Time Gate 판정
  → USER_EXPLICIT → CLARIFICATION 미발동 → travelGuideService.recommend 호출  ✅

travelGuideService.recommend(domainCtx)
  → must_visit_place_ids: ['hamel_lighthouse', 'hyangiram']
  → time_available_minutes: 270

travelGuideService._buildJourneyBlocks()
  → hamel→hyangiram: P2 verified (op=45)  ✅
  → hyangiram→hamel: 역방향 미검증 → travel_time_unverified ⚠️ (코스 순서 의존)
```

---

## 미검증 잔존 항목

| 항목 | 이유 | 대안 |
|------|------|------|
| HTTP Auth 경로 (`requireAuthenticatedPrincipal`) | 격리 불가 | Founder 배포 후 브라우저 직접 제출 |
| 실제 GPT 시간 추출 ("270분 코스") | GPT mock | 기존 T-1~T-8 골든 테스트가 시간 추출 검증 |
| CourseDisplay 렌더링 (React) | 서버 측 검증 범위 외 | T1~T7 Visual QA 이미 PASS |
| `travel_time_unverified` 화면 표시 | HTTP/렌더 경로 외 | Founder QA 시 확인 |

---

## 판정

```
RUNTIME_SERVICE_VERIFIED: MR-1~MR-6 6/6 PASS
HTTP_PATH_UNVERIFIED: 격리 환경에서 운영 DB 쓰기 없이 HTTP 경로 실행 불가
PRODUCTION_QA_REQUIRED: Founder Render 배포 후 실제 제출 테스트로 완결
```

**Next Action**: Founder가 Render에 수동 배포 후 `/muyojeong` 페이지에서  
`하멜등대 + 향일암` 선택 → `270분` 입력 → 제출 → CourseDisplay 응답 확인
