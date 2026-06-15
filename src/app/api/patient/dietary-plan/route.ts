import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const dietaryPlanSchema = z.object({
  constitution: z.string(),
  symptoms: z.array(z.string()).optional(),
  chiefComplaint: z.string().optional(),
});

/**
 * POST /api/patient/dietary-plan
 *
 * Generate dietary recommendations based on constitution
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { constitution, symptoms, chiefComplaint } = dietaryPlanSchema.parse(body);

    const plan = generateDietaryPlan(constitution, symptoms, chiefComplaint);

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "请求参数错误", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "生成膳食方案失败" }, { status: 500 });
  }
}

interface DietaryRecommendation {
  type: "食材" | "茶饮" | "药膳";
  name: string;
  efficacy: string;
  usage: string;
  category: "推荐" | "禁忌";
}

function generateDietaryPlan(
  constitution: string,
  symptoms?: string[],
  chiefComplaint?: string
) {
  const recommendations: DietaryRecommendation[] = [];
  const seasonalAdvice = getSeasonalAdvice();

  // Constitution-specific recommendations
  const constitutionPlans: Record<string, DietaryRecommendation[]> = {
    "气虚质": [
      { type: "食材", name: "黄芪", efficacy: "补气升阳", usage: "炖汤或泡水", category: "推荐" },
      { type: "食材", name: "山药", efficacy: "补脾养胃", usage: "煮粥或炒食", category: "推荐" },
      { type: "食材", name: "大枣", efficacy: "补中益气", usage: "每日3-5枚", category: "推荐" },
      { type: "茶饮", name: "黄芪大枣茶", efficacy: "补气养血", usage: "代茶饮", category: "推荐" },
      { type: "食材", name: "白萝卜", efficacy: "行气消食", usage: "适量食用", category: "禁忌" },
    ],
    "阳虚质": [
      { type: "食材", name: "羊肉", efficacy: "温补阳气", usage: "炖汤", category: "推荐" },
      { type: "食材", name: "生姜", efficacy: "温中散寒", usage: "煮水或炒菜", category: "推荐" },
      { type: "食材", name: "桂圆", efficacy: "补益心脾", usage: "每日10-15g", category: "推荐" },
      { type: "茶饮", name: "姜枣茶", efficacy: "温阳散寒", usage: "晨起饮用", category: "推荐" },
      { type: "食材", name: "西瓜", efficacy: "寒凉伤阳", usage: "少食", category: "禁忌" },
    ],
    "阴虚质": [
      { type: "食材", name: "银耳", efficacy: "滋阴润燥", usage: "炖甜汤", category: "推荐" },
      { type: "食材", name: "百合", efficacy: "养阴润肺", usage: "煮粥或炖汤", category: "推荐" },
      { type: "食材", name: "枸杞", efficacy: "滋补肝肾", usage: "每日10-15g", category: "推荐" },
      { type: "茶饮", name: "枸杞菊花茶", efficacy: "滋阴明目", usage: "代茶饮", category: "推荐" },
      { type: "食材", name: "辣椒", efficacy: "辛辣伤阴", usage: "少食", category: "禁忌" },
    ],
    "痰湿质": [
      { type: "食材", name: "薏苡仁", efficacy: "健脾利湿", usage: "煮粥", category: "推荐" },
      { type: "食材", name: "茯苓", efficacy: "利水渗湿", usage: "炖汤或煮粥", category: "推荐" },
      { type: "食材", name: "冬瓜", efficacy: "利水消肿", usage: "炖汤", category: "推荐" },
      { type: "茶饮", name: "陈皮普洱茶", efficacy: "理气化痰", usage: "饭后饮用", category: "推荐" },
      { type: "食材", name: "肥肉", efficacy: "助湿生痰", usage: "少食", category: "禁忌" },
    ],
    "湿热质": [
      { type: "食材", name: "绿豆", efficacy: "清热解毒", usage: "煮汤", category: "推荐" },
      { type: "食材", name: "苦瓜", efficacy: "清热利湿", usage: "炒食或凉拌", category: "推荐" },
      { type: "食材", name: "黄瓜", efficacy: "清热利水", usage: "生食或凉拌", category: "推荐" },
      { type: "茶饮", name: "菊花茶", efficacy: "清热明目", usage: "代茶饮", category: "推荐" },
      { type: "食材", name: "酒", efficacy: "助湿生热", usage: "忌酒", category: "禁忌" },
    ],
    "血瘀质": [
      { type: "食材", name: "山楂", efficacy: "活血化瘀", usage: "泡水或煮汤", category: "推荐" },
      { type: "食材", name: "醋", efficacy: "活血散瘀", usage: "适量调味", category: "推荐" },
      { type: "食材", name: "黑木耳", efficacy: "活血养血", usage: "炒菜或凉拌", category: "推荐" },
      { type: "茶饮", name: "山楂红糖茶", efficacy: "活血化瘀", usage: "经期前后饮用", category: "推荐" },
      { type: "食材", name: "冷饮", efficacy: "寒凝血瘀", usage: "少食", category: "禁忌" },
    ],
    "气郁质": [
      { type: "食材", name: "玫瑰花", efficacy: "理气解郁", usage: "泡茶", category: "推荐" },
      { type: "食材", name: "佛手", efficacy: "理气和中", usage: "泡水或炖汤", category: "推荐" },
      { type: "食材", name: "柑橘", efficacy: "理气化痰", usage: "适量食用", category: "推荐" },
      { type: "茶饮", name: "玫瑰花茶", efficacy: "疏肝解郁", usage: "代茶饮", category: "推荐" },
      { type: "食材", name: "咖啡", efficacy: "加重焦虑", usage: "少饮", category: "禁忌" },
    ],
    "特禀质": [
      { type: "食材", name: "红枣", efficacy: "补气养血", usage: "每日3-5枚", category: "推荐" },
      { type: "食材", name: "蜂蜜", efficacy: "润燥解毒", usage: "每日1-2勺", category: "推荐" },
      { type: "食材", name: "灵芝", efficacy: "增强免疫", usage: "炖汤或泡水", category: "推荐" },
      { type: "茶饮", name: "黄芪防风茶", efficacy: "益气固表", usage: "代茶饮", category: "推荐" },
      { type: "食材", name: "海鲜", efficacy: "常见过敏原", usage: "慎食", category: "禁忌" },
    ],
  };

  const plan = constitutionPlans[constitution] || constitutionPlans["平和质"] || [];
  recommendations.push(...plan);

  return {
    constitution,
    recommendations,
    seasonalAdvice,
    disclaimer: "以上建议仅供参考，不构成医疗诊断。如有不适，请咨询专业中医师。",
  };
}

function getSeasonalAdvice(): string {
  const month = new Date().getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return "春季养生：宜养肝，多食绿色蔬菜，适当户外活动。";
  } else if (month >= 6 && month <= 8) {
    return "夏季养生：宜养心，多食苦味食物，避免贪凉。";
  } else if (month >= 9 && month <= 11) {
    return "秋季养生：宜养肺，多食白色食物，注意保湿。";
  } else {
    return "冬季养生：宜养肾，多食黑色食物，注意保暖。";
  }
}
