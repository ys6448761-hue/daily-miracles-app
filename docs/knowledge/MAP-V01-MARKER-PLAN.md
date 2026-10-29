# MAP V0.1 마커 설계 문서

**Date**: 2026-10-26  
**Status**: MAP_V01_MARKER_PLAN_READY  
**Branch**: docs/pr133-state-sync

---

## §1 설계 원칙

이 문서는 설계·검증 단계의 결과물이다. 코드 구현은 별도 단계에서 수행한다.

- **좌표 방식**: 이미지 내 상대 위치 `{x: 0-1, y: 0-1}` (0,0 = 좌상단)
  - lat/lng 기반 변환 없음 — bounding box 확정 전 사용 금지 결정 (Founder 2026-10-26)
  - 시각적 랜드마크 식별 기반 수동 위치 측정
- **마커 렌더**: `position: 'absolute'` on `position: 'relative'` 이미지 컨테이너
  - `left: x * 100 + '%'`, `top: y * 100 + '%'`
- **표시 기준**: HIGH confidence만 즉시 구현. MEDIUM은 Founder 육안 확인 후 허용.
- **미검증 장소**: 마커 미표시 유지. 기존 카드 탐색으로 접근.

---

## §2 이미지별 랜드마크 시각 검증 결과

### 2-1. yeosu-oldtown-v01.png (1564 × 1006 px)

이미지 특징: 원도심 + 돌산해협 + 오동도 권역 조감도. 북서 방향 기울어진 시점.

| 식별 기준 | 장소 code | 이름 | x | y | 신뢰도 | 근거 |
|----------|----------|------|---|---|--------|------|
| 등대 + 방파제 독특한 섬 | `odongdo` | 오동도 | 0.87 | 0.28 | **HIGH** | 오동도 등대 형태 + 방파제 구조 명확 식별 |
| 대형 부두 구조체 (복수 선착장) | `yeosu_expo_park` | 엑스포공원 | 0.73 | 0.07 | MEDIUM | L자형 부두 → 엑스포 해양 부두와 일치 추정 |
| 육지↔섬 연결 교량 (하단 수도) | `dolsan_daegyo` | 돌산대교 | 0.50 | 0.80 | MEDIUM | 돌산해협 가로지르는 교량 위치 |
| 좌상단 도시 격자 전체 | 원도심 권역 | — | 0.20 | 0.35 | ZONE_REF | 개별 장소 식별 불가. 권역 참조용. |
| 하단 우측 두 번째 교량 | 미확인 | — | 0.78 | 0.82 | NONE | 소호동동다리 추정이나 확인 불가 |
| 케이블카 삭도 선 | `cablecar` | 케이블카 | — | — | NONE | 황금 호선(arc) 관찰되나 식별 불확실 |
| 이순신광장 | `lee_soon_shin_plaza` | 이순신광장 | — | — | NONE | 도시 내부 — 개별 식별 불가 |
| 하멜등대 | `hamel_lighthouse` | 하멜등대 | — | — | NONE | 항구 내부 — 개별 식별 불가 |
| 낭만포차거리 | `romantic_pojangmacha` | 낭만포차 | — | — | NONE | 도시 내부 — 개별 식별 불가 |

### 2-2. yeosu-overview-v01.png (1206 × 1304 px)

이미지 특징: 여수 전역 조감. 좌상단 = 본토·원도심, 중앙 = 돌산도, 하단 = 섬섬길 방향.

| 식별 기준 | 장소 code | 이름 | x | y | 신뢰도 | 근거 |
|----------|----------|------|---|---|--------|------|
| 우상단 등대 있는 섬 | `odongdo` | 오동도 | 0.63 | 0.19 | MEDIUM | oldtown 대비 축소 → 신뢰도 낮음 |
| 대형 부두 (우상단) | `yeosu_expo_park` | 엑스포공원 | 0.65 | 0.08 | MEDIUM | L자형 부두 형태 |
| 본토↔반도 연결 교량 | `dolsan_daegyo` | 돌산대교 | 0.43 | 0.35 | MEDIUM | 돌산해협 교량 위치 추정 |
| 하단 반도 끝부분 | `hyangiram` | 향일암 | 0.53 | 0.87 | LOW | 돌산도 남단 추정. 사찰 식별 불가. |
| 하단 소규모 섬 군집 | 섬섬길 권역 | — | 다양 | 0.75+ | ZONE_REF | 개별 섬 식별 불가. 권역 참조용. |
| 좌상단 도시 격자 | 원도심 권역 | — | 0.30 | 0.12 | ZONE_REF | 개별 장소 식별 불가 |

---

## §3 마커 구현 단계 분류

### Phase A — 즉시 구현 가능 (HIGH confidence only)

| 이미지 | 장소 | x | y | 조건 |
|--------|------|---|---|------|
| oldtown | 오동도 | 0.87 | 0.28 | — |

**주의:** 하나의 마커로도 구현 검증 가능. 위치 미세 조정은 Founder 육안 확인으로 처리.

### Phase B — Founder 육안 확인 후 허용 (MEDIUM confidence)

| 이미지 | 장소 | x (추정) | y (추정) | 확인 방법 |
|--------|------|----------|----------|----------|
| oldtown | 엑스포공원 | 0.73 | 0.07 | 이미지 상 부두 위치 Founder 체크 |
| oldtown | 돌산대교 | 0.50 | 0.80 | 이미지 상 교량 위치 Founder 체크 |
| overview | 오동도 | 0.63 | 0.19 | oldtown 기준 상대위치 일치 여부 |
| overview | 엑스포공원 | 0.65 | 0.08 | — |
| overview | 돌산대교 | 0.43 | 0.35 | — |

### Phase C — 보류 (LOW/NONE confidence)

이하 장소들은 이미지 내 위치를 시각적으로 특정할 수 없음. 기존 카드 탐색 유지.

`hyangiram` (overview LOW) / `cablecar` / `lee_soon_shin_plaza` / `hamel_lighthouse` / `romantic_pojangmacha` / `dolsan_nightscape` / `gosodong_mural` / `yeosu_fish_market` / Zone 5-7 전체

---

## §4 구현 설계 (Phase A 기준)

### 4-1. yeosuMapData.js 변경 내용 (설계)

```js
// 각 장소에 markerPos 필드 추가 (Phase A: odongdo만)
{ 
  code: 'odongdo',
  // ... 기존 필드 유지 ...
  markerPos: {
    // 이미지 내 상대 위치 (0-1). 시각 검증 기준. Founder 확인 후 조정 가능.
    oldtown: { x: 0.87, y: 0.28, confidence: 'HIGH' },
    overview: { x: 0.63, y: 0.19, confidence: 'MEDIUM' },  // Phase B 대기
  }
}
```

### 4-2. YeosuMapSelector.jsx 변경 내용 (설계)

```jsx
// 이미지 컨테이너를 position: 'relative'로 변경
// 마커 레이어를 이미지 위에 position: 'absolute'로 오버레이

function MapImageWithMarkers({ src, alt, markers, maxHeight, objectPosition }) {
  const [imgError, setImgError] = useState(false);
  if (imgError) return null;
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img
        src={src}
        alt={alt}
        onError={() => setImgError(true)}
        style={{ width: '100%', maxHeight, objectFit: 'cover', objectPosition, borderRadius: '10px', display: 'block' }}
      />
      {/* 마커 레이어 — TG_READY이며 markerPos.confidence=HIGH인 장소만 */}
      {markers.map(m => (
        <div
          key={m.code}
          title={m.name_ko}
          style={{
            position: 'absolute',
            left: `${m.x * 100}%`,
            top: `${m.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: '10px', height: '10px',
            borderRadius: '50%',
            background: m.isSelected ? '#FFD67A' : 'rgba(255,255,255,0.85)',
            border: '2px solid rgba(0,0,0,0.25)',
            cursor: m.selectable ? 'pointer' : 'default',
          }}
          onClick={() => m.selectable && onTogglePlace({ code: m.code, name: m.name_ko })}
        />
      ))}
    </div>
  );
}
```

### 4-3. 마커 표시 규칙

- `confidence: 'HIGH'`만 즉시 표시 (Phase A)
- `isSelectablePlace(place) === true` (TG_READY)인 경우만 클릭 가능
- EXPLORER/VERIFY/FERRY 장소는 markerPos 있어도 클릭 불가 (informational only)
- TG_EXCLUDED는 markerPos 없음 (지도 미표시 유지, OI-MAP-1)

---

## §5 35개 장소 ↔ SOUL 13개 연결 상태 확인

### 5-1. 상태별 분류 (총 35개)

| 상태 | 수 | 지도 표시 | SOUL 전달 가능 |
|------|---|----------|--------------|
| TG_READY | 12 | ✅ 선택 가능 | ✅ (routePlaces 경유) |
| TG_EXCLUDED (hidden) | 1 | ❌ 미표시 | ❌ |
| EXPLORER | 5 | ✅ 표시만 | ❌ |
| VERIFY_NEEDED | 14 | ✅ 표시만 | ❌ |
| FERRY | 3 | ✅ 표시만 (배편 배지) | ❌ |

### 5-2. SOUL 지식 보유 13개 장소 vs 지도 상태

| code | 이름 | 지도 상태 | SOUL 전달 | SOUL 지식 |
|------|------|----------|----------|----------|
| hyangiram | 향일암 | TG_READY (Zone 4) | ✅ | Phase 1 |
| dolsan_daegyo | 돌산대교 | TG_READY (Zone 3) | ✅ | Phase 1 |
| dolsan_nightscape | 돌산공원 | TG_READY (Zone 3) | ✅ | Phase 1 |
| odongdo | 오동도 | TG_READY (Zone 2) | ✅ | Phase 1 |
| cablecar | 케이블카 | TG_READY (Zone 2) | ✅ | Phase 1 |
| hamel_lighthouse | 하멜등대 | TG_READY (Zone 1) | ✅ | Phase 1 |
| lee_soon_shin_plaza | 이순신광장 | TG_READY (Zone 1) | ✅ | Phase 2 |
| romantic_pojangmacha | 낭만포차 | TG_READY (Zone 1) | ✅ | — |
| yeosu_expo_park | 엑스포공원 | TG_READY (Zone 2) | ✅ | — |
| sky_tower | 스카이타워 | TG_READY (Zone 2) | ✅ | — |
| marine_park | 종포해양공원 | TG_READY (Zone 2) | ✅ | — |
| jaisan_park | 자산공원 | TG_READY (Zone 2) | ✅ | — |
| jungang_market | 중앙시장 | TG_EXCLUDED, hidden | ❌ | — |

### 5-3. 게이팅 코드 검증

```
YeosuMapSelector.jsx → isSelectablePlace(place) → TG_READY만 <button> 렌더
  ↓ onTogglePlace({ code, name })
MuyojeongHomePage.jsx → toggleRoutePlace → routePlaces 배열 추가
  ↓ handleRouteSubmit
buildSoulMessage(routePlaces, mins) → SOUL API POST /api/dt/travel/input/text
```

**결론: 게이팅 정상 ✅** — EXPLORER/VERIFY/FERRY/TG_EXCLUDED는 routePlaces 진입 불가.

---

## §6 판정

```
MAP_V01_MARKER_PLAN_READY
```

| 항목 | 결과 |
|------|------|
| 이미지 내 랜드마크 위치 기록 | ✅ §2 완료 (HIGH 1개 / MEDIUM 5개 / NONE 다수) |
| 마커 설계 (Phase A~C 분류) | ✅ §3-4 완료 |
| 35↔SOUL13 연결 상태 | ✅ §5 완료 — 게이팅 정상 |
| 코드 변경 | ❌ 없음 (설계 단계) |
| Production 배포 | ❌ 없음 |

**다음 단계**: Phase A 마커 구현 (오동도 HIGH 1개 → Founder 위치 확인 → Phase B 확장)
