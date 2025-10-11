const express = require('express');
require('dotenv').config();

// 유틸리티와 설정 불러오기
const { validateEnvironment } = require('./utils/validation');
const { MAX_CONCURRENT_REQUESTS } = require('./config/constants');
const { cleanup } = require('./services/dataService');
const { requestLogger, info: logInfo } = require('./config/logger');
const { globalErrorHandler, notFoundHandler, initializeErrorHandling } = require('./middleware/errorHandler');

// 라우터 불러오기
const storyRoutes = require('./routes/storyRoutes');
const viewRoutes = require('./routes/viewRoutes');
const problemRoutes = require('./routes/problemRoutes'); // ✨ 추가!

const app = express();

// 환경변수 검증 실행
validateEnvironment();

// 환경변수 로깅 (Render 배포 확인용)
console.log('📋 환경변수 확인:', {
  PORT: process.env.PORT || '5000 (기본값)',
  NODE_ENV: process.env.NODE_ENV || 'development',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ 설정됨' : '❌ 없음',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./data/miracle.db (기본값)'
});

// 전역 에러 핸들링 초기화
initializeErrorHandling();

const port = process.env.PORT || 5000;

// 미들웨어 설정
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 요청 로깅 미들웨어
app.use(requestLogger);

// 정적 파일 서빙
app.use(express.static('public'));
app.use('/generated-images', express.static('generated-images'));

// 라우터 설정
app.use('/api', storyRoutes);
app.use('/api/problem', problemRoutes); // ✨ 추가!
app.use('/', viewRoutes);

// 404 에러 핸들러 (라우터 다음에 위치)
app.use(notFoundHandler);

// 전역 에러 핸들러 (마지막에 위치)
app.use(globalErrorHandler);

// 서버 시작 및 Graceful shutdown
const server = app.listen(port, () => {
  logInfo('Server started', {
    port,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
  console.log('🌟 하루하루의 기적 서버가 시작되었습니다!');
  console.log(`📍 서버 주소: http://localhost:${port}`);
  console.log(`🎯 API 엔드포인트: /api/create-story`);
  console.log(`📊 상태 확인: /api/status`);
  console.log(`🖼️ 이미지 저장 경로: ./generated-images/`);
  console.log('');
  console.log('🚀 성능 최적화 적용됨:');
  console.log(`   • 병렬 이미지 생성 (최대 ${MAX_CONCURRENT_REQUESTS}개 동시 처리)`);
  console.log('   • 예상 처리 시간: 5분 → 1-2분으로 단축');
  console.log('   • 실시간 진행률 추적');
  console.log('   • 오류 복구 및 부분 실패 허용');
  console.log('');
  console.log('📁 모듈 구조 개선됨:');
  console.log('   • routes/ - 라우터 모듈 분리');
  console.log('   • services/ - 비즈니스 로직 분리');
  console.log('   • utils/ - 유틸리티 함수 분리');
  console.log('   • config/ - 설정 및 상수 관리');
  console.log('');
  console.log('🗄️  데이터베이스:');
  console.log('   • SQLite 데이터베이스 (영구 저장)');
  console.log('   • 데이터 디렉토리: ./data/');
  console.log('   • 트랜잭션 지원으로 데이터 무결성 보장');
  console.log('');
  console.log('📊 로깅 및 에러 처리:');
  console.log('   • Winston 구조화된 로깅');
  console.log('   • 로그 디렉토리: ./logs/');
  console.log('   • 중앙화된 에러 핸들링');
  console.log('   • 사용자 친화적 에러 메시지');
  console.log('');
  console.log('💡 테스트 방법:');
  console.log('1. 브라우저에서 http://localhost:5000 접속');
  console.log('2. 개인정보 입력하여 스토리 생성 테스트');
  console.log('3. 완성된 스토리북과 이미지 확인');
  console.log('4. 콘솔에서 병렬 처리 성능 확인');
  console.log('');
  console.log('⚠️  서버 종료: Ctrl + C');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('서버 종료 중...');
  await cleanup();
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n서버 종료 중...');
  await cleanup();
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});