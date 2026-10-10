# SOUL suitable_for Option C — Evidence V0.1

**Document ID:** SOUL-OPTION-C-EVIDENCE-V0.1  
**Status:** PRODUCTION_LIVE — Merge SHA afcecc4  
**Date:** 2026-10-10  
**Session:** MEET-20261010-003 연계 (Option C 구현 + 검증 + Production 배포)

---

## 1. 변경 분류

**REPAIR** — `suitable_for` 태그 의미(추천 어노테이션)와 `_passesCompanion` 동작(하드 안전 게이트) 간 의미 불일치 복구

---

## 2. 변경 파일 (2개)

| 파일 | 변경 위치 | 줄 수 |
|------|---------|-------|
| `services/travelGuideService.js` | `_passesCompanion` — family_elderly soft warning + pojangmacha 정책 제외 | +8줄 |
| `services/travelGuideService.js` | `_generateReason` — `elderlyFitUnverified` 변수 + 긍정 주장 억제 분기 | +3줄 |
| `services/soyeowoolService.js` | `_generateSoulMessage` 서명 — `allPlaceWarnings` 파라미터 추가 | +1줄 |
| `services/soyeowoolService.js` | family_elderly `secondLine` — 경고 유무 조건부 분기 | +4줄 |
| `services/soyeowoolService.js` | 호출 지점 — `allPlaceWarnings` 계산 + 전달 | +4줄 |

**DB 변경:** 없음 / **Schema 변경:** 없음 / **신규 테이블:** 없음

---

## 3. 핵심 로직 변경

### 3-A. `_passesCompanion` (travelGuideService.js)

**이전:**
```javascript
if (people_type === "family_elderly" && companion_constraints?.has_elderly) {
  return suitableFor.includes("elderly");  // 하드 제외
}
```

**이후:**
```javascript
if (people_type === "family_elderly" && companion_constraints?.has_elderly) {
  if (place.code === 'romantic_pojangmacha') return false;  // 정책 제외
  if (!suitableFor.includes('elderly')) {
    place._warnings.push('elderly_fit_unverified');  // 소프트 경고
    return true;  // 제외하지 않음
  }
}
```

### 3-B. message_ko 분기 (soyeowoolService.js)

| 상황 | 이전 | 이후 |
|------|------|------|
| elderly_fit_unverified 있음 | "이동 부담이 적은 곳으로 골라봐요" | "함께 둘러볼 만한 장소를 찾아봤어요. 일부 장소는 어르신 동반 방문 정보가 아직 확인되지 않았으니, 방문 전에 확인해 주세요." |
| 경고 없음 | "이동 부담이 적은 곳으로 골라봤어요" | "함께 둘러볼 만한 곳을 찾아봤어요." |

---

## 4. 검증 결과

### 4-A. 단위 테스트 (실제 실행)

| 테스트 | 방법 | 결과 |
|--------|------|------|
| T1 hyangiram family_elderly 제외 | `_passesAccessibility` 직접 호출 | ✅ PASS |
| T2 dolsan_nightscape 포함 + elderly_fit_unverified | `_passesCompanion` 직접 호출 | ✅ PASS |
| T3 lee_soon_shin_plaza 경고 없이 포함 | `_passesCompanion` 직접 호출 | ✅ PASS |
| T5 dolsan_nightscape family_with_kids 제외 | `_passesCompanion` 직접 호출 | ✅ PASS |
| T5b odongdo family_with_kids 허용 | `_passesCompanion` 직접 호출 | ✅ PASS |
| T6 low_walking walking_burden_unknown 독립 동작 | 직접 검증 | ✅ PASS |
| T7 wheelchair verified_no 차단 | `_passesAccessibility` 직접 호출 (disability:'wheelchair') | ✅ PASS |
| T7b wheelchair unknown 포함 + 경고 | `_passesAccessibility` 직접 호출 | ✅ PASS |
| T8 pojangmacha family_elderly 제외 | `_passesCompanion` 직접 호출 | ✅ PASS |
| T8b pojangmacha couple 허용 | `_passesCompanion` 직접 호출 | ✅ PASS |
| T_REASON_1 unverified 추천 사유 긍정 주장 없음 | `_generateReason` 직접 호출 | ✅ PASS |
| T_REASON_2 verified 추천 사유 긍정 주장 포함 | `_generateReason` 직접 호출 | ✅ PASS |
| MSG-1 경고 없는 message_ko | 로직 직접 검증 | ✅ PASS — "이동 부담이 적은 곳" 문구 없음 |
| MSG-2 elderly_fit_unverified message_ko | 로직 직접 검증 | ✅ PASS — "이동 경로나" 없음, "어르신 동반 방문 정보" 포함 |
| MSG-3 curPlaceName+isDiscovery 경고 없음 | 로직 직접 검증 | ✅ PASS |

**합계: 15/15 PASS**

### 4-B. 직접 서버 API 테스트

| 테스트 | 방법 | 결과 |
|--------|------|------|
| KR/YEOSU family_elderly 추천 (recommend endpoint) | 실제 서버 localhost:5000 | ✅ PASS — 2개 반환, hyangiram/pojangmacha 미포함 |
| jaisan_park / jungang_market warnings | SOUL SUCCESS 실제 응답 | ✅ PASS — elderly_fit_unverified 없음 (elderly 태그 있음) |
| SOUL SUCCESS 경로 — elderly_fit_unverified 없는 message_ko | Node.js HTTP → localhost:5000/api/dt/travel/input/text | ✅ PASS — "함께 둘러볼 만한 곳을 찾아봤어요." (이동 부담 주장 없음) |
| elderly_fit_unverified warnings (recommend endpoint, exclude 어르신 장소) | 실제 서버 — exclude elderly-tagged places | ✅ PASS — cablecar/sky_tower: ["elderly_fit_unverified",...] |
| 추천 사유 — elderly_fit_unverified 시 긍정 주장 없음 | 실제 서버 응답 reason 필드 | ✅ PASS — "45분 정도 둘러볼 수 있어요" (어르신 적합 주장 없음) |

**참고: Bash 셸 인코딩 문제 발견**
Windows Bash에서 한국어 직접 전송 시 인코딩 깨짐 → `_isDiscoveryIntent`가 항상 `false` → CLARIFICATION.
Node.js HTTP 직접 요청으로 우회. 실제 서버(UTF-8)는 정상 동작.

### 4-C. 미검증 항목

| 항목 | 미검증 이유 | 상태 |
|------|-----------|------|
| SOUL SUCCESS 경로 `message_ko` — elderly_fit_unverified 있을 때 | elderly_fit_unverified 장소(cablecar 등)가 어르신 태그 있는 장소보다 점수 낮아 top-3 미진입. recommend endpoint로 필터 동작 확인 + 단위 테스트 MSG-2 PASS. | **로직 검증 완료, SOUL 엔드포인트 직접 도달 불가** |
| dolsan_nightscape top-3 노출 | Experience Cluster Diversity 필터로 top-3 미진입 (dolsan_area 클러스터) | **미검증 (필터 동작은 정상)** |

---

## 5. 안전 필터 미변경 확인

```
git diff services/travelGuideService.js | grep -E "^\+.*_passesAccessibility|^\+.*family_with_kids|^\+.*has_kids"
→ 출력: (코드 주석 1줄만 — 실제 로직 미변경)
```

- `_passesAccessibility` 함수: 미변경 ✓
- `_passesTransport` 함수: 미변경 ✓
- G2 low_walking 필터: 미변경 ✓
- `family_with_kids` kids_ok 하드 필터: 미변경 ✓ (Option C 경계 유지)

---

## 6. API / message_ko / 추천 사유 정합성

| 레이어 | elderly_fit_unverified 있을 때 | 경고 없을 때 |
|--------|-------------------------------|------------|
| `places[].warnings` | `['elderly_fit_unverified']` | `[]` |
| `_generateReason` | 긍정 문구 없음 | "어르신과 함께 방문하기 좋아요" |
| `message_ko` | "어르신 동반 방문 정보가 아직 확인되지 않았으니..." | "함께 둘러볼 만한 곳을 찾아봤어요." |

**3개 레이어 모순 없음 ✓**

---

## 7. Architecture Guard

```
ARCHITECTURE GUARD: PASS

변경 범위: travelGuideService.js 2곳 + soyeowoolService.js 3곳
코드/DB/Schema 위험: 없음
안전 필터 (_passesAccessibility, G2): 미변경 확인
family_with_kids 필터: Option C 경계 유지 확인
LOCKED SSOT 충돌: 없음
단위 테스트: 15/15 PASS
직접 API: 5/5 PASS (서버 재시작 후 Node.js HTTP 요청으로 검증)
```

---

## 8. 잔여 위험

| 위험 | 상태 |
|------|------|
| SOUL SUCCESS + elderly_fit_unverified message_ko 동시 실서버 | 미완료 — 로직 검증 완료 (elderly 태그 장소 점수 우위로 직접 도달 불가) |
| dolsan_nightscape top-3 현장 노출 | 미완료 — _passesCompanion 동작 단위 검증 완료 |
| dolsan_nightscape _PLACE_KNOWLEDGE 미추가 | COVERAGE_GAP 유지 |
| enforce_admins=false AIL Gate bypass | UNRESOLVED (구조적) |

---

## 9. Production Smoke Test (2026-10-10)

**Merge SHA:** afcecc4  
**Target:** daily-miracles-app.onrender.com

| 테스트 | 항목 | 결과 |
|--------|------|------|
| T1 | 서비스 정상 응답 (health) | ✅ PASS |
| T2 | SOUL SUCCESS family_elderly + 120분 | ✅ PASS — 2 places |
| T3 | elderly_fit_unverified 없음 (elderly 태그 장소) | ✅ PASS — jaisan_park/jungang_market |
| T4 | message_ko — 이동 부담 주장 없음 | ✅ PASS |
| T5 | hyangiram 제외 (물리 안전 필터) | ✅ PASS |
| T6 | elderly_fit_unverified 경고 전달 (non-elderly 장소) | ✅ PASS — cablecar/sky_tower |
| T7 | 추천 사유 긍정 어르신 주장 없음 | ✅ PASS |
| T8 | pojangmacha family_elderly 정책 제외 | ✅ PASS |

**Production Smoke Test: 8/8 PASS**

---

*작성: 2026-10-10 / Code (Claude Code) | 배포: afcecc4*
