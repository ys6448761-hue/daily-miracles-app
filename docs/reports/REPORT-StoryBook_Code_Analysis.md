---
Document: REPORT-StoryBook_Code_Analysis
Purpose: DreamTown Core Story Engine 설계를 위해 기존 StoryBook/영상 관련 코드를 분석하고 재사용 가능 요소를 추출
Date: 2026-07-09
Owner: Claude Code (분석), Aurora5 (검토 대상)
Compared Against: 소원그림 GPTS V4 (본 지시서에 인라인으로 제공된 기준 — 별도 SSOT 파일은 저장소에서 확인되지 않음)
---

# REPORT — StoryBook Code Analysis

## 0. 요약 (Executive Summary)

같은 "스토리북"이라는 이름 아래, **서로 완전히 분리되고 연결되지 않은 시스템 3~4개**가 이미 존재한다.

1. **E2E Commerce 파이프라인** (`routes/storybookRoutes.js` 1~1820행 + `services/storybookQueue.js` 전체) — 결제 → 큐 → 생성 → 배송까지 오케스트레이션 구조는 완성되어 있으나, **실제 생성 로직(`storybookGenerator.js`)이 파일 자체가 존재하지 않아 항상 mock으로 대체**된다.
2. **DreamTown 포스트카드→스토리북 파이프라인** (`routes/storybookRoutes.js` 1822~2098행) — 이미 생성된 이미지들을 슬라이드로 배열만 하는 단순하지만 실제로 작동하는 기능.
3. **storybook-mcp (Python MCP 서버, 12개 도구)** — 실제 생성은 하지 않고 프롬프트 텍스트만 만들어주는 템플릿 팩토리.
4. **`dreamtown-wishart`의 `image_generator.py` + `prompt_builder.py`** — 별도 저장소에 있는, 감정→장소→보석 매핑과 Identity Lock을 갖춘 **가장 정교하고 실제로 작동하는 엔진**. 그러나 `daily-miracles-mvp`의 어떤 코드에서도 호출되지 않는다(연결 안 됨).

**핵심 발견**: DreamTown_Core_Story_Engine이 필요로 하는 "1P 발견 / 2P 응답 / 3P 기록" 4-Act 구조, Reveal Rule(별씨앗·별공방은 3P 이전 등장 금지), Identity Lock은 **이미 `dreamtown-wishart`에 상당 부분 구현되어 있다.** 새로 만드는 것이 아니라 이 엔진을 중심축으로 삼아 통합하는 것이 맞는 방향이다.

---

## 1. 현재 StoryBook 코드 구조

```
daily-miracles-mvp/
├── routes/storybookRoutes.js       (2098줄)
│   ├── System A: E2E Commerce (1~1820행)     — 결제→큐→배송, 생성 로직 없음(오케스트레이션만)
│   └── System B: 포스트카드→스토리북 (1822~2098행) — 실제 동작, 이미지 배열만
├── services/storybookQueue.js      (1206줄)  — Job Queue, 생성/게이트/배송 전 단계 mock
├── mcp-servers/storybook-mcp/
│   └── src/storybook/{server.py, tools.py}   — 12개 프롬프트 생성 도구 (실제 생성 없음)
├── database/storybook_schema.sql + migrations 162,166-170  — Story Data 스키마 2벌 중복
└── scripts/assemble-miracle-video.js (754줄) — 위시텍스트→중력(감정)분류→5프레임 프리뷰(HTML만, 영상 아님)

dreamtown-wishart/ (별도 저장소)
├── prompt_builder.py   — 4-Act 구조, Reveal Rule, Identity Lock, Kling 모션 프롬프트
├── image_generator.py  — gpt-image-2 실제 호출(사진을 레퍼런스로 edit), PNG 저장
├── wish_engine.py       — 위시텍스트→5개 Canon 감정 분류
└── location_mapper.py   — 감정→장소→보석 매핑 테이블
```

---

## 2. 입력값 (질문 1)

| 시스템 | 입력값 |
|---|---|
| E2E Commerce (`storybookRoutes.js` System A) | 결제 웹훅 데이터만: `tier, amount, customer_email/phone, order_id, wish_id`. **사진·이름·소원 텍스트는 이 파이프라인에서 직접 다루지 않는다** — 어딘가 다른 곳에 이미 있다고 가정하고 배송 단계에서나 참조됨. |
| System B (포스트카드→스토리북) | `stars: [{location, emotion, image_url}]` 배열 (이미 생성된 이미지 URL만, 사진/텍스트 생성 없음) |
| storybook-mcp 12개 도구 | `name, age, personality, hobby, dreamJob, favoriteColor, favoriteAnimal, specialMemory?, style, page_count(6/8/10/12), photo_url?` |
| `dreamtown-wishart` (가장 완전한 입력 구조) | **사진 파일 경로(정체성 소스)**, `wish`(원문 텍스트 — variation seed로만 사용, 프롬프트에 직접 삽입 안 됨), `emotion`(생략 시 자동 분류), `location`(생략 가능), `profile`(인원수, 관계, 표정 상태, **사전 품질 게이트용 photo_flags**) |
| `assemble-miracle-video.js` | 위시 텍스트만 (CLI `--wish`), 사진 없음, DB조회 없음 |

**결론**: "사용자 사진 + 소원 + 감정(선택) + 장소(선택)"을 실제로 온전히 받아 처리하는 곳은 `dreamtown-wishart` 하나뿐이다.

---

## 3. 생성 단계 (질문 2) — 코드 기준 실제 플로우

### 3-A. `dreamtown-wishart` (가장 완성도 높은 플로우)
```
사진 업로드
  ↓
precheck_photo() — 하드 게이트 (얼굴 너무 작음/역광/가림/저해상도 등이면 즉시 PHOTO_REJECT)
  ↓
감정 분류 (emotion 없으면 wish_engine.classify(wish))
  ↓
create_scene_lock() — 감정→wish_type/장소/보석 확정, variation(시간/구름/바다/꽃) 위시텍스트 시드로 결정, Act 전체에 고정 적용
  ↓
Act별 프롬프트 조립 (1P/2P/3P/4P, 아래 §5 참조)
  ↓
Kling 모션 프롬프트 (컷별, 영상 파생용)
  ↓
QC 게이트: validate_pair_prompts + check_reveal_rule(별/별씨앗/별공방은 3P에서만) + 9문항 평가
  ↓
client.images.edit(gpt-image-2, image=사진, prompt=조립된 텍스트) → PNG 저장 + 프롬프트 로그
```

### 3-B. System B (포스트카드→스토리북, 실제 동작)
```
별/포스트카드 배열 입력
  ↓
LOCATION_ORDER로 정렬 (cablecar→cafe→hamel→stay)
  ↓
첫감정/끝감정 추출 → EMOTION_FLOW_TEXT 표에서 고정 문구 조회 (LLM 호출 없음)
  ↓
메인 스타 이미지 선택 (hamel > stay > 마지막)
  ↓
카드 개수(2~3장 vs 4장+)로 "compact/full" 템플릿 분기
  ↓
슬라이드 배열 조립 (이미지+텍스트 슬라이드 교차)
  ↓
Postgres 저장 (storybooks, storybook_items)
```

### 3-C. E2E Commerce (오케스트레이션은 있으나 생성 없음)
```
결제 웹훅 → 주문 생성 → 큐 등록 → [생성 단계 = mock] → 예산체크 → [윤리게이트 = 항상 PASS] → 저장 → [배송 = mock 이메일] → 완료
```
실제 콘텐츠가 생성되는 지점이 하나도 없다 — 전체가 스켈레톤.

---

## 4. 주요 파일별 역할

| 파일 | 역할 | 완성도 |
|---|---|---|
| `routes/storybookRoutes.js` (1~1820행) | 결제/주문/배송 오케스트레이션 | 배관은 완성, 콘텐츠 생성 없음 |
| `routes/storybookRoutes.js` (1822~2098행) | 이미지 배열 → 슬라이드 조립 | **실제 동작** (단, 생성 아님) |
| `services/storybookQueue.js` | Job Queue, 재시도, 예산캡, RED 알림 | 오케스트레이션 완성, 생성/윤리/배송 mock |
| `mcp-servers/storybook-mcp/*` | 프롬프트 템플릿 12종 | 프롬프트 팩토리, 생성 없음 |
| `dreamtown-wishart/prompt_builder.py` | 4-Act 구조, Reveal Rule, Identity Lock, QC | **가장 정교, 실제 사용 가능한 로직 다수** |
| `dreamtown-wishart/image_generator.py` | gpt-image-2 실제 호출 | **실제 동작** |
| `scripts/assemble-miracle-video.js` | 위시→감정(중력)분류→5프레임 프리뷰 | HTML 프리뷰만, 영상 렌더링 없음 |

---

## 5. 재사용 가능 엔진 요소 (질문 3)

### ✅ 재사용 가능 (그대로 또는 거의 그대로)
- **`dreamtown-wishart`의 4-Act 구조** (`ssot_visual.py`): 1P 발견(정면, world_response 10%, 별 OFF) / 2P 응답(측면, 60%, 별 OFF) / 3P 기록(후면, 100%, 별/별씨앗/별공방 첫 등장) / 4P 참여(브랜드/CTA, 주인공 없음) — **V4 기획의 1P/2P/3P 구조 및 "3P 이전 별 등장 금지" 규칙과 거의 정확히 일치.**
- **`check_reveal_rule()`** — 토큰 스캔으로 별/별씨앗/별공방이 1P·2P 프롬프트에 없는지 자동 검증하는 코드 — Reveal Rule을 코드 레벨에서 강제하는 유일한 장치.
- **`IDENTITY_MANDATORY` / `AGE_MANDATORY` 블록** — 85~95% 정체성 보존, 원본 얼굴형 유지, 나이 역행(어려보이게) 금지 — **Identity Lock 원칙과 직접 일치.**
- **`judge_release()`의 Q9 (미래 예언 여부 체크)** — **"미래 예언 금지" 원칙과 직접 일치**, 코드로 이미 게이트되어 있음.
- **감정→장소→보석 매핑 테이블** (`WISH_ENGINE`, `LOCATION_MAP`, `EMOTION_ALIASES`) — 5개 Canon 감정, 15개 이상의 별칭까지 커버하는 재사용 가능한 매핑 모듈.
- **`CUT_CONSISTENCY_PIPELINE`** — cut1을 이미지 레퍼런스로 cut2/3을 생성하는 방식(이미지-투-이미지) — 세션 전체의 캐릭터/구도 일관성 유지 메커니즘, 그대로 재사용 가능.
- **`assemble-miracle-video.js`의 `interpretGravity()` + `buildSequence()`** — 별도 모듈로 export되어 있어 재사용 가능한 위시→감정→시퀀스 로직(단, 아래 "수정 필요" 참조).

### 🔧 수정 후 사용 가능
- **`assemble-miracle-video.js`의 감정(중력) 분류·시퀀스 로직** — `dreamtown-wishart`와 taxonomy가 다르다(7개 중력 유형 vs 5개 Canon 감정). 하나로 통합 필요.
- **System B의 슬라이드 조립 로직(`buildStorybook`)** — 페이지 분할 방식(카드 개수 기반) 자체는 참고할 만하나, V4의 1P/2P/3P/4P 구조로 대체되어야 함.
- **storybook-mcp의 `extract_character`/`maintain_consistency` 프롬프트 문구** — Identity Lock 문구 설계 참고자료로는 유용하나, 텍스트 설명 기반 방식은 `dreamtown-wishart`의 이미지 레퍼런스 방식보다 약함 → 문구만 참고하고 메커니즘은 폐기.

### ❌ 폐기 대상
- **`services/storybookGenerator.js` 호출부** — 파일 자체가 없고, mock으로만 동작하는 E2E Commerce의 생성 단계 전체. 새 엔진으로 교체.
- **`mockGenerateAssets`, `executeRegenImage/EditText/RewriteDoc`** — 전부 가짜 URL 반환 함수. 실사용 불가.
- **중복된 스키마 정의** (`storybook_schema.sql` vs `storybookRoutes.js:1622-1732` 인라인) — 하나로 통합 필요.

---

## 6. 문제점 (기존 코드의 구체적 결함)

1. `services/storybookGenerator.js`가 존재하지 않아 **결제한 고객이 실제로는 가짜 자산을 받는다.**
2. `runEthicsGate()`가 항상 PASS만 반환 — 콘텐츠 안전 검증이 실질적으로 없다.
3. 리비전(재생성) 기능 3종이 전부 mock — 크레딧을 써도 가짜 결과물.
4. `emailService.sendStorybookDelivery`/`sendRevisionComplete`가 실제로 export되지 않아 배송 알림이 항상 mock 로그로 대체.
5. `storybook_shares` 테이블에 마이그레이션 파일이 없어, 공유 링크 기능이 배포 환경에 따라 무음 실패할 수 있음.
6. Job/Revision 큐가 메모리 배열이라 서버 재시작 시 진행 중이던 작업이 전부 유실됨(문서상 "유실 0" 목표와 불일치).
7. `storybookQueue.js`와 `storybookRoutes.js`가 각자 별도의 메모리 스토어를 써서, DB 없는 모드에서는 큐가 주문을 아예 찾지 못하는 구조적 결함이 있음.
8. **가장 정교한 엔진(`dreamtown-wishart`)이 `daily-miracles-mvp`의 어떤 경로에서도 호출되지 않는다** — 두 저장소가 개념적으로만 연결되어 있고 코드로는 연결되어 있지 않음.

---

## 7. 소원그림 GPTS V4와의 충돌 여부 (질문 4)

> 비교 기준은 이번 지시서에 인라인으로 제공된 V4 원칙을 사용했다. 별도의 V4 SSOT 파일은 저장소에서 검색되지 않았다(자료 없음).

| V4 원칙 | 해당 코드 | 판정 |
|---|---|---|
| 1P 발견 / 2P 응답 / 3P 기록 | `dreamtown-wishart` 4-Act 구조 | ✅ **일치** (4P 참여까지 이미 구현) |
| 별씨앗/별공방은 3P 이전 등장 금지 | `check_reveal_rule()` | ✅ **일치** (코드로 강제됨) |
| Identity Lock 우선 | `IDENTITY_MANDATORY`, 이미지-투-이미지 파이프라인 | ✅ **일치** |
| 정체성 > 감정 > 희망 > 미화 | `AGE_MANDATORY`(미화·역행 금지), Q1(동일인물 확인) 게이트 | ✅ **부합** |
| 미래 예언 금지 | `judge_release()` Q9 | ✅ **일치** |
| 3D/CGI 얼굴 금지 | 사진을 `images.edit`의 레퍼런스로 사용(생성이 아니라 편집) | ✅ **부합 가능성 높음** (단, 최종 출력 스타일이 실사 유지인지 별도 확인 필요 — 코드만으로는 "3D/CGI 렌더 스타일 금지"를 직접 검증하는 게이트는 못 찾음 → **확인 필요**) |
| 소원그림 1P 이미지 상품 | System B, storybook-mcp | ⚠️ **충돌**: 둘 다 1P/2P/3P 구조를 모르며, System B는 카드 개수 기반 슬라이드, MCP는 6/8/10/12페이지 스토리북 — V4의 "소원그림=1P 단일 이미지" 개념과 맞지 않음 |
| 기적영상 4P Master Asset 기반 | `assemble-miracle-video.js` (5프레임 고정, 사진/정체성 없음) | ❌ **충돌**: 4P 구조가 아니라 독자적인 5-프레임 "중력" 시퀀스이며, 사용자 사진을 전혀 쓰지 않아 Identity Lock 대상이 아님. **완전히 다른 시스템.** |
| 기적쇼츠 = 소원그림 1P + 배우 소원이 별빛항로 35초 + 소원그림 2P | 해당 구조를 구현한 코드를 찾지 못함 | ⚠️ **미구현** — "배우 소원이" 관련 코드/에셋은 이번 분석 범위에서 발견되지 않음 (자료 없음) |

**요약**: `dreamtown-wishart`의 1P/2P/3P/4P + Identity Lock 엔진은 V4와 거의 완벽히 부합한다. 반면 `daily-miracles-mvp`의 두 스토리북 시스템(E2E Commerce, System B)과 `assemble-miracle-video.js`는 V4가 정의하는 4P Master Asset 개념과 구조적으로 다른, 별개 taxonomy를 쓰고 있어 그대로는 사용할 수 없다.

---

## 8. 4P Master Asset 연동 가능성 (질문 5)

- System B는 "카드 개수 기반" 페이지 분할이라 1P/2P/3P/4P 고정 구조와 다르다 — **그대로 압축 불가**, 재설계 필요.
- `dreamtown-wishart`는 이미 Act(1P~4P) 단위로 이미지를 생성하고 있어 **Master Asset의 최소 단위 후보로 가장 적합**하다. 다만 현재는 PNG 2~4장 + 프롬프트 로그가 산출물 전부이며, 이를 소원그림(1P)/기적영상(4P 기반)/기적쇼츠/스토리북/웹툰/애니메이션으로 "확장 출력"하는 후속 단계는 **어떤 코드에도 존재하지 않는다.**
- 리팩토링 범위: (1) `dreamtown-wishart` 엔진을 `daily-miracles-mvp`에서 호출 가능하게 연결(현재 미연결), (2) Story Data 스키마를 4P Act 단위로 재정의, (3) 각 출력 상품(소원그림/기적영상/기적쇼츠/스토리북)이 이 Story Data를 소비하는 별도 "출력 어댑터"로 재작성.

---

## 9. 리팩토링 제안 (요약 — 상세는 TODO 문서 참조)

1. `dreamtown-wishart` 엔진을 DreamTown Core Story Engine의 중심으로 승격하고 `daily-miracles-mvp`와 실제로 연결한다.
2. Story Data 스키마를 4P Act 구조(1P/2P/3P/4P) 기준으로 재정의한다(현재 6개 마이그레이션은 카드/슬라이드 기반이라 재설계 필요).
3. E2E Commerce의 mock 생성 단계를 실제 엔진 호출로 교체하거나, 존재하지 않는 `storybookGenerator.js`를 명시적으로 재설계한다.
4. `assemble-miracle-video.js`의 감정(중력) 분류를 `dreamtown-wishart`의 5-Canon-감정 체계로 통합하거나, 두 체계의 관계를 명시적으로 문서화한다.
5. "기적쇼츠"(소원그림 1P + 배우 소원이 35초 + 소원그림 2P) 구조는 현재 코드에 대응물이 없으므로 신규 설계가 필요하다(기존 코드 재사용 대상 아님).
