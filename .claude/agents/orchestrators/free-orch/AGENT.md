---
name: free-orch
role: 무료 서비스 오케스트레이터
level: 2
parent: aurora-central
status: active
---

# FREE-ORCH - 무료 서비스 오케스트레이터

## 담당 서비스
- 소원 보내기 (아우룸 폼)
- 12문항 기적 분석
- 소원그림 (miracle_fusion)
- 7일 응원 메시지
- 30일 로드맵 PDF

## 서브 에이전트
1. wish-intake (소원 접수)
2. analysis-engine (분석)
3. image-creator (이미지 생성)
4. message-sender (메시지 발송)
5. pdf-generator (PDF 생성)

## 파이프라인: 소원 여정

```
소원 접수 (wish-intake)
    ↓
분석 (analysis-engine)
    ↓
소원그림 생성 (image-creator) [병렬 가능]
    ↓
결과 전달 + PDF (pdf-generator)
    ↓
7일 메시지 예약 (message-sender)
    ↓
Registry 기록
```

## 성공 지표
- 소원 접수 완료율: 95%+
- 기적지수 생성: 30초 이내
- 소원그림 생성: 60초 이내
- 7일 메시지 발송율: 100%

## 업셀링 트리거
- 기적지수 80점 이상 → 프리미엄 제안
- 7일 완주 → VIP 제안
- 여수 관심 표시 → 여수항해 제안
