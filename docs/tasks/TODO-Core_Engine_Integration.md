---
Document: TODO-Core_Engine_Integration
Based On: SSOT-ENGINE-001_DreamTown_Story_Engine_Draft.md, SSOT-ENGINE-002_WishArt_Adapter_Plan.md
Date: 2026-07-09
Status: Draft — 통합은 아직 실행하지 않음. 본 문서는 향후 실행 항목의 목록이다.
---

# TODO — Core Engine Integration

> 이 문서는 실행 계획이 아니라 **설계 완료 후 대표 승인을 받기 위한 작업 목록**이다.
> `dreamtown-wishart` ↔ `daily-miracles-mvp` 연결은 이번 작업에서 수행하지 않았다.

---

## 1. Adapter 구현 전 선행 과제 (SSOT-ENGINE-002 §5 기준)

1. `dreamtown-wishart`에 `POST /api/story-engine/generate` 신규 엔드포인트 추가 (SSOT-ENGINE-002 §4 계약 기준).
2. `_run_generation()`을 2P 단일 생성 → `acts` 파라미터 기반 1P~4P 다중 생성으로 확장할지 결정.
3. `dreamtown-wishart` 프로덕션 배포 설정(Procfile/render.yaml 등) 마련 — 현재 로컬 전용(uvicorn --reload).
4. `daily-miracles-mvp`에 신규 엔드포인트 호출 클라이언트 모듈 작성.
5. 두 서비스 간 인증 방식(API 키 헤더 등) 결정.
6. OpenAI 비용 영향 재검토 — 2P 단일 생성(현재) 대비 4P 전체 생성 시 최대 4배 비용 증가 가능성, SSOT-PRICE-001 원가 구조 갱신 필요 여부 확인.

## 2. Legacy Preview 관련 후속 결정 (REPORT-Legacy_Video_Frame_System 기준)

1. `scripts/legacy/assemble-miracle-video.js`의 `interpretGravity`/`buildSequence`를 신규 엔진에 통합할지, 순수 참고자료로만 남길지 결정.
2. 7-중력 유형 체계와 `dreamtown-wishart`의 5-Canon-감정 체계를 통합할지, 별도 taxonomy로 병존시킬지 결정.

## 3. 기적쇼츠 — 신규 모듈 정의

> 기존 코드/에셋 재사용 대상 아님. **새 모듈**로 정의한다. (SSOT-ENGINE-001 §4 "기적쇼츠" 행 갱신 대상)

**구조 (지시 기준, 확정):**
```
기적쇼츠 =
  소원그림 1P (발견)
  + 배우 소원이 별빛항로 8개 항로 체험  (2026-07-09: Route가 8개 항로로 확정되어 7→8로 갱신. 항로당 시간 배분은 미확정 — 이전 "5초×7=35초"가 8개 항로에도 적용되는지 별도 확인 필요)
  + 소원그림 2P (응답)
  + 엔딩
```

**현재 상태**: 이 구조에 대응하는 코드·에셋은 저장소 어디에도 없다(자료 없음). 아래는 이 구조를 만들기 위해 **새로 결정/구현해야 할 항목** — 아직 설계 착수 전 단계.

| 구성 요소 | 필요한 것 | 현재 상태 |
|---|---|---|
| 소원그림 1P | `dreamtown-wishart`의 1P Act 이미지 생성 (Identity Lock, 별 OFF) | 엔진 자체는 존재(§SSOT-ENGINE-001), 기적쇼츠용 호출 경로 없음 |
| 배우 소원이 별빛항로 8개 항로 체험 | "배우 소원이"라는 별도 소재(영상/캐릭터)의 정의, 8개 항로 각각의 클립 제작 방식(시간 배분 미확정) | **완전 미정 — 소재 자체가 코드베이스에 없음** |
| 소원그림 2P | `dreamtown-wishart`의 2P Act 이미지 생성 (현재 실사용 경로가 유일하게 만드는 것, §SSOT-ENGINE-002 §2-2) | 엔진 존재, 기적쇼츠 조립 로직 없음 |
| 엔딩 | 엔딩 프레임/문구 정의 | 미정 (dreamtown-wishart의 4P/CTA 개념과 관계 확인 필요) |
| 영상 조립(35초 클립 연결) | 이미지 4종 + 영상 클립 7개를 하나의 숏폼으로 합성하는 렌더링 파이프라인 | 없음 — `assemble-miracle-video.js`(Legacy Preview)는 정적 HTML 프리뷰만 만들고 실제 영상 렌더링을 하지 않으므로 그대로 재사용 불가 |

**다음 단계 (미실행)**:
1. "배우 소원이" 소재의 실체(실사 배우 영상? 애니메이션 캐릭터? 기존 별빛항로 코스 영상 소스가 있는지) 확인 — 별도 지시 필요.
2. 8개 항로가 무엇을 지칭하는지 확인 완료 — `SSOT-ROUTE-001`/`SSOT-BG-001`의 공식 별빛항로(BG-01~08)로 확정됨(2026-07-09). 다만 항로당 시간 배분은 여전히 미확정.
3. 위 항목들이 확인된 후에만 신규 모듈의 실제 설계(SSOT 문서화)를 진행한다 — 이번 작업에서는 구조 정의만 기록하고 임의로 설계를 채우지 않았다.

## 4. 우선순위 (제안, 확정 아님)

1. **P0**: SSOT-ENGINE-002 §5의 선행 과제(1~2번) 확정 — 배포보다 계약/범위 확정이 먼저.
2. **P1**: `dreamtown-wishart` 배포 설정 마련 (통합의 물리적 전제조건).
3. **P2**: Adapter 구현 및 연결.
4. **P3**: 기적쇼츠 — "배우 소원이" 소재 확인 후 신규 설계 착수.
5. **P4**: Legacy Preview 통합 여부 결정.
