# 🚀 Daily Miracles - Notion 연동 완벽 가이드

**프로젝트**: Daily Miracles MVP
**작업 일시**: 2025-10-13
**상태**: 준비 완료 - 사용자 설정 대기 중

---

## 📌 빠른 시작 (Quick Start)

이 가이드를 따라하면 **5분 안에** Notion 연동을 완료할 수 있습니다!

### ✅ 체크리스트

- [ ] Step 1: 새 Notion Integration 생성
- [ ] Step 2: API 키 복사
- [ ] Step 3: Notion 페이지에 Integration 연결
- [ ] Step 4: .env 파일 업데이트
- [ ] Step 5: 연결 테스트
- [ ] Step 6: 성공 메시지 자동 전송

---

## 🎯 현재 상황

### 완료된 작업 ✅

1. **환경 설정 파일 수정 완료**
   - `.env` 파일 형식 오류 수정 (BOM 제거, 형식 정리)
   - 파일 위치: `automation/notion/.env`

2. **테스트 스크립트 준비 완료**
   - `test-api.js` - API 연결 확인용
   - `send-success-message.js` - 성공 메시지 자동 전송용

3. **문서 작성 완료**
   - `NOTION_SETUP_GUIDE.md` - 상세 설정 가이드
   - `NOTION_INTEGRATION_REPORT.md` - 기술 분석 리포트
   - `START_HERE.md` - 이 파일 (시작 가이드)

### 해결해야 할 문제 ⚠️

1. **API 토큰 무효**
   - 현재 토큰: `ntn_b279147160279FFmzxpP09WFkwlyAWnYHPj05Jy2QF88rh`
   - 상태: 만료 또는 유효하지 않음
   - 해결: 새 Integration 생성 필요

2. **페이지 ID 확인 필요**
   - 현재 ID: `28a0a66279f280eebbeae25082a90107`
   - 확인: Notion 페이지 URL에서 정확한 ID 추출 필요

---

## 📖 단계별 설정 가이드

### Step 1: 새 Notion Integration 생성

1. **브라우저에서 Notion Integrations 페이지 열기**
   ```
   https://www.notion.so/my-integrations
   ```

2. **"+ New integration" 버튼 클릭**

3. **Integration 정보 입력**
   ```
   Name: Daily Miracles Bot
   Type: Internal Integration
   Associated workspace: (사용 중인 워크스페이스 선택)
   ```

4. **"Submit" 클릭하여 생성**

5. **⭐ API Secret 복사**
   - "Internal Integration Secret" 값 복사
   - 형식: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **중요**: 이 키는 한 번만 표시되므로 안전하게 보관!

---

### Step 2: Notion 페이지 확인 및 ID 추출

1. **Notion에서 연동할 페이지 열기**

2. **페이지 URL 복사**
   - 형식: `https://www.notion.so/workspace-name/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 마지막 32자리가 페이지 ID

3. **페이지 ID 기록**
   - 하이픈(-) 있어도 없어도 상관없음
   - 예시: `28a0a66279f280f0b286cf924ef64738`

---

### Step 3: Integration을 페이지에 연결

**이 단계가 가장 중요합니다!** Integration이 페이지에 연결되지 않으면 접근할 수 없습니다.

1. **Notion 페이지 우측 상단 "..." (점 3개) 클릭**

2. **"Connect to" 또는 "연결" 메뉴 선택**

3. **"Daily Miracles Bot" 선택**

4. **"Confirm" 클릭**

✅ 성공하면 페이지 상단에 Integration 아이콘이 표시됩니다!

---

### Step 4: .env 파일 업데이트

1. **파일 열기**
   ```
   automation/notion/.env
   ```

2. **내용 업데이트**
   ```env
   # ==========================================
   # Notion API Configuration
   # ==========================================

   NOTION_API_KEY=secret_여기에_Step1에서_복사한_API_키_붙여넣기
   NOTION_PAGE_ID=여기에_Step2에서_확인한_페이지_ID_붙여넣기
   ```

3. **저장** (Ctrl + S)

**예시:**
```env
# ==========================================
# Notion API Configuration
# ==========================================

NOTION_API_KEY=secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
NOTION_PAGE_ID=28a0a66279f280f0b286cf924ef64738
```

---

### Step 5: 연결 테스트

**터미널에서 실행:**

```bash
cd "C:\Users\세진\OneDrive\바탕 화면\daily-miracles-mvp\automation\notion"
node test-api.js
```

#### 성공 시 출력:

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

#### 실패 시:

**"API token is invalid"**
- 해결: API 키를 다시 복사하여 .env 파일 업데이트
- 앞뒤 공백 없는지 확인

**"접근 가능한 페이지가 없습니다"**
- 해결: Step 3 (Integration 연결)을 다시 수행
- Notion 페이지에서 "Connect to"로 Integration 연결 확인

**"Page not found"**
- 해결: 페이지 ID가 정확한지 확인
- Notion 페이지 URL에서 ID 다시 추출

---

### Step 6: 성공 메시지 자동 전송

연결 테스트가 성공하면:

```bash
node send-success-message.js
```

#### 실행 결과:

```
🚀 Claude Code 연동 성공 메시지 전송 중...

✅ Notion API 연결 성공
   봇 이름: Daily Miracles Bot

✅ 성공 메시지 전송 완료!

📄 페이지 확인: https://www.notion.so/28a0a66279f280f0b286cf924ef64738

==================================================
🎊 Notion 연동이 완료되었습니다!
==================================================
```

Notion 페이지를 열어보면 다음과 같은 메시지가 추가되어 있습니다:

```
🎉 Claude Code 연동 성공!

연동 시간: 2025-10-13 14:30:00

• API 연결 정상
• Integration 권한 확인 완료
• 자동화 준비 완료

━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 이제 Daily Miracles 프로젝트의 모든 이벤트가
   자동으로 이 페이지에 기록됩니다!
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 트러블슈팅

### 문제 1: "unauthorized" 에러

**증상:**
```
@notionhq/client warn: request fail {
  code: 'unauthorized',
  message: 'API token is invalid.'
}
```

**해결:**
1. https://www.notion.so/my-integrations 에서 API 키 다시 복사
2. .env 파일에 정확히 붙여넣기 (앞뒤 공백 없이)
3. `secret_`로 시작하는지 확인
4. test-api.js 다시 실행

---

### 문제 2: "접근 가능한 페이지가 없습니다"

**원인:** Integration이 페이지에 연결되지 않음

**해결:**
1. Notion 페이지 열기
2. 우측 상단 "..." 클릭
3. "Connect to" 선택
4. "Daily Miracles Bot" 선택
5. "Confirm" 클릭
6. test-api.js 다시 실행

---

### 문제 3: "Could not find page"

**원인:** 페이지 ID가 잘못됨

**해결:**
1. Notion 페이지 열기
2. URL 복사: `https://www.notion.so/workspace/xxxxxxxx...`
3. URL의 마지막 32자리 추출
4. .env 파일의 NOTION_PAGE_ID 업데이트
5. test-api.js 다시 실행

---

### 문제 4: "dotenv" 모듈을 찾을 수 없음

**증상:**
```
Error: Cannot find module 'dotenv'
```

**해결:**
```bash
cd "C:\Users\세진\OneDrive\바탕 화면\daily-miracles-mvp\automation\notion"
npm install
```

---

## 📁 프로젝트 파일 구조

```
automation/notion/
│
├── .env                              # 환경 변수 (API 키, 페이지 ID)
├── package.json                      # Node.js 의존성
├── test-api.js                       # API 연결 테스트 스크립트
├── send-success-message.js           # 성공 메시지 전송 스크립트
│
├── START_HERE.md                     # 👈 이 파일 (시작 가이드)
├── NOTION_SETUP_GUIDE.md             # 상세 설정 가이드
└── NOTION_INTEGRATION_REPORT.md      # 기술 분석 리포트
```

---

## 🎨 Integration 권한 설정

Notion Integration 설정 페이지에서 확인해야 할 권한:

### Content Capabilities (필수)
- ✅ **Read content** - 페이지 읽기
- ✅ **Update content** - 페이지 수정
- ✅ **Insert content** - 콘텐츠 추가

### Comment Capabilities (선택)
- ✅ **Read comments** - 댓글 읽기
- ✅ **Create comments** - 댓글 작성

### User Capabilities (선택)
- ✅ **Read user information** - 사용자 정보 읽기

---

## 🔒 보안 권장사항

### API 키 관리

1. **절대로 Git에 커밋하지 마세요**
   - `.env` 파일은 `.gitignore`에 포함
   - API 키가 노출되면 즉시 삭제하고 새로 생성

2. **API 키 주기적 갱신**
   - 3-6개월마다 새 키 생성 권장
   - 오래된 키는 삭제

3. **최소 권한 원칙**
   - 필요한 최소한의 권한만 부여
   - 불필요한 권한은 비활성화

### .gitignore 확인

프로젝트 루트의 `.gitignore` 파일에 다음 내용이 있는지 확인:

```gitignore
# Environment variables
.env
.env.local
.env.production

# Notion
automation/notion/.env
```

---

## 🎯 다음 단계 (연동 완료 후)

### 1. 자동화 스크립트 개발

```javascript
// 예시: 배포 알림 자동화
async function notifyDeployment(version, status) {
  await notion.blocks.children.append({
    block_id: PAGE_ID,
    children: [{
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          text: { content: `🚀 배포 완료: v${version} - ${status}` }
        }]
      }
    }]
  });
}
```

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
      - name: Send to Notion
        run: node automation/notion/send-success-message.js
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_PAGE_ID: ${{ secrets.NOTION_PAGE_ID }}
```

### 3. 데이터베이스 활용

- 프로젝트 진행 상황 자동 추적
- 버그 리포트 자동 생성
- 배포 히스토리 자동 기록
- 성능 메트릭 시각화

---

## 📚 참고 자료

### 공식 문서
- **Notion API**: https://developers.notion.com/
- **SDK GitHub**: https://github.com/makenotion/notion-sdk-js
- **API Reference**: https://developers.notion.com/reference/intro

### 프로젝트 문서
- **START_HERE.md**: 이 파일 (빠른 시작 가이드)
- **NOTION_SETUP_GUIDE.md**: 상세 설정 가이드
- **NOTION_INTEGRATION_REPORT.md**: 기술 분석 리포트

### 유용한 예제
- **페이지 읽기**: https://developers.notion.com/reference/retrieve-a-page
- **블록 추가**: https://developers.notion.com/reference/patch-block-children
- **데이터베이스 쿼리**: https://developers.notion.com/reference/post-database-query

---

## 💬 지원 및 문의

### 문제가 계속되면:

1. `NOTION_SETUP_GUIDE.md`의 트러블슈팅 섹션 참고
2. API 키를 완전히 새로 생성
3. 다른 페이지에서 테스트
4. Notion workspace 권한 확인

### 추가 도움이 필요하면:

- Notion API 공식 문서: https://developers.notion.com/
- GitHub Issues: https://github.com/makenotion/notion-sdk-js/issues
- Notion 커뮤니티: https://community.notion.so/

---

## ✨ 성공 기준

다음 모든 항목이 체크되면 연동이 완벽히 완료된 것입니다:

- [x] `.env` 파일 형식 정리 완료
- [ ] 새 Notion Integration 생성 완료
- [ ] API Secret 복사 완료
- [ ] Integration을 페이지에 연결 완료
- [ ] .env 파일에 새 API 키 입력 완료
- [ ] `test-api.js` 실행 성공
- [ ] 접근 가능한 페이지 확인됨
- [ ] `send-success-message.js` 실행 성공
- [ ] Notion 페이지에 성공 메시지 표시됨

---

## 🎉 시작하기

**지금 바로 시작하세요!**

1. 이 가이드를 **Step 1**부터 순서대로 따라하세요
2. 각 단계를 완료할 때마다 체크리스트에 표시하세요
3. 문제가 발생하면 트러블슈팅 섹션을 참고하세요
4. 모든 단계가 완료되면 자동화 스크립트를 개발하세요

**예상 소요 시간**: 5-10분
**난이도**: ⭐⭐☆☆☆ (쉬움)

---

**작성 완료**: 2025-10-13
**최종 업데이트**: 2025-10-13
**작성자**: Claude Code

🚀 **Happy Automating!**
