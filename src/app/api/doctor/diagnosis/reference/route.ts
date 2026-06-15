import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/doctor/diagnosis/reference
 *
 * Top-K diagnosis probability distribution for doctor review
 */
export async function POST(req: NextRequest) {
  // TODO: Implement actual diagnosis workflow
  // This is a placeholder that returns mock data

  return NextResponse.json({
    topKSyndromes: [
      { name: "肝郁化火证", probability: 0.65, evidence: ["失眠", "口苦", "咽干"], sourceLayer: 1 },
      { name: "阴虚火旺证", probability: 0.20, evidence: ["失眠", "五心烦热"], sourceLayer: 2 },
      { name: "痰热扰心证", probability: 0.10, evidence: ["失眠", "胸闷"], sourceLayer: 3 },
    ],
    confidenceThreshold: 0.6,
    reasoningTrace: "基于症状分析...",
    diagnosisWeights: {
      chief_complaint: 0.5,
      questionnaire: 0.35,
      tongue: 0.15,
    },
  });
}
