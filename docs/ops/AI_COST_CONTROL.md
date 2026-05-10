# AI Cost Control — DreamTown 운영 모드

Version: v1.0
Owner: 푸르미르 (CEO) / Code
Status: Active
Purpose: Anthropic 자동 충전 / Opus 과사용 / 디버깅 루프 비용 통제

Last Updated: 2026-05-11

---

## 1. 모델 라우팅 표 (default)

| 모델 | 용도 | 예시 |
|------|------|------|
| **Opus** | SSOT 결정, 세계관/브랜드 판단, 복잡한 설계, CEO 의사결정 전 검토 | DreamTown SSOT 통합본 작성, 마이그레이션 적용 안전 검토 |
| **Sonnet** | 일반 코드 수정, 버그 수정, 라우팅/API/CSS/빌드, 로그 분석, 테스트 지시 실행 | seedRoutes 수정, OG 메타 정정, CSS 조정, /entry 분기 |
| **Haiku** | grep/search, 단순 파일 확인, 빌드 로그 요약, 반복 검증, 체크리스트 | 파일 위치 확인, 1줄 변경, ls/curl smoke test |

## 2. Opus 사용 승인 조건 (사전 승인 필수)

다음 4가지 중 1개 이상 해당할 때만 Opus 사용:
1. **SSOT 신규 작성/통합** (Visual_Style, World_Architecture 등)
2. **CEO 의사결정 전 트레이드오프 검토**
3. **production DB schema / migration 안전성 검토**
4. **세계관/감정 문법 등 정성 판단 필요**

→ 위 4개 외에는 모두 Sonnet/Haiku.

## 3. 디버깅 루프 제한 (반복 비용 차단)

- **원인 진단 전 push 금지**
- 한 이슈당 **최대 1회 수정** 후 사용자 검수
- FAIL 반복 시 즉시 **"원인 재진단 모드" 전환** (수정 중단)
- 같은 문제 **2회 이상 실패 시 더 이상 수정하지 말고 보고**
- 긴 로그 전체 투입 금지 — **핵심 50줄만 요약**
- build/push 반복 최소화 (동일 파일 3회 이상 push 금지)

## 4. push 전 체크리스트

- [ ] 원인 진단 완료 (가설 X, 검증 O)
- [ ] 수정 범위 = 진단 결과와 일치
- [ ] 사용자 검수 통과 시점인지 확인
- [ ] 최근 동일 파일 push 횟수 < 3
- [ ] 비용 영향 확인 (build/deploy/외부 API 호출)
- [ ] 사용자 명시 승인

## 5. 외부 API 호출 비용

| API | 호출당 비용 추정 | 통제 |
|---|---|---|
| OpenAI `gpt-image-1` | $0.02~$0.04/장 | 명시 승인 + LIMIT=1 시범 우선 |
| OpenAI `dall-e-3` | $0.04~$0.08/장 | 동일 |
| OpenAI Chat (GPT-4) | $0.01~$0.06/요청 | 프롬프트 최소화 |
| Anthropic Opus | $0.015/1K in, $0.075/1K out | 위 §2 조건만 |
| Anthropic Sonnet | $0.003/1K in, $0.015/1K out | default |
| Anthropic Haiku | $0.0008/1K in, $0.004/1K out | 단순 작업 |

## 6. Auto Recharge 주의

- Anthropic 자동 충전 한도 점검 (월 1회)
- 충전 발생 시 **slack/email 알림** 권장
- 하루 2회 이상 충전 시 즉시 작업 일시정지 → 원인 분석

## 7. 월간 비용 점검 루틴

매월 1일:
1. Anthropic 콘솔 → 모델별 token 사용량
2. OpenAI 콘솔 → image/chat 비용
3. Render → service deploy 횟수 + DB I/O
4. 예외 발생 시 본 문서에 후기 기록

## 8. Claude Code 설정 변경 (모델 고정)

### 옵션 A — 프로젝트 단위 (`.claude/settings.local.json`)
```json
{
  "model": "claude-sonnet-4-6"
}
```

### 옵션 B — 글로벌 (`~/.claude/settings.json`)
```json
{
  "model": "claude-sonnet-4-6"
}
```

### 옵션 C — 세션 단위
```
/model sonnet
```

→ 권장: **A (프로젝트 단위)** + Opus 필요 시 사전 승인 + `/model opus` 임시 전환.

## 9. 예외 처리

본 정책과 사용자 명시 요청이 충돌할 때:
- 사용자 명시가 우선
- 그러나 본 문서의 비용 위험은 보고
- 사용자가 비용 인지한 상태에서 명시 승인 시 진행

## 10. 변경 이력

| 일자 | 변경 | 사유 |
|---|---|---|
| 2026-05-11 | v1.0 신규 | Anthropic 자동 충전 하루 2~3회 발생 |
