import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const constitutionRequestSchema = z.object({
  responses: z.record(z.array(z.string())),
});

/**
 * POST /api/patient/constitution
 *
 * Nine Constitution assessment based on questionnaire responses
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { responses } = constitutionRequestSchema.parse(body);

    // Score each constitution type based on responses
    const scores = calculateConstitutionScores(responses);

    // Find primary and secondary constitution types
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    const primary = sorted[0][0];
    const secondary = sorted[1][0];

    return NextResponse.json({
      primary,
      secondary,
      scores,
      analysis: getAnalysis(primary),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "请求参数错误", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "评估失败" }, { status: 500 });
  }
}

function calculateConstitutionScores(responses: Record<string, string[]>): Record<string, number> {
  const scores: Record<string, number> = {
    "平和质": 0,
    "气虚质": 0,
    "阳虚质": 0,
    "阴虚质": 0,
    "痰湿质": 0,
    "湿热质": 0,
    "血瘀质": 0,
    "气郁质": 0,
    "特禀质": 0,
  };

  const allResponses = Object.values(responses).flat();

  // Simplified scoring based on keyword matching
  const constitutionKeywords: Record<string, string[]> = {
    "气虚质": ["乏力", "气短", "自汗", "容易感冒", "声音低弱"],
    "阳虚质": ["怕冷", "手脚凉", "喜热", "腰膝酸软", "夜尿多"],
    "阴虚质": ["怕热", "手足心热", "口干", "盗汗", "失眠"],
    "痰湿质": ["肥胖", "痰多", "胸闷", "身重", "口腻"],
    "湿热质": ["口苦", "口臭", "大便黏", "小便黄", "面部油"],
    "血瘀质": ["面色暗", "皮肤粗糙", "痛经", "固定痛", "瘀斑"],
    "气郁质": ["情绪低落", "胸闷", "叹气", "胁肋胀", "咽部异物感"],
    "特禀质": ["过敏", "喷嚏", "荨麻疹", "哮喘", "药物过敏"],
  };

  for (const [constitution, keywords] of Object.entries(constitutionKeywords)) {
    for (const keyword of keywords) {
      if (allResponses.some(r => r.includes(keyword))) {
        scores[constitution] += 1;
      }
    }
  }

  // Normalize scores
  const maxScore = Math.max(...Object.values(scores), 1);
  for (const key of Object.keys(scores)) {
    scores[key] = Math.round((scores[key] / maxScore) * 100) / 100;
  }

  // If no strong signal, default to 平和质
  if (maxScore === 0) {
    scores["平和质"] = 0.6;
  }

  return scores;
}

function getAnalysis(constitution: string): string {
  const analyses: Record<string, string> = {
    "平和质": "体质平和，阴阳气血调匀，脏腑功能正常。建议保持规律作息和均衡饮食。",
    "气虚质": "元气不足，容易疲乏、气短。建议多食用黄芪、山药、大枣等补气食材，避免剧烈运动。",
    "阳虚质": "阳气不足，畏寒怕冷。建议多食用羊肉、生姜、桂圆等温阳食材，注意保暖。",
    "阴虚质": "阴液不足，口干怕热。建议多食用银耳、百合、枸杞等滋阴食材，避免辛辣。",
    "痰湿质": "痰湿凝聚，形体肥胖。建议多食用薏苡仁、茯苓、冬瓜等利湿食材，加强运动。",
    "湿热质": "湿热内蕴，面垢油光。建议多食用绿豆、苦瓜、黄瓜等清热利湿食材，忌酒。",
    "血瘀质": "血行不畅，面色晦暗。建议多食用山楂、红花、醋等活血食材，适当运动。",
    "气郁质": "气机郁滞，情绪低落。建议多食用玫瑰花、佛手、柑橘等理气食材，保持心情舒畅。",
    "特禀质": "先天失常，过敏体质。建议避免接触过敏原，多食用红枣、蜂蜜等增强免疫力。",
  };

  return analyses[constitution] || "建议咨询专业中医师进行体质调理。";
}
