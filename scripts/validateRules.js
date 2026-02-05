#!/usr/bin/env node
// scripts/validateRules.js
// 룰 JSON 파일 스키마 검증 스크립트
// Usage: npm run validate:rules

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

console.log('🔍 Rules JSON 스키마 검증 시작...\n');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

const baseDir = path.resolve(process.cwd(), 'docs/dev-bundle/03_Rules');

// 스키마 로드
let schema;
try {
  schema = readJson(path.join(baseDir, 'schema.json'));
  console.log('✅ schema.json 로드 완료');
} catch (err) {
  console.error('❌ schema.json 로드 실패:', err.message);
  process.exit(1);
}

// 검증 대상 파일
const targets = [
  { file: 'mice_rules.json', schemaKey: 'mice_rules' },
  { file: 'evidence_rules.json', schemaKey: 'evidence_rules' },
  { file: 'checklist_rules.json', schemaKey: 'checklist_rules' }
];

// Ajv 설정 (definitions 포함한 전체 스키마로 컴파일)
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv); // date, email 등 format 지원

// definitions를 별도 스키마로 등록
if (schema.definitions) {
  ajv.addSchema({
    $id: 'definitions',
    definitions: schema.definitions
  });
}

let failed = false;
let validated = 0;

console.log('\n--- 파일별 검증 ---\n');

for (const { file, schemaKey } of targets) {
  const fp = path.join(baseDir, file);

  // 파일 존재 확인
  if (!fs.existsSync(fp)) {
    console.error(`❌ ${file}: 파일 없음`);
    failed = true;
    continue;
  }

  // JSON 파싱
  let json;
  try {
    json = readJson(fp);
  } catch (err) {
    console.error(`❌ ${file}: JSON 파싱 실패 - ${err.message}`);
    failed = true;
    continue;
  }

  // 스키마 검증
  const subSchema = schema[schemaKey];
  if (!subSchema) {
    console.warn(`⚠️  ${file}: 스키마 정의 없음 (${schemaKey}) - 건너뜀`);
    continue;
  }

  // definitions를 포함한 완전한 스키마 생성
  const fullSchema = {
    ...subSchema,
    definitions: schema.definitions
  };

  let validate;
  try {
    validate = ajv.compile(fullSchema);
  } catch (compileErr) {
    console.error(`❌ ${file}: 스키마 컴파일 실패 - ${compileErr.message}`);
    failed = true;
    continue;
  }

  const ok = validate(json);

  if (!ok) {
    failed = true;
    console.error(`❌ ${file}: 검증 실패`);
    console.error('   에러:');
    validate.errors.forEach((e, i) => {
      console.error(`   ${i + 1}. ${e.instancePath || '(root)'}: ${e.message}`);
      if (e.params) {
        console.error(`      params: ${JSON.stringify(e.params)}`);
      }
    });
  } else {
    validated++;
    const version = json.meta?.version || 'N/A';
    const updatedAt = json.meta?.updated_at || 'N/A';
    console.log(`✅ ${file} (v${version}, ${updatedAt})`);
  }
}

console.log('\n--- 결과 ---\n');

if (failed) {
  console.error(`❌ 검증 실패: 일부 파일에 오류가 있습니다.`);
  console.error(`   성공: ${validated}/${targets.length}`);
  process.exit(1);
} else {
  console.log(`🎉 모든 룰 파일 검증 통과! (${validated}/${targets.length})`);
  process.exit(0);
}
