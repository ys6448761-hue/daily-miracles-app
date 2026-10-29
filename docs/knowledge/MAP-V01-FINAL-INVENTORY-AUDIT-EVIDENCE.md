# MAP V0.1 — Final Inventory Audit Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_FINAL_INVENTORY_AUDITED  
**Classification**: 감사 전용 — 코드·좌표 변경 없음

---

## §1 전체 Inventory 실측

| 항목 | 수량 |
|------|------|
| YEOSU_PLACES 총계 | **49곳** |
| markerPos SOURCE_SAVED | **36곳** |
| markerPos 없음 | **13곳** |

---

## §2 SOURCE_SAVED 36곳 전체 목록

| # | place_id | name_ko | zone | 이미지 | confidence |
|---|----------|---------|------|--------|------------|
| 1 | lee_soon_shin_plaza | 이순신광장 | 1 | oldtown | HIGH |
| 2 | romantic_pojangmacha | 낭만포차거리 | 1 | oldtown | HIGH |
| 3 | hamel_lighthouse | 하멜등대 | 1 | oldtown | HIGH |
| 4 | jinamgwan | 진남관 | 1 | oldtown | HIGH |
| 5 | opodae | 오포대 | 1 | oldtown | HIGH |
| 6 | marine_park | 종포해양공원 | 1 | oldtown | HIGH |
| 7 | odongdo | 오동도 | 2 | oldtown | HIGH |
| 8 | cablecar | 케이블카 | 2 | oldtown | HIGH |
| 9 | yeosu_expo_park | 엑스포공원 | 2 | oldtown | HIGH |
| 10 | sky_tower | 스카이타워 | 2 | oldtown | HIGH |
| 11 | jaisan_park | 자산공원 | 2 | oldtown | HIGH |
| 12 | aquaplanet | 아쿠아플라넷 | 2 | oldtown | HIGH |
| 13 | nangman_yacht | 낭만요트 | 2 | oldtown | HIGH |
| 14 | blue_yacht | 블루요트 | 2 | oldtown | HIGH |
| 15 | big_o_show | 빅오쇼 | 2 | oldtown | HIGH |
| 16 | dolsan_daegyo | 돌산대교 | 3 | overview | PROVISIONAL |
| 17 | dolsan_nightscape | 돌산공원 | 3 | overview | PROVISIONAL |
| 18 | museukmok | 무슬목 | 3 | overview | PROVISIONAL |
| 19 | cablecar_dolsan | 해상케이블카 돌산탑승장 | 3 | overview | PROVISIONAL |
| 20 | artland_resort | 예술랜드리조트 | 3 | overview | PROVISIONAL |
| 21 | dolsan_got_market | 돌산갓장터마을 | 4 | overview | PROVISIONAL |
| 22 | hyangiram | 향일암 | 4 | overview | PROVISIONAL |
| 23 | nk_submarine | 북한반잠수정전시관 | 4 | overview | PROVISIONAL |
| 24 | bonghwangsan | 봉황산자연휴양림 | 4 | overview | PROVISIONAL |
| 25 | yworld_luge | 유월드루지 | 5 | overview | PROVISIONAL |
| 26 | jangdo | 장도 | 5 | overview | PROVISIONAL |
| 27 | soho_yacht | 소호요트장 | 5 | overview | PROVISIONAL |
| 28 | soho_bridge | 소호동동다리 | 5 | overview | PROVISIONAL |
| 29 | lee_soon_shin_marina | 이순신마리나 | 5 | overview | PROVISIONAL |
| 30 | settler_cactus | 서틀러다육식물원 | 5 | overview | PROVISIONAL |
| 31 | gasari_ecology | 가사리생태공원 | 6 | overview | PROVISIONAL |
| 32 | yeojaman_sunset | 여자만갯벌/해넘이 | 6 | overview | PROVISIONAL |
| 33 | seomdalcheon | 섬달천 | 6 | overview | PROVISIONAL |
| 34 | hwanyang_drive | 화양드라이브 | 6 | overview | PROVISIONAL |
| 35 | sado_island | 사도 | 7 | overview | PROVISIONAL |
| 36 | hahwado_island | 하화도 | 7 | overview | PROVISIONAL |

---

## §3 미배치 13곳 — 사유 분류

### MAP_OUT_OF_SCOPE (5곳)

의도적 제외 또는 현재 이미지 범위 밖.

| place_id | name_ko | zone | status | 사유 |
|----------|---------|------|--------|------|
| jungang_market | 중앙시장 | 1 | tg_excluded | OI-MAP-1: hidden:true, 지도 미표시 의도 결정. V0.1 CLOSED. |
| geumo_island | 금오도 | 7 | ferry | PLACEMENT_OPEN: overview 이미지 범위 내 위치 미확인. |
| geomundo_island | 거문도 | 7 | ferry | PLACEMENT_OPEN: overview 이미지 범위 내 위치 미확인. |
| baekdo_island | 백도 | 7 | ferry | PLACEMENT_OPEN: overview 이미지 범위 내 위치 미확인. |
| gaedo_island | 개도 | 7 | ferry | PLACEMENT_OPEN: overview 이미지 범위 내 위치 미확인. |

### PLACEMENT_PENDING (1곳)

좌표 근거 있음. Founder oldtown 마커 미입력.

| place_id | name_ko | zone | status | 이미지 | 사유 |
|----------|---------|------|--------|--------|------|
| gosodong_mural | 고소동 천사벽화골목 | 1 | explorer | oldtown | coordVerified: true (NAVER 마커). markerPos.oldtown 미입력. Founder 드래그 필요. |

### LOCATION_UNVERIFIED (7곳)

위치 근거 부족. 선착장·경계·좌표 미검증.

| place_id | name_ko | zone | status | 이미지 | 사유 |
|----------|---------|------|--------|--------|------|
| yeosu_fish_market | 여수 수산시장 | 1 | explorer | oldtown | UV-2: 주소=여객선터미널길 24 교동 확인. 좌표 미검증. |
| yeosu_expo_station | 여수엑스포역 | 2 | explorer | oldtown | coordVerified: false. 역 위치 확인은 가능하나 markerPos 미입력. |
| expo_ocean_trail | 엑스포 바닷길 | 2 | explorer | oldtown | 경계·좌표 미검증. yeosu_expo_park와 별개 경험 항목. |
| manseongri_beach | 만성리해수욕장 | 2 | explorer | oldtown | coordVerified: false. Founder Zone 2 배치. |
| yeosu_ocean_cruise | 여수오션크루즈 | 2 | explorer | oldtown | 선착장 위치 UNVERIFIED. 운항 조건 미확인. |
| minam_cruise | 미남크루즈 | 3 | explorer | overview | 선착장 위치·운항 조건 미검증. SOUL 추천 자동 승격 금지. |
| isabu_cruise | 이사부크루즈 | 3 | explorer | overview | 선착장 위치·운항 조건 미검증. SOUL 추천 자동 승격 금지. |

---

## §4 V0.1 완료 인정 범위

| 분류 | 수량 | 처리 |
|------|------|------|
| SOURCE_SAVED (QA 표시 가능) | 36 | **V0.1 COMPLETE** |
| MAP_OUT_OF_SCOPE — 의도적 제외 | 1 (jungang_market) | **V0.1 CLOSED** |
| MAP_OUT_OF_SCOPE — 이미지 범위 밖 | 4 (섬섬길 4곳) | V0.2 이관 |
| PLACEMENT_PENDING | 1 (gosodong_mural) | V0.2 이관 (Founder 마커 입력 시) |
| LOCATION_UNVERIFIED | 7 | V0.2 이관 (위치 확인 후) |
| **V0.1 처리 완료** | **37/49** | |
| **V0.2 이관** | **12/49** | |

---

## §5 V0.2 이관 목록

| place_id | name_ko | zone | 이관 조건 |
|----------|---------|------|----------|
| gosodong_mural | 고소동 천사벽화골목 | 1 | Founder oldtown 드래그 입력 |
| yeosu_fish_market | 여수 수산시장 | 1 | UV-2 좌표 검증 후 markerPos 추가 |
| yeosu_expo_station | 여수엑스포역 | 2 | Founder oldtown 드래그 입력 |
| expo_ocean_trail | 엑스포 바닷길 | 2 | 경계 확인 후 markerPos 추가 |
| manseongri_beach | 만성리해수욕장 | 2 | Founder oldtown 드래그 입력 |
| yeosu_ocean_cruise | 여수오션크루즈 | 2 | 선착장 위치 확인 후 추가 |
| minam_cruise | 미남크루즈 | 3 | 선착장 위치 확인 후 추가 |
| isabu_cruise | 이사부크루즈 | 3 | 선착장 위치 확인 후 추가 |
| geumo_island | 금오도 | 7 | overview 이미지 범위 확인 후 |
| geomundo_island | 거문도 | 7 | overview 이미지 범위 확인 후 |
| baekdo_island | 백도 | 7 | overview 이미지 범위 확인 후 |
| gaedo_island | 개도 | 7 | overview 이미지 범위 확인 후 |

---

## §6 사유별 요약

| 사유 | 수량 |
|------|------|
| MAP_OUT_OF_SCOPE (의도적) | 1 |
| MAP_OUT_OF_SCOPE (이미지 범위 밖) | 4 |
| PLACEMENT_PENDING | 1 |
| LOCATION_UNVERIFIED | 7 |
| **미배치 합계** | **13** |

---

## §7 검증

| 항목 | 결과 |
|------|------|
| 전체 Inventory 실측 | 49곳 (코드 확인) |
| SOURCE_SAVED 실측 | 36곳 (집합 비교) |
| 미배치 실측 | 13곳 = 49 - 36 ✅ |
| 기존 36곳 좌표 변경 | ✅ 없음 |
| 권역 소속 변경 | ✅ 없음 |
| VERIFIED 자동 승격 | ✅ 없음 |
| 코드 변경 | ✅ 없음 (감사 전용) |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
