# 30일 기적 로드맵 API 문서

## 📋 개요

30초 안에 10페이지 PDF 로드맵을 자동 생성하는 API입니다.

### 주요 기능

- ⚡ **빠른 생성**: 평균 24-30초 안에 완성
- 🎨 **4가지 템플릿**: 사용자 특성에 맞는 자동 선택
- 🤖 **AI 기반 개인화**: OpenAI를 활용한 맞춤형 콘텐츠
- 📱 **카카오톡 자동 발송**: PDF 생성 후 자동 전송
- 📄 **10페이지 구성**: 주차별 계획, 일일 루틴, 성공 사례 등

---

## 🚀 빠른 시작

### 1. 서버 실행

```bash
npm install
npm run dev
```

### 2. API 호출

```bash
curl -X POST http://localhost:3000/api/roadmap/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "name": "김지수",
      "wish": "10kg 감량하기",
      "category": "건강",
      "age": 28,
      "gender": "여성",
      "phone": "010-1234-5678"
    }
  }'
```

### 3. 응답 확인

```json
{
  "success": true,
  "sessionId": "uuid-here",
  "data": {
    "pdfUrl": "http://localhost:3000/pdfs/roadmap_김지수_1234567890.pdf",
    "template": "warm-friendly",
    "miracleScore": 85,
    "kakaoSent": true
  },
  "timing": {
    "total": 28400,
    "contentGeneration": 8200,
    "pdfGeneration": 18100,
    "kakaoSend": 2100
  }
}
```

---

## 📡 API 엔드포인트

### POST `/api/roadmap/generate`

30일 기적 로드맵 PDF를 생성합니다.

#### Request Body

```typescript
{
  user: {
    name: string;        // 필수: 사용자 이름
    wish: string;        // 필수: 사용자의 소원/목표
    category?: string;   // 선택: 카테고리 (건강, 커리어, 재무 등)
    age?: number;        // 선택: 나이
    gender?: string;     // 선택: 성별
    phone?: string;      // 선택: 카카오톡 발송용 전화번호
    emotion?: string;    // 선택: 사용자 감정 상태
  }
}
```

#### Response

```typescript
{
  success: boolean;
  sessionId: string;
  data: {
    pdfUrl: string;           // PDF 다운로드 URL
    pdfPath: string;          // 서버 내 파일 경로
    template: string;         // 선택된 템플릿 이름
    miracleScore: number;     // 기적 지수 (70-95)
    kakaoSent: boolean;       // 카톡 발송 성공 여부
  };
  timing: {
    total: number;              // 전체 소요 시간 (ms)
    contentGeneration: number;  // AI 콘텐츠 생성 시간
    pdfGeneration: number;      // PDF 렌더링 시간
    kakaoSend: number;          // 카톡 발송 시간
  };
  metadata: {
    userName: string;
    userWish: string;
    category: string;
    timestamp: string;
  }
}
```

#### 에러 응답

```typescript
{
  success: false;
  sessionId: string;
  error: string;
  time: number;
}
```

---

### POST `/api/roadmap/test/samples`

테스트용 샘플 PDF 4개를 생성합니다.

#### Request Body

```json
{}
```

#### Response

```typescript
{
  success: boolean;
  samples: Array<{
    success: boolean;
    user: string;
    template: string;
    filename: string;
    path: string;
    time: number;
  }>;
  statistics: {
    total: number;
    totalTime: number;
    averageTime: number;
  }
}
```

---

### GET `/api/roadmap/templates`

사용 가능한 템플릿 목록을 조회합니다.

#### Response

```typescript
{
  success: boolean;
  templates: {
    [key: string]: {
      name: string;
      description: string;
      colors: object;
      fonts: object;
      style: string;
      mood: string;
      target: string[];
      personality: string[];
    }
  }
}
```

---

## 🎨 템플릿 종류

### 1. Classic Elegant
- **스타일**: 우아하고 전통적
- **색상**: 파스텔 퍼플 (#9B7EBD)
- **적합 대상**: 30-50세 여성, 자기계발, 건강

### 2. Modern Dynamic
- **스타일**: 현대적이고 역동적
- **색상**: 네온 퍼플 (#8B5CF6), 다크 테마
- **적합 대상**: 20-35세 남성, 커리어, 비즈니스

### 3. Warm Friendly
- **스타일**: 따뜻하고 친근함
- **색상**: 소프트 핑크 (#E9A8D0)
- **적합 대상**: 전연령 여성, 관계, 일상

### 4. Professional
- **스타일**: 전문적이고 격식있음
- **색상**: 다크 네이비 (#1E3A5F), 골드
- **적합 대상**: 30-60세 남성, 비즈니스, 재무

---

## ⚡ 성능 최적화

### 30초 생성 시스템

#### 시간 할당
- **[0-5초]** 사용자 분석 및 템플릿 선택
- **[5-10초]** AI 콘텐츠 생성
- **[10-25초]** PDF 렌더링
- **[25-30초]** 카카오톡 발송

#### 최적화 기법
1. **브라우저 재사용**: Puppeteer 인스턴스 싱글톤
2. **템플릿 캐싱**: Handlebars 컴파일 결과 저장
3. **병렬 처리**: 템플릿 선택과 AI 생성 동시 실행
4. **CSS 인라인**: 외부 요청 최소화

---

## 📱 카카오톡 연동

### 설정

환경 변수 `.env`에 다음을 추가:

```bash
# 알리고 API (추천)
ALIGO_API_KEY=your-api-key
ALIGO_USER_ID=your-user-id
ALIGO_SENDER_KEY=your-sender-key

# 또는 카카오 공식 API
KAKAO_API_KEY=your-kakao-api-key
```

### Mock 모드

API 설정이 없으면 자동으로 Mock 모드로 작동합니다.

---

## 🧪 테스트

### 자동 테스트 실행

```bash
node test-roadmap.js
```

### 수동 테스트

```bash
# 단일 생성
curl -X POST http://localhost:3000/api/roadmap/generate \
  -H "Content-Type: application/json" \
  -d @test-data/user1.json

# 샘플 생성
curl -X POST http://localhost:3000/api/roadmap/test/samples
```

---

## 📊 모니터링

### 로그 확인

서버 콘솔에서 실시간 진행 상황 확인:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 30일 로드맵 생성 시작 [uuid]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 사용자: 김지수
🎯 소원: 10kg 감량하기
📋 카테고리: 건강

⚡ [병렬 처리] 템플릿 선택 & 콘텐츠 생성
✅ Step 2 완료: 8200ms
⭐ 기적지수: 85
🎨 템플릿: warm-friendly

📄 PDF 생성 중...
✅ PDF 생성 완료: 18100ms
🔗 PDF URL: http://localhost:3000/pdfs/roadmap_김지수_1234567890.pdf

📱 카카오톡 발송 중...
✅ 카카오톡 처리 완료: 2100ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 전체 완료: 28400ms (28.4초)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 트러블슈팅

### PDF 생성 실패

**증상**: PDF 생성 중 에러 발생

**해결**:
1. Puppeteer가 정상 설치되었는지 확인
2. 충분한 메모리 확보 (최소 512MB)
3. Chromium 종속성 설치 (Linux의 경우)

```bash
# Linux
sudo apt-get install -y chromium-browser
```

### 느린 생성 속도

**증상**: 30초를 초과하는 생성 시간

**원인**:
- OpenAI API 응답 지연
- 서버 리소스 부족
- 네트워크 지연

**해결**:
1. OpenAI API 키 확인
2. 서버 스펙 확인 (CPU, 메모리)
3. 기본 콘텐츠 사용 (AI 우회)

### 카카오톡 발송 실패

**증상**: `kakaoSent: false`

**원인**:
- API 키 미설정
- 전화번호 형식 오류
- API 한도 초과

**해결**:
1. 환경 변수 확인
2. 전화번호 형식 확인 (010-1234-5678)
3. Mock 모드로 테스트

---

## 📈 성능 벤치마크

### 테스트 환경
- CPU: Intel i5 (4 cores)
- RAM: 8GB
- Node.js: v18
- OS: Windows 10

### 결과

| 작업 | 평균 시간 | 최소 | 최대 |
|------|----------|------|------|
| 단일 생성 | 28.4초 | 24.1초 | 32.7초 |
| 병렬 2개 | 31.2초 | 28.9초 | 35.4초 |
| 샘플 4개 | 15.3초 | 12.8초 | 18.1초 |

---

## 🛠️ 개발자 가이드

### 새 템플릿 추가

1. HTML 템플릿 생성: `src/templates/new-template.html`
2. CSS 스타일 생성: `src/styles/new-template.css`
3. 템플릿 정의 추가: `src/services/roadmap/templateSelector.js`

### 콘텐츠 커스터마이징

`src/services/roadmap/contentGenerator.js`에서 프롬프트 수정

### 성능 개선

1. 브라우저 풀 크기 조정
2. AI 모델 변경 (gpt-4o-mini → gpt-3.5-turbo)
3. 이미지 최적화

---

## 📞 지원

문제가 발생하면:
1. 로그 확인
2. GitHub Issues 생성
3. support@aurora5.com 문의

---

## 📄 라이선스

MIT License

© 2025 Aurora 5. All rights reserved.
