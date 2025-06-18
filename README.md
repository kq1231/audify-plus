# Audify-JS-Plus

**Made with ❤️ by VoiceHype, Alhamdulillah! Visit [voicehype.ai](https://voicehype.ai)**

<div align="center">
  <h3>🎙️ Develop with Your Voice using VoiceHype 🎙️</h3>
  
  <p>
    <strong>Stop Typing. Start Talking.</strong><br>
    Transcribe accurately, optimize with AI, and super-charge your workflow.
  </p>
  
  <p>
    <a href="https://marketplace.visualstudio.com/items?itemName=VoiceHype.voicehype">
      <img src="https://img.shields.io/badge/VS%20Code-Extension-blue?style=for-the-badge&logo=visualstudiocode" alt="VS Code Extension">
    </a>
    <a href="https://voicehype.ai">
      <img src="https://img.shields.io/badge/Learn%20More-voicehype.ai-green?style=for-the-badge" alt="Learn More">
    </a>
  </p>
</div>

Bismillahir Rahmanir Raheem (In the name of Allah, the Most Gracious, the Most Merciful)

Enhanced cross-platform audio I/O library with VS Code extension support. Based on the original [Audify](https://github.com/almoghamdani/audify) project with **pre-bundled** binaries.

## Motivation

We couldn't find any robust solution for audio I/O library that works seamlessly in VS Code extensions without going through the hassle of compiling binaries. Audify-JS-Plus addresses this by providing pre-built binaries for Windows, macOS, and Linux.

## ✨ Features

- **Cross-platform audio processing** - Works on Windows, macOS, and Linux
- **VS Code extension optimized** - Direct binary loading without file system operations
- **Opus encoding/decoding** - High-quality audio compression
- **RtAudio integration** - Real-time audio input/output
- **Zero dependencies** - All native binaries included

## 🚀 Installation

```bash
npm i @voicehype/audify-plus
```

## 📋 Supported Platforms

- **Windows**: x64, ia32
- **macOS**: x64, arm64 (Apple Silicon)
- **Linux**: x64, arm64, arm

## 🔧 Usage

### Opus Encode & Decode

```javascript
const { OpusEncoder, OpusDecoder, OpusApplication } = require("@voicehype/audify-plus");

// Init encoder and decoder
// Sample rate is 48kHz and the amount of channels is 2
// The opus coding mode is optimized for audio
const encoder = new OpusEncoder(48000, 2, OpusApplication.OPUS_APPLICATION_AUDIO);
const decoder = new OpusDecoder(48000, 2);

const frameSize = 1920; // 40ms
const buffer = ... // Your PCM audio buffer

// Encode and then decode
var encoded = encoder.encode(buffer, frameSize);
var decoded = decoder.decode(encoded, frameSize);
```

### Record Audio and Play it Back Realtime

```javascript
const { RtAudio, RtAudioFormat } = require("@voicehype/audify-plus");

// Init RtAudio instance using default sound API
const rtAudio = new RtAudio(/* Insert here specific API if needed */);

// Open the input/output stream
rtAudio.openStream(
  {
    deviceId: rtAudio.getDefaultOutputDevice(), // Output device id (Get all devices using `getDevices`)
    nChannels: 1, // Number of channels
    firstChannel: 0, // First channel index on device (default = 0).
  },
  {
    deviceId: rtAudio.getDefaultInputDevice(), // Input device id (Get all devices using `getDevices`)
    nChannels: 1, // Number of channels
    firstChannel: 0, // First channel index on device (default = 0).
  },
  RtAudioFormat.RTAUDIO_SINT16, // PCM Format - Signed 16-bit integer
  48000, // Sampling rate is 48kHz
  1920, // Frame size is 1920 (40ms)
  "MyStream", // The name of the stream (used for JACK Api)
  (pcm) => rtAudio.write(pcm) // Input callback function, write every input pcm data to the output buffer
);

// Start the stream
rtAudio.start();
```

### RtAudio Device Query

```javascript
const { RtAudio, RtAudioApi } = require("@voicehype/audify-plus");

const rtAudio = new RtAudio(RtAudioApi.RTAUDIO_API_UNSPECIFIED);
const devices = rtAudio.getDevices();
console.log('Available audio devices:', devices);
```

## 🎯 Constants

### Opus Application Types
```javascript
const { OpusApplication } = audify;
- OpusApplication.OPUS_APPLICATION_VOIP
- OpusApplication.OPUS_APPLICATION_AUDIO
- OpusApplication.OPUS_APPLICATION_RESTRICTED_LOWDELAY
```

### RtAudio APIs
```javascript
const { RtAudioApi } = audify;
- RtAudioApi.RTAUDIO_API_UNSPECIFIED
- RtAudioApi.RTAUDIO_API_LINUX_ALSA
- RtAudioApi.RTAUDIO_API_LINUX_PULSE
- RtAudioApi.RTAUDIO_API_MACOSX_CORE
- RtAudioApi.RTAUDIO_API_WINDOWS_WASAPI
// ... and more
```

## 📈 Performance

- **Zero runtime dependencies** - All binaries are prebuilt
- **Direct binary loading** - No file copying at runtime
- **Optimized for extensions** - Minimal file system operations
- **Cross-platform** - Native performance on all supported platforms

## 🤝 Contributing

This is an enhanced version of the original Audify project. For issues related to the core audio functionality, please refer to the [original Audify repository](https://github.com/almoghamdani/audify).

For issues specific to audify-plus enhancements:
1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Test across platforms
5. Submit a pull request

## 📄 License

MIT License - same as the original Audify project.

## 🙏 Acknowledgments

- Original [Audify](https://github.com/almoghamdani/audify) project by [almoghamdani](https://github.com/almoghamdani)
- The Opus codec team
- The RtAudio library developers

## 📚 API Reference

### Classes

#### `OpusEncoder`
- `constructor(sampleRate, channels, application)`
- `encode(buffer)` - Encode PCM audio to Opus
- `destroy()` - Clean up encoder resources

#### `OpusDecoder`
- `constructor(sampleRate, channels)`
- `decode(buffer)` - Decode Opus audio to PCM
- `destroy()` - Clean up decoder resources

#### `RtAudio`
- `constructor(api)`
- `getDevices()` - Get available audio devices
- `openStream(outputParams, inputParams, format, sampleRate, bufferFrames, callback)`
- `closeStream()` - Close audio stream
- `startStream()` - Start audio processing
- `stopStream()` - Stop audio processing

---

**Made with ❤️ by VoiceHype, Alhamdulillah! Visit [voicehype.ai](https://voicehype.ai)**