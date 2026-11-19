# PHX-SOUL-QA-001 — 관광 Knowledge 근거 검증 (V1, 2026-11-20)

> §63. 원본 감사 §62 (`PHX-SOUL-QA-001_TOURISM_KNOWLEDGE_READINESS_V1.md`) 는 변경하지 않고 보존한다.
> 범위: 근거 확인 (기존 자료 + 제한된 공식 자료 조회). 서비스 코드 수정, DB 변경, 운영 DB 연결, 관광 데이터 등록, 하드코딩 문장 일괄 승인, 미확인 혜택 등록, 실제 LLM 호출, push 없음.
> Founder 결정 F1~F6 반영 (2026-11-20). 공식 자료가 없는 항목은 미확인으로 남긴다.

## Guardian Preflight Report (작업 전 기록)

```
### Guardian Preflight Report

Requested Change:
  F1 체류시간 근거 확인 (오동도 90/120 출처·의미, 케이블카 시간값 충돌), F2 장소 문장 출처·승인 확인 (일괄 승인 금지),
  F3 파트너·혜택 근거 확인 (소원패스 계약·승인 Evidence 우선, CSV active vs Template 충돌 기록),
  F4 차량 이동 데이터를 도보로 사용 금지, F5 첫 방문 추천의 사실 근거와 편집 판단 분리, F6 Route Exposure HOLD 유지.
  제한된 공식 자료 조회 승인: 오동도 방문·이용 정보, 산책로·접근성, 케이블카 탑승·이용시간, 케이블카 공식 운영시간.

Existing Assets Found:
  §62 감사 문서, SSOT-LOC-001 / SSOT-ROUTE-002 / SSOT-TIME-001 (Confirmed), TRAVEL-PLACES-STAY-TIME-V01 Evidence (Founder 승인 hamel 30 · hyangiram 120),
  DREAMTOWN-TIME-BUDGET-V0_1-CANDIDATE (CANDIDATE), CUSTOM-ROUTE-V01-DESIGN (SOUL Phase 1 CLOSED 목록),
  COURSE-PLANNING-FULLDAY-DESIGN-V0_1 (odongdo experience_ko "✓ Founder 승인" 기재, PR #67 인용),
  seeds 001 (travel_places) 이력: 커밋 ed6bd20 (2026-08-21, 최초 도입), partner_master.csv / partner_master_seed.sql / PARTNER_MASTER_V1 (Template),
  PHX-BENEFIT-001 체크리스트 (혜택 미확인), services/soyeowoolService.js (_PLACE_KNOWLEDGE), services/travelGuideService.js (VERIFIED_TRAVEL_EDGES)

Repositories Inspected:
  C:\DEV\_worktrees\phx-soul-hybrid-v1 (읽기). 운영 DB 미연결.

Relevant Files:
  위 목록 (읽기). 결과 문서 (본 문서). 외부 조회 결과는 URL·확인일·원문 요지만 기록.

Relevant Databases:
  없음 (저장소의 seed·migration 파일 이력만 조회).

Change Classification:
  근거 검증 (코드·데이터 변경 없음).

Connection Opportunity:
  없음 (Option A·B 는 검증 후 후보 지정만, 구현 안 함).

Duplication Risk:
  없음.

Data Risk:
  외부 조회는 공개 웹 페이지 대상. 개인정보 입력 없음. 외부 자료는 출처별 충돌을 그대로 기록하고 임의 채택하지 않음.

Recommended Approach:
  1) 기존 근거 확인 (이력, 승인 기재, 설계 문서) 우선
  2) 공식 자료 제한 조회 (여수시 공식 관광 페이지, 공식 PDF, 케이블카 공식 사이트 탐색)
  3) 사실별 검증표 (VERIFIED / EXISTS / CONFLICT / MISSING) 와 Founder 승인 필요 여부
  4) 승인된 근거만 Option 후보로 지정 (구현 없음)

Questions Requiring Decision:
  Q63-1. 오동도 평균 체류시간의 운영 기준 (DB 120 · 일정 슬롯 90 · 자체 일정 1.5h 중 무엇을 쓸지, 또는 의미별로 분리할지)
  Q63-2. 케이블카 시간값 (탑승 13분 편도 · 배정 슬롯 90 · DB 45 · 자체 일정 60 중 의미별 기준)
  Q63-3. 오동도 운영시간 (공식 페이지 미기재, 현재 코드 09:00~17:00 과 블로그 09:30 출발 간 충돌)

Implementation Status: READY (근거 검증, 구현 없음)
```

## 1. F1 — 체류·운영·배정 시간의 의미 구분

| 구분 | 의미 | 오동도 | 케이블카 |
|---|---|---|---|
| 운영시간 | 시설이 여는·닫는 시간 | 공식 페이지에 운영시간 없음 (미확인). 동백열차 "09:30 출발" 은 블로그 출처. 코드 값 09:00~17:00 은 NON_OFFICIAL | 평일 09:30~21:30, 매표 21:00 마감 (제3자 안내, 공식 사이트 미확인) |
| 평균 체류 | 방문객이 보통 머무는 시간 | DB seed 120 (출처 불명) | DB seed 45 ("왕복 탑승 기준", 산출 근거 문서 없음) |
| 일정 배정 | 일정표에 배정한 슬롯 | SSOT-ROUTE-002 Day2 09:00~10:30 = 90분 | SSOT-ROUTE-002 Day1 16:00~17:30 = 90분 (탑승·대기·관람 포함 배정) |
| 자체 일정 생성기 | 하드코딩 durations | itineraryService 1.5h = 90분 | itineraryService 1h = 60분 |
| 실제 탑승 | 케이블카 이동 자체 | — | 편도 약 13분, 왕복 약 25분 (제3자 안내 2건, 1.5km) |

- 결론: 120 과 90 은 같은 "체류" 가 아니다. DB 120 은 평균 체류의 주장이지만 출처가 없고, 90 은 일정 배정 슬롯이다. 둘 중 하나를 근거 없이 확정하지 않는다 (F1). Founder 결정 필요 (Q63-1).
- 케이블카 45 는 "왕복 탑승 기준" 이라고 적혀 있으나, 제3자 안내의 왕복 탑승 약 25분과 맞지 않는다. 대기·이동·매표를 포함했는지 기록이 없다. 탑승시간 (13분 편도) 과 배정 슬롯 (90) 과 DB (45) 는 서로 다른 개념이다 (Q63-2).
- 하멜등대 30분 (Founder 승인 2026-10-25) 과 향일암 120분 (Founder 승인, 여행사 기준 100 + 여유 20) 은 유지한다.

## 2. A — 오동도 90/120 의 최초 출처와 사용 목적

| 값 | 최초 출처 | 사용 목적 | 승인 기록 |
|---|---|---|---|
| 120 (DB avg_stay) | 시드 001 최초 도입 커밋 `ed6bd20` (2026-08-21, Travel Guide V1). 원천 문서 없음. trust_level `ORIGIN` (원천 ID `ORIGIN-001`, 저장소 문서에 없음) | 장소 평균 체류 표시, 예산 계산 (TIME-BUDGET 후보 표 "변경 없음 — DB 유지") | Founder 승인 기록 없음. Stay-time 승인 문서는 하멜·향일암만 다룸 |
| 90 (일정 슬롯) | SSOT-ROUTE-002 (Confirmed, 2026-06-01 작성) Day2 09:00~10:30 | 1박2일 체험 일정 배정 | Confirmed SSOT (Aurora5). 체류 기준이 아니라 일정 배정값 |
| 90 (자체 일정 1.5h) | services/itineraryService.js 하드코딩 | 자체 AI 일정 생성 | 출처 없음 |

- 결론: 오동도 120 은 출처 미확인 (ORIGIN 시드). 승인 근거가 없다. 90 은 일정 배정값이며 평균 체류와 같은 값이 아니다. 두 값을 같은 질문 (관람시간) 에 쓰면 충돌한다 (CONFLICT).

## 3. B — 공식 자료 조회 결과

조회 방법: 웹 검색 3회 (오동도 운영시간, 케이블카 운영·요금, 오동도 접근성), 여수시 공식 관광 페이지 직접 조회 1회, 여수시 공식 PDF 조회 1회. 공식 케이블카 사이트는 검색에서 나오지 않았다.

| # | 정보 | 공식 출처 확인 | 조회 결과 | 판정 |
|---|---|---|---|---|
| B1 | 오동도 방문·이용 정보 | yeosu.go.kr/en/travel/10tour (여수시 공식 관광 페이지, "last update 2026.10.13") | 운영시간·입장료 미기재. 동백열차 또는 도보 접근 가능 명시. 방파제 15분 도보. 산책로 흙길 (붉은 점토) 로 교체 명시 | 공식 근거: 접근 방법·산책로 존재·흙길 표면. 운영시간·요금은 미확인 |
| B2 | 오동도 산책로 길이 | 같은 페이지 | "2.5km 숲길 산책로" 표기. 검색 요약의 방파제 768m 는 다른 구간일 수 있음 | 공식 표기 2.5km 확인 (구간 정의 미확인). 768m 와 불일치 가능 |
| B3 | 오동도 계단·접근성 (휠체어·유모차) | 같은 페이지, 여수시 PDF (읽을 수 없음) | 계단 수·구간 미기재. 접근성 정보 없음. 이미지 캡션에 계단 언급 (정보 없음) | 미확인. 계단·무장애 근거 없음 |
| B4 | 동백열차 운행시간 | 블로그 2건 (여수시 공식 안내 인용 주장) | 09:30 출발, 하절기 18:00·동절기 17:00 마감 (블로그끼리도 불일치) | 미확인 (블로그 출처) |
| B5 | 케이블카 운영시간 | 공식 사이트 미발견. 제3자 안내 2건 | 평일 09:30~21:30, 주말 09:00~22:00 (한 건). 매일 09:30~21:30 (다른 건). 매표 21:00 마감 | 미확인 (제3자 간 충돌) |
| B6 | 케이블카 탑승 시간 | 제3자 안내 2건 | 편도 약 13분 (1.5km, 한 건은 1.2km), 왕복 약 25분 | 미확인 (공식 없음). 제3자 일치 |
| B7 | 케이블카 요금 | 공식 없음 | 한 제3자 안내: 일반 캐빈 대인 왕복 17,000 · 편도 14,000. SSOT-TIME-001: 정상가 17,000 · 판매가 15,000 | CONFLICT (정상가 17,000 동일, 판매가 15,000 vs 왕복 17,000 의 의미 불일치). 응답에 쓰지 않음 |
| B8 | 평균 체류시간 (오동도, 케이블카) | 공식 페이지에 체류 정보 없음 | — | 미확인 (검색 결과로 산출하지 않음) |

- 공식 자료의 한계: 케이블카 공식 운영 주체 사이트를 찾지 못했다. 공식 조회가 필요한 항목 (케이블카 운영시간·요금) 은 조사 필요 항목으로 남긴다.

## 4. C — 기존 Knowledge 검증표

사실별 기록. 상태: VERIFIED / EXISTS / CONFLICT / MISSING.

| Place | 기존 정보 | 정보의 의미 | 기존 출처 | 신규 확인 근거 | 충돌 | 상태 | Founder 승인 필요 | 고객 응답 적용 범위 |
|---|---|---|---|---|---|---|---|---|
| odongdo | avg_stay 120 | 평균 체류 | 시드 ORIGIN (출처 없음) | 공식 페이지에 체류 없음 | SSOT 90 · itinerary 90 | CONFLICT | 예 (Q63-1) | 확정 답변 금지. 의미 라벨 없이 쓰지 않음 |
| odongdo | 운영 연중무휴 09:00~17:00 | 운영시간 | 코드 NON_OFFICIAL (블로그) | 공식 페이지 미기재, 블로그 09:30 출발 | 블로그 간 불일치 | EXISTS (NON_OFFICIAL) | 예 (Q63-3) | "방문 전 확인" 문구와 함께만 |
| odongdo | experience_ko "바다 풍경과 계절의 자연을 느끼며 산책" | 장소 설명 | 설계 문서 "✓ Founder 승인 (PR #67)" | 공식 페이지: 산책로·방파제 산책 확인 | — | EXISTS (승인 기재, 원본 결정문 미확인) | 원본 확인 요청 | 설명 수준으로 사용 가능 (승인 원본 확인 전까지 VERIFIED 아님) |
| odongdo | walking_ok "걷는 부담은 구간에 따라…" | 도보 부담 일반 안내 | 코드 문장, 출처 없음 | 공식 페이지: 2.5km 숲길, 방파제 15분 (부담 평가 없음) | — | EXISTS (출처 없음) | 예 (F2) | 산책로 존재 사실로만 뒷받침. "부담" 평가는 미확인 |
| odongdo | stairs 정보 | 계단·접근 | 없음 | 공식 페이지 계단 미기재 | — | MISSING | — | 계단 언급 금지 |
| odongdo | physical_difficulty | 난이도 | DB 칼럼, 값 없음 (시드에 없음) | — | — | MISSING | — | 사용 금지 |
| odongdo | suitable_for [family, kids_ok, elderly, groups] | 동반 적합 | 시드 (출처 없음) | 공식 근거 없음 | — | EXISTS (출처 없음) | 예 | 실제 적합성 확정 금지 (§5) |
| odongdo | fit_ko "부모님이나 아이와 함께라면 걷는 거리와 쉬는 시간을 고려" | 동반 일반 조언 | 코드 문장 (출처 없음) | — | — | EXISTS | 예 (F2) | 조언 문장으로만, 적합성 확정 아님 |
| cablecar | avg_stay 45 | "왕복 탑승 기준" | 시드 VERIFIED 라벨 (산출 문서 없음) | 제3자 왕복 탑승 약 25분 | 슬롯 90 · itinerary 60 | CONFLICT | 예 (Q63-2) | 확정 금지. 탑승 13분 편도는 제3자 안내로만 |
| cablecar | 운영시간 09:30~21:30 | 운영시간 | 코드 값 (출처 없음) | 제3자 2건 일치 (공식 없음) | 제3자 주말 09:00~22:00 한 건 | EXISTS (제3자) | 예 | "확인 필요" 문구와 함께만 |
| cablecar | 판매가 15,000 (SSOT-TIME-001) | 요금 | SSOT Confirmed | 제3자 왕복 17,000 | 의미 불일치 | CONFLICT | 예 | 요금 응답 금지 (현재 응답 미사용) |
| cablecar | phone 061-664-7301 | 문의 번호 | 코드 | 제3자 1건 동일 | — | EXISTS | 예 | 운영 확인 안내용으로만 |
| cablecar | suitable_for [family, kids_ok, young_adults] | 동반 적합 | 시드 | — | — | EXISTS | 예 | elderly 미포함은 확정 아님 |
| hamel_lighthouse | avg_stay 30 | 평균 체류 | Founder 승인 2026-10-25 | — | — | VERIFIED | 유지 | 응답 사용 가능 (승인 근거) |
| hamel_lighthouse | 좌표 | 위치 | 해양수산청 공식 근거 (시드 메모, 2026-10-19) | — | — | VERIFIED (근거 문서 원본은 시드 메모 참조) | — | 위치 설명 가능 |
| hyangiram | avg_stay 120 | 평균 체류 (여행사 100 + 여유 20) | Founder 승인 2026-10-25 | — | — | VERIFIED | 유지 | 응답 사용 가능 |
| hyangiram | stairs_ko / walking_ok | 계단·경사 | 코드 문장 (출처 없음) | 미조회 (승인 범위 밖) | — | EXISTS (출처 없음) | 예 (F2) | 계단 존재 주장 금지 확정 전까지 보류 |
| hyangiram | suitable_for [family, elderly, kids_ok, pilgrimage] | 동반 적합 | 시드 ORIGIN-002 | — | — | EXISTS | 예 | 확정 금지 |
| 전체 | _PLACE_KNOWLEDGE "batch-verified" 주석 | 주석 주장 | 원천 문서 인용 없음 | — | — | EXISTS (근거 없음, VERIFIED 아님) | 예 (F2) | 일괄 승인 금지 (Founder) |

## 5. suitable_for 데이터의 신뢰 범위

- 시드 001 의 suitable_for 는 DB 값이며 원천 문서가 없다. trust_level 라벨 (ORIGIN, VERIFIED) 은 원천을 가리키지 않는다 (ORIGIN-001 · ORIGIN-002 의 원천 문서 미존재).
- 따라서 suitable_for 는 실제 적합성 근거가 아니다. 현재 응답에는 사용하지 않는다.
- 케이블카 suitable_for 에 elderly 가 없다는 사실은 "적합하지 않다" 로 해석하지 않는다.
- 승인 전까지 응답 근거로 쓰는 것은 "Companion Knowledge 후보 (Option A)" 설계 대상일 뿐이다.

## 6. F3 — 파트너 및 혜택

| 항목 | 기록 |
|---|---|
| 소원패스 계약·승인 Evidence | 체크리스트 PHX-BENEFIT-001: 카페·음식점 혜택 항목 전부 "미확인". 모이핀 혜택은 §15 Q4 (무료 혜택 안내 중단·데이터 처리) 미결 |
| CSV partner_master.csv | 12곳 (카페 8, 야간 2, 식당 1, 기타 1), status `active`, 혜택 "아메리카노 1인 무료" 등 |
| PARTNER_MASTER_V1.md | `status: Template (데이터 미입력)` |
| 충돌 | CSV active 대 마스터 Template — **CONFLICT** (기록만, 해소 안 함) |
| 모이핀 | CSV·시드 SQL 에 존재 (YS-CF-008, is_active true 시드). 혜택은 미확인 → 고객에게 확정 안내 금지 |
| 파트너 카피 (바다 전망 등) | 파트너가 제공한 문구. 검증 전 사실로 쓰지 않음 |
| 좌표 | 12곳 전부 공란 |
| 판정 | 파트너 존재 = EXISTS. 혜택 = 미확인 (MISSING 승인). 바다 전망 = 추론 금지 |

## 7. F4 — 이동 정보의 용도 제한

- `VERIFIED_TRAVEL_EDGES` (8개) 는 차량 기준 (`car` + `buf` = `op`). 도보 이동거리·시간으로 쓰지 않는다.
- 오동도 간선은 없다.
- 공식 자료의 도보 정보는 산책로 길이와 방파제 15분 뿐이며, 장소 간 도보 연결은 미확인이다.

## 8. F5 — 첫 방문 추천의 사실 근거와 편집 판단

| 구분 | 내용 | 상태 |
|---|---|---|
| 사실 근거 | 장소 존재, 장소 설명 (승인 기재), 운영시간 (미확인) | 장소별로 §4 표 참조 |
| 편집 판단 | 4곳을 첫 방문 후보로 고르는 것, 순서 | Founder 승인 필요 (F5). 현재 4곳은 테스트 후보 (Q-K2) |
| 결론 | 후보 목록은 편집 판단이다. 사실 근거와 섞어 "공식 추천" 으로 표현하지 않는다 | — |

## 9. F6 — Route Exposure

- 당일·신규 여행 일정의 운영 노출 HOLD 유지. SSOT-ROUTE-002 의 1박2일 시간표는 근거 자료로만 기록한다. 응답 노출 아님.

## 10. D — 최소 구현 준비 (구현 안 함)

| 후보 | 근거 충족 여부 | 범위 | 조건 |
|---|---|---|---|
| Option A — Companion Knowledge 연결 | 근거 부족 (suitable_for 출처 없음, 문장 승인 미확인) | DB suitable_for 를 동반 적합 근거로 연결, 출처 표기 | F2 (문장·suitable_for 출처 승인) 필요 |
| Option B — 체류시간 의미 및 값 정렬 | 근거 부분 충족 (하멜·향일암 승인, 오동도·케이블카 충돌) | 평균 체류 / 일정 배정 / 운영시간을 응답에서 분리 표기 | Q63-1, Q63-2 결정 필요 |

- 지금 승인된 근거만으로 구현할 수 있는 응답: 하멜등대 체류 30 (승인), 향일암 체류 120 (승인), 오동도 산책로 존재 (공식), 케이블카 탑승 13분 편도 (제3자, 표기 필요).

## 11. 질문별 근거 요약 (§62 연결)

| 질문 | 검증 결과 |
|---|---|
| H04·H17 | 오동도 체류 CONFLICT (Q63-1). 운영시간 EXISTS(NON_OFFICIAL)·미확인 (Q63-3) |
| H06·H10·H14 | 오동도 산책로 존재 (공식 2.5km 숲길, 방파제 15분). 도보 연결·계단·접근성 MISSING. 아동 쉼터 MISSING |
| H09 | 케이블카 CONFLICT (Q63-2), 오동도↔케이블카 도보 간선 MISSING |
| H19 | 후보 4곳 존재 (DB), 순서 편집 판단 (F5) |
| H20 | 1박2일 시간표 CONFLICT (체류), route 노출 HOLD (F6) |
| H07·H15 | 카페 혜택 미확인, 전망 추론 금지, 좌표 MISSING |

## 12. Evidence 및 연결

- 원본 감사 §62 보존 (`PHX-SOUL-QA-001_TOURISM_KNOWLEDGE_READINESS_V1.md`).
- §48 (실제 Benchmark 원본), §60 (재검증 8/12/0), §61 (H19 중복 제거) 보존.
- 공식 조회 출처 (확인일 2026-11-20):
  - 여수시 관광 페이지: https://yeosu.go.kr/en/travel/10tour (last update 2026.10.13)
  - 여수시 PDF: https://www.yeosu.go.kr/tour/travel/10tour/odongdo_old/screen_print.pdf (본문 추출 불가)
  - 케이블카 제3자 안내 (공식 아님): telltrip.com 여수 해상케이블카 안내, trvlogue.com 요금 안내
  - 동백열차 블로그 안내 (공식 아님): travelmapjourney.com 여수 당일치기
- 정본 SOUL Evidence (`daily-miracles-mvp`, 다른 체크아웃): 읽기만. 수정 없음.
- 본 §63 은 워킹트리 기록이며 커밋하지 않았다.

## 13. Current Next Action (exactly 1)

**Founder가 Q63-1 (오동도 평균 체류의 운영 기준), Q63-2 (케이블카 시간값의 의미 기준), Q63-3 (오동도 운영시간의 원천) 과 F2 (장소 문장의 출처 승인 방식) 에 답한다.** 답변 전까지 코드 수정, 데이터 등록, 실제 LLM 호출은 하지 않는다.
