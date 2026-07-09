# docs/originals — Original Archive

## 목적

`docs/originals/`는 DreamTown(및 Project Phoenix)의 모든 원본 자료를 그대로 보관하는 저장소이다.

원본은 SSOT가 아니다. 원본은 SSOT가 만들어지는 근거다.

```
Original → Research → SSOT → Implementation → Product
```

이 순서를 변경하지 않는다.

---

## 저장 대상

1. **GPT Builder Instructions** — 예: `WishArt-GPTS-V4.md`, `MiracleVideo-GPTS.md`, `DreamTown-Core-GPTS.md`
2. **대표가 작성한 원본 기획** — 예: `DreamTown-Original-Idea.md`
3. **중요한 대화 기록** — 예: `Conversation-2026-07-09-WishArt-V4.md`
4. **원본 Prompt** — 예: `WishArt-Prompt-V4.md`
5. **초기 설계 문서** — 폐기하지 않는다. Archive한다.

---

## 저장 규칙

### 수정 금지
원본은 절대 수정하지 않는다. 필요하면 복사하여 SSOT에서 작업한다.

### 이름 변경 금지
원본 파일명은 가능하면 유지한다.

### 삭제 금지
삭제하지 않는다. Archive한다.

### 버전 추가
새 버전은 기존 파일을 덮어쓰지 않는다.

예)
```
WishArt-GPTS-V1.md
WishArt-GPTS-V2.md
WishArt-GPTS-V3.md
WishArt-GPTS-V4.md
```

---

## SSOT와의 관계

```
원본
  ↓ 복사
SSOT 작성
  ↓
개발
  ↓
Code
```

원본은 절대 변경하지 않는다. SSOT는 원본을 기반으로 작성하되, 원본 자체를 대체하지 않는다.

상세 계층 정의는 `docs/ssot/support/SSOT-DOC-001_Document_Governance.md`를 따른다.
