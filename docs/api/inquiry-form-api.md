# MVP 1차 폼 (간편 접수) API v1.0

> 60초 컷! 고객 이탈 최소화를 위한 간편 접수 시스템

---

## 설계 원칙

1. **상품군만 선택** - 세부 상품 분기 없이 단일 폼
2. **내부 태그 분류** - PASS / SINGLE / RECOMMEND
3. **필수 5개 + 선택 1개** - 60초 내 완료 가능
4. **동양학/사주 느낌 금지** - 출생시간 질문 없음
5. **사진 수집은 2차에서** - MVP에서 무리하게 포함 안 함

---

## 엔드포인트 목록

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/inquiry/form` | 폼 질문 목록 조회 |
| POST | `/api/inquiry/submit` | 1차 폼 접수 |
| GET | `/api/inquiry/:inquiryId` | 접수 상태 조회 |
| GET | `/api/inquiry/list/all` | 전체 목록 (관리자) |

---

## 1. 폼 질문 조회

### GET /api/inquiry/form

폼 렌더링에 필요한 질문 목록을 반환합니다.

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "title": "여수 여행 간편 접수",
    "description": "60초면 충분해요! 간단한 정보만 알려주세요.",
    "questions": [
      {
        "id": "Q1",
        "field": "productType",
        "question": "어떤 형태의 여행을 원하시나요?",
        "type": "select",
        "options": [
          { "label": "투어패스 (추천 포함)", "tag": "PASS" },
          { "label": "단품 (소원교환)", "tag": "SINGLE" },
          { "label": "모르겠어요 (추천해주세요)", "tag": "RECOMMEND" }
        ],
        "required": true
      },
      // ... Q2~Q6
    ],
    "version": "1.0"
  }
}
```

---

## 2. 1차 폼 접수

### POST /api/inquiry/submit

**요청:**

```json
{
  "productType": "PASS",
  "region": "seoul",
  "schedule": "next_month",
  "preferredDate": "2025-01-15",
  "groupSize": "2",
  "contact": "010-1234-5678",
  "request": "휠체어 이용 가능한 곳으로 부탁드려요"
}
```

### 필드 설명

| 필드 | 타입 | 필수 | 설명 | 옵션 |
|------|------|:----:|------|------|
| `productType` | string | ✅ | 상품 유형 | `PASS` / `SINGLE` / `RECOMMEND` |
| `region` | string | ✅ | 출발 권역 | `seoul` / `gyeonggi` / `chungcheong` / `gyeongsang` / `other` |
| `schedule` | string | ✅ | 희망 일정 | `this_month` / `next_month` / `undecided` |
| `preferredDate` | string | ❌ | 구체적 날짜 | `YYYY-MM-DD` 형식 |
| `groupSize` | string | ✅ | 인원 | `1` / `2` / `3-4` / `5+` |
| `contact` | string | ✅ | 연락처 | 카카오톡 ID 또는 휴대폰 번호 |
| `request` | string | ❌ | 추가 요청 | 최대 500자 |

### 내부 태그 매핑

```
productType → 내부 태그
─────────────────────────
투어패스(추천 포함)  → PASS
단품(소원교환)       → SINGLE
모르겠어요(추천)     → RECOMMEND
```

**성공 응답 (201 Created):**

```json
{
  "success": true,
  "data": {
    "inquiryId": "INQ-20251213-abc123",
    "tag": "PASS",
    "message": "투어패스 문의가 접수되었습니다! 여수의 다양한 매력을 한 번에 즐기실 수 있도록 맞춤 패키지를 준비해 드릴게요.",
    "nextStep": "담당자가 곧 연락드려 세부 일정과 포함 내역을 안내해 드립니다.",
    "estimatedResponse": "영업시간 기준 1시간 이내",
    "timestamp": "2025-12-13T10:30:00.000Z"
  }
}
```

**에러 응답 (400 Bad Request):**

```json
{
  "success": false,
  "error": "입력 정보를 확인해주세요.",
  "details": [
    "어떤 형태의 여행을 원하시나요?은(는) 필수 입력입니다.",
    "연락처 형식이 올바르지 않습니다."
  ]
}
```

---

## 3. 접수 상태 조회

### GET /api/inquiry/:inquiryId

**응답:**

```json
{
  "success": true,
  "data": {
    "inquiryId": "INQ-20251213-abc123",
    "status": "received",
    "statusLabel": "접수 완료",
    "tag": "PASS",
    "createdAt": "2025-12-13T10:30:00.000Z"
  }
}
```

### 상태 흐름

```
received → contacted → confirmed → completed
(접수)      (연락)      (확정)      (완료)
```

---

## 4. 전체 목록 조회 (관리자)

### GET /api/inquiry/list/all

**응답:**

```json
{
  "success": true,
  "data": {
    "total": 15,
    "inquiries": [
      {
        "inquiryId": "INQ-20251213-abc123",
        "tag": "PASS",
        "region": "seoul",
        "schedule": "next_month",
        "groupSize": "2",
        "contact": "010-1234-5678",
        "status": "received",
        "createdAt": "2025-12-13T10:30:00.000Z"
      }
      // ...
    ]
  }
}
```

---

## Wix 연동 예시

### JavaScript (Wix Velo)

```javascript
import { fetch } from 'wix-fetch';

export async function submitInquiry(formData) {
  const response = await fetch('https://your-domain.com/api/inquiry/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productType: formData.productType,
      region: formData.region,
      schedule: formData.schedule,
      preferredDate: formData.preferredDate || null,
      groupSize: formData.groupSize,
      contact: formData.contact,
      request: formData.request || null
    })
  });

  const result = await response.json();

  if (result.success) {
    // 접수 완료 페이지로 이동
    wixLocation.to(`/inquiry-complete?id=${result.data.inquiryId}`);
  } else {
    console.error('접수 실패:', result.error);
  }
}
```

---

## 접수 완료 메시지 템플릿

### 카카오톡 (친구톡/알림톡)

```
🎫 투어패스 문의 접수 완료

안녕하세요! 여수 기적여행입니다.
문의가 정상적으로 접수되었습니다.

📋 접수번호: INQ-20251213-abc123
📍 출발: 서울
📅 일정: 다음 달
👥 인원: 2명

여수의 다양한 매력을 한 번에 즐기실 수 있도록 맞춤 패키지를 준비해 드릴게요.

담당자가 곧 연락드리겠습니다.
(영업시간 기준 1시간 이내)

━━━━━━━━━━━━
여수 기적여행
문의: 1899-6117
━━━━━━━━━━━━
```

### SMS (90자)

```
[여수기적여행] 투어패스 문의 접수 완료
접수번호: INQ-20251213-abc123
담당자가 곧 연락드립니다.
문의: 1899-6117
```

---

## 향후 확장 (2차 수집)

MVP 이후 `/wish/:inquiryId` 개인페이지에서 추가 정보 수집:

1. **사진 업로드** - 프로필 사진, 기념사진 등
2. **상세 요청** - 식사 제한, 이동 편의 등
3. **결제 연동** - 7일 무료체험 + 월 구독

---

## 파일 위치

```
config/
├── inquiryForm.js       # 폼 스키마 + 검증 로직
├── messageTemplates.js  # 메시지 템플릿

routes/
├── inquiryRoutes.js     # API 라우트

docs/api/
├── inquiry-form-api.md  # 이 문서
```

---

**버전**: 1.0
**최종 업데이트**: 2025-12-13
