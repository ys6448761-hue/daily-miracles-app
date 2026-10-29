/**
 * MAP V0.1 — Real Alignment Test
 *
 * 이전 테스트(map-alignment-verify.js)의 오류:
 *   - QA 진입 버튼 선택자 '위치 지정'이 실제 버튼 텍스트 '시작'과 불일치
 *   - placement mode가 실제로 진입되지 않아 두 측정 모두 regular 마커를 비교
 *   - Δ=0은 같은 마커를 두 번 재는 결과였음 — 무의미
 *
 * 이 테스트:
 *   1. localStorage에 Zone 3 소스 좌표를 코드와 동일한 값으로 주입
 *   2. Zone 3 QA preview 진입
 *   3. 실제 '시작' 버튼으로 placement mode 진입
 *   4. 초록 candidate 마커 중심 측정
 *   5. placement mode 종료 ('종료' 버튼)
 *   6. 주황 regular PROVISIONAL 마커 중심 측정
 *   7. 비교: Δx/Δy < 0.01 = PASS
 */

const puppeteer = require('puppeteer-core');

// yeosuMapData.js와 동일한 Zone 3 소스 좌표
const ZONE3_SOURCE = {
  dolsan_daegyo:   { x: 0.639, y: 0.518 },
  dolsan_nightscape: { x: 0.681, y: 0.539 },
  museukmok:       { x: 0.701, y: 0.615 },
  cablecar_dolsan: { x: 0.678, y: 0.531 },
  artland_resort:  { x: 0.740, y: 0.580 },
};

const DRAFT_KEY = 'yeosu_map_draft_v02_overview';

async function navigateToZone3(page) {
  await page.goto('http://localhost:5000/muyojeong?qa_preview=boundary', {
    waitUntil: 'networkidle0', timeout: 20000,
  });
  // 지역별 보기 클릭
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '지역별 보기');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  // Zone 3 돌산권 선택
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('돌산권'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1200));
}

function measureMarkers(page, imageKey, markerSelector) {
  return page.evaluate((imageKey, markerSelector) => {
    const imgs = [...document.querySelectorAll('img')].filter(img =>
      img.src.includes(imageKey === 'overview' ? 'yeosu-overview' : 'yeosu-oldtown')
    );
    if (!imgs.length) return { error: `no ${imageKey} img` };

    const wrapper = imgs[0].parentElement;
    const wRect = wrapper.getBoundingClientRect();
    if (wRect.width === 0 || wRect.height === 0) return { error: 'wrapper zero size' };

    const results = {};
    for (const [label, selector] of Object.entries(markerSelector)) {
      const el = document.querySelector(selector);
      if (!el) { results[label] = null; continue; }
      const eRect = el.getBoundingClientRect();
      const innerCircle = el.querySelector('div');
      const cRect = innerCircle?.getBoundingClientRect();
      results[label] = {
        markerCenter: {
          x: ((eRect.left + eRect.width / 2) - wRect.left) / wRect.width,
          y: ((eRect.top + eRect.height / 2) - wRect.top) / wRect.height,
        },
        circleCenter: cRect ? {
          x: ((cRect.left + cRect.width / 2) - wRect.left) / wRect.width,
          y: ((cRect.top + cRect.height / 2) - wRect.top) / wRect.height,
        } : null,
        markerSize: { w: Math.round(eRect.width), h: Math.round(eRect.height) },
        circleSize: cRect ? { w: Math.round(cRect.width), h: Math.round(cRect.height) } : null,
      };
    }
    return results;
  }, imageKey, markerSelector);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });

    // ─── Step 1: localStorage 주입 후 페이지 재진입 ───────────────────────
    // localStorage는 origin 진입 후에만 접근 가능
    await page.goto('http://localhost:5000/muyojeong?qa_preview=boundary', {
      waitUntil: 'networkidle0', timeout: 20000,
    });
    await page.evaluate((key, data) => {
      localStorage.setItem(key, JSON.stringify(data));
    }, DRAFT_KEY, ZONE3_SOURCE);
    console.log('✅ localStorage 주입 완료:', Object.keys(ZONE3_SOURCE).join(', '));

    // ─── Step 2: Zone 3 진입 ─────────────────────────────────────────────
    await navigateToZone3(page);

    // ─── Step 3: placement mode 진입 ('시작' 버튼) ────────────────────────
    const startClicked = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      // '마커 위치 지정 모드' span 옆에 있는 '시작' 버튼
      const b = buttons.find(b => b.textContent.trim() === '시작');
      if (b) { b.click(); return true; }
      return false;
    });
    if (!startClicked) {
      console.error('❌ placement mode "시작" 버튼 미발견');
      // 버튼 목록 출력
      const btns = await page.evaluate(() =>
        [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => t.length < 30)
      );
      console.log('현재 버튼 목록:', btns);
    } else {
      console.log('✅ placement mode 진입');
    }
    await new Promise(r => setTimeout(r, 600));

    // ─── Step 4: 초록 candidate 마커 중심 측정 ───────────────────────────
    // candidate marker title = "[후보] {name_ko}: ({x}, {y}) — 드래그해 위치 조정"
    const candidateSelectors = {};
    for (const [code] of Object.entries(ZONE3_SOURCE)) {
      // title은 name_ko를 포함. code를 직접 쓸 수 없으므로 title attribute로 찾음
      candidateSelectors[code] = `[title*="[후보]"][title*="${code.replace('_', '')}"]`;
    }

    // 실제로 title에서 code는 안 나오고 name_ko가 나옴 — 대신 aria-label 사용 불가 (없음)
    // title 형식: "[후보] 돌산대교: (0.639, 0.518) — 드래그해 위치 조정"
    const NAME_MAP = {
      dolsan_daegyo:    '돌산대교',
      dolsan_nightscape: '돌산공원',
      museukmok:        '무슬목',
      cablecar_dolsan:  '해상케이블카 돌산탑승장',
      artland_resort:   '예술랜드리조트',
    };
    const candidateSel = {};
    for (const [code, name] of Object.entries(NAME_MAP)) {
      candidateSel[code] = `[title*="[후보]"][title*="${name}"]`;
    }

    const candidateResult = await measureMarkers(page, 'overview', candidateSel);
    console.log('\n[Placement mode] candidate 마커 중심:');
    for (const [code, r] of Object.entries(candidateResult)) {
      if (r) console.log(` ${code}: circleCenter=(${r.circleCenter?.x?.toFixed(4)}, ${r.circleCenter?.y?.toFixed(4)}) size=${r.circleSize?.w}×${r.circleSize?.h}`);
      else console.log(` ${code}: NOT FOUND`);
    }

    // ─── Step 5: placement mode 종료 ('종료' 버튼) ───────────────────────
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '종료');
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 600));
    console.log('✅ placement mode 종료');

    // ─── Step 6: 주황 regular PROVISIONAL 마커 중심 측정 ─────────────────
    // aria-label: "돌산대교 선택 (QA)" / "돌산대교 선택 해제 (QA)"
    //             "무슬목 — 탐색 가능" / "예술랜드리조트 (위치 미검증)"
    const regularSel = {};
    for (const [code, name] of Object.entries(NAME_MAP)) {
      regularSel[code] = `[aria-label*="${name}"]`;
    }

    const regularResult = await measureMarkers(page, 'overview', regularSel);
    console.log('\n[Regular QA preview] 주황 마커 중심:');
    for (const [code, r] of Object.entries(regularResult)) {
      if (r) console.log(` ${code}: circleCenter=(${r.circleCenter?.x?.toFixed(4)}, ${r.circleCenter?.y?.toFixed(4)}) size=${r.markerSize?.w}×${r.markerSize?.h}`);
      else console.log(` ${code}: NOT FOUND`);
    }

    // ─── Step 7: 비교 ─────────────────────────────────────────────────────
    console.log('\n─── 비교 결과 ───');
    console.log(`${'place_id'.padEnd(22)} ${'src_x'.padEnd(7)} ${'src_y'.padEnd(7)} ${'cand_x'.padEnd(8)} ${'cand_y'.padEnd(8)} ${'reg_x'.padEnd(8)} ${'reg_y'.padEnd(8)} ${'Δ(cand)'.padEnd(10)} ${'Δ(reg)'}`);
    let allPass = true;
    for (const [code, src] of Object.entries(ZONE3_SOURCE)) {
      const cand = candidateResult[code];
      const reg = regularResult[code];
      const candCx = cand?.circleCenter?.x ?? null;
      const candCy = cand?.circleCenter?.y ?? null;
      const regCx = reg?.circleCenter?.x ?? null;
      const regCy = reg?.circleCenter?.y ?? null;
      const dxC = candCx != null ? Math.abs(src.x - candCx).toFixed(4) : 'N/A';
      const dyC = candCy != null ? Math.abs(src.y - candCy).toFixed(4) : 'N/A';
      const dxR = regCx != null ? Math.abs(src.x - regCx).toFixed(4) : 'N/A';
      const dyR = regCy != null ? Math.abs(src.y - regCy).toFixed(4) : 'N/A';
      const candPass = dxC !== 'N/A' && dyC !== 'N/A' && parseFloat(dxC) < 0.01 && parseFloat(dyC) < 0.01;
      const regPass = dxR !== 'N/A' && dyR !== 'N/A' && parseFloat(dxR) < 0.01 && parseFloat(dyR) < 0.01;
      if (!candPass || !regPass) allPass = false;
      const mark = (candPass && regPass) ? '✅' : '❌';
      console.log(`${mark} ${code.padEnd(22)} ${String(src.x).padEnd(7)} ${String(src.y).padEnd(7)} ${String(candCx?.toFixed(4) ?? 'N/A').padEnd(8)} ${String(candCy?.toFixed(4) ?? 'N/A').padEnd(8)} ${String(regCx?.toFixed(4) ?? 'N/A').padEnd(8)} ${String(regCy?.toFixed(4) ?? 'N/A').padEnd(8)} Δ(cand)=${dxC},${dyC} Δ(reg)=${dxR},${dyR}`);
    }
    console.log(`\n최종: ${allPass ? 'PASS ✅' : 'FAIL ❌'}`);

  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e.message); process.exit(1); });
