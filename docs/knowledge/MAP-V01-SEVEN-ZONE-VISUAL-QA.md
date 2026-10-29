# MAP V0.1 — Seven Zone Visual QA Recording

**Date**: 2026-10-26  
**Status**: MAP_V01_SEVEN_ZONE_VISUAL_QA_RECORDED  
**Guardian 판정**: BOUNDARY_RENDER_VISUAL_PASS / GEOGRAPHIC_BOUNDARY_UNVERIFIED

---

## §1 Visual QA 요약

Founder가 Zone 1~7 전체 화면을 직접 확인했다.

| 항목 | 결과 |
|------|------|
| QA 배너 표시 | ✅ Zone 1·2 진입 시 주황 배너 정상 표시 |
| SVG 레이어 렌더링 | ✅ 빨간 테스트 사각형 표시 확인 → SVG 레이어 정상 |
| Zone 1 PROVISIONAL 경계 | ✅ 청록 점선 표시 확인 |
| Zone 2 PROVISIONAL 경계 | ⚠ 표시됨 — 단, 돌산 방향 침범 발견 (CORRECTION_REQUIRED) |
| Zone 3~7 overview 미리보기 | DISPLAYED — 가독성 이슈 (§3 참조) |
| 장소 마커 | ✅ 파란/주황/회색/금색 구분 표시 확인 |

---

## §2 SVG 렌더링 확인

**BOUNDARY_RENDER_VISUAL_PASS** — `import.meta.env.DEV → hostname 체크` 수정 효과 확인.

- **빨간 테스트 사각형**: 이미지 전체를 감싸는 점선 테두리 → SVG 레이어 정상 렌더링 증명
- **주의**: 빨간 사각형은 실제 여수 경계가 아님. SVG 검증용. 향후 제거 예정.
- **GEOGRAPHIC_BOUNDARY_UNVERIFIED**: Founder의 지리 좌표 검수는 미완료. 좌표 보정 필요.

---

## §3 Zone 3~7 Overview 가독성 이슈

Zone 3~7 ZoneDetail 진입 시 overview 이미지가 `height: 200px`으로 매우 작게 표시됨.

| 이슈 | 내용 |
|------|------|
| 문제 | 전체 여수 지도가 200px 높이로 縮小 → 실제 장소 위치 파악 어려움 |
| 현재 동작 | Zone 3~7: overview 미리보기(200px) + overview 위 VERIFIED boundary (현재 미표시) |
| 제안 방향 | height 조정 또는 Zone 3~7용 상세 이미지 추가 (Phase 2 검토) |
| 현재 처리 | RECORDED — 즉각 수정 대상 아님. Phase 2 backlog 등록. |

---

## §4 권역 간 장소 선택 누적 동작

**확인 결과: 의도된 설계 (INTENTIONAL)**

- `selectedPlaces`는 `routePlaces`와 동일 배열 (MuyojeongHomePage → YeosuMapSelector 공유)
- Zone 1에서 선택한 장소가 Zone 2로 이동해도 유지됨 → 여러 권역에서 코스 구성 목적
- 사용자가 여러 권역 장소를 조합해 하루 여행 코스를 만드는 흐름에 부합
- 참조: `docs/knowledge/MAP-V01-DECISION-SHEET.md` OI-MAP-1~5 승인 항목

---

## §5 Zone 2 경계 수정 필요

**FOUNDER_ZONE2_BOUNDARY_CORRECTION_REQUIRED**

Founder 확인 사항:
- 현재 SE corner (x:0.80, y:0.82)가 이미지 하단 우측(돌산 방향)으로 넘어감
- Zone 2는 오동도·엑스포 일대에 한정되어야 함
- 여수엑스포역 포함 필요
- Dolsan 침범 제거 필요

수정 작업: `MAP-V01-ZONE2-BOUNDARY-CORRECTION.md` 참조

---

## §6 다음 단계

1. Zone 2 경계 수정 (돌산 침범 제거 + 여수엑스포역 포함) → 별도 작업
2. 빨간 테스트 사각형 → Zone 2 경계 확인 후 제거
3. Zone 3~7 가독성 개선 → Phase 2 backlog
