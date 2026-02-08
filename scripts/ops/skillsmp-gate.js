#!/usr/bin/env node
/**
 * skillsmp-gate.js
 * SkillsMP MCP 서버 게이트 - SKILLSMP_ENABLED=true 일 때만 실행
 *
 * 토큰/비용 폭탄 방지:
 * - 기본 OFF (SKILLSMP_ENABLED !== 'true' → 즉시 종료)
 * - 프로덕션 금지 (NODE_ENV=production → 즉시 종료)
 * - 결과 상한: SKILLSMP_MAX_RESULTS (기본 10)
 * - 컨텍스트 토큰 상한: SKILLSMP_MAX_CONTEXT_TOKENS (기본 1500)
 * - Allowlist: .claude/skills/SKILL-ALLOWLIST.json 참조
 */

const path = require('path');
const fs = require('fs');

const ENABLED = process.env.SKILLSMP_ENABLED === 'true';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Gate 1: 프로덕션 절대 금지
if (IS_PRODUCTION) {
  console.error('[SkillsMP] BLOCKED: production 환경에서 SkillsMP 실행 금지');
  process.exit(1);
}

// Gate 2: 명시적 활성화 필요
if (!ENABLED) {
  console.error('[SkillsMP] disabled (SKILLSMP_ENABLED !== "true")');
  console.error('[SkillsMP] 활성화: .env에 SKILLSMP_ENABLED=true 추가');
  process.exit(0);
}

// Gate 3: API 키 확인
if (!process.env.SKILLSMP_API_KEY || process.env.SKILLSMP_API_KEY.includes('your_key')) {
  console.error('[SkillsMP] BLOCKED: SKILLSMP_API_KEY 미설정 또는 플레이스홀더');
  process.exit(1);
}

// Gate 4: Allowlist 로드 (선택적 - 파일 없으면 경고만)
const ALLOWLIST_PATH = path.resolve(__dirname, '../../.claude/skills/SKILL-ALLOWLIST.json');
let allowlist = null;
try {
  const raw = fs.readFileSync(ALLOWLIST_PATH, 'utf-8');
  allowlist = JSON.parse(raw);
  console.log(`[SkillsMP] Allowlist v${allowlist.version} 로드: ${allowlist.skills.length}개 스킬`);
} catch (e) {
  console.warn('[SkillsMP] Allowlist 파일 로드 실패 (무시):', e.message);
}

// 상한값 환경변수 주입 (하위 프로세스에 전달)
process.env.SKILLSMP_MAX_RESULTS = process.env.SKILLSMP_MAX_RESULTS || '10';
process.env.SKILLSMP_MAX_CONTEXT_TOKENS = process.env.SKILLSMP_MAX_CONTEXT_TOKENS || '1500';

console.log('[SkillsMP] Gate PASSED - 실행 허용');
console.log(`  MAX_RESULTS: ${process.env.SKILLSMP_MAX_RESULTS}`);
console.log(`  MAX_CONTEXT_TOKENS: ${process.env.SKILLSMP_MAX_CONTEXT_TOKENS}`);
if (allowlist) {
  console.log(`  Allowlist: ${allowlist.summary.LIVE} LIVE / ${allowlist.summary.PARTIAL} PARTIAL / ${allowlist.summary.TODO} TODO`);
}

// 실제 MCP 서버 실행
const { execSync } = require('child_process');
try {
  execSync('npx -y skillsmp-mcp-lite', {
    stdio: 'inherit',
    env: process.env
  });
} catch (e) {
  process.exit(e.status || 1);
}
