/**
 * Zone 1·2 QA 편집기 권역 분리 검증
 * A. Zone 1 선택 → Zone 1 좌표만 / Zone 2 좌표 0
 * B. Zone 2 선택 → Zone 2 좌표만 / Zone 1 좌표 0
 * C. Zone 1→2→1 전환 혼선 없음
 * D. 일반(비QA) 모드 Zone 1 → 마커 위치 지정 모드 패널 없음
 *
 * Zone 1·2 장소 목록 (yeosuMapData.js 기준):
 *   Zone 1 (원도심권): 중앙시장, 이순신광장, 종포해양공원, 하멜등대, 구항구, 돌산공원
 *   Zone 2 (돌산권): 돌산대교, 돌산공원, 향일암... (실제 zone 값 기준)
 *
 * 테스트 전략: zoneTargets 크기 + candidates 표시 장소 수 확인
 * (실제 localStorage 초안 없이 SOURCE 직접 렌더 → zoneTargets 장소 버튼만 확인)
 */
const puppeteer = require('puppeteer-core');

// Zone 1·2 장소 이름 샘플 (실제 검증 대상)
// Zone 1: 원도심권 hasDetailMap=true
// Zone 2: 돌산권 hasDetailMap=true
// 검증: Zone 1 선택 시 Zone 2 장소가 편집 대상으로 나타나지 않아야 함

async function launch() {
  return puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
  });
}

async function enterZone(page, zoneText) {
  await page.goto('http://localhost:5000/muyojeong?qa_preview=boundary', {
    waitUntil: 'networkidle0', timeout: 20000,
  });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '지역별 보기');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const clicked = await page.evaluate((zt) => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes(zt));
    if (b) { b.click(); return true; }
    return false;
  }, zoneText);
  if (!clicked) throw new Error(`Zone button not found: "${zoneText}"`);
  await new Promise(r => setTimeout(r, 1000));
}

async function enterPlacementMode(page) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '시작');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 400));
}

// 현재 화면의 배치 모드 편집 대상 장소 버튼 목록 가져오기
async function getPlacementTargets(page) {
  return page.evaluate(() => {
    // 위치 지정 모드 패널 내 Zone N 라벨과 장소 버튼 목록
    const labels = [...document.querySelectorAll('div')].filter(d =>
      /^Zone \d$/.test(d.textContent.trim())
    );
    const result = {};
    for (const label of labels) {
      const zoneNum = parseInt(label.textContent.trim().replace('Zone ', ''));
      const parent = label.parentElement;
      const btns = [...parent.querySelectorAll('button')].map(b => b.textContent.trim().replace('✓', '').trim());
      if (btns.length > 0) result[zoneNum] = btns;
    }
    return result;
  });
}

// 좌표 목록 표시된 장소 이름 가져오기
async function getCandidateListPlaces(page) {
  return page.evaluate(() => {
    // 좌표 목록: "name_ko: x=..., y=..." 형태
    const spans = [...document.querySelectorAll('span')].filter(s =>
      s.style.fontFamily && s.style.fontFamily.includes('monospace') && s.textContent.includes('x=')
    );
    return spans.map(s => s.textContent.split(':')[0].trim());
  });
}

(async () => {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  console.log('\n=== Zone 1·2 QA 편집기 권역 분리 검증 ===\n');

  let allPass = true;

  // ── Test A: Zone 1 선택 후 편집 대상 확인 ──────────────────────────────
  console.log('── A. Zone 1 (원도심 해안권) 선택 ──');
  await enterZone(page, '원도심 해안권');
  await enterPlacementMode(page);
  const targetsA = await getPlacementTargets(page);
  const zonesInA = Object.keys(targetsA).map(Number);
  const aHasZone2 = zonesInA.includes(2);
  const aOnlyZone1 = zonesInA.length === 1 && zonesInA.includes(1);
  console.log(`  편집 대상 권역: ${JSON.stringify(zonesInA)}`);
  console.log(`  Zone 1만 표시: ${aOnlyZone1 ? '✅' : '❌'}`);
  console.log(`  Zone 2 미표시: ${!aHasZone2 ? '✅' : '❌'}`);
  if (aHasZone2) {
    console.log(`  Zone 2 장소 목록: ${JSON.stringify(targetsA[2])}`);
    allPass = false;
  }
  const candA = await getCandidateListPlaces(page);
  console.log(`  좌표 목록 장소 수: ${candA.length}`);

  // ── Test B: Zone 2 선택 후 편집 대상 확인 ──────────────────────────────
  console.log('\n── B. Zone 2 (오동도·엑스포권) 선택 ──');
  // 뒤로 가기 → Zone 2 선택
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('←') || b.textContent.includes('뒤로') || b.getAttribute('aria-label')?.includes('back'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('오동도'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await enterPlacementMode(page);
  const targetsB = await getPlacementTargets(page);
  const zonesInB = Object.keys(targetsB).map(Number);
  const bHasZone1 = zonesInB.includes(1);
  const bOnlyZone2 = zonesInB.length === 1 && zonesInB.includes(2);
  console.log(`  편집 대상 권역: ${JSON.stringify(zonesInB)}`);
  console.log(`  Zone 2만 표시: ${bOnlyZone2 ? '✅' : '❌'}`);
  console.log(`  Zone 1 미표시: ${!bHasZone1 ? '✅' : '❌'}`);
  if (bHasZone1) {
    console.log(`  Zone 1 장소 목록: ${JSON.stringify(targetsB[1])}`);
    allPass = false;
  }
  if (!aOnlyZone1 || !bOnlyZone2) allPass = false;

  // ── Test C: Zone 1→2→1 전환 혼선 없음 ──────────────────────────────────
  console.log('\n── C. Zone 1→2→1 전환 혼선 테스트 ──');
  // 뒤로 → Zone 1
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('←') || b.textContent.includes('뒤로') || b.getAttribute('aria-label')?.includes('back'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('원도심 해안권'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await enterPlacementMode(page);
  const targetsC = await getPlacementTargets(page);
  const zonesInC = Object.keys(targetsC).map(Number);
  const cClean = zonesInC.length === 1 && zonesInC.includes(1);
  console.log(`  Zone 1 복귀 후 편집 대상 권역: ${JSON.stringify(zonesInC)}`);
  console.log(`  혼선 없음 (Zone 1만): ${cClean ? '✅' : '❌'}`);
  if (!cClean) allPass = false;

  // ── Test D: 일반 모드(비QA)에서 위치 지정 패널 없음 ────────────────────
  console.log('\n── D. 일반 모드 (비 QA Preview) 확인 ──');
  await page.goto('http://localhost:5000/muyojeong', { waitUntil: 'networkidle0', timeout: 20000 });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '지역별 보기');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('원도심 해안권'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const normalModeHasPanel = await page.evaluate(() => {
    return [...document.querySelectorAll('button')].some(b => b.textContent.trim() === '시작');
  });
  console.log(`  위치 지정 패널 없음: ${!normalModeHasPanel ? '✅' : '❌'}`);
  if (normalModeHasPanel) allPass = false;

  // ── 최종 판정 ──────────────────────────────────────────────────────────
  console.log('\n=== 최종 판정 ===');
  console.log(allPass
    ? '✅ PASS — Zone 1·2 QA 편집기 권역 분리 정상'
    : '❌ FAIL — 항목 확인 필요');

  await browser.close();
  if (!allPass) process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
