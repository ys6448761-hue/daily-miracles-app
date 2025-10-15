# 🎉 Daily Miracles - Notion 자동화

> Notion API를 활용한 프로젝트 자동화 시스템

---

## 🚀 빠른 시작

### 1단계: 설정 확인
```bash
node verify-setup.js
```
현재 설정 상태를 확인하고 누락된 항목을 알려줍니다.

### 2단계: Notion 연동 설정
[START_HERE.md](START_HERE.md) 파일을 열어 단계별 가이드를 따라하세요.

### 3단계: 연결 테스트
```bash
node test-api.js
```
API 연결이 정상 작동하는지 확인합니다.

### 4단계: 성공 메시지 전송
```bash
node send-success-message.js
```
Notion 페이지에 연동 성공 메시지를 자동으로 보냅니다.

---

## 📁 파일 구조

```
automation/notion/
│
├── 🔧 설정 파일
│   ├── .env                          # API 키 및 환경변수 (Git 제외)
│   ├── package.json                  # Node.js 의존성
│   └── .gitignore                    # Git 무시 파일 목록
│
├── 🤖 실행 스크립트
│   ├── verify-setup.js               # 설정 확인 스크립트
│   ├── test-api.js                   # API 연결 테스트
│   └── send-success-message.js       # 성공 메시지 자동 전송
│
└── 📚 문서
    ├── README.md                     # 이 파일 (개요)
    ├── START_HERE.md                 # 빠른 시작 가이드 ⭐
    ├── NOTION_SETUP_GUIDE.md         # 상세 설정 가이드
    └── NOTION_INTEGRATION_REPORT.md  # 기술 분석 리포트
```

---

## 🎯 사용 가능한 명령어

### 🔍 설정 확인
```bash
node verify-setup.js
```
**기능:**
- .env 파일 존재 확인
- API 키 형식 검증
- 페이지 ID 유효성 확인
- 필수 패키지 설치 확인
- 필수 파일 존재 확인

**출력 예시:**
```
🔍 Daily Miracles - Notion 연동 설정 확인

📄 Check 1: .env 파일 확인
   ✅ .env 파일 존재

🔑 Check 2: NOTION_API_KEY 확인
   ✅ 올바른 형식의 API 키 (secret_xxx)

📋 Check 3: NOTION_PAGE_ID 확인
   ✅ NOTION_PAGE_ID 설정됨
   ✅ 올바른 ID 길이 (32자리)

✅ 모든 검사 통과!
```

---

### 🔌 API 연결 테스트
```bash
node test-api.js
```
**기능:**
- Notion API 연결 확인
- API 키 유효성 검증
- 접근 가능한 페이지 목록 출력
- Integration 권한 확인

**성공 시 출력:**
```
✅ API 키 유효!
봇 이름: Daily Miracles Bot
봇 타입: bot

🔍 접근 가능한 페이지 검색 중...
✅ 총 1개 페이지 발견:

1. Daily Miracles Project
   ID: 28a0a66279f280f0b286cf924ef64738
   URL: https://www.notion.so/28a0a66279f280f0b286cf924ef64738
```

**실패 시 출력:**
```
❌ API 키가 유효하지 않습니다

💡 해결방법:
1. https://www.notion.so/my-integrations 접속
2. 새 Integration 생성
3. API Secret 복사
4. .env 파일의 NOTION_API_KEY 업데이트
```

---

### 📤 성공 메시지 전송
```bash
node send-success-message.js
```
**기능:**
- API 연결 확인 후
- Notion 페이지에 성공 메시지 추가
- 타임스탬프 기록
- 체크리스트 및 알림 추가

**Notion에 추가되는 내용:**
```
🎉 Claude Code 연동 성공!

연동 시간: 2025-10-13 14:30:00

• API 연결 정상
• Integration 권한 확인 완료
• 자동화 준비 완료

✨ 이제 Daily Miracles 프로젝트의 모든 이벤트가
   자동으로 이 페이지에 기록됩니다!
```

---

## ⚙️ 환경 설정

### .env 파일 형식

```env
# ==========================================
# Notion API Configuration
# ==========================================

NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 필수 환경 변수

| 변수명 | 설명 | 형식 | 예시 |
|--------|------|------|------|
| `NOTION_API_KEY` | Notion Integration Secret | `secret_xxx` | `secret_a1b2c3...` |
| `NOTION_PAGE_ID` | 연동할 페이지 ID | 32자리 (하이픈 제외) | `28a0a66279f2...` |

---

## 🔧 트러블슈팅

### 문제 1: "API token is invalid"

**원인:** API 키가 만료되었거나 잘못됨

**해결:**
```bash
# 1. 새 Integration 생성
https://www.notion.so/my-integrations

# 2. .env 파일 업데이트
NOTION_API_KEY=secret_새로운키

# 3. 다시 테스트
node test-api.js
```

---

### 문제 2: "접근 가능한 페이지가 없습니다"

**원인:** Integration이 페이지에 연결되지 않음

**해결:**
1. Notion 페이지 열기
2. 우측 상단 "..." 클릭
3. "Connect to" → Integration 선택
4. 다시 테스트

---

### 문제 3: "Cannot find module"

**원인:** Node.js 패키지가 설치되지 않음

**해결:**
```bash
npm install
```

---

### 문제 4: ".env 파일이 없습니다"

**원인:** 환경 변수 파일이 생성되지 않음

**해결:**
```bash
# .env 파일 생성
# 다음 내용 추가:

NOTION_API_KEY=your_api_key_here
NOTION_PAGE_ID=your_page_id_here
```

---

## 📚 문서 가이드

### 초보자
👉 [START_HERE.md](START_HERE.md)
- 빠른 시작 가이드
- 단계별 설정 방법
- 5분 안에 완료

### 상세 설정
👉 [NOTION_SETUP_GUIDE.md](NOTION_SETUP_GUIDE.md)
- Integration 생성 방법
- 권한 설정 가이드
- 트러블슈팅

### 기술 정보
👉 [NOTION_INTEGRATION_REPORT.md](NOTION_INTEGRATION_REPORT.md)
- 문제 분석 리포트
- 수행 작업 내역
- 보안 권장사항

---

## 🔐 보안 주의사항

### ⚠️ 절대 하지 말 것

1. **API 키를 Git에 커밋하지 마세요**
   ```bash
   # .gitignore에 추가
   .env
   automation/notion/.env
   ```

2. **API 키를 공개 저장소에 업로드하지 마세요**

3. **API 키를 다른 사람과 공유하지 마세요**

### ✅ 권장사항

1. **API 키 주기적 갱신**
   - 3-6개월마다 새 키 생성
   - 오래된 키는 즉시 삭제

2. **최소 권한 원칙**
   - 필요한 권한만 부여
   - 불필요한 권한 비활성화

3. **환경 변수 사용**
   - .env 파일로 관리
   - 배포 시 환경 변수 분리

---

## 🎨 Integration 권한 설정

### 필수 권한

| 권한 | 설명 | 필요 여부 |
|------|------|-----------|
| Read content | 페이지 읽기 | ✅ 필수 |
| Update content | 페이지 수정 | ✅ 필수 |
| Insert content | 콘텐츠 추가 | ✅ 필수 |
| Read comments | 댓글 읽기 | ⬜ 선택 |
| Create comments | 댓글 작성 | ⬜ 선택 |

---

## 🚀 다음 단계

### 1. 자동화 확장

**배포 알림 자동화**
```javascript
// 예시: 배포 완료 시 Notion 업데이트
await notion.blocks.children.append({
  block_id: PAGE_ID,
  children: [{
    type: 'paragraph',
    paragraph: {
      rich_text: [{
        text: { content: '🚀 v1.2.0 배포 완료!' }
      }]
    }
  }]
});
```

**에러 로그 자동 전송**
```javascript
// 예시: 에러 발생 시 Notion에 기록
await notion.pages.create({
  parent: { database_id: DATABASE_ID },
  properties: {
    Title: { title: [{ text: { content: error.message }}]},
    Status: { select: { name: 'Error' }}
  }
});
```

---

### 2. GitHub Actions 연동

```yaml
# .github/workflows/notion-notify.yml
name: Notion Notification

on:
  push:
    branches: [main]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd automation/notion
          npm install
      - name: Send notification
        run: |
          cd automation/notion
          node send-success-message.js
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_PAGE_ID: ${{ secrets.NOTION_PAGE_ID }}
```

---

### 3. 데이터베이스 활용

**프로젝트 진행 상황 추적**
- Task 데이터베이스 생성
- 자동으로 완료 상태 업데이트
- 진행률 시각화

**배포 히스토리 기록**
- 배포 시간 자동 기록
- 버전 정보 추적
- 롤백 히스토리

**버그 리포트 자동 생성**
- 에러 발생 시 자동 이슈 생성
- 스택 트레이스 첨부
- 해결 상태 추적

---

## 🌐 유용한 링크

### 공식 문서
- [Notion API 문서](https://developers.notion.com/)
- [SDK GitHub](https://github.com/makenotion/notion-sdk-js)
- [API Reference](https://developers.notion.com/reference/intro)

### 커뮤니티
- [Notion 커뮤니티](https://community.notion.so/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/notion-api)

### 예제 코드
- [Notion SDK 예제](https://github.com/makenotion/notion-sdk-js/tree/main/examples)
- [공식 템플릿](https://developers.notion.com/docs/create-a-notion-integration)

---

## 📞 지원

### 문제 해결 순서

1. **README.md** (이 파일) - 명령어 및 빠른 참조
2. **START_HERE.md** - 단계별 설정 가이드
3. **NOTION_SETUP_GUIDE.md** - 상세 트러블슈팅
4. **공식 문서** - Notion API 문서

### 추가 도움이 필요하면

- Notion API 문서 확인
- GitHub Issues 검색
- Notion 커뮤니티 질문

---

## 📊 시스템 요구사항

| 항목 | 요구사항 | 현재 버전 |
|------|----------|-----------|
| Node.js | v14.0.0 이상 | v22.19.0 ✅ |
| npm | v6.0.0 이상 | (자동 설치) |
| OS | Windows, macOS, Linux | Windows ✅ |

---

## 🎉 체크리스트

연동 완료를 위한 최종 체크리스트:

- [ ] `node verify-setup.js` 실행 - 모든 검사 통과
- [ ] Notion Integration 생성 완료
- [ ] Integration을 페이지에 연결 완료
- [ ] `.env` 파일 업데이트 완료
- [ ] `node test-api.js` 실행 성공
- [ ] `node send-success-message.js` 실행 성공
- [ ] Notion 페이지에 성공 메시지 표시됨

---

## 📝 버전 히스토리

### v1.0.0 (2025-10-13)
- ✅ 초기 설정 완료
- ✅ 테스트 스크립트 작성
- ✅ 문서 작성 완료
- ✅ 검증 스크립트 추가

---

## 📄 라이선스

이 프로젝트는 Daily Miracles MVP의 일부입니다.

---

## 👨‍💻 작성자

**Claude Code**
- 작성일: 2025-10-13
- 프로젝트: Daily Miracles MVP

---

**🚀 Happy Automating!**

더 많은 정보는 [START_HERE.md](START_HERE.md)를 참고하세요.
