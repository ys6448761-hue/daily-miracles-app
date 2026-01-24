# SENS 설정 가이드 (Naver Cloud Platform)

**작성일:** 2025-01-24
**목적:** 카카오 알림톡/SMS 발송 기능 활성화

---

## 현재 상태

| 항목 | 상태 |
|------|:----:|
| SENS API 코드 구현 | ✅ 완료 |
| 카카오 채널 연동 | ✅ 완료 (@dailymiracles) |
| 아침/저녁 템플릿 승인 | ✅ 완료 |
| **Render 환경변수 설정** | ❌ **미완료** |

---

## Render에 설정할 환경변수

### 필수 설정 (5개)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `SENS_ACCESS_KEY` | NCP IAM 액세스 키 | `ABCDEFxxxxx` |
| `SENS_SECRET_KEY` | NCP IAM 시크릿 키 | `xyzABCDEF123...` |
| `SENS_SERVICE_ID` | 알림톡 서비스 ID | `ncp:kkobizmsg:kr:12345678:project` |
| `SENS_SMS_SERVICE_ID` | SMS 서비스 ID | `ncp:sms:kr:12345678:project` |
| `SENS_CHANNEL_ID` | 카카오 채널 ID | `_xfxhcWn` |

### 템플릿 코드 (승인 후 입력)

| 변수명 | 설명 | 발송 시점 |
|--------|------|----------|
| `SENS_TEMPLATE_CODE` | 기적 결과 알림 | 분석 완료 시 |
| `SENS_MORNING_TEMPLATE_CODE` | 아침 응원 메시지 | 매일 07:00 |
| `SENS_EVENING_TEMPLATE_CODE` | 저녁 응원 메시지 | 매일 21:00 |

---

## 설정 방법

### Step 1: NCP 콘솔에서 API 키 확인

1. [NCP 콘솔](https://console.ncloud.com) 로그인
2. **IAM > Sub Account > API 키 관리**
3. 액세스 키, 시크릿 키 복사

### Step 2: SENS 서비스 ID 확인

1. **SENS > 알림톡 > 프로젝트 목록**
2. 사용할 프로젝트 클릭
3. **서비스 ID** 복사 (예: `ncp:kkobizmsg:kr:12345678:project`)

4. **SENS > SMS > 프로젝트 목록**
5. SMS 프로젝트의 **서비스 ID** 복사

### Step 3: 카카오 채널 ID 확인

1. **SENS > 알림톡 > 카카오톡 채널 관리**
2. 연동된 채널의 **검색용 아이디** 확인
3. `@dailymiracles` → 채널 ID: `_xfxhcWn`

### Step 4: Render 환경변수 설정

1. [Render Dashboard](https://dashboard.render.com) 접속
2. **daily-miracles-app** 서비스 선택
3. **Environment** 탭
4. 아래 변수들 추가:

```
SENS_ACCESS_KEY=실제값
SENS_SECRET_KEY=실제값
SENS_SERVICE_ID=ncp:kkobizmsg:kr:xxxxxxxx:프로젝트명
SENS_SMS_SERVICE_ID=ncp:sms:kr:xxxxxxxx:프로젝트명
SENS_CHANNEL_ID=_xfxhcWn
SENS_TEMPLATE_CODE=승인된_템플릿_코드
MSG_USE_SENS=true
```

5. **Save Changes** 클릭
6. 서비스 자동 재시작 대기

---

## 테스트 방법

### 1. 환경변수 확인 (서버 로그)

Render 로그에서 다음 메시지 확인:

```
[MessageProvider] 설정:
  USE_SENS: ✅ ON
  SENS_ACCESS_KEY: ✅ 설정됨
  SENS_SERVICE_ID: ncp:kkobizmsg:kr:xxxxx
  SENS_CHANNEL_ID: _xfxhcWn
  SENS_TEMPLATE_CODE: ✅ 설정됨
```

### 2. 실제 발송 테스트

1. https://app.dailymiracles.kr/wish 접속
2. 테스트 소원 제출 (전화번호 포함)
3. 카카오톡 알림 수신 확인

---

## 영향받는 기능

설정 완료 시 다음 기능이 활성화됩니다:

| 기능 | 발송 시점 | 템플릿 |
|------|----------|--------|
| 소원 신청 완료 알림 | 즉시 | SMS (템플릿 미승인 시) |
| 기적 분석 결과 알림 | 분석 완료 후 | `SENS_TEMPLATE_CODE` |
| 아침 응원 메시지 | 매일 07:00 | `SENS_MORNING_TEMPLATE_CODE` |
| 저녁 응원 메시지 | 매일 21:00 | `SENS_EVENING_TEMPLATE_CODE` |
| RED 신호 긴급 알림 | 감지 즉시 | SMS |

---

## 주의사항

1. **시크릿 키 보안**: 절대 Git에 커밋하지 마세요
2. **템플릿 승인**: 카카오 승인 전에는 SMS로 발송됨
3. **발신번호**: 1899-6117은 알림톡 전용, SMS는 010 번호 필요
4. **과금**: SMS는 건당 약 20원, 알림톡은 건당 약 8원

---

## 문제 해결

### "SENS API 키 미설정" 로그

→ `SENS_ACCESS_KEY`, `SENS_SECRET_KEY`, `SENS_SERVICE_ID` 확인

### "템플릿 코드 미설정" 로그

→ `SENS_TEMPLATE_CODE` 환경변수 추가 필요

### 알림톡은 실패하고 SMS만 발송됨

→ 템플릿 코드가 잘못되었거나 채널 ID 불일치
→ NCP 콘솔에서 알림톡 발송 이력 확인

---

**작성:** Claude Code
**확인:** 코미 (Aurora5 COO)
