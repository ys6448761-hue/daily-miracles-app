#!/usr/bin/env node
/**
 * Git Hooks 설치 스크립트
 *
 * 사용법: node scripts/install-hooks.js
 */

const fs = require('fs');
const path = require('path');

const HOOKS_SOURCE = path.join(__dirname, 'hooks');
const GIT_HOOKS_DIR = path.join(__dirname, '..', '.git', 'hooks');

const HOOKS = ['pre-commit'];

console.log('🔧 Git Hooks 설치 시작...\n');

// .git/hooks 폴더 확인
if (!fs.existsSync(GIT_HOOKS_DIR)) {
    console.error('❌ .git/hooks 폴더를 찾을 수 없습니다.');
    console.error('   Git 저장소가 아닌 것 같습니다.');
    process.exit(1);
}

// hooks 설치
HOOKS.forEach(hookName => {
    const source = path.join(HOOKS_SOURCE, hookName);
    const dest = path.join(GIT_HOOKS_DIR, hookName);

    if (!fs.existsSync(source)) {
        console.log(`⚠️ ${hookName}: 소스 파일 없음, 건너뜀`);
        return;
    }

    try {
        // 기존 hook 백업
        if (fs.existsSync(dest)) {
            const backup = `${dest}.backup`;
            fs.copyFileSync(dest, backup);
            console.log(`📦 ${hookName}: 기존 hook 백업 → ${hookName}.backup`);
        }

        // hook 복사
        fs.copyFileSync(source, dest);

        // 실행 권한 부여 (Windows에서는 무시됨)
        try {
            fs.chmodSync(dest, '755');
        } catch (e) {
            // Windows에서는 chmod 무시
        }

        console.log(`✅ ${hookName}: 설치 완료`);
    } catch (err) {
        console.error(`❌ ${hookName}: 설치 실패 - ${err.message}`);
    }
});

console.log('\n✨ Git Hooks 설치 완료!');
console.log('\n📌 동작 방식:');
console.log('   - docs/ 폴더 파일 커밋 시 → manifest.json 자동 갱신');
console.log('   - raw/ 폴더는 무시 (원본 보관용)');
console.log('   - index/ 폴더는 무시 (생성 결과물)');
