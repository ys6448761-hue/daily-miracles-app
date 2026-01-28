# 하루하루의 기적 디자인 시스템 스킬

> 브랜드 일관성을 보장하는 디자인 토큰 및 가이드라인

---

## 사용법

디자인 작업 시 이 스킬을 참조하면 브랜드 일관성이 보장됩니다.

### 트리거 키워드

다음 표현이 나오면 이 스킬을 자동 참조:

- "브랜드 가이드에 맞춰서"
- "디자인 시스템 적용해서"
- "하루하루의 기적 스타일로"
- "브랜드 컬러로"
- "공식 디자인으로"

---

## 핵심 컬러

| 역할 | 컬러 코드 | 이름 | 사용처 |
|------|----------|------|--------|
| Primary | `#9B87F5` | 메인 퍼플 | CTA 버튼, 브랜드 아이덴티티 |
| Secondary | `#F5A7C6` | 핑크/코랄 | 서브 강조, 포인트 |
| Accent | `#6E59A5` | 딥퍼플 | 호버, 강조 |
| Background | `#FFF5F7` | 연핑크 | 페이지 배경 |
| Highlight | `#FFE5EC` | 하이라이트 | 강조 배경 |

### 그라데이션

```css
background: linear-gradient(135deg, #9B87F5, #F5A7C6);
```

---

## 폰트

| 용도 | 폰트 | Weight |
|------|------|--------|
| 본문 | Pretendard | 400 (Regular) |
| 강조 | Pretendard | 500 (Medium) |
| 제목 | Pretendard | 600 (SemiBold) |
| 헤드라인 | Pretendard | 700 (Bold) |

### 폰트 스택

```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
```

---

## 참조 파일

| 파일 | 내용 |
|------|------|
| `designsystem.json` | 전체 디자인 토큰 (컬러, 폰트, 간격 등) |
| `brand-voice.md` | 톤앤매너, 말투 가이드 |
| `forbidden-words.json` | 절대 사용 금지 용어 목록 |
| `examples/` | 버튼, 카드, 메시지박스 예시 |

---

## 주의사항

### 절대 금지

1. **사주/관상/점술 관련 용어 사용 금지**
   - "운세", "사주", "관상", "점" 등
   - 대신: "기적지수", "잠재력 분석", "마음 탐색"

2. **브랜드 컬러 임의 변경 금지**
   - 항상 지정된 컬러 코드 사용
   - 그라데이션 방향: 135deg 유지

3. **톤앤매너 일탈 금지**
   - 따뜻하지만 전문적인 톤 유지
   - 과학적/심리학적 접근 강조

### 필수 준수

1. 모든 버튼은 `border-radius: 8px` 사용
2. 카드 컴포넌트는 `shadow-card` 적용
3. 텍스트 간격은 `line-height: 1.5` 기본

---

## 신호등 시스템 컬러

소원이 상태 표시용:

| 상태 | 컬러 | 의미 |
|------|------|------|
| RED | `#FF5252` | 긴급 대응 필요 |
| YELLOW | `#FFD740` | 모니터링 필요 |
| GREEN | `#69F0AE` | 정상 진행 |

---

## CSS 빠른 참조

```css
/* 메인 버튼 */
.btn-primary {
  background: linear-gradient(135deg, #9B87F5, #F5A7C6);
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 250ms ease-in-out;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 135, 245, 0.4);
}

/* 카드 */
.card {
  background: #FFFFFF;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 메시지 박스 */
.message-box {
  background: #FFF5F7;
  border-left: 4px solid #9B87F5;
  padding: 16px;
  border-radius: 0 8px 8px 0;
}
```

---

*마지막 업데이트: 2025-01-29*
