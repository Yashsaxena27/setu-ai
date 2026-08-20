import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default(5000 as any),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required").default("mongodb://localhost:27017/setu-ai"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required").default("setu_ai_super_secret_jwt_key_2026_secure"),
  GEMINI_API_KEY: z.string().optional().default(""),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  DEMO_MODE: z.string().optional().default("true"),
  GROQ_API_KEY: z.string().optional().default(""),
  TWILIO_ACCOUNT_SID: z.string().optional().default(""),
  TWILIO_AUTH_TOKEN: z.string().optional().default(""),
  TWILIO_WHATSAPP_NUMBER: z.string().optional().default(""),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn("⚠️ Warning: Non-fatal environment configuration warnings:");
    console.warn(result.error.format());
    return {
      NODE_ENV: (process.env.NODE_ENV as any) || "development",
      PORT: parseInt(process.env.PORT || "5000", 10),
      MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/setu-ai",
      JWT_SECRET: process.env.JWT_SECRET || "setu_ai_super_secret_jwt_key_2026_secure",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
      CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
      DEMO_MODE: process.env.DEMO_MODE || "true",
      GROQ_API_KEY: process.env.GROQ_API_KEY || "",
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
      TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || "",
    };
  }
  return result.data;
};

export const env = parseEnv();
