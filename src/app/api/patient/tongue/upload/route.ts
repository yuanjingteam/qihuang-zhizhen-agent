import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/patient/tongue/upload
 *
 * Upload tongue image for analysis
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请上传舌象图片" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "仅支持 JPG、PNG、WebP 格式" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小不能超过10MB" }, { status: 400 });
    }

    // TODO: Integrate with tongue diagnosis model API
    // For now, return mock analysis result
    const analysis = {
      tongueColor: "淡红",
      coatingType: "薄白",
      coatingColor: "白",
      tongueShape: "正常",
      moisture: "润",
      bodyShape: "正常",
      sublingualVeins: "正常",
      confidence: 0.85,
      features: {
        tipRedness: false,
        edgeTeethMarks: false,
        cracks: false,
        spots: false,
      },
    };

    return NextResponse.json({
      success: true,
      analysis,
      message: "舌象分析完成",
    });
  } catch {
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
