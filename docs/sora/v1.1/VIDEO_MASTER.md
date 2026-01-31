# Sora Video Master v1.1

> **Canonical Document - Sora Cinematic Track**
> Source: AURORA5_SORA_FINAL_v1.0.md
> Last updated: 2026-02-01

---

## 1. 적용 범위

| 항목 | 값 |
|------|-----|
| 대상 | 10개 영상 × 4유닛 (총 40개) |
| 포맷 | 9:16 vertical, 1080×1920 |
| 유닛 길이 | Unit 1-3: 8초, Unit 4: 6초 |
| 스타일 | Cinematic, Korean drama aesthetic |
| 컬러 축 | Purple (#667eea) ↔ Pink (#F5A7C6) |

---

## 2. GLOBAL_TECH_SUFFIX (필수 주입)

모든 유닛 프롬프트 끝에 반드시 포함:

```
1080x1920, 9:16 vertical, cinematic Korean drama aesthetic, shallow depth of field, filmic lighting, 24fps. Avoid readable on-screen text and watermarks; add captions in post.
```

---

## 3. 스타일 원칙 (PAIN ↔ SOLUTION)

### PAIN 단계 (Unit 1-2)
- **톤**: muted, desaturated, melancholic, isolated
- **조명**: low-key, dim lighting, gray-blue or sepia
- **카메라**: slow push-in, slow motion, anxious montage
- **컬러**: 보라-핑크는 거의 안 보이게 (아주 미세한 힌트만)

### SOLUTION 단계 (Unit 3-4)
- **톤**: warm, hopeful, vibrant, cozy
- **조명**: soft/gentle glow, warm atmosphere
- **카메라**: gentle dolly, steady tracking
- **컬러**: 보라-핑크 그라데이션 확장 → 전체 전환

---

## 4. MASCOT_LOCK (Unit 3-4 필수)

```
A consistent tiny star mascot: 2D hand-drawn watercolor style, minimal face, purple-to-pink aura, gentle floating motion with subtle particles.
```

### 마스코트 스펙
- **형태**: small five-point star, minimal eyes/mouth
- **스타일**: 2D hand-drawn watercolor + soft outline, subtle grain
- **효과**: purple-to-pink aura, tiny particle trail
- **동작**: gentle float, tiny bobbing, friendly companion
- **등장**: Unit 3(폰 화면/알림) → Unit 4(현실 공간 동반)

---

## 5. 로고/자막 원칙

- **영상 내부**: 읽히는 텍스트 생성 금지
- **메시지/문구**: 후편집 자막으로 통일
- **Unit 4**: 하단 로고 오버레이용 깨끗한 여백 확보
- **End card**: 마지막 0.8~1.0초는 프레임 안정

### Unit 4 필수 포함 문구
```
Leave clean negative space at bottom for logo overlay; end on a stable frame hold.
```

---

## 6. 유닛 구성 원칙

| Unit | 역할 | 특징 |
|------|------|------|
| **Unit 1** | 문제의 '정서' 한 방 | 정적, 클로즈업 |
| **Unit 2** | 문제의 '증폭' | 몽타주, 타임랩스 |
| **Unit 3** | 트리거 + 희망 전환 | 별 알림, MASCOT 등장 |
| **Unit 4** | 행동 변화 + 동반자 | 로고 여백, MASCOT 동반 |

---

## 7. 프롬프트 템플릿

```
Scene: (who/where/when)
Action: (what happens)
Camera: (shot + movement + lens)
Lighting/Color: (pain or solution)
Constraints: (no readable text, no watermark, leave logo space)
Duration: (8s or 6s)
[GLOBAL_TECH_SUFFIX]
```

---

## 8. LINT 체크리스트

### 필수 (FAIL이면 재생성)
- [ ] 9:16, 1080x1920 포함
- [ ] Duration(8s/6s) 명시
- [ ] Camera shot/movement 포함
- [ ] Unit 3~4에 MASCOT_LOCK 포함
- [ ] `Avoid readable on-screen text` 포함
- [ ] Unit 4에 `leave clean negative space for logo overlay` 포함

### 권장 (경고)
- [ ] 감정 메타포 1개 이상
- [ ] PAIN→SOLUTION 컬러 전환 명확
- [ ] 유닛 간 연속성 유지

---

## 9. 영상 목록

| # | 제목 | 테마 |
|---|------|------|
| 1 | 소원이의 하루 | 일상의 피로 |
| 2 | 막막함 탈출 | 정보 과부하 |
| 3 | 혼자가 아니야 | 외로움 |
| 4 | 다시 시작해도 괜찮아 | 실패/포기 |
| 5 | 완벽하지 않아도 돼 | 자기비판 |
| 6 | 내일이 두려워도 | 미래 불안 |
| 7 | 꿈을 잃어버렸어 | 열정 상실 |
| 8 | 남들 눈이 무서워 | 타인 시선 |
| 9 | 쉬어도 될까 | 번아웃/죄책감 |
| 10 | 이미 늦은 걸까 | 나이/비교 |

---

## 10. 운영 규칙

- **프롬프트 생성**: VIDEO_MASTER + UNIT_CONTENT 합성
- **배포 조건**: LINT 100% 통과 필수
- **버전 관리**: 변경 시 CHANGELOG 기록

---

*참조: prompts/sora/v1.1/PROMPT_PACK.yaml*
