# Code 종합지시서

> **IMMUTABLE SOURCE - DO NOT MODIFY**
> 원문 채팅 그대로 보존 (수정 금지)
> 작성일: 2026-02-01

---

## SSOT 재구축 지시

### 원칙
1. 원문(immutable sources) 6개는 수정 금지로 저장한다.
2. 정본(canonical artifacts)은 원문에서만 추출/생성한다.
3. LINT FAIL이면 merge/배포 금지(Gate).

---

## (1) 원문 소스 6개 저장 (수정 금지)

| # | 파일명 | 설명 |
|---|--------|------|
| 1 | AURORA5_SORA_FINAL_v1.0.md | Sora 초안 채팅 원문 |
| 2 | 20260131_파크_2d_기술지원.md | 파크 2D 기술지원 원문 |
| 3 | 20260201_드라이브_공유폴더_마스터가이드.md | MASTER GUIDELINES V7.0 포함 |
| 4 | 20260201_노션_DB_구조_3DB.md | 노션 자동화 스키마 |
| 5 | GitHub_저장소_활용_가이드.md | 저장소 구조 및 규칙 |
| 6 | Code_종합지시서.md | 본 문서 |

저장 경로: `docs/ssot/sources/2026-02-01/`

---

## (2) 정본 산출물 생성

### 공통
- `docs/ssot/SOURCES_INDEX.md` - 원문→정본 반영 매핑표
- `docs/ssot/CHANGELOG.md` - 변경 로그
- `scripts/lint/lint_rules.common.json` - 공통 린트 규칙

### Sora 트랙
- `docs/sora/v1.1/VIDEO_MASTER.md` - Sora 제작 마스터 문서
- `prompts/sora/v1.1/PROMPT_PACK.yaml` - 40개 프롬프트 팩
- `scripts/lint/LINT_REPORT_sora_v1.1.md` - Sora 린트 리포트

### 2D 트랙
- `docs/2d/v7.0/MIRACLE_MASTER_GUIDELINES.md` - 2D 마스터 가이드라인
- `scripts/lint/LINT_REPORT_2d_v7.0.md` - 2D 린트 리포트

---

## (3) 프로필(Profile)로 트랙 분리 (섞임 방지)

### profiles/sora_cinematic.yaml
- 스타일: Cinematic Korean drama
- 컬러 축: Purple (#667eea) ↔ Pink (#F5A7C6)
- 포맷: 9:16, 1080x1920, 8s/6s
- 마스코트: 2D star mascot (purple-pink aura)
- 금지 키워드: readable text, watermark, 3D elements
- 필수 포함: GLOBAL_TECH_SUFFIX, MASCOT_LOCK
- 로고 safe-area: bottom center

### profiles/2d_ghibli_webtoon.yaml
- 스타일: Ghibli + Korean webtoon fusion
- 기법: Cel animation, hand-drawn line art
- 포맷: 9:16, 5s unit (3-Beat)
- 캐릭터: Sowoni (20-22세), Aurum (황금 거북이)
- 금지 키워드: 3D, CGI, photorealistic, volumetric
- 필수 포함: STYLE_LOCK, TEXT_ZERO, CHARACTER_LOCK
- 배경: GENERIC 또는 YEOSU 모드

---

## (4) Gate 강제

### LINT 검증 항목

#### Sora 트랙 필수 체크
- [ ] 9:16, 1080x1920 포함
- [ ] Duration(8s/6s) 명시
- [ ] Camera shot/movement 포함
- [ ] Unit 3~4에 MASCOT_LOCK 포함
- [ ] `Avoid readable on-screen text` 포함
- [ ] Unit 4에 `leave clean negative space for logo overlay` 포함

#### 2D 트랙 필수 체크
- [ ] "2D", "cel animation", "Ghibli" 또는 "webtoon" 키워드 포함
- [ ] NEGATIVE에 3D 엔진/재질 모두 포함
- [ ] 조명이 "hand-painted/watercolor"
- [ ] 카메라가 "2D pan/zoom"
- [ ] 바다가 "painted backdrop"
- [ ] TEXT ZERO 준수

### 완료 기준
- Sora LINT PASS (전수)
- 2D LINT PASS (전수)
- FAIL 1개라도 있으면 PR merge blocked

---

## (5) 완료 보고 (코미/CEO)

보고 항목:
1. 커밋 해시
2. PR 링크
3. LINT_REPORT 2종 (PASS 증빙)
4. SOURCES_INDEX 매핑표 링크

---

## 운영 규칙 요약

| 영역 | 규칙 |
|------|------|
| 원문 | 수정 금지, 날짜별 버전 관리 |
| 정본 | 원문에서만 추출, CHANGELOG 필수 |
| 트랙 | profile로 분리, 섞임 방지 |
| Gate | LINT FAIL → merge 금지 |
| 보고 | 커밋 해시 + PR + LINT + INDEX |
