# YEOSU Place Knowledge — 종포해양공원 (Jongpo Marine Park) V0.1

**place_code:** `marine_park`  
**생성일:** 2026-09-24  
**Review 상태:** SAVED / GREEN  
**Knowledge 상태:** Founder Local Review + World Experience Review + Founder Map Evidence COMPLETE  
**다음 검토:** VERIFY_REQUIRED 항목 해소 후 confidence 상향

---

## Architecture Constraint

- 기존 `travel_places` + 제안된 `place_knowledge` 책임경계 유지
- `place_knowledge` migration 미적용 — 이 문서는 READ-ONLY field draft
- Founder Local 정보를 Official Fact으로 임의 승격 금지
- UNKNOWN 항목을 추론으로 채우지 않음
- LIVE_CHECK 정보를 narrative knowledge에 고정하지 않음

---

## 1. Entity Boundary — Critical

```
종포해양공원 ≠ 여수해양공원
```

두 장소는 별도 Entity다. alias 처리 금지.

| Entity | place_code | 상태 |
|---|---|---|
| 종포해양공원 | marine_park | 이 문서 |
| 여수해양공원 | (별도 — 미등록) | 별도 Entity, 혼용 금지 |
| 이순신광장 | lee_soon_shin_plaza | 독립 Entity |
| 하멜/종화동방파제 권역 | (미등록) | 별도 권역 |

**Waterfront Axis (Route 개념):**
```
이순신광장 ↔ 종포해양공원 ↔ 여수해양공원 권역 ↔ 하멜 권역
```
이 축은 Route/Journey 개념이지, 어느 하나의 Place 경계가 아니다.  
정확한 공식 Route 명칭/거리/행정경계 → VERIFY_REQUIRED.  
외부자료의 "1.5km" 설명을 종포해양공원 자체 길이로 자동 저장하지 않는다.

---

## 2. Core Identity (확정)

```
여수 원도심 해안 Journey를 이루는 독립적인 해양공원으로,
바다를 곁에 두고 걷고 앉아 쉬며
항구도시의 낮과 여수밤바다의 밤을 경험하는 머무름의 장소
```

핵심 여행 성격:
- 관광시설을 많이 소비하는 장소가 아님
- 걷기 / 앉기 / 쉬기 / 바다 보기가 핵심 경험
- 여행자뿐 아니라 시민의 산책·운동·휴식 공간이라는 성격 공존

---

## 3. Knowledge Classification

### 3A. Stable / Identity Knowledge

| 항목 | 내용 | Provenance |
|---|---|---|
| 해양공원, 해안 산책로 | 바다에 인접한 야외 공원 | OFFICIAL (공공기록) |
| outdoor, 평탄한 해안길 | 물리적 성격 | FOUNDER_LOCAL + DB |
| 독립 Place Entity | 여수해양공원과 병합 불가 | FOUNDER_DECISION |
| 시민 생활 공간 성격 | 여행자 전용이 아님 | WORLD_EXP + FOUNDER_LOCAL |

### 3B. Travel Knowledge

| 항목 | 내용 | Provenance | Status |
|---|---|---|---|
| 핵심 경험 캐릭터 | 걷기·앉기·쉬기·바다 보기 | WORLD_EXP + FOUNDER_LOCAL | APPROVED |
| 낮의 성격 | 어선·여객선·다리·케이블카가 함께 보이는 살아 있는 항구도시 | WORLD_EXP + FOUNDER_LOCAL | APPROVED |
| 저녁/밤의 성격 | 도시·다리·케이블카 불빛이 바다와 만나는 여수밤바다 경험 | WORLD_EXP + FOUNDER_LOCAL | APPROVED |
| 산책·휴식 | 끝까지 걸을 필요 없이 앉아서 쉬어도 좋음 | WORLD_EXP | APPROVED |
| 평일/주말 성격 차이 | 평일: 걷기·러닝 좋음. 주말·휴일: 혼잡, 러닝 어려울 수 있음 | FOUNDER_LOCAL | APPROVED |

### 3C. Relationship / Route Knowledge

| 관계 | 내용 | Provenance | Status |
|---|---|---|---|
| ← 이순신광장 | 해안 Journey 연결 — 이순신광장에서 이어짐 | FOUNDER_LOCAL + MAP_EVIDENCE | APPROVED |
| → 하멜 권역 | 해안 Journey 연결 — 하멜 방향으로 이어짐 | FOUNDER_LOCAL + MAP_EVIDENCE | APPROVED |
| 밤바다 Journey | 이순신광장 → 종포해양공원 → 하멜등대 → 낭만포차 | FOUNDER_LOCAL | APPROVED |
| 도보 walk_minutes | 미확정 — Travel Time Matrix Founder 검수 대기 | PENDING | PENDING |
| 여수해양공원과의 관계 | 별도 Entity — 공식 거리/경계 미확정 | VERIFY_REQUIRED | OPEN |

### 3D. Founder Local Knowledge (공식 사실로 임의 승격 불가)

| 항목 | 내용 |
|---|---|
| 주차 | 현재 신규 조성된 대규모 주차공간. Founder 기준 무료, 약 340대. |
| 주차 — 중요 | 오래된 "주차 없음" 또는 과거 요금 정보는 현재 답변에 사용 금지 |
| 접근성 | 평탄한 해안길. 휠체어/유모차 이용 가능 (Founder 현장지식) |
| 낚시 | 중심부는 낚시 금지. 다른 구역에서 일부 가능한 곳 존재. (→ Conflict A 참조) |
| 버스킹 | 주말 버스킹 가능성 있음 — 오늘 공연 여부는 LIVE_CHECK |

### 3E. Live / Volatile (Knowledge에 고정 금지)

| 항목 | 이유 |
|---|---|
| 오늘 공연/버스킹 | 비정기, 사전 미공지 |
| 현재 혼잡도 | 실시간 변동 |
| 현재 주차 운영 | 섬박람회 등 이벤트 관련 임시 운영 가능 |
| 날씨 기반 경험 | 실시간 |

---

## 4. Conflict Register

### Conflict A — Fishing (HIGH PRIORITY)

외부자료 충돌:

| 출처 유형 | 내용 |
|---|---|
| 오래된 관광자료 | 낚시 명소로 소개 |
| 일부 최근 자료 | 낚시 통제구역으로 소개 |
| 일부 여행 경험담 | 구역별로 낚시 가능 |
| Founder Local | 중심부 금지 / 다른 구역 일부 가능 |

**SOUL 행동 규칙 (확정):**

```
SOUL MUST NOT recommend Jongpo Marine Park as a fishing spot.
정확한 현재 통제구역 경계 확인 전까지 낚시 관련 긍정 안내 금지.
"낚시 가능한 곳"으로 소개하지 않는다.
어종/조황은 계절·물때에 따라 달라지므로 고정 안내 불가.
```

VERIFY_REQUIRED: 현재 통제구역 경계 + 허용 구역 공식 확인.

### Conflict B — Parking

| 출처 유형 | 내용 |
|---|---|
| 과거 관광자료 | 유료/야간무료/노상주차 등 서로 다른 정보 |
| 2026 섬박람회 관련 | 임시 운영 정보 존재 |
| Founder Local | 신규 대규모 무료 주차 약 340대 |

**SOUL 행동 규칙:**
- 과거 요금 정보 고정 금지
- 신규 주차 현황을 Founder Local 기준으로 안내 가능 (방향성 제시)
- 공식 명칭/면수/운영조건 → VERIFY_REQUIRED

### Conflict C — Place Naming

| 상황 | 내용 |
|---|---|
| 외부 콘텐츠 | 종포해양공원 / 여수해양공원 명칭 혼용 |
| Founder 지도 | 별도 표기 확인 |

**처리 원칙:** alias 금지. 공식 명칭 관계 → VERIFY_REQUIRED.

---

## 5. VERIFY_REQUIRED (공식 출처 확인 필요 — 미확인 전 SOUL에 노출 금지)

| 항목 | 현재 상태 | 필요 출처 |
|---|---|---|
| 낚시 통제구역 경계 | Founder 부분 확인 — 공식 경계 미확인 | 여수시 공고 or 현장 안내판 |
| 주차 공식명칭·면수·운영조건 | Founder Local (무료, ~340대) | 공식 주차장 정보 |
| 종포해양공원 ↔ 여수해양공원 공식 관계/경계 | Founder Map Evidence — 행정 경계 미확인 | 여수시 공식 정보 |
| Waterfront Axis 공식 명칭/총거리 | 미확인 | 여수시 관광 안내 |
| admission_fee | outdoor park이므로 무료 추정 | 확인 전 노출 금지 |
| opening_hours | outdoor park — 상시 개방 추정 | 확인 전 live_status_required=false 유지 |
| 접근성 (wheelchair, stroller) 공식 확인 | Founder 현장지식 존재 | 공식 접근성 안내 확인 권장 |

---

## 6. DO NOT PROMOTE

- 낚시 명소로 소개 (Conflict A)
- 과거 주차 요금 또는 "주차 없음" 표현
- 특정 업장/먹거리 고정 추천
- 정확한 공원 면적/길이 (1.5km 등 외부자료 수치 그대로 인용 금지)
- "여수해양공원"과 동일 장소로 소개
- 야간 안전에 대한 단정적 표현

---

## 7. World Experience 처리 원칙

World Experience (젠스파크·재미·코미)는 Truth Source가 아니다.
반복되는 경험 패턴을 Knowledge Input으로 취급한다.

**종포해양공원에서 반복된 패턴 (Knowledge Input 채택):**

| 팀원 | 표현 | Knowledge Input 분류 |
|---|---|---|
| 젠스파크 | "보는 것보다 머무는 것" | core identity 반영 |
| 재미 | "바다와 나 사이의 차분한 호흡" | daytime/nighttime char 반영 |
| 코미 | "앉아서 바다를 보는 시간 자체가 경험" | highlights + companion 반영 |
| 전체 반복 | 산책·벤치·휴식 | local_tips + companion 반영 |
| 전체 반복 | 낮과 밤의 경험 차이 | daytime/nighttime char 반영 |
| 전체 반복 | 주변 장소와 Journey 연결성 높음 | nearby_places + relationship 반영 |

---

## 8. Founder Map Evidence

**Evidence 유형:** Founder 제공 종포 일대 지도 이미지 2장  
**Asset 상태:** repo 저장 불가 환경 — 파일 경로 미생성  
**출처 기록:** Founder-provided map screenshot (2026-09-24 대화)

**지도에서 관찰된 사항 (Record only):**

- 이순신광장 별도 표기 확인
- 종포해양공원 별도 표기 확인
- 여수해양공원 별도 표기 확인
- 하멜/종화동방파제 권역 별도 확인
- 해안축을 따라 공간들이 연결된 구조 확인

**지도만으로 확정 불가:**
- 주차면수 (숫자는 Founder 언급 기준만)
- 낚시 통제 경계
- 행정 경계
- 정확한 구간 거리

---

## 9. SOUL Composition Example (Knowledge Example — LOCKED copy 아님)

```
종포해양공원은 뭔가를 많이 구경하는 곳이라기보다
바다 옆에서 천천히 걷고 쉬기 좋은 곳이에요.

낮에는 배가 오가는 항구와 케이블카, 다리가 함께 보여서
여수가 바다도시라는 느낌이 꽤 잘 나고요.
저녁이 되면 불빛이 바다에 들어오면서
분위기가 여수밤바다로 바뀌어요.

힘들면 끝까지 걸을 필요 없이
바다 보이는 곳에 앉아 쉬어도 좋아요.
이순신광장이나 하멜 쪽으로 여행을 이어가기도 편하고요.
```

---

## 10. READ-ONLY place_knowledge Field Draft

> 아직 migration 없음. place_knowledge 테이블 생성 후 이 draft를 기반으로 INSERT.
> 각 필드에 provenance 태그 명시.

```
place_code:      "marine_park"

identity_ko:     [TEAM_JUDGMENT + WORLD_EXP_PATTERN, confidence: MEDIUM]
  "바다를 곁에 두고 걷고 앉아 쉬는, 여수 원도심 해안의 머무름 장소예요.
   낮에는 어선과 케이블카, 돌산대교가 함께 보이는 살아 있는 항구도시의 성격이 있고,
   저녁이 되면 불빛이 바다에 들어오면서 여수밤바다의 분위기로 자연스럽게 바뀌어요."

highlights:      [WORLD_EXP_PATTERN + FOUNDER_LOCAL]
  - "바다 보며 걷기·앉기·쉬기"
  - "낮의 항구도시 전망 (어선·케이블카·돌산대교)"
  - "저녁·야간 여수밤바다 분위기"
  - "이순신광장·하멜 권역 해안 Journey 연결"

companion_notes: [TEAM_JUDGMENT + FOUNDER_LOCAL + DB suitable_for]
  couple:      "좋아요 — 바다 옆 산책, 저녁 여수밤바다 분위기"
  family:      "좋아요 — 평탄한 해안길, 아이 동반 가능"
  kids:        "좋아요 — 넓고 평탄. 단, 바다 인접 주의"
  elderly:     "좋아요 — 평탄한 해안길, 휠체어/유모차 가능 (Founder 현장지식)"
  solo:        "좋아요 — 혼자 바다 보며 쉬기에 좋음"
  large_group: "좋아요 — 넓은 공원"

weather_notes:   [INFERRED from indoor_outdoor=outdoor + zone]
  rain:  "poor — 야외, 피할 공간 없음"
  hot:   "limited shade — 저녁 방문 권장"
  wind:  "exposed — 해안 인접"
  cold:  "bearable — 산책 짧게 가능"

daytime_char:    [WORLD_EXP_PATTERN + FOUNDER_LOCAL]
  "낮에는 어선·여객선·케이블카·돌산대교가 함께 보이는 살아 있는 항구도시의 풍경이에요.
   평일에는 걷기·러닝하기 좋고, 주말에는 혼잡할 수 있어요."

nighttime_char:  [WORLD_EXP_PATTERN + FOUNDER_LOCAL]
  "저녁이 되면 도시·다리·케이블카 불빛이 바다와 만나
   여수밤바다 분위기로 전환돼요. 이순신광장에서 걸어오기 좋은 코스예요."

local_tips:      [FOUNDER_LOCAL]
  - "현재 대규모 주차공간 있음 (Founder 기준 무료, 약 340대)"
  - "오래된 '주차 없음' 정보는 현재 해당 없음"
  - "평탄한 해안길 — 휠체어/유모차 이용 가능"
  - "평일이 한산하고 걷기/러닝하기 좋음"
  - "주말·휴일에는 혼잡 가능"
  (낚시 관련 안내 금지 — Conflict A 참조)

photo_spots:     [WORLD_EXP_PATTERN — partial]
  - "바다와 돌산대교 배경"
  - "케이블카·항구 풍경 (낮)"
  - "야간 불빛 반영 수면"
  (추가 spot은 현장 확인 후 보완)

seasonal_notes:  [TEAM_JUDGMENT]
  spring:  "봄 산책 적합"
  summer:  "저녁·야간 방문 권장 (더위 회피)"
  autumn:  "산책 최적"
  winter:  null

nearby_places:   [PENDING — Travel Time Matrix Founder 검수 대기]
  예상 포함:
    - lee_soon_shin_plaza (이순신광장): 해안 축 연결, minutes PENDING
    - hamel_lighthouse (하멜등대): 해안 축 연결, minutes PENDING
    - romantic_pojangmacha (낭만포차거리): 밤바다 Journey 연결, minutes PENDING

transit_from_expo: [MISSING — VERIFY_REQUIRED]
  null

zone_co_visit:   [FOUNDER_LOCAL + MAP_EVIDENCE]
  - "lee_soon_shin_plaza"
  - "hamel_lighthouse"
  - "romantic_pojangmacha"

source_origin:   "world_experience + founder_local + team_judgment"
verified_date:   "2026-09"
confidence:      "MEDIUM"

authoring_notes: |
  [CONFLICT-A] 낚시: SOUL 안내 금지. VERIFY_REQUIRED — 공식 통제구역 경계 확인 전 노출 불가.
  [CONFLICT-B] 주차: 신규 무료 주차 Founder Local 기준 안내 가능. 공식 운영조건 VERIFY_REQUIRED.
  [CONFLICT-C] 명칭 혼용: 여수해양공원과 alias 금지. 공식 관계 VERIFY_REQUIRED.
  [VERIFY] admission_fee — outdoor park 무료 추정, 공식 확인 전 SOUL 노출 금지
  [VERIFY] opening_hours — 상시 개방 추정
  [VERIFY] 1.5km 수치 — 외부자료 수치 그대로 인용 금지
  [VERIFY] Waterfront Axis 공식 명칭·거리
  [FOUNDER_LOCAL] 주차 340대, 무료 — Official Fact 아님
  [FOUNDER_LOCAL] 접근성 — 공식 확인 권장
  [MAP_EVIDENCE] Founder 제공 지도 2장 (2026-09-24 대화) — asset pending, 파일 미보존
  [PENDING] nearby_places walk_minutes — Time Matrix Founder 검수 완료 후
  [MISSING] transit_from_expo — 여수엑스포역 기준 접근 확인 필요
```

---

## 11. Provenance 처리

종포해양공원 field별 provenance:

| Field group | source_type | confidence | do_not_promote |
|---|---|---|---|
| identity_ko | TEAM_JUDGMENT + WORLD_EXPERIENCE | MEDIUM | false |
| companion_notes | TEAM_JUDGMENT + FOUNDER_LOCAL + DB | MEDIUM | false |
| weather_notes | INFERRED | MEDIUM | false |
| daytime_char / nighttime_char | WORLD_EXPERIENCE + FOUNDER_LOCAL | MEDIUM | false |
| local_tips (주차·접근성·혼잡) | FOUNDER_LOCAL | MEDIUM | false — 방향성만 |
| local_tips (낚시 관련) | 해당 없음 | — | **true** — DO NOT PROMOTE |
| admission_fee | 추정 | LOW | **true** — VERIFY 전 노출 금지 |
| 1.5km 수치 | 외부자료 | — | **true** — DO NOT PROMOTE |
| 낚시 안내 (모든 형태) | CONFLICT-A | — | **true** — DO NOT PROMOTE |
| nearby_places walk_minutes | PENDING | — | true — 확정 전 |
| Map asset | FOUNDER-PROVIDED | — | Evidence note only |

---

## 12. Emerging Authoring Pattern (Observation Only)

두 장소(이순신광장 + 종포해양공원)에서 반복 관찰된 패턴:

```
Official         → factual skeleton
World Experience → how travelers actually experience the place
Founder          → current local reality / correction of outdated info
DreamTown        → emotional meaning
SOUL             → compose what this traveler needs now
```

**아직 SSOT Candidate로 승격하지 않는다.**  
두 사례뿐이다. 하멜등대/케이블카에서 반복 여부를 추가 관찰 후 결정한다.
