# SOUL Parking & Route Reality Check V0.1

**작성일**: 2026-10-22 KST  
**작업 성격**: 기능 개발 아님 — 현황 확인 및 Evidence 수집  
**Render Live SHA**: `b6c05978a020bc46dcb0d2f17bcd4f90e6bc29dc`  
**대상 장소**: 여수 SOUL Phase 1 완료 8개 (이순신광장, 향일암, 오동도, 케이블카, 돌산공원, 돌산대교, 종포해양공원, 하멜등대)

---

## A. 주차 기능 현황

### A-1. 코드 상 주차 데이터 구조 (`_PLACE_KNOWLEDGE`)

| 장소 | place_code | parking_ko | parking_trust | 비고 |
|------|-----------|-----------|--------------|------|
| 케이블카 | cablecar | 있음 | (없음) | "자산(해야)·돌산(놀아) 양쪽..." |
| 오동도 | odongdo | null | UNKNOWN | UNKNOWN 메시지 반환 |
| 향일암 | hyangiram | null | UNKNOWN | UNKNOWN 메시지 반환 |
| 이순신광장 | lee_soon_shin_plaza | null | UNKNOWN | UNKNOWN 메시지 반환 |
| 돌산공원 | dolsan_nightscape | 있음 | (없음) | "공영주차장. 최초 1시간 무료, 10분당 200원" |
| 종포해양공원 | marine_park | 없음(필드 미존재) | 없음(필드 미존재) | fallback "현장 확인" |
| 돌산대교 | dolsan_daegyo | 없음(필드 미존재) | 없음(필드 미존재) | fallback "현장 확인" |
| 하멜등대 | hamel_lighthouse | 없음(필드 미존재) | 없음(필드 미존재) | fallback "현장 확인" |

**데이터 성격**: 100% 정적 `_PLACE_KNOWLEDGE` 객체. 외부 API 없음. 실시간 혼잡 정보 NOT_IMPLEMENTED.

### A-2. 주차 PSQ Production 검증

테스트 조건: `place_code` in `explicit_context`, "주차 [위치/가능/있나요?]" 형태 (어때요 없이)

| 장소 | 질문 | status | 응답 유형 | 판정 |
|------|------|--------|---------|------|
| 케이블카 | "케이블카 주차 어디에 해요?" | PLACE_SPECIFIC_QUERY | parking_ko 반환 | ✓ PASS |
| 오동도 | "오동도 주차 가능한가요?" | PLACE_SPECIFIC_QUERY | UNKNOWN 메시지 + phone | ✓ PASS |
| 향일암 | "향일암 주차장 있나요?" | PLACE_SPECIFIC_QUERY | UNKNOWN 메시지 | ✓ PASS |
| 이순신광장 | "이순신광장 주차 어디서 해요?" | PLACE_SPECIFIC_QUERY | UNKNOWN 메시지 | ✓ PASS |
| 돌산공원 | "돌산공원 주차 어디에 해요?" | PLACE_SPECIFIC_QUERY | parking_ko 반환 | ✓ PASS |
| 종포해양공원 | "종포해양공원 주차 가능한가요?" | PLACE_SPECIFIC_QUERY | "현장 확인 필요" + phone | ✓ PASS |
| 돌산대교 | "돌산대교 주차 가능한가요?" | PLACE_SPECIFIC_QUERY | "현장 확인 필요" | ✓ PASS |
| 하멜등대 | "하멜등대 주차 어디서 해요?" | PLACE_SPECIFIC_QUERY | "현장 확인 필요" | ✓ PASS |

**8/8 PASS** — 임의 정보 생성(hallucination) 없음 확인.

### A-3. 주차 PSQ 미도달 문제 (PRE-EXISTING P-2)

- "주차 **어때요**?" 형태 → PLACE_LOOKUP 반환 (parking PSQ 미도달)
- 원인: `어때요` 키워드가 PLACE_LOOKUP 분기를 먼저 트리거
- 예: "케이블카 주차 어때요?" → PLACE_LOOKUP (parking_ko 미노출)
- **판정**: P-2 ADVISORY — PRE-EXISTING. Cablecar Phase 1 이후 Known Issue. 신규 회귀 아님.

### A-4. C-3 주차 Appending (has_car=true 코스 응답)

- `has_car=true` + 시간 명시 → SUCCESS, places=[케이블카, 하멜등대]
- `message_ko`에 "주차 정보:\n  · 자산(해야)·돌산(놀아)..." 정상 추가됨 ✓
- hamel_lighthouse는 parking_ko 없어서 미추가 (올바른 동작)

### A-5. Parking Option B 상태

- 위치: `feat/muyojeong-time-select-v1` 브랜치 — `_PLACE_PARKING` + `_buildParkingOptionBAnswer()`
- 게이트: `approved_for_customer_publication: false` (전 장소 공통)
- Production 반영: **없음** ✓
- 활성화 조건: 장소코드 확정 + Founder 별도 승인

### A-6. 실시간 정보 지원 여부

| 유형 | 지원 여부 |
|------|---------|
| 실시간 주차 혼잡 | NOT_IMPLEMENTED |
| 실시간 운영 상태 | NOT_IMPLEMENTED |
| 외부 주차 API | NOT_IMPLEMENTED |
| 정적 주차 데이터 | 2곳 VERIFIED (cablecar, dolsan_nightscape) |

---

## B. 여행코스 현황

### B-1. 단일/시간 기반 코스

| 테스트 | 입력 | status | places | 판정 |
|--------|------|--------|--------|------|
| R1 2~3시간 | "여수에서 2~3시간 있어요. 어디 갈까요?" | SUCCESS | 케이블카, 하멜등대 | ✓ |
| R3 5시간 | "여수에서 5시간 있어요. 어디 갈까요?" | SUCCESS | 케이블카, 하멜등대, 향일암 | ✓ |
| R4 8시간 | "여수에서 8시간 있어요. 어디 갈까요?" | SUCCESS | 케이블카, 하멜등대, 향일암 | PARTIAL ⚠ |
| R9 차량+2h | "차 있고 여수에서 2~3시간 있어요." + has_car=true | SUCCESS | 케이블카, 하멜등대 | ✓ |
| R8 어르신 | "부모님과 여수에서 하루 여행 코스" | PARTIAL | 자산공원, 이순신광장, 해양공원 | ✓ |

**R4 ⚠**: 8h와 5h가 동일 3개 장소 추천. `hamel_lighthouse.stay_minutes = null`이 시간 계산에 영향. 더 긴 시간에 장소 수 확장 미작동.

### B-2. 복수 장소 사용자 지정

| 테스트 | 입력 | 감지(shared_journey.want) | 코스 결과 | 판정 |
|--------|------|--------------------------|---------|------|
| R5 케이블카+오동도 | "케이블카랑 오동도 가고 싶어요. 코스 짜줘." | 케이블카(EXPLICIT) + 오동도(EXPLICIT) | 케이블카, 하멜등대, 향일암 | ✗ FAIL |
| R6 향일암+돌산공원 | "향일암이랑 돌산공원 코스로 짜줘요." | (미확인) | 케이블카, 하멜등대, 향일암 | ✗ FAIL |

**발견**: `shared_journey.want`가 두 장소를 EXPLICIT으로 감지하지만 코스 생성 시 오동도가 누락됨.
- R5 message: "케이블카를 포함해서 일정을 잡아볼게요." (오동도 무시)
- `status = PARTIAL` — 사용자 지정 장소 완전 보존 실패

### B-3. 이동수단 구분

| 테스트 | 입력 | 결과 | 판정 |
|--------|------|------|------|
| R2 차량+모호 | "여수에서 2~3시간 있어요. 차 있어요." + has_car=true | CLARIFICATION | △ 허용 (목적지 미명시) |
| R7 도보 | "걸어서 갈 수 있는 곳" + has_car=false | SUCCESS: 케이블카, 하멜등대, 향일암 | ✗ 미반영 |

**R7 ⚠**: has_car=false로 도보 요청했지만 케이블카가 추천됨. 케이블카는 차량 접근이 기본 동선임에도 도보 불편 고려 없이 추천.

### B-4. R20 (PRE-EXISTING Known Limitation)

- "돌산대교 걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY (정보 없음)
- **R20 수정 금지** (Founder 별도 결정 대기)

---

## C. 우선순위 판단

### C-1. 실제 고객 경험에 영향을 주는 문제

| ID | 문제 | 심각도 | 유형 |
|----|------|--------|------|
| P-NEW-1 | 복수 장소 지정 시 오동도 코스 누락 (R5) | HIGH | 신규 발견 |
| P-NEW-2 | 도보 이동 요청 시 has_car=false 미반영 (R7) | MEDIUM | 신규 발견 |
| P-NEW-3 | 8h와 5h가 동일 장소 수 (hamel stay_minutes=null) | LOW | 신규 발견 |
| P-2 | "주차 어때요?" → parking PSQ 미도달 | LOW | PRE-EXISTING Advisory |
| R20 | dolsan_daegyo 도보 질문 → JOURNEY_CONTINUITY | LOW | PRE-EXISTING Known Limitation |

### C-2. 신규 장소 추가 전 수정 권고 사항

**수정 권고 (Founder 결정 필요):**
1. **P-NEW-1**: 사용자 지정 복수 장소 코스 보존 — 오동도 등 명시 장소가 코스에 반드시 포함되어야 함
2. **P-NEW-2**: has_car=false 시 도보 적합 장소 필터링 적용
3. **P-NEW-3**: hamel_lighthouse.avg_stay_minutes 설정 (현재 null → 시간 계산 불가)

**현재 상태로 운영 가능한 사항:**
- 단일 장소 추천 (2~3h / 5h) ✓
- 주차 PSQ (직접 질문) ✓
- 어르신/가족 동반 필터 ✓
- C-3 주차 appending (has_car=true 코스) ✓

### C-3. 신규 장소 추가 전 필요 여부

| 항목 | 판단 |
|------|------|
| 9·10번째 장소 추가 | P-NEW-1 해결 후 권장 |
| Parking Option B 활성화 | 장소코드 확정 + Founder 승인 필요 (별도 트랙) |
| 실시간 혼잡 API | 추가 개발 필요 (현재 미구현) |

---

## D. Evidence 저장 위치

- 이 문서: `docs/architecture/SOUL_PARKING_ROUTE_REALITY_CHECK_V0_1.md`
- 코드 변경: 없음 (현황 확인만)
- Production 배포: 없음
- SSOT/Candidate 신규 생성: 없음

---

## Known Limitations (변경 금지)

- R20: dolsan_daegyo "걸어서" → JOURNEY_CONTINUITY (Founder 결정 대기)
- G1 RR-1: 미등록 도시 fallback to legacy guard (확장 예정)
- Parking Option B: gate=false (장소코드 확정 + Founder 별도 승인 필요)
