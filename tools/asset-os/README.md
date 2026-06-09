# DreamTown Asset OS — 설치 가이드

## 개요
Google Drive의 DT-* 파일을 자동으로 스캔해 Google Sheet에 등록한다.

## 시트 구조

| 시트 | 대상 파일 | 자동/수동 |
|------|---------|---------|
| Asset_Master | 이미지(.png/.jpg/.webp), 포스터, 썸네일 | 자동 |
| Video_Master | Kling 영상(.mp4/.mov), DaVinci(.drp) | 자동 |
| SSOT | 문서(.pdf/.pptx/.md/.docx) | 자동 |
| Partner | 제휴처 정보 + Drive 링크 | 수동 |

## 파일명 규칙

```
DT-{Country}-{Route}-{EP}-{Location}-{Type}-{SubType}-{Version}.{ext}
```

| 파트 | 예시 | 설명 |
|------|------|------|
| Country | KR, CN, JP | 국가 코드 |
| Route | SR, WR, FR | Starlit/Weekday/Family Route |
| EP | EP01, EP07 | 에피소드 번호 |
| Location | HAMEL, CABLE, MINA | 장소 코드 |
| Type | IMG, VID, SSOT, PPT | 파일 유형 |
| SubType | MASTER, THUMB, KLING | 세부 유형 |
| Version | V01, V02 | 버전 |

**예시:**
```
DT-KR-SR-EP01-HAMEL-IMG-MASTER-V01.png   → Asset_Master
DT-KR-SR-EP01-HAMEL-VID-KLING-V01.mp4   → Video_Master
DT-KR-SR-EP01-SSOT-DOC-V01.pdf          → SSOT
```

## 설치 순서

### 1. Google Sheet 생성
1. Google Sheet 새 파일 생성
2. 이름: `DreamTown Asset OS`

### 2. Apps Script 연결
1. 확장 프로그램 > Apps Script 클릭
2. `Code.gs` 파일 내용 전체 복사 → 에디터에 붙여넣기
3. 저장 (Ctrl+S)

### 3. 최초 실행
1. 함수 선택 드롭다운에서 `setupSheets` 선택
2. 실행(▶) 클릭
3. 권한 요청 팝업 → 허용

### 4. Google Sheet에서 사용
1. 시트 새로고침 → 상단 메뉴에 `🌟 Asset OS` 표시
2. Asset OS > Drive 폴더 ID 설정
   - Google Drive에서 DreamTown 루트 폴더 열기
   - URL: `https://drive.google.com/drive/folders/[여기가 폴더 ID]`
3. Asset OS > 전체 동기화

## 동기화 동작

- DT-로 시작하지 않는 파일은 무시
- 이미 등록된 파일명은 중복 추가 안 함 (File Name 기준)
- 하위 폴더까지 재귀 스캔
- Partner 시트는 수동 관리 (Drive 링크 컬럼에 링크 붙여넣기)

## 컬럼 설명 (Asset_Master / Video_Master)

| 컬럼 | 설명 |
|------|------|
| File Name | 파일 전체명 |
| Country | 국가 코드 (파일명 파싱) |
| Route | 항로 코드 |
| EP | 에피소드 |
| Location | 장소 코드 |
| Type | 파일 유형 |
| Sub-Type | 세부 유형 |
| Version | 버전 |
| Extension | 확장자 |
| Drive Link | Google Drive 직접 링크 |
| Created Date | 파일 생성일 |
| Last Synced | 마지막 동기화 시각 |
| Status | Active / Archived |

## 자동 트리거 설정 (선택)

매일 자동 동기화를 원하면:
1. Apps Script > 트리거(시계 아이콘) 클릭
2. 트리거 추가
3. 함수: `syncAll`, 이벤트 소스: 시간 기반, 매일 오전 9시

## 문의
- 파일명 규칙 변경 시 `_parseFileName()` 함수 수정
- 새 카테고리 추가 시 `_getCategory()` 함수에 확장자/타입 추가
