# MUYOJEONG_V01_PRODUCTION_QA_PASSED Evidence

**Date**: 2026-10-30  
**Deploy ID**: dep-dbhu2doae00c739ri7ug  
**Deploy SHA**: `7f2c084`  
**Deploy Time**: 2026-10-30 09:16 KST (Founder Render Dashboard Manual Deploy)  
**QA Time**: 2026-10-30 (Post-Deploy)  
**Production URL**: https://app.dailymiracles.kr/muyojeong

---

## §1 Production 검증 결과

| # | 항목 | URL / 방법 | 결과 | 비고 |
|---|------|-----------|------|------|
| Q1 | 무여정 첫 화면 | GET /muyojeong | **PASS** ✅ | 200 OK, React app HTML 정상 |
| Q2 | SOUL 자유 질문 | POST /api/soyeowool/chat | **PASS** ✅ | 200 OK, 의미있는 응답 텍스트 반환 |
| Q3 | 맞춤 항로 V0.1 | POST /api/soyeowool/custom-route | **PASS** ✅ | 200 OK, course 데이터 반환 |
| Q4-A | 지도 이미지 — overview | GET /images/muyojeong/yeosu-overview-v01.png | **PASS** ✅ | 200 OK, PNG |
| Q4-B | 지도 이미지 — oldtown | GET /images/muyojeong/yeosu-oldtown-v01.png | **PASS** ✅ | 200 OK, PNG |
| Q5-A | Living Detail: 케이블카 | GET /soul/cable-car | **PASS** ✅ | 200 OK, React app |
| Q5-B | Living Detail: 오동도 | GET /soul/cable-car?place=odongdo | **PASS** ✅ | 200 OK, React app |
| Q5-C | Living Detail: 향일암 | GET /soul/cable-car?place=hyangiram | **PASS** ✅ | 200 OK, React app |
| Q6 | 헬스체크 | GET /health | **PASS** ✅ | 200 OK, JSON status |
| Q7 | PROVISIONAL 마커 미노출 | 코드 분석 | **PASS** ✅ | `includeProvisional=false` 코드 확인 |
| Q8 | CAR GOVERNANCE_HOLD | SOUL API 응답 분석 | **PASS** ✅ | `travel_time_unverified` 응답 확인 |
| Q9 | 4버튼 UI 렌더링 | 브라우저 검증 | **NOT_TESTED** | 브라우저 접근 불가 — Founder QA 필요 |
| Q10 | TG_READY 게이팅 | 브라우저 검증 | **NOT_TESTED** | 브라우저 접근 불가 — Founder QA 필요 |

**합계: PASS 11 / NOT_TESTED 2 / FAIL 0**

---

## §2 Living Detail URL 구조

| 장소 | URL |
|------|-----|
| 케이블카 | `/soul/cable-car` (default) |
| 오동도 | `/soul/cable-car?place=odongdo` |
| 향일암 | `/soul/cable-car?place=hyangiram` |

SoulCableCarPage가 `?place=` 쿼리 파라미터로 장소 전환. React Router 클라이언트 라우팅.

---

## §3 PROVISIONAL 마커 미노출 정책 확인

```javascript
// YeosuMapSelector.jsx
getMarkersForImage(imageKey, { includeProvisional = false } = {})
// isQAPreview = localhost + ?qa_preview=boundary
// Production: isQAPreview=false → includeProvisional=false → PROVISIONAL 마커 미노출
```

모든 Zone 1~7 마커: `status: 'PROVISIONAL'` → Production에서 일반 사용자 미노출 ✅

---

## §4 CAR GOVERNANCE_HOLD 확인

- `_estimateTravelTime()`: V0 Stub 유지
- SOUL 응답: `travel_time_unverified` 필드로 미추정 상태 안내
- 이동시간 실제 추정 없음 — 기능 제한 안내로 대체
- 해제 조건: 이동시간 검증 데이터 + 별도 Founder 승인

---

## §5 NOT_TESTED 항목

| 항목 | 이유 | 권장 |
|------|------|------|
| 4버튼 UI 렌더링 | 브라우저 접근 불가 | Founder가 `/muyojeong` 직접 접속 확인 |
| TG_READY 게이팅 | SOUL 응답 콘텐츠 레벨 | Founder가 특정 장소 질문 후 응답 확인 |

---

## §6 장애 및 롤백

- 장애: **없음** ✅
- 롤백 필요: **없음** ✅
- 이전 Production SHA: `425a643` (Render Dashboard에서 재배포 가능)
