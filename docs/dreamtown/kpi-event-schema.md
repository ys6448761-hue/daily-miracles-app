# DreamTown KPI 이벤트 스키마 SSOT

> 최종 업데이트: 2026-03-21
> 코드 SSOT: `services/kpiEventEmitter.js`
> DB 테이블: `dt_kpi_events` (migration 034)

---

## 공통 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | BIGSERIAL | PK (자동 증가) |
| `event_name` | VARCHAR(50) | 이벤트 이름 (아래 목록 참조) |
| `user_id` | TEXT | 이벤트 주체 (anonymous_token 포함) |
| `star_id` | TEXT | 관련 별 UUID |
| `wish_id` | TEXT | 관련 소원 UUID |
| `visibility` | VARCHAR(10) | `'public'` \| `'hidden'` |
| `safety_band` | VARCHAR(10) | `'GREEN'` \| `'YELLOW'` |
| `source` | VARCHAR(50) | emit 지점 식별자 |
| `extra` | JSONB | 이벤트별 추가 데이터 |
| `created_at` | TIMESTAMP | 이벤트 발생 시각 (UTC) |

---

## 이벤트 목록

### 1. `resonance_created`
- **의미**: 타인의 별에 공명(감정 반응) 저장 완료
- **emit 지점**: `routes/resonanceRoutes.js` — `POST /api/resonance` 성공 직후
- **extra**: `{ resonance_type: 'relief' | 'belief' | 'clarity' | 'courage' }`
- **user_id**: 공명을 남긴 사람 (anonymous_token)
- **owner**: 공명받은 별의 소유자 (user_id 아님, owner_id 별도)

### 2. `impact_created`
- **의미**: 공명 누적 임계치 도달 → 나눔(impact) 생성
- **emit 지점**: `routes/resonanceRoutes.js` — `checkImpact()` 후 신규 impact마다
- **extra**: `{ impact_type: 'gratitude' | 'wisdom' | 'miracle' }`
- **user_id**: 별 소유자 (owner_id — 나눔은 별 주인에게 귀속)
- **트리거 규칙**:
  - `gratitude`: relief ≥ 3
  - `wisdom`: clarity + belief ≥ 3
  - `miracle`: courage ≥ 3

### 3. `resonance_received`
- **의미**: 별이 처음으로 공명을 받은 순간 (total_count = 1 도달)
- **emit 지점**: `routes/resonanceRoutes.js` — `updateSummary()` 후 newTotal === 1 조건
- **extra**: 없음 (첫 수신 이벤트는 단순 사실 기록)
- **user_id**: 별 소유자 (owner_id)
- **중복 방지**: total_count가 1일 때만 emit (1회성)

### 4. `connection_completed`
- **의미**: 공명이 실질적 연결로 완성된 순간 (최초 1회 보장)
- **공통 조건**: `dt_kpi_events`에 동일 star_id의 `connection_completed`가 없을 때만 emit
- **dedup 헬퍼**: `isConnectionCompleted(starId)` — `kpiEventEmitter.js`

#### CASE 1 — 재방문 기반
- **조건**: 동일 `actor_user_id`가 동일 `star_id`에 2번째 이상 공명 저장 시
- **emit 지점**: `routes/resonanceRoutes.js` — POST /api/resonance 후 resonance COUNT ≥ 2 감지
- **extra**: `{ case: 1, interaction_count: N }`
- **source**: `'repeat_interaction'`

#### CASE 2 — 소유자 반응 기반
- **조건**: `resonance_received` 이후, owner가 성장 기록 저장 시
- **emit 지점**: `routes/dreamtownRoutes.js` — POST /api/dt/stars/:id/growth-log
  - `hasResonanceReceived(starId)` === true AND `isConnectionCompleted(starId)` === false
- **extra**: `{ case: 2 }`
- **source**: `'owner_growth_log'`
- **서버 저장**: `dt_stars.growth_log_text` (migration 035)

---

## 조회 예시

```sql
-- 최근 이벤트 확인
SELECT event_name, star_id, source, extra, created_at
  FROM dt_kpi_events
 ORDER BY created_at DESC
 LIMIT 20;

-- 이벤트별 집계
SELECT event_name, COUNT(*) AS cnt
  FROM dt_kpi_events
 GROUP BY event_name
 ORDER BY cnt DESC;

-- 특정 별의 이벤트 흐름
SELECT event_name, user_id, source, extra, created_at
  FROM dt_kpi_events
 WHERE star_id = '<uuid>'
 ORDER BY created_at;
```

---

## KPI 계산식 (분석 참조)

| KPI | 계산 |
|-----|------|
| 공명 발생률 | `resonance_created` / `star_created` |
| 나눔 전환율 | `impact_created` / `resonance_created` |
| 별 공명 수신률 | `DISTINCT star_id` in `resonance_received` / `star_created` |
| 연결 완료율 | `connection_completed` / `resonance_received` (TODO) |
