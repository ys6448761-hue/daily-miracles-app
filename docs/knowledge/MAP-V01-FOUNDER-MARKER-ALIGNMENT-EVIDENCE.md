# MAP V0.1 Founder Marker Alignment — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_PAINT_MARKER_ALIGNMENT_READY  
**Authorization**: MAP_V01_FINAL_MARKER_ALIGNMENT_AUTHORIZED (Founder)

---

## §1 이미지 확인

| 파일 | 해상도 | 내용 | 기준 지도 |
|------|--------|------|-----------|
| `marker-oldtown-founder.png` | 1564×1006 | 빨간 점 (TG_READY) + 노란 점 (돌산 Zone 3) + 텍스트 라벨 | `yeosu-oldtown-v01.png` — **동일 해상도 = 직접 픽셀 변환 가능** |
| `marker-zone2-founder.png` | 1206×1304 | 녹색 점 (소호/장도 지역) | `yeosu-overview-v01.png` — Zone 5~7 장소. oldtown markerPos와 좌표계 다름. |

→ `marker-oldtown-founder.png` 픽셀 좌표를 oldtown markerPos에 직접 사용 가능 (동일 해상도 확인).

---

## §2 픽셀 추출 결과 (Python Pillow, 2026-10-27)

### 빨간 마커 클러스터 (R>180, G<90, B<90)

| 픽셀 중심 | cnt | norm x | norm y | 라벨 | 매핑 결과 |
|-----------|-----|--------|--------|------|-----------|
| px(485,525) | 636 | 0.310 | 0.522 | — | 미확정 (흰 원 근처) |
| px(605,512) | 803 | 0.387 | 0.509 | "종해양공원" 근처 | ✅ marine_park |
| px(724,518) | 1791 | 0.463 | 0.515 | "오포다" 근처 | PLACEMENT_TARGETS 외 (오포대, explorer) |
| px(812,722) | 335 | 0.519 | 0.718 | "하멜등다" 라벨 | ✅ hamel_lighthouse |
| px(928,603) | 1138 | 0.593 | 0.599 | "낭만포다" 라벨 | ✅ romantic_pojangmacha |

작은 클러스터 (cnt<100): 텍스트 픽셀 또는 노이즈 — 제외.  
cnt>500 하단 클러스터 (px(476,750), px(720,850)): PLACEMENT_TARGETS 외 장소 — 제외.

### 노란 마커 클러스터 (R>180, G>170, B<80) — 참고

| 픽셀 중심 | cnt | norm x | norm y | 라벨 | 매핑 결과 |
|-----------|-----|--------|--------|------|-----------|
| px(465,739) | 790 | 0.297 | 0.735 | "돌산대교" | dolsan_bridge (Zone 3) |
| px(718,773) | 2242 | 0.459 | 0.768 | "돌산공원" | dolsan_park (Zone 3) |
| px(973,524) | 1494 | 0.622 | 0.521 | "해상케이블카" | cablecar 참고용 |

---

## §3 이순신광장 특이사항

이미지에서 이순신광장은 **흰 원(白圓)** 으로 표시되어 있음. 빨간 픽셀 필터에 검출되지 않음.  
흰 원 추정 위치: x≈0.25, y≈0.47 (시각 추정).  
현재 좌표 x=0.255, y=0.540 유지. **Founder 재확인 필요.**

---

## §4 장소별 좌표 비교표

| place_id | 이전 x | 이전 y | 새 x | 새 y | 출처 | 판정 |
|----------|--------|--------|------|------|------|------|
| lee_soon_shin_plaza | 0.255 | 0.540 | 0.255 | 0.540 | — | ⚠️ 흰 원, 재확인 필요 |
| marine_park | 0.410 | 0.603 | **0.387** | **0.509** | px(605,512) "종해양공원" | ✅ UPDATE |
| romantic_pojangmacha | 0.445 | 0.626 | **0.593** | **0.599** | px(928,603) "낭만포다" | ✅ UPDATE |
| hamel_lighthouse | 0.50 | 0.68 | **0.519** | **0.718** | px(812,722) "하멜등다" | ✅ UPDATE (AMBIGUOUS 해소) |
| jaisan_park | 0.582 | 0.495 | 0.582 | 0.495 | — | 변경 없음 (마커 없음) |
| odongdo | 0.853 | 0.340 | 0.853 | 0.340 | — | 변경 없음 (overview 기준) |
| cablecar | 0.69 | 0.57 | 0.69 | 0.57 | — | AMBIGUOUS 유지 |

---

## §5 업데이트된 파일

| 파일 | 변경 내용 |
|------|---------|
| `dreamtown-frontend/src/constants/yeosuMapData.js` | YEOSU_PLACES 3개 markerPos.oldtown + QA_OLDTOWN_POSITIONS 3개 업데이트 |

---

## §6 검증

| 항목 | 결과 |
|------|------|
| 빌드 | ✅ 698 modules |
| 테스트 | ✅ 639/640 PASS (R20 PRE-EXISTING 유지, 신규 실패 없음) |
| Inventory (42개) | ✅ 변경 없음 |
| TG_READY (12개) | ✅ 변경 없음 |
| 7개 권역 | ✅ 변경 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| 모든 수정 좌표 | ✅ PROVISIONAL 유지 |

---

## §7 Founder 재확인 필요 항목

1. **이순신광장**: 이미지에서 흰 원으로 표시 — 빨간 픽셀 추출 불가. 흰 원 위치 확인 후 좌표 업데이트 필요.
2. **케이블카**: 이미지 노란 점(해상케이블카)이 x=0.622, y=0.521 — oldtown 자산탑승장 위치인지 확인 필요.
3. **자산공원**: 이미지에서 마커 없음 — Founder가 별도 마커를 제공하지 않음. 현재 x=0.582, y=0.495 유지.
