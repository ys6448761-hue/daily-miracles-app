# MAP V0.1 — Zone 7 섬섬길 Layout Source Saved Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE7_LAYOUT_SOURCE_SAVED  
**분류**: 좌표 정정 (2곳) + 신규 마커 등록 (2곳) + offMap UI 섹션 구현

---

## §1 변경 요약

| 항목 | 변경 내용 |
|------|-----------|
| 사도 (`sado_island`) | 좌표 정정 (0.307/0.823 → **0.311/0.813**) |
| 하화도 (`hahwado_island`) | 좌표 정정 (0.420/0.818 → **0.425/0.810**) |
| 금오도 (`geumo_island`) | 신규 markerPos 등록 (**0.662/0.877**, PROVISIONAL) |
| 개도 (`gaedo_island`) | 신규 markerPos 등록 (**0.512/0.828**, PROVISIONAL) |
| 거문도 (`geomundo_island`) | `offMap: true` 추가 — 지도 마커 미표시, Zone 7 별도 목록에만 표시 |
| 백도 (`baekdo_island`) | `offMap: true` 추가 — 지도 마커 미표시, Zone 7 별도 목록에만 표시 |

---

## §2 Founder 결정 근거 (2026-10-29)

- 사도·하화도·금오도·개도: 수채화 지도 이미지 내 위치 확인 → 지도 마커 표시
- 거문도·백도: 수채화 지도 이미지 범위 밖 → 지도 마커 미표시
- 거문도·백도 후보 좌표 (증거용 기록, 코드 미적용): 거문도(0.262/0.985), 백도(0.313/0.977)
- Zone 7 화면에 "지도 범위 밖의 섬" 별도 목록 신규 구현

---

## §3 Zone 7 최종 좌표표

| place_id | name_ko | x | y | 이전 x | 이전 y | 비고 |
|----------|---------|---|---|--------|--------|------|
| sado_island | 사도 | **0.311** | **0.813** | 0.307 | 0.823 | SOURCE_SAVED |
| hahwado_island | 하화도 | **0.425** | **0.810** | 0.420 | 0.818 | SOURCE_SAVED |
| geumo_island | 금오도 | **0.662** | **0.877** | (없음) | (없음) | SOURCE_SAVED (신규) |
| gaedo_island | 개도 | **0.512** | **0.828** | (없음) | (없음) | SOURCE_SAVED (신규) |
| geomundo_island | 거문도 | offMap | — | — | — | 지도 마커 없음, 목록 표시 |
| baekdo_island | 백도 | offMap | — | — | — | 지도 마커 없음, 목록 표시 |

---

## §4 UI 구현 — "지도 범위 밖의 섬" 섹션

**파일**: `dreamtown-frontend/src/components/YeosuMapSelector.jsx`

**구조**:
- Zone 7 선택 시 `allPlaces` → `offMapPlaces` (offMap:true) + `places` (나머지) 분리
- 지도 이미지 아래, 배편 안내 텍스트 다음 위치
- 거문도·백도를 비선택형 span으로 표시 (chip 목록과 별개)
- 기존 chip 목록(`places`)에는 offMap 장소 미포함

```jsx
const offMapPlaces = zoneId === 7 ? allPlaces.filter(p => p.offMap) : [];
const places       = zoneId === 7 ? allPlaces.filter(p => !p.offMap) : allPlaces;
```

---

## §5 Puppeteer 검증 결과

**테스트**: `tests/map-zone7-verify.js`  
**방법**: localStorage 주입 없음 — yeosuMapData.js SOURCE 직접 렌더

```
[ 지도 마커 4곳 좌표 검증 ]
  ✅ sado_island(사도):    SOURCE=(0.311,0.813) render=(0.3110,0.8130) Δ=0.0000
  ✅ hahwado_island(하화도): SOURCE=(0.425,0.810) render=(0.4250,0.8100) Δ=0.0000
  ✅ geumo_island(금오도): SOURCE=(0.662,0.877) render=(0.6620,0.8770) Δ=0.0000
  ✅ gaedo_island(개도):   SOURCE=(0.512,0.828) render=(0.5120,0.8280) Δ=0.0000
  결과: 4/4 PASS

[ 거문도·백도 지도 마커 없음 확인 ]
  ✅ 거문도: 마커 없음 (정상)
  ✅ 백도: 마커 없음 (정상)

[ "지도 범위 밖의 섬" 섹션 확인 ]
  ✅ 섹션 타이틀 존재: true
  ✅ 거문도 목록 항목: true
  ✅ 백도 목록 항목: true

최종 판정: ✅ PASS
```

---

## §6 빌드·회귀

| 항목 | 결과 |
|------|------|
| Vite build | ✅ 698 modules |
| Jest | ✅ 639/640 (R20 PRE-EXISTING) |
| Puppeteer Zone 7 | ✅ 4/4 마커 + 2/2 offMap 목록 + 0 거문도·백도 마커 |

---

## §7 Inventory 재계산

| 항목 | 수량 | 비고 |
|------|------|------|
| 기존 Inventory | 50 | SHA a764956 기준 |
| 신규 등록 | 0 | 금오도·개도 기존 등록 장소 markerPos 추가 |
| **최신 Inventory** | **50** | 변동 없음 |
| SOURCE_SAVED (markerPos 존재) | **37** | 35 + 금오도 + 개도 |
| PLACEMENT_PENDING (markerPos 없음) | 2 | ungcheon_park + gosodong_mural |
| offMap (목록 표시만) | 2 | geomundo_island + baekdo_island |

---

## §8 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| Zone 1·2·3·4·5·6 좌표 변경 | ❌ 없음 |
| 물리 삭제 | ❌ 없음 |
| SOUL 게이팅 변경 | ❌ 없음 |
| DB/Schema 변경 | ❌ 없음 |
| VERIFIED 자동 승격 | ❌ 없음 |
| 추측 좌표 적용 | ❌ 없음 |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| Zone 5 장도·웅천친수공원 결정 | ✅ 보호 |

---

## §9 SOURCE_SAVED vs FOUNDER_VISUAL_ACCEPTED 구분

| 상태 | 의미 |
|------|------|
| SOURCE_SAVED | yeosuMapData.js에 markerPos 저장됨 (QA 표시 가능) |
| FOUNDER_VISUAL_ACCEPTED | Founder가 실제 화면에서 위치 정확성 승인 |

Zone 7 4곳: **SOURCE_SAVED ✅ / FOUNDER_VISUAL_ACCEPTED ⏳** (Founder 화면 확인 대기)
