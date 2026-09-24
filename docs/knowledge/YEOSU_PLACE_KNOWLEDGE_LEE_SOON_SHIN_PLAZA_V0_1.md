# YEOSU Place Knowledge — 이순신광장 (Lee Soon Shin Plaza) V0.1

**place_code:** `lee_soon_shin_plaza`  
**생성일:** 2026-09-24  
**Review 상태:** SAVED / GREEN  
**Knowledge 상태:** Founder Review + World Experience Review COMPLETE  
**다음 검토:** 공식 검증 후 confidence 상향 (VERIFY_REQUIRED 항목 해소 시)

---

## Architecture Constraint

- 기존 `travel_places` + 제안된 `place_knowledge` 책임경계 유지
- `place_knowledge` migration 미적용 — 이 문서는 READ-ONLY field draft
- Founder Local 정보를 Official Fact으로 임의 승격 금지
- UNKNOWN 항목을 추론으로 채우지 않음
- LIVE_CHECK 정보를 narrative knowledge에 고정하지 않음
- 종포해양공원과 병합하거나 alias 처리 금지 — 독립 Place Entity

---

## 1. Core Identity (확정)

**분류:** 원도심 중심광장 / 역사·먹거리·바다 연결점

```
이순신광장은 여수 원도심의 중심광장이다.
역사적 성격(이순신·거북선)과 동시에, 실제 여행에서는
원도심 먹거리·바다 경험·여수밤바다 Journey의 시작점이자 연결점으로 기능한다.
단독 관람보다 주변 Journey와 연결될 때 여행 가치가 커진다.
```

**Entity 독립성:** 종포해양공원은 별도 Place Entity. 이순신광장과 alias 처리하지 않음.

---

## 2. Knowledge Classification

### 2A. Stable / Identity Knowledge

| 항목 | 내용 | Provenance |
|---|---|---|
| 원도심 중심광장 위치 | 역사적 성격, 여수 구도심 중심 | OFFICIAL (공공기록) |
| 이순신 장군·거북선 연관 | 역사 조형물 존재 | OFFICIAL (공공기록) |
| 야외 광장 (outdoor) | 실내 시설 없음 | TEAM_JUDGMENT / DB |
| 독립 Place Entity | 종포해양공원과 병합 불가 | FOUNDER_DECISION |

### 2B. Travel Knowledge

| 항목 | 내용 | Provenance | Status |
|---|---|---|---|
| 핵심 여행 캐릭터 | 먹거리·바다·쉼·밤바다 Journey 출발점 | WORLD_EXP_PATTERN + FOUNDER_LOCAL | APPROVED |
| 체류 방식 | 광장만 보는 게 아니라 주변 원도심 함께 둘러보기 + 먹거리 들고 바다 앞 쉬기 | WORLD_EXP_PATTERN | APPROVED |
| 저녁/야간 캐릭터 | 밤에는 산책·바다 경험 확장. 여수밤바다 시작점 | WORLD_EXP_PATTERN + FOUNDER_LOCAL | APPROVED |
| 도착 감각 | "잠시 앉아 쉬며 여수에 도착했다는 감각을 느끼는 장소" | WORLD_EXP_PATTERN | APPROVED (Knowledge Input, not Truth) |
| 역사 관심 여행자 | 진남관 쪽으로 여행 확장 가능 | FOUNDER_LOCAL | APPROVED |
| avg_stay_minutes | 45 (DB 기존값) | DB | 검토 대기 — World Exp 패턴과 정합 확인 필요 |

### 2C. Relationship Knowledge

| 관계 | 내용 | Provenance | Status |
|---|---|---|---|
| → 종포해양공원 | 밤바다 Journey 핵심 경로 | FOUNDER_LOCAL | APPROVED |
| → 하멜등대 | 종포해양공원에서 이어지는 밤바다 경로 | FOUNDER_LOCAL | APPROVED |
| → 낭만포차거리 | 밤바다 Journey의 마지막 연결점 | FOUNDER_LOCAL | APPROVED |
| → 진남관 | 역사 관심 여행자의 원도심 역사축 확장 | FOUNDER_LOCAL | APPROVED |
| 케이블카 | 걷기 연결 없음 — 다른 zone | TEAM_JUDGMENT | APPROVED |
| 도보 walk_minutes | 미확정 — Travel Time Matrix Founder 검수 대기 | PENDING | PENDING |

**핵심 밤바다 Journey:**
```
이순신광장 → 종포해양공원 → 하멜등대 → 낭만포차거리
```

### 2D. Founder Local Knowledge (공식 사실로 임의 승격 불가)

| 항목 | 내용 |
|---|---|
| 주차 전략 | 광장 지하주차장 활용 가능 |
| 주차 전략 | 진남관 주변 주차공간 활용 가능 |
| 주차 전략 | 주말·휴일에는 주변 공영주차 후 도보 접근도 현실적 |
| 원도심 먹거리 연결 | 핵심 Travel Knowledge — 고정 업장 추천 아님 |

### 2E. Live / Volatile (Knowledge에 고정 금지)

| 항목 | 이유 |
|---|---|
| 거북선 내부 개방 여부 | 운영 상태 변동 가능 |
| 공연·버스킹 일정 | 비정기, 날씨/행사 의존 |
| 축제·행사 | 계절·시기 의존 |
| 현재 주차 혼잡도 | 실시간 변동 |
| 개별 업장 영업·대기 | 실시간 변동, 특정 업장 고정 추천 금지 |

---

## 3. VERIFY_REQUIRED (공식 출처 확인 필요 — 미확인 전 SOUL에 노출 금지)

| 항목 | 현재 상태 | 필요 출처 |
|---|---|---|
| 광장 정확한 면적 | 미확인 | 여수시 공공기록 |
| 역사 조형물 세부사항 (거북선 형태, 이순신 동상 높이 등) | 미확인 | 현장 확인 or 공공기록 |
| 거북선 내부 운영 (유료/무료, 관람 가능 여부) | 미확인 | 운영자/여수시 직접 확인 |
| 정확한 주소 | DB에 있으나 검수 필요 | 공식 주소 확인 |
| 접근성 (wheelchair, stroller) | DB null | 현장 확인 or 공식 접근성 정보 |
| admission_fee | DB null — outdoor plaza이므로 무료 추정 | 공식 확인 전까지 SOUL에 노출 금지 |
| opening_hours | outdoor plaza — 상시 개방 추정 | 확인 전 live_status_required=false 유지 |

---

## 4. DO NOT PROMOTE

- 후기 비율이나 방문자 순위
- 정확한 평균 체류시간 (45분은 내부 추정치 — 공식 출처 없음)
- 특정 먹거리 업장 대기시간
- 야간 안전에 대한 단정적 표현
- 특정 업장을 Place Knowledge의 고정 추천으로 만들지 않음

---

## 5. World Experience 처리 원칙

World Experience (젠스파크·재미·코미)는 Truth Source가 아니다.
반복되는 경험 패턴을 발견하기 위한 Knowledge Input으로만 취급한다.

**이순신광장에서 반복된 패턴 (Knowledge Input 채택):**
- 광장 자체보다 여행 동선의 연결점으로 인식 → Core Identity 반영
- 먹거리와 바다 경험이 강하게 반복 → Travel Knowledge 반영
- 밤에는 산책·바다 경험 확장 → nighttime_char 반영
- "잠시 앉아 여수에 도착했다는 감각" → APPROVED as Knowledge Input (고정 narrative 아님)
- 주변 장소와 함께 경험할 때 가치 커짐 → Core Identity 반영

---

## 6. SOUL Answer Draft (Knowledge Composition Example)

> 이 문구는 customer-facing LOCKED copy가 아니다.  
> place_knowledge 필드들로부터 SOUL이 구성하는 방식을 보여주는 예시다.

```
이순신광장은 여수 원도심의 중심광장이에요.
이순신과 거북선으로 이어지는 역사적인 성격도 있지만,
실제 여행에서는 주변 먹거리와 바다를 만나고
여수밤바다 산책을 시작하는 장소로도 많이 활용돼요.

광장 하나만 오래 보는 것보다는
주변 원도심을 함께 둘러보고,
먹거리 하나를 들고 바다 앞에서 잠시 쉬어보는 게
이곳을 즐기는 좋은 방법이에요.

저녁이라면 종포해양공원과 하멜등대 방향으로
천천히 걸어보는 것도 좋아요.
바다를 따라 걸으면서 여수 원도심에서 밤바다로
분위기가 바뀌는 걸 자연스럽게 경험할 수 있어요.

역사에 관심이 있다면 진남관 쪽으로
여행을 이어갈 수도 있어요.
```

---

## 7. READ-ONLY place_knowledge Field Draft

> 아직 migration 없음. place_knowledge 테이블이 생성된 후 이 draft를 기반으로 INSERT.  
> 각 필드에 provenance 태그 명시.

```
place_code:      "lee_soon_shin_plaza"

identity_ko:     [TEAM_JUDGMENT + WORLD_EXP_PATTERN, confidence: MEDIUM]
  "여수 원도심의 중심광장이에요. 이순신과 거북선으로 이어지는 역사적인 성격도 있지만,
   실제 여행에서는 원도심 먹거리와 바다 경험, 여수밤바다 산책을 시작하는
   연결점으로 더 많이 활용돼요. 광장 하나보다 주변과 함께 경험할 때 가치가 커지는 장소예요."

highlights:      [TEAM_JUDGMENT + WORLD_EXP_PATTERN]
  - "이순신 동상 + 거북선 조형물"
  - "원도심 먹거리 연결점"
  - "여수밤바다 Journey 시작점"
  - "종포해양공원·하멜등대 방향 밤바다 산책 경로"

companion_notes: [TEAM_JUDGMENT + DB suitable_for]
  couple:      "좋아요 — 저녁 산책과 밤바다 코스 연결 가능"
  family:      "좋아요 — 역사 이야기 아이에게 설명 가능, 넓은 광장"
  kids:        "좋아요 — 야외 광장, 계단 없음"
  elderly:     "좋아요 — 평지. 주차 전략 미리 확인 권장"
  solo:        "좋아요 — 도착 감각·먹거리 탐색·사진"
  large_group: "좋아요 — 넓은 야외 공간"

weather_notes:   [INFERRED from indoor_outdoor=outdoor]
  rain:  "poor — 야외, 피할 공간 없음"
  hot:   "limited shade — 저녁 방문 권장"
  wind:  "exposed — 항구 인접"
  cold:  "bearable — 짧은 방문이면 괜찮음"

daytime_char:    [WORLD_EXP_PATTERN + TEAM_JUDGMENT]
  "낮에는 역사 분위기 위주예요.
   이순신 동상·거북선 조형물을 중심으로 가볍게 둘러보고 이동하는 방식이 많아요."

nighttime_char:  [WORLD_EXP_PATTERN + FOUNDER_LOCAL]
  "밤에는 여수밤바다 산책 출발점으로 분위기가 바뀌어요.
   종포해양공원과 하멜등대 방향으로 걸으면서 바다와 원도심 야경을 즐길 수 있어요."

local_tips:      [FOUNDER_LOCAL]
  - "광장 지하주차장 이용 가능"
  - "진남관 주변 주차공간 활용 가능"
  - "주말·휴일에는 주변 공영주차 후 도보 접근도 현실적"

photo_spots:     [WORLD_EXP_PATTERN — partial]
  - "이순신 동상 배경 (낮)"
  - "야간 광장 조명 + 거북선 조형물"
  (추가 spot은 현장 확인 후 보완)

seasonal_notes:  [TEAM_JUDGMENT]
  spring:  null
  summer:  "저녁·야간 방문 권장 (더위 회피)"
  autumn:  "산책 최적"
  winter:  null

nearby_places:   [PENDING — Travel Time Matrix Founder 검수 대기]
  예상 포함:
    - marine_park (종포해양공원): walk 방향 확인됨, minutes PENDING
    - hamel_lighthouse (하멜등대): walk 방향 확인됨, minutes PENDING
    - romantic_pojangmacha (낭만포차거리): 밤바다 Journey 연결, minutes PENDING

transit_from_expo: [MISSING — VERIFY_REQUIRED]
  null

zone_co_visit:   [FOUNDER_LOCAL]
  - "marine_park"
  - "hamel_lighthouse"
  - "romantic_pojangmacha"
  (진남관은 travel_places 미등록 — Phase 2 대기)

source_origin:   "world_experience + founder_local + team_judgment"
verified_date:   "2026-09"
confidence:      "MEDIUM"

authoring_notes: |
  [VERIFY] admission_fee — outdoor plaza이므로 무료 추정, 공식 확인 전 SOUL 노출 금지
  [VERIFY] opening_hours — 상시 개방 추정, 공식 확인 필요
  [VERIFY] 거북선 내부 개방 여부 — LIVE_CHECK 대상, narrative에 고정 금지
  [VERIFY] 정확한 접근성 정보 (wheelchair, stroller)
  [FOUNDER INPUT] local_tips 주차 위치 — Founder Local, 공식 사실 아님
  [WORLD_EXP] 도착 감각 narrative — Knowledge Input으로 채택, 고정 copy 아님
  [PENDING] nearby_places walk_minutes — Time Matrix Founder 검수 완료 후 채움
  [MISSING] transit_from_expo — 여수엑스포역 기준 접근 방법 확인 필요
  [NOTE] 진남관: travel_places 미등록 (Phase 2). 현재 route에서 언급만, DB 연결 없음.
```

---

## 8. Provenance 최소구조

place_knowledge 행 생성 시 모든 지식에 다음 provenance를 함께 기록한다.

```
PROVENANCE RECORD:
  place_code:        lee_soon_shin_plaza
  field:             [해당 필드명]
  source_type:       OFFICIAL | WORLD_EXPERIENCE | FOUNDER_LOCAL | TEAM_JUDGMENT | INFERRED | DB
  evidence_summary:  [어떤 근거인지 1줄 요약]
  verified_date:     YYYY-MM 또는 YYYY-MM-DD
  confidence:        HIGH | MEDIUM | LOW
  do_not_promote:    true | false
  authoring_note:    [미완성·요검증 사항]
```

**이순신광장 provenance 현황:**

| Field group | source_type | confidence | do_not_promote |
|---|---|---|---|
| identity_ko | TEAM_JUDGMENT + WORLD_EXPERIENCE | MEDIUM | false |
| companion_notes | TEAM_JUDGMENT + DB | MEDIUM | false |
| weather_notes | INFERRED | MEDIUM | false |
| daytime_char / nighttime_char | WORLD_EXPERIENCE + FOUNDER_LOCAL | MEDIUM | false |
| local_tips (주차) | FOUNDER_LOCAL | MEDIUM | false — 일반 방향성만 제공 |
| admission_fee | DB null / 추정 | LOW | **true** — VERIFY 전 노출 금지 |
| opening_hours | 추정 | LOW | **true** — VERIFY 전 노출 금지 |
| nearby_places walk_minutes | PENDING | — | true — 확정 전 노출 금지 |
| 거북선 내부 운영 | UNKNOWN | — | **true** — LIVE_CHECK, narrative 고정 금지 |
| 특정 업장 추천 | 해당 없음 | — | **true** — DO NOT PROMOTE |
