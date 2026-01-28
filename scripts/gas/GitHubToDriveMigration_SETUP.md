# GitHub → Drive 마이그레이션 스크립트 설치 가이드

## 1. 스프레드시트 생성

1. Google Sheets에서 새 스프레드시트 생성
2. 이름: `RAW_MIGRATION_20260121`

## 2. Apps Script 프로젝트 설정

1. **확장 프로그램** → **Apps Script** 클릭
2. `GitHubToDriveMigration.gs` 파일 내용 전체 복사-붙여넣기
3. 저장 (Ctrl+S)

## 3. Script Properties 설정 (중요!)

Apps Script 편집기에서:

1. **프로젝트 설정** (톱니바퀴) 클릭
2. **스크립트 속성** 섹션에서 **속성 추가**
3. 다음 4개 항목 추가:

| 속성 | 값 | 설명 |
|------|-----|------|
| `GITHUB_TOKEN` | `ghp_xxxxx...` | GitHub Personal Access Token |
| `GITHUB_OWNER` | `your-username` | GitHub 계정명 또는 조직명 |
| `GITHUB_REPO` | `daily-miracles-mvp` | 저장소 이름 |
| `DRIVE_FOLDER_ID` | `1ABC...xyz` | 대상 Drive 폴더 ID |

### GitHub Token 생성 방법

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token (classic)** 클릭
3. 권한: `repo` (전체 체크)
4. 생성된 토큰 복사

### Drive 폴더 ID 확인 방법

- Drive 폴더 URL: `https://drive.google.com/drive/folders/1ABC123xyz`
- 폴더 ID: `1ABC123xyz` (마지막 부분)

## 4. 권한 승인

1. Apps Script에서 `onOpen` 함수 실행
2. 권한 요청 팝업 → **고급** → **안전하지 않음으로 이동** → **허용**

## 5. 사용 방법

스프레드시트로 돌아가서 새로고침 후:

### 메뉴 위치
`🔄 GitHub Migration` 메뉴 표시됨

### 실행 순서

1. **1️⃣ QUEUE 탭 초기화** - 최초 1회만
2. **2️⃣ GitHub에서 파일 목록 스캔** - raw/ 폴더 스캔
3. **3️⃣ PENDING 파일 처리 (10개)** - 10개씩 처리
4. (또는) **4️⃣ 모든 PENDING 처리** - 전체 일괄 처리

### 보조 기능

- **📊 상태 요약 보기** - 현재 처리 현황 확인
- **🔄 ERROR 항목 재시도** - 실패 항목 재처리

## 6. QUEUE 탭 컬럼 구조

| 컬럼 | 설명 |
|------|------|
| repo_path | GitHub 내 파일 경로 |
| filename | 파일명 |
| status | PENDING / IMPORTED / ERROR / SKIP |
| drive_file_url | 업로드된 Drive 파일 URL |
| error_log | 에러 발생 시 사유 |
| created_at | 등록 일시 |
| updated_at | 최종 업데이트 일시 |

## 7. 보안 규칙

- ✅ GitHub 토큰: Script Properties에 안전하게 저장
- ✅ 코드 내 하드코딩 없음
- ✅ `docs/raw/` 폴더만 스캔 (다른 경로 접근 차단)

## 8. 트러블슈팅

### "GITHUB_TOKEN 미설정" 오류
→ Script Properties 확인 (대소문자 정확히)

### "raw/ 폴더에 파일이 없습니다"
→ `CONFIG.RAW_PATH` 값 확인 (기본값: `docs/raw`)

### API 제한 오류
→ 잠시 후 재시도 (GitHub API Rate Limit)

### 권한 오류
→ GitHub Token 권한에 `repo` 포함 여부 확인
