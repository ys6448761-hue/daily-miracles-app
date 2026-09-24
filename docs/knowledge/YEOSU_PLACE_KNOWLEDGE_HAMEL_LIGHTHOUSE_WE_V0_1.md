# YEOSU Place Knowledge — 하멜등대 (Hamel Lighthouse) World Experience Review V0.1

**place_code:** `hamel_lighthouse` (travel_places 미등록 — 신규 onboarding 대상)  
**생성일:** 2026-09-24  
**Review 상태:** WORLD EXPERIENCE REVIEW COMPLETE / Founder Review PENDING  
**Knowledge 상태:** World Experience Layer 저장 완료. Founder Review 전이므로 Final Core Identity 미확정.  
**다음 단계:** Hamel Lighthouse Founder Review

---

## IMPORTANT — Review Status

이 문서는 **World Experience Review 결과만** 포함한다.

Founder Review가 완료되지 않았으므로:
- Core Identity를 Final로 확정하지 않는다
- World Experience 결과를 Official Fact로 승격하지 않는다
- World Experience 패턴이 DreamTown 정의를 검증했다고 표현하지 않는다
- Hamel Exhibition Hall과 Hamel Lighthouse를 병합하지 않는다

---

## Architecture Constraint

- DB migration, schema 변경, seed, runtime, production 변경 금지
- `place_knowledge` migration 미적용 — READ-ONLY architecture mapping만
- Founder Local을 Official Fact로 임의 승격 금지
- UNKNOWN/VERIFY_REQUIRED 항목을 추론으로 채우지 않음
- LIVE_CHECK 정보를 narrative knowledge에 고정하지 않음

---

## 1. Entity Boundary — Critical

```
하멜전시관 ≠ 하멜등대
종포해양공원 ≠ 여수해양공원
하멜등대 ≠ 하멜수변공원
```

| Entity | 성격 | 상태 |
|---|---|---|
| 하멜전시관 (Hamel Exhibition Hall) | 실내 문화·역사 시설 | travel_places 미등록 |
| 하멜등대 (Hamel Lighthouse) | 야외 등대 / 방파제 끝 / 항로표지 | travel_places 미등록 |

**두 Entity를 합치거나 alias 처리하지 않는다.**

Relationship: `nearby / historical-context / walking-relationship` 가능성으로 관리.  
정확한 거리, 운영시간 및 접근 관계는 Official Verification 전 확정하지 않는다.

---

## 2. Working Core Identity (NOT FINAL — Founder Review 후 수정 가능)

World Experience 기반 Working Definition:

```
하멜등대는 여수 원도심 해안 Journey의 끝에서 만나는 작은 빨간 등대로,
여행자가 바다를 향해 걸어온 길을 멈추고 바람과 풍경 속에서 마음을 비운 뒤
다시 여수를 돌아보게 만드는 '도착과 전환의 장소'다.
```

**Status: WORKING DEFINITION — NOT FINAL**

---

## 3. Strong World Experience Consensus

독립 조사에서 반복된 핵심 패턴:

**"등대 자체보다 Journey가 중요하다"**

여행자 경험에서 반복된 구조:
```
걷기 → 멀리 보이는 빨간 등대 → 방파제로 진입 → 끝에 도착 → 멈춤 → 바다/도시를 바라봄 → 다시 돌아감
```

핵심 해석 (World Experience Layer):
> 하멜등대의 경험적 가치는 '등대를 보는 것'보다 '등대까지 걸어가 도착하는 것'에 있다.

반복된 감정 표현 (World Experience — Official Fact 아님):

| 감정 패턴 | Provenance |
|---|---|
| 도착 / 멈춤 / 비움 | WORLD_EXP (반복) |
| 후련함 / 해방감 / 정돈 | WORLD_EXP (반복) |
| 작은 성취감 | WORLD_EXP (반복) |
| 낭만 | WORLD_EXP (반복) |
| 뒤돌아봄 / 회귀 | WORLD_EXP (반복) |

---

## 4. 핵심 질문과 World Experience 답변

**Question:**
> "사람들은 왜 작은 빨간 등대 하나를 보러 여기까지 걸어가는가?"

**Current World Experience Answer:**
> 사람들은 작은 빨간 등대를 보려고 끝까지 걷는 것이 아니라,
> 그 빨간 등대가 만들어 준 '끝'까지 걸어가 보기 위해 간다.

등대는 거대한 볼거리라기보다 걷는 사람에게 명확한 목적지를 만들어 준다.  
도착하면 여행자는 등대만 보는 것이 아니라:
- 바다를 바라보고
- 도시를 바라보고
- 자신이 걸어온 방향을 돌아보고
- 잠시 멈춘 뒤
- 다시 원도심으로 돌아간다.

따라서 하멜등대는:
- `Object to See` 이면서 동시에
- `Place to Arrive / Stop / Look Back / Return`의 성격을 가진다.

---

## 5. World Experience ↔ DreamTown Relationship

**주의:** World Experience가 DreamTown 정의를 검증했다고 표현하지 않는다.

| Layer | 내용 |
|---|---|
| DreamTown (기존 SSOT) | 희망 · 별빛 · 회복의 시작 |
| World Experience (이번 조사) | 도착 → 멈춤 → 비움 |
| 관계 | 감정적으로 연속될 가능성이 있음 — 동일한 것이 아님 |

조사자에게 DreamTown의 기존 정의(희망/별빛/회복)를 사전 제공하지 않았다.  
World Experience 결과를 DreamTown 정의에 맞게 사후 편집하지 않는다.

---

## 6. Place vs Route Architecture Evidence

이 장소에서도 종포해양공원 Pilot의 `Place ≠ Route` 원칙이 반복됐다.

**Place Knowledge (하멜등대 자체):**
- 작은 빨간 등대
- 방파제 끝
- 바다 / 항로표지
- 하멜 역사 연관성
- 사진 / 바람

**Route / Relationship Knowledge (여행 경험):**
```
원도심 → 해안공간 → 멀리 보이는 빨간 등대 → 등대까지 걸음
→ 도착 → 머무름 → 돌아봄 → 원도심으로 회귀
```

**질문별 Knowledge 조합 차이:**

| 질문 | 필요 Knowledge |
|---|---|
| "하멜등대 뭐가 좋아?" | Place Knowledge 중심 |
| "종포에서 하멜등대까지 걸어갈까?" | Route / Relationship Knowledge 중심 |

Journey에 포함된다는 이유로 각 Place의 독립 Entity를 제거하지 않는다.

---

## 7. Important Relationship Insight

World Experience에서 발견된 관찰:

> 하멜등대는 보는 대상이면서 동시에 여수를 바라보는 자리다.

여행자는 등대를 목적지 삼아 걸어가지만, 도착 후 시선의 대상은 등대만이 아니다.

그곳에서 바라보는 것:
- 바다 / 항구
- 도시
- 주변 야경
- 자신이 지나온 해안 Journey

향후 검토할 관계 유형 (아직 schema 적용하지 않음):

| 관계 | 설명 |
|---|---|
| Destination | 걷기의 목적지 |
| Viewpoint | 여수 도시·바다를 바라보는 자리 |
| Turnaround Point | 돌아가기 전 마지막 지점 |
| Route Endpoint | 해안 Journey의 끝 |

---

## 8. Journey Working Model

현재 World Experience 기준 Working Journey (공식 확정 아님):

```
이순신광장 → 종포해양공원 → 여수해양공원 권역 → 하멜/포차 권역 → 하멜등대 → 회귀
```

**주의:**
- 정확한 공식 Route 명칭, 거리, 행정/공원 경계 미확정
- 낭만포차의 정확한 순서와 Route 관계 → 지도/Founder/Official Evidence로 검증 필요
- `종포해양공원 ≠ 여수해양공원` 기존 결정 유지

---

## 9. Entity / Naming Verification Required

자료에서 혼용 중인 명칭:

| 혼용 명칭 | 처리 |
|---|---|
| 종포해양공원 / 여수해양공원 / 하멜수변공원 / 여수구항 해양공원 | VERIFY_REQUIRED — alias 금지 |
| 하멜전시관 / 하멜등대 | 별도 Entity — 병합 금지 |
| 거북선대교 / 돌산대교 | 조망 대상 설명에서 혼재 — VERIFY_REQUIRED |

임의로 교정하거나 alias 처리하지 않는다.

---

## 10. Conflict Register

### Conflict A — Accessibility (HIGH PRIORITY)

확인 필요:
- 휠체어가 실제 등대 앞까지 접근 가능한가
- 유모차 접근 가능 범위
- 방파제 노면 / 방파제 폭 / 난간 / 경사
- 무장애 정보가 전시관 기준인지 등대/방파제까지 포함하는지

**SOUL 행동:** 접근성 정보 확정 전 wheelchair/stroller 안내 금지

### Conflict B — Fishing

확인 필요:
- 하멜등대 방파제 낚시 가능 여부
- 낚시 통제구역 포함 여부
- 특정 시간대 통제 여부

**SOUL 행동:** 검증 전 하멜등대 방파제 낚시 추천 금지

### Conflict C — Parking

자료 간 차이 존재. 확인 필요:
- 정확한 공식 주차장 명칭 / 위치
- 주차면수 / 무료·유료 여부 / 운영시간
- 장애인 주차 / 주말 혼잡 패턴

### Conflict D — Route Distance

`이순신광장 → 하멜등대 약 1.5km` 주장이 여러 자료에서 사용되나 공식 검증 필요.  
이 값을 종포해양공원 자체 길이 또는 특정 공원 길이로 저장하지 않는다.  
Route distance 후보로만 관리한다.

---

## 11. VERIFY_REQUIRED 전체 목록

공식 Verification 전 확정 금지 항목:

| 항목 | 이유 |
|---|---|
| 하멜전시관 운영시간 / 휴관일 | 공식 확인 없음 |
| 일반 화장실 정확한 위치 | 공식 확인 없음 |
| 방파제 벤치 유무 및 위치 | 공식 확인 없음 |
| 하멜전시관 ↔ 하멜등대 실제 도보시간 | 공식 확인 없음 |
| 야간 통제 여부 | 공식 확인 없음 |
| 기상악화 시 통제 여부 | 공식 확인 없음 |
| 등대 점등 관련 운영 정보 | 공식 확인 없음 |
| 주말 특정 시간대 혼잡 수준 | Live — 고정 금지 |
| 특정 시간 사진 대기줄 | Live — 고정 금지 |
| "일몰 30분 전 최적 시간" 단정 | Official Fact 아님 — Experience Recommendation |
| 접근성 (wheelchair, stroller) | Conflict A 참조 |
| 낚시 가능 여부 | Conflict B 참조 |
| 주차 공식 정보 | Conflict C 참조 |
| Route 공식 거리 | Conflict D 참조 |
| 공원/권역 공식 행정 경계 | VERIFY_REQUIRED |
| lat/lng / 공식 주소 | travel_places 등록 전 필수 |

---

## 12. READ-ONLY place_knowledge Architecture Mapping

> 아직 migration 없음. Founder Review 완료 후 최종 field 결정.
> 현재는 World Experience 기반 방향만 기록.

```
place_code:      "hamel_lighthouse"
  [NOTE: travel_places 미등록 — migration 승인 후 INSERT]

identity_ko:     [WORKING DEFINITION — Founder Review 후 확정]
  "여수 원도심 해안 Journey의 끝에서 만나는 작은 빨간 등대로,
   바다를 향해 걸어온 길을 멈추고 마음을 비운 뒤
   다시 여수를 돌아보게 만드는 도착과 전환의 장소예요."

highlights:      [WORLD_EXP_PATTERN — Founder Review 후 보완]
  - "작은 빨간 등대 (걷기의 목적지)"
  - "방파제 끝에서 바라보는 바다와 도시"
  - "하멜 역사 연관 장소"
  - "야경·사진 포인트"

companion_notes: [PENDING Founder Review]
  couple:      [WORLD_EXP] "좋아요 — 낭만적인 산책 끝점"
  family:      [PENDING] 접근성 확인 후
  kids:        [PENDING] 방파제 안전 확인 후
  elderly:     [CONFLICT-A] 접근성 미확인 — 안내 보류
  solo:        [WORLD_EXP] "좋아요 — 혼자만의 멈춤 경험"
  large_group: [PENDING]

weather_notes:   [INFERRED from outdoor + 해안 위치]
  rain:  "poor — 방파제, 야외, 피할 공간 없음"
  hot:   "limited shade — 저녁/야간 방문 권장"
  wind:  "exposed — 방파제 끝, 바람 강함"
  cold:  "주의 — 방파제 바람 체감 강함"

daytime_char:    [WORLD_EXP_PATTERN]
  "낮에는 빨간 등대를 향해 방파제를 걸어가는 경험이 중심이에요.
   도착하면 바다와 도시가 함께 보여요."

nighttime_char:  [WORLD_EXP_PATTERN]
  "저녁에는 도시 불빛과 바다가 만나는 여수밤바다 뷰가 펼쳐져요.
   등대 불빛과 함께 분위기가 달라져요."

local_tips:      [PENDING Founder Review]
  - "[PENDING] 주차 공식 정보 — VERIFY_REQUIRED"
  - "[WORLD_EXP] 방파제 걷기 — 운동화 권장"
  - "[WORLD_EXP] 바람이 강할 수 있음 — 얇은 겉옷 준비"

nearby_places:   [PENDING — Travel Time Matrix + Founder Review 대기]
  예상 포함:
    - marine_park (종포해양공원): 해안 연결, minutes PENDING
    - romantic_pojangmacha (낭만포차거리): Journey 연결, minutes PENDING
    - hamel_exhibition_hall: nearby (별도 Entity 유지)

transit_from_expo: [MISSING — VERIFY_REQUIRED]
  null

source_origin:   "world_experience"
verified_date:   "2026-09"
confidence:      "LOW — Founder Review 미완료"

authoring_notes: |
  [WORKING DEFINITION] identity_ko — Founder Review 후 수정 가능
  [CONFLICT-A] 접근성 미확인 — wheelchair/stroller 안내 보류
  [CONFLICT-B] 낚시 — SOUL 추천 금지
  [CONFLICT-C] 주차 — 공식 정보 VERIFY_REQUIRED
  [CONFLICT-D] 1.5km 수치 — Route distance 후보, 장소 자체 길이 아님
  [ENTITY] hamel_exhibition_hall ≠ hamel_lighthouse — 병합 금지
  [PENDING] lat/lng, 공식 주소 — travel_places 등록 전 필수
  [DREAMTOWN] 희망/별빛/회복의 시작 = DreamTown SSOT. World Exp(도착/멈춤/비움)와 별도 Layer.
  [NAMING] 하멜수변공원/여수해양공원 등 명칭 혼용 — VERIFY_REQUIRED
```

---

## 13. Provenance Summary

| Field group | source_type | confidence | do_not_promote |
|---|---|---|---|
| Working identity_ko | WORLD_EXPERIENCE | LOW | false (WORKING DEFINITION 명시) |
| Experience pattern (도착/멈춤/비움) | WORLD_EXPERIENCE | MEDIUM | false |
| DreamTown 감정 정의 | DREAMTOWN | — | false — 별도 Layer |
| World Exp ↔ DreamTown 연속성 | OBSERVATION | LOW | false — 가능성만 |
| Accessibility | CONFLICT — VERIFY | — | **true** |
| 낚시 (모든 형태) | CONFLICT — VERIFY | — | **true** |
| 주차 정보 | CONFLICT — VERIFY | — | **true** |
| Route 거리 수치 | CONFLICT — VERIFY | — | **true** |
| lat/lng, 주소 | MISSING | — | true — 등록 전 |
| 전시관 운영 정보 | VERIFY_REQUIRED | — | **true** |

---

## 14. Authoring Framework Observation (3rd Case)

현재 반복 횟수: 이순신광장 + 종포해양공원 + **하멜등대 (3회)**

반복 관찰된 패턴:
```
Official         → factual skeleton
World Experience → how travelers actually experience the place
Founder          → current local reality / correction
DreamTown        → emotional meaning
SOUL             → compose what this traveler needs now
```

추가 관찰: `Place Knowledge + Route/Relationship Knowledge` 분리 필요성도 3회 반복.

**DO NOT CREATE SSOT CANDIDATE YET**

기존 결정 유지. 케이블카 Pilot까지 관찰 후 Candidate 승격 여부 판단.  
현재 상태: `OBSERVATION — 3rd repetition`
