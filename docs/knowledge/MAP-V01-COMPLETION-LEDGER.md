# MAP V0.1 Completion Ledger

**Date**: 2026-10-27  
**Status**: MAP_V01_COMPLETION_LEDGER_READY  
**Authority**: Founder Decision — 확인된 항목 반복 검증 금지

---

## §1 Founder Confirmed (재개발·재검증 금지)

| 기능 | 근거 | SHA |
|------|------|-----|
| 마커 드래그 이동 | Founder 브라우저 직접 확인 | `431a2eb` |
| 기존 장소 선택·해제 토글 | Founder 직접 확인 | `431a2eb` |
| Zone 1·2 공용 상세지도(oldtown) 표시 | Founder 직접 확인 | `26afeac` |
| 9개 장소 위치 지정 목록 표시 | Founder 직접 확인 | `26afeac` |
| 후보 마커 및 x/y 좌표 표시 | Founder 직접 확인 | `431a2eb` |

---

## §2 마커 좌표 코드 반영 현황

모든 후보 좌표는 yeosuMapData.js에 이미 반영됨. 유실 없음.

| 장소 | code | 현재 좌표 (x, y) | 반영 근거 | 상태 |
|------|------|-----------------|----------|------|
| 이순신광장 | lee_soon_shin_plaza | (0.255, 0.540) | 기존값 유지 (흰 원 — 픽셀 추출 불가) | PROVISIONAL, **재확인 필요** |
| 낭만포차거리 | romantic_pojangmacha | (0.593, 0.599) | 픽셀 추출 "낭만포다" 라벨 | PROVISIONAL ✓ |
| 하멜등대 | hamel_lighthouse | (0.519, 0.718) | 픽셀 추출 "하멜등다" 라벨 | PROVISIONAL ✓ |
| 종포해양공원 | marine_park | (0.387, 0.509) | 픽셀 추출 "종해양공원" 라벨 근처 | PROVISIONAL ✓ |
| 오동도 | odongdo | (0.853, 0.340) | Founder 이미지 anchor | PROVISIONAL ✓ |
| 케이블카 | cablecar | (0.69, 0.57) | 기존값 | PROVISIONAL, **AMBIGUOUS 미해소** |
| 자산공원 | jaisan_park | (0.582, 0.495) | Founder 이미지 시각 추정 | PROVISIONAL, **재확인 필요** |
| 엑스포공원 | yeosu_expo_park | 없음 | — | **Founder 지정 필요** |
| 스카이타워 | sky_tower | 없음 | — | **Founder 지정 필요** |
| 낭만요트 | nangman_yacht | 없음 | — | **Founder 지정 필요** |
| 블루요트 | blue_yacht | 없음 | — | **Founder 지정 필요** |

---

## §3 추가 요청 6개 장소 — Inventory 반영 현황

| 장소 | code | Inventory | zone | status | 중복 |
|------|------|-----------|------|--------|------|
| 오포대 | opodae | ✅ 기등록 | 1 | explorer | 없음 |
| 진남관 | jinamgwan | ✅ 기등록 | 1 | explorer | 없음 |
| 아쿠아플라넷 | aquaplanet | ✅ 기등록 | 2 | explorer | 없음 |
| 빅오쇼 | — | ❌ **미등록** | — | — | — |
| 낭만요트 | nangman_yacht | ✅ 금번 추가 | 2 | explorer | 없음 |
| 블루요트 | blue_yacht | ✅ 금번 추가 | 2 | explorer | 없음 |

> **빅오쇼**: Inventory 미등록. 엑스포공원 내 야외 공연시설로 추정. Founder Decision 없음 → 임의 추가 금지. Founder가 등록 여부 결정 필요.

---

## §4 기능별 Completion 상태표

### Confirmed (완료, 재검증 불필요)

| 기능 | SHA | 비고 |
|------|-----|------|
| Zone 1·2 공용 oldtown 지도 표시 | `26afeac` | hasDetailMap 구조 |
| 9개 장소 위치 지정 목록 | `26afeac` | Zone 1·2 구분 레이블 |
| 후보 마커 드래그 이동 | `431a2eb` | Pointer Events + capture |
| 미세 조정 버튼 ±0.001 | `431a2eb` | ←→↑↓ |
| ✕ 재설정 버튼 | `431a2eb` | candidates 삭제 |
| 기존 장소 선택·해제 토글 | `431a2eb` | placementMode 시 차단 |
| 편집 모드 화면 단순화 | `40567f9` | 테스트 사각형·경계선·기존 마커 숨김 |
| 저장 상태 4단계 표시 | `40567f9` | 미지정→후보→내보내기→코드반영 |
| 낭만요트·블루요트 Inventory 등록 | `081f57e` | Zone 2 EXPLORER |

### Open (미완료, 우선순위 순)

| 기능 | 상태 | 완료 조건 |
|------|------|----------|
| E2E 7단계 브라우저 검증 (자산공원) | OPEN | Founder 직접 수행 후 PASS 보고 |
| 이순신광장 마커 좌표 | OPEN | Founder 드래그 편집기로 위치 지정 |
| 케이블카 AMBIGUOUS | OPEN | Founder 정확한 위치 확인 |
| 엑스포공원 마커 | OPEN | Founder 드래그 편집기로 위치 지정 |
| 스카이타워 마커 | OPEN | Founder 드래그 편집기로 위치 지정 |
| 자산공원 재확인 | OPEN | Founder 추정치 승인 또는 재지정 |
| 낭만요트 마커 | OPEN | Founder 드래그 편집기로 위치 지정 |
| 블루요트 마커 | OPEN | Founder 드래그 편집기로 위치 지정 |
| 빅오쇼 Inventory 등록 | OPEN | Founder Decision 필요 |

### Deferred (보류, 우선순위 낮음)

| 기능 | 이유 |
|------|------|
| 권역 경계선 PROVISIONAL → VERIFIED | Founder 상세 검수 후 |
| QA_OLDTOWN_POSITIONS 정밀화 | 마커 좌표 확정 후 일괄 처리 |
| 9곳 외 추가 장소 마커 | 현재 범위 외 |
| 오포대·진남관·아쿠아플라넷 마커 | Inventory 등록만 완료, 마커 미지정 |

---

## §5 남은 작업 우선순위

### 즉시 (Founder 브라우저 직접)
1. **E2E 7단계 완료** — 자산공원 드래그 → 좌표 내보내기 → 편집 종료 후 토글 확인
2. **마커 위치 지정** — 이순신광장·케이블카·엑스포공원·스카이타워·자산공원(재확인)·낭만요트·블루요트
3. 좌표 내보내기 후 코드야에게 전달

### 코드야 처리 (Founder 좌표 전달 후)
4. yeosuMapData.js markerPos 반영
5. 빅오쇼 Founder Decision 대기 → 결정 시 Inventory 추가

### Deferred (현재 범위 외)
6. 경계선 VERIFIED 승격 (별도 세션)
7. 추가 장소 마커 (Phase 2)

---

## §6 유탑마리나호텔 기준점 (Founder Decision 유지)

낭만요트: 정문 오른편 선착장 / 블루요트: 정문 왼편 선착장  
기준점: 여수시 오동도로 61-15 (두 업체 공유)  
좌표: 미지정 — Founder 드래그 편집기로 지정 예정

---

## §7 Inventory 현황 (2026-10-27 기준)

| 항목 | 수량 |
|------|------|
| 총 Inventory | 44 |
| TG_READY | 12 |
| EXPLORER | 18 |
| VERIFY | 10 |
| FERRY | 3 |
| TG_EXCLUDED (hidden) | 1 |
| 7개 권역 | 유지 |

---

## §8 연결 문서

| 문서 | 역할 |
|------|------|
| `MAP-V01-DRAGGABLE-MARKER-EDITOR-EVIDENCE.md` | 드래그 구현 SHA `431a2eb` |
| `MAP-V01-PLACEMENT-UX-FIX-EVIDENCE.md` | 9개 목록 SHA `26afeac` |
| `MAP-V01-MARKER-EDITOR-E2E-EVIDENCE.md` | 편집 단순화 SHA `40567f9` |
| `MAP-V01-YACHT-BOARDING-LOCATIONS-EVIDENCE.md` | 요트 등록 SHA `081f57e` |
| `MAP-V01-FOUNDER-MARKER-ALIGNMENT-EVIDENCE.md` | 픽셀 추출 결과 |
| `DREAMTOWN_STATUS.md §★` | Current Next Action |
