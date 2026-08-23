/**
 * Cluster Diversity Logic Test
 * Tests the cluster diversity selection WITHOUT requiring database connection
 * Purpose: Validate that clustering logic works correctly with mock data
 */

const EXPERIENCE_CLUSTERS = {
  dolsan_area: ['dolsan_daegyo', 'dolsan_nightscape', 'cablecar']
};

function getCluster(placeCode) {
  for (const [clusterName, members] of Object.entries(EXPERIENCE_CLUSTERS)) {
    if (members.includes(placeCode)) {
      return clusterName;
    }
  }
  return null;
}

function applyClusterDiversity(candidates) {
  const selected = [];
  const seenClusters = new Set();

  for (const candidate of candidates) {
    const cluster = getCluster(candidate.code);

    if (cluster === null) {
      // No cluster, always eligible
      selected.push(candidate);
    } else if (!seenClusters.has(cluster)) {
      // Cluster not yet seen, add first occurrence
      selected.push(candidate);
      seenClusters.add(cluster);
    }
    // else: cluster already represented, skip

    if (selected.length === 3) {
      break;
    }
  }

  // Fallback: if diversity reduced results below 3, fill remaining slots
  if (selected.length < 3 && candidates.length > selected.length) {
    for (const candidate of candidates) {
      if (selected.includes(candidate)) continue;
      selected.push(candidate);
      if (selected.length === 3) break;
    }
    selected._cluster_diversity_relaxed = true;
  }

  return selected;
}

// Test cases based on Phase 0 results
const testCases = [
  {
    name: 'Pattern A (7 cases BEFORE): cablecar, dolsan_daegyo, hyangiram',
    candidates: [
      { code: 'cablecar', name_ko: '케이블카' },
      { code: 'dolsan_daegyo', name_ko: '돌산대교' },
      { code: 'dolsan_nightscape', name_ko: '돌산 야경' },
      { code: 'hyangiram', name_ko: '향일암' },
      { code: 'jaisan_park', name_ko: '자산공원' },
      { code: 'lee_soon_shin_plaza', name_ko: '이순신광장' }
    ],
    expectedBefore: ['cablecar', 'dolsan_daegyo', 'hyangiram'],
    expectedAfter: ['cablecar', 'hyangiram', 'jaisan_park']
  },
  {
    name: 'Pattern B (5 cases BEFORE): cablecar, dolsan_daegyo, dolsan_nightscape',
    candidates: [
      { code: 'cablecar', name_ko: '케이블카' },
      { code: 'dolsan_daegyo', name_ko: '돌산대교' },
      { code: 'dolsan_nightscape', name_ko: '돌산 야경' },
      { code: 'hyangiram', name_ko: '향일암' },
      { code: 'jaisan_park', name_ko: '자산공원' }
    ],
    expectedBefore: ['cablecar', 'dolsan_daegyo', 'dolsan_nightscape'],
    expectedAfter: ['cablecar', 'hyangiram', 'jaisan_park']
  },
  {
    name: 'Limited inventory (only 2 candidates)',
    candidates: [
      { code: 'cablecar', name_ko: '케이블카' },
      { code: 'dolsan_daegyo', name_ko: '돌산대교' }
    ],
    expectedBefore: ['cablecar', 'dolsan_daegyo'],
    expectedAfter: ['cablecar', 'dolsan_daegyo'], // Falls back because only 2 candidates
    expectRelaxed: true
  },
  {
    name: 'No clusters (all independent)',
    candidates: [
      { code: 'hyangiram', name_ko: '향일암' },
      { code: 'jaisan_park', name_ko: '자산공원' },
      { code: 'lee_soon_shin_plaza', name_ko: '이순신광장' },
      { code: 'marine_park', name_ko: '해양공원' }
    ],
    expectedBefore: ['hyangiram', 'jaisan_park', 'lee_soon_shin_plaza'],
    expectedAfter: ['hyangiram', 'jaisan_park', 'lee_soon_shin_plaza'] // Same because no clusters
  }
];

// Execute tests
console.log('CLUSTER DIVERSITY LOGIC TEST\n');
console.log('='.repeat(70) + '\n');

let passed = 0;
let failed = 0;

for (const test of testCases) {
  console.log(`TEST: ${test.name}\n`);

  // Simulate BEFORE (first 3 without diversity)
  const before = test.candidates.slice(0, 3).map(c => c.code);
  console.log(`  BEFORE: ${JSON.stringify(before)}`);

  // Apply cluster diversity
  const afterResult = applyClusterDiversity(test.candidates);
  const after = afterResult.map(c => c.code);
  console.log(`  AFTER:  ${JSON.stringify(after)}`);

  // Check expectations
  let testPassed = true;

  if (JSON.stringify(after) !== JSON.stringify(test.expectedAfter)) {
    console.log(`  ❌ Expected: ${JSON.stringify(test.expectedAfter)}`);
    testPassed = false;
  }

  if (test.expectRelaxed && !afterResult._cluster_diversity_relaxed) {
    console.log(`  ❌ Expected cluster_diversity_relaxed flag to be set`);
    testPassed = false;
  }

  if (testPassed) {
    console.log(`  ✓ PASS\n`);
    passed++;
  } else {
    console.log(`  ✗ FAIL\n`);
    failed++;
  }
}

console.log('='.repeat(70));
console.log(`\nRESULTS: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✓ All cluster diversity tests passed!');
  process.exit(0);
} else {
  console.log(`✗ ${failed} test(s) failed`);
  process.exit(1);
}
