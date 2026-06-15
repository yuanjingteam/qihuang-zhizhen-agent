import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/stats
 *
 * Clinical efficacy and safety statistics
 */
export async function GET(req: NextRequest) {
  // TODO: Implement actual statistics retrieval
  // This is a placeholder that returns mock data

  return NextResponse.json({
    efficacy: {
      totalPatients: 1250,
      totalEncounters: 3840,
      averageImprovementRate: 0.72,
      topSyndromes: [
        { name: "肝郁脾虚证", count: 320, improvementRate: 0.78 },
        { name: "气虚血瘀证", count: 280, improvementRate: 0.65 },
        { name: "痰湿蕴肺证", count: 240, improvementRate: 0.71 },
      ],
    },
    safety: {
      totalPrescriptions: 2150,
      safetyInterceptions: 89,
      interceptionRate: 0.041,
      topViolations: [
        { type: "overdose", count: 45, percentage: 0.51 },
        { type: "incompatibility", count: 28, percentage: 0.31 },
        { type: "pregnancy", count: 16, percentage: 0.18 },
      ],
    },
    rag: {
      totalQueries: 15600,
      averageRetrievalTimeMs: 245,
      layerUsage: {
        clinicalGuidelines: 0.42,
        modernTextbooks: 0.28,
        famousDoctor: 0.18,
        classicalTexts: 0.12,
      },
    },
  });
}
