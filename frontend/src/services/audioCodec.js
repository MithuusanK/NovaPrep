function floatTo16BitPCM(input) {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(i * 2, intSample, true);
  }

  return new Uint8Array(buffer);
}

function downsampleBuffer(source, inputSampleRate, targetSampleRate) {
  if (inputSampleRate === targetSampleRate) {
    return source;
  }

  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.max(1, Math.round(source.length / ratio));
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i += 1) {
    const sourceIndex = i * ratio;
    const low = Math.floor(sourceIndex);
    const high = Math.min(low + 1, source.length - 1);
    const weight = sourceIndex - low;
    result[i] = source[low] * (1 - weight) + source[high] * weight;
  }

  return result;
}

function mergeToMono(audioBuffer) {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0);
  }

  const length = audioBuffer.length;
  const output = new Float32Array(length);

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const channelData = audioBuffer.getChannelData(channelIndex);
    for (let i = 0; i < length; i += 1) {
      output[i] += channelData[i];
    }
  }

  for (let i = 0; i < length; i += 1) {
    output[i] /= audioBuffer.numberOfChannels;
  }

  return output;
}

function uint8ArrayToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64 || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function createWavBlobFromPcm16(pcmBytes, sampleRate, channelCount = 1) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const byteRate = sampleRate * channelCount * 2;
  const blockAlign = channelCount * 2;

  function writeAscii(offset, text) {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  }

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, pcmBytes.length, true);

  return new Blob([header, pcmBytes], { type: "audio/wav" });
}

export async function audioBlobToPcm16Base64(blob, { targetSampleRate = 16000 } = {}) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("Audio processing is not supported in this browser.");
  }

  const audioContext = new AudioContextCtor();

  try {
    const inputArrayBuffer = await blob.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(inputArrayBuffer.slice(0));
    const monoData = mergeToMono(decoded);
    const resampled = downsampleBuffer(monoData, decoded.sampleRate, targetSampleRate);
    const pcmBytes = floatTo16BitPCM(resampled);
    return uint8ArrayToBase64(pcmBytes);
  } finally {
    await audioContext.close();
  }
}

export function pcm16Base64ToWavUrl(base64, { sampleRate = 24000, channelCount = 1 } = {}) {
  const pcmBytes = base64ToUint8Array(base64);
  const wavBlob = createWavBlobFromPcm16(pcmBytes, sampleRate, channelCount);
  return URL.createObjectURL(wavBlob);
}
