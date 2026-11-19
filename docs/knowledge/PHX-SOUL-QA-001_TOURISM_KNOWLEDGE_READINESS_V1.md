# PHX-SOUL-QA-001 — 관광 Knowledge 활용 가능 범위 감사 (V1, 2026-11-20)

> §62. 읽기 전용 감사. 서비스 코드 수정, DB Migration 실행, 운영 DB 연결, 관광 데이터 등록, 미확인 혜택 등록, 실제 LLM 호출, push 없음.
> 기준 HEAD `dc175c2` (원격 `9ad729f`). Clarify 정책은 CLOSED. §60 (8/12/0) 과 §61 은 변경하지 않음.
> 상태 분류: VERIFIED (근거 및 승인 확인) · EXISTS (존재, 근거 또는 승인 미확인) · STUB (테스트 전용) · MISSING (데이터 없음) · CONFLICT (출처 간 충돌).
> 코드에 하드코딩되어 있다는 사실만으로 VERIFIED 처리하지 않는다.

## Guardian Preflight Report (감사 전 기록)

```
### Guardian Preflight Report

Requested Change:
  기존 DreamTown·SOUL Knowledge 자산의 실제 활용 가능 범위 확인 (읽기 전용).
  12개 부분 성공 질문 (H04·H06·H07·H09·H10·H12·H13·H14·H15·H17·H19·H20) 에 필요한 정보의 상태 분류와 재사용 계획.

Existing Assets Found:
  SSOT: SSOT-LOC-001 (Confirmed), SSOT-ROUTE-002 (Confirmed), SSOT-TIME-001 (Confirmed), SSOT-ROUTE-001 (Confirmed), SSOT-ROUTE-003 (Draft),
        DreamTown Travel System SSOT (Active), PARTNER_MASTER_V1 (Template), partner_master.csv
  DB: migrations 200 (travel_places), 202 (live status), 206 (accessibility), 207 (stay time), seeds 001/002/003
  Evidence: TRAVEL-PLACES-STAY-TIME-V01-EVIDENCE (2026-10-25, Founder 승인 hamel 30 · hyangiram 120)
  Code: services/travelGuideService.js (VERIFIED_TRAVEL_EDGES, DB 조회), services/soyeowoolService.js (_PLACE_KNOWLEDGE),
        services/itineraryService.js (하드코딩 spot 목록), services/routeSkeletonService.js (순수 모듈)
  Sowonpass: docs/research/sowonpass PHX-BENEFIT-001 체크리스트 (혜택 승인 상태)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 (읽기 전용). 운영 DB 미연결 (migration 적용 여부 확인 불가 → 미확인으로 기록).

Relevant Files:
  위 목록 (읽기만), 감사 결과 문서 (본 문서).

Relevant Databases:
  없음 (운영 DB 연결 금지). 저장소의 migration·seed 파일만 읽음. 실제 운영 적용 여부는 미확인.

Change Classification:
  감사 (코드·데이터 변경 없음).

Connection Opportunity:
  기존 자산 연결 가능성만 평가. 새 Schema·Architecture 제안 안 함.

Duplication Risk:
  없음.

Data Risk:
  없음 (읽기 전용). 개인정보·Key 미포함 (기록은 파일 경로와 값의 요약만).

Recommended Approach:
  1) 자산별 출처·승인·충돌 확인 (VERIFIED 는 문서 승인 또는 Founder 승인 근거가 있는 경우만)
  2) 질문별 필요 정보 → 상태 분류
  3) 재사용 가능 범위 (즉시 / 연결만 / 승인·출처 확인 / 신규 조사 / 불가)
  4) 최소 개선 계획 (기존 연결만으로 가능한 것과 새 정보가 필요한 것 구분)

Questions Requiring Decision:
  F1. 오동도 체류시간 기준 (DB 120 · SSOT-ROUTE-002 슬롯 90 · itineraryService 1.5h 90) — 운영 기준 확정 필요
  F2. SOUL 응답에 쓰는 _PLACE_KNOWLEDGE 문장의 출처 승인 여부 (현재 코드 하드코딩, 인용 없음)
  F3. 파트너 목록 상태 (CSV active vs 마스터 문서 Template) 및 카페 혜택 승인 상태

Implementation Status: READY (읽기 전용 감사)
```

## 1. 기존 자산 목록과 상태 (출처 기준)

| # | 자산 | 출처 | 상태 | 내용과 한계 |
|---|---|---|---|---|
| A1 | 장소 감정 역할 (SSOT-LOC-001) | docs/ssot/media/SSOT-LOC-001 (Confirmed, Aurora5) | VERIFIED (역할·감정만) | 장소의 감정 역할. 운영 사실 (시간·거리·접근) 없음. 오동도 항목 없음 |
| A2 | EP01 1박2일 체험 Route (SSOT-ROUTE-002) | docs/ssot/episodes (Confirmed, Aurora5) | VERIFIED (설계 문서) · CONFLICT (체류) | Day1 10:00~23:30, Day2 09:00~18:00 시간표. 오동도 09:00~10:30 (90분), 케이블카 16:00~17:30 (90분). DB 체류값과 불일치 |
| A3 | EP01 운영 타임플로우 (SSOT-TIME-001) | docs/ssot/episodes (Confirmed) | VERIFIED (항목별, 계절 의존) | 케이블카 판매가 15,000원 (정상 17,000), 유람선 운영 선사·가격, 하멜등대 23:00~23:30 등. 오동도 운영시간 없음. "여름철" 기준이라 적용 기간 확인 필요 |
| A4 | EP01 Route SSOT-ROUTE-001 / 003 | docs/ssot/episodes | VERIFIED (001) · DRAFT (003) | 001 Confirmed (감정 항로). 003 Draft (미결 항목 존재), 사용 금지 |
| A5 | 여행 시스템 SSOT (Travel System) | docs/ssot/support (Active) | EXISTS (설계 문서) | 항로 4종, 4인 이하 자동 일정 생성, 5인 이상 상담. 근거 데이터 없음 |
| A6 | travel_places 스키마 | database/migrations/200, 206, 207 | EXISTS (스키마) | 운영시간·요금·주차·접근성·physical_difficulty 칼럼 정의. 운영 적용 여부 미확인 |
| A7 | travel_places 시드 (14곳) | database/seeds/001 | EXISTS (혼합) | 좌표 (하멜등대 = 해양수산청 공식 근거 2026-10-19 VERIFIED), suitable_for, avg_stay_minutes, trust_level (ORIGIN·VERIFIED 라벨). ORIGIN-001 원천 문서 저장소에 없음 |
| A8 | 체류시간 승인 (207 + Evidence) | database/migrations/207, docs/knowledge/TRAVEL-PLACES-STAY-TIME-V01 | VERIFIED (하멜 30, 향일암 120) | Founder 승인 2026-10-25. 오동도·케이블카 체류는 승인 대상 아님 (변경 없음으로만 기재). 운영 DB 적용은 별도 승인 대기 |
| A9 | 접근성 상태 (206) | database/migrations/206 | MISSING (의도적 unknown) | 12곳 전부 unknown. 'unknown 을 verified_no 로 바꾸지 말 것' 규칙 명시 |
| A10 | 실시간 상태 (202, 시드 002) | database/seeds/002 | VERIFIED (unknown 기본) | 전부 unknown, 자동 소스 없음 (수동 운영). 실시간 답변 불가가 정확한 상태 |
| A11 | 식당 시드 (003) | database/seeds/003 | MISSING | 파일 자체가 "검증 전, 비어 있음" |
| A12 | 이동 간선 VERIFIED_TRAVEL_EDGES | services/travelGuideService.js L31~ (코드) | EXISTS (코드 하드코딩, 차량 기준) | 8개 간선, car + buf → op. 이름이 VERIFIED 지만 근거 문서 없음, 이동 수단이 차량. 도보 간선 아님. 오동도 간선 없음 |
| A13 | 장소 설명·도보·계단·동반 문장 (_PLACE_KNOWLEDGE) | services/soyeowoolService.js L331~ (코드) | EXISTS (코드 하드코딩, 인용 없음) | experience_ko·walking_ok·stairs_ko·fit_ko·hours_ko (NON_OFFICIAL 표시). 주석은 "batch-verified" 라고 쓰지만 원천 문서 인용 없음. §60 응답에 사용 중 |
| A14 | 추천 후보 데이터 (travelGuideService 조회) | services/travelGuideService.js L915, L1280 (DB 조회) | EXISTS (DB 의존) | 운영 DB 행을 읽음. 운영 DB 내용은 확인 불가 (미확인) |
| A15 | 자체 일정 생성기 (itineraryService) | services/itineraryService.js + routes/itineraryRoutes.js | EXISTS (별도 시스템, SOUL 미연결) | 하드코딩 spot 목록: 오동도 1.5h, 케이블카 1h, 향일암 1.5h (DB·SSOT 와 불일치). AI 호출 포함 |
| A16 | 파트너 목록 CSV (12곳) | docs/ssot/ops/partner_master.csv | EXISTS · CONFLICT | 카페 8곳 (status active) + 기타 4곳. 좌표 전부 공란. 마스터 문서는 "Template (데이터 미입력)" → 상태 충돌 |
| A17 | 소원패스 혜택 체크리스트 | docs/research/sowonpass PHX-BENEFIT-001 | EXISTS (승인 미확인) | 카페·음식점 항목 "미확인". 모이핀 혜택은 §15 Q4 미결 |
| A18 | 경로 골격 모듈 (routeSkeletonService) | services/routeSkeletonService.js (ad3503a 복구) | EXISTS (데이터 없음) | 순수 함수. 후보 목록과 일수만 받음. 자체 데이터 없음 |
| A19 | 추천 stub (하네스) | C:\DEV\_phx_soul_test_harness (저장소 밖) | STUB | 질의와 무관하게 DB 4행 반환. 실제 품질 검증 아님 |

## 2. 질문별 Knowledge Readiness

| 질문 | 필요한 정보 | 현재 자산 (상태) | 활용 가능 여부 | 막힌 지점 |
|---|---|---|---|---|
| **H04** 오동도 관람시간 | 체류시간 기준, 운영시간 | 체류 120 (A7 EXISTS, 승인 없음) · SSOT-ROUTE 90 (CONFLICT) · itinerary 90 (EXISTS) · 운영 09:00~17:00 (A13 EXISTS, NON_OFFICIAL) | 부분 | F1 (체류 기준 결정). 운영시간 공식 확인 |
| **H17** 한 바퀴 소요 | 체류시간 기준 | 같음 | 부분 | F1 |
| **H06** 도보 여행 (오동도) | 관광지 내부 도보, 거리·시간, 계단 | walking_ok 문장 (A13 EXISTS) · 계단 정보 없음 (오동도) · 도보 간선 없음 (A12 차량 기준) | 부분 (한 곳 설명만) | 장소 간 도보 연결·거리·시간 MISSING. 여러 장소 도보 코스 불가 |
| **H10** 성인 가족 도보 코스 | 동반 적합, 도보 후보, 도보 연결 | suitable_for elderly·kids_ok (A7 EXISTS, 오동도·케이블카·재산공원) · 후보 카드 (A14 EXISTS) · 도보 연결 MISSING | 부분 (후보와 적합만) | 도보 연결·이동시간 MISSING |
| **H14** 아이 동반 도보 | 아이 동반 적합, 쉬는 장소, 계단 | kids_ok (A7 EXISTS) · fit_ko 문장 (A13 EXISTS) · 쉼터·휴식 장소 MISSING | 부분 | 아이용 쉼터·안전 정보 MISSING |
| **H09** 오동도+케이블카 반나절 | 체류 2곳, 이동 시간, 반나절 구성 | 체류 120·45 (DB) vs 90·90 (SSOT, itinerary) CONFLICT · 오동도↔케이블카 간선 MISSING · 반나절 시간표 없음 (SSOT-ROUTE 는 1박2일) | 불가 (구성) | 간선 MISSING, 체류 CONFLICT |
| **H19** 첫 여행 후보 | 대표 장소 후보, 근거 | 후보 4곳 (A14 DB, 트러스트 혼합) · 장소 역할 (A1 VERIFIED) · 순위·추천 근거 없음 (편집 결정) | 부분 (후보 안내) | 대표 목록 승인 (Q-K2 는 테스트 후보로만 승인됨) |
| **H20** 부모님 1박2일 골격 | 1박2일 시간표, 장소 정보, 부모님 적합 | 시간표 (A2 VERIFIED 설계, 체류 CONFLICT) · suitable_for elderly (A7 EXISTS, 케이블카는 elderly 없음) · route.days 노출 보류 (Q1, 로컬 전용) | 부분 (골격 미노출) | 체류 CONFLICT, route 노출 승인 필요 |
| **H07** 바다 전망 카페 | 카페 목록, 위치, 전망, 혜택 | 카페 8곳 주소만 (A16 EXISTS·CONFLICT, 좌표 없음) · 전망 문구는 파트너 제공 카피 (4곳) · 혜택 미확인 (A17) | 불가 (추천) | 전망 검증 MISSING, 좌표 MISSING, 파트너 승인 CONFLICT |
| **H15** 오동도 근처 바다 카페 | 거리, 전망 | 같음 + 오동도 거리 데이터 없음 | 불가 | 거리 MISSING |
| **H12** 마음이 지쳐서 쉬고 싶어 | 일반 공감 응답 | 일반 대화 (Direct) | 해당 없음 | 장소 Knowledge 불필요 (현 상태 적절) |
| **H13** 아이 없이 성인 가족 여행 | 성인 여행 일반 설명 | 일반 대화 (Direct) | 해당 없음 | 장소 Knowledge 불필요 |

## 3. 실제 활용 가능한 정보와 미확인 정보

### 3.1 활용 가능 (근거 확인된 것만)

- 장소별 감정 역할 (A1, Confirmed).
- 하멜등대 좌표 (해양수산청 공식 근거), 체류 30분 (Founder 승인).
- 향일암 체류 120분 (Founder 승인, 여행사 기준 100 + 자유 20).
- 케이블카 판매가 15,000원, 체험 시간대 (SSOT-TIME-001, 계절 기준 확인 필요).
- 실시간 상태는 "unknown" 이 정답 (A10).
- 혜택은 "확인되지 않음" 이 정답 (A17 미확인).

### 3.2 미확인 (답변에 쓰면 안 되는 것)

- 오동도 체류 120 (F1: 승인 없음, 다른 출처 90).
- 케이블카 체류 45 (DB) vs 90 (SSOT 슬롯) vs 60 (itinerary) — 출처별 불일치.
- 오동도 운영시간 (NON_OFFICIAL 블로그 출처, 공식 아님).
- 도보 간선 전체 (차량 간선만 존재).
- 카페 전망 (파트너 카피), 카페 좌표, 카페 혜택 (미확인).
- 접근성·계단 (오동도 계단 정보 없음, 206 unknown).
- 아이 쉼터, 부모님 동반 안전 (없음).

### 3.3 현재 응답이 의존하는 미검증 문장 (F2)

§60 응답의 오동도·향일암 설명, 걷기 문구, 동반 문구는 A13 (코드 하드코딩) 이다. 주석의 "batch-verified" 는 원천 문서가 없다. 이 문장은 VERIFIED 가 아니다. 승인되지 않으면 해당 문장의 출처를 확정해야 한다.

## 4. 기존 자산 재사용 계획

| 구분 | 항목 |
|---|---|
| 1. 즉시 활용 가능 | 장소 감정 역할 (A1), 하멜 좌표·체류 (A7·A8), 향일암 체류 (A8), 케이블카 판매가·시간대 (A3, 계절 확인 조건), 실시간 unknown 응답 (A10), 혜택 미확인 응답 (A17) |
| 2. 연결만 필요 (데이터는 존재) | DB suitable_for (동반 적합) 를 응답 문구 근거로 연결 — 현재 응답은 코드 문장을 쓰고 DB 값은 쓰지 않음. H10·H14·H20 에 적용 가능 (연결 후 출처는 DB + trust 라벨). 케이블카 elderly 누락에 주의 |
| 3. 승인 또는 출처 확인만 필요 | 오동도 체류 기준 (F1), _PLACE_KNOWLEDGE 문장 출처 (F2), 파트너 목록 상태·카페 혜택 (F3), 케이블카 계절 운영 기간 (A3), 1박2일 골격 노출 (Q1 보류) |
| 4. 새로 조사해야 함 | 장소 간 도보 거리·시간 (오동도, 케이블카, 하멜, 향일암), 오동도·향일암 계단·접근 정보, 아이 쉼터 위치, 카페 좌표·전망 검증, 하멜 도보 접근, 오동도 운영시간 공식 확인 |
| 5. 현재 Knowledge 로 제공 불가 | 장소 간 도보 코스, 반나절 일정 시간표, 오동도↔케이블카 이동시간, 카페 전망·거리 추천, 아이 동반 휴식 계획, 부모님 장거리 보행 적합성 판단 |

- 새 DB Schema·Knowledge Architecture 는 제안하지 않는다.

## 5. 질문별 재사용 판정 요약

| 질문 | 현재 상태 | 기존 자산만으로 개선 가능 | 새 정보가 필요한 부분 |
|---|---|---|---|
| H04·H17 | 부분 | 불가 (F1 승인 필요) | 체류 기준 확정 |
| H06 | 부분 | 제한적 (한 곳 설명만) | 도보 거리·계단 |
| H07 | 부분 | 불가 | 카페 좌표·전망 검증·파트너 승인 |
| H09 | 부분 | 불가 | 오동도↔케이블카 이동, 체류 확정 |
| H10 | 부분 | 가능 (DB suitable_for 연결) | 도보 연결·코스 |
| H12·H13 | 부분 | 해당 없음 (일반 응답) | 없음 |
| H14 | 부분 | 가능 (DB kids_ok 연결) | 아이 쉼터·안전 |
| H15 | 부분 | 불가 | 거리·전망 |
| H19 | 부분 | 제한적 (후보 순서는 편집 결정) | 대표 목록 승인 |
| H20 | 부분 | 가능 (suitable_for 연결) 일부 | 1박2일 노출 승인 (Q1), 체류 기준 |

- 기존 자산 연결만으로 실질 개선이 가능한 질문: H10, H14 (동반 적합 근거를 DB 로 대체·보강). 나머지는 승인 또는 신규 정보가 필요하다.

## 6. 새로 확보해야 할 최소 정보

1. 오동도 체류시간 확정 근거 (F1 승인 + 출처 1개).
2. 장소 간 도보 거리·시간 (최소: 오동도↔케이블카, 오동도↔향일암, 오동도↔하멜등대 — 도보 기준, 차량 간선과 분리).
3. 오동도·향일암 계단·접근 정보 (검증 출처 포함).
4. 아이 동반 쉼터 위치 (오동도 내부 또는 인근).
5. 카페 좌표와 전망 검증 (파트너 승인 전제).
6. 하멜등대 접근·도보 정보.

- 이 목록은 "필요한 정보의 정의"이며 수집 작업을 승인하지 않는다.

## 7. Founder 확인이 필요한 정보

- **F1.** 오동도 체류 기준: DB 120 (승인 없음) · SSOT-ROUTE-002 90 · itinerary 90 중 운영 기준은 무엇인가. 케이블카 체류 45 (DB) 와 SSOT 90 도 같은 문제.
- **F2.** `_PLACE_KNOWLEDGE` 문장 (오동도·향일암·케이블카·하멜 설명, 걷기, 계단, 동반, 운영시간) 을 승인된 Knowledge 로 볼지, 출처를 요구할지.
- **F3.** 파트너 목록 상태 (CSV active vs 마스터 Template), 카페 혜택 승인 여부, 모이핀 혜택 (§15 Q4).
- **F4.** 차량 간선 (`VERIFIED_TRAVEL_EDGES`) 을 도보 근거로 쓰지 않는다는 원칙 확인.
- **F5.** H19 대표 후보 목록의 편집 결정 주체 (Q-K2 는 테스트 후보로만 승인됨).
- **F6.** 1박2일 골격 (route.days) 의 운영 노출은 여전히 보류 (Q1, 로컬 전용).

## 8. 다음 구현의 최소 범위 (승인 시 별도 Preflight)

- 범위는 두 가지 중 하나 또는 둘 다:
  - (a) 기존 DB `suitable_for` 를 H10·H14 의 동반 적합 문장 근거로 연결 (데이터 변경 없음, 출처 표시 포함). 케이블카 elderly 누락을 응답에 반영.
  - (b) F1 결정 후 체류 기준을 한 값으로 맞춤 (데이터 변경은 승인된 migration 으로만).
- 하지 않을 것: 도보 연결 생성, 차량 간선을 도보로 사용, 카페 전망 추천, 1박2일 노출, 신규 데이터 등록.
- 검증: §60 실제 응답 재생 (실제 호출 없음) 으로 변경된 질문만 확인.

## 9. 보존과 연결

- §48 (실제 Benchmark 원본), §57 (Clarify 분석), §58 (Clarify 구현, `8955a14`), §59 (승인·원격 보존, `9ad729f`), §60 (실제 재검증 8/12/0, 원본 보존), §61 (H19 중복 제거, `dc175c2`) 를 그대로 보존한다.
- 본 §62 는 워킹트리 기록. docs 커밋은 별도 승인 대상이다.
- 정본 SOUL Evidence (`daily-miracles-mvp`, 다른 체크아웃): 읽기만. 수정 없음.

## 10. Current Next Action (exactly 1)

**Founder가 F1 (오동도·케이블카 체류 기준 운영 원천) 과 F2 (`_PLACE_KNOWLEDGE` 문장 출처 승인) 에 답한다.** 답변 전까지 코드 수정, 데이터 등록, 실제 LLM 호출은 하지 않는다.
