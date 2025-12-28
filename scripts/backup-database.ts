/**
 * 데이터베이스 백업 스크립트
 *
 * 사용법:
 *   npx ts-node scripts/backup-database.ts
 *   npx ts-node scripts/backup-database.ts --output=./backups
 *   npx ts-node scripts/backup-database.ts --tables=wish_entries,wish_messages
 *   npx ts-node scripts/backup-database.ts --compress
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 환경 변수
const DATABASE_URL = process.env.DATABASE_URL || '';
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30');

// 데이터베이스 연결
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 백업 대상 테이블
const ALL_TABLES = [
  'wish_entries',
  'wish_messages',
  'wish_roadmaps',
  'message_logs',
  'feedback',
  'user_sessions'
];

// 타입 정의
interface BackupOptions {
  outputDir: string;
  tables: string[];
  compress: boolean;
  cleanOld: boolean;
}

interface BackupResult {
  filename: string;
  size: string;
  tables: string[];
  rowCounts: Record<string, number>;
  duration: number;
}

// 명령줄 인수 파싱
function parseArgs(): BackupOptions {
  const args = process.argv.slice(2);
  const options: BackupOptions = {
    outputDir: './backups',
    tables: ALL_TABLES,
    compress: false,
    cleanOld: true
  };

  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    switch (key) {
      case 'output':
        options.outputDir = value;
        break;
      case 'tables':
        options.tables = value.split(',');
        break;
      case 'compress':
        options.compress = true;
        break;
      case 'no-clean':
        options.cleanOld = false;
        break;
    }
  });

  return options;
}

// 테이블 데이터 추출
async function exportTable(tableName: string): Promise<{ data: any[]; count: number }> {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    return {
      data: result.rows,
      count: result.rowCount || 0
    };
  } catch (error) {
    console.warn(`테이블 ${tableName} 조회 실패:`, error);
    return { data: [], count: 0 };
  }
}

// 백업 파일 생성
async function createBackup(options: BackupOptions): Promise<BackupResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const baseFilename = `backup-${timestamp}`;

  const backupData: Record<string, any[]> = {};
  const rowCounts: Record<string, number> = {};

  console.log('\n테이블별 데이터 추출:');
  for (const table of options.tables) {
    process.stdout.write(`  - ${table}: `);
    const { data, count } = await exportTable(table);
    backupData[table] = data;
    rowCounts[table] = count;
    console.log(`${count}건`);
  }

  // 백업 메타데이터
  const metadata = {
    created_at: new Date().toISOString(),
    database_url: DATABASE_URL.replace(/:[^:@]+@/, ':***@'), // 비밀번호 마스킹
    tables: options.tables,
    row_counts: rowCounts,
    total_rows: Object.values(rowCounts).reduce((a, b) => a + b, 0)
  };

  const fullBackup = {
    metadata,
    data: backupData
  };

  // JSON 파일 생성
  const jsonContent = JSON.stringify(fullBackup, null, 2);
  let filename: string;
  let filePath: string;

  if (options.compress) {
    // GZIP 압축
    filename = `${baseFilename}.json.gz`;
    filePath = path.join(options.outputDir, filename);
    const compressed = zlib.gzipSync(jsonContent);
    fs.writeFileSync(filePath, compressed);
  } else {
    filename = `${baseFilename}.json`;
    filePath = path.join(options.outputDir, filename);
    fs.writeFileSync(filePath, jsonContent, 'utf-8');
  }

  // 파일 크기 확인
  const stats = fs.statSync(filePath);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  return {
    filename,
    size: `${sizeInMB} MB`,
    tables: options.tables,
    rowCounts,
    duration: Date.now() - startTime
  };
}

// 오래된 백업 정리
function cleanOldBackups(outputDir: string): number {
  const now = Date.now();
  const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  if (!fs.existsSync(outputDir)) {
    return 0;
  }

  const files = fs.readdirSync(outputDir);

  for (const file of files) {
    if (!file.startsWith('backup-')) continue;

    const filePath = path.join(outputDir, file);
    const stats = fs.statSync(filePath);

    if (now - stats.mtimeMs > retentionMs) {
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`  삭제: ${file}`);
    }
  }

  return deletedCount;
}

// 백업 검증
async function verifyBackup(filePath: string): Promise<boolean> {
  try {
    let content: string;

    if (filePath.endsWith('.gz')) {
      const compressed = fs.readFileSync(filePath);
      content = zlib.gunzipSync(compressed).toString();
    } else {
      content = fs.readFileSync(filePath, 'utf-8');
    }

    const backup = JSON.parse(content);

    // 구조 검증
    if (!backup.metadata || !backup.data) {
      return false;
    }

    // 데이터 무결성 검증
    for (const table of Object.keys(backup.data)) {
      if (!Array.isArray(backup.data[table])) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('백업 검증 실패:', error);
    return false;
  }
}

// 백업 목록 조회
function listBackups(outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    console.log('백업 디렉토리가 없습니다.');
    return;
  }

  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('backup-'))
    .sort()
    .reverse();

  console.log('\n=== 백업 목록 ===');
  console.log(`총 ${files.length}개\n`);

  files.forEach((file, index) => {
    const filePath = path.join(outputDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / (1024 * 1024)).toFixed(2);
    const date = stats.mtime.toISOString().slice(0, 19).replace('T', ' ');

    console.log(`${index + 1}. ${file}`);
    console.log(`   크기: ${size} MB | 생성: ${date}`);
  });
}

// 메인 함수
async function main(): Promise<void> {
  console.log('=== 데이터베이스 백업 시작 ===');
  console.log(`시간: ${new Date().toISOString()}`);

  const options = parseArgs();
  console.log('옵션:', {
    ...options,
    tables: options.tables.length + '개 테이블'
  });

  try {
    // 출력 디렉토리 생성
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
      console.log(`\n디렉토리 생성: ${options.outputDir}`);
    }

    // 오래된 백업 정리
    if (options.cleanOld) {
      console.log(`\n오래된 백업 정리 (${BACKUP_RETENTION_DAYS}일 이상):`);
      const deleted = cleanOldBackups(options.outputDir);
      console.log(`  ${deleted}개 파일 삭제됨`);
    }

    // 백업 생성
    console.log('\n백업 생성 중...');
    const result = await createBackup(options);

    // 백업 검증
    const filePath = path.join(options.outputDir, result.filename);
    console.log('\n백업 검증 중...');
    const isValid = await verifyBackup(filePath);

    // 결과 출력
    console.log('\n=== 백업 결과 ===');
    console.log(`파일: ${result.filename}`);
    console.log(`크기: ${result.size}`);
    console.log(`테이블: ${result.tables.length}개`);
    console.log(`총 레코드: ${Object.values(result.rowCounts).reduce((a, b) => a + b, 0)}건`);
    console.log(`소요 시간: ${(result.duration / 1000).toFixed(2)}초`);
    console.log(`검증: ${isValid ? '✅ 성공' : '❌ 실패'}`);

    // 테이블별 상세
    console.log('\n테이블별 레코드 수:');
    for (const [table, count] of Object.entries(result.rowCounts)) {
      console.log(`  - ${table}: ${count}건`);
    }

    if (!isValid) {
      console.error('\n⚠️  백업 검증 실패! 재시도 권장.');
      process.exit(1);
    }

    // 백업 목록 표시
    listBackups(options.outputDir);

  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n=== 백업 완료 ===');
}

main();
