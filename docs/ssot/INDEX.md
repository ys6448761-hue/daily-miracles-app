# DreamTown SSOT Index

Version: v3.0
Owner: Aurora5
Status: Confirmed
Purpose: SSOT 파일 목록 및 작업 규칙

Last Updated: 2026-03-09

---

## 코드에게 — 작업 전 필독 규칙

**모든 DreamTown 관련 작업은 아래 SSOT 파일을 먼저 읽고 시작한다.**
SSOT와 충돌하는 코드는 작성하지 않는다.
SSOT에 없는 새로운 결정이 생기면 해당 SSOT 파일을 먼저 업데이트한다.

저장 규칙: `AIL-SSOT-001_Storage_Rules.md` 참조

---

## 📁 디렉토리 구조

```
docs/
 ├── ssot/      ← 핵심 기준 (헌법) — 13개 유지
 ├── design/    ← 설계·운영·제작 가이드
 ├── tasks/     ← 실행 작업 기록 (TASK-YYYY-MM-DD-Subject.md)
 └── archive/   ← 미확정 아이디어 보관
```

---

## Core SSOT 파일 목록 (13개)

| 파일 | 용도 | 필독 시점 |
|------|------|----------|
| `DreamTown_Core_Philosophy_SSOT.md` | 철학적 선언, 소원의 의미, DreamTown의 본질 | **모든 작업 전 (0번 문서)** |
| `DreamTown_Universe_Bible.md` | 세계관, 핵심 개념, Galaxy 구조, 창세 신화 요약 | **모든 작업 전** |
| `DreamTown_Origin_Myth_SSOT.md` | 여수 금오설화 기반 창세 신화, Golden Nine, 용궁 삼각 구조 | 세계관·캐릭터·콘텐츠 작업 전 |
| `DreamTown_Character_SSOT.md` | 소원이·아우룸 캐릭터 상세 정의 | 이미지·영상·웹툰 제작 전 |
| `DreamTown_Naming_System_SSOT.md` | 공식 용어 정의 (Sowoni/Somangi/기적나눔 등) | 콘텐츠·코드·커뮤니케이션 전 |
| `DreamTown_Visual_Style_SSOT.md` | 스타일 잠금, 색상, 기술 스펙 | 이미지·영상·UI 작업 전 |
| `DreamTown_Key_Visuals_SSOT.md` | 핵심 비주얼 3장면 (KV-01/02/03) | 비주얼 제작·브랜딩 작업 전 |
| `DreamTown_Wish_System_SSOT.md` | 소원 시스템 전체 구조 (소원→별 성장) | 소원·여정·기적 카드 작업 전 |
| `DreamTown_Miracle_System_SSOT.md` | 기적 카드, 기적지수, 신호등, 별 성장 | 기적·신호등·기적지수 작업 전 |
| `DreamTown_Aurora5_System_SSOT.md` | Aurora5 팀 역할, 메시지 시스템, 기적지수 엔진 | AI 동행 시스템 작업 전 |
| `DreamTown_Safety_Ethics_SSOT.md` | 신호등, 금지 조언, 개인정보, 위기 대응 | 안전·윤리 관련 모든 작업 전 |
| `DreamTown_World_Architecture_SSOT.md` | 디지털 용궁 × DreamTown 통합 구조 — 세계관 중심축 | **모든 작업 전** |
| `AIL-SSOT-001_Storage_Rules.md` | SSOT 저장 규칙 (문서 분류·중복 방지·상태 태그) | 새 문서 생성 전 |
| `INDEX.md` | 이 파일 — 목차 및 규칙 | 항상 |

---

## Design 파일 목록 (docs/design/)

설계·운영·제작 가이드. 핵심 기준이 아닌 **실행 도구**.

| 파일 | 내용 |
|------|------|
| `DreamTown_Galaxy_Mode_SSOT.md` | Galaxy Mode 코스, 아우룸 인터랙션, 견적 시스템, 개발 현황 |
| `DreamTown_Yeosu_Galaxy_SSOT.md` | 여수 4개 코스, 장소별 기적 포인트, 배경 코드 |
| `DreamTown_Yeosu_Travel_Routes_SSOT.md` | Golden Nine 신화 ↔ 운영 레이어 분리 구조 |
| `DreamTown_Travel_System_SSOT.md` | 항로 4종, 호텔, 견적 시스템 |
| `DreamTown_Product_Structure_SSOT.md` | 상품 구조, 가격, 번들 |
| `DreamTown_First_User_Journey_SSOT.md` | 신규 소원이 온보딩 10단계 흐름 |
| `DreamTown_Character_Style_Guide_SSOT.md` | 캐릭터+환경+장면 통합 스타일 가이드 (제작용) |
| `DreamTown_Core_Storyboard_SSOT.md` | 핵심 5장면 IP 구조 (앱·영상·마케팅 제작 기준) |
| `DreamTown_Wish_Image_SSOT.md` | 소원그림 생성 파이프라인, 보석 시스템 |
| `DreamTown_Growth_Film_SSOT.md` | 성장필름 (7일 완주 기념 영상), 바이럴 루프 |
| `DreamTown_Image_Prompts_SSOT.md` | DALL-E/Sora 공식 마스터 프롬프트 6종 |
| `DreamTown_IP_Strategy_SSOT.md` | 상표·저작권·BM특허 보호 로드맵 |

---

## 작업(Task) 규칙

- 작업 파일 위치: `docs/tasks/`
- 형식: `TASK-YYYY-MM-DD-Subject.md`
- 작업 파일은 SSOT를 복사하지 않는다 → 참조(링크)한다

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0~v1.9 | 2026-03-09 | SSOT Foundation Set 구축 (28개) |
| v3.0 | 2026-03-09 | AIL-SSOT-001 적용 — ssot/13개 + design/12개 + archive/ 구조로 정리 |
| v3.1 | 2026-03-09 | DreamTown_World_Architecture_SSOT.md 추가 — 디지털 용궁 중심 세계 구조 확정 |
