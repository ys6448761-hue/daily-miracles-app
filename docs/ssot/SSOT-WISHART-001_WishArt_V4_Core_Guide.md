---
code: SSOT-WISHART-001
title: WishArt V4 Core Guide (개발 SSOT)
status: LOCKED
owner: Aurora5 / Claude Code
original_source: docs/originals/WishArt-GPTS-V4-Original.md
created: 2026-07-09
layer: LAYER 2 — Operational SSOT
---

# SSOT-WISHART-001 — WishArt V4 Core Guide

> 본 문서는 GPT Prompt가 아니라 **DreamTown WishArt Engine의 공식 설계 문서**다.
> Original(`WishArt-GPTS-V4-Original.md`)을 그대로 복사한 것이 아니라, 개발 가능한 구조로 재구성한 것이다.
> 향후 Claude Code / GPT / GPT Image 2 / Kling / StoryBook / 별빛항로는 모두 이 문서를 기준으로 동작한다.

---

## ① Philosophy

DreamTown WishArt는 **희망 복원 엔진**이다.

- 판단 기준은 "얼마나 예쁜가"가 아니라 "어떻게 평가할 것인가"이다.
- 성공 기준: "이거 나 같아. 더 편안하고 빛나 보여."
- 실패 기준: "이거 누구야?"
- 우선순위(절대 순서): **정체성 > 감정 > 희망 > 미화**
- 미래를 예언하지 않는다.
- DreamTown은 **발견의 이야기**다 — 정답(별/보석별/별공방)을 먼저 보여주지 않는다.
- 공식 서사: **발견 → 응답 → 기록** (소원 → 기적 → 기억)

---

## ② Story Engine (1P/2P/3P 3막 구조)

> ⚠️ **원문 확인 사항**: Original에는 **1P(발견) / 2P(응답) / 3P(기록) 3막 구조만 명시적으로 정의**되어 있다. "4P(참여)" 단계는 이번 Original 텍스트 안에서 발견되지 않았다 — 추측으로 채우지 않는다. 상세는 `REPORT-WishArt_V4_Gap.md` 참조.

### 1P — 발견 (소원을 발견한 순간)
- 등장 가능: 인물, 여수, 미남크루즈, 하멜등대, 바다, 케이블카, 돌산대교, 작은 일반 별(보석별 아님)
- 등장 금지: 부드러운 보석별, 별공방, 별씨앗
- 의미: 아직 응답 전.

### 2P — 응답 (세상이 응답한 순간)
- 등장 가능: 노을, 빛, 꽃, 구름, 바다 반사광, 미남크루즈 조명
- 등장 금지: 부드러운 보석별, 별공방, 별씨앗
- 핵심: 세상이 응답한다. 별은 아직 등장하지 않는다.
- 검수 질문: "1P보다 세상이 달라졌는가?" — NO면 실패.

### 3P — 기록 (소원이 기억이 된 순간)
- 최초 등장: 보석별 → 별씨앗 → 별공방 (이 순서 고정)
- 절대 규칙: **3P 이전에는 등장 금지**

---

## ③ Reveal Rule

> 별(보석별) · 별씨앗 · 별공방은 DreamTown의 "정답"이다. 정답은 3P 이전에 등장하면 안 된다 — "처음부터 있으면 발견이 아니다."

- 등장 순서(절대): **보석별 → 별씨앗 → 별공방**
- 1P/2P: 전부 금지. 3P: 최초 등장.
- **별씨앗 규칙(v1, 실제 제품 기준)**
  - 형태: 노란색 야광 별씨앗, 실물 키링 형태, 5각 둥근 별, 반투명 야광 소재, 메탈 키링 연결
  - 앞면: 텍스트 없음 (금지: "나의 소원", "Wish", "Dream", "Star" 등 문자 삽입)
  - 뒷면: DT 음각 허용
  - 검수: 실제 별씨앗 제품과 동일하게 보이는가
- **별공방 Reveal Rule**: 별공방은 목적지가 아니라 결과다. 1P/2P 금지, 3P 최초 등장.
- **최상위 추가 규칙(v4.0)**
  - 하멜등대: 세로 방향으로 "하멜등대" 표기, 방파제가 육지와 연결된 구조로 표현
  - 2P: 주인공을 사선으로 선 옆모습으로 표현
  - 3P: 미남크루즈가 희망을 품고 바다로 나가는 형태, 주인공은 뒷모습(소원을 기억한다는 의미), 별공방과 별씨앗, 하늘에는 실제처럼 보이는 별을 표현

---

## ④ Identity Lock

- 유지 80~90%: 얼굴형, 눈매, 코, 턱선, 헤어, 안경, 점, 주름 (골격 게이트 = 회춘 방지)
- 금지: V라인 보정, 눈 확대, 모델화
- 나이: -5~10세 범위 내에서만 젊게 (그 이상 금지)
- 검수 기준: "컨디션 좋던 시절처럼 보이나"
- 3대 Lock 중 하나(Identity Lock) — 나머지 둘은 Location Lock(⑥), World Response Lock

---

## ⑤ Emotion Rule

### 보석별별 표정 키
| 별 | 표정 키 |
|---|---|
| 치유의별 | subtle smile of relief, soft heavy-lidded eyes |
| 새출발의별 | resolved, direct calm gaze, firm raised corners |
| 용기의별 | focused bright eyes, upright posture, confident smile |
| 지혜의별 | contemplative, gentle knowing smile, eyes with depth |
| 감사의별 | warm genuine smile, bright eyes, lifted cheeks |

### 표정 표현 규칙
- 감정어(happy, sad 등) 대신 신체 묘사로 표현: `mouth corners raised 3–5°, eyes softly crinkled, cheeks lifted, soft gaze`
- 대체어 예시: gentle optimism / quiet confidence / warm anticipation
- 강도 분기: A(낮음)=눈빛 표현 +10% / B(중간)=+5% / C(높음, 셀카)=**인물 변화 0%, 세상만 변화**

### 감정 항로(미남크루즈 감정 항로 시스템)
장소는 고정(하멜등대/미남크루즈/돌산대교/여수바다/케이블카), **감정만 변한다** — 시간대·하늘·노을·빛·꽃·색감으로 표현.

| 항로 | 시간대 | 색감 |
|---|---|---|
| 감사 항로 | 골든아워 | 황금빛 노을, 따뜻한 오렌지 |
| 치유 항로 | 블루아워 | 청록빛, 고요한 바다 |
| 새출발 항로 | 일출 직전 | 실버블루, 새벽빛 |
| 용기 항로 | 강렬한 석양 | 루비 오렌지, 전진감 |
| 지혜 항로 | 깊은 밤 | 사파이어 블루, 고요한 반사광 |

---

## ⑥ Location Rule

- 여수 오리진 장소는 **이름을 이미지 안에 직접 표기하지 않는다**(하멜등대의 세로 "하멜등대" 표기는 ③ Reveal Rule의 예외 규정). 대신 시각적 특징으로 묘사한다.
- 보석별-장소 매핑: 치유(오동도) / 새출발(여수엑스포역) / 용기(여수해상케이블카) / 지혜(하멜등대) / 감사(이순신광장)
- **Location Lock**: CUT1과 CUT2는 반드시 같은 장소여야 한다.

---

## ⑦ Background Rule

> `SSOT-BG-001_Starlight_Route_Background_Guide`와 연동한다.

### 미남크루즈 오리진 (LOCKED)
8대 필수 요소: 보석별, 빨간 하멜등대(방파제·원통형), 미남크루즈, 여수 밤바다, 케이블카 불빛, 돌산대교, 수채화 꽃, DreamTown 수채화 분위기.
우선순위: 별 → 하멜등대 → 미남크루즈 → 밤바다 → 케이블카 → 돌산대교 → 꽃.
등대 = 희망의 상징 / 크루즈 = 기억의 배 (관광 오브젝트·교통수단 아님).
금지: 흰색·언덕·유럽식 등대, 크루즈의 정박·접안 묘사.

### 캔버스 규칙
9:16 세로. 상단 75% = 핵심 요소(얼굴·별·오리진). 하단 25% = 비움(Kling 크롭용).
하단 금지: 제목·로고·얼굴·손·별 / 하단 허용: 바다·노을·빛·꽃.

### 참여 정보 삽입 규칙
이미지 내부에 참여 순서, QR 플로우, 앱 설명, 아이콘 설명을 삽입하지 않는다(감정 몰입 방해). 오프라인 포스터·배너·행사 안내물에는 허용.

---

## ⑧ Gem Star Rule

| 별 | 보석 | 
|---|---|
| 치유의별 | Emerald |
| 새출발의별 | Diamond |
| 용기의별 | Ruby |
| 지혜의별 | Sapphire |
| 감사의별 | Citrine |

- 별 표현 규칙: 주어는 항상 별이다 (예: "당신의 별이 에메랄드빛으로 빛납니다")
- 별 크기: 전체 화면의 5% 이하, 얼굴보다 작아야 한다. 인물보다 튀면 실패.
- 참고 프롬프트 조각: `one small gemstone star, 5% max, soft glow, no glitter, no sparkle trails`

---

## ⑨ Camera Rule

- 2P: 주인공은 사선으로 선 옆모습 (v4.0 추가 규칙)
- 3P: 주인공은 뒷모습 (소원을 기억한다는 의미, v4.0 추가 규칙)
- CUT1: 원본 사진의 구도(selfie angle, framing, pose)를 그대로 쓰지 않는다 — DreamTown 구도로 재구성한다.
- 인물 비율: CUT1(소원그림) 45~55% / CUT2(기적이미지) 30~40%
- 안전영역: 얼굴·별이 프레임 경계에 잘리지 않아야 한다.

---

## ⑩ Prompt Builder

### 생성 순서(고정)
```
감정 분석 → 별 결정 → 오리진 → CUT 설계 → 프롬프트 → 네거티브 → 5문항 검수
```

### CUT1 (소원그림 — 사람 중심 · 고요)
인물 45~55% / 세상 응답 10~20% / 해 없음 · 빛 고요 · 세상 정지.

### CUT2 (기적이미지 — 세상 중심 · 응답)
인물 30~40% / 세계 60~70% / 인물 변화 0~5% / 세상 변화 95~100%.
응답 순서(고정): **별 → 하늘 → 구름 → 노을 → 바다 → 꽃 → 나무 → 사람**
금지: 나이 변경, 시간 점프, 미래 예언, 다른 장소로 이동.

### 차이값 규칙 / 셔플 테스트
CUT1→CUT2는 "좋은 그림→더 좋은 그림"이 아니라 "고요한 세상→응답한 세상"이어야 한다. 두 컷을 섞어도 즉시 구별되지 않으면 실패.

### 여수 오리진 영어 묘사(이름 직접 표기 금지, 참고 원문 유지 필요)
- 하멜등대: `red cylindrical lighthouse on harbor breakwater, deep blue sea, distant cable car lights`
- 오동도: `camellia path, curved coastal footbridge, stone marker (no legible text)`
- 엑스포역: `open modern plaza, wide sky, new beginning`
- 케이블카: `ascending over night sea, city lights`
- 이순신광장: `lively warm plaza, golden light`

### 수채화 스타일 (얼굴 3D 렌더링 금지)
목표 비율: 웹툰 40% + 수채화 40% + 사실주의 20%.
`2D illustration, hand-painted watercolor, visible paper texture, cel-shaded outlines, Korean webtoon proportions, no 3D shading on face, watercolor washes on skin`
얼굴 3D 방지: 코 = 수채 터치 1~2획 / 눈 = 캐치라이트 과잉 금지 / 볼턱 = 핑크 수채 번짐 / 피부 = 종이 질감 투과 필수.

---

## ⑪ Negative Rule

### 이미지 네거티브 프롬프트(원문 그대로 유지 — 기능적 토큰)
```
photorealistic, 3D render, CGI, plastic skin, V-shaped jaw, enlarged eyes, sharp anime,
oversaturated, toothy grin, glitter, sparkle explosion, multiple stars, fantasy magic,
original photo background, different age, white lighthouse, hilltop lighthouse,
selfie angle preserved
```

### Kling(영상) 네거티브
```
No facial animation. No mouth movement. No eye blinking. No sighing. No deep exhale. Only the world responds.
```

### 금지어(콘텐츠)
사주, 점술, 운세, 팔자, 궁합, 이미지 내 텍스트 삽입, 3D CGI

### 즉시 재생성 트리거
"누구야?" 반응 / 3D CGI 얼굴 / 별·여수 요소 없음 / 강제 미소 / 너무 젊어짐 / CUT1≈CUT2(구별 안 됨) / 하멜등대가 빨강이 아님 / 하단에 얼굴이 걸림

---

## ⑫ QC Rule

### 0단계 — 사진 사전 체크(하드 게이트)
얼굴 너무 작음 / 단체 식별 불가 / 역광 / 가림 / 흔들림 / 정면 정보 부족 → **생성 0회, 즉시 재요청**

### QC 5문항
1. 본인으로 보이는가?
2. 표정이 '좋은 날의 눈빛'인가? (+관계의 온도)
3. 여수 오리진·보석별이 살아 있는가?
4. 캡션 없이 CUT1→CUT2가 응답 전→후로 보이는가? ← **최종 판단**
5. 안전영역 — 얼굴·별이 잘리지 않는가?

### 출고 기준
S급(5/5) / A급(4/5, 단 Q1+Q4는 반드시 PASS) / 그 외 CEO 검토 큐로 이관

### 3·2·1 멈춤 규칙
CUT1 ≤3회, CUT2 ≤2회, 총 ≤5회. 같은 문항이 2연속 NO면 원인별로 분기(예: Q1 실패 → 사진 재요청). **Q1 실패는 하드 게이트.**

---

## ⑬ Product Mapping

> ⚠️ **원문 확인 사항**: Original 텍스트에는 **소원그림(CUT1)과 기적이미지(CUT2)까지만 명시**되어 있다. 기적쇼츠·기적영상·기적스토리북·별빛항로·웹툰·애니메이션으로의 구체적 연결 규칙은 이번 Original 안에 없다 — 추측으로 채우지 않는다. 상세는 `REPORT-WishArt_V4_Gap.md` 참조.

| 산출물 | Original 근거 |
|---|---|
| 소원그림 | CUT1 (사람 중심·고요) |
| 기적이미지 | CUT2 (세상 중심·응답) — "기적영상"의 기반 이미지로 추정되나 원문에 명시적 연결 규칙 없음 |
| CUT3 | "QR/참여 순서 규칙" 절에 이름만 언급됨(CUT1/CUT2/CUT3/기적이미지/소원그림) — 내용 정의 없음 |
| 기적쇼츠 / 기적스토리북 / 별빛항로 영상 / 웹툰 / 애니메이션 | 원문에 규칙 없음(자료 없음) |

---

## ⑭ Engine Flow

```
사진
  ↓
0단계 사진 체크 (하드 게이트)
  ↓
감정 분석
  ↓
별(보석별) 결정
  ↓
오리진(장소) 결정
  ↓
CUT 설계 (1P/2P/3P)
  ↓
Prompt 조립
  ↓
Negative 적용
  ↓
QC 5문항 검수
  ↓
출고 (S급/A급/CEO 검토)
```

---

## Original Source

- 원본: `docs/originals/WishArt-GPTS-V4-Original.md`
- 원본은 수정하지 않는다. 본 문서는 원본을 개발 가능한 구조로 재구성한 것이다.
- 분류/충돌/향후 제안: `docs/reports/REPORT-WishArt_V4_Architecture.md`
- 미구현 항목: `docs/reports/REPORT-WishArt_V4_Gap.md`
