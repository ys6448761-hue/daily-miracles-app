# [실행 지시서] DreamTown Star System 배포 체크리스트 v1.0

> 작성일: 2026-04-18 | 대상 브랜치: main | 배포 환경: Render.com

---

## 1. 구현 완료 범위 (로컬 검증 완료)

| Issue | 기능 | 엔드포인트 | 파일 | 상태 |
|-------|------|-----------|------|------|
| 1 | 별 생성 (PRE-ON) | `POST /api/stars` | `routes/starsRoutes.js` | ✅ |
| 2 | 케이블카 QR 진입 (PRE-ON→ON) | `GET /api/cablecar/entry?user_id=` | `routes/cablecarRoutes.js` | ✅ |
| 3 | 여행 로그 저장 | `POST /api/logs` | `routes/logsRoutes.js` | ✅ |
| 4 | Day 메시지 엔진 | `GET /api/messages?user_id=` `GET /api/stars/:id` | `server.js` + `starsRoutes.js` | ✅ |
| 5 | Day30 결과 요약 | `GET /api/result?user_id=` `GET /api/stars/:id/day30` | `server.js` + `starsRoutes.js` | ✅ |
| P0 | Admin 대시보드 | `GET /api/admin/dashboard/status` `GET /admin` | `routes/adminDashboardRoutes.js` + `AdminDashboardPage.jsx` | ✅ |

---

## 2. 배포 대상 커밋 (push 전 확인)

```
93bdefe  feat: 별 시스템 헬퍼 exports + /api/messages, /api/result 편의 엔드포인트
88318f8  feat: 별 시스템 Issue 1-5 + Admin Dashboard 소스 완성
8fad2bf  feat: 운영 관제 대시보드 (Admin Dashboard P0)
cff4228  fix: GET /api/promise/create 정적 가드 추가
0849db9  fix: PromiseViewPage UUID 가드 — /promise/create redirect
f01ae8b  debug: CREATE_PAGE_MOUNTED 마커 (배포 확인 후 제거 필요)
```

```bash
# 파이프라인 분 복구 확인 후 실행
git push origin main
```

---

## 3. DB 마이그레이션 (운영 배포 직후 실행)

```bash
# Render 배포 완료 후 운영 서버에서 실행
curl -X POST https://api.dailymiracles.kr/api/admin/run-migration \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -d '{"migration": "124"}'
```

**생성 테이블:**
- `stars` (id, user_id, wish_text, gem_type, status, created_at, activated_at)
- `star_logs` (id, star_id, emotion, tag, auto_text, created_at)

**마이그레이션 파일:** `database/migrations/124_simple_star_system.sql`

---

## 4. 배포 후 검증 curl (운영 서버)

```bash
BASE="https://api.dailymiracles.kr"

# 1. 별 생성
curl -X POST $BASE/api/stars \
  -H "Content-Type: application/json" \
  -d '{"user_id":"deploy_test_001","wish_text":"배포 검증","gem_type":"ruby"}'
# 기대: {"success":true,"status":"PRE-ON","star_id":"..."}

# 2. 케이블카 QR 진입 (star_id 재사용)
curl "$BASE/api/cablecar/entry?user_id=deploy_test_001"
# 기대: {"success":true,"status":"activated","star_id":"..."}

# 3. 여행 로그
curl -X POST $BASE/api/logs \
  -H "Content-Type: application/json" \
  -d '{"star_id":"<위 star_id>","emotion":"설렘","tag":"케이블카"}'
# 기대: {"success":true,"log_id":"...","auto_text":"..."}

# 4. Day 메시지
curl "$BASE/api/messages?user_id=deploy_test_001"
# 기대: {"success":true,"day":1,"message":"당신의 별이 조금 또렷해졌어요"}

# 5. Day30 결과 (차단 확인)
curl "$BASE/api/result?user_id=deploy_test_001"
# 기대: {"success":false,"day":1,"days_left":29} — 403
```

---

## 5. 프론트엔드 빌드 & 배포

```bash
cd dreamtown-frontend
npm run build
# dist/ 생성 확인 → server.js가 정적 서빙
```

**Admin 대시보드 접근:**
```
https://app.dailymiracles.kr/admin?key=<ADMIN_API_KEY>
```

---

## 6. 배포 후 정리 작업

| 항목 | 파일 | 내용 |
|------|------|------|
| console.log 제거 | `dreamtown-frontend/src/pages/PromiseLocationPage.jsx` | `console.log('CREATE_PAGE_MOUNTED')` 삭제 |
| 테스트 데이터 정리 | DB | `DELETE FROM stars WHERE user_id LIKE 'deploy_test%'` |
| Admin 키 확인 | Render 환경변수 | `ADMIN_API_KEY` 설정 여부 |

---

## 7. 롤백 기준

| 상황 | 롤백 대상 |
|------|----------|
| `/api/stars` 500 연속 | `git revert 88318f8` |
| stars 테이블 없음 | `POST /api/admin/run-migration {"migration":"124"}` 재실행 |
| Admin 대시보드 502 | `adminDashboardRoutes.js` 임시 비활성화 후 재배포 |

---

## 8. API 스펙 요약

### `POST /api/stars`
```json
Request:  { "user_id": "string", "wish_text": "string", "gem_type": "ruby|sapphire|emerald|diamond|citrine" }
Response: { "success": true, "star_id": "uuid", "status": "PRE-ON", "created_at": "ISO8601" }
```

### `GET /api/cablecar/entry?user_id=`
```json
Response: { "success": true, "status": "activated", "star_id": "uuid", "message": "당신의 별이 현실과 연결되었습니다" }
```

### `POST /api/logs`
```json
Request:  { "star_id": "uuid", "emotion": "string?", "tag": "string?" }
Response: { "success": true, "log_id": "uuid", "auto_text": "string", "created_at": "ISO8601" }
```

### `GET /api/messages?user_id=`
```json
Response: { "success": true, "day": 1, "message": "당신의 별이 조금 또렷해졌어요", "star_id": "uuid" }
```

### `GET /api/result?user_id=`
```json
# day < 30: 403
Response: { "success": false, "day": N, "days_left": N }
# day >= 30: 200
Response: { "success": true, "day": N, "summary": "...", "identity": "...", "share_text": "..." }
```

---

> **파이프라인 분 복구 예상:** Render 무료 플랜 기준 매월 1일 리셋. 현재 소진 상태.
> **긴급 배포 필요 시:** Render 대시보드에서 수동 Deploy 트리거 (파이프라인 외 방법 없음).
