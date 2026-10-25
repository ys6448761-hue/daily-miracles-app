# 맞춤 항로 V0.1 — HTTP Integration Gate Evidence

**Date**: 2026-10-25  
**Branch**: docs/custom-route-v01-runtime-gate (main 대비)  
**Status**: HTTP_MOCK_VERIFIED

---

## 판정

```
HTTP_MOCK_VERIFIED
- Express HTTP 경로 실행: PASS (supertest + 실제 JWT 인증)
- 운영 DB 쓰기: 없음 (sessionService.createSession mock)
- GPT 호출: 없음 (contextExtractionService mock)
- 실제 브라우저 제출 / Production 동작: UNVERIFIED (별도 필요)
```

---

## 격리 환경

| 항목 | 처리 방식 |
|------|-----------|
| Express 라우팅 | **실제 실행** (`routes/travelInputRoutes.js` 마운트) |
| JWT 인증 미들웨어 | **실제 실행** (서명 검증 포함, mock 없음) |
| sessionService.createSession | mock → INSERT 없음 |
| contextExtractionService | mock → GPT 호출 없음 |
| travelGuideService.recommend | mock → DB 쿼리 없음 |
| sharedJourneyService | mock |
| database/db | mock (query 함수) |

---

## 테스트 결과: 8/8 PASS

**파일**: `tests/soul/soulCustomRouteV01HttpGate.test.js`  
**실행**: `npx jest --testPathPatterns="soulCustomRouteV01HttpGate"`

| ID | 검증 항목 | 결과 |
|----|-----------|------|
| HT-1 | 토큰 없음 → 401 AUTHENTICATION_REQUIRED | **PASS** ✅ |
| HT-2 | 유효하지 않은 JWT → 401 INVALID_CREDENTIAL | **PASS** ✅ |
| HT-3 | message 없음 → 400 | **PASS** ✅ |
| HT-4 | "하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘." → 200 + places | **PASS** ✅ |
| HT-5 | 응답에 session_id 포함 (`sessionService.createSession` 반환값) | **PASS** ✅ |
| HT-6 | `recommend` 호출 시 `must_visit=['hamel_lighthouse','hyangiram']` | **PASS** ✅ |
| HT-7 | `recommend` 호출 시 `time_available_minutes=270` (치환 없음) | **PASS** ✅ |
| HT-8 | 빈 문자열 message → 400 | **PASS** ✅ |

---

## 실제 실행 로그 (HT-4/5/6/7 공통)

```
[TRAVEL_INPUT_EVENT] {
  session_id: 'http-test-session-abc123',
  input_message: '하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘.',
  extracted_people_type: 'solo',
  recommendations_count: 2
}
```

`[SOUL_ROUTE_SKELETON_ERROR] Cannot read properties of null (reading 'route_id')`  
→ routeSkeletonService mock null 반환으로 인한 non-fatal 예외. 기존 테스트 동일 패턴.

---

## 검증된 HTTP 경로

```
POST /api/dt/travel/input/text
  └─ requireAuthenticatedPrincipal      ← 실제 JWT 서명 검증 실행
       ├─ 토큰 없음 → 401               ← HT-1 PASS
       ├─ 잘못된 토큰 → 401             ← HT-2 PASS
       └─ GUEST JWT (실제 서명) → 통과
            └─ req.body.message 검증
                 ├─ 없음 → 400          ← HT-3 PASS
                 ├─ 빈 문자열 → 400     ← HT-8 PASS
                 └─ 유효 메시지 → 처리
                      ├─ sessionService.createSession() [MOCKED]
                      ├─ handleTravelRequest()
                      │    ├─ sharedJourneyService → want=[하멜등대,향일암] [MOCKED]
                      │    ├─ contextExtraction → time=270, provenance=USER_EXPLICIT [MOCKED]
                      │    ├─ PLACE_ALIAS_MAP → hamel_lighthouse, hyangiram
                      │    └─ travelGuideService.recommend(must_visit, time=270) [MOCKED]
                      └─ res.json({ session_id, places, ... }) → 200  ← HT-4/5/6/7 PASS
```

---

## 잔존 UNVERIFIED 항목

| 항목 | 이유 |
|------|------|
| 실제 GPT 시간/장소 추출 | contextExtractionService MOCKED |
| Production DB 세션 생성 | sessionService MOCKED |
| CourseDisplay React 렌더링 | HTTP 응답 외 프론트엔드 영역 |
| travel_time_unverified UI 표시 | 브라우저 렌더 필요 |

→ 위 4항목은 Founder Render 배포 후 브라우저 직접 제출로만 완결 가능.

---

## 전체 격리 검증 요약

| 레이어 | 검증 방식 | 결과 |
|--------|-----------|------|
| 서비스 로직 (soyeowoolService) | Jest mock (MR-1~MR-6) | 6/6 PASS |
| HTTP 라우팅 + 인증 미들웨어 | supertest + 실제 JWT (HT-1~HT-8) | 8/8 PASS |
| 브라우저 렌더 + Production | —— | UNVERIFIED |
