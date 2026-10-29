/**
 * MAP V0.1 — Visual Closeout
 * Zone 1 일반지도 / Zone 2 일반지도 / Zone 2 QA편집 스크린샷 + 마커 좌표 비교
 */
const puppeteer = require('../node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const QA_URL = 'http://localhost:5000/muyojeong?qa_preview=boundary';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'knowledge', 'visual-closeout-2026-10-29');
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function collectMarkers(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('*')].filter(el => {
      const s = el.style;
      return s && s.position === 'absolute' && s.left && el.title &&
             !el.title.includes('[QA]') && !el.title.includes('정확도');
    }).map(el => ({
      title: el.title,
      left: parseFloat(el.style.left),   // %
      top:  parseFloat(el.style.top),    // %
      x: parseFloat(el.style.left) / 100,
      y: parseFloat(el.style.top)  / 100,
    }));
  });
}

// QA 편집기에서 후보 마커(드래그 가능한 점) 수집
async function collectCandidates(page) {
  return page.evaluate(() => {
    // 후보 마커: position:absolute, data-code 또는 cursor:grab 스타일 가진 요소
    return [...document.querySelectorAll('*')].filter(el => {
      const s = el.style;
      return s && s.position === 'absolute' && s.left &&
             (s.cursor === 'grab' || s.cursor === 'grabbing' ||
              el.getAttribute('data-code') ||
              (el.title && el.title.includes('·')));
    }).map(el => ({
      title: el.title || el.getAttribute('data-code') || '',
      left: parseFloat(el.style.left),
      top:  parseFloat(el.style.top),
      x: parseFloat(el.style.left) / 100,
      y: parseFloat(el.style.top)  / 100,
    }));
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--incognito'],
  });
  const page = (await browser.pages())[0];
  await page.setViewport({ width: 390, height: 844 });
  await page.setCacheEnabled(false);

  const report = { zone1: null, zone2_normal: null, zone2_qa: null, mismatches: [] };

  try {
    // ── Zone 1 일반 지도 (QA Preview) ─────────────────────────
    await page.goto(QA_URL, { waitUntil: 'networkidle2', timeout: 25000 });
    await sleep(2000);
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '지역별 보기')?.click()
    );
    await sleep(800);
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('원도심'))?.click()
    );
    await sleep(2000);

    const z1Markers = await collectMarkers(page);
    report.zone1 = z1Markers;
    // 지도 이미지로 스크롤
    await page.evaluate(() => {
      const img = document.querySelector('img[src*="oldtown"]') || document.querySelector('img[src*="muyojeong/map"]');
      if (img) img.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await sleep(500);
    await page.screenshot({ path: path.join(OUT_DIR, 'zone1-normal.png'), fullPage: false });
    console.log(`Zone 1 스크린샷 저장: zone1-normal.png (마커 ${z1Markers.length}개)`);

    // ── Zone 2 일반 지도 (QA Preview) ─────────────────────────
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('뒤로'))?.click()
    );
    await sleep(1000);
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('오동도'))?.click()
    );
    await sleep(2500);

    const z2NormalMarkers = await collectMarkers(page);
    report.zone2_normal = z2NormalMarkers;
    await page.evaluate(() => {
      const img = document.querySelector('img[src*="oldtown"]') || document.querySelector('img[src*="muyojeong/map"]');
      if (img) img.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await sleep(500);
    await page.screenshot({ path: path.join(OUT_DIR, 'zone2-normal.png'), fullPage: false });
    console.log(`Zone 2 일반 스크린샷 저장: zone2-normal.png (마커 ${z2NormalMarkers.length}개)`);

    // ── Zone 2 QA 편집기 (placement mode) ─────────────────────
    // "시작" 버튼 클릭 → 위치 지정 모드
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '시작')?.click()
    );
    await sleep(1000);

    // Zone 2 첫 번째 타겟(오동도) 선택 → 지도에 마커 표시
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const odongdo = btns.find(b => b.textContent.includes('오동도') && !b.textContent.includes('엑스포'));
      if (odongdo) odongdo.click();
    });
    await sleep(800);

    await page.evaluate(() => {
      const img = document.querySelector('img[src*="oldtown"]') || document.querySelector('img[src*="muyojeong/map"]');
      if (img) img.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await sleep(500);
    await page.screenshot({ path: path.join(OUT_DIR, 'zone2-qa-editor.png'), fullPage: false });
    console.log(`Zone 2 QA 편집기 스크린샷 저장: zone2-qa-editor.png`);

    // ── 비교: Zone 2 일반 vs QA 편집기 마커 좌표 ──────────────
    // QA 편집기에서 기존 마커는 숨겨지므로 직접 비교는 수동 육안.
    // 대신 Zone 2 일반 마커 좌표를 소스와 대조하여 보고.

    const ZONE2_FINAL = {
      '오동도':       { x: 0.853, y: 0.392 },
      '케이블카':     { x: 0.660, y: 0.544 },
      '엑스포공원':   { x: 0.558, y: 0.211 },
      '스카이타워':   { x: 0.604, y: 0.137 },
      '자산공원':     { x: 0.581, y: 0.537 },
      '아쿠아플라넷': { x: 0.586, y: 0.326 },
      '낭만요트':     { x: 0.657, y: 0.430 },
      '블루요트':     { x: 0.627, y: 0.414 },
      '빅오쇼':       { x: 0.549, y: 0.285 },
    };

    // ── 결과 출력 ────────────────────────────────────────────────
    console.log('\n=== MAP V0.1 Visual Closeout ===\n');

    console.log('## Zone 1 마커 (정상 = 6개)');
    z1Markers.forEach(m => console.log(`  ${m.title}: left=${m.left}%, top=${m.top}%`));
    console.log(`  → 총 ${z1Markers.length}개 ${z1Markers.length === 6 ? '✅' : '❌'}`);

    console.log('\n## Zone 2 마커 (정상 = 9개)');
    z2NormalMarkers.forEach(m => console.log(`  ${m.title}: left=${m.left}%, top=${m.top}%`));
    console.log(`  → 총 ${z2NormalMarkers.length}개 ${z2NormalMarkers.length === 9 ? '✅' : '❌'}`);

    console.log('\n## Zone 2 마커 소스 대조 (불일치만 표시)');
    let mismatchCount = 0;
    for (const [name, src] of Object.entries(ZONE2_FINAL)) {
      const rendered = z2NormalMarkers.find(m => m.title.includes(name));
      if (!rendered) {
        console.log(`  ❌ ${name}: 미렌더링`);
        report.mismatches.push({ name, reason: '미렌더링' });
        mismatchCount++;
        continue;
      }
      const dx = Math.abs(rendered.x - src.x);
      const dy = Math.abs(rendered.y - src.y);
      if (dx > 0.003 || dy > 0.003) {
        console.log(`  ❌ ${name}: src(${src.x},${src.y}) render(${rendered.x},${rendered.y}) Δx=${dx.toFixed(4)} Δy=${dy.toFixed(4)}`);
        report.mismatches.push({ name, src, rendered, dx, dy });
        mismatchCount++;
      }
    }
    if (mismatchCount === 0) console.log('  없음 — 전체 일치 ✅');

    // 스크린샷 경로 안내
    console.log('\n## 스크린샷 저장 위치');
    console.log(`  ${OUT_DIR}`);
    console.log('  - zone1-normal.png  (Zone 1 일반 지도)');
    console.log('  - zone2-normal.png  (Zone 2 일반 지도)');
    console.log('  - zone2-qa-editor.png (Zone 2 QA 편집기)');

    // 최종 판정
    const z1Ok = z1Markers.length === 6;
    const z2Ok = z2NormalMarkers.length === 9;
    const coordOk = mismatchCount === 0;

    if (z1Ok && z2Ok && coordOk) {
      console.log('\n✅ MAP_V01_VISUAL_CLOSEOUT_READY');
    } else {
      console.log('\n❌ HOLD:');
      if (!z1Ok) console.log(`  Zone 1 마커 수 이상: ${z1Markers.length}개`);
      if (!z2Ok) console.log(`  Zone 2 마커 수 이상: ${z2NormalMarkers.length}개`);
      if (!coordOk) console.log(`  좌표 불일치: ${mismatchCount}개`);
    }

  } finally {
    await browser.close();
  }
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
