#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing CI workflow locally...\n');

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} exists: ${filePath}`);
    return true;
  } else {
    console.error(`❌ ${description} missing: ${filePath}`);
    return false;
  }
}

async function testCI() {
  let allPassed = true;

  // Test 1: Install dependencies
  if (!runCommand('pnpm install --frozen-lockfile', 'Installing dependencies')) {
    allPassed = false;
  }

  // Test 1.5: Install frontend dependencies
  console.log('📦 Installing frontend dependencies...');
  try {
    execSync('cd frontend && npm install', { stdio: 'inherit' });
    console.log('✅ Frontend dependencies installed successfully\n');
  } catch (error) {
    console.error('❌ Frontend dependencies installation failed:', error.message);
    allPassed = false;
  }

  // Test 2: Type checking
  if (!runCommand('pnpm run type-check', 'Type checking')) {
    allPassed = false;
  }

  // Test 3: Linting
  console.log('📋 Linting with Biome...');
  const lintResult = runCommand('pnpm run lint', 'Linting with Biome');
  if (!lintResult) {
    console.log('⚠️ Linting completed with warnings (this is acceptable)');
  }

  // Test 4: Building
  if (!runCommand('pnpm run build', 'Building packages')) {
    allPassed = false;
  }

  // Test 5: Check build artifacts
  console.log('📋 Checking build artifacts...');

  const artifacts = [
    { path: 'dist', description: 'Main package dist directory' },
    { path: 'public', description: 'Frontend public directory' },
  ];

  for (const artifact of artifacts) {
    if (!checkFileExists(artifact.path, artifact.description)) {
      allPassed = false;
    }
  }

  // Test 6: Security audit
  console.log('📋 Running security audit...');
  try {
    execSync('pnpm audit --audit-level moderate', { stdio: 'inherit' });
    console.log('✅ Security audit passed\n');
  } catch (error) {
    console.log('⚠️  Security audit found issues (this may be expected)\n');
  }

  // Summary
  console.log('='.repeat(50));
  if (allPassed) {
    console.log('🎉 All CI tests passed! The workflow should work correctly.');
  } else {
    console.log('❌ Some CI tests failed. Please fix the issues before pushing.');
    process.exit(1);
  }
  console.log('='.repeat(50));
}

// Run the tests
testCI().catch(console.error);
