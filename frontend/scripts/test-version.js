#!/usr/bin/env node

// Test script to generate version info locally
const { generateVersion } = require('./generate-version.js');

console.log('Generating version info...');
const versionInfo = generateVersion();
console.log('Version info generated successfully!');
console.log(JSON.stringify(versionInfo, null, 2));
