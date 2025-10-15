# 🔗 Notion Integration 설정 가이드

## 📋 현재 상황
- **문제**: `API token is invalid` 에러 발생
- **원인**: Notion API 키가 만료되었거나 유효하지 않음
- **해결**: 새로운 Integration을 생성하고 페이지에 연결 필요

---

## 🚀 빠른 설정 (5분)

### Step 1: Notion Integration 생성

1. **Notion Integrations 페이지 접속**
   ```
   https://www.notion.so/my-integrations
   ```

2. **"+ New integration" 클릭**

3. **Integration 정보 입력**
   - **Name**: `Daily Miracles Bot` (또는 원하는 이름)
   - **Associated workspace**: 사용할 워크스페이스 선택
   - **Type**: Internal Integration

4. **"Submit" 클릭**

5. **API Key 복사**
   - "Internal Integration Secret" 값 복사
   - 형식: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ 이 키는 다시 볼 수 없으니 안전하게 보관!

---

### Step 2: Notion 페이지에 Integration 연결

1. **Notion에서 연동할 페이지 열기**
   - 현재 페이지 ID: `28a0a66279f280eebbeae25082a90107`
   - URL: https://www.notion.so/28a0a66279f280eebbeae25082a90107

2. **페이지 우측 상단 "..." (점 3개) 클릭**

3. **"Connect to" 또는 "연결" 메뉴 찾기**

4. **"Daily Miracles Bot" (또는 생성한 Integration 이름) 선택**

5. **"Confirm" 또는 "확인" 클릭**

✅ 이제 Integration이 이 페이지에 접근할 수 있습니다!

---

### Step 3: .env 파일 업데이트

1. **automation/notion/.env 파일 열기**

2. **NOTION_API_KEY 값 변경**
   ```env
   # ==========================================
   # Notion API Configuration
   # ==========================================

   NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # ← 여기에 새 API 키 붙여넣기
   NOTION_PAGE_ID=28a0a66279f280eebbeae25082a90107
   ```

3. **파일 저장** (Ctrl + S)

---

### Step 4: 연결 테스트

**터미널에서 실행:**
```bash
cd "C:\Users\세진\OneDrive\바탕 화면\daily-miracles-mvp\automation\notion"
node test-api.js
```

**성공 시 출력:**
```
✅ API 키 유효!
봇 이름: Daily Miracles Bot
봇 타입: bot

🔍 접근 가능한 페이지 검색 중...
✅ 총 1개 페이지 발견:

1. (페이지 제목)
   ID: 28a0a66279f280eebbeae25082a90107
   URL: https://www.notion.so/28a0a66279f280eebbeae25082a90107
```

**실패 시:**
- API 키를 다시 확인
- Integration이 페이지에 연결되었는지 확인
- 페이지 ID가 올바른지 확인

---

## 📊 Integration 권한 설정

### 기본 권한 (필수)

Integration 설정 페이지에서 다음 권한 확인:

**Content Capabilities (콘텐츠 권한):**
- ✅ **Read content**: 페이지 읽기
- ✅ **Update content**: 페이지 수정
- ✅ **Insert content**: 콘텐츠 추가

**Comment Capabilities (댓글 권한):**
- ✅ **Read comments**: 댓글 읽기 (선택)
- ✅ **Create comments**: 댓글 작성 (선택)

**User Capabilities (사용자 권한):**
- ✅ **Read user information**: 사용자 정보 읽기 (선택)

---

## 🔍 트러블슈팅

### 문제 1: "API token is invalid"

**원인:**
- API 키가 잘못 복사됨
- API 키가 만료됨
- .env 파일에 오타

**해결:**
1. https://www.notion.so/my-integrations 에서 새 API 키 생성
2. .env 파일에 정확히 붙여넣기
3. 앞뒤 공백 제거 확인

### 문제 2: "접근 가능한 페이지가 없습니다"

**원인:**
- Integration이 페이지에 연결되지 않음

**해결:**
1. Notion 페이지 열기
2. 우측 상단 "..." → "Connect to" → Integration 선택
3. 다시 테스트

### 문제 3: "Page not found"

**원인:**
- 페이지 ID가 잘못됨
- 페이지가 삭제됨

**해결:**
1. Notion 페이지 URL 확인
2. 페이지 ID 복사 (URL의 마지막 32자리)
3. .env 파일의 NOTION_PAGE_ID 업데이트

---

## 🧪 테스트 스크립트

### test-api.js
현재 API 연결 테스트용 스크립트입니다.

**실행:**
```bash
node test-api.js
```

**기능:**
- API 키 유효성 확인
- 접근 가능한 페이지 목록 출력
- 페이지 ID 및 URL 표시

### send-success-message.js (생성 예정)
연결 성공 시 Notion에 메시지를 보내는 스크립트입니다.

---

## 📝 체크리스트

연동 완료를 위한 체크리스트:

- [ ] Notion Integration 생성 완료
- [ ] API Key 복사 완료
- [ ] Notion 페이지에 Integration 연결 완료
- [ ] .env 파일에 API Key 업데이트 완료
- [ ] test-api.js 실행 성공
- [ ] 접근 가능한 페이지 확인 완료
- [ ] 성공 메시지 전송 완료

---

## 🎯 다음 단계

연결이 성공하면:

1. **자동화 스크립트 실행**
   - 배포 알림 자동 전송
   - 에러 로그 자동 보고
   - 성공 메트릭 기록

2. **Notion 데이터베이스 활용**
   - 프로젝트 진행 상황 추적
   - 버그 리포트 자동 생성
   - 배포 히스토리 기록

3. **GitHub Actions 연동**
   - Push 시 자동으로 Notion 업데이트
   - PR 생성 시 Notion에 알림
   - 배포 완료 시 성공 메시지

---

## 💡 유용한 링크

- **Notion API 문서**: https://developers.notion.com/
- **Integration 설정**: https://www.notion.so/my-integrations
- **API Reference**: https://developers.notion.com/reference/intro
- **SDK GitHub**: https://github.com/makenotion/notion-sdk-js

---

## 📞 지원

문제가 계속되면:
1. API 키를 다시 생성해보세요
2. 브라우저 캐시를 삭제해보세요
3. 다른 페이지에서 테스트해보세요

**Happy Automating! 🎉**
