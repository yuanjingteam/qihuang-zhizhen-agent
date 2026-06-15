import { z } from "zod";
import { BaseTool, type ToolDefinition } from "./base";

const tongueInputSchema = z.object({
  imageBase64: z.string(),
  userId: z.string().optional(),
});

const tongueOutputSchema = z.object({
  tongueColor: z.string(),
  coatingType: z.string(),
  coatingColor: z.string(),
  tongueShape: z.string(),
  confidence: z.number(),
});

type TongueInput = z.infer<typeof tongueInputSchema>;
type TongueOutput = z.infer<typeof tongueOutputSchema>;

export class TongueAnalysisTool extends BaseTool<TongueInput, TongueOutput> {
  definition: ToolDefinition = {
    name: "analyze_tongue",
    description: "分析舌象图片，提取舌色、苔质、舌形特征",
    inputSchema: tongueInputSchema,
    outputSchema: tongueOutputSchema,
  };

  async execute(input: TongueInput): Promise<TongueOutput> {
    // TODO: 接入舌诊模型 API 或本地推理
    throw new Error("Not implemented — reserved for MCP integration");
  }
}
