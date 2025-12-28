# Wish Image MCP Server

소원을 아름다운 이미지로 시각화하는 MCP 서버입니다.

## 특징

- **DALL-E 3 연동**: 고품질 1024x1024 이미지 생성
- **3가지 스타일**: 기적 융합, 기적 지브리, 기적 한국만화
- **무료/유료 티어**: 무료는 기적 융합만, 유료는 모든 스타일
- **한국어 지원**: 한국어 소원 → 영어 프롬프트 자동 변환

## 도구 목록 (5개)

| 도구 | 설명 |
|------|------|
| `generate_wish_image` | 소원 텍스트 → 이미지 생성 |
| `enhance_wish_prompt` | 소원 → 최적화된 DALL-E 프롬프트 변환 |
| `customize_wish_style` | 스타일 변경 (무료/유료 체크) |
| `regenerate_wish_image` | 마음에 안 들면 재생성 (다른 시드) |
| `get_wish_gallery` | 생성된 소원그림 목록 조회 |

## 스타일 옵션

| 스타일 | 티어 | 설명 |
|--------|------|------|
| `miracle_fusion` | 무료 | 지브리 + 수채화 + 한국만화 퓨전 |
| `miracle_ghibli` | 유료 | 스튜디오 지브리 감성 |
| `miracle_korean` | 유료 | 한국 웹툰/만화 스타일 |

## 스타일 프롬프트

### miracle_fusion (무료)
```
Beautiful 2D animation combining Studio Ghibli warmth,
soft watercolor textures, and Korean manhwa emotional expressions.
Warm Korean seasonal landscape.
Magical, heartwarming atmosphere.
Visualizing the wish: {wish_text}
```

### miracle_ghibli (유료)
```
Studio Ghibli inspired 2D animation style.
Warm Korean seasonal backgrounds with Ghibli's signature soft lighting.
Magical atmosphere.
Visualizing the wish: {wish_text}
```

### miracle_korean (유료)
```
Korean webtoon style 2D animation.
Clean lines, vibrant colors, modern Korean aesthetic.
Visualizing the wish: {wish_text}
```

## 설치

```bash
cd mcp-servers/wish-image-mcp
uv pip install -e .
```

## 실행

```bash
uv run wish-image-mcp
```

## Claude Desktop 연동

`claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "wish-image": {
      "command": "uv",
      "args": [
        "--directory",
        "C:\\path\\to\\daily-miracles-mvp\\mcp-servers\\wish-image-mcp",
        "run",
        "wish-image-mcp"
      ]
    }
  }
}
```

## 사용 예시

### 소원그림 생성
```
"건강하게 오래 살고 싶어요" 소원을 이미지로 만들어줘
```

### 스타일 변경
```
이 소원그림을 지브리 스타일로 바꿔줘
```

### 재생성
```
마음에 안 들어. 다른 느낌으로 다시 만들어줘
```

## 테스트

```bash
npx @modelcontextprotocol/inspector uv --directory . run wish-image-mcp
```

## 프로젝트 구조

```
wish-image-mcp/
├── pyproject.toml
├── README.md
└── src/wishimage/
    ├── __init__.py
    ├── server.py      # MCP 서버 메인
    └── tools.py       # 5개 도구 정의
```

## API 연동 (실제 구현 시)

```python
from openai import OpenAI

client = OpenAI()

response = client.images.generate(
    model="dall-e-3",
    prompt=enhanced_prompt,
    size="1024x1024",
    quality="standard",
    style="natural",
    n=1
)

image_url = response.data[0].url
```

## 다음 개발 계획

- [ ] 실제 DALL-E 3 API 호출 구현
- [ ] 이미지 저장/캐싱 기능
- [ ] 갤러리 데이터베이스 연동
- [ ] 이미지 다운로드 기능
