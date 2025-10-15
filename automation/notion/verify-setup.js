require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 Daily Miracles - Notion 연동 설정 확인\n');
console.log('='.repeat(50));

let allChecksPass = true;
let warnings = [];
let nextSteps = [];

// Check 1: .env 파일 존재 여부
console.log('\n📄 Check 1: .env 파일 확인');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env 파일 존재');
} else {
  console.log('   ❌ .env 파일 없음');
  allChecksPass = false;
  nextSteps.push('.env 파일을 생성하세요');
}

// Check 2: NOTION_API_KEY 확인
console.log('\n🔑 Check 2: NOTION_API_KEY 확인');
const apiKey = process.env.NOTION_API_KEY;
if (!apiKey) {
  console.log('   ❌ NOTION_API_KEY가 설정되지 않음');
  allChecksPass = false;
  nextSteps.push('NOTION_API_KEY를 .env 파일에 추가하세요');
} else if (apiKey.startsWith('secret_')) {
  console.log('   ✅ 올바른 형식의 API 키 (secret_xxx)');
  console.log(`   키 길이: ${apiKey.length} 문자`);
} else if (apiKey.startsWith('ntn_')) {
  console.log('   ⚠️  오래된 형식의 API 키 (ntn_xxx)');
  console.log('   이 형식은 더 이상 유효하지 않을 수 있습니다');
  warnings.push('새로운 Integration을 생성하여 secret_xxx 형식의 키를 사용하세요');
  nextSteps.push('https://www.notion.so/my-integrations 에서 새 Integration 생성');
} else {
  console.log('   ⚠️  알 수 없는 형식의 API 키');
  console.log(`   현재 키: ${apiKey.substring(0, 10)}...`);
  warnings.push('API 키 형식을 확인하세요 (secret_xxx 형식이어야 함)');
}

// Check 3: NOTION_PAGE_ID 확인
console.log('\n📋 Check 3: NOTION_PAGE_ID 확인');
const pageId = process.env.NOTION_PAGE_ID;
if (!pageId) {
  console.log('   ❌ NOTION_PAGE_ID가 설정되지 않음');
  allChecksPass = false;
  nextSteps.push('NOTION_PAGE_ID를 .env 파일에 추가하세요');
} else {
  console.log('   ✅ NOTION_PAGE_ID 설정됨');
  console.log(`   페이지 ID: ${pageId}`);

  // ID 형식 확인 (하이픈 제거 후 32자리여야 함)
  const cleanId = pageId.replace(/-/g, '');
  if (cleanId.length === 32) {
    console.log('   ✅ 올바른 ID 길이 (32자리)');
  } else {
    console.log(`   ⚠️  비정상적인 ID 길이 (${cleanId.length}자리, 32자리여야 함)`);
    warnings.push('페이지 ID가 올바른지 Notion URL에서 다시 확인하세요');
  }

  console.log(`   URL: https://www.notion.so/${cleanId}`);
}

// Check 4: 필수 모듈 확인
console.log('\n📦 Check 4: Node.js 패키지 확인');
try {
  require('@notionhq/client');
  console.log('   ✅ @notionhq/client 설치됨');
} catch (error) {
  console.log('   ❌ @notionhq/client 미설치');
  allChecksPass = false;
  nextSteps.push('npm install을 실행하여 패키지를 설치하세요');
}

try {
  require('dotenv');
  console.log('   ✅ dotenv 설치됨');
} catch (error) {
  console.log('   ❌ dotenv 미설치');
  allChecksPass = false;
  nextSteps.push('npm install을 실행하여 패키지를 설치하세요');
}

// Check 5: 필수 파일 확인
console.log('\n📁 Check 5: 필수 파일 확인');
const requiredFiles = [
  'test-api.js',
  'send-success-message.js',
  'START_HERE.md',
  'NOTION_SETUP_GUIDE.md',
  'NOTION_INTEGRATION_REPORT.md'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ⚠️  ${file} 없음`);
    warnings.push(`${file} 파일이 없습니다`);
  }
});

// 결과 요약
console.log('\n' + '='.repeat(50));
console.log('\n📊 검사 결과 요약\n');

if (allChecksPass && warnings.length === 0) {
  console.log('✅ 모든 검사 통과!');
  console.log('\n🎯 다음 단계:');
  console.log('   1. node test-api.js 를 실행하여 API 연결 테스트');
  console.log('   2. 성공하면 node send-success-message.js 실행');
  console.log('\n   또는 START_HERE.md 파일을 참고하세요.');
} else {
  if (!allChecksPass) {
    console.log('❌ 일부 필수 항목이 누락되었습니다\n');
  }

  if (warnings.length > 0) {
    console.log('⚠️  경고 사항:');
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
    console.log('');
  }

  if (nextSteps.length > 0) {
    console.log('🔧 해야 할 작업:');
    nextSteps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });
    console.log('');
  }

  console.log('📖 자세한 가이드는 START_HERE.md 파일을 참고하세요.');
}

console.log('\n' + '='.repeat(50));

// 환경 정보
console.log('\n💻 환경 정보');
console.log(`   Node.js 버전: ${process.version}`);
console.log(`   작업 디렉토리: ${__dirname}`);
console.log(`   운영체제: ${process.platform}`);

console.log('\n');
