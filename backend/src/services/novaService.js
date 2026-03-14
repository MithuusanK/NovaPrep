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
        "Access denied for Amazon Bedrock. Check IAM permissions and model access for Nova."
      );
      friendlyError.status = 403;
      throw friendlyError;
    }

    throw error;
  }

  const modelText = response?.output?.message?.content?.[0]?.text;

  try {
    return safeJsonParse(modelText);
  } catch (error) {
    console.error("Nova raw response parse failure. Raw text preview:", String(modelText || "").slice(0, 500));
    throw new Error(`Failed to parse Nova response as JSON: ${error.message}`);
  }
}
