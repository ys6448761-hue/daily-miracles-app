# MAP V0.1 — Zone Boundary Scaffold Evidence

**Date**: 2026-10-26  
**Status**: MAP_V01_BOUNDARY_SCAFFOLD_READY  
**SHA**: `58b7bbc`  
**브랜치**: `docs/pr133-state-sync`  
**Authorization**: FOUNDER_BOUNDARY_UX_APPROVED / BOUNDARY_SCAFFOLD_IMPLEMENTATION_AUTHORIZED

---

## §1 변경 파일

| 파일 | 변경 내용 |
|------|---------|
| `dreamtown-frontend/src/constants/yeosuMapData.js` | YEOSU_ZONES에 `boundary` 추가, `getZoneBoundary()` 헬퍼 추가 |
| `dreamtown-frontend/src/components/YeosuMapSelector.jsx` | ZoneOverview SVG 오버레이 + 카드 hover 상태 추가 |

---

## §2 boundary 데이터 구조

```js
// YEOSU_ZONES 각 항목
boundary: {
  imageId: 'yeosu-overview-v01',  // 기준 이미지 파일명(확장자 제외)
  points: null,                    // [{x:0~1, y:0~1}...] — Founder 검수 후 인코딩
  status: 'UNVERIFIED',           // UNVERIFIED | PROVISIONAL | VERIFIED
  source: null                     // 좌표 작성 근거
}
```

**렌더링 조건**: `status === 'VERIFIED'` AND `points` 길이 >= 3 → SVG `<polygon>` 렌더  
**현재 상태**: 전체 7개 Zone UNVERIFIED → 사용자 화면 변화 없음 ✅

---

## §3 SVG 오버레이 구조

```jsx
// padding-top 비율 컨테이너 (1304/1206 = 108.13%)
<div style={{ position: 'relative', paddingTop: '108.13%', ... }}>
  <img style={{ position: 'absolute', objectFit: 'fill', ... }} />
  <svg
    style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}
    viewBox="0 0 1 1"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    {/* VERIFIED + points>=3 시에만 렌더 */}
    <polygon
      points="..."
      fill={`${zone.color}18`}       // 약 10% 불투명도
      stroke={zone.color}             // 권역 색상
      strokeWidth="0.006"            // viewBox 기준 (~2px @ 350px)
      strokeDasharray="0.016 0.008"  // 금빛 점선
      strokeLinejoin="round"
      opacity="0.85"
    />
  </svg>
</div>
```

**좌표 정합 원리**: padding-top 비율 컨테이너로 이미지 1206×1304 비율 보존 → `objectFit: 'fill'` 크롭 없음 → SVG `viewBox="0 0 1 1" preserveAspectRatio="none"` 와 픽셀 공간 일치.

---

## §4 Zone 1~7 경계 상태표

| Zone | 이름 | boundary.status | points | 표시 여부 |
|------|------|----------------|--------|---------|
| 1 | 원도심 해안권 | UNVERIFIED | null | ❌ (미표시) |
| 2 | 오동도·엑스포권 | UNVERIFIED | null | ❌ |
| 3 | 돌산권 | UNVERIFIED | null | ❌ |
| 4 | 향일암권 | UNVERIFIED | null | ❌ |
| 5 | 소호·장도권 | UNVERIFIED | null | ❌ |
| 6 | 화양·여자만권 | UNVERIFIED | null | ❌ |
| 7 | 섬섬길 | UNVERIFIED | null | ❌ |

→ 사용자 화면에 경계선 미표시 (scaffold 구조만 존재)

---

## §5 안전성 검증 결과

| 항목 | 결과 |
|------|------|
| Inventory 42개 불변 | ✅ |
| TG_READY 12개 불변 | ✅ |
| SOUL 13개 place_code 불변 | ✅ |
| EXPLORER 누출 없음 | ✅ |
| SVG pointerEvents: none | ✅ (터치/클릭 통과) |
| 이미지 원본 변경 없음 | ✅ |
| 이미지 fallback 정상 | ✅ (imgError→카드 UI) |
| 권역 카드 선택·뒤로가기 | ✅ (기존 동작 유지) |
| VERIFIED 미충족 → 경계 미표시 | ✅ |
| 빌드 | 698 modules ✅ |
| 회귀 | 615/616 PASS (R20 PRE-EXISTING) |
| Production 미배포 | ✅ |

---

## §6 Founder 검수용 다음 단계

1. **Founder → overview 이미지에서 Zone 1·2·3 경계 시각 확인**
2. **경계 좌표 인코딩**: `points: [{x:0.xx, y:0.yy}, ...]` 형식으로 Founder 지정 범위 입력
3. **`status: 'PROVISIONAL'`로 먼저 적용** → Founder 시각 재검수 → `'VERIFIED'` 승격
4. **VERIFIED 승격 후 서비스 화면에 경계선 표시** (코드 변경 없음, 데이터만)

---

## §7 변경 후 ZoneOverview UX (현재)

- 권역 카드 hover: 카드 배경/테두리 약한 강조 (transition 0.15s) ← 새 기능
- 권역 카드 hover: overview 이미지 위 경계선 → **현재 미표시** (UNVERIFIED)
- 모바일: hover 이벤트 없음 → 경계 미리보기 없음 (경계 VERIFIED 후 Touch 지원 검토)
- 모바일 레이아웃: 이미지 비율 108.13% → 모바일 350px 기준 ~378px 높이 (전체 일러스트 표시)
