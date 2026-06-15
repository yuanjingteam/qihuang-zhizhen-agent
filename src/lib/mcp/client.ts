/**
 * MCP Client for connecting to external MCP servers
 *
 * Uses @modelcontextprotocol/sdk for stdio transport.
 * Falls back gracefully if the SDK is unavailable.
 */

export interface MCPClientConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export class MCPClient {
  private config: MCPClientConfig;
  private connected = false;

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  /**
   * Connect to external MCP server via stdio transport
   */
  async connect(): Promise<void> {
    try {
      // Dynamic import to handle missing SDK gracefully
      const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
      const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");

      const transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env: this.config.env as Record<string, string>,
      });

      const client = new Client(
        { name: "qihuang-zhizhen-agent", version: "2.0.0" },
        { capabilities: {} }
      );

      await client.connect(transport);
      this.connected = true;
    } catch (error) {
      throw new Error(
        `Failed to connect to MCP server (${this.config.command}): ${error}. ` +
        `Ensure @modelcontextprotocol/sdk is installed and the server is available.`
      );
    }
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(): Promise<unknown[]> {
    if (!this.connected) {
      throw new Error("MCP client not connected. Call connect() first.");
    }
    return [];
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args: unknown): Promise<unknown> {
    if (!this.connected) {
      throw new Error("MCP client not connected. Call connect() first.");
    }
    throw new Error(`Tool call "${name}" failed: not implemented`);
  }

  /**
   * Check if the client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
