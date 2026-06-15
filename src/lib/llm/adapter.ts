import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import type { AppConfig } from "../config";
import { z } from "zod";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class LLMAdapter {
  private model: ChatOpenAI;
  public modelName: string;

  constructor(private config: AppConfig) {
    this.modelName = config.llm.modelName;
    this.model = new ChatOpenAI({
      openAIApiKey: "ollama",  // Ollama doesn't need a real key
      modelName: config.llm.modelName,
      temperature: config.llm.temperature,
      maxTokens: config.llm.maxTokens,
      configuration: {
        baseURL: config.llm.baseUrl,
      },
    });
  }

  /**
   * Convert ChatMessage[] to LangChain BaseMessage[]
   */
  private toLangChainMessages(messages: ChatMessage[]) {
    return messages.map(m => {
      if (m.role === "system") return new SystemMessage(m.content);
      if (m.role === "user") return new HumanMessage(m.content);
      return new AIMessage(m.content);
    });
  }

  /**
   * Single-turn chat completion
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await this.model.invoke(this.toLangChainMessages(messages));
    return response.content as string;
  }

  /**
   * Streaming chat completion for SSE
   */
  async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
    const stream = await this.model.stream(this.toLangChainMessages(messages));

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  }

  /**
   * Chat with Zod schema enforcement — validates LLM JSON output
   */
  async structuredChat<T>(
    messages: ChatMessage[],
    schema: z.ZodType<T>
  ): Promise<T> {
    const response = await this.chat(messages);
    try {
      const parsed: unknown = JSON.parse(response);
      return schema.parse(parsed);
    } catch (e) {
      if (e instanceof z.ZodError) {
        throw new Error(`LLM response failed schema validation: ${e.message}\nRaw: ${response}`);
      }
      throw new Error(`Failed to parse LLM response as JSON: ${response}`);
    }
  }
}
