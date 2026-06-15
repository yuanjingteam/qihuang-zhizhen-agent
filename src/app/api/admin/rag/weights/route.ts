import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/rag/weights
 *
 * Update RAG layer weights
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  // TODO: Implement actual weight update
  // This is a placeholder that returns mock data

  const { clinicalGuidelines, modernTextbooks, famousDoctor, classicalTexts } = body;

  // Validate weights sum to 1.0
  const total = (clinicalGuidelines || 0) + (modernTextbooks || 0) + (famousDoctor || 0) + (classicalTexts || 0);

  if (Math.abs(total - 1.0) > 0.01) {
    return NextResponse.json(
      { error: "权重总和必须等于1.0" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    weights: {
      clinicalGuidelines: clinicalGuidelines || 0.45,
      modernTextbooks: modernTextbooks || 0.25,
      famousDoctor: famousDoctor || 0.15,
      classicalTexts: classicalTexts || 0.15,
    },
    updatedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/admin/rag/weights
 *
 * Get current RAG layer weights
 */
export async function GET() {
  return NextResponse.json({
    weights: {
      clinicalGuidelines: 0.45,
      modernTextbooks: 0.25,
      famousDoctor: 0.15,
      classicalTexts: 0.15,
    },
  });
}
