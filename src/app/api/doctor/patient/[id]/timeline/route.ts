import { NextRequest, NextResponse } from "next/server";
import { PatientMemoryService } from "@/lib/memory/service";

/**
 * GET /api/doctor/patient/[id]/timeline
 *
 * Disease course timeline for a patient
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: patientId } = await params;

  // TODO: Implement actual timeline retrieval
  // This is a placeholder that returns mock data

  return NextResponse.json({
    patientId,
    timeline: [
      {
        date: "2024-01-15",
        eventType: "encounter",
        details: {
          chiefComplaint: "失眠3周",
          symptoms: ["失眠", "多梦", "口苦"],
          diagnosis: { syndrome: "肝郁化火证", probability: 0.65 },
        },
      },
      {
        date: "2024-01-22",
        eventType: "encounter",
        details: {
          chiefComplaint: "睡眠改善，偶有口干",
          symptoms: ["口干", "轻度失眠"],
          diagnosis: { syndrome: "肝郁化火证", probability: 0.45 },
        },
      },
    ],
    syndromeProgression: [
      { date: "2024-01-15", syndrome: "肝郁化火证", probability: 0.65 },
      { date: "2024-01-22", syndrome: "肝郁化火证", probability: 0.45 },
    ],
    treatmentResponse: [
      {
        encounterId: "enc-002",
        date: "2024-01-22",
        symptomsBefore: ["失眠", "多梦", "口苦"],
        symptomsAfter: ["口干", "轻度失眠"],
        improvement: "improved",
      },
    ],
  });
}
