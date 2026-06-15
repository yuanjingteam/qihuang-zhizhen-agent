import { z } from "zod";
import { BaseTool, type ToolDefinition } from "./base";

const herbQuerySchema = z.object({
  herbName: z.string(),
  query: z.string().optional(),
});

const herbInfoSchema = z.object({
  name: z.string(),
  pinyin: z.string(),
  nature: z.string(),
  flavor: z.string(),
  meridians: z.array(z.string()),
  effects: z.array(z.string()),
  indications: z.array(z.string()),
  dosage: z.object({ min: z.number(), max: z.number() }),
  contraindications: z.array(z.string()),
});

type HerbQuery = z.infer<typeof herbQuerySchema>;
type HerbInfo = z.infer<typeof herbInfoSchema>;

export class HerbKnowledgeTool extends BaseTool<HerbQuery, HerbInfo> {
  definition: ToolDefinition = {
    name: "search_herb",
    description: "查询中药性味归经、功效主治、用法用量",
    inputSchema: herbQuerySchema,
    outputSchema: herbInfoSchema,
  };

  async execute(input: HerbQuery): Promise<HerbInfo> {
    // TODO: 接入中药知识库 MCP server
    throw new Error("Not implemented — reserved for MCP integration");
  }
}
