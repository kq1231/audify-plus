#!/usr/bin/env node

/**
 * Download and organize Audify binaries from GitHub releases
 * This script downloads all platform binaries and organizes them properly
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RELEASE_VERSION = 'v1.9.0';
const BASE_URL = `https://github.com/almoghamdani/audify/releases/download/${RELEASE_VERSION}`;

// Define all available binaries with their target paths
const BINARIES = [
  // NAPI v8 (most compatible with modern Node.js)
  { file: 'audify-v1.9.0-napi-v8-darwin-arm64.tar.gz', platform: 'darwin-arm64' },
  { file: 'audify-v1.9.0-napi-v8-darwin-x64.tar.gz', platform: 'darwin-x64' },
  { file: 'audify-v1.9.0-napi-v8-linux-arm.tar.gz', platform: 'linux-arm' },
  { file: 'audify-v1.9.0-napi-v8-linux-arm64.tar.gz', platform: 'linux-arm64' },
  { file: 'audify-v1.9.0-napi-v8-linux-x64.tar.gz', platform: 'linux-x64' },
  { file: 'audify-v1.9.0-napi-v8-win32-ia32.tar.gz', platform: 'win32-ia32' },
  { file: 'audify-v1.9.0-napi-v8-win32-x64.tar.gz', platform: 'win32-x64' },
];

// Fallback binaries for older Node.js versions
const FALLBACK_BINARIES = [
  // NAPI v6 (for older Node.js)
  { file: 'audify-v1.9.0-napi-v6-darwin-arm64.tar.gz', platform: 'darwin-arm64', napi: 'v6' },
  { file: 'audify-v1.9.0-napi-v6-darwin-x64.tar.gz', platform: 'darwin-x64', napi: 'v6' },
  { file: 'audify-v1.9.0-napi-v6-linux-arm.tar.gz', platform: 'linux-arm', napi: 'v6' },
  { file: 'audify-v1.9.0-napi-v6-linux-arm64.tar.gz', platform: 'linux-arm64', napi: 'v6' },
  { file: 'audify-v1.9.0-napi-v6-linux-x64.tar.gz', platform: 'linux-x64', napi: 'v6' },
  { file: 'audify-v1.9.0-napi-v6-win32-ia32.tar.gz', platform: 'win32-ia32', napi: 'v6' },
  { file: 'audify-v1.9.0-napi-v6-win32-x64.tar.gz', platform: 'win32-x64', napi: 'v6' },
];

function createDirectories() {
  console.log('📁 Creating directory structure...');
  
  const dirs = [
    'downloads',
    'prebuilds',
    'scripts'
  ];
  
  // Create platform-specific directories
  BINARIES.forEach(({ platform }) => {
    dirs.push(`prebuilds/${platform}`);
    dirs.push(`prebuilds/${platform}/build`);
    dirs.push(`prebuilds/${platform}/build/Release`);
  });
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✅ Created: ${dir}`);
    }
  });
}

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`⬇️  Downloading: ${path.basename(url)}`);
    
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`  ✅ Downloaded: ${path.basename(outputPath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

function extractTarGz(tarPath, extractTo) {
  console.log(`📦 Extracting: ${path.basename(tarPath)} -> ${extractTo}`);
  
  try {
    // Use tar command (works on Unix and Windows with Git Bash)
    execSync(`tar -xzf "${tarPath}" -C "${extractTo}"`, { stdio: 'inherit' });
    console.log(`  ✅ Extracted: ${path.basename(tarPath)}`);
  } catch (error) {
    console.error(`  ❌ Failed to extract ${tarPath}:`, error.message);
    throw error;
  }
}

function findAndMoveNodeFile(extractDir, targetPath) {
  console.log(`🔍 Looking for .node file in: ${extractDir}`);
  
  function findNodeFile(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const found = findNodeFile(fullPath);
        if (found) return found;
      } else if (file.endsWith('.node')) {
        console.log(`  🎯 Found: ${fullPath}`);
        return fullPath;
      }
    }
    return null;
  }
  
  const nodeFile = findNodeFile(extractDir);
  if (nodeFile) {
    fs.copyFileSync(nodeFile, targetPath);
    console.log(`  ✅ Moved to: ${targetPath}`);
    return true;
  } else {
    console.error(`  ❌ No .node file found in ${extractDir}`);
    return false;
  }
}

async function downloadAndOrganizeBinaries() {
  console.log('🚀 Starting binary download and organization...\n');
  
  createDirectories();
  
  for (const binary of BINARIES) {
    const { file, platform } = binary;
    const url = `${BASE_URL}/${file}`;
    const downloadPath = path.join('downloads', file);
    const extractDir = path.join('downloads', `extract-${platform}`);
    const targetPath = path.join('prebuilds', platform, 'build', 'Release', 'audify.node');
    
    try {
      console.log(`\n📋 Processing: ${platform}`);
      
      // Download
      if (!fs.existsSync(downloadPath)) {
        await downloadFile(url, downloadPath);
      } else {
        console.log(`  ⏭️  Already downloaded: ${file}`);
      }
      
      // Extract
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }
      fs.mkdirSync(extractDir, { recursive: true });
      
      extractTarGz(downloadPath, extractDir);
      
      // Find and move .node file
      const success = findAndMoveNodeFile(extractDir, targetPath);
      if (!success) {
        throw new Error(`Failed to find .node file for ${platform}`);
      }
      
      // Cleanup extraction directory
      fs.rmSync(extractDir, { recursive: true, force: true });
      
      console.log(`  🎉 Completed: ${platform}`);
      
    } catch (error) {
      console.error(`\n❌ Failed to process ${platform}:`, error.message);
      console.error('This platform will not be available in the package.\n');
    }
  }
  
  console.log('\n🎊 Binary organization complete!');
  console.log('\n📊 Summary:');
  
  // Check which platforms are available
  BINARIES.forEach(({ platform }) => {
    const targetPath = path.join('prebuilds', platform, 'build', 'Release', 'audify.node');
    const exists = fs.existsSync(targetPath);
    console.log(`  ${exists ? '✅' : '❌'} ${platform}: ${exists ? 'Ready' : 'Missing'}`);
  });
  
  console.log('\n🔧 Next steps:');
  console.log('  1. Update your package.json');
  console.log('  2. Replace your index.js with the enhanced version');
  console.log('  3. Add the postinstall script');
  console.log('  4. Test with: npm run health-check');
  console.log('  5. Publish with: npm publish');
}

// Handle both direct execution and require()
if (require.main === module) {
  downloadAndOrganizeBinaries().catch(error => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  downloadAndOrganizeBinaries,
  BINARIES
};