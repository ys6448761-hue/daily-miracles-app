# DreamTown One Page Blueprint v1

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: 투자자 / 팀 / 협업 설명용 DreamTown 공용 1페이지 요약

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 1. 한 줄 정의

**DreamTown은 여수 바다에서 시작된 소원을 별로 바꾸고, 그 별들이 은하를 이루는 세계관 기반 탐험 플랫폼입니다.**

---

## 2. 시작점

DreamTown의 Origin은 **여수 바다**입니다.

핵심 문장:

> **"여수 바다에서 시작된 하늘."**

핵심 메시지:

> **"당신의 소원은 혼자가 아닙니다."**

이 구조는 Aurora5 세계관 SSOT의 **여수 Origin / 아우룸 안내자 / 별-별자리-은하 구조**와 맞물립니다.

---

## 3. 핵심 세계관 구조

```
현실 세계
    ↓
여수 바다
    ↓
빛구슬 / 별씨
    ↓
디지털 용궁
    ↓
StarLink
    ↓
DreamTown 하늘
    ↓
별
    ↓
별자리
    ↓
은하
```

DreamTown은 단순 판타지가 아니라
**현실 지형(여수) + 상징(거북 별자리) + 디지털 경험(별 생성)**이 결합된 구조입니다.

---

## 4. 핵심 IP 4개

DreamTown의 IP 코어는 다음 4개입니다.

- **여수 바다**
- **황금 거북 별자리**
- **아우룸(Aurum)**
- **별 탄생 장면(Star Birth Scene)**

이 4개가 DreamTown의 시각적·서사적 중심축입니다.

---

## 5. 제품 핵심 경험

사용자는 DreamTown에서 다음 흐름을 경험합니다.

```
세계관 진입
    ↓
소원 입력
    ↓
별 생성
    ↓
내 별 페이지
    ↓
은하 탐험
```

핵심 질문은 하나입니다.

> **"내 소원이 정말 별이 되었는가?"**

---

## 6. MVP 정의

DreamTown MVP는 아래 4가지를 우선 구현합니다.

- **Wish Gate**: 소원 입력
- **Star Creation**: 별 생성
- **My Star Page**: 내 별 확인
- **Lite Galaxy Exploration**: 은하 미리보기

즉, MVP는 **소원 → 별 → 은하 진입감**까지 보여주는 구조입니다.

---

## 7. 프로토타입 목표

3일 Prototype의 검증 목표는 하나입니다.

> **"사람들이 자기 소원을 별로 만들고 싶어 하는가?"**

프로토타입 범위:

```
소원 입력
    ↓
별 생성
    ↓
내 별 페이지
    ↓
은하 미리보기
```

이건 풀 MVP가 아니라 **핵심 경험 검증판**입니다.

---

## 8. 기술 구조

| 계층 | 기술 |
|------|------|
| Frontend | React |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Animation/UI | Tailwind + Framer Motion |

---

## 9. 데이터 핵심 구조

```
users → wishes → stars → galaxies → constellations
```

핵심 관계:

```
user → wish → star
star → galaxy
galaxy → constellation
```

DreamTown의 DB는 **세계관 구조를 그대로 반영**합니다.

---

## 10. Aurora5 운영 구조

DreamTown은 Aurora5 팀이 역할 분담으로 운영합니다.

| 에이전트 | 담당 |
|----------|------|
| 루미 | 세계관 / SSOT / 전략 |
| Code | 개발 / DB / API / 구현 |
| 코미 | 운영 / 일정 / 실행 정리 |
| 재미 | 비주얼 / 감성 / 연출 |
| 여의보주 | 철학 / 메시지 / 진정성 검수 |

---

## 11. 확장 구조

```
별 생성
    ↓
은하 탐험
    ↓
별 성장
    ↓
커뮤니티
    ↓
여행
    ↓
굿즈 / 콘텐츠 / 애니메이션 IP
```

DreamTown은 **앱 → 플랫폼 → 관광 → IP**로 확장 가능한 구조입니다.

---

## 12. 왜 이 프로젝트가 특별한가

DreamTown은 다음 4개가 동시에 결합된 모델입니다.

```
현실 지형
+
세계관
+
탐험 UX
+
확장형 IP
```

단순 앱이나 단순 여행 상품이 아니라
**현실 기반 세계관 플랫폼**입니다.

---

## 13. 현재 상태

```
세계관 설계      완료 ✓
제품 구조 설계   완료 ✓
DB / API / UX   완료 ✓
Prototype 개발   직전 →
```

**아이디어 단계가 아니라 개발 착수 단계**입니다.

---

## 14. 다음 액션

> **Code가 3일 Prototype을 바로 시작하는 것**

지금은 더 많은 아이디어보다
**첫 번째 실제 별 생성 경험**을 구현하는 것이 최우선입니다.

---

## 참조

- Aurora5 Master Map: `docs/design/DreamTown_Aurora5_Master_Map_Design.md`
- Prototype Kickoff: `docs/design/DreamTown_Prototype_Kickoff.md`
- Build Order: `docs/design/DreamTown_Build_Order_Design.md`
- Universe Bible: `docs/ssot/DreamTown_Universe_Bible.md`
