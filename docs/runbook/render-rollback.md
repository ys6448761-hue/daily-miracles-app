# Render Rollback Runbook

> Last updated: 2026-02-16

## 1. 롤백이 필요한 상황

- 배포 후 `/api/health`가 503 반환
- 배포 후 주요 API 에러 급증
- GitHub Actions `deploy-check.yml` 실패 알림

## 2. Render 대시보드 롤백 (가장 빠름)

1. https://dashboard.render.com 로그인
2. `daily-miracles-mvp` 서비스 선택
3. **Events** 탭에서 이전 성공 배포 커밋 확인
4. **Manual Deploy** > 이전 커밋 hash 입력
5. 배포 완료 대기 (1~3분)
6. 검증: `curl https://app.dailymiracles.kr/api/health`

## 3. Git revert 롤백 (코드 수준)

```bash
# 1. 문제 커밋 확인
git log --oneline -5

# 2. revert 커밋 생성
git revert HEAD --no-edit

# 3. push → 자동 재배포
git push origin main

# 4. deploy-check.yml 자동 실행 → 결과 확인
```

## 4. 환경변수 변경 롤백

Render 환경변수 변경으로 인한 장애:

1. Render Dashboard > Service > **Environment**
2. 변경된 변수를 이전 값으로 복원
3. **Save Changes** → 자동 재배포

## 5. 롤백 후 검증

```bash
# 1. Readiness probe
curl https://app.dailymiracles.kr/api/ready
# → {"status":"ok",...}

# 2. Full health (DB 포함)
curl https://app.dailymiracles.kr/api/health
# → database: "연결됨", success: true

# 3. Smoke check 스크립트
node scripts/health-check.js https://app.dailymiracles.kr
# → 3/3 PASS

# 4. DB health
node jobs/dbHealthCheck.js
# → ALL OK
```

## 6. Post-mortem

롤백 완료 후 반드시:

1. Slack `#ops` 채널에 장애 보고
2. 원인 분석 (Render Logs 확인)
3. 수정 PR 생성 후 재배포
4. `.claude/logs/` 에 인시던트 로그 기록
