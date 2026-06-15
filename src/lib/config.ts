import { z } from "zod";

const configSchema = z.object({
  llm: z.object({
    baseUrl: z.string().default("http://localhost:11434/v1"),
    modelName: z.string().default("qwen2.5:14b"),
    temperature: z.number().default(0.3),
    maxTokens: z.number().default(2048),
  }),
  rag: z.object({
    weightClinicalGuidelines: z.number().default(0.45),
    weightModernTextbooks: z.number().default(0.25),
    weightFamousDoctor: z.number().default(0.15),
    weightClassicalTexts: z.number().default(0.15),
  }),
  diagnosis: z.object({
    topK: z.number().default(5),
    maxFollowupTurns: z.number().default(2),
  }),
  db: z.object({
    url: z.string().default("postgresql://tcm:tcm_pass@localhost:5432/tcm_os"),
  }),
  chroma: z.object({
    url: z.string().default("http://localhost:8100"),
  }),
  app: z.object({
    nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;

export const config = configSchema.parse({
  llm: {
    baseUrl: process.env.LLM_BASE_URL,
    modelName: process.env.LLM_MODEL_NAME,
    temperature: process.env.LLM_TEMPERATURE ? Number(process.env.LLM_TEMPERATURE) : undefined,
    maxTokens: process.env.LLM_MAX_TOKENS ? Number(process.env.LLM_MAX_TOKENS) : undefined,
  },
  rag: {
    weightClinicalGuidelines: process.env.RAG_WEIGHT_CLINICAL
      ? Number(process.env.RAG_WEIGHT_CLINICAL)
      : undefined,
    weightModernTextbooks: process.env.RAG_WEIGHT_TEXTBOOKS
      ? Number(process.env.RAG_WEIGHT_TEXTBOOKS)
      : undefined,
  },
  diagnosis: {
    topK: process.env.DIAGNOSIS_TOP_K ? Number(process.env.DIAGNOSIS_TOP_K) : undefined,
    maxFollowupTurns: process.env.MAX_FOLLOWUP_TURNS
      ? Number(process.env.MAX_FOLLOWUP_TURNS)
      : undefined,
  },
  db: {
    url: process.env.DATABASE_URL,
  },
  chroma: {
    url: process.env.CHROMA_URL,
  },
  app: {
    nodeEnv: process.env.NODE_ENV as "development" | "production" | "test" | undefined,
  },
});
