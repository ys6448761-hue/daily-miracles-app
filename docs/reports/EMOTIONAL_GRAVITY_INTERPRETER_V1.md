# EMOTIONAL_GRAVITY_INTERPRETER_V1.md

> 작성일: 2026-05-22  
> 상태: prototype / no commit  
> 산출물: `outputs/gravity-interpreter/`

---

## 목적

소원 문장을 DreamTown emotional gravity로 해석하는 첫 rule-based 엔진 설계.  
LLM freeform 금지 — keyword matching + type heuristics만 사용.

```
wish text
  → keyword scanning (weighted)
  → gravity score 계산
  → tiebreak (wish_type heuristic)
  → palette / location / pacing / render recommendation
```

---

## 테스트 소원 12개

| ID | 유형 | 소원 텍스트 |
|----|------|-----------|
| W01 | 위로형 | 지쳐있는 나를 보듬어주고 싶어요 |
| W02 | 위로형 | 오늘 너무 힘들었어요, 그냥 쉬고 싶어요 |
| W03 | 결심형 | 새로운 일을 시작해보고 싶어요 |
| W04 | 결심형 | 이번엔 꼭 해낼 수 있을 것 같아요 |
| W05 | 회복형 | 지친 몸과 마음을 회복하고 싶어요 |
| W06 | 회복형 | 상처받은 마음이 조금씩 나아지길 바라요 |
| W07 | 관계형 | 소중한 사람과 더 가까워지고 싶어요 |
| W08 | 관계형 | 오랫동안 연락 못 한 친구가 생각나요 |
| W09 | 불안형 | 앞날이 너무 불확실하고 막막해요 |
| W10 | 불안형 | 이 선택이 맞는지 자꾸 의심이 돼요 |
| W11 | 희망형 | 작은 소원이 이루어졌으면 좋겠어요 |
| W12 | 희망형 | 내년 이맘때는 더 나은 내가 되어있을 거예요 |

---

## Gravity 분류 결과

| ID | primary gravity | secondary | palette cafe | palette hamel | resonance | attraction | 권장 |
|----|----------------|-----------|-------------|--------------|-----------|------------|------|
| W01 | pause | afterflow | citrine | diamond | 90 | 55 | resonance |
| W02 | pause | — | citrine | sapphire | 92 | 48 | resonance |
| W03 | curiosity | fragile_hope | citrine | topaz | 75 | 83 | both |
| W04 | fragile_hope | curiosity | diamond | diamond | 80 | 72 | resonance |
| W05 | calm | pause | sapphire | emerald | 88 | 55 | resonance |
| W06 | calm | fragile_hope | sapphire | emerald | 87 | 58 | resonance |
| W07 | reality_reconnection | fragile_hope | — | diamond | 80 | 72 | both |
| W08 | reality_reconnection | afterflow | sapphire | — | 85 | 58 | resonance |
| W09 | confusion | pause | moonstone | moonstone | 92 | 25 | resonance ONLY |
| W10 | confusion | curiosity | moonstone | topaz | 88 | 35 | resonance |
| W11 | fragile_hope | calm | diamond | diamond | 87 | 70 | resonance |
| W12 | fragile_hope | curiosity | citrine | topaz | 72 | 85 | attraction |

---

## Rule Engine 구조

### Keyword-Gravity Mapping (주요 규칙)

| gravity | 핵심 키워드 | weight |
|---------|-----------|--------|
| pause | 지쳐/힘들/지친/쉬고/피곤 | 2–3 |
| emotional_afterflow | 보듬/위로/생각나/그리워 | 2–3 |
| calm | 회복/치유/나아/안정/평온 | 2–3 |
| curiosity | 시작/도전/새로운/해보고/설레 | 2–3 |
| fragile_hope | 이루/소원/바라/해낼/나은 | 1–3 |
| reality_reconnection | 가까워/연락/다시/만나/돌아 | 1–3 |
| confusion | 불확실/막막/의심/불안/걱정 | 2–3 |

### Tiebreak Heuristics (동점 처리)

동점 시 wish_type으로 우선순위 결정:

| wish_type | tiebreak_favor | 이유 |
|-----------|---------------|------|
| 위로형 | pause | 위로 = 멈춤 우선 |
| 결심형 | curiosity | 결심 = 에너지 우선 |
| 회복형 | calm | 회복 = 목적지(calm) 우선 |
| 관계형 | reality_reconnection | 관계 = 연결 우선 |
| 불안형 | confusion | 불안 = 혼란 우선 |
| 희망형 | fragile_hope | 희망 = 조심스러운 희망 우선 |

### Future Signal Heuristic

미래 시제 키워드(내년, 될 거예요, 되어있을) 감지 시:
- curiosity +1 / fragile_hope +1 자동 보정
- 적극적 미래 그림 = attraction fit 상승

---

## Gravity Distribution

```
fragile_hope      ████████ 3/12  (W04, W11, W12)
pause             ██████   2/12  (W01, W02)
calm              ██████   2/12  (W05, W06)
reality_reconnect ██████   2/12  (W07, W08)
confusion         ██████   2/12  (W09, W10)
curiosity         ███      1/12  (W03)
emotional_afterflow —      0/12  (F2/F4 전용, primary 없음)
```

---

## 핵심 발견

### 1. 종결어미가 gravity를 결정한다

- "꼭 해낼 수 있을 것 **같아요**" → fragile_hope (유보적 종결)
- "조금씩 나아지**길 바라요**" → calm+hope 복합
- "시작해보**고 싶어요**" → curiosity (열린 에너지)
- keyword 점수가 같아도 종결어미의 강도가 gravity 분기를 만든다.

### 2. confusion 소원은 attraction 금지

confusion primary = resonance 88–92 / attraction 25–35.  
혼란은 공간(시간)이 필요. attraction의 21초 pacing은 confusion을 압축하여 감정 과부하 발생 위험.  
**confusion 소원 F5: 반드시 fragile_hope 마감** — 혼란을 혼란으로 끝내지 않는 원칙.

### 3. 같은 유형도 palette가 다르다

같은 위로형(W01/W02):
- W01: citrine→diamond (따뜻한 위안 + 작은 희망)
- W02: citrine→sapphire (따뜻한 위안 + 차분한 안식)

같은 희망형(W11/W12):
- W11: diamond (조용한 소망 — resonance)
- W12: citrine+topaz (적극적 미래 그림 — attraction)

### 4. tiebreak가 3/12에서 발생

12개 중 3개(W01/W05/W06)에서 동점. type heuristic이 없으면 오분류 가능.  
→ wish_type 먼저 분류 후 gravity 해석하는 2단계 구조가 필수.

### 5. emotional_afterflow는 primary가 될 수 없다

afterflow는 항상 secondary 또는 breathing gap(F2) 역할.  
소원 텍스트에서 afterflow 키워드가 나와도 primary는 다른 gravity가 담당.

---

## 엔진 한계 (v1)

| 한계 | 설명 | 다음 버전 |
|------|------|----------|
| 단순 keyword matching | 문맥 없이 키워드만 스캔 | 문장 구조 파싱 추가 |
| 종결어미 처리 없음 | '것 같아요' vs '거예요' 구분 안 됨 | 어미 패턴 규칙 추가 |
| wish_type 수동 입력 | type 자동 분류 없음 | keyword로 type 먼저 추정 |
| implicit 신호 미탐지 | '상처' = pause implicit — 현재 미처리 | 확장 keyword 사전 |
| 단일 gravity만 | 복합 gravity blend 미지원 | 가중 평균 blend 검토 |

---

## 산출물

```
outputs/gravity-interpreter/
  interpreter-rules.json   ← rule engine 전체 정의
  test-corpus.json         ← 12 wishes + 해석 결과
  preview.html             ← 시각화 (distribution, clustering, 12 cards, heatmap)
```

---

## 다음 단계

```
1. [READY] W01 결과 → W1-v3 sequence.json과 1:1 대조 (엔진 검증)
   → 엔진이 W1-v3와 동일한 palette/location을 추천하는지 확인

2. [NEXT] 종결어미 패턴 규칙 추가 (v1.1)
   → '것 같아요' / '고 싶어요' / '바라요' / '거예요' 어미별 weight 조정

3. [NEXT] wish_type 자동 분류
   → gravity score 상위 gravity → type 추정 → tiebreak 자동 적용

4. [LATER] 6번째 장소(cablecar/hotel) 추가 시 location 매핑 확장
   → curiosity: hotel (조망) / cablecar (확장된 시야) 추가

5. [LATER] assemble-miracle-video.js와 엔진 연결
   → 소원 입력 → interpreter → sequence.json 자동 생성 → 영상 조립
```

---

## 참조

| 항목 | 경로 |
|------|------|
| interpreter-rules.json | `outputs/gravity-interpreter/interpreter-rules.json` |
| test-corpus.json | `outputs/gravity-interpreter/test-corpus.json` |
| preview.html | `outputs/gravity-interpreter/preview.html` |
| 기존 W1-v3 | `outputs/resonance-preview/W1-v3/sequence.json` |
| wish-render-prototype | `outputs/wish-render-prototype/gravity-engine.json` |
| 카피 SSOT | `docs/ssot/dreamtown-postcard-emotion-copy-ssot.md` |
