# MICRO_MOTION_PROTOTYPE_V1.md

> 작성일: 2026-05-22  
> 상태: prototype / no commit  
> 산출물: `scripts/generate-motion-preview.js` · `outputs/motion-preview/`

---

## 목적

`auto-preview` pipeline에서 생성된 sequence.json을 입력으로  
CSS + JS 기반 마이크로 모션 레이어를 추가한 HTML5 플레이어를 생성.  
**Static vs Micro Motion** 좌우 비교 뷰로 효과를 직접 확인.

---

## 구현 방식

```
sequence.json
    ↓  generate-motion-preview.js
    HTML5 비교 플레이어
    ├── LEFT  : Static  (dissolve + opacity 전환만)
    └── RIGHT : Micro Motion (JS transform + CSS overlay)
```

**외부 의존성**: 없음 (Node.js built-ins + requestAnimationFrame)  
**새 이미지 생성**: 0건  
**LLM 호출**: 없음

---

## 모션 레이어 설계

### Emotion → Motion 매핑

| Gravity | Zoom | Pan | CSS Overlay |
|---------|------|-----|-------------|
| `pause` | 1.0 → 1.06 | 없음 | — |
| `calm` | 1.0 → 1.04 | 없음 | — |
| `curiosity` | 1.0 → 1.055 | −0.8% → +0.8% | — |
| `fragile_hope` | 1.0 → 1.05 | 없음 | water shimmer |
| `reality_reconnection` | 1.0 → 1.02 | −1.2% → +1.2% | water shimmer |
| `emotional_afterflow` | 없음 (1.0 고정) | 없음 | — (opacity breathe) |
| `confusion` | 1.0 → 1.03 | 없음 | fog drift |

### Render Mode 속도 배수

| Mode | Speed Multiplier | 근거 |
|------|-----------------|------|
| `resonance_personal` | 1.0× | 느리고 침잠. 숨 참는 속도. |
| `attraction_social`  | 1.3× | 가볍고 또렷. 공유 의도 반영. |

### CSS Overlay 애니메이션

**water shimmer**  
- `radial-gradient(ellipse 130% 55% at 50% 88%)` — 하단 빛 번짐
- `animation: shimmer 5.5s ease-in-out infinite`
- scale 0.94 ↔ 1.06, opacity 0.35 ↔ 1.0
- 적용: `fragile_hope`, `reality_reconnection`

**fog drift**  
- `linear-gradient(148deg)` — 대각 안개 흐름
- `animation: fog 9s ease-in-out infinite`
- translateX −2.5% ↔ +2.5%, opacity 0.45 ↔ 1.0
- 적용: `confusion`

**subtitle breathing** (motion player 전용)  
- `animation: sub-breathe 3.8s ease-in-out infinite`
- opacity 0.82 ↔ 1.0
- static player에는 미적용 (비교 기준 유지)

**emotional_afterflow breathe**  
- `Math.sin(Date.now() / 1800)` → opacity 0.85 ↔ 0.97
- JS 실시간 계산 (CSS animation 제외)
- zoom 없음 — breathing gap 의도 보존

---

## 생성 파일

```
outputs/motion-preview/
  wish_W01_res/preview.html   ← 위로형 / resonance_personal / 3:4 / 30s
  wish_W03_att/preview.html   ← 결심형 / attraction_social  / 9:16 / 21s
  wish_W09_res/preview.html   ← 불안형 / resonance_personal / 3:4 / 30s
```

각 파일 구성:
- 좌우 두 개의 독립 플레이어 (동기화 타이머 공유)
- 공유 재생/일시정지 컨트롤
- 프레임 레이블 + emotion 태그 HUD
- Legend: 각 모션 효과 설명

---

## 렌더 확인 방법

```bash
# HTTP 서버 (이미지 로딩 필수)
cd C:\DEV\daily-miracles-mvp
python -m http.server 8080
```

| 파일 | URL |
|------|-----|
| W01 위로형 resonance | http://localhost:8080/outputs/motion-preview/wish_W01_res/preview.html |
| W03 결심형 attraction | http://localhost:8080/outputs/motion-preview/wish_W03_att/preview.html |
| W09 불안형 resonance | http://localhost:8080/outputs/motion-preview/wish_W09_res/preview.html |

---

## CEO 시각 확인 항목

| # | 확인 항목 | 기대 결과 | 소원 |
|---|-----------|-----------|------|
| M-01 | pause gravity slow zoom — static 대비 우측이 부드럽게 확대되는가 | scale 1.0→1.06, 5초에 걸쳐 | W01 F1 |
| M-02 | emotional_afterflow breathing gap — 정지처럼 보이되 미세 호흡감이 있는가 | zoom 없음, opacity 0.85↔0.97 | W01 F2 |
| M-03 | fragile_hope shimmer — 하단에 잔잔한 빛 번짐이 느껴지는가 | radial shimmer 5.5s | W01 F5 |
| M-04 | confusion fog — F1에서 안개가 대각 방향으로 천천히 흐르는가 | fog 9s, translateX ±2.5% | W09 F1 |
| M-05 | curiosity zoom+pan — 화면이 우측으로 자연스럽게 흐르는가 | pan −0.8%→+0.8%, 4초 | W03 F1/F5 |
| M-06 | attraction 1.3× — W03가 W01보다 모션이 명확히 빠른가 | SPEED = 1.3 | W03 전체 |
| M-07 | subtitle breathing — 우측 자막이 좌측보다 미세하게 맥박치는가 | 3.8s cycle | 모든 자막 |
| M-08 | reality_reconnection shimmer+pan — 해멜 프레임에서 빛 번짐 + 좌→우 이동 | pan ±1.2%, shimmer | W01 F4 |

---

## 정적 분석 — 효과 충돌 없음 확인

| 확인 항목 | 결과 |
|-----------|------|
| zoom + shimmer 동시 적용 (fragile_hope) | ✅ 독립 레이어, 충돌 없음 |
| zoom + fog 동시 적용 (confusion) | ✅ fog는 별도 div, z-index 분리 |
| breathing gap (afterflow) zoom=0 보장 | ✅ zoom [1.0, 1.0] 고정 |
| attraction 1.3× 배수 — CSS animation 미영향 | ✅ shimmer/fog CSS는 emotion별 독립. 배수는 JS timer에만 적용 |
| 자막 breathing — static player 미오염 | ✅ `#m-sub` 전용 animation |
| F5 confusion override (W09) — fragile_hope shimmer 적용 확인 | ✅ emotion=fragile_hope → shimmer 활성화 |

---

## v1 한계

| 한계 | 설명 | 다음 단계 |
|------|------|----------|
| SPEED 배수 미반영 | 현재 구조상 SPEED는 선언만 됨 (timing은 sequence.json 고정값) | JS timer에 SPEED 곱하기 구현 필요 |
| 이미지 없으면 효과 미확인 | PNG가 없는 프레임은 broken image | star-cache PNG 연결 후 재실행 |
| zoom transform 대신 CSS animation 고려 | 현재 rAF에서 매 프레임 style.transform 갱신 | GPU 최적화 필요 시 CSS @keyframes 전환 |
| 모바일 뷰포트 미검증 | 비교 레이아웃은 데스크탑 2-column | 모바일은 1-column 단독 플레이어 레이아웃 필요 |

> **SPEED 배수 미반영 상세**: `const SPEED = 1.3` 선언은 됐지만 tick()의 시간 계산이 sequence.json의 절대 timing 기준으로 동작함. SPEED 반영은 `(ts - startTs) / 1000 * SPEED`로 수정 가능하나, 30s/21s 총시간도 달라져 진행바가 어긋남. v2에서 total_sec도 SPEED로 나눠 표시 예정.

---

## 참조

| 문서 | 경로 |
|------|------|
| 파이프라인 v1 | `docs/reports/WISH_TEXT_TO_PREVIEW_PIPELINE_V1.md` |
| 자동 QA v1 | `docs/reports/AUTO_PREVIEW_VISUAL_QA_V1.md` |
| 번역 SSOT | `docs/ssot/emotion/DreamTown_Emotional_Translation_SSOT.md` |
| 생성 스크립트 | `scripts/generate-motion-preview.js` |
