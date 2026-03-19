# DreamTown Claude Code Work Order Guide

Version: v1.0
Created: 2026-03-16
Purpose: Claude Code에게 작업 지시서를 작성하는 방법 안내
대상: DreamTown 팀 (코미, 재미, 루미, 여의보주) + Code Architect GPT

---

## 기본 원칙

1. **Claude Code만 코드를 수정한다**
   Antigravity(Claude), GPT, 팀원은 코드를 직접 수정하지 않는다.
   코드 수정이 필요하면 반드시 "지시서" 형태로 Claude Code에 전달.

2. **지시서 = 계약서**
   범위, 파일, 검증 기준이 명확해야 한다.
   모호한 지시는 예상치 못한 변경을 유발한다.

3. **Phase 단위로 분리**
   한 번에 너무 많은 변경을 요청하지 않는다.
   Phase 1 완료 → 검증 → Phase 2 진행.

---

## 지시서 양식 (표준)

```markdown
📋 [TASK-{도메인}-{번호}]

📌 목적:
무엇을 왜 바꾸는지 1~2줄

🎯 결과물:
- 변경 파일 1: 무엇을 어떻게
- 변경 파일 2: 무엇을 어떻게
(최대 5개 파일)

📂 대상 파일:
- routes/wishRoutes.js
- public/daily-miracles-result.html

⚠️ 주의사항:
- 건드리면 안 되는 것
- 유지해야 하는 것
- 금지 표현 등

✅ 검증 기준:
- 무엇이 되면 완료인지
- 화면에 보여야 할 것
- API가 반환해야 할 필드
```

---

## 실전 예시

### 예시 1 — API 응답 필드 추가

```markdown
📋 [TASK-API-001]

📌 목적:
결과 화면에서 사용자 상태를 1문장으로 요약하기 위해
wishRoutes.js API 응답에 summary_line 필드 추가

🎯 결과물:
- routes/wishRoutes.js: getSummaryAndAction() 함수 추가,
  res.json()에 summary_line + today_action 필드 포함

📂 대상 파일:
- routes/wishRoutes.js

⚠️ 주의사항:
- 기존 응답 필드(miracleScore, trafficLight, current_stage) 유지
- 운세형/단정형 표현 금지

✅ 검증 기준:
POST /api/wishes 응답 JSON에
summary_line (string) + today_action (string) 포함
```

### 예시 2 — 결과 화면 UI 추가

```markdown
📋 [TASK-UX-002]

📌 목적:
결과 화면에 summary_line 카드 노출

🎯 결과물:
- public/daily-miracles-result.html:
  1. .summary-card CSS 추가
  2. #summaryCard HTML 블록 추가 (stageCard 다음)
  3. renderSummaryCard() JS 함수 추가
  4. renderResults()에서 renderSummaryCard(userProfile) 호출

📂 대상 파일:
- public/daily-miracles-result.html

⚠️ 주의사항:
- 카드형 모바일 UX 유지 (border-radius: 16px, box-shadow)
- 브랜드 컬러 사용 (#9B87F5 primary, #F5A7C6 secondary)
- RED 상태는 이 화면에 진입하지 않으므로 RED 처리 불필요

✅ 검증 기준:
결과 화면 로드 시 신호등 카드 → 단계 카드 → summary 카드 순서로 노출
summary_line 텍스트와 today_action 텍스트가 화면에 표시될 것
```

---

## 파일별 수정 가이드

### routes/wishRoutes.js 수정 시

| 체크포인트 | 설명 |
|-----------|------|
| 기존 응답 필드 유지 | `miracleScore`, `trafficLight`, `current_stage` 유지 |
| 신호등 로직 유지 | `classifyWish()` 함수 건드리지 않기 |
| 메시지 발송 | `messageProvider.js` 경유만 허용 |
| 에러 핸들링 | try/catch + `log.error()` 패턴 유지 |

### server.js 수정 시

| 체크포인트 | 설명 |
|-----------|------|
| 라우트 마운트 순서 | 기존 순서 유지, 신규는 맨 뒤에 추가 |
| global.latestStore | 구조 변경 시 result.html 파싱 로직 동시 수정 |
| 새 라우트 파일 | routes/ 파일 생성 후 여기서 마운트 |

### public/daily-miracles-result.html 수정 시

| 체크포인트 | 설명 |
|-----------|------|
| RED 분기 | load 핸들러 최상단 `if (tl === 'RED')` 유지 |
| 카드 순서 | 신호등 → 단계 → summary → 7일여정 → 기타 |
| 브랜드 컬러 | #9B87F5, #F5A7C6 사용 |
| 모바일 UX | box-shadow, border-radius 카드 스타일 유지 |

### database/migrations/ 추가 시

| 체크포인트 | 설명 |
|-----------|------|
| 순번 | 현재 최신 029. 신규는 030 |
| 파일명 | `030_description.sql` 형식 |
| 하위 호환 | 기존 컬럼 삭제/변경 금지, ADD COLUMN만 권장 |
| SSOT 테이블 | sowon_profiles, settlement_events, ops_events 직접 변경 주의 |

---

## 금지 사항 (Claude Code에 요청하면 안 되는 것)

| 금지 | 이유 |
|------|------|
| `point_ledger` UPDATE/DELETE | Ledger는 append-only |
| 신호등 RED 키워드 임의 축소 | 안전 윤리 정책 |
| 운세/사주/점술 표현 삽입 | 브랜드 금지 표현 |
| 직접 SENS API 호출 코드 작성 | messageProvider.js 경유 필수 |
| `sowon_profiles` 스키마 변경 | SSOT 테이블 |
| 환경변수 직접 하드코딩 | 보안 이슈 |

---

## Phase 관리

| Phase | 범위 | 상태 |
|-------|------|------|
| Phase 1 | current_stage, 신호등 카드, RED 분기, 7일 여정(정적) | ✅ 완료 |
| Phase 2 | summary_line 룰 엔진, today_action, 오늘의 행동 화면 | ✅ 완료 |
| Phase 3 | 내 변화 화면, 데이터 레이어 설계 | ⏳ 예정 |

---

## 자주 쓰는 파일 경로 (복붙용)

```
# 핵심 백엔드
routes/wishRoutes.js
routes/wishIntakeRoutes.js
routes/wishTrackingRoutes.js
server.js
services/miracleScoreEngine.js
services/analysisEngine.js
services/messageProvider.js
config/database.js
config/featureFlags.js
config/messageTemplates.js
middleware/errorHandler.js

# 핵심 프론트엔드
public/daily-miracles.html
public/questions.html
public/daily-miracles-result.html
public/red-support.html
public/js/shareCardGenerator.js

# DreamTown 프론트엔드 (sowon-dreamtown)
src/app/plaza/page.tsx
src/app/plaza/new/page.tsx
src/lib/prisma.ts
src/lib/auth.ts
src/lib/kst.ts
prisma/schema.prisma

# DB
database/migrations/ (순번 확인 필수)
```
