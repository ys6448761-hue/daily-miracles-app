# Wish Intake 7문항 E2E 스모크 테스트

## 실행 방법

**Windows**: Git Bash 또는 WSL에서 실행
```bash
bash tests/fixtures/wish-intake/e2e-smoke-test.sh
```

**Mac/Linux**: 터미널에서 직접 실행
```bash
./tests/fixtures/wish-intake/e2e-smoke-test.sh
```

## 검증 항목

| 단계 | 검증 내용 |
|------|----------|
| 1. 세션 생성 | CREATED → IN_PROGRESS 전이 |
| 2. 7문항 답변 | 한글 UTF-8 인코딩 정상 저장 |
| 3. 세션 완료 | COMPLETED 상태 전이 |
| 4. 요약 생성 | GPT-4 요약 + Airtable 저장 |

## 합격 기준

- 최종 상태: `SUMMARIZED`
- Airtable 필드: `summary_short`, `summary_structured` 저장 확인

## 실패 시 체크포인트

| 증상 | 확인 위치 |
|------|----------|
| `Unknown field name` | Airtable 스키마 필드명 일치 여부 |
| 한글 깨짐 (`???`) | curl UTF-8 인코딩 (파일 방식 사용) |
| 상태 전이 안됨 | Render 로그 `[WishIntake]` 확인 |

## 레코드 확인

- **Sessions**: Airtable > Wish Intake Sessions
- **Messages**: Airtable > Wish Intake Messages

## 관련 P1 태스크

- [x] 요약 저장 실패 시 fallback 응답 처리 (saveFailed 플래그)
- [ ] 중복 방지 "연타 5회 → 응답 1회" (실오픈 게이트)
