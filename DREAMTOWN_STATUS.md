# DREAMTOWN_STATUS.md
# 새 담당자/새 세션은 이 파일부터 읽을 것

Last Updated: 2026-10-30 (MUYOJEONG_RELEASE_GATE_RECONCILED)
담당: Claude Code (Lumi / Code Master)

---

## ★ PROJECT PHOENIX — ACTIVE (2026-09-18 ~ 현재)

> **아래 섹션이 현재 활성 작업입니다.** 2026-04-04 이후 내용은 Project Phoenix 시대입니다.

### 필수 읽기 순서 (신규 세션)

```
1. memory/MEMORY.md (동일 머신)                        ← 최신 Project State + Current Next Action
   또는 이 파일 §★ Current Next Action (원격 클론 환경) ← git-tracked 스냅샷
2. docs/product/SOUL_PRODUCT_VISION_V0_1.md            ← Active Product Vision (SOUL 상세 경험)
3. docs/governance/ARCH_GUARD_PROTOCOL_V0_1.md         ← Architecture Guard PILOT rev3 (충돌 판정)
4. docs/governance/meetings/ (최신 Meeting Record)     ← 결정 근거 + Founder Decision 상태
5. docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md  ← D2 결정
```

### ★ Current Next Action (exactly 1) — Updated: 2026-10-30

**PR #134 Founder merge 승인 → Production 배포**
- **MUYOJEONG_RELEASE_GATE_RECONCILED** ✅ (2026-10-30) — READ-ONLY
  - Zone 2 FOUNDER_VISUAL_ACCEPTED: "오케이 정상이야" (SHA 81b4cd0 이후) → **MAP_V01_ZONE2_FOUNDER_VISUAL_ACCEPTED ✅**
  - Zone 6 FOUNDER_VISUAL_ACCEPTED: "완벽해" → 기존 기록 정합성 확인 (line 53)
  - Zone 1: "다른 권역 정상 반영을 언급" = 간접 언급. per-marker 명시 수용 아님 → **AMBIGUOUS_PENDING 유지**
  - PROVISIONAL 마커 정책: 모든 Zone 1·2 마커 status='PROVISIONAL' → 일반 사용자 미노출 → **Zone 1 VISUAL_ACCEPTED 없이도 PR #134 merge 안전**
  - 남은 실제 merge 차단: PR #134 Founder merge 승인 1건뿐
  - Evidence: `docs/knowledge/MUYOJEONG-RELEASE-GATE-RECONCILED-EVIDENCE.md`
- **MUYOJEONG_ASSET_AUDIT_AND_RELEASE_PARALLEL_PLAN** ✅ (2026-10-30) — READ-ONLY AUDIT
  - 4버튼 연결 구조 확인: 부모님(family_elderly) / 아이(family_with_kids) ✅ / 차량(GOVERNANCE_HOLD ⚠️) / 코스 ✅
  - TG_READY 22곳 / SOUL Phase 1 완료 8곳 / Living Detail 3곳
  - 음식/카페: 파이프라인 존재, 큐레이션 데이터 부족 가능성
  - 오픈 차단 이슈: PR #134 미병합 + Zone 1·2 FOUNDER_FINAL_VISUAL_QA_PENDING
  - 최소 개편안: 방안 A(현행 유지 + 안내 문구 보완) — 데이터 확보 전 카테고리 개편 비권장
  - Evidence: `docs/knowledge/MUYOJEONG-ASSET-AUDIT-AND-RELEASE-PARALLEL-PLAN-EVIDENCE.md`
- **MAP_V01_ZONE2_FOUNDER_VISUAL_ACCEPTED** ✅ (2026-10-30)
  - Founder 발언: "오케이 정상이야" (SHA 81b4cd0 낭만요트 최종 수정 이후 명시적 수용)
  - 근거 SHA: `81b4cd0` (nangman_yacht x=0.627/y=0.425 → 0.605/0.406 최종 반영 후)
  - Zone 2 11곳 전체 수용 확정
- **MAP_V01_ZONE2_NANGMAN_YACHT_SOURCE_ALIGNED** ✅ (2026-10-30)
  - 낭만요트: x=0.627/y=0.425 → **x=0.605/y=0.406** (Founder 최종 수정)
  - Puppeteer Δ=0.0000 ✅ / 블루요트 불변 ✅
  - Evidence: `docs/knowledge/MAP-V01-ZONE2-NANGMAN-YACHT-SOURCE-ALIGNED-EVIDENCE.md`
- **MAP_V01_ZONE2_SOURCE_RENDER_ALIGNED** ✅ (2026-10-30)
  - Zone 6 FOUNDER_VISUAL_ACCEPTED 확정 수령 후 착수
  - 9곳 정정 + 2곳(여수엑스포역·여수오션크루즈) 신규 markerPos 등록
  - odongdo: 0.853/**0.392** → 0.850/**0.355** / cablecar: 0.660/**0.544** → 0.664/**0.507**
  - yeosu_expo_park: **0.558**/0.211 → **0.556**/0.185 / sky_tower: y=0.137 → y=**0.121**
  - jaisan_park: **0.581**/**0.537** → **0.602**/**0.508** / aquaplanet: **0.586**/**0.326** → **0.557**/**0.304**
  - yeosu_expo_station: 신규 **0.567/0.106** / yeosu_ocean_cruise: 신규 **0.608/0.209**
  - nangman_yacht: **0.657**/0.430 → **0.627**/0.425 / blue_yacht: **0.627**/**0.414** → **0.593**/**0.378**
  - big_o_show: **0.549**/**0.285** → **0.543**/**0.232**
  - 미배치 유지: expo_ocean_trail·manseongri_beach (이번 Founder 좌표 없음)
  - Puppeteer A **11/11 PASS** Δ≤0.0001 / Zone1 혼입 0 / C Zone1 7/7 / Zone2 혼입 0
  - 빌드 ✅ 698 modules / Jest ✅ 639/640
  - Zone 1·2 QA 편집기 권역 분리(SHA 41cfed0) 유지 확인
  - Zone 2: FOUNDER_VISUAL_QA_PENDING (단순 Δ=0만으로 지리적 최종 승인 불가)
  - Evidence: `docs/knowledge/MAP-V01-ZONE2-SOURCE-RENDER-ALIGNED-EVIDENCE.md`
- **MAP_V01_ZONE6_SOURCE_RENDER_ALIGNED** ✅ (2026-10-29) — FOUNDER_VISUAL_ACCEPTED ✅
  - 원인: Zone 6 일반 지도가 이전 SOURCE 좌표 잔류 → 일반 지도와 QA 편집기 불일치
  - 수정: `yeosuMapData.js` Zone 6 4곳 교체
    - gasari_ecology: 0.364/**0.404** → 0.364/**0.372**
    - yeojaman_sunset: 0.277/**0.288** → 0.277/**0.273**
    - seomdalcheon: **0.254**/0.341 → **0.238**/0.335
    - hwanyang_drive: 0.433/**0.506** → 0.433/**0.487**
  - Puppeteer QA 일반 지도 **4/4 PASS** Δ=0.0000 / 빌드 ✅ 698 modules / Jest ✅ 639/640
  - Zone 6 **FOUNDER_VISUAL_ACCEPTED ✅** ("완벽해" — Release Gate Reconciliation 2026-10-30 기록 정합성 확인)
  - Evidence: `docs/knowledge/MAP-V01-ZONE6-SOURCE-RENDER-ALIGNED-EVIDENCE.md`
- **MAP_V01_ZONE1_FOUNDER_COORDINATES_SOURCE_SAVED** ✅ (2026-10-29)
  - 이순신광장: 0.401/0.549 → **0.375/0.515** / 낭만포차거리: 0.613/0.640 → **0.599/0.614**
  - 하멜등대: 0.564/0.634 → **0.569/0.603** / 고소동 천사벽화골목: 신규 **0.463/0.518**
  - 진남관: 0.391/0.474 → **0.380/0.449** / 오포대: 0.476/0.549 → **0.426/0.485**
  - 종포해양공원: 0.474/0.601 → **0.444/0.582** / 여수 수산시장: PLACEMENT_PENDING 유지
  - Puppeteer **7/7 PASS** Δ<0.001 / 여수 수산시장 마커 없음 ✅
  - 빌드 ✅ 698 modules / Jest ✅ 639/640
  - Zone 1 SOURCE_SAVED: **7곳** (기존 6 + 고소동 천사벽화골목 신규)
  - Founder 화면 확인 후 VISUAL_ACCEPTED 기록 예정
  - Evidence: `docs/knowledge/MAP-V01-ZONE1-FOUNDER-COORDINATES-SOURCE-SAVED-EVIDENCE.md`
- **MAP_V01_ZONE1_2_QA_DRAFT_SCOPE_FIXED** ✅ (2026-10-29)
  - 버그: Zone 1 선택 시 Zone 2 초안(체크, 좌표목록, "초안 복원됨")이 표시되는 오류
  - 원인: `zoneTargets` = `zone===1 || zone===2` → 현재 권역 무관하게 두 권역 혼재
  - 수정: `zoneTargets` → `zone===zoneId` (현재 권역만), `copyAllCandidates` zone 필터, "초안 삭제" zone 스코프
  - A/B/C/D Puppeteer 4/4 PASS / 빌드 ✅ / Jest 639/640
  - Evidence: `docs/knowledge/MAP-V01-ZONE1-2-QA-DRAFT-SCOPE-FIXED-EVIDENCE.md`
- **MAP_V01_ZONE7_LAYOUT_SOURCE_SAVED** ✅ (2026-10-29) SHA `fb1373a`
  - 사도: 0.307/0.823 → **0.311/0.813** / 하화도: 0.420/0.818 → **0.425/0.810**
  - 금오도: 신규 markerPos **0.662/0.877** (PROVISIONAL) / 개도: 신규 **0.512/0.828** (PROVISIONAL)
  - 거문도·백도: `offMap: true` — 지도 마커 미표시, "지도 범위 밖의 섬" 목록 섹션 UI 구현
  - Puppeteer **4/4 마커 PASS** Δ=0.0000 + 거문도·백도 마커 0건 + offMap 목록 2/2 ✅
  - 빌드 ✅ 698 modules / Jest ✅ 639/640
  - SOURCE_SAVED: **37곳** (+금오도·개도) / Inventory: 50곳 불변
  - Founder 화면 확인 후 VISUAL_ACCEPTED 기록 예정
  - Evidence: `docs/knowledge/MAP-V01-ZONE7-LAYOUT-SOURCE-SAVED-EVIDENCE.md`
- **MAP_V01_ZONE5_PLACE_COORDINATE_CORRECTED** ✅ (2026-10-29) SHA 커밋 예정
  - 이순신마리나: Zone 5 탐색 제외 (hidden:true / tg_excluded / SOUL 의존성 없음)
  - 웅천친수공원 (`ungcheon_park`): Zone 5 신규 등록 (PLACEMENT_PENDING / markerPos 없음)
  - 장도: 0.525/0.503 → **0.521/0.471** (이전 이순신마리나 좌표가 실제 장도 위치)
  - 유월드루지: 0.461/0.460 → **0.458/0.444**
  - 소호요트장: 0.478/0.509 → **0.476/0.509**
  - 소호동동다리: 0.496/0.471 → **0.480/0.483**
  - 서틀러다육식물원: 0.406/0.459 → **0.404/0.442**
  - Puppeteer **5/5 PASS** Δ=0.0000 / 이순신마리나·웅천친수공원 마커 없음 ✅
  - 빌드 ✅ 698 modules / Jest ✅ 639/640
  - **Inventory: 50곳** (+1 ungcheon_park) / **SOURCE_SAVED: 35곳** (-1 이순신마리나)
  - **Founder 화면 확인 후** MAP_V01_ZONE5_VISUAL_ACCEPTED 기록 예정
  - Evidence: `docs/knowledge/MAP-V01-ZONE5-PLACE-COORDINATE-CORRECTED-EVIDENCE.md`
- **MAP_V01_ZONE5_VISUAL_QA_PENDING** ✅ 해소 (2026-10-29)
- **MAP_V01_FIVE_ZONE_VISUAL_RECONCILIATION_HOLD** ✅ Zone 5 우선 분리 (2026-10-29)
  - Zone 1·2·6·7 VISUAL_REJECTED 상태 보존 — Zone 5 완료 후 순차 진행
  - Evidence: `docs/knowledge/MAP-V01-FIVE-ZONE-VISUAL-RECONCILIATION-HOLD-EVIDENCE.md`
- **MAP_V01_ZONE4_7_COORDINATES_RECONCILED** ✅ (2026-10-29)
  - Founder 전달값 vs SOURCE 16/16 대조: **전원 일치** → 좌표 변경 없음
  - Puppeteer **16/16 PASS** (Δ=0.0000, Zone 4·5·6·7 전체)
  - 시각 불일치 원인: Founder 브라우저 `yeosu_map_draft_v02_overview` stale data
  - 해결: QA preview → 각 권역 → "초안 삭제" / 또는 DevTools Application → Local Storage 삭제
  - 코드 변경 없음 / SOURCE_SAVED 36곳 불변
  - Evidence: `docs/knowledge/MAP-V01-ZONE4-7-COORDINATES-RECONCILED-EVIDENCE.md`
- **MAP_V01_ZONE3_DRAFT_SOURCE_RECONCILED** ✅ (2026-10-29)
  - Founder 초안 좌표(직접 전달) → 4곳 교체, 1곳 동일 확인
  - dolsan_daegyo: 0.639→**0.617** / 0.518→**0.495**
  - dolsan_nightscape: 0.681→**0.671** / 0.539→**0.511**
  - museukmok: 0.701→**0.696** / 0.615→**0.606**
  - cablecar_dolsan: 0.678→**0.715** / 0.531→**0.528**
  - artland_resort: 0.740=0.740 / 0.580=0.580 (동일)
  - **Puppeteer 5/5 PASS** (Δ=0.0000) / 빌드 ✅ 698 modules / Jest ✅ 639/640
  - Evidence: `docs/knowledge/MAP-V01-ZONE3-DRAFT-SOURCE-RECONCILED-EVIDENCE.md`
- **MAP_V01_DRAFT_SOURCE_RECONCILIATION_HOLD** ✅ RESOLVED (2026-10-29)
  - Founder 초안 좌표 직접 전달로 HOLD 해제
- **MAP_V01_FOUNDER_VISUAL_ALIGNMENT_VERIFIED** ✅ (2026-10-29)
  - **이전 Δ=0 오류**: 버튼 선택자 '위치 지정' != 실제 텍스트 '시작' → placement mode 미진입 → 동일 마커를 두 번 측정
  - **올바른 테스트**: localStorage 주입 → '시작' 버튼 → candidate/regular 실제 비교
  - **5/5 PASS**: dolsan_daegyo·nightscape·museukmok·cablecar_dolsan·artland_resort 전부 Δ=0.0000
  - **렌더링 코드 버그 없음** — 원인: Founder 브라우저 localStorage stale data
  - **해결**: Founder가 "초안 삭제" 버튼으로 `yeosu_map_draft_v02_overview` 초기화
  - 코드 변경 없음 / 좌표 보존 / 재드래그 요청 없음
  - Evidence: `docs/knowledge/MAP-V01-FOUNDER-VISUAL-ALIGNMENT-VERIFIED-EVIDENCE.md`
- **MAP_V01_FINAL_INVENTORY_AUDITED** ✅ (2026-10-29)
  - 전체 49곳 / SOURCE_SAVED 36곳 / 미배치 13곳
  - V0.1 처리 완료: **37/49** (36 SOURCE_SAVED + 1 의도적 제외)
  - V0.2 이관: 12곳 (MAP_OUT_OF_SCOPE 4곳·PLACEMENT_PENDING 1곳·LOCATION_UNVERIFIED 7곳)
  - 미배치 사유: MAP_OUT_OF_SCOPE 5 / PLACEMENT_PENDING 1 / LOCATION_UNVERIFIED 7
  - Evidence: `docs/knowledge/MAP-V01-FINAL-INVENTORY-AUDIT-EVIDENCE.md`
- **MAP_V01_ZONE4_ZONE5_SOURCE_SAVED** ✅ (2026-10-29)
  - Zone 4 SOURCE_SAVED 4/4: 돌산갓장터마을(0.702/0.660)·향일암(0.751/0.804)·북한반잠수정(0.726/0.772)·봉황산(0.678/0.743)
  - Zone 5 SOURCE_SAVED 6/6: 유월드루지(0.461/0.460)·장도(0.525/0.503)·소호요트장(0.478/0.509)·소호동동다리(0.496/0.471)·이순신마리나(0.547/0.504)·서틀러다육(0.406/0.459)
  - 소스 좌표 자동 비교: **10/10 PASS** (`tests/map-zone45-verify.mjs`)
  - Puppeteer QA: Z4=4 / Z5=6 / 타 권역 혼입 0 — 전체 QA 표시 36곳 (26→+10)
  - 빌드 ✅ 698 modules / 회귀 ✅ 639/640 (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-ZONE4-ZONE5-SOURCE-SAVED-EVIDENCE.md`
- **MAP_V01_EDITOR_DISPLAY_ALIGNMENT_PASS** ✅ (2026-10-29)
  - **버그 수정**: QA 편집기 마커 중심 vs 일반 표시 마커 중심 불일치
  - 원인: QA outer div `display:flex;flex-direction:column` → translate(-50%,-50%)가 flex 전체 기준 이동
  - 수정: `padding:8px` wrapper (일반 마커 동일) + label absolute positioned
  - **Puppeteer 검증**: dolsan_daegyo Δx=0.0000 / Δy=0.0000 — PASS ✅
  - 빌드 ✅ 698 modules / 회귀 ✅ 639/640 (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-EDITOR-DISPLAY-ALIGNMENT-PASS-EVIDENCE.md`
- **MAP_V01_OVERVIEW_MARKERS_QA_VISIBLE** ✅ (2026-10-29)
  - **버그 수정**: `getMarkersForImage` `confidence==='HIGH'` 게이트가 모든 PROVISIONAL 차단
  - 수정: `includeProvisional` 파라미터 추가 → QA Preview에서만 PROVISIONAL 포함
  - Zone 3 Founder 좌표 5곳 SOURCE_SAVED (돌산대교·돌산공원·무슬목·돌산탑승장·예술랜드)
  - **Puppeteer QA 확인**: Z1=6 / Z2=9 / Z3=5 / Z4=0 / Z5=0 / Z6=4 / Z7=2 — 타 권역 혼입 0
  - 공개 모드 PROVISIONAL 차단 유지 (isQAPreview=false → confidence=HIGH만 통과)
  - 빌드 ✅ 698 modules / 회귀 ✅ 639/640 (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-OVERVIEW-MARKERS-QA-VISIBLE-EVIDENCE.md`
- **MAP_V01_ZONE7_ISLAND_INVENTORY_RECONCILED** ✅ (2026-10-29)
  - hwajung_island 제거 (런타임 참조 0건 확인 후 물리 삭제)
  - 사도·하화도 Founder QA 초안 좌표 PROVISIONAL 저장 (x=0.307/0.823, x=0.420/0.818)
  - 금오도·거문도·백도·개도 신규 등록 (PLACEMENT_OPEN — 지도 범위 미확인)
  - 거문도·백도 독립 place_id 유지 (geomundo_island / baekdo_island)
  - 배편 안내 통일: '배편 필수 · 섬별 출발항, 운항 일정 및 물때 확인'
  - **Inventory: 46 → 49곳** / Zone 7 편집 목록 6곳
  - 빌드 ✅ 698 modules / 회귀 ✅ 639/640 (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-ZONE7-ISLAND-INVENTORY-RECONCILED-EVIDENCE.md`
- **MAP_V01_ZONE6_DUPLICATE_REMOVED** ✅ (2026-10-29)
  - jangcheok_tideland 제거 (yeojaman_sunset와 동일 장소, Founder 결정)
  - Zone 6 후보 좌표 PROVISIONAL 저장: gasari·yeojaman·seomdalcheon·hwanyang (4곳)
  - **Inventory: 47 → 46곳** / Zone 6 편집 목록 4곳 / 중복 마커 0건
  - 빌드 ✅ 698 modules / 회귀 ✅ 639/640 (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-ZONE6-DUPLICATE-REMOVED-EVIDENCE.md`
- **MAP_V01_ZONE3_ZONE4_MARKER_SCOPE_READY** ✅ (2026-10-29)
  - Zone 3: dolsan_got_market·nk_submarine·bonghwangsan → Zone 4 재배정
  - Zone 3 표시·편집: 돌산대교·돌산공원·무슬목·돌산탑승장·예술랜드리조트 (5곳)
  - Zone 4 편집 대상: 향일암·돌산갓장터마을·북한반잠수정·봉황산 (4곳)
  - 빌드 ✅ 698 modules / 회귀 ✅ 639/640 (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-ZONE3-ZONE4-MARKER-SCOPE-EVIDENCE.md`
- **MAP_V01_OVERVIEW_ZONE_CENTERED_ZOOM_PASS** ✅ (2026-10-29)
  - **버그 수정**: `width:200%` + `overflowX:auto` → `transform:scale(2)` + `transformOrigin` (권역별 중심)
  - Zone 3: x=0.62, y=0.58 / Zone 4: x=0.75, y=0.90 / Zone 5: x=0.50, y=0.33 / Zone 6: x=0.15, y=0.42 / Zone 7: x=0.55, y=0.70
  - oldtown Zone 1: x=0.49, y=0.58 / Zone 2: x=0.63, y=0.36 (Founder 마커 평균)
  - calcNorm 변경 없음 (CSS transform 수학적 증명 — getBoundingClientRect 보정 자동)
  - 빌드 ✅ 698 modules / 회귀 ✅ 639/640 (R20 PRE-EXISTING)
  - **PROVISIONAL**: overview 권역 중심은 지리적 추정값 — Founder 2× 확대 확인 후 갱신 가능
  - Evidence: `docs/knowledge/MAP-V01-OVERVIEW-ZOOM-CENTER-FIX-EVIDENCE.md`
- **MAP_V01_INVENTORY_PLACEMENT_RECONCILED** ✅ (2026-10-29) SHA `12d6f19`
  - **Inventory**: 45 → **47곳** (미남크루즈·이사부크루즈 Zone 3 EXPLORER 신규 등록)
  - **QA 편집 대상**: 44 → **46곳** / Zone 3: 8 → **10곳**
  - 누락 1곳 원인 확인: `jungang_market` (hidden=true, tg_excluded) — 의도적 제외, 정상
  - 중복 없음 / 기존 45곳 불변 / Zone 1·2 좌표 15곳 불변
  - 빌드 ✅ / 639/640 PASS (R20 PRE-EXISTING)
- **MAP_V01_ALL_ZONE_MARKER_EDITOR_READY** ✅ (2026-10-29) SHA `027b4c5`
  - Zone 1~7 전 권역 QA 편집기 구현 완료
  - Zone 1·2 (oldtown): QA 편집 대상 21곳 (Zone 1 8 + Zone 2 13)
  - Zone 3 (overview): QA 편집 대상 10곳 (신규 2곳 포함 후)
  - Zone 4~7 (overview): 각 1·6·5·3곳
  - overview 초안 저장/복원/내보내기 (`DRAFT_KEY_OVERVIEW`) / 2× 확대 토글
  - Evidence: `docs/knowledge/MAP-V01-ALL-ZONE-MARKER-EDITOR-EVIDENCE.md`
  - **Founder 다음 액션**: `/muyojeong?qa_preview=boundary` → Zone 3~7 진입 → 장소 위치 지정 → 내보내기 → 코드야 전달
- **MAP_V01_ZONE3_OVERVIEW_DECISION_RECORDED** ✅ (2026-10-29)
  - **Founder 결정**: Zone 3 돌산권 = overview 이미지 사용 (oldtown 지도 적용 취소)
  - Evidence: `docs/knowledge/MAP-V01-ZONE3-OVERVIEW-DECISION-EVIDENCE.md`
- **MAP_V01_VISUAL_CLOSEOUT_READY** ✅ (2026-10-29) SHA `d3fc30b`
  - Zone 1 스크린샷: 마커 6개, 원도심 해안 좌측 분포 ✅
  - Zone 2 스크린샷: 마커 9개, 오동도·엑스포 우측 분포 ✅
  - 불일치 0건 / Zone 2 drift 없음 (좌표 수식 동일 + 소스=렌더 100% 일치)
  - Evidence: `docs/knowledge/MAP-V01-VISUAL-CLOSEOUT-EVIDENCE.md` + `visual-closeout-2026-10-29/*.png`
- **MAP_V01_ZONE_SEPARATION_VERIFIED** ✅ (2026-10-29) SHA `3b36c6c`
  - **권역 분리 버그 수정**: Zone 1 → 6개만 / Zone 2 → 9개만 (교차 혼입 0)
  - **Founder 최종 좌표 15/15 갱신** (2026-10-29)
  - **19/19 PASS** / 빌드 ✅ / 회귀 639/640 (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-ZONE-SEPARATION-FINAL-COORD-EVIDENCE.md`
- **MAP_V01_15_MARKER_PIPELINE_VERIFIED** ✅ (2026-10-28) SHA `4a98a6d`
  - **11개 제한 없음**: 코드 전수 검색 — slice/limit/maxItems 없음
  - **15/15 파이프라인 완전 검증**: 소스 좌표 = 렌더 좌표 (puppeteer 실증)
  - `POSITION_CORRECTION_REQUIRED` 주석 제거 — Founder 정정: 예전 지정 좌표 = 올바른 좌표
  - Evidence: `docs/knowledge/MAP-V01-15-MARKER-PIPELINE-AUDIT.md`
- **MAP_V01_RENDER_CLICK_QA_PASS** ✅ (2026-10-28) SHA `f4963af`
  - 종포해양공원 중복 실검증 PASS / explorer 탐색 클릭 T-A1~T-A5 5/5 PASS
- **MAP_V01_DISCOVERY_CLICK_FIXED** ✅ (2026-10-27) SHA `96e3a95`
  - 마커 title 개발자 용어 제거 / 하단 목록 tooltip 명확화 (탐색 클릭은 이번 커밋에서 완성)
- **MAP_V01_DUPLICATE_MARKERS_REMOVED** ✅ (2026-10-27) SHA `d67df29`
  - 원인: QA_OLDTOWN_POSITIONS(구버전 참조점) + markerPos(신규 좌표) 동일 place_id 이중 렌더링
  - 수정: qaPlaces 필터에 "markerPos 있는 장소 제외" 조건 추가 (YeosuMapSelector.jsx line 355-361)
  - 제거된 QA 참조점: 12곳 (markerPos 반영된 장소) / 유지: 3곳 (gosodong·수산시장·엑스포역)
  - 중복 0건 / Founder 좌표 15개 불변 / 빌드 ✅ / 639/640 PASS
  - Evidence: `docs/knowledge/MAP-V01-DUPLICATE-MARKER-FIX-EVIDENCE.md`
- **MAP_V01_15_MARKERS_SOURCE_SAVED** ✅ (2026-10-27) SHA `92e4b99`
  - 15곳 전체 Founder 좌표 반영 완료 / 15/15 소스 일치 / 전 15곳 PROVISIONAL 유지
  - Zone 1: 이순신광장·낭만포차·하멜등대·진남관·오포대·종포해양공원
  - Zone 2: 오동도·케이블카·엑스포공원·스카이타워·자산공원·아쿠아플라넷·낭만요트·블루요트·빅오쇼
  - dist 검증: confidence:"HIGH" 16개(15 markerPos + 1 필터) ✅
  - 빌드 ✅ 698 modules / 639/640 PASS (R20 PRE-EXISTING)
  - 상태: **SOURCE_SAVED** 전 15곳 (VERIFIED 승격 = 별도 Founder 승인)
  - Evidence: `docs/knowledge/MAP-V01-SAVE-GATE-EVIDENCE.md`
  - **다음**: Founder 브라우저에서 지도 마커 위치 확인 → VERIFIED 승격 여부 결정
- **MAP_V01_FIRST_SOURCE_SAVE_VERIFIED** ✅ (2026-10-27) SHA `607ddb9` — 이순신광장 1곳 선행 반영
- **MAP_V01_SAVE_GATE_HOLD** ✅ (2026-10-27) — Acceptance Gate 검증 완료
  - T-11: TEST INFRA (코드 버그 아님) / v01/v02 격리 완전 / 상태 4단계 구분 명확
- **MAP_V01_MARKER_CLEAN_RESTART_READY** ✅ (2026-10-27) SHA `2dad09f`
  - 백업 SHA: `72367ee` / 7곳 markerPos 초기화 / DRAFT_KEY v02 격리
  - Evidence: `docs/knowledge/MAP-V01-CLEAN-RESTART-EVIDENCE.md`
- **MAP_V01_DRAFT_RUNTIME_VERIFIED** ✅ (2026-10-27) — Runtime 11/12 PASS
  - T-07(저장)·T-08(복원 배지·좌표 일치)·T-09(Zone 전환 유지) 모두 PASS
  - T-11: puppeteer 스크롤 클릭 이슈 (코드 버그 아님)
  - Evidence: `docs/knowledge/MAP-V01-CLEAN-RESTART-EVIDENCE.md §5`
- **MAP_V01_DRAFT_PERSISTENCE_QA_PASS** ✅ (2026-10-27) — Static PASS
  - Evidence: `docs/knowledge/MAP-V01-DRAFT-PERSISTENCE-QA-EVIDENCE.md`
- **[이전] MAP_V01_COORDINATE_DRAFT_PERSISTENCE_READY** ✅ (2026-10-27) — 해제됨 (v02로 대체)
- **[이전] MAP_V01_COORDINATE_PERSISTENCE_HOLD** (2026-10-27) — 해제됨
  - Evidence: `docs/knowledge/MAP-V01-POSITION-CATEGORY-CHECK-EVIDENCE.md`
- **MAP_V01_ZONE1_ZONE2_FINAL_COMPLETION_READY** ✅ (2026-10-27)
  - 빅오쇼(big_o_show) Zone 2 EXPLORER 신규 추가 → 최종 Inventory 45개
  - PLACEMENT_TARGETS 9→15개: Zone 1에 오포대·진남관 / Zone 2에 아쿠아플라넷·빅오쇼 추가
  - 기존 9곳 좌표: 7곳 코드 반영 완료 / 엑스포공원·스카이타워 markerPos 없음
  - **BLOCKER**: Founder "전체 좌표 내보내기" 결과 미수신 → 수신 즉시 반영
  - 빌드 ✅ / 639/640 PASS (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-ZONE1-ZONE2-FINAL-COMPLETION-EVIDENCE.md`
  - **Founder 액션 필요**: 브라우저에서 "전체 좌표 내보내기" 클립보드 결과 전달
    → 이순신광장·하멜등대 수정 좌표 + 엑스포공원·스카이타워 좌표 코드 반영 → MAP V0.1 마무리
- **MAP_V01_COMPLETION_LEDGER_READY** ✅ (2026-10-27)
  - Confirmed/Open/Deferred 구분 완료
  - 후보 좌표 → yeosuMapData.js 반영 검증: 전체 반영 완료 (유실 없음)
  - 추가 요청 6곳: 오포대·진남관·아쿠아플라넷 기등록 / 낭만요트·블루요트 금번 등록 / 빅오쇼 미등록(Founder Decision 필요)
  - Evidence: `docs/knowledge/MAP-V01-COMPLETION-LEDGER.md`
  - **Founder 즉시 할 일** (드래그 편집기):
    - `localhost:5000/muyojeong?qa_preview=boundary` → Zone 1 또는 2 진입
    - 지정 필요: **이순신광장·케이블카·엑스포공원·스카이타워·자산공원(재확인)·낭만요트·블루요트** (7곳)
    - E2E 7단계: 자산공원 드래그 → 내보내기 → 종료 후 토글 확인
    - 완료 후 "전체 좌표 내보내기" → 코드야 전달
  - **빅오쇼**: Inventory 미등록 — Founder 등록 여부 결정 필요

**[이전] MAP V0.1 — 낭만요트·블루요트 마커 위치 지정 + Marker Editor E2E Founder 검수**
- **MAP_V01_YACHT_BOARDING_LOCATIONS_RECONCILED** ✅ (2026-10-27)
  - 낭만요트(nangman_yacht)·블루요트(blue_yacht) Zone 2 EXPLORER 신규 추가
  - 탑승 기준: 유탑마리나호텔 앞(오동도로 61-15) — 낭만(정문 오른편)·블루(정문 왼편)
  - 기존 42개 중복 없음 확인 → 최종 Inventory 44개 / TG_READY 12개 유지
  - PLACEMENT_TARGETS Zone 2에 추가 — 드래그 편집기에서 위치 지정 가능
  - 마커 좌표 임의 입력 없음 / SOUL 미편입 / EXPLORER 상태
  - 빌드 ✅ / 639/640 PASS (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-YACHT-BOARDING-LOCATIONS-EVIDENCE.md`
  - **Founder 다음 할 일**: 드래그 편집기에서 낭만요트·블루요트 위치 지정 → 좌표 전달

**[이전] MAP V0.1 Marker Editor E2E — Founder 브라우저 검수 필요**
- **MAP_V01_MARKER_EDITOR_E2E_READY** ✅ (2026-10-27)
  - 편집 모드 화면 단순화: 테스트 사각형·경계선·기존 마커·QA 기준점 숨김
  - 선택 장소명 + x/y + 저장 상태 4단계 패널 항상 표시
  - 저장 상태: 미지정→후보 좌표 있음→내보내기 완료(코드 반영 전)→코드 반영
  - 하단 장소 선택 목록: 편집 모드 시 opacity 0.25 + pointerEvents none
  - 빌드 ✅ / 639/640 PASS (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-MARKER-EDITOR-E2E-EVIDENCE.md`
  - **브라우저 E2E 검증: OPEN** — Founder 직접 확인 필요
  - **Founder 검수 절차**:
    1. `node server.js` 재시작
    2. `http://localhost:5000/muyojeong?qa_preview=boundary`
    3. Zone 2 → 자산공원 선택
    4. 빨간 사각형·경계선·기존 마커 사라짐 확인
    5. 지도 클릭 또는 마커 드래그 → 상태 패널 x/y 변화 확인
    6. "좌표 내보내기" → "내보내기 완료 · 코드 반영 전" 확인
    7. "종료" → 하단 장소 버튼 정상 토글 확인
- **MAP_V01_FINAL_MARKER_CLOSEOUT_VERIFIED** ✅ (2026-10-27)
  - 종포해양공원 조사 결과: 이미 Task 2(SHA `26afeac`)에서 PLACEMENT_TARGETS(9개)에 포함됨
  - package.json 불필요 항목(`"daily-miracles-mvp": "file:.."`) 정리
  - 빌드 ✅ / 테스트 639/640 PASS (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-FINAL-MARKER-CLOSEOUT-EVIDENCE.md`
  - **Founder 직접 지정 필요**: 이순신광장(흰 원) / 엑스포공원·스카이타워·자산공원(마커 없음) / 케이블카(AMBIGUOUS)
- **MAP_V01_DRAGGABLE_MARKER_EDITOR_READY** ✅ (2026-10-27) SHA `431a2eb`
  - Pointer Events(pointerdown/move/up/cancel) + setPointerCapture 드래그
  - 드래그 중: 마커 확대·grabbing 커서·실시간 좌표 라벨
  - 미세 조정 버튼(←→↑↓ ±0.001) + ✕ 재설정 버튼
  - touch-action:none (placementMode 시 모바일 스크롤 억제)
  - 빌드 ✅ 698 modules / 회귀 ✅ 639/640 PASS
  - Evidence: `docs/knowledge/MAP-V01-DRAGGABLE-MARKER-EDITOR-EVIDENCE.md`
  - **브라우저 드래그 검증: OPEN** — Founder 직접 확인 필요
  - **Founder 검수 절차**:
    1. `node server.js` 재시작
    2. `http://localhost:5000/muyojeong?qa_preview=boundary`
    3. Zone 1 또는 Zone 2 진입
    4. 위치 지정 모드 시작 → 장소 선택 → 지도 클릭 → 녹색 마커 등장
    5. **녹색 마커를 마우스로 잡고 드래그** → 실시간 이동 확인
    6. ←/→/↑/↓ 미세 조정 → "전체 좌표 복사" → 코드야에게 전달
- **MAP_V01_PLACEMENT_UX_FIXED** ✅ (2026-10-27) SHA `26afeac`
  - Founder QA 실패 해소: Zone 2 화면에서도 Zone 1 장소 선택 가능
  - **PLACEMENT_TARGETS 9개**: Zone 1(이순신광장·종포해양공원·낭만포차거리·하멜등대) + Zone 2(오동도·케이블카·엑스포공원·스카이타워·자산공원)
  - Zone 1·2 구분 레이블 UI 추가 / 기존 마커 Zone 1·2 모두 표시
  - 빌드 ✅ 698 modules / 회귀 ✅ 639/640 PASS (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-PLACEMENT-UX-FIX-EVIDENCE.md`
  - **Founder 검수 절차**:
    1. `node server.js` 재시작
    2. `http://localhost:5000/muyojeong?qa_preview=boundary` 접속
    3. Zone 1 또는 Zone 2 어느 권역에서나 진입
    4. "📍 마커 위치 지정 모드 시작" → Zone 1·2 장소 모두 선택 가능 확인
    5. 이순신광장·자산공원·케이블카 위치 직접 지정 → "전체 좌표 복사" → 코드야에게 전달
- **MAP_V01_PAINT_MARKER_ALIGNMENT_READY** ✅ (2026-10-27) SHA `9c5c137`
  - 낭만포차(0.593,0.599) / 하멜등대(0.519,0.718) [AMBIGUOUS 해소] / 종포해양공원(0.387,0.509)
  - 재확인 필요: 이순신광장(흰 원) / 자산공원(마커 없음) / 케이블카(AMBIGUOUS)

**[이전] MAP V0.1 Founder 마커 정렬 (1차)**
- **MAP_V01_FOUNDER_MARKER_ALIGNMENT_READY** ✅ (2026-10-27) SHA `f25653f`
  - 이순신광장(0.255,0.540) / 종포해양공원(0.387,0.509) / 낭만포차거리(0.593,0.599) / 하멜등대(0.519,0.718) / 오동도(0.853,0.340) / 자산공원(0.582,0.495)
  - Evidence: `docs/knowledge/MAP-V01-FOUNDER-MARKER-ALIGNMENT-EVIDENCE.md`

**[이전] SOUL MAIN CAR INTENT — Founder 브라우저 확인 1회 필요**
- **SOUL_MAIN_CAR_INTENT_BROWSER_QA_OPEN** (2026-10-27) SHA `e246f40`
  - **API 검증 완료** (서버 PID 25068 / e246f40 반영 / 2026-10-27 10:39):
    - A. '차량으로' → "차를 가져오셨군요." + 케이블카/향일암 parking_ko 통합 ✅
    - D. "주차 정보:" 중복 섹션 없음 ✅ / E. 비차량 쿼리 차량 인트로 없음 ✅
    - F. TG_READY 게이팅 불변 (케이블카/하멜등대/향일암) ✅
  - **브라우저 검증 OPEN**: Founder 로컬에서 `node server.js` 재시작 후 `http://localhost:5000/muyojeong` 접속 → '차량으로' 버튼 클릭 확인
  - 회귀: 639/640 PASS (R20 PRE-EXISTING 유지)
  - Evidence: `docs/knowledge/SOUL-CAR-INTENT-UX-EVIDENCE.md`

**[이전] SOUL CAR INTENT RESPONSE UX**
- **SOUL_CAR_INTENT_RESPONSE_UX_READY** ✅ (2026-10-27) SHA `828ba78`
  - Evidence: `docs/knowledge/SOUL-CAR-INTENT-UX-EVIDENCE.md`

**[이전] MAP V0.1 Final Integration — Founder 브라우저 QA 검수 1회 필요**
- **MAP_V01_FINAL_INTEGRATION_WITH_DEFERRED_MARKERS** ✅ (2026-10-27)
  - **Authorized**: MAP_V01_FINAL_INTEGRATION_AUTHORIZED
  - Evidence: `docs/knowledge/MAP-V01-FINAL-INTEGRATION-EVIDENCE.md`
  - **마커 추가**: Zone 1 TG_READY 4개 + Zone 2 추가 2개 = 총 7개 장소 markerPos.oldtown PROVISIONAL 추가
    - Zone 1: 이순신광장(0.30,0.51) / 낭만포차거리(0.38,0.61) / 하멜등대(0.50,0.68) / 종포해양공원(0.53,0.47)
    - Zone 2: 케이블카(0.69,0.57) / 자산공원(0.65,0.48) / 오동도(0.87,0.28 기존)
  - **양방향 토글**: QA Preview에서 PROVISIONAL 마커 클릭 허용 (일반 사용자 차단 유지)
  - **SOUL 게이팅**: isSelectablePlace(TG_READY 전용) 변경 없음 / EXPLORER 차단 유지
  - **Inventory**: 42개 / TG_READY 12개 / 7개 권역 보존 ✅
  - **빌드**: 698 modules ✅ / **회귀**: 639/640 PASS (R20 PRE-EXISTING 유지) ✅
  - **Deferred**: yeosu_expo_park / sky_tower — QA_OLDTOWN_POSITIONS conflict, 이미지에서 독립 식별 불가
  - **브라우저 미검증 (자동화 불가)**: A~E 토글, I 모바일 → Founder 직접 검수 필요
  - **검수 URL** (1회 제출): `http://localhost:5000/muyojeong?qa_preview=boundary`
    - Zone 1(원도심): 마커 4개 반투명 주황 표시, 클릭→버튼 ON/OFF
    - Zone 2(오동도·엑스포): 마커 3개 표시, 오동도·케이블카·자산공원 토글
    - 일반 화면(qa_preview 제거): 마커 전체 숨김
  - **다음**: Founder VERIFIED 승격 위치 지정 → VERIFIED 마커 → 일반 사용자 마커 활성화

**[이전] SOUL 차량 안내 최소 개선 완료**
- **SOUL_VEHICLE_GUIDANCE_MINIMAL_READY** ✅ (2026-10-27)
  - Evidence: `docs/knowledge/SOUL-VEHICLE-GUIDANCE-MINIMAL-EVIDENCE.md`
  - 향일암: 임포주차장 안내 추가 / 케이블카: 탑승장별 접근 방식 추가

**MAP 마커 안전성 검증 완료**
- **MAP_V01_MARKER_SAFETY_VERIFIED** ✅ (2026-10-27)
  - 단위 테스트 24/24 PASS (`tests/unit/mapMarkerSafety.test.js`)
  - PROVISIONAL 마커 숨김 / 클릭 차단 / SOUL 누출 0건 코드 레벨 검증
  - Evidence: `docs/knowledge/MAP-V01-TOGGLE-MARKER-QA-FIX-EVIDENCE.md` §6
  - 브라우저 검수(Founder): 일반 화면 마커 미표시 / 버튼 토글 / QA Preview 반투명 마커
  - Phase B: 오동도 위치 확인 → 좌표 정밀화 → VERIFIED → 마커-버튼 토글 활성화

**여수 지역별 탐색 V0.1 — 토글·마커 QA Fix → Founder 브라우저 검수 대기**
- **MAP_V01_TOGGLE_AND_MARKER_QA_FIXED** ✅ (2026-10-27)
  - **근본 원인 1**: PROVISIONAL 마커가 일반 화면에 표시됨 — `status` 검사 누락
  - **근본 원인 2**: 오동도 마커(0.87,0.28) ≠ 이미지 실제 위치(추정 0.91,0.24)
  - **수정**: `!isVerified && !isQAPreview → return null` — PROVISIONAL 마커 숨김
  - **수정**: `pointerEvents: isVerified ? undefined : 'none'` — PROVISIONAL 클릭 차단
  - 빌드 ✅ 698 modules / 회귀 615/616 PASS (R20 PRE-EXISTING)
  - Evidence: `docs/knowledge/MAP-V01-TOGGLE-MARKER-QA-FIX-EVIDENCE.md`
  - **Founder 브라우저 검수 필요**:
    - 일반 화면: 지도 마커 미표시 확인
    - 버튼 클릭 → 선택/해제 정상 확인
    - `?qa_preview=boundary` → Zone 2: 반투명 주황 마커(클릭 불가) 확인
  - **Phase B**: Founder 오동도 위치 확인 → 좌표 정밀화 → VERIFIED → 마커-버튼 토글 활성화
- **MAP_V01_ZONE2_BOUNDARY_AND_MARKER_TOGGLE_READY** ✅ (2026-10-26)
  - **INTERACTION_QA_FAILED → 수정 완료 → 브라우저 검수 대기**
- **여수 지역별 탐색 V0.1 — Zone 2 경계 확장 + 마커 토글 완료 → Founder 검수 대기**
- **MAP_V01_ZONE2_BOUNDARY_AND_MARKER_TOGGLE_READY** ✅ (2026-10-26)
  - Zone 2 NW: (0.47,0.30) → (0.47,0.10) — 여수엑스포역 방향 북측 확장
  - 여수엑스포역 QA 마커 좌표: (0.490,0.320) → (0.570,0.080) (시각 재추정)
  - 마커 ↔ 버튼 양방향 토글: selectedPlaces 공유로 이미 동작 / tabIndex+onKeyDown 추가
  - 빌드 ✅ 698 modules / 회귀 615/616 PASS (R20 PRE-EXISTING)
  - 비교 이미지: `docs/knowledge/MAP-V01-ZONE2-EXPO-STATION-EXTENSION-COMPARE.png`
  - Evidence: `docs/knowledge/MAP-V01-ZONE2-EXPO-STATION-EXTENSION-EVIDENCE.md`
  - **Founder 확인 필요**: Zone 2 북측 경계가 엑스포역을 충분히 포함하는지 + 오동도 마커 위치
- **MAP_V01_ZONE2_BOUNDARY_CORRECTION_READY** ✅ (2026-10-26)
- **MAP_V01_ZONE2_BOUNDARY_CORRECTION_READY** ✅ (2026-10-26)
  - SE (0.80,0.82)→(0.74,0.63): 돌산 방향 침범 제거
  - NW (0.57,0.38)→(0.47,0.30): 여수엑스포역 포함 추정 (UNKNOWN exact)
  - 비교 이미지: `docs/knowledge/MAP-V01-ZONE2-BOUNDARY-CORRECTION-COMPARE.png`
  - 빌드 ✅ 698 modules / 회귀 615/616 PASS (R20 PRE-EXISTING)
  - **Founder 확인 필요**: S boundary y=0.63이 돌산을 충분히 제외하는지 + 엑스포역 NW 위치
- **MAP_V01_SEVEN_ZONE_VISUAL_QA_RECORDED** ✅ (2026-10-26)
  - SVG 렌더링 확인(빨간 테스트 사각형), Zone 1·2 QA 배너·경계선 표시 확인
  - Zone 3~7 overview 가독성 이슈: Phase 2 backlog 등록
  - 권역 간 장소 선택 누적: 의도된 설계 확인 (routePlaces 공유)
- **MAP_V01_BOUNDARY_RENDER_ROOT_CAUSE_RESOLVED** ✅ (2026-10-26)
  - **근본 원인**: Express가 `dist/` 빌드 서빙 → `import.meta.env.DEV=false` → QA 항상 비활성
  - **수정**: `hostname==='localhost'||'127.0.0.1'` 조건으로 교체 → 빌드된 파일에도 정상 동작
  - 테스트 사각형 SVG(빨간 점선) 추가 → SVG 레이어 렌더링 자체 검증용
  - ZoneOverview imageId 필터 추가 → overview 이미지에 oldtown 좌표 오버레이 방지
  - 빌드 ✅ 698 modules / 회귀 615/616 PASS (R20 PRE-EXISTING 유지)
  - **검수 URL**: `http://localhost:5000/muyojeong?qa_preview=boundary`
    → 지역별 보기 → 원도심 or 오동도·엑스포 → 빨간 점선 테두리 + 경계 점선 + 마커 확인
  - Evidence: `docs/knowledge/MAP-V01-BOUNDARY-RENDER-ROOT-CAUSE-EVIDENCE.md`
- **MAP_V01_BOUNDARY_FOUNDER_QA_VIEW_READY** ✅ (2026-10-26)
- **MAP_V01_OLDTOWN_BOUNDARY_OVERLAY_READY** ✅ (2026-10-26)
  - `docs/knowledge/MAP-V01-OLDTOWN-BOUNDARY-OVERLAY.png` — Founder 검수용 이미지
  - Zone 1(청록 점선)·Zone 2(주황 점선) PROVISIONAL 경계 + 장소 마커 동시 표시
  - GPS 확인 장소(파란 원) / 충돌 가능(노란 원) / 미검증 추정(회색 원) / 기준점(금색★)
  - ⚠ 엑스포공원·스카이타워가 Zone 1/2 분리선 서쪽에 표시 — 경계 재조정 필요 가능성
  - Evidence: `docs/knowledge/MAP-V01-OLDTOWN-BOUNDARY-OVERLAY-EVIDENCE.md`
  - F-1~F-7 Founder 검수 항목 정의
  - 코드 변경 없음 / status:UNVERIFIED 유지 / 원본 PNG 미변경
- **MAP_V01_OLDTOWN_BOUNDARY_VISUAL_QA_READY** ✅ (2026-10-26)
  - `docs/knowledge/MAP-V01-OLDTOWN-BOUNDARY-VISUAL-QA.md`
  - oldtown 이미지(1564×1006) 기준 Zone 1·2 장소 추정 좌표 + PROVISIONAL 경계 후보
  - 오동도(x=0.87,y=0.28) 단일 기준점 역산 → 전체 추정 좌표 도출 (고불확실도)
  - V-1~V-7 Founder 검수 항목 정의 (이순신광장/하멜등대/오동도 위치 확인 요청)
  - 코드 변경 없음 / 사용자 화면 변화 없음 / status:UNVERIFIED 유지
- **MAP_V01_ZONE2_DETAIL_MAP_CORRECTED** ✅ (2026-10-26) SHA `5be807f`
  - Zone 2 hasDetailMap: true / boundary.imageId: yeosu-oldtown-v01 (FOUNDER_ZONE2_DETAIL_MAP_REUSE_APPROVED)
  - 오동도 마커(zone=2) → Zone 2 ZoneDetail에서 zone 필터로 자동 표시
  - Zone 1 oldtown 유지 / Zone 3~7 overview 유지
- **MAP_V01_ZONE1_BOUNDARY_PROVISIONAL_READY** ✅ (2026-10-26) — `docs/knowledge/MAP-V01-ZONE1-BOUNDARY-PROVISIONAL.md`
  - 이미지별 역할 분리: overview/oldtown 독립 좌표계
  - Zone 1 지리 범위 분석 (확정 5곳 기준)
  - PROVISIONAL 폴리곤 추정 (overview용, 고불확실도 — Founder 보정 필요)
  - B-1a~B-3 Founder 확인 항목 정의
  - **현재 코드 변경 없음** (status: UNVERIFIED 유지, 사용자 화면 변화 없음)
- **MAP_V01_ZONE_DETAIL_PREVIEW_READY** ✅ (2026-10-26) SHA `6d51f72`
  - Zone 2~7 ZoneDetail 진입 시 overview 이미지 미리보기 추가 (Fix-A)
  - height:200px + CSS aspectRatio:1206/1304 → width 자동 ~185px → 비율 보존·크롭 없음
  - objectFit:fill + SVG viewBox="0 0 1 1" → 동일 좌표계 / pointerEvents:none
  - VERIFIED boundary → 금빛 점선 표시 / UNVERIFIED → 이미지만 (현재 전체 UNVERIFIED)
  - Zone 1 oldtown 지도 + Phase A 마커 기존 동작 완전 유지
- **MAP_V01_BOUNDARY_SCAFFOLD_READY** ✅ (2026-10-26) SHA `58b7bbc`
  - `boundary{imageId/points/status/source}` 7개 Zone 전체 추가 (전체 UNVERIFIED)
  - ZoneOverview SVG 오버레이 + 카드 hover 강조 구현
  - Evidence: `docs/knowledge/MAP-V01-BOUNDARY-SCAFFOLD-EVIDENCE.md`
- **MAP_V01_BOUNDARY_DESIGN_READY** ✅ (2026-10-26) — `docs/knowledge/MAP-V01-BOUNDARY-DESIGN.md`
- **MAP_V01_GEO_2_ZONE_5_APPLIED** ✅ (2026-10-26) SHA `fcd1e28`
  - settler_cactus: Zone 6(화양)→5(소호·장도). 법인주소=소라면 논골안길 20-9.
  - Zone 5: 5→6곳 / Zone 6: 6→5곳 (예상값 일치)
- **MAP_V01_FOUNDER_ADDRESS_EVIDENCE_APPLIED** ✅ (2026-10-26) SHA `4f8d411`
  - GEO-1 nk_submarine Zone 5→3 / GEO-3 artland_resort Zone 6→3 / GEO-4 bonghwangsan Zone 6→3
- **MAP_V01_FC_IMPLEMENTATION_READY** ✅ SHA `63bd640`

**최종 Inventory 상태:**
- Zone 1 (8곳, TG_READY 4): 이순신광장·낭만포차·하멜등대·고소동·수산시장·진남관·오포대·종포해양공원
- Zone 2 (10곳, TG_READY 5): 오동도·케이블카·엑스포공원·스카이타워·자산공원·아쿠아플라넷·엑스포역·바닷길·만성리·오션크루즈
- Zone 3 (8곳, TG_READY 2): 돌산대교·돌산공원·무슬목·갓장터·돌산탑승장·nk_submarine·bonghwangsan·artland_resort
- Zone 4 (1곳, TG_READY 1): 향일암
- Zone 5 (6곳, TG_READY 0): 장도·소호요트장·소호동동다리·이순신마리나·유월드루지·서틀러다육식물원
- Zone 6 (5곳, TG_READY 0): 가사리·여자만·섬달천·화양드라이브·장척갯벌
- Zone 7 (3곳, TG_READY 0): 사도·하화도·화정도서
- **합계: 41곳 표시 + 1 hidden(중앙시장) = 42곳 / TG_READY 12개**
- **Production 미배포** ← 브랜치: `docs/pr133-state-sync`

**남은 작업:**
- Founder → `localhost:5100/muyojeong` → Zone 2 오동도·엑스포권 선택 → oldtown 이미지 + 오동도 마커 확인
- Founder → §5 PROVISIONAL 폴리곤(overview, Zone 1) 시각 확인 → 위치 보정 피드백
- Founder B-1a~B-3 확인 → 좌표 정밀화 → PROVISIONAL 적용 → 검수 → VERIFIED 승격
- PR #134 merge 승인 → Production 반영

**이전 Current Next Action (2026-10-26 이전):**
**여수 지역별 탐색 V0.1 — Founder 오동도 마커 위치 확인 대기**
- **MAP_V01_BROWSER_ASSET_VERIFIED** ✅ (2026-10-26) — SHA `e97b4c7`
  - 원인: `app.use('/images', 404)` (line 296)이 `static(dtFrontendPath)` 보다 먼저 차단
  - 수정: `/images/muyojeong` 전용 라우트를 `/images/soul` 패턴과 동일하게 추가
  - 검증: overview 200 image/png ✅ / oldtown 200 image/png ✅
- **MAP_V01_PHASE_A_PREVIEW_READY** ✅ (2026-10-26) — SHA `72bd8bc`
  - 오동도 마커 1개(PROVISIONAL): oldtown 이미지 x:0.87, y:0.28 흰 점
  - padding-top 64.32% 비율 컨테이너: 종횡비 보존 → objectFit:fill → 크롭 없음
  - 마커 클릭 → isSelectablePlace() → toggleRoutePlace (TG_READY 게이팅 재사용)
  - 로컬 확인: `localhost:5000/muyojeong` → 지역별 보기 → 원도심 → 지도+오동도 점
  - **Founder 위치 확인 전 VERIFIED 승격 금지**
- **MAP_V01_MARKER_PLAN_READY** ✅ (2026-10-26) — SHA `3f2c049`
- **MAP_V01_IMAGE_BINDING_READY** ✅ (2026-10-26) — SHA `03b18f0`
- **MAP_V01_UI_STRUCTURE_READY** ✅ (2026-10-26) — SHA `240374a`
- **ASSET_PATH_VERIFIED** ✅ (2026-10-26) — SHA `8ad8ba2`
- **남은 Blocker**:
  - Founder 오동도 마커 위치 확인 → Phase B(엑스포·돌산대교) 또는 위치 조정
  - 여수 수산시장 UV-2 — 좌표 미검증 (placeholder 처리됨)
- **MAP_V01_PREPARATION_READY** ✅ (2026-10-26) — `docs/knowledge/MAP-V01-PREPARATION-EVIDENCE.md`
- **MAP_V01_DECISION_SHEET: FOUNDER_APPROVED** ✅ (2026-10-26) — `docs/knowledge/MAP-V01-DECISION-SHEET.md`
- **PR #134 OPEN** — docs/pr133-state-sync (상태 동기화 포함). Founder merge 승인 필요
- **맞춤 항로 V0.1: PRODUCTION_QA_CLOSED** ✅ (2026-10-25 17:17 KST) SHA `425a643`

**구현 금지:**
- 지도 배경 없이 완성된 서비스 배포 / PR #134 임의 병합 / Production 배포 / DB·Schema 변경 / CAR GOVERNANCE_HOLD 해제

---

### MAP V0.1 인계 스냅샷 (2026-10-26) — 새 담당자 시작점

> 새 세션/담당자는 이 섹션부터 읽는다. Confirmed 항목은 충돌 Evidence 없이 재조사하지 않는다.

#### 브랜치 / 코드 위치

| 항목 | 값 | 상태 |
|------|-----|------|
| 작업 브랜치 | `docs/pr133-state-sync` | PR #134 OPEN (Founder merge 대기) |
| main HEAD (Production) | `425a643` | Render 배포 완료 |
| UI 구현 커밋 | `240374a` | Confirmed ✅ |
| 이미지 추가 커밋 | `8ad8ba2` | Confirmed ✅ |
| working tree | 클린 (`client/` 미추적만 존재) | Confirmed ✅ |

#### UI 구현 파일 (SHA `240374a`)

| 파일 | 유형 | 비고 |
|------|------|------|
| `dreamtown-frontend/src/constants/yeosuMapData.js` | NEW | 35개 장소 + 7개 권역 상수 |
| `dreamtown-frontend/src/components/YeosuMapSelector.jsx` | NEW | 권역 카드 → 장소 탐색 UI |
| `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx` | EXTEND | "지역별 보기" 토글 추가 (기존 로직 무변경) |

#### 이미지 정본 경로 (SHA `8ad8ba2`)

| 파일 | 정본 경로 | 브라우저 URL |
|------|----------|-------------|
| `yeosu-overview-v01.png` | `dreamtown-frontend/public/images/muyojeong/map/` | `/images/muyojeong/map/yeosu-overview-v01.png` |
| `yeosu-oldtown-v01.png` | 동일 | `/images/muyojeong/map/yeosu-oldtown-v01.png` |
| 원본 보존 (접근 불가) | `client/public/images/dreamtown/maps/` | Express 미등록 — URL 없음 |

#### Founder 승인 결정 (OI-MAP-1~5) — Confirmed

| 항목 | 결정 | 근거 문서 |
|------|------|----------|
| OI-MAP-1 | 중앙시장 지도 미표시 (TG 전면 제외 유지) | `docs/knowledge/MAP-V01-DECISION-SHEET.md` |
| OI-MAP-2 | 고소동·수산시장 EXPLORER 표시, SOUL 자동 승격 금지 | 동일 |
| OI-MAP-3 | 7개 권역 전체 표현, 원도심 우선 상세 | 동일 |
| OI-MAP-4 | 신뢰 출처 조사 허용 (Founder 수동 측정 불필요) | 동일 |
| OI-MAP-5 | 배편 배지 표시 + SOUL 추천 제외 | 동일 |

#### 미해결 항목 (Pending)

| ID | 항목 | 상태 | 조치 |
|----|------|------|------|
| UV-2 | 여수 수산시장 lat/lng | 🟡 미검증 | placeholder 처리됨. Kakao Geocoding 또는 Founder 측정 |
| UV-3 | 권역 bounding box 정확도 | 🟡 추정값 | 이미지 수령 후 캘리브레이션 |
| — | 지리적 정합성 검증 + 마커 캘리브레이션 | ⏸ 별도 단계 | 다음 Current Next Action 착수 전 설계 |

#### 유지 중인 HOLD

| HOLD | 내용 |
|------|------|
| CAR GOVERNANCE_HOLD | `_estimateTravelTime()` V0 Stub 유지. 해제 금지. |
| SOUL 자동 승격 금지 | EXPLORER 장소를 TG_READY로 자동 변경 금지 (OI-MAP-2) |
| Production 배포 금지 | 지도 배경 없이 완성된 서비스로 배포 금지 |

#### Production 변경 여부

MAP V0.1 구현(`240374a`, `8ad8ba2`)은 **PR #134 미병합 상태** — Production에 반영되지 않음.  
Production SHA: `425a643` (맞춤 항로 V0.1, 2026-10-25).

#### Evidence 경로

| 문서 | 내용 |
|------|------|
| `docs/knowledge/MAP-V01-DECISION-SHEET.md` | OI-MAP-1~5 Founder 결정 + 35개 인벤토리 |
| `docs/knowledge/MAP-V01-PREPARATION-EVIDENCE.md` | 좌표 검증 + 이미지 경로 + 지리 정합성 §8 |
| `docs/knowledge/MAP-V01-YEOSU-PLACE-INVENTORY.md` | 35개 장소 상태 분류 원본 |
| `docs/knowledge/MAP-V01-MARKER-PLAN.md` | 마커 설계 + Phase A~C + 35↔SOUL13 연결 확인 |

#### 새 담당자 시작 순서

```
1. 이 섹션 읽기 (완료)
2. docs/knowledge/MAP-V01-PREPARATION-EVIDENCE.md §7·§8 확인
3. docs/knowledge/MAP-V01-MARKER-PLAN.md — Phase A~C 분류 및 35↔SOUL13 연결 확인
4. dreamtown-frontend/src/constants/yeosuMapData.js — odongdo.markerPos 구조 파악
5. dreamtown-frontend/src/components/YeosuMapSelector.jsx — ZoneDetail 마커 레이어 파악
6. 다음 작업: Founder 오동도 마커 위치 확인 후 Phase B 진행
```

---

**[ARCHIVE] 이전 Current Next Action**

**PR #134 Founder merge 승인 — docs/pr133-state-sync State Sync 완료**
- **맞춤 항로 V0.1: PRODUCTION_QA_CLOSED** ✅ (2026-10-25 17:17 KST)
  - SHA `425a643` / Deploy `dep-dberknvavr4c73btaoj0`
  - "4시간 30분 정도 시간이 있으시군요." ✅ VERIFIED
  - FINDING TIME_LABEL: **RESOLVED** ✅ (기존 "5시간" 오류 완전 해소)
  - travel_time_unverified: 유지 (향일암→케이블카 미검증) / CAR GOVERNANCE_HOLD: 유지
- **PR #134 OPEN** — docs/pr133-state-sync (docs-only State Sync)
  - Evidence: CUSTOM-ROUTE-V01-HTTP-GATE, CUSTOM-ROUTE-V01-PRODUCTION-QA 포함
  - Tests: soulCustomRouteV01HttpGate + soulTimeLabelDisplay 포함
  - 임의 병합 금지 / Founder merge 승인 필요
- **PR #133 MERGED** ✅ SHA: `425a643` / 2026-10-25T08:02:51Z
  - TL-1~7 7/7 PASS ✅ / 회귀 615/616 ✅ / 변경: soyeowoolService.js:1785만
- **UI Visual QA**: PASS ✅ (T1~T7, 2026-10-25, `localhost:5000/muyojeong`)
- **Code-level integration review**: PASS ✅ (5/5 CODE_VERIFIED)
- **Runtime Service Integration**: PASS ✅ MR-1~MR-6 6/6 — `soulCustomRouteV01Integration`
  - MR-2 향일암→hyangiram PLACE_ALIAS_MAP ✅ / MR-4 270분 치환없음 ✅ / MR-5 Time Gate 미발동 ✅
- **HTTP Integration (supertest)**: PASS ✅ HT-1~HT-8 8/8 — `soulCustomRouteV01HttpGate` (2026-10-25)
  - 실제 JWT 인증 미들웨어 실행 ✅ / session_id 응답 ✅ / must_visit=[hamel,hyangiram] ✅ / time=270 ✅
  - sessionService.createSession MOCKED (운영 DB INSERT 없음) / GPT MOCKED
  - Evidence: `docs/knowledge/CUSTOM-ROUTE-V01-HTTP-GATE-EVIDENCE.md`
- **Production QA**: PR133_PRODUCTION_QA_PASS ✅ (2026-10-25 17:17 KST, SHA `425a643`, Deploy `dep-dberknvavr4c73btaoj0`)
  - 하멜등대+향일암 포함 ✅ / 이동 45분(P2) ✅ / travel_time_unverified ✅ / 체류 195분 ✅
  - Evidence: `docs/knowledge/CUSTOM-ROUTE-V01-PRODUCTION-QA-EVIDENCE.md`
- **PR #131 MERGED** ✅ SHA: `98550fb` / 2026-10-25T06:41:56Z / Founder Conditional Merge Authorization
  - 빌드: ✅ / 회귀: 566/567 PASS (R20 PRE-EXISTING) / 신규 API·DB 없음
  - MuyojeongHomePage.jsx V1.3: 장소 칩 8+4 / 시간 직접입력 / CTA
- **PR #130: MERGED** ✅ @`2026-10-25T04:26:14Z` — Production Deploy LIVE + Post-Deploy QA §12
- **'소원이 직접 입력형 맞춤 항로 V0.1' 분석·설계·구현: COMPLETE** ✅
- **Travel Time UI V0.1 + Stay Time DB Update V0.1: PRODUCTION LIVE** ✅
  - Production LIVE SHA: **`75223a6`**
  - Deploy ID: `dep-dbenuu0ae00c73dovmq0`
  - LIVE 확인: 2026-10-25 13:05 KST (Founder 수동 배포)
- **Post-Deploy QA: 3/3 PASS** ✅
  - 2h → fits_comfortably (total=105 < 120) ✅
  - 5h → budget_exceeded (estimated.min=307 > 300) ✅
  - 8h → fits_comfortably (estimated.min=436, total=466 < 480) ✅
  - hamel_lighthouse=30 / hyangiram=120 Production 반영 확인 ✅
  - travel_time_unverified 오판정 없음 (unknown_travel_segments=0 for all) ✅
- **Migration 207: DEPLOYED_AND_VERIFIED** ✅ (2026-10-25T03:49:24Z)
  - hamel_lighthouse: NULL → **30** ✅ / hyangiram: 90 → **120** ✅
  - Evidence §11~§12: `docs/knowledge/TRAVEL-PLACES-STAY-TIME-V01-EVIDENCE.md`
- **CAR GOVERNANCE_HOLD**: 유지 / `_estimateTravelTime()` V0 Stub 유지
- **R20 PRE-EXISTING**: dolsan_daegyo JOURNEY_CONTINUITY (무관)
- **PR #121 MERGED** @ `f61fc5b` (2026-10-25 KST) — Stay Time DB Update V0.1
  - fitStatus 3방향: travel_time_unverified / budget_exceeded / fits_comfortably
  - 46/46 PASS (T-1~T-29) / R20 PRE-EXISTING
- **PR #120 CLOSED** — superseded by PR #121 (2026-10-25)
- **5h(307>300) → budget_exceeded** ✅ / **8h(436<480) → fits_comfortably** ✅
- **8h meal+café(466<480) → fits_comfortably, 잔여 14분** ✅
- **PR #118 MERGED** @`8aaeccd` (2026-10-25 KST) — Travel Time UI V0.1
  - `_estimateTravelTime()` V0 Stub 미변경 / CAR GOVERNANCE_HOLD 유지
- **Production LIVE**: `75223a6` (dep-dbenuu0ae00c73dovmq0 / 2026-10-25 13:05 KST) ✅
- **hamel_lighthouse avg_stay_minutes**: **30분** ✅ (Production DB 반영 완료)
- **hyangiram avg_stay_minutes**: **120분** ✅ (Production DB 반영 완료)
- **Production QA**: 5h estimated.min=307(budget_exceeded) / 8h estimated.min=436(fits_comfortably) ✅
- **EVIDENCE-B-001** (2026-10-24): `docs/knowledge/EVIDENCE-B-001_Hotel_Nighttime_Walk_V0_1_Implementation.md`
- **IMPL-PLAN-B-001** (2026-10-24): `docs/knowledge/IMPL-PLAN-B-001_Hotel_Nighttime_Walk_V0_1.md`
- **PREFLIGHT-PHASE-B-001** (2026-10-24): `docs/knowledge/PREFLIGHT-PHASE-B-001_Hotel_Nighttime_Walk.md`
- **PILOT-INTENT-002 Phase A: PARTIAL COMPLETE** (2026-10-24)
  - 신라스테이→이순신광장 CAR 5분/1.9km / WALK 26분/1.7km — Founder 네이버 지도 캡처, 2026-10-24
  - 저장: `docs/knowledge/PILOT-INTENT-002_Hotel_to_Starlight_Answer_Gap.md`
- **PILOT-INTENT-001** (2026-10-24): 8개 키워드 SOUL 커버리지 분석 — `docs/knowledge/PILOT-INTENT-001_Traveler_Intent_8Keywords.md`
- **CAND-EXP-002-B** (2026-10-24): 별빛항로 현지 경험 Candidate — `docs/constitution/candidate/CAND-EXP-002_Starlight_Route_Local_Experience.md`
- **PR #111 MERGED** @`bbb5b96` — CAR_INFO Separation V0.1 (2026-10-23 KST)
  - "차량으로" chip: course=null + TIME_OPTIONS 제거 + parking_ko 보존
  - `_isCarInfoQuery`: 차로/자차로/차량으로 + 가기/이동/주차정보 → COURSE_PLANNING과 분리
  - Required CI: AIL Gate ✓ / docker-smoke ✓ / Vercel FAILURE (PRE-EXISTING, Node.js 20.x)
  - CI-1~CI-7: 7/7 PASS / T1-T18: 18/18 PASS / soul 475/476 PASS (R20 PRE-EXISTING)
  - main HEAD: `bbb5b96` / Production: NOT DEPLOYED
- **PR #109 MERGED** @`997dfdc` — COURSE_PLANNING Time Gate V0.1 (2026-10-23 KST)
  - 로컬 테스트: T1-T18 18/18 PASS / soul 전체 138/139 PASS (R20 PRE-EXISTING)
- **CourseDisplay DEPLOYED_AND_VERIFIED** — 8/8 PASS (2026-10-23)
- Production SHA: `696839a` / Deploy: `dep-dbd790mq1p3s73coua40` / LIVE: 2026-10-23 05:42 KST
- **PR #103** @`d40586a` — MuyojeongHomePage CourseDisplay CONNECT ✓
- **PR #104** @`8ce8dfb` — stay_minutes null guard REPAIR ✓ (하멜등대 "null분 체류" 해결)
- **PR #105** @`696839a` — Project State sync ✓
- Evidence: `docs/architecture/SOUL_COURSE_DISPLAY_PRODUCTION_VERIFICATION_V1.md`
- 여수 SOUL Phase 1 완료: 이순신광장/향일암/오동도/케이블카/돌산공원/돌산대교/종포해양공원/하멜등대 (8/10)
- R20 PRE-EXISTING FAIL (UNRESOLVED): dolsan_daegyo "걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY
- **P-NEW-1 Explicit Place Preservation V0.1: DEPLOYED_AND_VERIFIED (2026-10-22)**
  - PR #99 Squash Merge SHA: `4af1709aceab0479a3be0fc33d4850f73609e02a`
  - Production SHA: `292a6b0d7f78cde00f5e045203b3ea97d5900912` / Deploy: `dep-dbcqt70m7kps73cl2ha0` / LIVE: 2026-10-22 KST
  - T1 케이블카+오동도: SUCCESS — cablecar ✓ / odongdo ✓ / PASS
  - T2 이순신광장+하멜등대: SUCCESS — lee_soon_shin_plaza ✓ / hamel_lighthouse ✓ / PASS
  - T3 오동도 단일 코스: SUCCESS / PASS (회귀 없음)
  - T4 1시간+4장소: JOURNEY_CONTINUITY / ADVISORY (PRE-EXISTING, 신규 회귀 아님)
  - T5 부산 CITY_UNSUPPORTED: PASS (G1 회귀 없음)
  - T6 Health Check: HTTP 200 / PASS
  - Evidence: `docs/architecture/SOUL_P_NEW_1_EXPLICIT_PLACE_PRESERVATION_DEPLOYMENT_EVIDENCE_V1.md`
- G1 City Detection V0.1: CLOSED — DEPLOYED_AND_VERIFIED (2026-10-22, PR #96 / `b6c0597`)
- CAND-EXP-003 소원 우선 적응형 여행코스: PR #97 OPEN (Founder 검토 대기)
- Parking Option B 구현: 미착수 — 장소코드 확정 및 Founder 별도 승인 대기
- 여수 SOUL Phase 1 완료: 이순신광장 / 향일암 / 오동도 / 케이블카 / 돌산공원 / 돌산대교 / 종포해양공원 / 하멜등대 (8/10)
- R20 PRE-EXISTING FAIL (UNRESOLVED): dolsan_daegyo "걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY

---

### 완료된 작업 기록 (2026-10-19)

- **하멜등대 SOUL Phase 1 Minimal: CLOSED — DEPLOYED_AND_VERIFIED (2026-10-19)**
  - Founder Decisions: Q1 (독립 place_code hamel_lighthouse) / Q2 (experience_ko Founder 승인 문구) / Q3 (하멜전시관 운영정보 격리) / Q4 (미검증 정보 생성 금지) / Q5 (여수지방해양수산청 공식 좌표)
  - Code PR #88 Squash Merge SHA: `8c4c07fcf2e5735d9a9abe87dca5bda7b785c9e6` / KST 2026-10-19
  - Production SHA: `8c4c07fcf2e5735d9a9abe87dca5bda7b785c9e6` / Deploy: `dep-dbaqqkfbtjjs73886i9g` / LIVE: 14:43 KST
  - Production DB: travel_places id=15, COMMITTED (14/14 필드 Seed 일치)
  - Scope: HML-1 (PLACE_ALIAS_MAP) + HML-2 (_PLACE_KNOWLEDGE) + HML-3 ("어때요" LDF) + HML-4 (scope guard) + HML-5~6 (_CONV_GOLDEN_KO + _extractGoldenPlaceCode) + HML-7~8 (DB + Seed)
  - 신규: soulHamelLighthousePhase1.test.js 26/26 PASS
  - 회귀: 295/295 PASS / 합계 321/321 PASS
  - Production Runtime QA: 10/10 PASS
  - 하멜등대 ↔ 하멜전시관 격리 확인: QA-3/4/5 미검증 정보 미노출 / QA-6/7 marine_park hamel_hours_ko 정상
  - Level B 격리 유지 (QA-10 "이어지는 여정" 미노출)
  - Evidence: `docs/architecture/SOUL_HAMEL_LIGHTHOUSE_PHASE1_CLOSURE_EVIDENCE_V1.md`
  - 제외: 운영시간·전화번호·입장료 / JOURNEY_PREFERENCE / Companion Chip / Level B / EP02 / R20 / P-2 / P-6

- **종포해양공원 SOUL Phase 1 Minimal: CLOSED — DEPLOYED_AND_VERIFIED (2026-10-19)**
  - Founder Decisions: Q1 (experience_ko Founder 승인 문구 — 미검증 수치 제거) / Q2 (하멜등대 미추가) / Q3 (하멜전시관 PSQ 포함)
  - Scope Audit: hamel 분기 위치 이동 → `WITHIN_INTENT_BUT_SCOPE_EXPANDED` Founder 수용
  - Code PR #86 Squash Merge SHA: `11fac2c21e2393128100f24e59579a42ff52cb64` / KST 2026-10-19
  - Production SHA: `11fac2c21e2393128100f24e59579a42ff52cb64` / Deploy: `dep-dbapag61egvs73bjo1l0` / LIVE: 13:00 KST
  - Scope: MRP-1 (experience_ko) + MRP-2 (marine_park "어때요" LDF) + MRP-3 (하멜전시관 PSQ routing fix)
  - 신규: soulMarineParkPhase1.test.js 27/27 PASS
  - 회귀: Cablecar 52 / DolsanPark 33 / DolsanBridge 15 / LevelB 14 = 114/114 PASS / 합계 141/141 PASS
  - Production Runtime QA: 10/10 PASS
  - QA-8: "하멜등대 어때요?" → CLARIFICATION (marine_park 오매핑 없음 확인)
  - Evidence: `docs/architecture/SOUL_MARINE_PARK_PHASE1_CLOSURE_EVIDENCE_V1.md`
  - 제외: 하멜등대 별칭 / JOURNEY_PREFERENCE / Companion Chip / parking / R20 / P-2 / P-6

- **SOUL Option 2 Level B — Inter-Place Emotional Continuity: CLOSED — DEPLOYED_AND_VERIFIED (2026-10-19)**
  - Founder Decisions: 5-place scope / JOURNEY_ADD 전용 / Option A (inline emotional_role) / 향일암 제외
  - Code PR #84 Squash Merge SHA: `855f6eb118df36d7d90caadb6029da55db7c9ce6` / KST 07:21
  - Production SHA: `855f6eb118df36d7d90caadb6029da55db7c9ce6` / Deploy: `dep-dbakl2om7kps7397r0fg` / LIVE: 07:41 KST
  - Scope: emotional_role (5곳) + _CONV_GOLDEN_KO 확장 + _extractGoldenPlaceCode 확장 + JOURNEY_ADD 전환 문장 로직
  - 적용 장소: cablecar(상승/시야확장) / odongdo(재충전/자연회복) / dolsan_nightscape(여운·다짐·마무리) / marine_park(쉼/정리·고요함) / dolsan_daegyo(흐름·전환)
  - 신규: soulLevelBEmotionalContinuity.test.js 14/14 PASS
  - 신규 회귀: 0건 (Soul 전체 93/94 — R20 PRE-EXISTING)
  - Production Runtime QA: 13/13 PASS (전환 문장 3조합 직접 검증)
  - 실제 전환 문장 예: "케이블카의 상승에서, 오동도의 재충전으로 이어지는 여정이에요."
  - Evidence: `docs/architecture/SOUL_LEVEL_B_EMOTIONAL_CONTINUITY_CLOSURE_EVIDENCE_V1.md`
  - 제외: JOURNEY_MULTI_PLACE 등 비JOURNEY_ADD 분기 / 향일암 Level B / DB·Schema / R20

### 완료된 작업 기록 (2026-10-18)

- **Dolsan Bridge SOUL Phase 1 Minimal: DEPLOYED_AND_RUNTIME_VERIFIED — CLOSURE_PR_OPEN (2026-10-18)**
  - Founder Decisions: experience_ko Founder 직접 문구 / Option A-1 Minimal / R20 제외
  - Code PR #81 Squash Merge SHA: `3fb07234701c6ae4cbae004b6ac916610d40d0df` / KST 15:26
  - Production SHA: `3fb07234701c6ae4cbae004b6ac916610d40d0df` / Deploy: `dep-dba6jpvbtjjs73e0b5fg` / LIVE: 15:43 KST
  - Scope: DB-1 (experience_ko Founder 승인 문구 — 흐름·전환) — 기존 PLACE_LOOKUP 경로 재사용
  - 신규: soulDolsanBridgePhase1.test.js 15/15 PASS
  - 회귀: 신규 0건 (기존 failing 대비 P-1+P-2 개선)
  - Production Runtime QA: 13/13 PASS / R20 PRE-EXISTING FAIL UNRESOLVED
  - Evidence: `docs/architecture/SOUL_DOLSAN_BRIDGE_PHASE1_CLOSURE_EVIDENCE_V1.md`
  - 제외: LDF 분기 / PSQ 라우팅 / JOURNEY_PREFERENCE / R20 / DB·Schema — Phase 2 후보

- **Dolsan Park SOUL Phase 1 Minimal: CLOSED — DEPLOYED_AND_VERIFIED (P-2 ADVISORY TRACKED, 2026-10-18)**
  - Founder Decisions: D-1 (experience_ko Founder 직접 문구) / D-2 (Option A Minimal)
  - PR #78 Squash Merge SHA: `deec9225213c7a6fe553304992031350168a3893`
  - Production SHA: `deec9225213c7a6fe553304992031350168a3893` / Deploy: `dep-dba4gg2jnfac73eb1ke0` / LIVE: 13:19 KST
  - Scope: E1a (experience_ko Founder 승인 문구) + E2a (dolsan_nightscape "어때요" LDF 분기)
  - 신규: soulDolsanParkPhase1.test.js 33/33 PASS
  - 회귀: Cablecar 52 / Hyangiram 66 / Odongdo 57 / YiSunSin 39 / CaseC 21 = 235/235 PASS
  - Production Runtime QA: 10/11 PASS / P-2 ADVISORY (별칭+어때? → PLACE_LOOKUP 우선, parking_ko 미도달, PRE-EXISTING)
  - P-9 R20 Baseline: dolsan_daegyo JOURNEY_CONTINUITY — 기존 실패 동일 (PRE-EXISTING FAIL, 미해결)
  - Evidence: `docs/architecture/SOUL_DOLSAN_PARK_PHASE1_CLOSURE_EVIDENCE_V1.md`
  - 제외: JOURNEY_PREFERENCE / Companion Chip / parking_trust / dolsan_daegyo / DB·Schema — Phase 2 후보

- **Cablecar SOUL Phase 1 Minimal: CLOSED — DEPLOYED_AND_VERIFIED (2026-10-18)**
  - PR #74 Squash Merge SHA: `7951fd0cee8ba9d3bfebf1359f4401b9003f8db8`
  - Production SHA: `f446328491aebd037ed40229c55d229bf9c81b43` / Deploy: `dep-dba2njfavr4c73fu5rc0` / LIVE: 11:18 KST
  - Scope: C1a (experience_ko) + C2a ("어때요" PSQ 분기) — Founder C-1/C-5 승인 문구 정확 반영
  - 신규: soulCablecarPhase1.test.js CBL-1~CBL-9 + GV-01~GV-07 52/52 PASS
  - 회귀: Hyangiram 66 / Odongdo 57 / YiSunSin 39 / CaseC 21 = 183/183 PASS
  - Production Runtime QA: 8/9 PASS / P-6 ADVISORY (weather_ko 미라우팅, Issue #76 등록)
  - Evidence: `docs/architecture/SOUL_CABLE_CAR_PHASE1_CLOSURE_EVIDENCE_V1.md`
  - 제외: JOURNEY_PREFERENCE / Companion Chip / parking_trust / DB·Schema — Phase 2 후보

- **Hyangiram SOUL Phase 1: CLOSED — DEPLOYED_AND_VERIFIED (2026-10-18)**
  - PR #71 Squash Merge SHA: `6965910d4a95d0f740e3a275857d0bb416048dc6` (2026-10-17T21:26Z / KST 2026-10-18 06:26)
  - Production SHA: `896e4d5ec37dc1937ee361c3090bfded2b7d1e6e` / Render: `dep-db9v233ncjis73ap46cg` / LIVE: 2026-10-18 07:07 KST
  - 신규: soulHyangiramPhase1.test.js 66/66 PASS
  - 회귀: Case C 21/21 / YiSunSin Phase 2 39/39 / Odongdo Phase 1 57/57 PASS / 합계: 183/183 PASS
  - H-1~H-7: 7/7 PASS / R-1~R-4: 4/4 PASS / Guardrail violations: 0
  - H-1 experience_ko / H-2 계단 경고+걷기질문 / H-3 아이이동안내 / H-4 walking_ok / H-5 주차UNKNOWN / H-6 부모+차 / H-7 아이+차
  - Guardrails: "공영주차장 2시간 무료" 미노출 / "쉽게 오를 수 있어요" 미노출 / 10분/15분 단정 없음 / "괜찮아요" 미노출
  - Advisory: R-1에서 has_car 미설정에도 주차 안내 노출 — NON_BLOCKING (UNKNOWN 비단정, Phase 2 후보)

### 완료된 작업 기록 (2026-10-17)

- **Odongdo SOUL Phase 1: CLOSED — DEPLOYED_AND_VERIFIED (2026-10-17)**
  - PR #67 Squash Merge SHA: `12b70516b99bc8cc29766ca61d69ac9b1fbb1700` (2026-10-17T05:25Z)
  - Production SHA: `199bcf6e14943a1b394b95bcf02b2e77f17f7d69` / Render: `dep-db9gq76q1p3s7386qn00` / LIVE: 14:55 KST
  - O-1~O-7: 7/7 PASS / R-1~R-4: 4/4 PASS / Total: 11/11 PASS / Guardrail violations: 0
  - Guardrails: "이동 부담이 적어요" 미노출 / 주차 비단정 / 동백열차 단정 없음 — 전 시나리오 PASS
  - 신규 57/57 PASS / 회귀 117/117 PASS (YiSunSin Phase 2 39/39 + Case C 21/21)

- **YiSunSin Square SOUL Phase 2: DEPLOYED_AND_VERIFIED (2026-10-17)**
  - PR #64 MERGED @d272003 / PR #65 MERGED @284c5cb
  - Render Deploy: `dep-db9fdotg1s2s738gt6l0` / SHA: `284c5cb97030b4abe6b1e9aab7af18a07ce38c37` / Live: 13:20 KST
  - Fix A: `_handleJourneyDecision` placeCodeHint → S-4/S-6 JOURNEY_PREFERENCE lee_soon_shin_plaza 분기
  - Fix B: `_PLACE_KNOWLEDGE.lee_soon_shin_plaza` `parking_trust: 'UNKNOWN'` → S-5 주차 비단정 안내
  - Fix C: `_yisunsinVehicleBypass` + Companion Chip 차량 맥락 (lee_soon_shin_plaza 전용 격리)
  - Scope Fix: `_ccPlace.code === 'lee_soon_shin_plaza'` 조건 추가 (다른 장소 차량 문구 미적용)
  - 신규 테스트: `soulYisunsinPhase2.test.js` (39/39 PASS) / Case C 회귀 21/21 PASS
  - Runtime QA 10/10 PASS: S-4~S-8 + S-1~S-3 + Case C + Isolation
  - Advisory: S-7/S-8 next_options 비어있음 (Guardrail 위반 아님, Phase 3 후보)

- **SOUL Case C 접근성 질문 Production 종료: DEPLOYED_AND_VERIFIED (Founder Decision 2026-10-17)**
  - Production SHA: `d7ac07fc97dec7e23a2730450827bc41c966f139`
  - Render Deploy ID: `dep-db9chre7bikc73fhhc7g`
  - Live 시각: 2026-10-17 10:04 KST
  - **Founder Browser Runtime Evidence:**
    - 테스트 장소: 향일암 Living Detail
    - 입력: "부모님과 함께 가려고 해요."
    - 확인된 SOUL 응답: "향일암에 대해 알려드릴게요." / "경사나 계단이 있어요. 이동 동선을 미리 확인해보세요." / "걷기 많이 힘드신가요?"
    - 기존 장소 안내 유지: PASS
  - RC1 Guard PASS / RC2 접근성 후속 질문 PASS
  - **Case C: DEPLOYED_AND_VERIFIED**

- **SOUL Case C RC2 Companion Chip next_options 수정: DEPLOYED**
  - PR #61 MERGED @521afda / Merge Commit: `86d684620486ad13a55aeac3cb04c8342529ac3d`
  - Merge 시각: 2026-10-17T00:53:46Z (KST 오전 9:53)
  - 변경: `services/soyeowoolService.js` (+6줄) — `_ccAccessibilityQ` 조건 + `next_options` 추가
  - 신규 테스트: `soulCaseCCompanionGuard.test.js` RC2 8케이스 (21/21 PASS)
  - AIL Gate PASS / docker-smoke PASS
  - Root Cause 2: `_isCompanionChipQuery`=TRUE → `_buildPlaceLookupClientPayload` spread → `next_options:[]`
  - Fix: `family_elderly + physical_difficulty='high' + !mobility_constraint` → `next_options:['걷기 많이 힘드신가요?']`
  - Production 배포: `d7ac07f` (dep-db9chre7bikc73fhhc7g) DEPLOYED

- **SOUL Case C RC1 Companion Guard 수정: DEPLOYED**
  - PR #59 MERGED @f3bb1e2 / Merge Commit: `a1a4621ee5be832232af58cbc4d51898c2e085f8`
  - Merge 시각: 2026-10-16T23:56:43Z (KST 오전 8:56)
  - 변경: `services/soyeowoolService.js` (1+1-) — `_ldGuardBypass` 정규식에 `가려고` 추가
  - 신규: `tests/unit/soulCaseCCompanionGuard.test.js` (13케이스 / 13/13 PASS)
  - AIL Gate PASS / docker-smoke PASS
  - Root Cause 1: "부모님과 함께 가려고 해요" → `_ldGuardBypass=false` → Living Detail Fallback → `next_options:[]`
  - Fix: `가려고` 패턴 추가 → `_ldGuardBypass=true` → Companion Chip Response 경로 진입
  - Production 배포: `d7ac07f` (dep-db9chre7bikc73fhhc7g) DEPLOYED

- **SOUL next_options 코스 응답 시간 질문 억제: CLOSED (Founder Decision 2026-10-17)**
  - PR #57 MERGED @efc0a60 (main) — Founder FINAL MERGE AUTHORIZATION 2026-10-17
  - Commit: `b53d474` / Merge Commit: `efc0a60`
  - 변경: `services/soyeowoolService.js` (+5줄) — `_buildResultEnvelope` 후 `result.next_options = []` 조건부 억제
  - 가드: `_isCourseMsg && explicit_context.place_code && tgResult?.places?.length >= 2`
  - SOUL 65/65 PASS / AIL Gate PASS / docker-smoke PASS
  - PR #55(soulMessage 텍스트 제거)와 합산 시 코스 후 시간 질문 텍스트·버튼 모두 억제
  - Production 배포: 없음 (Render 자동 배포 미실행 확인 — deployment `[]`)
  - **UNVERIFIED:** 실제 Production 브라우저 SOUL API 응답 확인

### 완료된 작업 기록 (2026-10-16)

- **SOUL Time Honesty Message Repair: CLOSED (Founder Decision 2026-10-15)**
  - PR #55 MERGED @22a3e16 / Render LIVE 2026-10-15 16:28 KST
  - 변경: `services/soyeowoolService.js` (BE 1파일, 3줄) — FE·DB·API 계약 무변경
  - CLOSED 범위: 경로 A(PARTIAL default "2시간 기준" 제거) / 경로 B(코스 요청 후 시간 질문 제거)
  - Jest SOUL 65/65 PASS / AIL Gate PASS / docker-smoke PASS
  - **OPEN:** `next_options[0]` '시간이 얼마나 남으셨어요?' 코스 요청 후 미억제 — 최소 수정안 확인 완료 (soyeowoolService.js 2줄 추가), Founder 승인 대기
  - **UNVERIFIED:** 브라우저 실 API SOUL 응답 확인

- **SSOT-ROUTE-003 별빛 해안길 Draft 생성 (2026-10-16)**
  - 파일: `docs/ssot/episodes/SSOT-ROUTE-003_Starlight_Coastal_Walk.md`
  - Status: Draft (Confirmed 전)
  - Founder Confirmed: 이순신광장→하멜등대 / 1.2km / 18~25분 / 기본감상형 40~60분 / 여유체험형 120~150분 / 중간 선택 경험 정의
  - 기존 SSOT 충돌 없음: SSOT-ROUTE-001·002·LOC-001·TIME-001 미변경
  - Draft → Confirmed 조건: 1.2km 지도 실측 + 별빛혜택 정의 + Founder 최종 승인

### 완료된 작업 기록 (2026-10-15)

- **CourseDisplay Time Honesty Repair: CLOSED (Founder Decision 2026-10-15)**
  - PR #53 MERGED @5937d17 / Render LIVE 2026-10-15 15:33 KST (dep-db8765jncjis73et8acg)
  - 변경: `CourseDisplay.jsx` (FE 1파일, +29/-36) — 백엔드 무변경
  - CLOSED 범위: 코드 수정 · PR Merge · Production 배포 · 이순신광장 D1~D4 화면 검증
    - D1: 숫자 코스 배지 제거 PASS / D2: 이동시간 반복 제거 + footer 1회 PASS
    - D3: 내부 경고 코드 비노출 PASS / D4: 장소 체류시간 합계 180분 표시 PASS
  - **OPEN:** SOUL 상위 응답 "대략 2시간 기준" 문구 ↔ 체류시간 합계 180분 불일치 — 별도 검토 필요
  - **UNVERIFIED:** 케이블카 상세 회귀 / 부모님·여행코스 칩 순서 회귀 / 실제 이동시간·총 소요시간
  - AIL Gate PASS / docker-smoke PASS

- **Architecture Guard A+B 적용 완료 (2026-10-10)**
  - Option B: PR 필수 (`required_approving_review_count=0`) APPLIED ✓
  - Option A: `enforce_admins=true` APPLIED ✓
  - AIL Gate (`contexts: ["AIL Gate"]`, `strict: true`) 보존 ✓
  - Evidence: `docs/architecture/ARCH_GUARD_A_PLUS_B_ENFORCEMENT_EVIDENCE_V0_1.md`
- **기존 위험 해소:**
  - `enforce_admins=false` UNRESOLVED → **RESOLVED** ✓
  - 관리자 직접 Push 차단 → **적용** ✓
- **RUNTIME UNVERIFIED (OPEN):**
  - 직접 Push 실제 차단 / AIL Gate FAIL Merge 차단 / Founder self-merge 동작
  - → 다음 실제 기능 PR에서 자연 확인
- SOUL suitable_for Option C: **PRODUCTION_LIVE** @afcecc4 (유지)
- 미해결: SOUL+elderly_fit_unverified message_ko 직접 관찰 / dolsan_nightscape top-3 (구조적, 유지)
- 전체 상세: `docs/governance/meetings/MEET-20261010-003.md`
- **STOP Guard Rule Recovery: CLOSED** (PR #35 @4f99dc0, 2026-10-11)
  - Guardian Preflight 필수 발행 의무 / Founder 구두 승인 ≠ 면제 (CLAUDE.md)
  - 컴팩션 재개 = 신규 세션 (Current Next Action 선확인 의무)
  - Architecture Guard §4 [7] Current Next Action 정렬 항목 추가
  - 잔여 위험: 자동 차단 미구현 (AI 지침 준수 의존)
- **무여정 메인 4개 카테고리 칩 PR #42: MERGED (2026-10-13)**
  - Merge SHA: eadcbde9a8bcdb6c67ebe43fc1afc53eca0266ec / Feature: 788962b
  - 변경 파일 2개: `MuyojeongHomePage.jsx`, `soyeowoolService.js`
  - C-1~C-4 로컬 API 검증 PASS / AIL Gate PASS / docker-smoke PASS
  - Vercel 2건 FAIL (비필수 체크) / Render Production 미배포 (미승인)
  - Architecture Guard Runtime 부분 확인: enforce_admins=true 작동 ✓ (Founder PR 통해 Merge)
  - Architecture Guard Runtime 미확인: AIL Gate FAIL → Merge 차단 동작 (다음 PR로 이월)
  - Evidence: `docs/architecture/MUYOJEONG_CHIP_C3C4_PR42_EVIDENCE.md`
- **YiSunSin Square SOUL Phase 1: CLOSED (Founder Decision 2026-10-13)**
  - PR #40 PSQ Fix A/B/C MERGED @0a19a291 ✓
  - PR #39 YiSunSin chip variants + parseContext MERGED @a4511a96 ✓
  - Production Live SHA: a4511a96f4e8a3ad0f922c55f4a61c5e66a26d42
  - S-1~S-3 (PSQ): 3/3 PASS / 부모님·가족·차량 컨텍스트 칩 UI 확인 ✓
  - S-4~S-8 일반 fallback: Journey Decision → Living Detail Fallback 경로 확인
    - 원인: `_extractGoldenPlaceCode`가 이순신광장 미인식 + JOURNEY_PREFERENCE가 explicit_context 미사용
    - Phase 1 범위에 맥락별 SOUL API 응답 미포함 → Phase 2로 분리 (Founder 결정)
- **중앙시장 Policy B: CLOSED (Founder Decision 2026-10-15)**
  - PR #52 MERGED @50cd3d6 / Render LIVE 2026-10-15 14:03 KST
  - 대상: `jungang_market` — TG 추천 후보·Fallback·PLACE_LOOKUP·PSQ 전면 차단
  - 변경: `travelGuideService.js` + `fallbackService.js` + `soyeowoolService.js` (3파일, +36/-3)
  - Production P1~P10 10/10 PASS (일반·부모님·아이·차량·직접질문·회귀)
  - DB 및 Route Corpus 보존 / 수산물특화시장 별도 장소로 구분
  - **UNVERIFIED:** PLACE_EXCLUDED 브라우저 렌더링 / Fallback 실제 DB 실행 / 부모님→코스 실제 순차 칩 전이
  - **후속 개선 후보:** 중앙시장 포함 요청 시 제외 이유 안내 / `_ELDERLY_MSG_EXCLUDE` 코드 정리(COSMETIC)
  - Architecture Guard Runtime 확인: AIL Gate FAIL → Merge 차단 동작 **최초 자연 확인 완료** ✓
    - 초기 PR body에 [AIL] 섹션 누락 → AIL Gate FAILURE → Merge 차단 → body 보완 후 재통과

### Founder Decision — 케이블카 왕복 기본 원칙 SOUL-CABLECAR-001 (2026-10-15 등록)

**상태:** CANDIDATE (SSOT 승격 전 검증 필요)

| 결정 항목 | 확정값 |
|---|---|
| 탑승 방식 | 왕복 기본 (자산→돌산→자산) |
| 편도/왕복 질문 | 개인 코스에서 묻지 않음 |
| 단체 편도 | 단체 견적 영역 별도 계산 |
| 왕복 후 출발 기점 | 자산탑승장 (`cablecar`, 오동도로 61-11) |

적용 코스: `이순신광장 → 자산탑승장 → 케이블카왕복 → 자산탑승장 → 향일암`

**기존 결정과 충돌 없음** — Founder Route #001 ROUND_TRIP(2026-09-21)과 방향 일치.

**UNVERIFIED 유지:** `avg_stay_minutes=45` (cablecar DB)가 왕복 탑승(25~30분) + 돌산 체류를 포함하는지 미확인.

**Evidence 확보 현황 (2026-10-15 갱신):**

| Edge | From | To | Mode | 값 | Source | 상태 |
|---|---|---|---|---|---|---|
| EA | 이순신광장 | 자산탑승장(케이블카) | CAR | 10분 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| EB | 자산탑승장(케이블카) | 향일암 | CAR | 36분 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| EC | 이순신광장 | 자산공원 | CAR | 9분 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| ED | 자산공원 | 중앙시장 | CAR | UNKNOWN | — | jungang_market 추천 제외로 측정 불필요 |
| EE | 오동도 | 자산탑승장(케이블카) | CAR | 3분 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| EF | 자산탑승장(케이블카) | 수산물특화시장 | CAR | 7분 | FOUNDER_EVIDENCE | UNVERIFIED — 수산물특화시장 DB 미등록, place_code 없음 |

EA+EB 합계: 46분 / 일반 코스 체류(180) + 이동(46) = 226분 (참고값, Runtime 미적용)

저장: `docs/knowledge/YEOSU_FOUNDER_ROUTE_001_TIME_EVIDENCE.md` [UPDATE 2026-10-15] 섹션 추가 완료

**남은 검증 항목:**
- EA~EE 네이버/카카오맵 실측 검증 (현재 UNVERIFIED)
- 역방향 Edge 별도 측정 필요
- 케이블카 avg_stay_minutes=45 왕복 적절성 UNVERIFIED
- `_estimateTravelTime()` 교체: EA~EE 확보됐으나 검증 완료 후 별도 Preflight 필요

---

### Phase 2 Open Item — YiSunSin SOUL 맥락별 대화 응답 (2026-10-13 등록)

이순신광장 SOUL의 companion/vehicle context를 SOUL API 응답에 반영하는 작업.

검토 대상:
- `explicit_context.place_code` 기반 JOURNEY_PREFERENCE 처리 (`_handleJourneyDecision` 수정)
- `_extractGoldenPlaceCode`에 이순신광장 추가 또는 `explicit_context` fallback 활용
- parents / vehicle / family 컨텍스트별 응답 분기
- 확인되지 않은 장소 정보에 대한 안전한 응답 (guardrail 유지)
- S-4~S-8 응답 품질 검증 (현재 진단 Evidence 재사용 가능)

기존 Evidence: 이번 세션 진단 (soyeowoolService.js 1758~1976 + 2400~2474 경로 확인 완료)
착수 조건: Founder 기능 기획 결정 + Guardian Preflight READY
후속 Next Action 후보: YiSunSin SOUL Phase 2 착수 (Founder 기능 기획 결정 대기 — 현재 OPEN)

### Production-Live (Project Phoenix)

| Surface | Commit | Status |
|---|---|---|
| PlaceBasicInfo V0.2 (6 fields) | 17aebc8 | PRODUCTION_LIVE |
| Judgment V0.1 backend | d3e7f0e | PRODUCTION_LIVE |
| UI-001 explicit_context contract | 294c55c | PRODUCTION_LIVE |
| Soyeowool Phase 1 | 1f5afab | PRODUCTION_LIVE |
| SOUL Short Op Gate V0.1 | b11f012 | PRODUCTION_LIVE |
| **SOUL Living Detail Navigation R1** | **77cac69** | **PRODUCTION_LIVE — Founder QA ALL PASS** |
| **SOUL suitable_for Option C** | **afcecc4** | **PRODUCTION_LIVE — Smoke Test 8/8 PASS** |
| **YiSunSin chip variants + image reorder** | **d95fd45** | **PRODUCTION_LIVE (코드) — 차량 Content QA 미완료** |
| **PSQ Fix A/B/C (주차 우선순위·거북선·이중어미)** | **0a19a291** | **PRODUCTION_LIVE — S-1~S-3 3/3 PASS** |
| **YiSunSin SOUL Phase 1 (chip variants + parseContext)** | **a4511a96** | **PRODUCTION_LIVE — Phase 1 CLOSED @2026-10-13** |
| **무여정 메인 4개 카테고리 칩 (C-3/C-4)** | **788962b** | **MERGED to main (PR #42, eadcbde) — Render Production 미배포 (미승인)** |
| **상세 Living Detail Nav 제거** | **e0df2bf** | **MERGED to main (PR #47) — PRODUCTION_LIVE @bcf391f** |
| **상세 조건 전달 Repair (handleDetailChipClick ec 누적)** | **0cba566** | **MERGED to main (PR #48) — PRODUCTION_LIVE @bcf391f** |
| **상세 여행코스 Repair (must-visit + C4 guard + transport 재주입)** | **9261908** | **PRODUCTION_LIVE (PR #49, bcf391f, 2026-10-15) — B 5/5 PASS, C 2/2 PASS** |
| **중앙시장 Policy B (TG·Fallback·PSQ·PLACE_LOOKUP 제외)** | **4abae6e** | **PRODUCTION_LIVE (PR #52, 50cd3d6, 2026-10-15 14:03 KST) — P1~P10 10/10 PASS** |
| **CourseDisplay Time Honesty Repair (D1~D4)** | **b4876eb** | **PRODUCTION_LIVE (PR #53, 5937d17, 2026-10-15 15:33 KST) — D1~D4 Founder Screenshot PASS** |
| **SOUL Time Honesty Message Repair** | **82a404e** | **PRODUCTION_LIVE (PR #55, 22a3e16, 2026-10-15 16:28 KST) — 경로 A·B 수정. next_options 미억제 OPEN** |
| **SOUL next_options 코스 응답 시간 질문 억제 (PR #57)** | **efc0a60** | **MERGED to main (5be00bf) — PRODUCTION_LIVE @5be00bf028a1fc1e (dep-db99p9navr4c73d8fg4g, 2026-10-17 오전 6:55 KST, Founder Evidence)** |
| **SOUL Case C Companion Guard 가려고 추가 (PR #59)** | **f3bb1e2** | **MERGED to main (a1a4621) — PRODUCTION_LIVE @199bcf6e** |
| **Odongdo SOUL Phase 1 (O-1~O-7)** | **12b7051** | **PRODUCTION_LIVE @199bcf6e (dep-db9gq76q1p3s7386qn00, 2026-10-17 14:55 KST) — 11/11 PASS** |
| **Hyangiram SOUL Phase 1 (H-1~H-7)** | **6965910** | **PRODUCTION_LIVE @896e4d5 (dep-db9v233ncjis73ap46cg, 2026-10-18 07:07 KST) — H-1~H-7 7/7 PASS / R-1~R-4 4/4 PASS** |

### Staging-Only (SoulCableCarPage, 9 elements)

QUESTION_COMPOSER / SOUL_MESSAGE / PLACE_HERO / ESSENTIAL_INFO / FOR_ME / SOUL_JUDGMENT / JOURNEY / COST / DEPTH

### Key Phoenix Architecture Documents

| Document | Path | Purpose |
|---|---|---|
| SOUL Product Vision | `docs/product/SOUL_PRODUCT_VISION_V0_1.md` | Canonical product direction |
| D2 Decision | `docs/decisions/DECISION_PHOENIX_D2_LIVING_DETAIL_PAGE_V0_1.md` | Living Detail Page decision |
| Traveler Baseline | `docs/architecture/PHOENIX_HANDOVER_2026_09_21_TRAVELER_BASELINE_SHARED_JOURNEY.md` | Level 4 핵심 |
| Aurora3/Route | `docs/architecture/PHOENIX_HANDOVER_2026_09_21.md` | Aurora3 + Route knowledge |

---

---

## 한 줄 요약

> **Phase 1 완료** — 감정 구조 / 여행 연결 / 쿠폰 시스템 / UX / 전환 구조 / 상담 시스템 확정.
> 다음: Phase 2 구현 착수 (쿠폰 발행 로직 / 업체 확인 화면 / 일상 장면 카드 확장).

---

## 저장소 구조

| 로컬 경로 | GitHub | 역할 |
|----------|--------|------|
| `C:\DEV\daily-miracles-mvp` | `ys6448761-hue/daily-miracles-app` | Express 백엔드 |
| `C:\DEV\sowon-dreamtown` | `ys6448761-hue/sowon-dreamtown` | React 프론트엔드 (dreamtown-frontend/) |

---

## 완료 이력 (압축)

| 완료일 | 티켓 | 내용 |
|--------|------|------|
| 03-16 | UX P1 | 신호등 카드(GREEN/YELLOW), RED 분기 `/red-support.html` |
| 03-16 | UX P2 | summary_line 룰 엔진 + today_action 카드 |
| 03-16 | GPT Docs | `docs/gpt/` DT_*.md 7종 생성 |
| 03-20 | AIL-DT-001 | Core Loop (소원→별→Day→MyStar→광장) |
| 03-22 | AIL-DT-002 | 역할 분리(MyStar/StarDetail), isOwnStar 리다이렉트 |
| 03-22 | AIL-DT-003 | Day 자동 진입 + doneTodayFlag 완료 상태 |
| 03-22 | AIL-DT-004 | Core Loop 최종 정비, 빌드+push |
| 03-22 | AIL-DT-005 | 항해 로그 source 필터 (resonance 제외) |
| 03-22 | AIL-DT-006 | Seed Stars 13개 재시드 (은하별 분산) |
| 03-22 | AIL-DT-008 | 별 선물하기 바이럴 루프 전체 (GiftLanding, MyStar UI, API) |
| 03-23 | AIL-DT-P0 | MilestoneBar 공통 컴포넌트, MyStar 닉네임/wish_text/케어현황, StarDetail 재구성, `/detail` API |
| 03-24 | Docs Audit | 중복/낡은 파일 78개 삭제, 토큰 최적화 완료 |
| 04-03 | DEC-0331-001 | Core Engine 전체 구현 — 마이그레이션 045~048, 6개 서비스, 3개 워커, dtEngineRoutes |
| 04-03 | Aurora5 Orch | Orchestrator + 5 Agents (Star/Care/K-Wisdom/Narrative/Monetization) |
| 04-03 | Funnel HTML | dt-landing / dt-wish / dt-star-born / dt-upgrade 4페이지 완성 |
| 04-03 | **P0 결제게이트** | **결제 전 소원그림 생성 차단 — dtArtifactWorker + dtEngineRoutes 게이트 적용, 실 DB 검증 완료** |
| 04-03 | Mig 046~048 | 마이그레이션 046~048 Supabase 운영 DB 반영 완료 (dt_narrative_jobs, Orchestrator 3종, care enum) |
| 04-03 | NicePay SDK | nicepayService.js 주석 SDK URL 통일 (`pg-web.nicepay.co.kr`) |
| 04-03 | Worker 등록 | dtArtifactWorker / dtNarrativeWorker / dtOrchestratorWorker server.js 등록 확인 완료 |

---

## 현재 Phase 상태

### ✅ Phase 1 — 완료 (2026-04-04)

| 영역 | 내용 | 상태 |
|------|------|------|
| 감정 구조 | 소원 → 기록 → 변화 → 결심 구조 | ✅ 확정 |
| 여행 연결 | 장면 카드 3종 (케이블카/전망대/유람선), 위치 비특정 + 상황 기반 문장 | ✅ 확정 |
| 일상 확장 | 아침/낮/밤 장면 카드 구조 | ✅ 설계 완료 |
| 쿠폰 시스템 | 쿠폰 = 감정 트리거 구조, 쿠폰 → 장면 매핑 SSOT | ✅ 확정 |
| UX | 앱진입→질문→장면 / 쿠폰상세→감정→QR / 사용직전→감정피크 | ✅ 완성 |
| 전환 구조 | 9~10개월 결심 UX, 책=결과물 구조, 300/500 깊이 차이 | ✅ 확정 |
| 상담 시스템 | 상담 흐름 4단계, 스크립트, 교육+롤플레잉 | ✅ 완료 |

### 기존 코어 완료 항목

| Phase | 내용 | 상태 |
|-------|------|------|
| UX Phase 1+2 | 신호등 + summary_line | ✅ 완료 |
| DreamTown Core Loop | 소원→별→Day→MyStar→광장 | ✅ 완료 |
| DreamTown Gift Loop | 별 선물하기 | ✅ 완료 (DoD 검수 대기) |
| DEC-2026-0331-001 | Core Engine (Star→Wisdom→Choice→Growth→Narrative→Artifact) | ✅ 완료 |
| Aurora5 Orchestrator | 이벤트 기반 에이전트 자동화 | ✅ 완료 |
| 소원꿈터 퍼널 | Landing→Wish→StarBorn→Upgrade HTML 4페이지 | ✅ 완료 |
| **P0 결제 게이트** | **결제 전 소원그림 생성 차단** | **✅ 완료 (실 DB 검증)** |
| Journey Scene Engine | 앱 진입 장면 카드 (3장면, 하루 1회, localStorage) | ✅ 완료 |
| Story Draft MVP | /story-draft-mvp 감정 서사 검증 페이지 | ✅ 완료 |

### ⏳ Phase 2 — 미시작

| 영역 | 내용 | 상태 |
|------|------|------|
| 쿠폰 발행 로직 | 결제 확정 → 쿠폰 자동 생성 + 카카오 발송 | ⏳ |
| 업체 확인 화면 | 현장 QR 확인 + 법인카드 차감 처리 | ⏳ |
| 일상 장면 카드 | 아침/낮/밤 카드 실제 구현 | ⏳ |
| 쿠폰 → 감정 연결 | 쿠폰 상세 진입 시 감정 피크 UX | ⏳ |
| 책 결과물 구조 | 9~10개월 전환, 300/500 깊이 차이 UX | ⏳ |

---

## 즉시 해야 할 것

### P0 결제 게이트 후속 작업 (2026-04-03 완료)
- [x] **마이그레이션 045~048 운영 DB 반영** — Supabase에 4개 마이그레이션 전체 적용 완료
  - 045: dt_core_engine 6개 테이블 ✅ (이전 세션에서 적용)
  - 046: dt_narrative_jobs ✅
  - 047: dt_orchestrator_events / dt_agent_runs / dt_orchestrator_decisions ✅
  - 048: dt_log_type enum 'care' 추가 ✅
- [x] **NicePay SDK URL 불일치 수정** — `nicepayService.js` 주석을 실제 사용 URL(`pg-web.nicepay.co.kr`)로 통일
- [x] **워커 3종 서버 시작 시 등록 확인** — `server.js` 2224~2246행에 3종 모두 start() 등록 확인 완료

### AIL-DT-008 DoD 검수 (2026-04-03 코드 검수 완료)
- [x] `POST /api/dt/stars/:id/gift` → 200 + gift_card 반환 확인 ✅ (실 DB 시뮬레이션 통과)
- [x] `GET /api/dt/gift/:star_id` → star_name + copy_text 확인 ✅ (실 DB 시뮬레이션 통과)
- [x] `/dreamtown/gift/:star_id` 공개 URL 접근 (로그인 불필요) ✅ (App.jsx — 인증 가드 없음)
- [x] MyStar 선물 버튼 → 유형선택 → 공유 플로우 ✅ (코드 경로 확인)
- [x] GiftLanding CTA → `/wish` 이동 ✅ (`nav('/wish')` 확인)
- [ ] **모바일(Android/iOS) 전체 플로우 테스트** — 푸르미르님 직접 필요 (코드로 대체 불가)
- [ ] **VITE_KAKAO_JS_KEY** Render 대시보드 설정 필요 (render.yaml 미포함, 미설정 시 공유 fallback으로 동작)
- [ ] **NicePay 환경변수 차이 추적** — 과거 성공 상태와 현재 차이 확인
  - `NICE_CLIENT_KEY` 값이 `YSTRAVEL1m`(MID)인지 확인 (Render 대시보드)
  - `NICE_SECRET_KEY` 88자가 과거 성공 당시와 동일한 값인지 확인 (팀 이력 or NicePay 관리자)
  - 위 두 값이 과거 성공 값과 같다면 → **이름만 연결하면 해결** (`NICEPAY_CLIENT_ID`, `NICEPAY_SECRET_KEY`로 추가)
- [ ] **Render 환경변수 3종 설정** — MerchantKey 확보 후
  - `NICEPAY_CLIENT_ID` = NICE_CLIENT_KEY 값 (MID)
  - `NICEPAY_MERCHANT_KEY` = 발급받은 64자 hex 값
  - `NICEPAY_RETURN_URL` = `https://app.dailymiracles.kr/nicepay/return`
- [ ] Render 재배포 → 서버 로그 NicePay 설정 3줄 ✅ 확인
- [ ] 결제 플로우 실검증 (결제창 → 콜백 → PAID → 이미지 생성)

---

## 다음 기능 후보

- 별 성장도 시각화 (항해 로그 누적 → 별 밝기 증가)
- Push Notification / 일일 리마인더
- 은하 탐험 UX 개선

---

## 핵심 파일 경로

```
routes/wishRoutes.js                  ← 소원 API + 신호등 + summary_line
routes/dreamtownRoutes.js             ← DreamTown 전체 API (최신 마이그레이션: 039)
routes/dtEngineRoutes.js              ← DEC-2026-0331-001 Core Engine API (/api/dt/engine/)
routes/nicepayRoutes.js               ← NicePay 결제 콜백 + 결제 활성화
server.js                             ← coreAnalyzeHandler
public/daily-miracles-result.html     ← 결과 화면
public/red-support.html               ← RED 랜딩
public/dt-landing.html                ← 소원꿈터 퍼널 1 (공개 입구)
public/dt-wish.html                   ← 소원꿈터 퍼널 2 (소원 입력)
public/dt-star-born.html              ← 소원꿈터 퍼널 3 (별 탄생)
public/dt-upgrade.html                ← 소원꿈터 퍼널 4 (플랜 선택 + 결제)
services/miracleScoreEngine.js        ← 기적지수 계산
services/messageProvider.js           ← 메시지 발송 허브
services/dtArtifactWorker.js          ← 소원그림 생성 워커 (결제 게이트 포함)
services/dtNarrativeWorker.js         ← 서사 생성 워커
services/dtOrchestratorWorker.js      ← Aurora5 오케스트레이터 워커
services/dt/                          ← Core Engine 서비스 모음
  starService.js                      ← Star Engine (소원→별→log→artifact)
  wisdomGenerator.js                  ← Aurora5 지혜 생성
  choiceService.js                    ← 선택 기록
  narrativeService.js / narrativeBuilder.js ← 서사 엔진
  artifactService.js                  ← Artifact 큐 관리
  logService.js                       ← dream_log CRUD
  orchestrator/                       ← dtOrchestrator, decisionEngine, agentRunner
  agents/                             ← starAgent, careAgent, kWisdomAgent, narrativeAgent, monetizationAgent
dreamtown-frontend/src/pages/         ← MyStar, StarDetail, GiftLanding 등
dreamtown-frontend/src/components/    ← MilestoneBar 공통 컴포넌트
database/migrations/045~048           ← DEC-2026-0331-001 마이그레이션 4종
docs/gpt/                             ← GPT Knowledge 7종 (Code Architect GPT 업로드용)
scripts/verify_payment_gate.js        ← P0 결제 게이트 검증 스크립트
```

---

## P0 결제 게이트 — 구현 상세

### 반영 파일
| 파일 | 변경 내용 |
|------|----------|
| `services/dtArtifactWorker.js` | `checkPaymentStatus(starId)` 함수 추가, `processOne()` 상단에 게이트 삽입 |
| `routes/dtEngineRoutes.js` | `assertPaymentConfirmed(starId)` 헬퍼 추가, `POST /artifact` 진입 시 호출 |

### 핵심 쿼리
```sql
SELECT np.status
FROM dt_dream_logs dl
JOIN nicepay_payments np ON np.order_id = (dl.payload->>'order_id')
WHERE dl.star_id = $1
  AND dl.payload->>'event' = 'upgrade_checkout_started'
  AND np.status = 'PAID'
LIMIT 1
```

### 시나리오 / 검증 결과 (2026-04-03, 실 DB)

| 시나리오 | 경로 | 결과 |
|---------|------|------|
| 미결제 → POST /artifact | `assertPaymentConfirmed()` throw | ✅ 402 반환 |
| 미결제 → 워커 폴링 | `checkPaymentStatus()` = false | ✅ pending 복귀, attempts 원복, PAYMENT_REQUIRED 로그 |
| PAID 삽입 → 워커 폴링 | `checkPaymentStatus()` = true | ✅ 게이트 통과, 이미지 생성 진행 |

### attempts 원복 설계
```js
SET status='pending', attempts=GREATEST(0, attempts-1)
```
- 워커가 pick 시 `attempts+1` → 게이트 실패 시 `-1` 원복
- `GREATEST(0, ...)` — 언더플로우 방지
- 결과: 결제 미확인 상태에서는 max_attempts(3) 소진 없음

### 남은 리스크
| 리스크 | 수준 | 대응 |
|--------|------|------|
| 마이그레이션 045~048 미반영 (운영 DB) | 🔴 HIGH | 배포 전 반드시 실행 |
| NicePay SDK URL 불일치 | ~~🟡 MED~~ | ✅ 해소 (주석 통일) |
| NicePay 환경변수 이름 불일치 (NICE_*키 ↔ NICEPAY_*코드) | 🔴 HIGH | 과거 성공 이력(MID=YSTRAVEL1m) 있음. NICE_CLIENT_KEY=YSTRAVEL1m 여부, NICE_SECRET_KEY가 과거 성공 당시 값과 동일한지 확인 필요. 이름만 연결하면 해결될 수도 있음 |
| 워커 3종 server.js 미등록 가능성 | 🟡 MED | server.js에서 `.start()` 호출 여부 확인 |
| order_id 없이 결제한 별 (레거시) | 🟢 LOW | dt_dream_logs에 upgrade_checkout_started 없으면 영구 pending → 수동 처리 필요 시 별도 스크립트 |

---

## 절대 규칙

1. **코드 수정 = Claude Code만**
2. **메시지 발송 = messageProvider.js 경유만**
3. **금지 표현**: 사주, 점술, 관상, 운세, 대운, 궁합
4. **point_ledger** — append-only, UPDATE/DELETE 금지
5. **마이그레이션 순번** — 현재 048, 다음은 049

---

## summary_line 룰 (빠른 참조)

| traffic_light | current_stage | summary_line |
|--------------|--------------|-------------|
| GREEN | 감정 정리(1) | 지금은 마음을 차분히 정리하며 다음 걸음을 준비하기 좋은 상태예요 |
| GREEN | 방향 정리(2) | 지금은 방향을 하나로 좁혀 첫 움직임을 준비하기 좋은 흐름이에요 |
| GREEN | 실행 시작(3) | 지금은 아주 작은 실행을 시작하기 좋은 상태예요 |
| GREEN | 유지 회복(4) | 지금은 기존 습관을 꾸준히 이어가는 것이 가장 중요한 상태예요 |
| YELLOW | 감정 정리(1) | 지금은 해결보다 마음의 무게를 먼저 알아보는 것이 중요한 상태예요 |
| YELLOW | 방향 정리(2) | 마음은 앞서 있지만, 무엇부터 할지 기준을 정하는 것이 먼저예요 |
| YELLOW | 실행 시작(3) | 실행할 힘은 있지만, 시작점을 더 작게 만드는 것이 필요한 상태예요 |
| YELLOW | 유지 회복(4) | 지금은 더 앞으로 나가기보다, 흔들린 리듬을 다시 고르게 만드는 것이 먼저예요 |
| RED | 전체 | 미노출 → /red-support.html |

---

## 업데이트 방법

이 파일은 **작업 완료 후 매번 업데이트**한다.
- 완료 항목 → 이력 테이블에 한 줄 추가
- 즉시 해야 할 것 갱신
- 절대로 삭제하지 말고 누적 업데이트
