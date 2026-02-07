# BidDoc Ops Center v1

공모/입찰 문서 자동화 파이프라인 운영 센터

## 개요

BidDoc Ops Center는 입찰 문서 작성 과정을 표준화하고 반복 실행 가능하게 만든 자동화 파이프라인입니다.

```
[원본 문서] → [익명화] → [톤 리라이트] → [9장 조립] → [PDF 출력]
                 ↓            ↓              ↓
              Gate1        Gate2          Gate3
```

## 빠른 시작

```bash
# 1. 설정 파일 생성
cp ops/biddoc/config.example.yml ops/biddoc/config.yml

# 2. config.yml 수정 (프로젝트별 설정)
# 3. 파이프라인 실행
python scripts/biddoc_run.py --config ops/biddoc/config.yml
```

## 파이프라인 단계

| 단계 | 스크립트 | 입력 | 출력 | Quality Gate |
|------|----------|------|------|--------------|
| Step 1 | biddoc_anonymize.py | 원본 텍스트 | 익명화 텍스트 | Gate1: 식별요소 잔여 0 |
| Step 2 | biddoc_tone.py | 익명화 텍스트 | 공적 어투 텍스트 | Gate2: 라벨 유지, 신규 추가 0 |
| Step 3 | biddoc_assemble.py | 톤 변환 텍스트 | 9장 구조 문서 | Gate3: 9장 누락 0 |
| Step 4 | biddoc_export_pdf.py | 조립 문서 | PDF | - |

## 디렉토리 구조

```
artifacts/biddoc/runs/{YYYYMMDD-HHMM}/
├── inputs/                  # 원본 입력 파일
│   └── business_plan.txt
├── outputs/                 # 각 단계 출력
│   ├── business_plan_anon.txt
│   ├── business_plan_tone.txt
│   ├── business_plan_final.md
│   └── business_plan_final.pdf
├── reports/                 # 검증 리포트
│   ├── qa_report.json
│   └── gate_results.json
└── logs/                    # 실행 로그
    └── run_summary.json
```

## Quality Gates

### Gate1: 익명화 검증
- 모든 식별 요소(회사명, 행사명, 이메일, URL, 전화번호) 마스킹 완료
- 잔여 식별 요소 0건이어야 PASS

### Gate2: 톤 리라이트 검증
- 익명 라벨([회사명], [행사명] 등) 유지
- 신규 고유명사/수치 추가 0
- 섹션별 1~2문장 준수

### Gate3: 9장 조립 검증
- 필수 9장 구조 완비
- 누락 페이지 0

## 설정 파일

`config.yml`에서 다음을 설정할 수 있습니다:

- **anonymize**: 익명화 전략 및 커스텀 패턴
- **tone**: 용어 치환 및 문장 수 제한
- **assemble**: 9장 구조 정의
- **export**: PDF 출력 옵션
- **gates**: Quality Gate 조건

## 명령어 옵션

```bash
# 전체 파이프라인 실행
python scripts/biddoc_run.py --config ops/biddoc/config.yml

# 특정 단계만 실행
python scripts/biddoc_run.py --config ops/biddoc/config.yml --step anonymize
python scripts/biddoc_run.py --config ops/biddoc/config.yml --step tone
python scripts/biddoc_run.py --config ops/biddoc/config.yml --step assemble
python scripts/biddoc_run.py --config ops/biddoc/config.yml --step export

# Dry-run (실제 실행 없이 검증만)
python scripts/biddoc_run.py --config ops/biddoc/config.yml --dry-run

# 상세 로그 출력
python scripts/biddoc_run.py --config ops/biddoc/config.yml --verbose
```

## 산출물

| 파일 | 설명 |
|------|------|
| `business_plan_final.pdf` | 최종 입찰 문서 |
| `run_summary.json` | 파이프라인 실행 요약 |
| `gate_results.json` | Quality Gate 검증 결과 |
| `qa_report.json` | 익명화 상세 리포트 |

## 관련 문서

- [Quality Gate 규격](gates.md)
- [SOP: 공모 문서 자동화 표준지침](../../docs/sop/SOP_공모_문서_자동화_표준지침_v1.md)
- [GATE: BidDoc Compliance](../../docs/system/GATE_BidDoc_Compliance.md)
