# DEC_2026_0516_CANONICAL_RATIO_3x4
## 결정 아카이브 — Canonical Master 비율 3:4 확정

**결정 날짜**: 2026-05-16  
**결정자**: DreamTown Canonical Foundation v1.0 (루미 통합 지침)  
**레이어**: Decision Archive (Layer 3)  
**연결 문서**: `docs/ssot/constitution/DreamTown_Canonical_Foundation_v1.md` §8

---

## 결정 요약

```yaml
decision:
  canonical_master: "3:4 portrait (1536×2048 이상, 권장 2160×2880)"
  16:9: "파생 — YouTube cinematic crop. 원본 아님."

reason:
  DreamTown 이미지는 완성 결과물이 아니라
  코드가 조합 가능한 감정 기능 원천소스다.
  3:4는 Storybook(3:4), Shorts(9:16), Echo Card(4:5/1:1), YouTube(16:9)
  모든 파생 비율을 커버하는 유일한 원본 비율이다.
  16:9를 원본으로 하면 9:16 세로 파생 시 품질 손실이 발생한다.

avoid:
  16:9-first 생성 (Shorts 품질 손실)
  비율 무관 생성 (파생 경로 막힘)
  "어디인가" 중심 구도 (감정 공기 훼손)
```

## 수정된 기존 문서

이 결정으로 다음 문서가 수정되었다:

| 문서 | 수정 내용 |
|------|----------|
| `air-engine/05_DERIVATION_PIPELINE.md` | 16:9 master → 3:4 portrait master로 교체 |
| `air-engine/06_OUTPUT_STRATEGY.md` | YouTube canonical → YouTube derived로 교체 |
| `plans/PLAN_2026_0516_16x9_CANONICAL_MASTER.md` | 제목 및 오류 경고 추가, Section 6 재작성 예정 |

## 파생 비율 체계 (확정)

```
3:4 canonical_master
  ├── 3:4  → storybook (원본 유지)
  ├── 9:16 → TikTok / Reels / Shorts (세로 크롭)
  ├── 4:5  → Echo Card, Instagram feed
  ├── 1:1  → Echo Card 정방형, SNS
  ├── 4:3  → postcard, 카카오 공유 (가로 크롭)
  └── 16:9 → YouTube cinematic (가로 와이드 크롭)

hamel 예외:
  9:16이 원본 (wish-image 시스템)
  config/wish-image/hamel.json에 명시
```
