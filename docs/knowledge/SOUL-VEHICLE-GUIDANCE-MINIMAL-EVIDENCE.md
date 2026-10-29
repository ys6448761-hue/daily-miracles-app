# SOUL Vehicle Guidance Minimal Evidence

**Date**: 2026-10-27  
**Status**: SOUL_VEHICLE_GUIDANCE_MINIMAL_READY  
**Founder Decision**: FOUNDER_VEHICLE_GUIDANCE_SIMPLIFIED  
**Scope**: `_PLACE_KNOWLEDGE` 코드 상수 수정 — DB/Schema/엔진/API 변경 없음

---

## §1 변경 내용

### 1-1. 향일암 `parking_ko` (BEFORE)

```js
// BEFORE
parking_ko: null,
parking_trust: 'UNKNOWN',
```

응답 (H-5 차량 쿼리 분기, line 1472):
```
향일암 주변 주차 정보는 방문 전에 확인하는 것이 좋아요.
실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.
```

### 1-2. 향일암 `parking_ko` (AFTER)

```js
// AFTER
parking_ko: '혼잡할 때는 임포주차장을 이용한 후 도보로 이동하는 방법도 있어요. 실제 운영 상황과 이용 가능 여부는 방문 당일 현장에서 확인해보세요.',
parking_trust: 'NON_OFFICIAL',
```

응답 (H-5 차량 쿼리 분기 → parking_ko 우선 사용):
```
혼잡할 때는 임포주차장을 이용한 후 도보로 이동하는 방법도 있어요.
실제 운영 상황과 이용 가능 여부는 방문 당일 현장에서 확인해보세요.
```

---

### 1-3. 케이블카 `parking_ko` (BEFORE)

```js
// BEFORE
parking_ko: '자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. 주차 위치·혼잡은 출발 정류장에 따라 달라요.',
```

C-3 보충 출력:
```
· 자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. 주차 위치·혼잡은 출발 정류장에 따라 달라요.
```

### 1-4. 케이블카 `parking_ko` (AFTER)

```js
// AFTER
parking_ko: '자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. 자산 탑승장은 주차 후 엘리베이터로 이동해요. 돌산 탑승장은 주차 후 도보로 이동해요.',
```

C-3 보충 출력:
```
· 자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. 자산 탑승장은 주차 후 엘리베이터로 이동해요. 돌산 탑승장은 주차 후 도보로 이동해요.
```

---

## §2 차량 쿼리 분기 수정 (line 1472)

```js
// BEFORE
else if (code === 'hyangiram' && /(차로|자가용으로)/.test(msg)) {
  answer = `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요. 실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.${verifyNote}`;
}

// AFTER
else if (code === 'hyangiram' && /(차로|자가용으로)/.test(msg)) {
  answer = knowledge.parking_ko
    ? `${knowledge.parking_ko}${verifyNote}`
    : `${name} 주변 주차 정보는 방문 전에 확인하는 것이 좋아요. 실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.${verifyNote}`;
}
```

→ `parking_ko`가 설정된 경우 내용을 노출, null이면 기존 fallback 유지.

---

## §3 안전 경계 (적용된 금지 사항)

| 항목 | 상태 |
|------|------|
| 임의 이동시간/거리 생성 | ❌ 미포함 |
| 주차 가능 대수 생성 | ❌ 미포함 |
| 항상 임포주차장 이용해야 한다는 표현 | ❌ "혼잡할 때는 … 방법도 있어요" 표현 사용 |
| parking_ko DB 변경 | ❌ 코드 상수만 수정 |
| SOUL 추천 로직 변경 | ❌ 추천 경로 무변경 |
| CAR GOVERNANCE_HOLD 해제 | ❌ `_estimateTravelTime()` V0 Stub 유지 |
| 검증되지 않은 주차장 운영정보 추가 | ❌ Founder 현장 경험만 반영, "현장 확인" 문구 유지 |

---

## §4 Founder 제공 정보 출처

| 장소 | 정보 | 출처 |
|------|------|------|
| 향일암 | 혼잡 시 임포주차장 → 도보 이동 가능 | Founder 현장 경험 (2026-10-27) |
| 케이블카 | 자산 탑승장: 엘리베이터 / 돌산 탑승장: 도보 | Founder 제공 (2026-10-27) |

---

## §5 테스트 결과

| 테스트 | 결과 |
|--------|------|
| `soulHyangiramPhase1.test.js` | ✅ PASS (내부 fixture 사용, 코드와 격리) |
| `soulCablecarPhase1.test.js` | ✅ PASS |
| `soulCarInfoSeparation.test.js` | ✅ PASS |
| 합계 (3 suite) | 125/125 PASS |
| 전체 회귀 | 639/640 PASS (R20 PRE-EXISTING 유지) |

**격리 주의**: 단위 테스트는 자체 fixture(`parking_ko: null`)를 사용하므로 parking_ko 변경이 테스트에 직접 반영되지 않음.  
실제 응답 검증은 Founder 브라우저 확인 필요 (URL: `http://localhost:5000`).

---

## §6 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `services/soyeowoolService.js` | hyangiram.parking_ko 추가 / parking_trust UNKNOWN→NON_OFFICIAL |
| `services/soyeowoolService.js` | cablecar.parking_ko 탑승장별 접근 방식 추가 |
| `services/soyeowoolService.js` | H-5 차량 분기 → parking_ko 우선 사용 |
