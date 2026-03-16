import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { env } from "../config/env.js";

const client = new PollyClient({ region: env.AWS_REGION });

const SAMPLE_RATE = "16000";

function getMockAudioBase64() {
  // 600ms audible 440Hz tone for mock/dev mode
  const sampleRate = 16000;
  const samples = Math.floor(sampleRate * 0.6);
  const buf = Buffer.alloc(samples * 2);
  const fadeFrames = Math.floor(sampleRate * 0.04);
  for (let i = 0; i < samples; i++) {
    const envelope = Math.min(i / fadeFrames, 1, (samples - i) / fadeFrames);
    const amplitude = 0.3 * envelope * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
    const sample = Math.max(-32768, Math.min(32767, Math.round(amplitude * 32767)));
    buf.writeInt16LE(sample, i * 2);
  }
  return buf.toString("base64");
}

export async function synthesizeSpeech({ text, voiceId, engine }) {
  if (env.USE_MOCK_AI) {
    return {
      audioBase64: getMockAudioBase64(),
      audioConfig: { sampleRateHertz: Number(SAMPLE_RATE) }
    };
  }

  const selectedVoiceId = voiceId || env.POLLY_VOICE_ID || "Ruth";
  const selectedEngine  = engine  || env.POLLY_ENGINE   || "generative";

  async function attempt(engineToUse) {
    const command = new SynthesizeSpeechCommand({
      Engine:      engineToUse,
      VoiceId:     selectedVoiceId,
      Text:        text,
      OutputFormat: "pcm",
      SampleRate:  SAMPLE_RATE,
      TextType:    "text"
    });

    const response = await client.send(command);

    const chunks = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("base64");
  }

  let audioBase64;

  try {
    audioBase64 = await attempt(selectedEngine);
  } catch (error) {
    const msg = String(error?.message || "");

    // Generative engine not available in this region/for this voice — fall back to neural
    if (selectedEngine === "generative" && (msg.includes("not supported") || msg.includes("InvalidSampleRateException") || error?.name === "InvalidSampleRateException" || error?.name === "ValidationException")) {
      audioBase64 = await attempt("neural");
    } else {
      throw error;
    }
  }

  return {
    audioBase64,
    audioConfig: { sampleRateHertz: Number(SAMPLE_RATE) }
  };
}
