const puppeteer = require('../node_modules/puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const QA_URL = 'http://localhost:5000/muyojeong?qa_preview=boundary';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: true,
    args: ['--no-sandbox', '--incognito'],
  });
  const page = (await browser.pages())[0];
  await page.setViewport({ width: 390, height: 844 });
  await page.setCacheEnabled(false);

  await page.goto(QA_URL, { waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(2000);
  await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '지역별 보기')?.click()
  );
  await sleep(800);
  await page.evaluate(() =>
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('오동도'))?.click()
  );
  await sleep(2500);

  const debug = await page.evaluate(() => {
    const absEls = [...document.querySelectorAll('*')].filter(el => {
      const s = el.style;
      return s && s.position === 'absolute' && s.left;
    });
    return {
      absCount: absEls.length,
      sampleTitles: absEls.slice(0, 8).map(el => ({
        title: el.title,
        left: el.style.left,
        top: el.style.top,
        tag: el.tagName,
      })),
      btns: Array.from(document.querySelectorAll('button')).slice(0, 8).map(b => b.textContent.trim().slice(0, 25)),
      imgSrcs: Array.from(document.querySelectorAll('img')).map(i => i.src),
      bodyText: document.body.innerText.slice(0, 300),
    };
  });
  console.log(JSON.stringify(debug, null, 2));
  await browser.close();
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
