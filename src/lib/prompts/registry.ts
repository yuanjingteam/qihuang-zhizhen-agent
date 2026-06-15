/**
 * Prompt Template Registry
 *
 * Centralized management of all LLM prompt templates.
 * Each template is a function that takes context and returns a string.
 */

type TemplateFunction = (ctx: Record<string, unknown>) => string;

export class PromptRegistry {
  private templates: Map<string, TemplateFunction> = new Map();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Register a prompt template
   */
  register(name: string, template: TemplateFunction): void {
    this.templates.set(name, template);
  }

  /**
   * Render a prompt template with context
   */
  render(name: string, context: Record<string, unknown> = {}): string {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Prompt template not found: ${name}`);
    }
    return template(context);
  }

  /**
   * Check if a template exists
   */
  has(name: string): boolean {
    return this.templates.has(name);
  }

  /**
   * List all registered template names
   */
  list(): string[] {
    return Array.from(this.templates.keys());
  }

  private registerDefaults(): void {
    // Triage prompt
    this.register("triage", (ctx) => `你是一个急诊分诊AI。判断以下症状是否需要紧急就医。

患者主诉：${ctx.chiefComplaint}
伴随症状：${(ctx.symptoms as string[])?.join("、") || "无"}

请判断：
1. 是否存在红旗症状（胸痛、呼吸困难、意识丧失、剧烈头痛、肢体瘫痪、大量出血、高热不退、抽搐等）
2. 是否需要立即就医

只回复JSON格式：{"isEmergency": boolean, "reason": "原因说明"}`);

    // Inquiry prompt
    this.register("inquiry", (ctx) => `你是一个中医问诊AI。根据已有信息，生成针对性问题以获取更多诊断信息。

当前信息：
- 主诉：${ctx.chiefComplaint}
- 已知症状：${(ctx.symptoms as string[])?.join("、") || "无"}
- 已问诊轮次：${ctx.turn || 0}

请生成2-3个针对性问题，重点关注：
1. 寒热情况（怕冷/怕热）
2. 二便情况（大便/小便）
3. 睡眠情况
4. 饮食口味

返回JSON格式：{"questions": ["问题1", "问题2", "问题3"]}`);

    // Diagnosis prompt
    this.register("diagnosis", (ctx) => `你是一个中医辨证AI。根据以下症状和参考文献，输出Top-K证候概率分布。

患者信息：
- 主诉：${ctx.chiefComplaint}
- 症状：${(ctx.symptoms as string[])?.join("、")}
- 十问信息：${JSON.stringify(ctx.questionnaireResponses || {})}

参考文献：
${ctx.ragEvidence || "暂无参考文献"}

请输出Top-5证候概率分布，要求：
1. 每个证候包含：名称、概率(0-1)、支持症状
2. 概率总和为1
3. 附推理过程

返回JSON格式：{
  "syndromes": [
    {"name": "证型名", "probability": 0.0, "evidence": ["支持症状1", "支持症状2"]}
  ],
  "reasoning": "推理过程"
}`);

    // Reflection prompt
    this.register("reflection", (ctx) => `你是一个中医诊断验证AI。验证诊断结论是否与患者症状匹配。

患者症状：${(ctx.symptoms as string[])?.join("、")}
诊断结论：${JSON.stringify(ctx.diagnosisResults || [])}

请验证：
1. 诊断依据是否充分
2. 症状与证型是否匹配
3. 是否存在证据缺口

返回JSON格式：{"score": 0.0-1.0, "gaps": ["不匹配的点1", "不匹配的点2"]}`);

    // Conflict detection prompt
    this.register("conflict", (ctx) => `你是一个中医处方审核AI。检查治法与方剂是否矛盾。

治法：${ctx.treatmentPrinciple}
方剂：${ctx.formulaName || "自拟方"}
药物组成：${(ctx.herbs as string[])?.join("、") || "无"}

请检查：
1. 治法与方剂功效是否一致
2. 药物配伍是否合理
3. 是否存在寒热矛盾

返回JSON格式：{"conflict": boolean, "reason": "矛盾原因"}`);

    // Treatment prompt
    this.register("treatment", (ctx) => `你是一个中医处方AI。根据证型生成治法和方剂。

证型：${ctx.syndromeName}
主要症状：${(ctx.symptoms as string[])?.join("、")}
患者信息：${ctx.age}岁，${ctx.sex}
${ctx.isPregnant ? "注意：孕妇用药禁忌" : ""}

请生成：
1. 治法
2. 方剂（经方或自拟方）
3. 药物组成（含剂量、炮制方法、君臣佐使）
4. 加减说明
5. 煎服法

返回JSON格式：{
  "principle": "治法",
  "formula": "方剂名",
  "herbs": [
    {"name": "药名", "doseGrams": 剂量, "processing": "炮制", "role": "君/臣/佐/使"}
  ],
  "modifications": "加减说明",
  "usage": "煎服法"
}`);

    // SOAP note prompt
    this.register("soap-note", (ctx) => `你是一个中医电子病历AI。生成标准SOAP病历格式。

患者信息：
- 主诉：${ctx.chiefComplaint}
- 症状：${(ctx.symptoms as string[])?.join("、")}
- 诊断：${ctx.diagnosis}
- 治法：${ctx.treatmentPrinciple}

请生成SOAP病历：
S（主观）：患者主诉和症状描述
O（客观）：舌脉象、体征
A（评估）：中医诊断和证型
P（计划）：治法、方药、医嘱`);

    // Dietary advice prompt
    this.register("dietary-advice", (ctx) => `你是一个中医膳食顾问AI。根据体质推荐药食同源的食材和茶饮。

体质倾向：${ctx.syndromeName}
主诉：${ctx.chiefComplaint}

请推荐3-5条药食同源的膳食建议，包括：
1. 推荐食材及功效
2. 推荐茶饮
3. 饮食禁忌

注意：只推荐食材，不推荐处方药材。

返回JSON格式：{
  "recommendations": [
    {"type": "食材/茶饮", "name": "名称", "efficacy": "功效", "usage": "用法"}
  ],
  "contraindications": ["禁忌1", "禁忌2"]
}`);

    // Constitution assessment prompt
    this.register("constitution", (ctx) => `你是一个中医体质评估AI。根据问卷结果判断体质类型。

问卷回答：${JSON.stringify(ctx.responses || {})}

请判断体质类型（九种体质：平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质）。

返回JSON格式：{
  "primary": "主要体质类型",
  "secondary": "次要体质类型",
  "scores": {
    "平和质": 0.0,
    "气虚质": 0.0,
    ...
  },
  "analysis": "体质分析"
}`);
  }
}
