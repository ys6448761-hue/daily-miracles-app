/**
 * createNotionDB.js
 *
 * Notion Offline Ops Log 데이터베이스 자동 생성 스크립트
 *
 * 실행: node scripts/createNotionDB.js
 *
 * @version 1.0 - 2026-01-10
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');

// 환경변수
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_WORKSPACE_ID = process.env.NOTION_WORKSPACE_ID;

if (!NOTION_API_KEY) {
    console.error('❌ NOTION_API_KEY 환경변수가 설정되지 않았습니다.');
    process.exit(1);
}

if (!NOTION_WORKSPACE_ID) {
    console.error('❌ NOTION_WORKSPACE_ID 환경변수가 설정되지 않았습니다.');
    process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

/**
 * Offline Ops Log 데이터베이스 생성
 */
async function createOfflineOpsLogDB() {
    console.log('🚀 Notion Offline Ops Log 데이터베이스 생성 시작...\n');

    try {
        const response = await notion.databases.create({
            parent: {
                type: 'page_id',
                page_id: NOTION_WORKSPACE_ID
            },
            title: [
                {
                    type: 'text',
                    text: {
                        content: 'Offline Ops Log'
                    }
                }
            ],
            properties: {
                // 1. 요청 제목 (Title - 필수)
                '요청 제목': {
                    title: {}
                },
                // 2. 접수일시
                '접수일시': {
                    date: {}
                },
                // 3. 채널
                '채널': {
                    select: {
                        options: [
                            { name: 'Wix', color: 'blue' },
                            { name: '카톡', color: 'yellow' },
                            { name: '문자', color: 'green' },
                            { name: '전화', color: 'red' },
                            { name: '이메일', color: 'purple' },
                            { name: '앱', color: 'pink' }
                        ]
                    }
                },
                // 4. 이름
                '이름': {
                    rich_text: {}
                },
                // 5. 연락처
                '연락처': {
                    rich_text: {}
                },
                // 6. 유형
                '유형': {
                    select: {
                        options: [
                            { name: '견적', color: 'blue' },
                            { name: '결제', color: 'green' },
                            { name: '환불', color: 'red' },
                            { name: '일정변경', color: 'yellow' },
                            { name: '기술오류', color: 'orange' },
                            { name: '입항', color: 'purple' },
                            { name: '기타', color: 'gray' }
                        ]
                    }
                },
                // 7. 긴급도
                '긴급도': {
                    select: {
                        options: [
                            { name: '상', color: 'red' },
                            { name: '중', color: 'yellow' },
                            { name: '하', color: 'green' }
                        ]
                    }
                },
                // 8. 요청 요약
                '요청 요약': {
                    rich_text: {}
                },
                // 9. 상태
                '상태': {
                    select: {
                        options: [
                            { name: 'new', color: 'red' },
                            { name: 'in_progress', color: 'yellow' },
                            { name: 'replied', color: 'blue' },
                            { name: 'closed', color: 'green' }
                        ]
                    }
                },
                // 10. SLA(응답기한)
                'SLA(응답기한)': {
                    date: {}
                },
                // 추가: 마지막 응답시간
                '마지막 응답시간': {
                    date: {}
                },
                // 추가: 메모
                '메모': {
                    rich_text: {}
                }
            }
        });

        console.log('✅ 데이터베이스 생성 완료!\n');
        console.log('📋 데이터베이스 정보:');
        console.log(`   - ID: ${response.id}`);
        console.log(`   - URL: ${response.url}`);
        console.log('\n🔧 환경변수에 추가하세요:');
        console.log(`   NOTION_OPS_DB_ID=${response.id}\n`);

        return response;

    } catch (error) {
        console.error('❌ 데이터베이스 생성 실패:', error.message);

        if (error.code === 'object_not_found') {
            console.error('\n💡 해결 방법:');
            console.error('   1. NOTION_WORKSPACE_ID가 올바른 페이지 ID인지 확인');
            console.error('   2. 해당 페이지에 Notion Integration이 연결되어 있는지 확인');
            console.error('   3. Notion > Settings > Connections에서 Integration 추가');
        }

        if (error.code === 'unauthorized') {
            console.error('\n💡 해결 방법:');
            console.error('   1. NOTION_API_KEY가 올바른지 확인');
            console.error('   2. https://www.notion.so/my-integrations 에서 키 재발급');
        }

        process.exit(1);
    }
}

// 실행
createOfflineOpsLogDB();
