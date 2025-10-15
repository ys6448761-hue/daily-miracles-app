require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

const PAGE_ID = process.env.NOTION_PAGE_ID;

async function sendSuccessMessage() {
  try {
    console.log('🚀 Claude Code 연동 성공 메시지 전송 중...\n');

    // 1. API 연결 확인
    const user = await notion.users.me();
    console.log('✅ Notion API 연결 성공');
    console.log(`   봇 이름: ${user.name || '이름 없음'}`);
    console.log('');

    // 2. 페이지에 성공 메시지 추가
    const now = new Date();
    const timestamp = now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    await notion.blocks.children.append({
      block_id: PAGE_ID,
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '🎉 Claude Code 연동 성공!'
                }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: `연동 시간: ${timestamp}`
                }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'API 연결 정상'
                },
                annotations: {
                  bold: true,
                  color: 'green'
                }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'Integration 권한 확인 완료'
                },
                annotations: {
                  bold: true,
                  color: 'green'
                }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '자동화 준비 완료'
                },
                annotations: {
                  bold: true,
                  color: 'green'
                }
              }
            ]
          }
        },
        {
          object: 'block',
          type: 'divider',
          divider: {}
        },
        {
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '이제 Daily Miracles 프로젝트의 모든 이벤트가 자동으로 이 페이지에 기록됩니다!'
                }
              }
            ],
            icon: {
              emoji: '✨'
            },
            color: 'blue_background'
          }
        }
      ]
    });

    console.log('✅ 성공 메시지 전송 완료!');
    console.log('');
    console.log(`📄 페이지 확인: https://www.notion.so/${PAGE_ID.replace(/-/g, '')}`);
    console.log('');
    console.log('='.repeat(50));
    console.log('🎊 Notion 연동이 완료되었습니다!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    console.error('');

    if (error.message.includes('unauthorized')) {
      console.log('💡 해결방법:');
      console.log('1. NOTION_SETUP_GUIDE.md 파일 참고');
      console.log('2. API 키를 새로 생성');
      console.log('3. Integration을 페이지에 연결');
    } else if (error.message.includes('Could not find')) {
      console.log('💡 해결방법:');
      console.log('1. 페이지 ID가 올바른지 확인');
      console.log('2. Integration이 페이지에 연결되었는지 확인');
      console.log('');
      console.log('현재 페이지 ID:', PAGE_ID);
    }

    process.exit(1);
  }
}

sendSuccessMessage();
