/**
 * validate-json.ts
 *
 * 에이전트 출력의 JSON 유효성을 검증하고 정규화합니다.
 * 파싱 실패 시 재시도하거나 기본값을 반환합니다.
 */

// ===== 타입 정의 =====

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  raw?: string;
}

export interface AgentOutput {
  role: string;
  timestamp: string;
  confidence?: number;
  [key: string]: unknown;
}

export interface CreativeOutput extends AgentOutput {
  role: 'creative';
  ideas: Array<{
    id: number;
    title: string;
    description: string;
    rationale: string;
    feasibility: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    priority: number;
    action: string;
    expected_outcome: string;
  }>;
  risks: Array<{
    type: string;
    description: string;
    mitigation: string;
  }>;
}

export interface CROOutput extends AgentOutput {
  role: 'cro';
  customer_perspective: {
    positive_impacts: Array<{
      aspect: string;
      description: string;
      affected_segments: string[];
    }>;
    concerns: Array<{
      aspect: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
  recommendations: Array<{
    priority: number;
    action: string;
    customer_benefit: string;
  }>;
  communication_plan: {
    timing: string;
    channels: string[];
    key_messages: string[];
  };
}

export interface SafetyOutput extends AgentOutput {
  role: 'safety';
  overall_assessment: 'PASS' | 'CONDITIONAL' | 'FAIL';
  safety_score: number;
  checks: Array<{
    category: string;
    item: string;
    status: 'pass' | 'warning' | 'fail';
    details: string;
    recommendation: string;
  }>;
  red_flags: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    issue: string;
    impact: string;
    required_action: string;
  }>;
  conditions_for_approval: string[];
  final_recommendation: string;
}

// ===== 기본값 =====

const DEFAULT_CREATIVE: CreativeOutput = {
  role: 'creative',
  timestamp: new Date().toISOString(),
  ideas: [],
  recommendations: [],
  risks: [],
  confidence: 0
};

const DEFAULT_CRO: CROOutput = {
  role: 'cro',
  timestamp: new Date().toISOString(),
  customer_perspective: {
    positive_impacts: [],
    concerns: []
  },
  recommendations: [],
  communication_plan: {
    timing: '',
    channels: [],
    key_messages: []
  },
  confidence: 0
};

const DEFAULT_SAFETY: SafetyOutput = {
  role: 'safety',
  timestamp: new Date().toISOString(),
  overall_assessment: 'FAIL',  // 안전 우선: 실패 시 FAIL
  safety_score: 0,
  checks: [],
  red_flags: [{
    severity: 'critical',
    issue: '안전 검토 응답 없음',
    impact: '안전 검증 불가',
    required_action: '수동 검토 필요'
  }],
  conditions_for_approval: ['수동 안전 검토 완료'],
  final_recommendation: '응답 실패로 인한 자동 FAIL - 수동 검토 필요',
  confidence: 0
};

// ===== 유틸리티 함수 =====

/**
 * 문자열에서 JSON 추출 시도
 * (마크다운 코드블록 등에서 JSON 추출)
 */
function extractJSON(str: string): string | null {
  // 방법 1: 전체가 JSON인 경우
  const trimmed = str.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  // 방법 2: 코드블록 내 JSON
  const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // 방법 3: 첫 번째 { 부터 마지막 } 까지
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return str.substring(start, end + 1);
  }

  return null;
}

/**
 * JSON 문자열 정리 (흔한 오류 수정)
 */
function cleanJSON(jsonStr: string): string {
  return jsonStr
    // 후행 쉼표 제거
    .replace(/,\s*([}\]])/g, '$1')
    // 따옴표 누락된 키 수정 시도 (간단한 케이스만)
    .replace(/(\{|,)\s*(\w+)\s*:/g, '$1"$2":')
    // 줄바꿈 이스케이프
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * 필수 필드 존재 확인
 */
function hasRequiredFields(obj: unknown, fields: string[]): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const data = obj as Record<string, unknown>;
  return fields.every(field => field in data);
}

// ===== 검증 함수 =====

/**
 * Creative Agent 출력 검증
 */
export function validateCreativeOutput(raw: string): ValidationResult<CreativeOutput> {
  const jsonStr = extractJSON(raw);
  if (!jsonStr) {
    return {
      success: false,
      error: 'JSON 형식을 찾을 수 없습니다.',
      raw,
      data: DEFAULT_CREATIVE
    };
  }

  try {
    let parsed = JSON.parse(jsonStr);

    // 필수 필드 확인
    if (!hasRequiredFields(parsed, ['role', 'ideas'])) {
      // 정리 후 재시도
      const cleaned = cleanJSON(jsonStr);
      parsed = JSON.parse(cleaned);
    }

    // 기본값 병합
    const result: CreativeOutput = {
      ...DEFAULT_CREATIVE,
      ...parsed,
      role: 'creative',
      timestamp: parsed.timestamp || new Date().toISOString()
    };

    return { success: true, data: result };
  } catch (e) {
    return {
      success: false,
      error: `JSON 파싱 실패: ${(e as Error).message}`,
      raw,
      data: DEFAULT_CREATIVE
    };
  }
}

/**
 * CRO Agent 출력 검증
 */
export function validateCROOutput(raw: string): ValidationResult<CROOutput> {
  const jsonStr = extractJSON(raw);
  if (!jsonStr) {
    return {
      success: false,
      error: 'JSON 형식을 찾을 수 없습니다.',
      raw,
      data: DEFAULT_CRO
    };
  }

  try {
    let parsed = JSON.parse(jsonStr);

    if (!hasRequiredFields(parsed, ['role', 'customer_perspective'])) {
      const cleaned = cleanJSON(jsonStr);
      parsed = JSON.parse(cleaned);
    }

    const result: CROOutput = {
      ...DEFAULT_CRO,
      ...parsed,
      role: 'cro',
      timestamp: parsed.timestamp || new Date().toISOString()
    };

    return { success: true, data: result };
  } catch (e) {
    return {
      success: false,
      error: `JSON 파싱 실패: ${(e as Error).message}`,
      raw,
      data: DEFAULT_CRO
    };
  }
}

/**
 * Safety Gate 출력 검증
 */
export function validateSafetyOutput(raw: string): ValidationResult<SafetyOutput> {
  const jsonStr = extractJSON(raw);
  if (!jsonStr) {
    // 안전 에이전트는 실패 시 FAIL 반환
    return {
      success: false,
      error: 'JSON 형식을 찾을 수 없습니다.',
      raw,
      data: DEFAULT_SAFETY
    };
  }

  try {
    let parsed = JSON.parse(jsonStr);

    if (!hasRequiredFields(parsed, ['role', 'overall_assessment'])) {
      const cleaned = cleanJSON(jsonStr);
      parsed = JSON.parse(cleaned);
    }

    // overall_assessment 유효성 확인
    const validAssessments = ['PASS', 'CONDITIONAL', 'FAIL'];
    if (!validAssessments.includes(parsed.overall_assessment)) {
      parsed.overall_assessment = 'FAIL';  // 유효하지 않으면 FAIL
    }

    const result: SafetyOutput = {
      ...DEFAULT_SAFETY,
      ...parsed,
      role: 'safety',
      timestamp: parsed.timestamp || new Date().toISOString()
    };

    return { success: true, data: result };
  } catch (e) {
    return {
      success: false,
      error: `JSON 파싱 실패: ${(e as Error).message}`,
      raw,
      data: DEFAULT_SAFETY
    };
  }
}

/**
 * 범용 에이전트 출력 검증
 */
export function validateAgentOutput(raw: string, role: string): ValidationResult<AgentOutput> {
  switch (role) {
    case 'creative':
      return validateCreativeOutput(raw);
    case 'cro':
      return validateCROOutput(raw);
    case 'safety':
      return validateSafetyOutput(raw);
    default:
      // 일반 JSON 검증
      const jsonStr = extractJSON(raw);
      if (!jsonStr) {
        return {
          success: false,
          error: 'JSON 형식을 찾을 수 없습니다.',
          raw
        };
      }
      try {
        const parsed = JSON.parse(jsonStr);
        return { success: true, data: parsed };
      } catch (e) {
        return {
          success: false,
          error: `JSON 파싱 실패: ${(e as Error).message}`,
          raw
        };
      }
  }
}

// ===== CLI 실행 =====

if (require.main === module) {
  // 테스트
  const testCreative = `
    여기 JSON 출력입니다:
    \`\`\`json
    {
      "role": "creative",
      "ideas": [
        {
          "id": 1,
          "title": "테스트 아이디어",
          "description": "설명",
          "rationale": "근거",
          "feasibility": "high",
          "impact": "medium"
        }
      ],
      "recommendations": [],
      "risks": [],
      "confidence": 0.85
    }
    \`\`\`
  `;

  const result = validateCreativeOutput(testCreative);
  console.log('검증 결과:', JSON.stringify(result, null, 2));
}

export default validateAgentOutput;
