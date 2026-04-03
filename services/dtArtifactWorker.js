/**
 * ═══════════════════════════════════════════════════════════
 * dtArtifactWorker.js — DEC-2026-0331-001
 * DB 기반 Artifact 큐 워커
 *
 * - dt_artifact_jobs WHERE status='pending' 폴링 (10초 간격)
 * - 최대 5개 동시 처리 (FOR UPDATE SKIP LOCKED)
 * - image: DALL-E 3 생성
 * - 실패 시 최대 3회 재시도 후 failed 확정
 * ═══════════════════════════════════════════════════════════
 */

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const sharp  = require('sharp');

const { makeLogger } = require('../utils/logger');
const log = makeLogger('dtArtifactWorker');

let db = null;
try {
  db = require('../database/db');
} catch (e) {
  log.warn('DB 모듈 로드 실패 — 워커 비활성화', { error: e.message });
}

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── 소원그림 저장 디렉토리 ─────────────────────────────────────
const DT_IMAGE_DIR = path.join(__dirname, '..', 'public', 'images', 'dt-wishes');
if (!fs.existsSync(DT_IMAGE_DIR)) {
  fs.mkdirSync(DT_IMAGE_DIR, { recursive: true });
}

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE       = 5;
const MAX_ATTEMPTS     = 3;

// ── 결제 확인 게이트 ───────────────────────────────────────────
// star_id → dt_dream_logs(upgrade_checkout_started) → nicepay_payments(PAID)
async function checkPaymentStatus(starId) {
  try {
    const result = await db.query(`
      SELECT np.status
      FROM dt_dream_logs dl
      JOIN nicepay_payments np ON np.order_id = (dl.payload->>'order_id')
      WHERE dl.star_id = $1
        AND dl.payload->>'event' = 'upgrade_checkout_started'
        AND np.status = 'PAID'
      LIMIT 1
    `, [starId]);
    return result.rows.length > 0;
  } catch (err) {
    log.warn('결제 상태 조회 실패 — 미결제로 처리', { star_id: starId, error: err.message });
    return false;
  }
}

let _timer   = null;
let _running = false;

// ── 배치 처리 ──────────────────────────────────────────────────
async function processJobs() {
  if (_running) return;
  _running = true;

  try {
    // pending → processing 원자적 전환 (최대 5개)
    const pick = await db.query(`
      UPDATE dt_artifact_jobs
      SET status = 'processing', attempts = attempts + 1, updated_at = NOW()
      WHERE id IN (
        SELECT id FROM dt_artifact_jobs
        WHERE status = 'pending' AND attempts < $1
        ORDER BY created_at ASC
        LIMIT $2
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, star_id, type, prompt, attempts
    `, [MAX_ATTEMPTS, BATCH_SIZE]);

    if (pick.rows.length === 0) {
      _running = false;
      return;
    }

    log.info(`${pick.rows.length}개 작업 처리 시작`);

    // 병렬 처리
    await Promise.allSettled(pick.rows.map(job => processOne(job)));

  } catch (err) {
    log.error('워커 배치 오류', { error: err.message });
  } finally {
    _running = false;
  }
}

// ── 단일 작업 처리 ─────────────────────────────────────────────
async function processOne(job) {
  // ── 결제 게이트: PAID 아니면 pending으로 복귀 ─────────────────
  const isPaid = await checkPaymentStatus(job.star_id);
  if (!isPaid) {
    await db.query(
      `UPDATE dt_artifact_jobs
       SET status='pending', attempts=GREATEST(0, attempts-1), updated_at=NOW()
       WHERE id=$1`,
      [job.id]
    );
    log.info('PAYMENT_REQUIRED — 결제 완료 후 처리 예정', {
      job_id: job.id, star_id: job.star_id,
    });
    return;
  }

  try {
    let resultUrl = null;

    if (job.type === 'image') {
      resultUrl = await generateImage(job);
    } else {
      throw new Error(`지원하지 않는 type: ${job.type}`);
    }

    await db.query(
      `UPDATE dt_artifact_jobs SET status='done', result_url=$1, updated_at=NOW() WHERE id=$2`,
      [resultUrl, job.id]
    );
    log.info('✅ 완료', { job_id: job.id, url: resultUrl });

  } catch (err) {
    const isFinal = job.attempts >= MAX_ATTEMPTS;
    await db.query(
      `UPDATE dt_artifact_jobs SET status=$1, error_msg=$2, updated_at=NOW() WHERE id=$3`,
      [isFinal ? 'failed' : 'pending', err.message, job.id]
    );
    log.warn(`${isFinal ? '❌ 최종실패' : '⚠️ 재시도 예정'}`, {
      job_id: job.id, attempts: job.attempts, error: err.message,
    });
  }
}

// ── 이미지 URL → Buffer 다운로드 ─────────────────────────────
function downloadToBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadToBuffer(res.headers.location).then(resolve, reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── 소원 텍스트 SVG 합성 (하단 스트립) ───────────────────────
async function compositeWishText(imageBuffer, wishText) {
  const W = 1024, H = 1792;

  // 최대 2줄, 줄당 24자 기준으로 분리
  const MAX_LINE = 24;
  const lines = [];
  let remaining = wishText.trim();
  while (remaining.length > 0 && lines.length < 2) {
    if (remaining.length <= MAX_LINE) {
      lines.push(remaining);
      remaining = '';
    } else {
      let breakAt = remaining.lastIndexOf(' ', MAX_LINE);
      if (breakAt < 8) breakAt = MAX_LINE;
      lines.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt).trim();
    }
  }
  if (remaining.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, MAX_LINE - 1) + '…';
  }

  const FONT_SIZE = 36;
  const LINE_H    = 52;
  const STRIP_H   = lines.length * LINE_H + 56;
  const STRIP_Y   = H - STRIP_H;

  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const textElements = lines.map((line, i) => {
    const y = STRIP_Y + 46 + i * LINE_H;
    return `<text x="${W / 2}" y="${y}"
      font-family="'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
      font-size="${FONT_SIZE}" font-weight="300" letter-spacing="0.5"
      fill="rgba(255,255,255,0.93)" text-anchor="middle"
      filter="url(#shadow)">${esc(line)}</text>`;
  }).join('\n    ');

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-15%" y="-50%" width="130%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="rgba(0,0,0,0.85)"/>
      </filter>
    </defs>
    <rect x="0" y="${STRIP_Y}" width="${W}" height="${STRIP_H}" fill="rgba(0,0,0,0.48)"/>
    ${textElements}
  </svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

// ── 이미지 생성 (DALL-E 3 → 로컬 저장 + 텍스트 합성) ─────────
async function generateImage(job) {
  // 1. star_name / wish_text 조회 (텍스트 합성에도 필요)
  let star_name = '소원별', wish_text = '소원이 이루어지기를';
  const starResult = await db.query(
    `SELECT s.star_name, w.wish_text
     FROM dt_stars s JOIN dt_wishes w ON s.wish_id = w.id
     WHERE s.id = $1`,
    [job.star_id]
  );
  if (starResult.rows.length > 0) {
    star_name = starResult.rows[0].star_name;
    wish_text = starResult.rows[0].wish_text;
  }

  // 2. 프롬프트 빌드 (job.prompt 직접 지정 시 우선)
  let prompt = job.prompt;
  if (!prompt) {
    prompt =
      `2D flat illustration, Korean webtoon style, clean line art, minimal shading, ` +
      `no realistic lighting, no 3D rendering, soft pastel colors. ` +
      `Dreamlike scene for the wish: "${wish_text}". ` +
      `A gentle glowing star named "${star_name}" as the central motif. ` +
      `9:16 vertical portrait format. No text in image. No photorealism.`;
  }

  // 3. DALL-E 3 생성
  log.info('[PROMPT] DALL-E 프롬프트', { prompt });
  console.log('[dtArtifactWorker][PROMPT]', prompt);
  const response = await openai.images.generate({
    model:   'dall-e-3',
    prompt,
    n:       1,
    size:    '1024x1792',
    quality: 'standard',
    style:   'natural',
  });
  const dalleUrl = response.data[0].url;

  // 4. 이미지 다운로드
  const imageBuffer = await downloadToBuffer(dalleUrl);

  // 5. 원본 저장 (만료 전 영구 보관)
  const origFilename = `dt_${job.star_id}_orig.png`;
  await fs.promises.writeFile(path.join(DT_IMAGE_DIR, origFilename), imageBuffer);

  // 6. 소원 텍스트 합성
  log.info('[COMPOSITE] 텍스트 합성 시작', { wish_text, star_id: job.star_id });
  console.log('[dtArtifactWorker][COMPOSITE] wish_text=', wish_text);
  const compositedBuffer = await compositeWishText(imageBuffer, wish_text);

  // 7. 합성본 저장 (= 공유/다운로드 대상)
  const mainFilename = `dt_${job.star_id}.png`;
  await fs.promises.writeFile(path.join(DT_IMAGE_DIR, mainFilename), compositedBuffer);

  log.info('소원그림 저장 완료', { orig: origFilename, main: mainFilename });

  // 8. 영구 로컬 URL 반환 (합성본)
  return `/images/dt-wishes/${mainFilename}`;
}

// ── 공개 API ──────────────────────────────────────────────────
function start() {
  if (!db) {
    log.warn('DB 없음 — 워커 시작 스킵');
    return;
  }
  if (_timer) return;

  log.info(`시작 — 폴링 간격 ${POLL_INTERVAL_MS / 1000}초, batch=${BATCH_SIZE}`);
  _timer = setInterval(processJobs, POLL_INTERVAL_MS);
  setTimeout(processJobs, 2_000);  // 서버 시작 후 2초에 즉시 1회
}

function stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    log.info('중지됨');
  }
}

module.exports = { start, stop };
