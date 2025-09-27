#!/usr/bin/env node
// test-validation.js - Simple validation test runner

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Validation Tests...\n');

// Test backend validation
console.log('📡 Testing Backend Validation...');
const backendTest = spawn('npm', ['test', '--', '--testPathPattern=validation.test.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

backendTest.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Backend validation tests passed!\n');
  } else {
    console.log('❌ Backend validation tests failed!\n');
  }
  
  // Test frontend validation
  console.log('🎨 Testing Frontend Validation...');
  const frontendTest = spawn('npm', ['test', '--', '--testPathPattern=validation.test.js'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit'
  });
  
  frontendTest.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Frontend validation tests passed!\n');
      console.log('🎉 All validation tests completed successfully!');
    } else {
      console.log('❌ Frontend validation tests failed!\n');
      console.log('💡 Check the test output above for details.');
    }
  });
});

// Handle errors
backendTest.on('error', (err) => {
  console.error('❌ Error running backend tests:', err);
});

// Add test dependencies to package.json files if needed
const fs = require('fs');

// Check if backend has jest
const backendPackageJson = path.join(__dirname, 'backend', 'package.json');
if (fs.existsSync(backendPackageJson)) {
  const backendPkg = JSON.parse(fs.readFileSync(backendPackageJson, 'utf8'));
  if (!backendPkg.devDependencies?.jest) {
    console.log('📦 Adding Jest to backend dependencies...');
    backendPkg.devDependencies = {
      ...backendPkg.devDependencies,
      jest: '^29.0.0',
      supertest: '^6.3.0'
    };
    fs.writeFileSync(backendPackageJson, JSON.stringify(backendPkg, null, 2));
  }
}

// Check if frontend has jest
const frontendPackageJson = path.join(__dirname, 'frontend', 'package.json');
if (fs.existsSync(frontendPackageJson)) {
  const frontendPkg = JSON.parse(fs.readFileSync(frontendPackageJson, 'utf8'));
  if (!frontendPkg.devDependencies?.jest) {
    console.log('📦 Adding Jest to frontend dependencies...');
    frontendPkg.devDependencies = {
      ...frontendPkg.devDependencies,
      jest: '^29.0.0',
      '@testing-library/react': '^13.0.0',
      '@testing-library/jest-dom': '^5.16.0'
    };
    fs.writeFileSync(frontendPackageJson, JSON.stringify(frontendPkg, null, 2));
  }
}
