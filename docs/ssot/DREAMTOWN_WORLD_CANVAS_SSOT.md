# DREAMTOWN WORLD-CANVAS SSOT

**버전**: v1.0
**생성일**: 2026-05-24
**마감**: 2026-05-26 23:59

---

## 핵심 원칙

> "같은 밤, 같은 별, 같은 세계. 하지만 다른 거리에서 본다."

storybook과 miracle은 동일한 DreamTown 세계를 보여준다.
차이는 **카메라의 거리**다.

---

## 상품 정의 분리

| | storybook | miracle |
|---|---|---|
| **role** | 당신과 별의 감정 | 당신의 별이 살아가는 세계 |
| **camera** | close / emotional | wide / environmental |
| **focus** | 소원이 감정, 별의 친밀감 | 세계, 항로, 하늘, 여수 풍경 |
| **frame** | 얼굴/손/창가/별 중심 | 항구/밤바다/도시/하늘 중심 |
| **character** | 인물 중심 (1/3 프레임) | 소원이는 작게 존재 (5-10%) |
| **emotion_density** | HIGH | MEDIUM |
| **image source** | `star-cache` | `world-canvas` |

둘은 경쟁 상품이 아니라 **emotion pair product**다.

---

## 이미지 라우팅

```
storybook → /images/star-cache/{location}/{emotion}_{gem}_{location}.png
miracle   → /images/world-canvas/miracle/{scene}/{scene}_world_canvas.png
```

**절대 금지**: miracle이 star-cache 이미지를 참조하는 것.

라우팅 구현: `services/worldCanvasService.js`
라우팅 설정: `config/world-canvas/routing.json`

---

## miracle 프레임 정책

| 프레임 | 역할 | 이미지 소스 |
|--------|------|------------|
| **F1** | **첫 프레임 — 세계 와이드샷** | **world-canvas (우선)** → wish-render-prototype (fallback) |
| F2 | breathing gap (카페 잔향) | storybook/sources/page05 (현행 유지) |
| F3 | 감정 전환 | wish-render-prototype (현행 유지) |
| F4 | breathing gap (하멜 재연결) | storybook/sources/page05 (현행 유지) |
| F5 | 마지막 희망 | wish-render-prototype (현행 유지) |

F1이 storybook 소스와 다르면 "첫 프레임 즉시 구분" DoD 달성.
world-canvas 이미지 생성 전에는 wish-render-prototype fallback으로 동작 — 기존 파이프라인 충돌 없음.

---

## world-canvas 씬 3종 (MVP)

### TEST A — yeosu_harbor (여수 항구 파노라마)
```
감정: calm hope
character_visibility: LOW
핵심: 넓게 열린 하늘과 바다가 세계. 인물은 항구 가장자리에서 바다를 바라보는 실루엣.
```

### TEST B — yeosu_cablecar_night (케이블카 야경)
```
감정: floating dream
character_visibility: VERY LOW
핵심: 도시 불빛 위에 떠 있는 시점. 하늘과 항구 도시 전체가 주인공.
```

### TEST C — yeosu_dolsan (돌산 야경)
```
감정: quiet miracle
character_visibility: LOW
핵심: 돌산대교 불빛이 바다에 반사. 다리와 바다가 세계. 인물은 목격자.
```

---

## wish_type → world-canvas 씬 매핑

| wish_type | scene |
|-----------|-------|
| 위로형 | yeosu_harbor |
| 결심형 | yeosu_cablecar_night |
| 회복형 | yeosu_dolsan |
| 관계형 | yeosu_dolsan |
| 불안형 | yeosu_harbor |
| 희망형 | yeosu_cablecar_night |

---

## 프롬프트 핵심 원칙

```yaml
base: 2D watercolor, Korean animation, Ghibli emotional tone
composition: 하늘+환경이 70-80% 차지
character: 실루엣만, bottom 5-10% 위치
lighting: moonlight, harbor glow, soft water reflection
NOT: photorealistic, 3D, close-up face, large character, cinematic lens flare
```

전체 프롬프트 SSOT: `config/world-canvas/prompt-ssot.json`

---

## 절대 금지

```
storybook 이미지 재사용
단순 zoom-out (motion만 추가하는 것)
실사 스타일 / 3D 스타일
과한 cinematic lens flare
과한 particle FX
캐릭터가 주인공인 구도
```

---

## 이미지 생성 방법

```bash
# 드라이런 (프롬프트 확인)
node scripts/generate-world-canvas.js --dry-run

# 특정 씬만
node scripts/generate-world-canvas.js --scene=yeosu_harbor

# 전체 3종 생성 (~$0.12, 60-90초)
node scripts/generate-world-canvas.js

# 덮어쓰기
node scripts/generate-world-canvas.js --force-regenerate
```

생성 결과: `public/images/world-canvas/miracle/{scene}/{scene}_world_canvas.png`
보고서: `reports/world-canvas-generation-report.md`

---

## 미래 확장 (구조만 확보, MVP 구현 금지)

```
Galaxy Route        — 별이 항로를 따라 이동
harbor particles    — 항구 파티클 이펙트
constellation movement — 별자리 연결선
route glow          — 항로 글로우
star navigation     — 별 탐색 UI
```

위 요소들은 world-canvas 씬 위에 레이어로 추가 가능한 구조.
현재 MVP에서는 이미지만 존재 — 오버레이 없음.

---

## 구현 파일 목록

| 파일 | 역할 |
|------|------|
| `config/world-canvas/prompt-ssot.json` | 프롬프트 파라미터 정본 |
| `config/world-canvas/routing.json` | storybook/miracle 라우팅 규칙 |
| `scripts/generate-world-canvas.js` | 이미지 생성 CLI |
| `services/worldCanvasService.js` | 라우팅 서비스 (assemble-miracle-video 연동) |
| `public/images/world-canvas/miracle/` | 생성된 이미지 저장 경로 |
| `scripts/assemble-miracle-video.js` | miracle F1 → world-canvas 우선 참조 (수정됨) |

---

## DoD 체크리스트

| 항목 | 상태 |
|------|------|
| storybook/miracle 첫 프레임 즉시 구분 | ✅ F1 world-canvas 우선 적용 |
| 같은 이미지 재사용 느낌 제거 | ✅ 라우팅 분리 완료 |
| world-canvas 폴더 구조 생성 | ✅ `public/images/world-canvas/miracle/` |
| prompt SSOT 작성 | ✅ `config/world-canvas/prompt-ssot.json` |
| 라우팅 config 작성 | ✅ `config/world-canvas/routing.json` |
| worldCanvasService.js | ✅ wish_type → scene → URL 매핑 |
| assemble-miracle-video.js 연동 | ✅ F1 world-canvas fallback-safe 업데이트 |
| 기존 star-cache 충돌 없음 | ✅ F2/F4 현행 유지, F1만 교체 |
| 테스트 이미지 3종 생성 | ⏳ `node scripts/generate-world-canvas.js` 실행 필요 |
| DreamTown 수채화 톤 유지 | ✅ 프롬프트에 명시 |
| 아우룸 과노출 없음 | ✅ negative prompt에 lens flare 금지 |
| 소원이 감정 흔적 유지 | ✅ small silhouette, emotional trace remains |
