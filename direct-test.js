/**
 * Simple direct test for the audify module
 * Bypassing the index.js loader
 */

const fs = require('fs');
const path = require('path');

// Copy the binary to the root directory for a simpler path
const sourcePath = path.join(
  __dirname, 
  'prebuilds', 
  'win32-x64', 
  'build', 
  'Release', 
  'audify.node'
);

const destPath = path.join(__dirname, 'audify.node');

try {
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Copied binary to ${destPath}`);
} catch (error) {
  console.error(`Failed to copy binary: ${error.message}`);
  process.exit(1);
}

try {
  console.log('Attempting to load the native module directly...');
  const audify = require('./audify.node');
  console.log('Module loaded successfully!');
  console.log('Exports:', Object.keys(audify));
  
  // Try to use a simple function if available
  if (audify.getAvailableApis) {
    console.log('Available APIs:', audify.getAvailableApis());
  }
} catch (error) {
  console.error('Failed to load the module:', error);
}

// Clean up
fs.unlinkSync(destPath);
console.log('Cleaned up temporary file');
