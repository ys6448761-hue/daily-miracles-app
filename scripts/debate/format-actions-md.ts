/**
 * format-actions-md.ts
 *
 * Action Item을 별도의 마크다운 문서로 포맷팅합니다.
 * 담당자별, 우선순위별 정렬 및 필터링을 지원합니다.
 */

// ===== 타입 정의 =====

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  success_criteria: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked';
  notes?: string;
}

export interface ActionsFormatOptions {
  group_by?: 'assignee' | 'priority' | 'deadline' | 'none';
  include_dependencies?: boolean;
  include_success_criteria?: boolean;
  filter_assignee?: string;
  filter_priority?: 'high' | 'medium' | 'low';
}

export interface ActionsSummary {
  total: number;
  by_priority: { high: number; medium: number; low: number };
  by_assignee: Record<string, number>;
  by_status: { pending: number; in_progress: number; completed: number; blocked: number };
}

// ===== 유틸리티 함수 =====

/**
 * 우선순위 이모지
 */
function priorityEmoji(priority: string): string {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

/**
 * 상태 이모지
 */
function statusEmoji(status?: string): string {
  switch (status) {
    case 'completed': return '✅';
    case 'in_progress': return '🔄';
    case 'blocked': return '🚫';
    case 'pending':
    default: return '⬜';
  }
}

/**
 * 담당자를 한글로 변환
 */
function assigneeToKorean(assignee: string): string {
  const mapping: Record<string, string> = {
    '코미': '코미 (COO)',
    '재미': '재미 (CRO)',
    '루미': '루미 (Analyst)',
    'Code': 'Claude Code',
    '여의보주': '여의보주 (QA)',
    'creative': '루미',
    'cro': '재미',
    'safety': '여의보주',
    'synthesizer': '코미'
  };
  return mapping[assignee] || assignee;
}

/**
 * 우선순위 정렬 순서
 */
function priorityOrder(priority: string): number {
  switch (priority) {
    case 'high': return 0;
    case 'medium': return 1;
    case 'low': return 2;
    default: return 3;
  }
}

/**
 * 요약 통계 계산
 */
function calculateSummary(items: ActionItem[]): ActionsSummary {
  const summary: ActionsSummary = {
    total: items.length,
    by_priority: { high: 0, medium: 0, low: 0 },
    by_assignee: {},
    by_status: { pending: 0, in_progress: 0, completed: 0, blocked: 0 }
  };

  for (const item of items) {
    // 우선순위별
    if (item.priority in summary.by_priority) {
      summary.by_priority[item.priority]++;
    }

    // 담당자별
    const assignee = item.assignee || 'TBD';
    summary.by_assignee[assignee] = (summary.by_assignee[assignee] || 0) + 1;

    // 상태별
    const status = item.status || 'pending';
    if (status in summary.by_status) {
      summary.by_status[status as keyof typeof summary.by_status]++;
    }
  }

  return summary;
}

// ===== 메인 함수 =====

/**
 * Action Items 마크다운 생성
 */
export function formatActionsMarkdown(
  decId: string,
  topic: string,
  items: ActionItem[],
  options: ActionsFormatOptions = {}
): string {
  const {
    group_by = 'none',
    include_dependencies = true,
    include_success_criteria = true,
    filter_assignee,
    filter_priority
  } = options;

  // 필터링
  let filtered = [...items];
  if (filter_assignee) {
    filtered = filtered.filter(item =>
      item.assignee === filter_assignee ||
      assigneeToKorean(item.assignee).includes(filter_assignee)
    );
  }
  if (filter_priority) {
    filtered = filtered.filter(item => item.priority === filter_priority);
  }

  // 정렬 (우선순위 → 기한)
  filtered.sort((a, b) => {
    const priorityDiff = priorityOrder(a.priority) - priorityOrder(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return a.deadline.localeCompare(b.deadline);
  });

  // 요약 통계
  const summary = calculateSummary(filtered);

  // 날짜
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  let markdown = `# Action Items

> **관련 결정:** ${decId}
> **주제:** ${topic}
> **생성일:** ${dateStr}
> **총 항목:** ${summary.total}개

---

## 요약

| 구분 | 개수 |
|------|------|
| 🔴 High | ${summary.by_priority.high} |
| 🟡 Medium | ${summary.by_priority.medium} |
| 🟢 Low | ${summary.by_priority.low} |

### 담당자별

| 담당자 | 항목 수 |
|--------|--------|
${Object.entries(summary.by_assignee)
  .map(([assignee, count]) => `| ${assigneeToKorean(assignee)} | ${count} |`)
  .join('\n')}

---

`;

  // 그룹화 없이 단일 테이블
  if (group_by === 'none') {
    markdown += `## 전체 목록

| # | 상태 | 업무 | 담당 | 기한 | 우선순위 |
|---|------|------|------|------|----------|
${filtered.map((item, i) =>
  `| ${i + 1} | ${statusEmoji(item.status)} | ${item.task} | ${assigneeToKorean(item.assignee)} | ${item.deadline} | ${priorityEmoji(item.priority)} |`
).join('\n')}

`;
  }

  // 담당자별 그룹화
  if (group_by === 'assignee') {
    const byAssignee: Record<string, ActionItem[]> = {};
    for (const item of filtered) {
      const key = item.assignee || 'TBD';
      if (!byAssignee[key]) byAssignee[key] = [];
      byAssignee[key].push(item);
    }

    for (const [assignee, groupItems] of Object.entries(byAssignee)) {
      markdown += `## ${assigneeToKorean(assignee)} (${groupItems.length}건)

| # | 상태 | 업무 | 기한 | 우선순위 |
|---|------|------|------|----------|
${groupItems.map((item, i) =>
  `| ${i + 1} | ${statusEmoji(item.status)} | ${item.task} | ${item.deadline} | ${priorityEmoji(item.priority)} |`
).join('\n')}

`;
    }
  }

  // 우선순위별 그룹화
  if (group_by === 'priority') {
    const priorities = ['high', 'medium', 'low'] as const;
    const priorityLabels = { high: '긴급', medium: '중요', low: '일반' };

    for (const priority of priorities) {
      const groupItems = filtered.filter(item => item.priority === priority);
      if (groupItems.length === 0) continue;

      markdown += `## ${priorityEmoji(priority)} ${priorityLabels[priority]} (${groupItems.length}건)

| # | 상태 | 업무 | 담당 | 기한 |
|---|------|------|------|------|
${groupItems.map((item, i) =>
  `| ${i + 1} | ${statusEmoji(item.status)} | ${item.task} | ${assigneeToKorean(item.assignee)} | ${item.deadline} |`
).join('\n')}

`;
    }
  }

  // 상세 정보 (의존성, 완료 기준)
  if (include_dependencies || include_success_criteria) {
    markdown += `---

## 상세 정보

`;
    for (const item of filtered) {
      markdown += `### ${item.id}: ${item.task}

- **담당:** ${assigneeToKorean(item.assignee)}
- **기한:** ${item.deadline}
- **우선순위:** ${priorityEmoji(item.priority)} ${item.priority}
- **상태:** ${statusEmoji(item.status)} ${item.status || 'pending'}
`;
      if (include_dependencies && item.dependencies.length > 0) {
        markdown += `- **의존성:** ${item.dependencies.join(', ')}
`;
      }
      if (include_success_criteria && item.success_criteria) {
        markdown += `- **완료 기준:** ${item.success_criteria}
`;
      }
      if (item.notes) {
        markdown += `- **메모:** ${item.notes}
`;
      }
      markdown += '\n';
    }
  }

  // 푸터
  markdown += `---

*🤖 Generated by Aurora 5 Debate Process*
*📁 파일: docs/actions/ACTIONS-${decId}.md*
`;

  return markdown;
}

/**
 * 체크리스트 형식 마크다운 생성 (간단 버전)
 */
export function formatActionsChecklist(
  decId: string,
  items: ActionItem[]
): string {
  const sorted = [...items].sort((a, b) =>
    priorityOrder(a.priority) - priorityOrder(b.priority)
  );

  let markdown = `# ${decId} Action Checklist

`;

  for (const item of sorted) {
    const checked = item.status === 'completed' ? 'x' : ' ';
    markdown += `- [${checked}] ${priorityEmoji(item.priority)} **${item.task}** (@${item.assignee}, ${item.deadline})
`;
  }

  return markdown;
}

// ===== CLI 실행 =====

if (require.main === module) {
  // 테스트 데이터
  const testItems: ActionItem[] = [
    {
      id: 'ACT-001',
      task: '인스타그램 비즈니스 계정 설정 확인',
      assignee: 'Code',
      deadline: '2026-01-03',
      priority: 'high',
      dependencies: [],
      success_criteria: '광고 관리자 접근 가능',
      status: 'pending'
    },
    {
      id: 'ACT-002',
      task: '광고용 소원그림 3종 선정',
      assignee: '여의보주',
      deadline: '2026-01-04',
      priority: 'high',
      dependencies: ['ACT-001'],
      success_criteria: '품질 검수 통과',
      status: 'pending'
    },
    {
      id: 'ACT-003',
      task: '광고 카피 3종 작성',
      assignee: '루미',
      deadline: '2026-01-04',
      priority: 'medium',
      dependencies: [],
      success_criteria: '브랜드 가이드라인 준수',
      status: 'in_progress'
    },
    {
      id: 'ACT-004',
      task: '광고 성과 모니터링 대시보드 준비',
      assignee: '루미',
      deadline: '2026-01-05',
      priority: 'low',
      dependencies: ['ACT-001'],
      success_criteria: 'CTR, CPC, 전환율 추적 가능',
      status: 'pending'
    }
  ];

  console.log('=== 전체 목록 ===\n');
  console.log(formatActionsMarkdown('DEC-2026-0102-001', '인스타그램 광고', testItems, {
    group_by: 'none'
  }));

  console.log('\n=== 담당자별 ===\n');
  console.log(formatActionsMarkdown('DEC-2026-0102-001', '인스타그램 광고', testItems, {
    group_by: 'assignee'
  }));

  console.log('\n=== 체크리스트 ===\n');
  console.log(formatActionsChecklist('DEC-2026-0102-001', testItems));
}

export default formatActionsMarkdown;
