---
name: 기적영상
description: 소원이의 스토리를 2D 애니메이션 영상으로 제작
category: content
status: planning
mcp_server: storybook-mcp
tools:
  - export_video
  - add_narration
style_options:
  - miracle_fusion (무료)
  - miracle_ghibli (유료)
  - miracle_korean (유료)
---

## 개요

**기적영상**은 소원이의 스토리북을 기반으로 30초~2분 길이의 2D 애니메이션 영상을 제작하는 서비스입니다.

스토리북의 이미지에 전환 효과, 나레이션, 배경음악을 더해 감동적인 영상으로 변환합니다.

## 대상

- 스토리북을 영상으로 만들고 싶은 분
- SNS 공유용 짧은 영상이 필요한 분
- 가족/친구에게 선물하고 싶은 분
- 기념일 영상을 원하는 분

## 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `storybook_id` | string | O | 스토리북 ID |
| `duration` | number | O | 영상 길이 (30/60/90/120초) |
| `style` | string | X | 스타일 (기본: miracle_fusion) |
| `narration` | boolean | X | 나레이션 추가 여부 |
| `voice_type` | string | X | 나레이션 목소리 (female/male) |
| `bgm` | string | X | 배경음악 선택 |

## 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| `video_url` | string | MP4 영상 URL |
| `thumbnail_url` | string | 썸네일 이미지 URL |
| `duration` | number | 실제 영상 길이 (초) |
| `file_size` | string | 파일 크기 |
| `expires_at` | string | URL 만료 시간 |

## 흐름

```
1. 스토리북 로드
   ↓
2. 영상 스크립트 생성
   - 페이지별 시간 배분
   - 전환 효과 선택
   ↓
3. 나레이션 생성 (선택)
   - TTS로 스토리 텍스트 변환
   - 음성 파일 생성
   ↓
4. 배경음악 선택
   - 분위기에 맞는 BGM
   - 볼륨 조절
   ↓
5. 영상 렌더링
   - 이미지 + 전환 + 나레이션 + BGM 합성
   - MP4 인코딩
   ↓
6. 결과물 반환
   - 영상 URL
   - 썸네일 URL
```

## 영상 구성

### 오프닝 (5초)
- 제목 카드: "{이름}의 이야기"
- 페이드 인
- BGM 시작

### 본편 (가변)
- 각 페이지 균등 배분
- 전환 효과: fade, slide, zoom, dissolve
- 나레이션 싱크

### 엔딩 (5초)
- 마지막 페이지 여운
- 로고: "하루하루의 기적"
- 페이드 아웃

## 배경음악 옵션

| 코드 | 이름 | 분위기 |
|------|------|--------|
| `calm` | 잔잔한 피아노 | 평온, 힐링 |
| `hopeful` | 희망의 오케스트라 | 희망, 성장 |
| `adventure` | 모험의 시작 | 설렘, 도전 |
| `emotional` | 감동의 선율 | 감동, 눈물 |
| `playful` | 즐거운 하루 | 밝음, 유쾌 |

## 가격

| 구분 | 길이 | 스타일 | 나레이션 | 가격 |
|------|------|--------|---------|------|
| 무료 | 30초 | miracle_fusion | X | $0 |
| 베이직 | 60초 | 모든 스타일 | X | 문의 |
| 프리미엄 | 120초 | 모든 스타일 | O | 문의 |

## 기술 스택

| 구성요소 | 기술 |
|----------|------|
| 이미지 로드 | DALL-E 3 생성 이미지 |
| 나레이션 | OpenAI TTS / Google TTS |
| 영상 합성 | FFmpeg |
| 인코딩 | H.264 MP4 |
| 저장소 | Cloud Storage |

## 연동 서비스

- ← `storybook-mcp` (스토리북 이미지)
- → `export_video` (영상 생성)
- → `add_narration` (나레이션 추가)

## 사용 예시

### 기본 영상 생성
```
"민준이의 스토리북을 60초 영상으로 만들어줘"
```

### 풀옵션 영상 생성
```
"스토리북 영상 만들어줘.
- 길이: 120초
- 스타일: miracle_ghibli
- 나레이션: 여성 목소리
- 배경음악: hopeful"
```

## 제한사항

- 스토리북이 먼저 생성되어 있어야 함
- 영상 URL은 24시간 유효
- 동시 렌더링 제한 있음 (유료 우선)

## 다음 개발 계획

- [ ] 실제 FFmpeg 연동 구현
- [ ] TTS API 연동 (OpenAI/Google)
- [ ] Cloud Storage 업로드
- [ ] 렌더링 큐 시스템
- [ ] 진행률 표시
