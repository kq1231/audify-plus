#!/usr/bin/env node

/**
 * Post-install script for Audify-JS-Plus
 * Handles binary permissions and verification
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('[Audify-JS-Plus] Running post-install setup...');

// Platform mapping (same as in index.js)
const PLATFORM_MAP = {
  "win32-x64": "win32-x64",
  "win32-ia32": "win32-ia32", 
  "win32-arm64": "win32-arm64",
  "darwin-x64": "darwin-x64",
  "darwin-arm64": "darwin-arm64",
  "linux-x64": "linux-x64",
  "linux-arm64": "linux-arm64",
  "linux-arm": "linux-arm",
};

function getCurrentPlatform() {
  const platform = os.platform();
  const arch = os.arch();
  return `${platform}-${arch}`;
}

function getBinaryPath() {
  const key = getCurrentPlatform();
  const platformFolder = PLATFORM_MAP[key];
  
  if (!platformFolder) {
    console.warn(`[Audify-JS-Plus] Warning: Unsupported platform ${key}`);
    return null;
  }
  
  return path.join(
    __dirname, 
    '..', 
    'prebuilds', 
    platformFolder, 
    'build', 
    'Release', 
    'audify.node'
  );
}

function setBinaryPermissions(binaryPath) {
  // Only set permissions on Unix-like systems
  if (process.platform === 'win32') {
    console.log('[Audify-JS-Plus] Windows detected, skipping permission setup');
    return true;
  }
  
  try {
    if (!fs.existsSync(binaryPath)) {
      console.warn(`[Audify-JS-Plus] Warning: Binary not found at ${binaryPath}`);
      return false;
    }
    
    // Make binary executable (755 = rwxr-xr-x)
    fs.chmodSync(binaryPath, 0o755);
    console.log(`[Audify-JS-Plus] Set executable permissions for ${binaryPath}`);
    return true;
  } catch (error) {
    console.error(`[Audify-JS-Plus] Failed to set permissions:`, error.message);
    return false;
  }
}

function runHealthCheck() {
  try {
    const audify = require('../index.js');
    const health = audify.healthCheck();
    
    console.log('[Audify-JS-Plus] Health check results:');
    console.log(JSON.stringify(health, null, 2));
    
    if (health.status === 'healthy') {
      console.log('✅ [Audify-JS-Plus] Installation successful!');
      return true;
    } else {
      console.warn('⚠️  [Audify-JS-Plus] Installation completed with warnings');
      return false;
    }
  } catch (error) {
    console.error('❌ [Audify-JS-Plus] Installation failed:', error.message);
    return false;
  }
}

function main() {
  const platform = getCurrentPlatform();
  console.log(`[Audify-JS-Plus] Platform: ${platform}`);
  
  const binaryPath = getBinaryPath();
  if (!binaryPath) {
    console.warn(`[Audify-JS-Plus] No binary available for platform ${platform}`);
    console.warn('[Audify-JS-Plus] The package may not work on this platform');
    return;
  }
  
  console.log(`[Audify-JS-Plus] Binary path: ${binaryPath}`);
  
  // Set binary permissions
  setBinaryPermissions(binaryPath);
  
  // Run health check
  setTimeout(() => {
    console.log('[Audify-JS-Plus] Running health check...');
    runHealthCheck();
  }, 100);
}

// Handle both direct execution and require()
if (require.main === module) {
  main();
}

module.exports = {
  setBinaryPermissions,
  getBinaryPath,
  runHealthCheck,
  getCurrentPlatform
};