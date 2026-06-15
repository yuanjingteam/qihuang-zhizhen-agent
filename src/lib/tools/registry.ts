import { BaseTool, type ToolDefinition } from "./base";

export class ToolRegistry {
  private tools: Map<string, BaseTool<any, any>> = new Map();

  /**
   * Register a tool
   */
  register(tool: BaseTool<any, any>): void {
    this.tools.set(tool.definition.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name: string): BaseTool<any, any> | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools
   */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * Get all tools as MCP tool definitions
   */
  toMCPToolDefinitions() {
    return Array.from(this.tools.values()).map(t => t.toMCPToolDefinition());
  }
}
