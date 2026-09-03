# 07_YOUTUBE — YouTube 운영

---

**목적:** DreamTown 영상의 YouTube 업로드/운영 기록.
**역할:** Operations (운영) — 제작(Production)은 여기서 하지 않는다.

## 절대 원칙 — 영상 중복 저장 금지

**이 폴더에는 영상 파일 원본을 저장하지 않는다.** 영상 원본은 항상
`dreamtown-assets/05_FINAL`(Source of Truth)을 참조한다.

이 폴더는 다음만 관리한다:

- 업로드 기록(YouTube 영상 ID, 업로드일, 제목, 설명, 썸네일 여부)
- 공개 범위(공개/비공개/일부공개)
- 재생목록 구성
- 성과 지표(조회수, 참여율 등 — 필요 시)

## 파일명이 아니라 참조로 연결한다

예:

```
Video: DT_S01_P01_TheFirstStep_v1.0.mp4
Source: dreamtown-assets/05_FINAL/DT_S01_P01_TheFirstStep_v1.0.mp4
YouTube ID: (업로드 후 기록)
Status: 미업로드
```

## AI Instructions

- 영상 파일을 이 폴더로 복사하거나 재업로드하지 않는다.
- 새 영상이 필요하면 `dreamtown-assets/03_KLING → 04_DAVINCI → 05_FINAL`
  파이프라인에서 만든다 — 이 폴더에서 만들지 않는다.
- 업로드 기록은 실제 업로드가 일어난 뒤에만 기록한다(추측 기록 금지).
