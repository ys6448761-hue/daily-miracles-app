---
code: SSOT-ENGINE-001
title: DreamTown Core Story Engine (Draft)
version: v0.1
status: Draft (미승인 — REPORT-StoryBook_Code_Analysis.md 기반 초안, 대표 확정 전까지 구현 적용 금지)
owner: Aurora5 / Claude Code
based_on: 기존 dreamtown-wishart 엔진 코드 + 소원그림 GPTS V4(인라인 제공 기준) 비교 분석
updated: 2026-07-09
---

# SSOT-ENGINE-001 — DreamTown Core Story Engine (Draft)

> 이 문서는 **초안**이다. 기존 코드를 폐기하지 않고 복원·추출·통합하는 것을 목표로 하며, 새로운 연구/철학을 추가하지 않는다.
> 근거: `REPORT-StoryBook_Code_Analysis.md`

---

## 1. DreamTown Core Story Engine 정의

**하나의 Story Data에서 모든 DreamTown 상품이 출력된다.**

```
One Story Data
Many DreamTown Outputs
```

Core Story Engine은 신규 개발이 아니라, 이미 존재하는 `dreamtown-wishart`의 4-Act 파이프라인(`prompt_builder.py`, `image_generator.py`, `wish_engine.py`, `location_mapper.py`)을 **Story Data 표준 스키마 위에서 동작하도록 정리한 것**이다. 이 엔진이 이미 갖추고 있는 다음 요소를 그대로 승계한다.

- 사진 기반 Identity Lock (85~95% 정체성 보존, 나이 역행 금지)
- 감정→장소→보석 매핑 (5개 Canon 감정 + 별칭)
- 4-Act 구조와 Reveal Rule (별/별씨앗/별공방은 3P 이전 등장 금지)
- 컷 간 이미지-투-이미지 일관성 파이프라인
- QC 게이트(동일인물 확인, 미래 예언 금지)

Core Story Engine이 새로 담당해야 할 것은 **이 Act 단위 산출물을 상품별로 "확장 출력"하는 어댑터 계층**이다(현재 코드에 없음).

---

## 2. Story Data 구조

기존 `dreamtown-wishart`의 실제 입력/처리 구조를 기반으로 정리한 표준 스키마(초안):

```
StoryData {
  identity: {
    photo_ref: string          // 원본 사진 참조(정체성 소스, 이미지-투-이미지 레퍼런스)
    photo_flags: {             // precheck_photo() 하드 게이트
      face_too_small, group_unidentifiable, severe_backlight,
      face_occluded, blurry_or_lowres, insufficient_frontal_info
    }
    person_count, relationship, expression_state
  }
  wish: {
    text: string                // 원문 (variation seed로만 사용, 프롬프트에 직접 삽입 안 함)
    emotion: enum(치유, 감사, 지혜, 새출발, 용기)   // 생략 시 wish_engine.classify(text)
    location: enum(ODONGDO, YISUNSIN, HAMEL, EXPO, CABLECAR, MINAM) | null  // 생략 가능
  }
  scene_lock: {                 // create_scene_lock() 산출물, 전체 Act에 고정 적용
    gemstone, mood_text, world_response_text, variation(time/cloud/sea/flowers)
  }
  acts: [
    { act: "1P", role: "발견",  camera: front_view, world_response: 10%, star: OFF },
    { act: "2P", role: "응답",  camera: side_view,  world_response: 60%, star: OFF },
    { act: "3P", role: "기록",  camera: back_view,  world_response: 100%, star: ON(최초 등장) },
    { act: "4P", role: "참여",  camera: brand/CTA,  character: 없음, star: ON }
  ]
  qc: {
    reveal_rule_passed: bool,   // check_reveal_rule()
    identity_passed: bool,      // Q1: 동일 인물 확인
    no_future_prediction: bool, // Q9
    evaluation_9q: {...}
  }
}
```

---

## 3. 4P Master Asset 구조

```
사용자 사진
  ↓
DreamTown Story Data (위 §2 스키마)
  ↓
4P Master Asset
  1P 발견 (front_view, 별 OFF)
  2P 응답 (side_view, 별 OFF)
  3P 기록 (back_view, 별/별씨앗/별공방 최초 등장 — Reveal Rule)
  4P 참여 (브랜드/CTA, 주인공 없음)
  ↓
소원그림 / 기적영상 / 기적쇼츠 / 스토리북 / 웹툰 / 애니메이션
```

**현재 코드 기준 실현 정도**: 1P~4P Act 이미지 생성 자체는 `dreamtown-wishart`에서 이미 가능(`include_ending`/`include_cta` 플래그로 3P/4P 생성 여부 결정). **다만 이 4장을 각 상품 형식으로 "확장 출력"하는 어댑터는 어떤 저장소에도 존재하지 않는다** — 이번 분석에서 확인된 가장 중요한 공백.

---

## 4. 상품별 출력 구조 (초안 — 확정 아님)

| 상품 | V4 정의 | Master Asset 대응 | 현재 구현 상태 |
|---|---|---|---|
| 소원그림 | 1P 이미지 상품 | Master Asset의 1P 그대로 사용 | 대응 코드 없음 — System B/MCP는 1P 개념 자체가 없음 |
| 기적영상 | 4P Master Asset 기반 | 1P~4P 전체 + Kling 모션 프롬프트 | Kling 모션 프롬프트는 존재(`KLING_MOTION`), 실제 영상 렌더링/Kling API 호출은 저장소 전체에 없음(수동 입력 전제) |
| 기적쇼츠 | 소원그림 1P + 배우 소원이 별빛항로 35초 + 소원그림 2P | 1P + (별도 소재: "배우 소원이" 영상) + 2P | 대응 코드/에셋 없음 — 신규 설계 필요 |
| 스토리북 | (V4에 명시 없음, 기존 상품) | 1P~3P를 페이지로 확장 추정 | System B(포스트카드 배열)와 storybook-mcp(6/8/10/12페이지)가 각각 다른 방식으로 존재, 4P 구조와 미연동 |
| 웹툰 | (기존 계획에만 존재) | 미정 | 코드 없음 |
| 애니메이션 | (기존 계획에만 존재) | 미정 | 코드 없음 (Kling 모션 프롬프트가 유일한 실마리) |

---

## 5. 확정되지 않은 사항 (TBD)

- 기적쇼츠의 "배우 소원이 별빛항로 35초" 소재 제작 방식 — 자료 없음, 별도 지시 필요.
- 소원그림/기적영상/기적쇼츠/스토리북이 Master Asset을 "확장 출력"하는 정확한 변환 규칙 — 미설계.
- `assemble-miracle-video.js`의 7-중력-유형 체계를 `dreamtown-wishart`의 5-Canon-감정 체계로 통합할지, 병존시킬지 — 미결정.
- 3D/CGI 얼굴 금지 원칙을 코드 레벨에서 직접 검증하는 게이트 존재 여부 — 확인 필요(현재는 이미지 편집 방식이라 간접적으로만 부합 추정).

이 문서는 **Draft**이며, 위 TBD 항목과 상품별 출력 구조가 대표 승인을 받기 전까지 실제 구현에 적용하지 않는다.
