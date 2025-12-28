/**
 * 소원이 데이터 추출 스크립트
 *
 * 사용법:
 *   npx ts-node scripts/extract-user-data.ts --format=json
 *   npx ts-node scripts/extract-user-data.ts --format=csv --date=2025-12-28
 *   npx ts-node scripts/extract-user-data.ts --entry-id=ENT-001
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// 환경 변수
const DATABASE_URL = process.env.DATABASE_URL || '';

// 데이터베이스 연결
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 타입 정의
interface WishEntry {
  entry_id: string;
  name: string;
  phone: string;
  email?: string;
  channel: 'kakao' | 'web' | 'email';
  responses: Record<string, any>;
  miracle_index?: number;
  indicators?: Record<string, number>;
  status: 'pending' | 'active' | 'completed' | 'dormant';
  created_at: Date;
  updated_at: Date;
}

interface ExtractOptions {
  format: 'json' | 'csv';
  date?: string;
  entryId?: string;
  status?: string;
  outputDir?: string;
}

// 명령줄 인수 파싱
function parseArgs(): ExtractOptions {
  const args = process.argv.slice(2);
  const options: ExtractOptions = {
    format: 'json',
    outputDir: './exports'
  };

  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    switch (key) {
      case 'format':
        options.format = value as 'json' | 'csv';
        break;
      case 'date':
        options.date = value;
        break;
      case 'entry-id':
        options.entryId = value;
        break;
      case 'status':
        options.status = value;
        break;
      case 'output':
        options.outputDir = value;
        break;
    }
  });

  return options;
}

// 데이터 조회
async function fetchEntries(options: ExtractOptions): Promise<WishEntry[]> {
  let query = 'SELECT * FROM wish_entries WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (options.entryId) {
    query += ` AND entry_id = $${paramIndex++}`;
    params.push(options.entryId);
  }

  if (options.date) {
    query += ` AND DATE(created_at) = $${paramIndex++}`;
    params.push(options.date);
  }

  if (options.status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(options.status);
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

// JSON 형식으로 내보내기
function exportToJson(entries: WishEntry[], outputPath: string): void {
  const exportData = {
    exported_at: new Date().toISOString(),
    total_count: entries.length,
    entries: entries.map(entry => ({
      ...entry,
      // 개인정보 마스킹 (필요시)
      phone: maskPhone(entry.phone),
      email: entry.email ? maskEmail(entry.email) : undefined
    }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`JSON 내보내기 완료: ${outputPath}`);
}

// CSV 형식으로 내보내기
function exportToCsv(entries: WishEntry[], outputPath: string): void {
  const headers = [
    'entry_id',
    'name',
    'phone',
    'email',
    'channel',
    'miracle_index',
    'belief',
    'persistence',
    'practicality',
    'adaptability',
    'gratitude',
    'status',
    'created_at'
  ];

  const rows = entries.map(entry => [
    entry.entry_id,
    entry.name,
    maskPhone(entry.phone),
    entry.email ? maskEmail(entry.email) : '',
    entry.channel,
    entry.miracle_index || '',
    entry.indicators?.belief || '',
    entry.indicators?.persistence || '',
    entry.indicators?.practicality || '',
    entry.indicators?.adaptability || '',
    entry.indicators?.gratitude || '',
    entry.status,
    entry.created_at.toISOString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  fs.writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`CSV 내보내기 완료: ${outputPath}`);
}

// 전화번호 마스킹
function maskPhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3');
}

// 이메일 마스킹
function maskEmail(email: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  const maskedLocal = local.slice(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

// 메인 함수
async function main(): Promise<void> {
  console.log('=== 소원이 데이터 추출 시작 ===\n');

  const options = parseArgs();
  console.log('옵션:', options);

  try {
    // 출력 디렉토리 생성
    if (!fs.existsSync(options.outputDir!)) {
      fs.mkdirSync(options.outputDir!, { recursive: true });
    }

    // 데이터 조회
    console.log('\n데이터 조회 중...');
    const entries = await fetchEntries(options);
    console.log(`조회된 건수: ${entries.length}건`);

    if (entries.length === 0) {
      console.log('추출할 데이터가 없습니다.');
      return;
    }

    // 파일명 생성
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `wish-entries-${timestamp}.${options.format}`;
    const outputPath = path.join(options.outputDir!, filename);

    // 형식에 따라 내보내기
    if (options.format === 'json') {
      exportToJson(entries, outputPath);
    } else {
      exportToCsv(entries, outputPath);
    }

    // 통계 출력
    console.log('\n=== 추출 통계 ===');
    console.log(`총 건수: ${entries.length}`);

    const statusCounts = entries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('상태별 건수:', statusCounts);

    const channelCounts = entries.reduce((acc, entry) => {
      acc[entry.channel] = (acc[entry.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('채널별 건수:', channelCounts);

    const avgMiracleIndex = entries
      .filter(e => e.miracle_index)
      .reduce((sum, e) => sum + (e.miracle_index || 0), 0) / entries.filter(e => e.miracle_index).length;
    console.log(`평균 기적지수: ${avgMiracleIndex.toFixed(1)}점`);

  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n=== 추출 완료 ===');
}

main();
