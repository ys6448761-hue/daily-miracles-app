# MAP V0.1 — Zone 2 낭만요트 SOURCE_ALIGNED Evidence

**Date**: 2026-10-30  
**Status**: MAP_V01_ZONE2_NANGMAN_YACHT_SOURCE_ALIGNED / FOUNDER_FINAL_VISUAL_QA_PENDING  
**분류**: REPAIR — 낭만요트 markerPos.oldtown 단일 좌표 정정

---

## §1 변경

| place_id | name_ko | 이전 x | 이전 y | 신규 x | 신규 y |
|----------|---------|--------|--------|--------|--------|
| nangman_yacht | 낭만요트 | 0.627 | 0.425 | **0.605** | **0.406** |

---

## §2 Puppeteer 검증

```
✅ 낭만요트: SOURCE=(0.605,0.406) render=(0.6050,0.4060) Δx=0.0000 Δy=0.0000
✅ 블루요트(불변체크): SOURCE=(0.593,0.378) render=(0.5930,0.3780)
```

Zone 2 나머지 10곳 불변 확인 (블루요트 샘플 Δ=0.0000 ✅)

---

## §3 빌드·회귀

| 항목 | 결과 |
|------|------|
| Vite build | ✅ 698 modules |
| Puppeteer | ✅ 낭만요트 Δ=0.0000 |

---

## §4 보호 규칙 확인

| 항목 | 결과 |
|------|------|
| Zone 2 나머지 10곳 | ✅ 불변 |
| Zone 1·3·4·5·6·7 | ❌ 변경 없음 |
| 초안 삭제 | ❌ 없음 |
| PROVISIONAL 유지 | ✅ |
| VERIFIED 자동 승격 | ❌ 없음 |
| SOUL 게이팅 변경 | ❌ 없음 |
| PR #134 merge / Production 배포 | ❌ 없음 |
| CAR GOVERNANCE_HOLD | ✅ 유지 |

---

## §5 FOUNDER_FINAL_VISUAL_QA_PENDING

낭만요트: **SOURCE_SAVED ✅ / FOUNDER_FINAL_VISUAL_QA_PENDING ⏳**
