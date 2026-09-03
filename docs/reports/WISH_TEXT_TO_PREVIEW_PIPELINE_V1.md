# WISH_TEXT_TO_PREVIEW_PIPELINE_V1.md

> 작성일: 2026-05-22  
> 상태: prototype / no commit  
> 산출물: `scripts/assemble-miracle-video.js` · `outputs/auto-preview/`

---

## 목적

EMOT-TRANS-001 기준으로 wish_text 입력 → preview.html 자동 출력까지 연결하는 첫 실행 파이프라인 검증.

---

## 파이프라인 구조

```
wish_text (string)
    ↓  interpretGravity()
    {wish_type, primary_gravity, gem_palette, render_fit, ...}
    ↓  buildSequence()
    sequence.json (5-frame, timing, subtitle, motion)
    ↓  assemblePreview()
    preview.html (HTML5 animation player)
```

**구현 파일**: `scripts/assemble-miracle-video.js`  
**외부 의존성**: 없음 (Node.js built-ins만 사용)  
**신규 이미지 생성**: 0건  
**LLM 호출**: 없음

---

## 실행 결과 — 테스트 소원 3개

### W01 — 위로형 / resonance_personal

```
입력: "지쳐있는 나를 보듬어주고 싶어요"
모드: resonance_personal
```

| 항목 | auto | W1-v3 (manual) | 일치 |
|------|------|----------------|------|
| wish_type | 위로형 | 위로형 | ✅ |
| primary_gravity | pause | pause | ✅ |
| gem cafe | citrine | citrine | ✅ |
| gem hamel | diamond | diamond | ✅ |
| emotion_arc[0] | pause | pause | ✅ |
| emotion_arc[4] | fragile_hope | fragile_hope | ✅ |
| F1 subtitle copy | #9 | #9 | ✅ |
| F3 subtitle copy | #11 | #11 | ✅ |
| F5 subtitle copy | #2 | #2 | ✅ |
| total_sec | 30s | 30s | ✅ |

**10/10 일치. W1-v3 수동 결과와 구조적으로 동일.**

매칭 키워드: 지쳐(pause+3), 보듬(emotional_afterflow+3)  
출처 프레임셋: `wish-render-prototype/W1`

---

### W03 — 결심형 / attraction_social

```
입력: "새로운 일을 시작해보고 싶어요"
모드: attraction_social
```

| 항목 | 결과 |
|------|------|
| wish_type | 결심형 |
| primary_gravity | curiosity |
| gem cafe | citrine |
| gem hamel | topaz |
| emotion_arc | curiosity → afterflow → calm → reconnection → curiosity |
| render_fit | resonance 72 / attraction **85** (attraction 권장 ✅) |
| total_sec | 21s |
| ratio | 9:16 |

매칭 키워드: 시작(curiosity+3), 새로운(curiosity+2), 해보고(curiosity+2) → score 7  
frame_set: `wish-render-prototype/W2`

---

### W09 — 불안형 / resonance_personal (confusion F5 override 검증)

```
입력: "앞날이 너무 불확실하고 막막해요"
모드: resonance_personal
```

| 항목 | 결과 |
|------|------|
| wish_type | 불안형 |
| primary_gravity | confusion |
| gem cafe | moonstone |
| gem hamel | moonstone |
| render_fit | resonance **92** / attraction 28 (resonance first ✅) |
| emotion_arc[4] | fragile_hope (confusion F5 override 강제 ✅) |
| confusion_f5_override | true |
| total_sec | 30s |

confusion → fragile_hope 마감 강제 (EMOT-TRANS-001 §1-4) 정상 작동.  
frame_set: `wish-render-prototype/W3` (F5만 W1/F5_fragile_hope_hamel.png로 대체)

---

## 버그 수정 이력

### gem hamel 오분류 수정 (실행 중 발견)

**증상**: W01 `gem hamel = sapphire` 출력 (기대값 `diamond`)

**원인**:  
`interpreter-rules.json`의 `pause.hamel_gem = "sapphire"` 값을 직접 사용했으나,  
이는 gravity 단위 팔레트이고 실제 시퀀스에서는 wish_type별 확정 gem을 사용해야 함.

```
interpreter-rules.json: pause.hamel_gem = sapphire  (gravity 기본값)
gravity-engine.json:    위로형.gem_palette.hamel = diamond  (wish_type 확정값)
W1-v3 sequence.json:    F5 gem = diamond  (검증 완료)
```

**수정**:  
`WISH_TYPE_GEM` 상수 추가 → wish_type 확정 후 gem_palette override

```javascript
const WISH_TYPE_GEM = {
  '위로형': { cafe: 'citrine',   hamel: 'diamond' },
  '결심형': { cafe: 'citrine',   hamel: 'topaz' },
  '회복형': { cafe: 'sapphire',  hamel: 'emerald' },
  '불안형': { cafe: 'moonstone', hamel: 'moonstone' },
  '희망형': { cafe: 'diamond',   hamel: 'diamond' },
};
```

**재실행 결과**: W01 `gem hamel = diamond` ✅

---

## DoD 검증

| 항목 | 결과 |
|------|------|
| 테스트 소원 1개 입력 시 preview.html 자동 생성 | ✅ (3개 소원 전체 성공) |
| resonance / attraction 둘 다 출력 가능 | ✅ (W01=resonance, W03=attraction) |
| 기존 W1 수동 결과와 구조적으로 비교 가능 | ✅ (10/10 일치) |
| 실패 시 fallback gravity 명시 | ✅ (`fallback: true` + warn 표시) |
| 신규 이미지 생성 없음 | ✅ (new_ai_images: 0) |
| 외부 API 호출 없음 | ✅ |
| confusion → fragile_hope 마감 강제 | ✅ (W09 검증) |

---

## 산출물 목록

```
scripts/assemble-miracle-video.js          ← 메인 파이프라인 스크립트
outputs/auto-preview/wish_W01_res/
  sequence.json                             ← auto-generated (위로형/resonance)
  preview.html                              ← HTML5 animation player
outputs/auto-preview/wish_W03_att/
  sequence.json                             ← auto-generated (결심형/attraction)
  preview.html
outputs/auto-preview/wish_W09_res/
  sequence.json                             ← auto-generated (불안형/resonance, F5 override)
  preview.html
```

**preview.html 열기**:

```bash
# 옵션 A: 파일 직접 열기
start "" "outputs/auto-preview/wish_W01_res/preview.html"

# 옵션 B: HTTP 서버 (이미지 로딩 권장)
cd C:\DEV\daily-miracles-mvp
python -m http.server 8080
# http://localhost:8080/outputs/auto-preview/wish_W01_res/preview.html
```

---

## v1 한계

| 한계 | 설명 | 다음 단계 |
|------|------|----------|
| 3 wish_type 전용 frame set | 위로형/결심형/회복형 외 관계형·희망형은 W1 fallback | 전용 frame set 생성 필요 |
| 불안형 F1 이미지 = pause (W3) | confusion 전용 cafe 이미지 없음 | moonstone cafe 이미지 확보 |
| 오디오 미구현 | sequence.json에 ambient 명시됐지만 preview.html은 무음 | Web Audio API 연결 |
| frame_file은 상대 경로 | 브라우저 file:// 프로토콜은 이미지 차단 가능 | HTTP 서버 서빙 권장 |
| wish_type 6종 중 3종만 전용 copy | 관계형·불안형·희망형은 위로형 copy 차용 | 전용 copy 추가 |

---

## 다음 단계

```
1. [즉시] videoJobRoutes.js 연결
   → POST /api/dt/miracle-video {wish_id, wish_text, mode}
   → assemble-miracle-video.js 호출
   → outputs/auto-preview/{wish_id}/ 반환

2. [이번 주] HTTP 서빙 라우트 추가
   → GET /outputs/auto-preview/:wish_id/preview.html
   → preview.html을 사용자에게 직접 전달

3. [다음 스프린트] 불안형 전용 frame set 생성
   → moonstone cafe + hamel 이미지 (기존 없음)
   → 25장 생성 → star-cache 등록 → 파이프라인 연결
```

---

## 참조

| 문서 | 경로 |
|------|------|
| 번역 SSOT | `docs/ssot/emotion/DreamTown_Emotional_Translation_SSOT.md` |
| 인터프리터 규칙 | `outputs/gravity-interpreter/interpreter-rules.json` |
| Gravity 엔진 | `outputs/wish-render-prototype/gravity-engine.json` |
| W1-v3 manual | `outputs/resonance-preview/W1-v3/sequence.json` |
| 방향 감사 | `docs/reports/DREAMTOWN_AUTOMATION_DIRECTION_SELF_AUDIT.md` |
