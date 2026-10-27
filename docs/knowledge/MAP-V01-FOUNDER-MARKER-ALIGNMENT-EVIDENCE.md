# MAP V0.1 Founder Marker Alignment — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_FOUNDER_MARKER_ALIGNMENT_READY  
**SHA**: (이 커밋 이후 갱신)  
**Source Files**: `docs/knowledge/marker-oldtown-founder.png.jpg`, `docs/knowledge/marker-zone2-founder.png.jpg`

---

## §1 이미지 확인

| 파일 | 내용 | 기준 지도 |
|------|------|-----------|
| `marker-oldtown-founder.png.jpg` | Zone 1 원도심 해안권 빨간 점 5개 + 파란 손글씨 | `yeosu-oldtown-v01.png` (동일 구도 확인) |
| `marker-zone2-founder.png.jpg` | Zone 2 오동도·엑스포권 빨간 점 4개 + 파란 손글씨 | `yeosu-oldtown-v01.png` (동일 구도 확인) |

두 Founder 표시 이미지의 배경이 UI에서 사용하는 `yeosu-oldtown-v01.png`와 동일한 지도임을 시각 확인.
→ Founder 표시 좌표 = oldtown markerPos 좌표로 직접 사용 가능.

---

## §2 장소별 좌표 비교표

| place_id | 현재 x | 현재 y | Founder 표시 x | Founder 표시 y | 출처 | 판정 |
|----------|--------|--------|----------------|----------------|------|------|
| lee_soon_shin_plaza | 0.30 | 0.51 | **0.255** | **0.540** | marker-oldtown | ✅ UPDATE |
| marine_park | 0.53 | 0.47 | **0.410** | **0.603** | marker-oldtown | ✅ UPDATE |
| romantic_pojangmacha | 0.38 | 0.61 | **0.445** | **0.626** | marker-oldtown | ✅ UPDATE |
| hamel_lighthouse | 0.50 | 0.68 | — | — | marker-oldtown | ⚠️ AMBIGUOUS |
| odongdo | 0.87 | 0.28 | **0.853** | **0.340** | marker-zone2 | ✅ UPDATE |
| jaisan_park | 0.65 | 0.48 | **0.582** | **0.495** | marker-zone2 | ✅ UPDATE |
| cablecar | 0.69 | 0.57 | — | — | marker-zone2 | ⚠️ AMBIGUOUS |

---

## §3 AMBIGUOUS 상세

### 하멜등대 (hamel_lighthouse)
- `marker-oldtown-founder.png.jpg` 에서 "낭만포차 → 하멜등대" 화살표 텍스트만 존재.
- 빨간 점 없음 — 좌표 확정 불가.
- 기존 좌표 `x=0.50, y=0.68` 유지. Founder 재확인 필요.

### 케이블카 (cablecar)
- `marker-zone2-founder.png.jpg` 에서 상단 항만 지역에 빨간 점이 존재하고 "케이블카도달" 텍스트가 있음.
- 그러나 텍스트와 점 간의 1:1 대응이 명확하지 않음 (상단에 점 2개, 텍스트 여러 개).
- 기존 좌표 `x=0.69, y=0.57` 유지. Founder 재확인 필요.

---

## §4 업데이트된 파일

| 파일 | 변경 내용 |
|------|---------|
| `dreamtown-frontend/src/constants/yeosuMapData.js` | YEOSU_PLACES 5개 markerPos.oldtown + QA_OLDTOWN_POSITIONS 업데이트 |

---

## §5 검증

| 항목 | 결과 |
|------|------|
| 빌드 | ✅ 698 modules |
| 테스트 | ✅ 639/640 PASS (R20 PRE-EXISTING 유지) |
| Inventory (42개) | ✅ 변경 없음 |
| TG_READY (12개) | ✅ 변경 없음 |
| 7개 권역 | ✅ 변경 없음 |
| 토글 로직 | ✅ 변경 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| 모든 수정 좌표 | ✅ PROVISIONAL 유지 |

---

## §6 Founder 재확인 필요 항목

1. **하멜등대**: 실제 빨간 점 위치 — 화살표만 표시됨
2. **케이블카**: 상단 항만 지역 점이 케이블카 자산탑승장인지 확인
