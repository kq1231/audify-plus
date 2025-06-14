/**
 * Binary Check Script
 * This script verifies that the prebuilt binaries are available and working
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Platform mapping for prebuilt binaries
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

function getBinaryPath() {
  const platform = os.platform();
  const arch = os.arch();
  const key = `${platform}-${arch}`;
  
  console.log(`[Audify-Prebuilt] Detecting platform: ${key}`);
  
  const platformFolder = PLATFORM_MAP[key];
  if (!platformFolder) {
    const supportedPlatforms = Object.keys(PLATFORM_MAP).join(", ");
    console.error(
      `[Audify-Prebuilt] ⚠️ Warning: Unsupported platform: ${key}. ` +
      `Supported platforms: ${supportedPlatforms}`
    );
    return null;
  }
  
  const binaryPath = path.join(
    __dirname, 
    "..",
    "prebuilds", 
    platformFolder, 
    "build", 
    "Release", 
    "audify.node"
  );
  
  console.log(`[Audify-Prebuilt] Binary path: ${binaryPath}`);
  return binaryPath;
}

function verifyBinary(binaryPath) {
  if (!binaryPath) return false;
  
  try {
    if (!fs.existsSync(binaryPath)) {
      console.error(`[Audify-Prebuilt] ⚠️ Binary not found: ${binaryPath}`);
      return false;
    }
    
    // Check if file is readable
    fs.accessSync(binaryPath, fs.constants.R_OK);
    console.log(`[Audify-Prebuilt] ✅ Binary verified: ${binaryPath}`);
    
    // Check if additional files like DLLs exist
    const binaryDir = path.dirname(binaryPath);
    const files = fs.readdirSync(binaryDir);
    console.log(`[Audify-Prebuilt] Found ${files.length} files in binary directory`);
    
    // Check for .dll files on Windows
    if (os.platform() === 'win32') {
      const dllFiles = files.filter(f => f.endsWith('.dll'));
      if (dllFiles.length > 0) {
        console.log(`[Audify-Prebuilt] ✅ Found ${dllFiles.length} DLL files`);
        dllFiles.forEach(dll => console.log(`   - ${dll}`));
      } else {
        console.warn(`[Audify-Prebuilt] ⚠️ Warning: No DLL files found, this may cause issues on Windows`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[Audify-Prebuilt] ❌ Binary verification failed:`, error.message);
    return false;
  }
}

// Main execution
const binaryPath = getBinaryPath();
const isValid = verifyBinary(binaryPath);

if (isValid) {
  console.log('[Audify-Prebuilt] ✅ Installation successful - prebuilt binaries are ready to use');
} else {
  console.error('[Audify-Prebuilt] ❌ Installation warning - prebuilt binaries may not work correctly');
  console.error('[Audify-Prebuilt] Please report this issue with your platform details:');
  console.error(`   - Platform: ${os.platform()}`);
  console.error(`   - Architecture: ${os.arch()}`);
  console.error(`   - Node.js: ${process.version}`);
}
