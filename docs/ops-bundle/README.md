# OPS Bundle (운영/현장 전달용)

> 여수 MICE 인센티브 운영 컨트롤타워 운영 문서 패키지
> 버전: 1.0 | 2026-02-05

---

## 포함 문서

| # | 파일명 | 용도 |
|---|--------|------|
| 03 | [03_Registry_Rules.json](./03_Registry_Rules.json) | MICE 인센티브 룰 정의 (JSON) |
| 03 | [03_Registry_Rules_SOP.md](./03_Registry_Rules_SOP.md) | 룰 파일 월간 업데이트 SOP |
| 04 | [04_Onboarding_7Day.md](./04_Onboarding_7Day.md) | Day0~Day7 온보딩 체크리스트 (RACI 포함) |
| 05 | [05_Deal_Registration.md](./05_Deal_Registration.md) | 딜 보호 정책 (증빙 중심) |
| 06 | [06_Demo_Operations.md](./06_Demo_Operations.md) | 데모 운영 가이드 (Reset Token, 링크, Plan B) |

---

## 빠른 참조

### 데모 환경

| 항목 | 값 |
|------|-----|
| **메인 URL** | https://app.dailymiracles.kr/yeosu-ops-center/ |
| **Event ID** | `8a116a08-fa4b-4d5e-9445-acb926795436` |
| **Reset Token** | `yeosu-ops-demo-2026` |
| **헤더명** | `X-DEMO-RESET-TOKEN` |

### Reset 명령 (복사용)

```bash
curl -s -X POST \
  -H "X-DEMO-RESET-TOKEN: yeosu-ops-demo-2026" \
  https://app.dailymiracles.kr/api/ops-center/demo/reset/8a116a08-fa4b-4d5e-9445-acb926795436
```

### 체크리스트 필수 항목 (5개)

1. ☐ 사전 참가자 등록부 (입금일 포함)
2. ☐ 숙박확인서 (영수증 첨부)
3. ☐ 지출증빙 (세금계산서/카드전표)
4. ☐ 사진 - 여수시 로고 노출 (2장+)
5. ☐ 사진 - 회의/행사 장면 (2장+)

---

## 담당자

| 역할 | 담당 | 연락처 |
|------|------|--------|
| 기술 지원 | 기술팀 | tech@yeosu-travel.kr |
| 정책 문의 | 관광과 | - |

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-05 | 초기 버전 생성 |

---

*최종 수정: 2026-02-05*
