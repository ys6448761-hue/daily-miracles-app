# GA4 설정 가이드

> 하루하루의 기적 - Google Analytics 4 연동

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| gtag 이벤트 코드 | 일부 구현됨 |
| gtag.js 스크립트 | **미설정** |
| 측정 ID | **필요** |

---

## 필요 정보

**GA4 측정 ID** 형식: `G-XXXXXXXXXX`

Google Analytics 4 > 관리 > 데이터 스트림 > 웹 > 측정 ID에서 확인 가능

---

## 설정 시 추가될 스크립트

모든 HTML 파일의 `<head>` 태그 바로 아래에 추가:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 대상 HTML 파일 (19개)

1. `public/index.html` - 메인 랜딩
2. `public/questions.html` - 12질문 테스트
3. `public/result.html` - 기적지수 결과
4. `public/test-result.html` - 테스트 결과
5. `public/wish-form.html` - 소원 입력
6. `public/wish-voyage.html` - 소원 여정
7. `public/daily-miracles.html` - 데일리 체크인
8. `public/daily-miracles-result.html` - 체크인 결과
9. `public/daily-messages.html` - 응원 메시지
10. `public/roadmap.html` - 30일 로드맵
11. `public/beta.html` - 베타 신청
12. `public/signup.html` - 회원가입
13. `public/login.html` - 로그인
14. `public/feedback.html` - 피드백
15. `public/storybook.html` - 스토리북
16. `public/privacy.html` - 개인정보처리방침
17. `public/terms.html` - 이용약관
18. `public/forgot-password.html` - 비밀번호 찾기
19. `public/daily-miracles-result-old.html` - (레거시)

---

## 추적할 핵심 이벤트

### 퍼널 이벤트 (전환 설정 권장)

| 이벤트명 | 설명 | 위치 |
|----------|------|------|
| `page_view` | 페이지 조회 | 자동 |
| `cta_problem_click` | 문제해결 CTA 클릭 | index.html |
| `cta_wish_click` | 소원보내기 CTA 클릭 | index.html |
| `cta_miracle_test_click` | 기적지수 테스트 클릭 | index.html |
| `beta_signup` | 베타 신청 완료 | beta.html |
| `feedback_submit` | 피드백 제출 | feedback.html |

### 추가 필요 이벤트

| 이벤트명 | 설명 | 구현 필요 |
|----------|------|-----------|
| `start_trial` | 무료체험 시작 | ✓ 필요 |
| `complete_day7` | 7일 완주 | ✓ 필요 |
| `purchase` | 결제 완료 | ✓ 필요 |
| `share_referral` | 추천 링크 공유 | ✓ 필요 |

---

## 설정 방법

측정 ID 제공 후 Claude Code에게 요청:

```
GA4 측정 ID G-XXXXXXXXXX로 설정해줘
```

자동으로:
1. 모든 HTML 파일에 gtag 스크립트 추가
2. 기존 이벤트 코드 동작 확인
3. 추가 전환 이벤트 구현

---

*마지막 업데이트: 2026-01-12*
