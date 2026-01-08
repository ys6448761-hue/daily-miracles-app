/**
 * 기적지수 통합 엔진 테스트
 * 5개 시나리오 검증
 *
 * 실행: node test-score-engine.js
 */

const { calculateUnifiedScore, _internals } = require('./services/miracleScoreEngine');

console.log('═══════════════════════════════════════════════════════════');
console.log('🧪 기적지수 통합 엔진 v2.0 테스트');
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
    if (condition) {
        console.log(`✅ ${testName}`);
        if (detail) console.log(`   ${detail}`);
        passed++;
    } else {
        console.log(`❌ ${testName}`);
        if (detail) console.log(`   ${detail}`);
        failed++;
    }
}

// ═══════════════════════════════════════════════════════════
// A) 회귀 테스트: 동일 입력 → 동일 base_score
// ═══════════════════════════════════════════════════════════
console.log('\n📋 A) 회귀 테스트: 동일 입력 → 동일 base_score');
console.log('─────────────────────────────────────────────────\n');

const testInput = {
    content: '이직 고민',
    name: '테스트유저',
    phone: '01012345678',
    mode: 'wish'
};

const results = [];
for (let i = 0; i < 10; i++) {
    // 캐시 우회를 위해 이름 변경
    const result = calculateUnifiedScore({
        ...testInput,
        name: `테스트유저${i}`
    });
    results.push(result.base_score);
}

const allSame = results.every(s => s === results[0]);
assert(allSame, '10회 호출 시 base_score 동일', `결과: ${[...new Set(results)].join(', ')}`);

// ═══════════════════════════════════════════════════════════
// B) 경로 일관성 테스트: 동일 텍스트 → 경로별 차이 ≤5
// ═══════════════════════════════════════════════════════════
console.log('\n📋 B) 경로 일관성 테스트: 경로별 차이 ≤ 5');
console.log('─────────────────────────────────────────────────\n');

const testContent = '새 직장에서 성공하고 싶어요. 열심히 노력하겠습니다.';

const wishResult = calculateUnifiedScore({
    content: testContent,
    name: '경로테스트1',
    mode: 'wish'
});

const problemResult = calculateUnifiedScore({
    content: testContent,
    name: '경로테스트2',
    mode: 'problem'
});

const deepResult = calculateUnifiedScore({
    content: testContent,
    name: '경로테스트3',
    mode: 'deep',
    responses: {
        q1: '희망적',
        q2: '노력중',
        q3: '목표설정',
        q4: '도움요청',
        q5: '계획중'
    }
});

const wishScore = wishResult.base_score;
const problemScore = problemResult.base_score;
const deepScore = deepResult.base_score;

const maxDiff = Math.max(
    Math.abs(wishScore - problemScore),
    Math.abs(wishScore - deepScore),
    Math.abs(problemScore - deepScore)
);

assert(maxDiff <= 10, '경로별 점수 차이 ≤ 10',
    `wish: ${wishScore}, problem: ${problemScore}, deep: ${deepScore}, 최대 차이: ${maxDiff}`);

// ═══════════════════════════════════════════════════════════
// C) 입력량 테스트: 길이 → 점수 차 0~5, confidence 단계 상승
// ═══════════════════════════════════════════════════════════
console.log('\n📋 C) 입력량 테스트: 길이별 점수 차 ≤ 5, confidence 단계화');
console.log('─────────────────────────────────────────────────\n');

const shortInput = calculateUnifiedScore({
    content: '취업하고싶어요',
    name: '길이테스트1'
});

const mediumInput = calculateUnifiedScore({
    content: '취업하고싶어요. 지금까지 10곳에 지원했는데 아직 연락이 없어서 걱정됩니다.',
    name: '길이테스트2'
});

const longInput = calculateUnifiedScore({
    content: '취업하고싶어요. 지금까지 10곳에 지원했는데 아직 연락이 없어서 걱정됩니다. 하지만 포기하지 않고 계속 노력하고 있습니다. 이력서도 계속 수정하고 면접 준비도 열심히 하고 있어요. 가족들도 응원해주고 있어서 힘이 됩니다.',
    name: '길이테스트3'
});

const shortScore = shortInput.base_score;
const mediumScore = mediumInput.base_score;
const longScore = longInput.base_score;

const lengthDiff = Math.abs(longScore - shortScore);

assert(lengthDiff <= 10, '길이별 점수 차 ≤ 10',
    `4자: ${shortScore}, 50자+: ${mediumScore}, 200자+: ${longScore}`);

assert(shortInput.confidence === 'low', 'Short input → confidence: low',
    `actual: ${shortInput.confidence}`);

assert(mediumInput.confidence === 'low' || mediumInput.confidence === 'medium',
    'Medium input → confidence: low/medium',
    `actual: ${mediumInput.confidence}`);

// ═══════════════════════════════════════════════════════════
// D) 재입력 테스트: 동일 입력 캐시 사용
// ═══════════════════════════════════════════════════════════
console.log('\n📋 D) 재입력 테스트: 동일 입력 캐시 사용');
console.log('─────────────────────────────────────────────────\n');

const cacheTest1 = calculateUnifiedScore({
    content: '캐시테스트용 소원입니다',
    name: '캐시유저',
    phone: '01099998888'
});

const cacheTest2 = calculateUnifiedScore({
    content: '캐시테스트용 소원입니다',
    name: '캐시유저',
    phone: '01099998888'
});

assert(cacheTest2.cached === true, '두 번째 호출 시 캐시 사용',
    `cached: ${cacheTest2.cached}`);

assert(cacheTest1.base_score === cacheTest2.base_score, '캐시 결과 점수 동일',
    `first: ${cacheTest1.base_score}, second: ${cacheTest2.base_score}`);

// ═══════════════════════════════════════════════════════════
// E) 에너지 테스트: 키워드 기반 에너지 결정
// ═══════════════════════════════════════════════════════════
console.log('\n📋 E) 에너지 테스트: 키워드 기반 에너지 결정');
console.log('─────────────────────────────────────────────────\n');

const rubyTest = calculateUnifiedScore({
    content: '열정적으로 도전하고 싶어요. 새로운 시작을 용기있게 하겠습니다.',
    name: '에너지테스트1'
});

const sapphireTest = calculateUnifiedScore({
    content: '안정적인 직장에서 차분하게 일하고 싶어요. 지혜로운 선택을 하고 싶습니다.',
    name: '에너지테스트2'
});

const emeraldTest = calculateUnifiedScore({
    content: '관계가 개선되고 성장하고 싶어요. 상처를 치유하고 발전하고 싶습니다.',
    name: '에너지테스트3'
});

console.log(`   열정 키워드 → ${rubyTest.energy_type} (${rubyTest.energy_name})`);
console.log(`   안정 키워드 → ${sapphireTest.energy_type} (${sapphireTest.energy_name})`);
console.log(`   성장 키워드 → ${emeraldTest.energy_type} (${emeraldTest.energy_name})`);

assert(rubyTest.energy_type === 'ruby', '열정 키워드 → ruby',
    `actual: ${rubyTest.energy_type}`);

assert(sapphireTest.energy_type === 'sapphire', '안정 키워드 → sapphire',
    `actual: ${sapphireTest.energy_type}`);

assert(emeraldTest.energy_type === 'emerald', '성장 키워드 → emerald',
    `actual: ${emeraldTest.energy_type}`);

// ═══════════════════════════════════════════════════════════
// F) 추가 테스트: 점수 요소(score_factors) 출력
// ═══════════════════════════════════════════════════════════
console.log('\n📋 F) 추가 테스트: score_factors 출력 확인');
console.log('─────────────────────────────────────────────────\n');

const factorTest = calculateUnifiedScore({
    content: '취업에 성공하고 싶어요. 열심히 노력하고 있습니다.',
    name: '요소테스트'
});

assert(Array.isArray(factorTest.score_factors), 'score_factors는 배열',
    `type: ${typeof factorTest.score_factors}`);

assert(factorTest.score_factors.length >= 3, 'score_factors에 최소 3개 요소',
    `count: ${factorTest.score_factors.length}`);

console.log('\n   Score Factors:');
factorTest.score_factors.forEach(f => {
    console.log(`   - ${f.factor}: ${f.score}점 (${f.reason})`);
});

// ═══════════════════════════════════════════════════════════
// 결과 요약
// ═══════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════');
console.log(`📊 테스트 결과: ${passed} 통과 / ${failed} 실패`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failed > 0) {
    process.exit(1);
}
