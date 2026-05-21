# DERIVATION_PIPELINE
## 공기 파생 파이프라인

**문서 코드**: AIR-PIPE-005  
**레이어**: Operational SSOT (Layer 2)  
**작성**: 2026-05-16  
**상태**: ACTIVE

---

```yaml
why_this_exists:
  Canonical Air Seed 1장에서 어떻게 파생 결과물이 만들어지는지
  단계별 구조를 고정한다.
  다음 담당자가 "왜 3:4부터 시작하지?"라는 질문 없이 바로 작업할 수 있도록.

canonical_ratio_update:
  이전: 16:9 master (오류 — 2026-05-16 수정)
  현재: 3:4 portrait master (DreamTown_Canonical_Foundation_v1.md §8 기준)
  근거: "16:9는 원본이 아니라 파생"
```

---

## 파이프라인 구조

```
Canonical Air Seed (public/images/star-cache/ or thumbnails/generated/full/)
        │
        │  [1단계: 비율 마스터 생성]
        ▼
  3:4 Portrait Master
  (canonical — 1536×2048 이상, 권장 2160×2880)
        │
        ├──────────────────────────────────────────────────┐
        │                    │                            │
        │  [2a: 스토리북]    │  [2b: Shorts/Reels]       │  [2c: YouTube]
        ▼                    ▼                            ▼
  Storybook (3:4)      9:16 crop            16:9 cinematic crop
  config/storybook/    (vertical)           (파생 — 원본 아님)
  locations/{loc}.json
        │
        │  [2d: Echo Card]   [2e: 포스트카드]
        ▼                    ▼
  4:5 or 1:1 crop      4:3 crop
  (social)             (카카오 공유)

                            │
                [3단계: 캡션/텍스트 오버레이]
                            │
                Output (공개 배포 가능)
```

---

## 비율 정의

| 비율 | 이름 | 용도 | 원천 |
|------|------|------|------|
| **3:4** | **canonical_master** | **Storybook 원본, 생성 기준** | **Air Seed 직접 파생 — CANONICAL** |
| 9:16 | shorts_fragment | TikTok, Reels, Shorts | 3:4 master에서 크롭 |
| 4:5 또는 1:1 | echo_card | Echo Card, SNS | 3:4 master에서 크롭 |
| 4:3 | memory_snapshot | 포스트카드, 카카오 공유 | 3:4 master에서 크롭 |
| 16:9 | youtube_derived | YouTube | 3:4 master에서 cinematic 크롭 (파생) |

**핵심 규칙**: 9:16, 4:5, 1:1, 4:3, 16:9 — 모두 3:4 master를 크롭한다. 독립 생성 금지.  
**hamel 예외**: wish-image는 9:16 portrait이 원본. 별도 시스템으로 독립 운영.

---

## 파생 착수 조건

| 결과물 | 착수 조건 | 원천 클래스 |
|--------|----------|------------|
| storybook | echo_potential: high | memory_anchor, echo_fragment |
| miracle_video | 해당 location 25장 완성 | echo_fragment만 |
| shorts | echo_potential: high or medium | echo_fragment, transitional_air |
| postcard | 즉시 가능 | memory_anchor 우선 |

---

## 감정별 파생 순서 (추천)

세트 1장씩 착수할 때 이 순서를 따른다:

```
1. calm (memory_anchor)  → postcard 먼저
2. fragile_hope (echo_fragment)  → miracle_video / storybook 클라이맥스
3. curiosity (echo_fragment)  → storybook 전개 / shorts
4. pause (transitional_air)  → storybook 전환 프레임
5. confusion (transitional_air)  → storybook 오프닝
```

---

## 텍스트 오버레이 규칙

파생 단계에서 텍스트 추가 시:

- **postcard**: "저 별은 당신을 기억합니다" (고정, 변경 불가)
- **storybook**: 감정별 내레이션 텍스트 (dreamtown-postcard-emotion-copy-ssot.md 참조)
- **shorts**: 짧은 훅 문장 1줄 (06_OUTPUT_STRATEGY 참조)
- **miracle_video**: 자막 없음 (영상 + 음악만)

---

## 현재 파이프라인 상태 (2026-05-16)

| 단계 | 상태 |
|------|------|
| Air Seed 생성 | cablecar ✓ / cafe ✓ / hotel ✓ / hamel ✗ (1/25) |
| 16:9 master 생성 | 미착수 |
| storybook config | cablecar ✓ / 나머지 미완 |
| postcard 공개 경로 | 존재 (public/images/thumbnails/) |
| miracle_video | 미착수 |
| shorts | 미착수 |
