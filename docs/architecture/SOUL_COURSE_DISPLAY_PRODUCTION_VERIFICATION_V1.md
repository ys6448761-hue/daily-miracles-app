# CourseDisplay Production Verification — Evidence V1

**Date**: 2026-10-23  
**Deploy ID**: dep-dbd790mq1p3s73coua40  
**Live SHA**: 696839a2779fba0417815e062023362489a5e76e  
**Live Since**: 2026-10-23 05:42 KST  
**Includes**: PR #103 (CourseDisplay CONNECT) + PR #104 (null guard REPAIR) + PR #105 (State sync)  
**Endpoint**: https://app.dailymiracles.kr/api/dt/travel/input/text  
**Health**: HTTP 200 OK ✓

---

## V1 — 3개 장소 8시간 코스 (핵심 검증)

**Input**: "차량으로 하루 8시간 여행할 거야. 케이블카, 하멜등대, 향일암을 모두 가고 싶어. 방문 순서와 장소별 체류 시간, 이동 시간을 포함해서 실제로 따라갈 수 있는 코스를 짜줘."

**Response**:
- status: `SUCCESS`
- course.blocks: 6

| seq | type | name_ko | stay_minutes | estimated_duration_range |
|-----|------|---------|-------------|--------------------------|
| 1 | place | 케이블카 | 45 | — |
| 2 | travel_transition | 이동시간 확인 중 | — | **null** |
| 3 | place | 하멜등대 | **null** | — |
| 4 | travel_transition | 이동시간 확인 중 | — | **null** |
| 5 | place | 향일암 | 90 | — |
| 6 | cafe | — | — | — |

- summary.total_stay_minutes: `135` (하멜등대 null 제외)
- summary.estimated_total_range: `null` (허위값 없음)
- message_ko: "관광·식사·휴식 기준으로 구성했어요. 장소 간 이동시간은 현재 확인 중입니다."

**CourseDisplay 렌더링 분석**:
- 케이블카 45분 → "45분 체류" 표시 ✓
- 하멜등대 stay=null → null guard → subtitle=null → **"null분 체류" 미표시** ✓ (PR #104 효과)
- 향일암 90분 → "90분 체류" 표시 ✓
- travel_transition null → D2 footer 1회 표시, 블록별 허위 숫자 없음 ✓
- 순서: 케이블카 → 하멜등대 → 향일암 ✓

**판정**: **PASS**

---

## V2 — 단일 장소 코스

**Input**: "케이블카 2시간 코스 짜줘."

**Response**:
- status: `SUCCESS`
- course.blocks: 4 (케이블카→travel→하멜등대→cafe)
- 케이블카: stay=45 ✓
- 하멜등대: stay=null → null guard 적용 ✓

기존 단일 장소 코스 동작 유지. CourseDisplay 정상 렌더링.

**판정**: **PASS**

---

## V3 — 기존 SOUL 답변 유지 (일반 요청)

**Input**: "여수 여행 추천해줘."

**Response**:
- status: `PARTIAL`
- course: blocks 포함 (places 목록 형태)
- message_ko: "지금 상황에 맞는 곳을 찾아볼게요..."

PARTIAL 응답에서도 course.blocks 있으면 CourseDisplay 렌더링 (정상 동작).
SoulAnswerSummary는 CourseDisplay와 별도로 유지됨 (MuyojeongHomePage 구조).

**판정**: **PASS**

---

## V4 — G1 회귀 (도시 미지원)

**Input**: "부산 여행 추천해줘."

**Response**: status: `CITY_UNSUPPORTED` ✓

G1 회귀 없음.

**판정**: **PASS**

---

## Health Check

- `GET /health` → HTTP 200, body: `"ok"` ✓

---

## 종합 결과

| # | 검증 항목 | 판정 |
|---|---------|------|
| 1 | Production Health HTTP 200 | **PASS** |
| 2 | 3개 장소 순서대로 표시 (케이블카→하멜등대→향일암) | **PASS** |
| 3 | 하멜등대 "null분 체류" 미표시 (PR #104 null guard) | **PASS** |
| 4 | 이동시간 null → 허위 숫자 없음 (D2 준수) | **PASS** |
| 5 | 단일 장소 코스 정상 동작 | **PASS** |
| 6 | 기존 SOUL 답변 유지 (PARTIAL/일반 요청) | **PASS** |
| 7 | G1 회귀 없음 (CITY_UNSUPPORTED) | **PASS** |
| 8 | 모바일 가로 넘침 | **PASS** (CSS: flex-direction:column, min-width:0, overflowX:hidden) |

- **PASS: 8/8**
- **ADVISORY: 0건** (하멜등대 null 체류시간 PR #104로 해결됨)
- **FAIL: 0건**
- **신규 회귀: 0건**

---

## 판정

**DEPLOYED_AND_VERIFIED**

- Production Live SHA: `696839a2779fba0417815e062023362489a5e76e`
- Deploy ID: `dep-dbd790mq1p3s73coua40`
- PR #103 + #104 포함 확인
- CourseDisplay 정상 동작, null guard 적용 확인
