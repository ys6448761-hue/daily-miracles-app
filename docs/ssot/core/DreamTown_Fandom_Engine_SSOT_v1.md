# DreamTown 팬덤 엔진 구조 SSOT v1

> **정본 선언일**: 2026-04-09  
> **범위**: Whisper / Recall / Blend / Resonance / Connection / Galaxy Signal  
> **위치**: `docs/ssot/core/DreamTown_Fandom_Engine_SSOT_v1.md`

---

## 결론 1줄

DreamTown 엔진은 "속삭임을 기록하는 시스템"이 아니라,  
**"작은 내면 신호가 성장·공명·연결로 진화하는 조용한 관계 엔진"이다.**

---

## 1. 상위 원칙

### 1-1. DreamTown 흐름

모든 기능은 아래 흐름 위에서만 정의된다.

```
소원 → 별 → 성장 → 공명 → 나눔 → 연결
```

### 1-2. 설계 원칙

모든 엔진 변경은 아래 3가지를 동시에 만족해야 한다.

- 지금 바로 작동하는가
- 이후 확장과 자연스럽게 연결되는가
- 기존 구조와 충돌하지 않는가

### 1-3. 사용자 체감 원칙

사용자는 시스템을 "분석 엔진"으로 느끼면 안 된다.  
항상 아래 감각만 남아야 한다.

- 짧다
- 조용하다
- 부담이 없다
- 설명하지 않는다
- 그런데 이상하게 이어지고 있는 느낌은 남는다

---

## 2. 엔진의 본질

| 단계 | 정의 |
|------|------|
| **Whisper** | 사용자의 아주 작은 내면 신호를 남긴다 |
| **Galaxy Signal** | 반복 신호를 의미 단위로 축적한다 |
| **Recall** | 내 과거 문장이 다시 스친다 |
| **Blend** | 내 문장처럼 자연스럽게 집단의 결이 10% 섞인다 |
| **Resonance** | 비슷한 상태의 타인 문장이 조용히 스친다 |
| **Connection** | 공명 중 단 한 번, 의미 있는 연결이 발생한다 |

**한 줄 구조**: 기록 → 축적 → 의미화 → 스침 → 연결

---

## 3. 단계별 SSOT

### 3-1. Whisper

**정의**: 속삭임은 기록 기능이 아니다. 스쳐가는 생각을 아주 짧게 붙잡는 입력 장치다.

| 항목 | 내용 |
|------|------|
| 저장 위치 | `journey_logs` |
| 입력 | 한 줄, `context_tag` optional |
| UX 규칙 | 저장 후 조용히 사라짐, 기록/성장 강요 금지 |
| 의미 | Recall / Resonance / Connection / Signal의 시작점 |

**관련 코드**
- `routes/journeyLogRoutes.js` — `POST /api/dt/journey-logs`
- `components/StarWhisperInput.jsx`
- Event: `whisper_shown`, `whisper_created`

---

### 3-2. Galaxy Signal

**정의**: 사용자의 반복되는 내면 패턴. 한 번이 아닌 여러 번에서 결을 추출한다.

| 항목 | 내용 |
|------|------|
| 저장 위치 | `galaxy_signals` |
| 신호 축 | `context` / `emotion` / `length` |
| 추출 방식 | 규칙 기반 (LLM 없음) |
| 유효 기간 | 최근 7일 |
| 의미 | 추천·공명·연결의 보정값 — 본체 덮어쓰기 금지 |

**관련 코드**
- `services/galaxySignalService.js` — `generateSignals()`, `getUserSignalState()`
- `routes/galaxySignalRoutes.js` — `GET /api/dt/galaxy-signal`
- Event: `signal_generated`

---

### 3-3. Recall

**정의**: 내 과거 속삭임의 재등장.

| 항목 | 내용 |
|------|------|
| 발생 조건 | whisper ≥ 5, 오늘 이력 없음, 5% 랜덤, 미노출 문장 존재 |
| 저장 위치 | `recall_exposures` |
| UX | 내 과거 문장 1개, 7초 자동 소멸, 버튼 없음 |
| 의미 | "내 이야기가 사라지지 않고 이어지고 있다"는 감각 |

**관련 코드**
- `routes/recallWhisperRoutes.js` — `GET /api/dt/recall-whisper`
- `components/RecallWhisperCard.jsx`
- Event: `recall_eligible`, `recall_shown`, `recall_rendered`

---

### 3-4. Blend

**정의**: Recall 소스 선택 레이어. 집단지성의 결을 10%만 섞는 구조.

| 항목 | 내용 |
|------|------|
| 발생 조건 | Recall 성공 시점에서 BLEND_RATIO (기본 10%) 확률 |
| A/B 실험 | `x-exp-group: control` 헤더로 분리 가능 |
| 환경 변수 | `BLEND_RATIO=0.10` (재배포 없이 튜닝) |
| 실패 방어 | 후보 없으면 recall fallback |
| 사용자 체감 | "남의 말"이 아닌 "문득 스친 한 줄"로 느껴져야 함 |

**관련 코드**
- `routes/recallWhisperRoutes.js` — `BLEND_RATIO = parseFloat(process.env.BLEND_RATIO || '0.10')`
- Response: `{ source_type: 'blend', is_blend, fallback, text_length }`
- Event: `blend_shown`, `blend_rendered`

---

### 3-5. Resonance

**정의**: 비슷한 상태의 사람이 남긴 결이 우연히 닿는 순간.

| 항목 | 내용 |
|------|------|
| 발생 조건 | whisper ≥ 3, 오늘 이력 없음, 15% 랜덤 |
| 후보 선택 | 50개 조회 → signal 점수 계산 → top-5 랜덤 3개 |
| 최소 점수 | 2 미달 시 fallback → 순수 랜덤 |
| 저장 위치 | `resonance_exposures` |
| UX | 타인 문장 1~3개, 6초 자동 소멸, 버튼 없음 |
| 핵심 규칙 | 정확하면 실패. top-1 고정 금지. 약간의 우연성 유지 |

**관련 코드**
- `routes/resonanceFeedRoutes.js` — `GET /api/dt/resonance-feed`
- `components/ResonanceCard.jsx`
- Event: `resonance_eligible`, `resonance_shown`, `resonance_item_rendered`, `resonance_ranked`, `resonance_selected`

---

### 3-6. Connection

**정의**: 공명 중 단 한 번만 발생하는 의미 있는 연결.

| 항목 | 내용 |
|------|------|
| 발생 조건 | whisper ≥ 5, resonance 경험 ≥ 1, 이력 없음, 20% 랜덤 |
| 후보 선택 | 100개 조회 → signal 점수 계산 → top-3 랜덤 1개 |
| 최소 점수 | 3 미달 시 skip (공명보다 엄격) |
| 저장 위치 | `connection_exposures` + `connection_events` (이중 방어) |
| 사용자당 | 최대 1회 (UNIQUE 보장) |
| UX | 매칭된 1문장 + 아우룸 1줄, 8초 자동 소멸, 버튼 없음 |
| 절대 금지 | 채팅, 프로필, ID, 친구 기능, 관계 유지 기능 |

**관련 코드**
- `routes/connectionStageRoutes.js` — `GET /api/dt/connection-stage`
- `components/ConnectionStageCard.jsx`
- Event: `connection_eligible`, `connection_selected`, `connection_shown`, `connection_completed`

---

## 4. 엔진 전체 흐름

```
whisper 저장
  → journey_logs 기록
  → galaxy_signals 누적 (fire-and-forget)

whisper ≥ 3 → resonance 가능
whisper ≥ 5 → recall 가능 / connection 가능 (resonance 이후)

[다음 방문]
  → 15% → ResonanceCard (signal top-5 랜덤)
  → 5%  → RecallWhisperCard (미노출 문장)
  → [1회한] ConnectionStageCard (signal top-3 랜덤)

[추천]
  → GET /stars/:id/route-recommendation?journey_id=xxx
  → signal ranking layer → 기존 mode 후보 재정렬
```

---

## 5. 확정 확률 규칙

| 기능 | 확률 | 환경변수 |
|------|------|---------|
| Recall | 5% | — |
| Blend | 10% (Recall 시도 중) | `BLEND_RATIO` |
| Resonance | 15% | — |
| Connection | 20% (+ 추가 조건) | — |

> **원칙**: 확률은 체감보다 약해야 한다. 사용자가 구조를 알아차리면 실패다.

---

## 6. UX SSOT

### 유지

- 짧게 / 부드럽게 / 설명 없이
- 조용히 등장 → 자동 소멸
- 클릭 강요 없음 / `pointerEvents: none`

### 금지

- 분석 강요 / 성장 강요 / 자기계발 압박
- 타인 데이터 직접 언급 / 집단지성 직접 설명
- 과한 보상 / 과한 감동 연출
- "비슷한 사람들이" / "AI가 분석했습니다"

---

## 7. 데이터 구조 요약

| 테이블 | 역할 |
|--------|------|
| `journey_logs` | whisper 저장 (growth_text, context_tag, is_shareable, resonance_used_count) |
| `galaxy_signals` | context/emotion/length 신호 누적 |
| `recall_exposures` | recall 노출 이력 (하루 1회, 중복 방지) |
| `resonance_exposures` | 공명 노출 이력 (하루 1회, viewer/source 추적) |
| `connection_exposures` | 연결 생애 1회 방어 (UNIQUE journey_id) |
| `connection_events` | 연결 매칭 데이터 (connected_journey_id, source_text_id, score) |
| `recommendation_exposures` | 추천 반복 방지 (최근 3일) |

---

## 8. 이벤트 추적 SSOT

### 팬덤 엔진 이벤트 전체 목록

| 이벤트 | 발생 시점 |
|--------|---------|
| `whisper_shown` | StarWhisperInput 마운트 (작성률 분모) |
| `whisper_created` | 속삭임 저장 완료 (작성률 분자) |
| `signal_generated` | whisper 저장 시 서버사이드 |
| `recall_eligible` / `recall_shown` / `recall_rendered` | Recall 카드 |
| `blend_shown` / `blend_rendered` | Blend 카드 |
| `resonance_eligible` / `resonance_shown` / `resonance_item_rendered` | Resonance 카드 |
| `resonance_ranked` / `resonance_selected` | Resonance 매칭 (서버사이드) |
| `connection_eligible` / `connection_shown` / `connection_selected` / `connection_completed` | Connection 카드 |
| `recommendation_ranked` / `recommendation_shown` / `recommendation_selected` | 추천 랭킹 |

### 공통 추적 필드

```json
{
  "request_id": "...",
  "journey_id": "...",
  "source_type": "recall | blend | resonance | connection",
  "text_length": 18
}
```

---

## 9. 핵심 KPI

| KPI | 산식 | 목표 |
|-----|------|------|
| 작성률 | `whisper_created / whisper_shown` | 30% |
| 공명 노출률 | `resonance_shown / resonance_eligible` | ~15% |
| 연결 발생 수 | `connection_completed` 누적 | — |

조회: `GET /api/dt/events/kpi` → `kpi5_fandom`

---

## 10. 확장 금지 항목

이 SSOT를 깨는 확장은 금지된다.

- 랭킹 / 순위 시스템
- 개인화 직접 노출 ("당신에게 맞춤")
- 반복 강제 기능
- 지속 관계 기능 (채팅, 팔로우)
- 타인 데이터 직접 출처 표기

---

## 11. 최종 고정 문장

> **DreamTown 엔진은 사용자를 해석하는 시스템이 아니라,  
> 사용자가 반복해서 보내는 작은 신호를 기억하고  
> 그 신호가 성장과 공명과 연결로 이어지도록 돕는 조용한 엔진이다.**
