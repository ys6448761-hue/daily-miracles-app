# 변경 요약 (2026-01-11)

> 생성자: @change-summarizer
> 생성 시간: 2026-01-11T14:15:00+09:00

---

## What (무엇이 바뀌었나)

### [feat] NanoBananaSkill SSOT 시스템 구축
- 캐릭터 일관성 95%+ 목표 파이프라인 정의
- 캐릭터 바이블 6종 생성 (푸르미르, 여의보주, 코미, 루미, 재미, 코드)
- 씬 템플릿 4종 생성 (group_shot, storybook, webtoon, video_frame)
- 일관성 가드 및 QA 체크리스트 추가

### [feat] Change→Insight 파이프라인 구축
- 변경사항 자동 분석/문서화 파이프라인
- 에이전트 3종: change-summarizer, impact-mapper, nanobanana-qa-gate
- 보고서 자동 생성 체계

### [assets] Aurora 5 캐릭터 이미지 v3
- 6명 개별 캐릭터 이미지 (1024px)
- 단체샷 이미지 1장
- 레퍼런스 이미지 복사 (assets/references/)

### [docs] 운영 문서 추가
- 후기 수집 구조 설계서 (REVIEW_COLLECTION_SYSTEM.md)
- 대화 로그 정리 (나노바나나 기법, 코드정보가공방법)

---

## Why (왜 바꿨나)

1. **캐릭터 일관성 문제 해결**
   - Sora 단체샷에서 캐릭터 불일치 발생
   - Google Gemini의 나노바나나 기능 활용 결정
   - SSOT(Single Source of Truth) 체계로 일관성 보장

2. **자동화 철학 구현**
   - Aurora 5 운영 원칙: "95% 자동 + 4% 검토 + 1% 개입"
   - 변경 → 지식 변환 자동화 필요
   - 신호등 기반 QA 게이트 체계화

3. **브랜드 자산 체계화**
   - 6명 캐릭터의 "절대 불변 5요소" 문서화
   - 이미지 생성 표준 프로세스 정립

---

## Impact (어디에 영향을 주나)

### 높음 (High)
| 영역 | 영향 |
|------|------|
| 캐릭터 이미지 생성 | 새로운 표준 프로세스 적용 필요 |
| 브랜드 가이드 | 캐릭터 바이블 참조 필수 |
| QA 프로세스 | 60점 만점 체크리스트 적용 |

### 중간 (Medium)
| 영역 | 영향 |
|------|------|
| 문서 관리 | Change→Insight 파이프라인 자동 실행 |
| 에이전트 시스템 | 3개 에이전트 추가 |

### 낮음 (Low)
| 영역 | 영향 |
|------|------|
| 기존 코드 | 영향 없음 (신규 생성만) |

---

## Files Changed (50개)

### 신규 (47개)

#### 에이전트/파이프라인 (5개)
- `.claude/agents/nano-banana-skill.md`
- `.claude/agents/change-summarizer.md`
- `.claude/agents/impact-mapper.md`
- `.claude/agents/nanobanana-qa-gate.md`
- `.claude/pipelines/change-intel.md`

#### 캐릭터 바이블 (6개)
- `brand/characters/purmilr.md`
- `brand/characters/yeouibozu.md`
- `brand/characters/komi.md`
- `brand/characters/lumi.md`
- `brand/characters/jaemi.md`
- `brand/characters/code.md`

#### 씬 템플릿/가드 (5개)
- `prompts/nanobanana/scenes/group_shot.md`
- `prompts/nanobanana/scenes/storybook.md`
- `prompts/nanobanana/scenes/webtoon.md`
- `prompts/nanobanana/scenes/video_frame.md`
- `prompts/nanobanana/guards/consistency_guard.md`

#### 캐릭터 이미지 (7개)
- `assets/characters/v3/individual/purmilr_ceo_dragon_1024.png`
- `assets/characters/v3/individual/yeouibozu_sage_dragon_1024.png`
- `assets/characters/v3/individual/komi_manager_dragon_1024.png`
- `assets/characters/v3/individual/lumi_analyst_dragon_1024.png`
- `assets/characters/v3/individual/jaemi_creative_dragon_1024.png`
- `assets/characters/v3/individual/code_tech_dragon_1024.png`
- `assets/characters/v3/team/aurora5_team_dragon_1024.png`

#### 레퍼런스 이미지 (6개)
- `assets/references/characters/*/01_front.png` (6개)

#### QA/문서 (3개)
- `qa/character_consistency_checklist.md`
- `docs/REVIEW_COLLECTION_SYSTEM.md`
- `reports/.gitkeep`

#### 기타 (15개)
- `.gitkeep` 파일 다수
- 대화 로그 2개

### 수정 (3개)
- `.claude/AURORA_STATUS.md` (121줄 추가)
- `.claude/settings.local.json`
- `scripts/createNotionDB.js`

---

## 관련 문서

- [NanoBananaSkill 메인 스킬](.claude/agents/nano-banana-skill.md)
- [Change→Insight 파이프라인](.claude/pipelines/change-intel.md)
- [QA 체크리스트](qa/character_consistency_checklist.md)
- [AURORA_STATUS](.claude/AURORA_STATUS.md)

---

## 통계

| 항목 | 수치 |
|------|------|
| 커밋 수 | 5 |
| 변경 파일 | 50 |
| 추가 라인 | +3,972 |
| 삭제 라인 | -128 |
| 이미지 파일 | 13개 (약 4MB) |

---

*@change-summarizer 에이전트 생성*
