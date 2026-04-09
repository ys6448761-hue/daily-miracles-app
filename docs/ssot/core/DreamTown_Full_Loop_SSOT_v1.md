# DreamTown Full Loop SSOT v1

> 결론 1줄: DreamTown 풀 확장은 "사용자 경험 = 데이터 흐름 = 성장 시스템"이 완전히 일치하는 구조를 만드는 것이다.

---

## 핵심 전략 (모든 설계의 기준)

> **"유저 행동 = 자동 기록 = 의미 있는 성장 데이터"**

| ❌ 잘못된 방향 | ✅ 올바른 방향 |
|---|---|
| 클릭 = 로그 | 경험 = 성장 기록 |
| 일기 쓰세요 | 숨이 놓였어요 / 용기났어요 |
| 기록하세요 | 조금 가벼워졌어요 (한 줄) |

---

## 전체 사용자 흐름 (최종 확정 — 이 8단계 외 기능 추가 금지)

| # | 단계 | stage 값 | 설명 |
|---|---|---|---|
| 1 | 소원 입력 | `wish` | 소원 텍스트 + gem 선택 |
| 2 | 별 생성 | `star` | wish → star 자동 전환 |
| 3 | 감정 기록 | `growth` | 감정 4개 선택 (3초 반응) |
| 4 | 7일 여정 | `growth` | day1_start → day7_complete |
| 5 | 항로 로그 | `growth` | galaxy route 기반 성장 |
| 6 | 공명 | `resonance` | 비슷한 상태의 사람과 스침 |
| 7 | 나눔 | `impact` | 기적 나눔, 공유 |
| 8 | 연결 | `connection` | 사용자 간 연결 |

---

## 감정 4개 (UX "3초 반응" 원칙)

```javascript
const EMOTIONS = [
  { key: 'relieved',   label: '숨이 놓였어요' },
  { key: 'believing',  label: '믿고 싶어졌어요' },
  { key: 'organized',  label: '정리됐어요' },
  { key: 'courageous', label: '용기났어요' },
];
```

**UX 절대 원칙**: 기록은 "입력"이 아니라 "반응"이어야 한다. 3초면 끝.

---

## 핵심 테이블 2개

### 1. dreamtown_flow — 행동 로그 (append-only)

```sql
CREATE TABLE dreamtown_flow (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  stage VARCHAR(20) NOT NULL,  -- wish/star/growth/resonance/impact/connection
  action VARCHAR(40) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  ref_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. star_profile — 누적 성장 원장 (upsert)

```sql
CREATE TABLE star_profile (
  user_id TEXT NOT NULL,
  star_id TEXT NOT NULL,
  origin JSONB NOT NULL DEFAULT '{}',  -- gem, 소원 기원
  growth JSONB NOT NULL DEFAULT '{}',  -- day1/day7, 감정, 로그 수
  route  JSONB NOT NULL DEFAULT '{}',  -- galaxy, stage
  impact JSONB NOT NULL DEFAULT '{}',  -- resonance_count, share_count
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, star_id)
);
```

핵심: **"모든 데이터 = 별에 쌓인다"**

---

## KPI 3개 (절대 추가 금지)

| KPI | 목표 | 의미 |
|---|---|---|
| 별 생성률 = star / wish | **≥ 70%** | 시작 힘 |
| 성장 지속률 = day7 / day1 | **≥ 50%** | 진짜 가치 |
| 공명률 = 공명 유저 / 전체 유저 | **≥ 20%** | 바이럴 |

---

## 자동화 루프 (완성형)

```
유저 행동
  → dreamtown_flow 기록        [services/dreamtownFlowService.js]
  → star_profile 업데이트       [services/starProfileService.js — syncFromFlow]
  → KPI 계산                   [dreamtown_kpi_7d 뷰]
  → Slack 리포트               [GitHub Actions 09:00 KST]
  → 루미 분석                  [computeVerdict — 병목 1개만 지적]
  → 개선 지시                  [루미 → 코미 → Code]
  → UX 개선
  → 다시 유저 행동
```

---

## Phase 로드맵

| Phase | 기간 | 목표 | 핵심 |
|---|---|---|---|
| Phase 1 🟢 | 1주 | 기록 시작 | wish→star 자동, dreamtown_flow 연결 |
| Phase 2 🟡 | 2~4주 | 성장 구조 완성 | Day1/Day7, 감정 4개, 성장 문장 자동 생성 |
| Phase 3 🔵 | 1~2개월 | 공명 시스템 | 공유 버튼, 공명 카운트, 댓글/반응 |
| Phase 4 🟣 | 2~3개월 | 나눔 + 연결 | 기적 나눔, 사용자 간 연결, 항로 기반 추천 |

---

## 본질

> "유저를 바꾸는 게 아니라, 유저의 변화를 **보이게** 만드는 것"

## 리스크

| 문제 | 해결 |
|---|---|
| 기능 욕심 → UX 무거워짐 | 항상 "3초 반응" 유지 |
| KPI 많아지면 아무도 안 봄 | KPI는 항상 핵심 3개만 |

---

## DoD (완료 기준)

- [x] 소원 → 별 자동 연결 (`wishRoutes`, `dreamtownRoutes` flow.log)
- [x] 7일 기록 가능 (`journeyLogRoutes` day1_start + day7_complete)
- [x] 감정 선택 백엔드 (`EMOTIONS` 상수, `emotion` 파라미터)
- [x] KPI 3개 측정 (`dreamtown_kpi_7d` 뷰, `/api/dt/flow/kpi`)
- [x] Slack 리포트 작동 (GitHub Actions daily cron)
- [ ] 감정 선택 UX 프론트엔드 (Phase 2 — 4개 버튼, 3초 반응)
- [ ] `GET /api/dt/stars/:id/profile` star_profile 노출 (Phase 2)
- [ ] impact/share 계측 (Phase 3)
- [ ] 사용자 간 연결 (Phase 4)

---

*작성일: 2026-04-09 | 승인: 루미(KPI 분석) + 코미(실행 우선순위)*
