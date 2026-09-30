# Golden Question 01 — Diagnostic & Evidence State
**질문:** 라마다 여수에서 케이블카까지 어떻게 가나요?
**생성일:** 2026-09-30
**상태:** STRUCTURED — 미확인 항목 존재 (OPEN)

---

## 1. 조사 경위

SOUL Detail Page (여수해상케이블카 V0.3) 개발 중,  
차량 여행자 context에서 라마다 투숙 여행자의 케이블카 접근 구조가 논리적 공백으로 발견됨.

**조사 단계:**
1. Phase 1 — 내부 travel_places DB 조회 → Ramada 미등록 확인
2. Phase 2 — 내부 Route Corpus / Entity Manifest 조회 → Ramada 미출현 확인
3. Phase 3 — 내부 6117 코스 DB 조회 → Ramada 미출현 확인
4. Phase 4 — **외부 조사 (Founder 승인)** → 위치/관계 구조화 완료

---

## 2. CONFIRMED (확정 사실)

| 항목 | 값 | 신뢰도 | 근거 |
|---|---|---|---|
| 라마다 여수 주소 | 전라남도 여수시 돌산읍 강남로 11 | MEDIUM | 복수 외부 Source (호텔 예약 사이트 포함) 일치 |
| 라마다 위치 권역 | 돌산도 (Dolsan Island) — 내륙 아님 | MEDIUM | 행정구역 "돌산읍" 확인 |
| CABLE_DOLSAN ↔ 라마다 거리 | ~1.2km 도로 | MEDIUM | 주소 기반 추정. 현장 미측정. |
| CABLE_DOLSAN → 라마다 CAR | 5~7분 | MEDIUM | 위 거리 기반 계산. 현장 미측정. |
| CABLE_DOLSAN → 라마다 WALK | ~15분 | MEDIUM | 참고값. 보행 경로 지형 미확인. |
| 차량 여행자 왕복 구조 | 라마다 출발 → 돌산정류장 → 케이블카 왕복 → 라마다 복귀 | HIGH | Founder 운영 지식 확인 |

---

## 3. UNVERIFIED / OPEN

| 항목 | 상태 | 비고 |
|---|---|---|
| RAMADA → CABLE_JASAN (자산탑승장) 직접 이동시간 | NOT_FOUND | 외부 조사 후에도 미발견. 돌산대교 경유 추정이나 측정값 없음. |
| CONFLICT-H: 케이블카 토요일 운영시간 | OPEN | 21:30 (PU-CC-005 내부 기록) vs 22:30 (외부 일부 Source). 공식 미확인. |
| CONFLICT-A: 케이블카 요금 (일반/크리스탈) | SEMI_STABLE | 블로그 기반. 공식 확인 권장. |
| 라마다 → 자산탑승장 경로 소요시간 | UNKNOWN | 돌산대교 경유 예상. Evidence 없음. |

---

## 4. 핵심 발견 — Vehicle Recovery 구조

라마다가 돌산도 소재임이 확인되면서 차량 여행자의 케이블카 이용 구조가 바뀜.

```
[기존 가정 (잘못됨)]
자산 주차 → 편도 케이블카 → 돌산 → 차량으로 돌산에서 이동
문제: 차량이 자산에 남아있음

[라마다 투숙 차량 여행자의 자연스러운 구조]
라마다 (돌산도) → 돌산정류장 → 케이블카 왕복 → 라마다 복귀
→ 차량 회수 문제 없음. 왕복이 가장 자연스러운 구조.
```

**"돌산이 항상 최선" 단정 금지:**  
- 라마다 투숙자라면 돌산 출발이 자연스럽지만
- 다른 숙소(자산권/엑스포권)에서 출발하면 자산 출발이 자연스러움
- 차량 회수 필요 여부는 여행자 상황에 따라 다름

---

## 5. SOUL Response 설계 방향 (Working Direction — 미구현)

Golden Question 01에 대한 SOUL 응답은 다음 원칙을 따른다:

1. **판단 먼저**: "라마다는 돌산에 있어서 케이블카 돌산정류장이 훨씬 가까워요"
2. **왕복 구조 제안**: "돌산에서 타서 자산 구경하고 돌아오는 왕복이 자연스러워요"
3. **단정하지 않음**: 자산 출발이 더 나은 상황이 있음을 인식

미구현. SOUL Detail Page V0.x 프로토타입 이후 설계.

---

## 6. Knowledge 구조화 완료 목록

| 파일 | 변경 내용 |
|---|---|
| `docs/knowledge/YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md` | §13 신규 추가 — 라마다 여수 CANDIDATE 등록 |
| `docs/knowledge/YEOSU_TRAVEL_TIME_MATRIX_V0_1.md` | §2-F 신규 추가 — CABLE_DOLSAN↔RAMADA Edge 3행 + UNKNOWN 1행 + 통계 업데이트 |
| `docs/knowledge/YEOSU_TRAVEL_TIME_MATRIX_V0_1.csv` | 4행 신규 추가 |
| `docs/architecture/SOUL_PLACE_KNOWLEDGE_AUTHORING_STATE_2026_09_24.md` | Golden Question 01 structuring 완료 상태 업데이트 |

---

## 7. 다음 필요 조사

| 우선순위 | 항목 | 방법 |
|---|---|---|
| HIGH | CONFLICT-H 케이블카 토요일 운영시간 | 061-664-7301 직접 확인 |
| MEDIUM | RAMADA → CABLE_JASAN 이동시간 | 네이버/카카오맵 경로 조회 |
| LOW | 라마다 → 자산탑승장 전체 경로 확인 | 현장 측정 또는 지도 조회 |

---

*생성: Claude Sonnet 4.6 / Project Phoenix SOUL Travel Intelligence*  
*DB 변경 없음 / 스키마 변경 없음 / 운영 변경 없음*
