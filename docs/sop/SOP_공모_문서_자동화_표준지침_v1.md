# SOP: 공모 문서 자동화 표준지침 v1

**문서 번호:** SOP-BIDDOC-001
**버전:** 1.0
**작성일:** 2026-02-07
**담당:** 운영팀

---

## 1. 목적

본 지침은 공모/입찰 문서 작성 시 BidDoc Ops Center를 활용한 자동화 파이프라인의 표준 절차를 정의한다.

## 2. 적용 범위

- 공모 제안서
- 입찰 문서
- 사업계획서
- 운영 제안서

## 3. 파이프라인 개요

```
[원본 문서] → [익명화] → [톤 리라이트] → [9장 조립] → [PDF 출력]
                 ↓            ↓              ↓
              Gate1        Gate2          Gate3
```

## 4. 사전 준비

### 4.1 입력 파일 준비

- 파일명: `business_plan.txt`
- 인코딩: UTF-8
- 형식: 일반 텍스트 (.txt)

### 4.2 설정 파일 생성

```bash
cp ops/biddoc/config.example.yml ops/biddoc/config.yml
```

### 4.3 필수 수정 항목

| 항목 | 설명 | 예시 |
|------|------|------|
| `project_name` | 프로젝트명 | 2026 여수세계섬박람회 연계 여행상품 운영 |
| `input_file` | 입력 파일 경로 | inputs/business_plan.txt |
| `custom_patterns` | 익명화 대상 패턴 | 회사명, 행사명, 발주처 등 |

## 5. 실행 절차

### Step 1: 파이프라인 실행

```bash
python scripts/biddoc_run.py --config ops/biddoc/config.yml
```

### Step 2: Gate 결과 확인

각 Gate에서 PASS 확인:

```
  [PASS] Gate1 (잔여 식별요소: 0건)
  [PASS] Gate2
  [PASS] Gate3 (9/9장)
```

### Step 3: 산출물 확인

```
artifacts/biddoc/runs/{YYYYMMDD-HHMM}/
├── outputs/
│   ├── business_plan_anon.txt    # 익명화 결과
│   ├── business_plan_tone.txt    # 톤 변환 결과
│   ├── business_plan_final.md    # 조립 결과
│   └── business_plan_final.pdf   # 최종 PDF
├── reports/
│   ├── qa_report.json            # 익명화 리포트
│   └── gate_results.json         # Gate 검증 결과
└── logs/
    └── run_summary.json          # 실행 요약
```

## 6. Quality Gate 기준

### Gate1: 익명화 검증

| 검증 항목 | 기준 |
|----------|------|
| 회사명 | 0건 잔여 |
| 행사명 | 0건 잔여 |
| 이메일 | 0건 잔여 |
| URL | 0건 잔여 |
| 전화번호 | 0건 잔여 |

**실패 시 조치:**
1. `config.yml`의 `custom_patterns` 확인
2. 누락된 패턴 추가
3. 파이프라인 재실행

### Gate2: 톤 리라이트 검증

| 검증 항목 | 기준 |
|----------|------|
| 익명 라벨 유지 | 원본과 동일 |
| 신규 고유명사 | 0건 추가 |
| 섹션별 문장 수 | 1~2문장 |

**실패 시 조치:**
1. 톤 변환 결과 수동 검토
2. 필요시 `biddoc_tone.py` 로직 수정
3. 파이프라인 재실행

### Gate3: 9장 조립 검증

| 검증 항목 | 기준 |
|----------|------|
| 필수 페이지 수 | 9장 |
| 누락 페이지 | 0건 |

**필수 9장 구조:**
1. 표지
2. 조직/역할
3. 유사 실적
4. 상품/서비스 구성
5. 협력 구조
6. 운영 방식
7. 홍보/판매/통합 운영
8. 리스크 관리
9. 행정/정산

## 7. 문제 해결

### 7.1 Gate1 실패

```
증상: 식별 요소 잔여 n건
원인: custom_patterns에 패턴 누락
해결: config.yml에 패턴 추가
```

### 7.2 인코딩 오류

```
증상: UnicodeDecodeError
원인: 입력 파일이 UTF-8이 아님
해결: 파일을 UTF-8로 다시 저장
```

### 7.3 PDF 생성 실패

```
증상: PDF 라이브러리 없음
해결: pip install markdown weasyprint
```

## 8. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-07 | 초안 작성 |

---

*본 문서는 BidDoc Ops Center v1 기준으로 작성되었습니다.*
