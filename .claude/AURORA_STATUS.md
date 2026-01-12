# AURORA_STATUS.md
## 하루하루의 기적 - 프로젝트 현황판

**마지막 업데이트**: 2026-01-13 KST
**업데이트 담당**: Claude Code

---

## 서비스 개요

| 항목 | 내용 |
|------|------|
| **서비스명** | 하루하루의 기적 (Daily Miracles) |
| **CEO** | 푸르미르 (이세진) |
| **핵심 가치** | 소원이들의 기적 실현을 돕는 AI 기반 서비스 |
| **기술 스택** | Node.js, Express, OpenAI (DALL-E 3, GPT-4) |
| **저장소** | https://github.com/ys6448761-hue/daily-miracles-app |

---

## Aurora 5 팀 구성

| 역할 | 담당 | 주요 업무 |
|------|------|----------|
| **코미** | COO | 총괄 조율, 의사결정 문서화, 토론 종합 |
| **재미** | CRO | 소원이 응대, 창의적 아이디어 |
| **루미** | Data Analyst | 데이터 분석, 대시보드 |
| **여의보주** | 품질 검수 | 콘텐츠 품질, 소원이 관점 |
| **Claude Code** | 기술 구현 | 코드 작성, API 개발 |

---

## 현재 상태 요약

```
🟢 운영 중: MVP 서비스 (소원 등록, 문제 해결, 소원실현)
🟢 완료: 기적지수 통합 엔진 v2.0 (결정론적 + 캐싱 + 에너지 스무딩)
🟢 완료: 토론 자동화 시스템 v3.2 (DECISION/EXPLORE 모드)
🟢 완료: GitHub Actions CI/CD 파이프라인 정상화
🟢 완료: Aurora5 DB 스키마 (4개 테이블)
🟢 완료: MCP 서버 7종 (신규 2종 추가)
🟢 완료: P1 Airtable 웹훅 연동 + WishRouter 자동 분류
🟢 완료: P3 wish-journey 파이프라인 (신호등 연동)
🟢 완료: P3 Aurora 5 서브에이전트 자동화 API
🟢 완료: P3 배치 처리 시스템 (9종 배치 유형)
🟢 완료: P1 아우룸 재배치 정책 전수 점검 (0개 발견)
🟢 완료: conversations 폴더 구조 정리 (팀원별/주제별 7개 폴더)
🟢 완료: Aurora 5 캐릭터 프롬프트 v3.0 (디지털 용궁 에디션)
🟢 완료: assets/characters/v3 폴더 구조 생성 (이미지 저장 준비)
🟢 완료: Wix 팀 소개 페이지 콘텐츠 (6명 팀원 카드 + 디자인 가이드)
🟢 완료: 후기 수집 구조 설계서 (Day 7 핵심, 자동화 파이프라인)
🟢 완료: NanoBananaSkill SSOT 시스템 (캐릭터 일관성 95%+ 목표)
🟢 완료: Aurora 5 캐릭터 이미지 v3 (6명 개별 + 단체샷)
🟢 완료: Change→Insight 파이프라인 (변경사항 자동 분석/문서화)
🟢 완료: NanoBanana C.C.E v2.0 + Change→Insight v2.0 통합 업그레이드
🟢 완료: Aurora5 Visual OS v1.0 (엔진-독립형 95% 유지 운영체계)
🟢 완료: team_shot_best_v2b 멀티턴 편집 (QA 95점, 코드/코미 마커 강화)
🟢 완료: 재미 온보딩 가이드 v1.2 (복귀 브리핑 문서)
🟢 완료: P0 30일 프로그램 결제 시스템 (비회원 결제, entitlement 발급)
🟢 완료: P0 소원 스타터 7 (9,900원 + 24시간 업그레이드 크레딧)
🟡 진행중: GA4 설정 (측정 ID 대기 중)
🟡 진행중: 10회 검증 validation (1/10 완료)
```

---

## 최근 완료 작업

### 2026-01-13: P0 소원 스타터 7 (9,900원) + 24시간 업그레이드 크레딧

| 작업 | 상태 | 산출물 |
|------|------|--------|
| PRG_STARTER_7 상품 정의 | ✅ | `routes/programRoutes.js` |
| 24시간 업그레이드 크레딧 로직 | ✅ | `checkUpgradeCredit()` 함수 |
| /program 페이지 스타터 카드 | ✅ | `public/program.html` |
| entitlement starter_7 권한 키 | ✅ | `middleware/entitlement.js` |
| 테스트 4개 통과 | ✅ | products, 결제, 크레딧 적용, 정상가 |

### 상품 라인업 (정본)

| SKU | 상품명 | 가격 | 기간 | 비고 |
|-----|--------|------|------|------|
| PRG_STARTER_7 | 소원 스타터 7 | 9,900원 | 7일 | 엔트리 상품 |
| PRG_WISH_30 | 소원실현 30 | 29,900원 | 30일 | - |
| PRG_SOLVE_30 | 문제해결 30 | 29,900원 | 30일 | - |
| PRG_DUAL_30 | 듀얼 30 | 49,900원 | 30일 | 소원+해결 통합 |

### 업그레이드 크레딧 정책

```
스타터 7 구매 후 24시간 이내:
→ 30일 상품 업그레이드 시 9,900원 전액 크레딧 적용
→ 예: 소원실현 30 (29,900원) → 20,000원
```

### 커밋 이력

```
aeb182b - feat(program): P0 소원 스타터 7 (9,900원) + 24시간 업그레이드 크레딧
```

---

### 2026-01-12: GA4 설정 준비

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 기존 gtag 코드 확인 | ✅ | index.html, beta.html, feedback.html |
| GA4 설정 가이드 생성 | ✅ | `docs/setup/GA4_SETUP_GUIDE.md` |
| 측정 ID 설정 | ⏳ | **측정 ID (G-XXXXXXXXXX) 대기 중** |

### 현재 트래킹 상태

| 항목 | 상태 |
|------|------|
| gtag 이벤트 코드 | ✅ 일부 구현됨 |
| gtag.js 스크립트 로드 | ❌ 미설정 |
| GA4 측정 ID | ❌ 필요 |
| Meta Pixel | ❌ 미설정 |
| TikTok Pixel | ❌ 미설정 |

### 다음 단계

```
1. GA4 측정 ID (G-XXXXXXXXXX) 제공
2. 19개 HTML 파일에 gtag 스크립트 추가
3. 전환 이벤트 설정 (start_trial, complete_day7, purchase)
```

---

### 2026-01-11: team_shot_best_v2b 멀티턴 편집 완료

| 작업 | 상태 | 산출물 |
|------|------|--------|
| v2 계보 정리 (v3→v2a) | ✅ | `assets/golden/team_shot_best_v2a.png` |
| 멀티턴 편집 (코드/코미) | ✅ | `assets/golden/team_shot_best_v2b.png` |
| QA Gate 실행 | ✅ | PASSED (95/100) |
| QA 리포트 생성 | ✅ | `reports/consistency/qa-team_shot_best_v2b-2026-01-11.md` |
| Golden 문서 업데이트 | ✅ | `prompts/nanobanana/golden/team_shot_best_v2b.md` |

### v2a → v2b 개선점

| 항목 | v2a | v2b | 변화 |
|------|-----|-----|------|
| QA 점수 | 92.5 | 95 | +2.5 |
| 코미 마커 | 약함 | 체크리스트 UI 명확 | 개선 |
| 코드 마커 | 약함 | 다크블루 + 회로 강화 | 개선 |
| MARKER_WEAK | 있음 | 없음 | 해결 |

### 현재 Golden Best 현황

| 버전 | 경로 | QA | 상태 |
|------|------|-----|------|
| v2a | `assets/golden/team_shot_best_v2a.png` | 92.5 | 기준컷 |
| **v2b** | `assets/golden/team_shot_best_v2b.png` | **95** | **최종 Best** |
| v3 | `assets/golden/team_shot_best_v3.png` | 92.5 | v2a와 동일 |

### 다음 단계

```
10회 검증 (validation) → 9/10 PASSED 시 → READY 선언
```

---

### 2026-01-11: Aurora5 Visual OS v1.0 (엔진-독립형 95% 유지 운영체계)

| 작업 | 상태 | 산출물 |
|------|------|--------|
| Visual OS 폴더 구조 생성 | ✅ | `.claude/visual-os/` |
| RENDER_REQUEST_TEMPLATE | ✅ | 표준 입력 양식 |
| RESULT_META_TEMPLATE | ✅ | 결과물 메타데이터 템플릿 |
| QA_GATE_RUBRIC | ✅ | 4상태 판정 + 100점 루브릭 |
| FAIL_TAGS | ✅ | 7종 실패 태그 표준 |
| REPAIR_PROMPTS | ✅ | 멀티턴 수정 프롬프트 모음 |

### Visual OS 핵심 구조

```
.claude/visual-os/
├── RENDER_REQUEST_TEMPLATE.md   ← 생성 요청 표준 양식
├── RESULT_META_TEMPLATE.md      ← 결과물 메타데이터
├── QA_GATE_RUBRIC.md            ← QA 판정 기준 (100점)
├── FAIL_TAGS.md                 ← 실패 원인 7종 태그
└── REPAIR_PROMPTS.md            ← 수정 프롬프트 모음

assets/references/style/         ← 스타일 앵커 (1장 목표)
├── miracle_watercolor_anchor.png
└── candidates/                  ← 후보 앵커 보관

assets/golden/                   ← Golden 결과 저장소
├── team_shot_candidate_*.png    ← 후보 이미지
├── team_shot_best_*.png         ← 승격된 Best
└── *_meta.md                    ← 동반 메타 파일

reports/validation/              ← 10회 검증 리포트
└── YYYY-MM-DD/{scene}_run01~10.md
```

### Visual OS 운영 루프

```
[1] Render Request (입력 표준화)
    ↓
[2] Prompt Compiler (HARD RULES 자동 주입)
    ↓
[3] 생성 (Gemini/Sora/etc)
    ↓
[4] QA Gate (PASSED/NEEDS_REVIEW/FAILED/SKIPPED)
    ↓ NEEDS_REVIEW면
[5] Repair Loop (1회 제한, 부분 수정)
    ↓
[6] Validation (10회 검증, 9/10+ 필요)
    ↓
[7] Best 승격 (이미지+meta+QA+validation 세트)
```

### FAIL 태그 7종

| 태그 | 설명 | 심각도 |
|------|------|--------|
| `CAST_MISSING` | 6명 중 누락 | CRITICAL |
| `NEW_CHARACTER` | 신규 캐릭터 생성 | CRITICAL |
| `IDENTITY_DRIFT` | 얼굴/종/의상 변형 | HIGH |
| `SEAT_DRIFT` | 좌석/배치 붕괴 | HIGH |
| `MARKER_WEAK` | 코미/코드/루미 구분 약화 | MEDIUM |
| `STYLE_DRIFT` | 수채화 스타일 붕괴 | HIGH |
| `TEXT_LOGO` | 텍스트/워터마크 | LOW |

### 핵심 원칙

```
1. SSOT: 이미지 단독 저장 금지 → 이미지+meta+QA 세트 필수
2. 점수는 참고: 단일 컷 점수는 참고용
3. 선언은 검증: 95%는 10회 중 9/10 PASSED로만 선언
4. Repair 1회 제한: 무한 루프 금지
5. 엔진 독립: Gemini/Sora 어떤 엔진이든 동일 프로세스
```

---

### 2026-01-11: NanoBanana C.C.E v2.0 + Change→Insight v2.0 통합 업그레이드

| 작업 | 상태 | 산출물 |
|------|------|--------|
| DNA Manifest 6종 | ✅ | `assets/character_dna/*_dna.v1.json` |
| QA Gate v2.1 | ✅ | PASSED/NEEDS_REVIEW/FAILED/SKIPPED 4종 + SKIPPED 규칙 |
| doc-update-actions 에이전트 | ✅ | `.claude/agents/doc-update-actions.md` |
| Golden best 3종 | ✅ | `prompts/nanobanana/golden/*_best_v1.md` |
| 10회 검증 프로토콜 연결 | ✅ | 자동 트리거 + 케이스 10종 정의 |
| 레퍼런스 요구사항 문서 | ✅ | `REFERENCE_SET_REQUIREMENTS.md` |

### v2.0 핵심 변경

```
1. QA 상태 4종: PASSED(57+) / NEEDS_REVIEW(54-56) / FAILED(≤53) / SKIPPED
2. SKIPPED ≠ PASSED (품질 오해 방지)
3. DNA Manifest로 캐릭터 시각 정보 SSOT 고정
4. 10회 검증: 레퍼런스/스타일/프롬프트 변경 시 자동 트리거
5. Golden best 승격: QA PASSED + 결과 이미지 + 리포트 연결
```

### 운영 완료 조건 (DoD)

| 조건 | 현재 | 목표 |
|------|------|------|
| 레퍼런스 세트 | 6장 | 18장 (6명×3장) |
| 스타일 앵커 | 0장 | 1장 |
| Golden PASSED | 0종 | 3종 |
| 10회 검증 통과 | 0회 | 9/10회+ |

**담당**: 레퍼런스/스타일 앵커 → 재미 (CRO) / 검증 → 루미

### 커밋 이력

```
63f1568 - feat: P0 추가 3개 완료 - Golden best 승격, SKIPPED 규칙, 10회 검증 연결
3306f6d - feat: NanoBanana C.C.E v2.0 + Change→Insight v2.0 통합 업그레이드
```

---

### 2026-01-11: Change→Insight 파이프라인 시스템

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 메인 파이프라인 문서 | ✅ | `.claude/pipelines/change-intel.md` |
| 변경 요약 에이전트 | ✅ | `.claude/agents/change-summarizer.md` |
| 영향도 매핑 에이전트 | ✅ | `.claude/agents/impact-mapper.md` |
| 나노바나나 QA 게이트 | ✅ | `.claude/agents/nanobanana-qa-gate.md` |
| 보고서 폴더 생성 | ✅ | `reports/.gitkeep` |

### Change→Insight 구조

```
.claude/pipelines/change-intel.md     ← 메인 파이프라인
.claude/agents/
├── change-summarizer.md              ← What/Why/Impact 요약
├── impact-mapper.md                  ← 영향 자산/문서 매핑
└── nanobanana-qa-gate.md             ← 캐릭터 QA 게이트
reports/                              ← 보고서 저장소
├── change-summary-YYYY-MM-DD.md
├── impact-map-YYYY-MM-DD.json
└── intel-report-YYYY-MM-DD.md
```

### 파이프라인 단계

```
[Step 1] 변경사항 수집 (git diff/log)
    ↓
[Step 2] 핵심 요약 (@change-summarizer)
    ↓
[Step 3] 영향도 매핑 (@impact-mapper)
    ↓
[Step 4] 나노바나나 QA (@nanobanana-qa-gate)
    ↓
[Step 5] 문서 자동 갱신
    ↓
[Step 6] 최종 보고서 생성
```

### 운영 원칙

```
🟢 초록불 (95%): 자동 통과 (신규 생성, 기존 영향 없음)
🟡 노란불 (4%): 리뷰 필요 (캐릭터 바이블 수정 등)
🔴 빨간불 (1%): 즉시 개입 (캐릭터 삭제, 일관성 깨짐)
```

### 커밋 이력

```
121a354 - feat: Change→Insight 파이프라인 시스템 구축
```

---

### 2026-01-11: NanoBananaSkill SSOT 시스템

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 메인 스킬 문서 생성 | ✅ | `.claude/agents/nano-banana-skill.md` |
| 캐릭터 바이블 6종 | ✅ | `brand/characters/*.md` |
| 레퍼런스 폴더 구조 | ✅ | `assets/references/characters/*/` |
| 씬 템플릿 4종 | ✅ | `prompts/nanobanana/scenes/` |
| 일관성 가드 | ✅ | `prompts/nanobanana/guards/` |
| QA 체크리스트 | ✅ | `qa/character_consistency_checklist.md` |
| 캐릭터 이미지 v3 | ✅ | 6명 개별 + 단체샷 |

### NanoBananaSkill 구조

```
.claude/agents/nano-banana-skill.md     ← 메인 스킬 정의
brand/characters/                        ← 캐릭터 바이블 (6종)
assets/references/characters/*/          ← 레퍼런스 이미지
prompts/nanobanana/
├── scenes/                              ← 씬 템플릿 (4종)
│   ├── group_shot.md
│   ├── storybook.md
│   ├── webtoon.md
│   └── video_frame.md
├── guards/                              ← 일관성 가드
│   └── consistency_guard.md
└── golden/                              ← 승인된 골든 프롬프트
qa/character_consistency_checklist.md    ← QA 60점 만점 평가
```

### 캐릭터 일관성 목표

```
🎯 KPI: 캐릭터 식별 일치율 ≥ 95%
🎯 운영: 초록불 95% + 노란불 4% + 빨간불 1%
🎯 QA: 54/60점 이상 통과 (캐릭터당 9/10점)
```

### 커밋 이력

```
04705da - feat: NanoBananaSkill 일관성 시스템 SSOT 구축 (40 files)
```

---

### 2026-01-11: Aurora 5 캐릭터 프롬프트 v3.0

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 디지털 용궁 컨셉 설계 | ✅ | 용궁/바다/별빛 테마 |
| 공통 스타일 LOCK 정의 | ✅ | 지브리 + 웹툰 스타일 |
| 6명 개별 프롬프트 작성 | ✅ | Sora 최적화 영문 프롬프트 |
| 단체샷 프롬프트 작성 | ✅ | 6명 함께 구도 |
| 후처리 가이드 작성 | ✅ | 배경 제거, 크기 조정 |

### Aurora 5 캐릭터 (디지털 용궁 에디션)

| 캐릭터 | 역할 | 메인 컬러 | 상징 |
|--------|------|----------|------|
| 푸르미르 | CEO, 인간 리더 | 로열 퍼플 + 골드 | 기적 나침반 |
| 여의보주 | 철학/영감 AI | 제이드 그린 + 진주빛 | 여의주 |
| 코미 | 운영 총괄 AI | 오션 블루 + 실버 | 클립보드 물고기 |
| 루미 | 데이터 분석 AI | 민트 틸 + 크리스탈 | 별자리 차트 |
| 재미 | 크리에이티브 AI | 코랄 핑크 + 선샤인 | 붓 물고기 |
| 코드 | 기술 실행 AI | 사이언 + 딥 네이비 | 회로 산호 |

### 커밋 이력

```
7d2b870 - docs: Aurora 5 캐릭터 프롬프트 패키지 v3.0 (디지털 용궁 에디션)
```

### 2026-01-11: assets/characters/v3 폴더 구조 생성

| 작업 | 상태 | 산출물 |
|------|------|--------|
| v3 폴더 구조 생성 | ✅ | `assets/characters/v3/` |
| .gitkeep 파일 추가 | ✅ | 5개 폴더에 추가 |

### 폴더 구조

```
assets/characters/v3/
├── individual/      ← 개별 캐릭터 1024px (6명)
│   └── .gitkeep
├── team/            ← 단체샷 1024px
│   └── .gitkeep
└── variants/
    ├── 512/         ← SNS용 리사이즈
    │   └── .gitkeep
    ├── 256/         ← 아이콘용
    │   └── .gitkeep
    └── circle/      ← 원형 크롭
        └── .gitkeep
```

### 커밋 이력

```
8f627f1 - chore: assets/characters/v3 폴더 구조 생성
```

### 2026-01-11: Wix 팀 소개 페이지 콘텐츠

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 팀원 카드 6명 작성 | ✅ | 역할, 한줄소개, 상세설명, 상징 |
| Hero/CTA 섹션 | ✅ | 메인타이틀, 버튼 문구 |
| 디자인 가이드 | ✅ | 컬러 팔레트, 폰트, 이미지 배치 |
| 복사용 전체 텍스트 | ✅ | Wix 바로 붙여넣기용 |

### 산출물

```
docs/WIX_TEAM_PAGE_CONTENT.md
├── 페이지 헤더 (Hero Section)
├── 팀원 카드 6개 (상세 버전)
├── 팀 철학 섹션
├── CTA 섹션
├── Wix 디자인 가이드 (컬러, 폰트, 레이아웃)
└── 복사용 전체 텍스트 (간소화 버전)
```

### 커밋 이력

```
defd5a7 - docs: Wix 팀 소개 페이지 콘텐츠 추가
```

---

### 2026-01-11: conversations 폴더 구조 정리

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 하위 폴더 7개 생성 | ✅ | 코미, 루미, 재미, 여의보주, 의사결정, 시스템, 기타 |
| 2026-01-01 → 2026-01 폴더명 변경 | ✅ | 월별 폴더 형식 통일 |
| 30개 파일 분류 및 이동 | ✅ | 팀원별/주제별 분류 완료 |
| 파일명 형식 통일 | ✅ | `YYYY-MM-DD_주제.md` 형식 |
| .gitignore 수정 | ✅ | conversations/ 추적 허용 |

### 새 폴더 구조

```
docs/raw/conversations/
├── 2025-12/                    (기존 유지)
└── 2026-01/
    ├── 코미/ (7개)             ← 코미, 코드활용, 마케팅자동화 관련
    ├── 루미/ (4개)             ← 루미, 캐릭터, 아우룸 관련
    ├── 재미/ (0개)             ← 재미, 디자인, 이미지 관련
    ├── 여의보주/ (0개)         ← 여의보주, 메시지, 철학 관련
    ├── 의사결정/ (5개)         ← 가격, 결제, 결정, OS, 정책 관련
    ├── 시스템/ (7개)           ← 시스템, 스토리북, 엔진, API 관련
    └── 기타/ (8개)             ← 분류 외 파일
```

### 커밋 이력

```
6e31006 - refactor(docs): conversations 폴더 구조 정리 (팀원별/주제별 분류)
```

---

### 2026-01-08: 기적지수 통합 엔진 v2.0 + 아우룸 점검

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 기적지수 통합 엔진 구현 (P0) | ✅ | `services/miracleScoreEngine.js` |
| 에너지 타입 한글 키워드 매칭 수정 | ✅ | Unicode NFC 정규화 적용 |
| 프로덕션 로그 정리 | ✅ | DEBUG_SCORE 환경변수 제어 |
| 아우룸 재배치 정책 전수 점검 (P1) | ✅ | 0개 발견, 브랜드 통일 확인 |

### 기적지수 통합 엔진 v2.0 주요 기능

| 기능 | 설명 |
|------|------|
| 결정론적 base_score | 동일 입력 → 동일 점수 (랜덤 제거) |
| 24시간 캐시 | MD5 서명 기반, 동일 입력 재계산 방지 |
| 일일 3회 제한 | 사용자당 하루 최대 3회 신규 분석 |
| 에너지 스무딩 | 최근 3회 다수결로 에너지 타입 결정 |
| confidence level | low/medium/high 신뢰도 표시 |
| 5대 점수 요인 | 현재상황, 개선의지, 환경지원, 실행가능성, 구체성 |

### 에너지 타입 (5종)

| 타입 | 이름 | 의미 | 핵심 키워드 |
|------|------|------|------------|
| ruby | 루비 | 열정과 용기 | 열정, 용기, 도전, 행동 |
| sapphire | 사파이어 | 안정과 지혜 | 안정, 지혜, 평화, 신뢰 |
| emerald | 에메랄드 | 성장과 치유 | 성장, 치유, 회복, 건강 |
| diamond | 다이아몬드 | 명확한 결단 | 결단, 목표, 성공, 합격 |
| citrine | 시트린 | 긍정과 소통 | 긍정, 소통, 대화, 이해 |

### 커밋 이력

```
8a8238f - feat(score): 기적지수 통합 엔진 v2.0 구현
70a1150 - fix(score): Unicode NFC 정규화로 한글 키워드 매칭 수정
1f6908e - chore(score): 프로덕션용 로그 정리
```

---

### 2026-01-03: P3 배치 처리 시스템 완료

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 배치 API 라우터 구현 | ✅ | `routes/batchRoutes.js` |
| 9종 배치 유형 정의 | ✅ | 소원분석, 이미지, 메시지 등 |
| 큐 기반 비동기 처리 | ✅ | 동시 실행 + 재시도 로직 |
| 배치 상태 추적 | ✅ | 6단계 상태 관리 |

### Batch API 엔드포인트

```
GET  /api/batch/types        - 배치 유형 목록
POST /api/batch/create       - 배치 생성
POST /api/batch/:id/start    - 배치 시작 (sync/async)
GET  /api/batch/:id/status   - 배치 상태 조회
POST /api/batch/run-quick    - 즉시 생성 및 실행
GET  /api/batch/stats        - 통계
POST /api/batch/:id/cancel   - 배치 취소
```

### 배치 유형 (9종)

| 유형 | 이름 | 설명 | 동시 실행 |
|------|------|------|----------|
| WISH_ANALYSIS | 소원 분석 | 대기 중인 소원 일괄 분석 | 5 |
| WISH_IMAGE | 소원그림 생성 | 소원그림 일괄 생성 | 3 |
| MESSAGE_ACK | ACK 발송 | 초동응답 메시지 일괄 발송 | 10 |
| MESSAGE_7DAY | 7일 메시지 | 7일 응원 메시지 발송 | 10 |
| MESSAGE_CAMPAIGN | 캠페인 발송 | 마케팅 캠페인 메시지 발송 | 20 |
| DAILY_REPORT | 일일 리포트 | 일일 메트릭스 리포트 생성 | 1 |
| SIGNAL_SCAN | 신호등 스캔 | 전체 소원 신호등 재판정 | 10 |
| DATA_CLEANUP | 데이터 정리 | 오래된 데이터 정리 | 1 |
| SYNC_AIRTABLE | Airtable 동기화 | Airtable 데이터 동기화 | 5 |

---

### 2026-01-03: P3 Aurora 5 서브에이전트 자동화 완료

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 에이전트 API 라우터 구현 | ✅ | `routes/agentRoutes.js` |
| 4종 에이전트 정의 | ✅ | 코미, 재미, 루미, 여의보주 |
| 12종 작업 유형 정의 | ✅ | SYNTHESIZE, RED_ALERT 등 |
| 다중 에이전트 오케스트레이션 | ✅ | Phase 1 병렬 → Phase 2 종합 |
| RED 신호 대응 API | ✅ | 재미 + 여의보주 협업 |

### Agent API 엔드포인트

```
GET  /api/agents              - 에이전트 목록
GET  /api/agents/:id          - 에이전트 상세
POST /api/agents/:id/execute  - 개별 작업 실행
POST /api/agents/orchestrate  - 다중 오케스트레이션
POST /api/agents/red-response - RED 신호 대응
GET  /api/agents/tasks/recent - 최근 작업 목록
GET  /api/agents/task-types   - 작업 유형 목록
```

### Aurora 5 에이전트 목록

| 에이전트 | 역할 | 주요 작업 |
|---------|------|----------|
| 코미 | COO | SYNTHESIZE, DECISION, ACTION_ITEMS |
| 재미 | CRO | CUSTOMER_RESPONSE, RED_ALERT, COMMUNICATION |
| 루미 | Analyst | DATA_ANALYSIS, CREATIVE_IDEA, TREND_REPORT |
| 여의보주 | QA | SAFETY_CHECK, QUALITY_REVIEW, RISK_ASSESSMENT |

---

### 2026-01-03: P3 wish-journey 파이프라인 완료

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 여정 파이프라인 API 구현 | ✅ | `routes/journeyRoutes.js` |
| 신호등 연동 로직 구현 | ✅ | RED/YELLOW/GREEN 분기 처리 |
| RED 보류 + CRO 재개 기능 | ✅ | `/api/journey/:id/resume` |
| 파이프라인 상태 추적 | ✅ | 12단계 상태 관리 |

### Journey API 엔드포인트

```
POST /api/journey/start        - 새 여정 시작
GET  /api/journey/:id          - 여정 상태 조회
POST /api/journey/:id/resume   - RED 보류 여정 재개 (CRO 승인)
GET  /api/journey/list/pending - 보류 중 목록
GET  /api/journey/stats/summary - 통계
```

### 파이프라인 단계

```
1. INTAKE (접수)
   ↓
1.5 SIGNAL_CHECK (신호등 판정)
   ↓ RED → ON_HOLD (CRO 개입 대기)
   ↓ YELLOW/GREEN → 계속
2. ANALYSIS (기적 분석)
   ↓
3. IMAGE (소원그림 생성)
   ↓
5. SEND (결과 전달)
   ↓
6. SCHEDULE (7일 메시지 예약)
   ↓
COMPLETED (완료)
```

---

### 2026-01-03: P1 Airtable 웹훅 연동 완료

| 작업 | 상태 | 산출물 |
|------|------|--------|
| Airtable Wishes Inbox 테이블 생성 | ✅ | Airtable "인입함" 테이블 (17개 필드) |
| WishRouter 자동 분류 구현 | ✅ | `routes/webhookRoutes.js` |
| 웹훅 엔드포인트 3종 | ✅ | `/webhooks/wish-form`, `/kakao`, `/web` |
| 한글 필드명 매핑 | ✅ | `services/airtableService.js` |
| 신호등 분류 개선 (anxious→yellow) | ✅ | `determineSignal()` 함수 |

### 웹훅 엔드포인트

```
POST /webhooks/wish-form  - 소원 폼 (웹사이트)
POST /webhooks/kakao      - 카카오톡 채널
POST /webhooks/web        - 웹사이트 일반
POST /webhooks/test       - 테스트용
GET  /webhooks/status     - 상태 확인
```

### WishRouter 자동 분류

| 분류 항목 | 옵션 |
|----------|------|
| 유형 | career, relationship, health, finance, education, travel, spiritual, general |
| 감정 | urgent, anxious, hopeful, neutral |
| 신호등 | red (긴급), yellow (주의), green (정상) |
| 우선순위 | P0 (RED), P1 (urgent), P2 (anxious), P3 (일반) |

---

### 2026-01-03: 토론 시스템 v3.2 + CI/CD 정상화

| 작업 | 상태 | 산출물 |
|------|------|--------|
| 토론 API DECISION/EXPLORE 모드 분기 | ✅ | `routes/debateRoutes.js` |
| EXPLORE 가드레일 2종 (Lint + Hard) | ✅ | `scripts/lint-exp-guardrail.js` |
| GitHub Actions 3종 워크플로우 정상화 | ✅ | `.github/workflows/*.yml` |
| Aurora5 DB 스키마 적용 | ✅ | `database/run-aurora5-schema.js` |
| MCP 서버 2종 신규 구축 | ✅ | `ceo-checklist-mcp`, `dashboard-mcp` |
| 토론 에이전트 5종 정의 | ✅ | `.claude/agents/debate-system/` |

### GitHub Actions 워크플로우 상태

| 워크플로우 | 상태 | 용도 |
|-----------|------|------|
| **Daily Scheduler** | ✅ 정상 | 일일 스냅샷 + 메시지 발송 |
| **Deploy Health Check** | ✅ 정상 | Render 배포 후 헬스체크 |
| **Lint Guardrails** | ✅ 정상 | EXP 파일 가드레일 검사 |

### GitHub Secrets

| Secret | 상태 |
|--------|------|
| `API_BASE_URL` | ✅ 설정됨 |
| `SCHEDULER_SECRET` | ✅ 설정됨 |

### 토론 API 엔드포인트

```
POST /api/debate/run     - 토론 실행 (DECISION/EXPLORE)
GET  /api/debate/list    - 토론 목록
GET  /api/debate/:id     - 토론 상세
GET  /api/debate/explores - EXPLORE 목록
PUT  /api/debate/actions/:id - Action 상태 변경
```

### Aurora5 DB 테이블 (Render PostgreSQL)

| 테이블 | 용도 |
|--------|------|
| `mvp_inbox` | 인입 데이터 |
| `mvp_results` | 분석 결과 + 매직링크 |
| `trials` | 7일 여정 관리 |
| `send_log` | 발송 이력 |

---

### 2026-01-01: Aurora 5 UBOS & WishMaker Hub MCP

| 작업 | 상태 | 산출물 |
|------|------|--------|
| Aurora 5 UBOS 6대 시스템 정의 | ✅ | `AURORA5_UNIVERSE_BEST_SYSTEM.md` |
| WishMaker Hub MCP 서버 구축 | ✅ | `mcp-servers/wishmaker-hub-mcp/` |
| 시스템 상태 보고서 생성 | ✅ | `SYSTEM_STATUS_REPORT.md` |
| /api/wishes 404 오류 수정 | ✅ | `services/solapiService.js` 문법 오류 해결 |

---

## 진행 중 / 다음 할 일

### P1 (완료!)

| 작업 | 담당 | 상태 |
|------|------|------|
| Airtable Wishes Inbox 테이블 생성 | 루미 | ✅ |
| WishRouter 에이전트 기본 구현 | Code | ✅ |
| 인입 채널 → Airtable 웹훅 연동 | Code | ✅ |

### P2 (완료!)

| 작업 | 담당 | 상태 |
|------|------|------|
| 신호등 시스템 (RED/YELLOW/GREEN 자동 분류) | Code | ✅ |
| Solapi 연동 (SMS + 카카오 알림톡) | Code | ✅ |
| 토론 자동화 시스템 v3.2 | Code | ✅ |
| CI/CD 파이프라인 정상화 | Code | ✅ |

### P3 (에이전틱 워크플로우 고도화) - 완료!

| 작업 | 담당 | 상태 |
|------|------|------|
| wish-journey 파이프라인 신호등 연동 | Code | ✅ |
| Aurora 5 서브에이전트 자동화 | Code | ✅ |
| 배치 처리 시스템 구현 | Code | ✅ |

---

## 핵심 결정 문서

| 문서번호 | 제목 | 상태 |
|----------|------|------|
| DEC-2026-0103-615 | 2026년 1분기 마케팅 전략 | 조건부 승인 |
| DEC-2025-1230-001 | 소원그림 문구 시스템 | 승인 |
| DEC-2025-1230-002 | 소원그림 인스타 광고 | 조건부 승인 |
| DEC-2025-1230-003 | 소원이 실시간 대응 시스템 | 승인 |

---

## 핵심 파일 위치

### 코드
```
services/miracleScoreEngine.js  - 기적지수 통합 엔진 v2.0 (결정론적 계산)
routes/batchRoutes.js           - 배치 처리 시스템 (9종 유형)
routes/agentRoutes.js           - Aurora 5 서브에이전트 자동화 API
routes/journeyRoutes.js         - 소원 여정 파이프라인 (신호등 연동)
routes/webhookRoutes.js         - 소원 인입 웹훅 (WishRouter 자동 분류)
routes/debateRoutes.js          - 토론 자동화 API v3.2
routes/wishRoutes.js            - 소원실현 API (신호등 + 기적지수)
routes/wishImageRoutes.js       - 소원그림 API (DALL-E 3 + 워터마크)
services/airtableService.js     - Airtable 연동 (Wishes Inbox 저장)
services/solapiService.js       - Solapi 연동 (SMS + 카카오 알림톡)
server.js                       - 메인 서버
database/aurora5_schema.sql     - DB 스키마
database/run-aurora5-schema.js  - 스키마 마이그레이션
```

### MCP 서버 (7종)
```
mcp-servers/miracle-mcp/        - 기적 분석 서비스
mcp-servers/summarizer-mcp/     - 요약 서비스
mcp-servers/storybook-mcp/      - 스토리북 서비스
mcp-servers/wish-image-mcp/     - 소원그림 서비스
mcp-servers/wishmaker-hub-mcp/  - 소원이 통합 관리
mcp-servers/ceo-checklist-mcp/  - CEO 일일 체크리스트 (NEW!)
mcp-servers/dashboard-mcp/      - 실시간 대시보드 (NEW!)
```

### Change→Insight 파이프라인
```
.claude/pipelines/change-intel.md         - 메인 파이프라인
.claude/agents/change-summarizer.md       - 변경 요약 에이전트
.claude/agents/impact-mapper.md           - 영향도 매핑 에이전트
.claude/agents/nanobanana-qa-gate.md      - 캐릭터 QA 게이트
reports/                                  - 보고서 저장소
```

### Visual OS v1.0 (엔진-독립형 운영체계)
```
.claude/visual-os/
├── RENDER_REQUEST_TEMPLATE.md   - 생성 요청 표준 양식
├── RESULT_META_TEMPLATE.md      - 결과물 메타데이터
├── QA_GATE_RUBRIC.md            - QA 판정 기준 (100점)
├── FAIL_TAGS.md                 - 실패 원인 7종 태그
└── REPAIR_PROMPTS.md            - 수정 프롬프트 모음
assets/references/style/         - 스타일 앵커
assets/golden/                   - Golden 결과 저장소
reports/validation/              - 10회 검증 리포트
```

### 토론 시스템
```
.claude/agents/debate-system/   - 토론 에이전트 5종
.claude/pipelines/              - 파이프라인 정의
scripts/lint-exp-guardrail.js   - EXP 가드레일 린트
docs/decisions/                 - 결정문서 (DEC-*)
docs/actions/                   - 액션아이템 (ACTIONS-*)
docs/explores/                  - 탐색문서 (EXP-*)
```

### CI/CD
```
.github/workflows/daily-scheduler.yml   - 일일 스케줄러
.github/workflows/deploy-check.yml      - 배포 헬스체크
.github/workflows/lint-guardrails.yml   - 가드레일 린트
```

### 대화 로그 (팀원별/주제별)
```
docs/raw/conversations/2026-01/
├── 코미/           - COO 대화 기록
├── 루미/           - Data Analyst 대화 기록
├── 재미/           - CRO 대화 기록
├── 여의보주/       - QA 대화 기록
├── 의사결정/       - 가격, 정책, OS 관련
├── 시스템/         - 기술 시스템 관련
└── 기타/           - 미분류 파일
```

### 캐릭터 이미지 (v3 디지털 용궁)
```
assets/characters/v3/
├── individual/     - 개별 캐릭터 1024px
├── team/           - 단체샷 1024px
└── variants/       - 리사이즈 버전 (512, 256, circle)
```

---

## 빠른 시작 가이드

### 서버 실행
```bash
cd daily-miracles-mvp
npm install
npm start
# 또는 특정 포트로
PORT=5100 node server.js
```

### 토론 실행 (DECISION 모드)
```bash
curl -X POST http://localhost:5100/api/debate/run \
  -H "Content-Type: application/json" \
  -d '{"topic":"주제","context":"배경","urgency":"medium","mode":"DECISION"}'
```

### 토론 실행 (EXPLORE 모드)
```bash
curl -X POST http://localhost:5100/api/debate/run \
  -H "Content-Type: application/json" \
  -d '{"topic":"주제","context":"배경","urgency":"low","mode":"EXPLORE"}'
```

---

## 블로커 / 주의사항

| 항목 | 상태 | 설명 |
|------|------|------|
| OpenAI API Key | ✅ | 환경변수 설정 필요 |
| DALL-E 3 Rate Limit | ⚠️ | 분당 5회 제한 주의 |
| Render 배포 | ✅ | Auto-deploy 활성화 |
| DB 스키마 | ✅ | 4개 테이블 생성 완료 |

---

## 연락처

- **기술 이슈**: Claude Code (이 창에서)
- **운영 이슈**: 코미 (COO)
- **의사결정**: 푸르미르 (CEO)

---

## 업데이트 이력

| 날짜 | 담당 | 내용 |
|------|------|------|
| 2026-01-13 | Code | P0 소원 스타터 7 (9,900원) + 24시간 업그레이드 크레딧 (테스트 4/4 통과) |
| 2026-01-12 | Code | GA4 설정 가이드 생성, 트래킹 현황 분석 (측정 ID 대기 중) |
| 2026-01-11 20:00 | Code | team_shot_best_v2b 멀티턴 편집 완료 (QA 95점, 코드/코미 마커 강화) |
| 2026-01-11 18:30 | Code | Aurora5 Visual OS v1.0 구축 (엔진-독립형 95% 유지 운영체계) |
| 2026-01-11 15:30 | Code | NanoBanana C.C.E v2.0 + Change→Insight v2.0 통합 업그레이드 |
| 2026-01-11 14:00 | Code | Change→Insight 파이프라인 시스템 구축 (변경→지식 자동화) |
| 2026-01-11 13:30 | Code | NanoBananaSkill SSOT 시스템 구축 (캐릭터 일관성 95%+ 목표) |
| 2026-01-11 13:00 | Code | Aurora 5 캐릭터 이미지 v3 완성 (6명 + 단체샷) |
| 2026-01-11 12:30 | Code | 후기 수집 구조 설계서 추가 |
| 2026-01-11 12:00 | Code | Wix 팀 소개 페이지 콘텐츠 (6명 카드, 디자인 가이드) |
| 2026-01-11 11:45 | Code | assets/characters/v3 폴더 구조 생성 (.gitkeep 포함) |
| 2026-01-11 11:15 | Code | Aurora 5 캐릭터 프롬프트 v3.0 (디지털 용궁 에디션, 6명 + 단체샷) |
| 2026-01-11 10:45 | Code | conversations 폴더 구조 정리 (팀원별/주제별 7개 폴더, 30개 파일 분류) |
| 2026-01-08 07:45 | Code | P0 완료: 기적지수 통합 엔진 v2.0, 에너지 키워드 매칭, 아우룸 점검 |
| 2026-01-03 21:20 | Code | P3 완료: 배치 처리 시스템 (9종 유형, 큐 기반 비동기 처리) |
| 2026-01-03 20:40 | Code | P3 완료: Aurora 5 서브에이전트 자동화 API |
| 2026-01-03 20:10 | Code | P3 완료: wish-journey 파이프라인 API, 신호등 연동 |
| 2026-01-03 14:56 | Code | P1 완료: Airtable 웹훅 연동, WishRouter 자동 분류 |
| 2026-01-03 11:20 | Code | 토론 시스템 v3.2, CI/CD 정상화, DB 스키마 적용 |
| 2026-01-01 00:30 | Code | Aurora 5 UBOS + WishMaker Hub MCP 서버 추가 |
| 2025-12-31 22:30 | Code | 시스템 상태 보고서, /api/wishes 404 수정 |
| 2025-12-30 07:15 | Code | 최초 생성 (P0 완료 반영) |

---

*이 문서는 새 작업 세션 시작 시 "AURORA_STATUS.md 읽어봐"로 즉시 상황 파악 가능*
