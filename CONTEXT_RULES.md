# CONTEXT_RULES.md — Claude Code 컨텍스트 관리 SSOT
# Aurora 5 팀 → "기억하는 팀"으로 전환하는 규칙서

---

## 1. 새 대화 시작 시 필수 로드 순서

```
1. CLAUDE.md          — 스택, 절대 규칙, 핵심 로직
2. CONTEXT_RULES.md   — 이 파일 (컨텍스트 규칙)
3. DREAMTOWN_STATUS.md — 현재 진행 상황 (있을 때)
```

> 3개만 읽으면 전체 컨텍스트 복원 완료. 그 이상은 필요할 때 Read.

---

## 2. 절대 건드리지 않는 파일 (DB/비용 관련)

| 파일 | 이유 |
|------|------|
| `database/migrations/*.sql` | 순번 파괴 = 운영 장애 |
| `services/aiGateway.js` COST_PER_1K | 비용 계산 로직 — 임의 수정 금지 |
| `services/aiGateway.js` DAILY_BUDGET_KRW | 일일 예산 — 환경변수로만 조정 |
| `.env` / `.env.production` | 비밀키 — 절대 출력/커밋 금지 |
| `dt_ai_purchases` 테이블 직접 조작 | 결제 데이터 — 읽기 전용 |
| `dt_users.is_premium` 직접 UPDATE | 구매 흐름 외 변경 금지 |

**수정이 필요하다면**: 반드시 사용자에게 확인 요청 후 진행.

---

## 3. 마이그레이션 규칙

```
현재 최신: 089_ab_experiment_assignments.sql
다음 번호: 090_*.sql

규칙:
- 번호는 반드시 순차 (089 다음은 090)
- 기존 마이그레이션 파일 수정 금지 (새 파일로 ALTER)
- run-migration-069-070.js MIGRATIONS 배열에 반드시 추가
- IF NOT EXISTS / ON CONFLICT 필수 (멱등성)
```

---

## 4. 서버 실행 규칙

```bash
# 테스트용 서버 — 반드시 별도 포트 사용
PORT=4990 node server.js  # 운영 포트(5000/5002)와 분리

# 테스트 실행
TEST_BASE_URL=http://localhost:4990 node scripts/test-*.js

# 종료: 포트 확인 후 kill (절대 kill -9 all 금지)
```

---

## 5. 프론트엔드 배포 절차

```bash
# 반드시 이 순서로
1. src/ 수정
2. cd dreamtown-frontend && npm run build
3. dist/ 변경 확인
4. git add + commit + push
# build 없이 push → 화면 미반영 (가장 흔한 실수)
```

---

## 6. 실험 데이터 보호 규칙

- `dt_experiment_assignments` — 읽기만 (재배정 금지)
- `dt_experiment_exposures` — 읽기만 (수동 삽입 금지)
- 승자 판정은 `/admin/experiment` 대시보드에서만
- 최소 30명, 권장 100명 확보 후 판정

---

## 7. 금지 단어 (코드/문서 모두)

```
사주 / 점술 / 관상 / 운세 / 대운 / 궁합
```

신호등 RED 트리거(자살/자해) 관련 코드는 수정 전 반드시 확인.

---

## 8. 컨텍스트 로트 방지 체크리스트

새 대화에서 이 질문 3개만 확인:

- [ ] CLAUDE.md 읽었나?
- [ ] 현재 migration 최신 번호 확인했나? (현재: 089)
- [ ] 서버 포트 충돌 확인했나? (운영: 5000/5002)

---

*최종 업데이트: 2026-04-09 | 관리: Aurora 5 팀*
