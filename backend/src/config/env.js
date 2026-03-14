import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  AWS_REGION: process.env.AWS_REGION || "us-east-1",
  NOVA_MODEL_ID: process.env.NOVA_MODEL_ID || "amazon.nova-lite-v1:0",
  NOVA_SONIC_MODEL_ID: process.env.NOVA_SONIC_MODEL_ID || "amazon.nova-2-sonic-v1:0",
  NOVA_SONIC_VOICE_ID: process.env.NOVA_SONIC_VOICE_ID || "matthew",
  USE_MOCK_AI: String(process.env.USE_MOCK_AI || "false").toLowerCase() === "true"
};
