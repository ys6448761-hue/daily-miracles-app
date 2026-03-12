# DreamTown Yeosu Travel Routes SSOT

Version: v1.0
Owner: Aurora5
Status: Active
Purpose: Define the Yeosu Galaxy structure — separating the myth layer (worldbuilding) from the operation layer (actual travel products).

Last Updated: 2026-03-09
Updated By: Code (Claude Code)

---

## 1. 목적

이 문서는 **DreamTown의 Yeosu Galaxy 구조에서 세계관(신화 레이어)과 실제 여행 운영(현실 레이어)을 분리하여 정의하는 SSOT 문서**이다.

- 세계관은 확장성과 스토리 자산을 유지한다
- 실제 여행 운영은 접근성·상품성 기준으로 구성한다

---

## 2. 전체 구조

```
DreamTown Universe
        ↓
Yeosu Galaxy
        ↓
Golden Nine Constellation  ← Myth Layer (세계관)
        ↓
Yeosu Travel Routes        ← Operation Layer (운영)
```

---

## 3. Myth Layer — Golden Nine Constellation

Golden Nine Constellation은 여수 금오설화를 기반으로 한 **DreamTown의 신화 구조**이다.

실제 방문 가능 여부와 상관없이 **DreamTown 하늘의 별자리로 존재한다.**

### 구성 (남쪽 → 북쪽)

| 번호 | 이름 | 역할 |
|------|------|------|
| 1 | 백도 | 잠든 거북 수호 별 |
| 2 | 거문도 | 잠든 거북 수호 별 |
| 3 | 사도 | 잠든 거북 수호 별 |
| 4 | 금오도 | 잠든 거북 수호 별 |
| 5 | 향일암 | 잠든 거북 수호 별 |
| 6 | 오동도 | 잠든 거북 수호 별 |
| 7 | 제석산 | 잠든 거북 수호 별 |
| 8 | 신풍 | 잠든 거북 수호 별 |
| 9 | 아우룸 | **움직이는 별 (Navigator)** |

### 구조 의미

```
1~8 : 잠든 거북 수호 별 (고정된 별자리)
  9 : 아우룸 — 여수 은하의 항해자 (움직이는 별)
```

아우룸은 Golden Nine Constellation의 **유일한 이동 가능 별**이다.
그가 움직이는 곳에 DreamTown의 여정이 열린다.

---

## 4. Operation Layer — Yeosu Travel Routes

> TODO: 운영 레이어 상세 내용 추가 필요
> (실제 방문 가능 코스·상품 구조·일정 연동)
> 참조: `DreamTown_Travel_System_SSOT.md`, `DreamTown_Yeosu_Galaxy_SSOT.md`

---

## 5. 코스 구조

> TODO: 각 코스별 신화 레이어 ↔ 운영 레이어 매핑 정의

---

## 6. 상품 연동

> TODO: 항로(주중/별빛/소망/패밀리)와 Golden Nine 별자리 연결 구조

---

## 7. 기적 포인트 (Miracle Points)

> TODO: 각 별자리 포인트에서 기록 가능한 기적 유형 정의

---

## 8. 미래 확장

> TODO: 글로벌 Galaxy 확장 시 Golden Nine 구조 적용 방법

---

## 9. 핵심 세계관 규칙

| 규칙 | 내용 |
|------|------|
| 신화 레이어 불변 | Golden Nine Constellation은 DreamTown 세계관의 고정 자산 |
| 운영 레이어 분리 | 실제 접근 가능 여부와 상관없이 신화는 유지 |
| 아우룸 위치 | 항상 9번째 별 — Navigator로서 유일하게 이동 |

---

## 10. 작성자

Aurora5 Strategic System
LUMI (Data Analyst & System Architect)

---

## 참조

- 여수 은하 상세: `DreamTown_Yeosu_Galaxy_SSOT.md`
- 여행 운영 시스템: `DreamTown_Travel_System_SSOT.md`
- 캐릭터 (아우룸): `DreamTown_Character_SSOT.md`
- 세계관 기반: `DreamTown_Universe_Bible.md`
- 은하 구조: `DreamTown_Galaxy_Mode_SSOT.md`
