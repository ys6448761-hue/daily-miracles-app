# DreamTown 온라인–오프라인 통합 파이프라인

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: 온라인/오프라인 소원 수집 → 용궁 → 별 탄생 전체 운영 파이프라인

Last Updated: 2026-03-10
Updated By: Code (Claude Code)

---

## 핵심 구조

```
현실 소원
    ↓
전달 매개체 (온라인: 빛구슬 / 오프라인: 종이비행기)
    ↓
디지털 용궁 저장
    ↓
별씨앗 생성
    ↓
StarLink 승급
    ↓
DreamTown 별 탄생
```

---

## 전달 매개체 대응표

| 구분 | 전달 매개체 |
|------|-----------|
| 온라인 | 빛구슬 |
| 오프라인 | 종이비행기 |

---

## 1. 온라인 소원 파이프라인

### 시스템 흐름
```
소원 입력 → 빛구슬 생성 → 아우룸에게 보내기
→ 디지털 용궁 도착 → 별씨앗 생성 → StarLink → DreamTown 별
```

### 사용자 경험 흐름
```
"소원을 남겨보세요"
    ↓
빛구슬 생성
    ↓
아우룸 등장 + 빛구슬이 바다로 내려감
    ↓
"당신의 소원이 용궁에 보관되었습니다"
    ↓ (승급 조건 충족 시)
"당신의 소원이 별로 떠올랐습니다"
```

---

## 2. 오프라인 소원 파이프라인

### 시스템 흐름
```
소원엽서 작성 → 종이비행기 접기 → 소원 비행기 날리기
→ 디지털 용궁 저장 → 별씨앗 생성 → StarLink → DreamTown 별
```

---

## 3. Dragon Palace 소원 상태 관리

```
WISH_STATE

SEALED  — 용궁 보관 상태 (기본)
    ↓
SEED    — 별씨앗 상태 (승급 후보)
    ↓
STAR    — DreamTown 공개 상태 (별 탄생)
```

### Dragon Palace 데이터 구조
```
DragonPalaceArchive
├─ WishRaw
├─ StorySeed
├─ ReactionSignal
└─ WisdomSignal
```

---

## 4. StarLink 승급 조건

| 조건 | 내용 |
|------|------|
| 스토리 구조 완성 | 소원→항해→깨달음→나눔 구조 |
| 공개 동의 | 사용자 동의 확인 |
| 공감 반응 | 기적나눔 / 지혜나눔 수신 |
| 큐레이션 선정 | Aurora5 가이드 선정 |

---

## 5. 오프라인 체험 3종

### ① 소원항해단 체험 (가이드형)
```
소원엽서 → 종이비행기 → 용궁 저장 → 스토리북 → DreamTown 연결
```
결과물: 스토리북 / 별 카드 / QR 링크

### ② 개인 체험
```
소원엽서 → 종이비행기 → 용궁 저장
```
결과물: 소원그림 / 용궁 보관증 / QR 링크

### ③ 관광형 소원 체험
```
관광지 사진 → 소원 입력 → AI 소원그림 생성 → 용궁 저장
```
결과물: 소원그림 카드 / 여행 기념 카드 / DreamTown 링크

---

## 6. 콘텐츠 산출물 3단계

| 단계 | 산출물 | 용도 |
|------|--------|------|
| 기본형 | 소원그림 / 별 카드 / 용궁 보관증 | 일반 체험 |
| 중간형 | 스토리북 (소원→항해→별탄생→나눔) | 소원항해단 |
| 프리미엄형 | 영상 | 캠페인 / 홍보 / 특별 사례 |

---

## 7. DreamTown 핵심 UX 문장

> **모든 소원은 먼저 디지털 용궁에 닿습니다.
> 온라인의 소원은 빛구슬이 되어, 오프라인의 소원은 종이비행기가 되어 바다로 향합니다.
> 용궁에 보관된 소원은 별씨앗이 되고,
> StarLink를 타고 DreamTown의 별로 떠오릅니다.**

---

## 참조

- 세계 아키텍처: `docs/ssot/DreamTown_World_Architecture_SSOT.md`
- 아우룸 UX: `docs/design/DreamTown_Aurum_UX_Design.md`
- Dragon Palace DB: `docs/design/DreamTown_DragonPalace_DB_Design.md`
- 별 탄생 정책: `docs/design/DreamTown_Star_Birth_Policy_Design.md`
