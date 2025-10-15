/**
 * 🔍 Problem Workflow
 *
 * 문제 분석 및 해결 제안 워크플로우
 *
 * 단계:
 * 1. 입력 검증
 * 2. 문제 분석
 * 3. 해결책 생성
 * 4. 결과 저장
 */

const { info } = require('../../config/logger');

module.exports = {
  name: 'analyze-problem',
  description: '문제 분석 및 해결 제안 워크플로우',

  steps: [
    {
      name: 'validate-problem-input',
      description: '문제 입력 검증',
      handler: async (context) => {
        const input = await context.get('input');

        if (!input.problem || !input.problem.trim()) {
          throw new Error('문제 설명이 필요합니다');
        }

        info('✅ 문제 입력 검증 완료');

        return { validated: true, problem: input.problem };
      }
    },

    {
      name: 'analyze-problem',
      description: '문제 분석',
      handler: async (context) => {
        const { problem } = await context.get('validate-problem-input');

        info('🔍 문제 분석 중...');

        // TODO: 실제 문제 분석 로직
        const analysis = {
          category: '일반',
          severity: 'medium',
          keywords: problem.split(' ').slice(0, 5)
        };

        info('✅ 문제 분석 완료');

        return analysis;
      }
    },

    {
      name: 'generate-solutions',
      description: '해결책 생성',
      parallel: true,
      handler: async (context) => {
        const analysis = await context.get('analyze-problem');

        info('💡 해결책 생성 중...');

        // TODO: 실제 해결책 생성 로직
        const solutions = [
          '해결책 1: 단계별 접근',
          '해결책 2: 전문가 상담',
          '해결책 3: 자기 성찰'
        ];

        info('✅ 해결책 생성 완료', { count: solutions.length });

        return solutions;
      }
    }
  ],

  onError: async (error, context) => {
    console.error('❌ 문제 분석 워크플로우 실패:', error.message);
    return { retry: false };
  },

  onComplete: async (result, context) => {
    info('🎉 문제 분석 워크플로우 완료', {
      contextId: context.id
    });
  }
};
