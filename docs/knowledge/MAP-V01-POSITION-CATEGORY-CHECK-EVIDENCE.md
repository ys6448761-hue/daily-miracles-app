# MAP V0.1 Position & Category Check — Evidence

**Date**: 2026-10-27  
**Status**: MAP_V01_COORDINATE_PERSISTENCE_HOLD  
**Trigger**: Founder QA — 이순신광장·하멜등대 위치 오류 / 케이블카 미표시 보고

---

## §1 케이블카 표시 조건 분석

### 코드 경로

```
Zone 1 화면 진입
  → zone.hasDetailMap = true
  → getMarkersForImage('oldtown') : cablecar.markerPos.oldtown.confidence='HIGH' → 포함됨
  → markers.filter(m => (m.zone===1 || m.zone===2)) : cablecar(zone=2) → 통과
  → QA Preview: isVerified=false지만 isQAPreview=true → 표시됨
  → placementMode=false: return null 조건 미발동 → 표시됨

Zone 1 하단 장소 목록
  → getPlacesByZone(1) : zone===1만 반환
  → cablecar(zone=2) → 제외됨 ← 정상 동작
```

### 판정

| 화면 | 케이블카 표시 | 이유 |
|------|------------|------|
| Zone 1 QA 지도 이미지 | ✅ 표시됨 | hasDetailMap=true → zone 1·2 모두 표시 |
| Zone 1 하단 장소 목록 | ❌ 없음 | `getPlacesByZone(1)` → zone=1만 반환 — **정상** |
| Zone 2 하단 장소 목록 | ✅ 있음 | `getPlacesByZone(2)` → TG_READY 케이블카 포함 |
| QA 편집 목록 (Zone 1·2 통합) | ✅ 있음 | PLACEMENT_TARGETS cablecar Zone 2 포함 |

**결론**: 케이블카 Zone 2 소속 유지. 원도심(Zone 1) 하단 목록에 없는 것은 정상 동작. 코드 변경 없음.

> Founder 안내: 케이블카를 하단 목록에서 선택하려면 Zone 2(오동도·엑스포권)로 이동하세요.

---

## §2 이순신광장·하멜등대 좌표 대조

### 현재 코드 값

| place_id | code | x | y | 출처 |
|----------|------|---|---|------|
| 이순신광장 | lee_soon_shin_plaza | 0.255 | 0.540 | 기존값 (흰 원 표시 — 픽셀 추출 불가) |
| 하멜등대 | hamel_lighthouse | 0.519 | 0.718 | 픽셀 추출 "하멜등다" 라벨 → px(812,722)/1564,1006 |

### Founder 후보 좌표

**미수신** — Founder가 드래그 편집기에서 수정 완료 선언했으나 "전체 좌표 내보내기" 결과가 코드야에게 전달되지 않음.

### 미반영 원인

브라우저 React state(`candidates`)에만 존재. 파일·Evidence에 없음.  
서버 재시작 또는 새로고침 시 유실됨.  
코드야가 접근 불가 — 임의 재구성 금지.

### 해제 조건

Founder가 브라우저에서 "전체 좌표 내보내기" → 클립보드 값 전달.  
최소한 이순신광장·하멜등대 수정 좌표만이라도 전달 시 즉시 반영 가능.

---

## §3 HOLD 상태

| 항목 | 상태 | 해제 방법 |
|------|------|----------|
| 이순신광장 좌표 반영 | **HOLD** | Founder 좌표 전달 |
| 하멜등대 좌표 반영 | **HOLD** | Founder 좌표 전달 |
| 케이블카 Zone 변경 | ❌ 불필요 | Zone 2 유지가 정상 |

---

## §4 안전 조건

| 항목 | 상태 |
|------|------|
| 케이블카 Zone 2 유지 | ✅ 변경 없음 |
| Inventory 45개 / TG_READY 12개 / 7개 권역 | ✅ 변경 없음 |
| 추측 좌표 수정 없음 | ✅ |
| VERIFIED 자동 승격 없음 | ✅ |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |
