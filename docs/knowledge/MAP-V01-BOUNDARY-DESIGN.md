# MAP V0.1 — Zone Boundary 설계 검토

**Date**: 2026-10-26  
**Status**: MAP_V01_BOUNDARY_DESIGN_READY  
**요청**: 권역 선택 시 수채화 일러스트 위에 경계선 표시  
**이번 단계**: 설계·타당성 검토만. SVG 구현 및 이미지 수정 없음.

---

## §1 이미지 현황 확인

| 파일 | 해상도 | 비율(h/w) | 현재 사용 |
|------|--------|----------|---------|
| `yeosu-overview-v01.png` | 1206×1304 | **1.0813** | ZoneOverview — 전체 권역 참조 (마커 미표시) |
| `yeosu-oldtown-v01.png` | 1564×1006 | **0.6432** | ZoneDetail Zone 1 — Phase A 마커 표시 중 |

### overview 이미지 표현 범위 추정

overview(1206×1304)는 세로로 긴 정사각형에 가까운 이미지다.  
여수 수채화 일러스트로서 다음 권역의 시각 표현 가능성:

| Zone | 이름 | 표현 가능 여부 | 근거 |
|------|------|--------------|------|
| 1 | 원도심 해안권 | **HIGH** | 이순신광장·여객선터미널 중심부 — 일러스트 핵심 구역 |
| 2 | 오동도·엑스포권 | **HIGH** | 오동도 방파제·엑스포 해안 — 시각적으로 뚜렷한 랜드마크 |
| 3 | 돌산권 | **MEDIUM** | 돌산대교 연결 지형 — 대교 묘사 여부에 따라 가변 |
| 4 | 향일암권 | **LOW** | 돌산도 남단 — 일러스트 하단 경계 밖 가능성 높음 |
| 5 | 소호·장도권 | **MEDIUM** | 도심 서쪽 해안 — 일러스트 좌측 포함 여부 미확인 |
| 6 | 화양·여자만권 | **LOW** | 광양만 방향 — 이미지 범위 밖 가능성 높음 |
| 7 | 섬섬길 | **VERY LOW** | 원도 섬들 — 이미지 범위 거의 확실히 밖 |

> **핵심 제약**: overview 이미지는 수채화 일러스트로 지리 축척 비율이 불명확.  
> 실제 표현 범위는 **Founder 시각 확인**이 유일한 기준.

---

## §2 SVG 오버레이 기술 설계

### 원칙

1. **좌표 변환 없음**: lat/lng → pixel 수식 변환 금지. 모든 경계점은 이미지 상대 좌표 `(x: 0~1, y: 0~1)` 로 수동 지정.
2. **Founder 시안 확인 선행**: Founder가 이미지 위에서 각 권역 영역을 시각적으로 확인·승인 후 좌표 인코딩.
3. **여행 탐색 범위 표기**: 경계선 레이블에 "탐색 범위 (행정구역 아님)" 명시.
4. **Fallback**: `boundaryPoly` 미정의 권역은 오버레이 미표시.

### 컨테이너 구조 (반응형 보장)

```jsx
// padding-top 비율 컨테이너 — 이미지 종횡비 보존
// overview: 1304/1206 = 108.13%
<div style={{ position: 'relative', width: '100%', paddingTop: '108.13%' }}>
  <img src={OVERVIEW_IMG} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
  <svg
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    viewBox="0 0 1 1"  // 비율 좌표계 (0~1)
    preserveAspectRatio="none"
  >
    {/* 선택된 Zone의 boundaryPoly만 렌더 */}
    {activeZone && zones[activeZone]?.boundaryPoly && (
      <polygon
        points={zones[activeZone].boundaryPoly.map(p => `${p.x},${p.y}`).join(' ')}
        fill={`${zones[activeZone].color}18`}
        stroke={zones[activeZone].color}
        strokeWidth="0.005"
        strokeDasharray="0.012 0.006"
      />
    )}
  </svg>
</div>
```

**반응형 작동 원리**: padding-top 비율 컨테이너 + SVG `viewBox="0 0 1 1"` + `preserveAspectRatio="none"` 조합으로 이미지 크기에 따라 SVG가 자동 스케일. 모바일 350px~데스크탑 500px 모두 동일 비율 유지.

### yeosuMapData.js 데이터 구조 추가 (예시)

```js
// YEOSU_ZONES 내 각 zone에 추가
{
  id: 1, name_ko: '원도심 해안권', color: '#6EB8FF',
  // boundaryPoly: Founder 시각 확인 후 인코딩. 미정의 시 오버레이 미표시.
  // 좌표 기준: overview 이미지 좌상단=(0,0), 우하단=(1,1)
  // boundaryPoly: [{ x: 0.30, y: 0.35 }, { x: 0.55, y: 0.35 }, ...],  // ← Founder 확인 후 채움
  ...
}
```

### 스타일 설계

| 항목 | 값 | 이유 |
|------|-----|------|
| Fill | `zone.color + '18'` (약 10% 불투명도) | 일러스트 위 가시성 유지, 과도한 덮기 방지 |
| Stroke | `zone.color` | 권역 색상 일치 |
| StrokeWidth | `0.005` (viewBox 기준) | 모바일 1~1.5px 수준 |
| StrokeDasharray | `0.012 0.006` | 점선 → 행정구역 경계와 시각 구분 |
| PointerEvents | `none` | 터치 이벤트 이미지·장소 칩으로 통과 |

---

## §3 렌더링 위치: overview vs detail

| 위치 | 현재 | 경계선 추가 시 |
|------|------|--------------|
| ZoneOverview | overview 이미지 고정 표시 | 권역 카드 호버/선택 시 해당 zone boundaryPoly 표시 |
| ZoneDetail (Zone 1) | oldtown 이미지 + Phase A 마커 | oldtown은 Zone 1 전용 — 경계선 불필요 (단일 권역) |
| ZoneDetail (Zone 2~7) | 이미지 없음 (카드 UI) | 향후 zone별 detail 이미지 추가 시 적용 가능 |

**1차 구현 범위**: ZoneOverview 이미지 위 선택 권역 경계선만.

---

## §4 구현 위험 및 대응

| 위험 | 상세 | 대응 |
|------|------|------|
| 경계점 오인코딩 | lat/lng 변환 없이 수동 지정 → 시각 불일치 | Founder 시안 반복 확인 후 인코딩. `status: 'PROVISIONAL'` 플래그 |
| 행정구역 오인 | 여행 탐색 범위가 법적 경계로 오해 | SVG 경계에 점선 스타일 + 툴팁 "탐색 범위" 텍스트 |
| overview 이미지 범위 밖 권역 | Zone 4·6·7 이미지 밖 가능성 | `boundaryPoly` 미정의 시 자동 skip — fallback 내장 |
| 모바일 점선 너무 가늘게 | strokeWidth 0.005 = 0.7px (350px 기준) | 최소 1px 보장 위해 strokeWidth 0.008 이상 검토 필요 |

---

## §5 Founder 확인 필요 항목

| ID | 항목 | 방법 |
|----|------|------|
| B-1 | overview 이미지에 실제로 보이는 권역 범위 | 이미지 직접 확인 후 구역 지정 |
| B-2 | Zone 1(원도심), Zone 2(오동도·엑스포), Zone 3(돌산) 경계 대략적 범위 | 이미지 위에 손가락/펜으로 표시 or % 좌표 설명 |
| B-3 | 경계선 스타일 선호 (실선 vs 점선, 색상 진하기) | 시안 확인 후 피드백 |
| B-4 | Zone 4·6·7이 이미지에 보이지 않을 경우 — overview에 표시 안 하는 것 동의 여부 | 예/아니오 |

---

## §6 최소 변경 파일

| 파일 | 변경 내용 | 시점 |
|------|---------|------|
| `yeosuMapData.js` | YEOSU_ZONES에 `boundaryPoly` 배열 추가 | Founder 경계 확인 후 |
| `YeosuMapSelector.jsx` | ZoneOverview에 SVG 오버레이 렌더 추가 | yeosuMapData.js 완료 후 |
| 이미지 파일 | **변경 없음** | — |
| SOUL / 추천 엔진 | **변경 없음** | — |
| 42개 Inventory | **변경 없음** | — |

---

## §7 Fallback 설계 (미검증 권역)

```js
// Zone에 boundaryPoly 없으면 SVG 미렌더 (명시적 null 불필요)
const poly = zones.find(z => z.id === activeZone)?.boundaryPoly;
if (!poly) return null; // 경계선 없음, 이미지만 표시
```

Zone 5·6·7처럼 이미지 범위 밖이거나 아직 Founder 확인 안 된 권역은 `boundaryPoly` 미정의로 자동 fallback. 사용자는 이미지만 보임.

---

## §8 다음 단계 (Founder 확인 후)

1. **Founder → B-1~B-4 확인** (overview 이미지에 어느 권역이 보이는지)
2. **경계 좌표 인코딩**: HIGH 가능 Zone 1·2·3부터 `boundaryPoly` 인코딩
3. **ZoneSelector SVG 구현** (최소 30줄 변경)
4. **Founder 시각 확인** → 경계선 미세 조정
5. **빌드·회귀·커밋**
