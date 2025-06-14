/**
 * Audio Recording Test for Audify
 * 
 * This script demonstrates how to:
 * 1. Record audio from the default input device
 * 2. Save the recorded audio to a buffer
 * 3. Play back the recorded audio
 * 4. Optionally encode/decode using Opus codec
 */

const { RtAudio, RtAudioFormat, OpusEncoder, OpusDecoder, OpusApplication } = require('./index');
const fs = require('fs');
const path = require('path');

// Test configuration
const SAMPLE_RATE = 48000;
const CHANNELS = 1;
const FRAME_SIZE = 1920; // 40ms at 48kHz
const RECORD_DURATION_MS = 5000; // Record for 5 seconds
const SAVE_TO_FILE = true; // Whether to save recorded audio to file
const USE_OPUS_ENCODING = false; // Whether to use Opus encoding/decoding

// Calculate total frames needed for recording duration
const TOTAL_FRAMES = Math.ceil(RECORD_DURATION_MS / 40); // 40ms per frame

console.log('Audify Recording Test');
console.log('============================');

// Print platform information
try {
  // Simpler platform info since getPlatformInfo isn't available
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
} catch (error) {
  console.error('Failed to get platform info:', error.message);
}

// Check audio devices
const rtAudio = new RtAudio();
console.log('\nAvailable audio devices:');

const devices = rtAudio.getDevices();
devices.forEach((device, index) => {
  console.log(`[${index}] ${device.name} (${device.outputChannels} outputs, ${device.inputChannels} inputs)`);
  console.log(`    Default output: ${device.isDefaultOutput}, Default input: ${device.isDefaultInput}`);
});

// Safely get default devices with error handling
let inputDeviceId, outputDeviceId;
try {
  inputDeviceId = rtAudio.getDefaultInputDevice();
  console.log('\nUsing input device:', devices[inputDeviceId].name);
} catch (error) {
  console.error('Error getting default input device:', error.message);
  // Find first device with input channels
  inputDeviceId = devices.findIndex(d => d.inputChannels > 0);
  if (inputDeviceId >= 0) {
    console.log('\nFallback to input device:', devices[inputDeviceId].name);
  } else {
    console.error('No input device found. Recording will not work!');
    inputDeviceId = 0;
  }
}

try {
  outputDeviceId = rtAudio.getDefaultOutputDevice();
  console.log('Using output device:', devices[outputDeviceId].name);
} catch (error) {
  console.error('Error getting default output device:', error.message);
  // Find first device with output channels
  outputDeviceId = devices.findIndex(d => d.outputChannels > 0);
  if (outputDeviceId >= 0) {
    console.log('Fallback to output device:', devices[outputDeviceId].name);
  } else {
    console.error('No output device found. Playback will not work!');
    outputDeviceId = 0;
  }
}

// Initialize Opus encoder/decoder if needed
let encoder, decoder;
if (USE_OPUS_ENCODING) {
  encoder = new OpusEncoder(SAMPLE_RATE, CHANNELS, OpusApplication.OPUS_APPLICATION_AUDIO);
  decoder = new OpusDecoder(SAMPLE_RATE, CHANNELS);
  console.log('\nInitialized Opus encoder and decoder');
}

// Create buffer to store recorded audio
let recordedFrames = [];
let frameCount = 0;
let isRecording = true;
let isPlaying = false;

console.log('\nStarting recording for', RECORD_DURATION_MS/1000, 'seconds...');

// Open the input stream for recording
rtAudio.openStream(
  null, // No output parameters for recording
  {
    deviceId: inputDeviceId,
    nChannels: CHANNELS,
    firstChannel: 0,
  },
  RtAudioFormat.RTAUDIO_SINT16, // PCM Format - Signed 16-bit integer
  SAMPLE_RATE,
  FRAME_SIZE,
  "RecordingStream",
  (pcmData) => {
    if (isRecording) {
      // Store the PCM data
      const frameCopy = Buffer.from(pcmData);
      
      // Optionally encode with Opus
      if (USE_OPUS_ENCODING) {
        const encoded = encoder.encode(frameCopy, FRAME_SIZE);
        recordedFrames.push(encoded);
      } else {
        recordedFrames.push(frameCopy);
      }
      
      frameCount++;
      process.stdout.write(`\rRecording... Frame ${frameCount}/${TOTAL_FRAMES}`);
      
      // Stop recording after specified duration
      if (frameCount >= TOTAL_FRAMES) {
        isRecording = false;
        rtAudio.stop();
        rtAudio.closeStream();
        
        console.log('\n\nRecording complete!');
        playbackRecording();
      }
    }
  }
);

// Start recording
rtAudio.start();

// Function to play back the recorded audio
function playbackRecording() {
  console.log('Preparing for playback...');
  
  // If we need to save to file
  if (SAVE_TO_FILE) {
    saveRecordingToFile();
  }
  
  // Create a new RtAudio instance for playback
  const playbackRtAudio = new RtAudio();
  let playbackFrameIndex = 0;
  isPlaying = true;
  
  console.log('Starting playback...');
  
  // Open the output stream for playback
  playbackRtAudio.openStream(
    {
      deviceId: outputDeviceId,
      nChannels: CHANNELS,
      firstChannel: 0,
    },
    null, // No input parameters for playback
    RtAudioFormat.RTAUDIO_SINT16,
    SAMPLE_RATE,
    FRAME_SIZE,
    "PlaybackStream",
    () => {
      if (playbackFrameIndex < recordedFrames.length) {
        process.stdout.write(`\rPlaying... Frame ${playbackFrameIndex + 1}/${recordedFrames.length}`);
        
        let dataToPlay;
        if (USE_OPUS_ENCODING) {
          // Decode the opus data
          dataToPlay = decoder.decode(recordedFrames[playbackFrameIndex], FRAME_SIZE);
        } else {
          dataToPlay = recordedFrames[playbackFrameIndex];
        }
        
        playbackFrameIndex++;
        return dataToPlay;
      } else {
        // Playback complete
        console.log('\n\nPlayback complete!');
        playbackRtAudio.stop();
        playbackRtAudio.closeStream();
        process.exit(0);
      }
    }
  );
  
  // Start playback
  playbackRtAudio.start();
}

// Function to save recording to file
function saveRecordingToFile() {
  const outputDir = path.join(__dirname, 'recordings');
  
  // Create recordings directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFilename = path.join(outputDir, `recording-${timestamp}.pcm`);
  
  // Combine all buffers
  let allPcmData;
  if (USE_OPUS_ENCODING) {
    // Decode all frames first
    const decodedFrames = recordedFrames.map(frame => 
      decoder.decode(frame, FRAME_SIZE)
    );
    allPcmData = Buffer.concat(decodedFrames);
  } else {
    allPcmData = Buffer.concat(recordedFrames);
  }
  
  // Write to file
  fs.writeFileSync(outputFilename, allPcmData);
  console.log(`Recording saved to ${outputFilename}`);
  
  // Also save a WAV file header information (minimal WAV header)
  const wavFilename = outputFilename.replace('.pcm', '.wav');
  
  // Create WAV header
  const dataSize = allPcmData.length;
  const headerSize = 44;
  const wavBuffer = Buffer.alloc(headerSize + dataSize);
  
  // RIFF identifier
  wavBuffer.write('RIFF', 0);
  // file size
  wavBuffer.writeUInt32LE(36 + dataSize, 4);
  // RIFF type
  wavBuffer.write('WAVE', 8);
  // format chunk identifier
  wavBuffer.write('fmt ', 12);
  // format chunk length
  wavBuffer.writeUInt32LE(16, 16);
  // sample format (1 is PCM)
  wavBuffer.writeUInt16LE(1, 20);
  // channel count
  wavBuffer.writeUInt16LE(CHANNELS, 22);
  // sample rate
  wavBuffer.writeUInt32LE(SAMPLE_RATE, 24);
  // byte rate (sample rate * block align)
  wavBuffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * 2, 28);
  // block align (channel count * bytes per sample)
  wavBuffer.writeUInt16LE(CHANNELS * 2, 32);
  // bits per sample
  wavBuffer.writeUInt16LE(16, 34);
  // data chunk identifier
  wavBuffer.write('data', 36);
  // data chunk length
  wavBuffer.writeUInt32LE(dataSize, 40);
  
  // Copy audio data after header
  allPcmData.copy(wavBuffer, 44);
  
  // Write WAV file
  fs.writeFileSync(wavFilename, wavBuffer);
  console.log(`WAV file saved to ${wavFilename}`);
}

// Handle cleanup on process exit
process.on('SIGINT', () => {
  console.log('\nInterrupted. Cleaning up...');
  if (rtAudio.isStreamOpen()) {
    rtAudio.stop();
    rtAudio.closeStream();
  }
  process.exit(0);
});