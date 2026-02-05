/**
 * miceReportService.js
 * MICE 결과보고 패키지 생성 서비스
 *
 * - 체크리스트 검사
 * - PDF 생성 (결과보고서, 사진대장 등)
 * - ZIP 패키징
 */

const db = require('../../database/db');
const miceService = require('./miceService');
const eventService = require('./eventService');
const rulesLoader = require('./rulesLoader');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// ═══════════════════════════════════════════════════════════════════════════
// 제출 체크리스트
// ═══════════════════════════════════════════════════════════════════════════

const CHECKLIST_ITEMS = [
  {
    id: 'participants_pre',
    label: '사전 참가자 등록부',
    description: '별지2-1호 - 사전등록 명단 (입금일 필수)',
    required: true,
    category: 'participants'
  },
  {
    id: 'participants_onsite',
    label: '현장 참가자 등록부',
    description: '별지2-1호 - 현장등록 명단',
    required: false,
    category: 'participants'
  },
  {
    id: 'stays',
    label: '숙박확인서',
    description: '별지2-2호 - 숙박 내역 및 영수증',
    required: true,
    category: 'stays'
  },
  {
    id: 'expenses',
    label: '지출증빙',
    description: '세금계산서, 카드전표, 입금증 등',
    required: true,
    category: 'expenses'
  },
  {
    id: 'photos_logo',
    label: '사진 - 여수시 로고 노출',
    description: '별지2-3호 - 로고 노출 사진 2장 이상',
    required: true,
    category: 'photos',
    tag: 'LOGO_EXPOSURE',
    minCount: 2
  },
  {
    id: 'photos_meeting',
    label: '사진 - 회의/행사 장면',
    description: '별지2-3호 - 회의/행사 사진 2장 이상',
    required: true,
    category: 'photos',
    tag: 'MEETING',
    minCount: 2
  },
  {
    id: 'photos_support',
    label: '사진 - 지원물품 활용',
    description: '별지2-3호 - 지원물품 활용 사진',
    required: false,
    category: 'photos',
    tag: 'SUPPORT_ITEM',
    minCount: 1
  },
  {
    id: 'survey',
    label: '설문조사',
    description: '별지3호 - 주최자 설문 응답',
    required: false,
    category: 'survey'
  },
  {
    id: 'consent',
    label: '개인정보 동의서',
    description: '별지2-4호 - 참가자 동의서 (P1)',
    required: false,
    category: 'consent'
  }
];

async function getChecklist(eventId) {
  const results = [];

  // 참가자 통계
  const participantStats = await miceService.getParticipantStats(eventId);

  // 숙박 통계
  const stayStats = await miceService.getStayStats(eventId);

  // 지출 통계
  const expenseStats = await miceService.getExpenseStats(eventId);

  // 사진 통계
  const photoStats = await miceService.getPhotoStats(eventId);
  const photosByTag = {};
  photoStats.forEach(p => { photosByTag[p.tag] = parseInt(p.count); });

  // 설문 응답 수
  const surveyResponses = await miceService.listSurveyResponses(eventId);

  for (const item of CHECKLIST_ITEMS) {
    let done = false;
    let count = 0;
    let details = '';

    switch (item.category) {
      case 'participants':
        if (item.id === 'participants_pre') {
          count = parseInt(participantStats.pre_count) || 0;
          done = count > 0;
          details = `${count}명`;
        } else {
          count = parseInt(participantStats.onsite_count) || 0;
          done = count > 0;
          details = `${count}명`;
        }
        break;

      case 'stays':
        count = parseInt(stayStats.hotel_count) || 0;
        done = count > 0;
        details = `${count}개 업소, ${stayStats.total_nights || 0}박`;
        break;

      case 'expenses':
        count = parseInt(expenseStats.total?.total_count) || 0;
        done = count > 0;
        const total = parseFloat(expenseStats.total?.grand_total) || 0;
        details = `${count}건, ${total.toLocaleString()}원`;
        break;

      case 'photos':
        count = photosByTag[item.tag] || 0;
        const minCount = item.minCount || 1;
        done = count >= minCount;
        details = `${count}/${minCount}장`;
        break;

      case 'survey':
        count = surveyResponses.length;
        done = count > 0;
        details = `${count}건`;
        break;

      case 'consent':
        // P1에서 구현
        done = false;
        details = 'P1 예정';
        break;
    }

    results.push({
      ...item,
      done,
      count,
      details
    });
  }

  // 점수 계산
  const requiredItems = results.filter(r => r.required);
  const doneRequired = requiredItems.filter(r => r.done);

  return {
    items: results,
    score: {
      done: doneRequired.length,
      total: requiredItems.length,
      percentage: requiredItems.length > 0
        ? Math.round((doneRequired.length / requiredItems.length) * 100)
        : 0
    },
    missingRequired: requiredItems.filter(r => !r.done).map(r => r.label)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 결과보고 패키지 생성
// ═══════════════════════════════════════════════════════════════════════════

async function generateReportPack(eventId, options = {}) {
  const { generatedBy } = options;

  // 1. 행사 정보 조회
  const event = await eventService.getEvent(eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  // 2. 패키지 레코드 생성
  const packResult = await db.query(`
    INSERT INTO ops_mice_report_packs (event_id, status, generated_by)
    VALUES ($1, 'GENERATING', $2)
    RETURNING *
  `, [eventId, generatedBy]);
  const pack = packResult.rows[0];

  try {
    // 3. 데이터 수집
    const participants = await miceService.listParticipants(eventId);
    const stays = await miceService.listStays(eventId);
    const expenses = await miceService.listExpenses(eventId);
    const photos = await miceService.listPhotos(eventId);
    const surveyResponses = await miceService.listSurveyResponses(eventId);
    const checklist = await getChecklist(eventId);

    const participantStats = await miceService.getParticipantStats(eventId);
    const stayStats = await miceService.getStayStats(eventId);
    const expenseStats = await miceService.getExpenseStats(eventId);

    // 4. 출력 디렉토리 생성
    const outputDir = path.join(process.cwd(), 'output', 'mice-reports', pack.id);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const includedFiles = [];

    // 5. 결과보고서 PDF (HTML 생성 - Puppeteer 없이 HTML 파일로)
    const reportHtml = generateResultReportHtml(event, {
      participants, participantStats,
      stays, stayStats,
      expenses, expenseStats,
      checklist
    });
    const reportPath = path.join(outputDir, '01_result_report.html');
    fs.writeFileSync(reportPath, reportHtml, 'utf8');
    includedFiles.push({ name: '01_result_report.html', type: 'report' });

    // 6. 참가자 CSV
    if (participants.length > 0) {
      const preParts = participants.filter(p => p.reg_type === 'PRE');
      const onsiteParts = participants.filter(p => p.reg_type === 'ONSITE');

      if (preParts.length > 0) {
        const preCsv = generateParticipantsCsv(preParts, 'PRE');
        fs.writeFileSync(path.join(outputDir, '02_participants_pre.csv'), preCsv, 'utf8');
        includedFiles.push({ name: '02_participants_pre.csv', type: 'participants' });
      }

      if (onsiteParts.length > 0) {
        const onsiteCsv = generateParticipantsCsv(onsiteParts, 'ONSITE');
        fs.writeFileSync(path.join(outputDir, '03_participants_onsite.csv'), onsiteCsv, 'utf8');
        includedFiles.push({ name: '03_participants_onsite.csv', type: 'participants' });
      }
    }

    // 7. 숙박 CSV
    if (stays.length > 0) {
      const staysCsv = generateStaysCsv(stays);
      fs.writeFileSync(path.join(outputDir, '04_stays.csv'), staysCsv, 'utf8');
      includedFiles.push({ name: '04_stays.csv', type: 'stays' });
    }

    // 8. 지출증빙 CSV
    if (expenses.length > 0) {
      const expensesCsv = generateExpensesCsv(expenses);
      fs.writeFileSync(path.join(outputDir, '05_expenses_index.csv'), expensesCsv, 'utf8');
      includedFiles.push({ name: '05_expenses_index.csv', type: 'expenses' });
    }

    // 9. 사진대장 HTML
    if (photos.length > 0) {
      const photosHtml = generatePhotosHtml(event, photos);
      fs.writeFileSync(path.join(outputDir, '06_photos_album.html'), photosHtml, 'utf8');
      includedFiles.push({ name: '06_photos_album.html', type: 'photos' });
    }

    // 10. 설문 CSV
    if (surveyResponses.length > 0) {
      const surveyCsv = generateSurveyCsv(surveyResponses);
      fs.writeFileSync(path.join(outputDir, '07_survey_responses.csv'), surveyCsv, 'utf8');
      includedFiles.push({ name: '07_survey_responses.csv', type: 'survey' });
    }

    // 11. 체크리스트 JSON
    fs.writeFileSync(
      path.join(outputDir, '08_checklist.json'),
      JSON.stringify(checklist, null, 2),
      'utf8'
    );
    includedFiles.push({ name: '08_checklist.json', type: 'checklist' });

    // 11-1. 룰 스냅샷 메타데이터
    const rulesSnapshot = rulesLoader.getRulesSnapshot();
    fs.writeFileSync(
      path.join(outputDir, '09_rules_snapshot.json'),
      JSON.stringify({
        snapshot_at: new Date().toISOString(),
        rules: rulesSnapshot
      }, null, 2),
      'utf8'
    );
    includedFiles.push({ name: '09_rules_snapshot.json', type: 'meta' });

    // 12. ZIP 생성
    const eventName = event.name.replace(/[^가-힣a-zA-Z0-9]/g, '_').substring(0, 30);
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const zipFilename = `report_pack_${eventName}_${dateStr}.zip`;
    const zipPath = path.join(outputDir, zipFilename);

    await createZipArchive(outputDir, zipPath, includedFiles);

    const zipStats = fs.statSync(zipPath);

    // 13. 패키지 업데이트 (룰 스냅샷 포함)
    await db.query(`
      UPDATE ops_mice_report_packs
      SET
        status = 'READY',
        zip_filename = $1,
        zip_path = $2,
        zip_size_bytes = $3,
        checklist_snapshot = $4,
        included_files = $5,
        rules_snapshot = $6,
        generated_at = NOW(),
        expires_at = NOW() + INTERVAL '7 days'
      WHERE id = $7
    `, [
      zipFilename,
      zipPath,
      zipStats.size,
      JSON.stringify(checklist),
      JSON.stringify(includedFiles),
      JSON.stringify(rulesSnapshot),
      pack.id
    ]);

    return {
      packId: pack.id,
      zipFilename,
      zipPath,
      zipSize: zipStats.size,
      includedFiles,
      checklist,
      rulesSnapshot
    };

  } catch (error) {
    // 에러 시 상태 업데이트
    await db.query(`
      UPDATE ops_mice_report_packs
      SET status = 'ERROR', error_message = $1
      WHERE id = $2
    `, [error.message, pack.id]);

    throw error;
  }
}

async function getReportPack(packId) {
  const result = await db.query(
    'SELECT * FROM ops_mice_report_packs WHERE id = $1',
    [packId]
  );
  return result.rows[0];
}

async function listReportPacks(eventId) {
  const result = await db.query(`
    SELECT * FROM ops_mice_report_packs
    WHERE event_id = $1
    ORDER BY created_at DESC
  `, [eventId]);
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// HTML/CSV 생성 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

function generateResultReportHtml(event, data) {
  const { participants, participantStats, stays, stayStats, expenses, expenseStats, checklist } = data;

  const expensesByCategory = {};
  expenses.forEach(e => {
    if (!expensesByCategory[e.category]) {
      expensesByCategory[e.category] = { items: [], total: 0 };
    }
    expensesByCategory[e.category].items.push(e);
    expensesByCategory[e.category].total += parseFloat(e.amount) || 0;
  });

  const categoryLabels = {
    'RENTAL': '회의장/전시장 임차료',
    'LODGING': '숙박비',
    'FNB_HOTEL': '식음료비(호텔)',
    'FNB_OUTSIDE': '식음료비(호텔외)',
    'TOUR': '관광/투어비',
    'PRINT_ADS': '인쇄/광고비',
    'SOUVENIR': '기념품비',
    'LOCAL_VENDOR': '지역업체 이용비',
    'ETC': '기타'
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>결과보고서 - ${event.name}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: 'Malgun Gothic', sans-serif; font-size: 11pt; line-height: 1.6; }
    h1 { text-align: center; font-size: 18pt; margin-bottom: 30px; }
    h2 { font-size: 14pt; border-bottom: 2px solid #333; padding-bottom: 5px; margin-top: 25px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .header-table th { width: 25%; }
    .amount { text-align: right; }
    .total-row { background: #e8e8e8; font-weight: bold; }
    .checklist-done { color: green; }
    .checklist-missing { color: red; }
    .footer { margin-top: 50px; text-align: center; font-size: 10pt; color: #666; }
  </style>
</head>
<body>
  <h1>MICE 인센티브 지원사업 결과보고서</h1>
  <p style="text-align: center; font-size: 10pt; color: #666;">별지 제2호 서식</p>

  <h2>1. 행사 개요</h2>
  <table class="header-table">
    <tr><th>행사명</th><td colspan="3">${event.name}</td></tr>
    <tr>
      <th>행사기간</th><td>${formatDate(event.period_start)} ~ ${formatDate(event.period_end)}</td>
      <th>행사장소</th><td>${event.location || '-'}</td>
    </tr>
    <tr>
      <th>참가인원(내국인)</th><td>${(parseInt(participantStats.total) || 0) - (parseInt(participantStats.foreign_count) || 0)}명</td>
      <th>참가인원(외국인)</th><td>${participantStats.foreign_count || 0}명</td>
    </tr>
    <tr>
      <th>사전등록</th><td>${participantStats.pre_count || 0}명</td>
      <th>현장등록</th><td>${participantStats.onsite_count || 0}명</td>
    </tr>
  </table>

  <h2>2. 숙박 현황</h2>
  <table>
    <thead>
      <tr><th>숙박업소</th><th>체크인</th><th>숙박일수</th><th>객실수</th><th>투숙객(총)</th><th>투숙객(외국인)</th></tr>
    </thead>
    <tbody>
      ${stays.length > 0 ? stays.map(s => `
        <tr>
          <td>${s.hotel_name}</td>
          <td>${formatDate(s.checkin_date)}</td>
          <td>${s.nights}박</td>
          <td>${s.rooms_count || '-'}</td>
          <td>${s.guest_count_total}명</td>
          <td>${s.guest_count_foreign || 0}명</td>
        </tr>
      `).join('') : '<tr><td colspan="6" style="text-align:center;">숙박 내역 없음</td></tr>'}
      <tr class="total-row">
        <td>합계</td>
        <td>-</td>
        <td>${stayStats.total_nights || 0}박</td>
        <td>${stayStats.total_rooms || '-'}</td>
        <td>${stayStats.total_guests || 0}명</td>
        <td>${stayStats.foreign_guests || 0}명</td>
      </tr>
    </tbody>
  </table>

  <h2>3. 지출 내역</h2>
  <table>
    <thead>
      <tr><th>항목</th><th>거래처</th><th>지역업체</th><th class="amount">금액</th><th>비고</th></tr>
    </thead>
    <tbody>
      ${Object.entries(expensesByCategory).map(([cat, data]) => `
        ${data.items.map((e, i) => `
          <tr>
            ${i === 0 ? `<td rowspan="${data.items.length}">${categoryLabels[cat] || cat}</td>` : ''}
            <td>${e.vendor_name}</td>
            <td>${e.vendor_is_local ? 'O' : ''}</td>
            <td class="amount">${parseFloat(e.amount).toLocaleString()}원</td>
            <td>${e.description || ''}</td>
          </tr>
        `).join('')}
      `).join('')}
      <tr class="total-row">
        <td colspan="3">총 합계</td>
        <td class="amount">${parseFloat(expenseStats.total?.grand_total || 0).toLocaleString()}원</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <h2>4. 제출서류 체크리스트</h2>
  <table>
    <thead>
      <tr><th>항목</th><th>필수</th><th>상태</th><th>내용</th></tr>
    </thead>
    <tbody>
      ${checklist.items.map(item => `
        <tr>
          <td>${item.label}</td>
          <td>${item.required ? '필수' : '선택'}</td>
          <td class="${item.done ? 'checklist-done' : 'checklist-missing'}">${item.done ? '완료' : '미완료'}</td>
          <td>${item.details}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <p><strong>필수항목 충족도: ${checklist.score.done}/${checklist.score.total} (${checklist.score.percentage}%)</strong></p>

  <h2>5. 첨부서류</h2>
  <ul>
    <li>참가자 등록부 (별지2-1호)</li>
    <li>숙박확인서 (별지2-2호)</li>
    <li>사진대장 (별지2-3호)</li>
    <li>지출증빙 (세금계산서, 카드전표, 입금증 등)</li>
    <li>사업자등록증 (거래처)</li>
    <li>통장사본</li>
  </ul>

  <div class="footer">
    <p>생성일시: ${new Date().toLocaleString('ko-KR')}</p>
    <p>여수시 MICE 인센티브 지원사업</p>
  </div>
</body>
</html>`;
}

function generateParticipantsCsv(participants, type) {
  const headers = ['번호', '소속/단체', '성명', '이메일', '연락처', '국적', '외국인여부'];
  if (type === 'PRE') {
    headers.push('등록비', '입금일');
  }

  const rows = participants.map((p, i) => {
    const row = [
      i + 1,
      p.org_name || '',
      p.person_name,
      p.email || '',
      p.phone || '',
      p.nationality || 'KR',
      p.is_foreign ? 'Y' : 'N'
    ];
    if (type === 'PRE') {
      row.push(p.fee_paid_amount || '', p.deposit_date || '');
    }
    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function generateStaysCsv(stays) {
  const headers = ['번호', '숙박업소', '체크인', '체크아웃', '숙박일수', '객실수', '투숙객(총)', '투숙객(외국인)', '비고'];
  const rows = stays.map((s, i) => [
    i + 1,
    s.hotel_name,
    s.checkin_date,
    s.checkout_date || '',
    s.nights,
    s.rooms_count || '',
    s.guest_count_total,
    s.guest_count_foreign || 0,
    s.notes || ''
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

function generateExpensesCsv(expenses) {
  const headers = ['번호', '항목', '거래처', '사업자번호', '지역업체', '금액', '결제수단', '지출일', '내역', '증빙유효'];
  const rows = expenses.map((e, i) => [
    i + 1,
    e.category,
    e.vendor_name,
    e.vendor_biz_reg_no || '',
    e.vendor_is_local ? 'Y' : 'N',
    e.amount,
    e.pay_method,
    e.paid_at || '',
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.is_valid ? 'Y' : 'N'
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

function generatePhotosHtml(event, photos) {
  const tagLabels = {
    'LOGO_EXPOSURE': '여수시 로고 노출',
    'MEETING': '회의/행사 장면',
    'SUPPORT_ITEM': '지원물품 활용',
    'VENUE': '장소 전경',
    'PARTICIPANT': '참가자',
    'ETC': '기타'
  };

  const photosByTag = {};
  photos.forEach(p => {
    if (!photosByTag[p.tag]) photosByTag[p.tag] = [];
    photosByTag[p.tag].push(p);
  });

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>사진대장 - ${event.name}</title>
  <style>
    @page { size: A4; margin: 1.5cm; }
    body { font-family: 'Malgun Gothic', sans-serif; }
    h1 { text-align: center; font-size: 18pt; }
    h2 { font-size: 14pt; border-bottom: 2px solid #333; margin-top: 30px; }
    .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .photo-item { border: 1px solid #ddd; padding: 10px; }
    .photo-item img { width: 100%; height: auto; max-height: 200px; object-fit: contain; }
    .photo-desc { font-size: 10pt; margin-top: 8px; color: #333; }
    .photo-meta { font-size: 9pt; color: #666; }
  </style>
</head>
<body>
  <h1>사진대장</h1>
  <p style="text-align: center; font-size: 10pt; color: #666;">별지 제2-3호 서식 | ${event.name}</p>

  ${Object.entries(photosByTag).map(([tag, tagPhotos]) => `
    <h2>${tagLabels[tag] || tag} (${tagPhotos.length}장)</h2>
    <div class="photo-grid">
      ${tagPhotos.map(p => `
        <div class="photo-item">
          <img src="${p.storage_path}" alt="${p.description || ''}" />
          <div class="photo-desc">${p.description || '(설명 없음)'}</div>
          <div class="photo-meta">${p.location || ''} ${p.taken_at ? formatDate(p.taken_at) : ''}</div>
        </div>
      `).join('')}
    </div>
  `).join('')}

  <div style="margin-top: 50px; text-align: center; font-size: 10pt; color: #666;">
    <p>생성일시: ${new Date().toLocaleString('ko-KR')}</p>
  </div>
</body>
</html>`;
}

function generateSurveyCsv(responses) {
  if (responses.length === 0) return '';

  // 모든 답변 키 수집
  const allKeys = new Set();
  responses.forEach(r => {
    const answers = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers;
    Object.keys(answers).forEach(k => allKeys.add(k));
  });

  const keys = Array.from(allKeys).sort();
  const headers = ['번호', '응답자유형', '응답자명', '소속', ...keys, '제출일시'];

  const rows = responses.map((r, i) => {
    const answers = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers;
    return [
      i + 1,
      r.respondent_type,
      r.respondent_name || '',
      r.respondent_org || '',
      ...keys.map(k => `"${String(answers[k] || '').replace(/"/g, '""')}"`),
      r.submitted_at
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR');
}

async function createZipArchive(sourceDir, zipPath, files) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(archive.pointer()));
    archive.on('error', reject);

    archive.pipe(output);

    // 파일 추가
    files.forEach(f => {
      const filePath = path.join(sourceDir, f.name);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: f.name });
      }
    });

    archive.finalize();
  });
}

module.exports = {
  CHECKLIST_ITEMS,
  getChecklist,
  generateReportPack,
  getReportPack,
  listReportPacks
};
