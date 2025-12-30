#!/usr/bin/env node
/**
 * VIP 태깅 테스트 스크립트
 */
const { evaluateVip } = require('../services/vipService');

console.log('\n=== TC4-1: VIP True (긴 서사 + 간절함) ===');
const tc1Content = `저는 올해로 50세가 된 가장입니다. 작년에 갑자기 회사가 문을 닫으면서
실직을 하게 되었고, 이후로 정말 힘든 나날을 보내고 있습니다. 아내는 투병 중이고,
아이들 학비도 감당하기 어려워졌습니다. 그래도 포기하지 않고 매일 이력서를 넣고 있습니다.
정말 간절하게, 제발 다시 일어설 기회가 주어지길 바랍니다. 가족을 위해 다시 시작하고 싶습니다.
감사합니다.`;
const tc1 = evaluateVip(tc1Content, 'green', 0);
console.log('VIP:', tc1.vip, '| Score:', tc1.vipScore);
console.log('Reasons:', tc1.vipReasons);
console.log('PASS:', tc1.vip && tc1.vipScore >= 70 ? '✅' : '❌');

console.log('\n=== TC4-2: VIP False (짧음) ===');
const tc2 = evaluateVip('취업하고 싶어요', 'green', 0);
console.log('VIP:', tc2.vip, '| Score:', tc2.vipScore);
console.log('PASS:', !tc2.vip ? '✅' : '❌');

console.log('\n=== TC4-3: VIP 차단 (RED 우선) ===');
const tc3Content = '정말 간절합니다. 제발 도와주세요. 다시 시작하고 싶습니다.';
const tc3 = evaluateVip(tc3Content, 'red', 0);
console.log('VIP:', tc3.vip, '| Blocked:', tc3.blocked, '| Reason:', tc3.blockedReason);
console.log('PASS:', tc3.blocked && tc3.blockedReason === 'RED_PRIORITY' ? '✅' : '❌');

console.log('\n=== TC4-4: VIP 차단 (스팸 의심) ===');
const tc4 = evaluateVip(tc3Content, 'green', 10);
console.log('VIP:', tc4.vip, '| Blocked:', tc4.blocked, '| Reason:', tc4.blockedReason);
console.log('PASS:', tc4.blocked && tc4.blockedReason === 'SPAM_SUSPECTED' ? '✅' : '❌');

console.log('\n=== 전체 결과 ===');
const results = [
    tc1.vip && tc1.vipScore >= 70,
    !tc2.vip,
    tc3.blocked && tc3.blockedReason === 'RED_PRIORITY',
    tc4.blocked && tc4.blockedReason === 'SPAM_SUSPECTED'
];
const passCount = results.filter(Boolean).length;
console.log(`통과: ${passCount}/4`);
console.log(passCount === 4 ? '✅ 모든 테스트 통과!' : '❌ 일부 테스트 실패');
