# DreamTown API Registry

Version: v1.0
Created: 2026-03-16
Purpose: DreamTown Code Architect GPT — 전체 API 엔드포인트 레지스트리

---

## daily-miracles-mvp API (Express)

### 핵심 소원 API

| Method | Path | 파일 | 설명 |
|--------|------|------|------|
| POST | `/api/wishes` | wishRoutes.js | 소원 접수, 신호등 판정, 기적지수, current_stage, summary_line, today_action 반환 |
| GET | `/api/wishes/today` | wishRoutes.js | 오늘 소원 목록 (관리자) |
| POST | `/api/wish-intake` | wishIntakeRoutes.js | 소원 7문항 수집 |
| POST | `/api/wish-image` | wishImageRoutes.js | DALL-E 소원 이미지 생성 |
| GET | `/api/wish-tracking/:token` | wishTrackingRoutes.js | 소원 추적 응답 수집 |

### 핵심 분석 API (server.js 직접 처리)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/daily-miracles/analyze` | coreAnalyzeHandler — 전체 분석 파이프라인 |
| GET | `/api/story/latest` | global.latestStore 조회 (결과 화면용) |
| GET | `/api/dt/stars/:id` | DreamTown 별 상세 조회 |

### `/api/wishes` 응답 구조 (핵심)

```json
{
  "success": true,
  "wishId": "uuid",
  "miracleScore": 72,
  "trafficLight": "GREEN",
  "current_stage": {
    "code": 2,
    "label": "방향 정리",
    "desc": "중요한 것은 느끼고 있지만 무엇부터 해야 할지..."
  },
  "summary_line": "지금은 방향을 하나로 좁혀 첫 움직임을 준비하기 좋은 흐름이에요",
  "today_action": "오늘 가장 중요한 문제 하나를 고르고, 나머지는 내일로 미뤄보세요",
  "score_engine": {
    "base_score": 70,
    "final_score": 72,
    "confidence": "high",
    "energy_type": "action",
    "energy_name": "루비"
  }
}
```

### current_stage 코드표

| code | label | miracleScore 범위 |
|------|-------|-----------------|
| 1 | 감정 정리 | < 65 |
| 2 | 방향 정리 | 65 ~ 74 |
| 3 | 실행 시작 | 75 ~ 84 |
| 4 | 유지 회복 | ≥ 85 |

### summary_line 룰 (traffic_light × current_stage)

| traffic_light | code | summary_line |
|--------------|------|-------------|
| GREEN | 1 | 지금은 마음을 차분히 정리하며 다음 걸음을 준비하기 좋은 상태예요 |
| GREEN | 2 | 지금은 방향을 하나로 좁혀 첫 움직임을 준비하기 좋은 흐름이에요 |
| GREEN | 3 | 지금은 아주 작은 실행을 시작하기 좋은 상태예요 |
| GREEN | 4 | 지금은 기존 습관을 꾸준히 이어가는 것이 가장 중요한 상태예요 |
| YELLOW | 1 | 지금은 해결보다 마음의 무게를 먼저 알아보는 것이 중요한 상태예요 |
| YELLOW | 2 | 마음은 앞서 있지만, 무엇부터 할지 기준을 정하는 것이 먼저예요 |
| YELLOW | 3 | 실행할 힘은 있지만, 시작점을 더 작게 만드는 것이 필요한 상태예요 |
| YELLOW | 4 | 지금은 더 앞으로 나가기보다, 흔들린 리듬을 다시 고르게 만드는 것이 먼저예요 |
| RED | 전체 | summary_line 미생성 → red-support.html 리다이렉트 |

---

### 커뮤니티 / 운영 API

| Method | Path | 파일 | 설명 |
|--------|------|------|------|
| * | `/api/auth/*` | authRoutes.js | 인증 |
| * | `/api/harbor/*` | harborRoutes.js | 커뮤니티 항구 |
| * | `/api/point/*` | pointRoutes.js | 포인트 원장 |
| * | `/api/settlement/*` | settlementRoutes.js | 정산 |
| * | `/api/challenge/*` | challengeRoutes.js | 성장 챌린지 |
| * | `/api/wu/*` | wuRoutes.js | 소원 분석 세션 |
| * | `/api/program/*` | programRoutes.js | 프로그램 |
| * | `/api/referral/*` | referralRoutes.js | 추천인 |
| * | `/api/certificate/*` | certificateRoutes.js | 수료증 |
| * | `/api/video-job/*` | videoJobRoutes.js | 영상 작업 |
| * | `/api/aurora-job/*` | auroraJobRoutes.js | Aurora 작업 |
| * | `/ops/*` + `/api/ops/*` | opsRoutes.js | 운영 콘솔 (이중 경로) |
| GET | `/r/:code` | shortLinkRoutes.js | 단축 링크 리다이렉트 |

### 기타 API

| Method | Path | 설명 |
|--------|------|------|
| * | `/api/v2/quote/*` | 견적 v2 |
| * | `/api/v2/itinerary/*` | 여정 v2 |
| * | `/api/yeosu/wish/*` | 여수 소원 |
| * | `/api/repopulse/*` | 레포 펄스 |
| * | `/api/chat-log/*` | 채팅 로그 |
| * | `/api/raw/*` | 원본 처리 |
| * | `/api/sync/*` | Drive-GitHub 동기화 |
| * | `/api/notify/*` | 알림 |
| * | `/api/debate/*` | 토론 |
| * | `/api/journey/*` | 여정 |
| * | `/api/batch/*` | 배치 |
| * | `/api/storybook/*` | 스토리북 |
| * | `/api/agents/*` | 에이전트 |

---

## sowon-dreamtown API (Next.js App Router)

### 인증

| Method | Path | 설명 |
|--------|------|------|
| * | `/api/auth/[...nextauth]` | NextAuth 5 beta — 인증 |

### 게시글 / 좋아요

| Method | Path | 설명 |
|--------|------|------|
| GET/POST | `/api/post` | 게시글 목록 조회 / 작성 |
| POST | `/api/like` | 좋아요 토글 |

### 광장 (Plaza)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/plaza/curation/today` | 오늘의 큐레이션 (캐시 기반) |
| GET | `/api/plaza/event` | 광장 이벤트 목록 |
| GET | `/api/plaza/showcase` | 추천 게시글 |
| GET | `/api/plaza/wish/[wishId]` | 소원 상세 (daily-miracles-mvp 데이터 참조) |

### 이벤트

| Method | Path | 설명 |
|--------|------|------|
| * | `/api/event` | 이벤트 CRUD |
| POST | `/api/event/[id]/join` | 이벤트 참가 |

### 사용자

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/me/checkin` | 체크인 |
| GET/POST | `/api/me/temperature` | 오늘 온도/기분 |

### AI

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/ai` | AI 처리 (요약 등) |

### 관리자

| Method | Path | 설명 |
|--------|------|------|
| GET/PATCH | `/api/admin/posts` | 게시글 관리 |
| GET | `/api/admin/posts/[id]/logs` | 게시글 감사 로그 |
| GET/POST | `/api/admin/schedules` | 스케줄 관리 |
| * | `/api/admin/schedules/[id]` | 스케줄 상세 |
| POST | `/api/admin/schedules/[id]/test-notification` | 알림 테스트 발송 |
| GET/POST | `/api/admin/events` | 이벤트 관리 |
| GET | `/api/admin/kpi` | KPI 대시보드 |
| GET | `/api/admin/metrics` | 메트릭 |
| GET | `/api/retention` | 리텐션 지표 |

---

## API 수정 시 주의사항

1. **wishRoutes.js `POST /api/wishes`**: 응답 필드 변경 시 `daily-miracles-result.html` renderResults() 동시 수정 필요
2. **`/api/story/latest`**: `global.latestStore` 구조 변경 시 결과 화면 파싱 로직 동시 수정
3. **`/api/dt/stars/:id`**: sowon-dreamtown `/api/plaza/wish/[wishId]`와 연동
4. **메시지 발송**: 모든 발송은 반드시 `messageProvider.js` 경유. 직접 SENS 호출 금지
