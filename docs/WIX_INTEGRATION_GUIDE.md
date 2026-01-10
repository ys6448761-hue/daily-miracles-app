# Wix 폼 연동 가이드

> 작성일: 2026-01-10
> 작성자: Claude Code
> 상태: Production Ready

---

## 1. 개요

Wix 사이트의 폼에서 고객 문의가 접수되면, 자동으로 Daily Miracles 백엔드 API로 전송하여 견적 리드를 생성합니다.

```
[Wix 폼] → [Wix Automations] → [API 호출] → [Daily Miracles 백엔드]
                                                    ↓
                                            [DB 저장 + 알림톡 발송]
```

---

## 2. API 엔드포인트

### 프로덕션 URL

```
POST https://daily-miracles-app.onrender.com/api/v2/quote/wix
```

### 요청 형식

```
Content-Type: application/json
```

---

## 3. 필드 매핑

### 필수 필드

| Wix 폼 필드명 | API 필드명 | 설명 |
|--------------|-----------|------|
| `이름` 또는 `name` | `name` | 고객 이름 (필수) |

### 선택 필드

| Wix 폼 필드명 | API 필드명 | 설명 | 기본값 |
|--------------|-----------|------|--------|
| `전화번호` / `phone` | `phone` | 연락처 | null |
| `이메일` / `email` | `email` | 이메일 | null |
| `여행일` / `travel_date` | `travel_date` | 여행 예정일 | null |
| `인원` / `pax` / `party_size` | `pax` | 여행 인원 | 2 |
| `요청사항` / `notes` / `special_request` | `notes` | 특이사항 | null |
| `지역` / `region` | `region` | 지역 코드 | "yeosu" |

---

## 4. Wix Automations 설정 방법

### Step 1: Wix 대시보드 접속

1. Wix 사이트 관리자 로그인
2. **Automations** 메뉴 클릭
3. **+ New Automation** 클릭

### Step 2: 트리거 설정

```
Trigger: "Form is submitted"
Form: [견적 요청 폼 선택]
```

### Step 3: 액션 추가

```
Action: "Send an HTTP request"
```

### Step 4: HTTP 요청 설정

```yaml
URL: https://daily-miracles-app.onrender.com/api/v2/quote/wix

Method: POST

Headers:
  Content-Type: application/json

Body (JSON):
{
  "name": "{{form.이름}}",
  "phone": "{{form.전화번호}}",
  "email": "{{form.이메일}}",
  "travel_date": "{{form.여행일}}",
  "pax": "{{form.인원}}",
  "notes": "{{form.요청사항}}"
}
```

### Step 5: 저장 및 활성화

1. **Save** 클릭
2. **Activate** 토글 ON

---

## 5. 요청/응답 예시

### 요청 예시

```json
{
  "name": "홍길동",
  "phone": "01012345678",
  "email": "hong@example.com",
  "travel_date": "2026-02-15",
  "pax": 4,
  "notes": "프로포즈 여행입니다"
}
```

### 성공 응답 (200 OK)

```json
{
  "success": true,
  "quote_id": "WIX-20260110-A1B2",
  "status": "lead",
  "env": "prod",
  "message": "견적 요청이 접수되었습니다"
}
```

### 실패 응답 (400 Bad Request)

```json
{
  "success": false,
  "error": "MISSING_NAME",
  "message": "이름은 필수입니다"
}
```

---

## 6. 테스트/프로덕션 환경 자동 감지

API는 아래 조건으로 테스트 환경을 자동 감지합니다:

### 테스트로 감지되는 경우 (env: "test")

- 이름/이메일/메모에 `test`, `테스트`, `dev` 포함
- 전화번호가 `01000000000` 또는 `01012345678`

### 프로덕션으로 감지되는 경우 (env: "prod")

- 위 조건에 해당하지 않는 모든 요청

---

## 7. 연동 테스트 방법

### curl로 테스트

```bash
# 테스트 요청
curl -X POST https://daily-miracles-app.onrender.com/api/v2/quote/wix \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트고객",
    "phone": "01012345678",
    "email": "test@example.com",
    "travel_date": "2026-02-01",
    "pax": 2,
    "notes": "테스트입니다"
  }'
```

### 예상 응답

```json
{
  "success": true,
  "quote_id": "WIX-20260110-XXXX",
  "status": "lead",
  "env": "test",
  "message": "견적 요청이 접수되었습니다"
}
```

---

## 8. 연동 후 자동 처리

### 리드 생성 시 자동 수행되는 작업

1. **DB 저장**: `quotes` 테이블에 리드 저장
2. **이벤트 로깅**: `quote_events` 테이블에 기록
3. **메모리 캐시**: 빠른 조회를 위한 캐싱

### 향후 추가 예정

- [ ] 알림톡 자동 발송 (견적 접수 확인)
- [ ] 담당자 알림 (Slack/카카오톡)
- [ ] CRM 연동

---

## 9. 트러블슈팅

### 문제: 요청이 실패함

```
확인사항:
1. URL이 정확한지 (https:// 포함)
2. Content-Type: application/json 헤더 있는지
3. JSON 형식이 올바른지
4. name 필드가 있는지
```

### 문제: 한글이 깨짐

```
확인사항:
1. Wix Automations에서 UTF-8 인코딩 확인
2. 특수문자 이스케이프 처리
```

### 문제: 응답이 느림

```
원인: Render 무료 플랜 콜드 스타트 (첫 요청 시 10-30초)
해결: 프로덕션에서는 유료 플랜 권장
```

---

## 10. 문의

기술 문의: Claude Code (이 문서 작성자)
운영 문의: 푸르미르 CEO

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-10 | 1.0 | 최초 작성 |
