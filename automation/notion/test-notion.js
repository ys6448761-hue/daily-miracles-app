require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function test() {
  console.log('🔍 노션 연결 테스트 시작...\n');
  
  try {
    console.log('1️⃣ 페이지 읽기 테스트...');
    const page = await notion.pages.retrieve({
      page_id: process.env.NOTION_PAGE_ID,
    });
    console.log('✅ 페이지 읽기 성공!');
    
    console.log('\n2️⃣ 메시지 추가 테스트...');
    const now = new Date().toLocaleString('ko-KR');
    
    await notion.blocks.children.append({
      block_id: process.env.NOTION_PAGE_ID,
      children: [
        {
          object: 'block',
          type: 'callout',
          callout: {
            icon: { emoji: '✅' },
            rich_text: [
              {
                type: 'text',
                text: { 
                  content: 'Claude Code ↔ Notion 연동 성공!\n테스트 시각: ' + now
                },
              },
            ],
          },
        },
      ],
    });
    
    console.log('✅ 메시지 추가 성공!');
    console.log('\n🎉 모든 테스트 통과!');
    console.log('📱 노션 페이지를 확인해보세요!\n');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('\n💡 확인사항:');
    console.error('   1. .env 파일의 NOTION_API_KEY 확인');
    console.error('   2. NOTION_PAGE_ID 확인');
    console.error('   3. Integration이 페이지에 연결되었는지 확인\n');
  }
}

test();
