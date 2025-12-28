/**
 * 메시지 일괄 발송 스크립트
 *
 * 사용법:
 *   npx ts-node scripts/send-messages-batch.ts --type=morning
 *   npx ts-node scripts/send-messages-batch.ts --type=evening
 *   npx ts-node scripts/send-messages-batch.ts --type=custom --template=welcome
 *   npx ts-node scripts/send-messages-batch.ts --type=morning --dry-run
 */

import { Pool } from 'pg';
import axios from 'axios';

// 환경 변수
const DATABASE_URL = process.env.DATABASE_URL || '';
const KAKAO_API_KEY = process.env.KAKAO_API_KEY || '';
const KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY || '';

// 데이터베이스 연결
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 타입 정의
interface Recipient {
  entry_id: string;
  name: string;
  phone: string;
  wish: string;
  day_number: number;
  morning_message?: string;
  evening_message?: string;
}

interface SendOptions {
  type: 'morning' | 'evening' | 'custom';
  template?: string;
  dryRun: boolean;
  limit?: number;
}

interface SendResult {
  success: number;
  failed: number;
  errors: Array<{ entry_id: string; error: string }>;
}

// 명령줄 인수 파싱
function parseArgs(): SendOptions {
  const args = process.argv.slice(2);
  const options: SendOptions = {
    type: 'morning',
    dryRun: false
  };

  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    switch (key) {
      case 'type':
        options.type = value as 'morning' | 'evening' | 'custom';
        break;
      case 'template':
        options.template = value;
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'limit':
        options.limit = parseInt(value);
        break;
    }
  });

  return options;
}

// 발송 대상 조회
async function fetchRecipients(options: SendOptions): Promise<Recipient[]> {
  const query = `
    SELECT
      we.entry_id,
      we.name,
      we.phone,
      we.responses->>'q1' as wish,
      EXTRACT(DAY FROM CURRENT_DATE - we.start_date) + 1 as day_number,
      wm.morning_message,
      wm.evening_message
    FROM wish_entries we
    LEFT JOIN wish_messages wm ON we.entry_id = wm.entry_id
      AND wm.day_number = EXTRACT(DAY FROM CURRENT_DATE - we.start_date) + 1
    WHERE we.status = 'active'
      AND CURRENT_DATE - we.start_date <= 7
      AND EXTRACT(DAY FROM CURRENT_DATE - we.start_date) + 1 <= 7
    ORDER BY we.created_at
    ${options.limit ? `LIMIT ${options.limit}` : ''}
  `;

  const result = await pool.query(query);
  return result.rows;
}

// 메시지 템플릿 생성
function buildMessage(recipient: Recipient, type: 'morning' | 'evening'): string {
  const baseMessages = {
    morning: [
      `🌅 좋은 아침이에요, ${recipient.name}님!\n\n`,
      recipient.morning_message || getDefaultMorningMessage(recipient.day_number, recipient.wish),
      `\n\n오늘도 당신의 소원을 응원해요! 💫\n- 하루하루의 기적`
    ],
    evening: [
      `🌙 오늘 하루도 수고하셨어요, ${recipient.name}님.\n\n`,
      recipient.evening_message || getDefaultEveningMessage(recipient.day_number, recipient.wish),
      `\n\n내일도 함께해요. 굿나잇! 🌟\n- 하루하루의 기적`
    ]
  };

  return baseMessages[type].join('');
}

// 기본 아침 메시지
function getDefaultMorningMessage(day: number, wish: string): string {
  const messages = [
    `Day ${day} - "${wish}"\n\n새로운 하루가 시작됐어요. 오늘 할 수 있는 작은 한 걸음, 무엇일까요?`,
    `Day ${day} - 어제보다 조금 더 가까워진 오늘이에요.\n\n당신의 소원이 점점 선명해지고 있어요.`,
    `Day ${day} - 중간 지점을 지나고 있어요!\n\n포기하지 마세요. 당신은 이미 변하고 있어요.`,
    `Day ${day} - 습관이 자리잡기 시작할 때예요.\n\n오늘도 작은 실천을 이어가세요.`,
    `Day ${day} - 5일차! 대단해요.\n\n여기까지 온 당신을 응원합니다.`,
    `Day ${day} - 거의 다 왔어요!\n\n마지막까지 함께해요.`,
    `Day ${day} - 마지막 날이에요!\n\n7일간의 여정을 함께해서 감사해요.`
  ];
  return messages[Math.min(day - 1, messages.length - 1)];
}

// 기본 저녁 메시지
function getDefaultEveningMessage(day: number, wish: string): string {
  const messages = [
    `Day ${day} 마무리 - 오늘 하루, 소원을 위해 무엇을 했나요?\n\n작은 것도 괜찮아요. 시작이 중요하니까요.`,
    `Day ${day} 마무리 - 오늘의 나에게 수고했다고 말해주세요.\n\n당신은 충분히 잘하고 있어요.`,
    `Day ${day} 마무리 - 중간 점검! 소원에 조금 더 가까워진 것 같나요?\n\n느리더라도 괜찮아요.`,
    `Day ${day} 마무리 - 오늘 힘들었어도 괜찮아요.\n\n내일은 또 새로운 기회니까요.`,
    `Day ${day} 마무리 - 5일간 정말 수고했어요.\n\n이제 2일만 더 힘내요!`,
    `Day ${day} 마무리 - 내일이면 마지막이에요.\n\n지금까지의 여정을 돌아봐요.`,
    `Day ${day} 마무리 - 7일간의 여정이 끝났어요.\n\n당신의 기적은 이제 시작이에요. 🌟`
  ];
  return messages[Math.min(day - 1, messages.length - 1)];
}

// 카카오 알림톡 발송
async function sendKakaoMessage(phone: string, message: string): Promise<boolean> {
  try {
    const response = await axios.post(
      'https://kapi.kakao.com/v1/api/talk/friends/message/send',
      {
        receiver_phone: phone,
        template_object: {
          object_type: 'text',
          text: message,
          link: {
            web_url: 'https://daily-miracles.com',
            mobile_web_url: 'https://daily-miracles.com'
          }
        }
      },
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error(`발송 실패 (${phone}):`, error);
    return false;
  }
}

// 발송 로그 저장
async function saveSendLog(
  entryId: string,
  type: string,
  status: 'success' | 'failed',
  message: string
): Promise<void> {
  await pool.query(
    `INSERT INTO message_logs (entry_id, message_type, status, message, sent_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [entryId, type, status, message]
  );
}

// 메인 함수
async function main(): Promise<void> {
  console.log('=== 메시지 일괄 발송 시작 ===\n');

  const options = parseArgs();
  console.log('옵션:', options);

  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN 모드 - 실제 발송하지 않습니다.\n');
  }

  try {
    // 발송 대상 조회
    console.log('발송 대상 조회 중...');
    const recipients = await fetchRecipients(options);
    console.log(`발송 대상: ${recipients.length}명\n`);

    if (recipients.length === 0) {
      console.log('발송 대상이 없습니다.');
      return;
    }

    const result: SendResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    // 발송 실행
    for (const recipient of recipients) {
      const messageType = options.type === 'custom' ? 'morning' : options.type;
      const message = buildMessage(recipient, messageType);

      console.log(`[${recipient.entry_id}] ${recipient.name} - Day ${recipient.day_number}`);

      if (options.dryRun) {
        console.log(`  메시지 미리보기:\n${message.slice(0, 100)}...`);
        result.success++;
      } else {
        const success = await sendKakaoMessage(recipient.phone, message);

        if (success) {
          result.success++;
          await saveSendLog(recipient.entry_id, options.type, 'success', message);
          console.log(`  ✅ 발송 성공`);
        } else {
          result.failed++;
          result.errors.push({ entry_id: recipient.entry_id, error: 'API 호출 실패' });
          await saveSendLog(recipient.entry_id, options.type, 'failed', message);
          console.log(`  ❌ 발송 실패`);
        }
      }

      // API 호출 간격 (Rate Limiting 방지)
      if (!options.dryRun) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 결과 출력
    console.log('\n=== 발송 결과 ===');
    console.log(`성공: ${result.success}건`);
    console.log(`실패: ${result.failed}건`);

    if (result.errors.length > 0) {
      console.log('\n실패 목록:');
      result.errors.forEach(err => {
        console.log(`  - ${err.entry_id}: ${err.error}`);
      });
    }

    // 성공률 계산
    const successRate = (result.success / recipients.length * 100).toFixed(1);
    console.log(`\n성공률: ${successRate}%`);

  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n=== 발송 완료 ===');
}

main();
