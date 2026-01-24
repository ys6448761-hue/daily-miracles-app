# claude/pipelines/blog-publish.md
---
name: BlogPublish
goal: 블로그 최적화+사람검수+외부리뷰+Ghost 예약발행까지 "원클릭" 자동화 (핑퐁 최소화)
inputs:
  topic: string
  keywords: [string]
  tone: string  # 따뜻/희망/친근, 과학적 표현(단정 금지)
  publish_mode: draft|schedule
  schedule_at: datetime|null
outputs:
  ghost_post_id: string|null
  published_url: string|null
  qa_report: object
  trafficlight: green|yellow|red
---

## Central Control (Airtable)
Table: Blog Posts Inbox
Status:
NEW → BRIEFED → DRAFTED → QA_DONE → NEEDS_HUMAN → EXTERNAL_REVIEW → APPROVED → SCHEDULED → PUBLISHED
TrafficLight:
green(auto) / yellow(needs-human) / red(block+escalate)

## Step 1) Planner (brief 생성)
Agent: content-planner
Output:
- target_query(메인쿼리) + 3 sub queries
- H2 3개 구조
- 내부링크 후보 2개
- 금지어/단정표현 가드레일 요약

## Step 2) Writer (초안 생성)
Agent: blog-writer(Claude)
Rules:
- 800~1500자(가변)
- H1 1개, H2 3개
- CTA 1개(과하지 않게)
Output: draft_md

## Step 3) SEO Packager
Agent: seo-agent
Output:
- title
- meta_title
- meta_description(90~155자)
- slug(영문)
- tags(2~3)
- internal_links(2개)
- feature_image_prompt + alt_text

## Step 4) SelfChecker (스크립트 검수)
Scripts:
- validate-seo: 길이/구조/메타/태그/링크 규칙 체크
- risk-scan: 금지어(사주/운세/궁합), 과장/근거없는 수치("증명", "n명", "%") 탐지
- voice-check: 따뜻/희망/친근 + 단정표현 완화(경향/도움/원리)
Output: qa_report + trafficlight

## Step 5) HumanTouch Gate (필수)
Field: purmir_story_cut (2~4문장)
- 비어있으면 trafficlight=red (발행 금지)
- 채워지면 다음 단계 진행 가능

## Step 6) External Review (요청/승인 자동화)
- preview 링크 + 체크리스트 전송
- actions: Approve / Needs Fix / Reject
- Approve만 다음 단계 진행
- SLA 지나면 코미 에스컬레이션

## Step 7) Publisher (Ghost Admin API)
조건: APPROVED only
동작:
- publish_mode=draft: Draft 업로드
- publish_mode=schedule: 예약발행
저장:
- ghost_post_id
- published_url(발행 시)

## Step 8) Notify + Log
- Slack: 요약 + 미리보기/발행 URL + qa_report 핵심
- Archive: content/{{date}}/{{slug}}.md + qa_report.json

---

## 🗂 Airtable 스키마 (Blog Posts Inbox)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| Status | single select | NEW/BRIEFED/DRAFTED/QA_DONE/NEEDS_HUMAN/EXTERNAL_REVIEW/APPROVED/SCHEDULED/PUBLISHED |
| TrafficLight | single select | green/yellow/red |
| Topic | text | 주제 |
| Keywords | text/multi-select | 타겟 키워드 |
| Tone | single select | 따뜻/희망/친근 |
| Draft_MD | long text | 초안 마크다운 |
| Final_MD | long text | 최종 마크다운 |
| Meta_Title | text | SEO 타이틀 |
| Meta_Desc | text | 메타 설명 (90~155자) |
| Slug | text | URL 슬러그 (영문) |
| Tags | multi-select | 태그 2~3개 |
| Internal_Links | long text | 내부링크 2개 |
| Feature_Image_Prompt | long text | 대표 이미지 프롬프트 |
| Alt_Text | text | 이미지 대체 텍스트 |
| Risk_Flags | long text | 리스크 플래그 |
| QA_Report | long text/json | QA 리포트 |
| **Purmir_Story_Cut** | long text | **필수 게이트** (2~4문장) |
| External_Reviewer | text | 외부 리뷰어 |
| Review_Status | single select | PENDING/APPROVED/NEEDS_FIX/REJECTED |
| Ghost_Post_ID | text | Ghost 포스트 ID |
| Published_URL | url | 발행된 URL |
| Schedule_At | datetime | 예약 발행 시간 |

---

## ✅ DoD (Definition of Done)

핑퐁 제로 여부로 합격 판정:

- [ ] `/blog-publish` 1회 실행 → Airtable 카드 생성 + 초안 + SEO 패키지 + QA 리포트 자동 생성
- [ ] 🟢면 사람 개입 없이 **예약발행까지 자동**
- [ ] 🟡/🔴일 때만 Slack으로 **"수정 포인트만"** 전달
- [ ] `Purmir_Story_Cut` 비면 **발행 불가(강제)**
- [ ] 외부 리뷰 Approve 전엔 **절대 발행 안 됨**

---

## P0 구현 체크리스트 (이번 주)

- [ ] Airtable Blog Posts Inbox 테이블 생성 (위 스키마)
- [x] blog-publish 파이프라인 MD 생성
- [x] blog-review-spec MD (체크리스트 + Slack 규칙)
- [ ] scripts 3개: validate-seo, risk-scan, voice-check
- [ ] Slack 승인 카드 (Approve / Fix / Reject)
- [ ] Ghost Admin API 연동 (Draft + 예약발행)

## P1 구현 체크리스트 (다음 주)

- [ ] OSMU: 블로그 발행 후 SNS/뉴스레터 자동 파생
- [ ] Search Console 기반 feedback-loop (쿼리/CTR/순위로 주제 추천)
