# MAP V0.1 — Zone 3 지도 적용 결정 (overview 유지)

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE3_OVERVIEW_DECISION_RECORDED  
**Classification**: 결정 기록 (코드 변경 없음)

---

## §1 Founder 결정 원문 (2026-10-29)

> Zone 3 돌산권은 원도심 상세지도가 아니라 여수 전체지도(yeosu-overview-v01.png)를 사용한다.
>
> 이유: 무슬목·예술랜드리조트·봉황산자연휴양림 등 돌산 남부 장소는 원도심 상세지도 범위에서 정확하게 표현하기 어렵다.

---

## §2 적용 기준 확정

| 항목 | 결정 |
|------|------|
| Zone 1·2 | 원도심 상세지도 유지, 좌표 15곳 불변 |
| Zone 3 | 여수 전체지도 (yeosu-overview-v01.png) 사용 |
| Zone 4~7 | 여수 전체지도 사용 |
| 각 지도 표시 | 현재 선택한 권역의 마커만 표시 |
| Zone 3 markerPos | overview 이미지 좌표계에 별도 저장 (좌표 미확인 = OPEN) |
| 좌표 투영 금지 | oldtown 좌표 → overview 자동 변환 금지 |
| Inventory·SOUL | 변경 없음 |
| 임의 위치 생성 | 금지 (근거 없는 좌표 PROVISIONAL/OPEN 유지) |

---

## §3 현재 코드 상태 대조

### Zone 3 yeosuMapData.js (현재)

```javascript
{
  id: 3, name_ko: '돌산권', color: '#FFD67A',
  hasDetailMap: false,         // ← overview 사용 중 (결정과 일치)
  boundingBox: { ... },
  boundary: {
    imageId: 'yeosu-overview-v01',  // ← 결정과 일치
    points: null, status: 'UNVERIFIED', source: null
  },
}
```

**결론: Zone 3은 이미 올바른 상태 — 코드 변경 불필요.**

### Zone 4~7 (현재)

```javascript
// Zone 4~7 모두 hasDetailMap: false, imageId: 'yeosu-overview-v01'
// → 결정과 일치, 코드 변경 불필요
```

---

## §4 Zone별 현황 (2026-10-29)

### Zone 1 — 원도심 해안권 (oldtown)

| place_code | 상태 | markerPos.oldtown |
|------------|------|-------------------|
| lee_soon_shin_plaza | tg_ready | PROVISIONAL ✅ |
| romantic_pojangmacha | tg_ready | PROVISIONAL ✅ |
| hamel_lighthouse | tg_ready | PROVISIONAL ✅ |
| jinamgwan | tg_ready | PROVISIONAL ✅ |
| opodae | tg_ready | PROVISIONAL ✅ |
| marine_park | tg_ready | PROVISIONAL ✅ |

**6곳 PROVISIONAL — Founder VERIFIED 승격 결정 대기**

### Zone 2 — 오동도·엑스포권 (oldtown)

| place_code | 상태 | markerPos.oldtown |
|------------|------|-------------------|
| odongdo | tg_ready | PROVISIONAL ✅ |
| cablecar | tg_ready | PROVISIONAL ✅ |
| yeosu_expo_park | tg_ready | PROVISIONAL ✅ |
| sky_tower | tg_ready | PROVISIONAL ✅ |
| jaisan_park | tg_ready | PROVISIONAL ✅ |
| aquaplanet | explorer | PROVISIONAL ✅ |
| nangman_yacht | explorer | PROVISIONAL ✅ |
| blue_yacht | explorer | PROVISIONAL ✅ |
| big_o_show | explorer | PROVISIONAL ✅ |
| yeosu_expo_station | explorer | OPEN (좌표 미확인) |
| expo_ocean_trail | explorer | OPEN (좌표 미확인) |
| manseongri_beach | explorer | OPEN (좌표 미확인) |
| yeosu_ocean_cruise | explorer | OPEN (좌표 미확인) |

**9곳 PROVISIONAL, 4곳 OPEN**

### Zone 3 — 돌산권 (overview)

| place_code | 상태 | markerPos.overview |
|------------|------|-------------------|
| dolsan_daegyo | tg_ready | OPEN (좌표 없음) |
| dolsan_nightscape | tg_ready | OPEN (좌표 없음) |
| museukmok | explorer | OPEN (좌표 없음) |
| dolsan_got_market | verify | OPEN (좌표 없음) |
| cablecar_dolsan | explorer | OPEN (좌표 없음) |
| nk_submarine | verify | OPEN (좌표 없음) |
| bonghwangsan | verify | OPEN (좌표 없음) |
| artland_resort | verify | OPEN (좌표 없음) |

**8곳 전부 OPEN — overview 좌표계 좌표 미확인**

### Zone 4 — 향일암권 (overview)

| place_code | 상태 | markerPos.overview |
|------------|------|-------------------|
| hyangiram | tg_ready | OPEN (좌표 없음) |

### Zone 5 — 소호·장도권 (overview)

| place_code | 상태 | markerPos.overview |
|------------|------|-------------------|
| jangdo | verify | OPEN |
| soho_yacht | verify | OPEN |
| soho_bridge | verify | OPEN |
| lee_soon_shin_marina | verify | OPEN |
| settler_cactus | verify | OPEN |
| yworld_luge | verify | OPEN |

### Zone 6 — 화양·여자만권 (overview)

| place_code | 상태 | markerPos.overview |
|------------|------|-------------------|
| gasari_ecology | verify | OPEN |
| yeojaman_sunset | verify | OPEN |
| seomdalcheon | verify | OPEN |
| hwanyang_drive | verify | OPEN |
| jangcheok_tideland | verify | OPEN |

### Zone 7 — 섬섬길 배편 필수 (overview)

| place_code | 상태 | markerPos.overview |
|------------|------|-------------------|
| sado_island | ferry | OPEN |
| hahwado_island | ferry | OPEN |
| hwajung_island | ferry | OPEN |

---

## §5 남은 작업 (Zone 3~7)

Zone 3~7은 overview 이미지 좌표계를 사용하지만 현재:

1. **overview 마커 표시 시스템 미구현**: `hasDetailMap: false` 권역에서 마커를 overview 이미지 위에 렌더링하는 QA 편집 + 일반 표시 시스템이 없음
2. **overview 좌표 없음**: Zone 3~7 모든 장소 markerPos.overview = null

**다음 필요 사항**:
- Founder: Zone 3~7 overview 마커 표시 방식 결정 (QA 편집 시스템 확장 vs 별도 방식)
- Founder: Zone 3 dolsan_daegyo / dolsan_nightscape 등 overview 좌표 제공

---

## §6 안전 조건

| 항목 | 상태 |
|------|------|
| 코드 변경 | ✅ 없음 (Zone 3 이미 올바른 상태) |
| Zone 1·2 좌표 (15곳 PROVISIONAL) | ✅ 불변 |
| VERIFIED 자동 승격 | ✅ 없음 |
| Inventory 45 / TG_READY 12 / 7권역 | ✅ 유지 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| oldtown → overview 자동 좌표 투영 | ✅ 금지 |
| 임의 위치 생성 | ✅ 금지 |
