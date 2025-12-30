#!/usr/bin/env node
/**
 * 신호등 분류 테스트 스크립트 (TC1~TC3)
 *
 * TC1: 🟢 GREEN (정상) - 자동 처리
 * TC2: 🟡 YELLOW (주의) - 루미 확인 필요
 * TC3: 🔴 RED (긴급) - 발송 차단 + CEO/CRO 알림
 */

// classifyWish 함수 직접 정의 (wishRoutes.js에서 추출)
function classifyWish(wishText) {
    const text = wishText.toLowerCase();

    // RED 키워드 (위험 - 즉시 대응)
    const redKeywords = [
        '자살', '죽고싶', '죽고 싶', '죽을래', '죽을 래',
        '자해', '손목', '목숨', '끝내고 싶', '끝내고싶',
        '사라지고 싶', '사라지고싶', '없어지고 싶', '없어지고싶',
        '포기하고 싶', '힘들어서 못살', '살기 싫', '살기싫'
    ];

    for (const keyword of redKeywords) {
        if (text.includes(keyword)) {
            return {
                level: 'RED',
                reason: `위험 키워드 감지: "${keyword}"`,
                action: '즉시 재미(CRO) 알림 발송',
                priority: 1
            };
        }
    }

    // YELLOW 키워드 (주의 - 검토 필요)
    const yellowKeywords = [
        { keyword: '빚', category: '재정' },
        { keyword: '대출', category: '재정' },
        { keyword: '파산', category: '재정' },
        { keyword: '신용불량', category: '재정' },
        { keyword: '암', category: '건강' },
        { keyword: '수술', category: '건강' },
        { keyword: '병원', category: '건강' },
        { keyword: '치료', category: '건강' },
        { keyword: '소송', category: '법적' },
        { keyword: '고소', category: '법적' },
        { keyword: '합의금', category: '법적' },
        { keyword: '이혼', category: '가정' },
        { keyword: '별거', category: '가정' },
        { keyword: '양육권', category: '가정' },
        { keyword: '폭력', category: '위험' },
        { keyword: '학대', category: '위험' }
    ];

    for (const item of yellowKeywords) {
        if (text.includes(item.keyword)) {
            return {
                level: 'YELLOW',
                reason: `주의 키워드 감지 (${item.category}): "${item.keyword}"`,
                action: '24시간 내 재미(CRO) 검토',
                priority: 2
            };
        }
    }

    // GREEN: 일반 소원 (자동 처리 가능)
    return {
        level: 'GREEN',
        reason: '일반 소원',
        action: '자동 처리 및 응원 메시지 발송',
        priority: 3
    };
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🚦 신호등 분류 테스트 (TC1~TC3)');
console.log('═══════════════════════════════════════════════════════════\n');

const testCases = [];

// ═══════════════════════════════════════════════════════════
// TC1: 🟢 GREEN (정상 소원)
// ═══════════════════════════════════════════════════════════
console.log('=== TC1: 🟢 GREEN (정상 소원) ===');

const greenCases = [
    '새해에는 취업에 성공하고 싶어요',
    '가족 모두 건강하게 지내길 바랍니다',
    '올해는 다이어트에 성공하고 싶어요',
    '좋은 인연을 만나고 싶습니다',
    '사업이 번창하길 바랍니다'
];

greenCases.forEach((wish, i) => {
    const result = classifyWish(wish);
    const pass = result.level === 'GREEN';
    console.log(`  TC1-${i+1}: ${pass ? '✅' : '❌'} "${wish.substring(0, 20)}..." → ${result.level}`);
    testCases.push({ name: `TC1-${i+1} GREEN`, expected: 'GREEN', actual: result.level, pass });
});

// ═══════════════════════════════════════════════════════════
// TC2: 🟡 YELLOW (주의 필요)
// ═══════════════════════════════════════════════════════════
console.log('\n=== TC2: 🟡 YELLOW (주의 필요) ===');

const yellowCases = [
    { wish: '빚을 갚고 새출발하고 싶어요', keyword: '빚' },
    { wish: '대출 상환이 잘 되길 바랍니다', keyword: '대출' },
    { wish: '아버지 암 수술이 잘 되길 기도합니다', keyword: '암' },
    { wish: '병원 치료가 끝나고 건강해지길', keyword: '병원' },
    { wish: '이혼 후 새 삶을 시작하고 싶어요', keyword: '이혼' },
    { wish: '양육권 소송에서 이기길 바랍니다', keyword: '양육권' }
];

yellowCases.forEach((tc, i) => {
    const result = classifyWish(tc.wish);
    const pass = result.level === 'YELLOW';
    console.log(`  TC2-${i+1}: ${pass ? '✅' : '❌'} "${tc.wish.substring(0, 20)}..." → ${result.level} (키워드: ${tc.keyword})`);
    testCases.push({ name: `TC2-${i+1} YELLOW (${tc.keyword})`, expected: 'YELLOW', actual: result.level, pass });
});

// ═══════════════════════════════════════════════════════════
// TC3: 🔴 RED (긴급/위험)
// ═══════════════════════════════════════════════════════════
console.log('\n=== TC3: 🔴 RED (긴급/위험) ===');

const redCases = [
    { wish: '더 이상 살기 싫어요', keyword: '살기 싫' },
    { wish: '모든 게 끝내고 싶어요', keyword: '끝내고 싶' },
    { wish: '사라지고 싶은 마음뿐입니다', keyword: '사라지고 싶' },
    { wish: '없어지고 싶어요', keyword: '없어지고 싶' }
];

redCases.forEach((tc, i) => {
    const result = classifyWish(tc.wish);
    const pass = result.level === 'RED';
    console.log(`  TC3-${i+1}: ${pass ? '✅' : '❌'} "[민감 테스트]" → ${result.level}`);
    if (pass) {
        console.log(`         → Action: ${result.action}`);
    }
    testCases.push({ name: `TC3-${i+1} RED`, expected: 'RED', actual: result.level, pass });
});

// ═══════════════════════════════════════════════════════════
// 결과 요약
// ═══════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════');
console.log('📊 테스트 결과 요약');
console.log('═══════════════════════════════════════════════════════════\n');

const greenResults = testCases.filter(tc => tc.expected === 'GREEN');
const yellowResults = testCases.filter(tc => tc.expected === 'YELLOW');
const redResults = testCases.filter(tc => tc.expected === 'RED');

const greenPass = greenResults.filter(tc => tc.pass).length;
const yellowPass = yellowResults.filter(tc => tc.pass).length;
const redPass = redResults.filter(tc => tc.pass).length;
const totalPass = testCases.filter(tc => tc.pass).length;

console.log(`🟢 GREEN:  ${greenPass}/${greenResults.length} 통과`);
console.log(`🟡 YELLOW: ${yellowPass}/${yellowResults.length} 통과`);
console.log(`🔴 RED:    ${redPass}/${redResults.length} 통과`);
console.log(`───────────────────────────────────────────────────────────`);
console.log(`📋 전체:   ${totalPass}/${testCases.length} 통과`);
console.log(totalPass === testCases.length ? '\n✅ 모든 신호등 테스트 통과!' : '\n❌ 일부 테스트 실패');

// 실패한 케이스 출력
const failed = testCases.filter(tc => !tc.pass);
if (failed.length > 0) {
    console.log('\n⚠️ 실패한 테스트:');
    failed.forEach(tc => {
        console.log(`   - ${tc.name}: expected ${tc.expected}, got ${tc.actual}`);
    });
}

// 종료 코드
process.exit(totalPass === testCases.length ? 0 : 1);
