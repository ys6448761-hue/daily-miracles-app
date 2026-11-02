# SOUL 낮·밤 테마 V0.1 구현 Evidence

**Date**: 2026-11-02  
**Status**: BUILD_PASS — Founder 브라우저 QA 대기  
**Branch**: docs/pr134-merged-state-sync → PR 대상: main

---

## §1 Founder 결정 (승인 내용)

| 항목 | 결정값 |
|------|--------|
| 햇살 SOUL 배경 | `#F3F8FC` |
| 햇살 SOUL 기본 텍스트 | `#17324D` |
| 햇살 SOUL 강조색 | `#24678F` |
| 별빛 SOUL 배경 | `#130b1e` (기존 유지) |
| 별빛 SOUL 강조색 | `#6EB8FF` (기존 유지) |
| 자동 전환 기준 | 06:00-17:59 햇살 / 18:00-05:59 별빛 |
| 시간 갱신 | 1분 interval + visibilitychange |
| 선택 저장 | localStorage `soul_theme_pref` |
| 토글 위치 | 무여정 홈 hero 우상단 |
| 적용 범위 | `/muyojeong` + `/soul/*` — 다른 DreamTown 페이지 영향 없음 |

---

## §2 구현 파일 목록

| 파일 | 분류 | 변경 내용 |
|------|------|---------|
| `dreamtown-frontend/src/contexts/SoulThemeContext.jsx` | 신규 | 테마 상태 + 자동 감지 + localStorage |
| `dreamtown-frontend/src/index.css` | EXTEND | `.soul-scope` CSS 변수 블록 + Tailwind override (~80행) |
| `dreamtown-frontend/src/App.jsx` | EXTEND | `SoulThemeProvider` 래핑 (3행) |
| `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx` | EXTEND | CSS 변수화 + 토글 UI + useSoulTheme() |
| `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` | EXTEND | wrapper에 soul-scope + data-soul-theme |

---

## §3 CSS 변수 구조

```css
.soul-scope {
  /* 별빛 SOUL 기본값 */
  --soul-bg:            #130b1e;
  --soul-text:          #ffffff;
  --soul-text-muted:    rgba(255,255,255,0.60);
  --soul-text-subtle:   rgba(255,255,255,0.38);
  --soul-accent:        #6EB8FF;
  --soul-card-bg/border / --soul-input-bg/border
  --soul-send-active/inactive / --soul-chip-border/bg/text
}
.soul-scope[data-soul-theme="sunshine"] {
  --soul-bg:            #F3F8FC;
  --soul-text:          #17324D;
  /* ... 햇살 값 전부 */
}
```

범위 제한: `.soul-scope` 클래스 내부에만 적용 — DreamTown 별/Galaxy 페이지 영향 없음

---

## §4 빌드 검증 (2026-11-02)

| 항목 | 결과 |
|------|------|
| 빌드 성공 | ✅ 699 modules, 에러 없음 |
| JS 번들 `soul-scope` 포함 | ✅ |
| JS 번들 `data-soul-theme` 포함 | ✅ |
| JS 번들 `soul_theme_pref` (localStorage) 포함 | ✅ |
| JS 번들 `sunshine`/`resolvedTheme` 포함 | ✅ |
| JS 번들 `SoulThemeProvider` 포함 | ✅ |
| JS 번들 토글 레이블 `자동` 포함 | ✅ |
| CSS 번들 `.soul-scope` + CSS 변수 포함 | ✅ |
| CSS 번들 `#F3F8FC`, `#17324D` 포함 | ✅ |
| CSS 번들 `#130b1e` 포함 | ✅ |
| 서버 새 빌드 서빙 (200 OK) | ✅ |

---

## §5 Founder 브라우저 QA 체크리스트

다음 항목은 `http://localhost:5000/muyojeong` 에서 Founder 직접 확인 필요:

- [ ] 현재 시간 기준 자동 테마 초기값 올바른지
- [ ] hero 우상단 토글 (자동/☀️/✦) 표시 및 터치 가능한지
- [ ] ☀️ 클릭 → 배경 `#F3F8FC` 밝은 화면으로 전환, 텍스트 어두운 색으로 읽히는지
- [ ] ✦ 클릭 → 기존 어두운 배경 복귀
- [ ] 자동 모드에서 선택 해제 후 시간 기준 복귀
- [ ] `/soul/cable-car?place=cablecar` 이동 시에도 선택 유지
- [ ] 앱 나갔다 돌아와도 선택 유지 (localStorage)
- [ ] 콘솔 404 없음 확인
- [ ] 모바일(375px) 레이아웃 이상 없음

---

## §6 제약 준수 확인

| 제약 | 준수 여부 |
|------|---------|
| 기존 장소 데이터/SOUL 응답 로직 변경 없음 | ✅ |
| experience_ko/Founder 승인 문구 변경 없음 | ✅ |
| 예약·결제 API 변경 없음 | ✅ |
| DB Schema 신규 없음 | ✅ |
| 신규 테마 서버 없음 | ✅ |
| DreamTown 별/Galaxy 화면 영향 없음 | ✅ (.soul-scope 범위 제한) |
| 티켓 커머스 영향 없음 | ✅ |
