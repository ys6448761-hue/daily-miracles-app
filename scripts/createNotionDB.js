/**
 * createNotionDB.js
 *
 * Notion Database 4개 자동 생성 스크립트
 * - Debates (토론)
 * - Decisions (결정)
 * - Actions (액션 아이템)
 * - Wishes Inbox (소원 접수함)
 *
 * 실행: node scripts/createNotionDB.js
 *
 * @version 2.0 - 2026-01-10
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

// 생성 결과 저장
const results = [];

/**
 * 1. Debates (토론) 데이터베이스 생성
 */
async function createDebatesDB() {
    console.log('📋 [1/4] Debates (토론) 생성 중...');

    const response = await notion.databases.create({
        parent: { type: 'page_id', page_id: NOTION_WORKSPACE_ID },
        title: [{ type: 'text', text: { content: 'Debates' } }],
        properties: {
            '제목': { title: {} },
            '날짜': { date: {} },
            '참여자': {
                multi_select: {
                    options: [
                        { name: '푸르미르', color: 'purple' },
                        { name: '코미', color: 'blue' },
                        { name: '루미', color: 'green' },
                        { name: '재미', color: 'pink' },
                        { name: '여의보주', color: 'yellow' },
                        { name: 'Claude Code', color: 'gray' }
                    ]
                }
            },
            '내용': { rich_text: {} },
            '상태': {
                select: {
                    options: [
                        { name: 'OPEN', color: 'blue' },
                        { name: 'IN_PROGRESS', color: 'yellow' },
                        { name: 'RESOLVED', color: 'green' },
                        { name: 'CLOSED', color: 'gray' }
                    ]
                }
            }
        }
    });

    console.log(`   ✅ Debates 생성 완료: ${response.id}`);
    return { name: 'Debates', id: response.id, url: response.url };
}

/**
 * 2. Decisions (결정) 데이터베이스 생성
 */
async function createDecisionsDB() {
    console.log('📋 [2/4] Decisions (결정) 생성 중...');

    const response = await notion.databases.create({
        parent: { type: 'page_id', page_id: NOTION_WORKSPACE_ID },
        title: [{ type: 'text', text: { content: 'Decisions' } }],
        properties: {
            '결정 번호': { title: {} },
            '날짜': { date: {} },
            '승인자': {
                select: {
                    options: [
                        { name: '푸르미르', color: 'purple' },
                        { name: '코미', color: 'blue' },
                        { name: '여의보주', color: 'yellow' }
                    ]
                }
            },
            '내용': { rich_text: {} },
            '상태': {
                select: {
                    options: [
                        { name: 'DRAFT', color: 'gray' },
                        { name: 'PENDING', color: 'yellow' },
                        { name: 'APPROVED', color: 'green' },
                        { name: 'REJECTED', color: 'red' },
                        { name: 'IMPLEMENTED', color: 'blue' }
                    ]
                }
            }
        }
    });

    console.log(`   ✅ Decisions 생성 완료: ${response.id}`);
    return { name: 'Decisions', id: response.id, url: response.url };
}

/**
 * 3. Actions (액션 아이템) 데이터베이스 생성
 */
async function createActionsDB() {
    console.log('📋 [3/4] Actions (액션 아이템) 생성 중...');

    const response = await notion.databases.create({
        parent: { type: 'page_id', page_id: NOTION_WORKSPACE_ID },
        title: [{ type: 'text', text: { content: 'Actions' } }],
        properties: {
            '액션': { title: {} },
            '담당자': {
                select: {
                    options: [
                        { name: '푸르미르', color: 'purple' },
                        { name: '코미', color: 'blue' },
                        { name: '루미', color: 'green' },
                        { name: '재미', color: 'pink' },
                        { name: '여의보주', color: 'yellow' },
                        { name: 'Claude Code', color: 'gray' }
                    ]
                }
            },
            '마감일': { date: {} },
            '우선순위': {
                select: {
                    options: [
                        { name: 'P0', color: 'red' },
                        { name: 'P1', color: 'orange' },
                        { name: 'P2', color: 'yellow' },
                        { name: 'P3', color: 'gray' }
                    ]
                }
            },
            '상태': {
                select: {
                    options: [
                        { name: 'TODO', color: 'gray' },
                        { name: 'IN_PROGRESS', color: 'blue' },
                        { name: 'BLOCKED', color: 'red' },
                        { name: 'DONE', color: 'green' }
                    ]
                }
            }
        }
    });

    console.log(`   ✅ Actions 생성 완료: ${response.id}`);
    return { name: 'Actions', id: response.id, url: response.url };
}

/**
 * 4. Wishes Inbox (소원 접수함) 데이터베이스 생성
 */
async function createWishesInboxDB() {
    console.log('📋 [4/4] Wishes Inbox (소원 접수함) 생성 중...');

    const response = await notion.databases.create({
        parent: { type: 'page_id', page_id: NOTION_WORKSPACE_ID },
        title: [{ type: 'text', text: { content: 'Wishes Inbox' } }],
        properties: {
            '소원 ID': { title: {} },
            '접수일': { date: {} },
            '채널': {
                select: {
                    options: [
                        { name: '카톡', color: 'yellow' },
                        { name: '웹', color: 'blue' },
                        { name: '폼', color: 'green' },
                        { name: 'Wix', color: 'purple' },
                        { name: '전화', color: 'red' }
                    ]
                }
            },
            '상태': {
                select: {
                    options: [
                        { name: 'NEW', color: 'red' },
                        { name: 'ACK', color: 'orange' },
                        { name: 'IN_PROGRESS', color: 'yellow' },
                        { name: 'APPROVED', color: 'blue' },
                        { name: 'STARTED', color: 'green' },
                        { name: 'COMPLETED', color: 'gray' }
                    ]
                }
            },
            '우선순위': {
                select: {
                    options: [
                        { name: 'P0', color: 'red' },
                        { name: 'P1', color: 'orange' },
                        { name: 'P2', color: 'yellow' }
                    ]
                }
            },
            '담당자': {
                select: {
                    options: [
                        { name: '푸르미르', color: 'purple' },
                        { name: '코미', color: 'blue' },
                        { name: '루미', color: 'green' },
                        { name: '재미', color: 'pink' },
                        { name: '여의보주', color: 'yellow' }
                    ]
                }
            },
            '고객명': { rich_text: {} },
            '연락처': { rich_text: {} },
            '내용': { rich_text: {} }
        }
    });

    console.log(`   ✅ Wishes Inbox 생성 완료: ${response.id}`);
    return { name: 'Wishes Inbox', id: response.id, url: response.url };
}

/**
 * 메인 실행
 */
async function main() {
    console.log('\n🚀 Notion Database 4개 생성 시작...\n');
    console.log(`📍 대상 페이지: ${NOTION_WORKSPACE_ID}\n`);

    try {
        // 순차 생성
        results.push(await createDebatesDB());
        results.push(await createDecisionsDB());
        results.push(await createActionsDB());
        results.push(await createWishesInboxDB());

        // 결과 출력
        console.log('\n' + '═'.repeat(50));
        console.log('✅ 4개 테이블 생성 완료!\n');

        console.log('생성된 테이블:');
        results.forEach((r, i) => {
            console.log(`${i + 1}. ${r.name} - Database ID: ${r.id}`);
        });

        console.log('\n🔧 환경변수 추가 (선택사항):');
        console.log(`NOTION_DEBATES_DB_ID=${results[0].id}`);
        console.log(`NOTION_DECISIONS_DB_ID=${results[1].id}`);
        console.log(`NOTION_ACTIONS_DB_ID=${results[2].id}`);
        console.log(`NOTION_WISHES_INBOX_DB_ID=${results[3].id}`);

        console.log('\n' + '═'.repeat(50));

    } catch (error) {
        console.error('\n❌ 데이터베이스 생성 실패:', error.message);

        if (error.code === 'object_not_found') {
            console.error('\n💡 해결 방법:');
            console.error('   1. NOTION_WORKSPACE_ID가 올바른 페이지 ID인지 확인');
            console.error('   2. 해당 페이지에 Integration이 연결되어 있는지 확인');
            console.error('   3. Notion > 페이지 우측 상단 ··· > Connections에서 Integration 추가');
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
main();
