# DreamTown SSOT Index

Version: v4.0
Owner: Aurora5
Status: Confirmed
Purpose: SSOT 3계층 구조 — 파일 목록 및 작업 규칙

Last Updated: 2026-03-13

---

## 코드에게 — 작업 전 필독 규칙

**모든 DreamTown 관련 작업은 `core/` 파일을 먼저 읽고 시작한다.**
SSOT와 충돌하는 코드는 작성하지 않는다.
SSOT에 없는 새로운 결정이 생기면 해당 SSOT 파일을 먼저 업데이트한다.

저장 규칙: `AIL-SSOT-001_Storage_Rules.md` 참조
전체 분류표: `SSOT_Registry_v2.md` 참조

---

## 📁 디렉토리 구조

```
docs/ssot/
 ├── core/      ← DreamTown 절대 기준 (헌법) — 14개
 ├── support/   ← 구현·설계·UX 가이드 — 25개
 ├── archive/   ← 중복·구버전 보관 — 47개
 │
 ├── INDEX.md              ← 이 파일
 ├── SSOT_Registry_v2.md   ← 전체 분류표 (v2)
 └── AIL-SSOT-001_Storage_Rules.md  ← 저장 규칙
```

---

## Core SSOT (15개) — `docs/ssot/core/`

**모든 작업 전 필독. CEO 확정 없이 변경 불가.**

| 파일 | 핵심 내용 | 필독 시점 |
|------|----------|----------|
| `SSOT-2026-0413-001_별_고향_로그_세계관.md` | 세계관·역할·흐름 구조 확정 (2026-04-13) | 고향·파트너·로그 작업 전 |
| `SSOT-2026-0413-002_여수_재방문_엔진_및_포인트_구조.md` | 포인트·제휴·수익 구조 확정 (2026-04-13) | 포인트·파트너·제휴 작업 전 |
| `DreamTown_Core_Philosophy_SSOT.md` | 철학 선언 | **모든 작업 전 (0번)** |
| `DreamTown_Universe_Bible.md` | 세계관 전체 | **모든 작업 전** |
| `DreamTown_Universe_Structure_v2_SSOT.md` | 우주 구조 v2 | 세계관 작업 전 |
| `DreamTown_Origin_Myth_SSOT.md` | 여수 금오설화, Golden Nine | 세계관·캐릭터·콘텐츠 전 |
| `DreamTown_Character_SSOT.md` | 소원이·아우룸 상세 정의 | 이미지·영상·UX 전 |
| `DreamTown_Naming_System_SSOT.md` | 공식 용어 (Sowoni/Somangi 등) | 콘텐츠·코드·커뮤니케이션 전 |
| `DreamTown_Visual_Style_SSOT.md` | 색상, 스타일 잠금 | 이미지·영상·UI 전 |
| `DreamTown_Product_Core_Loop_SSOT.md` | 핵심 제품 루프 | 제품 기획·UX 전 |
| `DreamTown_Wish_System_SSOT.md` | 소원 시스템 전체 | 소원·여정·기적 작업 전 |
| `DreamTown_World_Architecture_SSOT.md` | 디지털 용궁 × DreamTown 구조 | **모든 작업 전** |
| `DreamTown_Safety_Ethics_SSOT.md` | 신호등, 금지 조언, 위기 대응 | 안전·윤리 관련 모든 작업 전 |
| `DreamTown_Aurora5_System_SSOT.md` | Aurora5 팀, 메시지 시스템 | AI 동행 시스템 작업 전 |
| `DreamTown_Miracle_System_SSOT.md` | 기적 카드, 기적지수, 별 성장 | 기적·신호등·기적지수 전 |

---

## Support Docs (25개) — `docs/ssot/support/`

**구현 참고 문서. 작업 전 관련 파일 확인.**

| 분류 | 파일 수 |
|------|---------|
| Product / Tech | 9 |
| UX | 6 |
| Galaxy / World | 5 |
| Character / Visual / IP | 5 |

→ 상세 목록: `SSOT_Registry_v2.md` 참조

---

## Archive — `docs/ssot/archive/`

중복·구버전·흡수된 문서 47개 보관.
**삭제하지 않는다. 읽기 전용으로 참고만 가능.**

---

## 향후 SSOT 생성 규칙

새 SSOT 생성 전 반드시 확인:

1. `SSOT_Registry_v2.md`에서 기존 문서 검색
2. 기존 문서 확장 가능 여부 확인
3. Core 필요 시 CEO 승인 필수

**기본 원칙: 새 파일 생성 ❌ → 기존 파일 확장 ✅**

신규 추가 시 분류 기준:
- 세계관·브랜드·철학 기준 → **Core** (CEO 승인)
- 설계·UX·기술·전략 → **Support**
- 중복·구버전·실험 → **Archive**

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0~v1.9 | 2026-03-09 | SSOT Foundation Set 구축 (28개) |
| v3.0 | 2026-03-09 | AIL-SSOT-001 적용 — ssot/13개 + design/ 구조 |
| v3.1 | 2026-03-09 | World_Architecture_SSOT 추가 |
| v4.0 | 2026-03-13 | 3계층 재편 — core/13 + support/25 + archive/47 |
