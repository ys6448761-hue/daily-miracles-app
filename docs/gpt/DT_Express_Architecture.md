# DreamTown Express Architecture (daily-miracles-mvp)

Version: v1.0
Created: 2026-03-16
Purpose: DreamTown Code Architect GPT — Express 백엔드 구조 가이드

---

## 기술 스택

| 항목 | 버전 / 값 | 역할 |
|------|----------|------|
| Node.js | 20.x | 런타임 |
| Express.js | 4.x | HTTP 프레임워크 |
| PostgreSQL | Render 운영 | 운영 DB |
| SQLite | 로컬 개발 | 개발 DB |
| OpenAI | GPT-4 / DALL-E 3 | AI 분석/이미지 |
| SENS (Naver Cloud) | 알림톡 + SMS | 메시지 발송 |
| NicePay | 결제 | 결제 |
| compression | gzip 압축 | 성능 |
| dotenv | 환경변수 | 설정 |

---

## 서버 부팅 순서 (server.js)

```
1. dotenv.config()
2. 환경변수 검증 (envValidator)
3. OPS_SLACK_WEBHOOK 게이트 (프로덕션 필수)
4. Express 앱 초기화
5. compression 미들웨어
6. gateMiddleware (APP_DISABLED 게이트)
7. 서비스 로드 (metricsService, opsAgentService, airtable, slack 등)
8. 글로벌 에러 핸들러 등록
9. 모드 레지스트리 로드 (modes.registry.json)
10. 라우트 마운트 (25+ 라우트)
11. 정적 파일 서빙 (public/)
12. app.listen (PORT 5000/5100)
```

---

## 라우트 마운트 (server.js)

```javascript
// 핵심 소원 API
app.use('/api/wishes',        wishRoutes)
app.use('/api/wish-intake',   wishIntakeRoutes)
app.use('/api/wish-image',    wishImageRoutes)
app.use('/api/challenge',     challengeRoutes)

// 분석 (직접 핸들러)
app.post('/api/daily-miracles/analyze', coreAnalyzeHandler)
app.get('/api/story/latest',            latestStoryHandler)
app.get('/api/dt/stars/:id',            dtStarHandler)

// 인증 / 사용자
app.use('/api/auth',          authRoutes)
app.use('/api/wu',            wuRoutes)
app.use('/api/point',         pointRoutes)
app.use('/api/referral',      referralRoutes)

// 커뮤니티
app.use('/api/harbor',        harborRoutes)

// 운영
app.use('/ops',               opsRoutes)
app.use('/api/ops',           opsRoutes)  // 이중 경로
app.use('/api/certificate',   certificateRoutes)
app.use('/api/video-job',     videoJobRoutes)
app.use('/api/aurora-job',    auroraJobRoutes)

// 기타
app.use('/api/v2/quote',      quoteRoutes)
app.use('/api/v2/itinerary',  itineraryRoutes)
app.use('/r',                 shortLinkRoutes)
app.use('/api/settlement',    settlementRoutes)
app.use('/api/program',       programRoutes)
// ...

// 정적 파일 (마지막)
app.use(express.static('public'))
```

---

## 핵심 비즈니스 로직

### 1. 소원 접수 파이프라인 (`wishRoutes.js POST /api/wishes`)

```
요청 수신
  → 입력 검증 (name, wish 필수)
  → classifyWish(wish) → trafficLight 판정
      RED   → 관리자 SMS 즉시 발송, ACK 미발송, 응답 반환
      YELLOW/GREEN → 계속
  → calculateUnifiedScore(wish) → miracleScore (50~100)
  → getCurrentStage(score) → current_stage {code, label, desc}
  → getSummaryAndAction(level, code) → summary_line + today_action
  → 데이터 저장 (wish_entries)
  → 기록 (metricsService: recordWishInbox, recordTrafficLight)
  → ACK 메시지 발송 (want_message && phone → messageProvider)
  → JSON 응답 반환
```

### 2. 신호등 분류 (`classifyWish()` in wishRoutes.js)

```javascript
RED 키워드: ['자살', '죽고싶', '자해', '손목', '목숨', '끝내고싶',
             '사라지고싶', '없어지고싶', '포기하고싶', '살기싫' ...]
YELLOW 키워드: ['힘들', '우울', '불안', '지쳐', '무기력' ...]
GREEN: 나머지
```

### 3. 기적지수 계산 (`miracleScoreEngine.js`)

3가지 입력 경로:
- 소원 텍스트 분석
- 문제 카테고리 기반
- 12질문 인테이크 응답

5대 지표: 간절함 / 구체성 / 실행력 / 긍정성 / 자기인식
점수 범위: 50~100

### 4. 사용자 분석 (`analysisEngine.js`)

`server.js coreAnalyzeHandler`에서 호출:
```javascript
const userProfile = analysisEngine.analyzeUserProfile(data)
// miracleIndex + 8단계 컨설팅 + 4주 액션플랜 생성
// current_stage, traffic_light_level, summary_line, today_action 추가
global.latestStore = { story: { userProfile, ... } }
```

### 5. 메시지 발송 (`messageProvider.js`)

```javascript
// 반드시 이 함수만 사용 - 직접 SENS 호출 금지
messageProvider.sendWishAckMessage(phone, wishData)
messageProvider.sendAdminAlert(message)
messageProvider.sendSMS(phone, message)
```

---

## 미들웨어 실행 순서

```
요청 → requestId.js (X-Request-Id 주입)
     → gateMiddleware.js (APP_DISABLED 체크)
     → express.json() / express.urlencoded()
     → cors()
     → compression()
     → 라우트 핸들러
     → errorHandler.js (에러 발생 시)
```

---

## 환경변수 (주요)

| 변수명 | 용도 |
|--------|------|
| `NODE_ENV` | development/production 분기 |
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `OPENAI_API_KEY` | GPT-4 / DALL-E |
| `NAVER_CLOUD_ACCESS_KEY` | SENS 알림톡/SMS |
| `NAVER_CLOUD_SECRET_KEY` | SENS 인증 |
| `SENS_SERVICE_ID` | SENS 서비스 ID |
| `OPS_SLACK_WEBHOOK` | Slack 운영 알림 (프로덕션 필수) |
| `ADMIN_PHONE` | RED 신호 SMS 수신 번호 |
| `APP_DISABLED` | 서비스 게이트 (true → 503) |
| `PORT` | HTTP 포트 (기본 5000) |

---

## 에러 핸들링 패턴

```javascript
// 라우트 핸들러 패턴
router.post('/', async (req, res) => {
    const log = req.log || console  // requestId 로거
    try {
        // ...비즈니스 로직
    } catch (error) {
        log.error('[Domain] action_failed', { error: error.message })
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' })
    }
})
```

**글로벌 에러 핸들러**: `middleware/errorHandler.js`
처리되지 않은 에러는 Slack OPS_SLACK_WEBHOOK으로 알림 발송.

---

## 운영 규칙

1. **SSOT**: 모든 진실은 GitHub 저장소에만 존재. 문서 중복 금지.
2. **환경 분기**: `NODE_ENV`로 로컬(SQLite)/운영(PostgreSQL) 분기
3. **메시지 발송**: 반드시 `messageProvider.js` 경유. 직접 SENS 호출 금지.
4. **마이그레이션**: `database/migrations/` 순번 관리 엄수
5. **이벤트 로깅**: `eventLogger.js`의 `logEvent()` 함수 사용
6. **라우트 추가**: server.js에 마운트 추가 필요
