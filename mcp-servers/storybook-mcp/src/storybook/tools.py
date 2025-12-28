"""
Storybook MCP 도구 정의

"하루하루의 기적" 스토리북 MCP 서버
시그니처 스타일 체계: miracle_fusion, miracle_ghibli, miracle_korean

12가지 도구:
[핵심 생성]
1. generate_story_text    - 스토리 텍스트 생성
2. generate_story_image   - 이미지 생성
3. create_storybook       - 전체 스토리북 생성
4. customize_style        - 스타일 변경

[일관성 유지]
5. extract_character      - 캐릭터 특징 추출
6. maintain_consistency   - 일관성 프롬프트 생성

[편의 기능]
7. preview_page           - 페이지 미리보기
8. regenerate_page        - 페이지 재생성
9. change_page_count      - 페이지 수 조절

[출력 관련]
10. export_pdf            - PDF 출력
11. export_video          - 영상 출력
12. add_narration         - 나레이션 추가
"""

from typing import Literal, Optional, List
from pydantic import BaseModel, Field


# ===== "하루하루의 기적" 스타일 정의 =====

# 스타일 타입 정의
MiracleStyleType = Literal["miracle_fusion", "miracle_ghibli", "miracle_korean"]

STYLE_PROMPTS = {
    "miracle_fusion": """Beautiful 2D animation combining Studio Ghibli warmth, soft watercolor textures, and Korean manhwa emotional expressions.
Warm Korean seasonal landscape (cherry blossoms, autumn leaves, snow, green fields).
Soft hand-drawn lines with gentle watercolor gradients.
Heartwarming, magical, nostalgic atmosphere.
Unique fusion style - cannot be found anywhere else.
Child-friendly, emotional storytelling visual.""",

    "miracle_ghibli": """Studio Ghibli inspired 2D animation style.
Warm Korean seasonal backgrounds with Ghibli's signature soft lighting.
Hand-drawn aesthetic similar to Spirited Away and My Neighbor Totoro.
Magical atmosphere, detailed nature elements, nostalgic feeling.
Korean countryside meets Ghibli world.""",

    "miracle_korean": """Korean webtoon style 2D animation.
Clean lines, vibrant colors, modern Korean aesthetic.
Expressive character emotions, dynamic composition.
Korean urban and traditional backgrounds (cafe, alley, hanok).
Popular Korean manhwa art style with warm storytelling touch."""
}

# 스타일 메타정보
STYLE_INFO = {
    "miracle_fusion": {
        "name": "기적 융합",
        "name_full": "하루하루의 기적 시그니처 스타일",
        "description": "지브리 + 수채화 + 한국만화 융합",
        "is_premium": False,
        "price": "무료"
    },
    "miracle_ghibli": {
        "name": "기적 지브리",
        "name_full": "지브리 감성 강조 버전",
        "description": "지브리 애니메이션 스타일 강조",
        "is_premium": True,
        "price": "유료"
    },
    "miracle_korean": {
        "name": "기적 한국만화",
        "name_full": "한국 웹툰 감성 강조 버전",
        "description": "한국 웹툰/만화 스타일 강조",
        "is_premium": True,
        "price": "유료"
    }
}

BLANK_FRAME_PROMPT = """An empty, beautiful frame ready to be filled with dreams and future stories.
Soft, dreamy background with gentle clouds and warm golden light.
Korean traditional paper texture with decorative borders.
Inspiring and hopeful atmosphere, like a blank page waiting for a beautiful story.
Miracle Fusion style - combining Ghibli warmth and Korean aesthetics.
Empty center space with text "여기에 당신의 미래가 그려집니다" in elegant Korean calligraphy."""


# ===== 스토리 프롬프트 템플릿 =====

STORY_PROMPT_TEMPLATE = """당신은 "하루하루의 기적" 스토리북 작가입니다.
{style_name} 스타일로 아동용 스토리북을 작성합니다.

**스타일 특징:**
{style_description}

**주인공 정보:**
- 이름: {name} ({age}세)
- 성격: {personality}
- 취미: {hobby}
- 꿈: {dreamJob}
- 좋아하는 색깔: {favoriteColor}
- 좋아하는 동물: {favoriteAnimal}
- 특별한 기억: {specialMemory}
{character_description}

**중요한 형식 요구사항:**
총 {page_count}개 페이지의 스토리를 작성해주세요.
각 페이지를 정확히 다음과 같은 형식으로 작성해주세요:

## 페이지 1: [제목]
**이미지:** [한 줄로 간단하고 구체적인 장면 묘사 - 영어로 작성]
**스토리:**
[1-2문단의 따뜻한 이야기]

---

## 페이지 2: [제목]
**이미지:** [한 줄로 간단하고 구체적인 장면 묘사 - 영어로 작성]
**스토리:**
[1-2문단의 따뜻한 이야기]

---

(이런 식으로 {page_count}개 페이지까지)

**주의사항:**
- 각 이미지 설명은 영어로 작성
- 한 줄에 50단어 이내로 간단하게
- {style_visual_guide}
- 한국의 사계절 배경 활용
- 주인공 캐릭터 일관성 유지

{page_count}개 페이지의 완전한 이야기를 만들어주세요.
각 페이지는 독립적이면서도 전체적으로 연결되는 아름다운 스토리가 되어야 합니다."""


# ===== 입력 스키마 정의 =====

class StoryTextInput(BaseModel):
    """스토리 텍스트 생성 입력"""
    name: str = Field(description="주인공 이름")
    age: int = Field(description="나이")
    personality: str = Field(description="성격")
    hobby: str = Field(description="취미")
    dreamJob: str = Field(description="꿈/목표")
    favoriteColor: str = Field(description="좋아하는 색깔")
    favoriteAnimal: str = Field(description="좋아하는 동물")
    specialMemory: str = Field(default="", description="특별한 기억 (선택)")
    style: MiracleStyleType = Field(
        default="miracle_fusion",
        description="스타일: miracle_fusion(기적융합-무료), miracle_ghibli(기적지브리-유료), miracle_korean(기적한국만화-유료)"
    )
    page_count: Literal[6, 8, 10, 12] = Field(
        default=10,
        description="페이지 수: 6, 8, 10, 12"
    )


class StoryImageInput(BaseModel):
    """이미지 생성 입력"""
    scene_description: str = Field(description="장면 설명 (영어)")
    style: MiracleStyleType = Field(
        default="miracle_fusion",
        description="이미지 스타일"
    )
    character_reference: str = Field(
        default="",
        description="캐릭터 참조 설명 (일관성 유지용)"
    )


class CreateStorybookInput(BaseModel):
    """전체 스토리북 생성 입력"""
    name: str = Field(description="주인공 이름")
    age: int = Field(description="나이")
    personality: str = Field(description="성격")
    hobby: str = Field(description="취미")
    dreamJob: str = Field(description="꿈/목표")
    favoriteColor: str = Field(description="좋아하는 색깔")
    favoriteAnimal: str = Field(description="좋아하는 동물")
    specialMemory: str = Field(default="", description="특별한 기억")
    style: MiracleStyleType = Field(default="miracle_fusion")
    page_count: Literal[6, 8, 10, 12] = Field(default=10)
    photo_url: str = Field(default="", description="캐릭터 참조 사진 URL (선택)")


class CustomizeStyleInput(BaseModel):
    """스타일 변경 입력"""
    current_story: str = Field(description="현재 스토리 텍스트")
    new_style: MiracleStyleType = Field(
        description="새로운 스타일: miracle_fusion(무료), miracle_ghibli(유료), miracle_korean(유료)"
    )
    is_premium: bool = Field(
        default=False,
        description="유료 사용자 여부. False면 miracle_fusion만 사용 가능"
    )


class ExtractCharacterInput(BaseModel):
    """캐릭터 특징 추출 입력"""
    photo_url: str = Field(description="사진 URL")
    name: str = Field(description="캐릭터 이름")
    age: int = Field(description="나이")


class MaintainConsistencyInput(BaseModel):
    """일관성 유지 프롬프트 생성 입력"""
    character_description: str = Field(description="캐릭터 설명")
    previous_scenes: List[str] = Field(description="이전 장면 설명들")
    style: MiracleStyleType = Field(default="miracle_fusion")


class PreviewPageInput(BaseModel):
    """페이지 미리보기 입력"""
    page_number: int = Field(description="페이지 번호")
    story_text: str = Field(description="스토리 텍스트")
    style: MiracleStyleType = Field(default="miracle_fusion")


class RegeneratePageInput(BaseModel):
    """페이지 재생성 입력"""
    page_number: int = Field(description="재생성할 페이지 번호")
    original_story: str = Field(description="원본 스토리 전체")
    feedback: str = Field(default="", description="수정 요청 사항")
    style: MiracleStyleType = Field(default="miracle_fusion")


class ChangePageCountInput(BaseModel):
    """페이지 수 변경 입력"""
    original_story: str = Field(description="원본 스토리")
    current_count: int = Field(description="현재 페이지 수")
    new_count: Literal[6, 8, 10, 12] = Field(description="새 페이지 수")


class ExportPdfInput(BaseModel):
    """PDF 출력 입력"""
    story_id: str = Field(description="스토리 ID")
    include_text: bool = Field(default=True, description="텍스트 포함 여부")
    layout: Literal["portrait", "landscape", "square"] = Field(
        default="portrait",
        description="페이지 레이아웃"
    )


class ExportVideoInput(BaseModel):
    """영상 출력 입력"""
    story_id: str = Field(description="스토리 ID")
    duration_per_page: int = Field(default=5, description="페이지당 초")
    transition: Literal["fade", "slide", "zoom", "none"] = Field(
        default="fade",
        description="전환 효과"
    )
    background_music: Literal["calm", "adventure", "emotional", "none"] = Field(
        default="calm",
        description="배경 음악"
    )


class AddNarrationInput(BaseModel):
    """나레이션 추가 입력"""
    story_id: str = Field(description="스토리 ID")
    voice: Literal["female_ko", "male_ko", "child_ko"] = Field(
        default="female_ko",
        description="음성 종류: female_ko(여성), male_ko(남성), child_ko(어린이)"
    )
    speed: float = Field(default=1.0, description="속도 (0.5-2.0)")


# ===== 도구 정의 =====

TOOLS = [
    # === 핵심 생성 ===
    {
        "name": "generate_story_text",
        "description": """8가지 입력 정보로 스토리 텍스트를 생성합니다.

입력: 이름, 나이, 성격, 취미, 꿈, 좋아하는 색/동물, 특별한 기억
페이지: 6, 8, 10, 12 중 선택

【하루하루의 기적 스타일】
- miracle_fusion (기적 융합) - 기본값, 무료
  지브리 + 수채화 + 한국만화 융합 스타일
- miracle_ghibli (기적 지브리) - 유료
  지브리 감성 강조 버전
- miracle_korean (기적 한국만화) - 유료
  한국 웹툰 감성 강조 버전

출력: 각 페이지별 제목, 이미지 설명, 스토리 텍스트""",
        "inputSchema": StoryTextInput.model_json_schema(),
    },
    {
        "name": "generate_story_image",
        "description": """장면 설명을 받아 스토리북 이미지를 생성합니다.

입력: 영어 장면 설명, 스타일, 캐릭터 참조
출력: DALL-E 3용 최적화된 프롬프트

【하루하루의 기적 스타일】
- miracle_fusion: 지브리+수채화+한국만화 융합 (기본, 무료)
- miracle_ghibli: 지브리 감성 강조 (유료)
- miracle_korean: 한국 웹툰 스타일 (유료)""",
        "inputSchema": StoryImageInput.model_json_schema(),
    },
    {
        "name": "create_storybook",
        "description": """전체 스토리북을 한 번에 생성합니다.

워크플로우:
1. 캐릭터 정보 분석
2. 스토리 텍스트 생성
3. 각 페이지 이미지 생성 (병렬)
4. 마지막 페이지 (빈 프레임) 생성
5. 결과 통합

【스타일 옵션】
무료: miracle_fusion (기적 융합)
유료: miracle_ghibli, miracle_korean

출력: 스토리 ID, 텍스트, 이미지 URL 목록""",
        "inputSchema": CreateStorybookInput.model_json_schema(),
    },
    {
        "name": "customize_style",
        "description": """기존 스토리의 스타일을 변경합니다.

【권한 체계】
- 무료 사용자 (is_premium=false): miracle_fusion만 사용 가능
- 유료 사용자 (is_premium=true): 3가지 스타일 모두 사용 가능

이미지 설명을 새 스타일에 맞게 수정합니다.
스토리 내용은 유지하면서 시각적 스타일만 변경됩니다.""",
        "inputSchema": CustomizeStyleInput.model_json_schema(),
    },

    # === 일관성 유지 ===
    {
        "name": "extract_character",
        "description": """사진에서 캐릭터 특징을 추출합니다.

분석 대상:
- 얼굴 특징 (눈, 코, 입, 얼굴형)
- 헤어스타일 및 색상
- 체형 및 키
- 특징적인 포인트

출력: 이미지 생성시 사용할 캐릭터 설명 프롬프트""",
        "inputSchema": ExtractCharacterInput.model_json_schema(),
    },
    {
        "name": "maintain_consistency",
        "description": """캐릭터와 배경의 일관성을 유지하는 프롬프트를 생성합니다.

이전 장면들을 분석하여:
- 캐릭터 외모 일관성
- 의상 색상 및 스타일
- 배경 분위기 연속성
- 시간대 및 계절 일관성

을 유지하는 프롬프트를 생성합니다.""",
        "inputSchema": MaintainConsistencyInput.model_json_schema(),
    },

    # === 편의 기능 ===
    {
        "name": "preview_page",
        "description": """특정 페이지 하나만 미리보기로 생성합니다.

전체 스토리북 생성 전에 스타일과 분위기를 확인할 수 있습니다.
빠른 피드백을 위해 단일 페이지만 생성합니다.""",
        "inputSchema": PreviewPageInput.model_json_schema(),
    },
    {
        "name": "regenerate_page",
        "description": """특정 페이지만 새로 생성합니다.

피드백을 반영하여:
- 스토리 내용 수정
- 이미지 스타일 변경
- 장면 구도 조정

다른 페이지는 유지하면서 해당 페이지만 재생성합니다.""",
        "inputSchema": RegeneratePageInput.model_json_schema(),
    },
    {
        "name": "change_page_count",
        "description": """스토리의 페이지 수를 조절합니다.

늘리기: 새로운 장면 추가 (자연스러운 전개)
줄이기: 덜 중요한 장면 병합

스토리 흐름이 자연스럽게 유지됩니다.""",
        "inputSchema": ChangePageCountInput.model_json_schema(),
    },

    # === 출력 관련 ===
    {
        "name": "export_pdf",
        "description": """스토리북을 PDF 파일로 출력합니다.

레이아웃 옵션:
- portrait: 세로형 (책 형태)
- landscape: 가로형 (앨범 형태)
- square: 정사각형 (인스타그램용)

출력: PDF 다운로드 URL""",
        "inputSchema": ExportPdfInput.model_json_schema(),
    },
    {
        "name": "export_video",
        "description": """스토리북을 슬라이드쇼 영상으로 출력합니다.

옵션:
- 페이지당 표시 시간
- 전환 효과 (fade/slide/zoom)
- 배경 음악 선택

출력: MP4 영상 다운로드 URL""",
        "inputSchema": ExportVideoInput.model_json_schema(),
    },
    {
        "name": "add_narration",
        "description": """스토리에 나레이션 음성을 추가합니다.

음성 옵션:
- female_ko: 한국어 여성 음성
- male_ko: 한국어 남성 음성
- child_ko: 한국어 어린이 음성

TTS로 스토리 텍스트를 읽어 영상에 추가합니다.""",
        "inputSchema": AddNarrationInput.model_json_schema(),
    },
]


# ===== 프롬프트 생성 함수 =====

def get_style_name(style: str) -> str:
    """스타일 코드를 한글 이름으로 변환"""
    info = STYLE_INFO.get(style, STYLE_INFO["miracle_fusion"])
    return info["name_full"]


def get_style_short_name(style: str) -> str:
    """스타일 코드를 짧은 한글 이름으로 변환"""
    info = STYLE_INFO.get(style, STYLE_INFO["miracle_fusion"])
    return info["name"]


def get_style_description(style: str) -> str:
    """스타일별 설명 반환"""
    info = STYLE_INFO.get(style, STYLE_INFO["miracle_fusion"])
    return info["description"]


def get_style_visual_guide(style: str) -> str:
    """스타일별 시각적 가이드 반환"""
    guides = {
        "miracle_fusion": "지브리의 따뜻함, 수채화 질감, 한국만화 감정표현을 융합한 장면 묘사",
        "miracle_ghibli": "지브리 스타일의 따뜻하고 마법적인 분위기 묘사",
        "miracle_korean": "한국 웹툰 스타일의 선명하고 역동적인 장면 묘사"
    }
    return guides.get(style, guides["miracle_fusion"])


def is_premium_style(style: str) -> bool:
    """유료 스타일인지 확인"""
    info = STYLE_INFO.get(style, STYLE_INFO["miracle_fusion"])
    return info["is_premium"]


def validate_style_access(style: str, is_premium_user: bool) -> tuple[bool, str]:
    """스타일 접근 권한 검증"""
    if not is_premium_style(style):
        return True, ""

    if is_premium_user:
        return True, ""

    return False, f"'{get_style_short_name(style)}' 스타일은 유료 전용입니다. 무료 사용자는 'miracle_fusion(기적 융합)' 스타일만 사용 가능합니다."


def get_tool_prompt(tool_name: str, arguments: dict) -> str:
    """도구 이름과 인자를 받아 적절한 프롬프트를 반환합니다."""

    # === 핵심 생성 ===
    if tool_name == "generate_story_text":
        style = arguments.get("style", "miracle_fusion")
        page_count = arguments.get("page_count", 10)
        character_desc = arguments.get("character_description", "")

        return STORY_PROMPT_TEMPLATE.format(
            name=arguments.get("name", ""),
            age=arguments.get("age", 0),
            personality=arguments.get("personality", ""),
            hobby=arguments.get("hobby", ""),
            dreamJob=arguments.get("dreamJob", ""),
            favoriteColor=arguments.get("favoriteColor", ""),
            favoriteAnimal=arguments.get("favoriteAnimal", ""),
            specialMemory=arguments.get("specialMemory", ""),
            style_name=get_style_name(style),
            style_description=get_style_description(style),
            style_visual_guide=get_style_visual_guide(style),
            page_count=page_count,
            character_description=f"\n- 캐릭터 특징: {character_desc}" if character_desc else ""
        )

    elif tool_name == "generate_story_image":
        style = arguments.get("style", "miracle_fusion")
        scene = arguments.get("scene_description", "")
        char_ref = arguments.get("character_reference", "")

        style_prompt = STYLE_PROMPTS.get(style, STYLE_PROMPTS["miracle_fusion"])
        char_prompt = f"\nCharacter consistency: {char_ref}" if char_ref else ""

        return f"""# 이미지 생성 프롬프트

## 스타일: {get_style_name(style)}

## 장면 설명:
{scene}

## 스타일 프롬프트:
{style_prompt}
{char_prompt}

## DALL-E 3 설정:
- Size: 1024x1024
- Quality: standard
- Style: natural"""

    elif tool_name == "create_storybook":
        style = arguments.get("style", "miracle_fusion")
        page_count = arguments.get("page_count", 10)
        photo_url = arguments.get("photo_url", "")

        style_info = STYLE_INFO.get(style, STYLE_INFO["miracle_fusion"])
        premium_notice = f"\n⚠️ '{style_info['name']}' 스타일은 유료 옵션입니다." if style_info["is_premium"] else ""

        char_section = ""
        if photo_url:
            char_section = f"""
## Step 1: 캐릭터 분석
사진 URL: {photo_url}
→ extract_character 도구로 캐릭터 특징 추출

"""

        return f"""# 전체 스토리북 생성 워크플로우
{premium_notice}

{char_section}## Step 2: 스토리 텍스트 생성
→ generate_story_text 도구 사용

입력 정보:
- 이름: {arguments.get('name', '')}
- 나이: {arguments.get('age', 0)}세
- 성격: {arguments.get('personality', '')}
- 취미: {arguments.get('hobby', '')}
- 꿈: {arguments.get('dreamJob', '')}
- 좋아하는 색: {arguments.get('favoriteColor', '')}
- 좋아하는 동물: {arguments.get('favoriteAnimal', '')}
- 특별한 기억: {arguments.get('specialMemory', '')}

설정:
- 스타일: {get_style_name(style)} ({style_info['price']})
- 페이지 수: {page_count}

## Step 3: 이미지 생성 (병렬 처리)
각 페이지의 이미지 설명으로 generate_story_image 호출
스타일 프롬프트:
{STYLE_PROMPTS.get(style, STYLE_PROMPTS["miracle_fusion"])}

최대 5개씩 동시 처리

## Step 4: 마지막 페이지 (빈 프레임)
{BLANK_FRAME_PROMPT}

## Step 5: 결과 통합
- 스토리 ID 생성
- 텍스트 + 이미지 URL 매핑
- DB 저장"""

    elif tool_name == "customize_style":
        new_style = arguments.get("new_style", "miracle_fusion")
        current_story = arguments.get("current_story", "")
        is_premium = arguments.get("is_premium", False)

        # 권한 검증
        can_access, error_msg = validate_style_access(new_style, is_premium)

        if not can_access:
            return f"""# ⚠️ 스타일 변경 불가

{error_msg}

## 사용 가능한 스타일:
- miracle_fusion (기적 융합) - 무료
  지브리 + 수채화 + 한국만화 융합 스타일

## 유료 전용 스타일 (프리미엄 구독 필요):
- miracle_ghibli (기적 지브리)
- miracle_korean (기적 한국만화)

프리미엄 구독 후 다시 시도해주세요."""

        style_info = STYLE_INFO.get(new_style, STYLE_INFO["miracle_fusion"])

        return f"""# 스타일 변경

## 새 스타일: {get_style_name(new_style)}
- 유형: {style_info['price']}
- 설명: {style_info['description']}

## 스타일 프롬프트:
{STYLE_PROMPTS.get(new_style, STYLE_PROMPTS["miracle_fusion"])}

## 변경 지침:
1. 각 페이지의 **이미지:** 설명을 새 스타일에 맞게 수정
2. 스토리 내용은 유지
3. 분위기와 색감 설명을 스타일에 맞게 조정

## 원본 스토리:
{current_story}"""

    # === 일관성 유지 ===
    elif tool_name == "extract_character":
        return f"""# 캐릭터 특징 추출

## 분석 대상
- 사진 URL: {arguments.get('photo_url', '')}
- 이름: {arguments.get('name', '')}
- 나이: {arguments.get('age', 0)}세

## 추출할 특징
1. **얼굴 특징**: 눈 모양/색, 코, 입, 얼굴형
2. **헤어스타일**: 길이, 색상, 스타일
3. **체형**: 키, 체격
4. **특징적 포인트**: 안경, 모자, 악세서리 등

## 출력 형식
영어로 작성된 캐릭터 설명 프롬프트
예시: "A 7-year-old Korean child with short black hair, round face, big curious eyes, wearing a yellow dress..."

이 설명은 모든 이미지에 일관되게 적용됩니다.
"하루하루의 기적" 스타일에 맞게 따뜻하고 귀여운 느낌으로 묘사해주세요."""

    elif tool_name == "maintain_consistency":
        style = arguments.get("style", "miracle_fusion")
        char_desc = arguments.get("character_description", "")
        prev_scenes = arguments.get("previous_scenes", [])

        scenes_text = "\n".join([f"- Scene {i+1}: {s}" for i, s in enumerate(prev_scenes)])

        return f"""# 일관성 유지 프롬프트 생성

## 캐릭터 설명
{char_desc}

## 이전 장면들
{scenes_text}

## 스타일
{get_style_name(style)}

## 일관성 체크리스트
1. [ ] 캐릭터 외모 일치
2. [ ] 의상 색상/스타일 유지
3. [ ] 배경 분위기 연속성
4. [ ] 시간대/계절 일관성
5. [ ] 조명/색감 톤 유지
6. [ ] "하루하루의 기적" 스타일 유지

## 출력
다음 장면에 사용할 일관성 유지 프롬프트 생성"""

    # === 편의 기능 ===
    elif tool_name == "preview_page":
        style = arguments.get("style", "miracle_fusion")
        page_num = arguments.get("page_number", 1)

        return f"""# 페이지 {page_num} 미리보기

## 스타일: {get_style_name(style)}

## 스타일 프롬프트:
{STYLE_PROMPTS.get(style, STYLE_PROMPTS["miracle_fusion"])}

## 스토리에서 해당 페이지 추출:
{arguments.get('story_text', '')}

## 작업
1. 페이지 {page_num}의 이미지 설명 추출
2. 스타일 프롬프트 적용
3. 이미지 생성
4. 미리보기 반환"""

    elif tool_name == "regenerate_page":
        style = arguments.get("style", "miracle_fusion")
        page_num = arguments.get("page_number", 1)
        feedback = arguments.get("feedback", "")

        return f"""# 페이지 {page_num} 재생성

## 수정 요청
{feedback if feedback else "특별한 요청 없음 - 새로운 버전 생성"}

## 스타일: {get_style_name(style)}

## 원본 스토리:
{arguments.get('original_story', '')}

## 작업
1. 페이지 {page_num} 내용 분석
2. 피드백 반영하여 수정
3. 새 이미지 설명 생성
4. 이미지 재생성"""

    elif tool_name == "change_page_count":
        current = arguments.get("current_count", 10)
        new = arguments.get("new_count", 10)
        action = "늘리기" if new > current else "줄이기"

        return f"""# 페이지 수 변경: {current} → {new} ({action})

## 원본 스토리:
{arguments.get('original_story', '')}

## 작업
{"새로운 장면 " + str(new - current) + "개 추가 (자연스러운 전개)" if new > current else "덜 중요한 장면 " + str(current - new) + "개 병합"}

## 지침
1. 스토리 흐름 자연스럽게 유지
2. 주요 전환점 보존
3. 각 페이지 분량 균등하게 조정"""

    # === 출력 관련 ===
    elif tool_name == "export_pdf":
        layout = arguments.get("layout", "portrait")
        layouts = {"portrait": "세로형 (책)", "landscape": "가로형 (앨범)", "square": "정사각형"}

        return f"""# PDF 출력

## 스토리 ID: {arguments.get('story_id', '')}

## 설정
- 레이아웃: {layouts.get(layout, '세로형')}
- 텍스트 포함: {arguments.get('include_text', True)}

## 작업
1. 스토리 데이터 로드
2. 이미지 + 텍스트 배치
3. PDF 생성
4. 다운로드 URL 반환"""

    elif tool_name == "export_video":
        return f"""# 영상 출력

## 스토리 ID: {arguments.get('story_id', '')}

## 설정
- 페이지당 시간: {arguments.get('duration_per_page', 5)}초
- 전환 효과: {arguments.get('transition', 'fade')}
- 배경 음악: {arguments.get('background_music', 'calm')}

## 작업
1. 이미지 시퀀스 로드
2. 전환 효과 적용
3. 배경 음악 추가
4. MP4 렌더링
5. 다운로드 URL 반환"""

    elif tool_name == "add_narration":
        voices = {"female_ko": "한국어 여성", "male_ko": "한국어 남성", "child_ko": "한국어 어린이"}
        voice = arguments.get("voice", "female_ko")

        return f"""# 나레이션 추가

## 스토리 ID: {arguments.get('story_id', '')}

## 설정
- 음성: {voices.get(voice, '한국어 여성')}
- 속도: {arguments.get('speed', 1.0)}x

## 작업
1. 스토리 텍스트 로드
2. TTS 변환 (페이지별)
3. 음성 파일 생성
4. 영상에 나레이션 동기화
5. 결과물 반환"""

    else:
        raise ValueError(f"Unknown tool: {tool_name}")
