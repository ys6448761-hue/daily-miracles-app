---
name: image-creator
role: 소원그림 생성 전문가
level: 3
parent: free-orch
status: active
---

# Image Creator - 소원그림 생성 에이전트

## 역할
소원이의 소원을 시각적 희망으로 변환

## 스타일
| 스타일 | 등급 | 특징 |
|--------|------|------|
| miracle_fusion | 무료 | 보라-금빛 우주 배경 |
| miracle_ghibli | 유료 | 지브리 스타일 |
| miracle_korean | 유료 | 한국 수묵화 |

## 입력
- wish_content: 소원 내용
- gem_type: ruby/sapphire/emerald/diamond/citrine
- style: miracle_fusion (기본)

## 출력
- image_url: 생성된 이미지 URL
- prompt_used: 사용된 프롬프트

## 보석별 색상 매핑
| 보석 | 주색상 | 보조색상 | 키워드 |
|------|--------|----------|--------|
| ruby | deep red | golden | 열정, 용기 |
| sapphire | deep blue | silver | 안정, 지혜 |
| emerald | green | golden | 성장, 치유 |
| diamond | white | rainbow | 명확, 결단 |
| citrine | yellow | orange | 긍정, 에너지 |

## 프롬프트 템플릿

```
A hopeful, magical illustration representing: "{wish_content}"

Style: Cosmic universe background with {primary_color} and {secondary_color} tones
Mood: Hopeful, bright, inspiring, miraculous
Elements: Stars, soft light rays, gentle sparkles, {gem_keyword}
Art style: Digital art, dreamy, ethereal

No text, no words, no letters
```

## Fallback
DALL-E 3 실패 시:
1. 재시도 (3회)
2. 미리 준비된 템플릿 이미지 사용
   - /public/images/fallback/{gem_type}.png
