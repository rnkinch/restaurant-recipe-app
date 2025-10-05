#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get git information
function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const shortCommit = commit.substring(0, 7);
    return { commit, shortCommit, branch };
  } catch (error) {
    console.warn('Could not get git info:', error.message);
    return { commit: 'unknown', shortCommit: 'unknown', branch: 'unknown' };
  }
}

// Get package.json version
function getPackageVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version || '1.0.0';
  } catch (error) {
    console.warn('Could not read package.json:', error.message);
    return '1.0.0';
  }
}

// Generate version information
function generateVersion() {
  const gitInfo = getGitInfo();
  const packageVersion = getPackageVersion();
  const buildDate = new Date().toISOString();
  const environment = process.env.NODE_ENV || 'development';

  const versionInfo = {
    version: packageVersion,
    buildDate: buildDate,
    gitCommit: gitInfo.commit,
    gitShortCommit: gitInfo.shortCommit,
    gitBranch: gitInfo.branch,
    environment: environment,
    buildTimestamp: Date.now()
  };

  // Write to public/version.json
  const outputPath = path.join(__dirname, '..', 'public', 'version.json');
  fs.writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));
  
  console.log('Version info generated:', versionInfo);
  return versionInfo;
}

// Run if called directly
if (require.main === module) {
  generateVersion();
}

module.exports = { generateVersion, getGitInfo, getPackageVersion };
