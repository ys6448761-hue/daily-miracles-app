# MAP V0.1 — All-Zone Marker Editor Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ALL_ZONE_MARKER_EDITOR_READY  
**SHA**: `027b4c5`  
**Classification**: EXTEND — QA 편집기 Zone 3~7 확장 + Inventory 전체 연결

---

## §1 변경 요약

| 항목 | 이전 상태 | 이후 상태 |
|------|-----------|-----------|
| PLACEMENT_TARGETS | 하드코딩 15곳 (Zone 1·2만) | YEOSU_PLACES 전체 동적 (Zone 1~7) |
| Zone 3~7 QA 편집기 | 없음 | 전체 QA 편집기 + 풀너비 지도 |
| overview 마커 렌더링 | 없음 | `markerPos.overview` 기반 표시 |
| overview 초안 저장 | 없음 | `DRAFT_KEY_OVERVIEW` localStorage 분리 |
| 지도 확대 | 없음 | `🔍 2× 확대` 토글 (QA 위치 지정 모드) |
| 좌표 내보내기 imageKey | `oldtown` 하드코딩 | `imageKey` 동적 (`oldtown` / `overview`) |
| Zone heading 루프 | `[1, 2].map(zn =>` | `[...new Set(zoneTargets...)].sort().map` |

---

## §2 Zone별 QA 편집 대상 수 (Inventory 기반)

| Zone | 이미지 | QA 편집 대상 수 | 주요 장소 |
|------|--------|-----------------|-----------|
| Zone 1 (원도심 해안권) | oldtown | 8 | 이순신광장·낭만포차·하멜등대·진남관·오포대·종포해양공원·고소동벽화·수산시장 |
| Zone 2 (오동도·엑스포권) | oldtown | 13 | 오동도·케이블카·엑스포공원·스카이타워·자산공원·아쿠아플라넷·엑스포역·바닷길·만성리·오션크루즈·낭만요트·블루요트·빅오쇼 |
| Zone 1+2 합산 (oldtown 공유) | oldtown | **21** | 한 화면에서 Zone 1+2 연속 편집 가능 |
| Zone 3 (돌산권) | overview | 8 | 돌산대교·돌산공원·무슬목·갓장터마을·돌산탑승장·북한반잠수정·봉황산·예술랜드 |
| Zone 4 (향일암권) | overview | 1 | 향일암 |
| Zone 5 (소호·장도권) | overview | 6 | 장도·소호요트·소호동동다리·이순신마리나·서틀러다육·유월드루지 |
| Zone 6 (화양·여자만권) | overview | 5 | 가사리·여자만·섬달천·화양드라이브·장척갯벌 |
| Zone 7 (섬섬길) | overview | 3 | 사도·하화도·화정도서 |

---

## §3 미등록 장소 (OPEN)

| 장소명 | 상태 | 비고 |
|--------|------|------|
| 미남크루즈 | OPEN (미등록) | Inventory 없음 — 추가 시 Founder 결정 필요 |
| 이사부크루즈 | OPEN (미등록) | Inventory 없음 — 추가 시 Founder 결정 필요 |

---

## §4 주요 코드 변경 (YeosuMapSelector.jsx)

| 변경 항목 | 상세 |
|-----------|------|
| `PLACEMENT_TARGETS` 제거 | 하드코딩 15곳 배열 제거 |
| `DRAFT_KEY_OVERVIEW` 추가 | `'yeosu_map_draft_v02_overview'` |
| `mapZoomed` state | 2× 확대 토글 |
| `imageKey` | `zone.hasDetailMap ? 'oldtown' : 'overview'` |
| `draftKey` | imageKey별 localStorage 키 분리 |
| `zoneTargets` | `YEOSU_PLACES.filter(...)` 동적 목록 |
| `copyAllCandidates` | `imageKey` 동적 사용 |
| `codedPos` | `markerPos?.[imageKey]` |
| Zone heading loop | `[...new Set(...)].sort().map(zn =>` |
| Zone 3~7 QA 편집기 | 풀너비 overview 이미지 + 전체 QA UI |
| Zoom wrapper | `overflowX: 'auto'`, `width: '200%'` 토글 |

---

## §5 검증

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 698 modules |
| Jest 회귀 | ✅ 639/640 PASS (R20 PRE-EXISTING) |
| Zone 1·2 좌표 15곳 불변 | ✅ |
| PROVISIONAL 유지 | ✅ |
| VERIFIED 자동 승격 | ✅ 없음 |
| SOUL 게이팅 (isSelectablePlace) | ✅ 변경 없음 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §6 Founder 다음 액션

1. `localhost:5000/muyojeong?qa_preview=boundary` 접속
2. Zone 3~7 진입 → 위치 지정 모드 시작
3. Inventory에서 장소 선택 → overview 지도 클릭/드래그로 위치 지정
4. 전체 좌표 내보내기 → 코드야 전달 → `markerPos.overview` 반영

미등록 장소(미남크루즈, 이사부크루즈) 추가 여부 결정 필요.
