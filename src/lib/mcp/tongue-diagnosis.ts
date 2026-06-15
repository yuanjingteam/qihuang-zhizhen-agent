import { z } from "zod";
import { BaseTool } from "../tools/base";

/**
 * 舌诊 MCP Server
 *
 * Reserved for future MCP integration.
 * Provides tongue diagnosis analysis tools.
 */

const analyzeTongueInputSchema = z.object({
  imageBase64: z.string(),
  userId: z.string().optional(),
});

const analyzeTongueOutputSchema = z.object({
  tongueColor: z.string(),
  coatingType: z.string(),
  coatingColor: z.string(),
  tongueShape: z.string(),
  confidence: z.number(),
  features: z.object({
    hasTeethMarks: z.boolean(),
    hasCracks: z.boolean(),
    isSwollen: z.boolean(),
    isPale: z.boolean(),
    isRed: z.boolean(),
    isPurple: z.boolean(),
  }),
});

type AnalyzeTongueInput = z.infer<typeof analyzeTongueInputSchema>;
type AnalyzeTongueOutput = z.infer<typeof analyzeTongueOutputSchema>;

export class TongueDiagnosisTool extends BaseTool<AnalyzeTongueInput, AnalyzeTongueOutput> {
  definition = {
    name: "analyze_tongue_image",
    description: "分析舌象图片，提取舌色、苔质、舌形特征",
    inputSchema: analyzeTongueInputSchema,
    outputSchema: analyzeTongueOutputSchema,
  };

  async execute(input: AnalyzeTongueInput): Promise<AnalyzeTongueOutput> {
    // TODO: 接入舌诊模型 API 或本地推理
    throw new Error("Not implemented — reserved for MCP integration");
  }
}

const getTongueFeaturesInputSchema = z.object({
  tongueColor: z.string(),
  coatingType: z.string(),
  coatingColor: z.string(),
  tongueShape: z.string(),
});

const getTongueFeaturesOutputSchema = z.object({
  syndromeHints: z.array(z.object({
    syndrome: z.string(),
    confidence: z.number(),
    explanation: z.string(),
  })),
  tcmInterpretation: z.string(),
});

type GetTongueFeaturesInput = z.infer<typeof getTongueFeaturesInputSchema>;
type GetTongueFeaturesOutput = z.infer<typeof getTongueFeaturesOutputSchema>;

export class TongueFeaturesTool extends BaseTool<GetTongueFeaturesInput, GetTongueFeaturesOutput> {
  definition = {
    name: "get_tongue_features",
    description: "根据舌象特征推断可能的证型",
    inputSchema: getTongueFeaturesInputSchema,
    outputSchema: getTongueFeaturesOutputSchema,
  };

  async execute(input: GetTongueFeaturesInput): Promise<GetTongueFeaturesOutput> {
    // TODO: Implement tongue feature interpretation
    throw new Error("Not implemented — reserved for MCP integration");
  }
}
