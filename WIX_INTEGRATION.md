# Wix 연동 가이드 - 문제 해결 소원 API

> Wix Velo에서 문제 해결 소원 API를 호출하는 최소 예제 코드

---

## 📋 목차

1. [Wix 프로젝트 구조](#1-wix-프로젝트-구조)
2. [백엔드 코드 (backend/onlineWish.jsw)](#2-백엔드-코드)
3. [프론트엔드 코드 (페이지 코드)](#3-프론트엔드-코드)
4. [HTML 요소 설정](#4-html-요소-설정)
5. [테스트 방법](#5-테스트-방법)

---

## 1. Wix 프로젝트 구조

```
Wix Site
├── Backend (코드 파일)
│   └── onlineWish.jsw          ← API 호출 백엔드 코드
│
├── Pages
│   ├── problem-wish (문제 해결 소원 폼)
│   │   └── problem-wish.js     ← 페이지 코드
│   │
│   └── problem-result (결과 페이지)
│       └── problem-result.js   ← 결과 표시 코드
│
└── Public
    └── ...
```

---

## 2. 백엔드 코드

### `backend/onlineWish.jsw`

Wix 에디터에서:
1. **Developer Tools** → **Backend** → **+ Add a new file**
2. 파일명: `onlineWish.jsw`
3. 아래 코드 복사/붙여넣기:

```javascript
// backend/onlineWish.jsw
import { fetch } from 'wix-fetch';

// ⚠️ 여기에 실제 Render 배포 URL을 입력하세요!
const API_BASE_URL = 'https://daily-miracles-api.onrender.com';

/**
 * 문제 해결 소원 API 호출
 * @param {Object} wishData - 사용자 입력 데이터
 * @returns {Promise<Object>} - API 응답
 */
export async function submitProblemWish(wishData) {
  try {
    console.log('📝 API 호출 시작:', wishData.nickname);

    const response = await fetch(`${API_BASE_URL}/api/problem/online-wish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: wishData.nickname,
        wishSummary: wishData.wishSummary,
        situation: wishData.situation || '',
        tries: wishData.tries || '',
        constraints: wishData.constraints || '',
        focus: wishData.focus || '',
        email: wishData.email || '',
        wixUserId: wishData.wixUserId || ''
      })
    });

    // HTTP 상태 체크
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('✅ API 호출 성공:', result.data.reportId);

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('❌ API 호출 실패:', error);

    return {
      success: false,
      error: error.message || '서버 연결에 실패했습니다.'
    };
  }
}

/**
 * Health Check (서버 상태 확인)
 * @returns {Promise<Object>}
 */
export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const result = await response.json();

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: '서버에 연결할 수 없습니다.'
    };
  }
}
```

---

## 3. 프론트엔드 코드

### `Pages/problem-wish/problem-wish.js`

Wix 에디터에서:
1. **problem-wish** 페이지 선택
2. **Developer Tools** → **Page Code**
3. 아래 코드 복사/붙여넣기:

```javascript
// Pages/problem-wish/problem-wish.js
import { submitProblemWish } from 'backend/onlineWish';
import wixLocation from 'wix-location';
import wixStorage from 'wix-window';

$w.onReady(function () {
  console.log('📄 문제 해결 소원 페이지 로드됨');

  // 제출 버튼 클릭 이벤트
  $w('#submitButton').onClick(() => handleSubmit());
});

/**
 * 폼 제출 처리
 */
async function handleSubmit() {
  // 1. 필수 필드 검증
  const nickname = $w('#nicknameInput').value.trim();
  const wishSummary = $w('#wishSummaryInput').value.trim();

  if (!nickname) {
    $w('#errorText').text = '닉네임을 입력해주세요.';
    $w('#errorText').show();
    return;
  }

  if (!wishSummary || wishSummary.length < 10) {
    $w('#errorText').text = '고민을 최소 10자 이상 입력해주세요.';
    $w('#errorText').show();
    return;
  }

  // 2. 에러 메시지 숨기기
  $w('#errorText').hide();

  // 3. 로딩 상태 표시
  $w('#submitButton').label = '분석 중... (20-30초 소요)';
  $w('#submitButton').disable();
  $w('#loadingSpinner').show(); // 스피너 있는 경우

  try {
    // 4. 폼 데이터 수집
    const wishData = {
      nickname: nickname,
      wishSummary: wishSummary,
      situation: $w('#situationInput').value.trim(),
      tries: $w('#triesInput').value.trim(),
      constraints: $w('#constraintsInput').value.trim(),
      focus: $w('#focusInput').value.trim(),
      email: $w('#emailInput').value.trim()
    };

    // 5. API 호출
    const result = await submitProblemWish(wishData);

    // 6. 결과 처리
    if (result.success) {
      console.log('✅ 분석 성공:', result.data.reportId);

      // 세션 스토리지에 저장
      wixStorage.session.setItem('problemReport', JSON.stringify(result.data));

      // 결과 페이지로 이동
      wixLocation.to(`/problem-result?reportId=${result.data.reportId}`);

    } else {
      // 에러 표시
      $w('#errorText').text = result.error || '분석 중 오류가 발생했습니다.';
      $w('#errorText').show();
      console.error('❌ 분석 실패:', result.error);
    }

  } catch (error) {
    console.error('💥 예외 발생:', error);
    $w('#errorText').text = '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.';
    $w('#errorText').show();

  } finally {
    // 7. 버튼 복원
    $w('#submitButton').label = '분석 받기';
    $w('#submitButton').enable();
    $w('#loadingSpinner').hide();
  }
}
```

---

## 4. HTML 요소 설정

Wix 에디터에서 다음 요소들을 페이지에 추가하고 **ID 설정**:

### 입력 필드

| 요소 타입 | ID | 플레이스홀더 |
|----------|-----|-------------|
| Text Input | `#nicknameInput` | "닉네임을 입력하세요 (예: 달빛고래)" |
| Text Box (여러 줄) | `#wishSummaryInput` | "어떤 고민이 있으신가요? (최소 10자)" |
| Text Box | `#situationInput` | "(선택) 구체적인 상황을 말씀해주세요" |
| Text Box | `#triesInput` | "(선택) 지금까지 시도해본 것들" |
| Text Box | `#constraintsInput` | "(선택) 제약사항 (예: 퇴사는 피하고 싶어요)" |
| Text Box | `#focusInput` | "(선택) 무엇에 집중하고 싶으신가요?" |
| Text Input | `#emailInput` | "(선택) 이메일 주소" |

### 버튼 및 상태 표시

| 요소 타입 | ID | 초기 설정 |
|----------|-----|----------|
| Button | `#submitButton` | label: "분석 받기" |
| Text | `#errorText` | hidden: true, 빨간색 |
| Loading Spinner | `#loadingSpinner` | hidden: true (선택) |

---

## 5. 테스트 방법

### 1단계: 로컬 테스트

1. Wix 에디터에서 **Preview** 클릭
2. 폼 입력:
   ```
   닉네임: 테스터
   고민: 상사가 회의에서 제 의견을 무시해요. (테스트)
   ```
3. **"분석 받기"** 버튼 클릭
4. 콘솔 확인 (F12):
   ```
   📝 API 호출 시작: 테스터
   ✅ API 호출 성공: report_...
   ```

### 2단계: 에러 처리 테스트

1. 닉네임만 입력하고 제출 → "고민을 최소 10자 이상..." 에러
2. 모두 비우고 제출 → "닉네임을 입력해주세요" 에러

### 3단계: 결과 페이지 테스트

`problem-result.js`:

```javascript
import wixStorage from 'wix-window';

$w.onReady(function () {
  // 세션에서 리포트 가져오기
  const reportJSON = wixStorage.session.getItem('problemReport');

  if (!reportJSON) {
    $w('#errorText').text = '분석 결과를 찾을 수 없습니다.';
    $w('#errorText').show();
    return;
  }

  const report = JSON.parse(reportJSON);

  // 결과 표시
  $w('#nicknameText').text = report.nickname;
  $w('#categoryText').text = report.categoryName;
  $w('#summaryText').text = report.analysis.summary;
  $w('#coreIssueText').text = report.analysis.coreIssue;

  // 인사이트 목록
  const insightsHTML = report.analysis.insights
    .map((insight, i) => `${i+1}. ${insight}`)
    .join('\n');
  $w('#insightsText').text = insightsHTML;

  // 선택지 표시
  displayOptions(report.analysis.options);

  // 다음 행동 표시
  displayNextActions(report.analysis.nextActions);
});

function displayOptions(options) {
  // 선택지를 Repeater나 Rich Content로 표시
  // (구현은 Wix 에디터 구조에 따라 다름)
}

function displayNextActions(actions) {
  // 다음 행동을 Repeater나 Rich Content로 표시
}
```

---

## 🎯 최종 체크리스트

배포 전 확인:

- [ ] `backend/onlineWish.jsw`의 `API_BASE_URL` 수정
  ```javascript
  const API_BASE_URL = 'https://daily-miracles-api.onrender.com';
  ```

- [ ] 모든 HTML 요소 ID 확인:
  - `#nicknameInput`
  - `#wishSummaryInput`
  - `#submitButton`
  - `#errorText`
  - 등등...

- [ ] Wix Preview에서 테스트
  - 필수 필드 검증 작동
  - API 호출 성공
  - 결과 페이지 이동

- [ ] Wix Publish
  - 실제 도메인에서 테스트
  - CORS 에러 확인 (있으면 Render 환경 변수에 도메인 추가)

---

## 🔧 트러블슈팅

### 문제: "Failed to fetch" 에러

**원인**: CORS 설정 문제

**해결**:
1. Render 환경 변수에서 `ALLOWED_ORIGINS` 확인
2. Wix 사이트 실제 URL 추가 (https:// 포함)
3. 예: `ALLOWED_ORIGINS=https://yourusername.wixsite.com/daily-miracles`

### 문제: "undefined" 에러

**원인**: HTML 요소 ID 불일치

**해결**:
1. Wix 에디터에서 각 요소 선택
2. **Properties Panel** → **ID** 확인
3. 코드의 `$w('#...').value`와 일치하는지 확인

### 문제: 버튼이 비활성화된 채로 유지

**원인**: `finally` 블록이 실행 안 됨

**해결**:
1. 콘솔에서 에러 확인
2. `try-catch-finally` 구조 확인
3. 필요시 버튼 수동 활성화

---

## 📞 지원

- **Wix Velo 문서**: https://www.wix.com/velo/reference/
- **Wix Fetch API**: https://www.wix.com/velo/reference/wix-fetch/fetch
- **프로젝트 이슈**: GitHub Issues

---

**작성일**: 2025-12-12
**API 버전**: v0.1
**Wix Velo 버전**: Latest
