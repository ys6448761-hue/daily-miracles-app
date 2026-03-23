# DREAMTOWN_STATUS.md
# 새 담당자/새 세션은 이 파일부터 읽을 것

Last Updated: 2026-03-23
담당: Claude Code (Antigravity)

---

## 한 줄 요약

> P0-1~4 통합 수정 완료. MilestoneBar 공통 컴포넌트, MyStar 닉네임/wish_text/케어현황, StarDetail 공개 프로필 재구조화 완료.
> 다음 작업: 모바일 320px 실기기 테스트 → /detail API 서버 확인 → VITE_KAKAO_JS_KEY Render 설정.

---

## 저장소 구조 (2개)

| 저장소 로컬 경로 | GitHub | 역할 |
|----------------|--------|------|
| `C:\DEV\daily-miracles-mvp` | `ys6448761-hue/daily-miracles-app` | Express 백엔드 + 결과 화면 |
| `C:\DEV\sowon-dreamtown` | `ys6448761-hue/sowon-dreamtown` | Next.js 커뮤니티 프론트엔드 |

---

## 완료된 작업 목록

### UX Phase 1 ✅ (2026-03-16 완료)
- `routes/wishRoutes.js` — `getCurrentStage()` 추가, `current_stage` 응답 필드
- `server.js` — `coreAnalyzeHandler`에 `current_stage` + `traffic_light_level` 주입
- `public/daily-miracles-result.html` — 신호등 카드 (GREEN/YELLOW), 단계 카드, 7일 여정 정적 섹션
- `public/red-support.html` — RED 분기 랜딩 페이지 (1393/1577-0199/1388 핫라인)
- RED 리다이렉트 로직: 결과 화면 load 시 `traffic_light_level === 'RED'` → `/red-support.html`

### UX Phase 2 ✅ (2026-03-16 완료)
- `routes/wishRoutes.js` — `SUMMARY_RULES` 룰테이블 + `getSummaryAndAction()` 함수
- `server.js` — `userProfile.summary_line` + `userProfile.today_action` 주입
- `public/daily-miracles-result.html` — `#summaryCard` HTML + CSS + `renderSummaryCard()` JS
- 결과 화면 카드 순서: 신호등 카드 → 단계 카드 → summary_line + 오늘의 행동 → 7일 여정

### DreamTown GPT Knowledge 7종 ✅ (2026-03-16 완료)
위치: `docs/gpt/`
```
DT_Codebase_System_Map.md         ← 전체 시스템 구조
DT_Folder_Responsibility_Index.md  ← 폴더/파일 역할
DT_API_Registry.md                 ← 전체 API 엔드포인트
DT_DB_Schema_Summary.md            ← DB 스키마
DT_React_Architecture.md           ← sowon-dreamtown 구조
DT_Express_Architecture.md         ← daily-miracles-mvp 구조
DT_ClaudeCode_Work_Order_Guide.md  ← 지시서 작성법
```

### AIL-DT-001 Core Loop ✅ (2026-03-20 완료)
- `StarBirth.jsx` — 별 탄생 후 `/home`으로 라우팅 (newStarId/newStarName state 전달)
- `StarBirth.jsx` — 완료 멘트: "오늘 밤, 새로운 별이 태어났습니다." / 버튼: "광장에서 내 별 보기 →"
- `Home.jsx` — API 기반 광장 (최대 13개 별 목록), 내 별 분리 표시
- `Home.jsx` — 내 별 강조 옵션A (1회 pulse) + 옵션B ("여기예요 ✨" 1.5초 툴팁) 동시 구현
- `routes/dreamtownRoutes.js` — `GET /api/dt/stars/recent?limit=N` 엔드포인트 추가
- `dreamtown.js` — `getRecentStars(limit)` API 클라이언트 추가

### AIL-DT-002 역할 분리 + 라우팅 복구 ✅ (2026-03-22 완료)
- `StarBirth.jsx` — Day 재진입 방지 (`dt_first_voyage_*` localStorage 체크 + `replace:true`)
- `StarDetail.jsx` — `isOwnStar` 감지 → `/my-star/:id` 자동 리다이렉트, 공명 UI 타인 전용
- `StarDetail.jsx` — `formatBirthDate()` 추가, 별 탄생일 story 상단 표시
- `StarDetail.jsx` — 뒤로가기: `history.length > 1 ? nav(-1) : nav('/home')` 폴백
- `Home.jsx` — `MyStarCard`/`StarItem` null guard 추가

### AIL-DT-003 Day 자동 진입 + 완료 상태 ✅ (2026-03-22 완료)
- `StarBirth.jsx` — `dt_first_voyage_*` 없을 시 Day 화면 자동 진입 (`isFirstVoyage: true` state)
- `Day.jsx` — `onComplete` 시 `dt_first_voyage_*` + `dt_voyage_today_*` 플래그 저장
- `MyStar.jsx` — `doneTodayFlag` 확인 → "오늘 항해는 완료했어요 ✦" 대체 표시

### AIL-DT-004 Core Loop 최종 정비 ✅ (2026-03-22 완료)
- `Day.jsx` — 완료 후 라우팅: `/my-star/:id` (폴백 `/home`)
- 폐기 문자열 제거, `navigate` replace 플래그 정리
- 빌드 + push 완료

### AIL-DT-005 항해 로그 source 필터 ✅ (2026-03-22 완료)
- `MyStar.jsx` — `displayLogs` IIFE 필터: `source === 'daily' || !source`만 표시 (resonance 제외)
- `StarBirth.jsx` — "내 별 먼저 보러가기" 클릭 시 `dt_first_voyage_*='skipped'` 저장

### AIL-DT-006 Seed Stars 13개 재시드 ✅ (2026-03-22 완료)
- `scripts/seed-dreamtown-13stars.js` — 기존 테스트 별 38개 삭제 + 감성 큐레이션 13개 입력
- 은하 분포: 성장×3, 도전×3, 치유×4, 관계×3
- 별마다 항해 로그 1~3개 (`source='daily'`, 날짜 분산)
- 고정 UUID (`00000000-0000-0000-0001-*`) 사용

### AIL-DT-008 Star Gift / 별 선물하기 ✅ (2026-03-22 완료)
- `database/migrations/039_star_gift.sql` — `dt_stars`에 4컬럼 추가 (`is_gifted`, `gifted_at`, `gift_copy_type`, `gift_view_count`)
- `routes/dreamtownRoutes.js` — `POST /api/dt/stars/:id/gift` (소유자 확인 + 마킹)
- `routes/dreamtownRoutes.js` — `GET /api/dt/gift/:star_id` (공개 선물 카드, 조회수 fire-and-forget)
- `dreamtown-frontend/src/pages/GiftLanding.jsx` — 수신자 랜딩 (Framer Motion, Aurum 2.5초 등장, CTA → `/wish`)
- `dreamtown-frontend/src/pages/MyStar.jsx` — 선물 UI 3단계 (버튼 → 유형 선택 → 공유), Web Share API + clipboard 폴백
- `dreamtown-frontend/src/App.jsx` — `/dreamtown/gift/:star_id` 라우트 추가
- `dreamtown-frontend/src/api/dreamtown.js` — `createGift()` / `getGiftCard()` 추가
- 빌드 성공 (447 modules) + push 완료 (커밋 `4a87d90`)

DoD 검수 항목 (AIL-DT-008):
- [ ] `POST /api/dt/stars/:id/gift` → 200 + gift_card 반환 확인
- [ ] `GET /api/dt/gift/:star_id` → star_name + galaxy + copy_text 확인
- [ ] `/dreamtown/gift/:star_id` 공개 URL 접근 가능 (로그인 불필요)
- [ ] MyStar 선물 버튼 → 유형 선택 → 공유 플로우 정상 동작
- [ ] GiftLanding CTA "나도 내 별 만들기 →" → `/wish` 이동
- [ ] 모바일(Android/iOS) 테스트 — 푸르미르님 직접
- [ ] VITE_KAKAO_JS_KEY Render 환경변수 설정

### AIL-DT-P0 UX 풍성화 4종 ✅ (2026-03-23 완료)
- `dreamtown-frontend/src/components/MilestoneBar.jsx` — 공통 컴포넌트 신규 생성 (D+N + MM.DD 날짜 표시, createdAt 기반 자동 계산)
- `dreamtown-frontend/src/pages/MyStar.jsx` — 인라인 MilestoneBar 제거, 공통 컴포넌트 사용, 닉네임(@) 표시, wish_text 표시, Aurora5 케어 현황 카드 추가, 항해 로그 wisdom_tag 배지 추가
- `dreamtown-frontend/src/pages/StarDetail.jsx` — getStarDetail API로 전환, 공개 프로필 순서 재구성 (닉네임→별이름/은하→소원→변화→MilestoneBar→항해로그1개→Aurora5→공명→광장), getVoyageLogs/expandable 제거
- `routes/dreamtownRoutes.js` — `GET /api/dt/stars/:id/detail` 신규 엔드포인트 (닉네임/마일스톤/항해로그/Aurora5 통합 반환)
- `dreamtown-frontend/src/api/dreamtown.js` — `getStarDetail()` 추가
- 빌드 성공 (449 modules)

### SSOT 재구조화 ✅ (이전 세션)
- 87개 → 3-tier 분류: `core/` (13개) / `support/` (25개) / `archive/` (47개)
- `docs/ssot/INDEX.md` v4.0 업데이트
- `docs/ssot/SSOT_Registry_v2.md` 신규

### 기타 ✅ (이전 세션)
- `dreamtown-frontend/src/pages/StarBirth.jsx` — 별 탄생 후 3초 자동이동
- `docs/dreamtown/DreamTown_Knowledge_Map.md` 신규
- `docs/notebooklm/` 폴더 + NotebookLM Reference Pack 5종
- `sowon-dreamtown/README.md` 교체 (sowon-* 네이밍 금지 명시)
- `sowon-dreamtown` — Gate 시스템 + 광장 CRUD v0 완료 (PR#1, PR#2)

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

## 현재 Phase 상태

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | current_stage + 신호등 카드 + RED 분기 + 7일 여정(정적) | ✅ 완료 |
| Phase 2 | summary_line 룰 엔진 + today_action + 오늘의 행동 카드 | ✅ 완료 |
| Phase 3 | 내 변화 화면 + 데이터 레이어 설계 | ⏳ 미시작 |
| DreamTown Core Loop | 소원→별→Day→MyStar→광장 전체 루프 | ✅ 완료 |
| DreamTown Gift Loop | 별 선물하기 바이럴 루프 | ✅ 완료 (DoD 검수 대기) |

---

## 다음 작업 후보

### 즉시 해야 할 것 (AIL-DT-008 DoD 검수 후)
1. **모바일 테스트** — Android/iOS 전체 플로우 (소원→별→Day→MyStar→선물)
2. **VITE_KAKAO_JS_KEY** — Render 환경변수 설정
3. **GPT Knowledge 업로드** — `docs/gpt/` 7종을 DreamTown Code Architect GPT에 업로드

### 다음 기능 후보
- 별 성장도 시각화 (항해 로그 누적 → 별 밝기 증가)
- Push Notification / 일일 리마인더
- 은하 탐험 UX 개선

---

## 핵심 파일 경로 (자주 쓰는 것)

```
routes/wishRoutes.js                  ← 소원 API + 신호등 + summary_line
server.js                             ← coreAnalyzeHandler
public/daily-miracles-result.html     ← 결과 화면
public/red-support.html               ← RED 랜딩
services/miracleScoreEngine.js        ← 기적지수 계산
services/messageProvider.js           ← 메시지 발송 (이것만 사용)
database/migrations/                  ← 마이그레이션 (현재 029가 최신)
docs/gpt/                             ← GPT Knowledge 문서들
```

---

## 절대 규칙 (모든 담당자 필수 숙지)

1. **코드 수정 = Claude Code만** — GPT/Antigravity는 지시서만 작성
2. **메시지 발송 = messageProvider.js 경유만** — 직접 SENS 호출 금지
3. **금지 표현** — 사주, 점술, 관상, 운세, 대운, 궁합
4. **point_ledger** — append-only, UPDATE/DELETE 금지
5. **마이그레이션 순번** — 현재 039, 다음은 040

---

## 업데이트 방법

이 파일은 **작업 완료 후 매번 업데이트**한다.
- 완료 항목 → ✅ 체크 + 날짜
- 다음 작업 후보 갱신
- 절대로 삭제하지 말고 누적 업데이트
