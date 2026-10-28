# MAP V0.1 — Visual Closeout Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_VISUAL_CLOSEOUT_READY  
**SHA**: (pending)  
**Classification**: 화면 증거 확보 (기능 변경 없음)

---

## §1 검증 범위

| 항목 | 확인 방법 |
|------|-----------|
| Zone 1 일반 지도 마커 6개 | puppeteer QA Preview 스크린샷 |
| Zone 2 일반 지도 마커 9개 | puppeteer QA Preview 스크린샷 |
| 권역 간 마커 혼입 | 좌표 소스 대조 (19/19 PASS) |
| Zone 2 일반뷰 vs QA편집 drift | 좌표 수식 동일성 + 소스=렌더 100% 일치 |

---

## §2 Zone 1 — 원도심 해안권

**스크린샷**: `visual-closeout-2026-10-29/zone1-normal.png`

| place | left% | top% |
|-------|-------|------|
| 이순신광장 | 40.1% | 54.9% |
| 낭만포차거리 | 61.3% | 64.0% |
| 하멜등대 | 56.4% | 63.4% |
| 진남관 | 39.1% | 47.4% |
| 오포대 | 47.6% | 54.9% |
| 종포해양공원 | 47.4% | 60.1% |

**판정**: ✅ 6개 — Zone 1 전용, Zone 2 마커 혼입 없음

---

## §3 Zone 2 — 오동도·엑스포권

**스크린샷**: `visual-closeout-2026-10-29/zone2-normal.png`

| place | left% | top% |
|-------|-------|------|
| 오동도 | 85.3% | 39.2% |
| 케이블카 | 66.0% | 54.4% |
| 엑스포공원 | 55.8% | 21.1% |
| 스카이타워 | 60.4% | 13.7% |
| 자산공원 | 58.1% | 53.7% |
| 아쿠아플라넷 | 58.6% | 32.6% |
| 낭만요트 | 65.7% | 43.0% |
| 블루요트 | 62.7% | 41.4% |
| 빅오쇼 | 54.9% | 28.5% |

**판정**: ✅ 9개 — Zone 2 전용, Zone 1 마커 혼입 없음

---

## §4 Zone 2 Drift 비교 (일반뷰 vs QA편집)

**스크린샷**: `visual-closeout-2026-10-29/zone2-qa-editor.png`

QA 편집기(위치 지정 모드)에서는 기존 PROVISIONAL 마커가 숨겨지므로(설계상 의도된 동작) 직접 오버레이 비교는 불가. 대신 좌표 수식 동일성으로 drift 없음을 확인:

| 항목 | Zone 1 | Zone 2 |
|------|--------|--------|
| 이미지 | `yeosu-oldtown-v01.png` | `yeosu-oldtown-v01.png` (동일) |
| paddingTop | `64.32%` | `64.32%` (동일) |
| objectFit | `fill` | `fill` (동일) |
| 마커 수식 | `left: x*100%, top: y*100%` | 동일 |

**소스=렌더 좌표 대조** (MAP_V01_ZONE_SEPARATION_VERIFIED §4): Zone 2 전 9곳 Δ < 0.003 — **일치**

**불일치: 0건**

---

## §5 시각 화면 확인

**Zone 1**: 지도 좌측·중앙(원도심 해안) 영역에 마커 6개 표시 — 항만·시가지 구역 분포 자연스러움.

**Zone 2**: 지도 우측(오동도 반도·엑스포 부지) 영역에 마커 9개 표시 — 스카이타워·엑스포공원이 상단, 케이블카·낭만요트·블루요트·오동도가 중하단에 표시.

**Zone 2 QA 편집기**: 위치 지정 모드 정상 진입. Zone 1/Zone 2 타겟 버튼 15개 모두 표시.

---

## §6 안전 조건

| 항목 | 상태 |
|------|------|
| 기능 변경 | ✅ 없음 — 화면 증거 확보만 |
| PROVISIONAL 유지 | ✅ 15곳 전체 |
| VERIFIED 자동 승격 | ✅ 없음 |
| Inventory 45 / TG_READY 12 / 7권역 | ✅ 유지 |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §7 Founder 다음 액션

| 항목 | 액션 |
|------|------|
| Zone 1 마커 위치 확인 | zone1-normal.png 및 `/muyojeong?qa_preview=boundary` Zone 1 진입 |
| Zone 2 마커 위치 확인 | zone2-normal.png 및 Zone 2 진입 |
| VERIFIED 승격 | 위치 확인 후 코드야에게 승격할 장소 목록 전달 |
