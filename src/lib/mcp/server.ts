import type { BaseTool } from "../tools/base";
import type { ToolDefinition } from "../tools/base";

/**
 * MCP Server — creates a minimal in-process tool server
 *
 * In production, replace with @modelcontextprotocol/sdk Server
 * that exposes tools via stdio or SSE transport.
 * This implementation registers tools for in-process use.
 */

export interface MCPServerInstance {
  name: string;
  version: string;
  tools: ToolDefinition[];
  callTool(name: string, args: unknown): Promise<unknown>;
}

export function createMCPServer(
  name: string,
  version: string,
  tools: BaseTool<any, any>[]
): MCPServerInstance {
  const toolMap = new Map<string, BaseTool<any, any>>();
  for (const tool of tools) {
    toolMap.set(tool.definition.name, tool);
  }

  return {
    name,
    version,
    tools: tools.map(t => t.definition),

    async callTool(toolName: string, args: unknown): Promise<unknown> {
      const tool = toolMap.get(toolName);
      if (!tool) {
        throw new Error(`Tool not found: ${toolName}`);
      }
      return tool.execute(args);
    },
  };
}
