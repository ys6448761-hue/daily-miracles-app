# MAP V0.1 Final Integration Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_FINAL_INTEGRATION_WITH_DEFERRED_MARKERS  
**Authorized**: MAP_V01_FINAL_INTEGRATION_AUTHORIZED

---

## §1 마커 현황

### Zone 1 — 원도심 해안권 (신규 4개 추가)

| 장소 | code | 좌표 | 상태 | 식별 근거 |
|------|------|------|------|---------|
| 이순신광장 | `lee_soon_shin_plaza` | (0.30, 0.51) | PROVISIONAL | 이미지 중앙 좌측 해안 광장+시계탑 |
| 낭만포차거리 | `romantic_pojangmacha` | (0.38, 0.61) | PROVISIONAL | 이미지 중앙 부두 인근 |
| 하멜등대 | `hamel_lighthouse` | (0.50, 0.68) | PROVISIONAL | 이미지 중앙 하단 해안 등대 모양 구조물 |
| 종포해양공원 | `marine_park` | (0.53, 0.47) | PROVISIONAL | 이미지 중앙 해안 공원 |

### Zone 2 — 오동도·엑스포권 (기존 1개 + 신규 2개)

| 장소 | code | 좌표 | 상태 | 식별 근거 |
|------|------|------|------|---------|
| 오동도 | `odongdo` | (0.87, 0.28) | PROVISIONAL | 기존 — 우측 독립 섬+등대 식별 |
| 케이블카 | `cablecar` | (0.69, 0.57) | PROVISIONAL | 이미지 우하단 부두 구조물 |
| 자산공원 | `jaisan_park` | (0.65, 0.48) | PROVISIONAL | 케이블카 위 언덕 위치 |

### 마커 미추가 (Deferred)

| 장소 | 이유 |
|------|------|
| `yeosu_expo_park` (엑스포공원) | QA_OLDTOWN_POSITIONS `conflict: true` — Zone 1/2 경계 근처, 이미지에서 구분 불명확 |
| `sky_tower` (스카이타워) | QA_OLDTOWN_POSITIONS `conflict: true` — 엑스포공원과 근접, 독립 식별 불가 |
| Zone 1 EXPLORER/TG_EXCLUDED | SOUL 게이팅 — 마커 추가 불가 |

---

## §2 Inventory 보존 확인

| 항목 | 기준 | 현재 | 상태 |
|------|------|------|------|
| 전체 장소 | 42개 | 42개 | ✅ |
| TG_READY | 12개 | 12개 | ✅ |
| 권역 | 7개 | 7개 | ✅ |
| SOUL 게이팅 (TG_READY만 선택) | 유지 | 유지 | ✅ |

---

## §3 양방향 토글 구현 상태

### 코드 레벨 검증 ✅

```
마커 클릭 → onTogglePlace({code, name}) → toggleRoutePlace → routePlaces 업데이트
                                                                    ↓
버튼 re-render ← selectedPlaces.some(p => p.code === place.code)
마커 re-render ← selectedPlaces.some(p => p.code === m.code)
```

**QA Preview 격리**:
- 일반 사용자: `selectable = isSelectablePlace(m) && isVerified` → PROVISIONAL 클릭 불가
- QA Preview (`?qa_preview=boundary`): `selectable = isSelectablePlace(m) && (isVerified || isQAPreview)` → PROVISIONAL도 토글 테스트 가능
- SOUL 게이팅: `isSelectablePlace` 로직 변경 없음 (TG_READY만)
- EXPLORER/FERRY/TG_EXCLUDED → `isSelectablePlace=false` → 항상 클릭 차단

### 브라우저 테스트 — UNVERIFIED (자동화 불가)

| 항목 | 테스트 방법 | 상태 |
|------|-----------|------|
| A. 마커 클릭 → 버튼 ON | 브라우저 수동 | UNVERIFIED |
| B. 마커 재클릭 → OFF | 브라우저 수동 | UNVERIFIED |
| C. 버튼 클릭 → 마커 ON | 브라우저 수동 | UNVERIFIED |
| D. 버튼 재클릭 → OFF | 브라우저 수동 | UNVERIFIED |
| E. Zone 1↔2 이동 후 선택 유지 | 브라우저 수동 | UNVERIFIED |
| F. 미검증 마커 일반 화면 숨김 | 코드+단위테스트 | ✅ VERIFIED |
| G. SOUL 누출 0건 | 단위테스트 24/24 | ✅ VERIFIED |
| H. 이미지·SVG 좌표계 일치 | 코드 레벨 | ✅ VERIFIED (0~1 비율 좌표) |
| I. 모바일 화면 | 브라우저 수동 | UNVERIFIED |
| J. 빌드·회귀 테스트 | 639/640 PASS | ✅ PASS |

**Founder 검수 URL**:
```
http://localhost:5000/muyojeong?qa_preview=boundary
→ Zone 1(원도심): 마커 4개 표시 (반투명 주황) + 클릭 → 버튼 ON/OFF 확인
→ Zone 2(오동도·엑스포): 마커 3개 표시 + 오동도·케이블카·자산공원 클릭 토글 확인
→ 일반 화면 (qa_preview 제거): 마커 전체 숨김 확인
```

---

## §4 Zone 경계 상태

| 권역 | 상태 | 비고 |
|------|------|------|
| Zone 1 boundary | PROVISIONAL | 미확정 — Founder 검수 대기 |
| Zone 2 boundary | PROVISIONAL | NW y=0.10 (여수엑스포역 방향) — Founder 검수 대기 |
| Zone 3~7 boundary | UNVERIFIED | 개요 지도 미사용 |

Zone 2: 여수엑스포역 포함 / 오동도·엑스포공원·스카이타워 포함 / 돌산 제외 — 경계 PROVISIONAL 유지.

---

## §5 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `yeosuMapData.js` | Zone 1 TG_READY 4개 + Zone 2 2개에 `markerPos.oldtown` PROVISIONAL 추가 |
| `YeosuMapSelector.jsx` | QA Preview 시 PROVISIONAL 마커 클릭 허용 (일반 화면 차단 유지) |

---

## §6 다음 단계 (next-phase backlog)

| 항목 | 조건 |
|------|------|
| PROVISIONAL → VERIFIED 승격 | Founder 브라우저 검수 후 위치 확인된 마커만 |
| `yeosu_expo_park` / `sky_tower` 마커 | conflict 해소 후 추가 (이미지에서 독립 식별 필요) |
| Zone 1·2 boundary VERIFIED 승격 | Founder 승인 후 |
| 빨간 테스트 사각형 제거 | VERIFIED 경계 승격과 동시 |
| 다음 장소 확장 | Zone 3~7 detailMap 여부 결정 후 |
