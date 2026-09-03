# DreamTown Miracle Video Automation Audit

> 작성일: 2026-05-24
> 작성자: Code (Claude Code)
> 목적: 기적영상 자동화 재설계 전 현황 정확히 파악
> 상태: 점검 완료 / 구현 변경 없음

---

## 1. 요약 결론

| 항목 | 현황 |
|------|------|
| **현재 자동화 수준** | wish_text → HTML5 프리뷰 플레이어 완성. 실제 영상 파일 없음. |
| **실제 export 가능 여부** | ❌ mp4/webm 미생성. HTML5 preview.html만 출력됨. |
| **Storybook과 중복 위험** | ⚠️ 중간 — 구조(5프레임·자막·정적이미지)가 스토리북과 유사. 현재 방향 유지 시 상품 역할 중복. |
| **Miracle Video 확장 가능성** | ✅ 파이프라인 기반 구조는 살릴 수 있음. 레이어 연결 + export 추가로 C 방향 전환 가능. |
| **현재 방향 분류** | **B** "살아 있는 정지 이미지" — A(스토리북)와 C(감정항해) 사이 |

---

## 2. 발견된 파일/폴더

### 핵심 스크립트

| 경로 | 역할 | 크기 | 상태 |
|------|------|------|------|
| `scripts/assemble-miracle-video.js` | 메인 파이프라인: wish_text → sequence.json → preview.html | 33KB | ✅ 완전 작동 |
| `scripts/generate-motion-preview.js` | sequence.json → Static vs Micro Motion 비교 플레이어 | 15KB | ✅ 작동 |
| `scripts/aurora-build.js` | Aurora 브랜드 인트로 영상 (FFmpeg 호출) | 13KB | ✅ 작동 (DreamTown 소원영상과 별개) |
| `scripts/ops/vid-sample-test.js` | FFmpeg 자막 burn-in 테스트 | 19KB | ✅ 작동 (일반 영상용) |
| `scripts/ops/gen-healing-high-sample.js` | YouTube Shorts 힐링 샘플 생성 (FFmpeg) | 11KB | ✅ 작동 (기적영상과 별개) |
| `routes/videoJobRoutes.js` | VideoJob API 라우트 | 6KB | ⚠️ 라우트는 있으나 Orchestrator 미연결 |

### 프로토타입 / 실험 HTML

| 경로 | 역할 | 크기 | 상태 |
|------|------|------|------|
| `public/motion-threshold-test/index.html` | Motion Safe Zone 임계값 실험기 (7 variant) | 40KB | ✅ 브라우저 실행 가능 |
| `outputs/presence-prototype/index.html` | Presence v1.1 — P0/P1/P2 레이어 프로토타입 | 23KB | ✅ HTTP 서버 필요 |

### sequence.json / preview.html 출력물

| 폴더 | 내용 | 파일 수 |
|------|------|---------|
| `outputs/resonance-preview/W1/` | 위로형 v1, 30s, 3:4 | sequence.json + preview.html |
| `outputs/resonance-preview/W1-v2/` | 위로형 v2 (F5 자산 교체) | sequence.json + preview.html |
| `outputs/resonance-preview/W1-v3/` | 위로형 v3 (F5 야간 연속성 복구) | sequence.json + preview.html |
| `outputs/attraction-preview/W1-S/` | 위로형 Shorts, 21s, 9:16 | sequence.json + preview.html |
| `outputs/auto-preview/wish_W01_res/` | 위로형 자동 생성 검증 | sequence.json + preview.html |
| `outputs/auto-preview/wish_W03_att/` | 결심형 자동 생성 검증 | sequence.json + preview.html |
| `outputs/auto-preview/wish_W09_res/` | 불안형 자동 생성 검증 | sequence.json + preview.html |
| `outputs/motion-preview/` | 위의 3개 소원 × Static vs Motion 비교 | 3× preview.html |
| `outputs/wish-render-prototype/W1~W3/` | 수동 검증 완료 프레임셋 (PNG 15개) | PNG + sequence.json |

### SSOT/문서

| 경로 | 역할 |
|------|------|
| `docs/ssot/DREAMTOWN_MOTION_SAFE.yml` | Motion Safe Zone L1-L4 + MID_SAFE 임계값 정본 |
| `scripts/validateDreamTownMotion.ts` | Motion Safe Zone TypeScript 검증기 |
| `docs/ssot/dreamtown/SSOT-DreamTown-Core-Philosophy-v1.0.md` | 핵심 철학 정본 (신규) |
| `docs/ssot/emotion/DreamTown_Emotional_Translation_SSOT.md` | 감정 번역 SSOT EMOT-TRANS-001 |
| `outputs/gravity-interpreter/interpreter-rules.json` | 소원 → Gravity 키워드 매핑 규칙 |

---

## 3. 현재 파이프라인 구조

```
[입력]
wish_text (string)

    ↓  interpretGravity()          ← keyword scoring + tiebreak
    {wish_type, primary_gravity, gem_palette, render_fit}

    ↓  buildSequence()             ← frame_set 선택 + emotion_arc 조합
    sequence.json
      - 5 frames (F1~F5)
      - timing: start/end/duration
      - motion: ken_burns / dissolve_still / dissolve_pan / dissolve_fadeout
      - subtitle: copy SSOT 기반 고정 텍스트
      - breathing_gap: F2/F4 (구조적 정지 구간)

    ↓  assemblePreview()           ← HTML5 CSS animation player 생성
    preview.html
      - CSS Ken Burns (zoom 1.0→1.06~1.08, 방향별)
      - CSS dissolve (opacity transition 0.9s)
      - JS 타이머 (requestAnimationFrame)
      - subtitle fade-in timing
      - gravity score UI + sequence 시각화

[출력]
outputs/auto-preview/{wish_id}/
  ├── sequence.json
  └── preview.html   ← 브라우저 플레이어 (이미지 필요)
```

**실제 mp4/webm 출력 없음.** 파이프라인 종점은 HTML5 플레이어.

---

## 4. 기능별 점검

| 기능 | 존재 여부 | 재사용 가능성 | 수정 필요점 |
|------|-----------|--------------|------------|
| wish → gravity 해석 (`interpretGravity`) | ✅ 완성 | ✅ 높음 | 없음 |
| gravity → sequence 생성 (`buildSequence`) | ✅ 완성 | ✅ 높음 | wish_type 다양화 (현재 3종만) |
| HTML5 preview player | ✅ 완성 | ✅ 높음 | 감정 항해 방향으로 전환 시 scene 전환 강화 필요 |
| Ken Burns (zoom + pan) CSS | ✅ 구현됨 | ✅ | 속도 범위 좁음 (현재 1.06 max) |
| Cross dissolve 전환 | ✅ CSS opacity transition | ✅ | 현재 0.9s 고정. 감정별 차별화 없음 |
| Emotion arc (5프레임 구조) | ✅ EMOT-TRANS-001 기반 | ✅ 높음 | 없음 |
| Frame timing (sec 단위) | ✅ | ✅ | |
| Subtitle copy SSOT 연동 | ✅ 17개 copy 하드코딩 | ⚠️ 중간 | SSOT 파일 외부화 필요 |
| Breathing gap (F2/F4) | ✅ | ✅ | |
| render_mode 분기 (resonance/attraction) | ✅ 비율·타이밍 분기 | ✅ | |
| Star pulse 레이어 | ✅ (presence-prototype) | ✅ 높음 | pipeline과 미연결 |
| Water shimmer 레이어 | ✅ (presence-prototype + motion-preview) | ✅ 높음 | pipeline과 미연결 |
| Air grain 레이어 | ✅ (presence-prototype + motion-threshold) | ✅ 높음 | pipeline과 미연결 |
| Light breathing 레이어 | ✅ (presence-prototype) | ✅ | pipeline과 미연결 |
| FFmpeg mp4 생성 | ⚠️ aurora-build.js에 존재 (Aurora 인트로용) | ⚠️ 조건부 | DreamTown wish 영상에 적용 안 됨 |
| webm export | ✅ (presence-prototype — MediaRecorder) | ⚠️ 브라우저 전용 | 서버 사이드 export 불가 |
| videoJob API | ⚠️ 라우트는 있음 | ⚠️ 조건부 | `VideoJobOrchestrator` 서비스 파일 없음 |
| 오디오 레이어 | ❌ 없음 | — | sequence.json에 sound 필드 있으나 미구현 |
| Scene 감정 항해 (voyage) | ❌ 없음 | — | 현재는 순차 재생만. 항해 느낌 없음 |
| 모바일 뷰포트 | ❌ 미검증 | — | |

---

## 5. 상품 역할 기준 평가

### Storybook 적합성

| 기준 | 현재 자동화 | 판정 |
|------|-----------|------|
| 5프레임 구조 | ✅ 동일 | ⚠️ 중복 |
| 자막 포함 | ✅ 동일 | ⚠️ 중복 |
| 정적 이미지 기반 | ✅ 거의 동일 | ⚠️ 중복 |
| 감정 아카이브 역할 | ⚠️ 자동 생성이지만 저장 UI 없음 | — |
| 보관·재방문 | ❌ 없음 | — |
| 페이지 넘김 UX | ❌ 없음 (자동 재생) | 차이 있음 |

**결론**: 현재 자동화 결과물은 스토리북과 **구조적으로 70% 이상 유사**하다.  
이미지, 자막, 5프레임 구조가 동일하며, 유일한 차이는 자동 재생 타이밍과 CSS dissolve 뿐이다.

---

### Miracle Video 적합성

| 기준 | 현재 자동화 | 부족한 점 |
|------|-----------|---------|
| 감정 항해 경험 | ⚠️ emotion_arc 있으나 scene 전환이 "순차 재생" 수준 | 항해 느낌 없음 |
| 살아 있는 세계 | ⚠️ Ken Burns 있음. P0 레이어 미연결 | star/water/grain 분리된 prototype |
| 실시간 감정 체감 | ⚠️ 타이밍은 있으나 변화의 밀도가 낮음 | 5프레임 사이 공백이 단순 홀드 |
| 실제 영상 출력 | ❌ 없음 | mp4/webm 미생성 |
| 오디오 | ❌ 없음 | sequence.json에 sound 필드만 존재 |
| 소원이 감정을 "살아보는" 경험 | ❌ 없음 | 보여주는 것이지 항해가 아님 |

**결론**: 현재 자동화는 Miracle Video의 **기반 구조(프레임 데이터, 타이밍)는 갖췄으나,  
"감정 항해" 경험의 핵심 요소(살아있는 레이어 + 감정 전환의 밀도 + 실제 영상)가 없다.**

---

## 6. 위험 요소

### static slide risk — **높음**

현재 자동화의 실제 출력물을 브라우저에서 보면:
- F1 → 5초 ken_burns → F2 → 5초 hold → F3 → ...
- dissolve는 CSS opacity transition 0.9s
- 실질적으로 "슬라이드쇼에 fade 전환"과 구별이 어렵다

ken_burns 속도(0.3x)가 낮고, F2/F4 breathing_gap이 완전 정지(zoom=1.0)이므로  
정적 슬라이드 느낌이 지배적이다.

---

### motion too subtle risk — **높음**

현재 Ken Burns는 zoom 1.0 → 1.06 (5초), 즉 초당 +1.2%/s.  
DREAMTOWN_MOTION_SAFE.yml 기준 L3(Echo, 1.5-2.0%/s) 아래 MID_SAFE 구간.  
브라우저에서 직접 확인 없이는 움직임이 느껴지지 않는다.

presence-prototype의 P0 레이어(star pulse/water shimmer/air grain)가 별도로 구현되어  
있으나 메인 파이프라인에 연결되지 않았다.

---

### product duplication risk — **중간-높음**

스토리북: 5페이지 × 이미지 + 텍스트  
현재 기적영상: 5프레임 × 이미지 + 자막 + 자동 재생

사용자 입장에서 "스토리북이 자동으로 재생되는 것"과 구별이 명확하지 않다.  
방향을 명확히 하지 않으면 두 상품이 같은 자산의 다른 포장처럼 느껴질 수 있다.

---

### videoJobRoutes 연결 없음 — **높음**

`routes/videoJobRoutes.js`는 `services/videoJob/VideoJobOrchestrator`를 참조하지만  
해당 서비스 디렉토리가 존재하지 않는다.  
현재 VideoJob API는 라우트는 있고 Orchestrator는 없는 상태다.

---

## 7. 재사용 권장 자산

아래는 새 방향(감정 항해형)으로 전환할 때도 그대로 쓸 수 있는 자산이다.

| 자산 | 경로 | 재사용 이유 |
|------|------|------------|
| `interpretGravity()` | `scripts/assemble-miracle-video.js` | wish_text → emotion 매핑 완성. 변경 불필요. |
| `buildSequence()` | 동상 | 5프레임 구조 + emotion_arc. 타이밍 파라미터화로 재사용 가능. |
| `sequence.json` 포맷 | `outputs/*/sequence.json` | 입력 포맷 안정화. 새 renderer도 이 포맷 읽을 수 있음. |
| `interpreter-rules.json` | `outputs/gravity-interpreter/` | keyword 규칙 완성. LLM 없이 작동. |
| W1/W2/W3 프레임 이미지 | `outputs/wish-render-prototype/` | 15개 PNG. 재사용 원칙 확립. |
| Star pulse 레이어 | `outputs/presence-prototype/index.html` | P0 필수. canvas + screen blend. 연결 준비됨. |
| Water shimmer 레이어 | 동상 | P0 필수. SVG feTurbulence. 연결 준비됨. |
| Air grain 레이어 | 동상 | P0 필수. soft-light blend, center-biased. 연결 준비됨. |
| DREAMTOWN_MOTION_SAFE.yml | `docs/ssot/` | 임계값 정본. 새 renderer도 이 기준 적용 필요. |
| EMOT-TRANS-001 | `docs/ssot/emotion/` | 감정 번역 규칙 정본. |
| aurora-build.js FFmpeg 구조 | `scripts/aurora-build.js` | FFmpeg execFileSync 패턴. 소원영상 export 구현 참조용. |

---

## 8. 수정/폐기 권장 자산

| 자산 | 경로 | 이유 |
|------|------|------|
| `assemblePreview()` HTML player | `scripts/assemble-miracle-video.js` | 기적영상이 "감정 항해"로 재정의되면 HTML5 슬라이드 방식으로는 부족. 레이어 통합 + export 방향으로 전면 재설계 필요. |
| F2/F4 breathing_gap 완전 정지 | sequence.json 공통 구조 | 5초 완전 hold = 스토리북과 동일. 기적영상은 정지 구간도 P0 레이어는 살아있어야 함. |
| Ken Burns 속도 고정 (speed: 0.3) | `buildSequence()` 내 하드코딩 | 감정별 속도 차별화 없음. 전체 동일 속도 = 감정 항해 없음. |
| 17개 subtitle copy 하드코딩 | `assemble-miracle-video.js` 내 `SUBTITLE_MAP` | SSOT 파일 외부화 필요. 현재는 스크립트 수정 없이 copy 변경 불가. |
| `outputs/resonance-preview/W1/` (v1, v2) | 이전 버전 | v3가 최종 승인됨. v1/v2는 비교 참조용으로만 보관. |

---

## 9. 다음 구현 전 결정 필요 사항

아래 4개 질문은 CEO/Aurora5가 결정해야 할 사항이다.  
Code는 결정 후 구현한다.

---

### Q1. 기적영상의 핵심 경험 재정의

```
현재: "자동 재생되는 스토리북"
제안: "소원이가 감정을 천천히 항해하는 경험"
```

**재정의 시 변경될 것**:
- `assemblePreview()`: HTML5 슬라이드 → 레이어 통합 영상 플레이어
- F2/F4 breathing_gap: 완전 정지 → P0 레이어는 유지 (star/grain만)
- Ken Burns: 속도 고정 → 감정 arc별 속도 차별화

**재정의 불필요 시**: 현재 구조 유지, export 추가만 진행.

---

### Q2. 실제 영상 파일 export 우선순위

```
Option A: 브라우저 MediaRecorder WebM (구현 용이, 품질 제한)
Option B: FFmpeg mp4 (서버 필요, 품질 높음, aurora-build.js 패턴 재사용)
Option C: 브라우저 preview만 유지, export는 다음 단계
```

현재 `aurora-build.js`에 FFmpeg 패턴이 완성되어 있어 B 구현은 가능하다.  
단, DreamTown 소원영상 특성상 "브라우저에서 바로 재생"이 우선이라면 C도 합리적.

---

### Q3. Presence Prototype P0 레이어 메인 파이프라인 통합 여부

`presence-prototype/index.html`의 star pulse/water shimmer/air grain은  
`assemble-miracle-video.js`의 preview.html과 **완전히 분리된 별도 파일**이다.

```
현재: auto-preview/preview.html — 정적 이미지 + CSS Ken Burns
      presence-prototype/index.html — P0 레이어 있으나 단독 실험
```

통합 결정 시: `assemblePreview()`가 P0 레이어 JS 코드를 포함한 HTML을 생성.

---

### Q4. Storybook vs Miracle Video 상품 차별화 기준

방향 확정 전 Aurora5가 결정해야 할 핵심:

```
스토리북: "내 소원 여정의 기억을 보관한다"
기적영상: "지금 이 순간 감정을 살아본다"
```

현재 기술 구조는 두 상품을 아래 차이로만 구별한다:
- 스토리북: 사용자가 페이지 넘김
- 기적영상: 자동 재생 + 타이밍

이것이 충분한 차별화인지, 아니면 **레이어(생동감)·오디오·감정 밀도**를 기적영상의 핵심 차이로 정의할지 결정 필요.

---

## 참조

| 문서 | 경로 |
|------|------|
| 이전 방향 자체 감사 | `docs/reports/DREAMTOWN_AUTOMATION_DIRECTION_SELF_AUDIT.md` |
| 파이프라인 v1 보고서 | `docs/reports/WISH_TEXT_TO_PREVIEW_PIPELINE_V1.md` |
| Micro Motion Prototype | `docs/reports/MICRO_MOTION_PROTOTYPE_V1.md` |
| Motion Safe Zone SSOT | `docs/ssot/DREAMTOWN_MOTION_SAFE.yml` |
| Core Philosophy v1 | `docs/ssot/dreamtown/SSOT-DreamTown-Core-Philosophy-v1.0.md` |
| Emotional Translation SSOT | `docs/ssot/emotion/DreamTown_Emotional_Translation_SSOT.md` |
