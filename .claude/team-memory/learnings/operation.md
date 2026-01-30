# Learnings - Operation

> 운영 관련 학습 기록

---

## Sora-자막-금지

**일자**: 2025-01-30
**태그**: Sora

### 배움

Sora 영상 프롬프트에 자막/텍스트 관련 명시적 금지 필수

### 문제 상황

- 결과물에 읽히는 자막/문장 삽입됨
- [alarm ringing] 같은 자막형 문구가 실제 자막으로 굳음
- 마스코트가 3D/픽사풍으로 변형됨

### 해결 원칙

- NO subtitles/captions/closed-captions
- NO readable on-screen text (including UI)
- phone UI는 abstract unreadable glyphs only
- 참조: `playbooks/sora_video_master.md`

---

## Sora-마스코트-스타일

**일자**: 2025-01-30
**태그**: Sora

### 배움

마스코트 스타일은 반드시 2D 수채화 고정

### 문제 상황

- 마스코트가 3D/픽사/플러시 스타일로 변형됨

### 해결 원칙

- flat 2D hand-drawn watercolor 고정
- NOT 3D / NOT Pixar / NOT plush
- 참조: `playbooks/sora_video_master.md`

---

## Sora-로고-후편집

**일자**: 2025-01-30
**태그**: Sora

### 배움

로고는 영상에 직접 삽입(bake) 금지, 후편집 overlay로 처리

### 세부사항

- Unit4는 "leave clean negative space for logo overlay" 권장
- 참조: `playbooks/sora_video_master.md`

---

<!-- New operation learnings go above this line -->
