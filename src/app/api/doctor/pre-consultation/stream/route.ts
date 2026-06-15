import { NextRequest } from "next/server";
import { z } from "zod";
import { LLMAdapter } from "@/lib/llm/adapter";
import { RAGEngine } from "@/lib/rag/engine";
import { GraphRunner } from "@/lib/graph/runner";
import { config } from "@/lib/config";
import { PatientMemoryService } from "@/lib/memory/service";
import type { Patient } from "@/lib/core/models";

const preConsultationSchema = z.object({
  patientId: z.string().optional(),
  chiefComplaint: z.string(),
  symptoms: z.array(z.string()),
  age: z.number(),
  sex: z.enum(["男", "女"]),
  isPregnant: z.boolean().default(false),
  allergies: z.array(z.string()).default([]),
  questionnaireResponses: z.record(z.unknown()).nullable().default(null),
});

/**
 * POST /api/doctor/pre-consultation/stream
 *
 * SSE streaming pre-consultation for doctor (2B: full reasoning trace)
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await req.json();
        const parsed = preConsultationSchema.parse(body);

        const patient: Patient = {
          patientId: parsed.patientId || crypto.randomUUID(),
          age: parsed.age,
          sex: parsed.sex,
          isPregnant: parsed.isPregnant,
          allergies: parsed.allergies,
          chiefComplaint: parsed.chiefComplaint,
          symptoms: parsed.symptoms,
          tongueImagePath: null,
          questionnaireResponses: parsed.questionnaireResponses,
        };

        // Initialize services
        const llm = new LLMAdapter(config);
        const ragEngine = new RAGEngine(config);
        const runner = new GraphRunner(llm, ragEngine);

        // Collect final state for persistence
        let finalState: Record<string, unknown> = {};

        // Stream diagnosis events
        for await (const event of runner.runStream(patient, "2B")) {
          if (event.event === "final_output") {
            finalState = event.data;
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }

        // Persist encounter to database (non-blocking)
        persistEncounter(patient, finalState).catch(() => {});

        controller.close();
      } catch (error) {
        const errorEvent = {
          event: "error",
          data: {
            message: error instanceof Error ? error.message : "诊断流程失败",
            recoverable: false,
          },
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function persistEncounter(patient: Patient, finalState: Record<string, unknown>) {
  try {
    const memoryService = new PatientMemoryService();

    // Ensure patient exists in DB
    let dbPatient = await memoryService.getPatient(patient.patientId);
    if (!dbPatient) {
      dbPatient = await memoryService.createPatient({
        name: `患者${patient.patientId.slice(0, 6)}`,
        age: patient.age,
        sex: patient.sex,
        isPregnant: patient.isPregnant,
        allergies: patient.allergies,
      });
    }

    // Record the encounter with full diagnosis data for doctor view
    await memoryService.recordEncounter(dbPatient.id, {
      encounterType: "doctor_2b",
      chiefComplaint: patient.chiefComplaint,
      symptoms: patient.symptoms,
      questionnaireResponses: patient.questionnaireResponses ?? undefined,
      diagnosisResult: finalState as Record<string, unknown>,
      soapNote: (finalState.soapNote as string) ?? undefined,
    });
  } catch {
    // Persistence failure should not affect the user experience
  }
}
