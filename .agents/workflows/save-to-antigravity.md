---
description: 생성된 이미지/문서를 C:\DEV\antigravity-notebooklm 에 저장하는 워크플로우
---

# 자료 저장 워크플로우 (antigravity-notebooklm)

사용자가 "antigravity-notebooklm에 저장", "저장소에 저장", "자료 저장" 등을 요청하면 아래 단계를 순서대로 실행합니다.

## 저장 기본 경로

```
C:\DEV\antigravity-notebooklm\
```

## 폴더 구조 규칙

| 콘텐츠 유형 | 저장 폴더 |
|------------|----------|
| 챌린지 영상 이미지/문서 | `challenge-video\` |
| 영상 프롬프트 | `challenge-video\` |
| 릴스/쇼츠 스토리보드 | `challenge-video\` |
| 브랜드/스타일 가이드 | `brand-guide\` |
| 리서치/조사 자료 | `research\` |
| 기타 | `misc\` |

## 실행 단계

1. 저장 대상 폴더가 없으면 생성 (자동)
// turbo
2. 문서 파일(.md)은 해당 폴더에 직접 write_to_file로 저장
// turbo
3. 이미지 파일(.png)은 brain 폴더에서 antigravity-notebooklm으로 복사:
```powershell
$srcDir = "C:\Users\세진\.gemini\antigravity\brain\[conversation-id]"
$dstDir = "C:\DEV\antigravity-notebooklm\[해당 폴더]"
New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
Copy-Item "$srcDir\*.png" -Destination $dstDir -Force
```
// turbo
4. 저장 완료 후 파일 목록을 사용자에게 알림

## 참고사항

- 이미지는 generate_image 도구가 brain 폴더에 자동 저장하므로, 생성 후 위 복사 명령으로 이동
- 문서는 write_to_file로 antigravity-notebooklm 경로에 직접 작성 가능
- 파일명에 날짜 포함 권장: `YYYY-MM-DD_파일명.확장자`
