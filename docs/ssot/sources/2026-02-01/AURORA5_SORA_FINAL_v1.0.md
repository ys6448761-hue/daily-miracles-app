# Aurora5 Sora 영상 제작 최종 자료 v1.0

> **IMMUTABLE SOURCE - DO NOT MODIFY**
> 원문 채팅 그대로 보존 (수정 금지)
> 작성일: 2026-02-01

---

> 목적: **원칙 누락/무시 재발 방지** + **40개(10편×4유닛) 프롬프트를 '제작 가능한 최종본'으로 표준화**

---

## 0) 적용 범위

* 대상: **10개 영상 × 4유닛(총 40개)** 숏폼 광고/브랜딩 영상
* 포맷: **9:16 vertical, 1080×1920**, 유닛 **8초(유닛4는 6초)**
* 스타일: **Cinematic, Korean drama aesthetic**
* 컬러 축: **Purple (#667eea) ↔ Pink (#F5A7C6) 그라데이션**

---

## 1) 자가점검(RCA) 요약: 왜 원칙이 무시됐나

### 핵심 결론

* 원칙이 있어도 **프롬프트 생성 파이프라인이 '원칙 문서'를 자동 주입/검증하지 못하는 구조**였을 가능성이 가장 큼.
* 즉, *원칙은 존재했으나* **Single Source of Truth(SSOT)**가 아니었고, **린트/게이트(검증문)**가 없어 "누락"이 자연스럽게 발생.

### 현 프롬프트(40개) 기준으로 확인된 누락/리스크(대표)

* (누락) 유닛별 **고정 기술 세팅(9:16/1080×1920/프레임/렌즈/카메라)**가 '헤더'에만 있고 유닛 텍스트에는 없음 → 복붙/재사용 시 누락 위험
* (리스크) **한글 문구를 영상 내 '읽히게' 생성** 요구 → 생성 품질 편차/깨짐 위험 ↑ → **후편집 자막**으로 분리 필요
* (리스크) "cute star mascot"만으로는 **캐릭터 일관성 깨질 확률** ↑ → 고정 스펙 필요
* (누락) **negative constraints(워터마크/자막/읽히는 텍스트 금지/로고 위치 확보)** 미정의

---

## 2) SSOT(단일 진실 소스) 설계

### 반드시 고정되는 3종 문서

1. **VIDEO_MASTER.md**: 제작 원칙/고정 스펙(본 문서 3~8장)
2. **PROMPT_PACK_v1.0.yaml**: 40개 프롬프트(아래 12장)
3. **LINT_REPORT.md**: 자동 점검 결과(체크리스트 통과/실패)

> 운영 규칙: *프롬프트는 항상* `VIDEO_MASTER` + `UNIT_CONTENT`를 합성해 생성되며, `LINT` 통과 없이는 배포 불가.

---

## 3) 공통 기술 세팅(모든 유닛에 주입)

* Resolution: **1080x1920**
* Aspect: **9:16 vertical**
* Duration: **8s** (Unit 4 only **6s**)
* FPS: 24fps(권장, 명시 가능)
* Look: cinematic Korean drama, shallow depth of field

### GLOBAL_TECH_SUFFIX (모든 유닛 끝에 붙이는 고정 문장)

* `1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.`

---

## 4) 스타일 원칙(PAIN ↔ SOLUTION)

### PAIN(유닛 1~2)

* muted/desaturated, melancholic, isolated
* low-key/dim lighting, gray-blue or sepia
* slow push-in / slow motion / anxious montage

### SOLUTION(유닛 3~4)

* warm purple-pink gradient glow, hopeful, vibrant
* soft/gentle glow, cozy/warm atmosphere
* sunrise/dawn/sunset purple-pink

### 스타일 주입 규칙

* 유닛 1~2: **'보라-핑크'는 거의 안 보이게(아주 미세한 힌트만)**
* 유닛 3: **보라-핑크가 '알림/별'에서 시작해 공간으로 확장**
* 유닛 4: **전체 컬러 그레이딩 완전 전환 + 로고 오버레이 공간 확보**

---

## 5) 별 마스코트(브랜드 앵커) 고정 스펙

> 목적: 10편이 '같은 세계관'으로 인지되게 만들기

* Form: **small five-point star**, minimal eyes/mouth
* Style: **2D hand-drawn watercolor + soft outline**, subtle grain
* Glow: **purple-to-pink aura**, tiny particle trail
* Behavior: gentle float, tiny bobbing, friendly companion
* Where: Unit 3(폰 화면/알림) → Unit 4(현실 공간 동반)

### MASCOT_LOCK 문장(유닛 3~4에 항상 포함)

* `A consistent tiny star mascot: 2D hand-drawn watercolor style, minimal face, purple-to-pink aura, gentle floating motion with subtle particles.`

---

## 6) 로고/자막 원칙

* **영상 내부에 '읽히는 텍스트' 생성 금지(권장)** → 메시지/문구는 **후편집 자막**으로 통일
* Unit 4: **하단(또는 중앙 하단) 로고 오버레이용 '깨끗한 여백'** 확보
* End card: 마지막 0.8~1.0초는 **프레임 안정(카메라 흔들림 최소)**

---

## 7) 유닛 구성 원칙(4유닛 고정)

* Unit 1: 문제의 '정서' 한 방(정적/클로즈업)
* Unit 2: 문제의 '증폭'(몽타주/타임랩스)
* Unit 3: 트리거(별 알림) + 희망 전환 시작
* Unit 4: 행동 변화 + 동반자 + 로고

---

## 8) 프롬프트 템플릿(표준)

아래 템플릿으로 **유닛 콘텐츠만 바꿔서** 40개를 관리한다.

### UNIT_PROMPT_TEMPLATE

* Scene: (who/where/when)
* Action: (what happens)
* Camera: (shot + movement + lens)
* Lighting/Color: (pain or solution)
* Constraints: (no readable text, no watermark, leave logo space)
* Duration: (8s or 6s)
* Suffix: GLOBAL_TECH_SUFFIX

---

## 9) 자가점검(LINT) 체크리스트

### 필수(FAIL이면 재생성)

* [ ] 9:16, 1080x1920 포함
* [ ] Duration(8s/6s) 명시
* [ ] Camera shot/movement 포함
* [ ] Unit 3~4에 MASCOT_LOCK 포함
* [ ] `Avoid readable on-screen text` 포함
* [ ] Unit 4에 `leave clean negative space for logo overlay` 포함

### 권장(경고)

* [ ] 감정 메타포 1개 이상(눈/안개/서류/시계 등)
* [ ] PAIN→SOLUTION 컬러 전환이 명확
* [ ] 동일 인물/의상/장소가 유닛 간 유지(연속성)

---

## 10) 역순 계획(Reverse Plan)

> **배포 결과**에서 거꾸로 필요한 산출물/검증을 정의해 누락을 원천 차단

### R1. 최종 배포(Release)

* 산출물: 10편 최종 편집본(자막/로고 포함), 썸네일 10장
* 검증: 메시지 가독성, 로고 safe-area, 브랜드 컬러 일관성

### R2. 후편집(Edit)

* 산출물: 자막 템플릿(문구 AB 가능), 로고/엔드카드 템플릿
* 검증: 한글 자막 폰트/크기/대비(모바일)

### R3. 생성 결과(Sora Output)

* 산출물: 유닛별 raw 영상 + best take 선택
* 검증: 얼굴/손/물체 왜곡, 장면 연속성, 텍스트 깨짐 없음(원칙상 텍스트 생성 최소화)

### R4. 프롬프트 팩(Prompt Pack)

* 산출물: PROMPT_PACK_v1.0.yaml(40개), 매핑표(video_id-unit → 파일명)
* 검증: LINT 100% 통과

### R5. 원칙/마스터(VIDEO_MASTER)

* 산출물: 본 문서(SSOT)
* 검증: 변경 시 버전업 + 변경로그

---

## 11) 안티그레이비티(Anti-Gravity) 설계

> '자연스러운 누락'(중력)을 이기는 **강제 장치(포싱 펑션)** 세트

### AG-1. 자동 주입(Injection)

* 유닛 콘텐츠만 입력하면 **GLOBAL_TECH_SUFFIX + 스타일 + 로고 제약 + 마스코트 스펙**이 자동 합성되게 설계

### AG-2. 자동 검증(Gate)

* LINT 실패 시: **생성/배포 금지(merge blocked)**

### AG-3. 아카이빙(Assetization)

* 모든 프롬프트는 `prompts/video/2026-01/` 같은 경로에 저장
* `manifest.json`에 해시/버전 기록

### AG-4. 단일 템플릿(Template Lock)

* 편집/제작자가 복붙할 때도 템플릿 형태를 유지하도록 **폼(양식) 고정**

### AG-5. 회고(Drift Detector)

* 주간 회고에서: "원칙 누락 발생 지점" 1줄 기록 → 다음 주 린트 규칙에 반영

---

## 12) 양자 중첩 보완(실험 설계)

> 한 번에 한 방향으로 고정하지 않고 **3개 축을 동시에 실험**해 데이터로 붕괴

| 전략                | 확률 가중치 | 예상 효과      | 측정 지표            |
| ----------------- | -----: | ---------- | ---------------- |
| A. 1초 훅 메타포 강화    |    45% | Thumbstop↑ | 1s hold, 3s view |
| B. 마스코트 일관성 강화    |    35% | 시리즈 인지↑    | 재시청, 브랜드 리콜      |
| C. 톤 변주(3편 유쾌/경쾌) |    20% | 피로도↓ CTR↑  | CTR, 완주율         |

**파동 함수 붕괴 기준(예시)**

* 3초 시청률 +20% 이상 또는 CTR +15% 이상인 축을 다음 주 표준으로 승격

---

# 13) 최종 Sora 프롬프트 팩 v1.0 (40개)

## 공통 주의

* 문구("You did great today" 등)는 **영상 내 읽히는 텍스트로 생성하지 말고**, `generic unreadable notification text`로 처리 후 **후편집 자막**으로 삽입.

---

## 영상 1: 소원이의 하루

### Unit 1 (8s)

A tired Korean office worker in their 30s slowly wakes to an alarm in a dark bedroom, exhausted and rubbing their eyes; faint morning light barely leaks through curtains. Camera: close-up to medium, slow push-in, 50mm. Lighting/color: low-key, muted, desaturated, melancholic. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

Montage: Korean commuters with blank expressions on a subway, office workers typing endlessly, clock hands spinning fast, papers piling up; time-lapse rhythm, trapped-in-routine feeling. Camera: fast-cut montage + timelapse inserts, 35mm. Lighting/color: desaturated, gray-blue, anxious energy. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

Close-up of a smartphone in hand: a warm notification appears with a consistent tiny star mascot (2D hand-drawn watercolor, minimal face, purple-to-pink aura, gentle floating motion with subtle particles). The person's face softens into a small smile as purple-pink glow begins to spill from the phone into the room. Camera: tight close-up on phone then rack focus to face reflection, slow dolly in, 50mm. Lighting/color: hopeful transition, soft glow, purple-pink gradient emerging. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

Same person now walks confidently down a sunlit street, genuine smile; the consistent tiny star mascot floats beside them like a companion, leaving a subtle purple-pink particle trail. Camera: medium-wide, gentle tracking forward, 35mm. Lighting/color: vibrant purple-pink grade, warm uplifting atmosphere. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 영상 2: 막막함 탈출

### Unit 1 (8s)

A stressed Korean professional in their 30s at a messy desk late at night, head in hands, crumpled papers and empty coffee cups; laptop glow in a dim room, overwhelmed expression. Camera: medium close-up, slow push-in, 50mm. Lighting/color: cinematic low-key, muted, melancholic. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

Close-up hands typing; a search bar fills the screen with frantic scrolling results (unreadable generic text), the person's reflection in the monitor looks confused and tired; information overload visualized with quick cuts. Camera: tight close-up + rapid inserts, 35mm. Lighting/color: desaturated, anxious energy, flicker. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

A beautiful animated 30-day roadmap unfolds on the phone like a treasure map, days lighting up as simple checkmarks; the consistent tiny star mascot appears as a guide, radiating purple-to-pink glow. The person's face shifts from confusion to hope. Camera: close-up on phone then tilt to face, gentle dolly, 50mm. Lighting/color: magical reveal, warm purple-pink gradient, soft glow. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

Satisfying sequence of checkboxes being ticked with gentle glow; final checkbox completes with a subtle celebration animation; the person smiles confidently while the consistent tiny star mascot does a happy dance beside the phone. Camera: macro inserts + medium close-up, 50mm. Lighting/color: warm purple-pink, triumphant. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 영상 3: 혼자가 아니야

### Unit 1 (8s)

A lonely Korean professional sits alone at a cafe table, empty chairs around; rain streams down the window; they stare at a phone with no notifications. Camera: medium shot, slow push-in, 50mm. Lighting/color: muted, melancholic, isolated. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

Phone screen scrolls through social media of happy couples and celebrations (unreadable generic UI text); each scroll deepens their dejected reflection. Bright feed contrast against a dim, rainy cafe mood. Camera: tight close-up + reflection focus pulls, 50mm. Lighting/color: desaturated, comparison-trap visualization. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

The phone suddenly lights up: a warm notification arrives with the consistent tiny star mascot (2D hand-drawn watercolor, purple-to-pink aura). Their eyes widen then soften with emotion as purple glow radiates outward. Camera: close-up on phone then slow push to face, 50mm. Lighting/color: heartwarming, warm purple-pink glow begins. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

Split-screen feel: supportive chat bubbles (unreadable generic text shapes) and their genuine smile; rain stops, a faint rainbow appears through the window; the consistent tiny star mascot floats out of the phone as a cozy companion. Camera: medium close-up, gentle push-in, 50mm. Lighting/color: warm purple-pink, connected and cozy. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 영상 4: 다시 시작해도 괜찮아

### Unit 1 (8s)

A dejected Korean professional receives rejection news on their phone (unreadable generic notification); papers fall in slow motion like failed dreams; shoulders slump. Camera: medium close-up, slow motion inserts, 50mm. Lighting/color: dim, muted gray-blue. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

A wall calendar covered with X marks; the person stares at a frozen clock; a ghost-like version of them walks away, giving up. Dust floats in stagnant air. Camera: wide to medium, slow drift, 35mm. Lighting/color: limbo, desaturated, time-stopped mood. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

The phone glows: the consistent tiny star mascot appears on-screen offering a tiny glowing hand; warm purple light fills the room; the person looks up with tearful but hopeful eyes. Camera: close-up on hand/phone then face, slow push-in, 50mm. Lighting/color: gentle hand-drawn feel, warm purple-pink transition. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

A fresh calendar page flips to Day 1; a hand picks up a pen with renewed determination; sunrise pours through a window as colors shift from gray to vibrant purple-pink; the consistent tiny star mascot cheers beside them. Camera: medium shot, slow tilt up to sunrise, 35mm. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 영상 5: 완벽하지 않아도 돼

### Unit 1 (8s)

Close-up hands obsessively crossing out handwritten text with a red pen; a mountain of crumpled papers grows; harsh overhead light casts sharp shadows. Camera: macro close-up, jittery micro-movements, 50mm macro. Lighting/color: anxious, desaturated, harsh contrast. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

The person stares into a mirror with critical eyes; ghostly Korean-like text shapes and shadow whispers swirl around them; the reflection subtly distorts smaller-than-life. Camera: medium close-up, slow push-in, 50mm. Lighting/color: dark vignette, inner critic as shadows. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

Phone glows with the consistent tiny star mascot; warm purple light gently dissolves the shadow voices; shoulders relax; mirror reflection becomes kind and true. Camera: close-up on phone then mirror reflection, slow dolly, 50mm. Lighting/color: soft embrace, acceptance, warm purple-pink glow. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

Crumpled papers fold into imperfect but beautiful origami flowers; the person smiles, accepting their work; the consistent tiny star mascot dances among the paper flowers; warm purple-pink sunset light fills the room. Camera: medium shot, gentle orbit, 35mm. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 영상 6: 내일이 두려워도

### Unit 1 (8s)

A person lies awake in bed at 3AM, staring at the ceiling; red digital clock glows; worry thought bubbles (bills, deadlines) float above. Camera: close-up, slow push-in, 50mm. Lighting/color: blue-gray moonlight, restless shadows, insomnia. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

The person walks alone through thick fog; the path ahead is invisible; silhouettes of possible futures appear then dissolve. Camera: wide shot, slow tracking, 35mm. Lighting/color: cold blue-gray, fear of the unknown. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

In the fog, the consistent tiny star mascot appears like a warm lantern, casting a purple-to-pink glow that reveals just one step ahead; the person checks their phone as a generic unreadable supportive notification pops. Camera: medium shot, slow follow, 35mm. Lighting/color: warm purple-pink glow pushing back darkness, comfort in uncertainty. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

Each step forward clears more fog; dawn breaks on the horizon; the person walks with growing confidence while the consistent tiny star mascot floats beside them as a lantern companion; sky transitions to warm purple-pink sunrise. Camera: wide to medium, steady tracking, 35mm. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 영상 7: 꿈을 잃어버렸어

### Unit 1 (8s)

A dusty guitar in a room corner (or dried paintbrushes in a jar) sits untouched; cobwebs; the person walks past with a heavy sigh; faded photos of their younger passionate self on the wall. Camera: slow pan, 35mm. Lighting/color: melancholic nostalgia, muted. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

Montage of adult routine: crowded subway, spreadsheets, bills piling up; color drains to gray; a ghost of their younger self fades away; "be realistic" appears as chain-like shadows (no readable text). Camera: quick montage + timelapse, 35mm. Lighting/color: desaturated, oppressive. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

Phone lights up with the consistent tiny star mascot asking a warm question (unreadable notification), triggering brief joyful flashback glimpses of their passion; colors slowly return. Camera: close-up on phone then flashback overlays, 50mm. Lighting/color: spark of recognition, purple-pink glow begins. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

A hand wipes dust off the guitar and picks it up again (or opens an old sketchbook to a fresh page); first imperfect but meaningful note/stroke; the consistent tiny star mascot cheers; warm purple-pink light fills the room as color returns. Camera: medium close-up, gentle tilt, 50mm. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 영상 8: 남들 눈이 무서워

### Unit 1 (8s)

The person walks through a crowd feeling watched by countless floating eyes; whispers echo like judgment; a harsh spotlight isolates them, claustrophobic despite open space. Camera: medium shot, slow push-in, 50mm. Lighting/color: desaturated, anxious, spotlight harshness. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

They practice a fake smile in a mirror; multiple masks float around (professional, happy, perfect); behind the mask their true exhausted self is visible. Camera: mirror composition, slow drift, 50mm. Lighting/color: dim, identity lost, duality. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

Phone glows with the consistent tiny star mascot whispering reassurance (unreadable notification); the watching eyes slowly close and fade; harsh spotlight softens into warm purple light; in the mirror they see their true self with kindness. Camera: close-up on phone then mirror reflection, slow push, 50mm. Lighting/color: warm purple-pink glow, self-compassion awakening. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

Masks dissolve and fall away; the person smiles genuinely and walks with natural confidence; the consistent tiny star mascot dances beside them; open sky replaces the crowd pressure; purple-pink sunset glow. Camera: medium-wide tracking, 35mm. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 영상 9: 쉬어도 될까

### Unit 1 (8s)

The person runs on an endless treadmill; to-do lists fly past like scenery; clock hands spin rapidly; sweat drips, exhausted but unable to stop; others run in parallel lanes. Camera: wide to medium, slight shaky intensity, 35mm. Lighting/color: desaturated, hamster-wheel burnout. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

They try to sit on a comfortable couch, but shadowy judgment voices loom ("lazy" as unreadable shapes); guilt becomes heavy chain-like shadows pulling them up again. Camera: medium close-up, slow push-in, 50mm. Lighting/color: dim, self-judgment shadows, rest forbidden. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

Phone glows with the consistent tiny star mascot gently granting permission to rest (unreadable notification); treadmill slows and stops; guilt chains dissolve into light; muscles relax. Camera: close-up on phone then wider reveal, 35mm. Lighting/color: warm purple glow, relief washing over. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

They sit peacefully by a window with a warm cup of tea; soft afternoon light; the consistent tiny star mascot rests contentedly beside them; a battery icon fills up (unreadable simple icon), genuine peaceful smile. Camera: medium shot, static calm framing, 50mm. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 영상 10: 이미 늦은 걸까

### Unit 1 (8s)

Calendar pages fly off rapidly as years pass; the person looks in a mirror noticing time; photos of their younger self fade; hourglass sand nearly empty; regret visualized with sepia creeping in. Camera: montage + slow push-in, 50mm. Lighting/color: melancholic, sepia-to-gray. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 2 (8s)

Phone shows glamorous "success stories" feed (unreadable), young achievers; the person shrinks in comparison; finish line imagery where others celebrate while they stand at starting blocks. Camera: quick-cut montage + symbolic inserts, 35mm. Lighting/color: desaturated, age-anxiety visualization. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 3 (8s)

Phone glows: the consistent tiny star mascot encourages a fresh start (unreadable notification); the hourglass flips over; sepia transforms back into vibrant color; their eyes light up with determination. Camera: close-up hourglass + phone glow, slow dolly, 50mm. Lighting/color: warm purple-pink glow, time becomes friend. Duration 8 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

### Unit 4 (6s)

They step onto their own unique path, no longer comparing; they run at their own pace with confidence; the consistent tiny star mascot cheers alongside; other lanes fade away; sunrise ahead with purple-pink glow. Camera: medium-wide tracking forward, 35mm. Leave clean negative space at bottom for logo overlay; end on a stable frame hold. Duration 6 seconds. 1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.

---

## 부록 A) 운영용 매핑 표(권장)

* `V01-U01 … V10-U04`로 ID를 부여
* 파일명 규칙: `V01_U01_takeA.mp4` / `V01_U01_takeB.mp4`

## 부록 B) 변경 로그(권장)

* v1.0: 원칙+프롬프트 팩 표준화, 텍스트/마스코트/로고 리스크 제거, 안티그레이비티/역순계획/실험 설계 포함
