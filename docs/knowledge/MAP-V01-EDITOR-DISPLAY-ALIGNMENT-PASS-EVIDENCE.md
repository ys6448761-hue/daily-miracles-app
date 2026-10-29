# MAP V0.1 — Editor/Display Marker Alignment PASS Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_EDITOR_DISPLAY_ALIGNMENT_PASS  
**Classification**: REPAIR — QA 편집기 마커 중심 좌표 기준 통일

---

## §1 근본 원인

QA candidate 마커의 outer div가 `display: flex; flex-direction: column`으로 구성되어
circle + label이 인라인 흐름으로 배치되었음.

`transform: translate(-50%, -50%)`는 ENTIRE flex container(circle + label)를 기준으로 이동했기 때문에
circle의 시각적 중심이 저장된 좌표보다 위로 올라간 현상 발생.

| 구성 | 높이 | 오프셋 |
|------|------|--------|
| circle 12px + gap 2px + label ~14px | 28px total | circle 중심 = 12/2 = 6px 위치 / 전체 절반 = 14px → 8px 위로 이동 |
| 일반 표시 마커: `padding: 8px` wrapper | circle center = translate anchor | 오프셋 없음 ✅ |

---

## §2 수정 내용

**대상**: `YeosuMapSelector.jsx` — oldtown QA 마커 (~line 832) + overview QA 마커 (~line 1160)

### Before
```jsx
// outer div
style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', ... }}

// label (in-flow)
<div style={{ background: 'rgba(0,0,0,0.75)', ... }}>
  {t.name_ko}
</div>
```

### After
```jsx
// outer div — same padding as regular markers
style={{ padding: '8px', ... }}

// label — absolutely positioned below circle
<div style={{
  position: 'absolute',
  top: '100%', left: '50%',
  transform: 'translateX(-50%)',
  marginTop: '2px',
  pointerEvents: 'none',
  background: 'rgba(0,0,0,0.75)',
  ...
}}>
  {t.name_ko}
</div>
```

---

## §3 Puppeteer 검증

**기준 장소**: 돌산대교 (dolsan_daegyo)  
**저장 좌표**: x=0.639, y=0.518

| 측정 | Regular 원 중심 | QA 원 중심 | Source |
|------|----------------|-----------|--------|
| normCx | 0.6390 | 0.6390 | 0.639 |
| normCy | 0.5180 | 0.5180 | 0.518 |

**Δx = 0.0000 | Δy = 0.0000**  
**PASS ✅** (기준: Δ < 0.01)

---

## §4 검증 항목

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 698 modules |
| Jest 회귀 | ✅ 639/640 (R20 PRE-EXISTING) |
| Regular 마커 중심 오차 | ✅ 0.0000 |
| QA 마커 중심 오차 | ✅ 0.0000 |
| 저장 좌표 변경 없음 | ✅ 기존 좌표 보존 |
| PROVISIONAL 게이팅 불변 | ✅ |
| Zone 1·2 좌표 불변 | ✅ |
| PR #134 merge / Production 배포 | ✅ 금지 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §5 정책

- QA 편집 모드에서 드래그하여 저장한 좌표 = 일반 표시 모드 마커 중심과 동일한 픽셀 위치
- 별도 보정값 없음 — 단일 좌표계 통일 완료
