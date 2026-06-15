import { z } from "zod";

/**
 * Agent Trace Entry — records every agent execution
 */
export const agentTraceEntrySchema = z.object({
  traceId: z.string(),
  spanId: z.string(),
  parentSpanId: z.string().nullable(),
  agentName: z.string(),
  nodeType: z.enum(["agent", "tool", "rag", "llm"]),
  input: z.unknown(),
  output: z.unknown(),
  toolCalls: z.array(z.object({
    toolName: z.string(),
    toolInput: z.unknown(),
    toolOutput: z.unknown(),
    durationMs: z.number(),
  })).optional(),
  ragRetrievals: z.array(z.object({
    layerId: z.number(),
    layerName: z.string(),
    query: z.string(),
    chunksFound: z.number(),
    topChunks: z.array(z.object({
      text: z.string(),
      score: z.number(),
      source: z.string(),
    })),
    durationMs: z.number(),
  })).optional(),
  llmCalls: z.array(z.object({
    model: z.string(),
    promptTokens: z.number(),
    completionTokens: z.number(),
    durationMs: z.number(),
  })).optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  durationMs: z.number(),
  status: z.enum(["success", "error", "skipped"]),
  error: z.string().optional(),
});

export type AgentTraceEntry = z.infer<typeof agentTraceEntrySchema>;

/**
 * Reasoning Chain Step
 */
export const reasoningChainStepSchema = z.object({
  agent: z.string(),
  input: z.unknown(),
  output: z.unknown(),
  durationMs: z.number(),
  toolCalls: z.array(z.object({
    toolName: z.string(),
    toolInput: z.unknown(),
    toolOutput: z.unknown(),
    durationMs: z.number(),
  })),
  ragRetrievals: z.array(z.object({
    layerId: z.number(),
    layerName: z.string(),
    query: z.string(),
    chunksFound: z.number(),
    durationMs: z.number(),
  })),
});

export type ReasoningChainStep = z.infer<typeof reasoningChainStepSchema>;

/**
 * TraceCollector — manages span stack and accumulates trace entries
 */
export class TraceCollector {
  private entries: AgentTraceEntry[] = [];
  private currentSpanStack: string[] = [];
  private traceId: string;

  constructor() {
    this.traceId = crypto.randomUUID();
  }

  startSpan(agentName: string, nodeType: AgentTraceEntry["nodeType"], input: unknown): string {
    const spanId = crypto.randomUUID();
    const parentSpanId = this.currentSpanStack.at(-1) ?? null;
    this.currentSpanStack.push(spanId);

    this.entries.push({
      traceId: this.traceId,
      spanId,
      parentSpanId,
      agentName,
      nodeType,
      input,
      output: null,
      startedAt: new Date().toISOString(),
      completedAt: "",
      durationMs: 0,
      status: "success",
    });

    return spanId;
  }

  endSpan(spanId: string, output: unknown, status: "success" | "error" = "success"): void {
    const entry = this.entries.find(e => e.spanId === spanId);
    if (!entry) return;

    entry.output = output;
    entry.completedAt = new Date().toISOString();
    entry.durationMs = new Date(entry.completedAt).getTime() - new Date(entry.startedAt).getTime();
    entry.status = status;

    this.currentSpanStack.pop();
  }

  addToolCall(spanId: string, call: NonNullable<AgentTraceEntry["toolCalls"]>[number]): void {
    const entry = this.entries.find(e => e.spanId === spanId);
    if (!entry) return;
    if (!entry.toolCalls) entry.toolCalls = [];
    entry.toolCalls.push(call);
  }

  addRAGRetrieval(spanId: string, retrieval: NonNullable<AgentTraceEntry["ragRetrievals"]>[number]): void {
    const entry = this.entries.find(e => e.spanId === spanId);
    if (!entry) return;
    if (!entry.ragRetrievals) entry.ragRetrievals = [];
    entry.ragRetrievals.push(retrieval);
  }

  addLLMCall(spanId: string, call: NonNullable<AgentTraceEntry["llmCalls"]>[number]): void {
    const entry = this.entries.find(e => e.spanId === spanId);
    if (!entry) return;
    if (!entry.llmCalls) entry.llmCalls = [];
    entry.llmCalls.push(call);
  }

  getEntries(): AgentTraceEntry[] {
    return this.entries;
  }

  getReasoningChain(): ReasoningChainStep[] {
    return this.entries
      .filter(e => e.nodeType === "agent")
      .map(e => ({
        agent: e.agentName,
        input: e.input,
        output: e.output,
        durationMs: e.durationMs,
        toolCalls: e.toolCalls ?? [],
        ragRetrievals: e.ragRetrievals?.map(r => ({
          layerId: r.layerId,
          layerName: r.layerName,
          query: r.query,
          chunksFound: r.chunksFound,
          durationMs: r.durationMs,
        })) ?? [],
      }));
  }
}
