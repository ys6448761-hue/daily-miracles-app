---
name: message-dispatcher
description: 이메일 및 카카오톡 알림톡 통합 발송 관리
version: 1.0.0
trigger: "메시지 발송"
---

# Message Dispatcher 스킬

## 🎯 역할

생성된 콘텐츠를 소원이에게 발송:
1. **이메일 발송**: SendGrid 연동
2. **카카오톡 발송**: Solapi 알림톡
3. **스케줄링**: 예약 발송 관리

## 📥 입력

```json
{
  "recipient": {
    "name": "소원이 이름",
    "phone": "010-0000-0000",
    "email": "sowoni@example.com"
  },
  "channel": "kakao|email|both",
  "content": {
    "type": "message|pdf|magic-link",
    "body": "메시지 내용",
    "attachments": []
  },
  "schedule": "2025-12-22T09:00:00+09:00"
}
```

## 📤 출력

```json
{
  "success": true,
  "messageId": "msg_123456",
  "channel": "kakao",
  "sentAt": "2025-12-22T09:00:01+09:00",
  "status": "delivered"
}
```

## 📡 발송 채널

### 카카오톡 (Solapi)
- 알림톡 템플릿 사용
- 발신번호 인증 필요
- 실패 시 SMS 폴백

### 이메일 (SendGrid)
- HTML 템플릿
- PDF 첨부 가능
- 열람 추적

## ⚡ 속도 기준

- 목표: 3초
- 최대: 5초

## 🔗 의존

← wish-writer (메시지)
← roadmap-generator (PDF)
→ comi-orchestrator (발송 로그)
