# OUTPUT_STRATEGY
## 결과물 전략

**문서 코드**: AIR-OUT-006  
**레이어**: Operational SSOT (Layer 2)  
**작성**: 2026-05-16  
**상태**: ACTIVE — 결정 배경: DEC_2026_0516_OUTPUT_STRATEGY.md 참조

---

```yaml
why_this_exists:
  "왜 3:4가 canonical이지?" "왜 YouTube는 파생이지?" 라는 질문이 나오지 않도록.
  3:4 portrait이 canonical인 이유, 각 채널이 어떤 감정 역할을 맡는지를 고정한다.

canonical_ratio_update:
  이전: 16:9 canonical (오류 — 2026-05-16 수정)
  현재: 3:4 portrait canonical (DreamTown_Canonical_Foundation_v1.md §8 기준)
```

---

## 채널별 역할 정의

### Storybook — Canonical Emotional Journey (최우선)
```yaml
role: canonical_primary
format: 3:4 portrait (원본 비율 유지)
purpose: 소원이 한 명의 감정 여정을 5페이지로 전달
content: 5감정 순서대로 Air Seed + 내레이션
length: 5페이지 (자기 페이스로 읽음)
music: 없음 (텍스트 집중)
text_overlay: 감정별 내레이션 (ssot/dreamtown-postcard-emotion-copy-ssot.md)
why: 가장 개인화된 경험. YouTube보다 먼저 소원이와 만나는 접점.
```

### YouTube — Breathing Timeline (3:4 master 파생)
```yaml
role: derived_long_form
format: 16:9 cinematic (3:4 master에서 크롭 — 파생)
purpose: 소원이의 감정 여정을 긴 호흡으로 전달
content: 케이블카 → 카페 → 호텔 → 하멜(Echo) 감정 시퀀스
length: 3-7분 (여운이 남는 충분한 시간)
music: 없음 또는 매우 조용한 앰비언트
text_overlay: 최소 (감정 레이블 정도)
why: 짧은 감정 전달보다 긴 시간 continuity 안에서 살아남는 것이 DreamTown 강점
note: 16:9는 원본이 아님. 3:4 canonical master 크롭 파생.
```

### Shorts — Invitation Fragment (3:4 master 파생)
```yaml
role: derived_short_form
format: 9:16 (3:4 master에서 크롭 — 파생)
purpose: "이런 공기가 있다"는 초대장. Storybook 또는 YouTube로 유인.
content: 단일 감정 1장 + 훅 문장 1줄
length: 15-30초
music: 없음 또는 매우 짧은 사운드
text_overlay: 훅 문장 1줄만
why: Shorts는 시작이 아니다. Storybook / YouTube의 문을 여는 단편이다.
```

### Storybook — Emotional Journey Pages
```yaml
role: primary_product
format: 9:16 (모바일 최적화)
purpose: 소원이 한 명의 감정 여정을 5페이지로 전달
content: 5감정 순서대로 Air Seed + 내레이션
length: 5페이지 (자기 페이스로 읽음)
music: 없음 (텍스트 집중)
text_overlay: 감정별 내레이션 (ssot/dreamtown-postcard-emotion-copy-ssot.md)
why: 가장 개인화된 경험. YouTube보다 먼저 소원이와 만나는 접점.
```

### Postcard — Memory Anchor Artifact
```yaml
role: share_artifact
format: 4:3
purpose: "나 여기 왔어" 기억 인증. 공유 최적화.
content: memory_anchor 이미지 + "저 별은 당신을 기억합니다"
length: 1장
music: 없음
text_overlay: 고정 문구 (변경 불가)
why: 포스트카드는 기억의 물리적 증거. 소원이가 나간 후에도 남는 것.
```

---

## 제작 우선순위

```
1순위: Storybook (접점 — 소원이와 첫 만남)
2순위: Postcard (공유 — 소원이가 주변에 퍼뜨림)
3순위: YouTube (깊이 — 오래 머무는 사람을 위한 공간)
4순위: Shorts (발견 — YouTube로 오는 입구)
```

---

## 절대 금지

| 금지 | 이유 |
|------|------|
| Shorts-first 제작 | Shorts는 파생이다. 원천 없이 파생 불가. |
| YouTube 없이 Shorts 공개 | 링크할 canonical이 없으면 Shorts는 떠다니는 광고 |
| 감정 무시한 비율 변환 | 9:16 크롭이 핵심 감정 요소 잘라내면 무효 |
| memory_anchor 없이 echo_fragment만 | 앵커 없는 파생 = 맥락 없는 콘텐츠 |

---

## 비율-감정 친화도

| 비율 | 가장 잘 담기는 감정 | 이유 |
|------|----------------|------|
| 16:9 | calm, curiosity | 넓은 시야 = 장소 전체가 보임 |
| 9:16 | fragile_hope, pause | 세로 = 소원이 인물 중심, 위로 열린 하늘 |
| 4:3 | calm, fragile_hope | 옛날 사진 비율 = 기억 감각 |
| 1:1 | curiosity | 정방형 = 중심 집중, 별이 가운데 |
