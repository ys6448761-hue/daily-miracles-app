# DreamTown Air Constitution
## 공기 기반 결과물 생성 엔진 — 운영 헌법

**문서 코드**: AIR-CONST-001  
**버전**: v1.1  
**작성**: 2026-05-16  
**상태**: LOCKED (변경 시 CEO 승인 필요)

```yaml
source_asset_master: 3:4_portrait
```

---

## 1. 선언

DreamTown의 모든 결과물(스토리북, 기적영상, 쇼츠, 포스트카드)은  
**장소 × 감정 × 보석** 3축으로 이미 생성된 "공기(Air)" 이미지에서 파생된다.

새 이미지를 먼저 만드는 것이 아니라,  
**살아남은 공기를 먼저 분류하고, 그 공기에서 파생을 뽑는다.**

---

## 2. 핵심 원칙 5가지

### 원칙 1 — 공기는 폐기하지 않는다
기존 생성 이미지는 1세대 폐기물이 아니다.  
품질이 낮거나 감정 표현이 약하더라도 `weak_survival`로 분류해 보존한다.  
폐기는 Canonical Registry에서 CEO가 직접 `deprecated` 마킹할 때만 가능하다.

### 원칙 2 — 파생은 원천에서만 나온다
새 결과물(스토리북 장면, 쇼츠 프레임, 기적영상 씬)은  
반드시 Registry에 등록된 Canonical Air Seed를 원천(source_id)으로 지정해야 한다.  
원천 미지정 결과물은 공식 결과물로 인정하지 않는다.

### 원칙 3 — 장소는 변경하지 않는다
여수 4대 장소(cablecar / cafe / hamel / hotel)는 Air Seed의 물리적 좌표다.  
장소 시스템 제거, 장소 이름 변경, 장소 통폐합은 금지한다.  
신규 장소 추가는 별도 SSOT 등록 절차를 거친다.

### 원칙 4 — 감정 축은 5개로 고정한다
confusion / pause / calm / curiosity / fragile_hope  
이 5개 감정이 Air Seed의 감정 좌표다.  
새 감정은 Taxonomy 문서에 먼저 정의하고 Registry에 추가 등록해야 한다.

### 원칙 5 — 메타데이터가 곧 이미지다
이미지 파일이 없어도 메타데이터(source_id, location, emotion, gemstone, class)가  
Registry에 있으면 파생 계획을 수립할 수 있다.  
생성 우선순위는 메타데이터 등록 순서를 따른다.

### 원칙 6 — Source Asset Master는 3:4 portrait
모든 신규 생성 이미지의 원본 비율은 **3:4 portrait**이다.

```yaml
source_asset_master: 3:4_portrait
resolution_min: 1536×2048
resolution_recommended: 2160×2880

derivation_ratios:
  storybook:  3:4   # 원본 유지
  shorts:     9:16  # 세로 크롭
  echo_card:  4:5   # 또는 1:1
  postcard:   4:3   # 가로 크롭
  youtube:    16:9  # 와이드 크롭 (파생 — 원본 아님)

exceptions:
  yeosu_hamel_wish_image: 9:16  # wish-image 시스템 독립 운영
```

16:9로 생성하면 Shorts(9:16) 파생 시 품질 손실. 절대 금지.

---

## 3. Air OS 계층 구조

```
┌─────────────────────────────────────────┐
│  Constitution (이 문서) — 운영 원칙      │
├─────────────────────────────────────────┤
│  Echo Physics   — 파생 관계 정의         │
├─────────────────────────────────────────┤
│  Air Taxonomy   — 분류 체계              │
├─────────────────────────────────────────┤
│  Canonical Registry — 소스 목록 + 분류   │
└─────────────────────────────────────────┘
```

상위 계층이 하위 계층을 지배한다.  
Registry 항목이 Constitution 원칙과 충돌하면 Constitution이 우선한다.

---

## 4. 금지 행위

| 금지 | 이유 |
|------|------|
| 기존 75장 일괄 삭제 | 원칙 1 위반 |
| Registry 미등록 이미지로 스토리북 제작 | 원칙 2 위반 |
| 장소명 임의 변경 | 원칙 3 위반 |
| 6번째 감정 무단 추가 | 원칙 4 위반 |
| 이미지 없이 파생 제작 착수 | 원칙 5 정신 위반 |
| `deprecated` 마킹 없이 이미지 파일 삭제 | 원칙 1 위반 |
| 등대를 구도 중심에 배치 | Lighthouse Policy 위반 (아래) |
| 이미지 내 텍스트 렌더링 | 원천 소스 spec 위반 |
| Category D 자산으로 파생 착수 | Registry 무결성 위반 |

---

## 4-A. Lighthouse Policy (2026-05-16 확정)

```yaml
lighthouse_symbolism: suppress
```

등대는 매우 쉽게 희망 / 방향 / 의미 / 상징성으로 읽힌다.  
DreamTown strongest 방향: **symbolic_landmark 아님 — unnoticed_reality**.

```yaml
lighthouse_forbidden:
  - 등대 구도 중심 배치 (정중앙 or 주요 포컬 포인트)
  - 방향을 암시하는 광원 (등대 불빛 = "나아가야 할 곳")
  - cinematic lighthouse framing (극적 하늘 + 등대 조합)
  - 소원이가 등대를 향해 걷는 구도 (여정 서사 강요)
  - 텍스트 이미지 내 렌더링 (지명, 한글 포함)

lighthouse_allowed:
  - 배경 요소로 등대 존재 (비지배적, 작음)
  - 항구의 일반 불빛 중 하나로 인식되는 정도
  - 등대가 없는 해안/항구 구도
```

**적용 범위**: hamel 재생성 + 모든 신규 야외 장소 이미지

---

## 5. 거버넌스

- **Registry 등록**: Code Master (이 Claude 인스턴스)
- **분류 변경**: Code Master + CEO 확인
- `deprecated` 마킹: CEO만 가능
- **파생 승인**: CEO 최종 (base 검수 승인 규칙 동일 적용)

---

## 6. 연결 문서

| 문서 | 경로 |
|------|------|
| Echo Physics | `docs/ssot/air-engine/02_DreamTown_Echo_Physics.md` |
| Air Taxonomy | `docs/ssot/air-engine/03_DreamTown_Air_Taxonomy.md` |
| Canonical Registry (스키마) | `docs/ssot/air-engine/04_DreamTown_Canonical_Air_Registry.md` |
| **Registry v1 Verified** | **`docs/ssot/air-engine/REGISTRY_v1_verified_2026-0516.md`** |
| 기존 장소 SSOT | `docs/ssot/support/DreamTown_Yeosu_Galaxy_SSOT.md` |
| 썸네일 config | `config/thumbnail/*.json` |
| Lighthouse Policy 결정 기록 | `docs/archive/decisions/DEC_2026_0516_CANONICAL_RATIO_3x4.md` |
