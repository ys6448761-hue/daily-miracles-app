# 🗄️ Daily Miracles MVP - PostgreSQL Database Setup Guide

Render에서 PostgreSQL 데이터베이스를 생성하고 마이그레이션을 실행하는 가이드입니다.

---

## 📋 준비사항

- [x] Render 계정 (https://render.com)
- [x] `database/render_migration.sql` 파일
- [x] psql CLI 설치 (선택사항 - Render Dashboard로도 가능)

---

## 1️⃣ Render에서 PostgreSQL 데이터베이스 생성

### 1-1. Render Dashboard 접속

1. https://dashboard.render.com 로그인
2. 좌측 메뉴에서 **"New +"** 클릭
3. **"PostgreSQL"** 선택

### 1-2. 데이터베이스 설정

```
Name:           daily-miracles-db
Database:       daily_miracles
User:           (자동 생성)
Region:         Singapore (Southeast Asia) 또는 Oregon (US West)
PostgreSQL Ver: 16 (최신 버전)
Instance Type:  Free (개발용)
```

### 1-3. 생성 완료 대기

- 생성 완료까지 약 2-3분 소요
- 상태가 **"Available"**로 변경되면 준비 완료

---

## 2️⃣ 데이터베이스 연결 정보 확인

### 2-1. Internal Database URL 복사

Render Dashboard → PostgreSQL 인스턴스 → **Info** 탭:

```
Internal Database URL:
postgresql://daily_miracles_user:xxxxx@dpg-xxxxx-a/daily_miracles
```

⚠️ **주의:** External URL이 아닌 **Internal Database URL** 사용 (Render 내부 통신용)

### 2-2. Connection Parameters 확인

```
Hostname:  dpg-xxxxx-a.singapore-postgres.render.com
Port:      5432
Database:  daily_miracles
Username:  daily_miracles_user
Password:  (자동 생성된 비밀번호)
```

---

## 3️⃣ 마이그레이션 실행

### 방법 A: Render Dashboard에서 직접 실행 (권장)

1. **PSQL 콘솔 열기**
   - Render Dashboard → PostgreSQL 인스턴스
   - 상단 **"Connect"** → **"PSQL Command"** 복사

   ```bash
   PGPASSWORD=xxxxx psql -h dpg-xxxxx-a.singapore-postgres.render.com -U daily_miracles_user daily_miracles
   ```

2. **마이그레이션 파일 실행**

   **Option 1: 파일 업로드 후 실행**
   ```sql
   \i /path/to/render_migration.sql
   ```

   **Option 2: 내용 복사 붙여넣기**
   - `database/render_migration.sql` 파일 내용을 모두 복사
   - PSQL 콘솔에 붙여넣기
   - Enter 키로 실행

3. **실행 확인**
   ```
   ✅ Migration completed successfully!
      - Tables created: story_results, feedbacks, api_logs, sessions
      - Views created: feedback_stats, daily_analysis_stats, api_performance_stats
      - Functions created: get_latest_story_result, cleanup_expired_sessions, cleanup_old_api_logs
      - Triggers created: auto-update updated_at columns
   ```

### 방법 B: 로컬 psql에서 실행

**Windows PowerShell:**
```powershell
# 환경 변수 설정
$env:PGPASSWORD="your_password_here"

# 마이그레이션 실행
psql -h dpg-xxxxx-a.singapore-postgres.render.com `
     -U daily_miracles_user `
     -d daily_miracles `
     -f database/render_migration.sql
```

**Mac/Linux:**
```bash
PGPASSWORD='your_password_here' psql \
  -h dpg-xxxxx-a.singapore-postgres.render.com \
  -U daily_miracles_user \
  -d daily_miracles \
  -f database/render_migration.sql
```

---

## 4️⃣ 마이그레이션 검증

### 4-1. 테이블 생성 확인

```sql
-- PSQL 콘솔에서 실행
\dt

-- 예상 결과:
--  Schema |      Name       | Type  |       Owner
-- --------+-----------------+-------+-------------------
--  public | api_logs        | table | daily_miracles_user
--  public | feedbacks       | table | daily_miracles_user
--  public | sessions        | table | daily_miracles_user
--  public | story_results   | table | daily_miracles_user
```

### 4-2. 뷰 생성 확인

```sql
\dv

-- 예상 결과:
--  Schema |         Name             | Type |       Owner
-- --------+--------------------------+------+-------------------
--  public | api_performance_stats    | view | daily_miracles_user
--  public | daily_analysis_stats     | view | daily_miracles_user
--  public | feedback_stats           | view | daily_miracles_user
```

### 4-3. 함수 생성 확인

```sql
\df

-- 예상 결과:
--  Schema |           Name               | Result data type
-- --------+------------------------------+------------------
--  public | cleanup_expired_sessions     | integer
--  public | cleanup_old_api_logs         | integer
--  public | get_latest_story_result      | TABLE
--  public | update_updated_at_column     | trigger
```

### 4-4. 인덱스 확인

```sql
\di

-- story_results, feedbacks, api_logs, sessions 관련 인덱스 확인
```

---

## 5️⃣ Render Web Service에 DATABASE_URL 연결

### 5-1. Environment Variable 추가

1. **Web Service 설정**
   - Render Dashboard → daily-miracles-app (Web Service)
   - **Environment** 탭 클릭

2. **DATABASE_URL 추가**
   ```
   Key:   DATABASE_URL
   Value: (PostgreSQL Internal Database URL 붙여넣기)
   ```

3. **저장 및 재배포**
   - **Save Changes** 클릭
   - 자동으로 재배포 시작

### 5-2. 연결 확인

재배포 완료 후:

```bash
# 헬스체크
curl https://daily-miracles-app.onrender.com/api/health

# 예상 응답:
# {"status":"ok","timestamp":"2025-01-24T...","database":"connected"}
```

---

## 6️⃣ 테스트 데이터 삽입 (선택)

### 6-1. 테스트 분석 결과 삽입

```sql
INSERT INTO story_results (user_input, analysis_data, user_name, miracle_index, execution_time)
VALUES (
    '{"wish": "관계를 개선하고 싶어요"}'::JSONB,
    '{"userProfile": {"name": "테스트", "miracleIndex": 75}}'::JSONB,
    '테스트',
    75,
    1500
);
```

### 6-2. 테스트 피드백 삽입

```sql
INSERT INTO feedbacks (satisfaction, helpful, improvements, accuracy, recommendation, contact)
VALUES (
    5,
    ARRAY['8단계 분석', '액션플랜', '관계 분석'],
    '매우 만족합니다',
    5,
    10,
    'test@example.com'
);
```

### 6-3. 데이터 조회

```sql
-- 최신 분석 결과 조회
SELECT * FROM get_latest_story_result();

-- 피드백 통계 조회
SELECT * FROM feedback_stats;

-- 일별 분석 통계
SELECT * FROM daily_analysis_stats;
```

---

## 7️⃣ 유지보수 쿼리

### 만료된 세션 정리

```sql
SELECT cleanup_expired_sessions();
```

### 오래된 API 로그 정리 (30일 이상)

```sql
SELECT cleanup_old_api_logs(30);
```

### 데이터베이스 크기 확인

```sql
SELECT
    pg_size_pretty(pg_database_size('daily_miracles')) as database_size,
    pg_size_pretty(pg_total_relation_size('story_results')) as story_results_size,
    pg_size_pretty(pg_total_relation_size('feedbacks')) as feedbacks_size;
```

---

## 8️⃣ 트러블슈팅

### ❌ "FATAL: password authentication failed"

**원인:** 비밀번호 불일치

**해결:**
- Render Dashboard에서 정확한 Internal Database URL 다시 복사
- PGPASSWORD 환경변수 재설정

### ❌ "could not connect to server"

**원인:** 네트워크 또는 방화벽 이슈

**해결:**
- External Database URL 대신 Internal Database URL 사용 확인
- Render 같은 Region에 Web Service와 PostgreSQL 배치 확인

### ❌ "relation already exists"

**원인:** 마이그레이션 중복 실행

**해결:**
- `CREATE TABLE IF NOT EXISTS` 구문 사용하므로 무해함
- 완전 재생성 필요 시:
  ```sql
  DROP TABLE IF EXISTS story_results, feedbacks, api_logs, sessions CASCADE;
  \i render_migration.sql
  ```

### ❌ server.js에서 DB 연결 실패

**원인:** DATABASE_URL 환경변수 미설정 또는 pg 모듈 미설치

**해결:**
1. Render Environment에 DATABASE_URL 존재 확인
2. `package.json`에 `pg` 의존성 추가 확인
3. 재배포 후 로그 확인

---

## 📊 마이그레이션 체크리스트

배포 전 확인:

- [ ] PostgreSQL 인스턴스 생성 완료 (Status: Available)
- [ ] `render_migration.sql` 실행 완료
- [ ] 테이블 4개 생성 확인 (`\dt`)
- [ ] 뷰 3개 생성 확인 (`\dv`)
- [ ] 함수 4개 생성 확인 (`\df`)
- [ ] Web Service에 DATABASE_URL 환경변수 추가
- [ ] 재배포 완료 및 헬스체크 성공
- [ ] 테스트 데이터 삽입/조회 성공
- [ ] 피드백 API 테스트 성공

---

## 🚀 다음 단계

1. **server.js PostgreSQL 통합**
   - `database/db.js` 생성
   - `latestStore` 메모리 저장소 → DB 저장으로 전환

2. **Feedback 시스템 DB 전환**
   - 파일 기반 `feedback.json` → `feedbacks` 테이블로 마이그레이션

3. **API 로깅 활성화**
   - 모든 API 요청을 `api_logs` 테이블에 기록

4. **세션 관리**
   - Express Session + PostgreSQL 연동

---

**마이그레이션 완료 시각:** _______________
**담당자:** _______________
**결과:** ✅ 성공 / ❌ 실패
**비고:** _______________________
