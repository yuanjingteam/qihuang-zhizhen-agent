import { NextRequest } from "next/server";
import { z } from "zod";
import { LLMAdapter } from "@/lib/llm/adapter";
import { RAGEngine } from "@/lib/rag/engine";
import { GraphRunner } from "@/lib/graph/runner";
import { config } from "@/lib/config";
import type { Patient } from "@/lib/core/models";

const inquiryRequestSchema = z.object({
  chiefComplaint: z.string(),
  symptoms: z.array(z.string()).default([]),
  age: z.number(),
  sex: z.enum(["男", "女"]),
  questionnaireResponses: z.record(z.unknown()).nullable().default(null),
});

/**
 * POST /api/patient/diagnosis/inquiry
 *
 * Phase 1: Run triage + inquiry, return interactive questions
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inquiryRequestSchema.parse(body);

    const patient: Patient = {
      patientId: crypto.randomUUID(),
      age: parsed.age,
      sex: parsed.sex,
      isPregnant: false,
      allergies: [],
      chiefComplaint: parsed.chiefComplaint,
      symptoms: parsed.symptoms,
      tongueImagePath: null,
      questionnaireResponses: parsed.questionnaireResponses,
    };

    const llm = new LLMAdapter(config);
    const ragEngine = new RAGEngine(config);
    const runner = new GraphRunner(llm, ragEngine);

    const result = await runner.runInquiryPhase(patient);

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "问诊失败" },
      { status: 500 }
    );
  }
}
