# Thumbnail Asset SSOT

## 폴더 구조

```
public/images/thumbnails/
├── {location}/
│   ├── base/           ← 원본 기준 이미지 (수동 저장, 코드 덮어쓰기 금지)
│   └── generated/      ← 코드 산출물 전용 (수동 편집 금지)
├── ASSET-SSOT.md       ← 이 문서
└── _test/              ← 테스트 전용 (임시)
```

**지원 장소:** `hamel` / `cafe` / `cablecar` / `hotel`

---

## 파일명 규칙

### generated/ 산출물

```
{location}_{emotion}_{gemstone}_{num}.png
```

| 구성 | 예시 | 출처 |
|------|------|------|
| `location` | `hamel` | 장소 코드 |
| `emotion` | `pause` | 5감정 SSOT |
| `gemstone` | `sapphire` | `config/thumbnail/gemstone-map.json` |
| `num` | `01` | 프롬프트 순번 (2자리 zero-pad) |

**예시:** `hamel_pause_sapphire_01.png`, `cafe_calm_emerald_02.png`

### base/ 원본

자유 명명 가능. 단, `.png` 또는 `.jpg` 확장자 필수.
최소 1장 이상 존재해야 `runGenerate` 실행 허용.

---

## 감정 → 보석 → 별 색 매핑

| emotion | gemstone | star color | hex |
|---------|----------|------------|-----|
| confusion | moonstone | moonstone grey | `#C8C4DC` |
| pause | sapphire | sapphire blue | `#1B5299` |
| calm | emerald | emerald green | `#2D8653` |
| curiosity | topaz | amber topaz | `#D4920A` |
| fragile_hope | diamond | diamond white | `#EEF2FF` |
| growth | citrine | citrine golden | `#E4B84A` |
| passion | ruby | ruby red | `#9B1B30` |

→ 전체 정의: `config/thumbnail/gemstone-map.json`, `config/thumbnail/star-color-map.json`

---

## 운영 규칙

| 규칙 | 내용 |
|------|------|
| base 덮어쓰기 금지 | 원본은 수동 관리. 코드가 base/에 쓰는 것 금지. |
| generated 수동 편집 금지 | 코드 산출물 전용. 직접 수정 금지. |
| base 없으면 생성 중단 | `runGenerate` 실행 시 base/ 이미지 없으면 자동 중단. |
| 별 색 혼합 금지 | 감정당 단일 보석 색만 적용. |
| 등대/건물 색 변경 금지 | 구조물 색은 프롬프트에서 `do NOT recolor` 명시. |

---

## 실행 명령

```bash
# 프롬프트 생성
node scripts/thumbnail/build-thumbnail.js --location hamel
node scripts/thumbnail/build-thumbnail.js --location hamel --emotion pause

# 이미지 생성 (→ generated/ 저장)
node scripts/thumbnail/generate-hamel-images.js
node scripts/thumbnail/generate-hamel-images.js --dry-run

# 5감정 DoD 검증
node scripts/thumbnail/build-thumbnail.js --test
```
