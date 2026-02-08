# [Settlement v2] I-0x <요약>

## Source ID
- [ ] Issue: #

## Gate 체크리스트 (5대 머지 판단 기준)

### 1. 픽스처 20케이스 PASS
- [ ] `npm run test:settlement` 실행 → 20/20 통과
- 실행 명령: `npm run test:settlement`
- 픽스처 위치: `tests/fixtures/settlement_v2/cases.json`

### 2. 합계 불변성 PASS
- [ ] buyer_paid = creator_allocations + platform_residual + fees (모든 이벤트 타입)
- 허용 오차: 0 (정수 cents, 반올림 없음)

### 3. Idempotency PASS
- [ ] 동일 event_id 중복 실행 → 결과 동일, 중복 저장 없음

### 4. 역분개 PASS
- [ ] original_event_id 연결 확인
- [ ] 델타 allocations 합계 일치
- [ ] REFUND / CHARGEBACK / FEE_ADJUSTED 모두 통과

### 5. AIL PASS
- [ ] 아래 AIL 섹션 작성 완료

---

## [AIL] 지시서

```ail
# AIL 지시서
# 작성자:
# 작성일: YYYY-MM-DD

[CONTEXT]
- 배경:
- 목표:

[INSTRUCTION]
1.
2.
3.

[CONSTRAINTS]
-

[DONE_WHEN]
-
```

## 변경 내용 요약


## SSOT 링크 (필수)
- 스키마:
- 이벤트 스펙:
- 픽스처: `tests/fixtures/settlement_v2/cases.json`

## 테스트 실행
```bash
npm run test:settlement
```

---
<!--
Settlement v2 PR 규칙:
- 이슈 1개 = PR 1개
- Gate 5항목 모두 PASS 시에만 머지
- Tech Approver: Code / Release Approver: 코미
-->
