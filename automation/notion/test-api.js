require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

async function testAPI() {
  try {
    // 1. API 키 자체가 유효한지 테스트
    const user = await notion.users.me();
    console.log('✅ API 키 유효!');
    console.log('봇 이름:', user.name || '이름 없음');
    console.log('봇 타입:', user.type);
    console.log('');
    
    // 2. 접근 가능한 모든 페이지 검색
    console.log('🔍 접근 가능한 페이지 검색 중...');
    const search = await notion.search({
      filter: { property: 'object', value: 'page' },
      page_size: 10
    });
    
    if (search.results.length === 0) {
      console.log('⚠️ 접근 가능한 페이지가 없습니다!');
      console.log('→ Integration을 페이지에 연결해야 합니다.');
    } else {
      console.log(`✅ 총 ${search.results.length}개 페이지 발견:`);
      console.log('');
      
      search.results.forEach((page, index) => {
        const title = page.properties?.title?.title?.[0]?.plain_text || 
                     page.properties?.Name?.title?.[0]?.plain_text ||
                     '제목 없음';
        console.log(`${index + 1}. ${title}`);
        console.log(`   ID: ${page.id}`);
        console.log(`   URL: https://www.notion.so/${page.id.replace(/-/g, '')}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ 에러:', error.message);
    
    if (error.message.includes('unauthorized')) {
      console.log('');
      console.log('💡 해결방법:');
      console.log('1. https://www.notion.so/my-integrations 접속');
      console.log('2. Integration의 새 API 키 복사');
      console.log('3. .env 파일에 업데이트');
    }
  }
}

testAPI();