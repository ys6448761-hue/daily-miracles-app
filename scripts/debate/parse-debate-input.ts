/**
 * parse-debate-input.ts
 *
 * 토론 입력을 파싱하고 유효성 검사를 수행합니다.
 * debate_id를 생성하고 입력 데이터를 정규화합니다.
 */

// ===== 타입 정의 =====

export interface DebateInput {
  topic: string;
  context?: string;
  urgency: 'high' | 'medium' | 'low';
  data_requirements?: string[];
  participants?: string[];
  approval_required?: boolean;
}

export interface ParsedDebateInput extends DebateInput {
  debate_id: string;
  timestamp: string;
  normalized_topic: string;
  parsed_context: {
    background?: string;
    constraints?: string[];
    goals?: string[];
  };
}

export interface ParseResult {
  success: boolean;
  data?: ParsedDebateInput;
  errors?: string[];
}

// ===== 상수 =====

const ID_PREFIX = 'DEB';
const VALID_URGENCY = ['high', 'medium', 'low'];
const DEFAULT_PARTICIPANTS = ['creative-agent', 'cro-agent', 'safety-gate'];
const MAX_TOPIC_LENGTH = 200;
const MAX_CONTEXT_LENGTH = 2000;

// ===== 유틸리티 함수 =====

/**
 * 오늘 날짜 기반 debate_id 생성
 * 형식: DEB-YYYY-MMDD-NNN
 */
function generateDebateId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');

  return `${ID_PREFIX}-${year}-${month}${day}-${sequence}`;
}

/**
 * 토픽 정규화 (공백 정리, 특수문자 처리)
 */
function normalizeTopic(topic: string): string {
  return topic
    .trim()
    .replace(/\s+/g, ' ')  // 연속 공백 제거
    .replace(/[<>]/g, '')  // HTML 태그 문자 제거
    .substring(0, MAX_TOPIC_LENGTH);
}

/**
 * 컨텍스트 파싱 (배경, 제약조건, 목표 추출)
 */
function parseContext(context?: string): ParsedDebateInput['parsed_context'] {
  if (!context) {
    return {};
  }

  const result: ParsedDebateInput['parsed_context'] = {
    background: '',
    constraints: [],
    goals: []
  };

  // 줄 단위로 분석
  const lines = context.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // 제약조건 패턴
    if (lowerLine.includes('제약') || lowerLine.includes('제한') ||
        lowerLine.includes('예산') || lowerLine.includes('기한')) {
      result.constraints?.push(line);
    }
    // 목표 패턴
    else if (lowerLine.includes('목표') || lowerLine.includes('달성') ||
             lowerLine.includes('원하는') || lowerLine.includes('기대')) {
      result.goals?.push(line);
    }
    // 나머지는 배경
    else {
      result.background = (result.background ? result.background + ' ' : '') + line;
    }
  }

  return result;
}

/**
 * 입력 유효성 검사
 */
function validateInput(input: unknown): string[] {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    errors.push('입력 데이터가 객체 형식이어야 합니다.');
    return errors;
  }

  const data = input as Record<string, unknown>;

  // 필수 필드: topic
  if (!data.topic || typeof data.topic !== 'string') {
    errors.push('topic은 필수 문자열 필드입니다.');
  } else if (data.topic.length < 5) {
    errors.push('topic은 최소 5자 이상이어야 합니다.');
  } else if (data.topic.length > MAX_TOPIC_LENGTH) {
    errors.push(`topic은 최대 ${MAX_TOPIC_LENGTH}자까지 허용됩니다.`);
  }

  // 필수 필드: urgency
  if (!data.urgency) {
    errors.push('urgency는 필수 필드입니다 (high/medium/low).');
  } else if (!VALID_URGENCY.includes(data.urgency as string)) {
    errors.push('urgency는 high, medium, low 중 하나여야 합니다.');
  }

  // 선택 필드: context
  if (data.context && typeof data.context !== 'string') {
    errors.push('context는 문자열이어야 합니다.');
  } else if (data.context && (data.context as string).length > MAX_CONTEXT_LENGTH) {
    errors.push(`context는 최대 ${MAX_CONTEXT_LENGTH}자까지 허용됩니다.`);
  }

  // 선택 필드: data_requirements
  if (data.data_requirements) {
    if (!Array.isArray(data.data_requirements)) {
      errors.push('data_requirements는 배열이어야 합니다.');
    } else {
      for (const req of data.data_requirements) {
        if (typeof req !== 'string') {
          errors.push('data_requirements의 각 항목은 문자열이어야 합니다.');
          break;
        }
      }
    }
  }

  // 선택 필드: participants
  if (data.participants) {
    if (!Array.isArray(data.participants)) {
      errors.push('participants는 배열이어야 합니다.');
    }
  }

  // 선택 필드: approval_required
  if (data.approval_required !== undefined && typeof data.approval_required !== 'boolean') {
    errors.push('approval_required는 boolean이어야 합니다.');
  }

  return errors;
}

// ===== 메인 함수 =====

/**
 * 토론 입력 파싱
 */
export function parseDebateInput(rawInput: unknown): ParseResult {
  // 유효성 검사
  const errors = validateInput(rawInput);

  if (errors.length > 0) {
    return {
      success: false,
      errors
    };
  }

  const input = rawInput as DebateInput;

  // 파싱된 입력 생성
  const parsed: ParsedDebateInput = {
    debate_id: generateDebateId(),
    timestamp: new Date().toISOString(),
    topic: input.topic,
    normalized_topic: normalizeTopic(input.topic),
    urgency: input.urgency,
    context: input.context?.substring(0, MAX_CONTEXT_LENGTH),
    parsed_context: parseContext(input.context),
    data_requirements: input.data_requirements || [],
    participants: input.participants || DEFAULT_PARTICIPANTS,
    approval_required: input.approval_required ?? true  // 기본값: 승인 필요
  };

  return {
    success: true,
    data: parsed
  };
}

// ===== CLI 실행 =====

if (require.main === module) {
  // 테스트용 실행
  const testInput = {
    topic: '인스타그램 광고 캠페인 시작 여부 결정',
    context: `
      배경: 소원그림 서비스 홍보 필요
      예산: 50만원
      목표: 신규 가입 100명
      기한: 1월 중
    `,
    urgency: 'high' as const,
    data_requirements: ['DAU', '전환율', 'CAC'],
    approval_required: true
  };

  const result = parseDebateInput(testInput);

  if (result.success) {
    console.log('✅ 파싱 성공:');
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ 파싱 실패:');
    console.log(result.errors);
  }
}

export default parseDebateInput;
