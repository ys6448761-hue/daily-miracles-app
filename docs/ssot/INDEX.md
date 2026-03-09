# DreamTown SSOT Index

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: SSOT 파일 목록 및 작업 규칙

Last Updated: 2026-03-09

---

## 코드에게 — 작업 전 필독 규칙

**모든 DreamTown 관련 작업은 아래 SSOT 파일을 먼저 읽고 시작한다.**
SSOT와 충돌하는 코드는 작성하지 않는다.
SSOT에 없는 새로운 결정이 생기면 해당 SSOT 파일을 먼저 업데이트한다.

---

## SSOT 파일 목록

| 파일 | 용도 | 필독 시점 |
|------|------|----------|
| `DreamTown_Universe_Bible.md` | 세계관, 핵심 개념, 여정 구조 | 모든 작업 전 |
| `DreamTown_Character_SSOT.md` | 소원이·아우룸 캐릭터 정의 | 이미지·영상·웹툰 제작 전 |
| `DreamTown_Product_Structure_SSOT.md` | 상품 구조, 가격, 번들 | 상품 관련 작업 전 |
| `DreamTown_Galaxy_Mode_SSOT.md` | 여행 항로 체계, 견적 시스템 | 여행 상품 작업 전 |
| `DreamTown_Visual_Style_SSOT.md` | 스타일 잠금, 색상, 기술 스펙 | 이미지·영상·UI 작업 전 |

---

## 작업(Task) 규칙

- 작업 파일 위치: `docs/tasks/`
- 작업 파일은 SSOT를 복사하지 않는다 → SSOT 파일을 참조(링크)한다
- 작업 완료 후 SSOT 업데이트가 필요하면 먼저 SSOT를 수정한다

### 작업 파일 헤더 템플릿
```markdown
# Task: {작업명}

SSOT 참조:
- Universe: docs/ssot/DreamTown_Universe_Bible.md
- (관련 SSOT 파일 링크)

Status: TODO / IN_PROGRESS / DONE
Created: YYYY-MM-DD
```

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-03-09 | 최초 생성 (Code) |
