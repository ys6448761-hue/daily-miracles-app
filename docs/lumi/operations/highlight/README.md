# highlight/

---

**목적:** Conversation과 Observation 사이의 완충 단계. 운영 중 눈에 띈
순간을 가볍게 메모해 두는 곳이다 — 분석하지 않는다.
**Status:** 구조·템플릿만 준비됨 (2026-07-16). 실제 데이터는 아직
입력되지 않았다. 템플릿 검증용 가상 샘플 5건이
`_pilot-test-samples/`(실제 운영 데이터 아님)에 있다.

## Highlight 생성 기준

다음 중 하나 이상이면 Highlight를 만든다.

- 반복될 가능성이 보인다.
- 예상과 다른 사용자 반응이 있었다.
- 응답 방식이 매우 효과적이었다.
- 운영 정책에 영향을 줄 가능성이 있다.
- 다시 검토할 가치가 있다.

그 외에는 Conversation에서 종료한다 — 모든 대화가 Highlight가 되지
않는다.

## Highlight vs Observation

- Highlight: 한두 문장, 운영 메모, 분석하지 않는다.
- Observation: Highlight가 충분히 축적된 이후에만 작성하는 운영 분석
  (`../observations/TEMPLATE_Observation.md` 참조).

템플릿: `TEMPLATE_Highlight.md`
