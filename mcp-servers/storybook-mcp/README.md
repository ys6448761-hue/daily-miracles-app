# Storybook MCP Server

개인화된 AI 스토리북 생성을 위한 MCP 서버입니다.

## 특징

- **5가지 스타일**: 지브리, 수채화, 만화, 실사, 픽셀아트
- **12가지 도구**: 스토리 생성부터 PDF/영상 출력까지
- **캐릭터 일관성**: 사진 기반 캐릭터 추출 및 일관성 유지
- **유연한 페이지 수**: 6, 8, 10, 12페이지 선택 가능

## 도구 목록 (12개)

### 핵심 생성

| 도구 | 설명 |
|------|------|
| `generate_story_text` | 8가지 입력으로 스토리 텍스트 생성 |
| `generate_story_image` | 장면 설명 → 이미지 프롬프트 생성 |
| `create_storybook` | 전체 스토리북 생성 (통합 워크플로우) |
| `customize_style` | 스타일 변경 (지브리↔수채화↔만화 등) |

### 일관성 유지

| 도구 | 설명 |
|------|------|
| `extract_character` | 사진에서 캐릭터 특징 추출 |
| `maintain_consistency` | 일관성 유지 프롬프트 생성 |

### 편의 기능

| 도구 | 설명 |
|------|------|
| `preview_page` | 한 페이지만 미리보기 |
| `regenerate_page` | 특정 페이지 재생성 |
| `change_page_count` | 페이지 수 조절 (6/8/10/12) |

### 출력 관련

| 도구 | 설명 |
|------|------|
| `export_pdf` | PDF 다운로드 링크 생성 |
| `export_video` | 슬라이드쇼 영상 출력 |
| `add_narration` | TTS 나레이션 추가 |

## 스타일 옵션

| 스타일 | 설명 | 예시 |
|--------|------|------|
| `ghibli` | 지브리 애니메이션 (기본) | 토토로, 센과 치히로 |
| `watercolor` | 수채화 느낌 | 부드럽고 몽환적 |
| `comic` | 웹툰/만화 스타일 | 선명하고 역동적 |
| `realistic` | 실사풍 | 사진 같은 디테일 |
| `pixel` | 픽셀아트 | 레트로 게임 스타일 |

## 입력 데이터

| 필드 | 설명 | 필수 |
|------|------|------|
| `name` | 주인공 이름 | ✅ |
| `age` | 나이 | ✅ |
| `personality` | 성격 | ✅ |
| `hobby` | 취미 | ✅ |
| `dreamJob` | 꿈/목표 | ✅ |
| `favoriteColor` | 좋아하는 색깔 | ✅ |
| `favoriteAnimal` | 좋아하는 동물 | ✅ |
| `specialMemory` | 특별한 기억 | ❌ |
| `photo` | 캐릭터 참조 사진 URL | ❌ |

## 설치

```bash
cd mcp-servers/storybook-mcp
uv pip install -e .
```

## 실행

```bash
uv run storybook-mcp
```

## Claude Desktop 연동

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "storybook": {
      "command": "uv",
      "args": [
        "--directory",
        "C:\\path\\to\\daily-miracles-mvp\\mcp-servers\\storybook-mcp",
        "run",
        "storybook-mcp"
      ]
    }
  }
}
```

## 사용 예시

### 스토리북 생성
```
7살 민준이의 스토리북을 만들어줘.
성격: 호기심 많음
취미: 공룡 그리기
꿈: 고생물학자
스타일: 지브리
```

### 스타일 변경
```
이 스토리를 수채화 스타일로 바꿔줘
```

### 페이지 재생성
```
3페이지가 마음에 안 들어.
좀 더 밝은 분위기로 다시 만들어줘.
```

### PDF 출력
```
이 스토리북을 PDF로 만들어줘. 세로형으로.
```

## 테스트

```bash
npx @modelcontextprotocol/inspector uv --directory . run storybook-mcp
```

## 프로젝트 구조

```
storybook-mcp/
├── pyproject.toml
├── README.md
└── src/storybook/
    ├── __init__.py
    ├── server.py      # MCP 서버 메인
    └── tools.py       # 12개 도구 정의
```

## 스타일 프롬프트 (기존 기획 기반)

### 지브리 스타일 (기본)
```
Beautiful, warm, hand-drawn animation style with soft colors and magical atmosphere.
Korean seasonal landscape background. Child-friendly, heartwarming scene.
High quality, detailed artwork similar to Spirited Away or My Neighbor Totoro.
```

### 빈 프레임 (마지막 페이지)
```
An empty, beautiful frame ready to be filled with dreams and future stories.
Korean traditional paper texture with decorative borders.
Text "여기에 당신의 미래가 그려집니다" in elegant Korean calligraphy.
```
