# DreamTown Star Share System Design

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: 내 별 공유 시스템 설계 — DreamTown 성장 엔진

Last Updated: 2026-03-12
Updated By: Code (Claude Code)

---

## 핵심 목적

> **사용자가 자신의 별을 이미지 카드로 만들어 SNS에 공유한다**

Star Share는 DreamTown의 **외부 성장 엔진**이다.

---

## 1. 공유 흐름

```
My Star
    ↓
"내 별 공유하기" 버튼
    ↓
Star Card 생성 (이미지)
    ↓
SNS 공유 / 다운로드
```

---

## 2. Star Card 구성

공유 이미지 카드에 포함되는 요소:

```
─────────────────────────────
  DreamTown
─────────────────────────────
  ⭐ [별 이름]

  "[소원 텍스트]"

  [은하 이름] · Day [N]
─────────────────────────────
  당신의 소원은 혼자가 아닙니다.
  dreamtown.app
─────────────────────────────
```

---

## 3. Star Card 디자인 원칙

| 항목 | 기준 |
|------|------|
| 배경 | 어두운 우주 + 별빛 |
| 색상 | DreamTown 컬러 (퍼플·핑크 그라디언트) |
| 별 | 중심에 glow 표시 |
| 텍스트 | 소원 원문 + 위로 문장 |
| 사이즈 | 1080×1080 (Instagram 기본) |
| 로고 | 우측 하단 DreamTown 워터마크 |

---

## 4. 공유 옵션

| 옵션 | 내용 |
|------|------|
| 이미지 저장 | 갤러리 저장 |
| Instagram | 스토리 / 피드 |
| 카카오톡 | 카카오 공유 |
| 링크 복사 | 별 공개 URL |

---

## 5. 공개 별 URL

공유 시 고유 URL 생성:

```
dreamtown.app/star/[star_id]
```

이 페이지에서 보여주는 것:
- 별 카드 (공개 뷰)
- "나도 별 만들기" CTA → Wish Gate 진입

**신규 사용자 유입 경로가 된다.**

---

## 6. 성장 메커니즘

```
기존 사용자  → 내 별 공유
    ↓
SNS 노출
    ↓
신규 사용자  → "나도 별 만들기" 클릭
    ↓
Wish Gate 진입 → 소원 입력 → 새 별 생성
```

Star Share가 DreamTown의 **바이럴 루프**가 된다.

---

## 7. 공유 텍스트 (기본값)

카드와 함께 공유되는 기본 텍스트:

```
내 소원이 DreamTown에서 별이 되었어요 ⭐

[소원 텍스트]

#DreamTown #소원 #별
```

---

## 8. 구현 우선순위

| 단계 | 항목 | 시점 |
|------|------|------|
| MVP | 이미지 저장 + 카카오 공유 | MVP 단계 |
| Beta | Instagram 공유 + 공개 URL | Beta 단계 |
| Launch | 전체 공유 옵션 | Launch |

---

## 9. 기술 구현 메모

| 항목 | 방법 |
|------|------|
| 카드 이미지 생성 | Canvas API (프론트) 또는 Puppeteer (서버) |
| 공개 URL | GET /stars/:id (공개 뷰) |
| 카카오 공유 | Kakao SDK |
| 이미지 저장 | Canvas → blob → download |

---

## 10. 금지 패턴

| 금지 항목 | 이유 |
|-----------|------|
| 소원 전체 공개 (기본값) | 사적인 소원 — 사용자 선택 필요 |
| 강제 공유 유도 | DreamTown 감성 훼손 |
| 게임화 보상 연계 | 공유를 의무처럼 만들면 안 됨 |

공유는 **항상 사용자의 자발적 선택**이어야 한다.

---

## 참조

- My Star UX: `docs/design/DreamTown_My_Star_UX_Master_Design.md`
- Core Loop: `docs/ssot/DreamTown_Product_Core_Loop_SSOT.md`
- Visual Style: `docs/ssot/DreamTown_Visual_Style_SSOT.md`
- Screen Map: `docs/design/DreamTown_Screen_Map_v1.md`
