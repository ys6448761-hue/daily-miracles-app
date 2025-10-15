require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function createDailyReport() {
  const pageId = process.env.NOTION_PAGE_ID;
  const now = new Date().toLocaleString('ko-KR');
  
  await notion.blocks.children.append({
    block_id: pageId,
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{
            type: 'text',
            text: { content: '📅 ' + now + ' 일일 보고' }
          }]
        }
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { content: '✅ Notion API 연동 완료' }
          }]
        }
      },
      {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { content: '✅ 일일 보고 자동화 시스템 구축 중' }
          }]
        }
      }
    ]
  });
  
  console.log('✅ 보고서 생성 완료!');
}

createDailyReport();
