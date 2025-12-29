---
name: wish-journey
description: 소원이 여정 파이프라인
version: 1.0.0
---

# 소원 여정 파이프라인

## 단계 정의

### Step 1: 소원 접수
```yaml
step:
  id: 1
  name: "소원 접수"
  agent: wish-intake
  input:
    - name
    - birthdate
    - contact
    - gem_type
    - wish_content
  output: wish_id
  success_condition: "wish_id가 생성됨"
  next_step: 2
  on_failure: "retry_3_times"
```

### Step 2: 기적 분석
```yaml
step:
  id: 2
  name: "기적 분석"
  agent: analysis-engine
  input: wish_id
  output:
    - miracle_index
    - five_destinies
    - relationship_analysis
  success_condition: "miracle_index 50-100 범위"
  next_step: [3, 4]  # 병렬
  on_failure: "retry_3_times"
```

### Step 3: 소원그림 생성 (병렬)
```yaml
step:
  id: 3
  name: "소원그림 생성"
  agent: image-creator
  input:
    - wish_content
    - gem_type
  output: image_url
  success_condition: "image_url 존재"
  next_step: 5
  on_failure: "use_fallback_image"
```

### Step 4: PDF 생성 (병렬)
```yaml
step:
  id: 4
  name: "PDF 생성"
  agent: pdf-generator
  input:
    - miracle_index
    - five_destinies
    - roadmap_data
  output: pdf_url
  success_condition: "pdf_url 존재"
  next_step: 5
  on_failure: "skip_pdf"
```

### Step 5: 결과 전달
```yaml
step:
  id: 5
  name: "결과 전달"
  agent: message-sender
  input:
    - contact
    - image_url
    - pdf_url
    - result_page_url
  output: delivery_status
  success_condition: "delivery_status == sent"
  next_step: 6
  on_failure: "retry_3_times"
```

### Step 6: 7일 메시지 예약
```yaml
step:
  id: 6
  name: "7일 메시지 예약"
  agent: message-sender
  input:
    - contact
    - wish_type
    - start_date
  output: schedule_ids
  success_condition: "7개 메시지 예약됨"
  next_step: complete
  on_failure: "alert_comi"
```

## 완료 후
- Registry에 전체 여정 기록
- metrics에 성공/실패 카운트
- 업셀링 조건 체크
