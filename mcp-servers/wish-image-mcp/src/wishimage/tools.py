"""
Wish Image MCP Tools

소원 시각화를 위한 5가지 도구 정의
"""

from typing import Literal
from pydantic import BaseModel, Field


# =============================================================================
# 스타일 정의
# =============================================================================

MiracleStyleType = Literal["miracle_fusion", "miracle_ghibli", "miracle_korean"]

STYLE_PROMPTS = {
    "miracle_fusion": """Beautiful 2D animation combining Studio Ghibli warmth, soft watercolor textures, and Korean manhwa emotional expressions.
Warm Korean seasonal landscape (cherry blossoms, autumn leaves, snow, green fields).
Soft hand-drawn lines with gentle watercolor gradients.
Heartwarming, magical, nostalgic atmosphere.
Unique fusion style - cannot be found anywhere else.
Child-friendly, emotional storytelling visual.
Visualizing the wish: {wish_text}""",

    "miracle_ghibli": """Studio Ghibli inspired 2D animation style.
Warm Korean seasonal backgrounds with Ghibli's signature soft lighting.
Hand-drawn aesthetic similar to Spirited Away and My Neighbor Totoro.
Magical atmosphere, detailed nature elements, nostalgic feeling.
Korean countryside meets Ghibli world.
Visualizing the wish: {wish_text}""",

    "miracle_korean": """Korean webtoon style 2D animation.
Clean lines, vibrant colors, modern Korean aesthetic.
Expressive character emotions, dynamic composition.
Korean urban and traditional backgrounds (cafe, alley, hanok).
Popular Korean manhwa art style with warm storytelling touch.
Visualizing the wish: {wish_text}"""
}

STYLE_INFO = {
    "miracle_fusion": {
        "name": "기적 융합",
        "name_en": "Miracle Fusion",
        "is_premium": False,
        "price": "무료",
        "description": "지브리 + 수채화 + 한국만화 퓨전 스타일"
    },
    "miracle_ghibli": {
        "name": "기적 지브리",
        "name_en": "Miracle Ghibli",
        "is_premium": True,
        "price": "유료",
        "description": "스튜디오 지브리 감성 스타일"
    },
    "miracle_korean": {
        "name": "기적 한국만화",
        "name_en": "Miracle Korean",
        "is_premium": True,
        "price": "유료",
        "description": "한국 웹툰/만화 스타일"
    }
}


def is_premium_style(style: str) -> bool:
    """해당 스타일이 프리미엄 전용인지 확인"""
    return STYLE_INFO.get(style, {}).get("is_premium", False)


def validate_style_access(style: str, is_premium_user: bool) -> tuple[bool, str]:
    """스타일 접근 권한 검증"""
    if not is_premium_style(style):
        return True, ""
    if is_premium_user:
        return True, ""
    style_name = STYLE_INFO.get(style, {}).get("name", style)
    return False, f"'{style_name}' 스타일은 유료 전용입니다. 무료 사용자는 '기적 융합' 스타일만 사용 가능합니다."


def get_style_prompt(style: str, wish_text: str) -> str:
    """스타일별 프롬프트 생성"""
    template = STYLE_PROMPTS.get(style, STYLE_PROMPTS["miracle_fusion"])
    return template.format(wish_text=wish_text)


# =============================================================================
# Input 스키마 정의
# =============================================================================

class GenerateWishImageInput(BaseModel):
    """소원그림 생성 입력"""
    wish_text: str = Field(description="시각화할 소원 텍스트 (한국어)")
    style: MiracleStyleType = Field(default="miracle_fusion", description="이미지 스타일")
    is_premium: bool = Field(default=False, description="유료 사용자 여부")
    size: Literal["1024x1024", "1792x1024", "1024x1792"] = Field(
        default="1024x1024",
        description="이미지 크기 (정사각형/가로형/세로형)"
    )


class EnhanceWishPromptInput(BaseModel):
    """소원 프롬프트 최적화 입력"""
    wish_text: str = Field(description="원본 소원 텍스트 (한국어)")
    style: MiracleStyleType = Field(default="miracle_fusion", description="적용할 스타일")
    add_details: bool = Field(default=True, description="세부 묘사 추가 여부")


class CustomizeWishStyleInput(BaseModel):
    """스타일 변경 입력"""
    wish_text: str = Field(description="소원 텍스트")
    current_style: MiracleStyleType = Field(description="현재 스타일")
    new_style: MiracleStyleType = Field(description="변경할 스타일")
    is_premium: bool = Field(default=False, description="유료 사용자 여부")


class RegenerateWishImageInput(BaseModel):
    """소원그림 재생성 입력"""
    wish_text: str = Field(description="동일한 소원 텍스트")
    style: MiracleStyleType = Field(default="miracle_fusion", description="스타일")
    is_premium: bool = Field(default=False, description="유료 사용자 여부")
    previous_seed: int = Field(default=0, description="이전 시드값 (다른 결과 생성용)")


class GetWishGalleryInput(BaseModel):
    """갤러리 조회 입력"""
    user_id: str = Field(description="사용자 ID")
    limit: int = Field(default=10, description="조회 개수")
    style_filter: MiracleStyleType | None = Field(default=None, description="스타일 필터")


# =============================================================================
# 도구 정의 (5개)
# =============================================================================

TOOLS = [
    {
        "name": "generate_wish_image",
        "description": "소원 텍스트를 아름다운 이미지로 시각화합니다. DALL-E 3을 사용하여 1024x1024 이미지를 생성합니다.",
        "inputSchema": GenerateWishImageInput.model_json_schema()
    },
    {
        "name": "enhance_wish_prompt",
        "description": "소원 텍스트를 DALL-E에 최적화된 영어 프롬프트로 변환합니다. 한국어 → 영어 변환 및 스타일 적용을 포함합니다.",
        "inputSchema": EnhanceWishPromptInput.model_json_schema()
    },
    {
        "name": "customize_wish_style",
        "description": "소원그림의 스타일을 변경합니다. 무료 사용자는 miracle_fusion만 사용 가능합니다.",
        "inputSchema": CustomizeWishStyleInput.model_json_schema()
    },
    {
        "name": "regenerate_wish_image",
        "description": "마음에 들지 않는 소원그림을 다시 생성합니다. 같은 소원, 다른 시드로 새로운 이미지를 만듭니다.",
        "inputSchema": RegenerateWishImageInput.model_json_schema()
    },
    {
        "name": "get_wish_gallery",
        "description": "사용자가 생성한 소원그림 목록을 조회합니다. 스타일별 필터링이 가능합니다.",
        "inputSchema": GetWishGalleryInput.model_json_schema()
    }
]


# =============================================================================
# 도구별 프롬프트 생성 함수
# =============================================================================

def get_tool_prompt(tool_name: str, arguments: dict) -> str:
    """도구별 실행 프롬프트 생성"""

    if tool_name == "generate_wish_image":
        return _generate_wish_image_prompt(arguments)
    elif tool_name == "enhance_wish_prompt":
        return _enhance_wish_prompt(arguments)
    elif tool_name == "customize_wish_style":
        return _customize_wish_style_prompt(arguments)
    elif tool_name == "regenerate_wish_image":
        return _regenerate_wish_image_prompt(arguments)
    elif tool_name == "get_wish_gallery":
        return _get_wish_gallery_prompt(arguments)
    else:
        raise ValueError(f"Unknown tool: {tool_name}")


def _generate_wish_image_prompt(args: dict) -> str:
    """소원그림 생성 프롬프트"""
    wish_text = args.get("wish_text", "")
    style = args.get("style", "miracle_fusion")
    is_premium = args.get("is_premium", False)
    size = args.get("size", "1024x1024")

    # 권한 검증
    has_access, error_msg = validate_style_access(style, is_premium)
    if not has_access:
        return f"""## 접근 제한

{error_msg}

### 무료로 사용 가능한 스타일
- **기적 융합 (miracle_fusion)**: 지브리 + 수채화 + 한국만화 퓨전

### 프리미엄 업그레이드
유료 구독 시 모든 스타일을 사용할 수 있습니다."""

    # 스타일 프롬프트 생성
    image_prompt = get_style_prompt(style, wish_text)
    style_info = STYLE_INFO.get(style, {})

    return f"""## 소원그림 생성 요청

### 소원
{wish_text}

### 스타일
- **이름**: {style_info.get('name', style)}
- **설명**: {style_info.get('description', '')}

### DALL-E 3 프롬프트
```
{image_prompt}
```

### 이미지 설정
- **크기**: {size}
- **품질**: standard
- **스타일**: natural

### 다음 단계
1. 위 프롬프트로 DALL-E 3 API를 호출하세요
2. 생성된 이미지 URL을 사용자에게 표시하세요
3. 마음에 들지 않으면 `regenerate_wish_image`로 재생성 가능합니다"""


def _enhance_wish_prompt(args: dict) -> str:
    """소원 프롬프트 최적화"""
    wish_text = args.get("wish_text", "")
    style = args.get("style", "miracle_fusion")
    add_details = args.get("add_details", True)

    style_info = STYLE_INFO.get(style, {})

    detail_instruction = ""
    if add_details:
        detail_instruction = """
### 세부 묘사 추가 지침
- 계절감 (벚꽃, 단풍, 눈, 신록)
- 시간대 (아침 햇살, 황혼, 별빛)
- 감정 (희망, 설렘, 평온)
- 환경 (자연, 도시, 판타지)"""

    return f"""## 소원 프롬프트 최적화

### 원본 소원 (한국어)
{wish_text}

### 적용 스타일
{style_info.get('name', style)} ({style})

### 최적화 지침

#### 1. 한국어 → 영어 변환
소원의 핵심 의미를 유지하면서 영어로 번역하세요.

#### 2. 시각적 묘사 추가
추상적인 소원을 구체적인 장면으로 변환하세요.

예시:
- "행복해지고 싶어요" → "A person smiling under warm sunlight in a flower field"
- "성공하고 싶어요" → "A person standing on a mountain peak, looking at the sunrise"
{detail_instruction}

### 스타일 프롬프트 템플릿
```
{STYLE_PROMPTS.get(style, STYLE_PROMPTS['miracle_fusion'])}
```

### 출력 형식
최적화된 영어 프롬프트를 생성하고, DALL-E 3에 바로 사용 가능한 형태로 제공하세요."""


def _customize_wish_style_prompt(args: dict) -> str:
    """스타일 변경 프롬프트"""
    wish_text = args.get("wish_text", "")
    current_style = args.get("current_style", "miracle_fusion")
    new_style = args.get("new_style", "miracle_fusion")
    is_premium = args.get("is_premium", False)

    # 권한 검증
    has_access, error_msg = validate_style_access(new_style, is_premium)
    if not has_access:
        return f"""## 스타일 변경 실패

{error_msg}

### 현재 스타일
{STYLE_INFO.get(current_style, {}).get('name', current_style)}

### 사용 가능한 스타일
| 스타일 | 티어 | 설명 |
|--------|------|------|
| 기적 융합 | 무료 | 지브리+수채화+한국만화 퓨전 |
| 기적 지브리 | 유료 | 스튜디오 지브리 감성 |
| 기적 한국만화 | 유료 | 한국 웹툰 스타일 |

### 프리미엄 업그레이드
유료 구독 시 모든 스타일을 사용할 수 있습니다."""

    current_info = STYLE_INFO.get(current_style, {})
    new_info = STYLE_INFO.get(new_style, {})

    return f"""## 스타일 변경

### 소원
{wish_text}

### 스타일 변경
| 항목 | 이전 | 변경 후 |
|------|------|---------|
| 스타일 | {current_info.get('name', current_style)} | {new_info.get('name', new_style)} |
| 티어 | {current_info.get('price', '무료')} | {new_info.get('price', '무료')} |

### 새로운 스타일 프롬프트
```
{get_style_prompt(new_style, wish_text)}
```

### 다음 단계
위 프롬프트로 새 이미지를 생성하세요."""


def _regenerate_wish_image_prompt(args: dict) -> str:
    """소원그림 재생성 프롬프트"""
    wish_text = args.get("wish_text", "")
    style = args.get("style", "miracle_fusion")
    is_premium = args.get("is_premium", False)
    previous_seed = args.get("previous_seed", 0)

    # 권한 검증
    has_access, error_msg = validate_style_access(style, is_premium)
    if not has_access:
        style = "miracle_fusion"

    style_info = STYLE_INFO.get(style, {})
    new_seed = previous_seed + 1

    return f"""## 소원그림 재생성

### 소원
{wish_text}

### 스타일
{style_info.get('name', style)}

### 재생성 설정
- **이전 시드**: {previous_seed}
- **새 시드**: {new_seed}

### DALL-E 3 프롬프트
```
{get_style_prompt(style, wish_text)}
```

### 힌트
같은 소원이지만 다른 시드를 사용하면 다른 구도, 색감, 세부 묘사의 이미지가 생성됩니다.

### 다음 단계
위 프롬프트로 새 이미지를 생성하세요. 새 시드값({new_seed})을 기록해두세요."""


def _get_wish_gallery_prompt(args: dict) -> str:
    """갤러리 조회 프롬프트"""
    user_id = args.get("user_id", "")
    limit = args.get("limit", 10)
    style_filter = args.get("style_filter", None)

    filter_text = ""
    if style_filter:
        style_info = STYLE_INFO.get(style_filter, {})
        filter_text = f"\n- **스타일 필터**: {style_info.get('name', style_filter)}"

    return f"""## 소원그림 갤러리 조회

### 조회 조건
- **사용자 ID**: {user_id}
- **조회 개수**: {limit}개{filter_text}

### 응답 형식
```json
{{
  "success": true,
  "data": {{
    "user_id": "{user_id}",
    "total_count": 0,
    "images": [
      {{
        "id": "wish_img_001",
        "wish_text": "소원 텍스트",
        "style": "miracle_fusion",
        "image_url": "https://...",
        "created_at": "2025-12-28T10:00:00Z",
        "seed": 12345
      }}
    ]
  }}
}}
```

### 참고
- 갤러리 데이터는 데이터베이스에서 조회합니다
- 이미지 URL은 생성 후 24시간 유효합니다
- 영구 저장이 필요하면 별도 스토리지에 저장하세요"""
