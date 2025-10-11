# 🚀 Render 배포 가이드 - Daily Miracles App

## 📋 배포 개요

**GitHub 저장소**: `https://github.com/ys6448761-hue/daily-miracles-app`

**배포 타입**: Web Service (Node.js + Express + Static Files)

**예상 배포 시간**: 5-10분

---

## 1️⃣ Render 대시보드 접속

### Step 1: 로그인
1. https://render.com 접속
2. **GitHub 계정으로 로그인**
3. GitHub 권한 승인 (처음 로그인 시)

### Step 2: 새 Web Service 생성
1. 대시보드에서 **"New +"** 버튼 클릭
2. **"Web Service"** 선택

---

## 2️⃣ 저장소 연결

### GitHub 저장소 선택

1. **"Connect a repository"** 섹션에서 검색
2. `daily-miracles-app` 찾기
3. **"Connect"** 버튼 클릭

💡 **저장소가 안 보이면?**
- "Configure account" 클릭
- GitHub에서 Render 앱 권한 설정
- 저장소 접근 권한 추가

---

## 3️⃣ 서비스 설정

### 기본 정보 입력

| 항목 | 값 |
|------|-----|
| **Name** | `daily-miracles-app` |
| **Region** | `Singapore (Southeast Asia)` 추천 |
| **Branch** | `main` |
| **Root Directory** | ` ` (비워두기) |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

### Instance Type
- **Free** (무료 플랜) 선택
  - 750시간/월 무료
  - 15분 비활성 후 슬립 모드
  - 충분한 성능!

---

## 4️⃣ 환경 변수 설정 (Environment Variables)

**"Environment Variables"** 섹션에서 추가:

### 필수 환경 변수

| Key | Value | 비고 |
|-----|-------|------|
| `NODE_ENV` | `production` | 프로덕션 모드 |
| `PORT` | `3000` | Render가 자동 할당 (선택사항) |
| `OPENAI_API_KEY` | `sk-proj-...` | ⚠️ 실제 API 키 입력! |
| `DATABASE_URL` | `file:./data/miracle.db` | SQLite 경로 |

### 선택 환경 변수 (추가 시 더 안정적)

| Key | Value |
|-----|-------|
| `LOG_LEVEL` | `info` |
| `CORS_ORIGIN` | `*` |

**⚠️ 중요**:
- `OPENAI_API_KEY`는 OpenAI 대시보드에서 발급받은 실제 키 입력
- Secret Files는 설정하지 않아도 됨 (SQLite가 자동 생성)

---

## 5️⃣ 고급 설정 (Advanced)

### Auto-Deploy
- **"Auto-Deploy"** 활성화 (기본값)
- GitHub push 시 자동 재배포

### Health Check Path (선택사항)
- Path: `/health`
- 서버 상태 모니터링

### Persistent Disk (데이터베이스 유지 - 선택사항)
⚠️ **주의**: Free 플랜은 Persistent Disk 미지원
- 데이터가 재배포 시 초기화될 수 있음
- 프로덕션에서는 PostgreSQL 추천 (별도 설정)

---

## 6️⃣ 배포 시작!

### Step 1: 설정 확인
```
✓ Name: daily-miracles-app
✓ Build Command: npm install
✓ Start Command: node server.js
✓ Environment Variables: 설정 완료
```

### Step 2: "Create Web Service" 클릭

### Step 3: 빌드 로그 확인
- 자동으로 빌드 시작
- 로그에서 진행 상황 확인
- 약 3-5분 소요

**빌드 단계:**
```bash
1. Cloning repository...
2. Installing dependencies (npm install)...
3. Build complete!
4. Starting service (node server.js)...
5. Deploy live! ✅
```

---

## 7️⃣ 배포 완료 확인

### 배포 URL 확인
```
https://daily-miracles-app.onrender.com
```

Render가 자동으로 생성한 URL 사용

### 테스트 체크리스트

1. **헬스 체크**
   ```bash
   curl https://daily-miracles-app.onrender.com/health
   ```
   응답: `{"status":"ok","message":"하루하루의 기적 백엔드 서버가 실행 중입니다."}`

2. **메인 페이지**
   ```
   https://daily-miracles-app.onrender.com/
   ```

3. **결과 페이지**
   ```
   https://daily-miracles-app.onrender.com/result.html
   ```

4. **테스트 페이지**
   ```
   https://daily-miracles-app.onrender.com/test-result.html
   ```

5. **API 엔드포인트**
   ```bash
   curl -X POST https://daily-miracles-app.onrender.com/api/select-mode \
     -H "Content-Type: application/json" \
     -d '{"mode":"wish"}'
   ```

---

## 8️⃣ 배포 후 설정

### 커스텀 도메인 연결 (선택사항)

1. Render 대시보드 → **"Settings"** 탭
2. **"Custom Domains"** 섹션
3. 도메인 추가:
   - 예: `miracles.yourdomain.com`
4. DNS 설정 (도메인 제공업체에서)
   - CNAME: `daily-miracles-app.onrender.com`

### HTTPS (자동 제공)
- Render가 자동으로 SSL 인증서 발급
- `https://` 자동 활성화

---

## 9️⃣ 환경 변수 업데이트

나중에 환경 변수 변경 시:

1. Render 대시보드
2. 해당 서비스 선택
3. **"Environment"** 탭
4. 변수 수정
5. **"Save Changes"** 클릭
6. 자동 재배포됨

---

## 🔟 모니터링 & 로그

### 실시간 로그 확인
1. 대시보드 → 서비스 선택
2. **"Logs"** 탭
3. 실시간 서버 로그 확인

### 메트릭 확인
- **"Metrics"** 탭
- CPU, 메모리, 네트워크 사용량
- 응답 시간

### 이벤트 확인
- **"Events"** 탭
- 배포 히스토리
- 에러 및 경고

---

## 🐛 트러블슈팅

### 문제 1: 빌드 실패

**증상**: Build failed, npm install error

**해결**:
```bash
# 로컬에서 테스트
npm install
npm start

# package.json 확인
# node_modules 삭제 후 재설치
```

**Render에서**:
- Clear build cache & deploy

### 문제 2: 서버 시작 실패

**증상**: Deploy failed, application error

**원인**: Start Command 오류

**해결**:
- Start Command: `node server.js` 확인
- `server.js` 파일 위치 확인 (루트에 있어야 함)

### 문제 3: 환경 변수 인식 안 됨

**증상**: OPENAI_API_KEY is not defined

**해결**:
1. Environment 탭에서 변수 재확인
2. 변수 저장 후 Manual Deploy 클릭
3. 로그에서 환경 변수 로드 확인

### 문제 4: 슬립 모드 (Free 플랜)

**증상**: 15분 비활성 후 느린 응답

**이유**: Free 플랜은 비활성 시 슬립 모드

**해결**:
- 첫 요청 후 30초 정도 대기 (웜업 시간)
- 프로덕션: Starter 플랜 ($7/월) 추천

### 문제 5: 데이터베이스 초기화

**증상**: 재배포 시 데이터 사라짐

**원인**: Free 플랜은 Persistent Disk 미지원

**해결**:
- PostgreSQL 사용 추천 (무료: Render PostgreSQL)
- 또는 외부 DB 사용 (Supabase, Neon 등)

### 문제 6: CORS 에러

**증상**: Wix에서 API 호출 실패

**해결**:
`server.js`에서 CORS 설정:
```javascript
app.use(cors({
  origin: ['https://your-wix-site.com', '*'],
  credentials: true
}));
```

---

## 🔄 재배포 방법

### 자동 재배포 (추천)
```bash
# 코드 수정 후
git add .
git commit -m "기능 추가"
git push origin main

# Render가 자동으로 감지하고 재배포 (약 3-5분)
```

### 수동 재배포
1. Render 대시보드
2. **"Manual Deploy"** 버튼 클릭
3. **"Deploy latest commit"** 선택

### 특정 커밋 배포
1. **"Manual Deploy"**
2. **"Deploy a specific commit"**
3. 커밋 해시 입력

---

## 📊 비용 (Free 플랜)

**무료 사용량:**
- ✅ 750시간/월 (무료)
- ✅ 100GB 대역폭/월
- ✅ HTTPS 자동 제공
- ✅ 자동 재배포
- ⚠️ 15분 비활성 시 슬립

**Starter 플랜 ($7/월):**
- 슬립 모드 없음
- 더 많은 리소스
- 프로덕션 추천

---

## 🔗 Wix 연동

### Wix에서 사용할 API URL
```javascript
const API_URL = 'https://daily-miracles-app.onrender.com';
```

### Wix Custom Code 예시
```javascript
// Wix 페이지에서
import wixFetch from 'wix-fetch';

$w.onReady(function () {
  // 기적 계산 API 호출
  wixFetch.fetch('https://daily-miracles-app.onrender.com/api/miracle/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: '...' })
  })
  .then(res => res.json())
  .then(data => console.log(data));
});
```

### iframe 삽입 (더 간단한 방법)
```html
<iframe
  src="https://daily-miracles-app.onrender.com"
  width="100%"
  height="800px"
  frameborder="0">
</iframe>
```

---

## 📝 배포 설정 요약

### 빠른 설정 (복사 & 붙여넣기)

**Render Web Service 설정:**
```
Name: daily-miracles-app
Region: Singapore (Southeast Asia)
Branch: main
Build Command: npm install
Start Command: node server.js
Instance Type: Free
```

**Environment Variables:**
```
NODE_ENV=production
OPENAI_API_KEY=sk-proj-your-key-here
DATABASE_URL=file:./data/miracle.db
```

**배포 URL:**
```
https://daily-miracles-app.onrender.com
```

---

## ✅ 배포 체크리스트

배포 전:
- [ ] GitHub 저장소 푸시 완료
- [ ] `server.js` 루트에 위치
- [ ] `package.json` 확인
- [ ] OPENAI_API_KEY 준비

배포 중:
- [ ] Render 계정 생성/로그인
- [ ] Web Service 생성
- [ ] GitHub 저장소 연결
- [ ] 환경 변수 설정
- [ ] 빌드 명령어 설정

배포 후:
- [ ] 배포 URL 접속 확인
- [ ] `/health` 엔드포인트 테스트
- [ ] 메인 페이지 확인
- [ ] API 테스트
- [ ] Wix 연동 준비

---

## 🎯 다음 단계

1. ✅ Render 배포 완료
2. 📱 Wix에서 API URL 연결
3. 🧪 전체 플로우 테스트
4. 👥 사용자 피드백 수집
5. 🚀 기능 개선 및 업데이트

---

## 🆘 지원 & 문서

**Render 문서:**
- https://render.com/docs

**GitHub 저장소:**
- https://github.com/ys6448761-hue/daily-miracles-app

**API 문서:**
- 저장소의 README.md 참고

**문제 발생 시:**
1. Render 로그 확인
2. 로컬에서 `npm start` 테스트
3. GitHub Issues에 질문

---

## 🎉 축하합니다!

Daily Miracles App이 Render에 배포되었습니다!

**배포 URL**: `https://daily-miracles-app.onrender.com`

이제 전 세계 어디서든 접속 가능합니다! 🌍✨

**다음은 Wix 연동만 남았어요!** 🚀
