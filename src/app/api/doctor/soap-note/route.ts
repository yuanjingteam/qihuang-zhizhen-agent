import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/doctor/soap-note
 *
 * Generate SOAP EHR note from encounter data
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // TODO: Implement actual SOAP note generation
  // This is a placeholder that returns mock data

  const { patient, diagnosis, prescription } = body;

  return NextResponse.json({
    soapNote: {
      subjective: {
        chiefComplaint: patient?.chiefComplaint || "主诉待补充",
        presentIllness: patient?.symptoms?.join("、") || "症状待补充",
        pastHistory: "既往史待补充",
        personalHistory: "个人史待补充",
      },
      objective: {
        tongue: "舌红少苔",
        pulse: "脉弦细",
        vitalSigns: "生命体征平稳",
      },
      assessment: {
        primaryDiagnosis: diagnosis?.syndrome || "证型待定",
        differentialDiagnosis: diagnosis?.differentials || [],
        tcmDiagnosis: diagnosis?.tcmDiagnosis || "中医诊断待定",
      },
      plan: {
        treatmentPrinciple: prescription?.principle || "治法待定",
        prescription: prescription?.formula || "方剂待定",
        herbs: prescription?.herbs || [],
        usage: prescription?.usage || "水煎服，日一剂",
        followUp: "1周后复诊",
        dietaryAdvice: "清淡饮食，忌辛辣油腻",
        lifestyle: "规律作息，适当运动",
      },
    },
    generatedAt: new Date().toISOString(),
  });
}
