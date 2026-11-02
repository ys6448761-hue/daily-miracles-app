# SOUL 낮·밤 테마 V0.1 구현 Evidence

**Date**: 2026-11-02 ~ 2026-11-03  
**Status**: CLOSED — PR #137 MERGED (1f02c5c). Render 수동 배포 대기 (Founder 승인 필요)  
**최종 main SHA**: `1f02c5c` (PR #137, 2026-11-03)

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
| `dreamtown-frontend/src/index.css` | EXTEND | `.soul-scope` CSS 변수 블록 + Tailwind override (~120행) |
| `dreamtown-frontend/src/App.jsx` | EXTEND | `SoulThemeProvider` 래핑 (3행) |
| `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx` | EXTEND | CSS 변수화 + 토글 UI + useSoulTheme() |
| `dreamtown-frontend/src/pages/SoulCableCarPage.jsx` | EXTEND | wrapper 인라인 스타일 + soul-hero-overlay 클래스 |

---

## §3 CSS 변수 구조

```css
.soul-scope {
  /* 별빛 SOUL 기본값 */
  --soul-bg:            #130b1e;
  --soul-text:          #ffffff;
  --soul-text-muted:    rgba(255, 255, 255, 0.60);
  --soul-text-subtle:   rgba(255, 255, 255, 0.38);
  --soul-accent:        #6EB8FF;
  /* card / input / send / chip 토큰 */
}
.soul-scope[data-soul-theme="sunshine"] {
  --soul-bg:            #F3F8FC;
  --soul-text:          #17324D;
  --soul-text-muted:    rgba(23, 50, 77, 0.70);
  --soul-text-subtle:   rgba(23, 50, 77, 0.52);
  --soul-accent:        #24678F;
  /* 햇살 card / input / send / chip 토큰 */
}
```

범위 제한: `.soul-scope` 클래스 내부에만 적용 — DreamTown 별/Galaxy 페이지 영향 없음

---

## §4 Tailwind Override 전략

### 일반 텍스트 (컨버세이션 UI)
- `span/p/div.text-white` → element opacity 1로 복원, color alpha로 계층 표현
- `text-white.opacity-30` → `rgba(23,50,77,0.62)` | `opacity-50` → `0.65` | `opacity-70` → `0.78`

### 이미지 overlay 컨테이너
- `.rounded-2xl.overflow-hidden.relative .text-white` → `#ffffff` 유지
- Place Hero + Experience 이미지 카드 18개 모두 포함
- Card 컴포넌트(`rounded-2xl` only, `overflow-hidden`+`relative` 없음) 영향 없음

### 기타 Tailwind 클래스
- `bg-night-sky`, `border-white`, `bg-white.bg-opacity-5/10`
- `placeholder-white`, `text-star-gold`, `text-dream-purple`
- 배지 색상: green/yellow/blue variants

---

## §5 QA 이력 (Founder 직접 검증)

| 단계 | 날짜 | 결과 | 비고 |
|------|------|------|------|
| 1차 QA | 2026-11-02 | FAIL | Living Detail 배경 미전환 (self-selector 버그) |
| 2차 QA | 2026-11-03 | FAIL (잔여 2건) | 보조 글자 흐림 + Experience 캡션 미전환 |
| 3차 QA | 2026-11-03 | **PASS** | 오동도 햇살 SOUL 전체 항목 확인 |
| Production QA | 2026-11-03 | **PASS** (잔여 1건) | 향일암 Living Detail 햇살 모드. 비활성화 버튼 대비 수정 필요 |
| Production QA 최종 | 2026-11-03 | **PASS** | PR #137 수정 반영 후 종료 |

**Founder QA 3차 PASS 항목**
- ✅ 밝은 배경 전환 정상
- ✅ Essential Info 보조 글자 가독성 개선
- ✅ Place Hero 제목 및 설명 정상
- ✅ Experience 이미지 캡션 표시 개선
- ✅ SOUL 본문과 이미지 배치 정상

**Production QA PASS 항목 (향일암 기준)**
- ✅ 운영 사이트 접근
- ✅ 햇살 모드 밝은 배경
- ✅ SOUL 본문 및 여행 안내 표시
- ✅ 모바일 레이아웃
- ✅ (PR #137) 비활성화 버튼 글자 대비 보완 — disabled 상태 유지

---

## §6 코드팀 회귀 검증

| 항목 | 결과 |
|------|------|
| 빌드 (최종) | ✅ 699 modules, 에러 없음 |
| 전체 테스트 | ✅ 639/640 PASS |
| 실패 1건 | R20 PRE-EXISTING (dolsan_daegyo "걸어서") — 테마 작업 무관 |
| DreamTown 별/Galaxy 영향 | ✅ 없음 (`.soul-scope` 범위 제한) |
| 별빛 모드 회귀 | ✅ 없음 (sunshine 셀렉터에만 적용) |
| 예약/결제/SOUL 응답 로직 | ✅ 변경 없음 |
| DB Schema 신규 | ✅ 없음 |

---

## §7 커밋 이력

| SHA | 설명 |
|-----|------|
| `95d80fe` | feat: 최초 구현 (Context + CSS 변수 + MuyojeongHome + SoulCableCar) |
| `b07b024` | fix: Living Detail 배경 미전환 수정 (self-selector 버그) |
| `73a7cb5` | fix: 보조 글자 대비 개선 + Place Hero 캡션 흰색 유지 |
| `53d89f6` | fix: Essential Info note 대비 강화 + Experience 이미지 캡션 수정 |
| `dfcd97c` | **PR #135 MERGED main** — SOUL 테마 V0.1 병합 (2026-11-03) |
| `cca8247` | fix: 비활성화 버튼 햇살 모드 글자 대비 보완 |
| `1f02c5c` | **PR #137 MERGED main** — 비활성화 버튼 대비 fix + CLOSED (2026-11-03) |

---

## §8 배포 정보

| 항목 | 값 |
|------|-----|
| **Render 배포 대상 SHA** | **`1f02c5c`** |
| PR #135 | MERGED `dfcd97c` (2026-11-03) |
| PR #136 | CLOSED — 중복/구버전, 기록 손실 없음 |
| PR #137 | MERGED `1f02c5c` (2026-11-03) |
| Render Auto-Deploy | OFF — Founder 수동 배포 승인 필요 |
| 배포 검증 항목 | 햇살 모드 비활성화 버튼 대비 + 별빛 모드 회귀 없음 |
| 롤백 방법 | Render 이전 Deploy 재활성화 (즉각) |

---

## §9 제약 준수 확인

| 제약 | 준수 여부 |
|------|---------|
| 기존 장소 데이터/SOUL 응답 로직 변경 없음 | ✅ |
| experience_ko/Founder 승인 문구 변경 없음 | ✅ |
| 예약·결제 API 변경 없음 | ✅ |
| DB Schema 신규 없음 | ✅ |
| 신규 테마 서버 없음 | ✅ |
| DreamTown 별/Galaxy 화면 영향 없음 | ✅ |
| 티켓 커머스 영향 없음 | ✅ |
