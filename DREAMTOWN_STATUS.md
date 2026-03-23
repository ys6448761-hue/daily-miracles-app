# DREAMTOWN_STATUS.md
# 새 담당자/새 세션은 이 파일부터 읽을 것

Last Updated: 2026-03-24
담당: Claude Code (Antigravity)

---

## 한 줄 요약

> DreamTown Core Loop + Gift Loop 완료. 문서 토큰 최적화 완료(78개 삭제).
> 다음: AIL-DT-008 DoD 검수 (모바일 테스트 + VITE_KAKAO_JS_KEY Render 설정) → 오픈.

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

---

## 현재 Phase 상태

| Phase | 내용 | 상태 |
|-------|------|------|
| UX Phase 1+2 | 신호등 + summary_line | ✅ 완료 |
| DreamTown Core Loop | 소원→별→Day→MyStar→광장 | ✅ 완료 |
| DreamTown Gift Loop | 별 선물하기 | ✅ 완료 (DoD 검수 대기) |
| UX Phase 3 | 내 변화 화면 + 데이터 레이어 | ⏳ 미시작 |

---

## 즉시 해야 할 것 (AIL-DT-008 DoD)

- [ ] `POST /api/dt/stars/:id/gift` → 200 + gift_card 반환 확인
- [ ] `GET /api/dt/gift/:star_id` → star_name + copy_text 확인
- [ ] `/dreamtown/gift/:star_id` 공개 URL 접근 (로그인 불필요)
- [ ] MyStar 선물 버튼 → 유형선택 → 공유 플로우
- [ ] GiftLanding CTA → `/wish` 이동
- [ ] **모바일(Android/iOS) 전체 플로우 테스트** — 푸르미르님 직접
- [ ] **VITE_KAKAO_JS_KEY** Render 환경변수 설정

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
server.js                             ← coreAnalyzeHandler
public/daily-miracles-result.html     ← 결과 화면
public/red-support.html               ← RED 랜딩
services/miracleScoreEngine.js        ← 기적지수 계산
services/messageProvider.js           ← 메시지 발송 허브
dreamtown-frontend/src/pages/         ← MyStar, StarDetail, GiftLanding 등
dreamtown-frontend/src/components/    ← MilestoneBar 공통 컴포넌트
docs/gpt/                             ← GPT Knowledge 7종 (Code Architect GPT 업로드용)
```

---

## 절대 규칙

1. **코드 수정 = Claude Code만**
2. **메시지 발송 = messageProvider.js 경유만**
3. **금지 표현**: 사주, 점술, 관상, 운세, 대운, 궁합
4. **point_ledger** — append-only, UPDATE/DELETE 금지
5. **마이그레이션 순번** — 현재 039, 다음은 040

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
