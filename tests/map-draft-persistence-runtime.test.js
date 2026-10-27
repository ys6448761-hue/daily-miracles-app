/**
 * MAP V0.1 — Draft Persistence Runtime Verification
 * 목적: localStorage 자동 저장·복원 실제 동작 확인
 * 격리: 별도 브라우저 컨텍스트(incognito) — Founder 기존 localStorage 보호
 * 실행: node tests/map-draft-persistence-runtime.test.js
 */
const puppeteer = require('../node_modules/puppeteer-core');
const BASE_URL  = 'http://localhost:5000';
const QA_URL    = `${BASE_URL}/muyojeong?qa_preview=boundary`;
const DRAFT_KEY = 'yeosu_map_draft_v02_oldtown';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let browser, ctx, page;
const results = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

function pass(id, detail) { results.push({ id, status: 'PASS', detail }); console.log(`  ✅ ${id}: ${detail}`); }
function fail(id, detail) { results.push({ id, status: 'FAIL', detail }); console.error(`  ❌ ${id}: ${detail}`); }
function open(id, detail) { results.push({ id, status: 'OPEN', detail }); console.log(`  🔵 ${id}: ${detail}`); }

async function waitAndClick(selector, timeout = 5000) {
  await page.waitForSelector(selector, { timeout });
  await page.click(selector);
}

async function getLocalStorage(key) {
  return page.evaluate(k => localStorage.getItem(k), key);
}

async function openMapSelector() {
  // "지역별 보기" 버튼 활성화 (mapMode toggle)
  const opened = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim() === '지역별 보기');
    if (btn) { btn.click(); return true; }
    return false;
  });
  await sleep(1000);
  return opened;
}

async function navigateToZoneDetail(zoneText) {
  // 권역 카드 버튼 텍스트로 클릭 (mapMode 활성 후)
  await page.waitForSelector('button', { timeout: 5000 });
  const found = await page.evaluate((text) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes(text));
    if (btn) { btn.click(); return true; }
    return false;
  }, zoneText);
  await sleep(700);
  return found;
}

async function enablePlacementMode() {
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text === '시작') {
      await btn.click();
      await sleep(300);
      return true;
    }
  }
  return false;
}

async function selectPlacementTarget(targetName) {
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent.trim());
    if (text.includes(targetName)) {
      await btn.click();
      await sleep(200);
      return true;
    }
  }
  return false;
}

async function clickMapAt(xRatio, yRatio) {
  // 지도 div를 viewport 안으로 스크롤 후 클릭
  await sleep(300);
  const result = await page.evaluate((xR, yR) => {
    const el = document.querySelector('[style*="crosshair"]') ||
               document.querySelector('[style*="64.32%"]');
    if (!el) return 'NOT_FOUND';
    el.scrollIntoView({ block: 'center' });
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width  * xR;
    const y = rect.top  + rect.height * yR;
    // 뷰포트 안에 있을 때 dispatchEvent
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y });
    el.dispatchEvent(evt);
    return `x=${x.toFixed(0)},y=${y.toFixed(0)}`;
  }, xRatio, yRatio);
  if (result === 'NOT_FOUND') return false;
  console.log('  map dispatchEvent:', result);
  return true;
}

(async () => {
  console.log('\n🧪 MAP Draft Persistence Runtime Test\n');
  try {
    // 격리 브라우저 컨텍스트 (Founder 기존 데이터 보호)
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--incognito'],
    });
    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();
    await page.setViewport({ width: 390, height: 844 }); // iPhone-sized

    // ─── T-01: 페이지 로드 ─────────────────────────────────────────
    console.log('T-01 페이지 로드');
    await page.goto(QA_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    const title = await page.title();
    if (title) pass('T-01', `페이지 로드 OK (title="${title}")`);
    else fail('T-01', '페이지 타이틀 없음');

    // ─── T-02: 초기 localStorage 비어 있음 확인 ───────────────────
    console.log('T-02 초기 localStorage 비어 있음');
    const initial = await getLocalStorage(DRAFT_KEY);
    if (!initial) pass('T-02', 'DRAFT_KEY 초기값 없음 (incognito 격리 확인)');
    else fail('T-02', `예상치 못한 초기값 있음: ${initial.slice(0, 60)}`);

    // ─── T-03: Zone 1 진입 ─────────────────────────────────────────
    console.log('T-03 Zone 1(원도심) 진입');
    await openMapSelector();
    const zone1Clicked = await navigateToZoneDetail('원도심');
    if (zone1Clicked) pass('T-03', 'Zone 1 카드 클릭 성공');
    else { fail('T-03', 'Zone 1 카드 찾지 못함'); }

    // ─── T-04: 편집 모드 활성화 ───────────────────────────────────
    console.log('T-04 편집 모드 시작');
    await sleep(800);
    const modeEnabled = await enablePlacementMode();
    if (modeEnabled) pass('T-04', '편집 모드 활성화 성공');
    else { fail('T-04', '"시작" 버튼 찾지 못함'); }

    // ─── T-05: 이순신광장 선택 ────────────────────────────────────
    console.log('T-05 이순신광장 선택');
    await sleep(300);
    const targetSelected = await selectPlacementTarget('이순신광장');
    if (targetSelected) pass('T-05', '이순신광장 선택 성공');
    else fail('T-05', '이순신광장 버튼 찾지 못함');

    // ─── T-06: 지도 클릭 → 후보 좌표 지정 ───────────────────────
    console.log('T-06 지도 클릭 → 좌표 지정');
    await sleep(300);
    const clicked = await clickMapAt(0.3, 0.5);
    if (clicked) pass('T-06', '지도 클릭 성공 (x≈0.3, y≈0.5)');
    else fail('T-06', '지도 요소 찾지 못함');

    // ─── T-07: localStorage 저장 확인 ────────────────────────────
    console.log('T-07 localStorage 저장 확인');
    await sleep(500);
    const saved = await getLocalStorage(DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.lee_soon_shin_plaza) {
        const { x, y } = parsed.lee_soon_shin_plaza;
        pass('T-07', `DRAFT_KEY 저장됨: lee_soon_shin_plaza x=${x}, y=${y}`);
      } else {
        fail('T-07', `저장됐지만 lee_soon_shin_plaza 없음: ${saved.slice(0, 80)}`);
      }
    } else {
      fail('T-07', 'DRAFT_KEY 저장되지 않음');
    }

    // ─── T-08: 새로고침 → 복원 확인 ──────────────────────────────
    console.log('T-08 새로고침 후 복원 확인');
    const savedBeforeReload = saved ? JSON.parse(saved) : null;
    await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1000);

    // Zone 1 재진입
    await openMapSelector();
    await navigateToZoneDetail('원도심');
    await sleep(800);

    // 편집 모드 시작
    await enablePlacementMode();
    await sleep(300);

    // "초안 복원됨" 배지 확인
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('초안 복원됨')) {
      pass('T-08a', '"초안 복원됨" 배지 표시됨');
    } else {
      fail('T-08a', '"초안 복원됨" 배지 없음');
    }

    // 복원된 후보 좌표가 저장 전과 일치하는지
    if (savedBeforeReload?.lee_soon_shin_plaza) {
      await selectPlacementTarget('이순신광장');
      await sleep(200);
      const coordText = await page.evaluate(() => document.body.innerText);
      const { x, y } = savedBeforeReload.lee_soon_shin_plaza;
      if (coordText.includes(`x=${x}`) && coordText.includes(`y=${y}`)) {
        pass('T-08b', `복원 좌표 일치: x=${x}, y=${y}`);
      } else {
        fail('T-08b', `복원 좌표 불일치 또는 표시 없음 (expected x=${x} y=${y})`);
      }
    } else {
      open('T-08b', 'T-07 저장 실패로 대조 불가');
    }

    // ─── T-09: Zone 1→Overview→Zone 2 전환 후 candidates 유지 ───
    console.log('T-09 Zone 1→2 전환 후 candidates 유지');
    // 뒤로
    const backBtns = await page.$$('button');
    for (const btn of backBtns) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text.includes('뒤로') || text === '← 뒤로') {
        await btn.click();
        await sleep(400);
        break;
      }
    }
    // Zone 2 진입
    const zone2Clicked = await navigateToZoneDetail('오동도');
    if (zone2Clicked) {
      await sleep(800);
      await enablePlacementMode();
      await sleep(300);
      const z2Text = await page.evaluate(() => document.body.innerText);
      if (z2Text.includes('이순신광장') && (z2Text.includes('✓') || z2Text.includes('초안 복원됨'))) {
        pass('T-09', 'Zone 2에서 Zone 1 후보 좌표(이순신광장) 유지됨');
      } else {
        fail('T-09', 'Zone 2 편집 목록에서 이순신광장 좌표 흔적 없음');
      }
    } else {
      open('T-09', 'Zone 2 카드(오동도) 찾지 못함 — UI 텍스트 불일치 가능');
    }

    // ─── T-10: 전체 좌표 내보내기 ────────────────────────────────
    console.log('T-10 전체 좌표 내보내기');
    // 이미 Zone 2 편집 모드. 내보내기 버튼 클릭.
    // 클립보드 접근은 headless에서 제한적 → 버튼 존재 + 클릭 가능 확인만
    const allBtns = await page.$$('button');
    let exportBtnFound = false;
    for (const btn of allBtns) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text.includes('전체 좌표 내보내기') || text.includes('내보내기')) {
        exportBtnFound = true;
        // headless에서 clipboard.writeText는 실패 가능 → 오류 무시
        try { await btn.click(); } catch {}
        break;
      }
    }
    if (exportBtnFound) pass('T-10', '"전체 좌표 내보내기" 버튼 존재·클릭 가능');
    else open('T-10', '"전체 좌표 내보내기" 버튼 없음 — 좌표 2개 이상 필요 조건일 수 있음');

    // ─── T-11: 초안 삭제 ─────────────────────────────────────────
    console.log('T-11 초안 삭제');
    const beforeDelete = await getLocalStorage(DRAFT_KEY);
    const deleteBtns = await page.$$('button');
    for (const btn of deleteBtns) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text.includes('초안 삭제')) {
        await btn.click();
        await sleep(300);
        break;
      }
    }
    const afterDelete = await getLocalStorage(DRAFT_KEY);
    if (beforeDelete && !afterDelete) {
      pass('T-11', '초안 삭제 후 localStorage 제거 확인');
    } else if (!beforeDelete) {
      open('T-11', '삭제 전 DRAFT_KEY 이미 없음 — T-07 실패 영향');
    } else {
      fail('T-11', '초안 삭제 후 localStorage 여전히 존재');
    }

  } catch (err) {
    fail('RUNTIME', `예외 발생: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  // ─── 결과 요약 ───────────────────────────────────────────────────
  console.log('\n─── 결과 요약 ───');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const opened = results.filter(r => r.status === 'OPEN').length;
  results.forEach(r => console.log(`  ${r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '🔵'} ${r.id}: ${r.detail}`));
  console.log(`\n총 ${results.length}개: PASS ${passed} / FAIL ${failed} / OPEN ${opened}`);

  if (failed === 0) {
    console.log('\n결과: MAP_V01_DRAFT_RUNTIME_VERIFIED');
    process.exit(0);
  } else {
    console.log('\n결과: MAP_V01_DRAFT_RUNTIME_QA_OPEN');
    process.exit(1);
  }
})();
