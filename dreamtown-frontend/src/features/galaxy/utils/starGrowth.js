export function getStarGrowth(logs) {
  const total = logs.length;

  let stage = 0;
  if (total >= 1)  stage = 1;
  if (total >= 4)  stage = 2;
  if (total >= 8)  stage = 3;
  if (total >= 15) stage = 4;

  const directionCount = logs.reduce((acc, log) => {
    acc[log.direction] = (acc[log.direction] || 0) + 1;
    return acc;
  }, {});

  const dominantDirection =
    Object.entries(directionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    total,
    stage,
    dominantDirection,
    recentLogs: logs.slice(0, 3),
  };
}
