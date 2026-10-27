# MAP V0.1 Placement UX Fix — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_PLACEMENT_UX_FIXED  
**Authorization**: MAP_V01_PLACEMENT_UX_FIX_REQUIRED (Founder QA 실패 → 수정 요청)

---

## §1 문제

Zone 2(오동도·엑스포권) 화면에서 위치 지정 모드 진입 시  
`zoneTargets = PLACEMENT_TARGETS.filter(t => t.zone === zoneId)` — zone=2 장소만 표시.  
이순신광장·종포해양공원·하멜등대 등 Zone 1 장소 선택 불가.

원인: Zone 1·2가 동일한 `yeosu-oldtown-v01.png`를 사용함에도 zone별로 분리된 필터.

---

## §2 수정 내용

| 파일 | 변경 | 비고 |
|------|------|------|
| `YeosuMapSelector.jsx` | `PLACEMENT_TARGETS` 5→9개 확장 | hamel_lighthouse, cablecar, yeosu_expo_park, sky_tower 추가 |
| `YeosuMapSelector.jsx` | `zoneTargets` 필터 `t.zone === zoneId` 제거 | hasDetailMap인 경우 전체 표시 |
| `YeosuMapSelector.jsx` | 기존 마커 렌더링 filter 확장 | `hasDetailMap ? zone 1\|2 : zone.id` |
| `YeosuMapSelector.jsx` | `qaPlaces` 필터 확장 | `p.zone === 1 \|\| p.zone === 2` |
| `YeosuMapSelector.jsx` | UI Zone 구분 레이블 추가 | Zone 1 · Zone 2 섹션으로 분리 표시 |

### 핵심 변경 (zoneTargets)

```javascript
// 이전
const zoneTargets = isQAPreview && zone?.hasDetailMap
  ? PLACEMENT_TARGETS.filter(t => t.zone === zoneId)  // zone별 분리 → 문제
  : [];

// 수정
const zoneTargets = isQAPreview && zone?.hasDetailMap
  ? PLACEMENT_TARGETS  // Zone 1·2 모두 oldtown 이미지 공유 → 전체 표시
  : [];
```

---

## §3 위치 지정 가능 장소 전체 목록 (9개)

| # | place_id | name_ko | zone | 기존 markerPos |
|---|----------|---------|------|--------------|
| 1 | lee_soon_shin_plaza | 이순신광장 | 1 | PROVISIONAL (흰 원, 재확인 필요) |
| 2 | marine_park | 종포해양공원 | 1 | PROVISIONAL |
| 3 | romantic_pojangmacha | 낭만포차거리 | 1 | PROVISIONAL |
| 4 | hamel_lighthouse | 하멜등대 | 1 | PROVISIONAL |
| 5 | odongdo | 오동도 | 2 | PROVISIONAL |
| 6 | cablecar | 케이블카 | 2 | PROVISIONAL (AMBIGUOUS 유지) |
| 7 | yeosu_expo_park | 엑스포공원 | 2 | 없음 — 신규 지정 가능 |
| 8 | sky_tower | 스카이타워 | 2 | 없음 — 신규 지정 가능 |
| 9 | jaisan_park | 자산공원 | 2 | PROVISIONAL (마커 없음, 재확인 필요) |

---

## §4 안전 조건 보존

| 항목 | 상태 |
|------|------|
| QA 게이팅 (`localhost + ?qa_preview=boundary`) | ✅ 변경 없음 |
| 위치 지정 모드 중 일반 토글 비활성 | ✅ 변경 없음 |
| PROVISIONAL 자동 VERIFIED 승격 없음 | ✅ 변경 없음 |
| DB 저장 없음 (React state 전용) | ✅ 변경 없음 |
| candidates 장소별 독립 유지 (덮어쓰기 없음) | ✅ 변경 없음 |
| Production 화면 숨김 | ✅ 변경 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| Inventory 42개 / TG_READY 12개 / 7개 권역 | ✅ 변경 없음 |

---

## §5 검증

| 항목 | 결과 |
|------|------|
| 빌드 | ✅ 698 modules |
| 테스트 | ✅ 639/640 PASS (R20 PRE-EXISTING 유지) |

---

## §6 Founder 검수 절차

1. `node server.js` 재시작
2. `http://localhost:5000/muyojeong?qa_preview=boundary`
3. **Zone 2(오동도·엑스포권) 또는 Zone 1(원도심)** 중 하나 선택
4. "📍 마커 위치 지정 모드 시작" 클릭
5. Zone 1 섹션에서 이순신광장·자산공원 등 선택 → 지도 클릭 → 녹색 후보 마커 확인
6. Zone 2 섹션에서 다른 장소 선택 → 이전 지정 좌표 유지 확인
7. 완료 후 "전체 좌표 복사" → 코드야에게 전달
