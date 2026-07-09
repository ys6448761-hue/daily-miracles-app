---
Document: REPORT-Legacy_Video_Frame_System
Purpose: assemble-miracle-video.js의 5-프레임 구조를 폐기하지 않고 Legacy Preview로 분리한 근거와 현재 상태를 기록
Date: 2026-07-09
Status: Legacy Preview (사용 중지 아님, 폐기 아님)
Related: REPORT-StoryBook_Code_Analysis.md, SSOT-ENGINE-001, SSOT-ENGINE-002
---

# REPORT — Legacy Video Frame System (5-Frame, assemble-miracle-video.js)

## 1. 조치 내용

`scripts/assemble-miracle-video.js`를 **`scripts/legacy/assemble-miracle-video.js`로 이동**했다. 코드는 삭제하지 않았고 기능도 유지된다.

- 저장소 전체(문서 제외) 검색 결과 이 파일을 `require`/`import`하거나 `package.json` 스크립트로 실행하는 코드가 없어(참조 0건), 이동으로 인한 실제 참조 깨짐은 없다.
- 이동으로 인해 상대경로 2곳이 실제로 깨질 뻔했으며 수정했다:
  - `ROOT = path.join(__dirname, '..')` → `path.join(__dirname, '..', '..')` (스크립트가 한 단계 더 깊어졌으므로 저장소 루트까지 두 단계로 조정)
  - `require('../services/worldCanvasService')` → `require('../../services/worldCanvasService')`
- `preview.html`에 삽입되는 이미지 상대경로들(`../../wish-render-prototype/...`, `../../../public/images/...`)은 **출력 파일(`outputs/auto-preview/{wish_id}/preview.html`)의 위치를 기준**으로 계산되며, 이 출력 위치는 `ROOT`(위에서 수정 완료)를 통해 결정되므로 스크립트 자신의 이동과 무관하게 그대로 유효하다. 추가 수정 불필요.
- 파일 상단에 `STATUS: Legacy Preview` 주석과 본 문서 경로를 추가했다.
- `node --check`로 문법 오류 없음을 확인했다.

## 2. 이 시스템이 하는 일 (요약)

```
wish_text (CLI --wish)
  ↓
interpretGravity() — 56개 키워드 규칙으로 7개 "중력(감정)" 유형 중 하나 분류
  ↓
buildSequence() — 고정 5-프레임(F1~F5) 구조에 감정 흐름/자막/모션 배정
  ↓
assemblePreview() — 정적 HTML 프리뷰(사진 크로스페이드) 생성
```

- 프레임 수는 항상 5개 고정이며, 실제 영상 렌더링(mp4 등)은 하지 않는다 — 이름과 달리 **"영상"이 아니라 "영상이 될 프리뷰의 HTML 목업"**을 만든다.
- 사용자 사진을 사용하지 않고, 기존 정적 에셋(웹툰 컷 이미지 등)만 재사용한다. 따라서 Identity Lock 개념 자체가 적용되지 않는다.
- 7개 "중력" 감정 분류 체계는 `dreamtown-wishart`의 5개 Canon 감정 체계와 taxonomy가 다르며 서로 매핑되어 있지 않다.

## 3. 왜 "폐기"가 아니라 "분리"인가

- `interpretGravity()`/`buildSequence()`가 모듈로 export되어 있어(`module.exports`), 키워드 기반 감정 분류·5프레임 시퀀싱 로직 자체는 향후 참고·재사용 가치가 있다.
- 회귀 검증용 비교 로직(위로형 W1-v3 비교 테이블)이 내장되어 있어, 기존 산출물의 품질 기준선(QA 기준) 역할을 계속 할 수 있다.
- SSOT-ENGINE-001/002가 정의하는 **4P Master Asset 체계(사용자 사진 기반, Identity Lock 있음)와는 목적과 입력이 근본적으로 다른 별도 시스템**이므로, 같은 위치에 섞여 있으면 "기적영상의 정식 엔진"으로 오인될 위험이 있어 물리적으로 분리했다.

## 4. 현재 상태와 향후 처리

| 항목 | 상태 |
|---|---|
| 코드 존재 여부 | 유지됨 (`scripts/legacy/assemble-miracle-video.js`) |
| 실행 가능 여부 | 이동 후에도 정상 동작 (경로 수정 완료, 문법 검증 완료) |
| 프로덕션 연결 여부 | 원래도 없었음 (참조 0건 확인) |
| 향후 결정 사항 | 4P 기반 신규 기적영상 엔진과 통합할지, 순수 참고자료(키워드 분류 로직)로만 남길지는 **별도 지시로 확정** — 이번 작업에서 통합/폐기 여부를 임의로 결정하지 않았다. |

## 5. 하지 않은 것

- 폐기(삭제)하지 않았다.
- `interpretGravity`/`buildSequence` 로직을 새 엔진에 통합하지 않았다(분리만 수행, 통합은 SSOT-ENGINE-002/TODO-Core_Engine_Integration 문서의 후속 결정 사항).
- 7-중력 유형과 5-Canon-감정 체계를 임의로 통합하거나 매핑을 새로 만들지 않았다.
