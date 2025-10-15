// ═══════════════════════════════════════════════════════════
// Roadmap Routes
// 30초 PDF 로드맵 생성 API
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Services
const pdfGenerator = require('../../services/roadmap/pdfGenerator');
const templateSelector = require('../../services/roadmap/templateSelector');
const contentGenerator = require('../../services/roadmap/contentGenerator');
const kakaoAPI = require('../../services/roadmap/kakaoAPI');

// ═══════════════════════════════════════════════════════════
// Main Route: Generate Roadmap
// ═══════════════════════════════════════════════════════════

router.post('/generate', async (req, res) => {
  const totalStartTime = Date.now();
  const sessionId = uuidv4();

  try {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 30일 로드맵 생성 시작 [${sessionId}]`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ─────────────────────────────────────────────────────
    // Step 1: 입력 검증
    // ─────────────────────────────────────────────────────
    const { user } = req.body;

    if (!user || !user.name || !user.wish) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, wish'
      });
    }

    console.log(`👤 사용자: ${user.name}`);
    console.log(`🎯 소원: ${user.wish}`);
    console.log(`📋 카테고리: ${user.category || '없음'}`);

    // ─────────────────────────────────────────────────────
    // Step 2: 병렬 처리 - 템플릿 선택 & 콘텐츠 생성
    // ─────────────────────────────────────────────────────
    console.log('');
    console.log('⚡ [병렬 처리] 템플릿 선택 & 콘텐츠 생성');

    const step2Start = Date.now();

    const [templateResult, contentResult] = await Promise.all([
      // 템플릿 선택 (빠름)
      Promise.resolve(templateSelector.selectTemplate(user)),

      // AI 콘텐츠 생성 (5-10초)
      contentGenerator.generateRoadmapContent(user)
    ]);

    const step2Time = Date.now() - step2Start;
    console.log(`✅ Step 2 완료: ${step2Time}ms`);

    // ─────────────────────────────────────────────────────
    // Step 3: 기적지수 계산
    // ─────────────────────────────────────────────────────
    const miracleScore = contentResult.content.miracleScore ||
                        contentGenerator.calculateMiracleScore(user);

    user.miracleScore = miracleScore;

    console.log(`⭐ 기적지수: ${miracleScore}`);
    console.log(`🎨 템플릿: ${templateResult.template}`);

    // ─────────────────────────────────────────────────────
    // Step 4: PDF 데이터 준비
    // ─────────────────────────────────────────────────────
    const pdfData = pdfGenerator.processTemplateData(
      user,
      contentResult.content
    );

    // ─────────────────────────────────────────────────────
    // Step 5: PDF 생성
    // ─────────────────────────────────────────────────────
    console.log('');
    console.log('📄 PDF 생성 중...');

    const step5Start = Date.now();

    // PDF 저장 경로
    const timestamp = Date.now();
    const filename = `roadmap_${user.name}_${timestamp}.pdf`;
    const outputDir = path.join(__dirname, '../../../generated-pdfs');
    const outputPath = path.join(outputDir, filename);

    // 디렉토리 생성 (없으면)
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (e) {
      // 이미 존재하면 무시
    }

    // PDF 생성
    const pdfResult = await pdfGenerator.generatePDF(
      templateResult.template,
      pdfData,
      outputPath
    );

    const step5Time = Date.now() - step5Start;
    console.log(`✅ PDF 생성 완료: ${step5Time}ms`);

    // ─────────────────────────────────────────────────────
    // Step 6: PDF URL 생성 & 카카오톡 발송
    // ─────────────────────────────────────────────────────
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const pdfUrl = `${baseUrl}/pdfs/${filename}`;

    console.log(`🔗 PDF URL: ${pdfUrl}`);

    // 카카오톡 발송 (비동기 - 결과를 기다리지 않음)
    let kakaoResult = { success: false, message: 'Skipped' };

    if (user.phone) {
      console.log('');
      console.log('📱 카카오톡 발송 중...');
      const step6Start = Date.now();

      kakaoResult = await kakaoAPI.sendWithRetry(user, pdfUrl, 2);

      const step6Time = Date.now() - step6Start;
      console.log(`✅ 카카오톡 처리 완료: ${step6Time}ms`);
    } else {
      console.log('📱 전화번호 없음 - 카카오톡 발송 스킵');
    }

    // ─────────────────────────────────────────────────────
    // Step 7: 응답 반환
    // ─────────────────────────────────────────────────────
    const totalTime = Date.now() - totalStartTime;

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 전체 완료: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}초)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    res.json({
      success: true,
      sessionId: sessionId,
      data: {
        pdfUrl: pdfUrl,
        pdfPath: outputPath,
        template: templateResult.template,
        miracleScore: miracleScore,
        kakaoSent: kakaoResult.success
      },
      timing: {
        total: totalTime,
        contentGeneration: contentResult.time,
        pdfGeneration: pdfResult.time,
        kakaoSend: kakaoResult.time || 0
      },
      metadata: {
        userName: user.name,
        userWish: user.wish,
        category: user.category,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const totalTime = Date.now() - totalStartTime;

    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`❌ 생성 실패 [${sessionId}]: ${error.message}`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(error.stack);
    console.error('');

    res.status(500).json({
      success: false,
      sessionId: sessionId,
      error: error.message,
      time: totalTime
    });
  }
});

// ═══════════════════════════════════════════════════════════
// Test Route: Generate Sample PDFs
// ═══════════════════════════════════════════════════════════

router.post('/test/samples', async (req, res) => {
  try {
    console.log('🧪 샘플 PDF 4개 생성 시작...');

    const samples = [
      {
        name: '김지수',
        wish: '10kg 감량하기',
        category: '건강',
        age: 28,
        gender: '여성',
        phone: '010-1234-5678'
      },
      {
        name: '박민준',
        wish: '개발자로 이직하기',
        category: '커리어',
        age: 32,
        gender: '남성',
        phone: '010-2345-6789'
      },
      {
        name: '이서연',
        wish: '영어 회화 마스터하기',
        category: '학습',
        age: 25,
        gender: '여성',
        phone: '010-3456-7890'
      },
      {
        name: '정현우',
        wish: '월 100만원 부수입 만들기',
        category: '재무',
        age: 35,
        gender: '남성',
        phone: '010-4567-8901'
      }
    ];

    const results = [];

    for (const sample of samples) {
      console.log(`\n📝 생성 중: ${sample.name}님 - ${sample.wish}`);

      const result = await generateSingleSample(sample);
      results.push(result);

      console.log(`✅ 완료: ${result.time}ms`);
    }

    const totalTime = results.reduce((sum, r) => sum + r.time, 0);
    const avgTime = totalTime / results.length;

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 샘플 PDF 4개 생성 완료`);
    console.log(`   총 시간: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}초)`);
    console.log(`   평균 시간: ${avgTime}ms (${(avgTime / 1000).toFixed(1)}초)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json({
      success: true,
      samples: results,
      statistics: {
        total: results.length,
        totalTime: totalTime,
        averageTime: avgTime
      }
    });

  } catch (error) {
    console.error('❌ 샘플 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

async function generateSingleSample(userData) {
  const startTime = Date.now();

  try {
    // 1. 템플릿 선택 & 콘텐츠 생성
    const [templateResult, contentResult] = await Promise.all([
      Promise.resolve(templateSelector.selectTemplate(userData)),
      Promise.resolve(contentGenerator.getDefaultContent(userData)) // 빠른 기본 콘텐츠 사용
    ]);

    // 2. 기적지수
    userData.miracleScore = contentGenerator.calculateMiracleScore(userData);

    // 3. PDF 데이터 준비
    const pdfData = pdfGenerator.processTemplateData(userData, contentResult);

    // 4. PDF 생성
    const timestamp = Date.now();
    const filename = `sample_${userData.name}_${templateResult.template}_${timestamp}.pdf`;
    const outputDir = path.join(__dirname, '../../../generated-pdfs/samples');
    const outputPath = path.join(outputDir, filename);

    await fs.mkdir(outputDir, { recursive: true });

    await pdfGenerator.generatePDF(
      templateResult.template,
      pdfData,
      outputPath
    );

    const time = Date.now() - startTime;

    return {
      success: true,
      user: userData.name,
      template: templateResult.template,
      filename: filename,
      path: outputPath,
      time: time
    };

  } catch (error) {
    return {
      success: false,
      user: userData.name,
      error: error.message,
      time: Date.now() - startTime
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Template List Route
// ═══════════════════════════════════════════════════════════

router.get('/templates', (req, res) => {
  res.json({
    success: true,
    templates: templateSelector.TEMPLATES
  });
});

// ═══════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════

module.exports = router;
