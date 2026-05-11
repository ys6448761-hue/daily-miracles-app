# DreamTown Brain

DreamTown의 공식 기억과 푸르미르 개인 사고 저장소.

> 이 폴더는 OpenClaw 도입 전 기반 구조다.
> 운영 경로(routes/, services/, database/)와 분리된 순수 기억/사고 공간이다.

---

## 구조

```
dreamtown-brain/
├── core/               ← 시스템 핵심 규칙 (역할, 라우팅, 비주얼)
├── official/           ← 공식 승인된 자료
│   ├── ssot/           ← Single Source of Truth 문서
│   ├── dec/            ← 결정(Decision) 기록
│   ├── visual-rules/   ← 비주얼 가이드 확정본
│   └── approved-prompts/ ← 승인된 프롬프트
├── purmir-lab/         ← 푸르미르 개인 사고 공간
│   ├── raw-thoughts/   ← 날것의 생각 메모
│   ├── dream-seeds/    ← 아이디어 씨앗
│   ├── emotional-notes/← 감정 기록
│   ├── future-worlds/  ← 미래 세계관 스케치
│   ├── experiments/    ← 실험 기록
│   └── unresolved/     ← 미해결 질문
├── memory/             ← 학습된 패턴과 기억
│   ├── prompts/        ← 프롬프트 패턴
│   ├── scenes/         ← 장면 기억
│   ├── emotions/       ← 감정 패턴
│   ├── failures/       ← 실패 기록 (반복 방지)
│   ├── successful-patterns/ ← 성공 패턴
│   └── growth-history/ ← 성장 히스토리
├── workflows/          ← 작업 흐름 가이드
│   ├── image-generation/
│   ├── sora-scenes/
│   ├── marketing/
│   └── coding/
├── agents/             ← 에이전트 정의/역할
├── output/             ← 결과물 저장
│   ├── images/
│   ├── videos/
│   ├── reports/
│   └── logs/
└── scripts/            ← 자동화 스크립트
```

---

## 사용 원칙

1. `official/` — CEO 승인 없이 수정 금지
2. `purmir-lab/` — 푸르미르 전용. 초안이므로 완성도 불필요
3. `memory/failures/` — 실패는 지우지 않는다. 기억이 자산이다
4. `core/` — 이 Brain 전체의 동작 기준. 먼저 읽는다

---

> "기억이 없으면 성장도 없다. DreamTown Brain은 세계가 자라는 토양이다."
