# Ad Set ↔ Creative 매핑표 + A/B 테스트 설계 (v1.0)

> 4 Ad Set × 4 Creative 1:1 매핑 + 2주 테스트 프레임워크
> Last updated: 2026-02-19

---

## 1. Campaign 구조 요약

```
Campaign: [KR] Miracle Diagnostic – Conversion
├── Ad Set 1: Healing-High  ← ad-creative-healing-high-v1.md
├── Ad Set 2: Growth-High   ← ad-creative-growth-high-v1.md
├── Ad Set 3: Healing-Mid   ← ad-creative-healing-mid-v1.md
└── Ad Set 4: Growth-Mid    ← ad-creative-growth-mid-v1.md
```

---

## 2. Ad Set ↔ Creative 매핑표

| Ad Set | Archetype | LTV | Creative 파일 | 의상 | 배경 모드 | 핵심 감정 | CTA |
|--------|-----------|-----|--------------|------|----------|----------|-----|
| Healing-High | healing_seeker | high | healing-high-v1 | AUTUMN_COZY | GENERIC (카페→해변) | 지침 → 회복 | 7일 회복 여정 |
| Growth-High | growth_builder | high | growth-high-v1 | SPRING_CASUAL | GENERIC (골목→산책로) | 정체 → 전진 | 7일 성장 여정 |
| Healing-Mid | healing_seeker | mid | healing-mid-v1 | SPRING_CASUAL | GENERIC (공원→산책로) | 괜찮은 척 → 안도 | 3분 진단 시작 |
| Growth-Mid | growth_builder | mid | growth-mid-v1 | NIGHT_WALK | YEOSU (케이블카→빅오→향일암) | 막막함 → 첫 걸음 | 3분 진단 시작 |

---

## 3. 타겟팅 설정

### 공통 설정

| 항목 | 값 |
|------|-----|
| 지역 | 대한민국 |
| 연령 | 20–44 |
| 언어 | 한국어 |
| 플랫폼 | Instagram Reels, Facebook Reels, Stories |
| 최적화 목표 | Purchase (7일 여정 결제) |
| 전환 기간 | 7-day click, 1-day view |
| 비딩 | Lowest Cost (초기) |

### Ad Set별 관심사 타겟팅

| Ad Set | 관심사 키워드 | Lookalike |
|--------|-------------|-----------|
| Healing-High | 명상, 마음챙김, 심리상담, 셀프케어, 힐링여행 | — (초기 데이터 부족) |
| Growth-High | 자기계발, 독서모임, 목표설정, 생산성, 커리어 | — |
| Healing-Mid | 일상, 워라밸, 스트레스해소, 취미, 일기쓰기 | — |
| Growth-Mid | 동기부여, 습관만들기, 운동루틴, 새로운시작 | — |

> Phase 2 (2주 후): 진단 완료자 기반 Lookalike 1% 생성 가능

---

## 4. 예산 배분

### Phase 1: 테스트 기간 (Day 1–14)

| Ad Set | 일 예산 비중 | 근거 |
|--------|------------|------|
| Healing-High | 25% | High LTV 풀 50% ÷ 2 archetype |
| Growth-High | 25% | High LTV 풀 50% ÷ 2 archetype |
| Healing-Mid | 25% | Mid LTV 풀 50% ÷ 2 archetype |
| Growth-Mid | 25% | Mid LTV 풀 50% ÷ 2 archetype |

> 균등 배분 → 데이터 기반 재배분 (Phase 2)

### Phase 2: 최적화 기간 (Day 15–28)

Phase 1 데이터 기반 재배분 규칙:

```
IF  Ad Set ROAS ≥ 2.5  → 예산 +50%
IF  Ad Set ROAS 1.5–2.5 → 예산 유지
IF  Ad Set ROAS < 1.5   → 예산 -50%
IF  Ad Set ROAS < 0.8   → 일시 중단 (Kill)
```

---

## 5. Pixel 이벤트 설계

### 필수 이벤트 4종

| 이벤트 | 트리거 시점 | Payload |
|--------|-----------|---------|
| `diagnostic_started` | 진단 첫 질문 노출 | `{ source: "meta_ad", ad_set: "healing_high" }` |
| `diagnostic_completed` | 8문항 완료 | `{ mode_id, archetype_primary, ltv_segment, diagnostic_version }` |
| `purchase_started` | 결제 페이지 진입 | `{ value, currency: "KRW", content_name: "7day_journey" }` |
| `purchase_completed` | 결제 완료 | `{ value, currency: "KRW", content_name, ltv_segment }` |

### diagnostic_completed Payload 예시

```json
{
  "mode_id": "MIRACLE_GROWTH_01",
  "archetype_primary": "healing_seeker",
  "ltv_segment": "mid",
  "diagnostic_version": "1.1.0"
}
```

### 보조 이벤트 (선택)

| 이벤트 | 용도 |
|--------|------|
| `page_view` | 랜딩페이지 도달 확인 |
| `lead` | 이메일/전화번호 수집 시 |
| `add_to_cart` | 패키지 선택 시 |

---

## 6. KPI 기준선 + 컷오프

### Ad Set별 KPI 목표

| 지표 | Healing-High | Growth-High | Healing-Mid | Growth-Mid |
|------|-------------|-------------|-------------|------------|
| CTR | 2.5%+ | 2.5%+ | 3.0%+ | 3.0%+ |
| 진단 완료율 | 60%+ | 60%+ | 50%+ | 50%+ |
| CVR (진단→구매) | 12%+ | 10%+ | 8%+ | 8%+ |
| CAC 상한 | LTV×30% | LTV×30% | LTV×30% | LTV×30% |
| ROAS 목표 | 3.0+ | 2.5+ | 2.5+ | 2.0+ |

> High LTV는 CVR/ROAS 목표가 더 높음 — 단가 높은 오퍼이므로 전환 효율 중요
> Mid LTV는 CTR 목표가 더 높음 — 볼륨 기반 전략

### 컷오프 규칙 (Kill Criteria)

| 조건 | 판단 시점 | 액션 |
|------|----------|------|
| CTR < 1.0% | Day 3 (1,000 imp+) | 크리에이티브 교체 |
| CTR 1.0–2.0% | Day 5 (3,000 imp+) | Hook(U1) 수정 검토 |
| 진단 완료율 < 30% | Day 7 (100 click+) | 랜딩페이지 점검 |
| CVR < 3% | Day 10 (50 진단완료+) | Ad Set 일시 중단 |
| ROAS < 0.8 | Day 14 (10 purchase+) | Ad Set Kill |
| CAC > LTV×50% | Day 14 | Ad Set Kill |

### 최소 데이터 임계치

| 판단 | 최소 필요 데이터 |
|------|----------------|
| CTR 유의미 | 1,000 impressions |
| CVR 유의미 | 50 diagnostic completions |
| ROAS 유의미 | 10 purchases |
| Ad Set 간 비교 | 각 Ad Set 50+ conversions/week |

---

## 7. A/B 테스트 설계

### Phase 1: Creative A/B (Day 1–14)

4개 Ad Set이 곧 A/B 테스트 역할:

```
                    healing_seeker        growth_builder
                    ──────────────        ──────────────
High LTV            Healing-High (A)      Growth-High (B)
Mid LTV             Healing-Mid (C)       Growth-Mid (D)
```

**테스트 변인**: Archetype × LTV 조합별 성과 차이
**통제 변인**: 가이드 동일 준수, 15초 동일, 9:16 동일

### Phase 1 판단 매트릭스

| 결과 패턴 | 해석 | 다음 액션 |
|----------|------|----------|
| High > Mid (양쪽 archetype) | LTV 타겟팅 유효 | High 예산 확대 |
| Healing > Growth (양쪽 LTV) | Healing 메시지 우세 | Growth 크리에이티브 리뉴얼 |
| Growth > Healing (양쪽 LTV) | Growth 메시지 우세 | Healing 크리에이티브 리뉴얼 |
| 특정 1개만 압도적 | Winner-take-most | 해당 Ad Set 예산 60%+ |
| 4개 균등 | 세그먼트 분화 미성숙 | Broad 타겟으로 통합 테스트 |

### Phase 2: Hook A/B (Day 15–28)

Phase 1 Top 2 Ad Set에서 Hook 변형 테스트:

| 변형 | Hook 전략 | 적용 유닛 |
|------|----------|----------|
| Original (A) | Phase 1 크리에이티브 그대로 | U1 유지 |
| Variant (B) | U1 감정 강도 +1단계 | U1 교체, U2-U3 동일 |

**Hook 강도 변형 예시**:

| Ad Set | Original Hook | Variant Hook (강도↑) |
|--------|--------------|---------------------|
| Healing-High | 카페 창가, 조용한 지침 | 빗소리 카페, 눈물 한 방울 (더 강한 공감) |
| Growth-High | 골목 갈림길, 막막함 | 빈 방 책상, 접힌 종이비행기만 (더 강한 정체) |
| Healing-Mid | 공원 벤치, 괜찮은 척 | 버스 안, 창문에 김 서림 (더 일상적 공감) |
| Growth-Mid | 케이블카 정류장, 정지 | 빈 플랫폼, 지나가는 케이블카 (더 강한 멈춤) |

> Variant는 U1 키프레임 + Sora 프롬프트만 교체, U2-U3 동일 유지
> 가이드 전항목 동일 준수 필수

### Phase 2 판단 기준

```
IF  Variant CTR > Original CTR + 0.5%p (유의미)
    AND  CVR 유지 또는 상승
    → Variant 채택

IF  Variant CTR 상승 BUT CVR 하락
    → 감정 강도가 클릭만 유도, 전환 미스매치 → Original 유지

IF  차이 < 0.5%p
    → 유의미하지 않음 → Original 유지 (변경 비용 불필요)
```

---

## 8. 리포팅 템플릿

### Daily Check (매일 오전)

```
[날짜] Ad Performance Daily

| Ad Set | Spend | Imp | Click | CTR | 진단완료 | 구매 | ROAS |
|--------|-------|-----|-------|-----|---------|------|------|
| H-High |       |     |       |     |         |      |      |
| G-High |       |     |       |     |         |      |      |
| H-Mid  |       |     |       |     |         |      |      |
| G-Mid  |       |     |       |     |         |      |      |

컷오프 트리거: [해당 없음 / 해당 Ad Set + 사유]
액션: [없음 / 조치 내용]
```

### Weekly Review (매주 월요일)

```
[주차] Weekly Performance Review

1. Top Performer: [Ad Set명] — ROAS [X.X], CTR [X.X%]
2. Underperformer: [Ad Set명] — 사유: [CTR/CVR/ROAS 미달]
3. 예산 재배분: [변경 내용 또는 "유지"]
4. 크리에이티브 액션: [교체/유지/A-B 테스트 시작]
5. 다음 주 포커스: [구체 액션]
```

---

## 9. 운영 타임라인

| 일차 | 액션 | 판단 |
|------|------|------|
| Day 0 | Pixel 이벤트 설치 + 테스트 발화 확인 | — |
| Day 1 | 4 Ad Set 동시 런칭 (균등 예산) | — |
| Day 3 | CTR 1차 체크 (1,000 imp 기준) | CTR < 1.0% → 크리에이티브 교체 |
| Day 5 | CTR 2차 체크 (3,000 imp 기준) | CTR 1.0–2.0% → Hook 수정 검토 |
| Day 7 | 진단 완료율 체크 + Weekly Review #1 | 완료율 < 30% → 랜딩페이지 점검 |
| Day 10 | CVR 체크 (50 진단완료 기준) | CVR < 3% → Ad Set 일시 중단 |
| Day 14 | **Phase 1 종합 판정** | ROAS/CAC 기반 Kill or Scale |
| Day 15 | Phase 2 시작: 예산 재배분 + Hook A/B | Top 2 Ad Set 선정 |
| Day 21 | Hook A/B 중간 체크 | CTR 변화 유의미성 판단 |
| Day 28 | **Phase 2 종합 판정** | Winner 확정 → Scaling 진입 |

---

## 10. Done 조건 (전체)

- [ ] Meta Pixel 4종 이벤트 정상 수집 확인
- [ ] ltv_segment + archetype_primary payload 포함 확인
- [ ] 4 Ad Set 런칭 완료
- [ ] Day 7: 1주 데이터 각 Ad Set 100 impression+ 확보
- [ ] Day 14: Phase 1 판정 완료 (Kill/Scale/Hold 결정)
- [ ] Day 14: CAC/LTV 1차 계산 완료
- [ ] Day 28: Phase 2 Winner 확정
