# 하멜등대 Living Detail Page V0.1 — 구현 Evidence

**Date**: 2026-11-02  
**Status**: HAMEL_LIVING_DETAIL_V01_ASSETS_REGISTERED  
**Branch**: `docs/pr134-merged-state-sync`

---

## §1 구현 범위

기존 Living Detail 제작 규칙(SoulCableCarPage.jsx) 상속. 6번째 장소로 EXTEND.

| 변경 항목 | SHA |
|-----------|-----|
| 코드 구현 (SoulCableCarPage + MuyojeongHomePage) | `705afc1` |
| 이미지 자산 3종 서비스 경로 등록 | `c105b40` |

---

## §2 원본 → 서비스 경로 매핑

| 역할 | 원본 경로 (보관) | 서비스 경로 (복사본) |
|------|----------------|-------------------|
| Place Hero | `C:\DREAM TOWN\Assets\SOUL\Hamel_Lighthouse\Place_Hero\Hamel_Lighthouse_Place_Hero_V2.png` | `dreamtown-frontend/public/images/soul/place-hero/hamel-lighthouse.png` |
| Experience | `C:\DREAM TOWN\Assets\SOUL\Hamel_Lighthouse\Experience\Hamel_Lighthouse_Experience.png` | `dreamtown-frontend/public/images/soul/hamel-lighthouse/experience-v1.png` |
| Wish Scene | `C:\DREAM TOWN\Assets\SOUL\Hamel_Lighthouse\Wish_Scene\Hamel_Lighthouse_Wish_Scene_V1.png` | `dreamtown-frontend/public/images/soul/hamel-lighthouse/wish-scene.png` |

**원본 보존 확인** ✅ — Copy-Item 사용. 원본 6종 모두 `C:\DREAM TOWN\Assets\SOUL\Hamel_Lighthouse\` 에 보존됨.

**미사용 원본 파일** (서비스 미등록):
- `Context/Hamel_Lighthouse_Context_V1.png` — Context 이미지 (V0.1 범위 외)
- `Journey/Hamel_Lighthouse_Journey.png` — Journey 이미지 (V0.1 범위 외)
- `Experience/Hamel_Lighthouse_Experience_V1_Archive.png.png` — Archive 파일, 미사용

---

## §3 코드 변경 목록 (SoulCableCarPage.jsx)

| 변경 위치 | 내용 |
|-----------|------|
| `SUPPORTED_PLACE_CODES` | `hamel_lighthouse` 추가 |
| `PLACE_HERO_MAP` | `hamel_lighthouse: '/images/soul/place-hero/hamel-lighthouse.png'` |
| `HAMEL_SOUL_DISCOVERY` | Phase 1 experience_ko 상수 (Founder 승인 2026-10-19) |
| `isHamelView` | `placeCode === 'hamel_lighthouse'` |
| `primaryDiscovery` | `isHamelView` 분기 추가 |
| 페이지 제목 | `'하멜등대'` |
| placeholder | `'하멜등대에 대해 뭐든 물어보세요'` |
| hero 위치 | `'여수 · 하멜등대'` |
| hero 태그라인 | `'바다를 향한 등대 · 희망을 바라보는 별빛 항로'` |
| ESSENTIAL INFO | 무료 / 24시간 / 1899-2012 (Founder 확정) |
| EXPERIENCE 이미지 | `experience-v1.png` |
| EXPERIENCE 텍스트 | experience_ko 직접 표시 |
| WISH SCENE 이미지 | `wish-scene.png` |

**MuyojeongHomePage.jsx:**
- `NAVIGABLE_PLACE_CODES`: `hamel_lighthouse` 추가
- `PLACE_NAME_KO`: `hamel_lighthouse: '하멜등대'`

---

## §4 검증 결과

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 698 modules, exit 0 |
| dist 이미지 3종 포함 | ✅ |
| Jest 회귀 | ✅ 639/640 PASS |
| R20 PRE-EXISTING FAIL | `map-draft-persistence-runtime.test.js` "must contain at least one test" — 미해결 기존 이슈 |
| 17 suite worker exceptions | PRE-EXISTING 인프라 이슈 — 신규 실패 없음 |

**Jest 실패 분류:**
- **신규 실패**: 0건
- **PRE-EXISTING (R20)**: 1건 — `map-draft-persistence-runtime.test.js` (빈 테스트 스위트)
- **PRE-EXISTING worker 오류**: 17 suites — child process exception, 기존 동일

---

## §5 SSOT 보완 필요 사항

원본(`C:\DREAM TOWN\Assets\SOUL\`)→서비스(`public/images/soul/`) 대응 규칙이 문서화되지 않음.  
이번 하멜등대 작업에서 처음 명시적으로 정리됨 (§2).  
향후 Architecture Decision 또는 자산 매핑 문서로 공식화 필요 — 별도 Founder 결정 사항.

---

## §6 Production 배포

- **배포 승인: 미완료** — Founder 별도 승인 필요
- 현재 브랜치 `docs/pr134-merged-state-sync` → PR #135 merge → Production 수동 배포 순서

---

## §7 Context/Journey 이미지 (V0.1 범위 외)

원본에 Context·Journey 이미지가 존재하나 V0.1 코드에 미매핑.  
필요 시 V0.2에서 추가 가능:
- `context-v1.png` ← `Hamel_Lighthouse_Context_V1.png`
- `journey-v1.png` ← `Hamel_Lighthouse_Journey.png`
