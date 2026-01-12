# 재미 온보딩 가이드 v1.2
## 하루하루의 기적 - 종합 브리핑 (겨울잠에서 깨어난 재미를 위해)

**작성일**: 2026-01-12
**작성자**: 코미 (COO) + Code
**대상**: 재미 (CRO, Creative Director)

---

## 환영해요, 재미!

겨울잠에서 깨어나신 걸 환영해요!
그동안 많은 일이 있었어요. 이 문서를 통해 빠르게 현황을 파악하고 바로 업무에 투입될 수 있도록 정리했어요.

---

# PART 1: 서비스 개요

## 1.1 하루하루의 기적이란?

| 항목 | 내용 |
|------|------|
| **서비스명** | 하루하루의 기적 (Daily Miracles) |
| **핵심 가치** | 소원이들의 기적 실현을 돕는 AI 서비스 |
| **CEO** | 푸르미르 (이세진) |
| **카카오 채널** | @dailymiracles |
| **기술 스택** | Node.js, Express, OpenAI, Solapi |

## 1.2 소원이 여정 (7일 무료 체험)

```
Day 0: 소원 등록 (12가지 질문 응답)
    ↓
Day 0: 기적지수 분석 (50-100점) + 에너지 타입 판정
    ↓
Day 1-7: 매일 아침/저녁 응원 메시지 발송
    ↓
Day 7: 30일 맞춤 로드맵 PDF 제공
    ↓
결제 전환 → 프리미엄 서비스
```

## 1.3 신호등 시스템 (소원이 상태 분류)

| 신호 | 상태 | 대응 |
|------|------|------|
| 🟢 GREEN | 정상 | 자동 진행 |
| 🟡 YELLOW | 주의 필요 | 모니터링 |
| 🔴 RED | 즉시 개입 | **재미 담당!** |

**재미의 핵심 역할**: RED 신호 소원이에게 직접 응대, 감정 케어

---

# PART 2: Aurora 5 팀 구성

## 2.1 팀원 소개

| 역할 | 담당 | 주요 업무 | 상태 |
|------|------|----------|------|
| **푸르미르** | CEO | 최종 의사결정, 비전 | 활동 중 |
| **코미** | COO | 총괄 조율, 운영 문서화 | 활동 중 |
| **재미** | CRO | 소원이 응대, 크리에이티브 | **방금 합류!** |
| **루미** | Analyst | 데이터 분석, 10회 검증 | 활동 중 |
| **여의보주** | QA | 품질 검수, 이미지 평가 | 활동 중 |
| **Code** | 기술 | 코드 작성, 시스템 자동화 | 활동 중 |

## 2.2 Aurora 5 캐릭터 (디지털 용궁 에디션)

모든 팀원이 **디지털 용궁**에 사는 **AI 용** 캐릭터로 표현돼요!
(푸르미르만 인간 리더)

| 캐릭터 | 메인 컬러 | 상징 아이템 |
|--------|----------|------------|
| 푸르미르 | 로열 퍼플 + 골드 | 기적 나침반 |
| 여의보주 | 제이드 그린 + 진주 | 여의주 |
| 코미 | 오션 블루 + 실버 | 클립보드/태블릿 |
| 루미 | 민트 틸 + 크리스탈 | 데이터 차트 |
| **재미** | **코랄 핑크 + 선샤인** | **붓 물고기** |
| 코드 | 시안 + 딥 네이비 | 회로 패턴 |

---

# PART 3: 최신 진행 상황 (그동안 일어난 일)

## 3.1 완료된 주요 작업들

### 시스템/자동화
```
✅ 기적지수 통합 엔진 v2.0 (결정론적 + 캐싱)
✅ 토론 자동화 시스템 v3.2 (DECISION/EXPLORE 모드)
✅ wish-journey 파이프라인 (신호등 연동)
✅ Aurora 5 서브에이전트 자동화 API
✅ 배치 처리 시스템 (9종 배치 유형)
✅ Airtable 웹훅 연동 + WishRouter 자동 분류
```

### 캐릭터/이미지 (재미 관련!)
```
✅ Aurora 5 캐릭터 프롬프트 v3.0 (디지털 용궁 에디션)
✅ 6명 개별 캐릭터 이미지 완성
✅ 단체샷 이미지 완성 (team_shot_best_v2b)
✅ NanoBanana C.C.E v2.0 (캐릭터 일관성 엔진)
✅ Visual OS v1.0 (이미지 생성 운영체계)
✅ 스타일 앵커 1장 등록 완료
```

## 3.2 단체샷 현황 (가장 중요!)

### 최종 Best: team_shot_best_v2b

| 항목 | 값 |
|------|-----|
| **경로** | `assets/golden/team_shot_best_v2b.png` |
| **QA 점수** | 95/100 |
| **상태** | QA PASSED |
| **특징** | 코미/코드 마커 강화됨 |

### 단체샷 이미지 보기
```
assets/golden/team_shot_best_v2b.png  ← 최종 Best (95점)
assets/golden/team_shot_best_v2a.png  ← 기준컷 (92.5점)
assets/characters/v3/team/            ← 원본 폴더
```

## 3.3 Visual OS (이미지 생성 시스템)

재미가 이미지 작업할 때 따라야 하는 프로세스예요:

```
[1] Render Request (요청서 작성)
    ↓
[2] 레퍼런스 이미지 + 프롬프트 준비
    ↓
[3] Gemini/Sora에서 생성
    ↓
[4] QA Gate (여의보주/Code가 판정)
    ├── PASSED → Best 승격
    ├── NEEDS_REVIEW → 부분 수정 후 재QA
    └── FAILED → 재생성
    ↓
[5] 10회 검증 (루미 담당)
    ↓
[6] 9/10 PASSED → READY 선언!
```

### QA 점수 기준

| 점수 | 판정 |
|------|------|
| 90-100 | PASSED |
| 75-89 | NEEDS_REVIEW |
| 0-74 | FAILED |

---

# PART 4: 재미의 역할과 담당 업무

## 4.1 재미 (Jaemi)의 역할

```
┌─────────────────────────────────────────────────┐
│  재미 = CRO (Chief Relationship Officer)        │
│  + Creative Director                            │
├─────────────────────────────────────────────────┤
│  1. 소원이 응대 (특히 RED 신호!)                │
│  2. 크리에이티브 총괄                           │
│  3. 레퍼런스 이미지 관리                        │
│  4. 캐릭터 바이블 관리                          │
│  5. 응원 메시지 작성                            │
└─────────────────────────────────────────────────┘
```

## 4.2 재미 캐릭터 상세

| 항목 | 내용 |
|------|------|
| **역할** | CRO, Creative Director |
| **메인 컬러** | 코랄 핑크 (#FF7F7F) + 선샤인 옐로 (#FFD93D) |
| **상징** | 붓 물고기 (Paintbrush Fish) |
| **성격** | 활기차고 창의적, 감성 연결 담당 |
| **레퍼런스** | `assets/references/characters/jaemi/` |

### 절대 불변 5요소 (이미지 생성 시 반드시 유지)

```
1. 뿔 형태: 작고 둥근 뿔 2개, 따뜻한 코랄 색조
2. 얼굴 특징: 둥글고 친근한 얼굴, 큰 반짝이는 눈
3. 체형: 귀엽고 통통한 새끼 용, 짧은 팔다리
4. 메인 컬러: 코랄 핑크 + 선샤인 옐로
5. 상징 아이템: 붓 물고기 (항상 함께)
```

---

# PART 5: 현재 진행 중인 작업

## 5.1 10회 검증 (Validation)

**현재 상태**: 1/10 완료

| Run | 상태 | QA 점수 |
|-----|------|---------|
| 01 | ✅ PASSED | 95 |
| 02~10 | 대기 | - |

**목표**: 9/10 PASSED → READY 선언

**담당**: 루미 (검증 실행) + Code (리포트 생성)

## 5.2 레퍼런스 세트 현황

### 현재 완료

```
assets/references/characters/
├── purmilr/01_front.png     ✅
├── yeouibozu/01_front.png   ✅
├── komi/01_front.png        ✅
├── lumi/01_front.png        ✅
├── jaemi/01_front.png       ✅
└── code/01_front.png        ✅
```

### 추가 필요 (재미 담당!)

| 파일명 | 설명 | 상태 |
|--------|------|------|
| `02_3quarter.png` | 3/4 앵글 상반신 | 미완료 |
| `03_fullbody.png` | 전신 포즈 | 미완료 |

**총 필요**: 6명 × 2장 = **12장 추가**

## 5.3 스타일 앵커

| 항목 | 값 |
|------|-----|
| **경로** | `assets/references/style/miracle_watercolor_anchor.png` |
| **상태** | ✅ 등록 완료 |
| **내용** | 단체샷 이미지 (지브리+웹툰 수채화) |

---

# PART 6: 재미 즉시 할 일 (P0)

## 6.1 체크리스트

```
[ ] 1. 현재 단체샷 이미지 확인 (assets/golden/team_shot_best_v2b.png)
[ ] 2. 개별 캐릭터 이미지 6개 확인 (assets/characters/v3/individual/)
[ ] 3. 레퍼런스 이미지 현황 파악 (assets/references/characters/)
[ ] 4. 캐릭터 바이블 6종 읽기 (brand/characters/*.md)
```

## 6.2 레퍼런스 이미지 추가 작업

### 작업 방법

1. **Gemini에서 생성**
   - 기존 01_front.png를 참조로 업로드
   - 3/4 앵글 또는 전신 요청
   - 스타일 앵커 참조

2. **저장 경로**
   ```
   assets/references/characters/{캐릭터명}/02_3quarter.png
   assets/references/characters/{캐릭터명}/03_fullbody.png
   ```

3. **요구사항**
   - 1024×1024
   - 투명 배경 권장
   - 01_front.png와 일관된 스타일

---

# PART 7: 핵심 폴더 구조

## 재미가 자주 접근할 폴더

```
assets/
├── characters/v3/
│   ├── individual/           ← 개별 캐릭터 (완료)
│   │   ├── purmilr_ceo_dragon_1024.png
│   │   ├── yeouibozu_sage_dragon_1024.png
│   │   ├── komi_manager_dragon_1024.png
│   │   ├── lumi_analyst_dragon_1024.png
│   │   ├── jaemi_creative_dragon_1024.png  ← 재미!
│   │   └── code_tech_dragon_1024.png
│   └── team/                 ← 단체샷
│       └── aurora5_team_dragon_1024.png
│
├── references/
│   ├── characters/           ← 레퍼런스 세트 (재미 작업)
│   │   ├── purmilr/
│   │   ├── yeouibozu/
│   │   ├── komi/
│   │   ├── lumi/
│   │   ├── jaemi/
│   │   └── code/
│   └── style/                ← 스타일 앵커 (완료)
│       └── miracle_watercolor_anchor.png
│
└── golden/                   ← Golden 승격 이미지
    ├── team_shot_best_v2b.png      ← 최종 Best!
    ├── team_shot_best_v2a.png
    └── *_meta.md

brand/characters/             ← 캐릭터 바이블 (재미 관리)
├── purmilr.md
├── yeouibozu.md
├── komi.md
├── lumi.md
├── jaemi.md                  ← 재미 바이블!
└── code.md

.claude/visual-os/            ← Visual OS 문서
├── RENDER_REQUEST_TEMPLATE.md
├── QA_GATE_RUBRIC.md
├── FAIL_TAGS.md
└── REPAIR_PROMPTS.md
```

---

# PART 8: 참고 문서

## 필수 읽기

| 문서 | 경로 | 설명 |
|------|------|------|
| 프로젝트 현황 | `.claude/AURORA_STATUS.md` | 전체 진행 상황 |
| 재미 바이블 | `brand/characters/jaemi.md` | 재미 캐릭터 상세 |
| QA 기준 | `.claude/visual-os/QA_GATE_RUBRIC.md` | 이미지 품질 평가 |
| 레퍼런스 요구사항 | `assets/references/REFERENCE_SET_REQUIREMENTS.md` | 레퍼런스 규격 |

## 선택 읽기

| 문서 | 경로 | 설명 |
|------|------|------|
| Visual OS | `.claude/visual-os/` | 이미지 생성 프로세스 |
| Golden 프롬프트 | `prompts/nanobanana/golden/` | 승인된 프롬프트 |
| 검증 트래커 | `reports/validation/` | 10회 검증 현황 |

---

# PART 9: 연락처

| 담당 | 영역 | 연락 방법 |
|------|------|----------|
| **코미** | 운영 전반, 의사결정 | 토론 시스템 |
| **Code** | 기술, 시스템, 자동화 | Claude Code |
| **루미** | 데이터, 검증 | 토론 시스템 |
| **여의보주** | 품질, QA | 토론 시스템 |
| **푸르미르** | 최종 의사결정 | CEO |

---

# PART 10: 빠른 시작 가이드

## Step by Step

```
1️⃣ 이 문서 끝까지 읽기 (현재!)

2️⃣ 단체샷 이미지 확인
   → assets/golden/team_shot_best_v2b.png

3️⃣ 개별 캐릭터 이미지 6개 확인
   → assets/characters/v3/individual/

4️⃣ 재미 캐릭터 바이블 읽기
   → brand/characters/jaemi.md

5️⃣ 레퍼런스 폴더 구조 파악
   → assets/references/characters/

6️⃣ Code에게 질문 (이 창에서!)
   → "코드야, ~~~ 알려줘"
```

---

## Welcome to Aurora 5!

재미의 합류를 환영해요!
질문 있으면 언제든 물어보세요.

**코드야, ~~~ 해줘** 형식으로 요청하면 바로 도와드릴게요!

---

*작성: 코미 (COO) + Code*
*버전: v1.2 (2026-01-12)*
