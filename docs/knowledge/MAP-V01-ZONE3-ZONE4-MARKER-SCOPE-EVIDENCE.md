# MAP V0.1 — Zone 3 / Zone 4 Marker Scope Fix Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE3_ZONE4_MARKER_SCOPE_READY  
**Classification**: REPAIR — dolsan_got_market·nk_submarine·bonghwangsan Zone 3→4 재배정

---

## §1 Founder 지시 원문 (2026-10-29)

**Zone 3 돌산권** — 지도에 마커 표시/편집 가능 장소:
- 돌산대교 / 돌산공원 / 무슬목 / 해상케이블카 돌산탑승장 / 예술랜드리조트

**Zone 4 향일암권** — 마커 지정 가능 대상으로 확장:
- 향일암 / 돌산갓장터마을 / 북한반잠수정전시관 / 봉황산자연휴양림

---

## §2 변경 내용

**파일**: `dreamtown-frontend/src/constants/yeosuMapData.js`

| place_code | 이전 zone | 이후 zone | 비고 |
|------------|-----------|-----------|------|
| dolsan_got_market | 3 | **4** | Founder 결정 2026-10-29 |
| nk_submarine | 3 | **4** | Founder 결정 2026-10-29 |
| bonghwangsan | 3 | **4** | Founder 결정 2026-10-29 |

---

## §3 Zone 별 현황 (변경 후)

### Zone 3 돌산권 — 지도 표시·QA 편집 대상 (overview)

| place_code | name_ko | status | 지도 표시 |
|------------|---------|--------|-----------|
| dolsan_daegyo | 돌산대교 | tg_ready | OPEN (좌표 없음) |
| dolsan_nightscape | 돌산공원 | tg_ready | OPEN |
| museukmok | 무슬목 | explorer | OPEN |
| cablecar_dolsan | 해상케이블카 돌산탑승장 | explorer | OPEN |
| artland_resort | 예술랜드리조트 | verify | OPEN |
| minam_cruise | 미남크루즈 | explorer | OPEN (좌표 없음) |
| isabu_cruise | 이사부크루즈 | explorer | OPEN (좌표 없음) |

**QA 편집 대상 7곳** (미남·이사부 포함 — 좌표 미확인으로 지도 마커 미표시)

### Zone 4 향일암권 — QA 편집 대상 (overview)

| place_code | name_ko | status | 지도 표시 |
|------------|---------|--------|-----------|
| hyangiram | 향일암 | tg_ready | OPEN (좌표 없음) |
| dolsan_got_market | 돌산갓장터마을 | verify | OPEN |
| nk_submarine | 북한반잠수정전시관 | verify | OPEN |
| bonghwangsan | 봉황산자연휴양림 | verify | OPEN |

**QA 편집 대상 4곳** ✅ Founder 지시 충족

---

## §4 코드 변경 범위

- `yeosuMapData.js` — zone 필드 3곳 변경만
- `YeosuMapSelector.jsx` — 변경 없음 (`p.zone === zoneId` 필터 자동 적용)
- DB / SOUL 게이팅 — 변경 없음

---

## §5 Acceptance 점검

| 항목 | 결과 |
|------|------|
| Zone 3 타 권역 마커 0개 | ✅ (dolsan_got_market·nk_submarine·bonghwangsan Zone 4로 이동) |
| Zone 3 돌산권 장소만 표시 | ✅ zone:3 필터 → 5곳+explorer 2곳 |
| Zone 4 편집기에서 향일암·돌산갓장터마을·북한반잠수정·봉황산 선택 가능 | ✅ zone:4 → 4곳 QA 대상 |
| Zone 4 overview 좌표→일반 화면 반영 | ✅ markerPos.overview 구조 동일 |
| Zone 1/2 회귀 없음 | ✅ oldtown 코드 변경 없음 |
| 빌드 | ✅ 698 modules |
| 회귀 | ✅ 639/640 (R20 PRE-EXISTING) |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §6 안전 조건

- SOUL 게이팅 (`isSelectablePlace`) 변경 없음
- oldtown·overview 좌표계 혼입 없음 — zone 필드 변경만
- Zone 1·2 Founder PROVISIONAL 좌표 15곳 불변
- PROVISIONAL → VERIFIED 자동 승격 없음
- Inventory 총 47곳 유지 (zone 재배정만, 신규 추가 없음)
