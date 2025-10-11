# 🚀 배포 가이드 - 하루하루의 기적

## 📋 배포 체크리스트

### ✅ 완료된 작업
- [x] Git 초기화 및 커밋
- [x] `.gitignore` 설정
- [x] `vercel.json` 설정
- [x] 메인 브랜치 설정 (main)

### 🔄 진행할 작업
- [ ] GitHub 저장소 생성
- [ ] GitHub에 푸시
- [ ] Vercel 배포

---

## 1️⃣ GitHub 저장소 생성

### 방법 A: GitHub 웹사이트에서 생성

1. https://github.com/new 접속
2. 저장소 정보 입력:
   - **Repository name**: `miracle-frontend`
   - **Description**: `하루하루의 기적 - 프론트엔드 & 백엔드`
   - **Visibility**: Public
   - **중요**: ❌ Initialize 옵션들 체크 해제 (README, .gitignore, license)
3. **Create repository** 클릭

### 방법 B: GitHub CLI 사용 (gh 설치 시)

```bash
gh repo create miracle-frontend --public --source=. --remote=origin --push
```

---

## 2️⃣ GitHub에 푸시

GitHub에서 저장소를 만든 후, 아래 명령어 실행:

```bash
cd "C:\Users\세진\OneDrive\바탕 화면\daily-miracles-mvp"

# Remote 추가 (GitHub에서 제공한 URL 사용)
git remote add origin https://github.com/[YOUR-USERNAME]/miracle-frontend.git

# 푸시
git push -u origin main
```

**푸시 완료 확인:**
- GitHub 저장소 페이지 새로고침
- 40개 파일이 올라갔는지 확인
- 커밋 메시지: "MVP 완성: 입력 + 결과 페이지"

---

## 3️⃣ Vercel 배포

### Step 1: Vercel 로그인

1. https://vercel.com 접속
2. GitHub 계정으로 로그인

### Step 2: 새 프로젝트 Import

1. **Add New** → **Project** 클릭
2. GitHub 저장소에서 `miracle-frontend` 선택
3. **Import** 클릭

### Step 3: 프로젝트 설정

**Framework Preset**: Other (자동 감지됨)

**Root Directory**: `.` (루트)

**Build Settings**:
- Build Command: `npm install` (자동)
- Output Directory: `public` (자동)
- Install Command: `npm install` (자동)

### Step 4: 환경 변수 설정

**Environment Variables** 섹션에서 추가:

| Name | Value |
|------|-------|
| `NODE_ENV` | `production` |
| `OPENAI_API_KEY` | `sk-...` (실제 API 키 입력) |
| `DATABASE_URL` | `file:./data/miracle.db` |

**중요**: Production, Preview, Development 모두 체크!

### Step 5: 배포 시작

1. **Deploy** 버튼 클릭
2. 빌드 로그 확인 (약 1-2분 소요)
3. 배포 완료 후 URL 확인

**배포 URL 예시:**
```
https://miracle-frontend.vercel.app
```

---

## 4️⃣ 배포 후 테스트

### 테스트 체크리스트:

1. **메인 페이지 접속**
   ```
   https://miracle-frontend.vercel.app
   ```

2. **결과 페이지 테스트**
   ```
   https://miracle-frontend.vercel.app/test-result.html
   ```

3. **API 엔드포인트 테스트**
   ```bash
   curl https://miracle-frontend.vercel.app/api/health
   ```

4. **전체 플로우 테스트**:
   - 모드 선택 → 3단계 질문 → 결과 페이지
   - 문제 분석 API
   - 소원 전환 API

---

## 5️⃣ Wix 연동 설정

### Wix에서 설정할 항목:

1. **Custom Code** 또는 **Embed HTML** 사용

2. **배포된 URL 사용**:
   ```javascript
   const API_URL = 'https://miracle-frontend.vercel.app';
   ```

3. **iframe 삽입** (선택사항):
   ```html
   <iframe
     src="https://miracle-frontend.vercel.app"
     width="100%"
     height="800px"
     frameborder="0">
   </iframe>
   ```

4. **CORS 설정 확인**:
   - `server.js`의 CORS 설정이 Wix 도메인 허용하는지 확인
   ```javascript
   app.use(cors({
     origin: ['https://miracle-frontend.vercel.app', 'https://your-wix-site.com']
   }));
   ```

---

## 🔧 배포 설정 파일

### `vercel.json`
```json
{
  "version": 2,
  "name": "miracle-frontend",
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 📊 배포 후 모니터링

### Vercel 대시보드에서 확인:

1. **Deployments**: 배포 상태 및 로그
2. **Analytics**: 방문자 통계
3. **Logs**: 실시간 서버 로그
4. **Domains**: 커스텀 도메인 설정

### 로그 확인:
```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# 로그 확인
vercel logs
```

---

## 🐛 트러블슈팅

### 문제 1: 빌드 실패

**원인**: 의존성 문제
**해결**:
```bash
# package.json 확인
npm install
npm run build  # 로컬에서 테스트
```

### 문제 2: API 404 에러

**원인**: 라우팅 설정 문제
**해결**: `vercel.json`의 routes 설정 확인

### 문제 3: 환경 변수 인식 안 됨

**해결**:
1. Vercel 대시보드 → Settings → Environment Variables
2. 변수 추가 후 Redeploy

### 문제 4: CORS 에러

**해결**:
`server.js`에서 CORS 설정 수정:
```javascript
app.use(cors({
  origin: '*',  // 또는 특정 도메인
  credentials: true
}));
```

---

## 🔄 업데이트 배포

### 코드 변경 후 재배포:

```bash
# 변경사항 커밋
git add .
git commit -m "기능 추가/수정 내용"
git push origin main
```

Vercel이 자동으로 감지하고 재배포됩니다! (약 1-2분 소요)

---

## 📞 지원

### Vercel 문서:
- https://vercel.com/docs

### GitHub 저장소:
- https://github.com/[YOUR-USERNAME]/miracle-frontend

### 문제 발생 시:
1. Vercel 로그 확인
2. GitHub Actions (있다면) 확인
3. 로컬에서 `npm start` 테스트

---

## ✅ 최종 확인사항

배포 완료 후 체크:

- [ ] GitHub 저장소 생성 완료
- [ ] 코드 푸시 완료
- [ ] Vercel 프로젝트 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] 배포 성공 (Green ✓)
- [ ] 메인 페이지 접속 가능
- [ ] API 엔드포인트 작동
- [ ] 결과 페이지 작동
- [ ] Wix 연동 준비 완료

**배포 URL**: `https://miracle-frontend.vercel.app`

---

## 🎉 배포 완료!

이제 Wix에서 이 URL을 사용하여 연결하면 됩니다!

**다음 단계**:
1. Wix 사이트에 URL 연결
2. 사용자 테스트
3. 피드백 수집
4. 기능 개선

🌟 축하합니다! 하루하루의 기적이 세상에 공개되었습니다!
