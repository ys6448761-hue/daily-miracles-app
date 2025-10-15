# 📊 Notion 연동 문제 해결 리포트

**작업 일시**: 2025-10-11
**작업자**: Claude Code
**프로젝트**: Daily Miracles MVP

---

## 🔍 문제 분석

### 발생한 문제
```
@notionhq/client warn: request fail {
  code: 'unauthorized',
  message: 'API token is invalid.',
  requestId: 'd800bd60-d02a-4b99-8721-a1d21439bc1a'
}
```

### 근본 원인
1. **`.env` 파일 형식 오류**
   - 첫 번째 줄에 BOM (Byte Order Mark) 및 잘못된 형식
   - `NOTION_PAGE_ID`가 중복 선언됨
   - 주석이 변수 선언과 같은 줄에 있음

2. **Notion API 토큰 무효**
   - 제공된 API 키: `ntn_b279147160279FFmzxpP09WFkwlyAWnYHPj05Jy2QF88rh`
   - 이 토큰은 Notion에서 유효하지 않음으로 확인됨
   - 새로운 Integration 생성 필요

3. **페이지 ID 형식**
   - 제공된 ID: `28a0a662-79f2-800f-b286-cf924ef64738`
   - .env 파일의 ID: `28a0a66279f280eebbeae25082a90107`
   - **불일치 발견!** 하이픈이 제거된 형식 사용 중

---

## ✅ 수행한 작업

### 1. `.env` 파일 수정
**수정 전:**
```env

   NOTION_PAGE_ID=28a0a66279f280eebbeae25082a90107# ==========================================
# Notion API Configuration
# ==========================================

NOTION_API_KEY=ntn_b279147160279FFmzxpP09WFkwlyAWnYHPj05Jy2QF88rh
NOTION_PAGE_ID=28a0a66279f280eebbeae25082a90107
```

**수정 후:**
```env
# ==========================================
# Notion API Configuration
# ==========================================

NOTION_API_KEY=ntn_b279147160279FFmzxpP09WFkwlyAWnYHPj05Jy2QF88rh
NOTION_PAGE_ID=28a0a66279f280eebbeae25082a90107
```

### 2. 테스트 스크립트 확인
- `test-api.js` 파일 검증 완료
- 코드 구조 양호
- 에러 핸들링 적절함

### 3. API 연결 테스트 실행
```bash
cd "C:\Users\세진\OneDrive\바탕 화면\daily-miracles-mvp\automation\notion"
node test-api.js
```

**결과**: API 토큰 무효 확인

### 4. 문서 작성
다음 파일들을 생성:
- ✅ `NOTION_SETUP_GUIDE.md` - 상세 설정 가이드
- ✅ `send-success-message.js` - 성공 메시지 전송 스크립트
- ✅ `NOTION_INTEGRATION_REPORT.md` - 이 리포트

---

## 🛠 해결 방법

### 즉시 수행할 작업

#### Step 1: 새 Integration 생성

1. **Notion Integrations 페이지 접속**
   ```
   https://www.notion.so/my-integrations
   ```

2. **새 Integration 생성**
   - Name: `Daily Miracles Bot`
   - Type: Internal Integration
   - Associated workspace 선택

3. **API Secret 복사**
   - 형식: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Step 2: 페이지 ID 확인

**현재 혼란:**
- 제공된 ID 1: `28a0a662-79f2-800f-b286-cf924ef64738` (하이픈 포함)
- 제공된 ID 2: `28a0a66279f280eebbeae25082a90107` (하이픈 제거)

**올바른 ID 찾기:**
1. Notion에서 해당 페이지 열기
2. URL 확인: `https://www.notion.so/{workspace}/{pageId}`
3. 페이지 ID는 URL의 마지막 32자리 (하이픈 포함 또는 제외)

**예시:**
```
URL: https://www.notion.so/myworkspace/28a0a66279f280f0b286cf924ef64738
Page ID: 28a0a66279f280f0b286cf924ef64738
```

#### Step 3: Integration을 페이지에 연결

1. Notion 페이지 열기
2. 우측 상단 "..." → "Connect to"
3. "Daily Miracles Bot" 선택
4. "Confirm" 클릭

#### Step 4: .env 업데이트

```env
# ==========================================
# Notion API Configuration
# ==========================================

NOTION_API_KEY=secret_새로_생성한_API_키_여기에
NOTION_PAGE_ID=올바른_페이지_ID_여기에
```

#### Step 5: 연결 테스트

```bash
node test-api.js
```

**성공 시:**
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

#### Step 6: 성공 메시지 전송

```bash
node send-success-message.js
```

---

## 📁 생성된 파일

### 1. NOTION_SETUP_GUIDE.md
**위치**: `automation/notion/NOTION_SETUP_GUIDE.md`

**내용**:
- Step-by-step Integration 설정 가이드
- 권한 설정 안내
- 트러블슈팅 섹션
- 체크리스트

### 2. send-success-message.js
**위치**: `automation/notion/send-success-message.js`

**기능**:
- Notion API 연결 확인
- 페이지에 성공 메시지 추가
- 타임스탬프 기록
- 체크리스트 항목 추가

**실행 방법**:
```bash
node send-success-message.js
```

### 3. test-api.js (기존 파일)
**위치**: `automation/notion/test-api.js`

**기능**:
- API 키 유효성 검증
- 접근 가능한 페이지 목록 출력
- 에러 메시지 및 해결 방법 제시

---

## 🔒 보안 권장사항

### API 키 관리
1. **절대로 Git에 커밋하지 마세요**
   - `.env` 파일은 `.gitignore`에 포함되어야 함

2. **API 키 주기적 갱신**
   - 3-6개월마다 새 키 생성 권장

3. **최소 권한 원칙**
   - Integration에 필요한 최소한의 권한만 부여

### .gitignore 확인
```gitignore
# Environment variables
.env
.env.local
.env.production

# Notion
automation/notion/.env
```

---

## 📊 현재 상태 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| `.env` 파일 형식 | ✅ 수정 완료 | BOM 제거, 형식 정리 |
| API 키 유효성 | ❌ 무효 | 새 Integration 생성 필요 |
| 페이지 ID | ⚠️ 확인 필요 | 두 개의 다른 ID 제공됨 |
| Integration 연결 | ❌ 미완료 | 페이지 연결 필요 |
| 테스트 스크립트 | ✅ 작동 확인 | test-api.js 정상 |
| 성공 메시지 스크립트 | ✅ 생성 완료 | send-success-message.js |
| 설정 가이드 | ✅ 작성 완료 | NOTION_SETUP_GUIDE.md |

---

## 🎯 다음 단계

### 즉시 수행 (사용자 작업 필요)

1. **[ ] 새 Notion Integration 생성**
   - URL: https://www.notion.so/my-integrations
   - API Secret 복사

2. **[ ] 올바른 페이지 ID 확인**
   - Notion에서 페이지 URL 복사
   - 페이지 ID 추출

3. **[ ] Integration을 페이지에 연결**
   - 페이지 설정 → Connect to → Integration 선택

4. **[ ] .env 파일 업데이트**
   - 새 API Key 입력
   - 올바른 Page ID 입력

5. **[ ] 연결 테스트**
   ```bash
   node test-api.js
   ```

6. **[ ] 성공 메시지 전송**
   ```bash
   node send-success-message.js
   ```

### 연동 완료 후

7. **[ ] 자동화 스크립트 개발**
   - 배포 알림 자동화
   - 에러 로그 자동 전송
   - 프로젝트 진행 상황 추적

8. **[ ] GitHub Actions 연동**
   - Push 시 Notion 업데이트
   - PR 생성 시 알림
   - 배포 완료 시 기록

---

## 📝 참고 자료

### Notion API
- **공식 문서**: https://developers.notion.com/
- **SDK GitHub**: https://github.com/makenotion/notion-sdk-js
- **API Reference**: https://developers.notion.com/reference/intro

### 프로젝트 파일
- **설정 가이드**: `automation/notion/NOTION_SETUP_GUIDE.md`
- **테스트 스크립트**: `automation/notion/test-api.js`
- **성공 메시지**: `automation/notion/send-success-message.js`

---

## 💬 문의 및 지원

문제가 계속되면:
1. `NOTION_SETUP_GUIDE.md`의 트러블슈팅 섹션 참고
2. API 키를 완전히 새로 생성
3. 다른 페이지에서 테스트
4. Notion workspace 권한 확인

---

**작성 완료**: 2025-10-11
**최종 업데이트**: 2025-10-11

🎉 **Notion 연동 준비 완료! 위 단계를 따라 설정을 완료하세요.**
