import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand
} from "@aws-sdk/client-bedrock-runtime";
import { env } from "../config/env.js";

const client = new BedrockRuntimeClient({ region: env.AWS_REGION });

const INPUT_AUDIO_CONFIG = {
  mediaType: "audio/lpcm",
  sampleRateHertz: 16000,
  sampleSizeBits: 16,
  channelCount: 1,
  audioType: "SPEECH",
  encoding: "base64"
};

const OUTPUT_AUDIO_CONFIG = {
  mediaType: "audio/lpcm",
  sampleRateHertz: 24000,
  sampleSizeBits: 16,
  channelCount: 1,
  audioType: "SPEECH",
  encoding: "base64"
};

function buildSilentAudioBase64({ sampleRateHertz = 16000, durationMs = 250 } = {}) {
  const sampleCount = Math.max(1, Math.floor((sampleRateHertz * durationMs) / 1000));
  const pcmBuffer = Buffer.alloc(sampleCount * 2); // PCM16 mono silence
  return pcmBuffer.toString("base64");
}

function serializeEventBytes(eventObject) {
  const text = JSON.stringify(eventObject);
  return new TextEncoder().encode(text);
}

async function* buildEventStream(events) {
  for (const item of events) {
    if (item?.__delayMs) {
      await new Promise((resolve) => setTimeout(resolve, Number(item.__delayMs) || 0));
      continue;
    }

    yield { chunk: { bytes: serializeEventBytes(item) } };
  }
}

function chunkAudioBase64(base64Audio, chunkBytes = 1024) {
  const raw = Buffer.from(base64Audio || "", "base64");
  if (!raw.length) {
    return [];
  }

  const chunks = [];
  for (let offset = 0; offset < raw.length; offset += chunkBytes) {
    chunks.push(raw.subarray(offset, offset + chunkBytes).toString("base64"));
  }
  return chunks;
}

function parseResponsePayload(bytes) {
  const payloadText = new TextDecoder().decode(bytes || new Uint8Array());

  if (!payloadText.trim()) {
    return [];
  }

  try {
    return [JSON.parse(payloadText)];
  } catch (error) {
    const lines = payloadText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const parsed = [];
    for (const line of lines) {
      try {
        parsed.push(JSON.parse(line));
      } catch (parseError) {
        // Skip malformed chunks instead of failing entire response.
      }
    }

    return parsed;
  }
}

function concatBase64Chunks(base64Chunks) {
  if (!base64Chunks.length) {
    return "";
  }

  const buffers = base64Chunks.map((chunk) => Buffer.from(chunk, "base64"));
  return Buffer.concat(buffers).toString("base64");
}

function looksLikeStructuredJsonPayload(bytes) {
  const text = new TextDecoder().decode(bytes || new Uint8Array()).trimStart();
  return text.startsWith("{") || text.startsWith("[");
}

function buildSessionEvents({
  systemPrompt,
  userText,
  userAudioBase64,
  includeAudioOutput,
  voiceId,
  forceAudioSeedForText = false,
  sessionCloseDelayMs = 3000
}) {
  const promptName = `prompt-${Date.now()}`;
  const systemContentName = "system-instruction";
  const userContentName = userAudioBase64 ? "user-audio" : "user-text";

  const promptStartEvent = {
    event: {
      promptStart: {
        promptName,
        textOutputConfiguration: {
          mediaType: "text/plain"
        }
      }
    }
  };

  if (includeAudioOutput) {
    promptStartEvent.event.promptStart.audioOutputConfiguration = {
      ...OUTPUT_AUDIO_CONFIG
    };

    const selectedVoiceId = String(voiceId || env.NOVA_SONIC_VOICE_ID || "matthew").trim() || "matthew";
    promptStartEvent.event.promptStart.audioOutputConfiguration.voiceId = selectedVoiceId;
  }

  const events = [
    {
      event: {
        sessionStart: {
          inferenceConfiguration: {
            maxTokens: 1024,
            topP: 0.9,
            temperature: 0.6
          }
        }
      }
    },
    promptStartEvent,
    {
      event: {
        contentStart: {
          promptName,
          contentName: systemContentName,
          type: "TEXT",
          interactive: false,
          role: "SYSTEM",
          textInputConfiguration: {
            mediaType: "text/plain"
          }
        }
      }
    },
    {
      event: {
        textInput: {
          promptName,
          contentName: systemContentName,
          content: systemPrompt,
          role: "SYSTEM"
        }
      }
    },
    {
      event: {
        contentEnd: {
          promptName,
          contentName: systemContentName
        }
      }
    }
  ];

  const needsAudioInput = Boolean(userAudioBase64 || forceAudioSeedForText);

  if (needsAudioInput) {
    const audioSeedContent =
      userAudioBase64 || buildSilentAudioBase64({ sampleRateHertz: 16000, durationMs: 250 });
    const audioChunks = chunkAudioBase64(audioSeedContent, 1024);
    const audioContentName = userAudioBase64 ? userContentName : "user-audio-seed";

    events.push(
      {
        event: {
          contentStart: {
            promptName,
            contentName: audioContentName,
            type: "AUDIO",
            interactive: true,
            role: "USER",
            audioInputConfiguration: INPUT_AUDIO_CONFIG
          }
        }
      },
      {
        event: {
          audioInput: {
            promptName,
            contentName: audioContentName,
            content: audioChunks[0] || ""
          }
        }
      }
    );

    for (let i = 1; i < audioChunks.length; i += 1) {
      events.push({
        event: {
          audioInput: {
            promptName,
            contentName: audioContentName,
            content: audioChunks[i]
          }
        }
      });
      // Simulate near-real-time microphone cadence.
      events.push({ __delayMs: 8 });
    }

    events.push({
      event: {
        contentEnd: {
          promptName,
          contentName: audioContentName
        }
      }
    });
  }

  if (!userAudioBase64 && userText) {
    events.push(
      {
        event: {
          contentStart: {
            promptName,
            contentName: userContentName,
            type: "TEXT",
            interactive: true,
            role: "USER",
            textInputConfiguration: {
              mediaType: "text/plain"
            }
          }
        }
      },
      {
        event: {
          textInput: {
            promptName,
            contentName: userContentName,
            content: userText
          }
        }
      },
      {
        event: {
          contentEnd: {
            promptName,
            contentName: userContentName
          }
        }
      }
    );
  }

  // End input for this prompt. Keep the stream open briefly so output events
  // can be emitted, then close session explicitly.
  events.push({
    event: {
      promptEnd: {
        promptName
      }
    }
  });
  events.push({ __delayMs: sessionCloseDelayMs });
  events.push({
    event: {
      sessionEnd: {}
    }
  });

  return events;
}

function getMockSpeechBase64() {
  const sampleRate = 24000;
  const durationMs = 600;
  const frequency = 440;
  const samples = Math.floor((sampleRate * durationMs) / 1000);
  const pcmBuffer = Buffer.alloc(samples * 2);
  const fadeFrames = Math.floor(sampleRate * 0.04); // 40ms fade in/out

  for (let i = 0; i < samples; i++) {
    const envelope = Math.min(i / fadeFrames, 1, (samples - i) / fadeFrames);
    const amplitude = 0.3 * envelope * Math.sin(2 * Math.PI * frequency * (i / sampleRate));
    const sample = Math.max(-32768, Math.min(32767, Math.round(amplitude * 32767)));
    pcmBuffer.writeInt16LE(sample, i * 2);
  }

  return pcmBuffer.toString("base64");
}

async function invokeNovaSonic({
  systemPrompt,
  userText,
  userAudioBase64,
  includeAudioOutput = true,
  voiceId,
  forceAudioSeedForText = false,
  modelId = env.NOVA_SONIC_MODEL_ID
}) {
  if (env.USE_MOCK_AI) {
    if (userAudioBase64) {
      return {
        textOutput: "Mock transcript from voice input.",
        audioBase64: "",
        audioConfig: OUTPUT_AUDIO_CONFIG
      };
    }

    return {
      textOutput: String(userText || ""),
      audioBase64: getMockSpeechBase64(),
      audioConfig: OUTPUT_AUDIO_CONFIG
    };
  }

  const events = buildSessionEvents({
    systemPrompt,
    userText,
    userAudioBase64,
    includeAudioOutput,
    voiceId,
    forceAudioSeedForText
    ,
    sessionCloseDelayMs: includeAudioOutput ? 3500 : 2200
  });

  const command = new InvokeModelWithBidirectionalStreamCommand({
    modelId,
    body: buildEventStream(events)
  });

  let response;

  try {
    response = await client.send(command);
  } catch (error) {
    const message = String(error?.message || "");

    if (message.includes("Could not load credentials")) {
      const friendlyError = new Error(
        "AWS credentials not found. Run `aws configure` and ensure Bedrock access is enabled."
      );
      friendlyError.status = 500;
      throw friendlyError;
    }

    if (error?.name === "AccessDeniedException") {
      const friendlyError = new Error(
        "Access denied for Nova Sonic. Check IAM permissions and model access for amazon.nova-sonic-v1:0."
      );
      friendlyError.status = 403;
      throw friendlyError;
    }

    const rawMessage = String(error?.message || "");
    if (
      !userAudioBase64 &&
      !forceAudioSeedForText &&
      rawMessage.includes("must have at least one audio content")
    ) {
      // Some accounts/model variants enforce at least one audio input content block.
      return invokeNovaSonic({
        systemPrompt,
        userText,
        userAudioBase64,
        includeAudioOutput,
        voiceId,
        forceAudioSeedForText: true,
        modelId
      });
    }

    throw error;
  }

  const textChunks = [];
  const audioChunks = [];
  const rawAudioByteChunks = [];
  const payloadDebugSamples = [];

  for await (const outputEvent of response.body || []) {
    if (outputEvent.validationException) {
      const error = new Error(outputEvent.validationException.message || "Nova Sonic validation error.");
      error.status = 400;
      throw error;
    }

    if (outputEvent.modelStreamErrorException) {
      throw new Error(outputEvent.modelStreamErrorException.message || "Nova Sonic stream error.");
    }

    const bytes = outputEvent?.chunk?.bytes;
    if (!bytes) {
      continue;
    }

    const payloadObjects = parseResponsePayload(bytes);

    if (!payloadObjects.length) {
      // Some Nova Sonic responses may stream raw PCM bytes for audio chunks.
      // Only treat as raw audio when it does not look like JSON payload text.
      if (!looksLikeStructuredJsonPayload(bytes)) {
        rawAudioByteChunks.push(Buffer.from(bytes));
      }
      continue;
    }

    for (const payloadObject of payloadObjects) {
      if (payloadDebugSamples.length < 6) {
        payloadDebugSamples.push(
          JSON.stringify(payloadObject).slice(0, 400)
        );
      }

      const eventData = payloadObject?.event || payloadObject;
      const textValue = eventData?.textOutput?.content;
      const audioValue = eventData?.audioOutput?.content;

      if (typeof textValue === "string" && textValue.trim()) {
        textChunks.push(textValue);
      }

      if (typeof audioValue === "string" && audioValue.trim()) {
        audioChunks.push(audioValue);
      }
    }
  }

  const resolvedAudioBase64 =
    concatBase64Chunks(audioChunks) ||
    (rawAudioByteChunks.length ? Buffer.concat(rawAudioByteChunks).toString("base64") : "");

  if (!resolvedAudioBase64) {
    console.error("Nova Sonic returned no audio chunks. Debug payload samples:", payloadDebugSamples);

    if (!userAudioBase64 && !forceAudioSeedForText) {
      // Retry once with a small silent audio seed for model variants that
      // require audio presence before emitting speech output.
      return invokeNovaSonic({
        systemPrompt,
        userText,
        userAudioBase64,
        includeAudioOutput,
        voiceId,
        forceAudioSeedForText: true,
        modelId
      });
    }
  }

  return {
    textOutput: textChunks.join(" ").trim(),
    audioBase64: resolvedAudioBase64,
    audioConfig: OUTPUT_AUDIO_CONFIG
  };
}

export async function transcribeWithNovaSonic({ audioBase64 }) {
  const result = await invokeNovaSonic({
    systemPrompt:
      "You are a speech transcription assistant. Transcribe the user audio exactly. Return only the transcript text.",
    userAudioBase64: audioBase64,
    includeAudioOutput: true
  });

  return {
    transcript: result.textOutput
  };
}

export async function speakWithNovaSonic({ text, voiceId }) {
  const result = await invokeNovaSonic({
    systemPrompt:
      "You are a professional interviewer voice assistant. Speak the user's provided text clearly and naturally.",
    userText: text,
    includeAudioOutput: true,
    voiceId
  });

  return {
    text: result.textOutput || text,
    audioBase64: result.audioBase64,
    audioConfig: result.audioConfig
  };
}
