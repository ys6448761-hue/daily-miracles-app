/**
 * merge-role-outputs.ts
 *
 * 병렬로 실행된 에이전트들의 출력을 병합하고 정규화합니다.
 * COO Synthesizer에 전달할 통합 데이터를 생성합니다.
 */

import {
  validateCreativeOutput,
  validateCROOutput,
  validateSafetyOutput,
  type CreativeOutput,
  type CROOutput,
  type SafetyOutput
} from './validate-json';

// ===== 타입 정의 =====

export interface RoleOutputs {
  creative?: string;
  cro?: string;
  safety?: string;
}

export interface ValidatedOutputs {
  creative: CreativeOutput;
  cro: CROOutput;
  safety: SafetyOutput;
}

export interface MergedOutput {
  debate_id: string;
  timestamp: string;

  // 검증된 출력
  validated: ValidatedOutputs;

  // 에이전트 상태
  agent_status: {
    creative: 'success' | 'fallback' | 'timeout';
    cro: 'success' | 'fallback' | 'timeout';
    safety: 'success' | 'fallback' | 'timeout';
  };

  // 종합 요약 (COO용)
  summary: {
    total_ideas: number;
    total_concerns: number;
    safety_assessment: 'PASS' | 'CONDITIONAL' | 'FAIL';
    safety_score: number;
    all_recommendations: Array<{
      source: string;
      priority: number;
      action: string;
    }>;
    all_risks: Array<{
      source: string;
      severity: string;
      description: string;
    }>;
  };

  // 검증 로그
  validation_log: Array<{
    agent: string;
    success: boolean;
    error?: string;
  }>;
}

// ===== 유틸리티 함수 =====

/**
 * 권장사항 통합 (모든 에이전트에서)
 */
function mergeRecommendations(validated: ValidatedOutputs): MergedOutput['summary']['all_recommendations'] {
  const recommendations: MergedOutput['summary']['all_recommendations'] = [];

  // Creative 권장사항
  for (const rec of validated.creative.recommendations || []) {
    recommendations.push({
      source: 'creative',
      priority: rec.priority,
      action: rec.action
    });
  }

  // CRO 권장사항
  for (const rec of validated.cro.recommendations || []) {
    recommendations.push({
      source: 'cro',
      priority: rec.priority,
      action: rec.action
    });
  }

  // Safety 조건 (조건부 승인인 경우)
  if (validated.safety.overall_assessment === 'CONDITIONAL') {
    for (let i = 0; i < validated.safety.conditions_for_approval.length; i++) {
      recommendations.push({
        source: 'safety',
        priority: 1,  // 안전 조건은 최우선
        action: validated.safety.conditions_for_approval[i]
      });
    }
  }

  // 우선순위로 정렬
  return recommendations.sort((a, b) => a.priority - b.priority);
}

/**
 * 리스크 통합 (모든 에이전트에서)
 */
function mergeRisks(validated: ValidatedOutputs): MergedOutput['summary']['all_risks'] {
  const risks: MergedOutput['summary']['all_risks'] = [];

  // Creative 리스크
  for (const risk of validated.creative.risks || []) {
    risks.push({
      source: 'creative',
      severity: 'medium',
      description: risk.description
    });
  }

  // CRO 우려사항
  for (const concern of validated.cro.customer_perspective?.concerns || []) {
    risks.push({
      source: 'cro',
      severity: concern.severity,
      description: concern.description
    });
  }

  // Safety red flags
  for (const flag of validated.safety.red_flags || []) {
    risks.push({
      source: 'safety',
      severity: flag.severity,
      description: flag.issue
    });
  }

  // 심각도로 정렬
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return risks.sort((a, b) =>
    (severityOrder[a.severity as keyof typeof severityOrder] || 4) -
    (severityOrder[b.severity as keyof typeof severityOrder] || 4)
  );
}

// ===== 메인 함수 =====

/**
 * 역할별 출력 병합
 */
export function mergeRoleOutputs(
  debateId: string,
  outputs: RoleOutputs
): MergedOutput {
  const validationLog: MergedOutput['validation_log'] = [];
  const agentStatus: MergedOutput['agent_status'] = {
    creative: 'timeout',
    cro: 'timeout',
    safety: 'timeout'
  };

  // Creative 검증
  const creativeResult = outputs.creative
    ? validateCreativeOutput(outputs.creative)
    : { success: false, error: 'No response', data: undefined };

  validationLog.push({
    agent: 'creative',
    success: creativeResult.success,
    error: creativeResult.error
  });
  agentStatus.creative = creativeResult.success ? 'success' : 'fallback';

  // CRO 검증
  const croResult = outputs.cro
    ? validateCROOutput(outputs.cro)
    : { success: false, error: 'No response', data: undefined };

  validationLog.push({
    agent: 'cro',
    success: croResult.success,
    error: croResult.error
  });
  agentStatus.cro = croResult.success ? 'success' : 'fallback';

  // Safety 검증
  const safetyResult = outputs.safety
    ? validateSafetyOutput(outputs.safety)
    : { success: false, error: 'No response', data: undefined };

  validationLog.push({
    agent: 'safety',
    success: safetyResult.success,
    error: safetyResult.error
  });
  agentStatus.safety = safetyResult.success ? 'success' : 'fallback';

  // 검증된 출력 (기본값 포함)
  const validated: ValidatedOutputs = {
    creative: creativeResult.data!,
    cro: croResult.data!,
    safety: safetyResult.data!
  };

  // 요약 생성
  const summary: MergedOutput['summary'] = {
    total_ideas: validated.creative.ideas?.length || 0,
    total_concerns: (validated.cro.customer_perspective?.concerns?.length || 0) +
                    (validated.safety.red_flags?.length || 0),
    safety_assessment: validated.safety.overall_assessment,
    safety_score: validated.safety.safety_score || 0,
    all_recommendations: mergeRecommendations(validated),
    all_risks: mergeRisks(validated)
  };

  return {
    debate_id: debateId,
    timestamp: new Date().toISOString(),
    validated,
    agent_status: agentStatus,
    summary,
    validation_log: validationLog
  };
}

/**
 * COO Synthesizer용 프롬프트 텍스트 생성
 */
export function generateSynthesizerPrompt(merged: MergedOutput): string {
  const { validated, summary } = merged;

  return `
## 토론 결과 종합

**Debate ID:** ${merged.debate_id}
**타임스탬프:** ${merged.timestamp}

---

### [루미 - Creative Agent]

**상태:** ${merged.agent_status.creative}

**아이디어 (${validated.creative.ideas?.length || 0}개):**
${validated.creative.ideas?.map((idea, i) =>
  `${i+1}. **${idea.title}**
   - 설명: ${idea.description}
   - 근거: ${idea.rationale}
   - 실행가능성: ${idea.feasibility} / 영향력: ${idea.impact}`
).join('\n') || '없음'}

**권장사항:**
${validated.creative.recommendations?.map(r =>
  `- [P${r.priority}] ${r.action}`
).join('\n') || '없음'}

**리스크:**
${validated.creative.risks?.map(r =>
  `- ${r.type}: ${r.description} (완화: ${r.mitigation})`
).join('\n') || '없음'}

---

### [재미 - CRO Agent]

**상태:** ${merged.agent_status.cro}

**긍정적 영향:**
${validated.cro.customer_perspective?.positive_impacts?.map(p =>
  `- ${p.aspect}: ${p.description}`
).join('\n') || '없음'}

**우려사항:**
${validated.cro.customer_perspective?.concerns?.map(c =>
  `- [${c.severity}] ${c.aspect}: ${c.description}`
).join('\n') || '없음'}

**커뮤니케이션 계획:**
- 시점: ${validated.cro.communication_plan?.timing || 'TBD'}
- 채널: ${validated.cro.communication_plan?.channels?.join(', ') || 'TBD'}

---

### [여의보주 - Safety Gate]

**상태:** ${merged.agent_status.safety}

**종합 평가:** ${validated.safety.overall_assessment}
**안전 점수:** ${validated.safety.safety_score}/100

**Red Flags:**
${validated.safety.red_flags?.map(f =>
  `- [${f.severity}] ${f.issue}: ${f.impact}`
).join('\n') || '없음'}

**승인 조건:**
${validated.safety.conditions_for_approval?.map(c => `- ${c}`).join('\n') || '없음'}

**최종 권고:** ${validated.safety.final_recommendation}

---

### 종합 요약

- **총 아이디어:** ${summary.total_ideas}개
- **총 우려사항:** ${summary.total_concerns}개
- **안전 평가:** ${summary.safety_assessment} (${summary.safety_score}점)

**통합 권장사항 (우선순위순):**
${summary.all_recommendations.slice(0, 5).map((r, i) =>
  `${i+1}. [${r.source}] ${r.action}`
).join('\n')}

**통합 리스크 (심각도순):**
${summary.all_risks.slice(0, 5).map((r, i) =>
  `${i+1}. [${r.source}/${r.severity}] ${r.description}`
).join('\n')}
`;
}

// ===== CLI 실행 =====

if (require.main === module) {
  // 테스트
  const testOutputs: RoleOutputs = {
    creative: JSON.stringify({
      role: 'creative',
      ideas: [{ id: 1, title: '테스트', description: '설명', rationale: '근거', feasibility: 'high', impact: 'high' }],
      recommendations: [{ priority: 1, action: '실행하세요', expected_outcome: '좋은 결과' }],
      risks: [],
      confidence: 0.85
    }),
    cro: JSON.stringify({
      role: 'cro',
      customer_perspective: {
        positive_impacts: [{ aspect: '만족도', description: '증가 예상', affected_segments: ['전체'] }],
        concerns: []
      },
      recommendations: [],
      communication_plan: { timing: '즉시', channels: ['카카오톡'], key_messages: ['좋은 소식'] },
      confidence: 0.80
    }),
    safety: JSON.stringify({
      role: 'safety',
      overall_assessment: 'PASS',
      safety_score: 90,
      checks: [],
      red_flags: [],
      conditions_for_approval: [],
      final_recommendation: '승인 권장',
      confidence: 0.90
    })
  };

  const merged = mergeRoleOutputs('DEB-2026-0102-001', testOutputs);
  console.log('병합 결과:', JSON.stringify(merged, null, 2));
  console.log('\n--- COO 프롬프트 ---\n');
  console.log(generateSynthesizerPrompt(merged));
}

export default mergeRoleOutputs;
