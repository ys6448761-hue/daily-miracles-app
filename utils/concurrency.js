// 동시 요청 제한을 위한 유틸리티 함수
async function limitConcurrency(tasks, limit) {
  const results = [];

  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.allSettled(batch);
    results.push(...batchResults);

    // 배치 완료 로그
    if (i + limit < tasks.length) {
      console.log(`📦 배치 ${Math.ceil((i + limit) / limit)} 완료 (${Math.min(i + limit, tasks.length)}/${tasks.length})`);
    }
  }

  return results;
}

module.exports = {
  limitConcurrency
};