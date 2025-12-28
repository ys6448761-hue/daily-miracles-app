# Assets

공통 리소스 저장소입니다.

## 폴더 구조

```
assets/
├── images/       # 이미지 파일
├── icons/        # 아이콘
├── templates/    # 문서 템플릿
└── prompts/      # 재사용 프롬프트
```

## 사용법

에이전트나 스킬에서 참조할 때:
```markdown
![icon](../assets/icons/miracle.png)
```

## 네이밍 규칙

- 소문자 + 하이픈: `miracle-icon.png`
- 용도 prefix: `icon-`, `bg-`, `template-`
