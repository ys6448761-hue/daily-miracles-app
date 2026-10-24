# PREFLIGHT-PHASE-B-001 — Hotel-to-Starlight SOUL Answer Phase B

생성일: 2026-10-24
상태: READY — Founder 승인 대기 / 코드 수정 금지
작성자: Claude Code (Antigravity 인스턴스)
근거: PILOT-INTENT-002 + Founder Phase B 지시 (2026-10-24)

---

## 대상 질문

> "신라스테이 여수에 묵는데 차를 호텔에 두고 여수 밤바다를 즐길 수 있을까요?"

---

## A. 호텔 인식 — 코드 추적 결과

### 현재 경로

`_extractHotelCode("신라스테이 여수에 묵는데...")`:
- `message.replace(/\s+/g,'').toLowerCase()` = "신라스테이여수에묵는데..."
- MVP_HOTELS 순회: '라마다', '케니' 모두 미포함 → return null

`_extractSemanticRoles`:
- hotelCode = null → `{ departure_origin: null, hotel_lodging: null }`

`_LODGING_SUFFIX = /에서\s*(숙박|1박|묵)/`:
- "에 묵는데"는 "에서 묵" 불일치 → lodging role 미설정

**결론 A:**
- MVP_HOTELS 추가 = quote 관련 질문에서 호텔 인식 가능
- 그러나 이 질문의 핵심 문제(밤바다 산책 답변)는 호텔 코드 인식과 독립적
- isQuotable()은 `['ramada','kenny'].includes(hotel_code)` 유지 → 신라스테이 자동 견적 없음

---

## B. 밤바다 산책 의도 — 현재 분기 추적

```
① City Context Safety Guard   → PASS (여수)
② PLACE_LOOKUP                → MISS ("밤바다", "신라스테이" alias 미등록)
③ Short Operational Gate      → MISS ("주차/요금/운영" 미해당)
④ DISCOVERY GATE
   _isDiscoveryIntent("밤바다를 즐길 수 있을까요?"):
   - 추천해/알려줘/갈 만한/뭐 할까 → 없음 → false
   _isJourneyPlanningIntent → false
   → DISCOVERY 미발동
⑤ nonDiscovery 블록
   - PSQ Gate: explicit_context.place_code 없음 → skip
   - Living Detail Fallback: _psqPlaceCode 없음 → skip
   - _generateClarificationMessage: 어느 패턴에도 미해당
   → 반환: "여수 여행을 더 잘 도와드릴 수 있도록, 어떤 여행을 계획하고 계신지 말씀해 주세요."
```

**결론 B:** 신규 경로 추가 없이는 실질 답변 생성 불가.

**기존 DISCOVERY/PLACE_LOOKUP 활용 가능성:** 없음.
- "밤바다"를 기존 PLACE_ALIAS_MAP에 추가하면 PLACE_LOOKUP 발동 가능하나, "밤바다"는 특정 장소가 아니라 경험/활동 → 잘못된 매핑.
- `_isDiscoveryIntent`에 추가하면 DISCOVERY 발동 → 장소 카드 추천 결과 (targeted 답변 불가).
- **신규 PSQ-like 경로가 필요.**

---

## C. 목표 답변 Evidence 경계

| Evidence | 상태 | 출처 |
|----------|------|------|
| 신라스테이→이순신광장 WALK 26분/1.7km | ✓ 확보 | Founder 네이버 지도 2026-10-24 |
| 신라스테이→이순신광장 CAR 5분/1.9km | ✓ 확보 | Founder 네이버 지도 2026-10-24 |
| 이순신광장~종포해양공원~하멜등대 해안 | Draft/UNVERIFIED | SSOT-ROUTE-003 (1.2km 실측 미완) |
| 장소 감정 역할 (종포:쉼, 하멜:소원) | ✓ Confirmed | SSOT-LOC-001 |
| 호텔 복귀 이동시간 | 미검증 | 역방향 자동 생성 금지 |
| 야간 안전성 | 미검증 | Evidence 없음 |
| 별빛혜택 | PENDING_VERIFICATION | CAND-EXP-002-B |

**목표 답변 초안 (Evidence 경계 내):**
```
신라스테이에서 이순신광장까지 걸어서 약 26분(1.7km) 거리예요.
차를 두고 이순신광장 해안을 따라 종포해양공원, 하멜등대까지
천천히 걸으며 여수 밤바다를 즐길 수 있어요.
종포해양공원에서 잠시 쉬어가고, 하멜등대에서 밤바다를 바라보는 코스예요.
돌아올 때는 같은 길을 걷거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.
호텔 주차는 체크인 시 문의해보세요.
```

**포함하지 않을 내용:** 이순신광장~하멜등대 1.2km 수치 (UNVERIFIED), 야간 안전성, 하멜등대 운영 상세, 별빛혜택.

---

## D. 정확한 변경 대상 파일 및 함수

| 파일 | 위치 | 변경 내용 | 분류 |
|------|------|-----------|------|
| `quoteContextService.js` | 줄 15 `MVP_HOTELS` | 신라스테이 alias 추가 | EXTEND |
| `soyeowoolService.js` | 줄 1543 `_HOTEL_CODE_TO_KO` | shinra_stay_yeosu 한글명 추가 | EXTEND |
| `soyeowoolService.js` | nonDiscovery 블록 내 신규 함수 | `_isNighttimeWalkQuery` 신규 추가 | NEW |
| `soyeowoolService.js` | 신규 응답 빌더 | `_buildNighttimeWalkPayload` 신규 추가 | NEW |

---

## E. 최소 변경안 (코드 초안 — 승인 전 구현 금지)

### E-1. quoteContextService.js:15

```js
// Phase B 추가 (신라스테이 여수)
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

### E-2. soyeowoolService.js:1543

```js
const _HOTEL_CODE_TO_KO = {
  ramada: '라마다',
  kenny: '켄싱턴 호텔',
  shinra_stay_yeosu: '신라스테이 여수',
};
```

### E-3. soyeowoolService.js — 신규 함수 (승인 전 구현 금지)

```js
// Phase B: 밤바다/야간 산책 접근 가능 여부 질문 감지
// "밤바다를 즐길 수 있을까요?" + "차를 호텔에 두고" 등 feasibility 패턴
function _isNighttimeWalkQuery(message) {
  const hasNightWalk = /(밤바다|야간 산책|해안 산책|밤에 걸|밤에 산책|해안을 걸)/.test(message);
  const hasFeasibility = /(즐길 수 있을까|가능할까|걸어갈 수 있|도보로 갈 수 있|차 없이|차를 두고|차를 호텔에)/.test(message);
  return hasNightWalk && hasFeasibility;
}
```

호출 위치: `nonDiscovery` 블록 내, PSQ Gate 이전.

### E-4. 응답 빌더 (승인 전 구현 금지)

```js
function _buildNighttimeWalkPayload(sessionId) {
  return _buildClarificationPayload(sessionId,
    '신라스테이에서 이순신광장까지 걸어서 약 26분(1.7km) 거리예요.\n'
    + '차를 두고 이순신광장 해안을 따라 종포해양공원, 하멜등대까지\n'
    + '천천히 걸으며 여수 밤바다를 즐길 수 있어요.\n'
    + '종포해양공원에서 잠시 쉬어가고, 하멜등대에서 밤바다를 바라보는 코스예요.\n'
    + '돌아올 때는 같은 길을 걷거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.\n'
    + '호텔 주차는 체크인 시 문의해보세요.'
  );
}
```

---

## F. 변경하지 않을 영역

| 영역 | 이유 |
|------|------|
| `isQuotable()` 자동 견적 조건 | `['ramada','kenny'].includes(hotel_code)` 유지 — 신라스테이 자동 견적 없음 |
| 기존 8개 장소 `PLACE_ALIAS_MAP` | 변경 없음 |
| `_isDiscoveryIntent` | "밤바다" 추가 시 넓은 회귀 위험 → 추가 안 함 |
| SSOT-ROUTE-003 | Draft 유지 — 1.2km 수치 Runtime 노출 금지 |
| DB / Schema | 변경 없음 |
| 기존 ramada/kenny 흐름 | 변경 없음 |

---

## G. 회귀 테스트 계획

| 케이스 | 예상 동작 | 검증 항목 |
|--------|-----------|-----------|
| "라마다 3명 10월 26일" | MVP_HOTELS ramada → 기존 견적 흐름 | NW-REG-01 |
| "케이블카 타고 싶어" | DISCOVERY 기존 동작 | NW-REG-02 |
| "밤바다가 예뻐요?" | `_isNighttimeWalkQuery` 미발동 (feasibility 없음) | NW-REG-03 |
| "밤바다 야경 추천해줘" | DISCOVERY 발동 (기존 동작) | NW-REG-04 |
| "밤바다를 즐기고 싶어요" | `_isDiscoveryIntent` "하고 싶" → DISCOVERY (기존) | NW-REG-05 |
| "신라스테이에 묵는데 밤바다 걸어갈 수 있을까요?" | `_isNighttimeWalkQuery` 발동 → 신규 응답 | NW-01 |
| "차를 호텔에 두고 밤바다를 즐길 수 있을까요?" | `_isNighttimeWalkQuery` 발동 → 신규 응답 | NW-02 |
| 기존 soul.test.js 전체 | 기존 동작 유지 | NW-REG-FULL |

---

## H. Evidence 미확인 항목 처리 방침

| 항목 | 처리 방침 |
|------|-----------|
| 이순신광장~하멜등대 1.2km (UNVERIFIED) | 수치 노출 금지 — "해안을 따라"로 대체 |
| 야간 안전성 | 답변에 포함하지 않음 |
| 호텔 복귀 이동시간 | "택시 이용 가능"으로 대체 (수치 없음) |
| 별빛혜택 | PENDING_VERIFICATION — 언급하지 않음 |
| 호텔 주차 정책 | "체크인 시 문의" — 미검증 명시 |

---

## I. Guardian 위험 판정

| 항목 | 판정 |
|------|------|
| Change Classification | EXTEND (A, B 일부) + NEW (B 신규 함수) |
| Duplication Risk | LOW — 기존 hotel/beach walk 안내 없음 |
| Data Risk | NONE — DB/Schema 변경 없음 |
| Regression Risk | ADVISORY — `_isNighttimeWalkQuery` 패턴이 좁음 |
| Scope Creep Risk | ADVISORY — 신규 함수가 다른 호텔로 자동 확장되지 않도록 scope 제한 |
| isQuotable 영향 | NONE — `['ramada','kenny']` 하드코딩 유지 |
| SSOT 충돌 | NONE — 이순신광장→종포→하멜 감정 흐름 일치 |

---

## J. Founder 승인 필요 사항

1. **`_isNighttimeWalkQuery` 패턴 범위** — 호텔 언급 없이도 발동됨. "차를 두고 밤바다를 즐길 수 있을까요?"처럼 호텔명이 없는 질문도 포함할지 여부.

2. **SSOT-ROUTE-003 UNVERIFIED 처리** — 1.2km 수치를 현재 답변에 포함할지 (UNVERIFIED 경고 표시), 또는 실측 완료 후에만 포함할지.

3. **신라스테이 단독 vs 다중 호텔 동시 처리** — Phase B를 신라스테이 단독으로 착수할지, 소노캄·베네치아도 동시에 MVP_HOTELS에 추가할지.

---

## Implementation Status: READY

Founder 승인 후 코드 착수 가능.
미결 질문 3개(J-1~J-3)는 구현 범위에 영향을 주나, 최소 변경안(신라스테이 단독, 1.2km 수치 제외)으로 먼저 착수 가능.
