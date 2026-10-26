# SOUL Vehicle Guidance Review V0.1

**Date**: 2026-10-26  
**Status**: SOUL_VEHICLE_GUIDANCE_REVIEW_READY  
**Scope**: 코드·프롬프트·데이터 분석 — SOUL 엔진 변경 없음  
**Trigger**: Founder 관찰 — 차량 여행 응답이 장소 추천 중심이며 실질적 차량 안내 부족

---

## §1 분석 대상 코드 경로

| 경로 | 파일 | 라인 |
|------|------|------|
| CAR_INFO 쿼리 판정 | `soyeowoolService.js` | 3048~3055 |
| has_car PARTIAL 응답 | `soyeowoolService.js` | 1884 |
| C-3 주차 보충 | `soyeowoolService.js` | 3318~3332 |
| 향일암 차량 쿼리 분기 | `soyeowoolService.js` | 1471~1474 |
| 오동도 차량 쿼리 분기 | `soyeowoolService.js` | 1467~1469 |
| Companion+차량 chip 경로 | `soyeowoolService.js` | 2925~2933 |
| 케이블카 PSQ parking | `soyeowoolService.js` | 337 |
| carNote 주입 (JOURNEY_CONTINUITY) | `soyeowoolService.js` | 2313 |

---

## §2 현재 차량 데이터 현황

### 2-1. 장소별 `parking_ko` / `parking_trust`

| 장소 | parking_ko | parking_trust | 비고 |
|------|-----------|---------------|------|
| 케이블카 (cablecar) | ✅ 있음 | (기본값) | 자산·돌산 양쪽 언급. NON_OFFICIAL 없음 → 사실상 NON_OFFICIAL |
| 돌산공원 (dolsan_nightscape) | ✅ 있음 | Founder 확인 | 1시간 무료, 이후 200원/10분 |
| 오동도 (odongdo) | null | UNKNOWN | 동백열차 정보만 있음 |
| 향일암 (hyangiram) | null | UNKNOWN | routes_ko·stairs_ko 있음 |
| 이순신광장 | null | UNKNOWN | |
| 종포해양공원 | null | UNKNOWN | |
| 하멜등대 | null | UNKNOWN | |

### 2-2. 케이블카 차량 관련 정보 현황

```
parking_ko:       '자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. 주차 위치·혼잡은 출발 정류장에 따라 달라요.'
roundtrip_ko:     '왕복권과 편도권 모두 있어요. 차를 가져오셨다면 한쪽 역에 주차하고 편도로 타신 후 반대편에서 이동하는 방법도 있어요.'
odongdo_connection_ko: '자산역(여수 쪽)에서 오동도 입구까지 버스 연계 동선으로 이어갈 수 있어요.'
```

**평가**: roundtrip_ko에 차량 편도 활용 팁이 포함되어 있음 — PSQ 경로(왕복/편도 질문)에서만 노출됨.

### 2-3. 향일암 차량 관련 정보 현황

```
parking_ko:   null  →  C-3 보충 미출력
parking_trust: UNKNOWN
routes_ko:    '두 경로로 오를 수 있어요. 한 쪽은 가파른 편이고 (약 10분), 다른 쪽은 상대적으로 완만해요 (약 15분).'
walking_ok:   '향일암은 경사와 계단 구간이 있어 걷는 부담이 생길 수 있어요.'
```

**평가**: 차량 사용자에게 parking 안내가 없어서 도착 후 도보 정보도 사실상 미전달.

---

## §3 응답 생성 경로별 동작 분석

### 3-1. CAR_INFO 쿼리 (`_isCarInfoQuery`)

**트리거 조건** (line 3051):
```js
/(차로|자차로|차량으로).*(가기|이동|좋은|추천|알려줘)/.test(message) ||
/주차.*정보/.test(message)
```

**동작**:
1. LLM Discovery 실행 → 장소 목록 반환
2. 시간 질문 제거 (`시간이 얼마나 남으셨어요?` strip)
3. C-3: `parking_ko` 있는 장소만 주차 정보 추가
4. course 표시 억제

**현재 응답 예시** (has_car=true, "차로 가기 좋은 곳"):
```
지금 상황에 맞는 곳을 찾아볼게요.
자차로 이동하기 좋은 곳을 골라봤어요.

· 돌산공원
· 향일암

주차 정보:
  · 공영주차장이 있어요. 최초 1시간 무료, 이후 10분당 200원이에요. (돌산공원)
```
→ 향일암은 parking_ko=null → 주차 정보 미출력

### 3-2. 향일암/오동도 순수 차량 쿼리

**트리거** (line 1467~1474):
```js
// Odongdo: /(차로|자가용으로)/.test(msg)
// Hyangiram: /(차로|자가용으로)/.test(msg)
```

**현재 응답**:
```
향일암 주변 주차 정보는 방문 전에 확인하는 것이 좋아요.
실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.
```
→ 사실상 정보 없음 알림만 반환. `routes_ko`(등반 경로) 미연계.

### 3-3. Companion+차량 chip (line 2925~2933)

**트리거**: `place_code` 있음 + `has_car` + companion 표현 병행

**동작**: `_PLACE_KNOWLEDGE` experience_ko + fit_ko 반환 후 주차 신중 안내 추가:
```js
if (parking_trust === 'UNKNOWN') {
  _ccParts.push(`차로 이동하시는군요. ${name} 인근 주차 정보는 방문 전에 확인해보세요.`);
}
```
→ UNKNOWN이라도 "방문 전 확인" 안내는 출력됨.

### 3-4. carNote 주입 (JOURNEY_CONTINUITY, line 2313)

```
오동도 → 케이블카 순서로 계획해볼게요. 차로 이동하시면 편하게 둘 다 보실 수 있어요.
```
→ 이동 편의 일반 언급만 있음. 탑승장 선택 안내 없음.

---

## §4 갭 분석

### G-1: 케이블카 탑승장 선택 안내 부재 [PRIORITY HIGH]

**현상**: parking_ko에 "자산·돌산 양쪽 모두 접근 가능"만 있음. 어떤 탑승장이 유리한지 맥락 안내 없음.

**의미**: 차량 여행자는 오동도 방면이면 자산탑승장, 돌산공원 방면이면 돌산탑승장이 동선상 유리함. 현재 응답으로는 이 선택 기준을 알 수 없음.

**관련 데이터 (기존 코드에 있음)**:
- `roundtrip_ko`: 편도 이용 + 한쪽 주차 팁 있음
- `odongdo_connection_ko`: 자산역 → 오동도 버스 연계 안내 있음

**노출 경로 현재**: PSQ "왕복/편도" 질문 시에만 roundtrip_ko 노출.  
**미노출 경로**: CAR_INFO / has_car discovery / JOURNEY_CONTINUITY carNote.

---

### G-2: 향일암 parking_ko 부재 → 차량 여행자 도착 후 안내 공백 [PRIORITY HIGH]

**현상**: `parking_ko: null` → C-3 보충 미출력 → 차량 여행자가 주차 정보를 못 받음.

**추가 공백**: `routes_ko`(등반 경로 2가지)가 차량 쿼리 경로와 미연결.  
현재 routes_ko는 Living Detail PSQ 경로("어떻게 올라가요?" 질문)에서만 노출됨.

**의미**: 향일암은 차로 가더라도 주차 후 반드시 도보 구간 존재. 이 연계 안내가 없으면 차량 여행자가 도착 후 당황할 수 있음.

---

### G-3: 오동도 parking_ko 부재 [PRIORITY MEDIUM]

**현상**: `parking_ko: null, parking_trust: UNKNOWN`. 오동도는 차량 접근이 제한적(방파제 진입 불가). 현재는 UNKNOWN fallback만 출력.

**의미**: 차량 여행자에게 "오동도는 방파제 입구까지 차로 이동 후 도보"라는 구조적 안내가 없음.

---

### G-4: CAR_INFO discovery next_options 공백 [PRIORITY LOW]

**현상**: CAR_INFO 응답 후 `TIME_OPTIONS` 제거 → next_options가 비거나 최소화됨.  
차량 여행자가 특정 장소 주차 정보를 더 보고 싶어도 다음 액션 유도 없음.

---

## §5 Before / After 예시

### 예시 A: 케이블카 차량 방문 (PSQ 경로, 코드 변경 없이 현재 노출 가능)

**Query**: "케이블카 어떻게 타요? 차 갖고 왔어요."

**BEFORE** (현재 동작):
```
자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요.
주차 위치·혼잡은 출발 정류장에 따라 달라요.
```

**AFTER** (roundtrip_ko 병행 노출 — PSQ "왕복" 분기에서 현재 코드가 지원):
```
왕복권과 편도권 모두 있어요.
차를 가져오셨다면 한쪽 역에 주차하고 편도로 타신 후 반대편에서 이동하는 방법도 있어요.

요금 참고: 일반캐빈 왕복 약 17,000원/편도 약 14,000원.
※ 공식 사이트 확인이 필요해요.
```
→ **현재 코드로 가능** — "왕복" / "편도" 키워드 포함 시 자동 노출.

---

### 예시 B: 향일암 차량 방문 (코드 변경 없이 현재 동작)

**Query**: "향일암 차로 가려고요."

**BEFORE** (현재 동작):
```
향일암 주변 주차 정보는 방문 전에 확인하는 것이 좋아요.
실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.
```

**이상적 응답** (엔진 변경 없이 data 보완만으로 가능 여부: **UNKNOWN — 주차 데이터 미확인**):
```
향일암 주변 주차 정보는 방문 전에 확인하는 것이 좋아요.
실제 이용 가능 여부와 요금은 시점에 따라 달라질 수 있어요.

향일암은 두 경로로 오를 수 있어요.
한 쪽은 가파른 편이고 (약 10분), 다른 쪽은 상대적으로 완만해요 (약 15분).
경사와 계단 구간이 있으니 이동 여건을 미리 살펴보세요.
```
→ `routes_ko`를 차량 쿼리 분기에 추가 연결 — **소규모 코드 변경** (이번 작업 범위 외).

---

### 예시 C: has_car chip → 장소 추천 (현재 동작 확인)

**Query**: has_car chip 클릭 (no place_code)

**BEFORE / CURRENT**:
```
지금 상황에 맞는 곳을 찾아볼게요.
자차로 이동하기 좋은 곳을 골라봤어요.

· 돌산공원
· 향일암

주차 정보:
  · 공영주차장이 있어요. 최초 1시간 무료, 이후 10분당 200원이에요. 방문 전 현장 안내판을 확인해보세요. (돌산공원)
```
→ 향일암 주차 미출력 (parking_ko=null이라 C-3 보충 없음). 탑승장 안내 없음.

---

## §6 제안 Follow-up 질문 (1개)

**케이블카 탑승장 선택 보조 질문:**

사용자가 케이블카 + 오동도를 함께 계획할 경우, 탑승장 선택이 동선 효율에 영향을 줌.  
현재 `odongdo_connection_ko`에 자산역 → 오동도 연계 정보가 이미 있음.

**제안 질문** (PSQ "왕복/편도" 분기 또는 JOURNEY_CONTINUITY carNote 이후):
```
케이블카 타신 후 오동도도 생각하고 계세요?
자산역(여수 쪽) 탑승장이 오동도 방향으로 이어지는 동선이에요.
```

→ **코드 변경 불필요** — 이미 `odongdo_connection_ko` 데이터 존재. 현재 PSQ "오동도" 키워드 매칭 시 노출됨.  
→ next_options에 `'오동도도 보고 싶어요'` 추가 여부 → **별도 Founder Decision 필요**.

---

## §7 코드 변경 없이 개선 가능한 범위 (Data Gap)

| 갭 | 현재 상태 | 개선 방법 | 코드 변경 |
|----|---------|---------|---------|
| 향일암 parking_ko | null | 주차장 정보 수집 후 DB/knowledge 업데이트 | 불필요 (data만) |
| 오동도 parking_ko | null | 방파제 구조·주차 구조 확인 후 업데이트 | 불필요 (data만) |
| 케이블카 탑승장 선택 | roundtrip_ko에 팁 있으나 노출 범위 제한 | PSQ "왕복/편도" 질문 유도 next_option 추가 | 소규모 변경 |
| 향일암 routes_ko 차량 연계 | PSQ 경로만 노출 | 차량 쿼리 분기에 추가 | 소규모 변경 |

---

## §8 GOVERNANCE_HOLD 사항 (변경 불가)

- `_estimateTravelTime()` V0 Stub 유지 — Travel Time Matrix 미구현
- CAR GOVERNANCE_HOLD 유지 — 실제 이동시간 추정 제공 불가
- 미검증 주차 정보 확정 표현 불가 — UNKNOWN은 항상 "방문 전 확인" 응답 유지

---

## §9 결론

**현재 잘 작동하는 것:**
- 케이블카: PSQ 경로에서 roundtrip_ko (편도 차량 팁) + parking_ko (양쪽 탑승장) 노출 가능
- 돌산공원: parking_ko Founder 확인 → C-3 자동 보충 작동
- Companion+차량 chip: UNKNOWN 장소도 "방문 전 확인" 안내 출력
- CAR_INFO: 시간 질문 제거 + course 억제 + 주차 보충 작동

**실질적 공백:**
- 향일암·오동도 parking_ko 없음 → 차량 여행자 주차 안내 공백
- 향일암 차량 쿼리에서 routes_ko(등반 경로) 미연결
- 케이블카 탑승장 선택 기준이 특정 질문 없이는 노출 안 됨
- JOURNEY_CONTINUITY carNote가 "차로 편하게 둘 다 보실 수 있어요" 수준 — 탑승장/동선 안내 없음
