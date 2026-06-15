import type { LLMAdapter } from "../llm/adapter";
import type { GraphStateType } from "../graph/state";
import type { TraceCollector } from "../graph/trace";
import type { ToolRegistry } from "../tools/registry";

/**
 * No-op trace collector for when tracing is not needed
 */
const noopTrace = {
  startSpan: () => "noop",
  endSpan: () => {},
  addToolCall: () => {},
  addRAGRetrieval: () => {},
  addLLMCall: () => {},
  getEntries: () => [],
  getReasoningChain: () => [],
};

export abstract class BaseAgent {
  constructor(
    protected llm: LLMAdapter,
    protected tools?: ToolRegistry,
  ) {}

  /**
   * Execute agent logic
   */
  abstract execute(state: GraphStateType): Promise<Partial<GraphStateType>>;

  /**
   * Wrapper that auto-traces agent execution
   */
  async run(state: GraphStateType, trace: TraceCollector): Promise<Partial<GraphStateType>> {
    const spanId = trace.startSpan(this.constructor.name, "agent", state);

    try {
      const result = await this.execute(state);
      trace.endSpan(spanId, result, "success");
      return result;
    } catch (error) {
      trace.endSpan(spanId, { error: String(error) }, "error");
      throw error;
    }
  }

  /**
   * Helper: call LLM with optional auto-tracing
   */
  protected async callLLM(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    trace?: TraceCollector | unknown,
    spanId?: string
  ): Promise<string> {
    // Check if trace is a valid TraceCollector (not an empty object)
    const isValidTrace = trace && typeof (trace as TraceCollector).startSpan === "function";
    const traceCollector = isValidTrace ? (trace as TraceCollector) : noopTrace;

    const llmSpanId = traceCollector.startSpan(`${this.constructor.name}.llm`, "llm", messages);
    const result = await this.llm.chat(messages);
    traceCollector.endSpan(llmSpanId, result);

    if (isValidTrace && spanId) {
      (traceCollector as TraceCollector).addLLMCall(spanId, {
        model: this.llm.modelName,
        promptTokens: 0,
        completionTokens: 0,
        durationMs: 0,
      });
    }

    return result;
  }

  /**
   * Helper: call Tool with optional auto-tracing
   */
  protected async callTool(
    toolName: string,
    input: unknown,
    trace?: TraceCollector | unknown,
    spanId?: string
  ): Promise<unknown> {
    const tool = this.tools?.get(toolName);
    if (!tool) throw new Error(`Tool not found: ${toolName}`);

    const isValidTrace = trace && typeof (trace as TraceCollector).startSpan === "function";
    const traceCollector = isValidTrace ? (trace as TraceCollector) : noopTrace;

    const toolSpanId = traceCollector.startSpan(`${this.constructor.name}.tool.${toolName}`, "tool", input);
    const result = await tool.execute(input as any);
    traceCollector.endSpan(toolSpanId, result);

    if (isValidTrace && spanId) {
      (traceCollector as TraceCollector).addToolCall(spanId, {
        toolName,
        toolInput: input,
        toolOutput: result,
        durationMs: 0,
      });
    }

    return result;
  }

  /**
   * Helper: call RAG with optional auto-tracing
   */
  protected async callRAG(
    query: string,
    ragEngine: { query: Function },
    trace?: TraceCollector,
    spanId?: string
  ): Promise<unknown[]> {
    const traceCollector = trace || noopTrace;
    const ragSpanId = traceCollector.startSpan(`${this.constructor.name}.rag`, "rag", query);
    const results = await ragEngine.query(query, {});
    traceCollector.endSpan(ragSpanId, results);

    if (trace && spanId) {
      traceCollector.addRAGRetrieval(spanId, {
        layerId: 0,
        layerName: "all",
        query,
        chunksFound: Array.isArray(results) ? results.length : 0,
        topChunks: [],
        durationMs: 0,
      });
    }

    return results as unknown[];
  }
}
