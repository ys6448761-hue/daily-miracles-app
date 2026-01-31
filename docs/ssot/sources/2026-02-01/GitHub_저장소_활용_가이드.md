# GitHub 저장소 활용 가이드

> **IMMUTABLE SOURCE - DO NOT MODIFY**
> 원문 채팅 그대로 보존 (수정 금지)
> 작성일: 2026-02-01

---

## 저장소 구조

```
daily-miracles-mvp/
├── docs/
│   ├── ssot/                    # SSOT 정본 저장소
│   │   ├── sources/             # 원문 소스 (수정 금지)
│   │   ├── SOURCES_INDEX.md     # 원문→정본 매핑표
│   │   └── CHANGELOG.md         # 변경 로그
│   ├── sora/                    # Sora 시네마틱 트랙
│   │   └── v1.1/
│   │       └── VIDEO_MASTER.md
│   └── 2d/                      # 2D 지브리+웹툰 트랙
│       └── v7.0/
│           └── MIRACLE_MASTER_GUIDELINES.md
├── prompts/
│   └── sora/
│       └── v1.1/
│           └── PROMPT_PACK.yaml  # 40개 프롬프트 팩
├── profiles/                     # 트랙별 프로필 (섞임 방지)
│   ├── sora_cinematic.yaml
│   └── 2d_ghibli_webtoon.yaml
├── scripts/
│   └── lint/
│       ├── lint_rules.common.json
│       ├── LINT_REPORT_sora_v1.1.md
│       └── LINT_REPORT_2d_v7.0.md
└── .claude/
    └── team-memory/
        └── playbooks/
            ├── sora_video_master.md
            └── miracle_video_system_v7.md
```

---

## SSOT 운영 규칙

### 1. 원문 (Immutable Sources)
- `docs/ssot/sources/` 폴더 내 파일은 **절대 수정 금지**
- 날짜별 폴더로 버전 관리 (예: `2026-02-01/`)
- 새 버전 필요 시 새 날짜 폴더 생성

### 2. 정본 (Canonical Artifacts)
- 원문에서만 추출/생성
- 변경 시 반드시 `CHANGELOG.md` 업데이트
- `SOURCES_INDEX.md`에서 원문→정본 추적 가능

### 3. Gate 강제
- LINT_REPORT에서 FAIL 1개라도 있으면 PR merge 금지
- CI/CD에서 자동 검증

---

## 브랜치 전략

```
main (production)
├── develop (staging)
│   ├── feature/sora-v1.1
│   └── feature/2d-v7.0
└── hotfix/* (긴급 수정)
```

---

## PR 체크리스트

- [ ] LINT PASS 확인
- [ ] SOURCES_INDEX 매핑 업데이트
- [ ] CHANGELOG 기록
- [ ] 코미/루미 리뷰 완료

---

## 버전 관리 규칙

| 변경 유형 | 버전 증가 | 예시 |
|----------|----------|------|
| 원칙 추가/삭제 | Major (v2.0) | TEXT ZERO 규칙 변경 |
| 프롬프트 수정 | Minor (v1.2) | 마스코트 스펙 보완 |
| 오타/포맷 수정 | Patch (v1.1.1) | 줄바꿈 수정 |
