const os = require("os");
const path = require("path");
const fs = require("fs");

/**
 * Audify-JS-Plus - Enhanced version with direct binary loading
 * Cross-platform audio processing for Node.js and VS Code extensions
 * 
 * Based on the original Audify project with improvements for:
 * - VS Code extension compatibility
 * - Direct binary loading without file copying
 * - Better error handling and fallbacks
 */

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

// Opus Application Constants
const OpusApplication = {
  OPUS_APPLICATION_VOIP: 2048,
  OPUS_APPLICATION_AUDIO: 2049,
  OPUS_APPLICATION_RESTRICTED_LOWDELAY: 2051,
};

// RtAudio API Constants
const RtAudioApi = {
  RTAUDIO_API_UNSPECIFIED: 0,
  RTAUDIO_API_LINUX_ALSA: 1,
  RTAUDIO_API_LINUX_PULSE: 2,
  RTAUDIO_API_LINUX_OSS: 3,
  RTAUDIO_API_UNIX_JACK: 4,
  RTAUDIO_API_MACOSX_CORE: 5,
  RTAUDIO_API_WINDOWS_WASAPI: 6,
  RTAUDIO_API_WINDOWS_ASIO: 7,
  RTAUDIO_API_WINDOWS_DS: 8,
  RTAUDIO_API_RTAUDIO_DUMMY: 9,
};

// RtAudio Format Constants
const RtAudioFormat = {
  RTAUDIO_FORMAT_SINT8: 1,
  RTAUDIO_FORMAT_SINT16: 2,
  RTAUDIO_FORMAT_SINT24: 4,
  RTAUDIO_FORMAT_SINT32: 8,
  RTAUDIO_FORMAT_FLOAT32: 16,
  RTAUDIO_FORMAT_FLOAT64: 32,
};

// RtAudio Stream Flags
const RtAudioStreamFlags = {
  RTAUDIO_FLAGS_NONINTERLEAVED: 1,
  RTAUDIO_FLAGS_MINIMIZE_LATENCY: 2,
  RTAUDIO_FLAGS_HOG_DEVICE: 4,
  RTAUDIO_FLAGS_SCHEDULE_REALTIME: 8,
  RTAUDIO_FLAGS_ALSA_USE_DEFAULT: 16,
  RTAUDIO_FLAGS_JACK_DONT_CONNECT: 32,
};

// RtAudio Error Types
const RtAudioErrorType = {
  RTAUDIO_ERROR_WARNING: 0,
  RTAUDIO_ERROR_DEBUG_WARNING: 1,
  RTAUDIO_ERROR_UNSPECIFIED: 2,
  RTAUDIO_ERROR_NO_DEVICES_FOUND: 3,
  RTAUDIO_ERROR_INVALID_DEVICE: 4,
  RTAUDIO_ERROR_MEMORY_ERROR: 5,
  RTAUDIO_ERROR_INVALID_PARAMETER: 6,
  RTAUDIO_ERROR_INVALID_USE: 7,
  RTAUDIO_ERROR_DRIVER_ERROR: 8,
  RTAUDIO_ERROR_SYSTEM_ERROR: 9,
  RTAUDIO_ERROR_THREAD_ERROR: 10,
};

/**
 * Get the platform-specific binary path
 * @returns {string} Path to the appropriate binary
 */
function getBinaryPath() {
  const platform = os.platform();
  const arch = os.arch();
  const key = `${platform}-${arch}`;
  
  console.log(`[Audify-JS-Plus] Detecting platform: ${key}`);
  
  const platformFolder = PLATFORM_MAP[key];
  if (!platformFolder) {
    const supportedPlatforms = Object.keys(PLATFORM_MAP).join(", ");
    throw new Error(
      `[Audify-JS-Plus] Unsupported platform: ${key}. ` +
      `Supported platforms: ${supportedPlatforms}`
    );
  }
  
  const binaryPath = path.join(
    __dirname, 
    "prebuilds", 
    platformFolder, 
    "build", 
    "Release", 
    "audify.node"
  );
  
  console.log(`[Audify-JS-Plus] Binary path: ${binaryPath}`);
  return binaryPath;
}

/**
 * Verify that the binary exists and is accessible
 * @param {string} binaryPath Path to the binary
 * @returns {boolean} True if binary is accessible
 */
function verifyBinary(binaryPath) {
  try {
    if (!fs.existsSync(binaryPath)) {
      console.error(`[Audify-JS-Plus] Binary not found: ${binaryPath}`);
      return false;
    }
    
    // Check if file is readable
    fs.accessSync(binaryPath, fs.constants.R_OK);
    console.log(`[Audify-JS-Plus] Binary verified: ${binaryPath}`);
    return true;
  } catch (error) {
    console.error(`[Audify-JS-Plus] Binary verification failed:`, error.message);
    return false;
  }
}

/**
 * Load the native Audify module
 * @returns {Object} The loaded native module
 */
function loadNativeModule() {
  const binaryPath = getBinaryPath();
  
  if (!verifyBinary(binaryPath)) {
    throw new Error(
      `[Audify-JS-Plus] Cannot load binary: ${binaryPath}. ` +
      `Please ensure the binary exists and is accessible.`
    );
  }
  
  try {
    console.log(`[Audify-JS-Plus] Loading native module...`);
    const nativeModule = require(binaryPath);
    console.log(`[Audify-JS-Plus] Native module loaded successfully`);
    return nativeModule;
  } catch (error) {
    console.error(`[Audify-JS-Plus] Failed to load native module:`, error);
    throw new Error(
      `[Audify-JS-Plus] Failed to load native module from ${binaryPath}: ${error.message}`
    );
  }
}

// Load the native module
let rawAudify;
try {
  rawAudify = loadNativeModule();
} catch (error) {
  console.error(`[Audify-JS-Plus] Initialization failed:`, error.message);
  
  // In VS Code extension context, provide a more helpful error
  if (typeof process !== 'undefined' && process.env.VSCODE_PID) {
    throw new Error(
      `[Audify-JS-Plus] Failed to initialize in VS Code extension. ` +
      `This might be due to missing native binaries or platform incompatibility. ` +
      `Original error: ${error.message}`
    );
  }
  
  throw error;
}

/**
 * Enhanced error handling wrapper
 * @param {Function} fn Function to wrap
 * @param {string} functionName Name of the function for error reporting
 * @returns {Function} Wrapped function with error handling
 */
function withErrorHandling(fn, functionName) {
  return function(...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      console.error(`[Audify-JS-Plus] Error in ${functionName}:`, error);
      throw error;
    }
  };
}

// Export everything with enhanced error handling
const audifyExports = {
  // Native module functions (with error handling if they exist)
  ...rawAudify,
  
  // Constants
  OpusApplication,
  RtAudioApi,
  RtAudioFormat,
  RtAudioStreamFlags,
  RtAudioErrorType,
  
  // Utility functions
  getPlatformInfo: () => ({
    platform: os.platform(),
    arch: os.arch(),
    key: `${os.platform()}-${os.arch()}`,
    binaryPath: getBinaryPath()
  }),
  
  // Version info
  version: require('./package.json').version || '1.0.0',
  
  // Health check function
  healthCheck: () => {
    try {
      const binaryPath = getBinaryPath();
      const exists = verifyBinary(binaryPath);
      return {
        status: exists ? 'healthy' : 'unhealthy',
        platform: `${os.platform()}-${os.arch()}`,
        binaryPath,
        binaryExists: exists
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        platform: `${os.platform()}-${os.arch()}`
      };
    }
  }
};

// Add error handling to native functions if they exist
if (rawAudify) {
  Object.keys(rawAudify).forEach(key => {
    if (typeof rawAudify[key] === 'function') {
      audifyExports[key] = withErrorHandling(rawAudify[key], key);
    }
  });
}

module.exports = audifyExports;