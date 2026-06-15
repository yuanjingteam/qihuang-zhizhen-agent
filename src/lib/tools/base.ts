import { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
}

export abstract class BaseTool<TInput, TOutput> {
  abstract definition: ToolDefinition;

  abstract execute(input: TInput): Promise<TOutput>;

  /**
   * Convert to MCP tool definition for MCP server exposure
   */
  toMCPToolDefinition() {
    return {
      name: this.definition.name,
      description: this.definition.description,
      inputSchema: zodToJsonSchema(this.definition.inputSchema),
    };
  }
}

function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  // Simplified Zod to JSON Schema conversion
  // In production, use zod-to-json-schema library
  return {
    type: "object",
    properties: {},
  };
}
