# DREAMTOWN_PLAN_ALIGNMENT_AUDIT.md

> 작성일: 2026-05-22  
> 기준 커밋: `23763df`  
> 목적: 최근 자산 정리 작업이 최초 DreamTown 계획과 얼마나 일치하는지 점검  
> 커밋 금지

---

## 평가 기준 출처

| 문서 | 역할 |
|------|------|
| `docs/ssot/DreamTown_Master_Roadmap_v1.md` | 6단계 구조 + 트리거 기반 개발 기준 |
| `docs/ssot/support/DreamTown_MVP_Scope_Design.md` | MVP 핵심 5종 + 비용 절감 구조 |
| `docs/ssot/support/DreamTown_Video_Pipeline_Design.md` | 영상 파이프라인 설계 |
| `DREAMTOWN_STATUS.md` | Phase 1 완료 + Phase 2 대기 현황 |

---

## 4분류 결과 요약

| 항목 | 분류 | 핵심 근거 |
|------|------|-----------|
| 여수 오리진 자산 확보 | ✅ ON TRACK | 4개 위치 × 25장 = 100장 커밋 완료 |
| 비용 절감형 자산 재조합 | ✅ ON TRACK | 사전 생성 + random 서빙 구조 가동 중 |
| 소원별 이미지 매칭 | ⚠️ DRIFT | 하멜은 썸네일 서빙, wish-image 미연결 |
| 자동 스토리북 생성 | ⚠️ DRIFT | asset-registry 파이프라인 구축, 서버 미연결 |
| 기적영상 자동 제작 | ❌ MISSING | 성장필름 PNG 존재, 영상 생성 파이프라인 미구현 |
| Aurora5 오케스트레이터 | ✅ ON TRACK | 코드 완성, Phase 2 대기 |
| DREAMTOWN_STATUS.md 갱신 | 🔴 RISK | 2026-04-04 이후 갱신 없음 — 현재 상태 불일치 |
| "스토리북" 개념 분열 | 🔴 RISK | 상업용 vs 에셋 파이프라인이 같은 이름 공유 |

---

## ON TRACK

### 1. 여수 오리진 자산 확보

**원래 계획**: MVP Scope §2 — 여수 테마(케이블카/카페/전망대/하멜) 배경 자산 확보

**현재 상태**: 4개 위치 전체 커밋 완료

| 위치 | 커밋 여부 | PNG 수 | 서빙 라우트 |
|------|-----------|-------:|------------|
| cablecar | ✅ | 25 | starImageRoutes — stage1 SSOT |
| cafe | ✅ | 25 | starImageRoutes — stage2 SSOT |
| hotel | ✅ | 25 | starImageRoutes — 서빙 코드 확인 필요 |
| hamel | ✅ (25 clean + 25 text) | 50 | starImageRoutes:360 — thumbnails 서빙 |

추가로 hamel `_text` 오버레이 variant 25장 신규 생성 (GATE6b). base05 세트 + 스토리북 5PAGE 베이스도 확보.

**판단**: 자산 수량·품질 모두 계획 초과 달성.

---

### 2. 비용 절감형 자산 재조합 구조

**원래 계획**: MVP Scope §4 — 사전 생성 이미지 풀 + 감정×보석 매핑으로 AI 비용 절감

**현재 상태**: `starImageRoutes.js` 가동 중

```
요청 (emotion + gem + location)
        ↓
사전 생성 이미지 SSOT 조회 (25장 풀)
        ↓
hit: postcards/ 복사 → URL 반환 (AI 호출 0)
miss: DALL-E 3 fallback (비용 발생)
```

- cablecar: stage1 25장 — gem 고정, emotion 순환
- cafe: stage2 25장 — emotion base + gem offset
- hamel: thumbnails/generated/full 50장 — base01~05 random 서빙

**판단**: 설계대로 동작. AI 비용은 pregen-miss 케이스에서만 발생.

---

### 3. Aurora5 오케스트레이터

**원래 계획**: Master Roadmap §Aurora5 — 5 에이전트 자동화 (루미/코미/재미/여의/아우룸)

**현재 상태**: 코드 완성, 트리거 대기

- `dtOrchestratorWorker.js` — server.js 등록 완료 (2026-04-03)
- 5 에이전트 (`agents/starAgent, careAgent, kWisdomAgent, narrativeAgent, monetizationAgent`)
- 트리거 기준 (소원이 100명, D+30 등) 미도달 → 설계 의도대로 대기 중

**판단**: ON TRACK. 트리거 기반 개발 원칙에 정확히 부합.

---

## DRIFT

### 4. 소원별 이미지 매칭 (wish-image → star-cache)

**원래 계획**: 소원별(별 단위) 고유 이미지 생성 + 전달

**현재 상태**: 두 가지 별개 시스템이 병존

```
[시스템 A — 활성]
wishImageRoutes.js: 소원 내용 + gem → DALL-E 3 → /images/wishes/{timestamp}.png
→ 범용 프롬프트, 위치 무관

[시스템 B — CLI 완성, 서버 미연결]
scripts/wish-image/ → star-cache/yeosu_hamel/*.png
→ 하멜 특화 Sowoni 중심 이미지 (9:16, 감정별)
→ starImageRoutes hamel 분기: thumbnails 서빙 (star-cache 미사용)
```

**갭**: 시스템 B의 이미지가 실제 사용자에게 전달되는 경로 없음.
- `starImageRoutes.js:360` hamel 분기는 `thumbnails/generated/full/`을 서빙
- `star-cache/yeosu_hamel/`을 참조하는 서버 코드 0건

**한계**: hamel 전용 소원그림 파이프라인이 완성됐지만, starImageRoutes와 연결되지 않아 실제 별 경험에 미반영.

---

### 5. 자동 스토리북 생성 (asset-registry 파이프라인)

**원래 계획**: 자산 기반 자동 스토리북 생성 — 비용 절감형 에셋 재조합

**현재 상태**: CLI 파이프라인 구축, 서버 미연결

```
[완성된 것]
config/storybook/asset-registry.json (161개 에셋 등록)
config/storybook/page05.json
scripts/storybook/build-asset-registry.js
scripts/storybook/generate-page05.js
public/images/storybook/sources/page05/ (4 locations × 4 PNG = 16장)

[미연결인 것]
scripts/storybook/assemble-storybook-test.js → 실제 스토리북 조립 스크립트
storybookRoutes.js → E2E 상업 스토리북 (결제 → 제작) — asset-registry 미사용
```

**주의**: `storybookRoutes.js`는 E2E 상업 스토리북 (결제 → 책 제작) 이고, `scripts/storybook/`는 에셋 조합 파이프라인으로 **다른 시스템**이다. 연결 코드 0건.

**갭**: `generate-page05.js`가 page05 소스 이미지를 생성하지만, 이 이미지들이 실제 스토리북 조립(`assemble-storybook-test.js`)에서 어떤 역할을 하는지 → 스토리북 E2E 결제 파이프라인과의 연결 계획 미확정.

---

## MISSING

### 6. 기적영상 자동 제작

**원래 계획**: `DreamTown_Video_Pipeline_Design.md` — 이미지 → 스토리보드 → 영상 단위 조립 → 자막 burn-in

**현재 상태**: 설계 완료, 조립 플로우 미구현

| 레이어 | 설계 | 구현 |
|--------|------|------|
| 스토리북 소스 이미지 (프레임 기준) | ✅ page05 16장 생성 완료 | ✅ 자산 확보 |
| 영상용 신규 이미지 (1~2페이지 한정) | ✅ 방향 확정 | ❌ 미생성 |
| 스토리보드 → 영상 단위 조립 | ✅ 설계 | ❌ 조립 플로우 없음 |
| 자막 burn-in | ✅ 설계 | ❌ 미구현 |

**확정 방향 (수정됨)**:
- 기존 storybook 이미지(page05 소스 등)를 영상의 기준 프레임으로 사용
- 전체 장면을 AI로 새로 재해석하지 않음 — 캐릭터 일관성 보호 원칙
- 영상 전용 신규 이미지는 필요한 1~2페이지만 생성
- 핵심 과제 = 기존 자산을 영상 조립 파이프라인에 연결하는 플로우 설계

**growth film vs 기적영상 구분**:
- `challengeRoutes.js:500 POST /challenge/:wishId/growth-film` → 7일 완료 PNG (1080×1920 canvas) — **구현됨**
- 기적영상 → storybook 이미지 기반 조립 영상 — **조립 플로우 미구현**

**판단**: 기적영상의 핵심 자산(page05 소스 이미지 16장)은 이미 확보됨. 누락된 것은 자산 자체가 아니라 이를 영상으로 조립하는 플로우.

---

## RISK

### 7. DREAMTOWN_STATUS.md 갱신 누락 🔴

**문제**: `DREAMTOWN_STATUS.md` 마지막 업데이트 **2026-04-04** — 현재 (2026-05-22)와 **48일** 차이.

**실제 변경 내용 (미반영):**
- GROUP A/B/C 에셋 전체 커밋 (100+ PNG, 4개 위치)
- air-engine SSOT 10개 문서 추가
- wish-image 파이프라인 구축
- asset-registry 161개 에셋 등록
- GATE6+6b 하멜 재생성
- 운영 도구 2개 (`apply-migration.js`, `generate-star-images.js`)

**위험**: 새 세션/새 담당자가 STATUS를 읽으면 Phase 1 수준으로 인식 — 대규모 작업 누락.  
**즉시 갱신 필요.**

---

### 8. "스토리북" 개념 분열 🔴

**문제**: 코드베이스에 "storybook"이라는 이름을 공유하는 **두 개의 다른 시스템**이 존재.

| 구분 | 경로 | 역할 | 연결 상태 |
|------|------|------|-----------|
| **상업 스토리북** | `routes/storybookRoutes.js` | 결제 → 제작 → 납품 E2E | ✅ 서버 마운트 |
| **에셋 파이프라인 스토리북** | `config/storybook/`, `scripts/storybook/` | air-engine 에셋 조합 → 자동 생성 | ❌ 서버 미연결 |

두 시스템은 현재 **데이터 교환 없음**. 에셋 파이프라인의 `generate-page05.js` 결과물이 상업 스토리북의 `storybookRoutes.js`에서 사용되지 않음.

**위험**: 개발자가 혼동할 경우 상업 스토리북 주문 처리 코드를 에셋 파이프라인으로 착각하거나, 반대로 에셋 파이프라인을 완성으로 오해할 수 있음.  
**명칭 분리 또는 연결 계획 확정 필요.**

---

### 9. `hamel-copy.json` 빈 파일 🟡

`config/wish-image/hamel-copy.json` = **0KB** (빈 파일).

`build-hamel-wish-image.js`가 이 파일을 `copies` 배열로 사용:
```javascript
const copies = require(path.join(ROOT, 'config', 'wish-image', `${LOCATION}-copy.json`));
copies.slice(0, LIMIT).forEach(...) // copies = [] → 0개 생성
```

현재 `outputs/prompts/wish-image/hamel/` 5개 파일은 별도로 생성되어 커밋됨 — 프롬프트 결과물은 있으나, 재실행 시 0개 생성될 것.

**위험**: wish-image 파이프라인 재실행 시 프롬프트가 빈 배열로 빌드됨. hamel.json `emotion_overrides`에 confusion만 정의되어 있어 나머지 4개 프롬프트 재생성 불가.

---

## 종합 판단: "계속 정리" vs "제작으로 넘어가기"

### 계속 정리할 것 (2건)

| 항목 | 이유 |
|------|------|
| `DREAMTOWN_STATUS.md` 갱신 | 48일 공백 — 다음 세션 온보딩 붕괴 방지 |
| `hamel-copy.json` 내용 채우기 | wish-image 파이프라인 재실행 가능성 보장 |

### 이제 제작으로 넘어갈 것 (자산 준비 완료)

| 항목 | 근거 |
|------|------|
| hamel wish-image → starImageRoutes 연결 | 자산 1장 있음, 서빙 라우트만 연결하면 됨 |
| 스토리북 page05 → 실제 조립 테스트 | 소스 16장 있음, assemble 스크립트 있음 |
| 기적영상 조립 플로우 설계 | page05 소스 16장 확보됨 — 영상 조립 연결만 남음 |

---

## 다음 우선순위 3개 (추천)

### 우선순위 1 — DREAMTOWN_STATUS.md 즉시 갱신

**이유**: 모든 후속 작업의 온보딩 기반. 48일 누락 상태에서 새 세션이 시작되면 계획 전체가 충돌.  
**작업량**: 소 (완료 이력 추가 + Phase 현황 갱신)

---

### 우선순위 2 — hamel wish-image → starImageRoutes 연결

**이유**: 자산(CLI + 프롬프트 + 이미지 1장)이 이미 준비됐음. 서빙 라우트 연결 1개만 추가하면 "소원별 이미지 매칭" 기능이 실제 사용자 경험에 반영됨.

**필요 작업**:
1. `hamel-copy.json` 5개 감정 카피 채우기
2. 25장 wish-image 생성 + DoD 검수
3. `starImageRoutes.js` hamel 분기: `thumbnails/full/` → `star-cache/yeosu_hamel/` 전환

**선행 조건**: 하멜 wish-image 25장 전체 검수 통과 후 (현재 1장)

---

### 우선순위 3 — storybook 이미지 기반 기적영상 조립 플로우 설계

**이유**: Master Roadmap의 핵심 콘텐츠. 신규 자산 생성 없이 이미 확보된 page05 소스 이미지(16장)를 영상 프레임으로 활용하는 조립 플로우가 없는 상태.

**방향 원칙**:
- 전체 장면을 AI로 새로 재해석하지 않음 — 캐릭터 일관성 보호
- 기존 storybook 이미지를 기준 프레임으로 사용
- 영상 전용 신규 이미지는 필요한 1~2페이지만 한정 생성

**필요 작업**:
1. `videoJobRoutes.js` 현황 확인 — 기존 파이프라인 연결 지점 파악
2. page05 소스 이미지 → 영상 프레임 매핑 설계 (어떤 페이지가 어떤 장면에 대응하는지)
3. 영상 조립 플로우 설계 문서 작성 (신규 이미지 생성 범위 확정 포함)

**DoD**: 조립 플로우 설계 문서 완성 + `videoJobRoutes.js` 연결 계획 확정. 영상 렌더링은 이후 단계.
