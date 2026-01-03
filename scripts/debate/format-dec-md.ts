/**
 * format-dec-md.ts
 *
 * COO Synthesizer의 출력을 DEC (Decision) 마크다운 문서로 포맷팅합니다.
 */

// ===== 타입 정의 =====

export interface SynthesizerOutput {
  role: string;
  timestamp: string;
  debate_id: string;
  topic: string;
  synthesis: {
    consensus_points: Array<{
      point: string;
      supporting_roles: string[];
      confidence: number;
    }>;
    divergent_points: Array<{
      point: string;
      positions: Record<string, string>;
      resolution: string;
    }>;
    key_insights: string[];
  };
  decision: {
    id: string;
    title: string;
    summary: string;
    rationale: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
    impact: 'high' | 'medium' | 'low';
    affected_areas: string[];
  };
  action_items: Array<{
    id: string;
    task: string;
    assignee: string;
    deadline: string;
    priority: 'high' | 'medium' | 'low';
    dependencies: string[];
    success_criteria: string;
  }>;
  risks_acknowledged: Array<{
    risk: string;
    mitigation: string;
    owner: string;
  }>;
  next_steps: string[];
  approval_required: boolean;
  approvers: string[];
  confidence: number;
}

export interface FormatOptions {
  include_raw_synthesis?: boolean;
  include_approval_section?: boolean;
  include_changelog?: boolean;
}

// ===== 유틸리티 함수 =====

/**
 * 영향도를 이모지로 변환
 */
function impactEmoji(impact: string): string {
  switch (impact) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

/**
 * 상태를 한글로 변환
 */
function statusText(status: string): string {
  switch (status) {
    case 'draft': return '초안';
    case 'pending_approval': return '승인 대기';
    case 'approved': return '승인됨';
    case 'rejected': return '반려됨';
    default: return status;
  }
}

/**
 * 역할명을 한글로 변환
 */
function roleToKorean(role: string): string {
  const mapping: Record<string, string> = {
    'creative': '루미',
    'cro': '재미',
    'safety': '여의보주',
    'synthesizer': '코미',
    '코미': '코미',
    '재미': '재미',
    '루미': '루미',
    '여의보주': '여의보주',
    'Code': 'Claude Code'
  };
  return mapping[role] || role;
}

// ===== 메인 함수 =====

/**
 * DEC 마크다운 문서 생성
 */
export function formatDecMarkdown(
  output: SynthesizerOutput,
  options: FormatOptions = {}
): string {
  const {
    include_raw_synthesis = false,
    include_approval_section = true,
    include_changelog = true
  } = options;

  const { decision, synthesis, action_items, risks_acknowledged, next_steps } = output;

  // 날짜 포맷
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  let markdown = `# ${decision.id}: ${decision.title}

> **상태:** ${statusText(decision.status)} | **영향도:** ${impactEmoji(decision.impact)} ${decision.impact}
> **생성일:** ${dateStr} ${timeStr} KST
> **토론 ID:** ${output.debate_id}

---

## 요약

${decision.summary}

---

## 결정 사항

${decision.rationale}

---

## 영향 범위

| 항목 | 내용 |
|------|------|
| 영향도 | ${impactEmoji(decision.impact)} ${decision.impact} |
| 영역 | ${decision.affected_areas.join(', ')} |
| 신뢰도 | ${Math.round(output.confidence * 100)}% |

---

## 핵심 인사이트

${synthesis.key_insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

---

## Action Items

| # | 업무 | 담당 | 기한 | 우선순위 | 완료 기준 |
|---|------|------|------|----------|----------|
${action_items.map((item, i) =>
  `| ${i + 1} | ${item.task} | ${roleToKorean(item.assignee)} | ${item.deadline} | ${impactEmoji(item.priority)} ${item.priority} | ${item.success_criteria} |`
).join('\n')}

---

## 리스크 및 대응

| 리스크 | 대응 방안 | 담당 |
|--------|----------|------|
${risks_acknowledged.map(risk =>
  `| ${risk.risk} | ${risk.mitigation} | ${roleToKorean(risk.owner)} |`
).join('\n')}

---

## 다음 단계

${next_steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

`;

  // 합의/이견 섹션 (선택)
  if (include_raw_synthesis && synthesis.consensus_points.length > 0) {
    markdown += `
---

## 토론 상세

### 합의 사항

${synthesis.consensus_points.map(cp =>
  `- **${cp.point}**
  - 지지: ${cp.supporting_roles.map(r => roleToKorean(r)).join(', ')}
  - 신뢰도: ${Math.round(cp.confidence * 100)}%`
).join('\n')}

`;

    if (synthesis.divergent_points.length > 0) {
      markdown += `### 이견 사항

${synthesis.divergent_points.map(dp =>
  `- **${dp.point}**
  ${Object.entries(dp.positions).map(([role, position]) =>
    `  - ${roleToKorean(role)}: ${position}`
  ).join('\n')}
  - 해결: ${dp.resolution}`
).join('\n')}

`;
    }
  }

  // 승인 섹션 (선택)
  if (include_approval_section && output.approval_required) {
    markdown += `---

## 승인

${output.approvers.map(approver => `- [ ] ${approver}`).join('\n')}
- [x] 코미 (COO) - 초안 작성

`;
  }

  // 변경 이력 (선택)
  if (include_changelog) {
    markdown += `---

## 변경 이력

| 날짜 | 담당 | 내용 |
|------|------|------|
| ${dateStr} | 코미 | 초안 생성 |

`;
  }

  // 푸터
  markdown += `---

*🤖 Generated by Aurora 5 Debate Process*
*📁 파일: docs/decisions/${decision.id}.md*
`;

  return markdown;
}

/**
 * DEC 파일명 생성
 */
export function generateDecFilename(decId: string): string {
  return `${decId}.md`;
}

// ===== CLI 실행 =====

if (require.main === module) {
  // 테스트 데이터
  const testOutput: SynthesizerOutput = {
    role: 'synthesizer',
    timestamp: new Date().toISOString(),
    debate_id: 'DEB-2026-0102-001',
    topic: '인스타그램 광고 캠페인 시작 여부',
    synthesis: {
      consensus_points: [
        {
          point: '광고 진행은 긍정적',
          supporting_roles: ['creative', 'cro'],
          confidence: 0.85
        }
      ],
      divergent_points: [
        {
          point: '예산 규모',
          positions: {
            creative: '50만원 전체 투자',
            cro: '30만원부터 테스트'
          },
          resolution: '30만원 테스트 후 결과에 따라 증액'
        }
      ],
      key_insights: [
        '소원그림 콘텐츠가 인스타그램에 적합',
        '타겟 연령층(25-45세)과 플랫폼 사용층 일치',
        '초기 테스트로 리스크 최소화 필요'
      ]
    },
    decision: {
      id: 'DEC-2026-0102-001',
      title: '인스타그램 광고 캠페인 30만원 테스트 시작',
      summary: '소원그림 콘텐츠를 활용한 인스타그램 광고를 30만원 예산으로 1주일 테스트 진행 후, 결과에 따라 50만원으로 증액 여부 결정',
      rationale: '팀 전원이 광고 진행에 긍정적이나, 리스크 관리를 위해 단계적 접근 채택. 초기 테스트를 통해 전환율, CAC 등 핵심 지표 확보 후 본격 투자.',
      status: 'pending_approval',
      impact: 'medium',
      affected_areas: ['마케팅', '예산', '소원이 유입']
    },
    action_items: [
      {
        id: 'ACT-001',
        task: '인스타그램 비즈니스 계정 설정 확인',
        assignee: 'Code',
        deadline: '2026-01-03',
        priority: 'high',
        dependencies: [],
        success_criteria: '광고 관리자 접근 가능'
      },
      {
        id: 'ACT-002',
        task: '광고용 소원그림 3종 선정',
        assignee: '여의보주',
        deadline: '2026-01-04',
        priority: 'high',
        dependencies: ['ACT-001'],
        success_criteria: '품질 검수 통과'
      },
      {
        id: 'ACT-003',
        task: '광고 카피 3종 작성',
        assignee: '루미',
        deadline: '2026-01-04',
        priority: 'medium',
        dependencies: [],
        success_criteria: '브랜드 가이드라인 준수'
      }
    ],
    risks_acknowledged: [
      {
        risk: '광고 효율이 낮을 수 있음',
        mitigation: '1주일 테스트로 손실 최소화',
        owner: '코미'
      },
      {
        risk: '부정적 댓글 가능성',
        mitigation: '재미가 24시간 모니터링',
        owner: '재미'
      }
    ],
    next_steps: [
      '푸르미르님 승인 대기',
      '승인 후 ACT-001부터 순차 진행',
      '1주일 후 성과 리뷰 회의'
    ],
    approval_required: true,
    approvers: ['푸르미르'],
    confidence: 0.82
  };

  const markdown = formatDecMarkdown(testOutput, {
    include_raw_synthesis: true,
    include_approval_section: true,
    include_changelog: true
  });

  console.log(markdown);
}

export default formatDecMarkdown;
