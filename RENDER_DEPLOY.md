# Render 배포 가이드 - Daily Miracles MVP

> 문제 해결 소원 API를 Render에 배포하는 단계별 가이드

---

## 🚀 빠른 배포 (5분)

### 1단계: Render 계정 생성

1. https://render.com 접속
2. **"Get Started for Free"** 클릭
3. GitHub 계정으로 로그인

### 2단계: 새 Web Service 생성

1. Render 대시보드에서 **"New +"** → **"Web Service"** 클릭
2. GitHub 저장소 연결
   - **"Connect account"** 클릭하여 GitHub 인증
   - 저장소 선택: `daily-miracles-mvp`
3. 다음 설정 입력:

| 항목 | 값 |
|------|-----|
| **Name** | `daily-miracles-api` |
| **Region** | `Singapore` (한국에서 가장 가까움) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** (테스트용) 또는 **Starter** ($7/월, 추천) |

### 3단계: 환경 변수 설정

**Environment** 탭에서 다음 변수 추가:

#### ✅ 필수 환경 변수

```bash
# OpenAI API 키 (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE

# Node 환경
NODE_ENV=production

# CORS 설정 (실제 Wix 도메인으로 변경)
ALLOWED_ORIGINS=https://yourusername.wixsite.com/daily-miracles

# 로깅 (프로덕션은 0 권장)
REQUEST_LOG=0
```

**중요**: 각 변수를 하나씩 **Add Environment Variable** 버튼으로 추가

### 4단계: 배포 시작

1. **"Create Web Service"** 버튼 클릭
2. 빌드 로그 확인 (2-3분 소요)
   ```
   ==> Building...
   ==> Installing dependencies...
   ==> Build successful
   ==> Deploying...
   ==> Deploy successful
   ```

3. 배포 완료 시 URL 확인
   ```
   https://daily-miracles-api.onrender.com
   ```

### 5단계: Health Check 테스트

브라우저에서 또는 curl로 테스트:

```bash
# Health Check
curl https://daily-miracles-api.onrender.com/api/health
```

**예상 응답:**
```json
{
  "success": true,
  "message": "여수 기적여행 API 서버가 정상 작동 중입니다",
  "timestamp": "2025-12-12T...",
  "database": "DB 모듈 없음"
}
```

### 6단계: 문제 해결 API 테스트

```bash
curl -X POST https://daily-miracles-api.onrender.com/api/problem/online-wish \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "테스터",
    "wishSummary": "배포 테스트입니다"
  }'
```

**성공 시** `{"success": true, ...}` 응답

---

## 🔧 배포 후 설정

### 커스텀 도메인 연결 (선택)

1. Render 대시보드 → **Settings** → **Custom Domains**
2. 도메인 추가 (예: `api.daily-miracles.com`)
3. DNS 레코드 설정 (Render에서 제공하는 CNAME)

### 환경 변수 업데이트

**Environment** 탭에서 언제든지 수정 가능:
- 변수 수정 후 자동 재배포됨
- **"Save Changes"** 클릭

---

## 📊 모니터링

### 로그 확인

**Logs** 탭에서 실시간 로그 확인:
```
✅ 문제 해결 라우터 로드 성공
✅ 문제 해결 API 라우터 등록 완료
🌟 Daily Miracles MVP Server (FINAL)
📡 Port: 10000
```

### 성능 메트릭

**Metrics** 탭에서 확인:
- CPU 사용량
- 메모리 사용량
- 요청 수

---

## ⚠️ 중요 사항

### Free Tier 제한

- **15분 유휴 시 Sleep** → 첫 요청 느림 (10-15초)
- **월 750시간 무료**
- 해결책:
  1. **Starter Plan** ($7/월) → 항상 활성
  2. UptimeRobot으로 5분마다 ping

### Starter Plan 권장 이유

- ✅ Sleep 없음 (항상 활성)
- ✅ 빠른 응답 시간
- ✅ 512MB 메모리
- ✅ 프로덕션 사용 가능

---

## 🔒 보안 체크리스트

배포 전 확인:

- [ ] OpenAI API 키를 환경 변수로 설정 (코드에 하드코딩 X)
- [ ] `ALLOWED_ORIGINS`에 실제 Wix 도메인만 추가
- [ ] `NODE_ENV=production` 설정
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] GitHub에 `.env` 파일 커밋 안 됨

---

## 🎯 최종 API URL

배포 완료 후 Wix에서 사용할 URL:

```
POST https://daily-miracles-api.onrender.com/api/problem/online-wish
```

이 URL을 Wix Velo 코드에 복사하세요!

---

## 🆘 트러블슈팅

### 문제: 502 Bad Gateway

**원인**: 서버가 시작되지 않음

**해결**:
1. Logs 탭에서 에러 확인
2. `OPENAI_API_KEY` 환경 변수 확인
3. `package.json`의 `start` 스크립트 확인

### 문제: CORS 에러

**원인**: `ALLOWED_ORIGINS`에 Wix 도메인 누락

**해결**:
1. Environment 탭에서 `ALLOWED_ORIGINS` 확인
2. Wix 사이트 URL 정확히 추가 (https:// 포함)
3. 저장 후 자동 재배포 대기

### 문제: OpenAI API 에러

**원인**: API 키 잘못됨 또는 크레딧 소진

**해결**:
1. https://platform.openai.com/account/api-keys 에서 키 확인
2. https://platform.openai.com/account/billing 에서 크레딧 확인
3. 새 키 발급 후 환경 변수 업데이트

---

## 📞 지원

- **Render 지원**: https://render.com/docs
- **Render 상태**: https://status.render.com
- **프로젝트 이슈**: GitHub Issues

---

**작성일**: 2025-12-12
**버전**: v1.0
