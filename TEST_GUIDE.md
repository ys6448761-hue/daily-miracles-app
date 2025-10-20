# 🧪 Daily Miracles App - 테스트 가이드

배포 완료 후 다음 절차로 검증하세요.

---

## ✅ 1. 헬스체크 테스트

```powershell
# PowerShell
Invoke-RestMethod https://daily-miracles-app.onrender.com/api/health

# 또는 curl (Git Bash)
curl https://daily-miracles-app.onrender.com/api/health
```

**예상 응답:**
```json
{
  "status": "standby"
}
```

**✅ 통과 조건:** HTTP 200 OK, status 필드 존재

---

## ✅ 2. 루트 엔드포인트 테스트

```powershell
Invoke-RestMethod https://daily-miracles-app.onrender.com/

# 또는
curl https://daily-miracles-app.onrender.com/
```

**예상 응답:**
```json
{
  "service": "Daily Miracles MVP",
  "version": "1.0.0",
  "status": "standby",
  "endpoints": {
    "health": "/api/health",
    "dashboard": "/api/dashboard",
    "story": "/api/story/create",
    "miracle": "/api/miracle/calculate",
    "problem": "/api/problem/analyze"
  }
}
```

**✅ 통과 조건:** HTTP 200 OK, 모든 필드 존재

---

## ✅ 3. 폼 페이지 접속 테스트

**URL:** https://daily-miracles-app.onrender.com/daily-miracles.html

**확인사항:**
- [ ] 페이지 정상 로드
- [ ] 폼 필드 모두 표시
- [ ] 제출 버튼 작동
- [ ] 콘솔 에러 없음

---

## ✅ 4. API 호환 라우트 테스트

### 4-1. Story 생성 별칭

```powershell
# 별칭 라우트 (/api/create-story)
Invoke-RestMethod -Uri https://daily-miracles-app.onrender.com/api/create-story `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"userInput":{"wish":"테스트"}}'
```

**✅ 통과 조건:**
- HTTP 200 OK (Orchestrator 비활성화 시 `orchestrator_not_ready` 응답)
- 404 오류 ❌ 발생하지 않음

### 4-2. Miracle 계산 별칭

```powershell
# /api/miracle/calc
Invoke-RestMethod -Uri https://daily-miracles-app.onrender.com/api/miracle/calc `
  -Method POST `
  -ContentType "application/json" `
  -Body '{}'
```

**✅ 통과 조건:** 404 오류 발생하지 않음

---

## ✅ 5. 최신 결과 조회 API 테스트

```powershell
# Story 최신 결과
Invoke-RestMethod https://daily-miracles-app.onrender.com/api/story/latest

# Miracle 최신 결과
Invoke-RestMethod https://daily-miracles-app.onrender.com/api/miracle/latest

# Problem 최신 결과
Invoke-RestMethod https://daily-miracles-app.onrender.com/api/problem/latest
```

**예상 응답 (데이터 없을 때):**
```json
{
  "error": "no_story",
  "message": "No recent story found"
}
```

**✅ 통과 조건:** HTTP 404 (데이터 없음) 또는 HTTP 200 (데이터 있음)

---

## ✅ 6. 결과 페이지 테스트

**URL:** https://daily-miracles-app.onrender.com/daily-miracles-result.html

**확인사항:**
- [ ] 페이지 로드 시 API 호출 확인 (개발자 도구 → Network 탭)
- [ ] `/api/story/latest` 요청 확인
- [ ] 데이터 없을 때: "결과를 불러올 수 없습니다" 표시
- [ ] 데이터 있을 때: 결과 내용 표시

---

## ✅ 7. CORS 테스트 (브라우저)

브라우저 콘솔에서 실행:

```javascript
fetch('https://daily-miracles-app.onrender.com/api/health')
  .then(res => res.json())
  .then(data => console.log('✅ CORS 작동:', data))
  .catch(err => console.error('❌ CORS 오류:', err));
```

**✅ 통과 조건:**
- CORS 오류 없음
- 응답 성공

---

## ✅ 8. 종합 시나리오 테스트

### Scenario: 사용자가 폼 제출 → 결과 페이지 이동

1. **폼 페이지 접속**
   - https://daily-miracles-app.onrender.com/daily-miracles.html

2. **데이터 입력**
   - 모든 필드 입력

3. **제출 버튼 클릭**
   - 개발자 도구 Network 탭 열기
   - POST 요청 확인 (예: `/api/create-story` 또는 `/api/story/create`)
   - 응답 확인

4. **리다이렉트 확인**
   - 결과 페이지로 자동 이동 확인
   - URL: `/daily-miracles-result.html#latest`

5. **결과 표시 확인**
   - API 호출 확인 (`/api/story/latest`)
   - 데이터 표시 확인
   - 콘솔 에러 없음

---

## 🐛 문제 발생 시 디버깅

### 404 "Endpoint not found" 오류

**원인:** 별칭 라우트가 작동하지 않음

**확인:**
```bash
# 서버 로그 확인 (Render Dashboard → Logs)
⚠️ 404 Not Found: POST /api/create-story
```

**해결:**
- 서버가 최신 코드로 배포되었는지 확인
- `server.js`에 별칭 라우트 존재 확인

---

### "결과를 불러올 수 없습니다"

**원인:** API에서 데이터를 가져오지 못함

**확인:**
```javascript
// 브라우저 콘솔
fetch('/api/story/latest')
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
```

**해결:**
- 한 번이라도 제출이 성공했는지 확인
- 서버 메모리 저장소가 비어있지 않은지 확인

---

### CORS 오류

**오류 메시지:**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**확인:**
```bash
# Render Dashboard → Environment Variables
ALLOWED_ORIGINS=https://daily-miracles-app.onrender.com,...
```

**해결:**
- `ALLOWED_ORIGINS`에 현재 도메인 포함되었는지 확인
- render.yaml 업데이트 후 재배포

---

## 📊 체크리스트

배포 후 다음을 확인하세요:

- [ ] `/api/health` → 200 OK
- [ ] `/` → 200 OK, 서비스 정보 반환
- [ ] `/daily-miracles.html` → 페이지 로드 성공
- [ ] 폼 제출 시 404 오류 없음
- [ ] 서버 로그에 404 없음
- [ ] `/api/story/latest` → 404 (데이터 없음) 또는 200 (데이터 있음)
- [ ] 결과 페이지 → API 호출 확인
- [ ] CORS 오류 없음
- [ ] 브라우저 콘솔 에러 없음

---

## 🚀 성공 기준 (Acceptance Criteria)

✅ **모든 API 엔드포인트 200 또는 예상된 에러 응답**
✅ **404 "Endpoint not found" 오류 제거**
✅ **결과 페이지에 최신 데이터 표시**
✅ **CORS 차단 없음**
✅ **서버 로그 정상 (404 없음)**

---

**테스트 완료 시각:** _______________
**테스트 담당자:** _______________
**결과:** ✅ 통과 / ❌ 실패
**비고:** _______________________
