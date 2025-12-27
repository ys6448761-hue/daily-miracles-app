---
name: roadmap-generator
description: 기적지수 분석 결과를 기반으로 30일 맞춤 PDF 로드맵 생성
version: 1.0.0
trigger: "로드맵 만들어줘"
---

# Roadmap Generator 스킬

## 🎯 역할

miracle-analyzer의 분석 결과를 받아:
1. **30일 맞춤 로드맵** PDF 생성
2. 일별 미션 및 체크리스트 포함
3. 동기부여 문구 삽입

## 📥 입력

```json
{
  "name": "소원이 이름",
  "wish": "소원 내용",
  "miracleIndex": 78,
  "indicators": {...},
  "recommendation": "맞춤 추천"
}
```

## 📤 출력

```json
{
  "pdfUrl": "https://..../roadmap.pdf",
  "roadmap": {
    "week1": ["Day1 미션", "Day2 미션", ...],
    "week2": [...],
    "week3": [...],
    "week4": [...]
  },
  "dailyQuotes": ["명언1", "명언2", ...]
}
```

## 📋 PDF 구성

1. **표지**: 소원이 이름 + 기적지수
2. **분석 요약**: 5대 지표 레이더 차트
3. **30일 캘린더**: 일별 미션 체크리스트
4. **주간 마일스톤**: 4주 목표
5. **응원 메시지**: 마무리 문구

## ⚡ 속도 기준

- 목표: 24초
- 최대: 30초

## 🔗 의존

← miracle-analyzer (분석 결과)
→ message-dispatcher (PDF 발송)
