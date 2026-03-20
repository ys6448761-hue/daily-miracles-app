# DREAMTOWN_STATUS.md
# 새 담당자/새 세션은 이 파일부터 읽을 것

Last Updated: 2026-03-20
담당: Claude Code (Antigravity)

---

## 한 줄 요약

> AIL-DT-001 Core Loop 완료. 별 탄생 → 광장 자동 이동 + 내 별 강조 A/B + Seed Stars 13개 표시.
> 다음 작업: DoD 검수 (코미) → 모바일 테스트 → VITE_KAKAO_JS_KEY Render 설정.

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

DoD 검수 항목:
- [x] 별 탄생 후 Galaxy 선택 화면 미노출
- [x] 별 탄생 후 Home 자동 이동
- [x] 수정된 완료 멘트 출력
- [x] 내 별 강조 연출 (A/B)
- [x] Seed Stars 13개 광장 표시 API 구현
- [ ] 모바일(Android/iOS) 테스트 — 푸르미르님 직접
- [ ] AURORA_STATUS.md 업데이트

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

---

## 다음 작업 후보

### 즉시 할 수 있는 것
1. **GPT Knowledge 업로드** — `docs/gpt/` 7종을 DreamTown Code Architect GPT에 업로드
2. **로컬 테스트** — `POST /api/wishes` 응답에 `summary_line` / `today_action` 확인
3. **결과 화면 모바일 확인** — 카드 순서, 폰트, 여백 점검

### Phase 3 준비 (다음 지시서 발행 전)
- 내 변화 화면 와이어프레임 코미가 작성
- `wish_tracking_responses` 데이터 레이어 설계

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
5. **마이그레이션 순번** — 현재 029, 다음은 030

---

## 업데이트 방법

이 파일은 **작업 완료 후 매번 업데이트**한다.
- 완료 항목 → ✅ 체크 + 날짜
- 다음 작업 후보 갱신
- 절대로 삭제하지 말고 누적 업데이트
