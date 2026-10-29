# MAP V0.1 — Zone 6 SOURCE_RENDER_ALIGNED Evidence

**Date**: 2026-10-29  
**Status**: MAP_V01_ZONE6_SOURCE_RENDER_ALIGNED / FOUNDER_VISUAL_QA_PENDING  
**분류**: REPAIR — Zone 6 SOURCE 좌표 → Founder QA 편집기 최신값으로 교체

---

## §1 버그 원인

**증상**: Founder QA 편집기에서는 Zone 6 마커 4곳이 올바른 위치에 표시되었으나,  
일반 지도(QA Preview, placement mode 비진입)에서는 "오른쪽 아래로 밀려" 보임.

**원인**: QA 편집기는 `localStorage(yeosu_map_draft_v02_overview)` 초안을 우선 표시.  
일반 지도는 `yeosuMapData.js` SOURCE 좌표를 사용. SOURCE가 이전값으로 남아 있어 불일치 발생.

---

## §2 변경 요약

| place_id | name_ko | 이전 SOURCE x | 이전 SOURCE y | 신규 SOURCE x | 신규 SOURCE y |
|----------|---------|--------------|--------------|--------------|--------------|
| gasari_ecology | 가사리생태공원 | 0.364 | **0.404** | 0.364 | **0.372** |
| yeojaman_sunset | 여자만갯벌/해넘이 | 0.277 | **0.288** | 0.277 | **0.273** |
| seomdalcheon | 섬달천 | **0.254** | **0.341** | **0.238** | **0.335** |
| hwanyang_drive | 화양드라이브 | 0.433 | **0.506** | 0.433 | **0.487** |

이전 SOURCE 백업: `yeosuMapData.js` 주석 인라인 보존.

---

## §3 렌더링 구조 확인

| 항목 | 내용 |
|------|------|
| PROVISIONAL 마커 표시 조건 | `isQAPreview=true` 시에만 표시 (비 QA 모드 미표시 — 설계) |
| QA 편집기 마커 소스 | localStorage 초안 우선, 없으면 SOURCE |
| QA 일반 지도 마커 소스 | SOURCE(`yeosuMapData.js`) 직접 사용 |
| 수정 후 일치 여부 | SOURCE = QA 편집기 동일 위치 ✅ |

---

## §4 Puppeteer 검증 결과

**테스트**: `tests/map-zone6-source-render-aligned.js`

```
① QA Preview — 일반 지도 (placement mode 비진입):
  ✅ 가사리생태공원:   SOURCE=(0.364,0.372) render=(0.3640,0.3720) Δ=0.0000
  ✅ 여자만갯벌/해넘이: SOURCE=(0.277,0.273) render=(0.2770,0.2730) Δ=0.0000
  ✅ 섬달천:          SOURCE=(0.238,0.335) render=(0.2380,0.3350) Δ=0.0000
  ✅ 화양드라이브:     SOURCE=(0.433,0.487) render=(0.4330,0.4870) Δ=0.0000
  결과: 4/4 PASS

② QA Preview — 편집기 (placement mode 진입 확인):
  편집 모드 진입: ✅ (스크린샷: zone6-qa-placement-editor.png)

③ QA Preview — 편집기 2× 확대:
  2× 버튼 클릭: ✅ (스크린샷: zone6-qa-zoomed.png)

최종 판정: ✅ PASS
```

---

## §5 스크린샷 파일

| 파일 | 내용 |
|------|------|
| `tests/screenshots-zone6/zone6-qa-regular-map.png` | Zone 6 QA 일반 지도 (신규 좌표) |
| `tests/screenshots-zone6/zone6-qa-placement-editor.png` | Zone 6 QA 편집기 (placement mode) |
| `tests/screenshots-zone6/zone6-qa-zoomed.png` | Zone 6 QA 편집기 2× 확대 |

---

## §6 빌드·회귀

| 항목 | 결과 |
|------|------|
| Vite build | ✅ 698 modules |
| Jest | ✅ 639/640 (R20 PRE-EXISTING) |
| Puppeteer Zone 6 | ✅ 4/4 PASS Δ=0.0000 |

---

## §7 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| Zone 1 최신 7곳 SOURCE_SAVED | ✅ 보존 |
| Zone 2 초안·권역 분리 수정 | ✅ 보존 |
| Zone 3·4 Founder 수용 좌표 | ✅ 보존 |
| Zone 5 장도·웅천친수공원 변경 | ✅ 보존 |
| Zone 7 섬 4곳 + offMap 2곳 | ✅ 보존 |
| PROVISIONAL 유지 | ✅ |
| VERIFIED 자동 승격 | ❌ 없음 |
| SOUL 게이팅 변경 | ❌ 없음 |
| DB/Schema 변경 | ❌ 없음 |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §8 FOUNDER_VISUAL_QA_PENDING

Zone 6 4곳: **SOURCE_SAVED ✅ / FOUNDER_VISUAL_ACCEPTED ⏳**  
Founder가 `localhost:5000/muyojeong?qa_preview=boundary` → 화양·여자만권 선택 → 화면 확인 후 기록 예정.
