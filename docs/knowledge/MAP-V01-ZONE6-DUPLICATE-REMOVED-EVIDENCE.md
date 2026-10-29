# MAP V0.1 — Zone 6 Duplicate Place Cleanup Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE6_DUPLICATE_REMOVED  
**Classification**: REPAIR — jangcheok_tideland 중복 제거 + Zone 6 후보 좌표 PROVISIONAL 저장

---

## §1 Founder 결정 원문 (2026-10-29)

> 여자만갯벌/해넘이와 장척갯벌체험(장척갯벌마을)은 이번 지도 Inventory에서 동일 장소로 취급한다.
> 대표 장소: 여자만갯벌/해넘이 / 제거 대상: 장척갯벌체험

---

## §2 변경 전후 Zone 6

### 변경 전 (5곳)
| place_code | name_ko | 비고 |
|------------|---------|------|
| gasari_ecology | 가사리생태공원 | 유지 |
| yeojaman_sunset | 여자만갯벌/해넘이 | **대표 유지** |
| seomdalcheon | 섬달천 | 유지 |
| hwanyang_drive | 화양드라이브 | 유지 |
| jangcheok_tideland | 장척갯벌체험 | **제거** |

### 변경 후 (4곳)
| place_code | name_ko | markerPos.overview | status |
|------------|---------|-------------------|--------|
| gasari_ecology | 가사리생태공원 | x=0.364, y=0.404 | PROVISIONAL |
| yeojaman_sunset | 여자만갯벌/해넘이 | x=0.277, y=0.288 | PROVISIONAL |
| seomdalcheon | 섬달천 | x=0.254, y=0.341 | PROVISIONAL |
| hwanyang_drive | 화양드라이브 | x=0.433, y=0.506 | PROVISIONAL |

---

## §3 참조 확인 (jangcheok_tideland)

| 검색 대상 | 결과 |
|-----------|------|
| `dreamtown-frontend/src` 전체 | **1곳** (yeosuMapData.js line 117만) |
| `*.js` 서버/라우트 | **0곳** |
| localStorage 키 | DRAFT_KEY_OVERVIEW는 place_code 키 독립 — 제거 무관 |
| SOUL 엔진 | 변경 없음 |

---

## §4 Zone 6 후보 좌표 (PROVISIONAL)

Founder 제공 2026-10-29. `status: 'PROVISIONAL'` — VERIFIED 승격은 별도 Founder 결정 필요.
"QA 초안 취급"이므로 소스 저장이 완료되었어도 VERIFIED가 아님.

| place_code | x | y | 출처 |
|------------|---|---|------|
| gasari_ecology | 0.364 | 0.404 | Founder 직접 제공 |
| yeojaman_sunset | 0.277 | 0.288 | Founder 직접 제공 |
| seomdalcheon | 0.254 | 0.341 | Founder 직접 제공 |
| hwanyang_drive | 0.433 | 0.506 | Founder 직접 제공 |

---

## §5 전체 Inventory 현황

| 구분 | 수량 |
|------|------|
| 이전 Inventory | **47곳** (45 원본 + minam·isabu 2 추가) |
| jangcheok_tideland 제거 | -1 |
| **현재 Inventory** | **46곳** |
| Zone 6 QA 편집 대상 | **4곳** ✅ |
| 중복 마커 | **0건** ✅ |

---

## §6 검증

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 698 modules |
| Jest 회귀 | ✅ 639/640 (R20 PRE-EXISTING) |
| Zone 6 편집 목록 4곳 | ✅ |
| 중복 마커 0건 | ✅ (jangcheok_tideland 참조 0) |
| yeojaman_sunset 데이터 유지 | ✅ |
| Zone 1~5·7 변경 없음 | ✅ |
| VERIFIED 자동 승격 | ✅ 없음 |
| SOUL 엔진·DB | ✅ 변경 없음 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
