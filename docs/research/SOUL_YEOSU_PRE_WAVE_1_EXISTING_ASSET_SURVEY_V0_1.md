# SOUL Yeosu — Pre-Wave 1 Existing Asset Survey V0.1
생성일: 2026-09-27  
브랜치: staging/storybook-c7a  
기반 커밋: ba478a5 (Wave 0 완료)  
목적: Wave 1 신규 수집 시작 전, 기존 10개 batch/knowledge 파일에서 재사용 가능한 기존 클레임 식별  
Hard Boundary: 신규 Yeosu 증거 수집 금지 — 기존 저장소 파일 읽기 전용

---

## §1. 조사 대상 파일 목록 (Wave 0에서 지정된 Authoritative Asset Set)

| # | 파일 | 조사 결과 |
|---|---|---|
| F-01 | `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_01.md` | READ — COMPLETE |
| F-02 | `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_02.md` | READ — COMPLETE |
| F-03 | `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_03_TRANSPORT.md` | READ — COMPLETE |
| F-04 | `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_04_ISLAND_ACCESS.md` | READ — COMPLETE |
| F-05 | `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_05_CRUISE.md` | READ — COMPLETE |
| F-06 | `docs/knowledge/YEOSU_2026_VERIFICATION_BATCH_06_RESTAURANT_PILOT.md` | READ — COMPLETE |
| F-07 | `docs/knowledge/YEOSU_ROUTE_CORPUS_V0_1.md` | READ — COMPLETE |
| F-08 | `docs/knowledge/YEOSU_TRAVEL_TIME_MATRIX_V0_1.md` | READ — COMPLETE |
| F-09 | `docs/knowledge/YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md` | READ — PARTIAL (entity freq/DB status columns only) |
| F-10 | `docs/knowledge/YEOSU_TIME_KNOWLEDGE_V0_1.md` | READ — COMPLETE |

---

## §2. 클레임 허용 기준 (Admissibility Test — Collection Plan V0.2 기반)

클레임이 기존 자산으로 재사용되려면 아래 6개 조건을 모두 통과해야 한다.

| 조건 | 기준 |
|---|---|
| A: Authoritative Asset | 위 10개 파일 중 하나에서 기원 |
| B: Verifiable Claim | 검증 가능한 구체적 사실 (구조, 수치, 절차) — 단순 언급 제외 |
| C: Freshness | 2024년 이후 수집 또는 OFFICIAL 출처 (구조적 사실은 연도 요건 완화) |
| D: ER Scope | 대상 ER이 요구하는 차원에 속하는 클레임 |
| E: Provenance | 출처 코드, 수집일, 신뢰도 등급이 명시됨 |
| F: Not Final Answer | SOUL 최종 답변 텍스트 형태가 아님 (정보 재료만 허용) |

---

## §3. 파일별 조사 결과

### F-01: BATCH_01 (빅오쇼/레일바이크/낭만버스/2층버스/아쿠아플라넷/해상케이블카/향일암)

**대상 ER 관련 내용:**

| 항목 | 내용 | 출처 | 판정 |
|---|---|---|---|
| 향일암 입장료 | 무료 | GOVERNMENT_PORTAL (yeosu.go.kr), verified 2026-09-20 | CONTEXT_ONLY — ER-HY-001 목표 차원(물리적 접근 구조) 아님 |
| 향일암 관람시간 | 04:00~19:00 | GOVERNMENT_PORTAL, verified 2026-09-20 | CONTEXT_ONLY |
| 향일암 공영주차장 | 2시간 무료 | GOVERNMENT_PORTAL, verified 2026-09-20 | CONTEXT_ONLY |
| 향일암 버스 | 111, 111-1, 116번 | GOVERNMENT_PORTAL, verified 2026-09-20 | CONTEXT_ONLY |
| 여수해상케이블카 가격 | 성인 왕복 15,000원 (블로그) | NON_OFFICIAL_BLOG | ER-CC-001 미해당 (비공식 가격, 공식 명칭 아님) |

**대상 ER 비해당 판정:** F-01에서 OD-001/OD-003/CC-001에 해당하는 내용 없음.  
HY-001 관련 클레임은 운영 정보(CONTEXT_ONLY)에 한정 — 물리적 접근 구조 설명 없음.

---

### F-02: BATCH_02 (진남관/하멜전시관/이순신대교)

**대상 ER 관련 내용:** 없음  
진남관(문화재), 하멜전시관(역사전시), 이순신대교(교량) — OD/HY/CC 대상과 무관.

---

### F-03: BATCH_03_TRANSPORT (교통거점)

**대상 ER 관련 내용:** 없음  
여수엑스포역, 여수공항, 버스터미널, 연안여객선터미널, 신기항, 백야항 — 교통 허브 전용.  
ER-OD-003(오동도 차량 접근)과 관련될 수 있는 내용 없음.

---

### F-04: BATCH_04_ISLAND_ACCESS (거문도/금오도/하화도/사도/개도)

**대상 ER 관련 내용:** 없음  
전체 내용이 오동도 외 도서 접근 정보 — OD/HY/CC 대상 없음.  
Wave 0 예상(BATCH_04 → ER-OD-003 가능성)은 NOT CONFIRMED.

---

### F-05: BATCH_05_CRUISE (미남크루즈/거북선호/이사부크루즈/오션크루즈)

**대상 ER 관련 내용:**

| 항목 | 내용 | 출처 | 판정 |
|---|---|---|---|
| 여수거북선호 출발지 | 오동도 선착장 | OFFICIAL_WEBSITE (kgeobukseon.com), verified 2026-09-20 | CONTEXT_ONLY — 오동도가 크루즈 출발지임을 나타내는 사실. ER-OD-001(장소 성격 WE) 미해당 |

ER-OD-001이 요구하는 WE 패턴 증거(방문 경험의 성격) 아님.

---

### F-06: BATCH_06_RESTAURANT_PILOT (8개 식당)

**대상 ER 관련 내용:** 없음  
식당 정보 전용 — OD/HY/CC 장소 대상과 무관.

---

### F-07: ROUTE_CORPUS_V0_1 (42개 코스)

**대상 ER 관련 내용:**

#### 오동도 출현 (10회)

| Route | Source | 오동도 관련 내용 | ER 관련성 |
|---|---|---|---|
| R028 낭만버스1코스 | SOURCE_B_YEOSU_GOV | seq 2, 60분 배정, MORNING | CONTEXT_ONLY (일정/체류시간) |
| R029 낭만버스야경코스 | SOURCE_B_YEOSU_GOV | seq 2, NIGHT 방문 | CONTEXT_ONLY (야경 맥락) |
| R032 2층버스주간코스 | SOURCE_B_YEOSU_GOV | seq 4, 자산탑승장→오동도 순서 | CONTEXT_ONLY |
| R033 언택트해안드라이브 | SOURCE_B_YEOSU_GOV (my_tour) | seq 1, 오동도등대 출발 | CONTEXT_ONLY |
| R034 2박3일섬하루 | SOURCE_B_YEOSU_GOV (my_tour) | seq 1 | CONTEXT_ONLY |
| R035 일출부터일몰까지 | SOURCE_B_YEOSU_GOV (my_tour) | seq 4, AFTERNOON 방문 | CONTEXT_ONLY |
| R036 1박2일힐링코스 | SOURCE_B_YEOSU_GOV (my_tour) | seq 5 | CONTEXT_ONLY |
| R038 zzintrip 2박3일 | SOURCE_D_WEB | seq 3, 1일차 오후 방문 | CONTEXT_ONLY |
| R039 trip.com 뚜벅이 | SOURCE_D_WEB | 2일차, 30~60분 소요 note | CONTEXT_ONLY |
| R040 tourtoctoc 뚜벅이 | SOURCE_D_WEB | seq 3, source_note: "동백열차" | **SECONDARY_CLAIM — 아래 상세 기재** |

**R040 동백열차 클레임 허용 심사 (ER-OD-003):**

| 조건 | 판정 | 근거 |
|---|---|---|
| A: Authoritative Asset | PASS | F-07 (Route Corpus) — 지정된 10개 파일 |
| B: Verifiable Claim | PARTIAL | "동백열차"라는 수단명 언급 — 접근 구조 전체 설명 없음 |
| C: Freshness | LOW | tourtoctoc.com 2023년 기사 (3년+ 경과) |
| D: ER Scope | PARTIAL | ER-OD-003 = 오동도 차량접근 구조 — 동백열차 언급은 관련, 그러나 접근 체계 전체 미기술 |
| E: Provenance | PASS | SOURCE_D_WEB, tourtoctoc.com, 2023 |
| F: Not Final Answer | PASS | 경유 메모에 불과, SOUL 답변 텍스트 아님 |

**VERDICT: SECONDARY_CLAIM_ONLY** — 갭 유형 변경 불가, 단 Wave 1 수집 시 코로보레이션 후보로 기록  
허용 이유: "동백열차"를 오동도 접근 수단으로 명시. 단, 구조 전체 미기술, 출처 LOW, Freshness LOW.  
미허용 이유 요약: B-조건 PARTIAL, C-조건 LOW → FULL_GAP 유지.

#### 향일암 출현 (6회)

| Route | Source | 향일암 관련 내용 | ER 관련성 |
|---|---|---|---|
| R028 낭만버스1코스 | SOURCE_B_YEOSU_GOV | seq 5, 75분 배정(이동25분 포함), AFTERNOON | CONTEXT_ONLY (일정) |
| R035 일출부터일몰까지 | SOURCE_B_YEOSU_GOV (my_tour) | seq 1, MORNING, 일출 | CONTEXT_ONLY |
| R036 1박2일힐링코스 | SOURCE_B_YEOSU_GOV (my_tour) | seq 1 | CONTEXT_ONLY |
| R038 zzintrip 2박3일 | SOURCE_D_WEB | 2일차 seq 1, "06:30 일출 (선택)" | CONTEXT_ONLY (시간 맥락) |
| R039 trip.com 뚜벅이 | SOURCE_D_WEB | 2일차 seq 1 | CONTEXT_ONLY |
| R034 2박3일섬하루 | SOURCE_B_YEOSU_GOV (my_tour) | seq 9 | CONTEXT_ONLY |

어떤 Route에서도 향일암 물리적 접근 구조(계단/암벽 경로/암문 통과 등) 설명 없음.  
ER-HY-001 FULL_GAP 유지.

#### 케이블카 출현 (여수해상케이블카 명칭)

| Route | Source | 케이블카 관련 내용 | ER 관련성 |
|---|---|---|---|
| R032 2층버스 | SOURCE_B_YEOSU_GOV | "케이블카 주차타워" stop 명칭 사용 | CONTEXT_ONLY (정류장 명) |
| R033~R039 다수 | 복수 | "여수해상케이블카" 표기 일관 | CONTEXT_ONLY (개체 지칭) |

ER-CC-001 요구 사항: OFFICIAL 출처에서 탑승장 공식 명칭 확인 — Route Corpus는 모두 ROUTE_SOURCE 또는 SOURCE_D_WEB, OFFICIAL 아님.

---

### F-08: TRAVEL_TIME_MATRIX_V0_1

**대상 ER 관련 내용:**

| 항목 | 내용 | 출처 | 판정 |
|---|---|---|---|
| CABLE_JASAN 코드명 | "자산탑승장 (케이블카 자산정류장)" | Route Corpus에서 파생 (ROUTE_SOURCE_DERIVED) | NOT OFFICIAL — ER-CC-001 미해당 |
| CABLE_DOLSAN 코드명 | "돌산공원탑승장 (케이블카 돌산정류장)" | Route Corpus에서 파생 (ROUTE_SOURCE_DERIVED) | NOT OFFICIAL — ER-CC-001 미해당 |
| 자산탑승장→오동도 이동시간 | 5분 (TOUR_BUS) | OFFICIAL (2층버스 공식 코스 R032) | CONTEXT_ONLY — 이동시간 데이터, 명칭 확인 아님 |

Time Matrix의 탑승장 명칭은 Route Corpus에서 파생된 ROUTE_SOURCE_DERIVED — OFFICIAL 확인 없음.

---

### F-09: ENTITY_CANDIDATE_MANIFEST_V0_1

**대상 ER 관련 내용:**

| 항목 | 내용 | 출처 | 판정 |
|---|---|---|---|
| 오동도 코스 출현 | 15+ 코스에 등장 (최다 빈도) | 6117 Legacy + Current Corpus 합산 | CONTEXT_ONLY — 빈도 데이터, WE 패턴 아님 |
| 향일암 코스 출현 | 10+ 코스에 등장 | 6117 Legacy + Current Corpus 합산 | CONTEXT_ONLY |
| 향일암 physical_difficulty | high | travel_places_seed 필드 | CONTEXT_ONLY — DB seed 분류값, 구조적 접근 설명 아님 |

---

### F-10: TIME_KNOWLEDGE_V0_1

**대상 ER 관련 내용:**

| 항목 | 내용 | 출처 | 판정 |
|---|---|---|---|
| 향일암 운영시간 | 04:00~19:00, 연중개방 | OFFICIAL (Batch 01 — yeosu.go.kr) | CONTEXT_ONLY — F-01 동일 데이터 |
| 향일암 입장료 | 무료 | OFFICIAL (Batch 01) | CONTEXT_ONLY |
| 향일암 physical_difficulty | high (note 유지) | travel_places_seed | CONTEXT_ONLY |
| 여수해상케이블카 운영시간 | 09:30~21:30 (블로그 참고값, 미확정) | UNKNOWN (공식 SSL 오류) | NOT_ADMISSIBLE (비공식, 미검증) |
| 여수해상케이블카 탑승소요 | 12~13분 편도 (블로그 참고값) | UNKNOWN | NOT_ADMISSIBLE |
| 여수해상케이블카 직통 연락처 | 061-664-7301 (BUSINESS_DIRECT_VERIFY_REQUIRED) | Batch 01 | OPERATIONAL_META — 공식 확인 경로 힌트 (Wave 1 수집 보조 활용 가능) |
| 오동도 체류시간 | 30~60분 (Route Source 복수 언급) | ROUTE_SOURCE | CONTEXT_ONLY |

---

## §4. 대상 ER별 최종 클레임 평가

### ER-OD-001: 오동도 장소 성격 — WE 경험 패턴

| 항목 | 내용 |
|---|---|
| 사전 갭 유형 | FULL_GAP |
| 발견된 클레임 수 | 0 (WE 패턴 기준) |
| 발견된 내용 | 오동도가 10개 Route에 등장, 체류시간 30~60분 Route Source, 크루즈 출발지 |
| 판정 | NO_RELEVANT_EXISTING_CLAIM — 모두 CONTEXT_ONLY (스케줄링/빈도/외부 접근 맥락) |
| 갭 유형 변경 | **없음 — FULL_GAP 유지** |
| 비고 | Route 등장 빈도가 높다는 사실은 "인기 명소"를 시사하지만, WE 경험 패턴(방문 시 어떤 경험을 하는지)을 기술하지 않음 |

---

### ER-OD-003: 오동도 차량 접근 공식 구조 (동백열차)

| 항목 | 내용 |
|---|---|
| 사전 갭 유형 | FULL_GAP |
| 발견된 클레임 수 | 1 (SECONDARY_CLAIM_ONLY) |
| 발견된 내용 | R040 (tourtoctoc.com, 2023): "동백열차" — 오동도 접근 수단으로 경유 메모에 명시 |
| 허용 판정 | SECONDARY_CLAIM_ONLY (B-조건 PARTIAL, C-조건 LOW) |
| 갭 유형 변경 | **없음 — FULL_GAP 유지** |
| Wave 1 활용 가능 여부 | CORROBORATION_CANDIDATE — OFFICIAL 출처 수집 후 보조 증거로 인용 가능 |
| 비고 | "동백열차"라는 수단명은 확인되었으나, ER-OD-003이 요구하는 전체 접근 구조(차량 통제 방식, 동백열차 기종/운행 방식, 도보 병행 여부 등) 미기술 |

---

### ER-HY-001: 향일암 물리적 접근 구조

| 항목 | 내용 |
|---|---|
| 사전 갭 유형 | FULL_GAP |
| 발견된 클레임 수 | 0 (구조적 접근 설명 기준) |
| 발견된 내용 | 운영시간(04:00~19:00, OFFICIAL), 입장료(무료, OFFICIAL), 주차(2시간 무료, OFFICIAL), 버스(111/111-1/116번, OFFICIAL), physical_difficulty=high (seed 분류), 6개 Route에 등장 |
| 판정 | CONTEXT_ONLY_CONFIRMED — 운영 정보는 잘 문서화되어 있으나 ER-HY-001 핵심 차원(계단 구조, 암벽 구간, 암문 통과, 등반 경로) 전혀 없음 |
| 갭 유형 변경 | **없음 — FULL_GAP 유지** |
| Wave 1 활용 가능 여부 | 운영 정보(시간/요금/주차/버스)는 이미 확보됨 → Wave 1 수집 시 중복 수집 불필요. physical_difficulty=high는 WE 코로보레이션 요청 시 배경으로 활용 가능 |
| 비고 | ER-HY-001 stop condition = STRUCTURAL_FACT_WITH_WE_CORROBORATION (V0.2 §9). 현재 Structural Fact도, WE Corroboration도 미확보 |

---

### ER-CC-001: 케이블카 탑승장 공식 명칭 (OFFICIAL 출처)

| 항목 | 내용 |
|---|---|
| 사전 갭 유형 | PARTIAL_GAP (비공식 출처 일부 존재; SSL 오류로 공식 확인 불가) |
| 발견된 클레임 수 | 0 (OFFICIAL 출처 기준) |
| 발견된 내용 | Time Matrix "자산탑승장/돌산공원탑승장" (ROUTE_SOURCE_DERIVED), Route Corpus "케이블카 주차타워" (2층버스 정류장명), TIME_KNOWLEDGE 직통 연락처 061-664-7301 |
| 판정 | NO_NEW_OFFICIAL_SOURCE — ROUTE_SOURCE_DERIVED 명칭은 OFFICIAL 확인 안됨 |
| 갭 유형 변경 | **없음 — PARTIAL_GAP 유지** |
| Wave 1 활용 가능 여부 | 061-664-7301 (BUSINESS_DIRECT_VERIFY_REQUIRED)는 Wave 1에서 공식 전화 확인 경로로 활용 가능. "자산탑승장" 명칭은 비공식 코로보레이션 후보 |
| 비고 | 공식 홈페이지 SSL 오류 지속. Wave 1에서 전화 직접 확인 또는 대안 OFFICIAL 출처 필요 |

---

## §5. 교차 ER 재사용 기회

| 재사용 항목 | 기원 | 적용 가능 ER | 재사용 유형 |
|---|---|---|---|
| 향일암 운영시간 (04:00~19:00) | BATCH_01 + TIME_KNOWLEDGE (OFFICIAL) | ER-HY-005 (SEMI_STABLE anchor time) | VERIFIED_OPERATIONAL_FACT |
| 향일암 입장료 무료 | BATCH_01 (OFFICIAL) | ER-HY-004 (비용 관련 guidance) | VERIFIED_OPERATIONAL_FACT |
| 향일암 버스 111/111-1/116 | BATCH_01 (OFFICIAL) | ER-HY-006 (대중교통 접근) | VERIFIED_OPERATIONAL_FACT |
| R040 "동백열차" 언급 | Route Corpus SOURCE_D_WEB 2023 | ER-OD-003 | SECONDARY_CORROBORATION_CANDIDATE |
| 케이블카 직통 연락처 | TIME_KNOWLEDGE (BUSINESS_DIRECT_VERIFY_REQUIRED) | ER-CC-001 | WAVE_1_ACTION_HINT |
| 오동도 체류시간 30~60분 | TIME_KNOWLEDGE ROUTE_SOURCE | ER-OD-006 (Stay Time evidence) | PROVISIONALLY_USABLE (ER-OD-006은 Wave 3) |

---

## §6. Gap Register 업데이트 (Wave 0 대비)

**업데이트 없음** — 조사 결과 Wave 0 Gap Register의 4개 대상 ER 모두 갭 유형 변경 없음.

| ER | Wave 0 갭 유형 | 조사 후 갭 유형 | 변경 사유 |
|---|---|---|---|
| ER-OD-001 | FULL_GAP | FULL_GAP | WE 패턴 클레임 없음 |
| ER-OD-003 | FULL_GAP | FULL_GAP | SECONDARY_CLAIM_ONLY (B-조건 PARTIAL + C-조건 LOW로 갭 유형 변경 기준 미달) |
| ER-HY-001 | FULL_GAP | FULL_GAP | 구조적 접근 설명 없음 (운영 정보만 존재, CONTEXT_ONLY) |
| ER-CC-001 | PARTIAL_GAP | PARTIAL_GAP | 새 OFFICIAL 출처 없음 (ROUTE_SOURCE_DERIVED만 발견) |

---

## §7. 조사 결과 코드 요약

| ER | Survey Outcome Code | 클레임 수 | 갭 변경 |
|---|---|---|---|
| ER-OD-001 | NO_RELEVANT_EXISTING_CLAIM | 0 | 없음 |
| ER-OD-003 | SECONDARY_CLAIM_ONLY | 1 (R040 동백열차) | 없음 |
| ER-HY-001 | CONTEXT_ONLY_CONFIRMED | 0 (구조 기준) | 없음 |
| ER-CC-001 | NO_NEW_OFFICIAL_SOURCE | 0 (OFFICIAL 기준) | 없음 |

---

## §8. Diminishing-Return Rule 적용 결과

본 조사에서 발견된 기존 클레임은 모두 CONTEXT_ONLY 또는 SECONDARY_CLAIM_ONLY 수준으로,  
Wave 1 신규 수집의 필요성을 줄이지 않는다.

- 향일암 운영 정보(시간/요금/버스)는 이미 충분히 문서화됨 → Wave 1에서 재수집 불필요 (Over-collection 방지)
- 물리적 접근 구조(계단/암벽/경로)는 전혀 없음 → Wave 1 수집 대상
- 오동도 WE 패턴은 전혀 없음 → Wave 1 수집 대상 (단, dependency 순서 확인 필요)
- 케이블카 공식 명칭은 SSL 오류 지속 → Wave 1에서 전화 확인 시도

---

## §9. Derived Next Action

**Wave 1 첫 번째 단위: ER-HY-001 물리적 접근 구조 수집**

선택 근거 (6개 기준 적용):

| 기준 | 적용 결과 |
|---|---|
| 1. 의존성 상태에서 실행 가능 | ER-HY-001: Wave 1 P0, 전제 ER 없음 (Collection Plan V0.2 §15) |
| 2. P0 요건 | YES — Wave 1 P0 배정 |
| 3. 재사용/판단 레버리지 | **최고** — HY-001이 VERIFIED_FOR_PREPARATION으로 진입해야 HY-002, HY-003, HY-006, HY-007, HY-008, HY-009 총 6개 ER 체인이 잠금 해제 |
| 4. 기존 커버리지 부재 | FULL_GAP 확인됨 (이번 조사로 재확인) |
| 5. V0.2 소스 역할 순서 | OFFICIAL 우선 → WE 코로보레이션 순서 준수 |
| 6. 사전 정의된 Stop Condition | STRUCTURAL_FACT_WITH_WE_CORROBORATION (V0.2 §9) — 이미 정의됨 |

**수집 범위:**
- OFFICIAL 수집 대상: 향일암 공식 안내 자료에서 물리적 접근 구조 설명 (계단 수 또는 특성, 등반 경로, 암벽/암문 구간 여부)
- WE 코로보레이션 대상: World Experience 출처에서 HY-001 구조 설명과 일치하는 방문 경험 증거
- 수집 금지: 이미 확보된 운영 정보(시간/요금/주차/버스) 재수집 금지 — Over-collection 방지 규칙 적용

**Stop Condition:** STRUCTURAL_FACT_WITH_WE_CORROBORATION  
→ OFFICIAL 출처에서 물리적 구조 사실 1개 이상 + WE 출처에서 코로보레이션 1개 이상 동시 확보 시 수집 중단

**이후 순서 (Wave 1 잔여):**  
HY-001 PROVISIONALLY_SUPPORTED 달성 후 → HY-002, HY-006 (HY-001 의존) 수집 가능  
OD-001, OD-003, OD-004 → HY-001과 독립적으로 병렬 수집 가능 (Wave 1 P0)  
CC-001 → PARTIAL_GAP; Wave 1에서 전화 확인 (061-664-7301) 시도 가능

---

## §10. 다음 세션을 위한 인수인계 메모

1. **ER-OD-003**: R040 (tourtoctoc.com, 2023)에 "동백열차" 언급 존재 — Wave 1 수집 시 코로보레이션 후보로 활용  
2. **ER-HY-001**: 운영 정보(시간/요금/버스)는 이미 OFFICIAL 확보 완료. 물리적 구조만 수집 대상  
3. **ER-CC-001**: 전화 번호 061-664-7301 확인 가능. 공식 홈페이지 SSL 오류 지속 여부 재확인 필요  
4. **향일암 운영 정보**: HY-005(ANCHOR TIME)/HY-004(비용)/HY-006(버스) 수집 시 Batch 01 데이터 재사용 가능 — 신규 수집 불필요  
5. **Gap Register**: Wave 0 버전 유지됨. 이번 조사에서 변경 없음  

---

*이 문서는 Wave 1 시작 전 기존 자산 조사의 완전한 기록입니다.*  
*신규 Yeosu 증거는 수집되지 않았습니다.*  
*Wave 1 첫 번째 수집 단위: ER-HY-001 (향일암 물리적 접근 구조)*
