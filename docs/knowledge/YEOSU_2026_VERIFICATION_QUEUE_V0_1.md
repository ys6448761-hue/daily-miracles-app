# YEOSU 2026 Verification Queue — V0.1
생성일: 2026-09-20
상태: PENDING — Founder 검토 후 실행
소스: YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md + 6117_AUTOSAVE_LEGACY_KNOWLEDGE_MANIFEST_V0_1.md
전체 태그: LEGACY / NEEDS_2026_VERIFICATION

---

## 범례

| 필드 | 설명 |
|---|---|
| entity | 정규화된 장소/서비스명 |
| category | ATTRACTION / NATURE / ISLAND / LEISURE / FOOD / ACCOMMODATION / TRANSPORT / FERRY_CRUISE / SEASONAL_EVENT / LOCAL_SERVICE |
| field_to_verify | is_operational / admission_fee / phone / opening_hours / access_route / ferry_schedule / price / location_alias_check 등 |
| legacy_value | 6117 백업에서 추출한 실제 값 (없으면 "정보 없음") |
| legacy_source | g5_autosave / g5_shop_item / travel_course / travel_places_seed |
| legacy_date | as_datetime 또는 백업 기준일 |
| verification_priority | HIGH / MEDIUM / LOW |
| preferred_current_source | 확인 권장 소스 |
| verification_method | 아래 3종 |
| verification_status | PENDING (전부 PENDING) |
| verified_value | "" (미입력) |
| verified_at | "" (미입력) |
| evidence_url_or_reference | 6117 내부 참조 또는 "" |

### 검증 방법 정의

- **OFFICIAL_WEB_VERIFY** — 공식 웹사이트·여수시 관광포털·네이버/카카오 플레이스로 확인 가능 (장소 존재, 공식 운영시간, 입장료)
- **BUSINESS_DIRECT_VERIFY** — 업체 공식채널·전화·메일 직접 확인 필요 (유람선 운항, 업체 존속, 요금 현행)
- **FOUNDER_FIELD_VERIFY** — 현장 판단·운영 경험 필요 (동일성 판단, 불규칙 운항 섬, 신규 명소 확인)

### 절대 규칙

- 가격·운항시간·영업시간·전화번호·운영 여부 = Legacy 값을 현재 Fact로 사용하지 않는다
- 이미지 45,124개 = 이 Queue 제외 (저작권·원본 연결 감사 전 사용 금지)
- 6117ticket = 계속 HOLD

---

## Queue 1 — 장소 존재·운영 여부 (OFFICIAL_WEB_VERIFY 중심)

고정 관광지·역사·자연·공원 — 장소 자체는 존재할 가능성이 높으나 현재 공식명칭, 운영시간, 입장료 확인 필요.

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 진남관 | ATTRACTION | is_operational | 운영 중 (국보 304호) | g5_autosave, travel_course | 2017-xx | HIGH | 여수시 문화관광 공식 또는 네이버플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave as_id 진남관 전용 페이지 |
| 진남관 | ATTRACTION | opening_hours | 정보 없음 | g5_autosave | 2017-xx | HIGH | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 진남관 | ATTRACTION | admission_fee | 정보 없음 | g5_autosave | 2017-xx | MEDIUM | 여수시 문화관광 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 하멜전시관 | ATTRACTION | is_operational | 운영 중 (추정) | travel_course | 2026-07-02 | HIGH | 네이버 플레이스 / 여수시 관광 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 8회 이상 등장 |
| 하멜전시관 | ATTRACTION | opening_hours | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 이순신대교 | ATTRACTION | is_operational | 운영 중 (추정) | travel_course | 2026-07-02 | MEDIUM | 네이버 지도 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 6회 이상 등장 |
| 이순신대교홍보관 | ATTRACTION | is_operational | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 전남해양수산과학관 | ATTRACTION | is_operational | 운영 중 (추정) | travel_course | 2026-07-02 | MEDIUM | 전남도 공식 또는 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 5회 이상 등장 |
| 전남해양수산과학관 | ATTRACTION | admission_fee | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 공식 홈페이지 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 흥국사 | ATTRACTION | is_operational | 운영 중 (추정) | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 / 사찰 공식 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 4회 이상 등장 |
| 충민사 | ATTRACTION | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 낭만버스 코스 1회 |
| 고소대 | ATTRACTION | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 낭만버스 코스 1회 |
| 선소 | ATTRACTION | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 여수시 문화관광 | OFFICIAL_WEB_VERIFY | PENDING | | | 거북선 건조지 |
| 손양원목사유적공원 | ATTRACTION | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 낭만버스 코스 1회 |
| 예울마루 | ATTRACTION | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 2층버스 코스 1회 |
| 천사벽화골목 | ATTRACTION | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 3회 이상 |
| 전라좌수영거북선 | ATTRACTION | is_operational | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 / 여수시 관광 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 6회 이상 |
| 거북선대교 | ATTRACTION | is_operational | 운항 코스에 경유 명시 | g5_autosave (유람선 코스) | 2017-xx | LOW | 네이버 지도 | OFFICIAL_WEB_VERIFY | PENDING | | | 유람선 코스 직접 언급 |
| 장군도 | ATTRACTION | is_operational | 유람선 코스 경유지 명시 | g5_autosave (유람선 코스) | 2017-xx | LOW | 네이버 지도 | OFFICIAL_WEB_VERIFY | PENDING | | | 유람선 코스 직접 언급 |
| 만성리검은모래해변 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 / 여수시 관광 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 2회 |
| 방죽포해수욕장 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 돌산 갯가길 코스 |
| 무슬목 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 3회 이상 |
| 여자만해넘이 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 일몰 명소, travel_course 3회 이상 |
| 와온해변 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 야경코스C |
| 소호요트장 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 3회 이상 |
| 웅천친수공원 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 유바이크 코스 1회 |
| 봉화산산림욕장 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 태교여행 코스 |
| 봉황산자연휴양림 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 태교여행 코스 |
| 국가산업단지 야경 | NATURE | is_operational | 운영 중 (추정) | g5_autosave, travel_course | 2017-xx | MEDIUM | 네이버 지도 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 전용 페이지 |
| 돌산공원 | NATURE | is_operational | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 6회 이상 |
| 노을과바다 (펜션) | ACCOMMODATION | is_operational | 2030 카테고리 숙박 | g5_shop_item | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_shop_item it_id=1462147126 |
| 송시마을체험관 | LEISURE | is_operational | 4070 카테고리 레저 | g5_shop_item | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_shop_item it_id=1491887264 |
| 거북선에담긴한평생 | FOOD | is_operational | ca_id=90 (기타) | g5_shop_item | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_shop_item it_id=1490404799 |

---

## Queue 2 — 유료 시설 입장료·운영 현황

입장료가 있는 시설 — Legacy 값이 있어도 현재 요금과 다를 수 있음.

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 아쿠아플라넷여수 | ATTRACTION | is_operational | 운영 중 (추정) | g5_autosave (패키지), travel_course | 2017-xx | HIGH | 공식 홈페이지 (aquaplanet.co.kr) | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 여수아쿠아리움패키지 레코드 |
| 아쿠아플라넷여수 | ATTRACTION | admission_fee | 정보 없음 (패키지 요금만 존재) | g5_autosave | 2017-xx | HIGH | 공식 홈페이지 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 아쿠아플라넷여수 | ATTRACTION | opening_hours | 정보 없음 | g5_autosave | 2017-xx | MEDIUM | 공식 홈페이지 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 해상케이블카 | LEISURE | is_operational | 운영 중 (현재 IN_DB) | travel_places_seed, g5_autosave | 2026-07-02 | HIGH | 여수해상케이블카 공식 (yeosucablecar.com) | OFFICIAL_WEB_VERIFY | PENDING | | | travel_places code=cablecar |
| 해상케이블카 | LEISURE | admission_fee | 정보 없음 (travel_places null) | travel_places_seed | 2026-07-02 | HIGH | 공식 홈페이지 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 해상케이블카 | LEISURE | opening_hours | 정보 없음 | travel_places_seed | 2026-07-02 | HIGH | 공식 홈페이지 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 향일암 | ATTRACTION | admission_fee | 정보 없음 (travel_places null; 구 관람료 성인 2,500원) | travel_places_seed | 2026-07-02 | HIGH | 여수시 공식 (yeosu.go.kr) + 남해안신문 | OFFICIAL_WEB_VERIFY | VERIFIED_CLOSED | 무료 (adult=0). 기존 성인 2,500원 → 문화재 관람료 폐지. travel_places 216에 반영됨. | 2026-09-20 | YEOSU_2026_VERIFICATION_BATCH_01.md [11]; SOUL_HYANGIRAM_ADMISSION_CONFLICT_CLOSURE_V0_1.md |
| 향일암 | ATTRACTION | opening_hours | 정보 없음 | travel_places_seed | 2026-07-02 | HIGH | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 진남관 (입장료) | ATTRACTION | admission_fee | 정보 없음 | g5_autosave | 2017-xx | HIGH | 여수시 문화관광 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 전남해양수산과학관 | ATTRACTION | admission_fee | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 공식 홈페이지 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 사도양면해수욕장 | ISLAND | admission_fee | g5_shop_item 2030 카테고리 관광명소 | g5_shop_item | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_shop_item it_id=1466000757 |

---

## Queue 3 — 섬 접근·여객선 운항

섬별로 장소 존재 / 접근 교통 / 현재 운항·상품을 분리. 여객선 시간표는 BUSINESS_DIRECT_VERIFY.

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 거문도 | ISLAND | is_operational | 정보 없음 (코스만 존재) | travel_course | 2026-07-02 | HIGH | 여수연안여객선터미널 공식 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 거문도뱃노랫길코스 |
| 거문도 | ISLAND | ferry_schedule | 정보 없음 (여객선 시간표 레코드 EMPTY) | g5_autosave (EMPTY) | 2016-06-13 | HIGH | 한국해운조합 / 여수연안여객터미널 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave as_id=128 내용 비어있음 |
| 거문도 | ISLAND | access_route | 여수연안여객선터미널 출발, 약 2.5시간 (추정) | travel_course | 2026-07-02 | HIGH | 한국해운조합 / 현지 선사 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 상백도(백도) | ISLAND | is_operational | 유람선으로 접근 (추정) | travel_course | 2026-07-02 | MEDIUM | 선사 직접 문의 | BUSINESS_DIRECT_VERIFY | PENDING | | | travel_course 2박3일코스 |
| 상백도(백도) | ISLAND | ferry_schedule | 정보 없음 | travel_course | 2026-07-02 | MEDIUM | 여수 선사 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 하화도 | ISLAND | is_operational | 꽃섬길 6km (코스 존재) | g5_autosave, travel_course | 2017-xx | HIGH | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 하화도꽃섬길 전용 페이지 |
| 하화도 | ISLAND | ferry_schedule | 정보 없음 | g5_autosave | 2017-xx | HIGH | 한국해운조합 / 선착장 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 사도 | ISLAND | is_operational | 공룡화석·양면해수욕장 (코스 존재) | travel_course | 2026-07-02 | HIGH | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 사도코스·힐링코스 |
| 사도 | ISLAND | ferry_schedule | 정보 없음 (여객선 시간표 레코드 EMPTY) | g5_autosave (EMPTY) | 2016-06-13 | HIGH | 한국해운조합 / 선착장 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 금오도 | ISLAND | is_operational | 비렁길 5코스 (코스 존재) | g5_autosave (×4), travel_course | 2017-xx | HIGH | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 금오도 전용 레코드 4건 |
| 금오도 | ISLAND | ferry_schedule | 여천항/여수항 출발, 약 1.5시간 (추정) | g5_autosave 금오도 비렁길 가는방법 | 2016-xx | HIGH | 한국해운조합 / 여수연안여객터미널 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 금오도비렁길가는방법 레코드 |
| 금오도 | ISLAND | access_route | 여천항/여수항 출발 (Legacy) | g5_autosave | 2016-xx | HIGH | 한국해운조합 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 금오도 | ISLAND | accommodation | 금오도·안도 숙박 업체 존재 (2017) | g5_autosave 금오도·안도숙박 | 2017-xx | MEDIUM | 네이버 플레이스 / 현장 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 섬-금오도안도숙박맛집안내 |
| 금오도 야영장 | ISLAND | is_operational | 2016년 여름 개장 (계절 이벤트) | g5_autosave | 2016-xx | MEDIUM | 네이버 플레이스 / 지자체 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 금오도야영장개장안내 |
| 개도 | ISLAND | is_operational | 개도사람길 코스 존재 | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | travel_course 개도사람길코스 |
| 개도 | ISLAND | ferry_schedule | 소규모 섬, 운항 불규칙 (추정) | travel_course | 2026-07-02 | MEDIUM | 선사 직접 문의 | BUSINESS_DIRECT_VERIFY | PENDING | | | |

---

## Queue 4 — 유람선·크루즈

실데이터 확인됨 (g5_autosave). 운항 여부·요금·시간 현행화 필수.

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 미남크루즈 | FERRY_CRUISE | is_operational | 운항 중 (2017 기준) | g5_autosave 유람선투어 | 2017-xx | HIGH | 미남크루즈 공식 (minamcruise.com) | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 유람선투어 레코드 |
| 미남크루즈 | FERRY_CRUISE | price | 성인 18,900원 (2017) | g5_autosave | 2017-xx | HIGH | 미남크루즈 공식 홈페이지 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 미남크루즈 | FERRY_CRUISE | ferry_schedule | 노을투어 18:00 금·토 (2017) | g5_autosave | 2017-xx | HIGH | 미남크루즈 공식 홈페이지 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 미남크루즈 | FERRY_CRUISE | phone | 641-1000 (2017) | g5_autosave | 2017-xx | HIGH | 네이버 플레이스 / 공식 홈페이지 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 이사부크루즈 | FERRY_CRUISE | is_operational | 운항 중 (2017 기준) | g5_autosave 유람선투어 | 2017-xx | HIGH | 이사부크루즈 공식 (gcruise.kr) | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 이사부크루즈 | FERRY_CRUISE | price | 성인 19,000원 / 야경불꽃투어 35,000원 (2017) | g5_autosave | 2017-xx | HIGH | 이사부크루즈 공식 홈페이지 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 이사부크루즈 | FERRY_CRUISE | ferry_schedule | 야경불꽃투어 20:00 금·토 / 성수기 매일 (2017) | g5_autosave | 2017-xx | HIGH | 이사부크루즈 공식 홈페이지 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 이사부크루즈 | FERRY_CRUISE | phone | 1588-0890 (2017) | g5_autosave | 2017-xx | HIGH | 네이버 플레이스 / 공식 홈페이지 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 여수거북선호 | FERRY_CRUISE | is_operational | 운항 중 (2017 기준) | g5_autosave 유람선투어 | 2017-xx | HIGH | 네이버 플레이스 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 여수거북선호 | FERRY_CRUISE | price | 성인 19,000원 (2017) | g5_autosave | 2017-xx | HIGH | 네이버 플레이스 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 여수거북선호 | FERRY_CRUISE | ferry_schedule | 야경투어 20:00 (2017) | g5_autosave | 2017-xx | HIGH | 네이버 플레이스 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 여수거북선호 | FERRY_CRUISE | phone | 644-2000 (2017) | g5_autosave | 2017-xx | HIGH | 네이버 플레이스 | BUSINESS_DIRECT_VERIFY | PENDING | | | |

---

## Queue 5 — 동일성 판단 필요 (FOUNDER_FIELD_VERIFY)

Alias인지 별도 Entity인지 Founder 현장 판단이 필요한 쌍.

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 수산물특화시장 vs 중앙시장 | FOOD | location_alias_check | 수산물특화시장·여수수산시장 (travel_course), 중앙시장 (travel_places_seed) | travel_course, travel_places_seed | 2026-07-02 | HIGH | 현장 확인 | FOUNDER_FIELD_VERIFY | PENDING | | | §11 A항목 — 동일 장소? 다른 장소? |
| 종포해양공원 vs marine_park | NATURE | location_alias_check | 종포해양공원 (travel_course 5회 이상), marine_park (travel_places_seed) | travel_course, travel_places_seed | 2026-07-02 | HIGH | 현장 확인 / 네이버 지도 | FOUNDER_FIELD_VERIFY | PENDING | | | §11 A항목 — 동일 여부. 유람선 코스에서도 종포해양공원 직접 언급 |
| 돌산공원 vs dolsan_nightscape | NATURE | location_alias_check | 돌산공원 (travel_course 6회 이상), dolsan_nightscape (travel_places_seed) | travel_course, travel_places_seed | 2026-07-02 | HIGH | 현장 확인 | FOUNDER_FIELD_VERIFY | PENDING | | | §11 A항목 — 다른 장소로 추정, 확정 필요 |
| 하멜전시관 vs 하멜등대 | ATTRACTION | location_alias_check | 하멜전시관·하멜등대 둘 다 travel_course 등장 | travel_course | 2026-07-02 | MEDIUM | 현장 확인 | FOUNDER_FIELD_VERIFY | PENDING | | | §11 A항목 — 같은 구역, 별도 code 필요? |
| 비앤비치호텔 vs 비앤비치관광호텔 | ACCOMMODATION | location_alias_check | 각각 g5_shop_item 별도 it_id | g5_shop_item | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | §11 A항목 — 동일 업체 중복 등록 추정 |
| sky_tower (스카이타워) | ATTRACTION | location_alias_check | travel_places_seed 존재, travel_course 미등장 | travel_places_seed | 2026-07-02 | MEDIUM | 현장 확인 / 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | 코스 전혀 미등장 — 신규 명소? 6117 범주 외? |
| 교동시장 vs 낭만포차거리 | FOOD | location_alias_check | 교동시장(2층버스 코스), 낭만포차거리(travel_places_seed) | travel_course, travel_places_seed | 2026-07-02 | LOW | 현장 확인 | FOUNDER_FIELD_VERIFY | PENDING | | | 인근 구역, 별도 Entity 가능성 |

---

## Queue 6 — 영업 중단 가능성 HIGH

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 빅오쇼 (BIG-O) | LEISURE | is_operational | 여수엑스포 한시 운영 가능성 | travel_course | 2026-07-02 | HIGH | 네이버 플레이스 / 여수엑스포 공식 | OFFICIAL_WEB_VERIFY | PENDING | | | §11 B항목 — 엑스포 이후 운영 여부 불명 |
| 해양레일바이크 | LEISURE | is_operational | 운영 중 (travel_course 5회 이상) | travel_course | 2026-07-02 | HIGH | 네이버 플레이스 / 운영사 공식 | OFFICIAL_WEB_VERIFY | PENDING | | | §11 B항목 — 영업 여부 불명 |
| 해양레일바이크 | LEISURE | price | 정보 없음 | travel_course | 2026-07-02 | HIGH | 운영사 공식 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 낭만버스 | LEISURE | is_operational | 투어 운영 중 (travel_course 등장) | travel_course | 2026-07-02 | HIGH | 여수관광 / 운영사 | OFFICIAL_WEB_VERIFY | PENDING | | | §11 B항목 |
| 낭만버스 | LEISURE | price | 정보 없음 | travel_course | 2026-07-02 | HIGH | 운영사 공식 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 2층버스투어 | LEISURE | is_operational | 투어 운영 중 (travel_course 등장) | travel_course | 2026-07-02 | HIGH | 여수관광 / 운영사 | OFFICIAL_WEB_VERIFY | PENDING | | | §11 B항목 |
| 2층버스투어 | LEISURE | price | 정보 없음 | travel_course | 2026-07-02 | HIGH | 운영사 공식 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 평화테마촌 | ATTRACTION | is_operational | 정보 없음 | travel_course | 2026-07-02 | HIGH | 네이버 플레이스 / 여수시 | OFFICIAL_WEB_VERIFY | PENDING | | | §11 B항목 — 태교여행/1박2일 코스 |

---

## Queue 7 — 교통·이동 수단

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 여수공항 항공 | TRANSPORT | ferry_schedule | 항공 운항 시간표 (2016 기준) | g5_autosave | 2016-xx | HIGH | 항공사 공식 / 여수공항 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 여수공항-항공기운항시간표 |
| KTX·무궁화 | TRANSPORT | ferry_schedule | 여수엑스포역 시간표 (2017 기준) | g5_autosave | 2017-xx | HIGH | 코레일 공식 (korail.com) | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 열차 레코드 |
| 고속·시외버스 | TRANSPORT | ferry_schedule | 서울·주요도시발 여수 버스 정보 (2017) | g5_autosave | 2017-xx | MEDIUM | 고속버스통합예매 (kobus.co.kr) | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 고속/시외버스이용 |
| 자가이용 경로 | TRANSPORT | access_route | 서울→여수 고속도로 경로 | g5_autosave | 2017-xx | LOW | 네이버 지도 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 렌트카 6개사 | TRANSPORT | is_operational | 롯데렌탈·AJ렌터카 외 6개사 (2017) | g5_autosave | 2017-xx | HIGH | 각 업체 공식 / 네이버 플레이스 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 렌트카·콜택시·전세버스현황 |
| 렌트카 6개사 | TRANSPORT | phone | 업체별 연락처 (2017) | g5_autosave | 2017-xx | HIGH | 각 업체 공식 홈페이지 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 콜택시 7개사 | TRANSPORT | is_operational | 7개사 존재 (2017) | g5_autosave | 2017-xx | HIGH | 네이버 플레이스 / 여수시 교통 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 콜택시 7개사 | TRANSPORT | phone | 업체별 연락처 (2017) | g5_autosave | 2017-xx | HIGH | 각 업체 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 전세버스 15개사 | TRANSPORT | is_operational | 15개사 존재 (2017) | g5_autosave | 2017-xx | MEDIUM | 각 업체 공식 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 연휴 우회도로 | TRANSPORT | access_route | 연휴 혼잡 구간 우회로 (2016) | g5_autosave | 2016-xx | LOW | 네이버 지도 / 여수시 교통 | OFFICIAL_WEB_VERIFY | PENDING | | | OBSOLETE 가능성 높음 |

---

## Queue 8 — 음식·식당

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 장어구이 (봉산동·여서동·무선지구) | FOOD | is_operational | 지역별 맛집 존재 (2017) | travel_course, g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | 특정 식당명 없음 — 지역 카테고리 |
| 서대회 (교동·남산동·여서동) | FOOD | is_operational | 지역별 맛집 존재 (2017) | travel_course, g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | |
| 갈치조림 (교동·봉산동) | FOOD | is_operational | 지역별 맛집 존재 (2017) | travel_course, g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | |
| 회한정식 (봉산동·여서동·학동) | FOOD | is_operational | 지역별 맛집 존재 (2017) | travel_course, g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | |
| 게장백반 (봉산동·수정동) | FOOD | is_operational | 지역별 맛집 존재 (2017) | travel_course, g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | |
| 갓김치 (돌산·남산동) | FOOD | is_operational | 지역별 맛집 존재 (2017) | travel_course, g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | |
| 하모 (경도·여천·돌산) | FOOD | is_operational | 지역별 맛집 존재 (2017) | travel_course | 2026-07-02 | MEDIUM | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | |
| 전어 (봉산동·교동) | FOOD | is_operational | 지역별 맛집 존재 (계절) | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | 계절 메뉴 |
| 새조개 (경도·봉산동) | FOOD | is_operational | 지역별 맛집 존재 (계절) | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | 계절 메뉴 |
| 굴구이 (돌산·소호동) | FOOD | is_operational | 지역별 맛집 존재 (계절) | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | FOUNDER_FIELD_VERIFY | PENDING | | | 계절 메뉴 |
| 야간식당 16개 (여문문화거리) | FOOD | is_operational | 야간 영업 식당 16개 실명+연락처+대표음식 (2017) | g5_autosave | 2017-07-06 | HIGH | 네이버 플레이스 / 직접 전화 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave '맛집-한밤에즐기는식당2' |
| 24시 콩나물국밥·감자탕 식당 10개 | FOOD | is_operational | 24시 영업 식당 10개 실명+위치 (2017) | g5_autosave | 2017-07-06 | MEDIUM | 네이버 플레이스 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 동일 레코드 |
| 단체식사 가능 식당 | FOOD | is_operational | 단체 예약 식당 목록 (2017) | g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 / 직접 전화 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 단체식사가능식당 |
| 조식 가능 식당 | FOOD | is_operational | 조식 제공 식당 목록 (2017) | g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 조식가능식당 |
| 여수10미 | FOOD | is_operational | 대표 음식 10가지 목록 (2017) | g5_autosave | 2017-xx | MEDIUM | 여수시 관광 공식 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 여수10미 — 현재 공식 항목과 비교 |
| 국동어항단지(게장게백반거리) | FOOD | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 2층버스 코스 |
| 교동시장 포차거리 | FOOD | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 2층버스 코스 |
| 돌산갓김치거리 | FOOD | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 낭만버스 코스 |
| 여문문화의거리 | FOOD | is_operational | 정보 없음 | travel_course | 2026-07-02 | LOW | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | 2층버스 코스 |

---

## Queue 9 — 숙박

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 비앤비치 관광호텔 | ACCOMMODATION | is_operational | 2010 카테고리 숙박 (2026-07-02) | g5_shop_item | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_shop_item it_id=1463034597·1482214649 (중복 추정) |
| 비앤비치 관광호텔 | ACCOMMODATION | price | 정보 없음 | g5_shop_item | 2026-07-02 | MEDIUM | 네이버 플레이스 / 공식 홈페이지 | BUSINESS_DIRECT_VERIFY | PENDING | | | |
| 노을과바다 (펜션) | ACCOMMODATION | is_operational | 2030 카테고리 숙박 (돌산 추정) | g5_shop_item | 2026-07-02 | MEDIUM | 네이버 플레이스 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_shop_item it_id=1462147126 |
| 권역별 숙박 | ACCOMMODATION | is_operational | 지역별 숙박 업체 목록 (2017) | g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 / 야놀자·여기어때 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 권역별숙박안내 |
| 금오도·안도 숙박 | ACCOMMODATION | is_operational | 금오도·안도 숙박 업체 존재 (2017) | g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 / 현장 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 섬-금오도안도숙박맛집안내 |

---

## Queue 10 — 계절·이벤트

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 영취산 진달래축제 | SEASONAL_EVENT | is_operational | 제26회 (2017 추정) 개최, 셔틀버스 운행 | g5_autosave | 2017-xx | MEDIUM | 여수시 문화관광 공식 / 여수엔 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 제26회여수영취산진달래축제 |
| 영취산 진달래축제 | SEASONAL_EVENT | ferry_schedule | 셔틀버스 운행 정보 (2017) | g5_autosave | 2017-xx | MEDIUM | 여수시 공식 | OFFICIAL_WEB_VERIFY | PENDING | | | |
| 여수밤바다 불꽃축제 | SEASONAL_EVENT | is_operational | 사진 자료 존재 (연도 불명) | g5_autosave | 연도불명 | LOW | 여수시 문화관광 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 여수밤바다불꽃축제사진1 |
| 여수밤바다 낭만버스킹 | SEASONAL_EVENT | is_operational | 2016.4.15~10.9 금·토·일 운영 (특정연도) | g5_autosave | 2016-xx | LOW | 여수시 문화관광 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave as_id=11. 개념 재활성화 여부 확인 |

---

## Queue 11 — Local Service·운영 확인

| entity | category | field_to_verify | legacy_value | legacy_source | legacy_date | verification_priority | preferred_current_source | verification_method | verification_status | verified_value | verified_at | evidence_url_or_reference |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 여수여행센터 엑스포점 | LOCAL_SERVICE | is_operational | 엑스포역 위치, 리뉴얼 안내 존재 (2017) | g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 / 현장 확인 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 여수여행센터엑스포점 (4건 개정 이력) |
| 여수여행센터 진남관점 | LOCAL_SERVICE | is_operational | 진남관 앞 위치 (2017) | g5_autosave | 2017-xx | MEDIUM | 네이버 플레이스 / 현장 확인 | BUSINESS_DIRECT_VERIFY | PENDING | | | g5_autosave 여수여행센터진남관점 (3건) |
| 여수여행 예상경비 | LOCAL_SERVICE | price | 여수 여행 평균 경비 가이드 (2017) | g5_autosave | 2017-xx | LOW | 여행 블로그 / 실측 | FOUNDER_FIELD_VERIFY | PENDING | | | g5_autosave 여수여행예상경비알아보기 |
| 해상케이블카 패키지 | LEISURE | price | 케이블카 연계 패키지 (2017 요금) | g5_autosave | 2017-xx | MEDIUM | 여수해상케이블카 공식 홈페이지 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 해상케이블카패키지 |
| 아쿠아플라넷여수 패키지 | LEISURE | price | 패키지 상품 (2017 요금) | g5_autosave | 2017-xx | MEDIUM | 아쿠아플라넷 공식 홈페이지 | OFFICIAL_WEB_VERIFY | PENDING | | | g5_autosave 여수아쿠아리움패키지 |

---

## 최종 집계

| 구분 | 수량 |
|---|---|
| 검증 대상 총 행수 | **109개** |
| OFFICIAL_WEB_VERIFY | **52개** |
| BUSINESS_DIRECT_VERIFY | **45개** |
| FOUNDER_FIELD_VERIFY | **12개** |

Queue별 분포:

| Queue | 항목 | 행수 |
|---|---|---|
| Q1 장소 존재·운영 | 고정 관광지·자연·공원 | 33 |
| Q2 유료 시설 입장료 | 아쿠아플라넷·케이블카·향일암 등 | 11 |
| Q3 섬 접근·여객선 | 거문도·금오도·하화도·사도·개도 | 16 |
| Q4 유람선·크루즈 | 미남크루즈·이사부·거북선호 | 12 |
| Q5 동일성 판단 | alias vs 별도 Entity 7개 쌍 | 7 |
| Q6 영업중단 가능성 | 빅오쇼·레일바이크·낭만버스·2층버스·평화테마촌 | 8 |
| Q7 교통·이동 | 항공·KTX·버스·렌트카·콜택시 | 10 |
| Q8 음식·식당 | 맛집지역·야간식당·24시 등 | 19 |
| Q9 숙박 | g5_shop_item·권역별·섬숙박 | 5 |
| Q10 계절·이벤트 | 진달래·불꽃·버스킹 | 4 |
| Q11 Local Service | 여행센터·패키지 | 5 |
| **합계** | | **109** |

---

## ONE NEXT ACTION

**OFFICIAL_WEB_VERIFY 52개 — 웹 검색으로 PENDING → CONFIRMED/UPDATED/CLOSED 처리 시작.**

웹 검색 가능한 52개를 먼저 처리하면 전체 Queue의 47%가 해소된다.
우선순위: Q6 영업중단 가능성 HIGH 8개 + Q2 유료시설 입장료 HIGH 3개 = 11개부터 시작.
BUSINESS_DIRECT_VERIFY 45개는 Founder가 현장·전화 확인 시 Queue 행을 직접 업데이트.
FOUNDER_FIELD_VERIFY 12개는 현장 방문 또는 운영 경험으로만 확정 가능.

---

_생성: Claude Sonnet 4.6 / MUYEOJEONG Knowledge Audit Phase 1+1B 통합_
_소스 A: YEOSU_ENTITY_CANDIDATE_MANIFEST_V0_1.md (68개 Entity 후보)_
_소스 B: 6117_AUTOSAVE_LEGACY_KNOWLEDGE_MANIFEST_V0_1.md (101건, 52건 Knowledge 후보)_
_태그: LEGACY / NEEDS_2026_VERIFICATION / READ_ONLY_ANALYSIS_
_DB/schema/runtime 변경 없음_
