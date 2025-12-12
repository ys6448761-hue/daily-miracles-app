# Daily Miracles MVP 배포 체크리스트

> Render, Vercel 등 프로덕션 환경 배포를 위한 완벽 가이드

---

## 📋 목차

1. [환경 변수 설정](#1-환경-변수-설정)
2. [환경별 설정 분리](#2-환경별-설정-분리)
3. [CORS 및 보안 설정](#3-cors-및-보안-설정)
4. [Render 배포 가이드](#4-render-배포-가이드)
5. [Vercel 배포 가이드](#5-vercel-배포-가이드)
6. [배포 후 체크리스트](#6-배포-후-체크리스트)

---

## 1. 환경 변수 설정

### 필수 환경 변수

프로덕션 배포 전에 다음 환경 변수를 설정해야 합니다:

```bash
# 서버 설정
PORT=5100                                    # 서버 포트 (Render는 자동 할당)
NODE_ENV=production                          # 환경 (development | staging | production)

# OpenAI/Claude API
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx        # OpenAI API 키 (GPT-4 사용)

# CORS 설정
ALLOWED_ORIGINS=https://your-wix-site.com,https://admin.your-site.com

# 데이터베이스 (선택)
DATABASE_URL=postgresql://user:pass@host:5432/db
PGHOST=hostname
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name

# 로깅 설정
REQUEST_LOG=1                                # 요청 로깅 활성화 (0 또는 1)
LOG_LEVEL=info                               # 로그 레벨 (debug | info | warn | error)

# 보안 (향후)
API_KEY_SECRET=your-secret-key               # API 키 검증용 시크릿
RATE_LIMIT_MAX=100                          # Rate limit (요청/시간)
```

### 환경별 권장 설정

| 환경 | NODE_ENV | REQUEST_LOG | LOG_LEVEL | ALLOWED_ORIGINS |
|------|----------|-------------|-----------|-----------------|
| **로컬** | development | 1 | debug | * (모두 허용) |
| **스테이징** | staging | 1 | info | staging 도메인만 |
| **프로덕션** | production | 0 | warn | 프로덕션 도메인만 |

---

## 2. 환경별 설정 분리

### 2.1 `.env` 파일 구조

프로젝트 루트에 환경별 `.env` 파일 생성:

```
daily-miracles-mvp/
├── .env.local          # 로컬 개발용 (git에 커밋 안 됨)
├── .env.staging        # 스테이징 환경용
├── .env.production     # 프로덕션 환경용 (절대 커밋하지 말 것!)
└── .env.example        # 예시 파일 (git에 커밋)
```

### 2.2 `.env.example` 작성

```bash
# .env.example - 팀원들에게 공유할 예시 파일

# 서버 설정
PORT=5100
NODE_ENV=development

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# CORS (쉼표로 구분)
ALLOWED_ORIGINS=http://localhost:3000,https://your-wix-site.com

# 데이터베이스 (선택)
DATABASE_URL=postgresql://localhost:5432/daily_miracles

# 로깅
REQUEST_LOG=1
LOG_LEVEL=debug
```

### 2.3 `.gitignore` 설정 확인

```bash
# .gitignore에 추가
.env
.env.local
.env.staging
.env.production
.env.*.local

# 보안 파일
*.pem
*.key
secrets/
```

### 2.4 환경별 실행 스크립트

`package.json`에 추가:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "NODE_ENV=development nodemon server.js",
    "staging": "NODE_ENV=staging node server.js",
    "production": "NODE_ENV=production node server.js",
    "test": "NODE_ENV=test jest"
  }
}
```

---

## 3. CORS 및 보안 설정

### 3.1 Wix 도메인 허용 설정

`server.js`의 CORS 설정 부분 (이미 구현됨):

```javascript
// ALLOWED_ORIGINS 환경 변수 설정 예시
ALLOWED_ORIGINS=https://your-site.wixsite.com,https://www.your-domain.com
```

### 3.2 프로덕션 보안 체크리스트

#### ✅ 필수 보안 설정

- [ ] `NODE_ENV=production` 설정
- [ ] CORS `ALLOWED_ORIGINS`에 실제 Wix 도메인만 추가
- [ ] API 키를 환경 변수로 관리 (코드에 하드코딩 금지)
- [ ] `.env` 파일을 `.gitignore`에 추가
- [ ] HTTPS 사용 (Render/Vercel은 자동 제공)

#### 🔐 권장 보안 설정

- [ ] Rate Limiting 추가 (express-rate-limit)
- [ ] Helmet.js 미들웨어 추가
- [ ] 입력 데이터 검증 강화
- [ ] 에러 메시지에서 민감 정보 제거
- [ ] API Key 인증 추가 (v0.2)

### 3.3 Helmet.js 추가 (권장)

```bash
npm install helmet
```

`server.js`에 추가:

```javascript
const helmet = require('helmet');

// CORS 설정 앞에 추가
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
}
```

### 3.4 Rate Limiting 추가 (권장)

```bash
npm install express-rate-limit
```

`server.js`에 추가:

```javascript
const rateLimit = require('express-rate-limit');

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 100 요청
  message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
});

app.use('/api/', apiLimiter);
```

---

## 4. Render 배포 가이드

### 4.1 Render 배포 준비

1. **계정 생성**: https://render.com 회원가입
2. **GitHub 연동**: 프로젝트 저장소 연결

### 4.2 새 Web Service 생성

1. Render 대시보드에서 **"New +"** → **"Web Service"** 클릭
2. GitHub 저장소 선택
3. 다음 설정 입력:

| 항목 | 값 |
|------|-----|
| Name | `daily-miracles-api` |
| Region | `Singapore` (한국에서 가장 가까움) |
| Branch | `main` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | `Free` (또는 `Starter`) |

### 4.3 환경 변수 설정

Render 대시보드에서 **Environment** 탭:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
NODE_ENV=production
ALLOWED_ORIGINS=https://your-wix-site.com
REQUEST_LOG=0
LOG_LEVEL=warn
```

### 4.4 배포 확인

1. **Deploy** 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 후 URL 확인 (예: `https://daily-miracles-api.onrender.com`)
4. Health Check: `https://daily-miracles-api.onrender.com/api/health`

### 4.5 커스텀 도메인 연결 (선택)

1. Render 대시보드 → **Settings** → **Custom Domains**
2. 도메인 추가 (예: `api.daily-miracles.com`)
3. DNS 레코드 설정 (Render에서 제공하는 CNAME)

---

## 5. Vercel 배포 가이드

### 5.1 Vercel 설정

**주의**: Vercel은 Serverless Functions에 최적화되어 있어, Express 서버는 Render 권장

하지만 배포하려면:

1. **vercel.json** 파일 생성:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **환경 변수 설정**:
   - Vercel 대시보드 → **Settings** → **Environment Variables**
   - `OPENAI_API_KEY`, `ALLOWED_ORIGINS` 등 추가

3. **배포**:

```bash
npm install -g vercel
vercel --prod
```

---

## 6. 배포 후 체크리스트

### ✅ 기능 테스트

배포 후 다음 항목을 테스트하세요:

#### 1. Health Check
```bash
curl https://your-domain.com/api/health
```

예상 응답:
```json
{
  "success": true,
  "message": "여수 기적여행 API 서버가 정상 작동 중입니다",
  "database": "연결됨"
}
```

#### 2. 문제 해결 API 테스트
```bash
curl -X POST https://your-domain.com/api/problem/online-wish \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "테스터",
    "wishSummary": "배포 테스트입니다"
  }'
```

#### 3. CORS 테스트
Wix 사이트에서 실제 호출 테스트

#### 4. 카테고리 목록 조회
```bash
curl https://your-domain.com/api/problem/categories
```

### ✅ 모니터링 설정

#### Render 모니터링
- **Logs** 탭에서 실시간 로그 확인
- **Metrics** 탭에서 CPU/메모리 사용량 확인
- Alerts 설정 (에러 발생 시 이메일 알림)

#### 외부 모니터링 도구 (권장)
- **UptimeRobot**: https://uptimerobot.com (무료)
  - Health endpoint 주기적 체크
  - 다운타임 알림

- **Sentry**: https://sentry.io (에러 추적)
  ```bash
  npm install @sentry/node
  ```

### ✅ 성능 최적화

#### 1. 응답 시간 개선
- [ ] GPT-4 대신 GPT-3.5-turbo 사용 (더 빠름)
- [ ] 캐싱 추가 (같은 입력 반복 시)
- [ ] 데이터베이스 인덱스 최적화

#### 2. 비용 최적화
- [ ] OpenAI API 사용량 모니터링
- [ ] 불필요한 로깅 제거 (프로덕션)
- [ ] Free tier 한도 확인

### ✅ 백업 및 복구

#### 코드 백업
- [ ] GitHub에 정기적으로 push
- [ ] 태그/릴리스 버전 관리
- [ ] `.env` 파일은 별도 안전한 곳에 보관

#### 데이터베이스 백업 (있는 경우)
- [ ] 일일 자동 백업 설정
- [ ] 백업 복구 테스트

---

## 7. Wix와 연동 설정

### 7.1 Wix에서 API 호출 설정

Wix Velo 코드에서:

```javascript
// Wix Velo - 환경 변수 설정
const API_BASE_URL = 'https://daily-miracles-api.onrender.com';

export async function submitWish() {
  const response = await fetch(`${API_BASE_URL}/api/problem/online-wish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nickname: $w('#nicknameInput').value,
      wishSummary: $w('#wishSummaryInput').value
      // ... 나머지 필드
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log('성공:', result.data);
  } else {
    console.error('실패:', result.error);
  }
}
```

### 7.2 Wix CORS 설정

Render 환경 변수에 Wix 도메인 추가:

```bash
# Wix 사이트 도메인 (여러 개면 쉼표로 구분)
ALLOWED_ORIGINS=https://yourusername.wixsite.com/sitename,https://www.your-custom-domain.com
```

---

## 8. 트러블슈팅

### 문제: CORS 에러

**증상**: Wix에서 API 호출 시 `CORS policy` 에러

**해결**:
1. Render 환경 변수에 Wix 도메인 추가 확인
2. `server.js`의 CORS 설정 확인
3. Wix 사이트 URL이 정확한지 확인 (https:// 포함)

### 문제: 500 에러 (OpenAI API 실패)

**증상**: API 호출은 되지만 500 에러 반환

**해결**:
1. Render 로그에서 에러 메시지 확인
2. `OPENAI_API_KEY` 환경 변수 설정 확인
3. OpenAI API 크레딧 잔액 확인
4. OpenAI API 사용량 제한 확인

### 문제: 느린 응답 시간

**증상**: API 응답이 45초 이상 걸림

**해결**:
1. GPT-4 → GPT-3.5-turbo로 변경 고려
2. `max_tokens` 줄이기
3. Render Free tier → Starter tier로 업그레이드

### 문제: Render 서비스 Sleep

**증상**: 첫 요청이 매우 느림 (15분 이상 유휴 시)

**해결**:
1. **Render Starter plan** 사용 ($7/월, 항상 활성)
2. 또는 **UptimeRobot**으로 5분마다 ping
3. 또는 첫 요청 시 "로딩 중..." 메시지 표시

---

## 9. 체크리스트 요약

### 배포 전 (Pre-deployment)

- [ ] `.env.example` 파일 작성
- [ ] `.gitignore`에 `.env` 추가
- [ ] 환경 변수 모두 정리
- [ ] 프로덕션용 보안 설정 추가
- [ ] GitHub에 코드 push

### 배포 중 (Deployment)

- [ ] Render/Vercel 계정 생성
- [ ] Web Service 생성
- [ ] 환경 변수 설정
- [ ] 배포 및 빌드 확인

### 배포 후 (Post-deployment)

- [ ] Health Check API 테스트
- [ ] 문제 해결 API 테스트
- [ ] Wix에서 실제 호출 테스트
- [ ] CORS 정상 작동 확인
- [ ] 모니터링 설정
- [ ] 팀에게 API 문서 공유

---

## 📞 지원 및 문의

- **Render 지원**: https://render.com/docs
- **Vercel 지원**: https://vercel.com/docs
- **OpenAI API 상태**: https://status.openai.com
- **프로젝트 이슈**: GitHub Issues

---

## 📚 참고 자료

- [Render 배포 가이드](https://render.com/docs/deploy-node-express-app)
- [Express 프로덕션 Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js 환경 변수 관리](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)
- [CORS 이해하기](https://developer.mozilla.org/ko/docs/Web/HTTP/CORS)

---

**마지막 업데이트**: 2025-12-12
**작성자**: Daily Miracles 개발팀
