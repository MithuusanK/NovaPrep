import {
  BedrockRuntimeClient,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import { env } from "../config/env.js";
import { safeJsonParse } from "../utils/safeJsonParse.js";

const client = new BedrockRuntimeClient({ region: env.AWS_REGION });

export async function invokeNovaJson({ prompt, mockResponse }) {
  if (env.USE_MOCK_AI) {
    return mockResponse;
  }

  const command = new ConverseCommand({
    modelId: env.NOVA_MODEL_ID,
    system: [
      {
        text: "You are a strict JSON API. Return valid JSON only."
      }
    ],
    messages: [
      {
        role: "user",
        content: [{ text: prompt }]
      }
    ],
    inferenceConfig: {
      temperature: 0.3,
      maxTokens: 900
    }
  });

  const response = await client.send(command);
  const modelText = response?.output?.message?.content?.[0]?.text;

  try {
    return safeJsonParse(modelText);
  } catch (error) {
    console.error("Nova raw response parse failure. Raw text preview:", String(modelText || "").slice(0, 500));
    throw new Error(`Failed to parse Nova response as JSON: ${error.message}`);
  }
}
