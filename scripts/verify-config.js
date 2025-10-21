#!/usr/bin/env node

/**
 * Configuration Verification Script
 * Checks that all configuration files are consistent
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

console.log('🔍 Verifying configuration consistency...');
console.log('');

const errors = [];
const warnings = [];

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('✅ package.json found and parsed');
} catch (err) {
  errors.push(`❌ Cannot read package.json: ${err.message}`);
}

// Read render.yaml
const renderYamlPath = path.join(__dirname, '..', 'render.yaml');
let renderYaml;
try {
  const content = fs.readFileSync(renderYamlPath, 'utf8');
  renderYaml = yaml.parse(content);
  console.log('✅ render.yaml found and parsed');
} catch (err) {
  errors.push(`❌ Cannot read render.yaml: ${err.message}`);
}

// Read .env.example
const envExamplePath = path.join(__dirname, '..', '.env.example');
try {
  fs.readFileSync(envExamplePath, 'utf8');
  console.log('✅ .env.example found');
} catch (err) {
  warnings.push(`⚠️  .env.example not found`);
}

// Read server.js
const serverJsPath = path.join(__dirname, '..', 'server.js');
let serverJs;
try {
  serverJs = fs.readFileSync(serverJsPath, 'utf8');
  console.log('✅ server.js found');
} catch (err) {
  errors.push(`❌ Cannot read server.js: ${err.message}`);
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Configuration Checks');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check 1: Node version consistency
if (packageJson && renderYaml) {
  const packageNodeVersion = packageJson.engines?.node;
  const renderNodeVersion = renderYaml.services?.[0]?.envVars?.find(
    v => v.key === 'NODE_VERSION'
  )?.value;

  if (packageNodeVersion && renderNodeVersion) {
    const packageMajor = packageNodeVersion.match(/(\d+)/)?.[1];
    const renderMajor = renderNodeVersion;

    if (packageMajor !== renderMajor) {
      errors.push(
        `❌ Node version mismatch: package.json (${packageNodeVersion}) vs render.yaml (${renderNodeVersion})`
      );
    } else {
      console.log(`✅ Node version consistent: ${renderMajor}.x`);
    }
  }
}

// Check 2: Start script exists
if (packageJson) {
  if (packageJson.scripts?.start) {
    console.log(`✅ Start script found: ${packageJson.scripts.start}`);
  } else {
    errors.push('❌ No "start" script in package.json');
  }
}

// Check 3: PORT configuration
if (serverJs) {
  if (serverJs.includes('process.env.PORT')) {
    console.log('✅ Server uses process.env.PORT');
  } else {
    warnings.push('⚠️  Server may not use process.env.PORT');
  }
}

// Check 4: Health check endpoint
if (serverJs) {
  if (serverJs.includes('/api/health')) {
    console.log('✅ Health check endpoint (/api/health) found');
  } else {
    errors.push('❌ No /api/health endpoint found');
  }
}

// Check 5: CORS configuration
if (serverJs) {
  if (serverJs.includes('ALLOWED_ORIGINS')) {
    console.log('✅ CORS uses ALLOWED_ORIGINS environment variable');
  } else {
    warnings.push('⚠️  CORS may not use ALLOWED_ORIGINS');
  }
}

// Check 6: Required environment variables
if (renderYaml) {
  const envVars = renderYaml.services?.[0]?.envVars || [];
  const requiredVars = ['NODE_ENV', 'PORT', 'ORCHESTRATOR_ENABLED'];

  requiredVars.forEach(varName => {
    if (envVars.find(v => v.key === varName)) {
      console.log(`✅ Environment variable defined: ${varName}`);
    } else {
      warnings.push(`⚠️  Missing environment variable: ${varName}`);
    }
  });
}

// Check 7: .gitignore
const gitignorePath = path.join(__dirname, '..', '.gitignore');
try {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  const required = ['node_modules', '.env'];

  required.forEach(item => {
    if (gitignore.includes(item)) {
      console.log(`✅ .gitignore contains: ${item}`);
    } else {
      warnings.push(`⚠️  .gitignore missing: ${item}`);
    }
  });
} catch (err) {
  warnings.push('⚠️  .gitignore not found');
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(err => console.log(`   ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(warn => console.log(`   ${warn}`));
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All configuration checks passed!');
  process.exit(0);
} else if (errors.length > 0) {
  console.log('❌ Configuration verification failed!');
  process.exit(1);
} else {
  console.log('⚠️  Configuration has warnings but is acceptable');
  process.exit(0);
}
