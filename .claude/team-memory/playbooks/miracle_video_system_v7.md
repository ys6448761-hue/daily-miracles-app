# MIRACLE VIDEO SYSTEM V7.0 - 2D 애니메이션 제작 마스터 플레이북

> **SSOT (Single Source of Truth)** for 2D Animation Video Production
> Last updated: 2026-01-31

---

## 1. 시스템 개요 및 핵심 원칙

### 파이프라인 단계
```
스토리(Story) → 2D 키프레임 이미지(Keyframe Image) → Sora img2vid(5초 영상) → 후편집(자막/로고/CTA 추가)
```

### 제작 철학
> "우리는 영상을 만드는 것이 아니라, 5초의 마법을 조립한다."

- **One Shot, One Emotion**: 5초 유닛 하나에는 오직 하나의 명확한 감정만 담는다
- **Visual Storytelling**: 자막 없이 그림만 봐도 상황(Pain/Solution)이 이해되어야 한다

---

## 2. 🔒 3중 잠금 장치 (Triple Locks)

### 2.1 STYLE LOCK (스타일 잠금)

```
[STYLE LOCK]
Strict 2D hand-drawn animation style.
Ink line art + warm watercolor wash + paper grain texture.
Ghibli-inspired warmth mixed with Korean manhwa linework.
Lighting: Flat lighting (No heavy shadows).

Negative Constraints:
- NO 3D, NO photoreal, NO CGI look
- NO volumetric light, NO glossy highlights
- NO metallic reflections, NO heavy depth of field
```

### 2.2 TEXT ZERO RULE (텍스트 제로 원칙)

```
영상 내 절대 금지:
- NO readable text, NO subtitles, NO logos, NO watermark
- NO 간판, NO UI 텍스트
- 폰 화면: ONLY abstract soft color blocks + bubble shapes
- 모든 텍스트는 후편집 자막으로만 처리
```

### 2.3 CHARACTER LOCK (캐릭터 잠금)

#### 소원이 (Sowoni)
```
[SOWONI LOCK v2]
- adult Korean college student, early 20s (20–22), NOT a minor
- No school uniform, avoid teen/child cues
- No readable text on clothing/objects

의상 프리셋:
- SPRING_CASUAL: 봄 캐주얼
- SUMMER_SEASIDE: 여름 바닷가
- AUTUMN_COZY: 가을 아늑함 (니트/편안함)
- WINTER_COAT: 겨울 코트
- NIGHT_WALK: 밤 산책
```

#### 아우룸 (Aurum)
```
[AURUM TURTLE LOCK v2]
Aurum is a small warm golden turtle-spirit "seed" character.
- Rounded shell-orb body with simple scute plates (6–10 only)
- Minimal turtle face: two small eyes, tiny beak-like mouth, two dot nostrils
- Short little limbs with tiny claws/flippers visible
- Subtle watercolor halo ring (NOT volumetric light rays)
- One small crescent-rune mark on the shell (fixed position)

금지 사항:
- No jewelry, no clothing-like patterns
- No human baby face, no eyelashes, no teeth

상태 프리셋:
- BASE: 기본
- OBSERVE: 관찰/집중
- GUIDE: 미소/인도
- SPARKLE: 감동/반짝임
- COZY_BREEZE: 바람 탐
- NIGHT_CALM: 차분함
```

---

## 3. 🎵 5초 유닛 시스템 (3-Beat 리듬)

모든 씬은 5초 원테이크로 구성되며, 3박자 리듬을 따릅니다.

| Beat | 시간 | 역할 | 연출 |
|------|------|------|------|
| **Beat A** | 0~2s | 시선 고정 (Hook) | 눈 깜빡임, 숨소리, Push-in |
| **Beat B** | 2~4s | 마법의 순간 (Action) | 핵심 동작, 감정 변화, SFX 포인트 |
| **Beat C** | 4~5s | 연결 & 여백 (Hold) | 0.8~1.0초 홀드, 자막/CTA 공간 확보 |

### 영상 길이별 패키지

| 길이 | 씬 수 | 용도 | 구조 |
|------|-------|------|------|
| **20초** | 4씬 | 숏폼 티저 | 인트로 → 발견 → 감동 → 아웃트로 |
| **30초** | 6씬 | 표준 홍보영상 | PAIN(2) → SOLUTION(2) → CTA(2) |
| **55초** | 11씬 | 기적영상 스토리북 | 발견 → 확신 → 동행 → 피크 → 다짐 |

---

## 4. 🎨 컬러 스크립트 (Color Script)

### PAIN 단계 (고통/문제)
```
- Cool grey tones
- Desaturated watercolors
- Blue shadows
→ 차갑고, 채도 낮고, 그늘진 느낌
```

### SOLUTION 단계 (해결)
```
- Warm golden wash
- Bright pastel colors
- Soft sunlight bloom
→ 따뜻하고, 파스텔톤, 햇살 느낌
```

---

## 5. 🗺️ 배경 시스템 (Background Mode)

### 일반 모드 (GENERIC)
여수가 아닌 보편적인 배경 사용

| 코드 | 배경 |
|------|------|
| GN01 | 바닷가 산책로 |
| GN02 | 조용한 골목 |
| GN03 | 카페 창가 |
| GN04 | 공원 벤치 |
| GN05 | 밤 거리 |
| GN06 | 일출/일몰 해변 |

### 여수 모드 (YEOSU)
스토리에 '여수'가 포함되거나 지정될 경우 활성화

**규칙:**
- 최소 2개 씬에서 랜드마크 실루엣 노출
- 최소 1개 씬은 랜드마크가 배경의 핵심(Landmark-Anchor)

| 코드 | 랜드마크 | 감정 매칭 | 추천 씬 |
|------|----------|-----------|---------|
| YS01 | 오동도 해안길 | 설렘, 시작 | S01 인트로 |
| YS02 | 해상케이블카 | 이동, 여정 | S06 동행 |
| YS03 | 돌산공원 야경 | 여운, 마무리 | S11 아웃트로 |
| YS04 | 돌산대교 야경 | 흐름, 전환 | S07 전환 |
| YS05 | 향일암 일출 | 기적, 소원 | S10 피크 (Anchor) |
| YS06 | 빅오 (Big-O) | 시스템, 정답 | S04 확신 |
| YS07 | 아쿠아플라넷 | 호기심, 발견 | S03 |
| YS08 | 진남관 | 역사, 무게감 | S05 |
| YS09 | 종포해양공원 | 산책, 일상 | S08 동행 |
| YS10 | 여수수산시장 | 활기, 군중 | S02 발견 |

---

## 6. 📦 55초 기적영상 제작 지침 (11개 유닛)

### 4단계 기승전결 구조

#### 1단계: 발견과 호기심 (S01~S03)
| Scene | Time | 목적 | 감정 | 여수 배경 |
|-------|------|------|------|-----------|
| S01 | 00-05s | 인트로 훅 | 설렘 | YS01 오동도 |
| S02 | 05-10s | 작은 발견 | 호기심 | YS10 수산시장 |
| S03 | 10-15s | 발견 확장 | 호기심 | YS07 아쿠아플라넷 |

#### 2단계: 시스템과 확신 (S04~S05)
| Scene | Time | 목적 | 감정 | 여수 배경 |
|-------|------|------|------|-----------|
| S04 | 15-20s | 시스템 암시 | 확신 | YS06 빅오 |
| S05 | 20-25s | 확신 강화 | 확신 | YS08 진남관 |

#### 3단계: 동행과 여정 (S06~S08)
| Scene | Time | 목적 | 감정 | 여수 배경 |
|-------|------|------|------|-----------|
| S06 | 25-30s | 동행 시작 | 동행 | YS02 케이블카 |
| S07 | 30-35s | 전환 | 동행 | YS04 돌산대교 |
| S08 | 35-40s | 동행 증명 | 든든함 | YS09 종포해양공원 |

#### 4단계: 기적과 다짐 (S09~S11)
| Scene | Time | 목적 | 감정 | 여수 배경 |
|-------|------|------|------|-----------|
| S09 | 40-45s | 감정 빌드업 | 감동 | YS01 오동도 숲 |
| S10 | 45-50s | 감정 피크 | 벅참 | YS05 향일암 (Anchor) |
| S11 | 50-55s | 아웃트로 | 다짐 | YS03 돌산공원 |

---

## 7. 📝 GPTS 출력 표준 포맷 (6단계)

### 섹션 구성
1. **PRODUCTION SUMMARY**: 타이틀, 포맷, 톤앤매너, 캐릭터 요약
2. **SCENE PLAN**: 씬별 시간, 목적, 감정, 로컬 디테일, 아우룸 상태 (표)
3. **KEYFRAME PROMPTS (Image)**: 이미지 생성용 프롬프트 (TEXT ZERO 포함)
4. **SORA I2V PROMPTS**: 5초 영상 생성용 모션 지시문 (3-Beat 구조)
5. **SUBTITLES + TIMECODES**: 후편집용 자막 (영상엔 넣지 않음)
6. **LOGO SONG BRIEF**: 작곡가 전달용 사운드 가이드

---

## 8. 🎬 Sora I2V 공통 지침

```
Use the provided keyframe image as the only visual reference.
Keep 2D style and character identity perfectly consistent.
Duration: 5 seconds. One continuous shot (NO hard cuts).

Avoid:
- 3D render look, glossy shine, metallic reflections
- Volumetric light, realistic shading, heavy depth blur
- No readable text, no subtitles, no logos

Motion Scale: "Minimal motion" 유지
- Micro-expression (미세 표정)
- Blink (눈 깜빡임)
- Hair flutter (머리카락 흔들림)
- Wind/Light 변화 위주

Camera Move (허용):
- Gentle Push-in (천천히 다가가기)
- Slow Pan (천천히 훑기)
- Hold (멈춤)
```

---

## 9. ✅ 품질 관리 체크리스트 (Disney QC)

### 생성 전 체크
- [ ] Aspect ratio 명시? (9:16 for Reels/Shorts)
- [ ] Resolution 명시? (1080x1920)
- [ ] Duration 명시? (유닛당 5초)
- [ ] STYLE LOCK 포함?
- [ ] TEXT ZERO 명시?
- [ ] CHARACTER LOCK 포함?

### 생성 후 체크
- [ ] 플리커링(Flickering) 없는가?
- [ ] 손가락 5개, 아우룸 다리/등딱지 정상?
- [ ] 감정의 색: PAIN(차가움) → SOLUTION(따뜻함)?
- [ ] 텍스트 제로: 배경 간판/옷에 글자 없는가?
- [ ] 3박자 리듬: 4~5초 홀드 충분한가?

### QC Status 값
| 상태 | 의미 |
|------|------|
| Ready | 생성 대기 |
| Generating | 생성 중 |
| OK | 품질 통과 |
| Retry (Text leak) | 텍스트 누출 - 재생성 |
| Retry (3D artifact) | 3D 느낌 - 재생성 |
| Retry (Motion) | 과도한 움직임 - 재생성 |

---

## 10. 📂 노션 DB 스키마

### Episodes DB (에피소드 마스터)
| 속성 | 타입 | 설명 |
|------|------|------|
| EP ID | Title | 예: EP11, PROMO_12 |
| Title | Text | 에피소드 제목 |
| Status | Select | Ideas → Scripting → Prompt Gen → Generating (KF) → Generating (I2V) → Editing → Done |
| Total Duration(s) | Number | 총 영상 길이 |
| Location Mode | Select | GENERIC / YEOSU |
| Sowoni Preset | Select | 의상 프리셋 |
| Aurum Preset | Select | 상태 프리셋 |

### Scenes DB (씬 단위 제작)
| 속성 | 타입 | 설명 |
|------|------|------|
| Scene ID | Title | 예: EP11-S01 |
| Scene # | Number | 순서 (1, 2, 3...) |
| Timecode | Formula | 자동 계산 |
| BG Preset | Select | GN01~06 / YS01~10 |
| KF Prompt | Text (Long) | 이미지 생성 프롬프트 |
| KF Image | Files | 생성된 키프레임 |
| I2V Prompt | Text (Long) | 영상 생성 프롬프트 |
| I2V Clip | Files | 생성된 5초 영상 |
| QC Status | Select | Ready/Generating/OK/Retry |

---

## 11. 📋 30초 홍보영상 스토리 목록 (#11~#20)

| # | 제목 | PAIN 테마 | 핵심 시각적 은유 |
|---|------|-----------|------------------|
| 11 | 결정을 못 하겠어 | 결정 장애 | 무문자 메뉴판, 갈림길 |
| 12 | 사람이 너무 피곤해 | 만성 피로/관계 피로 | 알림 배지, 케이블카 고립 |
| 13 | 돈이 항상 부족해 | 재정 불안 | 텅 빈 지갑, 닫힌 문 |
| 14 | 건강이 걱정돼 | 건강 경고 | 체중계, 약병 실루엣 |
| 15 | 감정을 어떻게 표현해야 | 감정 억압 | 물에 비친 얼굴, 눈물 |
| 16 | 내가 좋아지지 않아 | 자존감 저하 | 거울, 구겨진 일기 |
| 17 | 변화가 두려워 | 변화 두려움 | 닫힌 문, 열린 창문 |
| 18 | 번아웃 | 극심한 피로 | 꺼진 불, 멈춘 시계 |
| 19 | 미래가 막막해 | 불확실성 | 안개, 흐릿한 길 |
| 20 | 외로워 | 고독 | 빈 벤치, 하나의 컵 |

---

## REVISION HISTORY

| Date | Change | Author |
|------|--------|--------|
| 2026-01-31 | V7.0 마스터 플레이북 생성 (V6.2 기반 + 디즈니 전문가 보완) | Code |

---

*이 플레이북은 2D 애니메이션 영상 제작의 권위 있는 단일 소스입니다.*
*모든 변경 사항은 명시적 승인 후 플레이북 업데이트가 필요합니다.*
