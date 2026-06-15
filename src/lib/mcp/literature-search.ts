import { z } from "zod";
import { BaseTool } from "../tools/base";

/**
 * 文献检索 MCP Server
 *
 * Reserved for future MCP integration.
 * Provides literature search tools.
 */

const searchPapersInputSchema = z.object({
  query: z.string(),
  maxResults: z.number().default(10),
  filters: z.object({
    dateRange: z.object({
      start: z.string().optional(),
      end: z.string().optional(),
    }).optional(),
    journal: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

const searchPapersOutputSchema = z.object({
  results: z.array(z.object({
    title: z.string(),
    authors: z.array(z.string()),
    journal: z.string(),
    year: z.number(),
    abstract: z.string(),
    doi: z.string().optional(),
    keywords: z.array(z.string()),
    relevanceScore: z.number(),
  })),
  totalCount: z.number(),
  query: z.string(),
});

type SearchPapersInput = z.infer<typeof searchPapersInputSchema>;
type SearchPapersOutput = z.infer<typeof searchPapersOutputSchema>;

export class PaperSearchTool extends BaseTool<SearchPapersInput, SearchPapersOutput> {
  definition = {
    name: "search_papers",
    description: "检索中医学术论文",
    inputSchema: searchPapersInputSchema,
    outputSchema: searchPapersOutputSchema,
  };

  async execute(input: SearchPapersInput): Promise<SearchPapersOutput> {
    // TODO: 接入文献检索 MCP server
    throw new Error("Not implemented — reserved for MCP integration");
  }
}

const searchClassicalTextsInputSchema = z.object({
  query: z.string(),
  source: z.enum(["黄帝内经", "伤寒论", "金匮要略", "温病条辨", "全部"]).default("全部"),
  maxResults: z.number().default(10),
});

const searchClassicalTextsOutputSchema = z.object({
  results: z.array(z.object({
    source: z.string(),
    chapter: z.string(),
    text: z.string(),
    modernInterpretation: z.string().optional(),
    relevanceScore: z.number(),
  })),
  totalCount: z.number(),
  query: z.string(),
});

type SearchClassicalTextsInput = z.infer<typeof searchClassicalTextsInputSchema>;
type SearchClassicalTextsOutput = z.infer<typeof searchClassicalTextsOutputSchema>;

export class ClassicalTextSearchTool extends BaseTool<SearchClassicalTextsInput, SearchClassicalTextsOutput> {
  definition = {
    name: "search_classical_texts",
    description: "检索中医经典原文",
    inputSchema: searchClassicalTextsInputSchema,
    outputSchema: searchClassicalTextsOutputSchema,
  };

  async execute(input: SearchClassicalTextsInput): Promise<SearchClassicalTextsOutput> {
    // TODO: Implement classical text search
    throw new Error("Not implemented — reserved for MCP integration");
  }
}
