import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Converts an AudioBuffer to a WAV format Blob
 */
export function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = audioBuffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = result.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length minus RIFF identifier and length bytes */
  view.setUint32(4, 36 + dataLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataLength, true);

  // Write PCM samples (16-bit signed integer)
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Converts an AudioBuffer to an MP3 format Blob using Mp3Encoder
 */
export function audioBufferToMp3(audioBuffer: AudioBuffer, kbps = 192): Blob {
  try {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    
    const encoder = new Mp3Encoder(numChannels > 1 ? 2 : 1, sampleRate, kbps);
    const mp3Data: Uint8Array[] = [];

    const leftChannel = audioBuffer.getChannelData(0);
    const leftInt16 = floatTo16BitPCM(leftChannel);

    if (numChannels > 1) {
      const rightChannel = audioBuffer.getChannelData(1);
      const rightInt16 = floatTo16BitPCM(rightChannel);
      const blockSize = 1152;
      for (let i = 0; i < leftInt16.length; i += blockSize) {
        const leftChunk = leftInt16.subarray(i, i + blockSize);
        const rightChunk = rightInt16.subarray(i, i + blockSize);
        const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(new Uint8Array(mp3buf));
        }
      }
    } else {
      const blockSize = 1152;
      for (let i = 0; i < leftInt16.length; i += blockSize) {
        const chunk = leftInt16.subarray(i, i + blockSize);
        const mp3buf = encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) {
          mp3Data.push(new Uint8Array(mp3buf));
        }
      }
    }

    const flushBuf = encoder.flush();
    if (flushBuf.length > 0) {
      mp3Data.push(new Uint8Array(flushBuf));
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
  } catch (err) {
    console.warn('MP3 encoding encountered an issue, falling back to WAV format:', err);
    return audioBufferToWav(audioBuffer);
  }
}

/**
 * Converts 16-bit raw PCM (e.g. from Gemini TTS 24000Hz) to an AudioBuffer
 */
export function pcm16ToAudioBuffer(
  pcmBytes: Uint8Array,
  sampleRate = 24000,
  audioContext: AudioContext
): AudioBuffer {
  const int16 = new Int16Array(
    pcmBytes.buffer,
    pcmBytes.byteOffset,
    pcmBytes.byteLength / 2
  );
  const audioBuffer = audioContext.createBuffer(1, int16.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < int16.length; i++) {
    channelData[i] = int16[i] / 32768.0;
  }

  return audioBuffer;
}

/**
 * Helper to convert Base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Trigger browser file download
 */
export function downloadAudioFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}
