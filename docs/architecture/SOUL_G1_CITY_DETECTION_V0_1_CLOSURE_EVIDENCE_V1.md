# G1 City Detection V0.1 — Closure Evidence

**Version**: V0.1  
**Status**: DEPLOYED_AND_VERIFIED  
**PR**: #96 (Squash Merge)  
**Merge SHA**: b6c05978a020bc46dcb0d2f17bcd4f90e6bc29dc  
**Merge 시각**: 2026-10-22T03:14:20Z  
**Closure 문서 작성**: 2026-10-22T03:30 KST  

---

## 1. 구현 범위

### What Was Built
G1 City Detection V0.1은 레거시 `_classifyCityIntent()` 가드 앞에 위치하는 결정론적 전처리 레이어다.

**목적**: 순천/광양만 처리하던 레거시 가드가 부산·서울·제주 등 신규 도시를 처음 보면 여수 추천으로 fallback하는 문제를 차단한다.

### 수정 파일 (2개)
| 파일 | 변경 유형 |
|------|----------|
| `services/soyeowoolService.js` | G1 상수 9개 + `_detectCityCode()` 함수 추가 + `handleTravelRequest` 진입부에 G1 게이트 삽입 |
| `tests/soul/soulCityDetectionG1.test.js` | 신규 — 14개 테스트 (GA 5 + GB 4 + GS 5) |

---

## 2. G1 아키텍처

### `_detectCityCode(message)` 반환값
```
{ role, detected_city_name?, is_supported }
roles:
  ORIGIN_TO_YEOSU      — 신규 도시에서 여수로 이동하는 출발지 표현
  AMBIGUOUS            — 복수 신규 도시 동시 언급
  UNSUPPORTED_PRIMARY  — 단일 비지원 신규 도시 요청
  null                 — G1 적용 대상 아님 (기존 경로 유지)
```

### Gate A — ORIGIN_TO_YEOSU
- isOriginCity: 도시명 앞 8자 이내에 "에서" 포함
- `_G1_YEOSU_DEST_RE` 매칭: 여수/오동도/이순신광장/향일암/돌산대교/돌산공원/하멜등대/종포해양공원
- deferred/excluded 문맥(12자 window) 없음

### Gate B — 복수 신규 도시
- `mentionedCount >= 2` → AMBIGUOUS

### 감지 대상 도시
```javascript
BUSAN: ['부산', '해운대', '광안리']
SEOUL: ['서울', '명동', '강남', '홍대']
JEJU:  ['제주', '제주도']
GWANGJU: ['광주']
JEONJU:  ['전주', '한옥마을']
TONGYEONG: ['통영']
GEOJE: ['거제']
```

---

## 3. 로컬 테스트 결과

### 신규: soulCityDetectionG1.test.js 14/14 PASS
| ID | 설명 | 예상 | 결과 |
|----|------|------|------|
| GA-1 | 부산에서 여수로 왔어 | NOT CITY_UNSUPPORTED | PASS |
| GA-2 | 부산에서 왔는데 오동도 가고 싶어 | NOT CITY_UNSUPPORTED | PASS |
| GA-3 | 부산에서 여행할 건데 여수는 다음에 | CITY_UNSUPPORTED or CITY_AMBIGUOUS | PASS |
| GA-4 | 부산에서 오동도 말고 해운대 갈래 | CITY_UNSUPPORTED or CITY_AMBIGUOUS | PASS |
| GA-5 | 부산에서 여수랑 제주 비교해 줘 | CITY_AMBIGUOUS | PASS |
| GB-1 | 부산이랑 서울 비교해 줘 | CITY_AMBIGUOUS | PASS |
| GB-2 | 부산 다음 제주도 갈 거야 | CITY_AMBIGUOUS | PASS |
| GB-3 | 서울 1박 부산 1박 | CITY_AMBIGUOUS | PASS |
| GB-4 | 여수랑 부산 둘 다 여행 | CITY_AMBIGUOUS | PASS |
| GS-1 | 순천에서 여수로 왔어 | NOT CITY_UNSUPPORTED (D3.1) | PASS |
| GS-2 | 순천에서 왔어 | CITY_UNSUPPORTED | PASS |
| GS-3 | 부산에서 케이블카 타고 싶어 | CITY_UNSUPPORTED | PASS |
| GS-4 | 광주 여행 추천 | CITY_UNSUPPORTED | PASS |
| GS-5 | 여수랑 순천 비교 | CITY_UNSUPPORTED or CITY_AMBIGUOUS | PASS |

### 기존 회귀: 447/448 (1 pre-existing FAIL)
- R20 PRE-EXISTING FAIL (UNRESOLVED): dolsan_daegyo "걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY
- G1이 신규 회귀를 도입하지 않음 확인

---

## 4. 알려진 제한사항

### RR-1: 미등록 도시 fallback
`_G1_DETECTABLE_NEW_CITIES`에 없는 도시(대구, 인천, 청주 등)는 G1 감지 범위 밖. 레거시 가드로 fallthrough.  
**해결**: 추후 G1 도시 목록 확장 시 대응.

### R20 PRE-EXISTING FAIL
dolsan_daegyo "걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY 미처리  
**G1 범위 밖.** 수정 금지(Founder 결정 필요).

---

## 5. Production 배포 상태

### PR #96 Merge
- Merge SHA: `b6c05978a020bc46dcb0d2f17bcd4f90e6bc29dc`
- Merge 시각: `2026-10-22T03:14:20Z`
- GitHub deployment 기록: `2026-10-22T03:14:20Z`
- Render 자동 배포 트리거: `deploy-check.yml` on push to main

### Rollback Reference
- Pre-merge main HEAD: `d960dada0df48be6166315f815ee8771436a0225`
- 롤백 명령: `git revert HEAD; git push`

### Production API 검증 (2026-10-22T03:44 KST — Render Live SHA b6c05978 확인 후)
- Health: HTTP 200 OK (`{"status":"ok","service":"dreamtown-api","timestamp":"2026-10-22T03:44:43.019Z"}`)
- Render Deploy ID: `dep-dbco8ia9lscs73eimui0` / Live SHA: `b6c05978a020bc46dcb0d2f17bcd4f90e6bc29dc`

| 테스트 | 입력 | 기대 | 실제 | 판정 |
|--------|------|------|------|------|
| T1 여수 정상 | "여수 2시간 있어" | NOT CITY_UNSUPPORTED | CLARIFICATION | ✓ PASS |
| T2 부산 차단 | "부산 여행 추천해줘" | CITY_UNSUPPORTED | CITY_UNSUPPORTED | ✓ PASS |
| T3 출발지 구분 | "부산에서 왔는데 오동도 가고 싶어" | NOT CITY_UNSUPPORTED | JOURNEY_CONTINUITY | ✓ PASS |
| T4 복수 도시 | "여수랑 부산 둘 다 여행" | CITY_AMBIGUOUS | CITY_AMBIGUOUS | ✓ PASS |

**T2 응답 message_ko**: "부산은(는) 아직 제가 안내드릴 수 있는 지역이 아니에요. 현재는 여수 여행을 도와드릴 수 있어요. 여수에서 비슷한 경험을 찾아드릴까요?"  
**T4 응답 message_ko**: "어느 지역을 먼저 여행하고 싶으신지 알려주세요. 현재는 여수 여행을 도와드릴 수 있어요."  
**T3 비고**: JOURNEY_CONTINUITY는 CITY_UNSUPPORTED가 아님 → GA-2 조건 충족. ORIGIN_TO_YEOSU 게이트 통과 후 레거시 경로 진행.

**최종 판정: 4/4 PASS — G1 V0.1 DEPLOYED_AND_VERIFIED**

---

## 7. 관련 문서
- PRE-PILOT Readiness: `SOUL_PRE_PILOT_READINESS_CHECK_V0_1.md`
- G1 Design Spec: (session context — no separate design doc)
- DREAMTOWN_STATUS.md: Current Next Action 업데이트 예정
