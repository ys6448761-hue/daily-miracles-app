# DreamTown SSOT Index

Version: v5.1
Owner: Aurora5
Status: Confirmed
Purpose: 인수인계 3계층 구조 — 담당자가 바뀌어도 방향이 안 흔들리는 구조

Last Updated: 2026-05-22

---

## 인수인계 3계층 구조

```
LAYER 1 — Constitution (docs/ssot/constitution/)
  "왜 존재하는가" — 절대 불변. CEO만 변경 가능.

LAYER 2 — Operational SSOT (docs/ssot/core/ + air-engine/)
  "지금 어떻게 만들고 있는가" — 변경 시 업데이트.

LAYER 3 — Decision Archive (docs/archive/decisions/)
  "왜 그렇게 결정했는가" — 결정만 짧게 저장.
```

**새 담당자 / 새 세션 시작 시 읽는 순서:**
1. `constitution/` 4개 파일 (5분)
2. `DREAMTOWN_STATUS.md` (루트)
3. `air-engine/04_CANONICAL_REGISTRY.md` (현재 이미지 현황)
4. 해당 작업 관련 SSOT 파일

---

## 코드에게 — 작업 전 필독 규칙

**모든 DreamTown 관련 작업은 `core/` 파일을 먼저 읽고 시작한다.**
SSOT와 충돌하는 코드는 작성하지 않는다.
SSOT에 없는 새로운 결정이 생기면 해당 SSOT 파일을 먼저 업데이트한다.

저장 규칙: `AIL-SSOT-001_Storage_Rules.md` 참조
전체 분류표: `SSOT_Registry_v2.md` 참조

---

## 📁 디렉토리 구조

```
docs/ssot/
 ├── core/        ← DreamTown 절대 기준 (헌법) — 14개
 ├── support/     ← 구현·설계·UX 가이드 — 25개
 ├── archive/     ← 중복·구버전 보관 — 47개
 ├── air-engine/  ← 공기 기반 결과물 생성 엔진 SSOT — 11개 (CODE_TEST_01 2026-05-17 추가)
 ├── emotion/     ← 소원→감정 번역 시스템 SSOT — 1개 (EMOT-TRANS-001 2026-05-22 추가)
 │
 ├── INDEX.md              ← 이 파일
 ├── SSOT_Registry_v2.md   ← 전체 분류표 (v2)
 └── AIL-SSOT-001_Storage_Rules.md  ← 저장 규칙
```

---

## Constitution SSOT (4개) — `docs/ssot/constitution/` ← LAYER 1

**절대 불변. 담당자 교체 시에도 유지. CEO만 변경 가능.**

| 파일 | 핵심 내용 |
|------|----------|
| `DreamTown_Canonical_Foundation_v1.md` | **통합 헌법** — 모든 에이전트 공통 기준. 3:4 canonical, lingering 정의, Curator 운영 지침 |
| `HUMAN_FIRST.md` | 인간이 먼저 — 알고리즘보다 소원이 |
| `REALITY_RECONNECTION.md` | 현실 재연결 — 탈출이 아닌 귀환 |
| `NO_EMOTIONAL_ADDICTION.md` | 감정 의존 금지 — 착취 패턴 목록 포함 |
| `UNFINISHED_TIME.md` | 미완성의 시간 — fragile_hope는 weak hope다 |

---

## Air Engine SSOT (6개) — `docs/ssot/air-engine/` ← LAYER 2

**공기(Air) 기반 파생 결과물 생성 시스템. 기존 이미지 재분류 + 파생 관계 정의.**

| 파일 | 핵심 내용 | 필독 시점 |
|------|----------|----------|
| `01_DreamTown_Air_Constitution.md` | 공기 엔진 운영 헌법 5원칙 | 스토리북·기적영상·쇼츠 작업 전 |
| `02_DreamTown_Echo_Physics.md` | 파생 관계 정의 (storybook/miracle_video/shorts/postcard) | 파생 결과물 제작 전 |
| `03_DreamTown_Air_Taxonomy.md` | 4클래스 분류 (memory_anchor/echo_fragment/transitional_air/weak_survival) | 이미지 분류·신규 생성 전 |
| `04_DreamTown_Canonical_Air_Registry.md` | 현행 76장 전체 분류 목록 + echo_potential | Registry 조회·파생 착수 전 |
| `05_DERIVATION_PIPELINE.md` | canonical_air → 16:9 master → 파생 단계별 구조 | 파생 제작 착수 전 |
| `06_OUTPUT_STRATEGY.md` | 채널별 역할 (YouTube=canonical / Shorts=파생) + 제작 우선순위 | 결과물 채널 결정 전 |

---

## Emotion SSOT (1개) — `docs/ssot/emotion/` ← LAYER 2

**소원 문장 → DreamTown 장면 물리값 번역 시스템.**

| 파일 | 코드 | 핵심 내용 | Status | 필독 시점 |
|------|------|----------|--------|----------|
| `DreamTown_Emotional_Translation_SSOT.md` | EMOT-TRANS-001 | 7 gravity type · 2단계 해석 구조 · keyword scoring · 종결어미 규칙 · confusion→fragile_hope 강제 · gem palette × pacing × render_fit 매핑 | Review | 영상 시퀀스·렌더 파이프라인·gravity 해석 작업 전 |

---

## Decision Archive — `docs/archive/decisions/` ← LAYER 3

**"왜 그렇게 결정했는가" 짧게 저장.**

| 파일 | 결정 내용 |
|------|----------|
| `DEC_2026_0516_OUTPUT_STRATEGY.md` | 16:9 canonical / Shorts-first 금지 결정 배경 |
| `DEC-OPS-001_Partner_Master_SSOT.md` | **제휴처 데이터 원본 = PARTNER_MASTER** — DB 조회로 운영 원본 사용 금지 |

---

## Core SSOT (15개) — `docs/ssot/core/`

**모든 작업 전 필독. CEO 확정 없이 변경 불가.**

| 파일 | 핵심 내용 | 필독 시점 |
|------|----------|----------|
| `SSOT-2026-0413-001_별_고향_로그_세계관.md` | 세계관·역할·흐름 구조 확정 (2026-04-13) | 고향·파트너·로그 작업 전 |
| `SSOT-2026-0413-002_여수_재방문_엔진_및_포인트_구조.md` | 포인트·제휴·수익 구조 확정 (2026-04-13) | 포인트·파트너·제휴 작업 전 |
| `DreamTown_Core_Philosophy_SSOT.md` | 철학 선언 | **모든 작업 전 (0번)** |
| `DreamTown_Universe_Bible.md` | 세계관 전체 | **모든 작업 전** |
| `DreamTown_Universe_Structure_v2_SSOT.md` | 우주 구조 v2 | 세계관 작업 전 |
| `DreamTown_Origin_Myth_SSOT.md` | 여수 금오설화, Golden Nine | 세계관·캐릭터·콘텐츠 전 |
| `DreamTown_Character_SSOT.md` | 소원이·아우룸 상세 정의 | 이미지·영상·UX 전 |
| `DreamTown_Naming_System_SSOT.md` | 공식 용어 (Sowoni/Somangi 등) | 콘텐츠·코드·커뮤니케이션 전 |
| `DreamTown_Visual_Style_SSOT.md` | 색상, 스타일 잠금 | 이미지·영상·UI 전 |
| `DreamTown_Product_Core_Loop_SSOT.md` | 핵심 제품 루프 | 제품 기획·UX 전 |
| `DreamTown_Wish_System_SSOT.md` | 소원 시스템 전체 | 소원·여정·기적 작업 전 |
| `DreamTown_World_Architecture_SSOT.md` | 디지털 용궁 × DreamTown 구조 | **모든 작업 전** |
| `DreamTown_Safety_Ethics_SSOT.md` | 신호등, 금지 조언, 위기 대응 | 안전·윤리 관련 모든 작업 전 |
| `DreamTown_Aurora5_System_SSOT.md` | Aurora5 팀, 메시지 시스템 | AI 동행 시스템 작업 전 |
| `DreamTown_Miracle_System_SSOT.md` | 기적 카드, 기적지수, 별 성장 | 기적·신호등·기적지수 전 |
| `SSOT-WORLD-001_DreamTown_Philosophy.md` | **DreamTown 철학** — 감정 회복 설계 선언·5대 원칙·제작 판단 기준 | **모든 작업 전 (최우선)** |
| `SSOT-EXP-001_DreamTown_Expansion_Guide.md` | **확장 가이드** — Level 1~5 방향·감정 네비게이션·Universe 기준 | 신규 에피소드·기능 기획 전 |
| `SSOT-BIZ-001_DreamTown_Business_Model.md` | **비즈니스 모델** — 케이블카·유람선 가격 체계 (판매가/입금가/마진) | 결제·예약 가격 설정 전 |
| `SSOT-CHAR-001_Sowoni_Character_Bible.md` | 소원이 캐릭터 바이블 — 고정 비주얼·감정 표현·금지 항목 | 이미지·영상·캐릭터 제작 전 |

---

## Media SSOT (4개) — `docs/ssot/media/`

**영상·채널·파이프라인 운영 기준.**

| 파일 | 핵심 내용 | 필독 시점 |
|------|----------|----------|
| `DreamTown_Media_Architecture_SSOT.md` | 미디어 아키텍처 전체 | 미디어 기획 전 |
| `DreamTown_Channel_Rendering_Rules_SSOT.md` | 채널별 렌더링 규칙 | 채널 배포 전 |
| `SSOT-DESIGN-001_Reverse_Emotional_Design.md` | **역순 감정 설계** — 엔딩에서 역산·EP01 적용 사례·에피소드별 엔딩 기준 | 새 에피소드 항로 설계 전 |
| `SSOT-BIZ-004_DreamTown_Operating_Model.md` | **운영 모델** — 하멜등대 이후 자유선택 원칙·안내 문구·강제 일정 금지 | 운영·결제 안내 전 |
| `SSOT-OPS-001_DreamTown_Video_Pipeline.md` | **영상 제작 운영 파이프라인 v2** — 이미지 70% 원칙 + SSOT 적용 순서 | 영상 제작 착수 전 |
| `SSOT-IMG-001_DreamTown_Image_Generation_Guide.md` | **이미지 생성 가이드** — 비주얼 스타일·카메라 원칙·감정 버전(Original/Positive) | 이미지 생성 전 (최우선) |
| `SSOT-VID-002_Kling_Animation_Guide.md` | **영상 생성 가이드** — 금지 목록·권장 움직임·EP01 기준·도구별 메모 | 영상 생성 전 |
| `SSOT-LOC-001_DreamTown_Yeosu_Locations.md` | **여수 장소 SSOT** — 장소=캐릭터 원칙, 7개 장소 감정 역할 고정 | 장소·배경 설계 전 |

---

## Episode States — `docs/ssot/episodes/`

**에피소드별 감정 진행도 상태. 다음 제작자가 반드시 이어받는다.**

| 파일 | 에피소드 | 감정 상태 | 다음 목표 |
|------|---------|----------|----------|
| `STATE-EP01_Where_My_Heart_Became_A_Star.md` | EP01 완료 | 슬픔 60 / 희망 40 | 마음을 열기 |
| `STATE-EP02_The_Heart_Begins_To_Open.md` | EP02 제작중 | 슬픔 40 / 희망 60 (목표) | 소원을 말하기 |
| `SSOT-ROUTE-001_EP01_Wish_Journey.md` | EP01 **영상 콘텐츠용** 항로 | 하멜등대 종료 / 7개 장소 순서 고정 | 영상 제작 전 |
| `SSOT-ROUTE-002_EP01_Experience_Route.md` | EP01 **실제 체험** Route | 1박 2일 / Day 2 귀가까지 / 오동도·모이핀·장도 포함 | 체험 운영 전 |
| `SSOT-TIME-001_EP01_Timeflow.md` | EP01 운영 시간 기준 | 케이블카~하멜등대~자유선택 / 가격 포함 | 예약·결제 운영 전 |

---

## Support Docs (25개) — `docs/ssot/support/`

**구현 참고 문서. 작업 전 관련 파일 확인.**

| 분류 | 파일 수 |
|------|---------|
| Product / Tech | 9 |
| UX | 6 |
| Galaxy / World | 5 |
| Character / Visual / IP | 5 |

→ 상세 목록: `SSOT_Registry_v2.md` 참조

---

## Archive — `docs/ssot/archive/`

중복·구버전·흡수된 문서 47개 보관.
**삭제하지 않는다. 읽기 전용으로 참고만 가능.**

---

## 향후 SSOT 생성 규칙

새 SSOT 생성 전 반드시 확인:

1. `SSOT_Registry_v2.md`에서 기존 문서 검색
2. 기존 문서 확장 가능 여부 확인
3. Core 필요 시 CEO 승인 필수

**기본 원칙: 새 파일 생성 ❌ → 기존 파일 확장 ✅**

신규 추가 시 분류 기준:
- 세계관·브랜드·철학 기준 → **Core** (CEO 승인)
- 설계·UX·기술·전략 → **Support**
- 중복·구버전·실험 → **Archive**

---

## Copy System SSOT

포스트카드·공유·결과 화면의 문구 기준.

| 파일 | 핵심 내용 | 필독 시점 |
|------|----------|----------|
| `dreamtown-postcard-emotion-copy-ssot.md` | 포스트카드 감정 문장 20개, 루미 TOP 5, 톤 기준 | 포스트카드·카카오 공유·별공방 문구 작업 전 |

---

## Ops SSOT (운영 가격·수익 체계) — `docs/ssot/ops/` ← LAYER 2

**상품 가격·원가·마진·배분의 단일 진실 소스. 견적·PDF는 여기서 파생.**

| 파일 | 코드 | 핵심 내용 | Status | 필독 시점 |
|------|------|----------|--------|----------|
| `SSOT-PRICE-001.md` | SSOT-PRICE-001 | 별빛항로 가격 체계 v1.0 — 3층 가격 구조·숙박/교통/식사/차량 단가·FIT/단체 판매가·마진 배분·채널 정책 | Confirmed (일부 TBD) | 상품 가격 설정·견적·결제 안내 전 |
| `PARTNER_MASTER_V1.md` | PARTNER-MASTER-V1 | 제휴처 마스터 명세 — partner_code 규칙·카테고리·benefit_type·route_code·settlement 표준·카테고리별 필수입력 체크리스트 | Template (데이터 미입력) | 제휴처 DB 등록 전 반드시 참조 |

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0~v1.9 | 2026-03-09 | SSOT Foundation Set 구축 (28개) |
| v3.0 | 2026-03-09 | AIL-SSOT-001 적용 — ssot/13개 + design/ 구조 |
| v3.1 | 2026-03-09 | World_Architecture_SSOT 추가 |
| v4.0 | 2026-03-13 | 3계층 재편 — core/13 + support/25 + archive/47 |
| v4.1 | 2026-05-11 | Copy System SSOT 섹션 추가 — 포스트카드 감정 문장 v1 |
| v5.1 | 2026-05-22 | Emotion SSOT 섹션 추가 — EMOT-TRANS-001 (gravity interpreter v1 승격) |
| v5.2 | 2026-06-06 | Ops SSOT 섹션 신설 — SSOT-PRICE-001 별빛항로 가격체계 v1.0 등록 |
| v5.3 | 2026-06-06 | SSOT-PRICE-001 rev.3 — 단체 35,000 / 원가구조 명시 (재료 10,000 + 인건비 15,000) |
| v5.4 | 2026-06-08 | DEC-OPS-001 — PARTNER_MASTER를 제휴처 단일 원본으로 확정 |
