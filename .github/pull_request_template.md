# PR 제목

## Source ID
<!-- 필수: 관련 Issue 번호 또는 외부 티켓 ID -->
- [ ] Issue #
- [ ] 외부 티켓:

## CASE 유형 (1개 이상 선택)
<!-- 해당하는 항목에 체크 -->
- [ ] CASE-A: 기능 추가/변경
- [ ] CASE-B: 버그 수정
- [ ] CASE-C: 리팩토링/성능 개선
- [ ] CASE-D: 문서/설정 변경
- [ ] CASE-E: 긴급 핫픽스

## [AIL] 지시서
<!--
필수 섹션입니다. AIL Gate가 이 섹션을 체크합니다.
자연어 논의는 Issue/Slack에서, 실행 지시는 여기에 AIL 형식으로 작성하세요.
-->

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

## 1. Project Mode
- [ ] Quick Build
- [ ] Scale Build

## 2. Changed files
<!-- 변경된 파일 목록 -->
-

## 3. Tests run
<!-- 실행한 테스트 목록 -->
- [ ] 로컬 테스트 완료
- [ ] 자동화 테스트 통과
- [ ] 수동 테스트 완료

## 4. Plan Required changes?
<!-- shared/scripts/workflows/migrations 수정 시 사전 승인 필수 -->
- [ ] shared
- [ ] scripts
- [ ] workflows
- [ ] migrations

Plan link:

## 5. Refactoring Risk Check
<!-- 해당 항목 체크 + 대응 전략 기술. 대응 전략 없으면 머지 금지 -->
- [ ] R1 Shared — 단독 PR + QA 회귀 필수
- [ ] R2 AccessPolicy — 권한 판단 단일화, FE 분기 금지
- [ ] R3 Rewards Ledger — 원장 기반 + 멱등키
- [ ] R4 Payment FSM — 상태 고정, 혜택은 이벤트 기반

## 6. Risk + Mitigation
<!-- 리스크와 대응 방안 -->
-

## 7. E2E Status (Scale Build only)
- [ ] Passed

## 체크리스트
- [ ] 코드 스타일 가이드 준수
- [ ] 보안 취약점 확인
- [ ] 문서 업데이트 (필요시)
- [ ] Breaking change 없음 (있으면 명시)

## 관련 문서/링크
<!-- Drive, Notion, 외부 문서 링크 -->
-

---
<!--
⚠️ 머지 필수 조건:
- [AIL] 섹션이 있어야 합니다
- Source ID가 명시되어야 합니다
- Plan Required 변경은 승인 없으면 머지 금지
- Refactoring Risk 대응 전략 없으면 머지 금지
- Scale Build는 E2E 최소 1개 통과 필수
-->
