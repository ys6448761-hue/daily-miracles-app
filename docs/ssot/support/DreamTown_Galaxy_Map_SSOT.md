# DreamTown Galaxy Map SSOT

Version: v1.0
Owner: Aurora5 / 루미
Status: Confirmed
Purpose: DreamTown 별 지도 — 별/별자리/은하/은하군 계층 구조 및 탐험 시스템 기준

Last Updated: 2026-03-11
Updated By: Code (Claude Code)

---

## 개요

이 문서는 DreamTown 우주의 **데이터 분류 체계**다.
Cosmic Map이 우주 구조를 정의한다면, Galaxy Map은 **각 계층의 구성 요소와 분류 기준**을 정의한다.

---

## 1. 4계층 구조

```
Star (개인의 소원 기록)
    ↓
Constellation (비슷한 여정의 모임)
    ↓
Galaxy (테마별 별자리 집합)
    ↓
Galaxy Cluster (대형 지식 도메인)
```

각 계층은 소원이의 경험이 확장되는 단계를 의미한다.

---

## 2. Layer 1 — Star (별)

별은 **개인의 소원 기록**이다.

### 별 구성 요소

| 필드 | 내용 |
|------|------|
| Star Name | 별 이름 (사용자 지정 + 아우룸 축복 — B+C 방식) |
| Sowoni | 소원이 닉네임 |
| Wish | 소원 내용 |
| Journey Logs | 항해 기록 |
| Insight | 깨달음 |
| Impact | 나눔 (기적나눔✨ / 지혜나눔🧠 / 감사나눔🙏 반응) |

### 별 예시

```
⭐ 다시 시작하는 용기
소원이: 바람을걷는사람
Origin: 여수 밤바다
```

---

## 3. Layer 2 — Constellation (별자리)

비슷한 경험의 별들이 모이면 별자리가 된다.

별자리 = **인간 경험의 패턴**

### 기본 별자리 분류

| 별자리 (한글) | 별자리 (영문) | 의미 |
|-------------|--------------|------|
| 새로운 시작 별자리 | Restart Constellation | 다시 시작하는 용기 |
| 치유 별자리 | Healing Constellation | 마음의 회복 |
| 관계 별자리 | Love Constellation | 사랑과 연결 |
| 성장 별자리 | Growth Constellation | 자기 발견 |

### 별자리 생성 조건

- 공통 소원 테마를 가진 별 3개 이상 연결
- 사용자 자유 연결 또는 Aurora5 큐레이션 선정
- 별자리 이름은 연결된 소원이들이 합의하거나 큐레이터가 부여

> 상세 운영: `docs/design/DreamTown_Constellation_System_Design.md`

---

## 4. Layer 3 — Galaxy (은하)

별자리가 모이면 은하가 된다.

### 기본 4대 은하

| 은하 (한글) | 은하 (영문) | DreamTown Compass |
|-----------|-----------|------------------|
| 도전 은하 | Challenge Galaxy | 북쪽 (North) |
| 성장 은하 | Growth Galaxy | 동쪽 (East) |
| 관계 은하 | Relationship Galaxy | 서쪽 (West) |
| 치유 은하 | Healing Galaxy | 남쪽 (South) |

### DreamTown Compass

```
          North — 도전 (Challenge)
               ↑
West — 관계  ←  →  East — 성장
               ↓
          South — 치유 (Healing)
```

---

## 5. Layer 4 — Galaxy Cluster (은하군)

여러 은하가 모여 은하군을 이룬다.

```
Challenge Cluster  (도전 계열 은하 집합)
Growth Cluster     (성장 계열 은하 집합)
Relationship Cluster (관계 계열 은하 집합)
Healing Cluster    (치유 계열 은하 집합)
```

은하군 = **DreamTown 전체 우주 지도**의 최상위 단위

---

## 6. 탐험 흐름 (Exploration Flow)

사용자가 DreamTown에서 경험하는 탐험 여정:

```
소원 입력
    ↓
Star Birth (별 탄생)
    ↓
내 별 확인 (첫 별 생성)
    ↓
별자리 발견 (비슷한 여정 발견)
    ↓
은하 탐험 (테마별 탐색)
    ↓
다른 별 이야기 발견 (소망이의 기록)
    ↓
내 별 성장 (항해 완주 → 별 업그레이드)
```

---

## 7. 은하 확장 로드맵

```
Yeosu Galaxy (여수 은하)  ← Origin / 1차 운영
    ↓
Korea Galaxy (한국 은하)
    ↓
World Galaxy (세계 은하)
```

사용자가 늘어나면 새로운 은하가 자연 생성된다.

| 은하 | 지역 | 상태 |
|------|------|------|
| Yeosu Galaxy | 여수 | 운영 중 |
| Seoul Galaxy | 서울 | 계획 |
| Busan Galaxy | 부산 | 계획 |
| Jeju Galaxy | 제주 | 계획 |
| 해외 은하 | 교토·발리·산토리니 | 장기 |

---

## 8. 전략 포지셔닝

```
현실 지형 (여수 Golden Turtle Field)
+
우주 세계관 (DreamTown Galaxy)
+
커뮤니티 플랫폼 (소원이 공동체)
```

현실 지형 기반 우주 세계관 — **디즈니 + 포켓몬 + 여행 플랫폼** 구조의 융합.

---

## 다음 단계 예정

**DreamTown Star Navigation System** — 중독형 탐험 시스템

사람들이 별자리→은하→은하군을 자연스럽게 탐험하게 만드는 게임화 구조.

---

## 참조

- 우주 지도 구조: `docs/ssot/DreamTown_Cosmic_Map_SSOT.md`
- 세계관 바이블: `docs/ssot/DreamTown_Universe_Bible.md`
- 별자리 운영: `docs/design/DreamTown_Constellation_System_Design.md`
- 우주 확장: `docs/design/DreamTown_Expansion_Universe_Design.md`
- 핵심 철학: `docs/ssot/DreamTown_Core_Philosophy_SSOT.md`
