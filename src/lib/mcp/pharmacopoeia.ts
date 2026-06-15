import { z } from "zod";
import { BaseTool } from "../tools/base";
import { PHARMACOPOEIA_DOSE_LIMITS } from "../safety/dose-limits";

/**
 * 药典 MCP Server — Dose limit lookup
 *
 * Uses local hardcoded PHARMACOPOEIA_DOSE_LIMITS data.
 */

const lookupDoseLimitsInputSchema = z.object({
  herbName: z.string(),
});

const lookupDoseLimitsOutputSchema = z.object({
  herbName: z.string(),
  exists: z.boolean(),
  limits: z.object({
    min: z.number(),
    max: z.number(),
  }).nullable(),
  specialProcessing: z.string().nullable(),
  notes: z.string().nullable(),
});

type LookupDoseLimitsInput = z.infer<typeof lookupDoseLimitsInputSchema>;
type LookupDoseLimitsOutput = z.infer<typeof lookupDoseLimitsOutputSchema>;

// Special processing requirements for specific herbs
const SPECIAL_PROCESSING: Record<string, { processing: string | null; notes: string }> = {
  "附子": { processing: "先煎", notes: "必须炮制，生用有毒" },
  "细辛": { processing: null, notes: "细辛不过钱（3g），入丸散剂量更小" },
  "大黄": { processing: "后下", notes: "泻下力强，后下保效" },
  "薄荷": { processing: "后下", notes: "含挥发油，不宜久煎" },
  "钩藤": { processing: "后下", notes: "含生物碱，久煎失效" },
  "木香": { processing: "后下", notes: "含挥发油，不宜久煎" },
  "肉桂": { processing: "后下", notes: "含挥发油，后下保效" },
  "石膏": { processing: "先煎", notes: "矿石类，宜先煎30分钟以上" },
  "石决明": { processing: "先煎", notes: "贝壳类，宜先煎" },
  "芒硝": { processing: "冲服", notes: "不入煎剂，冲入药汁中" },
  "蒲黄": { processing: "包煎", notes: "花粉细小，包煎" },
  "半夏": { processing: null, notes: "必须炮制（姜半夏/法半夏），生用有毒" },
  "天南星": { processing: null, notes: "必须炮制（制南星），生用有毒" },
  "人参": { processing: "另煎", notes: "贵重药，另煎兑服" },
  "雄黄": { processing: null, notes: "极小剂量，外用为主，内服慎用" },
  "轻粉": { processing: null, notes: "极小剂量，外用为主，内服慎用" },
};

export class DoseLimitLookupTool extends BaseTool<LookupDoseLimitsInput, LookupDoseLimitsOutput> {
  definition = {
    name: "lookup_dose_limits",
    description: "查询药典剂量限制",
    inputSchema: lookupDoseLimitsInputSchema,
    outputSchema: lookupDoseLimitsOutputSchema,
  };

  async execute(input: LookupDoseLimitsInput): Promise<LookupDoseLimitsOutput> {
    const limit = PHARMACOPOEIA_DOSE_LIMITS[input.herbName];
    const special = SPECIAL_PROCESSING[input.herbName];

    return {
      herbName: input.herbName,
      exists: !!limit,
      limits: limit ? { min: limit[0], max: limit[1] } : null,
      specialProcessing: special?.processing ?? null,
      notes: special?.notes ?? null,
    };
  }
}

const checkSpecialProcessingInputSchema = z.object({
  herbName: z.string(),
  processing: z.string(),
});

const checkSpecialProcessingOutputSchema = z.object({
  herbName: z.string(),
  processing: z.string(),
  isValid: z.boolean(),
  requiredProcessing: z.string().nullable(),
  warnings: z.array(z.string()),
});

type CheckSpecialProcessingInput = z.infer<typeof checkSpecialProcessingInputSchema>;
type CheckSpecialProcessingOutput = z.infer<typeof checkSpecialProcessingOutputSchema>;

export class SpecialProcessingTool extends BaseTool<CheckSpecialProcessingInput, CheckSpecialProcessingOutput> {
  definition = {
    name: "check_special_processing",
    description: "检查特殊煎法要求（先煎、后下、包煎等）",
    inputSchema: checkSpecialProcessingInputSchema,
    outputSchema: checkSpecialProcessingOutputSchema,
  };

  async execute(input: CheckSpecialProcessingInput): Promise<CheckSpecialProcessingOutput> {
    const special = SPECIAL_PROCESSING[input.herbName];
    const warnings: string[] = [];

    if (special?.processing && input.processing !== special.processing) {
      warnings.push(`${input.herbName}应${special.processing}，当前标注为${input.processing}`);
    }

    if (special?.notes) {
      warnings.push(special.notes);
    }

    return {
      herbName: input.herbName,
      processing: input.processing,
      isValid: warnings.length === 0,
      requiredProcessing: special?.processing ?? null,
      warnings,
    };
  }
}
