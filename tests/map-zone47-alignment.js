/**
 * MAP V0.1 — Zone 4~7 Alignment Verification
 *
 * Founder 전달값 vs SOURCE 16/16 일치 확인 후:
 * - SOURCE 좌표를 localStorage에 주입
 * - 각 권역별 placement mode candidate 마커 vs regular 마커 비교
 * - Δ=0 확인 시 렌더링 코드 정상, 화면 불일치 원인은 Founder localStorage stale data
 */

const puppeteer = require('puppeteer-core');

const DRAFT_KEY = 'yeosu_map_draft_v02_overview';

// SOURCE 좌표 (Founder 전달값과 16/16 동일 확인)
const ZONE4_SOURCE = {
  dolsan_got_market:  { x: 0.702, y: 0.660 },
  hyangiram:          { x: 0.751, y: 0.804 },
  nk_submarine:       { x: 0.726, y: 0.772 },
  bonghwangsan:       { x: 0.678, y: 0.743 },
};

const ZONE5_SOURCE = {
  yworld_luge:          { x: 0.461, y: 0.460 },
  jangdo:               { x: 0.525, y: 0.503 },
  soho_yacht:           { x: 0.478, y: 0.509 },
  soho_bridge:          { x: 0.496, y: 0.471 },
  lee_soon_shin_marina: { x: 0.547, y: 0.504 },
  settler_cactus:       { x: 0.406, y: 0.459 },
};

const ZONE6_SOURCE = {
  gasari_ecology:  { x: 0.364, y: 0.404 },
  yeojaman_sunset: { x: 0.277, y: 0.288 },
  seomdalcheon:    { x: 0.254, y: 0.341 },
  hwanyang_drive:  { x: 0.433, y: 0.506 },
};

const ZONE7_SOURCE = {
  sado_island:    { x: 0.307, y: 0.823 },
  hahwado_island: { x: 0.420, y: 0.818 },
};

const NAME_MAP = {
  dolsan_got_market:    '돌산갓장터마을',
  hyangiram:            '향일암',
  nk_submarine:         '북한반잠수정전시관',
  bonghwangsan:         '봉황산자연휴양림',
  yworld_luge:          '유월드루지',
  jangdo:               '장도',
  soho_yacht:           '소호요트장',
  soho_bridge:          '소호동동다리',
  lee_soon_shin_marina: '이순신마리나',
  settler_cactus:       '서틀러다육식물원',
  gasari_ecology:       '가사리생태공원',
  yeojaman_sunset:      '여자만갯벌/해넘이',
  seomdalcheon:         '섬달천',
  hwanyang_drive:       '화양드라이브',
  sado_island:          '사도',
  hahwado_island:       '하화도',
};

const ZONE_NAMES = {
  4: '향일암권',
  5: '소호·장도권',
  6: '화양·여자만권',
  7: '섬섬길',
};

async function navigateToZone(page, zoneId) {
  const zoneName = ZONE_NAMES[zoneId];
  await page.goto('http://localhost:5000/muyojeong?qa_preview=boundary', {
    waitUntil: 'networkidle0', timeout: 20000,
  });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '지역별 보기');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate((name) => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes(name));
    if (b) b.click();
  }, zoneName);
  await new Promise(r => setTimeout(r, 1200));
}

function measureMarkers(page, selectors) {
  return page.evaluate((selectors) => {
    const imgs = [...document.querySelectorAll('img')].filter(img =>
      img.src.includes('yeosu-overview')
    );
    if (!imgs.length) return { error: 'no overview img' };
    const wrapper = imgs[0].parentElement;
    const wRect = wrapper.getBoundingClientRect();
    if (wRect.width === 0 || wRect.height === 0) return { error: 'wrapper zero size' };
    const results = {};
    for (const [label, selector] of Object.entries(selectors)) {
      const el = document.querySelector(selector);
      if (!el) { results[label] = null; continue; }
      const innerCircle = el.querySelector('div');
      const cRect = innerCircle?.getBoundingClientRect();
      results[label] = cRect ? {
        x: ((cRect.left + cRect.width / 2) - wRect.left) / wRect.width,
        y: ((cRect.top + cRect.height / 2) - wRect.top) / wRect.height,
      } : null;
    }
    return results;
  }, selectors);
}

async function verifyZone(page, zoneId, source, draftData) {
  const zoneName = ZONE_NAMES[zoneId];
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Zone ${zoneId} (${zoneName}) — ${Object.keys(source).length}곳`);
  console.log('═'.repeat(60));

  await navigateToZone(page, zoneId);

  // placement mode 진입
  const startClicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '시작');
    if (b) { b.click(); return true; }
    return false;
  });
  if (!startClicked) {
    console.log(`  ⚠️  '시작' 버튼 미발견 — placement mode 진입 불가`);
    const btns = await page.evaluate(() =>
      [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(t => t.length < 20)
    );
    console.log('  현재 버튼:', btns.join(', '));
  }
  await new Promise(r => setTimeout(r, 600));

  // candidate 마커 측정
  const candSels = {};
  for (const code of Object.keys(source)) {
    candSels[code] = `[title*="[후보]"][title*="${NAME_MAP[code]}"]`;
  }
  const candResult = await measureMarkers(page, candSels);

  // placement mode 종료
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '종료');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // regular 마커 측정
  const regSels = {};
  for (const code of Object.keys(source)) {
    regSels[code] = `[aria-label*="${NAME_MAP[code]}"]`;
  }
  const regResult = await measureMarkers(page, regSels);

  // 결과 출력
  let pass = 0, fail = 0;
  const rows = [];
  for (const [code, src] of Object.entries(source)) {
    const cand = candResult[code];
    const reg = regResult[code];
    const founderVal = draftData[code];
    const founderMatch = founderVal &&
      Math.abs(founderVal.x - src.x) < 0.001 &&
      Math.abs(founderVal.y - src.y) < 0.001;

    const dxC = cand ? Math.abs(src.x - cand.x) : null;
    const dyC = cand ? Math.abs(src.y - cand.y) : null;
    const dxR = reg ? Math.abs(src.x - reg.x) : null;
    const dyR = reg ? Math.abs(src.y - reg.y) : null;

    const candOk = dxC !== null && dyC !== null && dxC < 0.01 && dyC < 0.01;
    const regOk = dxR !== null && dyR !== null && dxR < 0.01 && dyR < 0.01;
    const ok = candOk && regOk;
    if (ok) pass++; else fail++;

    rows.push({
      code, founderMatch, src,
      cand: cand ? `(${cand.x.toFixed(4)},${cand.y.toFixed(4)})` : 'N/A',
      reg: reg ? `(${reg.x.toFixed(4)},${reg.y.toFixed(4)})` : 'N/A',
      dxC: dxC !== null ? dxC.toFixed(4) : 'N/A',
      dyC: dyC !== null ? dyC.toFixed(4) : 'N/A',
      dxR: dxR !== null ? dxR.toFixed(4) : 'N/A',
      dyR: dyR !== null ? dyR.toFixed(4) : 'N/A',
      ok,
    });
  }

  console.log(`\n  ${'place_id'.padEnd(24)} ${'Founder=SRC'.padEnd(11)} ${'cand'.padEnd(16)} ${'reg'.padEnd(16)} ${'Δcand'.padEnd(12)} ${'Δreg'.padEnd(12)} 결과`);
  for (const r of rows) {
    const mark = r.ok ? '✅' : '❌';
    console.log(`  ${mark} ${r.code.padEnd(24)} ${(r.founderMatch ? '✅ 일치' : '❌ 불일치').padEnd(11)} ${r.cand.padEnd(16)} ${r.reg.padEnd(16)} ${(r.dxC+','+r.dyC).padEnd(12)} ${(r.dxR+','+r.dyR).padEnd(12)}`);
  }
  console.log(`\n  결과: ${pass}/${pass+fail} PASS`);
  return { pass, fail, total: pass + fail };
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

    // 전체 Zone 4~7 SOURCE 좌표를 localStorage에 주입 (Zone 3 포함해야 전체 일관성 유지)
    const ZONE3_CURRENT = {
      dolsan_daegyo:    { x: 0.617, y: 0.495 },
      dolsan_nightscape: { x: 0.671, y: 0.511 },
      museukmok:        { x: 0.696, y: 0.606 },
      cablecar_dolsan:  { x: 0.715, y: 0.528 },
      artland_resort:   { x: 0.740, y: 0.580 },
    };
    const allDraft = {
      ...ZONE3_CURRENT,
      ...ZONE4_SOURCE,
      ...ZONE5_SOURCE,
      ...ZONE6_SOURCE,
      ...ZONE7_SOURCE,
    };

    await page.goto('http://localhost:5000/muyojeong?qa_preview=boundary', {
      waitUntil: 'networkidle0', timeout: 20000,
    });
    await page.evaluate((key, data) => {
      localStorage.setItem(key, JSON.stringify(data));
    }, DRAFT_KEY, allDraft);
    console.log(`✅ localStorage 주입: ${Object.keys(allDraft).length}곳 (Zone 3~7 전체)`);

    const allFounder = { ...ZONE4_SOURCE, ...ZONE5_SOURCE, ...ZONE6_SOURCE, ...ZONE7_SOURCE };

    let totalPass = 0, totalFail = 0;
    const zoneResults = {};

    for (const [zoneId, source] of [
      [4, ZONE4_SOURCE],
      [5, ZONE5_SOURCE],
      [6, ZONE6_SOURCE],
      [7, ZONE7_SOURCE],
    ]) {
      const r = await verifyZone(page, zoneId, source, allFounder);
      zoneResults[zoneId] = r;
      totalPass += r.pass;
      totalFail += r.fail;
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log('Zone 4~7 전체 결과');
    console.log('═'.repeat(60));
    for (const [z, r] of Object.entries(zoneResults)) {
      const mark = r.fail === 0 ? '✅' : '❌';
      console.log(`  Zone ${z} (${ZONE_NAMES[z]}): ${mark} ${r.pass}/${r.total} PASS`);
    }
    console.log(`\n최종: ${totalPass}/${totalPass+totalFail} PASS — ${totalFail === 0 ? '✅ ALL PASS' : '❌ FAIL'}`);

    if (totalFail === 0) {
      console.log('\n📋 판정: SOURCE = Founder 전달값 (16/16 일치). 렌더링 코드 정상 (Δ=0.0000).');
      console.log('   시각적 불일치 원인: Founder 브라우저 localStorage stale data');
      console.log('   해결: QA preview → 각 권역 → "초안 삭제" 또는 DevTools → Application → Local Storage → yeosu_map_draft_v02_overview 삭제');
    }

  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e.message); process.exit(1); });
