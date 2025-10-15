// ═══════════════════════════════════════════════════════════
// PDF Generator Service
// 30초 안에 10페이지 PDF 생성
// ═══════════════════════════════════════════════════════════

const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// ═══════════════════════════════════════════════════════════
// Browser Management (재사용을 위한 싱글톤)
// ═══════════════════════════════════════════════════════════

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    console.log('🚀 Puppeteer 브라우저 시작...');
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    console.log('✅ 브라우저 준비 완료');
  }
  return browserInstance;
}

async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log('🛑 브라우저 종료됨');
  }
}

// ═══════════════════════════════════════════════════════════
// Template Loading & Compilation
// ═══════════════════════════════════════════════════════════

const templateCache = new Map();

async function loadTemplate(templateName) {
  // 캐시 확인
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  const templatePath = path.join(__dirname, '../../templates', `${templateName}.html`);
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // Handlebars 컴파일
  const compiled = handlebars.compile(templateContent);

  // 캐시 저장
  templateCache.set(templateName, compiled);

  return compiled;
}

// ═══════════════════════════════════════════════════════════
// Handlebars Helpers
// ═══════════════════════════════════════════════════════════

handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

handlebars.registerHelper('multiply', function(a, b) {
  return a * b;
});

handlebars.registerHelper('each', function(context, options) {
  let ret = '';
  if (context && context.length > 0) {
    for (let i = 0; i < context.length; i++) {
      ret += options.fn(context[i]);
    }
  }
  return ret;
});

// ═══════════════════════════════════════════════════════════
// PDF Generation
// ═══════════════════════════════════════════════════════════

async function generatePDF(templateName, data, outputPath) {
  const startTime = Date.now();

  try {
    console.log(`📄 PDF 생성 시작: ${templateName}`);

    // 1. 템플릿 로드 & 컴파일 (캐시됨)
    const template = await loadTemplate(templateName);
    const html = template(data);

    // 2. CSS 파일 경로
    const cssPath = path.join(__dirname, '../../styles', `${templateName}.css`);
    const css = await fs.readFile(cssPath, 'utf-8');

    // 3. HTML에 CSS 인라인으로 삽입
    const htmlWithCSS = html.replace(
      `<link rel="stylesheet" href="../styles/${templateName}.css">`,
      `<style>${css}</style>`
    );

    // 4. 브라우저 가져오기 (재사용)
    const browser = await getBrowser();
    const page = await browser.newPage();

    // 5. 페이지 설정
    await page.setContent(htmlWithCSS, {
      waitUntil: 'networkidle0'
    });

    // 6. PDF 생성
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    // 7. 파일 저장
    if (outputPath) {
      await fs.writeFile(outputPath, pdfBuffer);
    }

    // 8. 페이지 닫기 (브라우저는 유지)
    await page.close();

    const elapsed = Date.now() - startTime;
    console.log(`✅ PDF 생성 완료: ${elapsed}ms`);

    return {
      success: true,
      buffer: pdfBuffer,
      path: outputPath,
      time: elapsed
    };

  } catch (error) {
    console.error('❌ PDF 생성 실패:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// Fast Generation (병렬 처리)
// ═══════════════════════════════════════════════════════════

async function generateMultiplePDFs(requests) {
  const startTime = Date.now();

  try {
    console.log(`📦 ${requests.length}개 PDF 병렬 생성 시작`);

    // 브라우저 미리 시작
    await getBrowser();

    // 병렬 생성
    const results = await Promise.all(
      requests.map(req =>
        generatePDF(req.template, req.data, req.outputPath)
      )
    );

    const elapsed = Date.now() - startTime;
    console.log(`✅ ${requests.length}개 PDF 생성 완료: ${elapsed}ms`);

    return {
      success: true,
      results: results,
      totalTime: elapsed,
      averageTime: elapsed / requests.length
    };

  } catch (error) {
    console.error('❌ 병렬 PDF 생성 실패:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════
// Template Data Processor
// ═══════════════════════════════════════════════════════════

function processTemplateData(userData, generatedContent) {
  // 기본 데이터 + 생성된 콘텐츠 병합
  return {
    // 사용자 기본 정보
    userName: userData.name || '소원이',
    userWish: userData.wish || '목표 달성',
    userPhone: userData.phone || '010-0000-0000',
    wishCategory: userData.category || '자기계발',
    miracleScore: userData.miracleScore || 85,

    // 주차별 데이터
    weeks: [
      {
        weekNumber: 1,
        weekTitle: generatedContent.week1?.title || '시작',
        weekEmoji: '🌱',
        weekIntro: generatedContent.week1?.intro || '첫 번째 주는 기반을 다지는 시간입니다.',
        goal1: generatedContent.week1?.goals?.[0] || '기본 습관 만들기',
        goal2: generatedContent.week1?.goals?.[1] || '목표 구체화하기',
        goal3: generatedContent.week1?.goals?.[2] || '실행 계획 세우기',
        customAdvice: generatedContent.week1?.advice || '작게 시작하세요.',
        mon: generatedContent.week1?.daily?.mon || '목표 설정',
        tue: generatedContent.week1?.daily?.tue || '계획 수립',
        wed: generatedContent.week1?.daily?.wed || '첫 실행',
        thu: generatedContent.week1?.daily?.thu || '점검 및 조정',
        fri: generatedContent.week1?.daily?.fri || '주간 리뷰 준비',
        weekend: generatedContent.week1?.daily?.weekend || '휴식과 정리'
      },
      {
        weekNumber: 2,
        weekTitle: generatedContent.week2?.title || '가속',
        weekEmoji: '🚀',
        weekIntro: generatedContent.week2?.intro || '이제 속도를 높일 시간입니다.',
        goal1: generatedContent.week2?.goals?.[0] || '실행 강도 높이기',
        goal2: generatedContent.week2?.goals?.[1] || '새로운 도전 추가',
        goal3: generatedContent.week2?.goals?.[2] || '진행 상황 점검',
        customAdvice: generatedContent.week2?.advice || '꾸준함이 힘입니다.',
        mon: generatedContent.week2?.daily?.mon || '강화 시작',
        tue: generatedContent.week2?.daily?.tue || '도전 과제',
        wed: generatedContent.week2?.daily?.wed || '중간 점검',
        thu: generatedContent.week2?.daily?.thu || '개선 적용',
        fri: generatedContent.week2?.daily?.fri || '성과 확인',
        weekend: generatedContent.week2?.daily?.weekend || '재충전'
      },
      {
        weekNumber: 3,
        weekTitle: generatedContent.week3?.title || '심화',
        weekEmoji: '💪',
        weekIntro: generatedContent.week3?.intro || '중간 지점, 더 나아갈 때입니다.',
        goal1: generatedContent.week3?.goals?.[0] || '심화 학습',
        goal2: generatedContent.week3?.goals?.[1] || '응용 실습',
        goal3: generatedContent.week3?.goals?.[2] || '전문성 향상',
        customAdvice: generatedContent.week3?.advice || '지금이 고비입니다. 포기하지 마세요.',
        mon: generatedContent.week3?.daily?.mon || '심화 과정',
        tue: generatedContent.week3?.daily?.tue || '응용 연습',
        wed: generatedContent.week3?.daily?.wed || '실력 점검',
        thu: generatedContent.week3?.daily?.thu || '피드백 반영',
        fri: generatedContent.week3?.daily?.fri || '마무리',
        weekend: generatedContent.week3?.daily?.weekend || '종합 리뷰'
      },
      {
        weekNumber: 4,
        weekTitle: generatedContent.week4?.title || '완성',
        weekEmoji: '🏆',
        weekIntro: generatedContent.week4?.intro || '마지막 주, 목표를 완성하세요!',
        goal1: generatedContent.week4?.goals?.[0] || '최종 목표 달성',
        goal2: generatedContent.week4?.goals?.[1] || '결과 정리',
        goal3: generatedContent.week4?.goals?.[2] || '다음 계획 수립',
        customAdvice: generatedContent.week4?.advice || '거의 다 왔습니다! 마지막까지 최선을!',
        mon: generatedContent.week4?.daily?.mon || '최종 점검',
        tue: generatedContent.week4?.daily?.tue || '완성도 높이기',
        wed: generatedContent.week4?.daily?.wed || '마무리 작업',
        thu: generatedContent.week4?.daily?.thu || '최종 확인',
        fri: generatedContent.week4?.daily?.fri || '성과 정리',
        weekend: generatedContent.week4?.daily?.weekend || '축하 및 다음 계획'
      }
    ],

    // 주차별 목표 (flat structure for non-loop templates)
    week1Goal1: generatedContent.week1?.goals?.[0] || '기본 습관 만들기',
    week1Goal2: generatedContent.week1?.goals?.[1] || '목표 구체화하기',
    week1Goal3: generatedContent.week1?.goals?.[2] || '실행 계획 세우기',
    week1CustomAdvice: generatedContent.week1?.advice || '작게 시작하세요.',
    week1Mon: generatedContent.week1?.daily?.mon || '목표 설정',
    week1Tue: generatedContent.week1?.daily?.tue || '계획 수립',
    week1Wed: generatedContent.week1?.daily?.wed || '첫 실행',
    week1Thu: generatedContent.week1?.daily?.thu || '점검 및 조정',
    week1Fri: generatedContent.week1?.daily?.fri || '주간 리뷰 준비',
    week1Weekend: generatedContent.week1?.daily?.weekend || '휴식과 정리',

    week2Goal1: generatedContent.week2?.goals?.[0] || '실행 강도 높이기',
    week2Goal2: generatedContent.week2?.goals?.[1] || '새로운 도전 추가',
    week2Goal3: generatedContent.week2?.goals?.[2] || '진행 상황 점검',
    week2CustomAdvice: generatedContent.week2?.advice || '꾸준함이 힘입니다.',
    week2Mon: generatedContent.week2?.daily?.mon || '강화 시작',
    week2Tue: generatedContent.week2?.daily?.tue || '도전 과제',
    week2Wed: generatedContent.week2?.daily?.wed || '중간 점검',
    week2Thu: generatedContent.week2?.daily?.thu || '개선 적용',
    week2Fri: generatedContent.week2?.daily?.fri || '성과 확인',
    week2Weekend: generatedContent.week2?.daily?.weekend || '재충전',

    week3Goal1: generatedContent.week3?.goals?.[0] || '심화 학습',
    week3Goal2: generatedContent.week3?.goals?.[1] || '응용 실습',
    week3Goal3: generatedContent.week3?.goals?.[2] || '전문성 향상',
    week3CustomAdvice: generatedContent.week3?.advice || '지금이 고비입니다. 포기하지 마세요.',
    week3Mon: generatedContent.week3?.daily?.mon || '심화 과정',
    week3Tue: generatedContent.week3?.daily?.tue || '응용 연습',
    week3Wed: generatedContent.week3?.daily?.wed || '실력 점검',
    week3Thu: generatedContent.week3?.daily?.thu || '피드백 반영',
    week3Fri: generatedContent.week3?.daily?.fri || '마무리',
    week3Weekend: generatedContent.week3?.daily?.weekend || '종합 리뷰',

    week4Goal1: generatedContent.week4?.goals?.[0] || '최종 목표 달성',
    week4Goal2: generatedContent.week4?.goals?.[1] || '결과 정리',
    week4Goal3: generatedContent.week4?.goals?.[2] || '다음 계획 수립',
    week4CustomAdvice: generatedContent.week4?.advice || '거의 다 왔습니다! 마지막까지 최선을!',
    week4Mon: generatedContent.week4?.daily?.mon || '최종 점검',
    week4Tue: generatedContent.week4?.daily?.tue || '완성도 높이기',
    week4Wed: generatedContent.week4?.daily?.wed || '마무리 작업',
    week4Thu: generatedContent.week4?.daily?.thu || '최종 확인',
    week4Fri: generatedContent.week4?.daily?.fri || '성과 정리',
    week4Weekend: generatedContent.week4?.daily?.weekend || '축하 및 다음 계획',

    // 루틴
    morningRoutine: generatedContent.morningRoutine || '아침에 일어나서 목표를 확인하고 오늘 할 일을 정리하세요.',
    eveningReview: generatedContent.eveningReview || '저녁에 오늘 한 일을 돌아보고 내일을 준비하세요.',

    // 성공 스토리
    story1Title: generatedContent.stories?.[0]?.title || '김지수님의 성공',
    story1Content: generatedContent.stories?.[0]?.content || '30일 만에 목표를 달성했습니다!',
    story2Title: generatedContent.stories?.[1]?.title || '박민준님의 성공',
    story2Content: generatedContent.stories?.[1]?.content || '꾸준함으로 이뤄냈습니다.',
    story3Title: generatedContent.stories?.[2]?.title || '이서연님의 성공',
    story3Content: generatedContent.stories?.[2]?.content || '작은 실천이 큰 변화를 만들었습니다.',

    // 지원
    communityLink: 'https://open.kakao.com/aurora5',
  };
}

// ═══════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════

module.exports = {
  generatePDF,
  generateMultiplePDFs,
  processTemplateData,
  closeBrowser,
  getBrowser
};
