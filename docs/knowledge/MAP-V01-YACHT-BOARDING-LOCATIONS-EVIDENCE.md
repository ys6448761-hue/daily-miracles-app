# MAP V0.1 Yacht Boarding Locations — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_YACHT_BOARDING_LOCATIONS_RECONCILED  
**Authorization**: Founder Decision — 낭만요트·블루요트 탑승 기준 위치 = 유탑마리나호텔 앞

---

## §1 Founder Evidence

| 업체 | 주소 | 선착장 위치 |
|------|------|------------|
| 여수낭만바다요트 | 여수시 수정동 774-4 | 유탑마리나호텔 정문 오른편 선착장 |
| 블루요트 | 유탑마리나호텔 기준 | 정문 왼편 전용 선착장 |
| 유탑마리나호텔 | 여수시 오동도로 61-15 | 두 업체의 공통 기준점 |

---

## §2 기존 Inventory 조사

**낭만요트·블루요트**: 기존 42개 Inventory에 미존재 → NEW 분류

| 검토한 기존 항목 | 관계 |
|----------------|------|
| `yeosu_ocean_cruise` (Zone 2 EXPLORER) | 별개 업체 — 중복 아님 |
| `soho_yacht` (Zone 5 VERIFY) | 소호요트장 — 별개 장소 |

---

## §3 추가 내용

### yeosuMapData.js — YEOSU_PLACES 신규 2개

```javascript
{ code: 'nangman_yacht', name_ko: '낭만요트', zone: 2, lat: null, lng: null,
  status: 'explorer', coordVerified: false,
  coordNote: '탑승 위치: 유탑마리나호텔 정문 오른편 선착장(여수시 오동도로 61-15). 좌표·마커 미검증.' },
{ code: 'blue_yacht',   name_ko: '블루요트', zone: 2, lat: null, lng: null,
  status: 'explorer', coordVerified: false,
  coordNote: '탑승 위치: 유탑마리나호텔 정문 왼편 전용 선착장(여수시 오동도로 61-15). 좌표·마커 미검증.' },
```

### YeosuMapSelector.jsx — PLACEMENT_TARGETS Zone 2 추가

```javascript
{ code: 'nangman_yacht', name_ko: '낭만요트', zone: 2 },
{ code: 'blue_yacht',   name_ko: '블루요트', zone: 2 },
```

---

## §4 안전 조건

| 항목 | 상태 |
|------|------|
| EXPLORER 기본값 — SOUL 자동 편입 없음 | ✅ |
| 마커 좌표 임의 입력 없음 — markerPos 없음 | ✅ |
| lat/lng null 유지 | ✅ |
| 운항 일정·예약 확인 안 함 | ✅ |
| 기존 항목 변경 없음 | ✅ |
| SOUL 게이팅·API·DB 불변 | ✅ |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
| PR #134 merge / Production 배포 | ✅ 금지 |

---

## §5 최종 Inventory 현황

| 항목 | 수량 |
|------|------|
| 기존 Inventory | 42 |
| 신규 추가 | 2 (낭만요트, 블루요트) |
| **최종 합계** | **44** |
| 중복 | 없음 |
| TG_READY (변경 없음) | 12 |
| 7개 권역 (변경 없음) | 7 |

---

## §6 검증

| 항목 | 결과 |
|------|------|
| 빌드 | ✅ |
| 테스트 | ✅ 639/640 PASS (R20 PRE-EXISTING) |
| 중복 검증 | ✅ 없음 |

---

## §7 마커 위치 지정 절차 (Founder 직접)

낭만요트·블루요트는 oldtown 지도 이미지에서 실제 일러스트상 선착장 위치를 확인한 후 드래그 편집기로 지정 필요.

1. `localhost:5000/muyojeong?qa_preview=boundary`
2. Zone 2 진입 → 마커 위치 지정 모드 시작
3. Zone 2 섹션 → **낭만요트** 선택 → 지도에서 위치 지정
4. **블루요트** 선택 → 위치 지정
5. 두 마커 모두 유탑마리나호텔 인근(오동도 방향 해안)에 배치
6. "전체 좌표 내보내기" → 코드야에게 전달
