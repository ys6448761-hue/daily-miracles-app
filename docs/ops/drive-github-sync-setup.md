# Drive → GitHub Sync Service 설치 가이드

> DECISION_EXPORT_READY 폴더의 문서를 GitHub `docs/decisions/`로 자동 동기화

---

## 개요

| 항목 | 내용 |
|------|------|
| 버전 | 1.0 |
| 작성일 | 2026-01-22 |
| 담당 | Aurora5 |

### 핵심 기능

1. **PRIVATE 2중 차단** - 메타데이터 + 콘텐츠 패턴 검사
2. **3종 중복 체크** - canonical_id, source_ref, content_hash
3. **자동 재시도** - 실패 시 3회 (1s → 2s → 4s 지수 백오프)
4. **Slack 알림** - 실패/성공 알림

---

## 1. 환경변수 설정

`.env` 파일에 추가:

```bash
# ═══════════════════════════════════════════════════════════════════════
# Drive → GitHub Sync 설정
# ═══════════════════════════════════════════════════════════════════════

# API 인증 (선택 - 미설정 시 인증 없이 동작)
DRIVE_GITHUB_SYNC_API_SECRET=your-secret-key

# Google Drive - Service Account
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
DECISION_EXPORT_READY_FOLDER_ID=1abc...xyz

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_OWNER=your-username
GITHUB_REPO=daily-miracles-mvp
GITHUB_BRANCH=main

# Airtable (Registry)
AIRTABLE_API_KEY=patxxxxxx
AIRTABLE_BASE_ID=appxxxxxx
EXPORT_REGISTRY_TABLE=EXPORT_REGISTRY

# Slack
SLACK_BOT_TOKEN=xoxb-xxxxxx
SLACK_CHANNEL_ALERTS=C08XXXXXXXX    # #aurora5-alerts
SLACK_CHANNEL_RAW_DIGEST=C0A9DS4T0D8  # #raw-digest
```

---

## 2. Google Service Account 설정

### 2.1 Service Account 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **IAM & Admin** → **Service Accounts** → **Create Service Account**
3. 이름: `drive-github-sync`
4. **Create Key** → JSON 다운로드
5. JSON 전체를 `GOOGLE_SERVICE_ACCOUNT_JSON` 환경변수에 설정

### 2.2 Drive 폴더 권한 부여

1. Google Drive에서 `DECISION_EXPORT_READY` 폴더 열기
2. **공유** → Service Account 이메일 추가 (예: `drive-sync@project.iam.gserviceaccount.com`)
3. **뷰어** 권한 부여

### 2.3 폴더 ID 확인

폴더 URL에서 ID 추출:
```
https://drive.google.com/drive/folders/1abc123xyz
                                       ↑ 이 부분이 폴더 ID
```

---

## 3. Airtable Registry 설정

### 3.1 테이블 생성

`EXPORT_REGISTRY` 테이블에 다음 필드 생성:

| 필드명 | 타입 | 설명 |
|--------|------|------|
| canonical_id | Single line text | 정본 ID (예: DEC-2026-0122-001) |
| doc_type | Single select | DEC, BLOCKED, FAILED 등 |
| source_ref | Single line text | Drive 파일 ID |
| sensitivity | Single select | INTERNAL, PRIVATE |
| content_hash | Single line text | SHA256 앞 8자리 |
| drive_file_url | URL | Drive 원본 링크 |
| github_path | Single line text | GitHub 저장 경로 |
| github_url | URL | GitHub 링크 |
| status | Single select | SYNCED, SKIPPED, FAILED |
| synced_at | Date | 동기화 시각 |
| error_msg | Long text | 오류 메시지 |

### 3.2 API 키 발급

1. [Airtable](https://airtable.com/account) → **API** → **Personal Access Token**
2. Scope: `data.records:read`, `data.records:write`
3. Base 접근 권한 부여

---

## 4. GitHub Token 설정

1. [GitHub Settings](https://github.com/settings/tokens) → **Fine-grained tokens**
2. Repository access: `daily-miracles-mvp`
3. Permissions:
   - Contents: **Read and write**
4. Token을 `GITHUB_TOKEN`에 설정

---

## 5. Slack 설정

### 5.1 Bot 생성

1. [Slack API](https://api.slack.com/apps) → **Create New App**
2. **OAuth & Permissions** → Bot Token Scopes:
   - `chat:write`
   - `chat:write.public`
3. **Install to Workspace**
4. Bot User OAuth Token → `SLACK_BOT_TOKEN`

### 5.2 채널 ID 확인

채널 이름 우클릭 → **링크 복사**:
```
https://your-workspace.slack.com/archives/C08XXXXXXXX
                                          ↑ 채널 ID
```

---

## 6. API 사용법

### 6.1 헬스체크

```bash
curl http://localhost:3000/api/sync/health
```

응답:
```json
{
  "success": true,
  "service": "DriveGitHubSync",
  "version": "1.0.0",
  "status": "ready",
  "config": {
    "secretConfigured": true,
    "googleServiceAccountConfigured": true,
    "readyFolderConfigured": true,
    "githubTokenConfigured": true,
    "airtableConfigured": true,
    "slackConfigured": true
  }
}
```

### 6.2 동기화 상태 확인

```bash
curl http://localhost:3000/api/sync/status
```

### 6.3 수동 동기화 실행

```bash
curl -X POST http://localhost:3000/api/sync/run \
  -H "x-sync-secret: your-secret-key"
```

응답:
```json
{
  "success": true,
  "total": 3,
  "synced": 2,
  "skipped": 1,
  "failed": 0,
  "elapsed_ms": 5432,
  "details": [
    {
      "fileName": "가격정책_결정.md",
      "status": "SYNCED",
      "canonicalId": "DEC-2026-0122-001"
    },
    {
      "fileName": "private_memo.md",
      "status": "SKIPPED",
      "errorMsg": "PRIVATE_BLOCKED: CONTENT_MATCH: /#개인/"
    }
  ]
}
```

### 6.4 PRIVATE 차단 테스트

```bash
curl -X POST http://localhost:3000/api/sync/test-private \
  -H "Content-Type: application/json" \
  -H "x-sync-secret: your-secret-key" \
  -d '{
    "content": "---\nsensitivity: PRIVATE\n---\n# 개인 메모"
  }'
```

### 6.5 해시/메타데이터 테스트

```bash
curl -X POST http://localhost:3000/api/sync/test-hash \
  -H "Content-Type: application/json" \
  -H "x-sync-secret: your-secret-key" \
  -d '{
    "content": "---\ndoc_type: DEC\nsensitivity: INTERNAL\n---\n# 결정 문서"
  }'
```

---

## 7. PRIVATE 차단 규칙

다음 패턴이 감지되면 **자동 차단**되어 `_BLOCKED` 폴더로 이동:

| 패턴 | 설명 |
|------|------|
| `sensitivity: PRIVATE` | YAML frontmatter |
| `#개인` | 개인 태그 |
| `#가족` | 가족 태그 |
| `#사적` | 사적 태그 |
| `[PRIVATE]` | PRIVATE 마커 |

---

## 8. 자동 실행 (Cron)

### 8.1 GitHub Actions

```yaml
# .github/workflows/drive-sync.yml
name: Drive to GitHub Sync

on:
  schedule:
    - cron: '0 */6 * * *'  # 6시간마다
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/sync/run \
            -H "x-sync-secret: ${{ secrets.SYNC_SECRET }}"
```

### 8.2 Google Apps Script (Trigger)

```javascript
function triggerSync() {
  const url = 'https://your-domain.com/api/sync/run';
  const options = {
    method: 'POST',
    headers: {
      'x-sync-secret': 'your-secret-key'
    }
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}

// 트리거 설정: 6시간마다 실행
```

---

## 9. 트러블슈팅

### 문제: "GOOGLE_SERVICE_ACCOUNT_JSON 환경변수 미설정"

- `.env` 파일에 JSON 전체를 한 줄로 설정
- 특수문자 이스케이프 확인

### 문제: "Drive API 오류: 403"

- Service Account에 폴더 공유 권한 확인
- Drive API 활성화 확인

### 문제: "GitHub API 오류: 404"

- Repository 이름 확인
- Token 권한 확인

### 문제: 중복 동기화

- Airtable에서 기존 레코드 확인
- `content_hash` 필드 정상 저장 확인

---

## 10. 관련 문서

- 서비스 코드: `services/driveToGitHubSyncService.js`
- 라우트 코드: `routes/driveGitHubSyncRoutes.js`
- 태그 체계: `docs/standards/tag_taxonomy.md`
- 승격 가이드: `docs/ops/weekly_promotion_guide.md`

---

*마지막 업데이트: 2026-01-22*
