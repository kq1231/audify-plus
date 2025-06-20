const os = require("os");
const path = require("path");

const platform = os.platform(); // 'win32', 'darwin', 'linux'
const arch = os.arch(); // 'x64', 'arm64', etc.

const platformMap = {
  "win32-x64": "win32-x64",
  "win32-ia32": "win32-ia32",
  "darwin-x64": "darwin-x64",
  "darwin-arm64": "darwin-arm64",
  "linux-x64": "linux-x64",
  "linux-arm64": "linux-arm64",
  "linux-arm": "linux-arm",
};

const key = `${platform}-${arch}`;
const folder = platformMap[key];

if (!folder) {
  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

const binaryPath = path.join(__dirname, "prebuilds", folder, "build", "Release", "audify.node");

const rawAudify = require(binaryPath);

const OpusApplication = {
  OPUS_APPLICATION_VOIP: 2048,
  OPUS_APPLICATION_AUDIO: 2049,
  OPUS_APPLICATION_RESTRICTED_LOWDELAY: 2051
};

const RtAudioApi = {
  UNSPECIFIED: 0,
  MACOSX_CORE: 1,
  LINUX_ALSA: 2,
  UNIX_JACK: 3,
  LINUX_PULSE: 4,
  LINUX_OSS: 5,
  WINDOWS_ASIO: 6,
  WINDOWS_WASAPI: 7,
  WINDOWS_DS: 8,
  RTAUDIO_DUMMY: 9
};

const RtAudioFormat = {
  RTAUDIO_SINT8: 0x1,
  RTAUDIO_SINT16: 0x2,
  RTAUDIO_SINT24: 0x4,
  RTAUDIO_SINT32: 0x8,
  RTAUDIO_FLOAT32: 0x10,
  RTAUDIO_FLOAT64: 0x20
};

const RtAudioStreamFlags = {
  RTAUDIO_NONINTERLEAVED: 0x1,
  RTAUDIO_MINIMIZE_LATENCY: 0x2,
  RTAUDIO_HOG_DEVICE: 0x4,
  RTAUDIO_SCHEDULE_REALTIME: 0x8,
  RTAUDIO_ALSA_USE_DEFAULT: 0x10,
  RTAUDIO_JACK_DONT_CONNECT: 0x20
};

const RtAudioErrorType = {
  WARNING: 0,
  DEBUG_WARNING: 1,
  UNSPECIFIED: 2,
  NO_DEVICES_FOUND: 3,
  INVALID_DEVICE: 4,
  MEMORY_ERROR: 5,
  INVALID_PARAMETER: 6,
  INVALID_USE: 7,
  DRIVER_ERROR: 8,
  SYSTEM_ERROR: 9,
  THREAD_ERROR: 10,
};

exports = module.exports = { ...rawAudify, OpusApplication, RtAudioApi, RtAudioFormat, RtAudioStreamFlags, RtAudioErrorType };