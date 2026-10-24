# IMPL-PLAN-B-001 — Hotel-to-Starlight Nighttime Walk SOUL Answer V0.1

생성일: 2026-10-24
상태: PLAN_READY — 코드 착수 승인 대기 / 코드 수정 금지
근거: PREFLIGHT-PHASE-B-001 + Founder Decision 3건 (2026-10-24)
구현 허가 범위: 계획 수립 및 테스트 기준 확정 (코드 수정 / PR / Merge / Deploy 미승인)

---

## Founder Decision 3건 반영 요약

| 결정 | 반영 내용 |
|------|-----------|
| D1: Nighttime Walk Intent | 호텔명 불필요. "밤바다" + 걷기/산책/즐기기/코스 결합 패턴으로 제한 |
| D2: Route Distance | SSOT-ROUTE-003 1.2km 수치 미노출. 검증된 Evidence 구간값만 사용 |
| D3: Hotel Scope | 신라스테이 여수 1개만. 소노캄·베네치아 이번 구현 범위 제외 |

---

## A. 변경 파일 및 삽입 위치 (정밀)

### A-1. quoteContextService.js:15 (EXTEND)

**변경 대상:** `MVP_HOTELS` 딕셔너리

```js
// 현재 (변경 전)
const MVP_HOTELS = {
  '라마다': 'ramada',
  '라마다호텔': 'ramada',
  'ramada': 'ramada',
  '케니': 'kenny',
  '케니호텔': 'kenny',
  'kenny': 'kenny',
};

// 변경 후 — 신라스테이 추가 (D3: 단독)
const MVP_HOTELS = {
  '라마다': 'ramada',
  '라마다호텔': 'ramada',
  'ramada': 'ramada',
  '케니': 'kenny',
  '케니호텔': 'kenny',
  'kenny': 'kenny',
  '신라스테이': 'shinra_stay_yeosu',
  '신라스테이여수': 'shinra_stay_yeosu',
};
```

**isQuotable() 변경 없음:** `['ramada', 'kenny'].includes(hotel_code)` 유지 → 신라스테이 자동 견적 없음.

---

### A-2. soyeowoolService.js:1543 (EXTEND)

**변경 대상:** `_HOTEL_CODE_TO_KO` 딕셔너리

```js
// 현재
const _HOTEL_CODE_TO_KO = { ramada: '라마다', kenny: '켄싱턴 호텔' };

// 변경 후
const _HOTEL_CODE_TO_KO = {
  ramada: '라마다',
  kenny: '켄싱턴 호텔',
  shinra_stay_yeosu: '신라스테이 여수',
};
```

---

### A-3. soyeowoolService.js — 신규 함수 2개 (NEW)

**삽입 위치:** `_generateClarificationMessage` 정의 바로 앞 (현재 줄 ~1622 근처)

#### 함수 1: `_isNighttimeWalkQuery`

```js
// Phase B V0.1: 밤바다 산책/즐기기 feasibility 질문 감지
// D1 반영: 호텔명 불필요 / "밤바다" + 여행 의도 결합 패턴
// D1 반영: 차량 접근 질문(차로 가기 좋은) 과 분리
function _isNighttimeWalkQuery(message) {
  if (!message) return false;
  const hasNightSea = /밤바다/.test(message);
  const hasTravelIntent = /(걷|산책|즐길|즐기|코스|거닐|해안을|해변을)/.test(message);
  // D1: 차량 접근 패턴은 제외 (Travel Intelligence _isCarInfoQuery 와 의도 분리)
  const isCarAccess = /(차로|자차로|차량으로).*(가기|이동|좋은|추천)/.test(message);
  return hasNightSea && hasTravelIntent && !isCarAccess;
}
```

**패턴 검증:**

| 입력 | hasNightSea | hasTravelIntent | isCarAccess | 결과 |
|------|-------------|-----------------|-------------|------|
| "밤바다를 즐길 수 있을까요?" | true | true (즐길) | false | **true ✓** |
| "밤바다 산책할 수 있어요?" | true | true (산책) | false | **true ✓** |
| "밤바다 걷고 싶어요" | true | true (걷) | false | **true ✓** |
| "밤바다 코스 어때요?" | true | true (코스) | false | **true ✓** |
| "밤바다가 예뻐요?" | true | false | false | **false ✓** |
| "밤바다 야경 추천해줘" | true | false (야경) | false | **false ✓** (→ DISCOVERY 경로) |
| "밤바다를 즐기고 싶어요" | true | true (즐기) | false | **true** (단, DISCOVERY "_하고 싶" 먼저) |
| "차로 가기 좋은 밤바다 코스" | true | true (코스) | true | **false ✓** (차량 접근) |

**주의:** "밤바다를 즐기고 싶어요"는 `_isDiscoveryIntent`의 "하고 싶" 패턴에 먼저 걸림 → DISCOVERY 경로 발동 → `_isNighttimeWalkQuery` 미도달. 의도적으로 허용 (DISCOVERY가 적절한 응답 경로).

---

#### 함수 2: `_buildNighttimeWalkPayload`

```js
// Phase B V0.1: 밤바다 산책 안내 응답 빌더
// D2 반영: SSOT-ROUTE-003 1.2km 수치 미노출
// D3 반영: 신라스테이 전용 거리 조건부 추가
// D: 미검증 항목(야간 안전성, 복귀시간, 주차, 별빛혜택) 미포함
function _buildNighttimeWalkPayload(sessionId, message) {
  // D3: 신라스테이만 hotel-specific 거리 표시
  const hotelCode = quoteContextService._extractHotelCode(message || '');
  let hotelLine = '';
  if (hotelCode === 'shinra_stay_yeosu') {
    // D2: 검증된 Evidence값 (Founder 네이버 지도 2026-10-24, WALK 추천경로 26분/1.7km)
    hotelLine = '신라스테이에서 이순신광장까지 걸어서 약 26분(1.7km) 거리예요.\n';
  }

  const body = hotelLine
    + '이순신광장 해안을 따라 종포해양공원, 하멜등대까지\n'
    + '천천히 걸으며 여수 밤바다를 즐길 수 있어요.\n'
    + '종포해양공원에서 잠시 쉬어가고, 하멜등대에서 밤바다를 바라보는 코스예요.\n'
    + '돌아올 때는 같은 길을 걷거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.';

  return _buildClarificationPayload(sessionId, body);
}
```

---

### A-4. soyeowoolService.js — nonDiscovery 블록 삽입 위치 (NEW)

**삽입 위치:** nonDiscovery 레이블 블록 내부, `_generateClarificationMessage` 호출(줄 ~2921) 직전

```js
// Phase B V0.1: 밤바다 산책 의도 → 최소 답변 생성 (DISCOVERY/PLACE_LOOKUP 미연결 질문 처리)
if (_isNighttimeWalkQuery(message)) {
  return { ok: true, payload: _buildNighttimeWalkPayload(sessionId, message) };
}

const clarificationMsg = _generateClarificationMessage(soulContext, message, journeyCtxForClar);
```

**흐름 분석:**

```
사용자: "신라스테이 여수에 묵는데 차를 호텔에 두고 여수 밤바다를 즐길 수 있을까요?"

1. City Guard → PASS (여수)
2. needsTravelIntelligence:
   _isDiscoveryIntent → false ("즐길 수 있을까요" 미해당)
   _isJourneyPlanningIntent → false
   → false → nonDiscovery 블록 진입
3. nonDiscovery:
   _isCoursePendingTimeProvision → false
   [PSQ Gate, Living Detail, Companion Chip → miss]
   _isNighttimeWalkQuery("...밤바다를 즐길 수 있을까요?") → true (밤바다 + 즐길)
   → return _buildNighttimeWalkPayload(sessionId, message)
      hotelCode = _extractHotelCode("신라스테이 여수에 묵는데...") = 'shinra_stay_yeosu'
      → hotelLine = "신라스테이에서 이순신광장까지 걸어서 약 26분(1.7km) 거리예요.\n"
   → RESPONSE: 호텔 접근 + 해안 코스 안내
```

---

## B. 기대 응답 정의

### B-1. 대표 질문 (호텔명 있음)

**입력:** "신라스테이 여수에 묵는데 차를 호텔에 두고 여수 밤바다를 즐길 수 있을까요?"

**기대 응답:**
```
신라스테이에서 이순신광장까지 걸어서 약 26분(1.7km) 거리예요.
이순신광장 해안을 따라 종포해양공원, 하멜등대까지
천천히 걸으며 여수 밤바다를 즐길 수 있어요.
종포해양공원에서 잠시 쉬어가고, 하멜등대에서 밤바다를 바라보는 코스예요.
돌아올 때는 같은 길을 걷거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.
```

### B-2. 호텔명 없는 질문 (D1 반영: 호텔명 불필요)

**입력:** "밤바다를 즐길 수 있을까요?"

**기대 응답:**
```
이순신광장 해안을 따라 종포해양공원, 하멜등대까지
천천히 걸으며 여수 밤바다를 즐길 수 있어요.
종포해양공원에서 잠시 쉬어가고, 하멜등대에서 밤바다를 바라보는 코스예요.
돌아올 때는 같은 길을 걷거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.
```

(hotelLine 없음 — 호텔 미인식 시 범용 응답)

### B-3. 미등록 호텔명 있는 질문 (범용 처리)

**입력:** "소노캄에 묵는데 밤바다를 즐길 수 있을까요?"

**기대 응답:** B-2와 동일 (소노캄 미등록 → hotelCode null → 범용)

---

## C. 테스트 케이스 (NW 시리즈)

### C-1. 신규 기능 테스트 (NW-01 ~ NW-05)

| ID | 입력 | 예상 경로 | 기대 포함 | PASS 조건 |
|----|------|-----------|-----------|-----------|
| NW-01 | "신라스테이 여수에 묵는데 차를 호텔에 두고 여수 밤바다를 즐길 수 있을까요?" | `_isNighttimeWalkQuery` → nighttime walk | "26분" + "이순신광장" + "하멜등대" | 3개 모두 포함 |
| NW-02 | "밤바다를 즐길 수 있을까요?" | `_isNighttimeWalkQuery` → nighttime walk | "이순신광장" + "하멜등대" | 2개 모두 포함 / "26분" 미포함 |
| NW-03 | "밤바다 산책할 수 있어요?" | `_isNighttimeWalkQuery` → nighttime walk | "이순신광장" + "종포해양공원" | 2개 모두 포함 |
| NW-04 | "소노캄에 묵는데 밤바다를 즐길 수 있을까요?" | `_isNighttimeWalkQuery` → nighttime walk (범용) | "이순신광장" / "26분" 미포함 | "이순신광장" 포함, "26분" 미포함 |
| NW-05 | "밤바다 걷고 싶어요" | `_isDiscoveryIntent` "하고 싶" → DISCOVERY (기존) OR `_isNighttimeWalkQuery` | ADVISORY | 기존 동작 확인 (회귀 없음) |

### C-2. 미검증 항목 미포함 검증 (NW-SAFE 시리즈)

| ID | 검증 항목 | 기대 미포함 키워드 |
|----|-----------|-------------------|
| NW-SAFE-01 | 야간 안전성 | "안전", "위험", "밤에 안전" |
| NW-SAFE-02 | 복귀시간 | "돌아오는 시간", "복귀 [N]분", 역방향 수치 |
| NW-SAFE-03 | 주차 조건 | "주차 가능", "주차요금", "주차 무료" |
| NW-SAFE-04 | 별빛혜택 | "노래방 할인", "오락실", "분식" |
| NW-SAFE-05 | SSOT-ROUTE-003 수치 | "1.2km" (이순신광장~하멜등대 전체 미검증 수치) |

### C-3. 기존 기능 회귀 테스트 (NW-REG 시리즈)

| ID | 입력 | 예상 경로 | PASS 조건 |
|----|------|-----------|-----------|
| NW-REG-01 | "라마다 3명 10월 26일" | MVP_HOTELS ramada → 기존 견적/여정 흐름 | 기존 동작 유지 |
| NW-REG-02 | "케이블카 타고 싶어" | DISCOVERY 기존 동작 | `_isNighttimeWalkQuery` 미발동 |
| NW-REG-03 | "밤바다가 예뻐요?" | nonDiscovery → CLARIFICATION (기존) | `_isNighttimeWalkQuery` = false 확인 |
| NW-REG-04 | "밤바다 야경 추천해줘" | DISCOVERY 발동 (기존) | nighttime walk 미발동 |
| NW-REG-05 | "차로 가기 좋은 밤바다 코스" | `_isNighttimeWalkQuery` = false (isCarAccess=true) → CLARIFICATION | "26분" 미포함 |
| NW-REG-06 | "이순신광장 어때요?" | PLACE_LOOKUP (기존) | 기존 동작 유지 |
| NW-REG-07 | "하멜등대 가고 싶어" | DISCOVERY "하고 싶" | 기존 동작 유지 |
| NW-REG-FULL | 기존 soul.test.js 전체 | 기존 동작 유지 | 0건 신규 회귀 |

---

## D. 미검증 항목 처리 방침 (D2 반영)

| 항목 | 처리 방침 | 응답 포함 여부 |
|------|-----------|----------------|
| SSOT-ROUTE-003 전체 1.2km | UNVERIFIED — 수치 노출 금지 | 미포함 |
| 이순신광장→하멜등대 구간 거리 | 수치 대신 "해안을 따라" | 미포함 (수치) |
| 호텔 복귀 이동시간 | 역방향 자동 생성 금지 | 미포함 |
| 야간 안전성 | Evidence 없음 | 미포함 |
| 호텔 주차 가능 여부 | 미검증 | 미포함 |
| 별빛혜택 | PENDING_VERIFICATION | 미포함 |

**검증된 Evidence 사용 범위:**
- 신라스테이→이순신광장 WALK 26분/1.7km ✓ (Founder 네이버 지도 2026-10-24)
- 신라스테이→이순신광장 CAR 5분/1.9km ✓ (Founder 네이버 지도 2026-10-24 — 현재 응답에 미사용)
- 장소 감정 역할: 종포해양공원(쉼), 하멜등대(소원) ✓ (SSOT-LOC-001 Confirmed)

---

## E. 기존 경로 재사용 불가능 사유

| 경로 | 재사용 불가 이유 |
|------|-----------------|
| DISCOVERY | "즐길 수 있을까요" → `_isDiscoveryIntent` 미발동. 발동해도 장소 카드 추천 → targeted 답변 불가 |
| PLACE_LOOKUP | "밤바다" = 특정 장소 아님. PLACE_ALIAS_MAP 추가 시 잘못된 장소 매핑 |
| CLARIFICATION | 현재 최종 fallback. 실질 답변 없음 ("어떤 여행 계획?" 반환) |
| 기존 PSQ Gate | `explicit_context.place_code` 없음 → PSQ 미도달 |
| Journey Planning | "즐길 수 있을까요" = 건설 동사 없음 → `_isJourneyPlanningIntent` 미발동 |

**→ 신규 `_isNighttimeWalkQuery` 경로가 최소 필요 변경.**

---

## F. 호텔 인식 독립 테스트 (A 독립 검증)

| ID | 입력 | `_extractHotelCode` 반환값 | PASS 조건 |
|----|------|--------------------------|-----------|
| HA-01 | "신라스테이 여수에 묵는데" | `shinra_stay_yeosu` | null 아님 |
| HA-02 | "신라스테이여수 체크인" | `shinra_stay_yeosu` | null 아님 |
| HA-03 | "라마다 호텔 예약" | `ramada` | 기존 동작 유지 |
| HA-04 | "소노캄 여수에 묵는데" | `null` | null (D3: 미등록) |
| HA-05 | "isQuotable — 신라스테이" | `false` | ['ramada','kenny'] 조건 유지 |

---

## G. Implementation Status

| 항목 | 상태 |
|------|------|
| Founder Decision 3건 | 확정 (2026-10-24) |
| 삽입 위치 | `soyeowoolService.js` nonDiscovery 블록, `_generateClarificationMessage` 호출 직전 |
| 코드 충돌 위험 | `_isCarInfoQuery`는 Travel Intelligence 경로(줄 3013) — nonDiscovery 내 충돌 없음 |
| 테스트 케이스 | NW-01~05 + NW-SAFE-01~05 + NW-REG-01~07 + NW-REG-FULL 확정 |
| DB/Schema 변경 | 없음 |

**코드 착수 승인 필요 (미승인):**

이 문서는 구현 범위와 검증 기준 확정 문서임.
실제 코드 수정 / PR / Merge / Deploy는 Founder별도 승인 후 착수.

**Implementation Plan Status: READY FOR CODE REVIEW — 코드 착수 Founder 승인 대기**
