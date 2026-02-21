# DB Backup & Restore Runbook

> Last updated: 2026-02-16

## 1. Render 자동 백업

Render PostgreSQL은 **자동 일일 백업**을 제공합니다.

- **보관 기간**: 7일 (Pro Plan), 1일 (Free Plan)
- **위치**: Render Dashboard > Database > Backups

### 백업 확인

1. https://dashboard.render.com 로그인
2. PostgreSQL 인스턴스 선택
3. **Backups** 탭에서 최근 백업 시점 확인

## 2. 수동 JSON Export

프로젝트에 `scripts/backup-database.ts`가 있습니다.

```bash
# 로컬에서 실행 (DATABASE_URL 필요)
npx ts-node scripts/backup-database.ts

# 특정 테이블만
npx ts-node scripts/backup-database.ts --tables trials,wish_entries
```

- 출력: `.claude/backups/` 폴더에 JSON 파일
- 보관: 30일 자동 정리

## 3. 복구 절차

### 3-1. Render 대시보드 복구 (권장)

1. Render Dashboard > Database > **Backups** 탭
2. 원하는 시점의 백업 선택 > **Restore** 클릭
3. 확인 다이얼로그에서 DB 이름 입력 후 실행
4. **복구 완료까지 수 분 소요** (데이터 크기에 따라)
5. 아래 [검증 체크리스트](#4-복구-후-검증-체크리스트) 수행

### 3-2. 새 DB로 복구 (안전한 방식)

1. Render Dashboard > **New** > PostgreSQL 생성
2. 백업에서 새 DB로 Restore
3. 새 DB의 `Internal Database URL` 복사
4. 서비스 환경변수에서 `DATABASE_URL` 교체
5. 서비스 재배포 (자동 또는 Manual Deploy)

### 3-3. JSON 백업에서 수동 복구

```bash
# 백업 파일 확인
ls .claude/backups/

# psql로 직접 복원 (테이블별)
# 주의: 기존 데이터 위에 INSERT되므로 TRUNCATE 필요할 수 있음
```

## 4. 복구 후 검증 체크리스트

```bash
# 1. Health endpoint 확인
curl https://app.dailymiracles.kr/api/health
# → database: "연결됨" 확인

# 2. 주요 테이블 row count
node jobs/dbHealthCheck.js
# → 5개 테이블 count 확인

# 3. 최근 데이터 존재 확인
# (Render psql 또는 로컬 접속)
SELECT COUNT(*) FROM trials WHERE created_at > NOW() - INTERVAL '7 days';
SELECT COUNT(*) FROM wish_entries WHERE created_at > NOW() - INTERVAL '7 days';

# 4. 서비스 기능 테스트
node scripts/health-check.js https://app.dailymiracles.kr
# → 3/3 PASS
```

## 5. 긴급 연락처

| 역할 | 담당 | 연락처 |
|------|------|--------|
| CEO/CTO | 푸르미르 (이세진) | Slack @세진 |
| Render Support | - | https://render.com/support |
