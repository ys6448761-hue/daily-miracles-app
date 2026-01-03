/**
 * Aurora 5 서브에이전트 자동화 API
 * 코미, 재미, 루미, 여의보주 에이전트 호출 및 오케스트레이션
 *
 * @version 1.0 - 2026.01.03
 */

const express = require('express');
const router = express.Router();

// ========== 에이전트 정의 ==========
const AGENTS = {
    COMI: {
        id: 'comi',
        name: '코미',
        role: 'COO (Chief Operating Officer)',
        description: '총괄 조율, 의사결정 문서화, 토론 종합',
        capabilities: ['synthesize', 'decision', 'action_items', 'documentation'],
        persona: `당신은 '코미'입니다. 하루하루의 기적 서비스의 COO입니다.
역할: 팀 의견 종합, 균형 잡힌 의사결정, Action Item 도출
원칙: 소원이 이익 최우선, 안전성 확보, 데이터 기반 결정, 실행 가능성 고려`
    },
    JAMI: {
        id: 'jami',
        name: '재미',
        role: 'CRO (Chief Revenue Officer)',
        description: '소원이 응대, 고객 관점, RED 신호 대응',
        capabilities: ['customer_perspective', 'communication', 'red_response', 'satisfaction'],
        persona: `당신은 '재미'입니다. 하루하루의 기적 서비스의 CRO입니다.
역할: 소원이들의 대변인, 고객 경험 수호자, 만족도 최적화
원칙: 소원이 관점 최우선, 진심 어린 응대, 빠른 응답`
    },
    RUMI: {
        id: 'rumi',
        name: '루미',
        role: 'Data Analyst',
        description: '데이터 분석, 창의적 아이디어, 대시보드',
        capabilities: ['data_analysis', 'creative_ideas', 'trend_analysis', 'reporting'],
        persona: `당신은 '루미'입니다. 하루하루의 기적 서비스의 데이터 분석가입니다.
역할: 데이터 기반 인사이트, 창의적 대안 제시, 트렌드 분석
원칙: 팩트 기반, 창의성, 실행 가능성`
    },
    YEOUIBOJU: {
        id: 'yeouiboju',
        name: '여의보주',
        role: 'Quality Assurance',
        description: '품질 검수, 안전 게이트, 소원이 관점',
        capabilities: ['quality_check', 'safety_gate', 'risk_assessment', 'approval'],
        persona: `당신은 '여의보주'입니다. 하루하루의 기적 서비스의 품질 검수 담당입니다.
역할: 모든 결정의 안전성 검토, 법적/윤리적 리스크 필터링, 브랜드 가치 수호
원칙: 안전 최우선, 품질 타협 없음, 소원이 보호`
    }
};

// ========== 작업 유형 정의 ==========
const TASK_TYPES = {
    // 코미 작업
    SYNTHESIZE: { agent: 'COMI', description: '의견 종합' },
    DECISION: { agent: 'COMI', description: '의사결정' },
    ACTION_ITEMS: { agent: 'COMI', description: 'Action Item 도출' },

    // 재미 작업
    CUSTOMER_RESPONSE: { agent: 'JAMI', description: '소원이 응대' },
    RED_ALERT: { agent: 'JAMI', description: 'RED 신호 대응' },
    COMMUNICATION: { agent: 'JAMI', description: '커뮤니케이션 계획' },

    // 루미 작업
    DATA_ANALYSIS: { agent: 'RUMI', description: '데이터 분석' },
    CREATIVE_IDEA: { agent: 'RUMI', description: '창의적 아이디어' },
    TREND_REPORT: { agent: 'RUMI', description: '트렌드 리포트' },

    // 여의보주 작업
    SAFETY_CHECK: { agent: 'YEOUIBOJU', description: '안전 검토' },
    QUALITY_REVIEW: { agent: 'YEOUIBOJU', description: '품질 검수' },
    RISK_ASSESSMENT: { agent: 'YEOUIBOJU', description: '리스크 평가' }
};

// ========== 인메모리 작업 저장소 ==========
const tasks = new Map();

// ========== 유틸리티 ==========

/**
 * 작업 ID 생성
 */
function generateTaskId(agentId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TASK-${agentId.toUpperCase()}-${dateStr}-${random}`;
}

/**
 * 에이전트 응답 시뮬레이션 (실제로는 LLM 호출)
 */
async function executeAgentTask(agent, taskType, input) {
    // 실제 구현에서는 OpenAI API 등을 호출
    // 여기서는 시뮬레이션

    const responses = {
        COMI: {
            SYNTHESIZE: () => ({
                consensus_points: ['의견 종합 완료'],
                key_insights: ['핵심 인사이트 1', '핵심 인사이트 2'],
                recommendation: '종합 권고사항'
            }),
            DECISION: () => ({
                decision_id: `DEC-${Date.now()}`,
                title: '결정 제목',
                summary: '결정 요약',
                status: 'pending_approval'
            }),
            ACTION_ITEMS: () => ({
                items: [
                    { task: '작업 1', assignee: '담당자', deadline: '2026-01-10' }
                ]
            })
        },
        JAMI: {
            CUSTOMER_RESPONSE: () => ({
                response_type: 'empathetic',
                message: '소원이님의 마음을 담아 응원합니다',
                tone: 'warm',
                follow_up_needed: false
            }),
            RED_ALERT: () => ({
                alert_level: 'urgent',
                immediate_action: '즉시 연락 필요',
                escalation: true,
                support_resources: ['상담 연결', '긴급 지원']
            }),
            COMMUNICATION: () => ({
                channel: 'kakao',
                timing: 'immediate',
                key_messages: ['핵심 메시지 1']
            })
        },
        RUMI: {
            DATA_ANALYSIS: () => ({
                metrics: { total_wishes: 150, completion_rate: 0.85 },
                trends: ['상승 추세', '주말 활성화'],
                insights: ['데이터 인사이트']
            }),
            CREATIVE_IDEA: () => ({
                ideas: [
                    { title: '아이디어 1', feasibility: 'high', impact: 'medium' }
                ],
                rationale: '근거 설명'
            }),
            TREND_REPORT: () => ({
                period: 'weekly',
                highlights: ['주요 트렌드'],
                recommendations: ['권장 사항']
            })
        },
        YEOUIBOJU: {
            SAFETY_CHECK: () => ({
                overall_status: 'PASS',
                safety_score: 92,
                checks: [
                    { category: 'legal', status: 'pass' },
                    { category: 'ethical', status: 'pass' }
                ]
            }),
            QUALITY_REVIEW: () => ({
                quality_score: 88,
                issues: [],
                approved: true
            }),
            RISK_ASSESSMENT: () => ({
                risk_level: 'low',
                identified_risks: [],
                mitigations: []
            })
        }
    };

    // 에이전트별 응답 생성
    const agentResponses = responses[agent.id.toUpperCase()] || {};
    const responseGenerator = agentResponses[taskType] || (() => ({ status: 'completed' }));

    // 처리 시간 시뮬레이션 (100-500ms)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));

    return {
        agent: agent.name,
        agent_id: agent.id,
        task_type: taskType,
        input_summary: typeof input === 'string' ? input.substring(0, 100) : JSON.stringify(input).substring(0, 100),
        output: responseGenerator(),
        timestamp: new Date().toISOString(),
        processing_time_ms: Math.floor(100 + Math.random() * 400)
    };
}

// ========== API 엔드포인트 ==========

/**
 * GET /api/agents
 * 에이전트 목록 조회
 */
router.get('/', (req, res) => {
    const agentList = Object.entries(AGENTS).map(([key, agent]) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        capabilities: agent.capabilities
    }));

    res.json({
        success: true,
        count: agentList.length,
        agents: agentList
    });
});

/**
 * GET /api/agents/:id
 * 특정 에이전트 상세 조회
 */
router.get('/:id', (req, res) => {
    const agentId = req.params.id.toUpperCase();
    const agent = Object.values(AGENTS).find(a => a.id.toUpperCase() === agentId);

    if (!agent) {
        return res.status(404).json({
            success: false,
            error: `Agent not found: ${req.params.id}`
        });
    }

    res.json({
        success: true,
        agent: {
            ...agent,
            available_tasks: Object.entries(TASK_TYPES)
                .filter(([, t]) => t.agent === agentId)
                .map(([key, t]) => ({ type: key, description: t.description }))
        }
    });
});

/**
 * POST /api/agents/:id/execute
 * 에이전트 작업 실행
 */
router.post('/:id/execute', async (req, res) => {
    try {
        const agentId = req.params.id.toUpperCase();
        const agent = Object.values(AGENTS).find(a => a.id.toUpperCase() === agentId);

        if (!agent) {
            return res.status(404).json({
                success: false,
                error: `Agent not found: ${req.params.id}`
            });
        }

        const { task_type, input, context } = req.body;

        if (!task_type) {
            return res.status(400).json({
                success: false,
                error: 'task_type is required'
            });
        }

        // 작업 유형 검증
        const taskConfig = TASK_TYPES[task_type.toUpperCase()];
        if (!taskConfig) {
            return res.status(400).json({
                success: false,
                error: `Unknown task type: ${task_type}`,
                available_types: Object.keys(TASK_TYPES)
            });
        }

        // 작업 ID 생성
        const taskId = generateTaskId(agent.id);

        // 작업 저장
        const task = {
            task_id: taskId,
            agent_id: agent.id,
            agent_name: agent.name,
            task_type: task_type.toUpperCase(),
            input,
            context,
            status: 'processing',
            created_at: new Date().toISOString()
        };
        tasks.set(taskId, task);

        console.log(`[Agent] ${agent.name} 작업 시작: ${taskId} (${task_type})`);

        // 에이전트 작업 실행
        const result = await executeAgentTask(agent, task_type.toUpperCase(), input);

        // 작업 완료 업데이트
        task.status = 'completed';
        task.result = result;
        task.completed_at = new Date().toISOString();

        console.log(`[Agent] ${agent.name} 작업 완료: ${taskId}`);

        res.json({
            success: true,
            task_id: taskId,
            agent: agent.name,
            task_type: task_type.toUpperCase(),
            result: result.output,
            processing_time_ms: result.processing_time_ms
        });

    } catch (error) {
        console.error('[Agent] 실행 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/agents/orchestrate
 * 다중 에이전트 오케스트레이션 (병렬 + 종합)
 */
router.post('/orchestrate', async (req, res) => {
    try {
        const { topic, context, agents: requestedAgents, mode } = req.body;

        if (!topic) {
            return res.status(400).json({
                success: false,
                error: 'topic is required'
            });
        }

        const orchestrationId = `ORCH-${Date.now()}`;
        console.log(`[Orchestration] 시작: ${orchestrationId} - ${topic}`);

        // 기본 에이전트 목록 (재미, 루미, 여의보주 병렬 → 코미 종합)
        const phase1Agents = requestedAgents || ['JAMI', 'RUMI', 'YEOUIBOJU'];
        const synthesizerAgent = 'COMI';

        // Phase 1: 병렬 실행
        const phase1Results = await Promise.all(
            phase1Agents.map(async (agentKey) => {
                const agent = AGENTS[agentKey.toUpperCase()];
                if (!agent) return { agent: agentKey, error: 'not found' };

                // 각 에이전트에 맞는 기본 작업 유형 선택
                let taskType;
                switch (agentKey.toUpperCase()) {
                    case 'JAMI': taskType = 'CUSTOMER_RESPONSE'; break;
                    case 'RUMI': taskType = 'CREATIVE_IDEA'; break;
                    case 'YEOUIBOJU': taskType = 'SAFETY_CHECK'; break;
                    default: taskType = 'SYNTHESIZE';
                }

                return executeAgentTask(agent, taskType, { topic, context });
            })
        );

        // Phase 2: 코미 종합
        const comiAgent = AGENTS.COMI;
        const synthesisInput = {
            topic,
            context,
            agent_outputs: phase1Results.map(r => ({
                agent: r.agent,
                output: r.output
            }))
        };

        const synthesisResult = await executeAgentTask(comiAgent, 'SYNTHESIZE', synthesisInput);

        console.log(`[Orchestration] 완료: ${orchestrationId}`);

        res.json({
            success: true,
            orchestration_id: orchestrationId,
            topic,
            phase1: {
                agents: phase1Agents,
                results: phase1Results.map(r => ({
                    agent: r.agent,
                    agent_id: r.agent_id,
                    output: r.output
                }))
            },
            phase2: {
                agent: comiAgent.name,
                synthesis: synthesisResult.output
            },
            total_processing_time_ms: phase1Results.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0) + synthesisResult.processing_time_ms
        });

    } catch (error) {
        console.error('[Orchestration] 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/agents/red-response
 * RED 신호 대응 (재미 + 여의보주 협업)
 */
router.post('/red-response', async (req, res) => {
    try {
        const { wish_id, wish_content, signal_reason, customer_info } = req.body;

        if (!wish_id || !wish_content) {
            return res.status(400).json({
                success: false,
                error: 'wish_id and wish_content are required'
            });
        }

        const responseId = `RED-${Date.now()}`;
        console.log(`[RED Response] 시작: ${responseId} - ${wish_id}`);

        // 재미 (CRO): 즉각 대응 메시지 생성
        const jamiResponse = await executeAgentTask(AGENTS.JAMI, 'RED_ALERT', {
            wish_id,
            wish_content,
            signal_reason
        });

        // 여의보주: 리스크 평가 및 에스컬레이션 판단
        const yeouibojuResponse = await executeAgentTask(AGENTS.YEOUIBOJU, 'RISK_ASSESSMENT', {
            wish_id,
            wish_content,
            signal_reason,
            jami_response: jamiResponse.output
        });

        console.log(`[RED Response] 완료: ${responseId}`);

        res.json({
            success: true,
            response_id: responseId,
            wish_id,
            signal: 'RED',
            jami_response: {
                agent: AGENTS.JAMI.name,
                ...jamiResponse.output
            },
            yeouiboju_assessment: {
                agent: AGENTS.YEOUIBOJU.name,
                ...yeouibojuResponse.output
            },
            recommended_actions: [
                '즉시 소원이에게 연락',
                '전문 상담 연결 권장',
                '48시간 내 팔로업 필수'
            ],
            escalation: yeouibojuResponse.output.risk_level === 'high'
        });

    } catch (error) {
        console.error('[RED Response] 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/agents/tasks
 * 최근 작업 목록
 */
router.get('/tasks/recent', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const recentTasks = Array.from(tasks.values())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)
        .map(t => ({
            task_id: t.task_id,
            agent: t.agent_name,
            task_type: t.task_type,
            status: t.status,
            created_at: t.created_at
        }));

    res.json({
        success: true,
        count: recentTasks.length,
        tasks: recentTasks
    });
});

/**
 * GET /api/agents/task-types
 * 사용 가능한 작업 유형 목록
 */
router.get('/task-types', (req, res) => {
    const taskTypeList = Object.entries(TASK_TYPES).map(([key, config]) => ({
        type: key,
        agent: config.agent,
        agent_name: AGENTS[config.agent]?.name || config.agent,
        description: config.description
    }));

    res.json({
        success: true,
        count: taskTypeList.length,
        task_types: taskTypeList
    });
});

module.exports = router;
